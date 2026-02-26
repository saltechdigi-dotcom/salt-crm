// ==========================================
// ADMIN STORE - Super Admin Management
// ==========================================

import { useState, useEffect } from 'react';
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

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
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

  addTenant(tenant: Omit<Tenant, 'id'>) {
    const newTenant: Tenant = {
      ...tenant,
      id: `t-${Date.now()}`,
    };
    this.tenants.push(newTenant);
    this.updateDashboardKPIs();
    this.notify();
    return newTenant;
  }

  updateTenant(id: string, updates: Partial<Tenant>) {
    const index = this.tenants.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tenants[index] = { ...this.tenants[index], ...updates };
      this.updateDashboardKPIs();
      this.notify();
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

  deleteTenant(id: string) {
    const initialLength = this.tenants.length;
    this.tenants = this.tenants.filter(t => t.id !== id);
    this.updateDashboardKPIs();
    this.notify();
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

  resolveAlert(id: string, resolvedBy: string) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.status = 'resolvido';
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      this.updateDashboardKPIs();
      this.notify();
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
      disconnectedWhatsapps: this.tenants.filter(t => t.whatsappsConnected === 0).length,
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
        inProgress: this.tickets.filter(t => t.status === 'em_atendimento').length,
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

// React Hook
export function useAdminStore() {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = adminStore.subscribe(() => forceUpdate({}));
    return () => { unsubscribe(); };
  }, []);

  return adminStore;
}
