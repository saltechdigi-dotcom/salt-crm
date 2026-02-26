import React, { useState, useMemo, useEffect } from 'react';

import { Lead, DashboardFilters } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Calendar, Filter, RotateCcw, ChevronDown, ChevronUp, Plus, Search, Phone, MessageCircle, MessageSquare, FileText, ArrowUp, ArrowDown, UserPlus, X, Pin, ShoppingCart, Headphones, History, Users, DollarSign, Tag, Target, Maximize2, Minimize2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useLeadDemands, getUniqueProducts, useLeadSchedules, formatScheduleType } from '@/stores/leads';
import { useLabelsStore } from '@/stores/labels';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  ModalTrigger,
} from '@/components/ui/modal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PinConversationModal } from '@/components/chat/PinConversationModal';
import { SellerPinsPanel } from '@/components/funil/SellerPinsPanel';
import { SellerSchedulesPanel } from '@/components/funil/SellerSchedulesPanel';
import { LeadHistoryPanel } from '@/components/leads/LeadHistoryPanel';
import OperationalReport from '@/components/reports/OperationalReport';
import { NpsDetailModal, NpsCategory } from '@/components/nps/NpsDetailModal';
import { ChatDialog } from '@/components/chat/ChatDialog';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Header } from '@/components/ui/header';
import api from '@/lib/api';

// Interface para leads da tabela (igual ao Funil)
interface TableLead {
  id: string;
  name: string;
  phone: string;
  origin: string;
  status: string;
  statusColor: string;
  qualified: boolean;
  dataCriacao: string;
  ultInt: string;
  vendedor: string;
  gerente: string;
  resumo: string;
  produto?: string;
}

// Mock data para tabelas (igual ao Funil)
const tableLeadsFunil: TableLead[] = [];

const tableLeadsCarteira: TableLead[] = [];

const tableLeadsProspeccao: TableLead[] = [];

// Softer, less saturated colors for premium feel
const COLORS = ['#5A8FD4', '#7B6DB3', '#9B7DB8', '#D4A03A', '#5CB87A', '#D46B6B'];

const Dashboard: React.FC = () => {
  const { toast } = useToast();

  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: '',
    endDate: '',
    origin: '',
    managerId: '',
    agentId: '',
  });

  // Sales stats from API
  const [salesStats, setSalesStats] = useState<{
    todayRevenue: number;
    todaySalesCount: number;
    monthRevenue: number;
    monthSalesCount: number;
    totalRevenue: number;
    totalSalesCount: number;
    pendingSalesCount: number;
    recentSales: any[];
    salesByAgent: any[];
  } | null>(null);

  useEffect(() => {
    api.get('/sales/stats')
      .then(res => setSalesStats(res.data))
      .catch(err => console.error('Error fetching sales stats:', err));
  }, []);

  // Lead origins from API
  const [leadOrigins, setLeadOrigins] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.get('/origins')
      .then(res => setLeadOrigins(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Error fetching origins:', err));
  }, []);

  const [selectedManager, setSelectedManager] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [chatLead, setChatLead] = useState<TableLead | null>(null);

  // Summary modal state (like Funil)
  const [summaryLead, setSummaryLead] = useState<TableLead | null>(null);

  // Table column filters
  const [filterOrigin, setFilterOrigin] = useState<string>('all');
  const [filterQualified, setFilterQualified] = useState<string>('all');
  const [filterFunnelStatus, setFilterFunnelStatus] = useState<string>('all');
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterProduto, setFilterProduto] = useState<string>('all');
  const [filterEtiqueta, setFilterEtiqueta] = useState<string>('all');

  // Role-based permissions for pinning
  const { role, permissions } = useUserRole();
  const { labels: availableLabels } = useLabelsStore();
  const isAdmin = role === 'TENANT_ADMIN';
  const { canPinLeads, isSeller, canSellerUnpin, getPendingDemand, resolveDemand, createDemandForPin } = useLeadDemands();
  const { hasActiveSchedule, getScheduleForLead } = useLeadSchedules();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortUltInt, setSortUltInt] = useState<'asc' | 'desc' | null>(null);

  // KPI filter
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);

  // Chart click filters
  const [activeChartFilter, setActiveChartFilter] = useState<{ type: string; value: string } | null>(null);

  // Removed: Ranking metric toggles (now showing both simultaneously)
  // const [agentRankingMetric, setAgentRankingMetric] = useState<'vendas' | 'atendimento'>('vendas');
  // const [managerRankingMetric, setManagerRankingMetric] = useState<'vendas' | 'atendimento'>('vendas');

  // Removed: Origin chart metric toggle (now showing both simultaneously)
  // const [originChartMetric, setOriginChartMetric] = useState<'leads' | 'vendas'>('vendas');

  // NPS Modal state (unified from Home)
  const [npsModalOpen, setNpsModalOpen] = useState(false);
  const [npsCategory, setNpsCategory] = useState<NpsCategory>("promotores");

  // Global date range filter
  const [globalDateRange, setGlobalDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Get first name from user role
  const { userName } = useUserRole();
  const firstName = userName.split(' ')[0];

  // Filtered combined ranking data based on selected manager and agent
  const filteredCombinedAgentRanking = useMemo(() => {
    // If a specific agent is selected, show only that agent
    if (filters.agentId && filters.agentId !== 'all') {
      return [].filter(a => a.agentId === filters.agentId);
    }

    // If a manager is selected, show only agents from that manager's team
    if (selectedManager && selectedManager !== 'all') {
      return [].filter(a => a.managerId === selectedManager);
    }

    return [];
  }, [filters.agentId, selectedManager]);

  const filteredCombinedManagerRanking = useMemo(() => {
    // If a manager is selected, show only that manager
    if (selectedManager && selectedManager !== 'all') {
      return [].filter(m => m.managerId === selectedManager);
    }

    // If an agent is selected, show the manager of that agent
    if (filters.agentId && filters.agentId !== 'all') {
      const agent = [].find(a => a.id === filters.agentId);
      if (agent?.managerId) {
        return [].filter(m => m.managerId === agent.managerId);
      }
    }

    return [];
  }, [selectedManager, filters.agentId]);

  // Legacy filtered ranking data (kept for compatibility if needed)
  const filteredAgentRanking = useMemo(() => {
    const baseData = [];

    // If a specific agent is selected, show only that agent
    if (filters.agentId && filters.agentId !== 'all') {
      return baseData.filter(a => a.agentId === filters.agentId);
    }

    // If a manager is selected, show only agents from that manager's team
    if (selectedManager && selectedManager !== 'all') {
      return baseData.filter(a => a.managerId === selectedManager);
    }

    return baseData;
  }, [filters.agentId, selectedManager]);

  const filteredManagerRanking = useMemo(() => {
    const baseData = [];

    // If a manager is selected, show only that manager
    if (selectedManager && selectedManager !== 'all') {
      return baseData.filter(m => m.managerId === selectedManager);
    }

    // If an agent is selected, show the manager of that agent
    if (filters.agentId && filters.agentId !== 'all') {
      const agent = [].find(a => a.id === filters.agentId);
      if (agent?.managerId) {
        return baseData.filter(m => m.managerId === agent.managerId);
      }
    }

    return baseData;
  }, [selectedManager, filters.agentId]);

  // Filtered period data based on selected manager and agent
  const filteredPeriodData = useMemo(() => {
    // Filter the detail data based on selected filters
    let filteredDetails = [];

    // If a specific agent is selected
    if (filters.agentId && filters.agentId !== 'all') {
      filteredDetails = filteredDetails.filter(d => d.agentId === filters.agentId);
    }
    // Else if a manager is selected
    else if (selectedManager && selectedManager !== 'all') {
      filteredDetails = filteredDetails.filter(d => d.managerId === selectedManager);
    }

    // Aggregate by period
    const periods = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

    const leadsData = periods.map(period => {
      const periodData = filteredDetails.filter(d => d.period === period);
      const totalLeads = periodData.reduce((sum, d) => sum + d.leads, 0);
      return { name: period, value: totalLeads };
    });

    const salesData = periods.map(period => {
      const periodData = filteredDetails.filter(d => d.period === period);
      const totalSales = periodData.reduce((sum, d) => sum + d.sales, 0);
      return { name: period, value: totalSales };
    });

    // Combined data for dual-axis chart
    const combinedData = periods.map(period => {
      const periodData = filteredDetails.filter(d => d.period === period);
      const totalLeads = periodData.reduce((sum, d) => sum + d.leads, 0);
      const totalSales = periodData.reduce((sum, d) => sum + d.sales, 0);
      return { name: period, leads: totalLeads, vendas: totalSales };
    });

    return { leads: leadsData, sales: salesData, combined: combinedData };
  }, [filters.agentId, selectedManager]);

  // Funnel stage filter (toggle from funnel clicks)
  const [funnelStageFilter, setFunnelStageFilter] = useState<string | null>(null);
  const [funnelSubStatusFilter, setFunnelSubStatusFilter] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  // Conversations panel state
  const [conversationsOpen, setConversationsOpen] = useState<boolean>(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationPhone, setSelectedConversationPhone] = useState<string | null>(null);
  const [selectedConversationName, setSelectedConversationName] = useState<string | null>(null);

  // Active tab state - MUST be before useMemo that uses it
  const [activeTab, setActiveTab] = useState<string>('funil');

  // State for leads transferred from Prospecção to Funil - MUST be before useMemo that uses it
  const [transferredLeadIds, setTransferredLeadIds] = useState<Set<string>>(new Set());

  // Dynamic funnel stages based on active tab
  const dynamicFunnelMainStages = useMemo(() => {
    // Get the leads for the current tab
    let currentLeads: TableLead[] = [];
    if (activeTab === 'funil') {
      currentLeads = [...tableLeadsFunil, ...tableLeadsProspeccao.filter(l => transferredLeadIds.has(l.id))];
    } else if (activeTab === 'carteira') {
      currentLeads = tableLeadsCarteira;
    } else if (activeTab === 'prospeccao') {
      currentLeads = tableLeadsProspeccao.filter(l => !transferredLeadIds.has(l.id));
    }

    // Count leads by status
    const countByStatus = (status: string) =>
      currentLeads.filter(l => l.status.toLowerCase().includes(status.toLowerCase())).length;

    if (activeTab === 'prospeccao') {
      // Prospecção shows ALL leads as Frio - count is total leads in the tab
      const totalLeads = currentLeads.length;
      return [
        { id: 'stage-frio', name: 'Frio', order: 1, color: '#5B8DEF', count: totalLeads },
      ];
    }

    if (activeTab === 'carteira') {
      // Carteira has two "Fechado Ganho" stages
      const ganhoTotal = countByStatus('ganho');
      const ganhoMes = Math.ceil(ganhoTotal * 0.4);
      const ganhoHistorico = ganhoTotal - ganhoMes + 40; // Historical accumulated

      return [
        { id: 'stage-frio', name: 'Frio', order: 1, color: '#5B8DEF', count: countByStatus('frio') },
        { id: 'stage-morno', name: 'Morno', order: 2, color: '#F5A15D', count: countByStatus('morno') },
        { id: 'stage-quente', name: 'Quente', order: 3, color: '#E96A6A', count: countByStatus('quente') },
        { id: 'stage-qualificado', name: 'Qualificado', order: 4, color: '#4FC3B5', count: countByStatus('qualificado') },
        { id: 'stage-em-atendimento', name: 'Em Atendimento', order: 5, color: '#9B7CF4', count: countByStatus('em atendimento') },
        { id: 'stage-em-negociacao', name: 'Em Negociação', order: 6, color: '#F4C95D', count: countByStatus('em negociação') },
        { id: 'stage-ganho-mes', name: 'Ganho – Mês', order: 7, color: '#4CAF50', count: ganhoMes },
        { id: 'stage-ganho-historico', name: 'Ganho – Histórico', order: 8, color: '#2E7D32', count: ganhoHistorico },
      ];
    }

    // Default: Funil
    return [
      { id: 'stage-frio', name: 'Frio', order: 1, color: '#5B8DEF', count: countByStatus('frio') },
      { id: 'stage-morno', name: 'Morno', order: 2, color: '#F5A15D', count: countByStatus('morno') },
      { id: 'stage-quente', name: 'Quente', order: 3, color: '#E96A6A', count: countByStatus('quente') },
      { id: 'stage-qualificado', name: 'Qualificado', order: 4, color: '#4FC3B5', count: countByStatus('qualificado') },
      { id: 'stage-em-atendimento', name: 'Em Atendimento', order: 5, color: '#9B7CF4', count: countByStatus('em atendimento') },
      { id: 'stage-em-negociacao', name: 'Em Negociação', order: 6, color: '#F4C95D', count: countByStatus('em negociação') },
      { id: 'stage-ganho', name: 'Fechado – Ganho', order: 7, color: '#4CAF50', count: countByStatus('ganho') },
    ];
  }, [activeTab, transferredLeadIds]);

  // Dynamic exit stages based on active tab
  const dynamicFunnelExitStagesLeft = useMemo(() => {
    let currentLeads: TableLead[] = [];
    if (activeTab === 'funil') {
      currentLeads = [...tableLeadsFunil, ...tableLeadsProspeccao.filter(l => transferredLeadIds.has(l.id))];
    } else if (activeTab === 'carteira') {
      currentLeads = tableLeadsCarteira;
    } else if (activeTab === 'prospeccao') {
      currentLeads = tableLeadsProspeccao.filter(l => !transferredLeadIds.has(l.id));
    }

    const countByStatus = (status: string) =>
      currentLeads.filter(l => l.status.toLowerCase().includes(status.toLowerCase())).length;

    return [
      { id: 'stage-arquivado', name: 'Arquivado', order: 8, color: '#607D8B', count: countByStatus('arquivado') },
      { id: 'stage-perdido', name: 'Fechado – Perdido', order: 9, color: '#9E9E9E', count: countByStatus('perdido') },
    ];
  }, [activeTab, transferredLeadIds]);

  const dynamicFunnelExitStagesRight = useMemo(() => {
    let currentLeads: TableLead[] = [];
    if (activeTab === 'funil') {
      currentLeads = [...tableLeadsFunil, ...tableLeadsProspeccao.filter(l => transferredLeadIds.has(l.id))];
    } else if (activeTab === 'carteira') {
      currentLeads = tableLeadsCarteira;
    } else if (activeTab === 'prospeccao') {
      currentLeads = tableLeadsProspeccao.filter(l => !transferredLeadIds.has(l.id));
    }

    const countByStatus = (status: string) =>
      currentLeads.filter(l => l.status.toLowerCase().includes(status.toLowerCase())).length;

    return [
      { id: 'stage-fora-perfil', name: 'Fora de Perfil', order: 10, color: '#78909C', count: countByStatus('fora') },
      { id: 'stage-sem-retorno', name: 'Sem Retorno', order: 11, color: '#90A4AE', count: countByStatus('sem retorno') },
    ];
  }, [activeTab, transferredLeadIds]);

  // Substatus definitions for Dashboard funnel (dynamic based on tab)
  const stageSubStatuses: Record<string, { id: string; name: string; count: number }[]> = useMemo(() => {
    if (activeTab === 'prospeccao') return {}; // No substatus for prospeccao

    const emAtendimentoCount = dynamicFunnelMainStages.find(s => s.id === 'stage-em-atendimento')?.count || 0;
    const emNegociacaoCount = dynamicFunnelMainStages.find(s => s.id === 'stage-em-negociacao')?.count || 0;

    return {
      'stage-em-atendimento': [
        { id: 'carteira', name: 'Carteira', count: Math.floor(emAtendimentoCount * 0.5) },
        { id: 'marcar_agenda', name: 'Marcar Agenda', count: Math.ceil(emAtendimentoCount * 0.5) },
      ],
      'stage-em-negociacao': [
        { id: 'proposta_enviada', name: 'Proposta Enviada', count: emNegociacaoCount },
      ],
    };
  }, [activeTab, dynamicFunnelMainStages]);

  // Calendar popover state
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Leads table collapsible state
  const [leadsTableOpen, setLeadsTableOpen] = useState<boolean>(false);
  const [leadsTablePinned, setLeadsTablePinned] = useState<boolean>(false);

  // State for pinned leads
  const [pinnedLeadIds, setPinnedLeadIds] = useState<Set<string>>(new Set());

  // State for pin modal
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [leadToPin, setLeadToPin] = useState<TableLead | null>(null);

  // Mock sellers for pin modal
  const mockSellers = [
    { id: 'seller_1', name: 'Carlos Vendedor', email: 'carlos@empresa.com' },
    { id: 'seller_2', name: 'Ana Vendedora', email: 'ana@empresa.com' },
    { id: 'seller_3', name: 'Roberto Silva', email: 'roberto@empresa.com' },
    { id: 'seller_4', name: 'Mariana Costa', email: 'mariana@empresa.com' },
  ];

  // Handler to open chat from pin/schedule panels (by leadId)
  const handleOpenChatFromPanel = (leadId: string, leadName: string) => {
    // Find lead data from all leads
    const allLeads = [...tableLeadsFunil, ...tableLeadsCarteira, ...tableLeadsProspeccao];
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      setChatLead(lead);
    } else {
      // Fallback with minimal data
      setChatLead({
        id: leadId,
        name: leadName,
        phone: '',
        origin: '',
        status: '',
        statusColor: '',
        qualified: false,
        dataCriacao: '',
        ultInt: '',
        vendedor: '',
        gerente: '',
        resumo: '',
      });
    }
  };

  // Pinned leads data for header panel
  const pinnedLeadsForPanel = useMemo(() => {
    const allLeads = [...tableLeadsFunil, ...tableLeadsCarteira, ...tableLeadsProspeccao];
    return Array.from(pinnedLeadIds).map(id => {
      const lead = allLeads.find(l => l.id === id);
      return lead ? { id: lead.id, name: lead.name, origin: lead.origin } : null;
    }).filter((l): l is { id: string; name: string; origin: string } => l !== null);
  }, [pinnedLeadIds]);

  const handleTogglePin = (leadId: string, leadVendedor?: string) => {
    const isPinned = pinnedLeadIds.has(leadId);

    if (isPinned) {
      if (isSeller && !canSellerUnpin(leadId)) {
        const demand = getPendingDemand(leadId);
        toast({
          title: 'Não é possível desafixar',
          description: demand
            ? `Você precisa resolver a demanda: "${demand.message}" antes de desafixar.`
            : 'Resolva a demanda pendente antes de desafixar.',
          variant: 'destructive',
        });
        return;
      }
      setPinnedLeadIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(leadId);
        return newSet;
      });
      toast({ title: 'Lead desafixado', description: 'O lead foi removido do topo da lista.' });
    } else {
      if (!canPinLeads) {
        toast({
          title: 'Sem permissão',
          description: 'Apenas Gerentes e Administradores podem fixar leads.',
          variant: 'destructive',
        });
        return;
      }
      // Find the lead from [] and open pin modal
      const lead = [].find(l => l.id === leadId);
      if (lead) {
        // Convert to TableLead format
        const tableLead: TableLead = {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          origin: lead.origin,
          status: lead.status || '',
          statusColor: '#5B8DEF',
          qualified: lead.qualifiedByAI || false,
          dataCriacao: lead.createdAt || '',
          ultInt: '',
          vendedor: lead.agentId || '-',
          gerente: lead.managerId || '-',
          resumo: '',
        };
        setLeadToPin(tableLead);
        setPinModalOpen(true);
      }
    }
  };

  const handlePinConfirm = (sellerId: string, note: string) => {
    if (leadToPin) {
      setPinnedLeadIds(prev => {
        const newSet = new Set(prev);
        newSet.add(leadToPin.id);
        return newSet;
      });
      // Create demand in the store - this updates the header counter
      createDemandForPin(leadToPin.id, sellerId, note);
      toast({
        title: 'Lead fixado',
        description: `${leadToPin.name} foi fixado para ${sellerId} com uma observação.`,
      });
    }
    setLeadToPin(null);
  };

  // Handle chat click - opens InlineConversationsPanel with selected conversation
  const handleChatClick = (lead: TableLead, sourceTab: 'funil' | 'carteira' | 'prospeccao') => {
    if (sourceTab === 'prospeccao' && !transferredLeadIds.has(lead.id)) {
      // Transfer lead from Prospecção to Funil
      setTransferredLeadIds(prev => new Set(prev).add(lead.id));
      toast({
        title: 'Lead transferido para o Funil',
        description: `${lead.name} foi movido de Prospecção para Funil automaticamente.`,
      });
    }
    // Open the conversations panel and select the lead's conversation (by ID, phone, and name)
    setSelectedConversationId(lead.id);
    setSelectedConversationPhone(lead.phone);
    setSelectedConversationName(lead.name);
    setConversationsOpen(true);
  };

  // Modal for creating new client
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    reference: '',
    origin: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    phone: '',
    origin: '',
  });

  // Check if form is valid
  const isFormValid = newLead.name.trim() !== '' && newLead.phone.trim() !== '' && newLead.origin !== '';

  const handleCreateLead = () => {
    const errors = {
      name: newLead.name.trim() === '' ? 'Nome é obrigatório' : '',
      phone: newLead.phone.trim() === '' ? 'Telefone é obrigatório' : '',
      origin: newLead.origin === '' ? 'Canal de origem é obrigatório' : '',
    };

    setFormErrors(errors);

    if (errors.name || errors.phone || errors.origin) {
      return;
    }

    console.log('Creating lead:', newLead);
    toast({
      title: 'Cliente cadastrado',
      description: `${newLead.name} foi adicionado ao funil com status Frio.`,
    });
    setIsModalOpen(false);
    setNewLead({ name: '', phone: '', email: '', reference: '', origin: '' });
    setFormErrors({ name: '', phone: '', origin: '' });
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setFormErrors({ name: '', phone: '', origin: '' });
      setNewLead({ name: '', phone: '', email: '', reference: '', origin: '' });
    }
  };

  // Handle funnel stage click - toggle behavior with substatus support
  const handleFunnelStageClick = (stageId: string) => {
    const hasSubStatus = stageId in stageSubStatuses;

    if (hasSubStatus) {
      // Stage has substatus - toggle expansion
      if (expandedStage === stageId) {
        setExpandedStage(null);
        setFunnelStageFilter(null);
        setFunnelSubStatusFilter(null);
        setSelectedStage(null);
      } else {
        setExpandedStage(stageId);
        setFunnelStageFilter(stageId);
        setFunnelSubStatusFilter(null);
        setSelectedStage(stageId);
        // Clear other conflicting filters
        setActiveKpiFilter(null);
        setActiveChartFilter(null);
      }
    } else {
      // No substatus - direct filter
      if (funnelStageFilter === stageId) {
        setFunnelStageFilter(null);
        setSelectedStage(null);
      } else {
        setFunnelStageFilter(stageId);
        setSelectedStage(stageId);
        setExpandedStage(null);
        setFunnelSubStatusFilter(null);
        // Clear other conflicting filters
        setActiveKpiFilter(null);
        setActiveChartFilter(null);
      }
    }
  };

  // Handle substatus click
  const handleSubStatusClick = (stageId: string, subStatusId: string) => {
    if (funnelSubStatusFilter === subStatusId) {
      // Same substatus clicked - filter by parent stage only
      setFunnelSubStatusFilter(null);
    } else {
      // New substatus clicked - apply substatus filter
      setFunnelStageFilter(stageId);
      setFunnelSubStatusFilter(subStatusId);
      setSelectedStage(stageId);
    }
  };

  // Get stage name by ID (for display)
  const getFunnelStageName = (stageId: string | null) => {
    if (!stageId) return '';
    const stage = { stages: [] }.stages.find(s => s.id === stageId);
    return stage?.name || '';
  };

  // Get substatus name by ID
  const getSubStatusName = (stageId: string, subStatusId: string) => {
    const subStatuses = stageSubStatuses[stageId];
    const subStatus = subStatuses?.find(ss => ss.id === subStatusId);
    return subStatus?.name || '';
  };

  const filteredAgents = selectedManager && selectedManager !== 'all'
    ? [].filter(a => a.managerId === selectedManager)
    : [];

  const handleApplyFilters = () => {
    // In production, this would call an API with the filters
    console.log('Applying filters:', filters);
  };

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({ ...filters, startDate: today, endDate: today });
  };

  const handleClear = () => {
    setFilters({
      startDate: '',
      endDate: '',
      origin: '',
      managerId: '',
      agentId: '',
    });
    setSelectedManager('');
    setSelectedStage(null);
    setFilterOrigin('all');
    setFilterQualified('all');
    setFilterFunnelStatus('all');
    setFilterResponsible('all');
    setActiveKpiFilter(null);
    setActiveChartFilter(null);
    setFunnelStageFilter(null);
    setFunnelSubStatusFilter(null);
    setExpandedStage(null);
  };

  // Handle chart element click
  const handleChartClick = (type: string, value: string) => {
    // Toggle if same filter clicked
    if (activeChartFilter?.type === type && activeChartFilter?.value === value) {
      setActiveChartFilter(null);
      if (type === 'origin') setFilterOrigin('all');
      if (type === 'agent') setFilterResponsible('all');
      if (type === 'manager') {
        // Clear manager filter
        setSelectedManager('');
        setFilters(prev => ({ ...prev, managerId: '' }));
      }
      return;
    }

    setActiveChartFilter({ type, value });
    setActiveKpiFilter(null);
    setSelectedStage(null);
    setFunnelStageFilter(null);

    if (type === 'origin') {
      setFilterOrigin(value);
    } else if (type === 'agent') {
      // Find agent by name and filter
      const agent = [].find(a => a.name === value);
      if (agent) {
        setFilterResponsible(agent.id);
      }
    } else if (type === 'manager') {
      // Find manager by name and filter leads by agents of that manager
      const manager = [].find(m => m.name === value);
      if (manager) {
        setSelectedManager(manager.id);
        setFilters(prev => ({ ...prev, managerId: manager.id }));
      }
    }
  };

  // Handle KPI click
  const handleKpiClick = (kpiLabel: string) => {
    // Toggle if same KPI clicked
    if (activeKpiFilter === kpiLabel) {
      setActiveKpiFilter(null);
      setFilterQualified('all');
      return;
    }

    setActiveKpiFilter(kpiLabel);

    // Apply specific filter based on KPI
    switch (kpiLabel) {
      case 'Total de Leads':
        // Show all leads - reset filters
        setFilterQualified('all');
        break;
      case 'Qualificados (IA)':
        setFilterQualified('yes');
        break;
      case 'Não Qualificados/Roleta':
        setFilterQualified('no');
        break;
      case 'Qualificados/Roleta':
        // Filter leads waiting in roleta (mocked as leads without agent)
        setFilterResponsible('all');
        break;
      default:
        break;
    }
  };

  // Get stage name by ID
  const getStageName = (stageId?: string) => {
    if (!stageId) return '-';
    const stage = { stages: [] }.stages.find(s => s.id === stageId);
    return stage?.name || '-';
  };

  // Filter leads based on all filters
  const filteredLeads = [].filter(lead => {
    // KPI-based filters
    if (activeKpiFilter === 'Qualificados (IA)' && !lead.qualifiedByAI) return false;
    if (activeKpiFilter === 'Não Qualificados/Roleta' && lead.qualifiedByAI) return false;

    // Funnel stage filter (from clicking funnel stages - takes priority)
    if (funnelStageFilter && lead.stageId !== funnelStageFilter) return false;

    // Stage filter from funnel click (legacy - keeping for compatibility)
    if (!funnelStageFilter && selectedStage && lead.stageId !== selectedStage) return false;

    // Origin filter
    if (filterOrigin !== 'all' && lead.origin !== filterOrigin) return false;

    // Qualified filter (from dropdown)
    if (!activeKpiFilter) {
      if (filterQualified === 'yes' && !lead.qualifiedByAI) return false;
      if (filterQualified === 'no' && lead.qualifiedByAI) return false;
    }

    // Funnel status filter (dropdown) - only if no funnel stage filter
    if (!funnelStageFilter && filterFunnelStatus !== 'all' && lead.stageId !== filterFunnelStatus) return false;

    // Responsible filter
    if (filterResponsible !== 'all' && lead.agentId !== filterResponsible) return false;

    // Manager filter (from chart click)
    if (activeChartFilter?.type === 'manager') {
      const manager = [].find(m => m.name === activeChartFilter.value);
      if (manager && lead.managerId !== manager.id) return false;
    }

    return true;
  });

  // Helper to get agent name by ID
  const getAgentName = (agentId?: string) => {
    if (!agentId) return '-';
    const agent = [].find(a => a.id === agentId);
    return agent?.name || '-';
  };

  const leadColumns = [
    { key: 'name' as keyof Lead, header: 'Nome', mobileWidth: 'w-[30%]' },
    {
      key: 'phone' as keyof Lead,
      header: 'Telefone',
      className: 'hidden md:table-cell'
    },
    {
      key: 'origin' as keyof Lead,
      header: 'Origem',
      className: 'hidden md:table-cell',
      render: (lead: Lead) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFilterOrigin(lead.origin);
            setActiveKpiFilter(null);
          }}
          className="text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
        >
          {lead.origin}
        </button>
      )
    },
    {
      key: 'qualifiedByAI' as keyof Lead,
      header: 'Qualificado',
      className: 'hidden md:table-cell',
      render: (lead: Lead) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setFilterQualified(lead.qualifiedByAI ? 'yes' : 'no');
            setActiveKpiFilter(null);
          }}
          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${lead.qualifiedByAI
            ? 'bg-success/10 text-success hover:ring-success/50'
            : 'bg-muted text-muted-foreground hover:ring-muted-foreground/50'
            }`}
        >
          {lead.qualifiedByAI ? 'Sim' : 'Não'}
        </button>
      )
    },
    {
      key: 'stageId' as keyof Lead,
      header: 'Status',
      mobileWidth: 'w-[18%]',
      render: (lead: Lead) => {
        const stage = { stages: [] }.stages.find(s => s.id === lead.stageId);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFilterFunnelStatus(lead.stageId || 'all');
              setActiveKpiFilter(null);
            }}
            className="cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all hover:scale-105"
            style={{
              // @ts-ignore
              '--tw-ring-color': stage?.color || '#888',
            }}
            title={stage?.name || '-'}
          >
            {/* Mobile: only color dot */}
            <span
              className="md:hidden inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: stage?.color || '#888' }}
            />
            {/* Desktop: full badge */}
            <span
              className="hidden md:inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: stage?.color || '#888' }}
            >
              {stage?.name || '-'}
            </span>
          </button>
        );
      }
    },
    {
      key: 'createdAt' as keyof Lead,
      header: 'Dt. Criação',
      className: 'hidden md:table-cell',
      render: (lead: Lead) => new Date(lead.createdAt).toLocaleDateString('pt-BR')
    },
    {
      key: 'agentId' as keyof Lead,
      header: 'Responsável',
      mobileWidth: 'w-[37%]',
      render: (lead: Lead) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (lead.agentId) {
              setFilterResponsible(lead.agentId);
              setActiveKpiFilter(null);
            }
          }}
          className="text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
        >
          {getAgentName(lead.agentId)}
        </button>
      )
    },
    {
      key: 'updatedAt' as keyof Lead,
      header: 'Ult. Int.',
      className: 'hidden md:table-cell',
      render: (lead: Lead) => {
        const now = new Date();
        const updated = new Date(lead.updatedAt);
        const diffMs = now.getTime() - updated.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) return `${diffDays} d`;
        if (diffHours > 0) return `${diffHours} h`;
        return 'Agora';
      }
    },
  ];

  // Get unique origins from leads
  const uniqueOrigins = [...new Set([].map(l => l.origin))];

  return (
    <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
      <Header showModuleIcons />

      <main className="container py-3 sm:py-4 space-y-3">
        {/* Greeting Row with Global Date and Compact Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-foreground">
              {getGreeting()}, <span className="text-primary">{firstName}</span>
            </h1>
            <span className="text-base sm:text-lg">👋</span>
          </div>

          {/* Compact Inline Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Select
              value={filters.origin || 'all'}
              onValueChange={(value) => setFilters({ ...filters, origin: value === 'all' ? '' : value })}
            >
              <SelectTrigger className="h-7 w-auto min-w-[90px] text-[11px] bg-background/40 border-border/25 px-2">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Origem</SelectItem>
                {leadOrigins.map((origin) => (
                  <SelectItem key={origin.id} value={origin.name}>
                    {origin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin && (
              <Select
                value={selectedManager || 'all'}
                onValueChange={(value) => {
                  setSelectedManager(value === 'all' ? '' : value);
                  setFilters({ ...filters, managerId: value === 'all' ? '' : value, agentId: '' });
                }}
              >
                <SelectTrigger className="h-7 w-auto min-w-[90px] text-[11px] bg-background/40 border-border/25 px-2">
                  <SelectValue placeholder="Gerente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Gerente</SelectItem>
                  {[].map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select
              value={filters.agentId || 'all'}
              onValueChange={(value) => {
                if (value && value !== 'all') {
                  const agent = [].find(a => a.id === value);
                  if (agent?.managerId) {
                    setSelectedManager(agent.managerId);
                    setFilters({ ...filters, agentId: value, managerId: agent.managerId });
                  } else {
                    setFilters({ ...filters, agentId: value });
                  }
                } else {
                  setFilters({ ...filters, agentId: '' });
                }
              }}
            >
              <SelectTrigger className="h-7 w-auto min-w-[90px] text-[11px] bg-background/40 border-border/25 px-2">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Agente</SelectItem>
                {filteredAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker dateRange={globalDateRange} onDateRangeChange={setGlobalDateRange} />

            {/* Clear Header Filters Button - Discrete, next to calendar */}
            {(filters.origin || selectedManager || filters.agentId || globalDateRange?.from) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({ ...filters, origin: '', managerId: '', agentId: '' });
                  setSelectedManager('');
                  setGlobalDateRange(undefined);
                }}
                className="h-7 px-2 text-[10px] text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 gap-1"
              >
                <X className="w-3 h-3" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Performance Comercial Section */}
        <OperationalReport />

        {/* NPS Performance */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/15 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#4FC3B5]" />
              <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">NPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/50">Pesquisas:</span>
              <span className="text-sm font-bold text-primary">0</span>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Respostas */}
            <div className="bg-[#4FC3B5]/10 rounded-lg p-3 border border-[#4FC3B5]/20">
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">Respostas</p>
              <p className="text-xl font-bold text-[#4FC3B5]">0</p>
            </div>

            {/* Promotores - Clicável */}
            <button
              onClick={() => { setNpsCategory("promotores"); setNpsModalOpen(true); }}
              className="bg-success/10 rounded-lg p-3 border border-success/20 text-left hover:bg-success/20 hover:border-success/40 transition-all duration-200 active:scale-[0.98]"
            >
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">🟢 Promotores</p>
              <p className="text-xl font-bold text-success">0</p>
            </button>

            {/* Neutros - Clicável */}
            <button
              onClick={() => { setNpsCategory("neutros"); setNpsModalOpen(true); }}
              className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20 text-left hover:bg-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200 active:scale-[0.98]"
            >
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">🟡 Neutros</p>
              <p className="text-xl font-bold text-yellow-600">0</p>
            </button>

            {/* Detratores - Clicável */}
            <button
              onClick={() => { setNpsCategory("detratores"); setNpsModalOpen(true); }}
              className="bg-destructive/10 rounded-lg p-3 border border-destructive/20 text-left hover:bg-destructive/20 hover:border-destructive/40 transition-all duration-200 active:scale-[0.98]"
            >
              <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mb-1">🔴 Detratores</p>
              <p className="text-xl font-bold text-destructive">0</p>
            </button>
          </div>
        </div>

        {/* Visão de Leads Block */}
        <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="px-2.5 py-1.5 border-b border-border/10 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary/70" />
            <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Visão de Leads</span>
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[].map((kpi, index) => {
                const isClickable = ['Total de Leads', 'Qualificados (IA)', 'Não Qualificados/Roleta', 'Qualificados/Roleta'].includes(kpi.label);
                const isActive = activeKpiFilter === kpi.label;

                return (
                  <KPICard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    color={kpi.color}
                    size="sm"
                    className={cn(
                      "animate-slide-up",
                      isClickable && "cursor-pointer hover:scale-[1.01] transition-all duration-150",
                      isActive && "ring-1 ring-primary/50 ring-offset-1 ring-offset-background"
                    )}
                    style={{ animationDelay: `${index * 40}ms` }}
                    onClick={isClickable ? () => handleKpiClick(kpi.label) : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Visão de Vendas Block */}
        <div className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="px-2.5 py-1.5 border-b border-border/10 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-green-500/70" />
            <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">Visão de Vendas</span>
          </div>
          <div className="p-2.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <KPICard
                label="Vendas Hoje"
                value={salesStats ? `R$ ${Number(salesStats.todayRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                color="success"
                size="sm"
                className="animate-slide-up"
                style={{ animationDelay: '0ms' }}
              />
              <KPICard
                label="Vendas no Mês"
                value={salesStats ? `R$ ${Number(salesStats.monthRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                color="primary"
                size="sm"
                className="animate-slide-up"
                style={{ animationDelay: '40ms' }}
              />
              <KPICard
                label="Total de Vendas"
                value={salesStats?.totalSalesCount?.toString() || '0'}
                color="info"
                size="sm"
                className="animate-slide-up"
                style={{ animationDelay: '80ms' }}
              />
              <KPICard
                label="Vendas Pendentes"
                value={salesStats?.pendingSalesCount?.toString() || '0'}
                color="warning"
                size="sm"
                className="animate-slide-up"
                style={{ animationDelay: '120ms' }}
              />
            </div>
          </div>
        </div>

        {/* Active Filter Indicators - Minimal */}
        {(activeKpiFilter || activeChartFilter) && (
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
            <span>Filtrando:</span>
            {activeKpiFilter && (
              <Badge variant="secondary" className="gap-1 text-[9px] font-medium py-0.5 px-1.5 bg-secondary/60">
                {activeKpiFilter}
                <button
                  onClick={() => setActiveKpiFilter(null)}
                  className="ml-0.5 hover:text-foreground transition-colors"
                >
                  ×
                </button>
              </Badge>
            )}
            {activeChartFilter && (
              <Badge variant="secondary" className="gap-1 text-[9px] font-medium py-0.5 px-1.5 bg-primary/10 text-primary">
                {activeChartFilter.type === 'origin' && `Origem: ${activeChartFilter.value}`}
                {activeChartFilter.type === 'agent' && `Agente: ${activeChartFilter.value}`}
                {activeChartFilter.type === 'manager' && `Gerente: ${activeChartFilter.value}`}
                <button
                  onClick={() => {
                    setActiveChartFilter(null);
                    setFilterOrigin('all');
                    setFilterResponsible('all');
                    setSelectedManager('');
                    setFilters(prev => ({ ...prev, managerId: '' }));
                  }}
                  className="ml-0.5 hover:text-primary/80 transition-colors"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Vendas & Leads by Origin - Horizontal Bar Chart with Dual Bars */}
          <div className={cn(
            "bg-card rounded-xl border border-border/20 p-4 transition-all",
            activeChartFilter?.type === 'origin' && "ring-1 ring-primary/50"
          )} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[13px] text-foreground/70 tracking-tight">
                Vendas & Leads por Origem
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Vendas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Leads</span>
                </div>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[]}
                  layout="vertical"
                  onClick={(data) => {
                    if (data?.activePayload?.[0]?.payload?.name) {
                      handleChartClick('origin', data.activePayload[0].payload.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis
                    xAxisId="vendas"
                    type="number"
                    stroke="hsl(var(--success)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    orientation="top"
                  />
                  <XAxis
                    xAxisId="leads"
                    type="number"
                    stroke="hsl(var(--primary)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    orientation="bottom"
                    hide
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground)/0.5)"
                    fontSize={10}
                    width={70}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border)/0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'vendas'
                        ? `R$ ${value.toLocaleString('pt-BR')}`
                        : `${value} leads`,
                      name === 'vendas' ? 'Vendas' : 'Leads'
                    ]}
                  />
                  <Bar
                    xAxisId="vendas"
                    dataKey="vendas"
                    fill="hsl(var(--success)/0.7)"
                    radius={[0, 4, 4, 0]}
                    barSize={8}
                  />
                  <Bar
                    xAxisId="leads"
                    dataKey="leads"
                    fill="hsl(var(--primary)/0.7)"
                    radius={[0, 4, 4, 0]}
                    barSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2.5 mt-3 justify-center">
              {[].map((entry, index) => (
                <button
                  key={entry.name}
                  onClick={() => handleChartClick('origin', entry.name)}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md transition-all hover:bg-secondary/50",
                    activeChartFilter?.type === 'origin' && activeChartFilter?.value === entry.name && "bg-secondary ring-1 ring-primary/30"
                  )}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground/70">{entry.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vendas & Leads by Period - Dual Line Chart */}
          <div className={cn(
            "bg-card rounded-xl border border-border/20 p-4 transition-all",
            activeChartFilter?.type === 'period' && "ring-1 ring-primary/50"
          )} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[13px] text-foreground/70 tracking-tight">
                Vendas & Leads por Período
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Vendas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Leads</span>
                </div>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredPeriodData.combined}
                  onClick={(data) => {
                    if (data?.activePayload?.[0]?.payload?.name) {
                      handleChartClick('period', data.activePayload[0].payload.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground)/0.5)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    stroke="hsl(var(--success)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    orientation="left"
                  />
                  <YAxis
                    yAxisId="right"
                    stroke="hsl(var(--primary)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border)/0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'vendas'
                        ? `R$ ${value.toLocaleString('pt-BR')}`
                        : `${value} leads`,
                      name === 'vendas' ? 'Vendas' : 'Leads'
                    ]}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="vendas"
                    stroke="hsl(var(--success)/0.7)"
                    strokeWidth={2}
                    dot={{
                      fill: 'hsl(var(--success)/0.7)',
                      strokeWidth: 0,
                      r: 3,
                      cursor: 'pointer'
                    }}
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--success))',
                      cursor: 'pointer'
                    }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="leads"
                    stroke="hsl(var(--primary)/0.7)"
                    strokeWidth={2}
                    dot={{
                      fill: 'hsl(var(--primary)/0.7)',
                      strokeWidth: 0,
                      r: 3,
                      cursor: 'pointer'
                    }}
                    activeDot={{
                      r: 5,
                      fill: 'hsl(var(--primary))',
                      cursor: 'pointer'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 - Rankings */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Manager Ranking - Only visible for Admin (FIRST) - Dual bars for Vendas + Atendimento */}
          {isAdmin && (
            <div className={cn(
              "bg-card rounded-xl border border-border/20 p-4 transition-all",
              activeChartFilter?.type === 'manager' && "ring-1 ring-primary/50"
            )} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-[13px] text-foreground/70 tracking-tight">Ranking por Gerentes</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-muted-foreground">Vendas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Atendimento</span>
                  </div>
                </div>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredCombinedManagerRanking}
                    layout="vertical"
                    onClick={(data) => {
                      if (data?.activePayload?.[0]?.payload?.name) {
                        handleChartClick('manager', data.activePayload[0].payload.name);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                    <XAxis
                      xAxisId="vendas"
                      type="number"
                      stroke="hsl(var(--success)/0.7)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      orientation="top"
                    />
                    <XAxis
                      xAxisId="atendimento"
                      type="number"
                      stroke="hsl(var(--primary)/0.7)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      orientation="bottom"
                      hide
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground)/0.5)"
                      fontSize={10}
                      width={80}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border)/0.3)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'vendas'
                          ? `R$ ${value.toLocaleString('pt-BR')}`
                          : `${value} atendimentos`,
                        name === 'vendas' ? 'Vendas' : 'Atendimentos'
                      ]}
                    />
                    <Bar
                      xAxisId="vendas"
                      dataKey="vendas"
                      fill="hsl(var(--success)/0.7)"
                      radius={[0, 4, 4, 0]}
                      barSize={8}
                    />
                    <Bar
                      xAxisId="atendimento"
                      dataKey="atendimento"
                      fill="hsl(var(--primary)/0.7)"
                      radius={[0, 4, 4, 0]}
                      barSize={8}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Agent Ranking (SECOND) - Dual bars for Vendas + Atendimento */}
          <div className={cn(
            "bg-card rounded-xl border border-border/20 p-4 transition-all",
            activeChartFilter?.type === 'agent' && "ring-1 ring-primary/50"
          )} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[13px] text-foreground/70 tracking-tight">Ranking por Agentes</h3>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-muted-foreground">Vendas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Atendimento</span>
                </div>
              </div>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredCombinedAgentRanking}
                  layout="vertical"
                  onClick={(data) => {
                    if (data?.activePayload?.[0]?.payload?.name) {
                      handleChartClick('agent', data.activePayload[0].payload.name);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" />
                  <XAxis
                    xAxisId="vendas"
                    type="number"
                    stroke="hsl(var(--success)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    orientation="top"
                  />
                  <XAxis
                    xAxisId="atendimento"
                    type="number"
                    stroke="hsl(var(--primary)/0.7)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    orientation="bottom"
                    hide
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground)/0.5)"
                    fontSize={10}
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border)/0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'vendas'
                        ? `R$ ${value.toLocaleString('pt-BR')}`
                        : `${value} atendimentos`,
                      name === 'vendas' ? 'Vendas' : 'Atendimentos'
                    ]}
                  />
                  <Bar
                    xAxisId="vendas"
                    dataKey="vendas"
                    fill="hsl(var(--success)/0.7)"
                    radius={[0, 4, 4, 0]}
                    barSize={8}
                  />
                  <Bar
                    xAxisId="atendimento"
                    dataKey="atendimento"
                    fill="hsl(var(--primary)/0.7)"
                    radius={[0, 4, 4, 0]}
                    barSize={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Ver Conversas - Inline Panel */}
        <div id="conversations-panel">
          <InlineConversationsPanel
            expanded={conversationsOpen}
            onToggle={() => setConversationsOpen(!conversationsOpen)}
            initialConversationId={selectedConversationId}
            initialConversationPhone={selectedConversationPhone}
            initialConversationName={selectedConversationName}
          />
        </div>

        {/* Pipeline Resumido - Funnel Style Premium */}
        <div className="space-y-2.5">
          <h2 className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest px-1 text-left">
            Funil de Vendas
          </h2>

          <div className="bg-card rounded-xl border border-border/20 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {/* MOBILE: Funnel Shape Layout */}
            <div className="sm:hidden flex flex-col items-center gap-1">
              {dynamicFunnelMainStages.map((stage, index) => {
                const isActive = funnelStageFilter === stage.id;
                const isExpanded = expandedStage === stage.id;
                const hasSubStatus = stage.id in stageSubStatuses;
                // Calculate width for funnel shape (100% -> 45%)
                const widthPercent = 100 - (index * 8);
                return (
                  <div key={stage.id} className="w-full flex flex-col items-center">
                    <button
                      onClick={() => handleFunnelStageClick(stage.id)}
                      className={cn(
                        "relative flex items-center justify-center py-2.5 rounded-full transition-all duration-200",
                        isActive ? "ring-2 ring-offset-2 ring-offset-background scale-[1.02]" : "hover:opacity-90"
                      )}
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: stage.color,
                        opacity: isActive ? 1 : (funnelStageFilter ? 0.5 : 0.85),
                        boxShadow: isActive ? `0 4px 12px ${stage.color}40` : '0 1px 3px rgba(0,0,0,0.1)',
                        // @ts-ignore
                        '--tw-ring-color': stage.color,
                      } as React.CSSProperties}
                    >
                      <span className="text-white font-semibold text-[10px] uppercase tracking-wide flex items-center gap-1">
                        {stage.name} <span className="opacity-80">({stage.count.toLocaleString()})</span>
                        {hasSubStatus && (
                          <ChevronDown className={cn(
                            "w-2.5 h-2.5 opacity-60 transition-transform",
                            isExpanded && "rotate-180"
                          )} />
                        )}
                      </span>
                    </button>

                    {/* Mobile Substatus dropdown */}
                    {hasSubStatus && isExpanded && stageSubStatuses[stage.id] && (
                      <div
                        className="flex flex-wrap justify-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ width: `${widthPercent}%` }}
                      >
                        {stageSubStatuses[stage.id].map((subStatus) => (
                          <button
                            key={subStatus.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubStatusClick(stage.id, subStatus.id);
                            }}
                            className={cn(
                              "px-2.5 py-1.5 rounded-full text-[9px] font-medium transition-all duration-200 border",
                              funnelSubStatusFilter === subStatus.id
                                ? "ring-1 ring-offset-1 ring-offset-background"
                                : "opacity-80 hover:opacity-100"
                            )}
                            style={{
                              backgroundColor: funnelSubStatusFilter === subStatus.id ? `${stage.color}30` : `${stage.color}15`,
                              borderColor: `${stage.color}50`,
                              color: stage.color,
                              // @ts-ignore
                              '--tw-ring-color': stage.color,
                            } as React.CSSProperties}
                          >
                            {subStatus.name} ({subStatus.count})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Exit Stages - 4 status in 2x2 grid on mobile */}
              <div className="mt-3 pt-3 border-t border-border/20 w-full">
                <div className="grid grid-cols-2 gap-2">
                  {[...dynamicFunnelExitStagesLeft, ...dynamicFunnelExitStagesRight].map((stage) => {
                    const isActive = funnelStageFilter === stage.id;
                    // Abbreviate names for mobile
                    const shortName = stage.id === 'stage-arquivado' ? 'ARQUIVADO' :
                      stage.id === 'stage-perdido' ? 'PERDIDO' :
                        stage.id === 'stage-fora-perfil' ? 'FORA PERFIL' :
                          'S/ RETORNO';
                    return (
                      <button
                        key={stage.id}
                        onClick={() => handleFunnelStageClick(stage.id)}
                        className={cn(
                          "px-2 py-2 rounded-lg text-[9px] font-medium transition-all duration-200 flex flex-col items-center gap-0.5 border",
                          isActive ? "ring-2 ring-offset-1 ring-offset-background" : "opacity-80 hover:opacity-100"
                        )}
                        style={{
                          backgroundColor: `${stage.color}20`,
                          borderColor: `${stage.color}50`,
                          color: stage.color,
                          // @ts-ignore
                          '--tw-ring-color': stage.color,
                        } as React.CSSProperties}
                      >
                        <span className="uppercase tracking-wide">{shortName}</span>
                        <span className="font-bold text-[11px]">{stage.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DESKTOP: Original Pyramid Layout */}
            <div className="hidden sm:flex items-center justify-center gap-3">
              {/* Caixinhas de Saída - Lado Esquerdo (ARQUIVADO + FECHADO – PERDIDO) */}
              <div className="flex flex-col gap-1.5 min-w-[90px] md:min-w-[110px]">
                {dynamicFunnelExitStagesLeft.map((stage) => {
                  const isSelected = funnelStageFilter === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleFunnelStageClick(stage.id)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[7px] md:text-[8px] font-medium transition-all duration-200 flex items-center justify-between gap-1 border",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isSelected ? "ring-1 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: `${stage.color}15`,
                        borderColor: `${stage.color}40`,
                        color: stage.color,
                        // @ts-ignore
                        '--tw-ring-color': stage.color,
                      } as React.CSSProperties}
                    >
                      <span className="uppercase tracking-wide">{stage.name}</span>
                      <span className="font-semibold">{stage.count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Funnel Principal - Centralizado e Grande */}
              <div className="flex-1 flex flex-col items-center gap-[3px]">
                {dynamicFunnelMainStages.map((stage, index) => {
                  const maxWidth = 100;
                  const minWidth = 45;
                  const widthStep = (maxWidth - minWidth) / (dynamicFunnelMainStages.length - 1 || 1);
                  const width = maxWidth - (widthStep * index);
                  const isSelected = funnelStageFilter === stage.id;
                  const isExpanded = expandedStage === stage.id;
                  const hasSubStatus = stage.id in stageSubStatuses;
                  return (
                    <div key={stage.id} className="w-full flex flex-col items-center">
                      <button
                        onClick={() => handleFunnelStageClick(stage.id)}
                        className={cn(
                          "relative flex items-center justify-center py-1.5 md:py-[7px] rounded-full transition-all duration-200",
                          isSelected ? "ring-1 ring-offset-1 ring-offset-background scale-[1.02]" : "hover:opacity-90"
                        )}
                        style={{
                          width: `${width}%`,
                          backgroundColor: stage.color,
                          opacity: isSelected ? 0.95 : (funnelStageFilter ? 0.4 : 0.7),
                          boxShadow: isSelected ? `0 2px 8px ${stage.color}30` : 'none',
                          // @ts-ignore
                          '--tw-ring-color': stage.color,
                        } as React.CSSProperties}
                      >
                        <span className="text-white font-medium text-[9px] md:text-[10px] flex items-center gap-0.5 uppercase tracking-wide">
                          {stage.name} <span className="opacity-80">({stage.count.toLocaleString()})</span>
                          {/* Show dropdown only for stages with substatus */}
                          {hasSubStatus && (
                            <ChevronDown className={cn(
                              "w-2 h-2 opacity-50 transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          )}
                        </span>
                      </button>

                      {/* Desktop Substatus dropdown */}
                      {hasSubStatus && isExpanded && stageSubStatuses[stage.id] && (
                        <div
                          className="flex flex-wrap justify-center gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-2 duration-200"
                          style={{ width: `${width}%` }}
                        >
                          {stageSubStatuses[stage.id].map((subStatus) => (
                            <button
                              key={subStatus.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSubStatusClick(stage.id, subStatus.id);
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-full text-[8px] md:text-[9px] font-medium transition-all duration-200 border",
                                funnelSubStatusFilter === subStatus.id
                                  ? "ring-1 ring-offset-1 ring-offset-background"
                                  : "opacity-80 hover:opacity-100"
                              )}
                              style={{
                                backgroundColor: funnelSubStatusFilter === subStatus.id ? `${stage.color}30` : `${stage.color}15`,
                                borderColor: `${stage.color}50`,
                                color: stage.color,
                                // @ts-ignore
                                '--tw-ring-color': stage.color,
                              } as React.CSSProperties}
                            >
                              {subStatus.name} ({subStatus.count})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Caixinhas de Saída - Lado Direito (FORA DE PERFIL + SEM RETORNO) */}
              <div className="flex flex-col gap-1.5 min-w-[90px] md:min-w-[110px]">
                {dynamicFunnelExitStagesRight.map((stage) => {
                  const isSelected = funnelStageFilter === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleFunnelStageClick(stage.id)}
                      className={cn(
                        "px-2 py-1.5 rounded-lg text-[7px] md:text-[8px] font-medium transition-all duration-200 flex items-center justify-between gap-1 border",
                        "hover:scale-[1.02] active:scale-[0.98]",
                        isSelected ? "ring-1 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: `${stage.color}15`,
                        borderColor: `${stage.color}40`,
                        color: stage.color,
                        // @ts-ignore
                        '--tw-ring-color': stage.color,
                      } as React.CSSProperties}
                    >
                      <span className="uppercase tracking-wide">{stage.name}</span>
                      <span className="font-semibold">{stage.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filter Indicator for Funnel */}
            {funnelStageFilter && (
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-border/10 sm:border-t-0 sm:pt-0 sm:mt-2">
                <span className="text-[10px] text-muted-foreground/60">Filtrando:</span>
                <button
                  onClick={() => {
                    setFunnelStageFilter(null);
                    setFunnelSubStatusFilter(null);
                    setExpandedStage(null);
                    setSelectedStage(null);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
                >
                  {getFunnelStageName(funnelStageFilter)}
                  {funnelSubStatusFilter && (
                    <span className="text-primary/70">
                      → {getSubStatusName(funnelStageFilter, funnelSubStatusFilter)}
                    </span>
                  )}
                  <X className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            )}
          </div>
        </div>


        {/* Leads Table - Collapsible */}
        <Collapsible
          open={leadsTablePinned || leadsTableOpen}
          onOpenChange={(open) => {
            if (!leadsTablePinned) {
              setLeadsTableOpen(open);
            }
          }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between px-1">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                <h2 className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest">Tabela de Leads</h2>
                <span className="text-[10px] text-muted-foreground/40">{filteredLeads.length} leads</span>
                {(leadsTablePinned || leadsTableOpen) ? (
                  <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                )}
              </button>
            </CollapsibleTrigger>

            <div className="flex items-center gap-1.5">
              {/* Pin/Unpin button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeadsTablePinned(!leadsTablePinned)}
                className={cn(
                  "h-7 w-7",
                  leadsTablePinned
                    ? "text-primary bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={leadsTablePinned ? "Desafixar tabela" : "Fixar tabela aberta"}
              >
                {leadsTablePinned ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </Button>

              <Modal open={isModalOpen} onOpenChange={handleModalClose}>
                <ModalTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-8 px-3 gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Cadastrar Cliente</span>
                  </Button>
                </ModalTrigger>
                <ModalContent className="sm:max-w-md">
                  <ModalHeader>
                    <ModalTitle className="flex items-center gap-2 text-[15px]">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Cadastrar Novo Cliente
                    </ModalTitle>
                  </ModalHeader>
                  <div className="space-y-2.5 py-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Nome <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="Digite o nome"
                        value={newLead.name}
                        onChange={(e) => {
                          setNewLead({ ...newLead, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        className={`h-8 text-[12px] bg-background/40 focus:border-primary/40 ${formErrors.name ? 'border-destructive' : 'border-border/25'}`}
                      />
                      {formErrors.name && <span className="text-[10px] text-destructive">{formErrors.name}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Telefone <span className="text-destructive">*</span></Label>
                        <div className="flex gap-1.5">
                          <Select defaultValue="BR">
                            <SelectTrigger className="w-14 h-8 text-[10px] bg-background/40 border-border/25">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BR">BR</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="(11) 99999-9999"
                            value={newLead.phone}
                            onChange={(e) => {
                              setNewLead({ ...newLead, phone: e.target.value });
                              if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                            }}
                            className={`flex-1 h-8 text-[12px] bg-background/40 focus:border-primary/40 ${formErrors.phone ? 'border-destructive' : 'border-border/25'}`}
                          />
                        </div>
                        {formErrors.phone && <span className="text-[10px] text-destructive">{formErrors.phone}</span>}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">E-mail</Label>
                        <Input
                          placeholder="exemplo@email.com"
                          type="email"
                          value={newLead.email}
                          onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                          className="h-8 text-[12px] bg-background/40 border-border/25 focus:border-primary/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">COD REF / ID</Label>
                      <Input
                        placeholder="Referência ou ID externo"
                        value={newLead.reference}
                        onChange={(e) => setNewLead({ ...newLead, reference: e.target.value })}
                        className="h-8 text-[12px] bg-background/40 border-border/25 focus:border-primary/40"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Canal de Origem <span className="text-destructive">*</span></Label>
                      <Select value={newLead.origin} onValueChange={(value) => {
                        setNewLead({ ...newLead, origin: value });
                        if (formErrors.origin) setFormErrors({ ...formErrors, origin: '' });
                      }}>
                        <SelectTrigger className={`h-8 text-[12px] bg-background/40 focus:border-primary/40 ${formErrors.origin ? 'border-destructive' : 'border-border/25'}`}>
                          <SelectValue placeholder="Selecione canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {leadOrigins.map((origin) => (
                            <SelectItem key={origin.id} value={origin.name} className="text-[11px]">
                              {origin.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.origin && <span className="text-[10px] text-destructive">{formErrors.origin}</span>}
                    </div>
                  </div>
                  <ModalFooter>
                    <Button variant="outline" onClick={() => handleModalClose(false)} className="h-9 text-[11px] font-medium border-border/25 px-4">
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateLead}
                      disabled={!isFormValid}
                      className="bg-primary hover:bg-primary/90 h-9 text-[11px] font-medium px-4 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Cadastrar Cliente
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </div>
          </div>

          <CollapsibleContent className="space-y-2">
            {/* Column Filters - Premium compact */}
            <div className="bg-card rounded-xl border border-border/20 px-3 py-2" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-medium text-muted-foreground/50">Filtrar:</span>

                {/* Origin Filter */}
                <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                  <SelectTrigger className="w-[110px] h-6 text-[10px] bg-background/40 border-border/20">
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Origens</SelectItem>
                    {uniqueOrigins.map(origin => (
                      <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Qualified Filter */}
                <Select value={filterQualified} onValueChange={setFilterQualified}>
                  <SelectTrigger className="w-[110px] h-6 text-[10px] bg-background/40 border-border/20">
                    <SelectValue placeholder="Qualificado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="yes">Qualificados</SelectItem>
                    <SelectItem value="no">Não Qualificados</SelectItem>
                  </SelectContent>
                </Select>

                {/* Funnel Status Filter */}
                <Select value={filterFunnelStatus} onValueChange={setFilterFunnelStatus}>
                  <SelectTrigger className="w-[120px] h-6 text-[10px] bg-background/40 border-border/20">
                    <SelectValue placeholder="Status Funil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Status</SelectItem>
                    {{ stages: [] }.stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Responsible Filter */}
                <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                  <SelectTrigger className="w-[120px] h-6 text-[10px] bg-background/40 border-border/20">
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {[].map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Produto Filter */}
                <Select value={filterProduto} onValueChange={setFilterProduto}>
                  <SelectTrigger className="w-[130px] h-6 text-[10px] bg-background/40 border-border/20">
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Produtos</SelectItem>
                    {getUniqueProducts([...tableLeadsFunil, ...tableLeadsCarteira, ...tableLeadsProspeccao]).map(produto => (
                      <SelectItem key={produto} value={produto}>{produto}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Etiqueta Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        filterEtiqueta !== 'all'
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 p-2">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">Filtrar por etiqueta</p>
                      <button
                        onClick={() => setFilterEtiqueta('all')}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors text-left",
                          filterEtiqueta === 'all' && "bg-primary/10"
                        )}
                      >
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                        <span>Todas</span>
                      </button>
                      {availableLabels.map(label => (
                        <button
                          key={label.id}
                          onClick={() => setFilterEtiqueta(label.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-colors text-left",
                            filterEtiqueta === label.id && "bg-primary/10"
                          )}
                        >
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                          <span className="truncate">{label.name}</span>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                {(filterOrigin !== 'all' || filterQualified !== 'all' || filterFunnelStatus !== 'all' || filterResponsible !== 'all' || filterProduto !== 'all' || filterEtiqueta !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterOrigin('all');
                      setFilterQualified('all');
                      setFilterFunnelStatus('all');
                      setFilterResponsible('all');
                      setFilterProduto('all');
                      setFilterEtiqueta('all');
                    }}
                    className="h-6 text-[9px] text-muted-foreground/60 hover:text-foreground"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="bg-card rounded-xl border border-border/20 px-3 py-2" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <Input
                  placeholder="Buscar leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-7 text-[11px] bg-transparent border-0 pl-7 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/30 rounded-lg p-[2px] mb-2.5 h-7">
                <TabsTrigger
                  value="funil"
                  className="rounded-md text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm h-6 font-medium"
                >
                  Funil <span className="ml-1 text-[9px] text-muted-foreground">({tableLeadsFunil.length + transferredLeadIds.size})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="carteira"
                  className="rounded-md text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm h-6 font-medium"
                >
                  Carteira <span className="ml-1 text-[9px] text-muted-foreground">({tableLeadsCarteira.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="prospeccao"
                  className="rounded-md text-[10px] data-[state=active]:bg-card data-[state=active]:shadow-sm h-6 font-medium"
                >
                  Prospecção <span className="ml-1 text-[9px] text-muted-foreground">({tableLeadsProspeccao.filter(l => !transferredLeadIds.has(l.id)).length})</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="funil">
                <DashboardLeadsTable
                  leads={[
                    ...tableLeadsFunil,
                    // Include leads transferred from Prospecção
                    ...tableLeadsProspeccao.filter(l => transferredLeadIds.has(l.id))
                  ]}
                  searchTerm={searchTerm}
                  sortUltInt={sortUltInt}
                  setSortUltInt={setSortUltInt}
                  onChatClick={(lead) => handleChatClick(lead, 'funil')}
                  onSummaryClick={setSummaryLead}
                  activeKpiFilter={activeKpiFilter}
                  activeChartFilter={activeChartFilter}
                  funnelStageFilter={funnelStageFilter}
                  pinnedLeadIds={pinnedLeadIds}
                  onTogglePin={handleTogglePin}
                  canPinLeads={canPinLeads}
                  isSeller={isSeller}
                />
              </TabsContent>

              <TabsContent value="carteira">
                <DashboardLeadsTable
                  leads={tableLeadsCarteira}
                  searchTerm={searchTerm}
                  sortUltInt={sortUltInt}
                  setSortUltInt={setSortUltInt}
                  onChatClick={(lead) => handleChatClick(lead, 'carteira')}
                  onSummaryClick={setSummaryLead}
                  activeKpiFilter={activeKpiFilter}
                  activeChartFilter={activeChartFilter}
                  funnelStageFilter={funnelStageFilter}
                  pinnedLeadIds={pinnedLeadIds}
                  onTogglePin={handleTogglePin}
                  canPinLeads={canPinLeads}
                  isSeller={isSeller}
                />
              </TabsContent>

              <TabsContent value="prospeccao">
                <DashboardLeadsTable
                  leads={tableLeadsProspeccao
                    .filter(l => !transferredLeadIds.has(l.id))
                    .map(l => ({ ...l, status: 'Frio', statusColor: '#5B8DEF' }))
                  }
                  searchTerm={searchTerm}
                  sortUltInt={sortUltInt}
                  setSortUltInt={setSortUltInt}
                  onChatClick={(lead) => handleChatClick(lead, 'prospeccao')}
                  onSummaryClick={setSummaryLead}
                  activeKpiFilter={activeKpiFilter}
                  activeChartFilter={activeChartFilter}
                  funnelStageFilter={funnelStageFilter}
                  pinnedLeadIds={pinnedLeadIds}
                  onTogglePin={handleTogglePin}
                  canPinLeads={canPinLeads}
                  isSeller={isSeller}
                />
              </TabsContent>
            </Tabs>
          </CollapsibleContent>
        </Collapsible>

        {/* Summary Modal (like Funil) */}
        <Dialog open={!!summaryLead} onOpenChange={(open) => !open && setSummaryLead(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[15px]">
                <FileText className="w-4 h-4 text-primary" />
                Resumo do Lead
              </DialogTitle>
            </DialogHeader>
            {summaryLead && (
              <div className="space-y-4 py-2">
                {/* Lead Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/20">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{summaryLead.name}</p>
                    <p className="text-[11px] text-muted-foreground">{summaryLead.phone}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: summaryLead.statusColor }}
                  >
                    {summaryLead.status}
                  </span>
                </div>

                {/* Origin & Qualification */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">Origem</p>
                    <p className="text-[12px] font-medium text-foreground">{summaryLead.origin}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">Qualificado</p>
                    <p className={`text-[12px] font-medium ${summaryLead.qualified ? 'text-success' : 'text-muted-foreground'}`}>
                      {summaryLead.qualified ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">Responsável</p>
                    <p className="text-[12px] font-medium text-foreground">{summaryLead.vendedor}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">Dt. Criação</p>
                    <p className="text-[12px] font-medium text-foreground">{summaryLead.dataCriacao}</p>
                  </div>
                </div>

                {/* Summary Description */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-wider">Interesse e Contexto</p>
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-[12px] text-foreground/80 leading-relaxed">
                      {summaryLead.resumo}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pin Conversation Modal */}
        <PinConversationModal
          open={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setLeadToPin(null);
          }}
          leadId={leadToPin?.id || ''}
          leadName={leadToPin?.name || ''}
          currentSellerId={leadToPin?.vendedor}
          sellers={mockSellers}
          onPin={handlePinConfirm}
        />

        {/* NPS Detail Modal */}
        <NpsDetailModal
          open={npsModalOpen}
          onOpenChange={setNpsModalOpen}
          category={npsCategory}
          onOpenChat={(lead) => {
            // Find the lead and set it for chat
            const tableLead = [...tableLeadsFunil, ...tableLeadsCarteira, ...tableLeadsProspeccao]
              .find(l => l.id === lead.id);
            if (tableLead) {
              setChatLead(tableLead);
            }
          }}
        />

      </main>
    </div>
  );
};

// Component for leads table (mirrors Funil.tsx LeadsTable)
interface DashboardLeadsTableProps {
  leads: TableLead[];
  searchTerm: string;
  sortUltInt: 'asc' | 'desc' | null;
  setSortUltInt: React.Dispatch<React.SetStateAction<'asc' | 'desc' | null>>;
  onChatClick: (lead: TableLead) => void;
  onSummaryClick: (lead: TableLead) => void;
  activeKpiFilter: string | null;
  activeChartFilter: { type: string; value: string } | null;
  funnelStageFilter: string | null;
  pinnedLeadIds: Set<string>;
  onTogglePin: (leadId: string, leadVendedor?: string) => void;
  canPinLeads: boolean;
  isSeller: boolean;
}

const DashboardLeadsTable: React.FC<DashboardLeadsTableProps> = ({
  leads,
  searchTerm,
  sortUltInt,
  setSortUltInt,
  onChatClick,
  onSummaryClick,
  activeKpiFilter,
  activeChartFilter,
  funnelStageFilter,
  pinnedLeadIds,
  onTogglePin,
  canPinLeads,
  isSeller,
}) => {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to parse ultInt value to minutes for sorting
  const parseUltInt = (value: string): number => {
    const num = parseInt(value);
    if (value.includes('h')) return num * 60; // hours to minutes
    if (value.includes('d')) return num * 60 * 24; // days to minutes
    if (value.includes('m')) return num; // already minutes
    if (value.includes('sem')) return num * 60 * 24 * 7; // weeks to minutes
    return num;
  };

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = leads.filter(lead => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = lead.name.toLowerCase().includes(search) ||
          lead.phone.toLowerCase().includes(search) ||
          lead.origin.toLowerCase().includes(search) ||
          lead.vendedor.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // KPI-based filters
      if (activeKpiFilter === 'Qualificados (IA)' && !lead.qualified) return false;
      if (activeKpiFilter === 'Não Qualificados/Roleta' && lead.qualified) return false;
      if (activeKpiFilter === 'Qualificados/Roleta' && lead.vendedor !== '-') return false;
      // 'Total de Leads' shows all leads - no additional filter needed

      // Chart-based filters (Agent/Manager rankings and Origin)
      if (activeChartFilter?.type === 'agent' && lead.vendedor !== activeChartFilter.value) return false;
      if (activeChartFilter?.type === 'origin' && lead.origin !== activeChartFilter.value) return false;
      if (activeChartFilter?.type === 'manager' && lead.gerente !== activeChartFilter.value) return false;

      // Funnel stage filter (from clicking on funnel stages)
      if (funnelStageFilter) {
        const stageMap: Record<string, string> = {
          'stage-frio': 'Frio',
          'stage-morno': 'Morno',
          'stage-quente': 'Quente',
          'stage-qualificado': 'Qualificado',
          'stage-em-atendimento': 'Em Atendimento',
          'stage-em-negociacao': 'Em Negociação',
          'stage-ganho': 'Fechado – Ganho',
          'stage-arquivado': 'Arquivado',
          'stage-perdido': 'Fechado – Perdido',
          'stage-fora-perfil': 'Fora de Perfil',
          'stage-sem-retorno': 'Sem Retorno',
        };
        const expectedStatus = stageMap[funnelStageFilter] || '';
        if (lead.status !== expectedStatus) return false;
      }

      return true;
    });

    // Sort by ultInt if active
    if (sortUltInt) {
      result = [...result].sort((a, b) => {
        const aVal = parseUltInt(a.ultInt);
        const bVal = parseUltInt(b.ultInt);
        return sortUltInt === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    // Sort pinned leads to the top
    result = [...result].sort((a, b) => {
      const aPinned = pinnedLeadIds.has(a.id) ? 0 : 1;
      const bPinned = pinnedLeadIds.has(b.id) ? 0 : 1;
      return aPinned - bPinned;
    });

    return result;
  }, [leads, searchTerm, sortUltInt, activeKpiFilter, activeChartFilter, funnelStageFilter, pinnedLeadIds]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLeads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLeads, currentPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortUltInt, activeKpiFilter, activeChartFilter, funnelStageFilter]);

  const handleSortUltInt = () => {
    setSortUltInt(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'origin', label: 'Origem' },
    { key: 'produto', label: 'Produto' },
    { key: 'qualified', label: 'Qualificado' },
    { key: 'status', label: 'Status' },
    { key: 'dataCriacao', label: 'Dt. Criação' },
    { key: 'vendedor', label: 'Responsável' },
    { key: 'gerente', label: 'Gerente' },
    { key: 'ultInt', label: 'Ult. Int.', sortable: true },
  ];

  return (
    <div className="bg-card rounded-xl border border-border/20 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="overflow-x-auto -mx-1">
        {/* Mobile: List View */}
        <div className="block sm:hidden space-y-1 p-1">
          {paginatedLeads.map((lead) => {
            const isPinned = pinnedLeadIds.has(lead.id);
            return (
              <button
                key={lead.id}
                onClick={() => onChatClick(lead)}
                className={`w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-secondary/30 active:bg-secondary/50 transition-colors border bg-card/50 ${isPinned ? 'border-primary/30 bg-primary/5' : 'border-border/10'
                  }`}
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    {isPinned && <Pin className="w-3 h-3 text-primary fill-primary" />}
                    <p className="text-[12px] font-semibold text-foreground truncate">{lead.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="px-2 py-[2px] rounded-full text-[9px] font-medium text-white"
                      style={{ backgroundColor: lead.statusColor }}
                    >
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 truncate">{lead.vendedor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  {/* Pin button - only show for managers/admins, or for sellers if lead is pinned */}
                  {(canPinLeads || isPinned) && (
                    <button
                      className={`p-2 rounded-full transition-colors ${isPinned ? 'bg-primary/10' : 'hover:bg-warning/10'} ${!canPinLeads && isSeller ? 'opacity-70' : ''}`}
                      title={isPinned ? (isSeller ? 'Resolva a demanda para desafixar' : 'Desafixar') : 'Fixar no topo'}
                      onClick={() => onTogglePin(lead.id, lead.vendedor)}
                    >
                      <Pin className={`w-4 h-4 ${isPinned ? 'text-primary fill-primary' : 'text-warning'}`} />
                    </button>
                  )}
                  <a
                    href={`tel:${lead.phone.replace(/\D/g, '')}`}
                    className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                    title="Ligar"
                  >
                    <Phone className="w-4 h-4 text-primary" />
                  </a>
                  <button
                    className="p-2 hover:bg-success/10 rounded-full transition-colors"
                    title="Chat"
                    onClick={(e) => { e.stopPropagation(); onChatClick(lead); }}
                  >
                    <MessageCircle className="w-4 h-4 text-success" />
                  </button>
                  <button
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    title="Resumo"
                    onClick={() => onSummaryClick(lead)}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <LeadHistoryPanel
                    leadId={lead.id}
                    leadName={lead.name}
                    trigger={
                      <button
                        className="p-2 hover:bg-primary/10 rounded-full transition-colors"
                        title="Histórico"
                      >
                        <History className="w-4 h-4 text-primary/70" />
                      </button>
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop: Table View */}
        <table className="w-full hidden sm:table">
          <thead>
            <tr className="border-b border-border/20">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? handleSortUltInt : undefined}
                  className={`text-left py-2 px-2 font-medium text-[10px] text-muted-foreground/50 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-foreground/70 select-none' : ''
                    }`}
                >
                  <span className="flex items-center gap-0.5">
                    {col.label}
                    {col.sortable && (
                      sortUltInt === 'asc' ? (
                        <ArrowUp className="w-3 h-3 text-primary" />
                      ) : sortUltInt === 'desc' ? (
                        <ArrowDown className="w-3 h-3 text-primary" />
                      ) : (
                        <ArrowDown className="w-3 h-3 opacity-30" />
                      )
                    )}
                  </span>
                </th>
              ))}
              <th className="text-left py-2 px-2 font-medium text-[10px] text-muted-foreground/50 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.map((lead) => {
              const isPinned = pinnedLeadIds.has(lead.id);
              return (
                <tr key={lead.id} className={`border-b border-border/10 hover:bg-secondary/20 transition-colors ${isPinned ? 'bg-primary/5' : ''}`}>
                  <td className="py-2 px-2 font-medium text-[11px] text-foreground/80">
                    <div className="flex items-center gap-1.5">
                      {isPinned && <Pin className="w-3 h-3 text-primary fill-primary" />}
                      {lead.name}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70">{lead.phone}</td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70 hover:text-primary hover:underline cursor-pointer">{lead.origin}</td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70">{lead.produto || '—'}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${lead.qualified
                      ? 'bg-success/15 text-success hover:ring-success/50'
                      : 'bg-muted text-muted-foreground hover:ring-muted-foreground/50'
                      }`}>
                      {lead.qualified ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium text-white cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all"
                      style={{ backgroundColor: lead.statusColor, opacity: 0.9 }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70">{lead.dataCriacao}</td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70 hover:text-primary hover:underline cursor-pointer">{lead.vendedor}</td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70 hover:text-primary hover:underline cursor-pointer">{lead.gerente}</td>
                  <td className="py-2 px-2 text-[11px] text-muted-foreground/70">{lead.ultInt}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-0">
                      {/* Pin button - only show for managers/admins, or for sellers if lead is pinned */}
                      {(canPinLeads || isPinned) && (
                        <button
                          className={`p-1.5 rounded-md transition-colors ${isPinned ? 'bg-primary/10' : 'hover:bg-warning/10'} ${!canPinLeads && isSeller ? 'opacity-70' : ''}`}
                          title={isPinned ? (isSeller ? 'Resolva a demanda para desafixar' : 'Desafixar') : 'Fixar no topo'}
                          onClick={() => onTogglePin(lead.id, lead.vendedor)}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-primary fill-primary' : 'text-warning/70 hover:text-warning'}`} />
                        </button>
                      )}
                      <a href={`tel:${lead.phone.replace(/\D/g, '')}`} className="p-1.5 hover:bg-primary/10 rounded-md transition-colors" title="Ligar">
                        <Phone className="w-3.5 h-3.5 text-primary/70 hover:text-primary" />
                      </a>
                      <button
                        className="p-1.5 hover:bg-success/10 rounded-md transition-colors"
                        title="Chat"
                        onClick={(e) => { e.stopPropagation(); onChatClick(lead); }}
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-success/70 hover:text-success" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        title="Resumo"
                        onClick={() => onSummaryClick(lead)}
                      >
                        <FileText className="w-3.5 h-3.5 text-muted-foreground/70 hover:text-foreground" />
                      </button>
                      <LeadHistoryPanel
                        leadId={lead.id}
                        leadName={lead.name}
                        trigger={
                          <button
                            className="p-1.5 hover:bg-primary/10 rounded-md transition-colors"
                            title="Histórico"
                          >
                            <History className="w-3.5 h-3.5 text-primary/70 hover:text-primary" />
                          </button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/20">
          <span className="text-[10px] text-muted-foreground/60">
            {filteredLeads.length} leads • Página {currentPage}/{totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-6 px-2 text-[10px]"
            >
              Anterior
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
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
                  className="h-6 w-6 p-0 text-[10px]"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-6 px-2 text-[10px]"
            >
              Próximo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
