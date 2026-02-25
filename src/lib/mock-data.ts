import { Lead, Pipeline, Agent, Manager, Team, KPI, ChartData, DistributionRule, AIPrompt, FollowUpMessage, Tenant, User } from '@/types';

export const mockTenant: Tenant = {
  id: '',
  name: '',
  createdAt: '',
};

export const mockUser: User = {
  id: '',
  email: '',
  name: '',
  role: 'admin',
  tenantId: '',
};

// ==========================================
// SISTEMA DE NOTIFICAÇÕES HIERÁRQUICAS SALT
// ==========================================

export type UserRole = 'admin' | 'manager' | 'agent';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'message' | 'team_message' | 'operational' | 'institutional';
  read: boolean;
  createdAt: string;
  targetRoles: UserRole[];
  teamId?: string;
  agentId?: string;
  icon?: string;
}

export interface TeamUnreadMessages {
  teamId: string;
  teamName: string;
  unreadCount: number;
  managerId: string;
}

export interface HierarchicalNotificationData {
  totalUnreadMessages: number;
  teamUnreadMessages: TeamUnreadMessages[];
  operationalAlerts: Notification[];
  institutionalAlerts: Notification[];
  myTeamUnreadMessages: number;
  myTeamName: string;
  myTeamOperationalAlerts: Notification[];
  myUnreadMessages: number;
  myPersonalAlerts: Notification[];
}

// Dados vazios
export const mockTeamUnreadMessages: TeamUnreadMessages[] = [];

export function getRecentTimestamp(hoursAgo: number): string {
  return new Date().toISOString();
}

export const mockNotifications: Notification[] = [];

export function getNotificationsByRole(
  role: UserRole,
  userId?: string,
  teamId?: string
): HierarchicalNotificationData {
  return {
    totalUnreadMessages: 0,
    teamUnreadMessages: [],
    operationalAlerts: [],
    institutionalAlerts: [],
    myTeamUnreadMessages: 0,
    myTeamName: '',
    myTeamOperationalAlerts: [],
    myUnreadMessages: 0,
    myPersonalAlerts: [],
  };
}

export const mockCurrentUserRole: UserRole = 'admin';
export const mockCurrentUserId = '';
export const mockCurrentTeamId = '';

// Pipeline - vazio
export const mockPipelineMainStages = [];
export const mockPipelineExitStages = [];
export const mockPipelineExitStagesRight = [];

export const mockPipeline: Pipeline = {
  id: '',
  name: '',
  stages: [],
};

export const mockLeads: Lead[] = [];
export const mockAgents: Agent[] = [];
export const mockManagers: Manager[] = [];
export const mockTeams: Team[] = [];

export const mockKPIs: KPI[] = []; // Vazio como solicitado

export const mockChartData: ChartData[] = [];
export const mockDistributionRules: DistributionRule[] = [];
export const mockAIPrompts: AIPrompt[] = [];
export const mockFollowUpMessages: FollowUpMessage[] = [];

// Dashboard exports - vazios
export const mockOrigins: string[] = [
  'WhatsApp',
  'Instagram',
  'Facebook',
  'Google Ads',
  'Site',
  'Indicação',
  'Telefone',
  'E-mail',
  'Landing Page',
  'Presencial',
  'LinkedIn',
  'TikTok',
  'Outro',
];
export const mockLeadsByOrigin: any[] = [];
export const mockSalesByOrigin: any[] = [];
export const mockLeadsByPeriod: any[] = [];
export const mockSalesByPeriod: any[] = [];
export const mockPeriodDetailData: any[] = [];
export const mockAgentRanking: any[] = [];
export const mockAgentRankingAtendimento: any[] = [];
export const mockManagerRanking: any[] = [];
export const mockManagerRankingAtendimento: any[] = [];
export const mockCombinedAgentRanking: any[] = [];
export const mockCombinedManagerRanking: any[] = [];
export const mockCombinedOriginData: any[] = [];
export const mockPipelineExitStagesLeft: any[] = [];
export const mockSalesData: any[] = [];
