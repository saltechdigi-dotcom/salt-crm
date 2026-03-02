import React, { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar, FileSpreadsheet, FileText, Download, Filter, Users, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sale } from '@/stores/sales';
import api from '@/lib/api';

interface SalesReportExportProps {
  open: boolean;
  onClose: () => void;
}

// Mock teams data
const mockTeams = [
  { id: 'team-1', name: 'Equipe Comercial SP' },
  { id: 'team-2', name: 'Equipe Comercial RJ' },
  { id: 'team-3', name: 'Equipe Inside Sales' },
];

// Mock vendedores
const mockVendedores = [
  { id: 'agent-1', name: 'Maria Silva', teamId: 'team-1' },
  { id: 'agent-2', name: 'João Carlos', teamId: 'team-1' },
  { id: 'agent-3', name: 'Pedro Santos', teamId: 'team-2' },
  { id: 'agent-4', name: 'Ana Paula', teamId: 'team-2' },
  { id: 'agent-5', name: 'Lucas Ferreira', teamId: 'team-3' },
];

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  cartao_vista: 'Cartão à Vista',
  cartao_parcelado: 'Cartão Parcelado',
  boleto: 'Boleto',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
};

export const SalesReportExport: React.FC<SalesReportExportProps> = ({ open, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Sales from API
  const [allSales, setAllSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (open) {
      api.get('/sales')
        .then(res => {
          const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
          setAllSales(data);
        })
        .catch(err => console.error('Error fetching sales for report:', err));
    }
  }, [open]);

  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedVendedor, setSelectedVendedor] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  // Filter vendedores by team
  const filteredVendedores = useMemo(() => {
    if (selectedTeam === 'all') return mockVendedores;
    return mockVendedores.filter(v => v.teamId === selectedTeam);
  }, [selectedTeam]);

  // Reset vendedor when team changes
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setSelectedVendedor('all');
  };

  // Get filtered sales data
  const filteredSales = useMemo(() => {
    let sales = [...allSales];

    // Filter by date
    if (startDate) {
      const start = new Date(startDate);
      sales = sales.filter(s => new Date(s.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      sales = sales.filter(s => new Date(s.createdAt) <= end);
    }

    // Filter by vendedor
    if (selectedVendedor !== 'all') {
      sales = sales.filter(s => s.agentId === selectedVendedor);
    }

    // Filter by team (through agents)
    if (selectedTeam !== 'all') {
      const teamAgentIds = mockVendedores.filter(v => v.teamId === selectedTeam).map(v => v.id);
      sales = sales.filter(s => teamAgentIds.includes(s.agentId));
    }

    // Filter by payment method
    if (selectedPaymentMethod !== 'all') {
      sales = sales.filter(s => s.paymentMethod === selectedPaymentMethod);
    }

    return sales;
  }, [startDate, endDate, selectedTeam, selectedVendedor, selectedPaymentMethod]);

  // Convert sale to CSV row
  const saleToRow = (sale: Sale): string[] => {
    return [
      sale.id,
      sale.client?.name || sale.leadName,
      sale.client?.document || '-',
      sale.client?.phone || sale.leadPhone,
      sale.client?.email || '-',
      sale.productName,
      sale.productCode || '-',
      sale.saleValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod,
      sale.paymentCondition === 'installment' ? `${sale.installments}x` : 'À Vista',
      new Date(sale.saleDate || sale.createdAt).toLocaleDateString('pt-BR'),
      sale.agentName,
      sale.managerName,
      sale.status === 'validated' ? 'Validada' : sale.status === 'pending_manager' ? 'Pendente' : sale.status,
      sale.observations || '-',
    ];
  };

  // CSV headers
  const csvHeaders = [
    'ID',
    'Cliente',
    'Documento',
    'Telefone',
    'E-mail',
    'Produto',
    'Código',
    'Valor',
    'Forma Pagamento',
    'Condição',
    'Data Venda',
    'Vendedor',
    'Gerente',
    'Status',
    'Observações',
  ];

  // Export to CSV
  const exportToCSV = () => {
    setIsExporting(true);

    try {
      const rows = filteredSales.map(saleToRow);
      const csvContent = [
        csvHeaders.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
      ].join('\n');

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Relatório CSV exportado com ${filteredSales.length} vendas`);
    } catch (error) {
      toast.error('Erro ao exportar relatório CSV');
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel (XLSX as CSV with .xlsx extension - basic approach)
  const exportToExcel = () => {
    setIsExporting(true);

    try {
      const rows = filteredSales.map(saleToRow);

      // Create tab-separated content for Excel compatibility
      const excelContent = [
        csvHeaders.join('\t'),
        ...rows.map(row => row.join('\t')),
      ].join('\n');

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_vendas_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Relatório Excel exportado com ${filteredSales.length} vendas`);
    } catch (error) {
      toast.error('Erro ao exportar relatório Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalValue = filteredSales.reduce((acc, s) => acc + s.saleValue, 0);
    const validated = filteredSales.filter(s => s.status === 'validated').length;
    const pending = filteredSales.filter(s => s.status === 'pending_manager').length;

    return { totalValue, validated, pending, count: filteredSales.length };
  }, [filteredSales]);

  // Clear filters
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTeam('all');
    setSelectedVendedor('all');
    setSelectedPaymentMethod('all');
  };

  const hasFilters = startDate || endDate || selectedTeam !== 'all' || selectedVendedor !== 'all' || selectedPaymentMethod !== 'all';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportar Relatório de Vendas
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Configure os filtros e exporte o relatório no formato desejado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 max-h-[calc(90vh-180px)]">
          {/* Period Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Período
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground/60">Data inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] text-muted-foreground/60">Data final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Team Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Time / Equipe
            </Label>
            <Select value={selectedTeam} onValueChange={handleTeamChange}>
              <SelectTrigger className="h-9 text-[11px]">
                <SelectValue placeholder="Todos os times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os times</SelectItem>
                {mockTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendedor Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Vendedor
            </Label>
            <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
              <SelectTrigger className="h-9 text-[11px]">
                <SelectValue placeholder="Todos os vendedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os vendedores</SelectItem>
                {filteredVendedores.map(vendedor => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>{vendedor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3 h-3" />
              Forma de Pagamento
            </Label>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger className="h-9 text-[11px]">
                <SelectValue placeholder="Todas as formas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as formas</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                <SelectItem value="cartao_vista">Cartão à Vista</SelectItem>
                <SelectItem value="cartao_parcelado">Cartão Parcelado</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-[10px] text-muted-foreground/70 hover:text-foreground h-7 px-2"
            >
              <Filter className="w-3 h-3 mr-1" />
              Limpar filtros
            </Button>
          )}

          {/* Summary Preview */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
            <h4 className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-2">
              Resumo do Relatório
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground/60">Total de vendas</span>
                <p className="text-lg font-semibold text-foreground">{totals.count}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground/60">Valor total</span>
                <p className="text-lg font-semibold text-success">
                  R$ {totals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground/60">Validadas</span>
                <p className="text-sm font-medium text-foreground/80">{totals.validated}</p>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground/60">Pendentes</span>
                <p className="text-sm font-medium text-warning">{totals.pending}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-muted-foreground"
          >
            Cancelar
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={isExporting || filteredSales.length === 0}
            className="gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Exportar CSV
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={isExporting || filteredSales.length === 0}
            className="bg-success hover:bg-success/90 gap-2"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Exportar Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SalesReportExport;
