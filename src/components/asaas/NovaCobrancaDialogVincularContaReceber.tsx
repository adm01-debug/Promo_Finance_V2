import { todayISOLocal } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TabsContent } from '@/components/ui/tabs';
import { QrCode, Banknote, CreditCard, Loader2 } from 'lucide-react';
import type { AsaasBillingType } from '@/hooks/useAsaas.types';
import { CobrancaCardForm } from './CobrancaCardForm';
import { ConfiguracoesAvancadas, SplitCobrancaConfig } from './NovaCobrancaSections';

interface NovaCobrancaDialogVincularContaReceberProps {
  tipo: AsaasBillingType;
  setTipo: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<AsaasBillingType>
  >;
  contaReceberId: string;
  handleSelectPendencia: (id: string) => void;
  pendencias: { id: string; descricao: string; valor: number; data_vencimento: string }[];
  customers: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useAsaas.types').AsaasCustomer[];
  setTab: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      'cliente' | 'cobranca'
    >
  >;
  customerId: string;
  setCustomerId: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  valor: string;
  setValor: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  vencimento: string;
  setVencimento: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  parcelas: string;
  setParcelas: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardHolderName: string;
  setCardHolderName: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardNumber: string;
  setCardNumber: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardExpiryMonth: string;
  setCardExpiryMonth: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardExpiryYear: string;
  setCardExpiryYear: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardCcv: string;
  setCardCcv: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardEmail: string;
  setCardEmail: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardCpfCnpj: string;
  setCardCpfCnpj: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardCep: string;
  setCardCep: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  cardPhone: string;
  setCardPhone: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  descricao: string;
  setDescricao: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  showAdvanced: boolean;
  setShowAdvanced: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  juros: string;
  setJuros: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  multa: string;
  setMulta: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  descontoValor: string;
  setDescontoValor: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  descontoDias: string;
  setDescontoDias: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  showSplit: boolean;
  setShowSplit: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  splitWalletId: string;
  setSplitWalletId: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  splitPercent: string;
  setSplitPercent: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  handleCriarCobranca: () => Promise<void>;
  criarCobranca: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@tanstack/react-query/build/modern/types').UseMutationResult<
    unknown,
    Error,
    Record<string, unknown>,
    unknown
  >;
}

export function NovaCobrancaDialogVincularContaReceber({
  tipo,
  setTipo,
  contaReceberId,
  handleSelectPendencia,
  pendencias,
  customers,
  setTab,
  customerId,
  setCustomerId,
  valor,
  setValor,
  vencimento,
  setVencimento,
  parcelas,
  setParcelas,
  cardHolderName,
  setCardHolderName,
  cardNumber,
  setCardNumber,
  cardExpiryMonth,
  setCardExpiryMonth,
  cardExpiryYear,
  setCardExpiryYear,
  cardCcv,
  setCardCcv,
  cardEmail,
  setCardEmail,
  cardCpfCnpj,
  setCardCpfCnpj,
  cardCep,
  setCardCep,
  cardPhone,
  setCardPhone,
  descricao,
  setDescricao,
  showAdvanced,
  setShowAdvanced,
  juros,
  setJuros,
  multa,
  setMulta,
  descontoValor,
  setDescontoValor,
  descontoDias,
  setDescontoDias,
  showSplit,
  setShowSplit,
  splitWalletId,
  setSplitWalletId,
  splitPercent,
  setSplitPercent,
  handleCriarCobranca,
  criarCobranca,
}: NovaCobrancaDialogVincularContaReceberProps) {
  return (
    <TabsContent value="cobranca" className="space-y-4 mt-4">
      {/* Tipo de cobrança */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: 'boleto' as const, label: 'Boleto', icon: Banknote },
          { value: 'pix' as const, label: 'Pix', icon: QrCode },
          { value: 'credit_card' as const, label: 'Cartão', icon: CreditCard },
        ].map((opt) => (
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
              {pendencias?.map((p) => (
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
              <button className="text-primary underline" onClick={() => setTab('cliente')}>
                Cadastrar
              </button>
            </div>
          ) : (
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
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
            onChange={(e) => setValor(e.target.value)}
            placeholder="100.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Vencimento *</Label>
          <Input
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
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
              {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dados do Cartão de Crédito */}
      {tipo === 'credit_card' && (
        <CobrancaCardForm
          cardHolderName={cardHolderName}
          setCardHolderName={setCardHolderName}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExpiryMonth={cardExpiryMonth}
          setCardExpiryMonth={setCardExpiryMonth}
          cardExpiryYear={cardExpiryYear}
          setCardExpiryYear={setCardExpiryYear}
          cardCcv={cardCcv}
          setCardCcv={setCardCcv}
          cardEmail={cardEmail}
          setCardEmail={setCardEmail}
          cardCpfCnpj={cardCpfCnpj}
          setCardCpfCnpj={setCardCpfCnpj}
          cardCep={cardCep}
          setCardCep={setCardCep}
          cardPhone={cardPhone}
          setCardPhone={setCardPhone}
        />
      )}

      {/* Descrição */}
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descrição da cobrança..."
          rows={2}
        />
      </div>

      {/* Configurações avançadas */}
      <ConfiguracoesAvancadas
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        juros={juros}
        setJuros={setJuros}
        multa={multa}
        setMulta={setMulta}
        descontoValor={descontoValor}
        setDescontoValor={setDescontoValor}
        descontoDias={descontoDias}
        setDescontoDias={setDescontoDias}
      />

      {/* Split Settings */}
      <SplitCobrancaConfig
        showSplit={showSplit}
        setShowSplit={setShowSplit}
        splitWalletId={splitWalletId}
        setSplitWalletId={setSplitWalletId}
        splitPercent={splitPercent}
        setSplitPercent={setSplitPercent}
      />

      <Button
        className="w-full"
        onClick={handleCriarCobranca}
        disabled={criarCobranca.isPending || !customerId || !valor || !vencimento}
      >
        {criarCobranca.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Emitindo...
          </>
        ) : (
          <>Emitir Cobrança{parcelas && parseInt(parcelas) > 1 ? ` (${parcelas}x)` : ''}</>
        )}
      </Button>
    </TabsContent>
  );
}
