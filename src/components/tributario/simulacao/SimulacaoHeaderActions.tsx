// ============================================
// COMPONENTE: Ações do header da Simulação
// Extraído de SimulacaoRegimes.tsx (modularização)
// ============================================

import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles, ArrowRight, FileDown, Save } from 'lucide-react';

interface Props {
  empresaId?: string;
  faturamentoCount: number;
  onRecarregarHistorico: () => void;
  onAnalisarElisao: () => void;
  onExportarPdf: () => void;
  onSalvar: () => void;
  isAnalisandoElisao: boolean;
  isSalvando: boolean;
}

export function SimulacaoHeaderActions({
  empresaId,
  faturamentoCount,
  onRecarregarHistorico,
  onAnalisarElisao,
  onExportarPdf,
  onSalvar,
  isAnalisandoElisao,
  isSalvando,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRecarregarHistorico}
        disabled={!empresaId || faturamentoCount === 0}
        aria-label="Recarregar parâmetros do histórico"
      >
        <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
        Histórico
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onAnalisarElisao}
        disabled={!empresaId || isAnalisandoElisao}
        aria-label="Analisar oportunidades de elisão fiscal"
      >
        <Sparkles className="h-4 w-4 mr-2" aria-hidden="true" />
        {isAnalisandoElisao ? 'Analisando…' : 'Elisão Fiscal'}
        <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onExportarPdf}
        disabled={!empresaId}
        aria-label="Exportar PDF executivo"
      >
        <FileDown className="h-4 w-4 mr-2" aria-hidden="true" />
        PDF Executivo
      </Button>
      <Button
        size="sm"
        onClick={onSalvar}
        disabled={!empresaId || isSalvando}
        aria-label="Salvar simulação no histórico"
      >
        <Save className="h-4 w-4 mr-2" aria-hidden="true" />
        Salvar
      </Button>
    </div>
  );
}
