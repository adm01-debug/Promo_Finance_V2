import type { PosicaoCadeia } from '@/lib/tributario/monofasico';

export const POSICOES: { value: PosicaoCadeia; label: string }[] = [
  { value: 'industria', label: 'Indústria' },
  { value: 'importador', label: 'Importador' },
  { value: 'produtor', label: 'Produtor' },
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'atacado', label: 'Atacado' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'revenda', label: 'Revenda' },
];
