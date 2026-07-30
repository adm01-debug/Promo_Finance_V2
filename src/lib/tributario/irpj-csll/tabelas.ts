import type { AlvoAjuste, TipoAjuste } from './types';

/** Alíquotas vigentes (RIR/2018 art. 623 e Lei 7.689/88 art. 3º). */
export const ALIQUOTA_IRPJ = 0.15;
export const ALIQUOTA_ADICIONAL_IRPJ = 0.10;
export const ALIQUOTA_CSLL = 0.09;

/** Limite mensal do adicional de IRPJ (R$ 20.000,00/mês). */
export const LIMITE_ADICIONAL_MENSAL = 20000;

/** Trava de compensação de prejuízos fiscais — Lei 9.065/95 art. 15. */
export const TRAVA_COMPENSACAO = 0.30;

/** Percentuais de presunção usados no regime de estimativa mensal. */
export const PRESUNCAO_IRPJ = {
  comercio_industria: 0.08,
  revenda_combustivel: 0.016,
  transporte_carga: 0.08,
  transporte_passageiros: 0.16,
  servicos_gerais: 0.32,
  servicos_hospitalares: 0.08,
  servicos_ate_120k: 0.16,
} as const;

export const PRESUNCAO_CSLL = {
  comercio_industria: 0.12,
  revenda_combustivel: 0.12,
  transporte_carga: 0.12,
  transporte_passageiros: 0.12,
  servicos_gerais: 0.32,
  servicos_hospitalares: 0.12,
  servicos_ate_120k: 0.32,
} as const;

export type AtividadePresuncao = keyof typeof PRESUNCAO_IRPJ;

export const LABEL_ATIVIDADE: Record<AtividadePresuncao, string> = {
  comercio_industria: 'Comércio / Indústria (8% / 12%)',
  revenda_combustivel: 'Revenda de combustíveis (1,6% / 12%)',
  transporte_carga: 'Transporte de cargas (8% / 12%)',
  transporte_passageiros: 'Transporte de passageiros (16% / 12%)',
  servicos_gerais: 'Serviços em geral (32% / 32%)',
  servicos_hospitalares: 'Serviços hospitalares (8% / 12%)',
  servicos_ate_120k: 'Serviços — receita anual até R$ 120 mil (16% / 32%)',
};

/** Catálogo de ajustes típicos do LALUR Parte A. */
export interface ModeloAjuste {
  readonly descricao: string;
  readonly tipo: TipoAjuste;
  readonly alvo: AlvoAjuste;
  readonly fundamento: string;
}

export const MODELOS_AJUSTE: readonly ModeloAjuste[] = [
  { descricao: 'Multas não dedutíveis (punitivas)', tipo: 'adicao', alvo: 'ambos', fundamento: 'RIR/2018 art. 352' },
  { descricao: 'Brindes e doações não dedutíveis', tipo: 'adicao', alvo: 'ambos', fundamento: 'Lei 9.249/95 art. 13, VI' },
  { descricao: 'Despesas sem comprovação / não necessárias', tipo: 'adicao', alvo: 'ambos', fundamento: 'RIR/2018 art. 311' },
  { descricao: 'Provisões não dedutíveis', tipo: 'adicao', alvo: 'ambos', fundamento: 'Lei 9.249/95 art. 13, I' },
  { descricao: 'Depreciação contábil superior à fiscal', tipo: 'adicao', alvo: 'ambos', fundamento: 'IN RFB 1.700/17 art. 121' },
  { descricao: 'Resultado negativo de equivalência patrimonial', tipo: 'adicao', alvo: 'ambos', fundamento: 'RIR/2018 art. 426' },
  { descricao: 'Tributos com exigibilidade suspensa', tipo: 'adicao', alvo: 'ambos', fundamento: 'Lei 8.981/95 art. 41, §1º' },
  { descricao: 'Receita de equivalência patrimonial (positiva)', tipo: 'exclusao', alvo: 'ambos', fundamento: 'RIR/2018 art. 426' },
  { descricao: 'Dividendos recebidos de participações societárias', tipo: 'exclusao', alvo: 'ambos', fundamento: 'Lei 9.249/95 art. 10' },
  { descricao: 'Reversão de provisões tributadas', tipo: 'exclusao', alvo: 'ambos', fundamento: 'RIR/2018 art. 441' },
  { descricao: 'Depreciação acelerada incentivada', tipo: 'exclusao', alvo: 'ambos', fundamento: 'RIR/2018 art. 324' },
  { descricao: 'Subvenção para investimento', tipo: 'exclusao', alvo: 'ambos', fundamento: 'Lei 12.973/14 art. 30' },
  { descricao: 'Incentivo — Lei do Bem (P&D)', tipo: 'exclusao', alvo: 'irpj', fundamento: 'Lei 11.196/05 art. 19' },
] as const;
