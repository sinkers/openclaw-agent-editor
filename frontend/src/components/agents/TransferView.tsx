import { useState, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useInstanceStore } from '../../store/instanceStore';

interface TransferViewProps {
  agentId: string;
  agentName: string;
}

export function TransferView({ agentId, agentName }: TransferViewProps) {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      <ExportSection agentId={agentId} agentName={agentName} />
      <ImportSection agentId={agentId} />
      <CrossInstanceTransfer agentId={agentId} agentName={agentName} />
    </div>
  );
}

function ExportSection({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await apiClient.exportAgent(agentId);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${agentName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Export Agent</h3>
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-300">
          Download all agent files (SOUL.md, IDENTITY.md, AGENTS.md, etc.) as a JSON bundle you can back up or transfer.
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={handleExport}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
        >
          {loading ? 'Exporting…' : 'Download Bundle (.json)'}
        </button>
      </div>
    </div>
  );
}

function ImportSection({ agentId }: { agentId: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ written: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as { files?: Record<string, string> };
      if (!bundle.files || typeof bundle.files !== 'object') {
        throw new Error('Invalid bundle: expected a "files" object');
      }
      const response = await apiClient.importAgent(agentId, bundle.files);
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Import Agent Files</h3>
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-300">
          Import agent files from a previously exported JSON bundle. Existing files will be overwritten (a backup is created first).
        </p>
        {result && (
          <p className="text-xs text-green-400">
            Imported: {result.written.join(', ')}
          </p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-3 items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded transition-colors"
          >
            {loading ? 'Importing…' : 'Choose Bundle File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}

function CrossInstanceTransfer({ agentId, agentName }: { agentId: string; agentName: string }) {
  const { instances, activeInstanceId } = useInstanceStore();
  const [targetInstanceId, setTargetInstanceId] = useState('');
  const [targetAgentId, setTargetAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const otherInstances = instances.filter((i) => i.id !== activeInstanceId);

  const handleTransfer = async () => {
    if (!targetInstanceId || !targetAgentId.trim()) return;
    setLoading(true);
    setStatus(null);

    try {
      // 1. Export from current instance
      const bundle = await apiClient.exportAgent(agentId);

      // 2. Import into target instance
      const targetInstance = instances.find((i) => i.id === targetInstanceId);
      if (!targetInstance) throw new Error('Target instance not found');

      const targetUrl = `${targetInstance.url.replace(/\/$/, '')}/api/agents/${encodeURIComponent(targetAgentId.trim())}/import`;
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: bundle.files }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json() as { written: string[] };
      setStatus({ type: 'success', message: `Transferred ${result.written.length} file(s) to ${targetInstance.name}` });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (otherInstances.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Transfer to Another Instance</h3>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            No other instances configured. Add one using the instance selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Transfer to Another Instance</h3>
      <div className="bg-slate-800 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-300">
          Copy <span className="font-medium text-slate-100">{agentName}</span>'s files to an agent on another instance.
        </p>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">Target Instance</label>
          <select
            value={targetInstanceId}
            onChange={(e) => setTargetInstanceId(e.target.value)}
            className="w-full bg-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Select instance —</option>
            {otherInstances.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.url})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">Target Agent ID</label>
          <input
            value={targetAgentId}
            onChange={(e) => setTargetAgentId(e.target.value)}
            placeholder="e.g. workspace-main"
            className="w-full bg-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {status && (
          <p className={`text-xs ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {status.message}
          </p>
        )}

        <button
          onClick={handleTransfer}
          disabled={loading || !targetInstanceId || !targetAgentId.trim()}
          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded transition-colors"
        >
          {loading ? 'Transferring…' : 'Transfer Files'}
        </button>
      </div>
    </div>
  );
}
