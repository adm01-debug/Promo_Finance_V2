// MOTOR CALCULADORA TRIBUTÁRIA — Tipos
// Todos os valores monetários em BRL, alíquotas em decimal (0.15 = 15%)

import type { AnexoSimples, RegimeTributario } from '../types';
import type { ItemMonofasico, PosicaoCadeia } from '../monofasico/types';

/** Mix de NCMs sujeitos ao regime monofásico de PIS/COFINS (Etapa 36). */
export interface InputMonofasico {
  posicaoPadrao?: PosicaoCadeia;
  itens: ItemMonofasico[];
}

export type Periodicidade = 'mensal' | 'trimestral' | 'anual';
export type ModoLucroReal = 'anual_estimativa' | 'trimestral';

export interface InputReceitas {
  receitaBrutaAnual: number;
  percentualServicos: number; // 0..100
  percentualRevenda?: number;
  percentualIndustria?: number;
  percentualExportacao?: number;
  devolucoes?: number;
  descontosIncondicionais?: number;
  /** Receitas com tributação concentrada (monofásico) — saem da base normal de PIS/COFINS. */
  monofasico?: InputMonofasico;
}

export interface InputFolha {
  folhaAnual: number;
  proLabore?: number;
  aliquotaRat?: number;   // decimal, ex 0.02
  aliquotaTerceiros?: number; // decimal, ex 0.058
}

export interface CreditosPisCofins {
  insumos?: number;
  energiaEletrica?: number;
  alugueisPj?: number;
  depreciacao?: number;
  fretesVenda?: number;
  devolucoesVenda?: number;
  arrendamentoMercantil?: number;
  outros?: number;
}

export interface InputLalur {
  adicoesMultas?: number;
  adicoesBrindes?: number;
  adicoesProvisoes?: number;
  adicoesDoacoes?: number;
  adicoesOutras?: number;
  exclusoesDividendos?: number;
  exclusoesReversaoProvisoes?: number;
  exclusoesIncentivos?: number;
  exclusoesOutras?: number;
}

export interface InputEstadualMunicipal {
  aliquotaIcms?: number;         // decimal (ex 0.18)
  aliquotaIcmsInterestadual?: number;
  creditoIcmsCompras?: number;   // R$
  icmsSt?: number;
  difal?: number;
  aliquotaIss?: number;          // decimal (ex 0.05)
}

export interface InputRetencoes {
  irrfSofrido?: number;
  csrfSofrido?: number; // PIS+COFINS+CSLL 4,65% na fonte
  inssSofrido?: number;
  issRetido?: number;
}

export interface InputLucroReal {
  receitas: InputReceitas;
  lucroContabil: number;
  lalur: InputLalur;
  prejuizoAcumulado?: number;    // saldo de prejuízo fiscal p/ compensar
  csllAliquotaFinanceira?: boolean;
  creditosPisCofins: CreditosPisCofins;
  folha: InputFolha;
  estadualMunicipal: InputEstadualMunicipal;
  retencoes?: InputRetencoes;
  modo: ModoLucroReal;
}

export type AtividadePresumido =
  | 'comercio' | 'industria' | 'servicos_geral'
  | 'servicos_profissionais' | 'transporte_cargas'
  | 'transporte_passageiros' | 'servicos_hospitalares';

export interface InputLucroPresumido {
  receitas: InputReceitas;
  atividade: AtividadePresumido;
  aliquotaIrpjPresuncao?: number;   // override, decimal
  aliquotaCsllPresuncao?: number;   // override, decimal
  folha: InputFolha;
  estadualMunicipal: InputEstadualMunicipal;
  retencoes?: InputRetencoes;
  ganhoCapital?: number;
  rendimentosAplicacoes?: number;
}

export interface InputSimples {
  receitas: InputReceitas;
  anexo: AnexoSimples;
  rbt12: number;
  folha12m: number;
  ufSublimite?: number; // default 3_600_000
  mesReferencia?: number;
  anoReferencia?: number;
}

export interface InputReforma {
  receitas: InputReceitas;
  anoReferencia: number; // 2026..2033+
  regimeEspecialReducao?: number; // 0..1 (ex 0.6 para 60% redução — saúde/educ)
  aliquotaCbsAlvo?: number;  // decimal, default 0.088
  aliquotaIbsAlvo?: number;  // decimal, default 0.177
  creditos?: number; // R$ base de créditos IVA
  categoriaImpostoSeletivo?: 'nenhum' | 'bebidas_alcoolicas' | 'fumo' | 'veiculos' | 'bens_luxo';
}

export interface InputCalculadora {
  lucroReal?: InputLucroReal;
  lucroPresumido?: InputLucroPresumido;
  simples?: InputSimples;
  reforma?: InputReforma;
}

export interface LinhaMemoria {
  ordem: number;
  grupo: string;      // "IRPJ", "PIS/COFINS", etc
  descricao: string;
  base?: number;
  aliquota?: number;
  valor: number;
  observacao?: string;
}

export interface TributoDetalhe {
  nome: string;
  valor: number;
  base: number;
  aliquotaEfetiva: number; // decimal
  formula: string;
}

export interface ResultadoRegime {
  regime: RegimeTributario | 'reforma';
  nome: string;
  elegivel: boolean;
  motivoInelegibilidade?: string;
  tributos: TributoDetalhe[];
  retencoesCompensadas: number;
  totalTributos: number;   // bruto
  totalAPagar: number;     // total - retencoes
  receitaBase: number;
  cargaEfetiva: number;    // %
  memoria: LinhaMemoria[];
  alertas: string[];
}

export interface ResultadoCalculadora {
  input: InputCalculadora;
  cenarios: ResultadoRegime[];
  melhorCenario: ResultadoRegime | null;
  economiaAnualVsPior: number;
  geradoEm: string;
}

export type { RegimeTributario, AnexoSimples };
