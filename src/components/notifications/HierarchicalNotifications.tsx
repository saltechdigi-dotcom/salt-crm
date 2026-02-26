import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Wrench,
  Rocket,
  Users,
  Clock,
  AlertTriangle,
  Trophy,
  MessageCircle,
  UserPlus,
  AlertCircle,
  PauseCircle,
  DollarSign,
  CheckCircle2,
  Bell,
  ChevronRight,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNotificationsByRole, type Notification, type UserRole } from "@/lib/mock-data";
import { useSalesStore, type SaleNotification } from "@/stores/sales";

interface HierarchicalNotificationsProps {
  userRole?: UserRole;
  userId?: string;
  teamId?: string;
  onSaleNotificationClick?: (saleId: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  'sparkles': Sparkles,
  'tool': Wrench,
  'rocket': Rocket,
  'users': Users,
  'clock': Clock,
  'alert-triangle': AlertTriangle,
  'trophy': Trophy,
  'message-circle': MessageCircle,
  'message-circle-warning': MessageCircle,
  'user-plus': UserPlus,
  'alert-circle': AlertCircle,
  'pause-circle': PauseCircle,
  'dollar-sign': DollarSign,
  'check-circle': CheckCircle2,
};

// Mapeamento de navegação por tipo de notificação
const getNavigationPath = (notif: Notification): { path: string; state?: Record<string, unknown> } => {
  // Alertas institucionais SALT - sem navegação específica
  if (notif.category === 'institutional') {
    return { path: '/outros', state: { section: 'suporte' } };
  }

  // Baseado no ícone/tipo de alerta
  switch (notif.icon) {
    case 'users':
      return { path: '/roleta' }; // Leads aguardando distribuição
    case 'clock':
      return { path: '/home' }; // Follow-ups pendentes/atrasados
    case 'alert-triangle':
      return { path: '/home' }; // Gargalo no funil
    case 'trophy':
      return { path: '/home' }; // Metas
    case 'message-circle':
    case 'message-circle-warning':
      return { path: '/home' }; // Mensagens
    case 'user-plus':
      return { path: '/home' }; // Novo lead
    case 'alert-circle':
      return { path: '/home' }; // Lead em risco
    case 'pause-circle':
      return { path: '/home' }; // Lead parado
    default:
      return { path: '/home' };
  }
};

const HierarchicalNotifications: React.FC<HierarchicalNotificationsProps> = ({
  userRole = "admin" as UserRole,
  userId = 'agent-1',
  teamId = 'team-1',
  onSaleNotificationClick,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const salesStore = useSalesStore();

  const data = useMemo(() => getNotificationsByRole(userRole, userId, teamId), [userRole, userId, teamId]);

  // Notificações de vendas
  const saleNotifications = useMemo(() => {
    if (userRole === 'manager') {
      return salesStore.getNotificationsForManager(userId);
    } else if (userRole === 'admin') {
      return salesStore.getNotificationsForAdmin();
    }
    return [];
  }, [userRole, userId, salesStore]);

  const unreadSaleNotifications = saleNotifications.filter(n => !n.read);

  // Calcula badge baseado no nível hierárquico
  const badgeCount = useMemo(() => {
    const saleCount = unreadSaleNotifications.length;
    switch (userRole) {
      case 'admin':
        return data.totalUnreadMessages + data.operationalAlerts.filter(n => !n.read).length + data.institutionalAlerts.filter(n => !n.read).length + saleCount;
      case 'manager':
        return data.myTeamUnreadMessages + data.myTeamOperationalAlerts.filter(n => !n.read).length + saleCount;
      case 'agent':
        return data.myUnreadMessages + data.myPersonalAlerts.filter(n => !n.read).length;
      default:
        return 0;
    }
  }, [userRole, data, unreadSaleNotifications.length]);

  const handleSaleNotificationClick = (notif: SaleNotification) => {
    salesStore.markNotificationAsRead(notif.id);
    setIsOpen(false);
    if (onSaleNotificationClick) {
      onSaleNotificationClick(notif.saleId);
    }
  };

  const renderSaleNotificationItem = (notif: SaleNotification, index: number) => (
    <div
      key={notif.id}
      onClick={() => handleSaleNotificationClick(notif)}
      className={cn(
        "px-3 py-2 border-b border-border/30 hover:bg-secondary/40 transition-colors cursor-pointer animate-fade-in",
        !notif.read && "bg-emerald-500/5"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex gap-2.5 items-start">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
          notif.type === 'sale_pending_validation'
            ? "bg-amber-500/10 text-amber-600"
            : notif.type === 'sale_validated'
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-destructive/10 text-destructive"
        )}>
          {notif.type === 'sale_pending_validation' ? (
            <DollarSign className="w-3.5 h-3.5" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "text-[12px] font-medium text-foreground/90 leading-tight flex-1",
              !notif.read && "font-semibold"
            )}>
              {notif.title}
            </p>
            <span className="text-[9px] text-muted-foreground/60">
              {formatTimeAgo(notif.createdAt)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-0.5 leading-tight">
            {notif.message}
          </p>
        </div>
        {!notif.read && (
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5 animate-pulse-soft" />
        )}
      </div>
    </div>
  );

  const getNotificationTypeStyles = (type: Notification['type']) => {
    const styles = {
      info: 'bg-primary/10 text-primary',
      warning: 'bg-amber-500/10 text-amber-600',
      success: 'bg-emerald-500/10 text-emerald-600',
      error: 'bg-destructive/10 text-destructive',
    };
    return styles[type];
  };

  const renderIcon = (iconName?: string) => {
    const IconComponent = iconName ? iconMap[iconName] : Bell;
    return <IconComponent className="w-3.5 h-3.5" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Agora';
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays <= 3) return `${diffDays}d`;
    return '3d';
  };

  const handleNotificationClick = (notif: Notification) => {
    const { path, state } = getNavigationPath(notif);
    setIsOpen(false);
    navigate(path, { state });
  };

  const handleTeamClick = (teamId: string) => {
    setIsOpen(false);
    navigate('/home', { state: { filterTeam: teamId } });
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/home');
  };

  const renderNotificationItem = (notif: Notification, index: number) => (
    <div
      key={notif.id}
      onClick={() => handleNotificationClick(notif)}
      className={cn(
        "px-3 py-2 border-b border-border/30 hover:bg-secondary/40 transition-colors cursor-pointer animate-fade-in",
        !notif.read && "bg-primary/5"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex gap-2.5 items-start">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
          getNotificationTypeStyles(notif.type)
        )}>
          {renderIcon(notif.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "text-[12px] font-medium text-foreground/90 leading-tight flex-1",
              !notif.read && "font-semibold"
            )}>
              {notif.title}
            </p>
            <span className="text-[9px] text-muted-foreground/60">
              {formatTimeAgo(notif.createdAt)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mt-0.5 leading-tight">
            {notif.message}
          </p>
        </div>
        {!notif.read && (
          <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5 animate-pulse-soft" />
        )}
      </div>
    </div>
  );

  const renderAdminView = () => (
    <>
      {/* Vendas validadas - destaque para Admin */}
      {unreadSaleNotifications.length > 0 && (
        <div className="border-b border-border/30">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium px-3 pt-2 pb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            Vendas Recentes
          </p>
          {unreadSaleNotifications.slice(0, 3).map((notif, i) => renderSaleNotificationItem(notif, i))}
        </div>
      )}

      {/* Total de mensagens não lidas */}
      <div
        className="px-3 py-2.5 bg-primary/5 border-b border-border/30 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => { setIsOpen(false); navigate('/funil'); }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-foreground">
              {data.totalUnreadMessages} mensagens não lidas
            </p>
            <p className="text-[10px] text-muted-foreground/70">Total geral da empresa</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </div>

      {/* Mensagens por time */}
      <div className="px-3 py-2 border-b border-border/30">
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-2">
          Por Time
        </p>
        {data.teamUnreadMessages.map((team) => (
          <div
            key={team.teamId}
            onClick={() => handleTeamClick(team.teamId)}
            className="flex items-center justify-between py-1.5 hover:bg-secondary/30 rounded-md px-1.5 -mx-1.5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[11px] text-foreground/80">{team.teamName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium text-foreground">{team.unreadCount}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Alertas Operacionais - temporariamente desabilitado */}

      {/* Alertas Institucionais SALT */}
      {data.institutionalAlerts.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium px-3 pt-2 pb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Comunicados SALT
          </p>
          {data.institutionalAlerts.slice(0, 2).map((notif, i) => renderNotificationItem(notif, i))}
        </div>
      )}
    </>
  );

  const renderManagerView = () => (
    <>
      {/* Vendas pendentes de validação - GERENTE */}
      {unreadSaleNotifications.length > 0 && (
        <div className="border-b border-border/30">
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium px-3 pt-2 pb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-amber-600" />
            Vendas para Validar
          </p>
          {unreadSaleNotifications.slice(0, 3).map((notif, i) => renderSaleNotificationItem(notif, i))}
        </div>
      )}

      {/* Total de mensagens do time */}
      <div
        className="px-3 py-2.5 bg-primary/5 border-b border-border/30 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => { setIsOpen(false); navigate('/funil'); }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-foreground">
              {data.myTeamName}: {data.myTeamUnreadMessages} não lidas
            </p>
            <p className="text-[10px] text-muted-foreground/70">Mensagens do seu time</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </div>

      {/* Alertas Operacionais do Time */}
      {data.myTeamOperationalAlerts.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium px-3 pt-2 pb-1">
            Alertas do Time
          </p>
          {data.myTeamOperationalAlerts.map((notif, i) => renderNotificationItem(notif, i))}
        </div>
      )}
    </>
  );

  const renderAgentView = () => (
    <>
      {/* Minhas mensagens não lidas */}
      <div
        className="px-3 py-2.5 bg-primary/5 border-b border-border/30 cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => { setIsOpen(false); navigate('/funil'); }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-foreground">
              {data.myUnreadMessages} mensagens não lidas
            </p>
            <p className="text-[10px] text-muted-foreground/70">Suas conversas</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </div>

      {/* Alertas Pessoais */}
      {data.myPersonalAlerts.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium px-3 pt-2 pb-1">
            Seus Alertas
          </p>
          {data.myPersonalAlerts.map((notif, i) => renderNotificationItem(notif, i))}
        </div>
      )}
    </>
  );

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'agent': return 'Vendedor';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 hover:bg-secondary/60 rounded-lg transition-all active:scale-95 group">
          <Bell className="w-4 h-4 text-muted-foreground/80 transition-transform group-hover:rotate-12" />
          {badgeCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-destructive rounded-full text-[9px] font-semibold text-destructive-foreground flex items-center justify-center">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 rounded-xl shadow-lg border-border/50"
        align="center"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[13px] text-foreground">Notificações</h3>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground font-medium">
              {getRoleLabel()}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground/70">
            {badgeCount > 0 ? `${badgeCount} pendente${badgeCount > 1 ? 's' : ''}` : 'Tudo em dia'}
          </p>
        </div>

        {/* Conteúdo baseado no nível */}
        <div className="max-h-[360px] overflow-y-auto">
          {userRole === 'admin' && renderAdminView()}
          {userRole === 'manager' && renderManagerView()}
          {userRole === 'agent' && renderAgentView()}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border/30">
          <button
            onClick={handleViewAll}
            className="w-full text-center text-[11px] text-primary font-medium py-1.5 hover:bg-secondary/40 rounded-lg transition-colors"
          >
            Ver todas as notificações
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export { HierarchicalNotifications };