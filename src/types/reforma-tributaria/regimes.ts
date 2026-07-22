import type { RegimeEspecial } from './enums';

export interface ConfiguracaoRegimeEspecial {
  regime: RegimeEspecial;
  descricao: string;
  reducaoAliquotaCBS: number;
  reducaoAliquotaIBS: number;
  creditoIntegralMantido: boolean;
  observacoes: string;
  fundamentoLegal: string;
}

export const REGIMES_ESPECIAIS: ConfiguracaoRegimeEspecial[] = [
  { regime: 'zona_franca_manaus', descricao: 'Zona Franca de Manaus', reducaoAliquotaCBS: 100, reducaoAliquotaIBS: 100, creditoIntegralMantido: true, observacoes: 'Manutenção dos benefícios até 2073', fundamentoLegal: 'Art. 446 a 460 LC 214/2025' },
  { regime: 'combustiveis', descricao: 'Combustíveis', reducaoAliquotaCBS: 0, reducaoAliquotaIBS: 0, creditoIntegralMantido: true, observacoes: 'Regime monofásico com alíquotas específicas', fundamentoLegal: 'Art. 172 a 189 LC 214/2025' },
  { regime: 'servicos_financeiros', descricao: 'Serviços Financeiros', reducaoAliquotaCBS: 0, reducaoAliquotaIBS: 0, creditoIntegralMantido: false, observacoes: 'Base de cálculo diferenciada (margem)', fundamentoLegal: 'Art. 190 a 232 LC 214/2025' },
  { regime: 'imobiliario', descricao: 'Operações Imobiliárias', reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40, creditoIntegralMantido: true, observacoes: 'Redução de 40% para imóveis residenciais', fundamentoLegal: 'Art. 233 a 256 LC 214/2025' },
  { regime: 'hotelaria', descricao: 'Hotelaria e Hospedagem', reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40, creditoIntegralMantido: true, observacoes: 'Redução de 40%', fundamentoLegal: 'Art. 257 a 259 LC 214/2025' },
  { regime: 'bares_restaurantes', descricao: 'Bares e Restaurantes', reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40, creditoIntegralMantido: true, observacoes: 'Redução de 40%', fundamentoLegal: 'Art. 260 a 262 LC 214/2025' },
  { regime: 'transporte_coletivo', descricao: 'Transporte Coletivo', reducaoAliquotaCBS: 60, reducaoAliquotaIBS: 60, creditoIntegralMantido: true, observacoes: 'Redução de 60%', fundamentoLegal: 'Art. 263 a 268 LC 214/2025' },
];
