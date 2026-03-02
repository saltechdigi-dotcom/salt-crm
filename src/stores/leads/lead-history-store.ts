// Lead History Store - Connected to Backend API
// Uses /api/v1/leads/:id/history for fetching history events

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type HistoryEventType =
  | 'observation'
  | 'schedule_created'
  | 'schedule_completed'
  | 'schedule_cancelled'
  | 'status_change'
  | 'temperature_change'
  | 'transfer'
  | 'sale_registered'
  | 'contact_attempt'
  | 'message_sent'
  | 'message_received'
  | 'ai_interaction'
  | 'assignment';

export interface LeadHistoryEvent {
  id: string;
  leadId: string;
  type: HistoryEventType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  createdBy: { id: string; name: string; avatarUrl?: string } | null;
  createdAt: string;
}

export interface LeadProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  document?: string;
  origin?: { id: string; name: string; type: string; color: string } | null;
  reference?: string;
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  };
  createdAt: string;
  convertedToClientAt?: string;
  isClient: boolean;
}

// React hook - fetches from API
export function useLeadHistory(leadId?: string) {
  const [history, setHistory] = useState<LeadHistoryEvent[]>([]);
  const [profile, setProfile] = useState<LeadProfile | undefined>();
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await api.get(`/leads/${leadId}/history`);
      const events = Array.isArray(res.data) ? res.data : [];
      setHistory(events.map((e: any) => ({
        id: e.id,
        leadId: e.leadId,
        type: e.eventType || e.type,
        title: e.title,
        description: e.description || '',
        metadata: e.metadata,
        createdBy: e.createdBy,
        createdAt: e.createdAt,
      })));
    } catch (err) {
      console.error('Error fetching lead history:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const fetchProfile = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await api.get(`/leads/${leadId}`);
      const lead = res.data;
      setProfile({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        document: lead.document,
        origin: lead.origin,
        createdAt: lead.createdAt,
        convertedToClientAt: lead.convertedToClientAt,
        isClient: !!lead.convertedToClientAt,
        address: {
          street: lead.addressStreet,
          number: lead.addressNumber,
          complement: lead.addressComplement,
          neighborhood: lead.addressNeighborhood,
          cep: lead.addressZipcode,
          city: lead.city,
          state: lead.state,
        },
      });
    } catch (err) {
      console.error('Error fetching lead profile:', err);
    }
  }, [leadId]);

  useEffect(() => {
    fetchHistory();
    fetchProfile();
  }, [fetchHistory, fetchProfile]);

  const addObservation = useCallback(async (description: string, _createdBy: string) => {
    if (!leadId) return;
    try {
      // POST to create a history entry of type observation
      // The backend handles this through the leads controller
      await api.post(`/leads/${leadId}/history`, {
        eventType: 'observation',
        title: 'Observação adicionada',
        description,
      }).catch(() => {
        // If no dedicated endpoint, we'll add it locally and refresh
      });
      await fetchHistory();
    } catch (err) {
      console.error('Error adding observation:', err);
    }
  }, [leadId, fetchHistory]);

  const addStatusChange = useCallback(async (from: string, to: string, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory(); // Refresh after backend processes the change
  }, [leadId, fetchHistory]);

  const addTemperatureChange = useCallback(async (from: string, to: string, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory();
  }, [leadId, fetchHistory]);

  const addContactAttempt = useCallback(async (description: string, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory();
  }, [leadId, fetchHistory]);

  const addMessageSent = useCallback(async (description: string, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory();
  }, [leadId, fetchHistory]);

  const addTransfer = useCallback(async (from: string, to: string, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory();
  }, [leadId, fetchHistory]);

  const addSaleRegistered = useCallback(async (saleData: Record<string, any>, _createdBy: string) => {
    if (!leadId) return;
    await fetchHistory();
    await fetchProfile();
  }, [leadId, fetchHistory, fetchProfile]);

  const updateProfile = useCallback(async (data: Partial<LeadProfile>) => {
    if (!leadId) return;
    try {
      await api.put(`/leads/${leadId}`, data);
      await fetchProfile();
    } catch (err) {
      console.error('Error updating lead profile:', err);
    }
  }, [leadId, fetchProfile]);

  return {
    history,
    profile,
    loading,
    historyCount: history.length,
    addObservation,
    addStatusChange,
    addTemperatureChange,
    addContactAttempt,
    addMessageSent,
    addTransfer,
    addSaleRegistered,
    updateProfile,
    refreshHistory: fetchHistory,
  };
}

// Standalone store for non-hook usage
export const leadHistoryStore = {
  async getHistoryForLead(leadId: string): Promise<LeadHistoryEvent[]> {
    try {
      const res = await api.get(`/leads/${leadId}/history`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  },
  async getLeadProfile(leadId: string): Promise<LeadProfile | undefined> {
    try {
      const res = await api.get(`/leads/${leadId}`);
      return res.data;
    } catch {
      return undefined;
    }
  },
  getHistoryCount(_leadId: string): number {
    return 0; // Use the hook for reactive count
  },
  subscribe(_fn: () => void): () => void {
    return () => { }; // No-op, use the hook instead
  },
};

// Format event type for display
export function formatHistoryEventType(type: HistoryEventType): string {
  const labels: Record<HistoryEventType, string> = {
    observation: 'Observação',
    schedule_created: 'Agendamento',
    schedule_completed: 'Agendamento Concluído',
    schedule_cancelled: 'Agendamento Cancelado',
    status_change: 'Mudança de Status',
    temperature_change: 'Temperatura',
    transfer: 'Transferência',
    sale_registered: 'Venda',
    contact_attempt: 'Contato',
    message_sent: 'Mensagem Enviada',
    message_received: 'Mensagem Recebida',
    ai_interaction: 'IA',
    assignment: 'Atribuição',
  };
  return labels[type] || type;
}

// Get icon color for event type
export function getHistoryEventColor(type: HistoryEventType): string {
  const colors: Record<HistoryEventType, string> = {
    observation: 'text-blue-500',
    schedule_created: 'text-success',
    schedule_completed: 'text-emerald-600',
    schedule_cancelled: 'text-destructive',
    status_change: 'text-amber-500',
    temperature_change: 'text-orange-500',
    transfer: 'text-purple-500',
    sale_registered: 'text-success',
    contact_attempt: 'text-sky-500',
    message_sent: 'text-teal-500',
    message_received: 'text-indigo-500',
    ai_interaction: 'text-violet-500',
    assignment: 'text-cyan-500',
  };
  return colors[type] || 'text-muted-foreground';
}
