// ==========================================
// SISTEMA DE VENDAS COM VALIDAÇÃO HIERÁRQUICA
// Conectado à API real: /api/v1/sales
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export type SaleStatus = 'pending_manager' | 'pending_admin' | 'validated' | 'rejected';

export type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'boleto' | 'other';
export type PaymentConditionType = 'cash' | 'installment';

// Dados do cliente na venda
export interface SaleClientData {
  name: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  phone: string;
  email: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface Sale {
  id: string;
  leadId?: string;
  leadName?: string;
  leadPhone?: string;

  // Dados do cliente
  clientName: string;
  clientDocument?: string;
  clientDocumentType?: 'cpf' | 'cnpj';
  clientPhone?: string;
  clientEmail?: string;
  client?: SaleClientData;

  // Dados da venda
  productName: string;
  productCode?: string;
  productDescription?: string;
  productId?: string;
  saleValue: number;
  discountValue?: number;
  saleDate?: string;
  paymentMethod: PaymentMethodType;
  paymentCondition?: PaymentConditionType;
  installments?: number;
  observations?: string;

  // Hierarquia
  agentId?: string;
  agentName?: string;
  agent?: { id: string; name: string; avatarUrl?: string };
  managerId?: string;
  managerName?: string;

  // Status de validação
  status: SaleStatus;

  // Timestamps
  createdAt: string;
  managerValidatedAt?: string;
  managerRejectedAt?: string;
  managerComment?: string;
  adminViewedAt?: string;

  // Metadados
  tenantId?: string;
}

export interface SaleNotification {
  id: string;
  saleId: string;
  type: 'sale_pending_validation' | 'sale_validated' | 'sale_rejected';
  title: string;
  message: string;
  targetRole: 'manager' | 'admin';
  targetUserId?: string;
  read: boolean;
  createdAt: string;
}

export interface SalesKPIs {
  totalValidatedSales: number;
  totalRevenue: number;
  pendingValidation: number;
  pendingRevenue: number;
  averageTicket: number;
}

// ==========================================
// API Functions
// ==========================================

async function fetchSales(filters?: { status?: string; startDate?: string; endDate?: string }): Promise<Sale[]> {
  try {
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;

    const { data } = await api.get('/sales', { params });
    // API may return paginated data or array
    return Array.isArray(data) ? data : (data.data || data.items || []);
  } catch (error) {
    console.error('[SalesStore] Error fetching sales:', error);
    return [];
  }
}

async function fetchSaleById(id: string): Promise<Sale | null> {
  try {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  } catch (error) {
    console.error('[SalesStore] Error fetching sale:', error);
    return null;
  }
}

async function createSaleApi(saleData: {
  leadId?: string;
  clientName: string;
  clientDocument?: string;
  clientDocumentType?: 'cpf' | 'cnpj';
  clientPhone?: string;
  clientEmail?: string;
  productId?: string;
  productName: string;
  productCode?: string;
  saleValue: number;
  discountValue?: number;
  paymentMethod: PaymentMethodType;
  paymentCondition?: PaymentConditionType;
  installments?: number;
  observations?: string;
}): Promise<Sale | null> {
  try {
    const { data } = await api.post('/sales', saleData);
    return data;
  } catch (error) {
    console.error('[SalesStore] Error creating sale:', error);
    return null;
  }
}

async function updateSaleStatusApi(
  saleId: string,
  status: SaleStatus,
  managerComment?: string
): Promise<Sale | null> {
  try {
    const { data } = await api.put(`/sales/${saleId}/status`, { status, managerComment });
    return data;
  } catch (error) {
    console.error('[SalesStore] Error updating sale status:', error);
    return null;
  }
}

async function fetchSalesStats(): Promise<SalesKPIs> {
  try {
    const { data } = await api.get('/sales/stats');
    return data;
  } catch (error) {
    console.error('[SalesStore] Error fetching stats:', error);
    return {
      totalValidatedSales: 0,
      totalRevenue: 0,
      pendingValidation: 0,
      pendingRevenue: 0,
      averageTicket: 0,
    };
  }
}

// ==========================================
// Singleton store for non-hook usage
// ==========================================

class SalesStore {
  private sales: Sale[] = [];
  private listeners: Set<() => void> = new Set();
  private loading = false;
  private loaded = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  isLoading() {
    return this.loading;
  }

  getSales() {
    return this.sales;
  }

  getSaleById(id: string) {
    return this.sales.find(s => s.id === id);
  }

  // Vendas pendentes para gerente validar
  getPendingSalesForManager(managerId: string) {
    return this.sales.filter(
      s => (s.managerId === managerId || s.agent?.id === managerId) && s.status === 'pending_manager'
    );
  }

  // Vendas validadas (para Admin ver)
  getValidatedSales() {
    return this.sales.filter(s => s.status === 'validated');
  }

  // Vendas pendentes de validação do gerente (para Admin acompanhar)
  getPendingManagerValidation() {
    return this.sales.filter(s => s.status === 'pending_manager');
  }

  // Buscar vendas da API
  async loadSales(filters?: { status?: string; startDate?: string; endDate?: string }) {
    this.loading = true;
    this.notify();

    const sales = await fetchSales(filters);
    this.sales = sales;
    this.loaded = true;
    this.loading = false;
    this.notify();
  }

  // Gerente valida a venda
  async validateSale(saleId: string, comment?: string): Promise<boolean> {
    const result = await updateSaleStatusApi(saleId, 'validated', comment);
    if (result) {
      // Update local cache
      const index = this.sales.findIndex(s => s.id === saleId);
      if (index !== -1) {
        this.sales[index] = { ...this.sales[index], ...result };
      }
      this.notify();
      return true;
    }
    return false;
  }

  // Gerente rejeita a venda
  async rejectSale(saleId: string, reason: string): Promise<boolean> {
    const result = await updateSaleStatusApi(saleId, 'rejected', reason);
    if (result) {
      const index = this.sales.findIndex(s => s.id === saleId);
      if (index !== -1) {
        this.sales[index] = { ...this.sales[index], ...result };
      }
      this.notify();
      return true;
    }
    return false;
  }

  // Registra nova venda
  async registerSale(saleData: {
    leadId?: string;
    clientName: string;
    clientDocument?: string;
    clientDocumentType?: 'cpf' | 'cnpj';
    clientPhone?: string;
    clientEmail?: string;
    productId?: string;
    productName: string;
    productCode?: string;
    saleValue: number;
    discountValue?: number;
    paymentMethod: PaymentMethodType;
    paymentCondition?: PaymentConditionType;
    installments?: number;
    observations?: string;
  }): Promise<Sale | null> {
    const newSale = await createSaleApi(saleData);
    if (newSale) {
      this.sales.unshift(newSale);
      this.notify();
    }
    return newSale;
  }

  // KPIs para Admin
  async getSalesKPIs(): Promise<SalesKPIs> {
    return fetchSalesStats();
  }

  // Notificações (agora tratadas pelo módulo de Notifications do backend)
  getUnreadSaleNotificationsCount(_role: 'manager' | 'admin', _userId?: string) {
    return 0; // Handled by notifications module
  }
}

export const salesStore = new SalesStore();

// ==========================================
// React Hook
// ==========================================

export function useSalesStore() {
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<SalesKPIs>({
    totalValidatedSales: 0,
    totalRevenue: 0,
    pendingValidation: 0,
    pendingRevenue: 0,
    averageTicket: 0,
  });

  // Load sales on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      await salesStore.loadSales();

      if (!cancelled) {
        setLoading(false);
      }
    };

    load();

    const unsubscribe = salesStore.subscribe(() => {
      if (!cancelled) forceUpdate({});
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Load KPIs
  const loadKpis = useCallback(async () => {
    const stats = await salesStore.getSalesKPIs();
    setKpis(stats);
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  return {
    // Data
    sales: salesStore.getSales(),
    loading,
    kpis,

    // Actions
    getSales: () => salesStore.getSales(),
    getSaleById: (id: string) => salesStore.getSaleById(id),
    getPendingSalesForManager: (managerId: string) => salesStore.getPendingSalesForManager(managerId),
    getValidatedSales: () => salesStore.getValidatedSales(),
    getPendingManagerValidation: () => salesStore.getPendingManagerValidation(),
    validateSale: (saleId: string, comment?: string) => salesStore.validateSale(saleId, comment),
    rejectSale: (saleId: string, reason: string) => salesStore.rejectSale(saleId, reason),
    registerSale: (data: Parameters<typeof salesStore.registerSale>[0]) => salesStore.registerSale(data),
    getSalesKPIs: () => salesStore.getSalesKPIs(),
    getUnreadSaleNotificationsCount: (role: 'manager' | 'admin', userId?: string) => salesStore.getUnreadSaleNotificationsCount(role, userId),
    loadSales: (filters?: { status?: string; startDate?: string; endDate?: string }) => salesStore.loadSales(filters),
    refreshKpis: loadKpis,

    // Legacy compat
    updateSale: (_saleId: string, _updates: Partial<Sale>) => {
      console.warn('[SalesStore] updateSale: use registerSale or validateSale/rejectSale instead');
      return false;
    },
    getNotificationsForManager: (_managerId: string) => [] as SaleNotification[],
    getNotificationsForAdmin: () => [] as SaleNotification[],
    markNotificationAsRead: (_notifId: string) => { },
    markSaleAsViewedByAdmin: (_saleId: string) => { },
  };
}
