// ============================================
// DIALOG: Nova Cobrança ASAAS
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Banknote, Loader2, UserPlus } from 'lucide-react';
import { useAsaas, type AsaasBillingType } from '@/hooks/useAsaas';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaId?: string;
}

export function NovaCobrancaDialog({ open, onOpenChange, empresaId }: Props) {
  const { customers, criarCliente, criarCobranca } = useAsaas(empresaId);
  
  const [tab, setTab] = useState<'cobranca' | 'cliente'>('cobranca');
  
  // Form state - cobrança (apenas boleto e pix, cartão requer dados sensíveis)
  const [tipo, setTipo] = useState<AsaasBillingType>('boleto');
  const [customerId, setCustomerId] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Form state - novo cliente
  const [nomeCliente, setNomeCliente] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [emailCliente, setEmailCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');

  const resetForm = () => {
    setTipo('boleto');
    setCustomerId('');
    setValor('');
    setVencimento('');
    setDescricao('');
    setNomeCliente('');
    setCpfCnpj('');
    setEmailCliente('');
    setTelefoneCliente('');
  };

  const handleCriarCliente = async () => {
    if (!empresaId || !nomeCliente || !cpfCnpj) {
      toast.error('Preencha nome e CPF/CNPJ');
      return;
    }

    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    if (cleanCpfCnpj.length !== 11 && cleanCpfCnpj.length !== 14) {
      toast.error('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
      return;
    }

    try {
      await criarCliente.mutateAsync({
        empresa_id: empresaId,
        nome: nomeCliente,
        cpf_cnpj: cleanCpfCnpj,
        email: emailCliente || undefined,
        telefone: telefoneCliente || undefined,
      });
      setTab('cobranca');
      setNomeCliente('');
      setCpfCnpj('');
      setEmailCliente('');
      setTelefoneCliente('');
    } catch {
      // handled by hook
    }
  };

  const handleCriarCobranca = async () => {
    if (!empresaId || !customerId || !valor || !vencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(vencimento + 'T00:00:00');
    if (dueDate < today) {
      toast.error('Data de vencimento não pode ser no passado');
      return;
    }

    try {
      await criarCobranca.mutateAsync({
        empresa_id: empresaId,
        asaas_customer_id: customerId,
        tipo,
        valor: valorNum,
        data_vencimento: vencimento,
        descricao: descricao || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Nova Cobrança ASAAS</DialogTitle>
          <DialogDescription>Emita uma cobrança real por Boleto ou Pix</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'cobranca' | 'cliente')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
            <TabsTrigger value="cliente">
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Novo Cliente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cobranca" className="space-y-4 mt-4">
            {/* Tipo de cobrança - apenas boleto e pix */}
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'boleto' as const, label: 'Boleto', icon: Banknote },
                { value: 'pix' as const, label: 'Pix', icon: QrCode },
              ]).map(opt => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={tipo === opt.value ? 'default' : 'outline'}
                  className="flex flex-col gap-1 h-auto py-3"
                  onClick={() => setTipo(opt.value)}
                >
                  <opt.icon className="h-5 w-5" />
                  <span className="text-xs">{opt.label}</span>
                </Button>
              ))}
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente ASAAS *</Label>
              {customers.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border border-border rounded-lg text-center">
                  Nenhum cliente cadastrado.{' '}
                  <button className="text-primary underline" onClick={() => setTab('cliente')}>
                    Cadastre um cliente primeiro
                  </button>
                </div>
              ) : (
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
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

            {/* Valor e Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  placeholder="100.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento *</Label>
                <Input
                  type="date"
                  value={vencimento}
                  onChange={e => setVencimento(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descrição da cobrança..."
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCriarCobranca}
              disabled={criarCobranca.isPending || !customerId || !valor || !vencimento}
            >
              {criarCobranca.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Emitindo...</>
              ) : (
                <>Emitir Cobrança</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="cliente" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Nome completo ou razão social" />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ *</Label>
              <Input value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={telefoneCliente} onChange={e => setTelefoneCliente(e.target.value)} placeholder="(11) 99999-0000" />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleCriarCliente}
              disabled={criarCliente.isPending || !nomeCliente || !cpfCnpj}
            >
              {criarCliente.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cadastrando...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Cadastrar Cliente</>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
