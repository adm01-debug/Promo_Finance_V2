import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/export-utils';

interface ExportMenuEmpresa {
  nome_fantasia?: string | null;
  razao_social?: string | null;
  cnpj?: string | null;
}

interface ExportMenuKpis {
  totalReceber?: number;
  totalVencido?: number;
  totalRecebidoMes?: number;
  taxaInadimplencia?: number;
}

interface ExportMenuProps<T extends object> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
  empresa?: ExportMenuEmpresa;
  kpis?: ExportMenuKpis;
}

export function ExportMenu<T extends object>({ 
  data, 
  columns, 
  filename, 
  title,
  empresa,
  kpis
}: ExportMenuProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => exportToCSV(data, columns, filename)}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="gap-2 cursor-pointer"
          onClick={() => exportToPDF(data, columns, title, {
            empresa: empresa as { nome_fantasia?: string; razao_social?: string; cnpj?: string } | undefined,
            kpis,
          })}
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
