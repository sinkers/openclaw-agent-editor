import { useState, useRef, useEffect } from 'react';
import { useInstanceStore, type Instance } from '../../store/instanceStore';

export function InstanceSelector() {
  const { instances, activeInstanceId, setActiveInstance, addInstance, removeInstance, updateInstance } =
    useInstanceStore();
  const [showManager, setShowManager] = useState(false);

  const active = instances.find((i) => i.id === activeInstanceId) ?? instances[0];

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={activeInstanceId}
          onChange={(e) => setActiveInstance(e.target.value)}
          className="flex-1 bg-slate-800 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700"
          title="Active OpenClaw instance"
        >
          {instances.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowManager(true)}
          className="px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded border border-slate-600"
          title="Manage instances"
        >
          ⚙
        </button>
      </div>

      {active && (
        <p className="text-xs text-slate-500 mt-1 truncate" title={active.url}>
          {active.url}
        </p>
      )}

      {showManager && (
        <InstanceManager
          instances={instances}
          onAdd={addInstance}
          onRemove={removeInstance}
          onUpdate={updateInstance}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
}

interface InstanceManagerProps {
  instances: Instance[];
  onAdd: (instance: Omit<Instance, 'id'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<Instance, 'id'>>) => void;
  onClose: () => void;
}

function InstanceManager({ instances, onAdd, onRemove, onUpdate, onClose }: InstanceManagerProps) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = () => {
    const trimmedUrl = newUrl.trim();
    const trimmedName = newName.trim();
    if (!trimmedName || !trimmedUrl) return;
    onAdd({ name: trimmedName, url: trimmedUrl });
    setNewName('');
    setNewUrl('');
  };

  const handleEdit = (instance: Instance) => {
    setEditingId(instance.id);
    setEditName(instance.name);
    setEditUrl(instance.url);
  };

  const handleSave = () => {
    if (editingId) {
      onUpdate(editingId, { name: editName.trim(), url: editUrl.trim() });
      setEditingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-[480px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">Manage Instances</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {instances.map((instance) => (
            <div key={instance.id} className="bg-slate-800 rounded-lg p-3">
              {editingId === instance.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="URL (e.g. http://192.168.1.10:3001)"
                    className="w-full bg-slate-700 text-slate-200 text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{instance.name}</p>
                    <p className="text-xs text-slate-400 truncate">{instance.url}</p>
                  </div>
                  {instance.id !== 'local' && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(instance)}
                        className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                      >Edit</button>
                      <button
                        onClick={() => onRemove(instance.id)}
                        className="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 text-red-300 rounded"
                      >Remove</button>
                    </div>
                  )}
                  {instance.id === 'local' && (
                    <span className="text-xs text-slate-500 px-2 py-1">built-in</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Add Instance</p>
            <InstallHelpButton />
          </div>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name (e.g. Raspberry Pi)"
            className="w-full bg-slate-800 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="URL (e.g. http://192.168.1.10:3001)"
            className="w-full bg-slate-800 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim() || !newUrl.trim()}
            className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded transition-colors"
          >
            Add Instance
          </button>
        </div>
      </div>
    </div>
  );
}

const INSTALL_SCRIPT_URL =
  'https://raw.githubusercontent.com/YOUR_ORG/openclaw-agent-editor/main/install.sh';

function InstallHelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        title="How to install on another machine"
      >
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-blue-500 text-blue-400 text-[10px] font-bold">?</span>
        How to install
      </button>

      {open && (
        <div className="absolute right-0 bottom-7 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 z-10 space-y-3 text-xs text-slate-300">
          <p className="font-semibold text-slate-100">Installing the backend on another machine</p>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium">Option 1 — One-liner install script</p>
            <p>Run this on the remote machine (requires Node ≥18 and git):</p>
            <pre className="bg-slate-900 rounded p-2 text-green-300 text-[11px] leading-relaxed whitespace-pre-wrap break-all select-all">
{`curl -fsSL ${INSTALL_SCRIPT_URL} | bash`}
            </pre>
            <p className="text-slate-400">
              With options (custom port / CORS):
            </p>
            <pre className="bg-slate-900 rounded p-2 text-green-300 text-[11px] leading-relaxed whitespace-pre-wrap break-all select-all">
{`curl -fsSL ${INSTALL_SCRIPT_URL} | bash -s -- \\
  --port 3001 \\
  --cors-origins "http://YOUR-LAPTOP:5173"`}
            </pre>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium">Option 2 — Ask your OpenClaw agent</p>
            <p>In the Chat tab, send:</p>
            <pre className="bg-slate-900 rounded p-2 text-yellow-200 text-[11px] leading-relaxed whitespace-pre-wrap select-all">
{`Install the openclaw-agent-editor backend on this machine.
Run: curl -fsSL ${INSTALL_SCRIPT_URL} | bash`}
            </pre>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 font-medium">Option 3 — Docker</p>
            <pre className="bg-slate-900 rounded p-2 text-green-300 text-[11px] leading-relaxed whitespace-pre-wrap break-all select-all">
{`git clone https://github.com/YOUR_ORG/openclaw-agent-editor
cd openclaw-agent-editor
docker compose up -d`}
            </pre>
          </div>

          <p className="text-slate-500 text-[11px]">
            Then add the machine's IP and port 3001 as the URL above.
          </p>
        </div>
      )}
    </div>
  );
}
