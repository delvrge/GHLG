/**
 * Home view: watched folder, watch toggle, last captured event, and the
 * core manual-capture action ("Log this now").
 */
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  startWatching,
  stopWatching,
  getWatchState,
  triggerManualCapture,
  type WatchState,
} from "../lib/watcher";
import { invoke } from "@tauri-apps/api/core";

interface LastEvent {
  timestamp: string;
  kind: string;
  detail: string;
}

export default function Home({
  watchedFolder,
  onChangeFolder,
}: {
  watchedFolder: string;
  onChangeFolder: () => void;
}) {
  const [watchState, setWatchState] = useState<WatchState>("idle");
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    getWatchState().then(setWatchState);
    invoke<LastEvent | null>("get_last_event").then(setLastEvent);
    const unlisten = listen<LastEvent>("ghlg://capture", (e) => setLastEvent(e.payload));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function toggleWatching() {
    setError(null);
    try {
      if (watchState === "watching") {
        await stopWatching();
        setWatchState("idle");
      } else {
        await startWatching();
        setWatchState("watching");
      }
    } catch (e) {
      setError(String(e));
    }
  }

  async function logNow() {
    setError(null);
    try {
      await triggerManualCapture(note.trim() || undefined);
      setNote("");
      setCaptured(true);
      setTimeout(() => setCaptured(false), 2000);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="space-y-6">
      <section className="bg-panel border border-edge rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-fg-faint uppercase tracking-wide mb-1">Watching</p>
            <p className="font-mono text-sm break-all">{watchedFolder}</p>
          </div>
          <button
            onClick={onChangeFolder}
            className="shrink-0 text-xs text-fg-muted hover:text-fg border border-edge-strong hover:border-fg-muted px-3 py-1.5 rounded-md transition-colors"
          >
            Change
          </button>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={toggleWatching}
            className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
              watchState === "watching"
                ? "border border-accent text-accent hover:bg-accent/10"
                : "bg-accent hover:bg-accent-dim text-white"
            }`}
          >
            {watchState === "watching" ? "Stop watching" : "Start watching"}
          </button>
          <span className="flex items-center gap-2 text-sm text-fg-muted">
            <span
              className={`h-2 w-2 rounded-full ${
                watchState === "watching" ? "bg-accent" : "bg-fg-faint"
              }`}
            />
            {watchState === "watching" ? "capturing" : "idle"}
          </span>
        </div>
      </section>

      <section className="bg-panel border border-edge rounded-lg p-5 space-y-3">
        <p className="text-xs text-fg-faint uppercase tracking-wide">Log this now</p>
        <div className="flex gap-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && logNow()}
            placeholder="optional hint for the model (not required — the diff does the work)"
            className="flex-1 bg-ink border border-edge rounded-md px-3 py-2 text-sm font-mono placeholder:text-fg-faint focus:outline-none focus:border-accent"
          />
          <button
            onClick={logNow}
            className="bg-accent hover:bg-accent-dim text-white text-sm font-medium px-5 py-2 rounded-md transition-colors"
          >
            {captured ? "Captured" : "Log now"}
          </button>
        </div>
        <p className="text-xs text-fg-faint">
          Reads your uncommitted changes and reconstructs the problem, the fix, and the reasoning — your note is
          just a nudge, not the documentation.
        </p>
      </section>

      <section className="bg-panel border border-edge rounded-lg p-5">
        <p className="text-xs text-fg-faint uppercase tracking-wide mb-2">Last captured event</p>
        {lastEvent ? (
          <div className="flex items-baseline gap-3 text-sm">
            <span className="font-mono text-fg-faint">
              {new Date(lastEvent.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-fg-muted font-mono">{lastEvent.kind}</span>
            <span className="truncate">{lastEvent.detail}</span>
          </div>
        ) : (
          <p className="text-sm text-fg-faint">Nothing captured yet this run.</p>
        )}
      </section>

      {error && <p className="text-sm text-accent font-mono">{error}</p>}
    </div>
  );
}
