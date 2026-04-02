import { NavLink } from 'react-router-dom';
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AgentList />

        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Tools
          </div>
          <div className="space-y-1">
            <NavLink
              to="/skills"
              className={({ isActive }) =>
                `flex items-center gap-2 w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <span>🧩</span> Skills &amp; Plugins
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `flex items-center gap-2 w-full text-left px-3 py-2 rounded transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <span>💬</span> Chat
            </NavLink>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <ThemeToggle />
      </div>
    </aside>
  );
}
