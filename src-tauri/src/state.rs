//! Shared app state: watch status, the watched folders, last capture.
//!
//! Ghostlog watches one or more project folders (each the root of a git
//! repository). The paths are held here and every watcher/capture operation
//! validates against them — path scoping is enforced in Rust, never trusted
//! to the UI.

use notify::RecommendedWatcher;
use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum WatchState {
    Idle,
    Watching,
}

#[derive(Clone, Serialize)]
pub struct LastEvent {
    /// ISO 8601 timestamp.
    pub timestamp: String,
    /// e.g. "file-change", "manual", "git-commit".
    pub kind: String,
    /// Human-readable one-liner shown in the review window home view.
    pub detail: String,
    /// Which watched project the event belongs to.
    pub project: String,
}

#[derive(Default)]
pub struct AppState {
    pub watch_state: Mutex<WatchStateHolder>,
    pub watched_paths: Mutex<Vec<PathBuf>>,
    pub last_event: Mutex<Option<LastEvent>>,
    /// Per-project (date, session-id) currently written into.
    /// Created when watching starts or on first capture.
    pub current_sessions: Mutex<HashMap<String, (String, String)>>,
}

pub struct WatchStateHolder {
    pub state: WatchState,
    /// One watcher per watched folder; dropping them stops watching.
    pub watchers: Vec<RecommendedWatcher>,
}

impl Default for WatchStateHolder {
    fn default() -> Self {
        Self { state: WatchState::Idle, watchers: Vec::new() }
    }
}
