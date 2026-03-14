import { useState, useMemo } from 'react';
import { SplitSquareHorizontal, Plus, Trash2, Search, Calendar } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { LancamentoSistema } from '@/lib/transaction-matcher';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface SplitItem {
  lancamentoId: string;
  lancamento: LancamentoSistema;
  valorParcial: number;
}

interface ConciliacaoSplitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoExtrato | null;
  lancamentos: LancamentoSistema[];
  onSuccess: () => void;
}

export function ConciliacaoSplitDialog({
  open, onOpenChange, transacao, lancamentos, onSuccess,
}: ConciliacaoSplitDialogProps) {
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const tipoFiltro = transacao?.tipo === 'credito' ? 'receber' : 'pagar';

  const lancamentosFiltrados = useMemo(() => {
    if (!transacao) return [];
    const usedIds = new Set(splits.map(s => s.lancamentoId));
    return lancamentos
      .filter(l => l.tipo === tipoFiltro && !usedIds.has(l.id))
      .filter(l => {
        if (!search) return true;
        const s = search.toLowerCase();
        return l.descricao.toLowerCase().includes(s) || l.entidade.toLowerCase().includes(s);
      })
      .slice(0, 20);
  }, [lancamentos, transacao, search, splits, tipoFiltro]);

  const totalSplit = splits.reduce((sum, s) => sum + s.valorParcial, 0);
  const valorRestante = (transacao?.valor || 0) - totalSplit;

  const addSplit = (lancamento: LancamentoSistema) => {
    const valorSugerido = Math.min(lancamento.valor, valorRestante);
    setSplits(prev => [...prev, {
      lancamentoId: lancamento.id,
      lancamento,
      valorParcial: Math.max(0, valorSugerido),
    }]);
  };

  const removeSplit = (index: number) => {
    setSplits(prev => prev.filter((_, i) => i !== index));
  };

  const updateValor = (index: number, valor: number) => {
    setSplits(prev => prev.map((s, i) => i === index ? { ...s, valorParcial: valor } : s));
  };

  const handleConfirmar = async () => {
    if (!transacao || splits.length === 0) return;
    if (Math.abs(totalSplit - transacao.valor) > 0.01) {
      toast.error('A soma dos valores parciais deve ser igual ao valor da transação');
      return;
    }

    setIsLoading(true);
    try {
      // Insert partial reconciliation records
      const records = splits.map(s => ({
        transacao_bancaria_id: transacao.id,
        conta_pagar_id: s.lancamento.tipo === 'pagar' ? s.lancamentoId : null,
        conta_receber_id: s.lancamento.tipo === 'receber' ? s.lancamentoId : null,
        valor_parcial: s.valorParcial,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      }));

      const { error: insertError } = await supabase
        .from('conciliacoes_parciais')
        .insert(records);

      if (insertError) throw insertError;

      // Mark transaction as partially reconciled
      const { error: updateError } = await supabase
        .from('transacoes_bancarias')
        .update({
          conciliada: true,
          conciliacao_parcial: true,
          valor_conciliado: totalSplit,
          conciliada_em: new Date().toISOString(),
        })
        .eq('id', transacao.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['transacoes-bancarias'] });
      toast.success(`Conciliação parcial: ${splits.length} lançamentos vinculados`);
      onSuccess();
      onOpenChange(false);
      setSplits([]);
      setSearch('');
    } catch (error) {
      toast.error('Erro ao salvar conciliação parcial');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitSquareHorizontal className="h-5 w-5 text-primary" />
            Conciliação Parcial (Split)
          </DialogTitle>
          <DialogDescription>
            Vincule uma transação a múltiplos lançamentos dividindo o valor
          </DialogDescription>
        </DialogHeader>

        {transacao && (
          <div className="space-y-4">
            {/* Transaction info */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{transacao.descricao}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" /> {formatDate(transacao.data)}
                  </p>
                </div>
                <p className={cn("text-lg font-bold", transacao.tipo === 'credito' ? "text-success" : "text-destructive")}>
                  {formatCurrency(transacao.valor)}
                </p>
              </div>
            </div>

            {/* Current splits */}
            {splits.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Lançamentos vinculados:</p>
                {splits.map((split, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-primary/5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{split.lancamento.descricao}</p>
                      <p className="text-xs text-muted-foreground">{split.lancamento.entidade}</p>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={split.valorParcial}
                      onChange={(e) => updateValor(i, parseFloat(e.target.value) || 0)}
                      className="w-32 text-right"
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeSplit(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between items-center p-2 text-sm">
                  <span className="text-muted-foreground">Total alocado:</span>
                  <span className={cn("font-bold", Math.abs(valorRestante) < 0.01 ? "text-success" : "text-warning")}>
                    {formatCurrency(totalSplit)} / {formatCurrency(transacao.valor)}
                  </span>
                </div>
                {Math.abs(valorRestante) > 0.01 && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    Restante: {formatCurrency(valorRestante)}
                  </Badge>
                )}
              </div>
            )}

            {/* Search and add */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lançamento para adicionar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[200px] rounded-md border">
              <div className="p-2 space-y-1">
                {lancamentosFiltrados.map(l => (
                  <button
                    key={l.id}
                    onClick={() => addSplit(l)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{l.descricao}</p>
                      <p className="text-xs text-muted-foreground">{l.entidade} · {formatDate(l.dataVencimento)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatCurrency(l.valor)}</span>
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                  </button>
                ))}
                {lancamentosFiltrados.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 text-sm">Nenhum lançamento disponível</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmar}
            disabled={splits.length === 0 || Math.abs(valorRestante) > 0.01 || isLoading}
          >
            {isLoading ? 'Salvando...' : `Confirmar Split (${splits.length} itens)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
