import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MDEditor from '@uiw/react-md-editor';
import { apiClient } from '../../api/client';
import { useAppStore } from '../../store/appStore';
import { Toast } from './Toast';

interface MarkdownEditorProps {
  agentId: string;
  fileName: string;
}

export function MarkdownEditor({ agentId, fileName }: MarkdownEditorProps) {
  const queryClient = useQueryClient();
  const { getDraft, saveDraft, clearDraft } = useAppStore();

  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showToast, setShowToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch file content
  const { data: fileData, isLoading } = useQuery({
    queryKey: ['file', agentId, fileName],
    queryFn: () => apiClient.getFile(agentId, fileName),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (newContent: string) =>
      apiClient.saveFile(agentId, fileName, newContent),
    onSuccess: () => {
      setLastSaved(new Date());
      setIsDirty(false);
      clearDraft(agentId, fileName);
      setShowToast({ message: 'File saved successfully', type: 'success' });
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['file', agentId, fileName] });
    },
    onError: (error: Error) => {
      setShowToast({ message: `Save failed: ${error.message}`, type: 'error' });
    },
  });

  // Derived: is there a draft different from the saved content?
  const pendingDraft = fileData ? getDraft(agentId, fileName) : undefined;
  const hasPendingDraft = !!(pendingDraft && fileData && pendingDraft !== fileData.content);

  // Initialize content when file loads (only if no draft to restore)
  useEffect(() => {
    if (fileData && !hasPendingDraft) {
      setContent(fileData.content);
      setIsDirty(false);
      setLastSaved(new Date(fileData.lastModified));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileData?.fileName, fileData?.lastModified]);

  // Auto-save draft every 5 seconds
  useEffect(() => {
    if (isDirty && content) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft(agentId, fileName, content);
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, isDirty, agentId, fileName, saveDraft]);

  // Handle content change
  const handleChange = useCallback((value?: string) => {
    setContent(value || '');
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (isDirty && !saveMutation.isPending) {
      saveMutation.mutate(content);
    }
  }, [content, isDirty, saveMutation]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (pendingDraft) {
      setContent(pendingDraft);
      setIsDirty(true);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft(agentId, fileName);
    if (fileData) {
      setContent(fileData.content);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading file...</div>
      </div>
    );
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="h-full flex flex-col">
      {/* Restore Draft Banner */}
      {hasPendingDraft && (
        <div className="bg-yellow-900/30 border-b border-yellow-700 px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-yellow-200">
            You have an unsaved draft. Restore it?
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDraft}
              className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white rounded"
            >
              Restore
            </button>
            <button
              onClick={handleDiscardDraft}
              className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={content}
          onChange={handleChange}
          height="100%"
          preview="live"
          className="!bg-slate-950"
        />
      </div>

      {/* Footer */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <span>
            {wordCount} words, {charCount} characters
          </span>
          {lastSaved && (
            <span>
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-yellow-400">Unsaved changes *</span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className={`
              px-4 py-1.5 rounded font-medium transition-colors
              ${
                isDirty && !saveMutation.isPending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={showToast.message}
          type={showToast.type}
          onClose={() => setShowToast(null)}
        />
      )}
    </div>
  );
}
