// Tipos, constantes e builder de input da página CalculadoraTributaria — extraídos para zerar max-lines.
import type { InputCalculadora, AtividadePresumido } from '@/lib/tributario/calculadora';

export type CampoInput = {
  receitaBrutaAnual: number;
  percentualServicos: number;
  lucroContabil: number;
  folhaAnual: number;
  aliquotaRat: number;
  aliquotaTerceiros: number;
  aliquotaIcms: number;
  aliquotaIss: number;
  creditoIcmsCompras: number;
  csllFinanceira: boolean;
  prejuizoAcumulado: number;
  adicoesLalur: number;
  exclusoesLalur: number;
  creditoPisCofinsInsumos: number;
  creditoPisCofinsEnergia: number;
  creditoPisCofinsAlugueis: number;
  creditoPisCofinsFretes: number;
  irrfSofrido: number;
  csrfSofrido: number;
  atividadePresumido: AtividadePresumido;
  /** CNAE preponderante — quando informado, deriva a atividade automaticamente. */
  cnaePreponderante: string;

  anexoSimples: 'I' | 'II' | 'III' | 'IV' | 'V';
  rbt12: number;
  folha12m: number;
  anoReforma: number;
  categoriaSeletivo: 'nenhum' | 'bebidas_alcoolicas' | 'fumo' | 'veiculos' | 'bens_luxo';
  reducaoReforma: number;
};

export const ROTULO_ATIVIDADE: Record<AtividadePresumido, string> = {
  comercio: 'Comércio (8% IRPJ / 12% CSLL)',
  industria: 'Indústria (8% / 12%)',
  servicos_geral: 'Serviços em geral (32%)',
  servicos_profissionais: 'Serviços profissionais (32%)',
  transporte_cargas: 'Transporte de cargas (8% / 12%)',
  transporte_passageiros: 'Transporte de passageiros (16% / 12%)',
  servicos_hospitalares: 'Serviços hospitalares (8% / 12%)',
};

export const DEFAULT_INPUT: CampoInput = {
  receitaBrutaAnual: 3_000_000,
  percentualServicos: 30,
  lucroContabil: 500_000,
  folhaAnual: 400_000,
  aliquotaRat: 0.02,
  aliquotaTerceiros: 0.058,
  aliquotaIcms: 0.18,
  aliquotaIss: 0.05,
  creditoIcmsCompras: 0,
  csllFinanceira: false,
  prejuizoAcumulado: 0,
  adicoesLalur: 0,
  exclusoesLalur: 0,
  creditoPisCofinsInsumos: 800_000,
  creditoPisCofinsEnergia: 0,
  creditoPisCofinsAlugueis: 0,
  creditoPisCofinsFretes: 0,
  irrfSofrido: 0,
  csrfSofrido: 0,
  atividadePresumido: 'comercio',
  cnaePreponderante: '',

  anexoSimples: 'I',
  rbt12: 3_000_000,
  folha12m: 400_000,
  anoReforma: 2026,
  categoriaSeletivo: 'nenhum',
  reducaoReforma: 0,
};

export function buildInput(f: CampoInput, atividadeDerivada?: AtividadePresumido): InputCalculadora {
  const receitas = { receitaBrutaAnual: f.receitaBrutaAnual, percentualServicos: f.percentualServicos };
  const folha = { folhaAnual: f.folhaAnual, aliquotaRat: f.aliquotaRat, aliquotaTerceiros: f.aliquotaTerceiros };
  const estadualMunicipal = { aliquotaIcms: f.aliquotaIcms, aliquotaIss: f.aliquotaIss, creditoIcmsCompras: f.creditoIcmsCompras };
  const retencoes = { irrfSofrido: f.irrfSofrido, csrfSofrido: f.csrfSofrido };
  return {
    lucroReal: {
      receitas, folha, estadualMunicipal, retencoes,
      lucroContabil: f.lucroContabil,
      lalur: { adicoesOutras: f.adicoesLalur, exclusoesOutras: f.exclusoesLalur },
      prejuizoAcumulado: f.prejuizoAcumulado,
      csllAliquotaFinanceira: f.csllFinanceira,
      creditosPisCofins: {
        insumos: f.creditoPisCofinsInsumos,
        energiaEletrica: f.creditoPisCofinsEnergia,
        alugueisPj: f.creditoPisCofinsAlugueis,
        fretesVenda: f.creditoPisCofinsFretes,
      },
      modo: 'anual_estimativa',
    },
    lucroPresumido: {
      receitas, folha, estadualMunicipal, retencoes,
      atividade: atividadeDerivada ?? f.atividadePresumido,
    },
    simples: {
      receitas, anexo: f.anexoSimples, rbt12: f.rbt12, folha12m: f.folha12m,
    },
    reforma: {
      receitas,
      anoReferencia: f.anoReforma,
      regimeEspecialReducao: f.reducaoReforma,
      categoriaImpostoSeletivo: f.categoriaSeletivo,
    },
  };
}
