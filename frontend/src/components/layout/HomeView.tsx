export function HomeView() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-4">
          Welcome to OpenClaw Editor
        </h2>
        <p className="text-slate-400 mb-6">
          Select an agent from the sidebar to begin editing workspace markdown files.
        </p>
        <div className="bg-slate-900 rounded-lg p-6 text-left">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">
            Available Files
          </h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• SOUL.md - Agent's core personality</li>
            <li>• IDENTITY.md - Agent identity details</li>
            <li>• AGENTS.md - Agent interactions</li>
            <li>• USER.md - User information</li>
            <li>• TOOLS.md - Available tools</li>
            <li>• HEARTBEAT.md - Status updates</li>
            <li>• BOOTSTRAP.md - Initialization</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
