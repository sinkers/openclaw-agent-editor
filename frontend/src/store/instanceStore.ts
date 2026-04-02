import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Instance {
  id: string;
  name: string;
  url: string; // e.g. "http://192.168.1.10:3001"
}

const LOCAL_INSTANCE: Instance = {
  id: 'local',
  name: 'Local',
  url: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};

interface InstanceState {
  instances: Instance[];
  activeInstanceId: string;

  addInstance: (instance: Omit<Instance, 'id'>) => void;
  removeInstance: (id: string) => void;
  updateInstance: (id: string, updates: Partial<Omit<Instance, 'id'>>) => void;
  setActiveInstance: (id: string) => void;
  getActiveInstance: () => Instance;
  getActiveApiBase: () => string;
}

export const useInstanceStore = create<InstanceState>()(
  persist(
    (set, get) => ({
      instances: [LOCAL_INSTANCE],
      activeInstanceId: 'local',

      addInstance: (instanceData) => {
        const id = `instance-${Date.now()}`;
        set((state) => ({
          instances: [...state.instances, { ...instanceData, id }],
        }));
      },

      removeInstance: (id) => {
        if (id === 'local') return; // Can't remove local instance
        set((state) => {
          const remaining = state.instances.filter((i) => i.id !== id);
          return {
            instances: remaining,
            activeInstanceId:
              state.activeInstanceId === id ? 'local' : state.activeInstanceId,
          };
        });
      },

      updateInstance: (id, updates) => {
        if (id === 'local') return; // Can't modify local instance
        set((state) => ({
          instances: state.instances.map((i) =>
            i.id === id ? { ...i, ...updates } : i
          ),
        }));
      },

      setActiveInstance: (id) => {
        set({ activeInstanceId: id });
      },

      getActiveInstance: () => {
        const { instances, activeInstanceId } = get();
        return (
          instances.find((i) => i.id === activeInstanceId) ?? LOCAL_INSTANCE
        );
      },

      getActiveApiBase: () => {
        const instance = get().getActiveInstance();
        const url = instance.url.replace(/\/$/, '');
        return `${url}/api`;
      },
    }),
    {
      name: 'openclaw-instances',
      partialize: (state) => ({
        instances: state.instances.filter((i) => i.id !== 'local'),
        activeInstanceId: state.activeInstanceId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<InstanceState>;
        return {
          ...current,
          instances: [LOCAL_INSTANCE, ...(p.instances ?? [])],
          activeInstanceId: p.activeInstanceId ?? 'local',
        };
      },
    }
  )
);
