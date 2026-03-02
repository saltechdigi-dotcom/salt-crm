// ==========================================
// SISTEMA DE ENTREGAS/SERVIÇOS PENDENTES
// Conectado à API real: /api/v1/deliveries
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { SaleStatus } from './sales-store';
import api from '@/lib/api';

export type SaleType = 'produto' | 'servico';
export type DeliveryStatus = 'immediate' | 'scheduled' | 'completed';

export interface PendingDelivery {
  id: string;
  saleId: string;
  saleType: SaleType;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  productName: string;
  productCode?: string;
  saleValue: number;
  saleStatus?: SaleStatus;
  deliveryStatus: DeliveryStatus;
  scheduledDate?: string;
  scheduledShift?: 'manha' | 'tarde' | 'noite' | 'personalizado';
  scheduledTime?: string;
  deliveryContact?: string;
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  sellerId: string;
  sellerName: string;
  seller?: { id: string; name: string };
  saleDate: string;
  createdAt: string;
  completedAt?: string;
  observations?: string;
  tenantId?: string;
}

export interface DeliveryKPIs {
  totalPending: number;
  totalCompleted: number;
  pendingProducts: number;
  pendingServices: number;
  todayCount: number;
  pendingValue: number;
}

// ==========================================
// API Functions
// ==========================================

async function fetchDeliveries(filters?: { status?: string; sellerId?: string }): Promise<PendingDelivery[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.sellerId) params.sellerId = filters.sellerId;
    const { data } = await api.get('/deliveries', { params });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[DeliveryStore] Error fetching deliveries:', error);
    return [];
  }
}

async function createDeliveryApi(delivery: Omit<PendingDelivery, 'id' | 'createdAt' | 'seller'>): Promise<PendingDelivery | null> {
  try {
    const { data } = await api.post('/deliveries', delivery);
    return data;
  } catch (error) {
    console.error('[DeliveryStore] Error creating delivery:', error);
    return null;
  }
}

async function updateDeliveryApi(id: string, updates: Partial<PendingDelivery>): Promise<PendingDelivery | null> {
  try {
    const { data } = await api.put(`/deliveries/${id}`, updates);
    return data;
  } catch (error) {
    console.error('[DeliveryStore] Error updating delivery:', error);
    return null;
  }
}

async function completeDeliveryApi(id: string): Promise<PendingDelivery | null> {
  try {
    const { data } = await api.patch(`/deliveries/${id}/complete`);
    return data;
  } catch (error) {
    console.error('[DeliveryStore] Error completing delivery:', error);
    return null;
  }
}

async function deleteDeliveryApi(id: string): Promise<boolean> {
  try {
    await api.delete(`/deliveries/${id}`);
    return true;
  } catch (error) {
    console.error('[DeliveryStore] Error deleting delivery:', error);
    return false;
  }
}

async function fetchDeliveryStats(): Promise<DeliveryKPIs> {
  try {
    const { data } = await api.get('/deliveries/stats');
    return data;
  } catch (error) {
    console.error('[DeliveryStore] Error fetching stats:', error);
    return { totalPending: 0, totalCompleted: 0, pendingProducts: 0, pendingServices: 0, todayCount: 0, pendingValue: 0 };
  }
}

// ==========================================
// Store Class
// ==========================================

class DeliveryStore {
  private deliveries: PendingDelivery[] = [];
  private listeners: Set<() => void> = new Set();
  private loaded = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getDeliveries() {
    return this.deliveries;
  }

  getPendingForSeller(sellerName: string): PendingDelivery[] {
    return this.deliveries
      .filter(d => d.sellerName === sellerName && d.deliveryStatus === 'scheduled')
      .sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
  }

  getAllPending(): PendingDelivery[] {
    return this.deliveries
      .filter(d => d.deliveryStatus === 'scheduled' || d.deliveryStatus === 'immediate')
      .sort((a, b) => {
        if (!a.scheduledDate || !b.scheduledDate) return 0;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
  }

  async loadDeliveries(filters?: { status?: string; sellerId?: string }) {
    this.deliveries = await fetchDeliveries(filters);
    this.loaded = true;
    this.notify();
  }

  async createDelivery(data: Omit<PendingDelivery, 'id' | 'createdAt' | 'seller'>): Promise<PendingDelivery | null> {
    const created = await createDeliveryApi(data);
    if (created) {
      this.deliveries.unshift(created);
      this.notify();
    }
    return created;
  }

  async completeDelivery(deliveryId: string): Promise<boolean> {
    const result = await completeDeliveryApi(deliveryId);
    if (result) {
      const idx = this.deliveries.findIndex(d => d.id === deliveryId);
      if (idx !== -1) this.deliveries[idx] = { ...this.deliveries[idx], deliveryStatus: 'completed', completedAt: new Date().toISOString() };
      this.notify();
      return true;
    }
    return false;
  }

  async updateDelivery(deliveryId: string, data: Partial<PendingDelivery>): Promise<boolean> {
    const result = await updateDeliveryApi(deliveryId, data);
    if (result) {
      const idx = this.deliveries.findIndex(d => d.id === deliveryId);
      if (idx !== -1) this.deliveries[idx] = { ...this.deliveries[idx], ...result };
      this.notify();
      return true;
    }
    return false;
  }

  async deleteDelivery(deliveryId: string): Promise<boolean> {
    const ok = await deleteDeliveryApi(deliveryId);
    if (ok) {
      this.deliveries = this.deliveries.filter(d => d.id !== deliveryId);
      this.notify();
      return true;
    }
    return false;
  }

  async getDeliveryKPIs(): Promise<DeliveryKPIs> {
    return fetchDeliveryStats();
  }
}

export const deliveryStore = new DeliveryStore();

// React Hook
export function usePendingDeliveries() {
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DeliveryKPIs>({
    totalPending: 0, totalCompleted: 0, pendingProducts: 0, pendingServices: 0, todayCount: 0, pendingValue: 0,
  });
  const { role, userName } = useUserRole();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      await deliveryStore.loadDeliveries();
      const stats = await deliveryStore.getDeliveryKPIs();
      if (!cancelled) {
        setKpis(stats);
        setLoading(false);
      }
    };

    load();
    const unsubscribe = deliveryStore.subscribe(() => {
      if (!cancelled) forceUpdate({});
    });

    return () => { cancelled = true; unsubscribe(); };
  }, []);

  const refreshKpis = useCallback(async () => {
    const stats = await deliveryStore.getDeliveryKPIs();
    setKpis(stats);
  }, []);

  // Role-based filtering
  const isManager = role === 'TENANT_ADMIN' || role === 'TENANT_GERENTE';
  const deliveries = isManager
    ? deliveryStore.getAllPending()
    : deliveryStore.getPendingForSeller(userName || '');

  return {
    deliveries,
    kpis,
    loading,
    refreshKpis,
    completeDelivery: (id: string) => deliveryStore.completeDelivery(id),
    updateDelivery: (id: string, data: Partial<PendingDelivery>) => deliveryStore.updateDelivery(id, data),
    deleteDelivery: (id: string) => deliveryStore.deleteDelivery(id),
    createDelivery: (data: Omit<PendingDelivery, 'id' | 'createdAt' | 'seller'>) => deliveryStore.createDelivery(data),
    loadDeliveries: (filters?: { status?: string }) => deliveryStore.loadDeliveries(filters),
  };
}

// Formatador de turno
export function formatShift(shift: PendingDelivery['scheduledShift']): string {
  const shifts: Record<string, string> = {
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
    personalizado: 'Personalizado',
  };
  return shift ? shifts[shift] || shift : '';
}

// Formatador de tipo de venda
export function formatSaleType(type: SaleType): string {
  return type === 'produto' ? 'Produto' : 'Serviço';
}
