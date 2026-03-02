// Lead Schedules Store - Connected to Backend API
// Uses /api/v1/schedules for CRUD operations
// Google Calendar integration structure preserved for future sync

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import api from '@/lib/api';

export type ScheduleType = 'meeting' | 'visit' | 'call' | 'return_call' | 'other';
export type ScheduleStatus = 'confirmed' | 'tentative' | 'cancelled' | 'completed';

// Main schedule interface
export interface LeadSchedule {
  id: string;
  leadId?: string;
  lead?: { id: string; name: string; phone: string } | null;
  assignedTo?: { id: string; name: string; avatarUrl?: string } | null;

  // Display fields
  summary: string;
  description?: string;
  title: string;

  // Backward-compatible fields
  leadName: string;
  leadOrigin?: string;
  sellerId: string;
  sellerName: string;

  // DateTime fields
  scheduledAt: Date;
  endAt?: Date;
  timezone?: string;

  // Location
  location?: string;
  conferenceLink?: string;

  // Status
  status: ScheduleStatus;
  scheduleType: ScheduleType;

  // Completion
  completed: boolean;
  completedAt?: Date;
  completionNotes?: string;

  // Google Calendar sync metadata
  googleCalendarId?: string;
  syncStatus?: string;

  createdAt: Date;
  updatedAt?: Date;
}

// Map backend response to frontend LeadSchedule
function mapSchedule(s: any): LeadSchedule {
  const typeMap: Record<string, ScheduleType> = {
    meeting: 'meeting', visit: 'visit', call: 'call', return_call: 'return_call', other: 'other',
  };
  return {
    id: s.id,
    leadId: s.lead?.id,
    lead: s.lead,
    assignedTo: s.assignedTo,
    summary: s.title || '',
    description: s.description || '',
    title: s.title || '',
    leadName: s.lead?.name || '',
    leadOrigin: '',
    sellerId: s.assignedTo?.id || '',
    sellerName: s.assignedTo?.name || '',
    scheduledAt: new Date(s.scheduledAt),
    endAt: s.endAt ? new Date(s.endAt) : undefined,
    timezone: s.timezone,
    location: s.location,
    conferenceLink: s.conferenceLink,
    status: s.status,
    scheduleType: typeMap[s.type] || 'other',
    completed: s.status === 'completed',
    completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
    completionNotes: s.completionNotes,
    googleCalendarId: s.googleCalendarId,
    syncStatus: s.syncStatus,
    createdAt: new Date(s.createdAt),
    updatedAt: s.updatedAt ? new Date(s.updatedAt) : undefined,
  };
}

// Map frontend ScheduleType to backend type
function toBackendType(type: ScheduleType | string): string {
  const map: Record<string, string> = {
    meeting: 'meeting', visit: 'visit', call: 'call', return_call: 'return_call',
    other: 'other', agenda_marcada: 'meeting', visita: 'visit', reuniao: 'meeting', retorno: 'return_call', outro: 'other',
  };
  return map[type] || 'other';
}

// Standalone store for non-hook usage
export const leadSchedulesStore = {
  subscribe: (_fn: () => void) => () => { },
  getSchedules: () => [] as LeadSchedule[],
  getScheduleForLead: (_leadId: string) => undefined as LeadSchedule | undefined,
  hasActiveSchedule: (_leadId: string) => false,
  getAllFutureSchedules: () => [] as LeadSchedule[],
  getFutureSchedulesForSeller: (_sellerName: string) => [] as LeadSchedule[],

  async createSchedule(data: any): Promise<LeadSchedule | null> {
    try {
      const res = await api.post('/schedules', {
        leadId: data.leadId,
        type: toBackendType(data.scheduleType || data.type || 'meeting'),
        title: data.summary || data.title || `Agenda: ${data.leadName || ''}`,
        description: data.description,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
        timezone: data.timeZone || data.timezone || 'America/Sao_Paulo',
        location: data.location,
        conferenceLink: data.conferenceLink,
        status: 'confirmed',
      });
      return mapSchedule(res.data);
    } catch (err) {
      console.error('Error creating schedule:', err);
      return null;
    }
  },

  async completeSchedule(scheduleId: string): Promise<boolean> {
    try {
      await api.patch(`/schedules/${scheduleId}/complete`, {});
      return true;
    } catch { return false; }
  },

  async cancelSchedule(scheduleId: string): Promise<boolean> {
    try {
      await api.patch(`/schedules/${scheduleId}/cancel`);
      return true;
    } catch { return false; }
  },

  async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      return true;
    } catch { return false; }
  },

  updateSchedule: async (scheduleId: string, data: any): Promise<boolean> => {
    try {
      await api.put(`/schedules/${scheduleId}`, data);
      return true;
    } catch { return false; }
  },

  upsertScheduleForLead: async (_leadId: string, data: any): Promise<LeadSchedule | null> => {
    return leadSchedulesStore.createSchedule(data);
  },

  // Sync stubs
  updateSyncStatus: (_id: string, _googleId: string) => true,
  markSyncError: (_id: string, _error: string) => true,
  getPendingSyncSchedules: () => [] as LeadSchedule[],
};

// React Hook - fetches from API
export function useLeadSchedules() {
  const [schedules, setSchedules] = useState<LeadSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const { userName, role } = useUserRole();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/schedules', {
        params: { limit: 100, status: undefined },
      });
      const data = res.data?.data || res.data || [];
      const mapped = (Array.isArray(data) ? data : []).map(mapSchedule);
      setSchedules(mapped);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Future schedules
  const futureSchedules = useMemo(() => {
    const now = new Date();
    return schedules
      .filter(s => !s.completed && s.status !== 'cancelled' && s.scheduledAt > now)
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }, [schedules]);

  const scheduleCount = futureSchedules.length;

  const getScheduleForLead = useCallback((leadId: string) => {
    const now = new Date();
    return schedules.find(s => s.leadId === leadId && !s.completed && s.status !== 'cancelled' && s.scheduledAt > now);
  }, [schedules]);

  const hasActiveSchedule = useCallback((leadId: string) => {
    return !!getScheduleForLead(leadId);
  }, [getScheduleForLead]);

  const createSchedule = useCallback(async (data: any) => {
    const result = await leadSchedulesStore.createSchedule(data);
    if (result) await fetchSchedules();
    return result;
  }, [fetchSchedules]);

  const upsertScheduleForLead = useCallback(async (_leadId: string, data: any) => {
    return createSchedule(data);
  }, [createSchedule]);

  const completeSchedule = useCallback(async (scheduleId: string) => {
    const result = await leadSchedulesStore.completeSchedule(scheduleId);
    if (result) await fetchSchedules();
    return result;
  }, [fetchSchedules]);

  const cancelSchedule = useCallback(async (scheduleId: string) => {
    const result = await leadSchedulesStore.cancelSchedule(scheduleId);
    if (result) await fetchSchedules();
    return result;
  }, [fetchSchedules]);

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    const result = await leadSchedulesStore.deleteSchedule(scheduleId);
    if (result) await fetchSchedules();
    return result;
  }, [fetchSchedules]);

  const hasScheduleConflict = useCallback((scheduledAt: Date, excludeScheduleId?: string) => {
    const targetTime = new Date(scheduledAt).getTime();
    const windowMs = 30 * 60 * 1000;
    return futureSchedules.some(schedule => {
      if (excludeScheduleId && schedule.id === excludeScheduleId) return false;
      return Math.abs(schedule.scheduledAt.getTime() - targetTime) < windowMs;
    });
  }, [futureSchedules]);

  const getGoogleCalendarPayload = useCallback((_scheduleId: string) => {
    return null; // To be implemented with Google Calendar integration
  }, []);

  const pendingSyncSchedules = useMemo(() => {
    return schedules.filter(s => s.syncStatus === 'pending');
  }, [schedules]);

  return {
    schedules: futureSchedules,
    scheduleCount,
    loading,
    getScheduleForLead,
    createSchedule,
    upsertScheduleForLead,
    completeSchedule,
    cancelSchedule,
    deleteSchedule,
    hasActiveSchedule,
    hasScheduleConflict,
    getGoogleCalendarPayload,
    pendingSyncSchedules,
    refreshSchedules: fetchSchedules,
  };
}

// Format schedule type for display
export function formatScheduleType(type: ScheduleType | string): string {
  const labels: Record<string, string> = {
    meeting: 'Reunião',
    visit: 'Visita',
    call: 'Ligação',
    return_call: 'Retorno',
    other: 'Outro',
    agenda_marcada: 'Agenda Marcada',
    visita: 'Visita',
    reuniao: 'Reunião',
    retorno: 'Retorno',
    outro: 'Outro',
  };
  return labels[type] || type;
}

// Google Calendar helpers preserved for future integration
export function toGoogleCalendarEvent(schedule: LeadSchedule): Record<string, unknown> {
  return {
    summary: schedule.summary || `Agenda: ${schedule.leadName}`,
    description: [
      schedule.description,
      `Lead: ${schedule.leadName}`,
      schedule.leadOrigin ? `Origem: ${schedule.leadOrigin}` : null,
      `Vendedor: ${schedule.sellerName}`,
      `Tipo: ${formatScheduleType(schedule.scheduleType)}`,
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: schedule.scheduledAt.toISOString(),
      timeZone: schedule.timezone || 'America/Sao_Paulo',
    },
    end: {
      dateTime: (schedule.endAt || new Date(schedule.scheduledAt.getTime() + 60 * 60 * 1000)).toISOString(),
      timeZone: schedule.timezone || 'America/Sao_Paulo',
    },
    status: schedule.status,
    location: schedule.location || undefined,
  };
}

export function fromGoogleCalendarEvent(
  event: Record<string, unknown>,
  leadId: string,
  leadName: string,
  sellerId: string,
  sellerName: string
): Partial<LeadSchedule> {
  const start = event.start as Record<string, string> | undefined;
  const end = event.end as Record<string, string> | undefined;
  return {
    googleCalendarId: event.id as string,
    summary: event.summary as string || '',
    description: event.description as string || '',
    scheduledAt: new Date(start?.dateTime || start?.date || ''),
    endAt: end ? new Date(end.dateTime || end.date || '') : undefined,
    timezone: start?.timeZone,
    location: event.location as string,
    status: (event.status as ScheduleStatus) || 'confirmed',
    syncStatus: 'synced',
    leadId,
    leadName,
    sellerId,
    sellerName,
  };
}
