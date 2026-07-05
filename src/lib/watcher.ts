/**
 * watcher.ts — frontend bridge to the Rust file/git watcher.
 *
 * The watcher itself runs in the Tauri backend (src-tauri) and is scoped to
 * the user-selected project folders — enforced in Rust, not here.
 * Implemented in delivery step 2.
 */
import { invoke } from "@tauri-apps/api/core";

export type WatchState = "idle" | "watching";

export async function startWatching(): Promise<void> {
  await invoke("start_watching");
}

export async function stopWatching(): Promise<void> {
  await invoke("stop_watching");
}

export async function getWatchState(): Promise<WatchState> {
  return invoke("get_watch_state");
}

/** Manual "Log this now" trigger — captures recent git diff/log as an entry. */
export async function triggerManualCapture(project: string, note?: string): Promise<void> {
  await invoke("manual_capture", { project, note: note ?? null });
}

export interface WatchedProject {
  name: string;
  path: string;
}

export async function getWatchedFolders(): Promise<WatchedProject[]> {
  return invoke("get_watched_folders");
}

export async function addWatchedFolder(path: string): Promise<void> {
  await invoke("add_watched_folder", { path });
}

export async function removeWatchedFolder(path: string): Promise<void> {
  await invoke("remove_watched_folder", { path });
}
