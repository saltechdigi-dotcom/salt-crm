import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3, Filter, RefreshCcw, Bot, MessageSquare, Star, TrendingUp,
  PhoneCall, Users, Package, UserCog, Settings, QrCode, Key, Calendar,
  Receipt, Headphones, ChevronLeft, Menu, Pin, CalendarDays,
  User, LogOut, LucideIcon, ChevronDown, Link as LinkIcon
} from "lucide-react";
import SparklesIcon from "lucide-react/dist/esm/icons/sparkles";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getCompanySettings } from "@/hooks/useUserProfile";
import saltLogo from "@/assets/salt-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { InlineNotification } from "./inline-notification";
import { useInlineNotification } from "@/contexts/InlineNotificationContext";
import { HierarchicalNotifications } from "@/components/notifications/HierarchicalNotifications";
import { useUserRole } from "@/hooks/useUserRole";
import { useModules, ModuleId } from "@/hooks/useModules";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";
import { useLeadDemands, leadDemandsStore } from "@/stores/leads";
import { useLeadSchedules } from "@/stores/leads";
import { SellerPinsPanel } from "@/components/funil/SellerPinsPanel";
import { SellerSchedulesPanel } from "@/components/funil/SellerSchedulesPanel";

// Module icons configuration
interface ModuleIconConfig {
  moduleId: ModuleId;
  title: string;
  icon: LucideIcon;
  gradient: string;
  path: string;
  requiredPermission?: 'canAccessDashboard' | 'canAccessFunil' | 'canAccessRoleta';
}

const moduleIcons: ModuleIconConfig[] = [
  {
    moduleId: 'dashboard',
    title: 'Dashboard',
    icon: BarChart3,
    gradient: 'from-primary via-primary/90 to-info/80',
    path: '/home',
    requiredPermission: 'canAccessDashboard',
  },
  {
    moduleId: 'funil',
    title: 'Funil',
    icon: Filter,
    gradient: 'from-info via-info/90 to-primary/80',
    path: '/funil',
    requiredPermission: 'canAccessFunil',
  },
  {
    moduleId: 'roleta',
    title: 'Roleta',
    icon: RefreshCcw,
    gradient: 'from-success via-success/90 to-success/70',
    path: '/roleta',
    requiredPermission: 'canAccessRoleta',
  },
];

// AI Agent icons configuration
interface AIAgentIconConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  gradient: string;
  section: string;
}

const aiAgentIcons: AIAgentIconConfig[] = [
  { id: 'ia-sdr', title: 'IA SDR', icon: Bot, gradient: 'from-[#5B8DEF] to-[#4A7BD4]', section: 'ia-sdr' },
  { id: 'ia-followup', title: 'IA Follow-up', icon: MessageSquare, gradient: 'from-[#4CAF50] to-[#3D9142]', section: 'ia-followup' },
  { id: 'ia-posvenda', title: 'IA Pós-venda', icon: Star, gradient: 'from-[#FF9500] to-[#E68600]', section: 'ia-posvenda' },
  { id: 'ia-nps', title: 'IA NPS', icon: TrendingUp, gradient: 'from-[#4FC3B5] to-[#3DA99C]', section: 'ia-nps' },
  { id: 'ia-ligacao', title: 'IA de Ligação', icon: PhoneCall, gradient: 'from-[#9B7CF4] to-[#8266D9]', section: 'ia-ligacao' },
];

// Configuration items for dropdown - organized by category
interface ConfigItemConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  iconColor: string;
  section: string;
  category: 'gestao' | 'config' | 'salt';
}

const configItems: ConfigItemConfig[] = [
  // Gestão
  { id: 'clientes', title: 'Clientes', icon: Users, iconColor: 'bg-[#4CAF50]', section: 'clientes', category: 'gestao' },
  { id: 'listas', title: 'Listas', icon: Package, iconColor: 'bg-[#5B8DEF]', section: 'listas', category: 'gestao' },
  { id: 'etiquetas', title: 'Etiquetas', icon: Star, iconColor: 'bg-[#9B7CF4]', section: 'etiquetas', category: 'gestao' },
  { id: 'equipes', title: 'Equipes & Hierarquias', icon: Users, iconColor: 'bg-[#5B8DEF]', section: 'equipes', category: 'gestao' },
  { id: 'usuarios', title: 'Usuários', icon: UserCog, iconColor: 'bg-[#9B7CF4]', section: 'usuarios', category: 'gestao' },
  // Configurações
  { id: 'config', title: 'Empresa', icon: Settings, iconColor: 'bg-[#6B7280]', section: 'config', category: 'config' },
  { id: 'qrcode', title: 'QR Code WhatsApp', icon: QrCode, iconColor: 'bg-[#25D366]', section: 'qrcode', category: 'config' },
  { id: 'whatsapp-api', title: 'WhatsApp API', icon: LinkIcon, iconColor: 'bg-[#25D366]', section: 'whatsapp-api', category: 'config' },
  { id: 'api-openai', title: 'API OpenAI', icon: Key, iconColor: 'bg-[#10A37F]', section: 'api-openai', category: 'config' },
  { id: 'google-calendar', title: 'Google Calendar', icon: Calendar, iconColor: 'bg-[#4285F4]', section: 'google-calendar', category: 'config' },
  // SALT
  { id: 'plano', title: 'Plano Contratado', icon: Star, iconColor: 'bg-[#F5A15D]', section: 'plano', category: 'salt' },
  { id: 'fatura', title: 'Fatura', icon: Receipt, iconColor: 'bg-[#FF9500]', section: 'fatura', category: 'salt' },
  { id: 'suporte', title: 'Suporte SALT', icon: Headphones, iconColor: 'bg-[#E96A6A]', section: 'suporte', category: 'salt' },
  { id: 'chamados', title: 'Central de Chamados', icon: MessageSquare, iconColor: 'bg-[#5B8DEF]', section: 'chamados', category: 'salt' },
  { id: 'servicos', title: 'Serviços & Expansões', icon: SparklesIcon, iconColor: 'bg-[#4FC3B5]', section: 'servicos', category: 'salt' },
];

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  showAvatar?: boolean;
  showModuleIcons?: boolean;
  onBack?: () => void;
  onMenuClick?: () => void;
  rightContent?: React.ReactNode;
}

// Helper component for inline notification display
const NotificationDisplay: React.FC = () => {
  try {
    const { notification, hideNotification } = useInlineNotification();
    return (
      <InlineNotification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />
    );
  } catch {
    // Context not available, skip rendering
    return null;
  }
};

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({
    className,
    title,
    showBack = false,
    showMenu = false,
    showNotifications = true,
    showAvatar = true,
    showModuleIcons = false,
    onBack,
    onMenuClick,
    rightContent,
    ...props
  }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { permissions } = useUserRole();
    const { isModuleEnabled } = useModules();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(getUserAvatarUrl());
    const [companySettings, setCompanySettings] = useState(getCompanySettings());

    // Pins and Schedules state
    const [showPinsPanel, setShowPinsPanel] = useState(false);
    const [showSchedulesPanel, setShowSchedulesPanel] = useState(false);
    const { scheduleCount } = useLeadSchedules();

    // Count pins (active demands)
    const demands = leadDemandsStore.getDemands();
    const pinCount = demands.filter(d => !d.resolved).length;

    // Listen for profile updates
    useEffect(() => {
      const handleProfileUpdate = (e: CustomEvent) => {
        setAvatarUrl(e.detail?.avatarUrl || null);
      };
      const handleCompanyUpdate = (e: CustomEvent) => {
        setCompanySettings(e.detail || getCompanySettings());
      };
      window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      window.addEventListener('companySettingsUpdated', handleCompanyUpdate as EventListener);
      return () => {
        window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
        window.removeEventListener('companySettingsUpdated', handleCompanyUpdate as EventListener);
      };
    }, []);

    const initials = { name: "User", email: "", role: "user" }.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const handleLogout = () => {
      // Clear auth/session data used across app modules
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('salt_token');
      localStorage.removeItem('salt_refresh_token');
      localStorage.removeItem('salt_session');
      sessionStorage.clear();
      // Navigate to login page
      navigate('/login');
    };

    return (
      <header
        ref={ref}
        className={cn(
          "sticky top-0 z-40 w-full bg-background/90 backdrop-blur-lg border-b border-border/30 pt-[var(--safe-area-top)]",
          className
        )}
        {...props}
      >
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center gap-2.5">
            {showBack && (
              <button
                onClick={() => (onBack ? onBack() : navigate(-1))}
                className="flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors -ml-1 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span className="text-xs font-medium">Voltar</span>
              </button>
            )}
            {showMenu && (
              <button
                onClick={onMenuClick}
                className="p-1.5 -ml-1.5 hover:bg-secondary/60 rounded-lg transition-all active:scale-95"
              >
                <Menu className="w-4 h-4 text-foreground" />
              </button>
            )}
            {title ? (
              <h1 className="text-sm font-medium text-foreground animate-fade-in">{title}</h1>
            ) : (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shadow-sm">
                  {companySettings.logoUrl ? (
                    <img src={companySettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <img src={saltLogo} alt="SALT Logo" className="w-full h-full object-contain" />
                  )}
                </div>
                <span className="font-medium text-sm text-foreground">{companySettings.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {rightContent}

            {/* Module Icons: Roleta, Estoque, Agentes - Desktop only */}
            {showModuleIcons && (
              <div className="hidden md:flex items-center gap-1 mr-1">
                {/* Roleta */}
                {isModuleEnabled('roleta') && permissions.canAccessRoleta && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate('/roleta')}
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 active:scale-95",
                          location.pathname === '/roleta'
                            ? "bg-primary/10 ring-1 ring-primary/20"
                            : "hover:bg-secondary/60"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-md bg-gradient-to-br from-success via-success/90 to-success/70 flex items-center justify-center transition-all",
                          location.pathname === '/roleta' ? "opacity-100" : "opacity-70 hover:opacity-90"
                        )}>
                          <RefreshCcw className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Roleta
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Estoque - Admin only */}
                {permissions.canManageSettings && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate('/outros', { state: { section: 'estoque' } })}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-all duration-200 active:scale-95"
                      >
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-warning via-warning/90 to-orange-500/80 flex items-center justify-center opacity-70 hover:opacity-90 transition-all">
                          <Package className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Estoque
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* AI Agents Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-all duration-200 active:scale-95"
                        >
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#5B8DEF] to-[#9B7CF4] flex items-center justify-center opacity-70 hover:opacity-90 transition-all">
                            <Bot className="w-3.5 h-3.5 text-white" />
                          </div>
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      Agentes de IA
                    </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-lg z-50">
                    {aiAgentIcons.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        className="cursor-pointer gap-2.5 py-2.5"
                        onClick={() => navigate('/outros', { state: { section: agent.section } })}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center",
                          agent.gradient
                        )}>
                          <agent.icon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm">{agent.title}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-5 bg-border/30 mx-0.5" />
              </div>
            )}

            {/* Pin Icon with badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowPinsPanel(true)}
                  className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-all duration-200 active:scale-95"
                >
                  <Pin className="w-4 h-4 text-muted-foreground" />
                  {pinCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {pinCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Leads Fixados
              </TooltipContent>
            </Tooltip>

            {/* Calendar Icon with badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowSchedulesPanel(true)}
                  className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-all duration-200 active:scale-95"
                >
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  {scheduleCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-success text-success-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {scheduleCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Agendamentos
              </TooltipContent>
            </Tooltip>

            {/* Inline Notification - Subtle alert next to bell */}
            <NotificationDisplay />

            {/* Notifications - Hierarchical System */}
            {showNotifications && <HierarchicalNotifications />}

            {/* Configurations Dropdown - next to profile */}
            {showModuleIcons && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary/60 transition-all duration-200 active:scale-95"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Configurações
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50 max-h-[70vh] overflow-y-auto">
                  {/* Mobile only: Módulos */}
                  <div className="md:hidden">
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Módulos</span>
                    </div>
                    {isModuleEnabled('roleta') && permissions.canAccessRoleta && (
                      <DropdownMenuItem
                        className="cursor-pointer gap-2.5 py-2"
                        onClick={() => navigate('/roleta')}
                      >
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-success via-success/90 to-success/70 flex items-center justify-center">
                          <RefreshCcw className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">Roleta</span>
                      </DropdownMenuItem>
                    )}
                    {permissions.canManageSettings && (
                      <DropdownMenuItem
                        className="cursor-pointer gap-2.5 py-2"
                        onClick={() => navigate('/outros', { state: { section: 'estoque' } })}
                      >
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-warning via-warning/90 to-orange-500/80 flex items-center justify-center">
                          <Package className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">Estoque</span>
                      </DropdownMenuItem>
                    )}
                    {/* AI Agents in mobile dropdown */}
                    {aiAgentIcons.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        className="cursor-pointer gap-2.5 py-2"
                        onClick={() => navigate('/outros', { state: { section: agent.section } })}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md bg-gradient-to-br flex items-center justify-center",
                          agent.gradient
                        )}>
                          <agent.icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm">{agent.title}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>

                  {/* Gestão */}
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Gestão</span>
                  </div>
                  {configItems.filter(i => i.category === 'gestao').map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="cursor-pointer gap-2.5 py-2"
                      onClick={() => navigate('/outros', { state: { section: item.section } })}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center",
                        item.iconColor
                      )}>
                        <item.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{item.title}</span>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Configurações */}
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">Configurações</span>
                  </div>
                  {configItems.filter(i => i.category === 'config').map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="cursor-pointer gap-2.5 py-2"
                      onClick={() => navigate('/outros', { state: { section: item.section } })}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center",
                        item.iconColor
                      )}>
                        <item.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{item.title}</span>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* SALT */}
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">SALT</span>
                  </div>
                  {configItems.filter(i => i.category === 'salt').map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      className="cursor-pointer gap-2.5 py-2"
                      onClick={() => navigate('/outros', { state: { section: item.section } })}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center",
                        item.iconColor
                      )}>
                        <item.icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm">{item.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Avatar Dropdown */}
            {showAvatar && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-secondary/60 transition-all active:scale-95 group">
                    <Avatar className="w-6 h-6 ring-1 ring-transparent group-hover:ring-primary/20 transition-all">
                      <AvatarImage src={avatarUrl || ""} alt={{ name: "User", email: "", role: "user" }.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-muted-foreground/70 transition-transform group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-scale-in bg-card border border-border shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="font-medium text-foreground">{{ name: "User", email: "", role: "user" }.name}</p>
                    <p className="text-xs text-muted-foreground">{{ name: "User", email: "", role: "user" }.email}</p>
                  </div>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-2.5"
                    onClick={() => navigate('/outros', { state: { section: 'perfil' } })}
                  >
                    <User className="w-4 h-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-2.5"
                    onClick={() => navigate('/outros', { state: { section: 'config' } })}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Seller Pins Panel */}
        <SellerPinsPanel
          open={showPinsPanel}
          onOpenChange={setShowPinsPanel}
        />

        {/* Seller Schedules Panel */}
        <SellerSchedulesPanel
          open={showSchedulesPanel}
          onOpenChange={setShowSchedulesPanel}
        />
      </header>
    );
  }
);
Header.displayName = "Header";

interface SubHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const SubHeader = React.forwardRef<HTMLDivElement, SubHeaderProps>(
  ({ className, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-start justify-between mb-6", className)}
        {...props}
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {action}
      </div>
    );
  }
);
SubHeader.displayName = "SubHeader";

export { Header, SubHeader };
