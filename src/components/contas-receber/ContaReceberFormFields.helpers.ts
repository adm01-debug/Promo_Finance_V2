import { Building2, CreditCard, Banknote, QrCode, Wallet } from 'lucide-react';

export const tipoCobrancaOptions = [
  { value: 'boleto', label: 'Boleto', icon: Banknote },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'cartao', label: 'Cartão', icon: CreditCard },
  { value: 'transferencia', label: 'Transferência', icon: Building2 },
  { value: 'dinheiro', label: 'Dinheiro', icon: Wallet },
];

export const frequenciaOptions = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];
