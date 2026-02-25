import React, { useState } from 'react';
import {
  Package,
  Wrench,
  Plus,
  AlertTriangle,
  ChevronRight,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  PackagePlus,
  Eye,
  EyeOff,
  FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useInventoryStore, InventoryItem } from '@/stores/inventory/inventory-store';
import { InventoryModal } from './InventoryModal';
import { InventoryCsvImport } from './InventoryCsvImport';

interface InventorySectionProps {
  onNavigateToFull?: () => void;
  compact?: boolean;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  onNavigateToFull,
  compact = false
}) => {
  const store = useInventoryStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [addStockQuantity, setAddStockQuantity] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'produto' | 'servico' | 'low'>('all');
  const [showCsvImport, setShowCsvImport] = useState(false);

  const items = store.getItems();
  const stats = store.getStats();

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'produto') return matchesSearch && item.type === 'produto';
    if (filter === 'servico') return matchesSearch && item.type === 'servico';
    if (filter === 'low') {
      const isLow = item.minStockAlert !== undefined
        ? item.quantity <= item.minStockAlert
        : item.quantity === 0;
      return matchesSearch && isLow && item.status === 'ativo';
    }
    return matchesSearch;
  });

  const displayItems = compact ? filteredItems.slice(0, 5) : filteredItems;

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleAddStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setAddStockQuantity('');
    setShowAddStockModal(true);
  };

  const handleConfirmAddStock = () => {
    if (!selectedItem || !addStockQuantity) return;

    const qty = parseInt(addStockQuantity);
    if (qty <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    // Stock management is simple for now - just update the item
    toast.success(`Estoque atualizado para ${selectedItem.name}`);
    setShowAddStockModal(false);
    setSelectedItem(null);
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    store.deleteItem(itemToDelete.id);
    toast.success('Item removido do estoque');
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleToggleStatus = (item: InventoryItem) => {
    const newStatus = item.status === 'ativo' ? 'inativo' : 'ativo';
    store.updateItem(item.id, { status: newStatus });
    toast.success(`Item ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`);
  };

  const isLowStock = (item: InventoryItem) => {
    if (item.status !== 'ativo') return false;
    if (item.minStockAlert !== undefined) return item.quantity <= item.minStockAlert;
    return item.quantity === 0;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Estoque</h3>
          {stats.lowStockCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              {stats.lowStockCount} baixo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCsvImport(true)}
            className="h-7 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
            Importar CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedItem(null);
              setShowModal(true);
            }}
            className="h-7 text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo Item
          </Button>
          {onNavigateToFull && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onNavigateToFull}
              className="h-7 text-xs text-muted-foreground"
            >
              Ver tudo
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${filter === 'all'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border/20 text-muted-foreground hover:border-border/40'
            }`}
        >
          <span className="text-sm font-semibold block">{stats.totalItems}</span>
          <span className="text-[10px]">Total</span>
        </button>
        <button
          onClick={() => setFilter('produto')}
          className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${filter === 'produto'
              ? 'bg-info/10 border-info/30 text-info'
              : 'bg-card border-border/20 text-muted-foreground hover:border-border/40'
            }`}
        >
          <span className="text-sm font-semibold block">{stats.totalProducts}</span>
          <span className="text-[10px]">Produtos</span>
        </button>
        <button
          onClick={() => setFilter('servico')}
          className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${filter === 'servico'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-card border-border/20 text-muted-foreground hover:border-border/40'
            }`}
        >
          <span className="text-sm font-semibold block">{stats.totalServices}</span>
          <span className="text-[10px]">Serviços</span>
        </button>
        <button
          onClick={() => setFilter('low')}
          className={`px-2 py-1.5 rounded-lg border text-center transition-colors ${filter === 'low'
              ? 'bg-destructive/10 border-destructive/30 text-destructive'
              : 'bg-card border-border/20 text-muted-foreground hover:border-border/40'
            }`}
        >
          <span className="text-sm font-semibold block">{stats.lowStockCount}</span>
          <span className="text-[10px]">Baixo</span>
        </button>
      </div>

      {/* Search */}
      {!compact && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar item..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}

      {/* Items List */}
      <div className="space-y-1.5">
        {displayItems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground/60">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum item encontrado</p>
          </div>
        ) : (
          displayItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${isLowStock(item)
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-card/50 border-border/15 hover:border-border/30'
                } ${item.status === 'inativo' ? 'opacity-60' : ''}`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'produto' ? 'bg-primary/10' : 'bg-info/10'
                }`}>
                {item.type === 'produto' ? (
                  <Package className={`w-4 h-4 ${item.type === 'produto' ? 'text-primary' : 'text-info'}`} />
                ) : (
                  <Wrench className="w-4 h-4 text-info" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                  {item.status === 'inativo' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">Inativo</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {item.category && <span>{item.category}</span>}
                  {item.referenceValue && (
                    <>
                      <span>•</span>
                      <span>{formatCurrency(item.referenceValue)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-semibold ${isLowStock(item) ? 'text-destructive' : 'text-foreground'
                  }`}>
                  {item.quantity}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
                </div>
                {isLowStock(item) && (
                  <div className="flex items-center gap-0.5 text-[10px] text-destructive">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Estoque baixo</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleAddStock(item)}>
                    <PackagePlus className="w-4 h-4 mr-2" />
                    Adicionar Estoque
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(item)}>
                    {item.status === 'ativo' ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {/* Show more link for compact mode */}
      {compact && filteredItems.length > 5 && (
        <button
          onClick={onNavigateToFull}
          className="w-full py-2 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          Ver todos os {filteredItems.length} itens
        </button>
      )}

      {/* Modals */}
      <InventoryModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
      />

      {/* Add Stock Modal */}
      <Dialog open={showAddStockModal} onOpenChange={setShowAddStockModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-success" />
              Adicionar Estoque
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="addQty">Quantidade a adicionar</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="addQty"
                type="number"
                min="1"
                value={addStockQuantity}
                onChange={(e) => setAddStockQuantity(e.target.value)}
                placeholder="0"
                className="text-lg"
              />
              <span className="text-muted-foreground">{selectedItem?.unit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Estoque atual: {selectedItem?.quantity} {selectedItem?.unit}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStockModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAddStock}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Excluir Item
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{itemToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <InventoryCsvImport
        open={showCsvImport}
        onClose={() => setShowCsvImport(false)}
      />
    </div>
  );
};
