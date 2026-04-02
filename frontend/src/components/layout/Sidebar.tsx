import { AgentList } from '../agents/AgentList';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-semibold text-slate-100">
          OpenClaw Editor
        </h1>
        <p className="text-xs text-slate-400 mt-1">Agent Workspace Manager</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AgentList />
      </div>

      <div className="p-4 border-t border-slate-800">
        <ThemeToggle />
      </div>
    </aside>
  );
}
