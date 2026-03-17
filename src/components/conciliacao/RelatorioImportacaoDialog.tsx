import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { EstatisticasMatch, MatchSugestao } from '@/lib/transaction-matcher';
import type { TransacaoOFX } from '@/lib/ofx-parser';

export interface ImportReport {
  totalImportadas: number;
  totalSalvas: number;
  totalDuplicadas: number;
  autoConciliadas: number;
  pendentesRevisao: number;
  valorAutoConciliado: number;
  valorPendente: number;
  estatisticas: EstatisticasMatch;
  matchesAlta: Array<{ transacao: TransacaoOFX; match: MatchSugestao }>;
}

interface RelatorioImportacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: ImportReport | null;
  onIrParaConciliacao: () => void;
}

export function RelatorioImportacaoDialog({
  open,
  onOpenChange,
  report,
  onIrParaConciliacao,
}: RelatorioImportacaoDialogProps) {
  if (!report) return null;

  const percentualAuto = report.totalImportadas > 0
    ? (report.autoConciliadas / report.totalImportadas) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Importação Concluída
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-success/5 border-success/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-success">{report.totalSalvas}</p>
                <p className="text-xs text-muted-foreground">Salvas no banco</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{report.autoConciliadas}</p>
                <p className="text-xs text-muted-foreground">Auto-conciliadas</p>
              </CardContent>
            </Card>
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-warning">{report.pendentesRevisao}</p>
                <p className="text-xs text-muted-foreground">Para revisão</p>
              </CardContent>
            </Card>
          </div>

          {/* Auto-reconciliation progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                Auto-conciliação
              </span>
              <span className="font-medium">{percentualAuto.toFixed(0)}%</span>
            </div>
            <Progress value={percentualAuto} className="h-2" />
          </div>

          {/* Financial Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 text-sm">
            <div className="flex items-center gap-1.5 text-success">
              <TrendingUp className="h-4 w-4" />
              <span>Conciliado: {formatCurrency(report.valorAutoConciliado)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-warning">
              <TrendingDown className="h-4 w-4" />
              <span>Pendente: {formatCurrency(report.valorPendente)}</span>
            </div>
          </div>

          {/* Match Quality */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Qualidade dos Matches IA</p>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-success/10">
                <p className="font-bold text-success">{report.estatisticas.confiancaAlta}</p>
                <p className="text-muted-foreground">Alta</p>
              </div>
              <div className="p-2 rounded bg-primary/10">
                <p className="font-bold text-primary">{report.estatisticas.confiancaMedia}</p>
                <p className="text-muted-foreground">Média</p>
              </div>
              <div className="p-2 rounded bg-warning/10">
                <p className="font-bold text-warning">{report.estatisticas.confiancaBaixa}</p>
                <p className="text-muted-foreground">Baixa</p>
              </div>
              <div className="p-2 rounded bg-muted">
                <p className="font-bold">{report.estatisticas.semMatch}</p>
                <p className="text-muted-foreground">Sem match</p>
              </div>
            </div>
          </div>

          {/* Duplicates warning */}
          {report.totalDuplicadas > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-warning">{report.totalDuplicadas} transação(ões) duplicada(s)</strong> foram ignoradas automaticamente.
              </p>
            </div>
          )}

          {/* Auto-reconciled list */}
          {report.matchesAlta.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Conciliadas automaticamente ({report.matchesAlta.length})
              </p>
              <ScrollArea className="h-[120px] rounded border">
                <div className="divide-y text-xs">
                  {report.matchesAlta.slice(0, 10).map(({ transacao, match }) => (
                    <div key={transacao.id} className="flex items-center justify-between p-2">
                      <span className="truncate flex-1">{transacao.descricao}</span>
                      <ArrowRight className="h-3 w-3 mx-2 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1 text-right">{match.lancamento.entidade}</span>
                      <Badge variant="outline" className="ml-2 shrink-0 text-success">
                        {match.score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {report.pendentesRevisao > 0 && (
            <Button onClick={onIrParaConciliacao} className="gap-2">
              <Target className="h-4 w-4" />
              Revisar Pendentes ({report.pendentesRevisao})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
