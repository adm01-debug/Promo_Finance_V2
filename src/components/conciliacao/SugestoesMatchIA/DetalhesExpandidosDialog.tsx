import { Brain, Sparkles, FileText, Calendar, User, DollarSign, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TransacaoOFX } from '@/lib/ofx-parser';
import { MatchSugestaoIA } from '@/hooks/useConciliacaoIA';
import { ScoreBadgeIA } from './ScoreBadgeIA';

interface DetalhesExpandidosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoOFX | null;
  sugestao: MatchSugestaoIA | null;
}

export function DetalhesExpandidosDialog({ open, onOpenChange, transacao, sugestao }: DetalhesExpandidosDialogProps) {
  if (!transacao || !sugestao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Detalhes do Match IA
          </DialogTitle>
          <DialogDescription>Análise detalhada da correspondência sugerida</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Transação do Extrato
            </h4>
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="font-medium">{transacao.descricao}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(transacao.data)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className={cn("font-bold flex items-center gap-1", transacao.tipo === 'credito' ? "text-success" : "text-destructive")}>
                    <DollarSign className="h-3 w-3" />{formatCurrency(transacao.valor)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant={transacao.tipo === 'credito' ? 'default' : 'destructive'}>{transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Lançamento Sugerido
            </h4>
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">Entidade</p>
                <p className="font-medium flex items-center gap-1"><User className="h-3 w-3" />{sugestao.lancamento?.entidade}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="text-sm">{sugestao.lancamento?.descricao || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{sugestao.lancamento?.dataVencimento ? formatDate(sugestao.lancamento.dataVencimento) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(sugestao.lancamento?.valor || 0)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant={sugestao.lancamentoTipo === 'receber' ? 'default' : 'secondary'}>{sugestao.lancamentoTipo === 'receber' ? 'A Receber' : 'A Pagar'}</Badge>
              </div>
              {sugestao.lancamento?.numeroDocumento && (
                <div>
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="text-sm font-mono">{sugestao.lancamento.numeroDocumento}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Análise da IA</h4>
            <ScoreBadgeIA score={sugestao.score} confianca={sugestao.confianca} />
          </div>
          {sugestao.analiseIA && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm flex items-start gap-2"><Sparkles className="h-4 w-4 mt-0.5 text-accent" />{sugestao.analiseIA}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {sugestao.motivos.map((motivo, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
                <span className="text-sm">
                  {motivo.tipo === 'valor_exato' && '💰 Valor exato'}
                  {motivo.tipo === 'valor_proximo' && '≈ Valor próximo'}
                  {motivo.tipo === 'nome_exato' && '✓ Nome exato'}
                  {motivo.tipo === 'nome_parcial' && '○ Nome similar'}
                  {motivo.tipo === 'data_proxima' && '📅 Data próxima'}
                  {motivo.tipo === 'documento' && '📄 Documento'}
                  {motivo.tipo === 'tipo_compativel' && '🔄 Tipo OK'}
                </span>
                <Badge variant="outline" className="text-xs">+{motivo.peso}%</Badge>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
