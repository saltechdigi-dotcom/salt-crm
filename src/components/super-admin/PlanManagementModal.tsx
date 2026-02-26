import React, { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Crown, Sparkles, Check, X, ShieldAlert, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  PlanType,
  PLAN_CONFIGS,
  PLAN_USER_PRICING,
  FEATURE_CATEGORIES,
  FEATURE_LABELS,
  FeatureFlags
} from '@/lib/plan-features';
import api from '@/lib/api';

// This is a dynamic version of the configuration
interface EditablePlan {
  id: PlanType;
  name: string;
  description: string;
  baseUsers: number;
  monthlyValue: number;
  annualValue: number;
  features: FeatureFlags;
}

interface PlanManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlanManagementModal: React.FC<PlanManagementModalProps> = ({ open, onOpenChange }) => {
  const [plans, setPlans] = useState<EditablePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for the plan being edited
  const [editedPlan, setEditedPlan] = useState<EditablePlan | null>(null);

  // Initialize from hardcoded config or API
  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Intentional API call that will probably 404 since it's not implemented backend side yet
      // but it serves as the real integration point.
      const res = await api.get('/superadmin/plans');
      if (res.data && res.data.length > 0) {
        setPlans(res.data);
      } else {
        loadFallbackPlans();
      }
    } catch (err) {
      console.warn('Could not fetch dynamic plans, using fallback local configurations', err);
      loadFallbackPlans();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackPlans = () => {
    const fallbackPlans: EditablePlan[] = (Object.keys(PLAN_CONFIGS) as PlanType[]).map(key => ({
      id: key,
      name: PLAN_CONFIGS[key].name,
      description: PLAN_CONFIGS[key].description,
      baseUsers: PLAN_CONFIGS[key].baseUsers,
      monthlyValue: PLAN_USER_PRICING[key].monthly,
      annualValue: PLAN_USER_PRICING[key].annual,
      features: { ...PLAN_CONFIGS[key].features }
    }));
    setPlans(fallbackPlans);
    if (!selectedPlan) setSelectedPlan('ESSENCIAL');
  };

  useEffect(() => {
    if (selectedPlan) {
      const plan = plans.find(p => p.id === selectedPlan);
      if (plan) setEditedPlan(JSON.parse(JSON.stringify(plan))); // Deep clone for editing
    }
  }, [selectedPlan, plans]);

  const handleSavePlan = async () => {
    if (!editedPlan) return;

    setSaving(true);
    try {
      await api.put(`/superadmin/plans/${editedPlan.id}`, editedPlan);

      // Update local state
      setPlans(prev => prev.map(p => p.id === editedPlan.id ? editedPlan : p));
      toast.success(`Plano ${editedPlan.name} atualizado com sucesso`);
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro ao salvar o plano localmente');

      // Still update local state for optimistic UI since backend might not exist
      setPlans(prev => prev.map(p => p.id === editedPlan.id ? editedPlan : p));
      toast.info(`Plano ${editedPlan.name} atualizado apenas localmente`);
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (key: keyof FeatureFlags) => {
    if (!editedPlan) return;
    setEditedPlan({
      ...editedPlan,
      features: {
        ...editedPlan.features,
        [key]: !editedPlan.features[key]
      }
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Gestão de Planos SALT"
      size="xl"
      showBackButton
    >
      <div className="flex flex-col md:flex-row h-[70vh] gap-6">
        {/* Sidebar: List of Plans */}
        <div className="w-full md:w-1/3 flex flex-col gap-2 border-r pr-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Planos Disponíveis</h3>
          </div>

          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-2">
              {loading ? (
                <div className="text-sm text-muted-foreground p-4 text-center">Processando...</div>
              ) : (
                plans.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedPlan === plan.id ? 'border-primary bg-primary/10' : 'hover:border-primary/50 bg-card'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Crown className={`w-4 h-4 ${selectedPlan === plan.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold text-sm">{plan.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">R$ {plan.monthlyValue.toLocaleString('pt-BR')}/mês</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Selected Plan Editor */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
          {editedPlan ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <h2 className="text-xl font-bold">{editedPlan.name}</h2>
                  <p className="text-xs text-muted-foreground">Configurações e Valores</p>
                </div>
                <Button onClick={handleSavePlan} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6 pb-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Plano</Label>
                      <Input
                        value={editedPlan.name}
                        onChange={e => setEditedPlan({ ...editedPlan, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={editedPlan.description}
                        onChange={e => setEditedPlan({ ...editedPlan, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Mensal (R$/usuário)</Label>
                      <Input
                        type="number"
                        value={editedPlan.monthlyValue}
                        onChange={e => setEditedPlan({ ...editedPlan, monthlyValue: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Anual (R$/usuário)</Label>
                      <Input
                        type="number"
                        value={editedPlan.annualValue}
                        onChange={e => setEditedPlan({ ...editedPlan, annualValue: Number(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Base de Usuários</Label>
                      <Input
                        type="number"
                        value={editedPlan.baseUsers}
                        onChange={e => setEditedPlan({ ...editedPlan, baseUsers: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Máximo de Usuários Perm.</Label>
                      <Input
                        type="text"
                        value={editedPlan.features.max_users}
                        onChange={e => {
                          const val = e.target.value;
                          setEditedPlan({
                            ...editedPlan,
                            features: {
                              ...editedPlan.features,
                              max_users: val === 'unlimited' ? 'unlimited' : Number(val) || 0
                            }
                          })
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">Use "unlimited" para sem limite.</p>
                    </div>
                  </div>

                  {/* Features Toggles */}
                  <div>
                    <h3 className="text-sm font-semibold mb-4 pb-2 border-b">Funcionalidades do Plano</h3>
                    <div className="space-y-6">
                      {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
                        <div key={categoryKey} className="space-y-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 p-2 rounded-md">
                            {category.label}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 px-2">
                            {category.features.map((featureKey) => {
                              if (featureKey === 'max_users') return null;

                              const val = editedPlan.features[featureKey];
                              // Safely handle booleans only for switches
                              if (typeof val !== 'boolean') return null;

                              return (
                                <div key={featureKey} className="flex items-center justify-between p-2 rounded-lg border shadow-sm">
                                  <Label className="text-xs cursor-pointer select-none">
                                    {FEATURE_LABELS[featureKey]}
                                  </Label>
                                  <Switch
                                    checked={val}
                                    onCheckedChange={() => handleFeatureToggle(featureKey)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
              <Crown className="w-10 h-10 mb-4 opacity-20" />
              <p>Selecione um plano para gerenciar</p>
            </div>
          )}
        </div>
      </div >
    </ResponsiveModal >
  );
};
