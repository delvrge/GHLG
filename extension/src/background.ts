/**
 * GHLG extension background (MV3 service worker).
 *
 * Connects to the GHLG native app via the browser Native Messaging API —
 * stdio-based, OS-gated to this registered extension. There is NO HTTP,
 * NO fetch to any port, NO network communication anywhere in this extension.
 *
 * The native host itself isn't registered yet (that's step 8), so
 * connectNative() below will fail with "Specified native messaging host not
 * found" until then. That's expected — this module only needs to behave
 * correctly once the host exists, and fail quietly until it does.
 */
import { NATIVE_HOST_NAME, type CaptureRequest, type NativeCaptureMessage } from "./protocol.js";

let port: chrome.runtime.Port | null = null;

function getPort(): chrome.runtime.Port {
  if (port) return port;
  port = chrome.runtime.connectNative(NATIVE_HOST_NAME);
  port.onDisconnect.addListener(() => {
    if (chrome.runtime.lastError) {
      console.log("[GHLG] native host disconnected:", chrome.runtime.lastError.message);
    }
    port = null;
  });
  port.onMessage.addListener((msg) => {
    console.log("[GHLG] native host message:", msg);
  });
  return port;
}

function sendCapture(request: CaptureRequest, screenshot?: string): void {
  const message: NativeCaptureMessage = {
    type: "manual_capture",
    note: request.note,
    source: "extension",
    screenshot,
  };
  try {
    getPort().postMessage(message);
  } catch (err) {
    console.log("[GHLG] failed to reach native host:", err);
  }
}

chrome.runtime.onMessage.addListener((request: CaptureRequest, sender, sendResponse) => {
  if (request.kind === "capture") {
    // Error captures include a snapshot of the page at the moment of the
    // error. captureVisibleTab shoots the ACTIVE tab of the window, so only
    // attempt it when the erroring tab is the one on screen — a screenshot
    // of some unrelated foreground tab would be worse than none. Allowed
    // without a user gesture because the manifest holds explicit host
    // permissions for localhost, the only place this extension runs.
    if (request.trigger === "console-error" && sender.tab?.active) {
      chrome.tabs.captureVisibleTab(
        sender.tab.windowId,
        { format: "jpeg", quality: 60 },
        (dataUrl) => {
          if (chrome.runtime.lastError || !dataUrl) {
            console.log(
              "[GHLG] screenshot skipped:",
              chrome.runtime.lastError?.message ?? "no image",
            );
            sendCapture(request);
          } else {
            sendCapture(request, dataUrl);
          }
        },
      );
    } else {
      sendCapture(request);
    }
    sendResponse({ ok: true });
  }
  return false;
});
