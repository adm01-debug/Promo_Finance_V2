import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ExtratoOFX, TransacaoOFX } from '@/lib/ofx-parser';
import {
  Building2, Calendar, Hash, TrendingUp, TrendingDown, FileCheck,
  AlertTriangle, CheckCircle2,
} from 'lucide-react';

interface Props {
  extrato: ExtratoOFX;
  avisos: string[];
  selectedTransacoes: Set<string>;
  onToggleTransacao: (id: string) => void;
  onToggleAll: () => void;
}

export function ExtratoPreviewStep({ extrato, avisos, selectedTransacoes, onToggleTransacao, onToggleAll }: Props) {
  return (
    <div className="space-y-4">
      {/* File Info */}
      <Card className="bg-accent/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{extrato.nomeArquivo}</p>
              <p className="text-xs text-muted-foreground">Formato: {extrato.formato} • {extrato.transacoes.length} transações</p>
            </div>
            <Badge variant="secondary" className="text-xs">{extrato.formato}</Badge>
          </div>
          {extrato.conta.banco && <Separator className="my-3" />}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {extrato.conta.banco && (
              <div><span className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />Banco</span><p className="font-medium mt-0.5">{extrato.conta.banco}</p></div>
            )}
            {extrato.conta.conta && (
              <div><span className="text-muted-foreground flex items-center gap-1"><Hash className="h-3 w-3" />Conta</span><p className="font-medium mt-0.5">{extrato.conta.conta}</p></div>
            )}
            {extrato.conta.dataInicio && (
              <div><span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Período</span><p className="font-medium mt-0.5">{formatDate(extrato.conta.dataInicio)} - {formatDate(extrato.conta.dataFim!)}</p></div>
            )}
            {extrato.conta.saldoFinal !== undefined && (
              <div><span className="text-muted-foreground">Saldo Final</span><p className="font-medium mt-0.5">{formatCurrency(extrato.conta.saldoFinal)}</p></div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {avisos.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Avisos</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                {avisos.map((aviso, i) => <li key={i}>• {aviso}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Transações ({selectedTransacoes.size} de {extrato.transacoes.length} selecionadas)</p>
          <Button variant="ghost" size="sm" onClick={onToggleAll}>
            {selectedTransacoes.size === extrato.transacoes.length ? 'Desmarcar todas' : 'Selecionar todas'}
          </Button>
        </div>
        <ScrollArea className="h-[300px] rounded-lg border">
          <div className="divide-y">
            {extrato.transacoes.map((transacao) => (
              <TransacaoPreviewItem key={transacao.id} transacao={transacao} selected={selectedTransacoes.has(transacao.id)} onToggle={() => onToggleTransacao(transacao.id)} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-success">
            <TrendingUp className="h-4 w-4" />
            <span>{formatCurrency(extrato.transacoes.filter(t => selectedTransacoes.has(t.id) && t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0))}</span>
          </div>
          <div className="flex items-center gap-1 text-destructive">
            <TrendingDown className="h-4 w-4" />
            <span>{formatCurrency(Math.abs(extrato.transacoes.filter(t => selectedTransacoes.has(t.id) && t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0)))}</span>
          </div>
        </div>
        <div className="font-medium">
          Líquido: {formatCurrency(extrato.transacoes.filter(t => selectedTransacoes.has(t.id)).reduce((sum, t) => sum + t.valor, 0))}
        </div>
      </div>
    </div>
  );
}

function TransacaoPreviewItem({ transacao, selected, onToggle }: { transacao: TransacaoOFX; selected: boolean; onToggle: () => void }) {
  const isCredito = transacao.tipo === 'credito';
  return (
    <div className={cn("flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-accent/30", selected ? "bg-accent/20" : "")} onClick={onToggle}>
      <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-all", selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
        {selected && <CheckCircle2 className="h-3 w-3" />}
      </div>
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
        {isCredito ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transacao.descricao}</p>
        <p className="text-xs text-muted-foreground">{formatDate(transacao.data)}{transacao.numeroReferencia && ` • Ref: ${transacao.numeroReferencia}`}</p>
      </div>
      <span className={cn("font-semibold text-sm tabular-nums", isCredito ? "text-success" : "text-destructive")}>
        {isCredito ? '+' : ''}{formatCurrency(transacao.valor)}
      </span>
    </div>
  );
}
