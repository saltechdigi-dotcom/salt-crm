import React, { useState, useEffect } from 'react';
import { IOSCard } from '@/components/ui/ios-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLabelsStore, Label as LabelType } from '@/stores/labels';
import { Header } from '@/components/ui/header';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Trash2,
  Pencil,
  ChevronLeft,
} from 'lucide-react';

interface EtiquetasSectionProps {
  onBack: () => void;
}

// Predefined color palette
const colorPalette = [
  '#E96A6A', // Red
  '#F5A15D', // Orange
  '#F4C95D', // Yellow
  '#4CAF50', // Green
  '#4FC3B5', // Teal
  '#5B8DEF', // Blue
  '#9B7CF4', // Purple
  '#E879F9', // Pink
  '#78909C', // Blue Grey
  '#795548', // Brown
];

export const EtiquetasSection: React.FC<EtiquetasSectionProps> = ({ onBack }) => {
  const { labels, loading, addLabel, removeLabel, updateLabel, fetchLabels } = useLabelsStore();

  // Load labels from API on mount
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(colorPalette[0]);
  const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);
  const [deletingLabel, setDeletingLabel] = useState<LabelType | null>(null);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error('Informe um nome para a etiqueta');
      return;
    }

    try {
      await addLabel(newLabelName.trim(), newLabelColor);
      toast.success(`Etiqueta "${newLabelName}" criada com sucesso!`);
      setNewLabelName('');
      setNewLabelColor(colorPalette[0]);
      setShowCreateModal(false);
    } catch {
      toast.error('Erro ao criar etiqueta. Tente novamente.');
    }
  };

  const handleEditLabel = async () => {
    if (!editingLabel || !newLabelName.trim()) {
      toast.error('Informe um nome para a etiqueta');
      return;
    }

    try {
      await updateLabel(editingLabel.id, newLabelName.trim(), newLabelColor);
      toast.success(`Etiqueta atualizada com sucesso!`);
      setEditingLabel(null);
      setNewLabelName('');
      setNewLabelColor(colorPalette[0]);
      setShowEditModal(false);
    } catch {
      toast.error('Erro ao atualizar etiqueta. Tente novamente.');
    }
  };

  const handleDeleteLabel = async () => {
    if (!deletingLabel) return;

    try {
      await removeLabel(deletingLabel.id);
      toast.success(`Etiqueta "${deletingLabel.name}" excluída`);
      setDeletingLabel(null);
      setShowDeleteModal(false);
    } catch {
      toast.error('Erro ao excluir etiqueta. Tente novamente.');
    }
  };

  const openEditModal = (label: LabelType) => {
    setEditingLabel(label);
    setNewLabelName(label.name);
    setNewLabelColor(label.color);
    setShowEditModal(true);
  };

  const openDeleteModal = (label: LabelType) => {
    setDeletingLabel(label);
    setShowDeleteModal(true);
  };

  // Sub-header for inner pages - com safe-area para mobile/PWA
  const SubHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/10 pt-[var(--safe-area-top)]">
      <div className="container flex items-center gap-3 h-12">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors -ml-1 active:scale-95 transition-transform min-h-[44px] min-w-[44px] justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Voltar</span>
        </button>
        <span className="text-[15px] font-semibold text-foreground/90">{title}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-[var(--safe-area-bottom)]">
      <SubHeader title="Etiquetas" onBack={onBack} />

      <main className="container py-4 space-y-4">
        {/* Info Banner */}
        <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5A15D]/10 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#F5A15D]" />
          </div>
          <div>
            <p className="text-[14px] font-medium text-foreground/90">Gerenciamento de Etiquetas</p>
            <p className="text-[13px] text-muted-foreground/70 mt-1">
              Crie e gerencie etiquetas para organizar e categorizar suas conversas e leads. As etiquetas aparecem no chat e podem ser usadas para filtrar leads.
            </p>
          </div>
        </div>

        {/* Create Button */}
        <Button
          className="w-full h-11 text-[14px] gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Etiqueta
        </Button>

        {/* Labels List */}
        <IOSCard className="overflow-hidden divide-y divide-border/10">
          {labels.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-[14px] text-muted-foreground/70">Nenhuma etiqueta cadastrada</p>
              <p className="text-[12px] text-muted-foreground/50 mt-1">Clique em "Nova Etiqueta" para criar</p>
            </div>
          ) : (
            labels.map((label) => (
              <div key={label.id} className="flex items-center gap-3 p-4">
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1 text-[14px] font-medium text-foreground/90">{label.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditModal(label)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => openDeleteModal(label)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </IOSCard>
      </main>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Nova Etiqueta</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Crie uma etiqueta para organizar suas conversas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome da Etiqueta</Label>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Ex: VIP, Urgente, Novo..."
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${newLabelColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewLabelColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <span className="text-[12px] text-muted-foreground">Prévia:</span>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[12px] font-medium"
                style={{ backgroundColor: newLabelColor }}
              >
                <Tag className="w-3 h-3" />
                {newLabelName || 'Nome da etiqueta'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLabel}>
              Criar Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Editar Etiqueta</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Altere o nome ou cor da etiqueta
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome da Etiqueta</Label>
              <Input
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Ex: VIP, Urgente, Novo..."
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[13px]">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-all ${newLabelColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewLabelColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <span className="text-[12px] text-muted-foreground">Prévia:</span>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-[12px] font-medium"
                style={{ backgroundColor: newLabelColor }}
              >
                <Tag className="w-3 h-3" />
                {newLabelName || 'Nome da etiqueta'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditLabel}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Excluir Etiqueta</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Tem certeza que deseja excluir a etiqueta "{deletingLabel?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteLabel}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EtiquetasSection;
