/**
 * GHLG review window — shell + view routing (plain React state, no router
 * dependency). Onboarding shows when no folder is configured yet. Multiple
 * projects can be watched at once; the sidebar switcher picks which one the
 * archive screens are scoped to.
 */
import { useEffect, useState } from "react";
import Onboarding from "./screens/Onboarding";
import Home from "./screens/Home";
import Archive from "./screens/Archive";
import SessionDetail from "./screens/SessionDetail";
import Curate from "./screens/Curate";
import Compile from "./screens/Compile";
import Settings from "./screens/Settings";
import { getWatchedFolders, type WatchedProject } from "./lib/watcher";
import { setActiveProject } from "./lib/session";

type View =
  | { name: "home" }
  | { name: "archive" }
  | { name: "session"; date: string; sessionId: string }
  | { name: "curate"; date: string; sessionId: string }
  | { name: "compile"; date: string; sessionId: string }
  | { name: "settings" };

export default function App() {
  const [folders, setFolders] = useState<WatchedProject[] | undefined>(undefined);
  const [project, setProject] = useState<string>("");
  const [view, setView] = useState<View>({ name: "home" });

  async function refresh() {
    const list = await getWatchedFolders();
    setFolders(list);
    // Keep the selection if it still exists, else fall back to the first.
    setProject((prev) => {
      const next = list.some((f) => f.name === prev) ? prev : (list[0]?.name ?? "");
      setActiveProject(next);
      return next;
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  function switchProject(name: string) {
    setProject(name);
    setActiveProject(name);
    // Archive-family views hold data from the old project; go home.
    if (view.name !== "home" && view.name !== "settings") setView({ name: "archive" });
  }

  if (folders === undefined) return <main className="min-h-screen bg-ink" />;

  if (folders.length === 0) {
    return <Onboarding onDone={refresh} />;
  }

  const nav = [
    { key: "home", label: "Home" },
    { key: "archive", label: "Archive" },
    { key: "settings", label: "Settings" },
  ] as const;
  const activeKey =
    view.name === "home" ? "home" : view.name === "settings" ? "settings" : "archive";

  return (
    <div className="min-h-screen bg-ink text-fg font-sans flex">
      <nav className="w-44 shrink-0 bg-accent p-4 flex flex-col gap-1">
        <p className="font-semibold text-xl tracking-tight px-3 pb-3 text-white">
          Ghostlog<span className="text-black/60">.</span>
        </p>
        {nav.map((n) => (
          <button
            key={n.key}
            onClick={() => setView({ name: n.key } as View)}
            className={`text-left text-sm px-3 py-2 rounded-md transition-colors ${
              activeKey === n.key
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {n.label}
          </button>
        ))}

        {folders.length > 1 && (
          <div className="mt-4 px-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wide text-white/50">Project</p>
            <select
              value={project}
              onChange={(e) => switchProject(e.target.value)}
              className="w-full bg-black/25 text-white text-sm rounded-md px-2 py-1.5 border border-white/20 focus:outline-none"
            >
              {folders.map((f) => (
                <option key={f.name} value={f.name} className="bg-ink text-fg">
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </nav>

      <main className="flex-1 p-6 overflow-y-auto">
        {view.name === "home" && (
          <Home
            folders={folders}
            selectedProject={project}
            onSelectProject={switchProject}
            onOpenSettings={() => setView({ name: "settings" })}
          />
        )}
        {view.name === "archive" && (
          <Archive
            key={project}
            onOpenSession={(date, sessionId) => setView({ name: "session", date, sessionId })}
          />
        )}
        {view.name === "session" && (
          <SessionDetail
            date={view.date}
            sessionId={view.sessionId}
            onBack={() => setView({ name: "archive" })}
            onCurate={() => setView({ name: "curate", date: view.date, sessionId: view.sessionId })}
            onCompile={() =>
              setView({ name: "compile", date: view.date, sessionId: view.sessionId })
            }
          />
        )}
        {view.name === "curate" && (
          <Curate
            date={view.date}
            sessionId={view.sessionId}
            onDone={() => setView({ name: "session", date: view.date, sessionId: view.sessionId })}
          />
        )}
        {view.name === "compile" && (
          <Compile
            date={view.date}
            sessionId={view.sessionId}
            onBack={() => setView({ name: "session", date: view.date, sessionId: view.sessionId })}
          />
        )}
        {view.name === "settings" && <Settings folders={folders} onFoldersChanged={refresh} />}
      </main>
    </div>
  );
}
