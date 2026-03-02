// ==========================================
// LABELS/TAGS STORE — Conectado à API real
// Usa /api/v1/tags para CRUD
// ==========================================

import { create } from 'zustand';
import api from '@/lib/api';

export interface Label {
  id: string;
  name: string;
  color: string;
  entityType?: string;
  createdAt: string;
  _count?: { leadTags: number };
}

interface LabelsState {
  labels: Label[];
  loading: boolean;
  loaded: boolean;
  fetchLabels: () => Promise<void>;
  addLabel: (name: string, color: string) => Promise<void>;
  removeLabel: (id: string) => Promise<void>;
  updateLabel: (id: string, name: string, color: string) => Promise<void>;
}

export const useLabelsStore = create<LabelsState>((set, get) => ({
  labels: [],
  loading: false,
  loaded: false,

  fetchLabels: async () => {
    // Avoid refetching if already loaded
    if (get().loaded && get().labels.length > 0) return;

    set({ loading: true });
    try {
      const { data } = await api.get('/tags');
      const labels = Array.isArray(data) ? data : (data.data || data.items || []);
      set({ labels, loaded: true });
    } catch (error) {
      console.error('[LabelsStore] Error fetching tags:', error);
    } finally {
      set({ loading: false });
    }
  },

  addLabel: async (name: string, color: string) => {
    try {
      const { data } = await api.post('/tags', { name, color });
      set((state) => ({ labels: [...state.labels, data] }));
    } catch (error) {
      console.error('[LabelsStore] Error creating tag:', error);
      throw error;
    }
  },

  removeLabel: async (id: string) => {
    try {
      await api.delete(`/tags/${id}`);
      set((state) => ({ labels: state.labels.filter(l => l.id !== id) }));
    } catch (error) {
      console.error('[LabelsStore] Error deleting tag:', error);
      throw error;
    }
  },

  updateLabel: async (id: string, name: string, color: string) => {
    try {
      const { data } = await api.put(`/tags/${id}`, { name, color });
      set((state) => ({
        labels: state.labels.map(l => l.id === id ? { ...l, ...data } : l),
      }));
    } catch (error) {
      console.error('[LabelsStore] Error updating tag:', error);
      throw error;
    }
  },
}));

// Export API functions for external use (backwards compatible)
export const labelsApi = {
  getLabels: () => useLabelsStore.getState().labels,
  addLabel: (name: string, color: string) => useLabelsStore.getState().addLabel(name, color),
  removeLabel: (id: string) => useLabelsStore.getState().removeLabel(id),
  updateLabel: (id: string, name: string, color: string) => useLabelsStore.getState().updateLabel(id, name, color),
  fetchLabels: () => useLabelsStore.getState().fetchLabels(),
};
