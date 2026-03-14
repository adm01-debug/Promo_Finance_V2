import { memo } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface FluxoCaixaDado {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface FluxoCaixaHeaderProps {
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  dadosCenarioAtivo: FluxoCaixaDado[];
  cenarioAtivo: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export const FluxoCaixaHeader = memo(function FluxoCaixaHeader({
  periodo,
  onPeriodoChange,
  onRefresh,
  isLoading,
  dadosCenarioAtivo,
  cenarioAtivo,
}: FluxoCaixaHeaderProps) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 className="text-display-md text-foreground">Fluxo de Caixa</h1>
        <p className="text-muted-foreground mt-1">Projeção financeira com análise de cenários</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={periodo} onValueChange={onPeriodoChange}>
          <TabsList className="h-9">
            <TabsTrigger value="7d" className="text-xs px-3">7 dias</TabsTrigger>
            <TabsTrigger value="15d" className="text-xs px-3">15 dias</TabsTrigger>
            <TabsTrigger value="30d" className="text-xs px-3">30 dias</TabsTrigger>
            <TabsTrigger value="90d" className="text-xs px-3">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              import('@/lib/pdf-generator').then(({ generateFluxoCaixaPDF }) => {
                generateFluxoCaixaPDF(dadosCenarioAtivo, `Fluxo de Caixa - Cenário ${cenarioAtivo}`);
                toast.success('PDF gerado com sucesso!');
              });
            }}>
              <FileText className="h-4 w-4 mr-2 text-destructive" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              import('@/lib/pdf-generator').then(({ generateFluxoCaixaCSV }) => {
                generateFluxoCaixaCSV(dadosCenarioAtivo);
                toast.success('Excel exportado com sucesso!');
              });
            }}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
});
