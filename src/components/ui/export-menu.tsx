import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/export-utils';

interface ExportMenuProps<T extends Record<string, any>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
}

export function ExportMenu<T extends Record<string, any>>({ 
  data, 
  columns, 
  filename, 
  title 
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
          onClick={() => exportToPDF(data, columns, title)}
        >
          <FileText className="h-4 w-4" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
