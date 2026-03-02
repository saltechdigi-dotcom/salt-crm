// Clients Store - SALT CRM
// Connected to /leads API (clients = leads with convertedToClientAt)
import { create } from 'zustand';
import api from '@/lib/api';

export interface Client {
  id: string;
  name: string;
  phone: string;
  origin: string;
  qualified: boolean;
  status: 'Frio' | 'Morno' | 'Quente' | 'Qualificado' | 'Em Atendimento' | 'Em Negociação' | 'Fechado – Ganho' | 'Arquivado';
  createdAt: string;
  responsavel: string;
  email?: string;
  product?: string;
  reference?: string;
  notes?: string;
}

// Color mapping for status badges
export const statusColors: Record<string, string> = {
  'Frio': '#5B8DEF',
  'Morno': '#F5A15D',
  'Quente': '#E96A6A',
  'Qualificado': '#4FC3B5',
  'Em Atendimento': '#9B7CF4',
  'Em Negociação': '#F4C95D',
  'Fechado – Ganho': '#4CAF50',
  'Arquivado': '#607D8B',
};

// Map backend temperature/stage to frontend status
function mapLeadToStatus(lead: any): Client['status'] {
  if (lead.stage?.name) return lead.stage.name as Client['status'];
  if (lead.temperature === 'cold') return 'Frio';
  if (lead.temperature === 'warm') return 'Morno';
  if (lead.temperature === 'hot') return 'Quente';
  return 'Frio';
}

// Map backend lead to Client
function mapLeadToClient(lead: any): Client {
  return {
    id: lead.id,
    name: lead.name || '',
    phone: lead.phone || '',
    origin: lead.origin?.name || lead.originId || '',
    qualified: lead.qualifiedByAI || false,
    status: mapLeadToStatus(lead),
    createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : '',
    responsavel: lead.assignedTo?.name || '',
    email: lead.email || undefined,
    product: lead.product || undefined,
    reference: lead.reference || undefined,
    notes: lead.observations || undefined,
  };
}

interface ClientsState {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  loading: false,

  fetchClients: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/leads', { params: { limit: 500 } });
      const data = res.data?.data || res.data || [];
      const leads = Array.isArray(data) ? data : [];
      set({ clients: leads.map(mapLeadToClient), loading: false });
    } catch (err) {
      console.error('Error fetching clients:', err);
      set({ loading: false });
    }
  },

  addClient: async (clientData) => {
    try {
      const res = await api.post('/leads', {
        name: clientData.name,
        phone: clientData.phone,
        email: clientData.email,
        reference: clientData.reference,
      });
      const newClient: Client = {
        ...clientData,
        id: res.data.id || `client-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      set((state) => ({ clients: [...state.clients, newClient] }));
    } catch (err) {
      console.error('Error creating client:', err);
      // Fallback: add locally
      const newClient: Client = {
        ...clientData,
        id: `client-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      set((state) => ({ clients: [...state.clients, newClient] }));
    }
  },

  updateClient: async (id, data) => {
    try {
      await api.put(`/leads/${id}`, data);
    } catch (err) {
      console.error('Error updating client:', err);
    }
    set((state) => ({
      clients: state.clients.map((client) =>
        client.id === id ? { ...client, ...data } : client
      ),
    }));
  },

  deleteClient: async (id) => {
    try {
      await api.delete(`/leads/${id}`);
    } catch (err) {
      console.error('Error deleting client:', err);
    }
    set((state) => ({
      clients: state.clients.filter((client) => client.id !== id),
    }));
  },

  getClientById: (id) => {
    return get().clients.find((client) => client.id === id);
  },
}));

// Auto-fetch on first use
let _fetched = false;
useClientsStore.subscribe((state) => {
  if (!_fetched && !state.loading && state.clients.length === 0) {
    _fetched = true;
    state.fetchClients();
  }
});

// Export functions for CSV
export function exportClientsToCSV(clients: Client[]): string {
  const headers = [
    'Nome',
    'Telefone',
    'Origem',
    'Qualificado',
    'Status',
    'Dt. Criação',
    'Responsável',
    'Email',
    'Produto',
    'Referência',
    'Observações',
  ];

  const rows = clients.map((client) => [
    client.name,
    client.phone,
    client.origin,
    client.qualified ? 'Sim' : 'Não',
    client.status,
    client.createdAt,
    client.responsavel,
    client.email || '',
    client.product || '',
    client.reference || '',
    client.notes || '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
