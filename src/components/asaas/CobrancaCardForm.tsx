import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

interface Props {
  cardHolderName: string; setCardHolderName: (v: string) => void;
  cardNumber: string; setCardNumber: (v: string) => void;
  cardExpiryMonth: string; setCardExpiryMonth: (v: string) => void;
  cardExpiryYear: string; setCardExpiryYear: (v: string) => void;
  cardCcv: string; setCardCcv: (v: string) => void;
  cardEmail: string; setCardEmail: (v: string) => void;
  cardCpfCnpj: string; setCardCpfCnpj: (v: string) => void;
  cardCep: string; setCardCep: (v: string) => void;
  cardPhone: string; setCardPhone: (v: string) => void;
}

export function CobrancaCardForm(p: Props) {
  return (
    <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <CreditCard className="h-4 w-4" /> Dados do Cartão
      </p>
      <div className="space-y-2">
        <Label className="text-xs">Nome no cartão *</Label>
        <Input value={p.cardHolderName} onChange={e => p.setCardHolderName(e.target.value)} placeholder="Como impresso no cartão" className="h-8 text-sm" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Número do cartão *</Label>
        <Input value={p.cardNumber} onChange={e => p.setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" className="h-8 text-sm" maxLength={19} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Mês *</Label>
          <Input value={p.cardExpiryMonth} onChange={e => p.setCardExpiryMonth(e.target.value)} placeholder="MM" maxLength={2} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Ano *</Label>
          <Input value={p.cardExpiryYear} onChange={e => p.setCardExpiryYear(e.target.value)} placeholder="AAAA" maxLength={4} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CVV *</Label>
          <Input value={p.cardCcv} onChange={e => p.setCardCcv(e.target.value)} placeholder="123" maxLength={4} className="h-8 text-sm" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground font-medium mt-2">Dados do titular</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Email *</Label>
          <Input type="email" value={p.cardEmail} onChange={e => p.setCardEmail(e.target.value)} placeholder="email@exemplo.com" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CPF/CNPJ *</Label>
          <Input value={p.cardCpfCnpj} onChange={e => p.setCardCpfCnpj(e.target.value)} placeholder="000.000.000-00" className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">CEP</Label>
          <Input value={p.cardCep} onChange={e => p.setCardCep(e.target.value)} placeholder="00000-000" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Telefone</Label>
          <Input value={p.cardPhone} onChange={e => p.setCardPhone(e.target.value)} placeholder="(11) 99999-0000" className="h-8 text-sm" />
        </div>
      </div>
    </div>
  );
}
