import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, RefreshCw, DollarSign, CheckCircle } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
import { AdvancedFilters, FilterValue, FilterConfig } from '@/components/AdvancedFilters';
import { DataImporter } from '@/components/DataImporter';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { VersionHistory } from '@/components/VersionHistory';
import { lancamentoSchema, financeImportTemplates, financeFilterConfigs } from '@/lib/financeSchemas';
import { exportToExcel } from '@/lib/excelImporter';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LancamentosToolbarProps {
  onSearch: (term: string) => void;
  onFiltersChange: (filters: FilterValue[]) => void;
  onRefresh: () => void;
  onNewClick: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkPagar: () => void;
  onBulkCancelar: () => void;
  currentFilters: Record<string, unknown>;
  data?: unknown[];
  selectedId?: string;
}

export const LancamentosToolbar = memo(function LancamentosToolbar({ onSearch, onFiltersChange, onRefresh, onNewClick, selectedCount, onClearSelection, onBulkPagar, onBulkCancelar, currentFilters, data = [], selectedId }: LancamentosToolbarProps) {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);

  const handleImport = async (lancamentos: unknown[]) => {
    const { error } = await supabase.from('lancamentos').insert(lancamentos);
    if (error) throw error;
    toast.success(`${lancamentos.length} lançamentos importados!`);
    onRefresh();
  };

  const handleExport = () => {
    if (data.length === 0) { toast.warning('Nenhum dado'); return; }
    exportToExcel(data as Record<string, unknown>[], [
      { key: 'descricao' as const, label: 'Descrição' },
      { key: 'tipo' as const, label: 'Tipo' },
      { key: 'valor' as const, label: 'Valor' },
      { key: 'data_vencimento' as const, label: 'Vencimento' },
      { key: 'status' as const, label: 'Status' },
    ], 'lancamentos', 'Lançamentos');
    toast.success('Exportado!');
  };

  const bulkActions = [
    { key: 'pagar', label: 'Marcar Pago', icon: <CheckCircle className="h-4 w-4" />, onClick: onBulkPagar },
    { key: 'cancelar', label: 'Cancelar', variant: 'destructive' as const, onClick: onBulkCancelar },
  ];

  return (
    <div className="space-y-3">
      {selectedCount > 0 && <BulkActionsBar selectedCount={selectedCount} onClearSelection={onClearSelection} actions={bulkActions} />}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput onSearch={onSearch} placeholder="Buscar lançamento..." className="w-64" />
          <AdvancedFilters filters={financeFilterConfigs.lancamentos as FilterConfig[]} values={filterValues} onChange={(v) => { setFilterValues(v); onFiltersChange(v); }} />
          <SavedFiltersDropdown entityType="lancamentos" currentFilters={currentFilters} onApplyFilter={(f) => { const values = Object.entries(f).map(([k,v]) => ({ key: k, operator: 'eq' as const, value: v })); setFilterValues(values); onFiltersChange(values); }} />
          {selectedId && <VersionHistory entityType="lancamentos" entityId={selectedId} />}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4" /></Button>
          <DataImporter schema={lancamentoSchema} columns={financeImportTemplates.lancamentos} onImport={handleImport} templateName="lancamentos" title="Importar Lançamentos" trigger={<Button variant="outline" size="sm"><Upload className="h-4 w-4" /></Button>} onSuccess={onRefresh} />
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4" /></Button>
          <Button size="sm" onClick={onNewClick}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
});
export default LancamentosToolbar;
