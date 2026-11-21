import type { RegimeEspecial } from './enums';
import type { OrigemValor } from '@/lib/reforma-tributaria/cronograma-oficial';

export interface ConfiguracaoRegimeEspecial {
  regime: RegimeEspecial;
  descricao: string;
  reducaoAliquotaCBS: number;
  reducaoAliquotaIBS: number;
  creditoIntegralMantido: boolean;
  observacoes: string;
  fundamentoLegal: string;
  origem: OrigemValor;
}

/**
 * Aplica benefícios fiscais na ordem do art. 7º-A LC 214/2025:
 * cada redução incide sobre a base remanescente após a redução anterior.
 *
 * @param reducoes - percentuais de redução a aplicar (ex.: [60, 30] = 60% sobre base, 30% sobre restante)
 * @returns redução efetiva combinada em percentual (0–100)
 *
 * @example
 * aplicarOrdemBeneficios([60, 30]) // => 72  (1 - 0.4 * 0.7) * 100
 * aplicarOrdemBeneficios([100])    // => 100
 * aplicarOrdemBeneficios([])       // => 0
 */
export function aplicarOrdemBeneficios(reducoes: number[]): number {
  let base = 1;
  for (const r of reducoes) {
    base = base * (1 - r / 100);
  }
  return (1 - base) * 100;
}

export const REGIMES_ESPECIAIS: ConfiguracaoRegimeEspecial[] = [
  {
    regime: 'zona_franca_manaus',
    descricao: 'Zona Franca de Manaus',
    reducaoAliquotaCBS: 100, reducaoAliquotaIBS: 100,
    creditoIntegralMantido: true,
    observacoes: 'Manutenção dos benefícios até 2073',
    fundamentoLegal: 'Art. 446 a 460 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'combustiveis',
    descricao: 'Combustíveis',
    reducaoAliquotaCBS: 0, reducaoAliquotaIBS: 0,
    creditoIntegralMantido: true,
    observacoes: 'Regime monofásico com alíquotas específicas',
    fundamentoLegal: 'Art. 172 a 189 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'servicos_financeiros',
    descricao: 'Serviços Financeiros',
    reducaoAliquotaCBS: 0, reducaoAliquotaIBS: 0,
    creditoIntegralMantido: false,
    observacoes: 'Base de cálculo diferenciada (margem)',
    fundamentoLegal: 'Art. 190 a 232 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'imobiliario',
    descricao: 'Operações Imobiliárias',
    reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40% para imóveis (regime geral)',
    fundamentoLegal: 'Art. 233 a 256 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'locacao_imovel',
    descricao: 'Locação e Cessão de Imóvel',
    reducaoAliquotaCBS: 70, reducaoAliquotaIBS: 70,
    creditoIntegralMantido: true,
    observacoes: 'Tratada como operação com bem (art. 3º §3º LC 227/2026) — redução de 70% para locação residencial',
    fundamentoLegal: 'Art. 3º §3º LC 227/2026 c/c arts. 233 a 256 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'hotelaria',
    descricao: 'Hotelaria e Hospedagem',
    reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40%',
    fundamentoLegal: 'Art. 257 a 259 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'bares_restaurantes',
    descricao: 'Bares e Restaurantes',
    reducaoAliquotaCBS: 40, reducaoAliquotaIBS: 40,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 40%',
    fundamentoLegal: 'Art. 260 a 262 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'transporte_coletivo',
    descricao: 'Transporte Coletivo',
    reducaoAliquotaCBS: 60, reducaoAliquotaIBS: 60,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 60%',
    fundamentoLegal: 'Art. 263 a 268 LC 214/2025',
    origem: 'lei',
  },
  {
    regime: 'saude',
    descricao: 'Serviços de Saúde',
    reducaoAliquotaCBS: 60, reducaoAliquotaIBS: 60,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 60% — serviços de saúde humana',
    fundamentoLegal: 'Art. 127 LC 214/2025 (Anexo I, item 4)',
    origem: 'lei',
  },
  {
    regime: 'educacao',
    descricao: 'Serviços de Educação',
    reducaoAliquotaCBS: 60, reducaoAliquotaIBS: 60,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 60% — serviços de educação',
    fundamentoLegal: 'Art. 127 LC 214/2025 (Anexo I, item 5)',
    origem: 'lei',
  },
  {
    regime: 'producoes_culturais',
    descricao: 'Produções Culturais Nacionais',
    reducaoAliquotaCBS: 60, reducaoAliquotaIBS: 60,
    creditoIntegralMantido: true,
    observacoes: 'Redução de 60% — produções artísticas, culturais, jornalísticas',
    fundamentoLegal: 'Art. 127 LC 214/2025 (Anexo I, item 8)',
    origem: 'lei',
  },
];
