// ============================================
// DIALOG: Nova Cobrança ASAAS (com parcelas, juros, multa, desconto)
// ============================================

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Banknote, CreditCard, Loader2, UserPlus, Settings2 } from 'lucide-react';
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
  
  // Form state - cobrança
  const [tipo, setTipo] = useState<AsaasBillingType>('boleto');
  const [customerId, setCustomerId] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  
  // Parcelamento
  const [parcelas, setParcelas] = useState('');
  
  // Juros, Multa, Desconto
  const [juros, setJuros] = useState('');
  const [multa, setMulta] = useState('');
  const [descontoValor, setDescontoValor] = useState('');
  const [descontoDias, setDescontoDias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Cartão de crédito
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardCcv, setCardCcv] = useState('');
  const [cardEmail, setCardEmail] = useState('');
  const [cardCpfCnpj, setCardCpfCnpj] = useState('');
  const [cardCep, setCardCep] = useState('');
  const [cardPhone, setCardPhone] = useState('');
  
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
    setParcelas('');
    setJuros('');
    setMulta('');
    setDescontoValor('');
    setDescontoDias('');
    setShowAdvanced(false);
    setCardHolderName(''); setCardNumber(''); setCardExpiryMonth(''); setCardExpiryYear('');
    setCardCcv(''); setCardEmail(''); setCardCpfCnpj(''); setCardCep(''); setCardPhone('');
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

    const parcelasNum = parcelas && parcelas !== '1' ? parseInt(parcelas) : undefined;
    if (parcelasNum !== undefined && (parcelasNum < 2 || parcelasNum > 12)) {
      toast.error('Parcelas devem ser entre 2 e 12');
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
        parcelas: parcelasNum,
        valor_parcela: parcelasNum ? valorNum / parcelasNum : undefined,
        juros: juros ? parseFloat(juros) : undefined,
        multa: multa ? parseFloat(multa) : undefined,
        desconto_valor: descontoValor ? parseFloat(descontoValor) : undefined,
        desconto_dias: descontoDias ? parseInt(descontoDias) : undefined,
        desconto_tipo: descontoValor ? 'FIXED' : undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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
            {/* Tipo de cobrança */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'boleto' as const, label: 'Boleto', icon: Banknote },
                { value: 'pix' as const, label: 'Pix', icon: QrCode },
                { value: 'credit_card' as const, label: 'Cartão', icon: CreditCard },
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

            {/* Valor, Vencimento e Parcelas */}
            <div className="grid grid-cols-3 gap-3">
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
              <div className="space-y-2">
                <Label>Parcelas</Label>
                <Select value={parcelas} onValueChange={setParcelas}>
                  <SelectTrigger>
                    <SelectValue placeholder="À vista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">À vista</SelectItem>
                    {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Configurações avançadas */}
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                {showAdvanced ? 'Ocultar' : 'Mostrar'} configurações avançadas
              </Button>
              {showAdvanced && (
                <div className="mt-3 space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Juros ao mês (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={juros}
                        onChange={e => setJuros(e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Multa por atraso (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="2"
                        value={multa}
                        onChange={e => setMulta(e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Desconto (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={descontoValor}
                        onChange={e => setDescontoValor(e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dias para desconto</Label>
                      <Input
                        type="number"
                        min="0"
                        value={descontoDias}
                        onChange={e => setDescontoDias(e.target.value)}
                        placeholder="0"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleCriarCobranca}
              disabled={criarCobranca.isPending || !customerId || !valor || !vencimento}
            >
              {criarCobranca.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Emitindo...</>
              ) : (
                <>Emitir Cobrança{parcelas && parseInt(parcelas) > 1 ? ` (${parcelas}x)` : ''}</>
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
