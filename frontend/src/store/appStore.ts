import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Current selection
  currentAgentId: string | null;
  currentFileName: string | null;

  // Theme
  theme: 'light' | 'dark';

  // Drafts (stored in localStorage)
  drafts: Record<string, string>; // key: "agentId:fileName", value: content

  // Actions
  setCurrentAgent: (id: string | null) => void;
  setCurrentFile: (fileName: string | null) => void;
  toggleTheme: () => void;

  // Draft management
  saveDraft: (agentId: string, fileName: string, content: string) => void;
  getDraft: (agentId: string, fileName: string) => string | undefined;
  clearDraft: (agentId: string, fileName: string) => void;
  hasDraft: (agentId: string, fileName: string) => boolean;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAgentId: null,
      currentFileName: null,
      theme: 'dark',
      drafts: {},

      // Actions
      setCurrentAgent: (id) => set({ currentAgentId: id }),

      setCurrentFile: (fileName) => set({ currentFileName: fileName }),

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark',
      })),

      saveDraft: (agentId, fileName, content) => {
        const key = `${agentId}:${fileName}`;
        set((state) => ({
          drafts: {
            ...state.drafts,
            [key]: content,
          },
        }));
      },

      getDraft: (agentId, fileName) => {
        const key = `${agentId}:${fileName}`;
        return get().drafts[key];
      },

      clearDraft: (agentId, fileName) => {
        const key = `${agentId}:${fileName}`;
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [key]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        });
      },

      hasDraft: (agentId, fileName) => {
        const key = `${agentId}:${fileName}`;
        return key in get().drafts;
      },
    }),
    {
      name: 'openclaw-editor-storage',
      partialize: (state) => ({
        theme: state.theme,
        drafts: state.drafts,
        currentAgentId: state.currentAgentId,
        currentFileName: state.currentFileName,
      }),
    }
  )
);
