// Lead Demands Store - Manages demands/tasks created by managers for sellers on pinned leads
// Connected to /leads/:id/history API for persistence

import api from '@/lib/api';

export interface LeadDemand {
  id: string;
  leadId: string;
  createdBy: string; // Manager/Admin who created the demand
  assignedTo: string; // Seller who needs to resolve it
  message: string;
  createdAt: Date;
  resolvedAt?: Date;
  resolved: boolean;
}

// In-memory cache for demands (backed by lead history API)
let demands: LeadDemand[] = [];
let subscribers: (() => void)[] = [];
let _fetched = false;

const notifySubscribers = () => {
  subscribers.forEach(fn => fn());
};

export const leadDemandsStore = {
  // Fetch demands from API (reads lead history events of type 'demand')
  fetchDemands: async (leadIds: string[]): Promise<void> => {
    if (_fetched || leadIds.length === 0) return;
    _fetched = true;
    try {
      // Fetch history for leads and filter for demand-type events
      const results = await Promise.all(
        leadIds.slice(0, 20).map(leadId =>
          api.get(`/leads/${leadId}/history`).then(res => {
            const events = res.data?.data || res.data || [];
            return (Array.isArray(events) ? events : [])
              .filter((e: any) => e.eventType === 'contact_attempt' && e.title?.startsWith('Demanda:'))
              .map((e: any) => ({
                id: e.id || `demand-${Date.now()}-${Math.random()}`,
                leadId,
                createdBy: e.createdBy?.name || e.createdById || '',
                assignedTo: '',
                message: e.description || '',
                createdAt: new Date(e.createdAt || Date.now()),
                resolved: e.title?.includes('[RESOLVIDA]') || false,
                resolvedAt: e.title?.includes('[RESOLVIDA]') ? new Date(e.updatedAt || e.createdAt) : undefined,
              }));
          }).catch(() => [])
        )
      );
      const fetched = results.flat();
      // Merge with existing demands (keep local ones that aren't on server yet)
      const existingLocalIds = new Set(demands.filter(d => d.id.startsWith('demand_')).map(d => d.id));
      demands = [...demands.filter(d => existingLocalIds.has(d.id)), ...fetched];
      notifySubscribers();
    } catch (err) {
      console.error('LeadDemands: error fetching', err);
    }
  },

  // Get all demands
  getDemands: (): LeadDemand[] => [...demands],

  // Get pending (unresolved) demand for a lead
  getPendingDemandForLead: (leadId: string): LeadDemand | undefined => {
    return demands.find(d => d.leadId === leadId && !d.resolved);
  },

  // Check if a lead has a pending demand
  hasUnresolvedDemand: (leadId: string): boolean => {
    return demands.some(d => d.leadId === leadId && !d.resolved);
  },

  // Create a new demand (when manager/admin pins a lead for a seller)
  createDemand: (leadId: string, createdBy: string, assignedTo: string, message: string): LeadDemand => {
    const demand: LeadDemand = {
      id: `demand_${Date.now()}`,
      leadId,
      createdBy,
      assignedTo,
      message,
      createdAt: new Date(),
      resolved: false,
    };
    demands.push(demand);
    notifySubscribers();

    // Persist as lead history event
    api.post(`/leads/${leadId}/history`, {
      eventType: 'contact_attempt',
      title: `Demanda: ${message.substring(0, 50)}`,
      description: `Demanda criada por ${createdBy} para ${assignedTo}: ${message}`,
    }).catch(err => console.error('LeadDemands: error persisting demand', err));

    return demand;
  },

  // Resolve a demand (seller marks it as done)
  resolveDemand: (demandId: string): boolean => {
    const demand = demands.find(d => d.id === demandId);
    if (demand && !demand.resolved) {
      demand.resolved = true;
      demand.resolvedAt = new Date();
      notifySubscribers();

      // Persist resolution as history event
      api.post(`/leads/${demand.leadId}/history`, {
        eventType: 'contact_attempt',
        title: `Demanda: [RESOLVIDA] ${demand.message.substring(0, 40)}`,
        description: `Demanda resolvida: ${demand.message}`,
      }).catch(err => console.error('LeadDemands: error persisting resolve', err));

      return true;
    }
    return false;
  },

  // Resolve demand by lead ID (alternative method)
  resolveDemandForLead: (leadId: string): boolean => {
    const demand = demands.find(d => d.leadId === leadId && !d.resolved);
    if (demand) {
      demand.resolved = true;
      demand.resolvedAt = new Date();
      notifySubscribers();

      api.post(`/leads/${leadId}/history`, {
        eventType: 'contact_attempt',
        title: `Demanda: [RESOLVIDA] ${demand.message.substring(0, 40)}`,
        description: `Demanda resolvida: ${demand.message}`,
      }).catch(err => console.error('LeadDemands: error persisting resolve', err));

      return true;
    }
    return false;
  },

  // Subscribe to changes
  subscribe: (fn: () => void) => {
    subscribers.push(fn);
    return () => {
      subscribers = subscribers.filter(s => s !== fn);
    };
  },
};

// Hook for React components
import { useState, useEffect, useCallback } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

export function useLeadDemands() {
  const [, forceUpdate] = useState({});
  const { role, userName } = useUserRole();

  useEffect(() => {
    const unsubscribe = leadDemandsStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // Check if current user can pin leads (only Gerente and Admin)
  const canPinLeads = role === 'TENANT_ADMIN' || role === 'TENANT_GERENTE';

  // Check if current user is a seller
  const isSeller = role === 'TENANT_VENDEDOR';

  // Check if a seller can unpin a specific lead (only if demand is resolved)
  const canSellerUnpin = useCallback((leadId: string): boolean => {
    if (!isSeller) return true; // Non-sellers can always unpin
    return !leadDemandsStore.hasUnresolvedDemand(leadId);
  }, [isSeller]);

  // Get pending demand for a lead
  const getPendingDemand = useCallback((leadId: string) => {
    return leadDemandsStore.getPendingDemandForLead(leadId);
  }, []);

  // Create a demand when pinning
  const createDemandForPin = useCallback((leadId: string, assignedTo: string, message: string) => {
    return leadDemandsStore.createDemand(leadId, userName, assignedTo, message);
  }, [userName]);

  // Resolve a demand
  const resolveDemand = useCallback((leadId: string) => {
    return leadDemandsStore.resolveDemandForLead(leadId);
  }, []);

  return {
    canPinLeads,
    isSeller,
    canSellerUnpin,
    getPendingDemand,
    createDemandForPin,
    resolveDemand,
    hasUnresolvedDemand: leadDemandsStore.hasUnresolvedDemand,
  };
}

// Get unique products from leads for filter dropdown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getUniqueProducts(leads: any[]): string[] {
  const products = leads
    .map(l => l.produto)
    .filter((p): p is string => !!p && typeof p === 'string' && p.trim() !== '');
  return [...new Set(products)].sort();
}
