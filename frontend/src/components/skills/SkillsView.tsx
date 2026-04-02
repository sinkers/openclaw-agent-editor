import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { Skill, Plugin } from '../../types';

export function SkillsView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'skills' | 'plugins'>('skills');

  const skillsQuery = useQuery({
    queryKey: ['skills'],
    queryFn: () => apiClient.getSkills(),
  });

  const pluginsQuery = useQuery({
    queryKey: ['plugins'],
    queryFn: () => apiClient.getPlugins(),
  });

  const installMutation = useMutation({
    mutationFn: (name: string) => apiClient.installSkill(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['skills'] }),
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => apiClient.enablePlugin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plugins'] }),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => apiClient.disablePlugin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plugins'] }),
  });

  const skills = skillsQuery.data?.skills ?? [];
  const plugins = pluginsQuery.data?.plugins ?? [];

  const filteredSkills = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPlugins = plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <h2 className="text-xl font-semibold text-slate-100">Skills &amp; Plugins</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your agent's capabilities</p>
      </div>

      {/* Tabs + Search */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-0 flex items-end gap-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'skills'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Skills {skills.length > 0 && <span className="ml-1 text-slate-500">({skills.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab('plugins')}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-colors ${
              activeTab === 'plugins'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Plugins {plugins.length > 0 && <span className="ml-1 text-slate-500">({plugins.length})</span>}
          </button>
        </div>
        <div className="ml-auto mb-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded px-3 py-1.5 w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'skills' && (
          <SkillsList
            skills={filteredSkills}
            isLoading={skillsQuery.isLoading}
            error={skillsQuery.error}
            onInstall={(name) => installMutation.mutate(name)}
            installingName={installMutation.isPending ? (installMutation.variables as string) : null}
          />
        )}
        {activeTab === 'plugins' && (
          <PluginsList
            plugins={filteredPlugins}
            isLoading={pluginsQuery.isLoading}
            error={pluginsQuery.error}
            onEnable={(id) => enableMutation.mutate(id)}
            onDisable={(id) => disableMutation.mutate(id)}
            pendingId={
              (enableMutation.isPending ? enableMutation.variables : null) ??
              (disableMutation.isPending ? disableMutation.variables : null) ??
              null
            }
          />
        )}
      </div>
    </div>
  );
}

function SkillsList({
  skills,
  isLoading,
  error,
  onInstall,
  installingName,
}: {
  skills: Skill[];
  isLoading: boolean;
  error: Error | null;
  onInstall: (name: string) => void;
  installingName: string | null;
}) {
  if (isLoading) return <LoadingState label="Loading skills..." />;
  if (error) return <ErrorState message={error.message} />;

  const installed = skills.filter((s) => !s.missing);
  const available = skills.filter((s) => s.missing && s.eligible);

  return (
    <div className="space-y-6">
      {installed.length > 0 && (
        <Section title="Installed">
          {installed.map((skill) => (
            <SkillCard key={skill.name} skill={skill} onInstall={onInstall} installingName={installingName} />
          ))}
        </Section>
      )}
      {available.length > 0 && (
        <Section title="Available to Install">
          {available.map((skill) => (
            <SkillCard key={skill.name} skill={skill} onInstall={onInstall} installingName={installingName} />
          ))}
        </Section>
      )}
      {installed.length === 0 && available.length === 0 && (
        <EmptyState message="No skills found." />
      )}
    </div>
  );
}

function SkillCard({
  skill,
  onInstall,
  installingName,
}: {
  skill: Skill;
  onInstall: (name: string) => void;
  installingName: string | null;
}) {
  const isInstalling = installingName === skill.name;

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
      {skill.emoji && <span className="text-2xl mt-0.5">{skill.emoji}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-medium text-sm">{skill.name}</span>
          <SourceBadge source={skill.source} />
        </div>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{skill.description}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {skill.missing ? (
          <button
            onClick={() => onInstall(skill.name)}
            disabled={isInstalling}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {isInstalling ? 'Installing…' : 'Install'}
          </button>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded">Installed</span>
        )}
      </div>
    </div>
  );
}

function PluginsList({
  plugins,
  isLoading,
  error,
  onEnable,
  onDisable,
  pendingId,
}: {
  plugins: Plugin[];
  isLoading: boolean;
  error: Error | null;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  pendingId: string | null;
}) {
  if (isLoading) return <LoadingState label="Loading plugins..." />;
  if (error) return <ErrorState message={error.message} />;

  const enabled = plugins.filter((p) => p.enabled);
  const disabled = plugins.filter((p) => !p.enabled);

  return (
    <div className="space-y-6">
      {enabled.length > 0 && (
        <Section title="Enabled">
          {enabled.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} onEnable={onEnable} onDisable={onDisable} pendingId={pendingId} />
          ))}
        </Section>
      )}
      {disabled.length > 0 && (
        <Section title="Disabled">
          {disabled.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} onEnable={onEnable} onDisable={onDisable} pendingId={pendingId} />
          ))}
        </Section>
      )}
      {plugins.length === 0 && <EmptyState message="No plugins found." />}
    </div>
  );
}

function PluginCard({
  plugin,
  onEnable,
  onDisable,
  pendingId,
}: {
  plugin: Plugin;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  pendingId: string | null;
}) {
  const isPending = pendingId === plugin.id;

  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-100 font-medium text-sm">{plugin.name}</span>
          <span className="text-slate-500 text-xs">{plugin.version}</span>
          <SourceBadge source={plugin.origin} />
          <StatusBadge enabled={plugin.enabled} status={plugin.status} />
        </div>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{plugin.description}</p>
        {plugin.toolNames.length > 0 && (
          <p className="text-slate-500 text-xs mt-1">Tools: {plugin.toolNames.join(', ')}</p>
        )}
      </div>
      <div className="flex-shrink-0 mt-0.5">
        {plugin.enabled ? (
          <button
            onClick={() => onDisable(plugin.id)}
            disabled={isPending}
            className="px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded transition-colors"
          >
            {isPending ? '…' : 'Disable'}
          </button>
        ) : (
          <button
            onClick={() => onEnable(plugin.id)}
            disabled={isPending}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {isPending ? '…' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const label = source.replace('openclaw-', '');
  return (
    <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-400">{label}</span>
  );
}

function StatusBadge({ enabled, status }: { enabled: boolean; status: string }) {
  if (enabled) {
    return <span className="px-1.5 py-0.5 text-xs rounded bg-green-900 text-green-300">enabled</span>;
  }
  return <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-400">{status}</span>;
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400 text-sm">{label}</div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-red-400 text-sm">{message}</div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500 text-sm">{message}</div>
  );
}
