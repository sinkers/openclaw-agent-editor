import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAppStore } from '../../store/appStore';
import { FileTabsView } from '../editor/FileTabsView';
import { SkillsView } from '../skills/SkillsView';
import { ChatPanel } from '../chat/ChatPanel';

type AgentTab = 'files' | 'skills' | 'chat';

export function AgentView() {
  const { agentId } = useParams<{ agentId: string }>();
  const setCurrentAgent = useAppStore((state) => state.setCurrentAgent);
  const setCurrentFile = useAppStore((state) => state.setCurrentFile);
  const [activeTab, setActiveTab] = useState<AgentTab>('files');

  useEffect(() => {
    if (agentId) {
      setCurrentAgent(agentId);
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
      {/* Agent Header + Tab Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 pt-4 pb-0">
        <h2 className="text-xl font-semibold text-slate-100">{agent.name || agent.id}</h2>
        <p className="text-sm text-slate-400 mt-0.5 mb-3">{agent.workspacePath}</p>

        <div className="flex gap-1">
          {(['files', 'skills', 'chat'] as AgentTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-400'
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {tab === 'skills' ? 'Skills & Plugins' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && <FileTabsView agentId={agent.id} files={files} />}
        {activeTab === 'skills' && <SkillsView agentId={agent.id} />}
        {activeTab === 'chat' && <ChatPanel />}
      </div>
    </div>
  );
}
