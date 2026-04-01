import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useAppStore } from '../../store/appStore';

export function AgentList() {
  const navigate = useNavigate();
  const currentAgentId = useAppStore((state) => state.currentAgentId);
  const setCurrentAgent = useAppStore((state) => state.setCurrentAgent);

  const { data, isLoading, error } = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiClient.getAgents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleAgentClick = (agentId: string) => {
    setCurrentAgent(agentId);
    navigate(`/agent/${agentId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Agents
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-slate-800 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-400">
        <p className="font-semibold mb-1">Error loading agents</p>
        <p className="text-xs">{(error as Error).message}</p>
      </div>
    );
  }

  const agents = data?.agents || [];

  return (
    <div>
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Agents
      </div>

      <div className="space-y-2">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleAgentClick(agent.id)}
            className={`
              w-full text-left px-3 py-2 rounded transition-colors
              ${
                currentAgentId === agent.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
              }
            `}
          >
            <div className="font-medium text-sm">{agent.name || agent.id}</div>
            <div className="text-xs opacity-75 truncate mt-0.5">
              {agent.id}
            </div>
          </button>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-sm text-slate-400 italic">
          No agents found in openclaw.json
        </div>
      )}
    </div>
  );
}
