// ==========================================
// ADMIN STORE - Super Admin Management
// Connected to /super-admin and /superadmin APIs
// ==========================================

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  SuperAdminUser,
  Tenant,
  CriticalAlert,
  SupportTicket,
  DashboardKPIs,
  FinancialKPIs,
} from '@/lib/super-admin-types';

// Re-export types for convenience
export type {
  SuperAdminUser,
  SuperAdminRole,
  Tenant,
  TenantUser,
  TenantModule,
  WhatsAppConnection,
  PaymentHistory,
  CriticalAlert,
  SupportTicket,
  SupportPriority,
  SupportStatus,
  SupportType,
  OnboardingChecklist,
  ClientLifecycleStatus,
  DashboardKPIs,
  FinancialKPIs,
  ActivityType,
  LastActivity,
} from '@/lib/super-admin-types';

// Store class for Super Admin
class AdminStore {
  private superAdminUsers: SuperAdminUser[] = [];
  private tenants: Tenant[] = [];
  private alerts: CriticalAlert[] = [];
  private tickets: SupportTicket[] = [];
  private dashboardKPIs: DashboardKPIs = { totalTenants: 0, activeTenants: 0, overdueTenants: 0, suspendedTenants: 0, totalActiveUsers: 0, disconnectedWhatsapps: 0, criticalAlerts: 0 };
  private financialKPIs: FinancialKPIs = { mrr: 0, lastMonthRevenue: 0, currentMonthRevenue: 0, forecastedRevenue: 0, overdueAmount: 0, avgTicket: 0 };
  private listeners: Set<() => void> = new Set();
  private _fetched = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // ==========================================
  // DATA FETCHING FROM API
  // ==========================================
  async fetchAll() {
    if (this._fetched) return;
    this._fetched = true;
    await Promise.all([
      this.fetchTenants(),
      this.fetchDashboard(),
      this.fetchAlerts(),
    ]);
  }

  private async fetchTenants() {
    try {
      const res = await api.get('/superadmin/tenants');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        this.tenants = data.map(this.mapApiTenant);
        this.notify();
      }
    } catch (err) {
      console.error('AdminStore: error fetching tenants', err);
      // Try super-admin v2 endpoint
      try {
        const res = await api.get('/super-admin/tenants');
        const data = res.data?.data || res.data || [];
        if (Array.isArray(data)) {
          this.tenants = data.map(this.mapApiTenant);
          this.notify();
        }
      } catch { /* both failed, keep empty */ }
    }
  }

  private async fetchDashboard() {
    try {
      const res = await api.get('/super-admin/dashboard');
      const d = res.data;
      if (d) {
        this.dashboardKPIs = {
          totalTenants: d.tenants?.total || 0,
          activeTenants: d.tenants?.active || 0,
          overdueTenants: 0,
          suspendedTenants: d.tenants?.suspended || 0,
          totalActiveUsers: d.users || 0,
          disconnectedWhatsapps: 0,
          criticalAlerts: d.pendingAlerts || 0,
        };
        this.financialKPIs = {
          ...this.financialKPIs,
          mrr: Number(d.mrr) || 0,
        };
        this.notify();
      }
    } catch (err) {
      console.error('AdminStore: error fetching dashboard', err);
      // Fallback to legacy KPIs
      try {
        const res = await api.get('/superadmin/kpis');
        if (res.data) {
          this.dashboardKPIs = { ...this.dashboardKPIs, ...res.data };
          this.notify();
        }
      } catch { /* keep defaults */ }
    }
  }

  private async fetchAlerts() {
    try {
      const res = await api.get('/super-admin/alerts');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) {
        this.alerts = data.map((a: any) => ({
          id: a.id,
          type: a.type || 'error',
          tenantId: a.tenantId || '',
          tenantName: a.tenant?.name || '',
          message: a.errorMessage || '',
          status: a.status === 'resolved' ? 'resolvido' : 'pendente',
          createdAt: a.createdAt || '',
          resolvedBy: a.resolvedBy?.name,
          resolvedAt: a.resolvedAt,
        }));
        this.notify();
      }
    } catch (err) {
      console.error('AdminStore: error fetching alerts', err);
    }
  }

  private mapApiTenant(t: any): Tenant {
    return {
      id: t.id,
      name: t.name || '',
      slug: t.slug || '',
      email: t.email || '',
      phone: t.phone || '',
      document: t.document || '',
      plan: t.plan?.displayName || t.plan?.name || 'Free',
      status: t.status === 'active' ? 'ativa' : t.status === 'suspended' ? 'suspensa' : 'cancelada',
      lifecycleStatus: t.lifecycleStatus || 'onboarding',
      paymentStatus: t.paymentStatus === 'overdue' ? 'atraso' : 'em_dia',
      monthlyValue: Number(t.monthlyValue) || 0,
      usersActive: t._count?.users || 0,
      usersLimit: t.usersLimit || 3,
      leadsTotal: t._count?.leads || 0,
      salesTotal: t._count?.sales || 0,
      whatsappConnections: [],
      segment: t.segment || '',
      createdAt: t.createdAt || '',
      lastActivity: { type: 'login' as const, description: '', date: '' },
      onboarding: {
        adminCreated: true,
        additionalUsersCreated: (t._count?.users || 0) > 1,
        whatsappConnected: false,
        funnelConfigured: false,
        iaConfigured: false,
        firstLeadReceived: (t._count?.leads || 0) > 0,
        firstServiceDone: (t._count?.sales || 0) > 0,
      },
      paymentHistory: [],
      internalNotes: t.internalNotes || '',
    } as Tenant;
  }

  // ==========================================
  // SUPER ADMIN USERS
  // ==========================================
  getSuperAdminUsers() {
    return this.superAdminUsers;
  }

  getSuperAdminById(id: string) {
    return this.superAdminUsers.find(u => u.id === id);
  }

  addSuperAdminUser(user: Omit<SuperAdminUser, 'id'>) {
    const newUser: SuperAdminUser = {
      ...user,
      id: `sa-${Date.now()}`,
    };
    this.superAdminUsers.push(newUser);
    this.notify();
    return newUser;
  }

  updateSuperAdminUser(id: string, updates: Partial<SuperAdminUser>) {
    const index = this.superAdminUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      this.superAdminUsers[index] = { ...this.superAdminUsers[index], ...updates };
      this.notify();
      return this.superAdminUsers[index];
    }
    return null;
  }

  deleteSuperAdminUser(id: string) {
    const initialLength = this.superAdminUsers.length;
    this.superAdminUsers = this.superAdminUsers.filter(u => u.id !== id);
    this.notify();
    return this.superAdminUsers.length < initialLength;
  }

  // ==========================================
  // TENANTS
  // ==========================================
  getTenants() {
    return this.tenants;
  }

  getTenantById(id: string) {
    return this.tenants.find(t => t.id === id);
  }

  getActiveTenants() {
    return this.tenants.filter(t => t.status === 'ativa');
  }

  getOverdueTenants() {
    return this.tenants.filter(t => t.paymentStatus === 'atraso');
  }

  getSuspendedTenants() {
    return this.tenants.filter(t => t.status === 'suspensa');
  }

  getTenantsWithPendingOnboarding() {
    return this.tenants.filter(t => {
      const ob = t.onboarding;
      return !ob.adminCreated || !ob.additionalUsersCreated || !ob.whatsappConnected ||
        !ob.funnelConfigured || !ob.iaConfigured || !ob.firstLeadReceived || !ob.firstServiceDone;
    });
  }

  async addTenant(tenant: Omit<Tenant, 'id'>) {
    try {
      const res = await api.post('/super-admin/tenants', {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        document: tenant.document,
        segment: tenant.segment,
      });
      const newTenant: Tenant = {
        ...tenant,
        id: res.data?.id || `t-${Date.now()}`,
      };
      this.tenants.push(newTenant);
      this.updateDashboardKPIs();
      this.notify();
      return newTenant;
    } catch (err) {
      console.error('AdminStore: error creating tenant', err);
      const newTenant: Tenant = { ...tenant, id: `t-${Date.now()}` };
      this.tenants.push(newTenant);
      this.updateDashboardKPIs();
      this.notify();
      return newTenant;
    }
  }

  async updateTenant(id: string, updates: Partial<Tenant>) {
    const index = this.tenants.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tenants[index] = { ...this.tenants[index], ...updates };
      this.updateDashboardKPIs();
      this.notify();
      api.put(`/super-admin/tenants/${id}`, updates).catch(err =>
        console.error('AdminStore: error updating tenant', err)
      );
      return this.tenants[index];
    }
    return null;
  }

  updateTenantOnboarding(tenantId: string, key: keyof Tenant['onboarding'], value: boolean) {
    const tenant = this.tenants.find(t => t.id === tenantId);
    if (tenant) {
      tenant.onboarding[key] = value;
      this.notify();
      return tenant;
    }
    return null;
  }

  async deleteTenant(id: string) {
    const initialLength = this.tenants.length;
    this.tenants = this.tenants.filter(t => t.id !== id);
    this.updateDashboardKPIs();
    this.notify();
    api.delete(`/super-admin/tenants/${id}`).catch(err =>
      console.error('AdminStore: error deleting tenant', err)
    );
    return this.tenants.length < initialLength;
  }

  // ==========================================
  // ALERTS
  // ==========================================
  getAlerts() {
    return this.alerts;
  }

  getPendingAlerts() {
    return this.alerts.filter(a => a.status === 'pendente');
  }

  async resolveAlert(id: string, resolvedBy: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'resolvido';
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      this.updateDashboardKPIs();
      this.notify();
      api.patch(`/super-admin/alerts/${id}/resolve`, { resolutionNotes: `Resolved by ${resolvedBy}` })
        .catch(err => console.error('AdminStore: error resolving alert', err));
      return alert;
    }
    return null;
  }

  addAlert(alert: Omit<CriticalAlert, 'id'>) {
    const newAlert: CriticalAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
    };
    this.alerts.unshift(newAlert);
    this.updateDashboardKPIs();
    this.notify();
    return newAlert;
  }

  // ==========================================
  // SUPPORT TICKETS (Read-only - managed by support store)
  // ==========================================
  getTickets() {
    return this.tickets;
  }

  getOpenTickets() {
    return this.tickets.filter(t => t.status !== 'resolvido');
  }

  getCriticalTickets() {
    return this.tickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido');
  }

  // ==========================================
  // KPIs
  // ==========================================
  getDashboardKPIs(): DashboardKPIs {
    return this.dashboardKPIs;
  }

  getFinancialKPIs(): FinancialKPIs {
    return this.financialKPIs;
  }

  private updateDashboardKPIs() {
    this.dashboardKPIs = {
      totalTenants: this.tenants.length,
      activeTenants: this.tenants.filter(t => t.status === 'ativa').length,
      overdueTenants: this.tenants.filter(t => t.paymentStatus === 'atraso').length,
      suspendedTenants: this.tenants.filter(t => t.status === 'suspensa').length,
      totalActiveUsers: this.tenants.reduce((acc, t) => acc + t.usersActive, 0),
      disconnectedWhatsapps: this.tenants.filter(t => !t.whatsappConnections.some(w => w.status === 'conectado')).length,
      criticalAlerts: this.alerts.filter(a => a.status === 'pendente').length,
    };
  }

  // ==========================================
  // STATS
  // ==========================================
  getStats() {
    return {
      tenants: {
        total: this.tenants.length,
        active: this.tenants.filter(t => t.status === 'ativa').length,
        suspended: this.tenants.filter(t => t.status === 'suspensa').length,
        overdue: this.tenants.filter(t => t.paymentStatus === 'atraso').length,
        pendingOnboarding: this.getTenantsWithPendingOnboarding().length,
      },
      alerts: {
        total: this.alerts.length,
        pending: this.alerts.filter(a => a.status === 'pendente').length,
        resolved: this.alerts.filter(a => a.status === 'resolvido').length,
      },
      tickets: {
        total: this.tickets.length,
        open: this.tickets.filter(t => t.status === 'aberto').length,
        inProgress: this.tickets.filter(t => t.status === 'em_andamento').length,
        resolved: this.tickets.filter(t => t.status === 'resolvido').length,
        critical: this.tickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido').length,
      },
      users: {
        superAdmins: this.superAdminUsers.length,
        totalTenantUsers: this.tenants.reduce((acc, t) => acc + t.usersActive, 0),
      },
    };
  }
}

export const adminStore = new AdminStore();

// Auto-fetch on first use
adminStore.fetchAll();

// React Hook
export function useAdminStore() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = adminStore.subscribe(() => forceUpdate({}));
    // Trigger fetchAll when hook mounts
    adminStore.fetchAll();
    return () => { unsubscribe(); };
  }, []);

  return adminStore;
}
