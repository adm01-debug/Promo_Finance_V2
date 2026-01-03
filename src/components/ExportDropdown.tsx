/**
 * Componente de Dropdown para Exportação
 * 
 * @module components/ExportDropdown
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, Loader2 } from 'lucide-react';

interface ExportDropdownProps {
  onExport: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  itemCount?: number;
}

export function ExportDropdown({
  onExport,
  isExporting = false,
  disabled = false,
  itemCount,
}: ExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled || isExporting}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Exportar</span>
          {itemCount !== undefined && itemCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {itemCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={onExport}
          className="flex items-center gap-3"
        >
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">CSV</div>
            <div className="text-xs text-muted-foreground">
              Planilha Excel compatível
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportDropdown;
