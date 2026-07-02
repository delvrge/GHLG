/**
 * GHLG review window — root component.
 * Screens (home, archive, curation, compile, settings) mount here as they land.
 */
function App() {
  return (
    <main className="min-h-screen bg-ink text-fg font-sans flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          GHLG<span className="text-accent">.</span>
        </h1>
        <p className="text-fg-muted font-mono text-sm">
          scaffold ready — screens land in delivery steps 4–6
        </p>
      </div>
    </main>
  );
}

export default App;
