import React from 'react';
import { Filter } from 'lucide-react';


// Color config for funnel stages
const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  'Frio': { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
  'Morno': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  'Quente': { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  'Qualificado': { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  'Em Atendimento': { bg: 'bg-[#9B7CF4]/10', text: 'text-[#9B7CF4]', border: 'border-[#9B7CF4]/20' },
  'Em Negociação': { bg: 'bg-[#F4C95D]/10', text: 'text-[#F4C95D]', border: 'border-[#F4C95D]/20' },
  'Fechado – Ganho': { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
  'Fechado – Perdido': { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  'Arquivado': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted' },
  'Fora de Perfil': { bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' },
  'Sem Retorno': { bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' },
};

// Default color fallback
const defaultColor = { bg: 'bg-secondary/30', text: 'text-foreground', border: 'border-border/20' };

const getStageColor = (name: string) => stageColors[name] || defaultColor;

interface FunnelStatusGridProps {
  periodMultiplier?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const FunnelStatusGrid: React.FC<FunnelStatusGridProps> = ({ 
  periodMultiplier = 1, 
  showTitle = true,
  compact = false 
}) => {
  // Combine main stages and exit stages
  const allStages = [
    ...[].map(stage => ({
      ...stage,
      count: Math.round(stage.count * periodMultiplier),
      type: 'main' as const
    })),
    ...[].map(stage => ({
      ...stage,
      count: Math.round(stage.count * periodMultiplier),
      type: 'exit' as const
    })),
  ];

  // Split into main funnel stages and exit stages
  const mainStages = allStages.filter(s => s.type === 'main');
  const exitStages = allStages.filter(s => s.type === 'exit');


  return (
    <div 
      className="bg-card/90 backdrop-blur-sm rounded-xl border border-border/20 overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {showTitle && (
        <div className="px-2.5 py-1.5 border-b border-border/10 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-primary/70" />
          <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
            Funil de Atendimento
          </span>
        </div>
      )}
      
      <div className="p-2">
        {/* Main Funnel Stages - Grid 4 colunas no mobile, 7 no desktop */}
        <div className="grid grid-cols-4 lg:grid-cols-7 gap-1">
          {mainStages.map((stage) => {
            const colors = getStageColor(stage.name);
            // Abreviar nomes longos no mobile
            const shortName = stage.name
              .replace('Em Atendimento', 'Atend.')
              .replace('Em Negociação', 'Negoc.')
              .replace('Fechado – Ganho', 'Ganho')
              .replace('Qualificado', 'Qualif.');
            return (
              <div 
                key={stage.id} 
                className={`text-center py-1 px-0.5 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <p className="text-[8px] sm:text-[9px] text-muted-foreground/70 truncate leading-tight">
                  <span className="sm:hidden">{shortName}</span>
                  <span className="hidden sm:inline">{stage.name}</span>
                </p>
                <p className={`text-sm sm:text-base font-bold tabular-nums ${colors.text}`}>
                  {stage.count}
                </p>
              </div>
            );
          })}
        </div>


        {/* Exit Stages - Small grid below */}
        {exitStages.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/10">
            <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wide mb-1">
              Saídas
            </p>
            <div className="grid grid-cols-4 gap-1">
              {exitStages.map((stage) => {
                const colors = getStageColor(stage.name);
                // Abreviar nomes no mobile
                const shortName = stage.name
                  .replace('Fechado – Perdido', 'Perdido')
                  .replace('Fora de Perfil', 'F. Perfil')
                  .replace('Sem Retorno', 'S/ Ret.');
                return (
                  <div 
                    key={stage.id} 
                    className={`text-center py-1 px-0.5 rounded-lg border ${colors.bg} ${colors.border}`}
                  >
                    <p className="text-[7px] sm:text-[8px] text-muted-foreground/60 truncate leading-tight">
                      <span className="sm:hidden">{shortName}</span>
                      <span className="hidden sm:inline">{stage.name}</span>
                    </p>
                    <p className={`text-xs sm:text-sm font-semibold tabular-nums ${colors.text}`}>
                      {stage.count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelStatusGrid;
