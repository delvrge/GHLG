//! File/git watcher, scoped strictly to the user-selected project folders.
//!
//! Pure filesystem access — no network anywhere. One notify watcher per
//! watched folder; file events update `last_event` and are emitted to the
//! frontend.

use crate::state::{AppState, LastEvent, WatchState};
use notify::{RecursiveMode, Watcher};
use std::path::Path;
use tauri::{AppHandle, Emitter, Manager};

/// Directories inside a watched folder we never react to.
const IGNORED: &[&str] = &["node_modules", "target", ".git/objects", "dist", ".next"];

fn is_ignored(path: &Path) -> bool {
    let s = path.to_string_lossy();
    IGNORED.iter().any(|seg| s.contains(seg))
}

pub fn record_event(app: &AppHandle, kind: &str, detail: String, project: &str) {
    let state = app.state::<AppState>();
    let event = LastEvent {
        timestamp: chrono::Local::now().to_rfc3339(),
        kind: kind.to_string(),
        detail,
        project: project.to_string(),
    };
    *state.last_event.lock().unwrap() = Some(event.clone());
    // Review window (if open) updates live; ignore failure when no window.
    let _ = app.emit("ghlg://capture", &event);
}

/// Start watching every configured folder. Fails if none are set —
/// there is deliberately no way to watch an arbitrary path.
pub fn start(app: &AppHandle) -> Result<(), String> {
    let state = app.state::<AppState>();

    let roots: Vec<_> = state
        .watched_paths
        .lock()
        .unwrap()
        .iter()
        .filter(|p| p.is_dir())
        .cloned()
        .collect();
    if roots.is_empty() {
        return Err("No watched folder configured. Complete onboarding first.".into());
    }

    let mut holder = state.watch_state.lock().unwrap();
    if holder.state == WatchState::Watching {
        return Ok(());
    }

    let mut watchers = Vec::with_capacity(roots.len());
    for root in &roots {
        let app_for_events = app.clone();
        let scope_root = root.clone();
        let project = crate::storage::project_name(root)?;
        let project_for_events = project.clone();
        let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
            if let Ok(event) = res {
                // Defense in depth: drop anything outside the watched root even
                // though the watcher is only registered on that root.
                let relevant: Vec<_> = event
                    .paths
                    .iter()
                    .filter(|p| p.starts_with(&scope_root) && !is_ignored(p))
                    .collect();
                if let Some(path) = relevant.first() {
                    let rel = path.strip_prefix(&scope_root).unwrap_or(path);
                    record_event(
                        &app_for_events,
                        "file-change",
                        format!("changed: {}", rel.display()),
                        &project_for_events,
                    );
                }
            }
        })
        .map_err(|e| e.to_string())?;

        watcher
            .watch(root, RecursiveMode::Recursive)
            .map_err(|e| e.to_string())?;
        watchers.push(watcher);

        // Each watch period gets its own session folder per project.
        let session = crate::storage::create_session(&project)?;
        state.current_sessions.lock().unwrap().insert(project, session);
    }

    holder.state = WatchState::Watching;
    holder.watchers = watchers;
    drop(holder);

    crate::tray::sync(app);
    Ok(())
}

pub fn stop(app: &AppHandle) {
    let state = app.state::<AppState>();
    let mut holder = state.watch_state.lock().unwrap();
    holder.watchers.clear(); // dropping stops the watchers
    holder.state = WatchState::Idle;
    drop(holder);
    crate::tray::sync(app);
}

/// Restart watching (used after the folder list changes while watching).
pub fn restart(app: &AppHandle) -> Result<(), String> {
    stop(app);
    start(app)
}
