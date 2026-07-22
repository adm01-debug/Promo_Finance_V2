import {
  ALIQUOTA_CBS_REFERENCIA,
  ALIQUOTA_IBS_REFERENCIA,
  ALIQUOTAS_TRANSICAO,
  AliquotasTransicao,
  CategoriaIS,
  CONFIGURACOES_IS,
  FaseTransicao,
  REGIMES_ESPECIAIS,
  RegimeEspecial,
} from '@/types/reforma-tributaria';
import type { DadosOperacao } from './types';

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
  const aliquotas = ALIQUOTAS_TRANSICAO.find((a) => a.ano === ano);
  if (aliquotas) return aliquotas;

  if (ano > 2033) {
    return {
      ano,
      cbs: ALIQUOTA_CBS_REFERENCIA,
      ibs: ALIQUOTA_IBS_REFERENCIA,
      icmsResidual: 0,
      issResidual: 0,
      pisResidual: 0,
      cofinsResidual: 0,
    };
  }

  return {
    ano,
    cbs: 0,
    ibs: 0,
    icmsResidual: 100,
    issResidual: 100,
    pisResidual: 100,
    cofinsResidual: 100,
  };
}

/** Aplica reduções de regime especial */
export function aplicarRegimeEspecial(
  aliquotaCBS: number,
  aliquotaIBS: number,
  regime?: RegimeEspecial,
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
  if (aliquotaCustom !== undefined) return aliquotaCustom;
  if (!categoria) return 0;

  const config = CONFIGURACOES_IS.find((c) => c.categoria === categoria);
  return config?.aliquotaBase || 0;
}

/** Verifica se operação é isenta/imune */
export function verificarIsencao(dados: DadosOperacao): { isento: boolean; motivo?: string } {
  if (dados.isExportacao) {
    return { isento: true, motivo: 'Exportação - Imunidade constitucional' };
  }

  const cfopsExportacao = ['7101', '7102', '7127', '7501', '7949'];
  if (
    cfopsExportacao.some(
      (c) =>
        dados.cfop.startsWith(c.substring(0, 1)) &&
        dados.cfop.length === 4 &&
        dados.cfop.startsWith('7'),
    )
  ) {
    return { isento: true, motivo: 'Exportação identificada pelo CFOP' };
  }

  return { isento: false };
}
