// Shared Support Tickets Store
// This store is used to share support tickets between /outros and /super-admin
import api from '@/lib/api';

export type SupportType = 'tecnico' | 'financeiro' | 'comercial' | 'outro' | 'whatsapp' | 'funil' | 'ia';
export type SupportPriority = 'baixa' | 'media' | 'alta' | 'critica';
export type SupportStatus = 'aberto' | 'em_atendimento' | 'resolvido';

export interface SupportTicket {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  userName: string;
  type: SupportType;
  subject: string;
  description: string;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  assignedTo?: string;
}

// In-memory store for support tickets (will be replaced by Supabase)
let supportTicketsStore: SupportTicket[] = [];

// Listeners for state changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const supportTicketsApi = {
  // Fetch all tickets from API
  fetchAll: async (): Promise<SupportTicket[]> => {
    try {
      const res = await api.get('/support-tickets');
      const data = res.data?.data || res.data || [];
      const tickets: SupportTicket[] = (Array.isArray(data) ? data : []).map((t: any) => ({
        id: t.id,
        tenantId: t.tenantId || '',
        tenantName: '',
        userId: t.userId || '',
        userName: t.user?.name || '',
        type: mapBackendType(t.type),
        subject: t.subject || '',
        description: t.description || '',
        priority: mapBackendPriority(t.priority),
        status: mapBackendStatus(t.status),
        createdAt: t.createdAt || '',
        resolvedAt: t.resolvedAt,
        resolvedBy: t.resolvedBy?.name,
        assignedTo: t.assignedTo?.name,
      }));
      supportTicketsStore = tickets;
      notifyListeners();
      return tickets;
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      return [...supportTicketsStore];
    }
  },

  // Get all tickets (local)
  getAll: (): SupportTicket[] => {
    return [...supportTicketsStore];
  },

  // Get ticket by ID
  getById: (id: string): SupportTicket | undefined => {
    return supportTicketsStore.find(t => t.id === id);
  },

  // Get tickets by tenant
  getByTenant: (tenantId: string): SupportTicket[] => {
    return supportTicketsStore.filter(t => t.tenantId === tenantId);
  },

  // Add new ticket (persists to API)
  add: (ticket: Omit<SupportTicket, 'id'>): SupportTicket => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    supportTicketsStore = [newTicket, ...supportTicketsStore];
    notifyListeners();

    // Fire-and-forget API call
    api.post('/support-tickets', {
      type: mapToBackendType(ticket.type),
      subject: ticket.subject,
      description: ticket.description,
      priority: mapToBackendPriority(ticket.priority),
    }).then(res => {
      // Update local ID with real backend ID
      const idx = supportTicketsStore.findIndex(t => t.id === newTicket.id);
      if (idx !== -1 && res.data?.id) {
        supportTicketsStore[idx] = { ...supportTicketsStore[idx], id: res.data.id };
        supportTicketsStore = [...supportTicketsStore];
        notifyListeners();
      }
    }).catch(err => console.error('Error saving ticket to API:', err));

    return newTicket;
  },

  // Update ticket
  update: (id: string, updates: Partial<SupportTicket>): SupportTicket | undefined => {
    const index = supportTicketsStore.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    supportTicketsStore[index] = { ...supportTicketsStore[index], ...updates };
    supportTicketsStore = [...supportTicketsStore];
    notifyListeners();

    // Fire-and-forget API call
    api.put(`/support-tickets/${id}`, {
      status: updates.status ? mapToBackendStatus(updates.status) : undefined,
      priority: updates.priority ? mapToBackendPriority(updates.priority) : undefined,
      subject: updates.subject,
      description: updates.description,
    }).catch(err => console.error('Error updating ticket:', err));

    return supportTicketsStore[index];
  },

  // Delete ticket
  delete: (id: string): boolean => {
    const initialLength = supportTicketsStore.length;
    supportTicketsStore = supportTicketsStore.filter(t => t.id !== id);
    notifyListeners();

    api.delete(`/support-tickets/${id}`).catch(err => console.error('Error deleting ticket:', err));

    return supportTicketsStore.length < initialLength;
  },

  // Subscribe to changes
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Get counts for dashboard
  getCounts: () => {
    const openTickets = supportTicketsStore.filter(t => t.status !== 'resolvido').length;
    const criticalTickets = supportTicketsStore.filter(t => t.priority === 'critica' && t.status !== 'resolvido').length;
    return { openTickets, criticalTickets };
  },
};

// Auto-fetch on first import
supportTicketsApi.fetchAll();

// Backend <-> Frontend type mappers
function mapBackendType(t: string): SupportType {
  const m: Record<string, SupportType> = { whatsapp: 'whatsapp', funnel: 'funil', ai: 'ia', billing: 'financeiro', technical: 'tecnico', other: 'outro' };
  return m[t] || 'outro';
}
function mapToBackendType(t: SupportType): string {
  const m: Record<SupportType, string> = { whatsapp: 'whatsapp', funil: 'funnel', ia: 'ai', financeiro: 'billing', tecnico: 'technical', outro: 'other', comercial: 'other' };
  return m[t] || 'other';
}
function mapBackendPriority(p: string): SupportPriority {
  const m: Record<string, SupportPriority> = { low: 'baixa', medium: 'media', high: 'alta', critical: 'critica' };
  return m[p] || 'media';
}
function mapToBackendPriority(p: SupportPriority): string {
  const m: Record<SupportPriority, string> = { baixa: 'low', media: 'medium', alta: 'high', critica: 'critical' };
  return m[p] || 'medium';
}
function mapBackendStatus(s: string): SupportStatus {
  const m: Record<string, SupportStatus> = { open: 'aberto', in_progress: 'em_atendimento', resolved: 'resolvido' };
  return m[s] || 'aberto';
}
function mapToBackendStatus(s: SupportStatus): string {
  const m: Record<SupportStatus, string> = { aberto: 'open', em_atendimento: 'in_progress', resolvido: 'resolved' };
  return m[s] || 'open';
}

// Map category from Outros form to SupportType
export const mapCategoryToType = (category: string): SupportType => {
  const mapping: Record<string, SupportType> = {
    'Dúvida técnica': 'tecnico',
    'Problema de funcionamento': 'tecnico',
    'Sugestão de melhoria': 'outro',
    'Financeiro': 'financeiro',
    'Outro': 'outro',
    'WhatsApp': 'whatsapp',
    'Funil': 'funil',
    'IA': 'ia',
    'IA de Ligação': 'ia',
  };
  return mapping[category] || 'outro';
};

// Helper to create IA Ligação configuration ticket
export const createIALigacaoTicket = (
  config: {
    objetivo: string;
    scriptInicial: string;
    tomDeVoz: string;
    informacoesColetadas: string;
    criterioSucesso: string;
    clienteAtende: string;
    clienteNaoAtende: string;
    clientePedeRetorno: string;
  },
  tenantId: string = 'current-tenant',
  tenantName: string = 'Empresa Atual',
  userId: string = 'current-user',
  userName: string = 'Usuário Atual'
): SupportTicket => {
  const description = `
**Objetivo da Ligação:**
${config.objetivo}

**Script Inicial:**
${config.scriptInicial}

**Tom de Voz:** ${config.tomDeVoz}

**Informações a Coletar:**
${config.informacoesColetadas}

**Critério de Sucesso:**
${config.criterioSucesso}

**Comportamento quando Cliente Atende:**
${config.clienteAtende}

**Comportamento quando Cliente Não Atende:**
${config.clienteNaoAtende}

**Comportamento quando Cliente Pede Retorno:**
${config.clientePedeRetorno}
`.trim();

  return supportTicketsApi.add({
    tenantId,
    tenantName,
    userId,
    userName,
    type: 'ia',
    subject: 'Configuração: IA de Ligação',
    description,
    priority: 'media',
    status: 'aberto',
    createdAt: new Date().toISOString(),
  });
};

// Helper to create ticket from Outros form
export const createSupportTicketFromForm = (
  assunto: string,
  categoria: string,
  descricao: string,
  tenantId: string = 'current-tenant',
  tenantName: string = 'Empresa Atual',
  userId: string = 'current-user',
  userName: string = 'Usuário Atual',
  priority: SupportPriority = 'media'
): SupportTicket => {
  return supportTicketsApi.add({
    tenantId,
    tenantName,
    userId,
    userName,
    type: mapCategoryToType(categoria),
    subject: assunto,
    description: descricao,
    priority,
    status: 'aberto',
    createdAt: new Date().toISOString(),
  });
};

// Helper to create service request ticket
export const createServiceRequestTicket = (
  serviceName: string,
  tenantId: string = 'current-tenant',
  tenantName: string = 'Empresa Atual',
  userId: string = 'current-user',
  userName: string = 'Usuário Atual'
): SupportTicket => {
  return supportTicketsApi.add({
    tenantId,
    tenantName,
    userId,
    userName,
    type: 'outro',
    subject: `Solicitação de Serviço: ${serviceName}`,
    description: `Cliente solicitou informações sobre o serviço: ${serviceName}. Entrar em contato para apresentar proposta.`,
    priority: 'media',
    status: 'aberto',
    createdAt: new Date().toISOString(),
  });
};

// Helper to create webhook integration request ticket
export const createWebhookIntegrationTicket = (
  config: {
    nomeIntegracao: string;
    sistemaOrigem: string;
    sistemaDestino: string;
    eventoTrigger: string;
    dadosEnviados: string;
    observacoes: string;
  },
  tenantId: string = 'current-tenant',
  tenantName: string = 'Empresa Atual',
  userId: string = 'current-user',
  userName: string = 'Usuário Atual'
): SupportTicket => {
  const description = `
**Nome da Integração:**
${config.nomeIntegracao}

**Sistema de Origem:**
${config.sistemaOrigem}

**Sistema de Destino:**
${config.sistemaDestino || 'Não especificado'}

**Evento que dispara o webhook:**
${config.eventoTrigger}

**Dados a serem enviados:**
${config.dadosEnviados || 'Não especificado'}

**Observações adicionais:**
${config.observacoes || 'Nenhuma'}
`.trim();

  return supportTicketsApi.add({
    tenantId,
    tenantName,
    userId,
    userName,
    type: 'tecnico',
    subject: `Solicitação de Integração via Webhook: ${config.nomeIntegracao}`,
    description,
    priority: 'media',
    status: 'aberto',
    createdAt: new Date().toISOString(),
  });
};

// Helper to create plan upgrade request ticket
export const createUpgradeRequestTicket = (
  currentPlan: string,
  tenantId: string = 'current-tenant',
  tenantName: string = 'Empresa Atual',
  userId: string = 'current-user',
  userName: string = 'Usuário Atual'
): SupportTicket => {
  return supportTicketsApi.add({
    tenantId,
    tenantName,
    userId,
    userName,
    type: 'financeiro',
    subject: `Solicitação de Upgrade de Plano`,
    description: `Cliente demonstrou interesse em fazer upgrade do plano atual (${currentPlan}). Entrar em contato para apresentar opções e condições comerciais.`,
    priority: 'alta',
    status: 'aberto',
    createdAt: new Date().toISOString(),
  });
};

