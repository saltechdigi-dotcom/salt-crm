// Shared Support Tickets Store
// This store is used to share support tickets between /outros and /super-admin

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
  // Get all tickets
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

  // Add new ticket
  add: (ticket: Omit<SupportTicket, 'id'>): SupportTicket => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    supportTicketsStore = [newTicket, ...supportTicketsStore];
    notifyListeners();
    console.log('Support ticket added:', newTicket);
    return newTicket;
  },

  // Update ticket
  update: (id: string, updates: Partial<SupportTicket>): SupportTicket | undefined => {
    const index = supportTicketsStore.findIndex(t => t.id === id);
    if (index === -1) return undefined;

    supportTicketsStore[index] = { ...supportTicketsStore[index], ...updates };
    supportTicketsStore = [...supportTicketsStore]; // Trigger reactivity
    notifyListeners();
    return supportTicketsStore[index];
  },

  // Delete ticket
  delete: (id: string): boolean => {
    const initialLength = supportTicketsStore.length;
    supportTicketsStore = supportTicketsStore.filter(t => t.id !== id);
    notifyListeners();
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

