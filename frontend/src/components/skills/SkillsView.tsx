import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import type { Skill, Plugin, ClawhubSkill } from '../../types';

interface SkillsViewProps {
  agentId: string;
}

type MainTab = 'installed' | 'search' | 'plugins';

export function SkillsView({ agentId }: SkillsViewProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('installed');

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tab bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 flex items-center">
        {([
          ['installed', 'Installed Skills'],
          ['search', 'Browse Clawhub'],
          ['plugins', 'Plugins (system)'],
        ] as [MainTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'installed' && <InstalledSkillsTab />}
        {activeTab === 'search' && <ClawhubSearchTab agentId={agentId} />}
        {activeTab === 'plugins' && <PluginsTab />}
      </div>
    </div>
  );
}

function InstalledSkillsTab() {
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['skills'],
    queryFn: () => apiClient.getSkills(),
  });

  const skills = data?.skills ?? [];
  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const workspace = filtered.filter((s) => s.source === 'openclaw-workspace');
  const bundled = filtered.filter((s) => s.source !== 'openclaw-workspace');

  if (isLoading) return <LoadingState label="Loading skills..." />;
  if (error) return <ErrorState message={(error as Error).message} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Workspace skills are per-agent. Bundled/managed skills are system-wide.
        </p>
        <input
          type="text"
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {workspace.length > 0 && (
        <Section title="Agent Workspace Skills">
          {workspace.map((s) => <SkillCard key={s.name} skill={s} />)}
        </Section>
      )}
      {bundled.length > 0 && (
        <Section title="System Skills (bundled/managed)">
          {bundled.map((s) => <SkillCard key={s.name} skill={s} />)}
        </Section>
      )}
      {filtered.length === 0 && <EmptyState message="No skills found." />}
    </div>
  );
}

function ClawhubSearchTab({ agentId }: { agentId: string }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const searchQuery = useQuery({
    queryKey: ['clawhub-search', submitted],
    queryFn: () => apiClient.searchClawhub(submitted),
    enabled: !!submitted,
  });

  const installMutation = useMutation({
    mutationFn: (slug: string) => apiClient.installSkillFromClawhub(agentId, slug),
    onSuccess: () => {
      // Invalidate installed skills so the Installed tab refreshes
      void queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clawhub skills…"
          className="flex-1 bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
        >
          Search
        </button>
      </form>

      {searchQuery.isLoading && <LoadingState label="Searching clawhub…" />}
      {searchQuery.error && <ErrorState message={(searchQuery.error as Error).message} />}

      {searchQuery.data && (
        <div className="space-y-2">
          {searchQuery.data.results.length === 0 && (
            <EmptyState message="No results found." />
          )}
          {searchQuery.data.results.map((result) => (
            <ClawhubResultCard
              key={result.slug}
              result={result}
              onInstall={() => installMutation.mutate(result.slug)}
              installing={installMutation.isPending && installMutation.variables === result.slug}
              installed={installMutation.isSuccess && installMutation.variables === result.slug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClawhubResultCard({
  result,
  onInstall,
  installing,
  installed,
}: {
  result: ClawhubSkill;
  onInstall: () => void;
  installing: boolean;
  installed: boolean;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-100 font-medium text-sm">{result.name}</span>
          <span className="text-slate-500 text-xs font-mono">{result.slug}</span>
        </div>
        <p className="text-slate-500 text-xs mt-0.5">
          Match score: {result.score.toFixed(3)}
        </p>
      </div>
      <div className="flex-shrink-0">
        {installed ? (
          <span className="px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded">Installed</span>
        ) : (
          <button
            onClick={onInstall}
            disabled={installing}
            className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
          >
            {installing ? 'Installing…' : 'Install'}
          </button>
        )}
      </div>
    </div>
  );
}

function PluginsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['plugins'],
    queryFn: () => apiClient.getPlugins(),
  });

  const enableMutation = useMutation({
    mutationFn: (id: string) => apiClient.enablePlugin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plugins'] }),
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) => apiClient.disablePlugin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plugins'] }),
  });

  const plugins = (data?.plugins ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  const pendingId =
    (enableMutation.isPending ? enableMutation.variables : null) ??
    (disableMutation.isPending ? disableMutation.variables : null) ??
    null;

  if (isLoading) return <LoadingState label="Loading plugins..." />;
  if (error) return <ErrorState message={(error as Error).message} />;

  const enabled = plugins.filter((p) => p.enabled);
  const disabled = plugins.filter((p) => !p.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Plugins are system-wide gateway extensions affecting all agents.
        </p>
        <input
          type="text"
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded px-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {enabled.length > 0 && (
        <Section title="Enabled">
          {enabled.map((p) => (
            <PluginCard key={p.id} plugin={p} onEnable={() => enableMutation.mutate(p.id)} onDisable={() => disableMutation.mutate(p.id)} pendingId={pendingId} />
          ))}
        </Section>
      )}
      {disabled.length > 0 && (
        <Section title="Disabled">
          {disabled.map((p) => (
            <PluginCard key={p.id} plugin={p} onEnable={() => enableMutation.mutate(p.id)} onDisable={() => disableMutation.mutate(p.id)} pendingId={pendingId} />
          ))}
        </Section>
      )}
      {plugins.length === 0 && <EmptyState message="No plugins found." />}
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 flex items-start gap-3">
      {skill.emoji && <span className="text-2xl mt-0.5">{skill.emoji}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-100 font-medium text-sm">{skill.name}</span>
          <SourceBadge source={skill.source} />
          {skill.missing && <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-900 text-yellow-300">missing deps</span>}
        </div>
        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{skill.description}</p>
      </div>
      {!skill.missing && (
        <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded mt-0.5">Active</span>
      )}
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
  onEnable: () => void;
  onDisable: () => void;
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
          <button onClick={onDisable} disabled={isPending} className="px-3 py-1 text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 rounded transition-colors">
            {isPending ? '…' : 'Disable'}
          </button>
        ) : (
          <button onClick={onEnable} disabled={isPending} className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors">
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
  return <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-400">{label}</span>;
}

function StatusBadge({ enabled, status }: { enabled: boolean; status: string }) {
  if (enabled) return <span className="px-1.5 py-0.5 text-xs rounded bg-green-900 text-green-300">enabled</span>;
  return <span className="px-1.5 py-0.5 text-xs rounded bg-slate-700 text-slate-400">{status}</span>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex items-center justify-center py-16 text-slate-400 text-sm">{label}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-16 text-red-400 text-sm">{message}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex items-center justify-center py-16 text-slate-500 text-sm">{message}</div>;
}
