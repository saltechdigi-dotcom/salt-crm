// ==========================================
// SISTEMA DE PÓS-VENDA COM IA (365 dias)
// Conectado à API real: /api/v1/postsale
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type MessageChannel = 'whatsapp' | 'email' | 'sms';
export type TemplateStatus = 'active' | 'inactive';

export interface PostSaleTemplate {
  id: string;
  name: string;
  dayOffset: number;
  channel: MessageChannel;
  content: string;
  useAI: boolean;
  aiPrompt?: string;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PostSaleMessage {
  id: string;
  templateId: string;
  journeyId: string;
  clientName: string;
  channel: MessageChannel;
  content: string;
  wasAIGenerated: boolean;
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  response?: string;
  respondedAt?: string;
}

export interface PostSaleJourney {
  id: string;
  saleId: string;
  clientName: string;
  productSold: string;
  saleDate: string;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'cancelled';
  messagesTotal: number;
  messagesSent: number;
}

export interface PostSaleStats {
  activeJourneys: number;
  pendingMessages: number;
  sentMessages: number;
  aiMessages: number;
  responseRate: number;
}

// ==========================================
// API Functions
// ==========================================

async function fetchTemplates(status?: string): Promise<PostSaleTemplate[]> {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const { data } = await api.get('/postsale/templates', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[PostSaleStore] Error fetching templates:', error);
    return [];
  }
}

async function createTemplateApi(template: Omit<PostSaleTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PostSaleTemplate | null> {
  try {
    const { data } = await api.post('/postsale/templates', template);
    return data;
  } catch (error) {
    console.error('[PostSaleStore] Error creating template:', error);
    return null;
  }
}

async function updateTemplateApi(id: string, updates: Partial<PostSaleTemplate>): Promise<PostSaleTemplate | null> {
  try {
    const { data } = await api.put(`/postsale/templates/${id}`, updates);
    return data;
  } catch (error) {
    console.error('[PostSaleStore] Error updating template:', error);
    return null;
  }
}

async function deleteTemplateApi(id: string): Promise<boolean> {
  try {
    await api.delete(`/postsale/templates/${id}`);
    return true;
  } catch (error) {
    console.error('[PostSaleStore] Error deleting template:', error);
    return false;
  }
}

async function fetchJourneys(status?: string): Promise<PostSaleJourney[]> {
  try {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const { data } = await api.get('/postsale/journeys', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[PostSaleStore] Error fetching journeys:', error);
    return [];
  }
}

async function fetchJourneyById(id: string): Promise<PostSaleJourney & { messages: PostSaleMessage[] } | null> {
  try {
    const { data } = await api.get(`/postsale/journeys/${id}`);
    return data;
  } catch (error) {
    console.error('[PostSaleStore] Error fetching journey:', error);
    return null;
  }
}

async function createJourneyApi(journey: { saleId: string; clientName: string; productSold: string; saleDate: string }): Promise<PostSaleJourney | null> {
  try {
    const { data } = await api.post('/postsale/journeys', journey);
    return data;
  } catch (error) {
    console.error('[PostSaleStore] Error creating journey:', error);
    return null;
  }
}

async function cancelJourneyApi(id: string): Promise<boolean> {
  try {
    await api.patch(`/postsale/journeys/${id}/cancel`);
    return true;
  } catch (error) {
    console.error('[PostSaleStore] Error cancelling journey:', error);
    return false;
  }
}

async function fetchMessages(journeyId?: string, status?: string): Promise<PostSaleMessage[]> {
  try {
    const params: Record<string, string> = {};
    if (journeyId) params.journeyId = journeyId;
    if (status) params.status = status;
    const { data } = await api.get('/postsale/messages', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[PostSaleStore] Error fetching messages:', error);
    return [];
  }
}

async function fetchStats(): Promise<PostSaleStats> {
  try {
    const { data } = await api.get('/postsale/stats');
    return data;
  } catch (error) {
    console.error('[PostSaleStore] Error fetching stats:', error);
    return { activeJourneys: 0, pendingMessages: 0, sentMessages: 0, aiMessages: 0, responseRate: 0 };
  }
}

// ==========================================
// Store Class
// ==========================================

class PostSaleStore {
  private templates: PostSaleTemplate[] = [];
  private journeys: PostSaleJourney[] = [];
  private messages: PostSaleMessage[] = [];
  private listeners: Set<() => void> = new Set();
  private loaded = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Templates
  getTemplates() {
    return this.templates.sort((a, b) => a.dayOffset - b.dayOffset);
  }

  getActiveTemplates() {
    return this.templates.filter(t => t.status === 'active').sort((a, b) => a.dayOffset - b.dayOffset);
  }

  async loadTemplates() {
    this.templates = await fetchTemplates();
    this.notify();
  }

  async addTemplate(template: Omit<PostSaleTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await createTemplateApi(template);
    if (created) {
      this.templates.push(created);
      this.notify();
    }
    return created;
  }

  async updateTemplate(id: string, updates: Partial<PostSaleTemplate>) {
    const updated = await updateTemplateApi(id, updates);
    if (updated) {
      const idx = this.templates.findIndex(t => t.id === id);
      if (idx !== -1) this.templates[idx] = updated;
      this.notify();
    }
    return updated;
  }

  async toggleTemplateStatus(id: string) {
    const tpl = this.templates.find(t => t.id === id);
    if (tpl) {
      const newStatus = tpl.status === 'active' ? 'inactive' : 'active';
      return this.updateTemplate(id, { status: newStatus });
    }
    return null;
  }

  async removeTemplate(id: string) {
    const ok = await deleteTemplateApi(id);
    if (ok) {
      this.templates = this.templates.filter(t => t.id !== id);
      this.notify();
    }
    return ok;
  }

  // Journeys
  getJourneys() { return this.journeys; }
  getActiveJourneys() { return this.journeys.filter(j => j.status === 'active'); }
  getJourneyById(id: string) { return this.journeys.find(j => j.id === id); }

  async loadJourneys() {
    this.journeys = await fetchJourneys();
    this.notify();
  }

  async createJourney(data: { saleId: string; clientName: string; productSold: string; saleDate: string }) {
    const created = await createJourneyApi(data);
    if (created) {
      this.journeys.unshift(created);
      this.notify();
    }
    return created;
  }

  async cancelJourney(id: string) {
    const ok = await cancelJourneyApi(id);
    if (ok) {
      const idx = this.journeys.findIndex(j => j.id === id);
      if (idx !== -1) this.journeys[idx] = { ...this.journeys[idx], status: 'cancelled' };
      this.notify();
    }
    return ok;
  }

  // Messages
  getMessages() { return this.messages; }
  getPendingMessages() { return this.messages.filter(m => m.status === 'pending'); }
  getSentMessages() { return this.messages.filter(m => m.status === 'sent'); }
  getMessagesForJourney(journeyId: string) { return this.messages.filter(m => m.journeyId === journeyId); }

  async loadMessages(journeyId?: string) {
    this.messages = await fetchMessages(journeyId);
    this.notify();
  }

  // Stats
  async getStats() {
    return fetchStats();
  }

  // Initial load
  async loadAll() {
    if (this.loaded) return;
    await Promise.all([this.loadTemplates(), this.loadJourneys()]);
    this.loaded = true;
  }
}

export const postSaleStore = new PostSaleStore();

// React Hook
export function usePostSaleStore() {
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PostSaleStats>({
    activeJourneys: 0, pendingMessages: 0, sentMessages: 0, aiMessages: 0, responseRate: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      await postSaleStore.loadAll();
      const s = await postSaleStore.getStats();
      if (!cancelled) {
        setStats(s);
        setLoading(false);
      }
    };

    load();
    const unsubscribe = postSaleStore.subscribe(() => {
      if (!cancelled) forceUpdate({});
    });

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const refreshStats = useCallback(async () => {
    const s = await postSaleStore.getStats();
    setStats(s);
  }, []);

  return {
    ...postSaleStore,
    loading,
    stats,
    refreshStats,
    templates: postSaleStore.getTemplates(),
    journeys: postSaleStore.getJourneys(),
    activeJourneys: postSaleStore.getActiveJourneys(),
  };
}
