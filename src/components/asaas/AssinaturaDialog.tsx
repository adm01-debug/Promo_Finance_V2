// ============================================
// DIALOG: Nova Assinatura (Recorrência) ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
}

const ciclos = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export function AssinaturaDialog({ open, onOpenChange, empresaId }: Props) {
  const { customers, criarAssinatura } = useAsaas(empresaId);

  const [customerId, setCustomerId] = useState('');
  const [valor, setValor] = useState('');
  const [ciclo, setCiclo] = useState('mensal');
  const [tipo, setTipo] = useState('boleto');
  const [proximoVencimento, setProximoVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [maxParcelas, setMaxParcelas] = useState('');

  const handleCriar = async () => {
    const valorNum = parseFloat(valor);
    if (!customerId || isNaN(valorNum) || valorNum <= 0 || !proximoVencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await criarAssinatura.mutateAsync({
        asaas_customer_id: customerId,
        valor: valorNum,
        ciclo,
        tipo,
        proximo_vencimento: proximoVencimento,
        descricao: descricao || undefined,
        max_parcelas: maxParcelas ? parseInt(maxParcelas) : undefined,
      });
      setCustomerId(''); setValor(''); setDescricao(''); setMaxParcelas('');
      onOpenChange(false);
    } catch { /* hook handles */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Nova Assinatura
          </DialogTitle>
          <DialogDescription>Crie uma cobrança recorrente automática</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {customers.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border border-border rounded-lg text-center">
                Nenhum cliente cadastrado. Cadastre um cliente na aba de Cobranças primeiro.
              </div>
            ) : (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.asaas_id}>
                      {c.nome} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="99.90" />
            </div>
            <div className="space-y-2">
              <Label>Ciclo *</Label>
              <Select value={ciclo} onValueChange={setCiclo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ciclos.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Próximo Vencimento *</Label>
              <Input type="date" value={proximoVencimento} onChange={e => setProximoVencimento(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Máximo de parcelas</Label>
              <Input type="number" min="1" value={maxParcelas} onChange={e => setMaxParcelas(e.target.value)} placeholder="Ilimitado" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Mensalidade..." rows={1} />
            </div>
          </div>

          <Button className="w-full" onClick={handleCriar} disabled={criarAssinatura.isPending || !customerId || !valor || !proximoVencimento}>
            {criarAssinatura.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
            ) : (
              <>Criar Assinatura</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
