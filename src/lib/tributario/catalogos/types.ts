// CATÁLOGOS FISCAIS — Tipos da camada de acesso ao banco
// Fonte de verdade versionada: tabelas públicas de catálogo.

import type { AnexoSimples } from '../types';

export type RegiaoBrasil = 'NORTE' | 'NORDESTE' | 'CENTRO_OESTE' | 'SUDESTE' | 'SUL';

export interface UfCatalogo {
  sigla: string;
  nome: string;
  codigo_ibge: number;
  regiao: RegiaoBrasil;
  aliquota_interna_padrao: number;
  possui_fcp: boolean;
  aliquota_fcp: number;
  exige_antecipacao: boolean;
  difal_base_dupla: boolean;
  /** Início de vigência do registro (ISO yyyy-mm-dd). */
  vigente_de: string;
  /** Fim de vigência; `null` = vigente por prazo indeterminado. */
  vigente_ate: string | null;
}

export interface AliquotaInterestadualCatalogo {
  uf_origem: string;
  uf_destino: string;
  aliquota: number;
  aliquota_importado: number;
  vigente_de: string;
  vigente_ate: string | null;
}

export interface FaixaSimplesCatalogo {
  anexo: AnexoSimples;
  faixa: number;
  rbt12_de: number;
  rbt12_ate: number;
  aliquota: number;
  parcela_deduzir: number;
  vigente_de: string;
  vigente_ate: string | null;
}

/** Divergência entre o catálogo do banco e as constantes do motor. */
export interface DivergenciaCatalogo {
  anexo: AnexoSimples;
  faixa: number;
  campo: 'rbt12_de' | 'rbt12_ate' | 'aliquota' | 'parcela_deduzir' | 'ausente';
  valorCodigo: number | null;
  valorBanco: number | null;
}
