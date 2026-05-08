import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle2, Brain, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransacaoExport {
  descricao: string;
  data: Date | string;
  valor: number;
  tipo: string;
  status: string;
  compensacao_valor?: number;
  compensacao_motivo?: string;
  compensacao_classificacao?: string;
  compensacao_regra?: string;
}

interface ConciliacaoExportProps {
  transacoes: TransacaoExport[];
  stats: {
    total: number;
    conciliadas: number;
    pendentes: number;
    percentual: number;
    valorConciliado: number;
    valorPendente: number;
  };
}

type ExportScope = 'todas' | 'conciliadas' | 'feedback_ia';
type ExportFormat = 'csv' | 'pdf';

interface FeedbackRow {
  descricao: string;
  data: string;
  valor: number;
  tipo: string;
  status: string;
  acao_ia: string;
  motivo_rejeicao: string | null;
}

const SCOPE_LABEL: Record<ExportScope, string> = {
  todas: 'Todas as transações',
  conciliadas: 'Apenas conciliadas',
  feedback_ia: 'Com feedback de IA',
};

export function ConciliacaoExport({ transacoes, stats }: ConciliacaoExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function carregarFeedbackIA(): Promise<FeedbackRow[]> {
    const { data, error } = await supabase
      .from('feedback_conciliacao_ia')
      .select('acao, motivo_rejeicao, created_at, transacao_bancaria_id')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const txIds = Array.from(new Set(rows.map((r) => r.transacao_bancaria_id).filter(Boolean) as string[]));
    if (txIds.length === 0) return [];

    const { data: txs } = await supabase
      .from('transacoes_bancarias')
      .select('id,descricao,valor,data,tipo,conciliada,compensacao_valor,compensacao_motivo,compensacao_classificacao,compensacao_regra')
      .in('id', txIds);
    const txMap = new Map((txs ?? []).map((t) => [t.id, t]));

    const seen = new Set<string>();
    const result: FeedbackRow[] = [];
    for (const fb of rows) {
      if (!fb.transacao_bancaria_id || seen.has(fb.transacao_bancaria_id)) continue;
      seen.add(fb.transacao_bancaria_id);
      const tx = txMap.get(fb.transacao_bancaria_id);
      if (!tx) continue;
      result.push({
        descricao: tx.descricao ?? '',
        data: tx.data ?? '',
        valor: Number(tx.valor ?? 0),
        tipo: tx.tipo ?? '',
        status: tx.conciliada ? 'conciliada' : 'pendente',
        acao_ia: fb.acao ?? '',
        motivo_rejeicao: fb.motivo_rejeicao ?? null,
      });
    }
    return result;
  }

  const buildBaseRows = (scope: ExportScope): TransacaoExport[] => {
    if (scope === 'conciliadas') return transacoes.filter((t) => t.status === 'conciliada');
    return transacoes;
  };

  const buildStats = (rows: Array<TransacaoExport | FeedbackRow>) => {
    const total = rows.length;
    const conciliadas = rows.filter((r) => r.status === 'conciliada').length;
    const pendentes = total - conciliadas;
    const valorConciliado = rows.filter((r) => r.status === 'conciliada').reduce((s, r) => s + Number(r.valor || 0), 0);
    const valorPendente = rows.filter((r) => r.status !== 'conciliada').reduce((s, r) => s + Number(r.valor || 0), 0);
    return {
      total,
      conciliadas,
      pendentes,
      percentual: total > 0 ? (conciliadas / total) * 100 : 0,
      valorConciliado,
      valorPendente,
    };
  };

  const exportar = async (scope: ExportScope, fmt: ExportFormat) => {
    setIsExporting(true);
    try {
      let rows: Array<TransacaoExport | FeedbackRow>;
      let scopeStats: typeof stats;
      const isFeedback = scope === 'feedback_ia';

      if (isFeedback) {
        const fb = await carregarFeedbackIA();
        rows = fb;
        scopeStats = buildStats(fb);
        if (fb.length === 0) {
          toast.info('Nenhuma transação com feedback de IA encontrada');
          return;
        }
      } else {
        const base = buildBaseRows(scope);
        rows = base;
        scopeStats = scope === 'todas' ? stats : buildStats(base);
        if (base.length === 0) {
          toast.info('Nenhuma transação para exportar neste escopo');
          return;
        }
      }

      const scopeLabel = SCOPE_LABEL[scope];
      const filenameSuffix = scope === 'todas' ? 'todas' : scope === 'conciliadas' ? 'conciliadas' : 'feedback-ia';

      if (fmt === 'csv') {
        const headers = isFeedback
          ? ['Descrição', 'Data', 'Valor', 'Tipo', 'Status', 'Ação IA', 'Motivo Rejeição']
          : ['Descrição', 'Data', 'Valor', 'Tipo', 'Status', 'Ajuste (R$)', 'Classificação', 'Regra Aplicada'];

        const dataRows = rows.map((r) => {
          const base = [
            r.descricao,
            formatDate(r.data),
            String(r.valor).replace('.', ','),
            r.tipo === 'credito' ? 'Crédito' : 'Débito',
            r.status === 'conciliada' ? 'Conciliada' : 'Pendente',
          ];
          
          if (isFeedback) {
            const fb = r as FeedbackRow;
            base.push(fb.acao_ia === 'aprovado' ? 'Aprovado' : 'Rejeitado');
            base.push(fb.motivo_rejeicao || '');
          } else {
            const tx = r as TransacaoExport;
            base.push(String(tx.compensacao_valor || 0).replace('.', ','));
            base.push(tx.compensacao_classificacao || '');
            base.push(tx.compensacao_regra || '');
          }
          return base;
        });

        const summaryRows = [
          ['Métrica', 'Valor'],
          ['Escopo', scopeLabel],
          ['Total de Transações', String(scopeStats.total)],
          ['Conciliadas', String(scopeStats.conciliadas)],
          ['Pendentes', String(scopeStats.pendentes)],
          ['% Conciliado', `${scopeStats.percentual.toFixed(1)}%`],
          ['Valor Conciliado', formatCurrency(scopeStats.valorConciliado)],
          ['Valor Pendente', formatCurrency(scopeStats.valorPendente)],
        ];

        const csvSections = [
          'Resumo',
          ...summaryRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
          '',
          'Transações',
          headers.map((h) => `"${h}"`).join(','),
          ...dataRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
        ];

        const csvContent = `\uFEFF${csvSections.join('\n')}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `conciliacao_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(`CSV exportado — ${scopeLabel}`);
      } else {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Relatório de Conciliação Bancária', 14, 20);
        doc.setFontSize(10);
        doc.text(`Escopo: ${scopeLabel}`, 14, 28);
        doc.text(`Gerado em: ${formatDate(new Date())}`, 14, 34);

        doc.setFontSize(12);
        doc.text('Resumo', 14, 46);
        autoTable(doc, {
          startY: 50,
          head: [['Métrica', 'Valor']],
          body: [
            ['Total de Transações', String(scopeStats.total)],
            ['Conciliadas', String(scopeStats.conciliadas)],
            ['Pendentes', String(scopeStats.pendentes)],
            ['% Conciliado', `${scopeStats.percentual.toFixed(1)}%`],
            ['Valor Conciliado', formatCurrency(scopeStats.valorConciliado)],
            ['Valor Pendente', formatCurrency(scopeStats.valorPendente)],
          ],
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });

        const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 100;
        doc.setFontSize(12);
        doc.text('Transações', 14, finalY + 12);

        const head = isFeedback
          ? [['Descrição', 'Data', 'Valor', 'Tipo', 'Status', 'Ação IA', 'Motivo']]
          : [['Descrição', 'Data', 'Valor', 'Tipo', 'Status']];

        const body = rows.slice(0, 100).map((r) => {
          const base = [
            r.descricao.slice(0, 40),
            formatDate(r.data),
            formatCurrency(r.valor),
            r.tipo === 'credito' ? 'Crédito' : 'Débito',
            r.status === 'conciliada' ? 'Conciliada' : 'Pendente',
          ];
          if (isFeedback) {
            const fb = r as FeedbackRow;
            base.push(fb.acao_ia === 'aprovado' ? 'Aprovado' : 'Rejeitado');
            base.push((fb.motivo_rejeicao || '').slice(0, 50));
          }
          return base;
        });

        autoTable(doc, {
          startY: finalY + 16,
          head,
          body,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });

        doc.save(`conciliacao_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
        toast.success(`PDF exportado — ${scopeLabel}`);
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  const renderScopeItems = (fmt: ExportFormat) => (
    <>
      <DropdownMenuItem onClick={() => exportar('todas', fmt)} className="gap-2">
        <List className="h-4 w-4 text-muted-foreground" />
        Todas as transações
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => exportar('conciliadas', fmt)} className="gap-2">
        <CheckCircle2 className="h-4 w-4 text-success" />
        Apenas conciliadas
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => exportar('feedback_ia', fmt)} className="gap-2">
        <Brain className="h-4 w-4 text-primary" />
        Com feedback de IA
      </DropdownMenuItem>
    </>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Formato e escopo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-success" />
            Planilha (.csv)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>{renderScopeItems('csv')}</DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2">
            <FileText className="h-4 w-4 text-destructive" />
            PDF (.pdf)
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>{renderScopeItems('pdf')}</DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
