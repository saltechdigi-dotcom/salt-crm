import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KPICard } from '@/components/ui/kpi-card';
import { DistributionConfig, DistributionConfigData } from '@/components/distribution/DistributionConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Users,
  Sun,
  Moon,
  Search,
  Filter,
  Plus,
  UserMinus,
  ChevronRight,
  Target,
  UserCheck,
  RefreshCw,
  Fish,
} from 'lucide-react';
import api from '@/lib/api';

interface Agent {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  // Se o vendedor foi adicionado ao turno (pode estar ativo ou inativo)
  morningAssigned: boolean;
  afternoonAssigned: boolean;
  // Status atual (ativo na fila ou pausado)
  morningActive: boolean;
  afternoonActive: boolean;
  // Posição na fila (sequencial, novos entram no final)
  morningPosition: number | null;
  afternoonPosition: number | null;
  // Contadores independentes por turno - Leads Não Qualificados
  morningLeadsNaoQualificados: number;
  afternoonLeadsNaoQualificados: number;
  // Contadores independentes por turno - Leads Qualificados
  morningLeadsQualificados: number;
  afternoonLeadsQualificados: number;
}

// Mock agents data com contadores separados
const mockAgentsData: Agent[] = [
  {
    id: '1', name: 'Damião', initials: 'D',
    email: 'damiao.silva@empresa.com', phone: '41 99639-4444',
    morningAssigned: true, afternoonAssigned: false,
    morningActive: true, afternoonActive: false,
    morningPosition: 1, afternoonPosition: null,
    morningLeadsNaoQualificados: 5, afternoonLeadsNaoQualificados: 0,
    morningLeadsQualificados: 2, afternoonLeadsQualificados: 0
  },
  {
    id: '2', name: 'Lucas Morais', initials: 'LM',
    email: 'lucas.morais@empresa.com', phone: '41 8883 2550',
    morningAssigned: true, afternoonAssigned: true,
    morningActive: true, afternoonActive: true,
    morningPosition: 2, afternoonPosition: 1,
    morningLeadsNaoQualificados: 3, afternoonLeadsNaoQualificados: 4,
    morningLeadsQualificados: 1, afternoonLeadsQualificados: 2
  },
  {
    id: '3', name: 'Ademir José', initials: 'AJ',
    email: 'ademir@empresa.com', phone: '41 9999-1111',
    morningAssigned: false, afternoonAssigned: true,
    morningActive: false, afternoonActive: true,
    morningPosition: null, afternoonPosition: 2,
    morningLeadsNaoQualificados: 0, afternoonLeadsNaoQualificados: 6,
    morningLeadsQualificados: 0, afternoonLeadsQualificados: 3
  },
  {
    id: '4', name: 'Fernanda Costa', initials: 'FC',
    email: 'fernanda@empresa.com', phone: '41 9999-2222',
    morningAssigned: true, afternoonAssigned: true,
    morningActive: true, afternoonActive: false, // Exemplo: ativa manhã, pausada tarde
    morningPosition: 3, afternoonPosition: null,
    morningLeadsNaoQualificados: 4, afternoonLeadsNaoQualificados: 2,
    morningLeadsQualificados: 2, afternoonLeadsQualificados: 1
  },
  {
    id: '5', name: 'Alexsandro', initials: 'A',
    email: 'alexsandro@empresa.com', phone: '41 9999-3333',
    morningAssigned: false, afternoonAssigned: false,
    morningActive: false, afternoonActive: false,
    morningPosition: null, afternoonPosition: null,
    morningLeadsNaoQualificados: 0, afternoonLeadsNaoQualificados: 0,
    morningLeadsQualificados: 0, afternoonLeadsQualificados: 0
  },
  {
    id: '6', name: 'Roberto Silva', initials: 'RS',
    email: 'roberto@empresa.com', phone: '41 9999-4444',
    morningAssigned: false, afternoonAssigned: false,
    morningActive: false, afternoonActive: false,
    morningPosition: null, afternoonPosition: null,
    morningLeadsNaoQualificados: 2, afternoonLeadsNaoQualificados: 1,
    morningLeadsQualificados: 0, afternoonLeadsQualificados: 0
  },
  {
    id: '7', name: 'Mariana Souza', initials: 'MS',
    email: 'mariana@empresa.com', phone: '41 9999-5555',
    morningAssigned: false, afternoonAssigned: false,
    morningActive: false, afternoonActive: false,
    morningPosition: null, afternoonPosition: null,
    morningLeadsNaoQualificados: 0, afternoonLeadsNaoQualificados: 0,
    morningLeadsQualificados: 0, afternoonLeadsQualificados: 0
  },
];

// Map backend user to Agent (used when API data becomes available)
function mapUserToAgent(u: any): Agent {
  const name = u.name || 'Sem nome';
  const parts = name.split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.substring(0, 2).toUpperCase();
  return {
    id: u.id,
    name,
    initials,
    email: u.email || '',
    phone: u.phone || '',
    morningAssigned: false,
    afternoonAssigned: false,
    morningActive: false,
    afternoonActive: false,
    morningPosition: null,
    afternoonPosition: null,
    morningLeadsNaoQualificados: 0,
    afternoonLeadsNaoQualificados: 0,
    morningLeadsQualificados: 0,
    afternoonLeadsQualificados: 0,
  };
}

const Roleta: React.FC = () => {
  const { toast } = useToast();
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showDistributionConfig, setShowDistributionConfig] = useState(false);
  const [addingToPeriod, setAddingToPeriod] = useState<'morning' | 'afternoon' | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Fetch agents from API
  useEffect(() => {
    setAgentsLoading(true);
    api.get('/users')
      .then(res => {
        const data = res.data?.data || res.data || [];
        const users: any[] = Array.isArray(data) ? data : [];
        const mapped: Agent[] = users
          .filter((u: any) => u.role === 'agent' && u.isActive !== false)
          .map((u: any) => {
            const name = u.name || 'Sem nome';
            const parts = name.split(' ');
            const initials = parts.length >= 2
              ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
              : name.substring(0, 2).toUpperCase();
            return {
              id: u.id,
              name,
              initials,
              email: u.email || '',
              phone: u.phone || '',
              morningAssigned: false,
              afternoonAssigned: false,
              morningActive: false,
              afternoonActive: false,
              morningPosition: null,
              afternoonPosition: null,
              morningLeadsNaoQualificados: 0,
              afternoonLeadsNaoQualificados: 0,
              morningLeadsQualificados: 0,
              afternoonLeadsQualificados: 0,
            };
          });
        setAgents(mapped);
      })
      .catch(err => console.error('Error fetching users for roleta:', err))
      .finally(() => setAgentsLoading(false));
  }, []);

  // Fetch distribution logs for lead counters
  useEffect(() => {
    api.get('/distribution/logs', { params: { limit: 500 } })
      .then(res => {
        const logs = res.data?.data || res.data || [];
        if (!Array.isArray(logs) || logs.length === 0) return;
        // Count leads per agent
        const counts: Record<string, { total: number }> = {};
        logs.forEach((log: any) => {
          const uid = log.assignedToId;
          if (!uid) return;
          if (!counts[uid]) counts[uid] = { total: 0 };
          counts[uid].total++;
        });
        setAgents(prev => prev.map(a => {
          const c = counts[a.id];
          if (!c) return a;
          return { ...a, morningLeadsNaoQualificados: c.total };
        }));
      })
      .catch(() => { /* distribution logs optional */ });
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Configuração do modo de distribuição
  const [distributionConfig, setDistributionConfig] = useState<DistributionConfigData>({
    mode: 'roleta',
    fishingQueueType: 'fila_unica',
    sectors: [
      { id: '1', name: 'Vendas Externas', active: true },
      { id: '2', name: 'Vendas Internas', active: true },
    ],
  });

  const handleSaveDistributionConfig = (config: DistributionConfigData) => {
    setDistributionConfig(config);
    // Aqui salvaria no backend/n8n
    console.log('Salvando config distribuição:', config);
  };

  // Vendedores atribuídos a cada turno (ativos + inativos)
  const morningAssignedAgents = useMemo(() =>
    agents.filter(a => a.morningAssigned).sort((a, b) => {
      // Ativos primeiro (ordenados por posição), depois inativos
      if (a.morningActive && !b.morningActive) return -1;
      if (!a.morningActive && b.morningActive) return 1;
      if (a.morningActive && b.morningActive) {
        return (a.morningPosition || 0) - (b.morningPosition || 0);
      }
      return 0;
    }),
    [agents]
  );
  const afternoonAssignedAgents = useMemo(() =>
    agents.filter(a => a.afternoonAssigned).sort((a, b) => {
      if (a.afternoonActive && !b.afternoonActive) return -1;
      if (!a.afternoonActive && b.afternoonActive) return 1;
      if (a.afternoonActive && b.afternoonActive) {
        return (a.afternoonPosition || 0) - (b.afternoonPosition || 0);
      }
      return 0;
    }),
    [agents]
  );

  const totalAgents = agents.length;
  const morningActiveCount = agents.filter(a => a.morningActive).length;
  const afternoonActiveCount = agents.filter(a => a.afternoonActive).length;

  // Total de leads distribuídos
  const totalLeadsDistribuidos = useMemo(() =>
    agents.reduce((acc, a) => acc + a.morningLeadsNaoQualificados + a.afternoonLeadsNaoQualificados + a.morningLeadsQualificados + a.afternoonLeadsQualificados, 0),
    [agents]
  );
  const totalLeadsQualificados = useMemo(() =>
    agents.reduce((acc, a) => acc + a.morningLeadsQualificados + a.afternoonLeadsQualificados, 0),
    [agents]
  );

  // Vendedores disponíveis para adicionar (nunca atribuídos ao turno)
  const availableForMorning = useMemo(() =>
    agents.filter(a => !a.morningAssigned),
    [agents]
  );
  const availableForAfternoon = useMemo(() =>
    agents.filter(a => !a.afternoonAssigned),
    [agents]
  );

  // Desativar vendedor - pausa sem remover do turno, preserva contadores
  const handleDeactivateAgent = (agentId: string, period: 'morning' | 'afternoon') => {
    setAgents(prevAgents => {
      const removedPosition = prevAgents.find(a => a.id === agentId)?.[period === 'morning' ? 'morningPosition' : 'afternoonPosition'];

      return prevAgents.map(agent => {
        if (agent.id === agentId) {
          // Desativa e remove posição, mas mantém assigned = true
          if (period === 'morning') {
            return { ...agent, morningActive: false, morningPosition: null };
          } else {
            return { ...agent, afternoonActive: false, afternoonPosition: null };
          }
        }
        // Reordena posições dos demais ativos
        if (removedPosition !== null && removedPosition !== undefined) {
          const posField = period === 'morning' ? 'morningPosition' : 'afternoonPosition';
          const currentPos = agent[posField];
          if (currentPos !== null && currentPos > removedPosition) {
            return { ...agent, [posField]: currentPos - 1 };
          }
        }
        return agent;
      });
    });

    toast({
      title: 'Vendedor pausado',
      description: `Saiu da fila da ${period === 'morning' ? 'manhã' : 'tarde'}. Pode ser reativado a qualquer momento.`,
    });
  };

  // Reativar vendedor já atribuído ao turno - volta ao final da fila
  const handleReactivateAgent = (agentId: string, period: 'morning' | 'afternoon') => {
    setAgents(prevAgents => {
      const currentActiveCount = period === 'morning'
        ? prevAgents.filter(a => a.morningActive).length
        : prevAgents.filter(a => a.afternoonActive).length;

      const newPosition = currentActiveCount + 1;

      return prevAgents.map(agent => {
        if (agent.id === agentId) {
          if (period === 'morning') {
            return { ...agent, morningActive: true, morningPosition: newPosition };
          } else {
            return { ...agent, afternoonActive: true, afternoonPosition: newPosition };
          }
        }
        return agent;
      });
    });

    toast({
      title: 'Vendedor reativado',
      description: `Voltou ao final da fila da ${period === 'morning' ? 'manhã' : 'tarde'}.`,
    });
  };

  // Adicionar novo vendedor ao turno (primeira vez)
  const handleAddAgentToShift = (agentId: string, period: 'morning' | 'afternoon') => {
    setAgents(prevAgents => {
      const currentActiveCount = period === 'morning'
        ? prevAgents.filter(a => a.morningActive).length
        : prevAgents.filter(a => a.afternoonActive).length;

      const newPosition = currentActiveCount + 1;

      return prevAgents.map(agent => {
        if (agent.id === agentId) {
          if (period === 'morning') {
            return { ...agent, morningAssigned: true, morningActive: true, morningPosition: newPosition };
          } else {
            return { ...agent, afternoonAssigned: true, afternoonActive: true, afternoonPosition: newPosition };
          }
        }
        return agent;
      });
    });

    toast({
      title: 'Vendedor adicionado',
      description: `Entrou no final da fila da ${period === 'morning' ? 'manhã' : 'tarde'}.`,
    });

    setAddingToPeriod(null);
  };

  // Filtro de busca
  const filteredAgents = useMemo(() => {
    let filtered = addingToPeriod === 'morning' ? availableForMorning : availableForAfternoon;

    if (searchTerm) {
      filtered = filtered.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm)
      );
    }

    return filtered;
  }, [addingToPeriod, availableForMorning, availableForAfternoon, searchTerm]);

  const getInitialsColor = (initials: string) => {
    const colors = [
      'bg-[#F5A15D]',
      'bg-[#5B8DEF]',
      'bg-[#4FC3B5]',
      'bg-[#9B7CF4]',
      'bg-[#E96A6A]',
      'bg-[#F4C95D]',
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Componente de Card do Vendedor (ativo ou inativo)
  const AgentCard = ({
    agent,
    period,
    isActive
  }: {
    agent: Agent;
    period: 'morning' | 'afternoon';
    isActive: boolean;
  }) => {
    const position = period === 'morning' ? agent.morningPosition : agent.afternoonPosition;
    const leadsNaoQualificados = period === 'morning' ? agent.morningLeadsNaoQualificados : agent.afternoonLeadsNaoQualificados;
    const leadsQualificados = period === 'morning' ? agent.morningLeadsQualificados : agent.afternoonLeadsQualificados;
    const periodColor = period === 'morning' ? '#F5A15D' : '#5B8DEF';

    return (
      <div
        className={cn(
          "bg-card rounded-xl border p-3 transition-all",
          isActive
            ? "border-border/20"
            : "border-dashed border-border/30 opacity-60"
        )}
        style={{ boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.04)' : 'none' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-[11px]",
              getInitialsColor(agent.initials),
              !isActive && "grayscale opacity-70"
            )}>
              {agent.initials}
            </div>
            {isActive && position && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: periodColor }}
              >
                {position}
              </div>
            )}
            {!isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-muted-foreground/40">
                <div className="w-2 h-0.5 bg-white rounded-full" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn(
                "text-[12px] font-medium truncate",
                isActive ? "text-foreground/85" : "text-muted-foreground/60"
              )}>{agent.name}</p>
              {!isActive && (
                <Badge variant="outline" className="text-[8px] h-4 px-1 border-muted-foreground/30 text-muted-foreground/50">
                  Inativo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-muted-foreground/60">{leadsNaoQualificados} não qualif.</span>
              <span className="text-[10px] text-muted-foreground/30">·</span>
              <span className={cn("text-[10px] font-medium", isActive ? "text-[#4CAF50]" : "text-muted-foreground/50")}>{leadsQualificados} qualif.</span>
            </div>
          </div>
          {isActive ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeactivateAgent(agent.id, period)}
              className="h-6 px-2 text-[10px] text-[#E96A6A] hover:text-[#E96A6A] hover:bg-[#E96A6A]/10"
            >
              <UserMinus className="w-3 h-3 mr-1" />
              Desativar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReactivateAgent(agent.id, period)}
              className="h-6 px-2 text-[10px] text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/10"
            >
              <Plus className="w-3 h-3 mr-1" />
              Reativar
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Estado vazio do período
  const EmptyPeriodState = ({ period }: { period: 'morning' | 'afternoon' }) => (
    <div className="bg-card rounded-xl border border-dashed border-border/30 p-6 text-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-[12px] text-muted-foreground/50 mb-2">
        Nenhum vendedor ativo no período da {period === 'morning' ? 'manhã' : 'tarde'}
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setAddingToPeriod(period)}
        className="gap-1.5 h-7 text-[11px] border-border/30"
      >
        <Plus className="w-3 h-3" />
        Adicionar Vendedor
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
      <Header showBack title="Distribuição de Leads" />

      <main className="container py-4 space-y-4">
        {/* System Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold text-foreground/90">
              {distributionConfig.mode === 'roleta' ? 'Roleta' : 'Pescaria'}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] h-5 gap-1",
                distributionConfig.mode === 'roleta'
                  ? "border-[#F5A15D]/40 text-[#F5A15D]"
                  : "border-[#5B8DEF]/40 text-[#5B8DEF]"
              )}
            >
              {distributionConfig.mode === 'roleta' ? (
                <RefreshCw className="w-3 h-3" />
              ) : (
                <Fish className="w-3 h-3" />
              )}
              {distributionConfig.mode === 'roleta' ? 'Automático' : 'Manual'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDistributionConfig(true)}
              className="gap-1.5 h-7 text-[11px] font-medium px-2.5 border-border/30"
            >
              <Settings className="w-3.5 h-3.5" />
              Configurar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSystemActive(!isSystemActive)}
              className={cn(
                "gap-1.5 h-7 text-[11px] font-medium px-2.5 border-border/30",
                isSystemActive
                  ? "bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30 hover:bg-[#4CAF50]/15"
                  : "bg-muted/30 text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isSystemActive ? "bg-[#4CAF50]" : "bg-muted-foreground/50"
              )} />
              {isSystemActive ? 'Ativo' : 'Inativo'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            label="Total Vendedores"
            value={totalAgents}
            color="info"
            size="sm"
          />
          <KPICard
            label="Ativos Manhã"
            value={morningActiveCount}
            color="warning"
            size="sm"
          />
          <KPICard
            label="Ativos Tarde"
            value={afternoonActiveCount}
            color="primary"
            size="sm"
          />
          <KPICard
            label="Leads Distribuídos"
            value={totalLeadsDistribuidos}
            color="success"
            size="sm"
          />
        </div>

        {/* Info Box */}
        <div className="bg-card rounded-xl border border-border/20 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-start gap-2.5">
            <Target className="w-4 h-4 text-primary/70 mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="text-[14px] font-medium text-foreground/85">
                Como funciona a Roleta
              </h2>
              <ul className="text-[11px] text-muted-foreground/70 mt-1 space-y-0.5 leading-relaxed">
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-2.5 h-2.5" />
                  Leads são distribuídos em fila sequencial (primeiro entra, primeiro recebe)
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-2.5 h-2.5" />
                  Novos vendedores entram no final da fila
                </li>
                <li className="flex items-center gap-1.5">
                  <ChevronRight className="w-2.5 h-2.5" />
                  Leads qualificados e não qualificados são contabilizados separadamente
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Period Sections */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Morning Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#F5A15D]" />
                <h3 className="text-[13px] font-medium text-foreground/80">Turno Manhã</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="bg-[#F5A15D]/10 text-[#F5A15D] text-[10px] h-5 px-1.5 font-medium border-0">
                  {morningActiveCount} ativo{morningActiveCount !== 1 ? 's' : ''}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-6 text-[10px] px-2 border-border/30"
                  onClick={() => setAddingToPeriod('morning')}
                >
                  <Plus className="w-2.5 h-2.5" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {morningAssignedAgents.length === 0 ? (
                <EmptyPeriodState period="morning" />
              ) : (
                morningAssignedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} period="morning" isActive={agent.morningActive} />
                ))
              )}
            </div>
          </div>

          {/* Afternoon Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#5B8DEF]" />
                <h3 className="text-[13px] font-medium text-foreground/80">Turno Tarde</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="bg-[#5B8DEF]/10 text-[#5B8DEF] text-[10px] h-5 px-1.5 font-medium border-0">
                  {afternoonActiveCount} ativo{afternoonActiveCount !== 1 ? 's' : ''}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-6 text-[10px] px-2 border-border/30"
                  onClick={() => setAddingToPeriod('afternoon')}
                >
                  <Plus className="w-2.5 h-2.5" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {afternoonAssignedAgents.length === 0 ? (
                <EmptyPeriodState period="afternoon" />
              ) : (
                afternoonAssignedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} period="afternoon" isActive={agent.afternoonActive} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Adicionar Vendedor */}
        <Dialog open={addingToPeriod !== null} onOpenChange={(open) => !open && setAddingToPeriod(null)}>
          <DialogContent className="max-w-md max-h-[85vh] sm:max-h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center gap-2.5">
                {addingToPeriod === 'morning' ? (
                  <Sun className="w-4 h-4 text-[#F5A15D]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#5B8DEF]" />
                )}
                <div>
                  <DialogTitle className="text-[16px] font-semibold text-foreground/90">
                    Adicionar à {addingToPeriod === 'morning' ? 'Manhã' : 'Tarde'}
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    Novos vendedores entram no final da fila
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* Search */}
            <div className="pt-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-[12px] border-border/30"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[45vh] sm:max-h-none pt-3 -mx-6 px-6 overflow-y-auto">
              <div className="space-y-2">
                {filteredAgents.length === 0 ? (
                  <div className="text-center py-8">
                    <UserCheck className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground/50">
                      {searchTerm
                        ? 'Nenhum vendedor encontrado'
                        : 'Todos os vendedores já estão neste período'}
                    </p>
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-[10px]",
                          getInitialsColor(agent.initials)
                        )}>
                          {agent.initials}
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-foreground/80">{agent.name}</p>
                          <p className="text-[10px] text-muted-foreground/50">{agent.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddAgentToShift(agent.id, addingToPeriod!)}
                        className="h-7 px-3 text-[11px]"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/20 mt-3">
              <p className="text-[10px] text-muted-foreground/50">
                {filteredAgents.length} vendedor{filteredAgents.length !== 1 ? 'es' : ''} disponível{filteredAgents.length !== 1 ? 'eis' : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingToPeriod(null)}
                className="h-7 text-[11px] border-border/30"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Configuration Modal */}
        <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-3 border-b border-border/20">
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-primary/70" />
                <div>
                  <DialogTitle className="text-[16px] font-semibold text-foreground/90">Configuração Avançada</DialogTitle>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Gerencie todos os vendedores e turnos</p>
                </div>
              </div>
            </DialogHeader>

            {/* Modal KPIs */}
            <div className="grid grid-cols-4 gap-2 pt-3">
              <div className="rounded-lg p-2.5 border border-border/20 bg-[#F5A15D]/5">
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-[#F5A15D]" />
                  Manhã
                </p>
                <p className="text-[16px] font-semibold text-[#F5A15D] mt-0.5">{morningActiveCount}</p>
              </div>
              <div className="rounded-lg p-2.5 border border-border/20 bg-[#5B8DEF]/5">
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-[#5B8DEF]" />
                  Tarde
                </p>
                <p className="text-[16px] font-semibold text-[#5B8DEF] mt-0.5">{afternoonActiveCount}</p>
              </div>
              <div className="rounded-lg p-2.5 border border-border/20">
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground/50" />
                  Leads Dist.
                </p>
                <p className="text-[16px] font-semibold text-foreground/80 mt-0.5">{totalLeadsDistribuidos}</p>
              </div>
              <div className="rounded-lg p-2.5 border border-border/20 bg-[#4CAF50]/5">
                <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#4CAF50]" />
                  Qualificados
                </p>
                <p className="text-[16px] font-semibold text-[#4CAF50] mt-0.5">{totalLeadsQualificados}</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex gap-2 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-[12px] border-border/30"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32 h-8 text-[11px] border-border/30">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[11px]">Todos</SelectItem>
                  <SelectItem value="morning" className="text-[11px]">Apenas Manhã</SelectItem>
                  <SelectItem value="afternoon" className="text-[11px]">Apenas Tarde</SelectItem>
                  <SelectItem value="both" className="text-[11px]">Ambos Turnos</SelectItem>
                  <SelectItem value="inactive" className="text-[11px]">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1 pt-3 -mx-6 px-6">
              <div className="space-y-2">
                {agents
                  .filter(agent => {
                    // Filtro de busca
                    const matchSearch = !searchTerm ||
                      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      agent.phone.includes(searchTerm);

                    // Filtro de tipo
                    let matchType = true;
                    if (filterType === 'morning') matchType = agent.morningActive && !agent.afternoonActive;
                    if (filterType === 'afternoon') matchType = !agent.morningActive && agent.afternoonActive;
                    if (filterType === 'both') matchType = agent.morningActive && agent.afternoonActive;
                    if (filterType === 'inactive') matchType = !agent.morningActive && !agent.afternoonActive;

                    return matchSearch && matchType;
                  })
                  .map((agent) => (
                    <div key={agent.id} className="flex items-center gap-2.5 p-3 rounded-lg border border-border/20 bg-card">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-[10px]", getInitialsColor(agent.initials))}>
                        {agent.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground/80 truncate">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground/50 truncate">{agent.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Morning Toggle */}
                        <div className="flex items-center gap-1.5">
                          <Sun className="w-3 h-3 text-[#F5A15D]" />
                          <span className="text-[10px] text-muted-foreground/60 w-10">Manhã</span>
                          <Switch
                            checked={agent.morningActive}
                            onCheckedChange={(checked) => {
                              if (checked) handleReactivateAgent(agent.id, 'morning');
                              else handleDeactivateAgent(agent.id, 'morning');
                            }}
                            className="scale-75"
                          />
                          {agent.morningActive && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-[#F5A15D]/30 text-[#F5A15D]">
                              #{agent.morningPosition}
                            </Badge>
                          )}
                        </div>
                        {/* Afternoon Toggle */}
                        <div className="flex items-center gap-1.5">
                          <Moon className="w-3 h-3 text-[#5B8DEF]" />
                          <span className="text-[10px] text-muted-foreground/60 w-10">Tarde</span>
                          <Switch
                            checked={agent.afternoonActive}
                            onCheckedChange={(checked) => {
                              if (checked) handleReactivateAgent(agent.id, 'afternoon');
                              else handleDeactivateAgent(agent.id, 'afternoon');
                            }}
                            className="scale-75"
                          />
                          {agent.afternoonActive && (
                            <Badge variant="outline" className="text-[8px] h-4 px-1 border-[#5B8DEF]/30 text-[#5B8DEF]">
                              #{agent.afternoonPosition}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-border/20 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(false)}
                className="h-7 text-[11px] border-border/30"
              >
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Configuração de Distribuição */}
        <DistributionConfig
          open={showDistributionConfig}
          onClose={() => setShowDistributionConfig(false)}
          onSave={handleSaveDistributionConfig}
          initialConfig={distributionConfig}
        />
      </main>
    </div>
  );
};

export default Roleta;
