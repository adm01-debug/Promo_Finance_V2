import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Empresa { id: string; nome_fantasia?: string | null; razao_social: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresas: Empresa[];
  bancos: string[];
}

export function NovaContaDialog({ open, onOpenChange, empresas, bancos }: Props) {
  const queryClient = useQueryClient();
  const [empresaId, setEmpresaId] = useState('');
  const [banco, setBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [tipo, setTipo] = useState('corrente');
  const [saldo, setSaldo] = useState('0');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!empresaId || !banco || !conta) {
      toast.error('Preencha os campos obrigatórios (Empresa, Banco, Conta)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('contas_bancarias').insert({
        empresa_id: empresaId,
        banco,
        agencia,
        conta,
        tipo,
        saldo_inicial: parseFloat(saldo) || 0,
        saldo_atual: parseFloat(saldo) || 0
      });

      if (error) throw error;
      toast.success('Conta bancária adicionada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias'] });
      onOpenChange(false);
      // Reset form
      setEmpresaId('');
      setBanco('');
      setAgencia('');
      setConta('');
      setSaldo('0');
    } catch (err: any) {
      toast.error('Erro ao adicionar conta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Conta Bancária</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Empresa (Tenant CNPJ)</Label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger>
              <SelectContent>
                {empresas.map(empresa => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nome_fantasia || empresa.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Banco</Label>
            <Select value={banco} onValueChange={setBanco}>
              <SelectTrigger><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
              <SelectContent>
                {bancos.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Agência</Label>
              <Input placeholder="0000" value={agencia} onChange={(e) => setAgencia(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Conta</Label>
              <Input placeholder="00000-0" value={conta} onChange={(e) => setConta(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tipo de Conta</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="corrente">Conta Corrente</SelectItem>
                <SelectItem value="poupanca">Poupança</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Saldo Inicial</Label>
            <Input type="number" placeholder="0,00" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
          </div>
          <Button className="w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adicionando...' : 'Adicionar Conta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}