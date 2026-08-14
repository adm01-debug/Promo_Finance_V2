import { todayISOLocal } from '@/lib/formatters';
// DIALOG: Nova Cobrança ASAAS (com parcelas, juros, multa, desconto)

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Banknote, CreditCard, Loader2, UserPlus } from 'lucide-react';
import { useAsaas, type AsaasBillingType } from '@/hooks/useAsaas';
import { toast } from 'sonner';
import { CobrancaCardForm } from './CobrancaCardForm';
import { NovoClienteAsaasForm } from './NovoClienteAsaasForm';
import { ConfiguracoesAvancadas, SplitCobrancaConfig } from './NovaCobrancaSections';

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
  const [contaReceberId, setContaReceberId] = useState('');
  
  // Parcelamento
  const [parcelas, setParcelas] = useState('');
  
  // Juros, Multa, Desconto
  const [juros, setJuros] = useState('');
  const [multa, setMulta] = useState('');
  const [descontoValor, setDescontoValor] = useState('');
  const [descontoDias, setDescontoDias] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [splitWalletId, setSplitWalletId] = useState('');
  const [splitPercent, setSplitPercent] = useState('');
  
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

  // Fetch pending receivables to link
  const { data: pendencias } = useQuery({
    queryKey: ['contas-receber-pendentes', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('contas_receber')
        .select('id, descricao, valor, data_vencimento')
        .eq('empresa_id', empresaId)
        .eq('status', 'pendente')
        .order('data_vencimento', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId && open
  });

  const handleSelectPendencia = (id: string) => {
    const pendencia = pendencias?.find(p => p.id === id);
    if (pendencia) {
      setContaReceberId(id);
      setValor(String(pendencia.valor));
      setVencimento(pendencia.data_vencimento);
      setDescricao(pendencia.descricao || '');
    } else {
      setContaReceberId('');
    }
  };

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

    if (tipo === 'credit_card') {
      if (!cardHolderName || !cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCcv || !cardEmail || !cardCpfCnpj) {
        toast.error('Preencha todos os dados do cartão de crédito');
        return;
      }
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
        split: showSplit && splitWalletId && splitPercent ? [{
          walletId: splitWalletId,
          percentualValue: parseFloat(splitPercent)
        }] : undefined,
        ...(tipo === 'credit_card' ? {
          cartao: {
            holder_name: cardHolderName,
            number: cardNumber.replace(/\s/g, ''),
            expiry_month: cardExpiryMonth,
            expiry_year: cardExpiryYear,
            ccv: cardCcv,
          },
          email: cardEmail,
          cpf_cnpj: cardCpfCnpj.replace(/\D/g, ''),
          cep: cardCep.replace(/\D/g, ''),
          telefone: cardPhone,
        } : {}),
        conta_receber_id: contaReceberId || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Cobrança ASAAS</DialogTitle>
          <DialogDescription>Emita uma cobrança real por Boleto, Pix ou Cartão de Crédito</DialogDescription>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Vincular Conta a Receber</Label>
                <Select value={contaReceberId} onValueChange={handleSelectPendencia}>
                  <SelectTrigger>
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (Lançamento avulso)</SelectItem>
                    {pendencias?.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.descricao} (R$ {p.valor})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cliente ASAAS *</Label>
                {customers.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2 border rounded-md text-center h-10 flex items-center justify-center">
                    <button className="text-primary underline" onClick={() => setTab('cliente')}>Cadastrar</button>
                  </div>
                ) : (
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.asaas_id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
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
                  min={todayISOLocal()}
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

            {/* Dados do Cartão de Crédito */}
            {tipo === 'credit_card' && (
              <CobrancaCardForm
                cardHolderName={cardHolderName} setCardHolderName={setCardHolderName}
                cardNumber={cardNumber} setCardNumber={setCardNumber}
                cardExpiryMonth={cardExpiryMonth} setCardExpiryMonth={setCardExpiryMonth}
                cardExpiryYear={cardExpiryYear} setCardExpiryYear={setCardExpiryYear}
                cardCcv={cardCcv} setCardCcv={setCardCcv}
                cardEmail={cardEmail} setCardEmail={setCardEmail}
                cardCpfCnpj={cardCpfCnpj} setCardCpfCnpj={setCardCpfCnpj}
                cardCep={cardCep} setCardCep={setCardCep}
                cardPhone={cardPhone} setCardPhone={setCardPhone}
              />
            )}

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
            <ConfiguracoesAvancadas
              showAdvanced={showAdvanced} setShowAdvanced={setShowAdvanced}
              juros={juros} setJuros={setJuros}
              multa={multa} setMulta={setMulta}
              descontoValor={descontoValor} setDescontoValor={setDescontoValor}
              descontoDias={descontoDias} setDescontoDias={setDescontoDias}
            />

            {/* Split Settings */}
            <SplitCobrancaConfig
              showSplit={showSplit} setShowSplit={setShowSplit}
              splitWalletId={splitWalletId} setSplitWalletId={setSplitWalletId}
              splitPercent={splitPercent} setSplitPercent={setSplitPercent}
            />

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

          <TabsContent value="cliente">
            <NovoClienteAsaasForm
              nomeCliente={nomeCliente} setNomeCliente={setNomeCliente}
              cpfCnpj={cpfCnpj} setCpfCnpj={setCpfCnpj}
              emailCliente={emailCliente} setEmailCliente={setEmailCliente}
              telefoneCliente={telefoneCliente} setTelefoneCliente={setTelefoneCliente}
              isPending={criarCliente.isPending}
              onCreate={handleCriarCliente}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
