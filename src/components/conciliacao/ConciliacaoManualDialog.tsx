import { useState, useMemo } from 'react';
import { Search, Link2, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useConciliacao } from '@/hooks/useConciliacao';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';
import { LancamentoSistema } from '@/lib/transaction-matcher';

interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
}

interface ConciliacaoManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoExtrato | null;
  lancamentos: LancamentoSistema[];
  onSuccess: (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => void;
}

export function ConciliacaoManualDialog({
  open,
  onOpenChange,
  transacao,
  lancamentos,
  onSuccess,
}: ConciliacaoManualDialogProps) {
  const [search, setSearch] = useState('');
  const [selectedLancamento, setSelectedLancamento] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { confirmarConciliacao } = useConciliacao();
  const { celebrateReconciliation, error: showError } = useCelebrations();

  // Filter lancamentos by type matching transaction type
  const lancamentosFiltrados = useMemo(() => {
    if (!transacao) return [];
    
    // credito = receita (receber), debito = despesa (pagar)
    const tipoFiltro = transacao.tipo === 'credito' ? 'receber' : 'pagar';
    
    return lancamentos
      .filter(l => l.tipo === tipoFiltro)
      .filter(l => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
          l.descricao.toLowerCase().includes(searchLower) ||
          l.entidade.toLowerCase().includes(searchLower) ||
          l.valor.toString().includes(search)
        );
      })
      .sort((a, b) => {
        // Sort by value similarity first
        if (transacao) {
          const diffA = Math.abs(a.valor - transacao.valor);
          const diffB = Math.abs(b.valor - transacao.valor);
          return diffA - diffB;
        }
        return 0;
      });
  }, [lancamentos, transacao, search]);

  const handleConfirmar = async () => {
    if (!transacao || !selectedLancamento) return;
    
    const lancamento = lancamentos.find(l => l.id === selectedLancamento);
    if (!lancamento) return;

    setIsLoading(true);
    try {
      const tipo = lancamento.tipo;
      
      await confirmarConciliacao.mutateAsync({
        transacaoId: transacao.id,
        contaPagarId: tipo === 'pagar' ? lancamento.id : undefined,
        contaReceberId: tipo === 'receber' ? lancamento.id : undefined,
      });
      
      celebrateReconciliation(1);
      onSuccess(transacao.id, lancamento.id, tipo);
      onOpenChange(false);
      setSelectedLancamento(null);
      setSearch('');
    } catch (error) {
      showError('Erro ao conciliar transação');
      console.error('Erro ao conciliar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDetails = lancamentos.find(l => l.id === selectedLancamento);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Conciliação Manual
          </DialogTitle>
          <DialogDescription>
            Selecione um lançamento do sistema para vincular à transação bancária
          </DialogDescription>
        </DialogHeader>

        {transacao && (
          <div className="space-y-4">
            {/* Transação selecionada */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Transação do Extrato</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{transacao.descricao}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transacao.data)}
                  </div>
                </div>
                <p className={cn(
                  "text-lg font-bold",
                  transacao.tipo === 'credito' ? "text-success" : "text-destructive"
                )}>
                  {transacao.tipo === 'credito' ? '+' : '-'}{formatCurrency(transacao.valor)}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar lançamento por descrição, entidade ou valor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lancamentos list */}
            <ScrollArea className="h-[300px] rounded-md border">
              <RadioGroup
                value={selectedLancamento || ''}
                onValueChange={setSelectedLancamento}
                className="p-2 space-y-2"
              >
                {lancamentosFiltrados.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhum lançamento encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros de busca</p>
                  </div>
                ) : (
                  lancamentosFiltrados.map((lancamento) => {
                    const valorDiff = transacao ? Math.abs(lancamento.valor - transacao.valor) : 0;
                    const isExactMatch = valorDiff === 0;
                    const isCloseMatch = valorDiff < transacao.valor * 0.05;

                    return (
                      <Label
                        key={lancamento.id}
                        htmlFor={lancamento.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedLancamento === lancamento.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <RadioGroupItem value={lancamento.id} id={lancamento.id} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{lancamento.descricao}</p>
                            {isExactMatch && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                                Valor exato
                              </Badge>
                            )}
                            {!isExactMatch && isCloseMatch && (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                                ~{formatCurrency(valorDiff)}
                              </Badge>
                            )}
                          </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{lancamento.entidade}</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lancamento.dataVencimento)}
                              </span>
                            </div>
                          </div>
                          <p className={cn(
                            "font-semibold",
                            lancamento.tipo === 'receber' ? "text-success" : "text-destructive"
                          )}>
                            {formatCurrency(lancamento.valor)}
                          </p>
                        </Label>
                      );
                  })
                )}
              </RadioGroup>
            </ScrollArea>

            {/* Selection summary */}
            {selectedDetails && transacao && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Extrato:</span>
                    <span className="font-medium">{formatCurrency(transacao.valor)}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Sistema:</span>
                    <span className="font-medium">{formatCurrency(selectedDetails.valor)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={!selectedLancamento || isLoading}
          >
            {isLoading ? 'Conciliando...' : 'Confirmar Conciliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
