import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, AlertTriangle, Wifi, WifiOff, DollarSign,
  TrendingUp, TrendingDown, CreditCard, Calendar, Receipt, Target,
  Search, Plus, Eye, LogIn, Ban, Play, X, ChevronRight, ChevronLeft, Settings, Trash2,
  MoreHorizontal, ArrowLeft, Shield, UserCog, Clock, CheckCircle,
  XCircle, CalendarClock, AlertCircle, Headphones, MessageCircle,
  Mail, Phone, Check, Circle, Activity, Crown, Pencil
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ResponsiveModal, ModalActions } from '@/components/ui/responsive-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import saltLogo from '@/assets/salt-logo.png';
import api from '@/lib/api';
import {
  nichePresets,
  availablePlans,
  legacyPlanMapping,
  lifecycleStatusLabels,
  activityTypeLabels,
  supportTypeLabels,
  supportPriorityLabels,
  type Tenant,
  type SuperAdminUser,
  type SuperAdminRole,
  type CriticalAlert,
  type ClientLifecycleStatus,
  type OnboardingChecklist,
  type PlanId,
} from '@/lib/super-admin-types';

// Fallback empty data to replace removed mocks
const mockTenants: any[] = [];
const mockSuperAdminUsers: any[] = [];
const mockCriticalAlerts: any[] = [];
const mockDashboardKPIs: any = { totalTenants: 0, activeTenants: 0, overdueTenants: 0, suspendedTenants: 0, totalActiveUsers: 0, disconnectedWhatsapps: 0, criticalAlerts: 0 };
const mockFinancialKPIs: any = { mrr: 0, lastMonthRevenue: 0, currentMonthRevenue: 0, forecastedRevenue: 0, overdueAmount: 0, avgTicket: 0 };
const mockCurrentSuperAdmin: any = { id: "", name: "Admin", email: "", role: "SUPER_ADMIN_MASTER", status: "ativo", lastLogin: "" };
import {
  NICHE_FUNNEL_PRESETS,
  FIXED_FUNNEL_STATUSES,
  generateTenantFunnel,
  type NicheId,
  type TenantFunnelConfig
} from '@/lib/niche-funnel-presets';
import { supportTicketsApi } from '@/stores/support';
import type { SupportTicket, SupportStatus } from '@/stores/support/support-tickets-store';
import { TenantPlanManager } from '@/components/super-admin/TenantPlanManager';
import { PlanManagementModal } from '@/components/super-admin/PlanManagementModal';
import { PlanType, FeatureFlags, PLAN_CONFIGS } from '@/lib/plan-features';
import { whatsappApi } from '@/stores/whatsapp/whatsapp-api';
// Actually, if UAZAPI returns base64 image, we use <img src="..." />.
// If it returns a string to be QR-encoded, we need a lib.
// Uazapi v2 usually returns base64 image string.
// If not, I might need to add qrcode.react to package.json, but let's assume base64 for now as per my backend code.

// Type for new tenant creation
export interface NewTenantData {
  name: string;
  nicheId: NicheId;
  planId: PlanId;
  funnelConfig: TenantFunnelConfig;
  periodicity?: 'monthly' | 'annual';
  userCount?: number;
  monthlyValue?: number;
  admin?: {
    name: string;
    email: string;
    password?: string;
  };
}

// Unified KPI Card Component - Enterprise Standard
const KPICard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'info';
  onClick?: () => void;
  active?: boolean;
  size?: 'default' | 'financial';
}> = ({ label, value, icon, trend, trendValue, variant = 'default', onClick, active, size = 'default' }) => {
  // Semantic color mapping - consistent across entire dashboard
  const variantStyles = {
    default: {
      bg: 'bg-card border-border/50',
      icon: 'text-muted-foreground',
      value: 'text-foreground'
    },
    success: {
      bg: 'bg-success/5 border-success/30',
      icon: 'text-success',
      value: 'text-success'
    },
    warning: {
      bg: 'bg-warning/5 border-warning/30',
      icon: 'text-warning',
      value: 'text-foreground'
    },
    destructive: {
      bg: 'bg-destructive/5 border-destructive/30',
      icon: 'text-destructive',
      value: 'text-destructive'
    },
    info: {
      bg: 'bg-primary/5 border-primary/30',
      icon: 'text-primary',
      value: 'text-foreground'
    },
  };

  const styles = variantStyles[variant];
  const isFinancial = size === 'financial';

  return (
    <div
      className={`
        rounded-xl border ${styles.bg}
        ${isFinancial ? 'p-4 min-h-[88px]' : 'p-3 min-h-[80px]'}
        flex flex-col justify-between
        ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.01] hover:border-primary/40' : ''}
        ${active ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/70 font-medium leading-tight">
          {label}
        </span>
        <div className={`${styles.icon} opacity-80`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between mt-auto">
        <span className={`${isFinancial ? 'text-lg' : 'text-xl'} font-semibold ${styles.value} leading-none`}>
          {value}
        </span>
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 text-[10px] font-medium ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Lifecycle Status Badge - Semantic Colors
const LifecycleStatusBadge: React.FC<{ status: ClientLifecycleStatus }> = ({ status }) => {
  const statusStyles: Record<ClientLifecycleStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    onboarding: { variant: 'secondary', className: 'bg-primary/10 text-primary border-primary/20' },
    active: { variant: 'default', className: 'bg-success/10 text-success border-success/20' },
    risk: { variant: 'destructive', className: 'bg-warning/10 text-warning border-warning/20' },
    overdue: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    suspended: { variant: 'destructive', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    cancelled: { variant: 'outline', className: 'bg-muted/50 text-muted-foreground border-border' },
  };

  const style = statusStyles[status];

  return (
    <Badge variant={style.variant} className={`text-[10px] font-medium border ${style.className}`}>
      {lifecycleStatusLabels[status]}
    </Badge>
  );
};

// Support Ticket Detail Modal
const SupportTicketDetailModal: React.FC<{
  ticket: SupportTicket | null;
  open: boolean;
  onClose: () => void;
  onResolve: (ticketId: string) => void;
  onAssign: (ticketId: string, assignedTo: string) => void;
  onUpdateStatus: (ticketId: string, status: SupportStatus) => void;
  availableAssignees: string[];
}> = ({ ticket, open, onClose, onResolve, onAssign, onUpdateStatus, availableAssignees }) => {
  if (!ticket) return null;

  const priorityColors: Record<string, string> = {
    baixa: 'text-muted-foreground bg-muted/50',
    media: 'text-warning bg-warning/10',
    alta: 'text-orange-500 bg-orange-500/10',
    critica: 'text-destructive bg-destructive/10',
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title="Detalhes do Chamado"
      size="default"
      showBackButton
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs">
            Fechar
          </Button>
          {ticket.status !== 'resolvido' && (
            <Button
              className="flex-1 sm:flex-none text-xs gap-1.5"
              onClick={() => {
                onResolve(ticket.id);
                onClose();
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolver
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Empresa</span>
            <p className="text-sm font-medium">{ticket.tenantName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Usuário</span>
            <p className="text-sm font-medium">{ticket.userName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Tipo</span>
            <Badge variant="secondary" className="text-[10px] mt-1 block w-fit">
              {supportTypeLabels[ticket.type]}
            </Badge>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Prioridade</span>
            <Badge className={`text-[10px] mt-1 block w-fit ${priorityColors[ticket.priority]}`}>
              {supportPriorityLabels[ticket.priority]}
            </Badge>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Descrição</span>
          <p className="text-sm mt-1 p-3 rounded-lg bg-muted/30 border">{ticket.description}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Status</span>
            <Select
              value={ticket.status}
              onValueChange={(v) => onUpdateStatus(ticket.id, v as SupportStatus)}
              disabled={ticket.status === 'resolvido'}
            >
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Responsável</span>
            <Select
              value={ticket.assignedTo || 'none'}
              onValueChange={(v) => onAssign(ticket.id, v === 'none' ? '' : v)}
              disabled={ticket.status === 'resolvido'}
            >
              <SelectTrigger className="h-10 text-sm mt-1">
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {availableAssignees.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Aberto em: {ticket.createdAt}
        </div>

        {ticket.status === 'resolvido' && ticket.resolvedAt && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-sm text-success">
              ✓ Resolvido por {ticket.resolvedBy} em {ticket.resolvedAt}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

// Support Panel Modal
const SupportPanelModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tickets: SupportTicket[];
  onResolve: (ticketId: string) => void;
  onSelectTenant: (tenantId: string) => void;
  onAssign: (ticketId: string, assignedTo: string) => void;
  onUpdateStatus: (ticketId: string, status: SupportStatus) => void;
  tenants: Tenant[];
  initialFilter?: 'all' | 'aberto' | 'critica';
}> = ({ open, onClose, tickets, onResolve, onSelectTenant, onAssign, onUpdateStatus, tenants, initialFilter = 'all' }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'aberto' | 'em_atendimento' | 'resolvido'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  React.useEffect(() => {
    if (open) {
      if (initialFilter === 'critica') {
        setFilterStatus('all');
        setFilterPriority('critica');
      } else if (initialFilter === 'aberto') {
        setFilterStatus('aberto');
        setFilterPriority('all');
      } else {
        setFilterStatus('all');
        setFilterPriority('all');
      }
    }
  }, [open, initialFilter]);

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const priorityColors: Record<string, string> = {
    baixa: 'text-muted-foreground',
    media: 'text-warning',
    alta: 'text-orange-500',
    critica: 'text-destructive',
  };

  const availableAssignees = ['João Silva', 'Maria Santos', 'Pedro Costa'];

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onClose}
        title="Central de Suporte"
        description={`${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''}`}
        size="xl"
        showBackButton
        footer={
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
        }
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full sm:w-32 h-10 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-32 h-10 text-sm">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile: Cards, Desktop: Table */}
        <div className="sm:hidden space-y-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="p-3 rounded-xl border bg-card"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{ticket.tenantName}</p>
                  <p className="text-xs text-muted-foreground">{ticket.userName}</p>
                </div>
                <Badge
                  variant={ticket.status === 'resolvido' ? 'default' : ticket.status === 'em_atendimento' ? 'secondary' : 'destructive'}
                  className="text-[10px]"
                >
                  {ticket.status === 'aberto' ? 'Aberto' : ticket.status === 'em_atendimento' ? 'Atendendo' : 'Resolvido'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="text-[9px]">{supportTypeLabels[ticket.type]}</Badge>
                <span className={priorityColors[ticket.priority]}>{supportPriorityLabels[ticket.priority]}</span>
                <span className="text-muted-foreground ml-auto">{ticket.createdAt}</span>
              </div>
            </div>
          ))}
          {filteredTickets.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum ticket encontrado.
            </div>
          )}
        </div>

        <div className="hidden sm:block rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Empresa</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Tipo</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Prioridade</th>
                <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
                <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="p-3">
                    <button
                      className="text-xs font-medium text-primary hover:underline text-left"
                      onClick={() => {
                        onClose();
                        onSelectTenant(ticket.tenantId);
                      }}
                    >
                      {ticket.tenantName}
                    </button>
                    <p className="text-[10px] text-muted-foreground">{ticket.userName}</p>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="text-[10px]">
                      {supportTypeLabels[ticket.type]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${priorityColors[ticket.priority]}`}>
                      {supportPriorityLabels[ticket.priority]}
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={ticket.status === 'resolvido' ? 'default' : ticket.status === 'em_atendimento' ? 'secondary' : 'destructive'}
                      className="text-[10px]"
                    >
                      {ticket.status === 'aberto' ? 'Aberto' : ticket.status === 'em_atendimento' ? 'Atendendo' : 'Resolvido'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {ticket.status !== 'resolvido' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-success hover:text-success"
                          onClick={() => onResolve(ticket.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Nenhum ticket encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ResponsiveModal>

      <SupportTicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onResolve={onResolve}
        onAssign={onAssign}
        onUpdateStatus={onUpdateStatus}
        availableAssignees={availableAssignees}
      />
    </>
  );
};

// Alert Detail Modal
const AlertDetailModal: React.FC<{
  alert: CriticalAlert | null;
  open: boolean;
  onClose: () => void;
  onResolve: (alertId: string) => void;
}> = ({ alert, open, onClose, onResolve }) => {
  if (!alert) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title="Detalhe do Alerta"
      size="sm"
      showBackButton
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs">
            Fechar
          </Button>
          {alert.status === 'pendente' && (
            <Button
              className="flex-1 sm:flex-none text-xs gap-1.5"
              onClick={() => {
                onResolve(alert.id);
                onClose();
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Resolver
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Empresa</span>
            <p className="text-sm font-medium">{alert.tenantName}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Fluxo</span>
            <p className="text-sm font-medium">{alert.flowName}</p>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Mensagem de Erro</span>
          <p className="text-sm text-destructive mt-1 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
            {alert.errorMessage}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{alert.occurredAt}</span>
          <Badge variant={alert.status === 'pendente' ? 'destructive' : 'default'} className="text-[10px]">
            {alert.status}
          </Badge>
        </div>
        {alert.status === 'resolvido' && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-sm text-success">
              ✓ Resolvido por {alert.resolvedBy} em {alert.resolvedAt}
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

// Alerts Panel Modal
const AlertsPanelModal: React.FC<{
  open: boolean;
  onClose: () => void;
  alerts: CriticalAlert[];
  onResolve: (alertId: string) => void;
}> = ({ open, onClose, alerts, onResolve }) => {
  const [selectedAlert, setSelectedAlert] = useState<CriticalAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'resolvido'>('all');

  const filteredAlerts = alerts.filter(a => filterStatus === 'all' || a.status === filterStatus);

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={onClose}
        title="Alertas Críticos (n8n)"
        size="lg"
        showBackButton
        footer={
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
        }
      >
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            className="text-xs flex-1 sm:flex-none"
            onClick={() => setFilterStatus('all')}
          >
            Todos ({alerts.length})
          </Button>
          <Button
            variant={filterStatus === 'pendente' ? 'destructive' : 'outline'}
            size="sm"
            className="text-xs flex-1 sm:flex-none"
            onClick={() => setFilterStatus('pendente')}
          >
            Pendentes ({alerts.filter(a => a.status === 'pendente').length})
          </Button>
          <Button
            variant={filterStatus === 'resolvido' ? 'default' : 'outline'}
            size="sm"
            className="text-xs flex-1 sm:flex-none"
            onClick={() => setFilterStatus('resolvido')}
          >
            Resolvidos ({alerts.filter(a => a.status === 'resolvido').length})
          </Button>
        </div>

        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${alert.status === 'pendente' ? 'bg-destructive/5 border-destructive/20' : 'bg-card'
                }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {alert.type === 'error' ? (
                      <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                    ) : alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{alert.tenantName}</span>
                    <Badge variant="secondary" className="text-[9px]">{alert.flowName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{alert.errorMessage}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{alert.occurredAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant={alert.status === 'pendente' ? 'destructive' : 'default'} className="text-[9px]">
                    {alert.status}
                  </Badge>
                  {alert.status === 'pendente' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve(alert.id);
                      }}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum alerta encontrado.
            </div>
          )}
        </div>
      </ResponsiveModal>

      <AlertDetailModal
        alert={selectedAlert}
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onResolve={onResolve}
      />
    </>
  );
};

// Users List Modal
const UsersListModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
}> = ({ open, onClose, tenants }) => {
  const allUsers = tenants.flatMap(tenant =>
    tenant.users
      .filter(u => u.status === 'ativo')
      .map(user => ({ ...user, tenantName: tenant.name }))
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title={`Usuários Ativos (${allUsers.length})`}
      size="lg"
      showBackButton
      footer={
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Fechar
        </Button>
      }
    >
      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-2">
        {allUsers.map((user) => (
          <div key={user.id} className="p-3 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{user.name}</p>
              <Badge variant="secondary" className="text-[9px] capitalize">{user.role}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{user.tenantName}</span>
              <span>{user.lastLogin}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Nome</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Email</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Empresa</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Papel</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Último Login</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((user) => (
              <tr key={user.id} className="border-t border-border/50">
                <td className="p-3 text-xs font-medium">{user.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{user.email}</td>
                <td className="p-3 text-xs">{user.tenantName}</td>
                <td className="p-3">
                  <Badge variant="secondary" className="text-[10px] capitalize">{user.role}</Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{user.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResponsiveModal>
  );
};

// WhatsApp Disconnected Modal
const WhatsAppDisconnectedModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
}> = ({ open, onClose, tenants, onSelectTenant }) => {
  const disconnectedList = tenants.flatMap(tenant =>
    (tenant.whatsappConnections || [])
      .filter(wa => wa.status === 'desconectado')
      .map(wa => ({ ...wa, tenantName: tenant.name, tenantId: tenant.id, tenant }))
  );

  const handleTenantClick = (tenant: Tenant) => {
    onClose();
    onSelectTenant(tenant);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title={`WhatsApps Desconectados (${disconnectedList.length})`}
      size="lg"
      showBackButton
      footer={
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Fechar
        </Button>
      }
    >
      {disconnectedList.length > 0 ? (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-2">
            {disconnectedList.map((wa) => (
              <div
                key={wa.id}
                className="p-3 rounded-xl border bg-card cursor-pointer hover:bg-muted/30"
                onClick={() => handleTenantClick(wa.tenant)}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-primary">{wa.tenantName}</p>
                  <Badge variant="secondary" className="text-[9px]">{wa.type}</Badge>
                </div>
                <p className="text-xs">{wa.number}</p>
                <p className="text-xs text-muted-foreground mt-1">{wa.lastActivity}</p>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Empresa</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Número</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Tipo</th>
                  <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Última Atividade</th>
                </tr>
              </thead>
              <tbody>
                {disconnectedList.map((wa) => (
                  <tr key={wa.id} className="border-t border-border/50 hover:bg-muted/20">
                    <td className="p-3">
                      <button
                        className="text-xs font-medium text-primary hover:underline cursor-pointer text-left"
                        onClick={() => handleTenantClick(wa.tenant)}
                      >
                        {wa.tenantName}
                      </button>
                    </td>
                    <td className="p-3 text-xs">{wa.number}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-[10px]">{wa.type}</Badge>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{wa.lastActivity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum WhatsApp desconectado. ✓
        </div>
      )}
    </ResponsiveModal>
  );
};

// Onboarding Pending Modal
const OnboardingPendingModal: React.FC<{
  open: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
}> = ({ open, onClose, tenants, onSelectTenant }) => {
  // Filtrar tenants com onboarding incompleto
  const pendingTenants = tenants.filter(tenant => {
    const hasIa = tenant.modules.some(m => m.name.includes('IA') && m.enabled);
    const items = [
      tenant.onboarding.adminCreated,
      tenant.onboarding.additionalUsersCreated,
      tenant.onboarding.whatsappConnected,
      tenant.onboarding.funnelConfigured,
      ...(hasIa ? [tenant.onboarding.iaConfigured] : []),
      tenant.onboarding.firstLeadReceived,
      tenant.onboarding.firstServiceDone,
    ];
    const completed = items.filter(Boolean).length;
    return completed < items.length;
  });

  const getOnboardingProgress = (tenant: Tenant) => {
    const hasIa = tenant.modules.some(m => m.name.includes('IA') && m.enabled);
    const items = [
      tenant.onboarding.adminCreated,
      tenant.onboarding.additionalUsersCreated,
      tenant.onboarding.whatsappConnected,
      tenant.onboarding.funnelConfigured,
      ...(hasIa ? [tenant.onboarding.iaConfigured] : []),
      tenant.onboarding.firstLeadReceived,
      tenant.onboarding.firstServiceDone,
    ];
    const completed = items.filter(Boolean).length;
    return Math.round((completed / items.length) * 100);
  };

  const handleTenantClick = (tenant: Tenant) => {
    onClose();
    onSelectTenant(tenant);
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title={`Onboarding Pendente (${pendingTenants.length})`}
      size="lg"
      showBackButton
      footer={
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Fechar
        </Button>
      }
    >
      {pendingTenants.length > 0 ? (
        <div className="space-y-3">
          {pendingTenants.map((tenant) => {
            const progress = getOnboardingProgress(tenant);
            const hasIa = tenant.modules.some(m => m.name.includes('IA') && m.enabled);

            return (
              <div
                key={tenant.id}
                className="p-3 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleTenantClick(tenant)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-medium block">{tenant.name}</span>
                      <span className="text-[10px] text-muted-foreground">{tenant.segment}</span>
                    </div>
                  </div>
                  <Badge
                    variant={progress >= 70 ? 'secondary' : progress >= 40 ? 'outline' : 'destructive'}
                    className="text-[9px]"
                  >
                    {progress}%
                  </Badge>
                </div>
                <Progress value={progress} className="h-1.5 mb-2" />
                <div className="flex flex-wrap gap-1">
                  {!tenant.onboarding.whatsappConnected && (
                    <Badge variant="outline" className="text-[9px] bg-muted/30">WhatsApp</Badge>
                  )}
                  {!tenant.onboarding.funnelConfigured && (
                    <Badge variant="outline" className="text-[9px] bg-muted/30">Funil</Badge>
                  )}
                  {hasIa && !tenant.onboarding.iaConfigured && (
                    <Badge variant="outline" className="text-[9px] bg-muted/30">IA</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Todas as empresas completaram o onboarding! 🎉
        </div>
      )}
    </ResponsiveModal>
  );
};

// Onboarding Checklist Component
const OnboardingChecklistBlock: React.FC<{
  checklist: OnboardingChecklist;
  onUpdate: (key: keyof OnboardingChecklist, value: boolean) => void;
  hasIa: boolean;
}> = ({ checklist, onUpdate, hasIa }) => {
  const items: { key: keyof OnboardingChecklist; label: string; showIf?: boolean }[] = [
    { key: 'adminCreated', label: 'Conta criada' },
    { key: 'additionalUsersCreated', label: 'Usuário admin criado' },
    { key: 'whatsappConnected', label: 'WhatsApp conectado' },
    { key: 'funnelConfigured', label: 'Funil configurado' },
    { key: 'iaConfigured', label: 'IA configurada', showIf: hasIa },
    { key: 'firstLeadReceived', label: 'Time criado' },
    { key: 'firstServiceDone', label: 'Primeiro atendimento realizado' },
  ];

  const visibleItems = items.filter(item => item.showIf !== false);
  const completed = visibleItems.filter(item => checklist[item.key]).length;
  const total = visibleItems.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">
          Checklist de Onboarding
        </span>
        <Badge variant={progress === 100 ? 'default' : progress >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">
          {progress}% completo
        </Badge>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onUpdate(item.key, !checklist[item.key])}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 w-full text-left transition-colors cursor-pointer"
          >
            <Checkbox
              checked={checklist[item.key]}
              onCheckedChange={(checked) => onUpdate(item.key, checked as boolean)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className={`text-sm ${checklist[item.key] ? 'line-through text-muted-foreground' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// WhatsApp Connect Modal
const WhatsAppConnectModal: React.FC<{
  open: boolean;
  onClose: () => void;
  connectionId?: string; // If connecting existing
  tenantId: string;
  onSuccess: () => void;
}> = ({ open, onClose, connectionId, tenantId, onSuccess }) => {
  const [step, setStep] = useState<'name' | 'qr'>('name');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedConnectionId, setGeneratedConnectionId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (connectionId) {
        setStep('qr');
        setGeneratedConnectionId(connectionId);
        fetchQrCode(connectionId);
        setName('');
        setPhone('');
      } else {
        setStep('name');
        setName('');
        setPhone('');
        setQrCode(null);
        setGeneratedConnectionId(null);
      }
    }
  }, [open, connectionId]);

  const fetchQrCode = async (id: string) => {
    try {
      setLoading(true);
      const data = await whatsappApi.connect(id);
      if (data.base64 || data.qrCode) {
        setQrCode(data.base64 || data.qrCode || '');
      } else {
        toast.error('QR Code não retornado pela API');
      }
    } catch (error) {
      toast.error('Erro ao buscar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name) return toast.error('Nome é obrigatório');

    try {
      setLoading(true);
      const data = await whatsappApi.createInstance(name, phone);
      // Backend returns the DB record usually, or at least the ID
      // My backend controller returns the created connection object
      if (data && data.id) {
        setGeneratedConnectionId(data.id);
        // Now connect
        await fetchQrCode(data.id);
        setStep('qr');
        onSuccess(); // To refresh list? Maybe wait.
      }
    } catch (error) {
      toast.error('Erro ao criar instância');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title={step === 'name' ? 'Nova Conexão WhatsApp' : 'Escanear QR Code'}
      size="sm"
      showBackButton={step === 'qr' && !connectionId} // Show back only if we created it just now
      onBack={() => setStep('name')}
      footer={
        <Button variant="outline" onClick={onClose} className="w-full">
          Fechar
        </Button>
      }
    >
      <div className="p-4 flex flex-col items-center justify-center min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : step === 'name' ? (
          <div className="w-full space-y-4">
            <div className="space-y-2">
              <Label>Nome da Conexão</Label>
              <Input
                placeholder="Ex: Comercial"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Número do WhatsApp <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Input
                placeholder="5511999999999"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">Apenas números, com código do país (55).</p>
            </div>
            <Button className="w-full" onClick={handleCreate}>
              Criar e Obter QR Code
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {qrCode ? (
              <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" className="w-64 h-64 border rounded-lg" />
            ) : (
              <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted/10">
                <p className="text-xs text-muted-foreground">QR Code indisponível</p>
              </div>
            )}
            <p className="text-sm text-center text-muted-foreground">
              Abra o WhatsApp no seu celular &gt; Configurações &gt; Aparelhos conectados &gt; Conectar aparelho
            </p>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

// Tenant Detail Modal
const TenantDetailModal: React.FC<{
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  isMaster: boolean;
  onEnterAsAdmin: (tenant: Tenant) => void;
  onUpdateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  onDeleteTenant: (tenantId: string) => void;
  supportTickets: SupportTicket[];
  onChangePlan: (tenantId: string, newPlan: PlanType) => void;
  onToggleFeatureOverride: (tenantId: string, featureKey: keyof FeatureFlags, enabled: boolean) => void;
}> = ({ tenant, open, onClose, isMaster, onEnterAsAdmin, onUpdateTenant, onDeleteTenant, supportTickets, onChangePlan, onToggleFeatureOverride }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editedNotes, setEditedNotes] = useState('');
  const [editedLifecycleStatus, setEditedLifecycleStatus] = useState<ClientLifecycleStatus>('active');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>(undefined);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword || newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    try {
      await api.post(`/superadmin/users/${resetPasswordUserId}/reset-password`, { newPassword });
      toast.success('Senha alterada com sucesso!');
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    }
  };

  const handleOpenConnect = (connId?: string) => {
    setSelectedConnectionId(connId);
    setConnectModalOpen(true);
  };

  React.useEffect(() => {
    if (tenant) {
      setEditedNotes(tenant.internalNotes);
      setEditedLifecycleStatus(tenant.lifecycleStatus);
    }
  }, [tenant]);

  if (!tenant) return null;

  const adminUser = tenant.users.find(u => u.role === 'admin');
  const tenantTickets = supportTickets.filter(t => t.tenantId === tenant.id);
  const hasIaModule = tenant.modules.some(m => m.name.includes('IA') && m.enabled);

  const handleOnboardingUpdate = (key: keyof OnboardingChecklist, value: boolean) => {
    onUpdateTenant(tenant.id, {
      onboarding: { ...tenant.onboarding, [key]: value }
    });
  };

  const handleSaveNotes = () => {
    onUpdateTenant(tenant.id, { internalNotes: editedNotes });
    toast.success('Notas salvas com sucesso');
  };

  const handleSaveLifecycleStatus = () => {
    onUpdateTenant(tenant.id, { lifecycleStatus: editedLifecycleStatus });
    toast.success('Status atualizado com sucesso');
  };

  const openWhatsApp = () => {
    if (adminUser?.phone) {
      const cleanPhone = adminUser.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else {
      toast.error('Telefone do admin não disponível');
    }
  };

  const openEmail = () => {
    if (adminUser?.email) {
      window.open(`mailto:${adminUser.email}`, '_blank');
    } else {
      toast.error('Email do admin não disponível');
    }
  };

  // Custom header component for tenant details
  const TenantHeader = () => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <span className="text-lg font-semibold">{tenant.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <LifecycleStatusBadge status={tenant.lifecycleStatus} />
            <span className="text-xs text-muted-foreground">{tenant.segment}</span>
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={openWhatsApp} title="WhatsApp do Admin">
          <MessageCircle className="w-4 h-4 text-success" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={openEmail} title="Email do Admin">
          <Mail className="w-4 h-4 text-primary" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onEnterAsAdmin(tenant)}
          title="Entrar como Admin"
        >
          <LogIn className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title={tenant.name}
      size="xl"
      showBackButton
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs">
            Fechar
          </Button>
          <Button
            variant="default"
            className="flex-1 sm:flex-none text-xs gap-1.5"
            onClick={() => onEnterAsAdmin(tenant)}
          >
            <LogIn className="w-3.5 h-3.5" />
            Entrar como Admin
          </Button>
        </>
      }
    >
      {/* Custom Header with Actions */}
      <div className="mb-4 pb-4 border-b">
        <TenantHeader />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="-mx-4 px-4 border-b">
          <TabsList className="h-auto bg-transparent p-0 flex flex-wrap gap-x-1 gap-y-1">
            <TabsTrigger value="overview" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Geral
            </TabsTrigger>
            <TabsTrigger value="plan" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Plano
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Onboarding
            </TabsTrigger>
            {isMaster && (
              <TabsTrigger value="financial" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
                Financeiro
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Usuários
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="usage" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Uso
            </TabsTrigger>
            <TabsTrigger value="support" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Suportes
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-[11px] px-2 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md">
              Notas
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-4">
          <TabsContent value="overview" className="m-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Status do Cliente</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Select value={editedLifecycleStatus} onValueChange={(v) => setEditedLifecycleStatus(v as ClientLifecycleStatus)}>
                      <SelectTrigger className="h-8 text-sm w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(lifecycleStatusLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-sm">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleSaveLifecycleStatus}>
                      Salvar
                    </Button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Plano</span>
                  <p className="text-sm font-medium">{tenant.plan}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Valor Mensal</span>
                  <p className="text-sm font-medium">R$ {tenant.monthlyValue.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Origem da Venda</span>
                  <p className="text-sm font-medium">{tenant.salesOrigin}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Última Atividade</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{activityTypeLabels[tenant.lastActivity.type]}</p>
                      <p className="text-xs text-muted-foreground">{tenant.lastActivity.occurredAt}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Último Pagamento</span>
                  <p className="text-sm font-medium">{tenant.lastPayment}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Próximo Vencimento</span>
                  <p className="text-sm font-medium">{tenant.nextDueDate}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Criado em</span>
                  <p className="text-sm font-medium">{tenant.createdAt}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="m-0">
            <TenantPlanManager
              tenantId={tenant.id}
              tenantName={tenant.name}
              currentPlan={(legacyPlanMapping[tenant.plan] || 'GROWTH') as PlanType}
              planHistory={[{ planType: (legacyPlanMapping[tenant.plan] || 'GROWTH') as PlanType, changedAt: tenant.createdAt, changedBy: 'Sistema' }]}
              onChangePlan={(newPlan) => onChangePlan(tenant.id, newPlan)}
              onToggleOverride={(featureKey, enabled) => onToggleFeatureOverride(tenant.id, featureKey, enabled)}
              isMaster={isMaster}
            />
          </TabsContent>

          <TabsContent value="onboarding" className="m-0">
            <OnboardingChecklistBlock
              checklist={tenant.onboarding}
              onUpdate={handleOnboardingUpdate}
              hasIa={hasIaModule}
            />
          </TabsContent>

          {isMaster && (
            <TabsContent value="financial" className="m-0 space-y-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Valor Mensal</span>
                  <p className="text-lg font-semibold mt-1">R$ {tenant.monthlyValue.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Método</span>
                  <p className="text-sm font-medium mt-1">{tenant.payments?.[0]?.method || '-'}</p>
                </div>
                <div className="p-3 rounded-xl border bg-card">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Status Pagamento</span>
                  <Badge variant={tenant.paymentStatus === 'em_dia' ? 'default' : 'destructive'} className="text-[10px] mt-1">
                    {tenant.paymentStatus === 'em_dia' ? 'Em dia' : 'Atraso'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Histórico de Cobranças</span>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Data</th>
                        <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Valor</th>
                        <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
                        <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Método</th>
                        <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenant.payments?.map((payment) => (
                        <tr key={payment.id} className="border-t border-border/50">
                          <td className="p-3 text-xs">{payment.date}</td>
                          <td className="p-3 text-xs font-medium">R$ {payment.amount.toLocaleString('pt-BR')}</td>
                          <td className="p-3">
                            <Badge variant={payment.status === 'pago' ? 'default' : 'destructive'} className="text-[10px]">
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{payment.method}</td>
                          <td className="p-3 text-right">
                            {payment.status !== 'pago' && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs">
                                Marcar Pago
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          )}

          <TabsContent value="users" className="m-0 space-y-4">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Nome</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Email</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Telefone</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Papel</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
                    <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Último Login</th>
                    <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.users?.map((user) => (
                    <tr key={user.id} className="border-t border-border/50">
                      <td className="p-3 text-xs font-medium">{user.name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{user.email}</td>
                      <td className="p-3 text-xs text-muted-foreground">{user.phone || '-'}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px] capitalize">{user.role}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{user.lastLogin}</td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => setResetPasswordUserId(user.id)}
                        >
                          Alterar Senha
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Dialog open={!!resetPasswordUserId} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Alterar Senha do Usuário</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo de 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" size="sm" onClick={() => setResetPasswordUserId(null)}>Cancelar</Button>
                  <Button size="sm" onClick={handleResetPassword}>Salvar Senha</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="whatsapp" className="m-0 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => handleOpenConnect()} className="gap-2">
                <Plus className="w-4 h-4" /> Whatsapp Qrcode
              </Button>
            </div>
            {tenant.whatsappConnections?.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Número</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Tipo</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Última Atividade</th>
                      <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.whatsappConnections?.map((wa) => (
                      <tr key={wa.id} className="border-t border-border/50">
                        <td className="p-3 text-xs font-medium">{wa.number || '-'}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">{wa.type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={wa.status === 'conectado' ? 'default' : 'destructive'} className="text-[10px] flex items-center gap-1 w-fit">
                            {wa.status === 'conectado' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            {wa.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{wa.lastActivity}</td>
                        <td className="p-3 text-right">
                          {wa.status !== 'conectado' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleOpenConnect(wa.id)}>
                              Conectar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma conexão WhatsApp configurada.
              </div>
            )}
          </TabsContent>

          <TabsContent value="usage" className="m-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-card">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Usuários Ativos Hoje</span>
                <p className="text-2xl font-semibold mt-1">{tenant.usageStats?.activeToday || 0}</p>
              </div>
              <div className="p-4 rounded-xl border bg-card">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Últimos 7 Dias</span>
                <p className="text-2xl font-semibold mt-1">{tenant.usageStats?.last7Days || 0}</p>
              </div>
              <div className="p-4 rounded-xl border bg-card">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Últimos 30 Dias</span>
                <p className="text-2xl font-semibold mt-1">{tenant.usageStats?.last30Days || 0}</p>
              </div>
              <div className="p-4 rounded-xl border bg-card">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Frequência Média</span>
                <p className="text-lg font-semibold mt-1">{tenant.usageStats?.avgFrequency || '-'}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Risco de Churn</span>
              <div className="mt-2">
                <Badge
                  variant={tenant.usageStats?.churnRisk === 'baixo' ? 'default' : tenant.usageStats?.churnRisk === 'medio' ? 'secondary' : 'destructive'}
                  className="text-xs capitalize"
                >
                  {tenant.usageStats?.churnRisk || 'Desconhecido'}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="m-0 space-y-4">
            {tenantTickets.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Tipo</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Prioridade</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Aberto em</th>
                      <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Resolvido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenantTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-t border-border/50">
                        <td className="p-3">
                          <Badge variant="secondary" className="text-[10px]">{supportTypeLabels[ticket.type]}</Badge>
                        </td>
                        <td className="p-3 text-xs">{supportPriorityLabels[ticket.priority]}</td>
                        <td className="p-3">
                          <Badge
                            variant={ticket.status === 'resolvido' ? 'default' : 'destructive'}
                            className="text-[10px]"
                          >
                            {ticket.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{ticket.createdAt}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {ticket.resolvedAt ? `${ticket.resolvedAt} por ${ticket.resolvedBy}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum ticket de suporte registrado.
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="m-0 space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Notas Internas SALT</span>
              <Textarea
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Registre observações, riscos, pendências comerciais..."
                className="mt-1.5 text-sm min-h-[200px]"
              />
              <Button size="sm" className="mt-3 text-xs" onClick={handleSaveNotes}>
                Salvar Notas
              </Button>
            </div>

            {/* Danger Zone - Delete Tenant */}
            {isMaster && (
              <div className="mt-6 pt-4 border-t border-destructive/30">
                <span className="text-[10px] uppercase tracking-widest text-destructive/70 font-semibold">Zona de Perigo</span>
                <p className="text-xs text-muted-foreground mt-1 mb-3">Ações irreversíveis para esta empresa.</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja DELETAR a empresa "${tenant?.name}"? Esta ação é IRREVERSÍVEL.`)) {
                      onDeleteTenant(tenant!.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Deletar Empresa Permanentemente
                </Button>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      <WhatsAppConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        connectionId={selectedConnectionId}
        tenantId={tenant.id}
        onSuccess={() => {
          // Optionally reload tenant data
          // onUpdateTenant(tenant.id, {}); // Trigger refresh if logic exists
          toast.success('Conexão iniciada. Verifique o status em instantes.');
        }}
      />
    </ResponsiveModal >
  );
};

// New Tenant Modal with Funnel Generation and Pricing Calculator
const NewTenantModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreateTenant: (data: NewTenantData) => void;
}> = ({ open, onClose, onCreateTenant }) => {
  const [formData, setFormData] = useState({
    name: '',
    segment: '',
    plan: '' as PlanId | '',
    periodicity: 'monthly' as 'monthly' | 'annual',
    userCount: 3,
    createAdmin: true,
    adminName: '',
    adminEmail: '',
  });

  const selectedNiche = formData.segment ? NICHE_FUNNEL_PRESETS[formData.segment as NicheId] : null;
  const selectedPlan = formData.plan ? availablePlans.find(p => p.id === formData.plan) : null;

  // Calculate monthly value based on plan, periodicity and user count
  const calculateMonthlyValue = (): number => {
    if (!selectedPlan) return 0;
    const pricePerUser = formData.periodicity === 'annual'
      ? selectedPlan.annualPricePerUser
      : selectedPlan.monthlyPricePerUser;
    return pricePerUser * formData.userCount;
  };

  // Get max users for selected plan
  const getMaxUsers = (): number => {
    if (!selectedPlan) return 3;
    return selectedPlan.maxUsers === 'unlimited' ? 999 : selectedPlan.maxUsers;
  };

  // Update user count when plan changes
  const handlePlanChange = (planId: PlanId) => {
    const plan = availablePlans.find(p => p.id === planId);
    const baseUsers = plan?.baseUsers || 3;
    setFormData({
      ...formData,
      plan: planId,
      userCount: Math.min(formData.userCount, plan?.maxUsers === 'unlimited' ? 999 : (plan?.maxUsers || 3)) || baseUsers
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.segment || !formData.plan) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.createAdmin && (!formData.adminName || !formData.adminEmail)) {
      toast.error('Preencha os dados do administrador');
      return;
    }

    // Generate funnel based on niche
    const funnelConfig = generateTenantFunnel(formData.segment as NicheId);

    onCreateTenant({
      name: formData.name,
      nicheId: formData.segment as NicheId,
      planId: formData.plan as PlanId,
      funnelConfig,
      periodicity: formData.periodicity,
      userCount: formData.userCount,
      monthlyValue: calculateMonthlyValue(),
      admin: formData.createAdmin ? {
        name: formData.adminName,
        email: formData.adminEmail,
      } : undefined,
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      segment: '',
      plan: '',
      periodicity: 'monthly',
      userCount: 3,
      createAdmin: true,
      adminName: '',
      adminEmail: ''
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}
      title="Nova Empresa"
      size="xl"
      showBackButton
      footer={
        <ModalActions
          onCancel={() => { resetForm(); onClose(); }}
          onConfirm={handleCreate}
          cancelLabel="Cancelar"
          confirmLabel="Criar Empresa"
        />
      }
    >
      <div className="space-y-4">
        {/* Nome da Empresa */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Nome da Empresa <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Imobiliária Premium"
            className="h-10 text-sm"
          />
        </div>

        {/* Segmento / Nicho */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Segmento / Nicho <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.segment} onValueChange={(v) => setFormData({ ...formData, segment: v })}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent>
              {nichePresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="text-sm">
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Preview do Funil - Aparece ao selecionar nicho - COMPACTO NO MOBILE */}
        {selectedNiche && (
          <div className="p-3 rounded-xl border bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">
                Funil: {selectedNiche.name}
              </span>
            </div>

            {/* Status Principais - Compacto */}
            <div className="flex flex-wrap gap-1.5">
              {FIXED_FUNNEL_STATUSES.slice(0, 3).map((status) => (
                <Badge key={status.id} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-card">
                  {status.label}
                </Badge>
              ))}
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
                +{FIXED_FUNNEL_STATUSES.length - 3} etapas
              </Badge>
              <Badge className="text-[9px] px-1.5 py-0.5 bg-success/10 text-success border-success/20">
                {selectedNiche.fechadoGanhoLabel}
              </Badge>
            </div>
          </div>
        )}

        {/* Plano Inicial */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Plano <span className="text-destructive">*</span>
          </Label>
          <Select value={formData.plan} onValueChange={(v) => handlePlanChange(v as PlanId)}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Selecione o plano" />
            </SelectTrigger>
            <SelectContent>
              {availablePlans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id} className="text-sm">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">R$ {plan.monthlyPricePerUser}/usuário</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Periodicidade e Usuários - Responsivo */}
        {formData.plan && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Periodicidade */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Periodicidade</Label>
              <Select
                value={formData.periodicity}
                onValueChange={(v: 'monthly' | 'annual') => setFormData({ ...formData, periodicity: v })}
              >
                <SelectTrigger className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual (desconto)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Número de Usuários */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Usuários
                {selectedPlan?.maxUsers !== 'unlimited' && (
                  <span className="text-muted-foreground/70 ml-1">(máx: {selectedPlan?.maxUsers})</span>
                )}
              </Label>
              <Input
                type="number"
                min={1}
                max={getMaxUsers()}
                value={formData.userCount}
                onChange={(e) => setFormData({
                  ...formData,
                  userCount: Math.min(Math.max(1, parseInt(e.target.value) || 1), getMaxUsers())
                })}
                className="h-10 text-sm"
              />
            </div>
          </div>
        )}

        {/* Valor Calculado - Compacto */}
        {formData.plan && (
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Valor Mensal</p>
                <p className="text-xs text-muted-foreground">
                  {formData.userCount} × R$ {
                    formData.periodicity === 'annual'
                      ? selectedPlan?.annualPricePerUser.toLocaleString('pt-BR')
                      : selectedPlan?.monthlyPricePerUser.toLocaleString('pt-BR')
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">
                  R$ {calculateMonthlyValue().toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Admin */}
        <div className="flex items-center gap-2 pt-1">
          <Switch
            checked={formData.createAdmin}
            onCheckedChange={(v) => setFormData({ ...formData, createAdmin: v })}
          />
          <Label className="text-sm">Criar usuário Admin</Label>
        </div>

        {/* Campos do Admin */}
        {formData.createAdmin && (
          <div className="space-y-3 pl-3 border-l-2 border-primary/20">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Nome do Admin <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="Nome completo"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Email do Admin <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="email@empresa.com"
                className="h-10 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};


// Internal Users Modal
const InternalUsersModal: React.FC<{
  open: boolean;
  onClose: () => void;
  users: SuperAdminUser[];
  isMaster: boolean;
  onUpdateUser: (user: SuperAdminUser) => void;
  onAddUser: (user: Omit<SuperAdminUser, 'id' | 'lastLogin'>) => void;
}> = ({ open, onClose, users, isMaster, onUpdateUser, onAddUser }) => {
  const [editingUser, setEditingUser] = useState<SuperAdminUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SUPER_ADMIN_OPERACIONAL' as SuperAdminRole,
    status: 'ativo' as 'ativo' | 'inativo',
  });

  const handleOpenEdit = (user: SuperAdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  };

  const handleOpenCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      email: '',
      role: 'SUPER_ADMIN_OPERACIONAL',
      status: 'ativo',
    });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    onUpdateUser({
      ...editingUser,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    });
    setEditingUser(null);
    toast.success('Usuário atualizado com sucesso!');
  };

  const handleSaveCreate = () => {
    if (!formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const normalizedEmail = formData.email.trim().toLowerCase();
    const emailExists = users.some(
      (user) => user.email.trim().toLowerCase() === normalizedEmail,
    );
    if (emailExists) {
      toast.error('Já existe um usuário com esse e-mail');
      return;
    }
    onAddUser({
      name: formData.name,
      email: formData.email.trim(),
      role: formData.role,
      status: formData.status,
    });
    setIsCreating(false);
    toast.success('Usuário criado com sucesso!');
  };

  const handleCloseForm = () => {
    setEditingUser(null);
    setIsCreating(false);
  };

  // Form Modal for Edit/Create
  if (editingUser || isCreating) {
    return (
      <ResponsiveModal
        open={open}
        onOpenChange={() => {
          handleCloseForm();
          onClose();
        }}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        size="default"
        showBackButton
        onBack={handleCloseForm}
        footer={
          <>
            <Button variant="outline" onClick={handleCloseForm} className="flex-1 sm:flex-none text-xs">
              Cancelar
            </Button>
            <Button
              onClick={editingUser ? handleSaveEdit : handleSaveCreate}
              className="flex-1 sm:flex-none text-xs"
            >
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Nome *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome completo"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">E-mail *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@salt.com.br"
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Papel</Label>
            <Select
              value={formData.role}
              onValueChange={(value: SuperAdminRole) => setFormData({ ...formData, role: value })}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN_MASTER" className="text-sm">Master</SelectItem>
                <SelectItem value="SUPER_ADMIN_OPERACIONAL" className="text-sm">Operacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo" className="text-sm">Ativo</SelectItem>
                <SelectItem value="inativo" className="text-sm">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ResponsiveModal>
    );
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onClose}
      title="Gestão Interna SALT"
      size="lg"
      showBackButton
      footer={
        <>
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-xs">
            Fechar
          </Button>
          {isMaster && (
            <Button onClick={handleOpenCreate} className="flex-1 sm:flex-none text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Novo Usuário
            </Button>
          )}
        </>
      }
    >
      {/* Mobile: Cards */}
      <div className="sm:hidden space-y-2">
        {users.map((user) => (
          <div key={user.id} className="p-3 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium">{user.name}</p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={user.role === 'SUPER_ADMIN_MASTER' ? 'default' : 'secondary'}
                  className="text-[9px]"
                >
                  {user.role === 'SUPER_ADMIN_MASTER' ? 'Master' : 'Operacional'}
                </Badge>
                {isMaster && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(user)} className="text-xs">
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <div className="flex items-center justify-between mt-2 text-xs">
              <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'} className="text-[9px]">
                {user.status}
              </Badge>
              <span className="text-muted-foreground">{user.lastLogin}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Nome</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Email</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Papel</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Status</th>
              <th className="text-left p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Último Login</th>
              {isMaster && (
                <th className="text-right p-3 text-[10px] uppercase tracking-widest text-muted-foreground/70 font-medium">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-border/50">
                <td className="p-3 text-xs font-medium">{user.name}</td>
                <td className="p-3 text-xs text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <Badge
                    variant={user.role === 'SUPER_ADMIN_MASTER' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {user.role === 'SUPER_ADMIN_MASTER' ? 'Master' : 'Operacional'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge variant={user.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">
                    {user.status}
                  </Badge>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{user.lastLogin}</td>
                {isMaster && (
                  <td className="p-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(user)} className="text-xs">
                          <Settings className="w-3.5 h-3.5 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ResponsiveModal>
  );
};

// KPI Filter Types
type KPIFilter = 'all' | 'ativas' | 'inadimplentes' | 'suspensas' | 'dueSoon' | 'overdue' | 'onboarding' | 'onboarding_pending' | 'risco' | null;

// Main Super Admin Page
const SuperAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [showInternalUsersModal, setShowInternalUsersModal] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [showUsersListModal, setShowUsersListModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSupportPanel, setShowSupportPanel] = useState(false);
  const [showPlanManagementModal, setShowPlanManagementModal] = useState(false);
  const [showOnboardingPendingModal, setShowOnboardingPendingModal] = useState(false);
  const [supportPanelFilter, setSupportPanelFilter] = useState<'all' | 'aberto' | 'critica'>('all');
  const [kpiFilter, setKpiFilter] = useState<KPIFilter>(null);

  // State for tenants, alerts, internal users
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>(mockCriticalAlerts);
  const [internalUsers, setInternalUsers] = useState<SuperAdminUser[]>(mockSuperAdminUsers);
  const [dashboardKPIs, setDashboardKPIs] = useState(mockDashboardKPIs);
  const [financialKPIs, setFinancialKPIs] = useState(mockFinancialKPIs);
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);

  // Support tickets from shared store
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(supportTicketsApi.getAll());

  // Fetch real data from backend API
  useEffect(() => {
    // Fetch tenants
    api.get('/superadmin/tenants')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setTenants(data);
      })
      .catch(err => {
        console.error('Error fetching tenants:', err);
        setTenants(mockTenants); // Fallback to mock
      })
      .finally(() => setIsLoadingTenants(false));

    // Fetch KPIs
    api.get('/superadmin/kpis')
      .then(res => {
        if (res.data?.dashboard) setDashboardKPIs(res.data.dashboard);
        if (res.data?.financial) setFinancialKPIs(res.data.financial);
      })
      .catch(err => {
        console.error('Error fetching KPIs:', err);
      });
  }, []);

  // Subscribe to support tickets changes
  useEffect(() => {
    const unsubscribe = supportTicketsApi.subscribe(() => {
      setSupportTickets(supportTicketsApi.getAll());
    });
    return unsubscribe;
  }, []);

  // Check if current user is Master - read from session storage
  const session = JSON.parse(localStorage.getItem('salt_session') || '{}');
  const isMaster = session.role === 'SUPER_ADMIN_MASTER';
  const currentUserName = session.name || 'Operador';

  // Calculate tenants due in next 10 days and overdue
  const tenantsDueSoon = useMemo(() => {
    return tenants.filter(t => {
      if (!t.nextDueDate) return false;
      try {
        const dateStr = typeof t.nextDueDate === 'string' && t.nextDueDate.includes('/')
          ? t.nextDueDate.split('/').reverse().join('-')
          : t.nextDueDate;
        const dueDate = new Date(dateStr);
        if (isNaN(dueDate.getTime())) return false;
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 10 && t.paymentStatus === 'em_dia';
      } catch {
        return false;
      }
    });
  }, [tenants]);

  const tenantsOverdue = useMemo(() => {
    return tenants.filter(t => t.paymentStatus === 'atraso');
  }, [tenants]);

  const openSupportTickets = useMemo(() => {
    return supportTickets.filter(t => t.status !== 'resolvido').length;
  }, [supportTickets]);

  const criticalSupportTickets = useMemo(() => {
    return supportTickets.filter(t => t.priority === 'critica' && t.status !== 'resolvido').length;
  }, [supportTickets]);

  const onboardingPendingCount = useMemo(() => {
    return tenants.filter(tenant => {
      const hasIa = tenant.modules.some(m => m.name.includes('IA') && m.enabled);
      const items = [
        tenant.onboarding.adminCreated,
        tenant.onboarding.additionalUsersCreated,
        tenant.onboarding.whatsappConnected,
        tenant.onboarding.funnelConfigured,
        ...(hasIa ? [tenant.onboarding.iaConfigured] : []),
        tenant.onboarding.firstLeadReceived,
        tenant.onboarding.firstServiceDone,
      ];
      const completed = items.filter(Boolean).length;
      return completed < items.length;
    }).length;
  }, [tenants]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filtered tenants
  const filteredTenants = useMemo(() => {
    let filtered = tenants.filter((tenant) => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.segment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesPlan = planFilter === 'all' || tenant.plan.toLowerCase() === planFilter;
      const matchesPayment = paymentFilter === 'all' ||
        (paymentFilter === 'em_dia' && tenant.paymentStatus === 'em_dia') ||
        (paymentFilter === 'atraso' && tenant.paymentStatus === 'atraso');
      const matchesLifecycle = lifecycleFilter === 'all' || tenant.lifecycleStatus === lifecycleFilter;
      return matchesSearch && matchesStatus && matchesPlan && matchesPayment && matchesLifecycle;
    });

    // Apply KPI filter
    if (kpiFilter === 'ativas') {
      filtered = filtered.filter(t => t.status === 'ativa');
    } else if (kpiFilter === 'inadimplentes') {
      filtered = filtered.filter(t => t.paymentStatus === 'atraso');
    } else if (kpiFilter === 'suspensas') {
      filtered = filtered.filter(t => t.status === 'suspensa');
    } else if (kpiFilter === 'dueSoon') {
      filtered = tenantsDueSoon;
    } else if (kpiFilter === 'overdue') {
      filtered = tenantsOverdue;
    } else if (kpiFilter === 'onboarding') {
      filtered = filtered.filter(t => t.lifecycleStatus === 'onboarding');
    } else if (kpiFilter === 'onboarding_pending') {
      filtered = filtered.filter(tenant => {
        const hasIa = tenant.modules.some(m => m.name.includes('IA') && m.enabled);
        const items = [
          tenant.onboarding.adminCreated,
          tenant.onboarding.additionalUsersCreated,
          tenant.onboarding.whatsappConnected,
          tenant.onboarding.funnelConfigured,
          ...(hasIa ? [tenant.onboarding.iaConfigured] : []),
          tenant.onboarding.firstLeadReceived,
          tenant.onboarding.firstServiceDone,
        ];
        const completed = items.filter(Boolean).length;
        return completed < items.length;
      });
    } else if (kpiFilter === 'risco') {
      filtered = filtered.filter(t => t.lifecycleStatus === 'risk');
    }

    return filtered;
  }, [searchTerm, statusFilter, planFilter, paymentFilter, lifecycleFilter, tenants, kpiFilter, tenantsDueSoon, tenantsOverdue]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter, paymentFilter, lifecycleFilter, kpiFilter]);

  // Paginated tenants
  const totalPages = Math.ceil(filteredTenants.length / pageSize);
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, currentPage, pageSize]);

  const handleLogout = () => {
    localStorage.removeItem('salt_session');
    navigate('/login');
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? {
          ...alert,
          status: 'resolvido' as const,
          resolvedBy: currentUserName,
          resolvedAt: new Date().toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).replace(',', '')
        }
        : alert
    ));
    toast.success('Alerta marcado como resolvido');
  };

  const handleResolveSupportTicket = (ticketId: string) => {
    const resolvedAt = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');

    supportTicketsApi.update(ticketId, {
      status: 'resolvido',
      resolvedBy: currentUserName,
      resolvedAt
    });
    toast.success('Ticket marcado como resolvido');
  };

  const handleAssignTicket = (ticketId: string, assignedTo: string) => {
    supportTicketsApi.update(ticketId, { assignedTo: assignedTo || undefined });
    toast.success(assignedTo ? `Ticket atribuído a ${assignedTo}` : 'Responsável removido');
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportStatus) => {
    const updates: Partial<SupportTicket> = { status };

    if (status === 'resolvido') {
      updates.resolvedBy = currentUserName;
      updates.resolvedAt = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', '');
    }

    supportTicketsApi.update(ticketId, updates);
    toast.success('Status atualizado');
  };

  const handleToggleTenantStatus = async (tenantId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'ativa' ? 'suspend' : 'activate';
      await api.post(`/superadmin/tenants/${tenantId}/${action}`);
      setTenants(prev => prev.map(tenant => {
        if (tenant.id === tenantId) {
          const newStatus = currentStatus === 'ativa' ? 'suspensa' : 'ativa';
          return { ...tenant, status: newStatus as 'ativa' | 'suspensa' | 'cancelada' };
        }
        return tenant;
      }));
      toast.success(`Empresa ${currentStatus === 'ativa' ? 'suspensa' : 'ativada'} com sucesso`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao alterar status da empresa');
    }
  };

  const handleEnterAsAdmin = async (tenant: Tenant) => {
    try {
      toast.success(`Entrando como admin em ${tenant.name}...`);
      const res = await api.post(`/superadmin/impersonate/${tenant.id}`);
      const data = res.data;

      // Map backend role to frontend role
      const roleMap: Record<string, string> = {
        master: 'SUPER_ADMIN_MASTER',
        admin: 'TENANT_ADMIN',
        manager: 'TENANT_GERENTE',
        agent: 'TENANT_VENDEDOR',
        super_admin: 'SUPER_ADMIN_MASTER',
      };
      const frontendRole = roleMap[data.user?.role] || 'TENANT_ADMIN';

      const companySettings = {
        name: data?.tenant?.name || tenant.name,
        logoUrl: data?.tenant?.logoUrl || null,
        primaryColor: data?.tenant?.primaryColor || '#5B8DEF',
      };

      // Set tokens and mark as tenant user type (impersonating a tenant)
      localStorage.setItem('salt_token', data.access_token);
      localStorage.setItem('salt_refresh_token', data.refresh_token);
      localStorage.setItem('salt_user_type', 'tenant');
      localStorage.setItem('salt_session', JSON.stringify({
        id: data?.user?.id || data?.user?.email || 'current-user',
        email: data.user.email,
        loggedIn: true,
        role: frontendRole,
        name: data.user.name,
        tenantId: tenant.id,
        tenantName: tenant.name,
      }));
      localStorage.setItem('salt_company_settings', JSON.stringify(companySettings));
      localStorage.removeItem('salt_user_profile');

      window.location.href = '/home';
    } catch (error: any) {
      console.error('Impersonation error:', error);
      toast.error(error.response?.data?.message || 'Erro ao personificar empresa');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    try {
      await api.delete(`/superadmin/tenants/${tenantId}`);
      setTenants(prev => prev.filter(t => t.id !== tenantId));
      setSelectedTenant(null);
      toast.success('Empresa deletada com sucesso');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao deletar empresa');
    }
  };

  const handleCreateTenant = async (data: NewTenantData) => {
    try {
      const payload = {
        name: data.name,
        email: data.admin?.email || 'admin@' + data.name.toLowerCase().replace(/\s/g, '').replace(/[^\w]/g, '') + '.com',
        phone: '', // Not in UI
        planId: data.planId && data.planId.length === 36 ? data.planId : undefined,
        monthlyValue: Number(data.monthlyValue),
        usersLimit: Number(data.userCount),
        segment: data.nicheId,
        adminName: data.admin?.name || 'Admin',
        adminEmail: data.admin?.email || 'admin@' + data.name.toLowerCase().replace(/\s/g, '').replace(/[^\w]/g, '') + '.com',
        adminPassword: data.admin?.password || 'salt@123',
      };

      const res = await api.post('/superadmin/tenants', payload);
      setTenants(prev => [res.data, ...prev]);
      toast.success(`Empresa "${data.name}" criada com sucesso!`);
      setShowNewTenantModal(false);
    } catch (error: any) {
      console.error('Payload enviado:', {
        name: data.name,
        email: data.admin?.email || 'admin@' + data.name.toLowerCase().replace(/\s/g, '').replace(/[^\w]/g, '') + '.com',
        phone: '',
        planId: data.planId && data.planId.length === 36 ? data.planId : undefined,
        monthlyValue: Number(data.monthlyValue),
        usersLimit: Number(data.userCount),
        segment: data.nicheId,
        adminName: data.admin?.name || 'Admin',
        adminEmail: data.admin?.email || 'admin@' + data.name.toLowerCase().replace(/\s/g, '').replace(/[^\w]/g, '') + '.com',
        adminPassword: data.admin?.password || 'salt@123',
      });
      console.error('Erro backend detalhado:', error.response?.data);

      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || 'Erro ao criar empresa';

      const errorDetails = error.response?.data?.error?.details;
      if (errorDetails) {
        toast.error(`${errorMessage}: ${JSON.stringify(errorDetails)}`);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleUpdateTenant = async (tenantId: string, updates: Partial<Tenant>) => {
    try {
      const payload: any = {};
      if (updates.name) payload.name = updates.name;
      if (updates.plan) {
        const potentialPlanId = updates.plan || (availablePlans.find(p => p.name === updates.plan)?.id);
        if (potentialPlanId) payload.plan = potentialPlanId;
      }
      if (updates.monthlyValue !== undefined) payload.monthlyValue = updates.monthlyValue;
      if (updates.usersLimit !== undefined) payload.usersLimit = updates.usersLimit;
      if (updates.internalNotes !== undefined) payload.internalNotes = updates.internalNotes;
      if (updates.salesOrigin !== undefined) payload.salesOrigin = updates.salesOrigin;
      if (updates.segment !== undefined) payload.segment = updates.segment;

      const res = await api.put(`/superadmin/tenants/${tenantId}`, payload);

      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId ? { ...tenant, ...res.data } : tenant
      ));

      setSelectedTenant(prev => (prev?.id === tenantId ? { ...prev, ...res.data } : prev));
      toast.success('Empresa atualizada com sucesso');
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erro ao atualizar empresa');
    }
  };

  const handleKpiClick = (filter: KPIFilter) => {
    if (kpiFilter === filter) {
      setKpiFilter(null);
    } else {
      setKpiFilter(filter);
    }
  };

  const handleSelectTenantFromSupport = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setSelectedTenant(tenant);
    }
  };

  const clearKpiFilter = () => {
    setKpiFilter(null);
  };

  const pendingAlertsCount = alerts.filter(a => a.status === 'pendente').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b pt-[var(--safe-area-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={saltLogo} alt="SALT" className="w-8 h-8" />
            <div>
              <h1 className="text-sm font-semibold">Super Admin SALT</h1>
              <p className="text-[10px] text-muted-foreground">
                {isMaster ? 'Acesso Master' : 'Acesso Operacional'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowInternalUsersModal(true)}
            >
              <UserCog className="w-3.5 h-3.5" />
              Equipe SALT
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={handleLogout}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Dashboard Executivo - KPIs de Negócio */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Dashboard Executivo
              </h2>
              {kpiFilter && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  Filtro ativo
                  <button onClick={clearKpiFilter} className="ml-1 hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>

          {/* Primeira linha: Status das Empresas (4 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <KPICard
              label="Total Empresas"
              value={tenants.length}
              icon={<Building2 className="w-4 h-4" />}
              variant="info"
              onClick={() => handleKpiClick('all')}
              active={kpiFilter === 'all'}
            />
            <KPICard
              label="Ativas"
              value={tenants.filter(t => t.status === 'ativa').length}
              icon={<CheckCircle className="w-4 h-4" />}
              variant="success"
              onClick={() => handleKpiClick('ativas')}
              active={kpiFilter === 'ativas'}
            />
            <KPICard
              label="Inadimplentes"
              value={tenants.filter(t => t.paymentStatus === 'atraso').length}
              icon={<AlertTriangle className="w-4 h-4" />}
              variant="warning"
              onClick={() => handleKpiClick('inadimplentes')}
              active={kpiFilter === 'inadimplentes'}
            />
            <KPICard
              label="Suspensas"
              value={tenants.filter(t => t.status === 'suspensa').length}
              icon={<Ban className="w-4 h-4" />}
              variant="destructive"
              onClick={() => handleKpiClick('suspensas')}
              active={kpiFilter === 'suspensas'}
            />
          </div>

          {/* Segunda linha: Indicadores Operacionais (6 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPICard
              label="Usuários Ativos"
              value={tenants.reduce((acc, t) => acc + t.usersActive, 0)}
              icon={<Users className="w-4 h-4" />}
              variant="info"
            />
            <KPICard
              label="WA Desconectados"
              value={tenants.reduce((acc, t) => acc + (t.whatsappConnections || []).filter(w => w.status === 'desconectado').length, 0)}
              icon={<WifiOff className="w-4 h-4" />}
              variant={tenants.some(t => (t.whatsappConnections || []).some(w => w.status === 'desconectado')) ? 'warning' : 'default'}
              onClick={() => setShowWhatsAppModal(true)}
            />
            <KPICard
              label="Alertas n8n"
              value={pendingAlertsCount}
              icon={<AlertTriangle className="w-4 h-4" />}
              variant={pendingAlertsCount > 0 ? 'destructive' : 'default'}
              onClick={() => setShowAlertsPanel(true)}
            />
            <KPICard
              label="Suportes Abertos"
              value={openSupportTickets}
              icon={<Headphones className="w-4 h-4" />}
              variant={openSupportTickets > 0 ? 'warning' : 'default'}
              onClick={() => {
                setSupportPanelFilter('aberto');
                setShowSupportPanel(true);
              }}
            />
            <KPICard
              label="Onboarding Pendente"
              value={onboardingPendingCount}
              icon={<Clock className="w-4 h-4" />}
              variant={onboardingPendingCount > 0 ? 'info' : 'default'}
              onClick={() => setKpiFilter(kpiFilter === 'onboarding_pending' ? null : 'onboarding_pending')}
            />
          </div>
        </section>

        {/* Bloco Financeiro - Master Only */}
        {isMaster && (
          <section className="p-5 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-success" />
              </div>
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Bloco Financeiro
              </h2>
            </div>

            {/* Primeira linha: Receitas principais (4 cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <KPICard
                label="MRR Atual"
                value={`R$ ${(mockFinancialKPIs.mrr / 1000).toFixed(1)}k`}
                icon={<DollarSign className="w-4 h-4" />}
                variant="success"
                trend="up"
                trendValue="+6.3%"
                size="financial"
              />
              <KPICard
                label="Receita Mês Anterior"
                value={`R$ ${(mockFinancialKPIs.lastMonthRevenue / 1000).toFixed(1)}k`}
                icon={<Calendar className="w-4 h-4" />}
                size="financial"
              />
              <KPICard
                label="Receita Mês Atual"
                value={`R$ ${(mockFinancialKPIs.currentMonthRevenue / 1000).toFixed(1)}k`}
                icon={<TrendingUp className="w-4 h-4" />}
                variant="info"
                size="financial"
              />
              <KPICard
                label="Previsão do Mês"
                value={`R$ ${(mockFinancialKPIs.forecastedRevenue / 1000).toFixed(1)}k`}
                icon={<Target className="w-4 h-4" />}
                size="financial"
              />
            </div>

            {/* Segunda linha: Cobranças e alertas (4 cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KPICard
                label="Valor em Atraso"
                value={`R$ ${(mockFinancialKPIs.overdueAmount / 1000).toFixed(1)}k`}
                icon={<CreditCard className="w-4 h-4" />}
                variant="destructive"
                size="financial"
              />
              <KPICard
                label="Ticket Médio"
                value={`R$ ${mockFinancialKPIs.avgTicket.toLocaleString('pt-BR')}`}
                icon={<Receipt className="w-4 h-4" />}
                size="financial"
              />
              <KPICard
                label="Vence em 10 dias"
                value={`${tenantsDueSoon.length} empresas`}
                icon={<CalendarClock className="w-4 h-4" />}
                variant="warning"
                onClick={() => handleKpiClick('dueSoon')}
                active={kpiFilter === 'dueSoon'}
                size="financial"
              />
              <KPICard
                label="Clientes em Atraso"
                value={`${tenantsOverdue.length} empresas`}
                icon={<AlertCircle className="w-4 h-4" />}
                variant="destructive"
                onClick={() => handleKpiClick('overdue')}
                active={kpiFilter === 'overdue'}
                size="financial"
              />
            </div>
          </section>
        )}

        {/* Tenants List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Empresas (Tenants)
              </h2>
              <Badge variant="outline" className="text-[10px]">
                {filteredTenants.length} de {tenants.length}
              </Badge>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-sm"
              onClick={() => setShowNewTenantModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Empresa
            </Button>
          </div>

          {/* Filters - Unified compact style */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-24 h-8 text-[11px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos Status</SelectItem>
                  <SelectItem value="ativa" className="text-xs">Ativas</SelectItem>
                  <SelectItem value="suspensa" className="text-xs">Suspensas</SelectItem>
                  <SelectItem value="cancelada" className="text-xs">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={lifecycleFilter} onValueChange={setLifecycleFilter}>
                <SelectTrigger className="w-28 h-8 text-[11px] bg-background">
                  <SelectValue placeholder="Ciclo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos Ciclos</SelectItem>
                  {Object.entries(lifecycleStatusLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-24 h-8 text-[11px] bg-background">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos Planos</SelectItem>
                  <SelectItem value="starter" className="text-xs">Starter</SelectItem>
                  <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                  <SelectItem value="enterprise" className="text-xs">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-28 h-8 text-[11px] bg-background">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Todos Pagamentos</SelectItem>
                  <SelectItem value="em_dia" className="text-xs">Em Dia</SelectItem>
                  <SelectItem value="atraso" className="text-xs">Em Atraso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table - Enterprise Standard */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b border-border/50">
                  <tr>
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Empresa</th>
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Status</th>
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Plano</th>
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Pagamento</th>
                    {isMaster && (
                      <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Valor</th>
                    )}
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Usuários</th>
                    <th className="text-left p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Atividade</th>
                    <th className="text-right p-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTenant(tenant)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-foreground block group-hover:text-primary transition-colors">{tenant.name}</span>
                            <span className="text-[10px] text-muted-foreground">{tenant.segment}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <LifecycleStatusBadge status={tenant.lifecycleStatus} />
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] font-medium bg-muted/30">{tenant.plan}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={tenant.paymentStatus === 'em_dia' ? 'default' : 'destructive'}
                          className={`text-[10px] font-medium ${tenant.paymentStatus === 'em_dia' ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                        >
                          {tenant.paymentStatus === 'em_dia' ? 'Em dia' : 'Em atraso'}
                        </Badge>
                      </td>
                      {isMaster && (
                        <td className="p-3">
                          <span className="text-xs font-semibold text-foreground">
                            R$ {tenant.monthlyValue.toLocaleString('pt-BR')}
                          </span>
                        </td>
                      )}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-foreground font-medium">{tenant.usersActive}</span>
                          <span className="text-[10px] text-muted-foreground">/ {tenant.usersLimit}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-[11px] text-muted-foreground">
                          {tenant.lastActivity.occurredAt}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
                            onClick={() => setSelectedTenant(tenant)}
                            title="Visualizar empresa"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:text-primary"
                            onClick={() => handleEnterAsAdmin(tenant)}
                            title="Entrar como admin"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </Button>
                          {tenant.status === 'ativa' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-warning hover:text-warning"
                              onClick={() => handleToggleTenantStatus(tenant.id, tenant.status)}
                              title="Suspender empresa"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </Button>
                          ) : tenant.status === 'suspensa' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 opacity-60 hover:opacity-100 text-success hover:text-success"
                              onClick={() => handleToggleTenantStatus(tenant.id, tenant.status)}
                              title="Ativar empresa"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedTenants.length === 0 && (
                    <tr>
                      <td colSpan={isMaster ? 8 : 7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="w-8 h-8 text-muted-foreground/30" />
                          <span className="text-sm text-muted-foreground">Nenhuma empresa encontrada</span>
                          <span className="text-xs text-muted-foreground/60">Tente ajustar os filtros de busca</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">
                  Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                  {Math.min(currentPage * pageSize, filteredTenants.length)} de{" "}
                  {filteredTenants.length} empresas
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-7 h-7 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <TenantDetailModal
        tenant={selectedTenant}
        open={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        isMaster={isMaster}
        onEnterAsAdmin={handleEnterAsAdmin}
        onUpdateTenant={handleUpdateTenant}
        onDeleteTenant={handleDeleteTenant}
        supportTickets={supportTickets}
        onChangePlan={(tenantId, newPlan) => handleUpdateTenant(tenantId, { plan: newPlan as any })}
        onToggleFeatureOverride={(tenantId, featureKey, enabled) => {
          toast.success(`Override ${enabled ? 'ativado' : 'desativado'} para ${featureKey}`);
        }}
      />

      <PlanManagementModal
        open={showPlanManagementModal}
        onOpenChange={setShowPlanManagementModal}
      />

      <NewTenantModal
        open={showNewTenantModal}
        onClose={() => setShowNewTenantModal(false)}
        onCreateTenant={handleCreateTenant}
      />

      <InternalUsersModal
        open={showInternalUsersModal}
        onClose={() => setShowInternalUsersModal(false)}
        users={internalUsers}
        isMaster={isMaster}
        onUpdateUser={(updatedUser) => {
          setInternalUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        }}
        onAddUser={(newUser) => {
          const user: SuperAdminUser = {
            ...newUser,
            id: `sa-${Date.now()}`,
            lastLogin: 'Nunca',
          };
          setInternalUsers(prev => [...prev, user]);
        }}
      />

      <AlertsPanelModal
        open={showAlertsPanel}
        onClose={() => setShowAlertsPanel(false)}
        alerts={alerts}
        onResolve={handleResolveAlert}
      />

      <UsersListModal
        open={showUsersListModal}
        onClose={() => setShowUsersListModal(false)}
        tenants={tenants}
      />

      <WhatsAppDisconnectedModal
        open={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        tenants={tenants}
        onSelectTenant={setSelectedTenant}
      />

      <SupportPanelModal
        open={showSupportPanel}
        onClose={() => setShowSupportPanel(false)}
        tickets={supportTickets}
        onResolve={handleResolveSupportTicket}
        onSelectTenant={handleSelectTenantFromSupport}
        onAssign={handleAssignTicket}
        onUpdateStatus={handleUpdateTicketStatus}
        tenants={tenants}
        initialFilter={supportPanelFilter}
      />

      <OnboardingPendingModal
        open={showOnboardingPendingModal}
        onClose={() => setShowOnboardingPendingModal(false)}
        tenants={tenants}
        onSelectTenant={setSelectedTenant}
      />
    </div>
  );
};

export default SuperAdmin;
