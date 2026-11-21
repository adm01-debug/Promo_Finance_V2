import {
  AliquotasTransicao,
  CategoriaIS,
  FaseTransicao,
  REGIMES_ESPECIAIS,
  RegimeEspecial,
} from '@/types/reforma-tributaria';
import { obterLinhaCronograma } from './cronograma-oficial';
import type { DadosOperacao, ResultadoIsencao } from './types';

/** Determina a fase de transição baseada no ano */
export function determinarFaseTransicao(ano: number): FaseTransicao {
  if (ano <= 2025) return '2026_teste';
  if (ano === 2026) return '2026_teste';
  if (ano === 2027) return '2027_cbs_plena';
  if (ano === 2028) return '2028_cbs_plena';
  if (ano === 2029) return '2029_transicao';
  if (ano === 2030) return '2030_transicao';
  if (ano === 2031) return '2031_transicao';
  if (ano === 2032) return '2032_transicao';
  return '2033_pleno';
}

/** Obtém as alíquotas de transição para um ano específico */
export function obterAliquotasTransicao(ano: number): AliquotasTransicao {
  const linha = obterLinhaCronograma(ano);
  return {
    ano: linha.ano,
    cbs: linha.cbs,
    ibs: linha.ibsUf + linha.ibsMun,
    ibsUf: linha.ibsUf,
    ibsMun: linha.ibsMun,
    icmsResidual: linha.icmsResidual,
    issResidual: linha.issResidual,
    pisResidual: linha.pisResidual,
    cofinsResidual: linha.cofinsResidual,
  };
}

/** Aplica reduções de regime especial */
export function aplicarRegimeEspecial(
  aliquotaCBS: number,
  aliquotaIBS: number,
  regime?: RegimeEspecial
): { cbs: number; ibs: number } {
  if (!regime || regime === 'nenhum') {
    return { cbs: aliquotaCBS, ibs: aliquotaIBS };
  }

  const config = REGIMES_ESPECIAIS.find((r) => r.regime === regime);
  if (!config) {
    return { cbs: aliquotaCBS, ibs: aliquotaIBS };
  }

  const reducaoCBS = (100 - config.reducaoAliquotaCBS) / 100;
  const reducaoIBS = (100 - config.reducaoAliquotaIBS) / 100;

  return {
    cbs: aliquotaCBS * reducaoCBS,
    ibs: aliquotaIBS * reducaoIBS,
  };
}

/** Obtém alíquota do Imposto Seletivo */
export function obterAliquotaIS(categoria?: CategoriaIS, aliquotaCustom?: number): number {
  if (!categoria) return 0;
  return aliquotaCustom ?? 0;
}

/**
 * Verifica se operação é isenta ou imune.
 * Etapa 29: lista explícita de CFOPs de exportação (série 7xxx) com manutencaoCredito.
 */
export function verificarIsencao(dados: DadosOperacao): ResultadoIsencao {
  if (dados.isExportacao) {
    return {
      isento: true,
      motivo: 'Exportação — imunidade constitucional (art. 65 LC 214/2025)',
      manutencaoCredito: true,
    };
  }

  // Lista explícita de CFOPs de exportação (série 7xxx — NF-e)
  // Referência: Ajuste SINIEF 7/2005, Tabela B, códigos de operações com exterior
  // 7651/7654: venda de combustível/lubrificante para o exterior (Convênio SINIEF 54/2000)
  const cfopsExportacao = new Set([
    '7101',
    '7102',
    '7103',
    '7105',
    '7106',
    '7127',
    '7129',
    '7201',
    '7202',
    '7203',
    '7205',
    '7206',
    '7211',
    '7301',
    '7302',
    '7303',
    '7304',
    '7305',
    '7306',
    '7401',
    '7501',
    '7502',
    '7503',
    '7504',
    '7551',
    '7651',
    '7654',
    '7667',
    '7930',
    '7949',
  ]);

  if (dados.cfop.length === 4 && cfopsExportacao.has(dados.cfop)) {
    return {
      isento: true,
      motivo: `Exportação identificada pelo CFOP ${dados.cfop} (art. 65 LC 214/2025)`,
      manutencaoCredito: true,
    };
  }

  return { isento: false };
}
