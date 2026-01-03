import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, RefreshCw } from 'lucide-react';
import { SearchInput } from '@/components/SearchInput';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/excelImporter';

interface LancamentosToolbarProps {
  onSearch: (term: string) => void;
  onRefresh: () => void;
  onNewClick: () => void;
  data?: unknown[];
}

export const LancamentosToolbar = memo(function LancamentosToolbar({ 
  onSearch, 
  onRefresh, 
  onNewClick, 
  data = [], 
}: LancamentosToolbarProps) {
  const handleExport = () => {
    if (data.length === 0) { toast.warning('Nenhum dado'); return; }
    exportToExcel(data as Record<string, unknown>[], [
      { key: 'descricao' as const, label: 'Descrição' },
      { key: 'valor' as const, label: 'Valor' },
      { key: 'status' as const, label: 'Status' },
    ], 'lancamentos');
    toast.success('Exportado!');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <SearchInput 
        value=""
        onChange={onSearch} 
        placeholder="Buscar lançamento..." 
        className="w-64" 
      />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={onNewClick}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

export default LancamentosToolbar;
