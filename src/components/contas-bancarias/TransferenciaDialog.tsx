import { useState } from 'react';
import { ArrowRight, DollarSign, Loader2, Send, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useContasBancarias, ContaBancaria } from '@/hooks/useFinancialData';
import { useFinancialOperations } from '@/hooks/useFinancialOperations';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

interface TransferenciaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferenciaDialog({ open, onOpenChange }: TransferenciaDialogProps) {
  const { data: contas = [] } = useContasBancarias();
  const { useCreateTransferencia } = useFinancialOperations();
  const createTransferencia = useCreateTransferencia();
  
  const [contaOrigem, setContaOrigem] = useState('');
  const [contaDestino, setContaDestino] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');

  const contasAtivas = contas.filter(c => c.ativo);
  const origem = contasAtivas.find(c => c.id === contaOrigem);
  const destino = contasAtivas.find(c => c.id === contaDestino);
  const valorNum = parseFloat(valor) || 0;

  const handleSubmit = () => {
    if (!contaOrigem || !contaDestino) {
      toast.error('Selecione as contas de origem e destino');
      return;
    }
    if (contaOrigem === contaDestino) {
      toast.error('Contas de origem e destino devem ser diferentes');
      return;
    }
    if (valorNum <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (origem && valorNum > origem.saldo_atual) {
      toast.error('Saldo insuficiente na conta de origem');
      return;
    }

    createTransferencia.mutate(
      {
        conta_bancaria_id: contaOrigem,
        conta_destino_id: contaDestino,
        valor: valorNum,
        descricao: descricao || `Transferência entre contas`,
      },
      {
        onSuccess: () => {
          toast.success('Transferência realizada com sucesso!');
          onOpenChange(false);
          setContaOrigem('');
          setContaDestino('');
          setValor('');
          setDescricao('');
        },
        onError: (err: Error) => toast.error(err.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Transferência entre Contas
          </DialogTitle>
          <DialogDescription>Transfira valores entre suas contas bancárias</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Conta Origem */}
          <div>
            <Label>Conta de Origem</Label>
            <Select value={contaOrigem} onValueChange={setContaOrigem}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {contasAtivas.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      <span>{c.banco} — {c.conta}</span>
                      <Badge variant="outline" className="text-xs">{formatCurrency(c.saldo_atual)}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="h-5 w-5 text-primary animate-pulse" />
          </div>

          {/* Conta Destino */}
          <div>
            <Label>Conta de Destino</Label>
            <Select value={contaDestino} onValueChange={setContaDestino}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {contasAtivas.filter(c => c.id !== contaOrigem).map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3" />
                      <span>{c.banco} — {c.conta}</span>
                      <Badge variant="outline" className="text-xs">{formatCurrency(c.saldo_atual)}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Valor */}
          <div>
            <Label>Valor (R$)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.01"
                value={valor}
                onChange={e => setValor(e.target.value)}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
            {origem && valorNum > origem.saldo_atual && (
              <p className="text-xs text-destructive mt-1">Saldo insuficiente. Disponível: {formatCurrency(origem.saldo_atual)}</p>
            )}
          </div>

          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Motivo da transferência..." rows={2} />
          </div>

          {/* Preview */}
          {contaOrigem && contaDestino && valorNum > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <p className="font-medium text-primary mb-1">Resumo da Transferência</p>
              <p><span className="text-muted-foreground">De:</span> {origem?.banco} ({origem?.conta})</p>
              <p><span className="text-muted-foreground">Para:</span> {destino?.banco} ({destino?.conta})</p>
              <p className="font-bold mt-1">Valor: {formatCurrency(valorNum)}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createTransferencia.isPending} className="gap-2">
              {createTransferencia.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Transferir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
