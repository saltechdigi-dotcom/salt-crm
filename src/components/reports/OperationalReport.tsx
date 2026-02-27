import React, { useState, useMemo } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  MessageSquare,
  CheckCircle,
  Trophy,
  FileSpreadsheet
} from 'lucide-react';
import SalesReportExport from './SalesReportExport';
import { useModules } from '@/hooks/useModules';
import { useUserRole } from '@/hooks/useUserRole';

type PeriodType = 'today' | '7days' | '30days' | 'month' | 'custom';

interface ReportBlockProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
  action?: React.ReactNode;
}

const ReportBlock: React.FC<ReportBlockProps> = ({
  title,
  icon: Icon,
  children,
  delay = 0,
  action
}) => (
  <div
    className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-2"
    style={{
      animationDelay: `${delay}ms`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}
  >
    <div className="px-2.5 py-1.5 border-b border-border/10 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-primary/70" />
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">{title}</span>
      </div>
      {action}
    </div>
    <div className="p-2.5">
      {children}
    </div>
  </div>
);

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, change, changeLabel, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
    info: 'text-info bg-info/10',
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 border border-border/10">
      {Icon && (
        <div className={`w-7 h-7 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide leading-tight">{label}</p>
        <p className="text-base font-semibold text-foreground tabular-nums leading-tight">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1">
            {change >= 0 ? (
              <TrendingUp className="w-2.5 h-2.5 text-success" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-destructive" />
            )}
            <span className={`text-[9px] font-medium ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            {changeLabel && (
              <span className="text-[9px] text-muted-foreground/50">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OperationalReport: React.FC = () => {
  const { isModuleEnabled } = useModules();
  const { role } = useUserRole();
  const [showSalesReportExport, setShowSalesReportExport] = useState(false);

  // Bloco Performance Comercial visível apenas para Admin do Tenant
  const isAdmin = role === 'TENANT_ADMIN';

  // Fixed period multiplier (now controlled by global date in Home)
  const periodMultiplier = 1;

  // Calculate derived metrics from existing mock data
  const reportData = useMemo(() => {
    const leadSummaryData: Array<{ value: number }> = [];
    const agentsData: Array<{ active: boolean; leadsCount: number }> = [];
    const salesData: Array<{
      status: string;
      tenantId: string;
      vendedorId: string;
      vendedorName: string;
      saleValue: number;
      leadCreatedAt: string;
      saleClosedAt: string;
    }> = [];
    const funnelData: Array<{ name: string; count: number }> = [];

    if (leadSummaryData.length === 0) {
      return {
        executive: { totalLeads: 0, totalAttendances: 0, qualifiedLeads: 0, conversions: 0, conversionRate: '0', previousPeriodChange: 0 },
        commercial: { topVendedoresBySales: [], totalSales: 0, avgTimeToClose: '-', avgTimeMinutes: 0, responseRate: 0, formatCurrency: (v: number) => `R$ ${v}` },
        funnel: { stages: [], advancementRates: [], bottlenecks: [] },
        whatsapp: { messagesSent: 0, messagesReceived: 0, conversationsStarted: 0, connected: false },
        ai: { attendances: 0, qualifiedLeads: 0, efficiencyRate: 0, timeSaved: '0 min' },
      };
    }

    const totalLeads = Math.round((leadSummaryData[0]?.value ?? 0) * periodMultiplier);
    const qualifiedLeads = Math.round((leadSummaryData[1]?.value ?? 0) * periodMultiplier);
    const conversions = Math.round(totalLeads * 0.12);
    const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : '0';

    const activeAgents = agentsData.filter(a => a.active);
    const totalAttendances = activeAgents.reduce((sum, a) => sum + (a.leadsCount || 0), 0);
    const responseRate = 87;

    // ==========================================
    // PERFORMANCE COMERCIAL - DADOS DE VENDAS
    // ==========================================

    // Filtrar vendas completadas do tenant atual
    const completedSales = salesData.filter(sale =>
      sale.status === 'completed' && sale.tenantId === 'tenant-1'
    );

    // Ranking de vendedores por quantidade e valor de vendas
    const salesByVendedor: Record<string, { name: string; count: number; totalValue: number }> = {};
    completedSales.forEach(sale => {
      if (!salesByVendedor[sale.vendedorId]) {
        salesByVendedor[sale.vendedorId] = { name: sale.vendedorName, count: 0, totalValue: 0 };
      }
      salesByVendedor[sale.vendedorId].count += 1;
      salesByVendedor[sale.vendedorId].totalValue += sale.saleValue;
    });

    const topVendedoresBySales = Object.values(salesByVendedor)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Formatar valor monetário
    const formatCurrency = (value: number): string => {
      if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
      }
      return `R$ ${value.toLocaleString('pt-BR')}`;
    };

    // Calcular tempo médio entre criação do lead e fechamento da venda (em minutos)
    let totalTimeMinutes = 0;
    let validSalesCount = 0;

    completedSales.forEach(sale => {
      const leadCreated = new Date(sale.leadCreatedAt);
      const saleClosed = new Date(sale.saleClosedAt);
      const diffMs = saleClosed.getTime() - leadCreated.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes > 0) {
        totalTimeMinutes += diffMinutes;
        validSalesCount++;
      }
    });

    const avgTimeMinutes = validSalesCount > 0
      ? Math.round(totalTimeMinutes / validSalesCount)
      : 0;

    // Formatar tempo médio de forma legível
    const formatAvgTime = (minutes: number): string => {
      if (minutes === 0) return '-';
      if (minutes < 60) return `${minutes} min`;
      if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
      return `${Math.round(minutes / 1440)} dias`;
    };

    const funnelStages = funnelData.map(stage => ({
      ...stage,
      count: Math.round(stage.count * periodMultiplier)
    }));

    const totalMessages = Math.round(1250 * periodMultiplier);
    const messagesReceived = Math.round(totalMessages * 0.6);
    const messagesSent = Math.round(totalMessages * 0.4);
    const conversationsStarted = Math.round(totalMessages * 0.15);
    const whatsappConnected = true;

    const aiAttendances = Math.round(qualifiedLeads * 0.8);
    const aiQualifiedLeads = qualifiedLeads;
    const aiEfficiencyRate = 86;
    const aiTimeSaved = Math.round(aiAttendances * 5);

    // Gargalos - stages with high count and low advancement
    const bottlenecks = funnelStages
      .filter(s => s.count > 50)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
      .map(s => s.name);

    return {
      executive: {
        totalLeads,
        totalAttendances: Math.round(totalAttendances * periodMultiplier),
        qualifiedLeads,
        conversions,
        conversionRate,
        previousPeriodChange: 12
      },
      commercial: {
        topVendedoresBySales,
        totalSales: completedSales.length,
        avgTimeToClose: formatAvgTime(avgTimeMinutes),
        avgTimeMinutes,
        responseRate,
        formatCurrency
      },
      funnel: {
        stages: funnelStages,
        advancementRates: [
          { from: 'Frio', to: 'Morno', rate: 33 },
          { from: 'Morno', to: 'Quente', rate: 55 },
          { from: 'Quente', to: 'Qualificado', rate: 44 },
        ],
        bottlenecks
      },
      whatsapp: {
        messagesSent,
        messagesReceived,
        conversationsStarted,
        connected: whatsappConnected
      },
      ai: {
        attendances: aiAttendances,
        qualifiedLeads: aiQualifiedLeads,
        efficiencyRate: aiEfficiencyRate,
        timeSaved: `${aiTimeSaved} min`
      },
    };
  }, [periodMultiplier]);

  // Check which blocks should be visible
  const showExecutive = reportData.executive.totalLeads > 0;
  const showCommercial = isAdmin && reportData.commercial.topVendedoresBySales.length >= 0;

  // If no data at all, don't render
  if (!showExecutive && !showCommercial) {
    return null;
  }

  // Calcula o total de vendas em valor
  const totalSalesValue = useMemo(() => {
    return reportData.commercial.topVendedoresBySales.reduce((sum, v) => sum + v.totalValue, 0);
  }, [reportData.commercial.topVendedoresBySales]);

  return (
    <div className="space-y-1.5">
      {/* Performance de Vendas - Baseado em Vendas Registradas */}
      {/* Visível apenas para Admin do Tenant - dados reais de vendas */}
      {showCommercial ? (
        <ReportBlock
          title="Performance de Vendas"
          icon={Trophy}
          delay={100}
          action={
            <button
              onClick={() => setShowSalesReportExport(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 hover:bg-secondary/80 border border-border/20 hover:border-primary/30 transition-all duration-200 group"
            >
              <FileSpreadsheet className="w-3 h-3 text-success group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Exportar
              </span>
            </button>
          }
        >
          {reportData.commercial.topVendedoresBySales.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {/* Total de Vendas - primeiro card */}
              <div className="text-center py-1.5 px-1 rounded-lg border bg-success/5 border-success/10">
                <p className="text-[10px] text-muted-foreground/60 truncate">💰 Total de Vendas</p>
                <p className="text-lg font-semibold tabular-nums text-success">{reportData.commercial.formatCurrency(totalSalesValue)}</p>
              </div>
              {/* Top 3 vendedores */}
              {reportData.commercial.topVendedoresBySales.slice(0, 3).map((vendedor, i) => {
                const styles = [
                  { bg: 'bg-warning/5 border-warning/10', text: 'text-warning', medal: '🥇' },
                  { bg: 'bg-secondary/30 border-border/10', text: 'text-foreground', medal: '🥈' },
                  { bg: 'bg-amber-700/5 border-amber-700/10', text: 'text-amber-700', medal: '🥉' },
                ];
                const style = styles[i];
                return (
                  <div key={vendedor.name} className={`text-center py-1.5 px-1 rounded-lg border ${style.bg}`}>
                    <p className="text-[10px] text-muted-foreground/60 truncate">{style.medal} {vendedor.name}</p>
                    <p className={`text-lg font-semibold tabular-nums ${style.text}`}>{reportData.commercial.formatCurrency(vendedor.totalValue)}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <Trophy className="w-5 h-5 text-muted-foreground/30 mb-1" />
              <p className="text-xs text-muted-foreground/60">Nenhuma venda registrada</p>
            </div>
          )}
        </ReportBlock>
      ) : null}

      {/* Sales Report Export Modal */}
      <SalesReportExport
        open={showSalesReportExport}
        onClose={() => setShowSalesReportExport(false)}
      />
    </div>
  );
};

export default OperationalReport;

