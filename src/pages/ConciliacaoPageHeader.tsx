import { motion } from 'framer-motion';
import { Upload, Zap, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ImportarExtratoDialog } from '@/components/conciliacao/ImportarExtratoDialog';
import type { ConciliacaoFilterState } from '@/components/conciliacao/ConciliacaoFilters';
import { ConciliacaoExport } from '@/components/conciliacao/ConciliacaoExport';
import { BankAccountSwitcher } from '@/components/financeiro/BankAccountSwitcher';
import { EmpresaScopeBar } from '@/components/empresa/EmpresaScopeBar';
import { itemVariants } from './conciliacao-variants';

interface ConciliacaoPageHeaderProps {
  setShowSugestoesFila: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  showSugestoesFila: boolean;
  transacoesImportadas: import('@/lib/ofx-parser').TransacaoOFX[];
  exportData: {
    transacoes: {
      id: string;
      descricao: string;
      data: Date;
      valor: number;
      tipo: 'credito' | 'debito';
      status: string;
      compensacao_valor: number;
      compensacao_motivo: string;
      compensacao_classificacao: string;
      compensacao_regra: string;
      compensacao_evidencia_url: string;
    }[];
    stats: {
      total: number;
      conciliadas: number;
      pendentes: number;
      percentual: number;
      valorConciliado: number;
      valorPendente: number;
    };
  };
  filters: ConciliacaoFilterState;
  setShowImportDialog: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  showImportDialog: boolean;
  handleImportSuccess: (extrato: import('@/lib/ofx-parser').ExtratoOFX) => Promise<void>;
  selectedBanco: string;
}

export function ConciliacaoPageHeader({
  setShowSugestoesFila,
  showSugestoesFila,
  transacoesImportadas,
  exportData,
  filters,
  setShowImportDialog,
  showImportDialog,
  handleImportSuccess,
  selectedBanco,
}: ConciliacaoPageHeaderProps) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div>
          <h1 className="text-display-md text-foreground">Conciliação Bancária</h1>
          <p className="text-muted-foreground mt-1">
            Reconcilie transações bancárias com lançamentos do sistema
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm">
          <EmpresaScopeBar />
          <div className="w-px h-6 bg-card/10 mx-1" />
          <BankAccountSwitcher />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSugestoesFila(!showSugestoesFila)}
          className={cn('gap-2 border-accent/50', showSugestoesFila && 'bg-accent/10')}
        >
          <Zap className="h-4 w-4 text-accent" />
          Fila de Sugestões {transacoesImportadas.length > 0 && `(${transacoesImportadas.length})`}
        </Button>

        <ConciliacaoExport
          transacoes={exportData.transacoes}
          stats={exportData.stats}
          filters={filters}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25"
            >
              <Upload className="h-4 w-4" />
              Importar Extrato
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-1">
              <Keyboard className="h-3 w-3" /> Ctrl+I
            </p>
          </TooltipContent>
        </Tooltip>
        <ImportarExtratoDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportSuccess={handleImportSuccess}
          contaBancariaId={selectedBanco}
        />
      </div>
    </motion.div>
  );
}
