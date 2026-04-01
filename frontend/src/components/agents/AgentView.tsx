import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAppStore } from '../../store/appStore';
import { FileTabsView } from '../editor/FileTabsView';

export function AgentView() {
  const { agentId } = useParams<{ agentId: string }>();
  const setCurrentAgent = useAppStore((state) => state.setCurrentAgent);
  const setCurrentFile = useAppStore((state) => state.setCurrentFile);

  useEffect(() => {
    if (agentId) {
      setCurrentAgent(agentId);
      // Set default file to SOUL.md
      setCurrentFile('SOUL.md');
    }
  }, [agentId, setCurrentAgent, setCurrentFile]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => apiClient.getAgent(agentId!),
    enabled: !!agentId,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Loading agent...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-400">
          <p className="font-semibold mb-1">Error loading agent</p>
          <p className="text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { agent, files } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Agent Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <h2 className="text-xl font-semibold text-slate-100">
          {agent.name || agent.id}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {agent.workspacePath}
        </p>
      </div>

      {/* File Tabs and Editor */}
      <FileTabsView agentId={agent.id} files={files} />
    </div>
  );
}
