/**
 * Motor puro de auditoria de rejeições dos overlays de catálogo fiscal.
 *
 * Os overlays (ICMS, ISS, NCM e Monofásico) descartam registros do banco que
 * não passam nas validações defensivas — nesses casos o motor segue com o
 * valor canônico embarcado. Este módulo normaliza essas rejeições em linhas
 * auditáveis (catálogo, item, campo, motivo, valor recebido) para que a
 * origem do dado ruim possa ser rastreada e corrigida.
 *
 * Puro por design: sem I/O, sem dependência de React ou Supabase.
 */
import type { ResultadoOverlay, MotivoRejeicao } from '@/lib/tributario/icms/overlay';
import type { ResultadoOverlayIss, MotivoRejeicaoIss } from '@/lib/tributario/ipi-iss/overlay-iss';
import type { ResultadoOverlayNcm, MotivoRejeicaoNcm } from '@/lib/tributario/ipi-iss/overlay-ncm';
import type {
  ResultadoOverlayMonofasico,
  MotivoRejeicaoMonofasico,
} from '@/lib/tributario/monofasico/overlay-monofasico';
import type { ResultadoOverlayMva, MotivoRejeicaoMva } from '@/lib/tributario/icms/overlay-mva';
import type { AlertaCatalogo } from './alertas';

export type CatalogoOverlay = 'icms' | 'iss' | 'ncm' | 'monofasico' | 'mva_st';
export type SeveridadeRejeicao = 'critico' | 'atencao';

/** Linha normalizada de auditoria — espelha `public.overlay_rejeicoes_auditoria`. */
export interface RejeicaoAuditavel {
  catalogo: CatalogoOverlay;
  /** Chave de negócio do registro rejeitado (sigla da UF, NCM, IBGE+item…). */
  identificador: string;
  /** Rótulo humano auxiliar (município, descrição do NCM). */
  descricao: string | null;
  /** Coluna do catálogo que causou a rejeição. */
  campo: string;
  motivo: string;
  /** Valor bruto recebido do banco, serializado para inspeção. */
  valorRecebido: string | null;
  severidade: SeveridadeRejeicao;
}

export interface EntradaColetaRejeicoes {
  icms?: ResultadoOverlay['rejeitadas'];
  iss?: ResultadoOverlayIss['rejeitadas'];
  ncm?: ResultadoOverlayNcm['rejeitadas'];
  monofasico?: ResultadoOverlayMonofasico['rejeitadas'];
  mva_st?: ResultadoOverlayMva['rejeitadas'];
}

const CAMPO_ICMS: Record<MotivoRejeicao, string> = {
  uf_desconhecida: 'sigla',
  interna_invalida: 'aliquota_interna_padrao',
  fcp_invalido: 'aliquota_fcp',
  duplicado: 'sigla',
};

const CAMPO_ISS: Record<MotivoRejeicaoIss, string> = {
  codigo_ibge_invalido: 'codigo_ibge',
  municipio_invalido: 'municipio',
  aliquota_invalida: 'aliquota',
  fora_da_faixa_legal: 'aliquota',
  vigencia_invalida: 'vigente_de/vigente_ate',
  duplicado: 'codigo_ibge+item',
};

const CAMPO_NCM: Record<MotivoRejeicaoNcm, string> = {
  codigo_invalido: 'codigo',
  duplicado: 'codigo',
  aliquota_invalida: 'aliquota_ipi',
  aliquota_fora_da_faixa: 'aliquota_ipi',
};

const CAMPO_MVA: Record<MotivoRejeicaoMva, string> = {
  ncm_invalido: 'ncm_codigo',
  protocolo_invalido: 'protocolo_id',
  mva_invalida: 'mva_original',
  mva_fora_da_faixa: 'mva_original',
  vigencia_invalida: 'vigente_de/vigente_ate',
  duplicado: 'protocolo_id+ncm_codigo',
  sem_uf_signataria: 'protocolos_st_ufs',
  uf_desconhecida: 'uf',
  papel_invalido: 'papel',
};

const CAMPO_MONOFASICO: Record<MotivoRejeicaoMonofasico, string> = {
  codigo_invalido: 'codigo',
  duplicado: 'codigo',
};

/** Duplicidade é higiene de cadastro; o resto distorce o cálculo. */
function severidadePorMotivo(motivo: string): SeveridadeRejeicao {
  return motivo === 'duplicado' ? 'atencao' : 'critico';
}

function serializarValor(valor: number | string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  return String(valor);
}

/** Converte o motivo técnico em texto legível em pt-BR. */
export function descreverMotivo(motivo: string): string {
  return motivo.replace(/_/g, ' ');
}

/**
 * Normaliza as rejeições dos quatro overlays em linhas auditáveis.
 * Entradas ausentes são tratadas como listas vazias (chamada parcial é válida).
 */
export function coletarRejeicoesOverlay(entrada: EntradaColetaRejeicoes): RejeicaoAuditavel[] {
  const linhas: RejeicaoAuditavel[] = [];

  for (const r of entrada.icms ?? []) {
    linhas.push({
      catalogo: 'icms',
      identificador: r.sigla || '—',
      descricao: null,
      campo: CAMPO_ICMS[r.motivo] ?? 'desconhecido',
      motivo: r.motivo,
      valorRecebido: serializarValor(r.valor),
      severidade: severidadePorMotivo(r.motivo),
    });
  }

  for (const r of entrada.iss ?? []) {
    const ibge = r.codigoIbge !== null && r.codigoIbge !== undefined ? String(r.codigoIbge) : '—';
    linhas.push({
      catalogo: 'iss',
      identificador: `${ibge}#${r.itemCodigo ?? 'geral'}`,
      descricao: r.municipio ?? null,
      campo: CAMPO_ISS[r.motivo] ?? 'desconhecido',
      motivo: r.motivo,
      valorRecebido: serializarValor(r.valor),
      severidade: severidadePorMotivo(r.motivo),
    });
  }

  for (const r of entrada.ncm ?? []) {
    linhas.push({
      catalogo: 'ncm',
      identificador: r.ncm || '—',
      descricao: null,
      campo: CAMPO_NCM[r.motivo] ?? 'desconhecido',
      motivo: r.motivo,
      valorRecebido: serializarValor(r.valor),
      severidade: severidadePorMotivo(r.motivo),
    });
  }

  for (const r of entrada.monofasico ?? []) {
    linhas.push({
      catalogo: 'monofasico',
      identificador: r.ncm || '—',
      descricao: null,
      campo: CAMPO_MONOFASICO[r.motivo] ?? 'desconhecido',
      motivo: r.motivo,
      valorRecebido: serializarValor(r.valor),
      severidade: severidadePorMotivo(r.motivo),
    });
  }

  for (const r of entrada.mva_st ?? []) {
    linhas.push({
      catalogo: 'mva_st',
      identificador: `${r.protocolo || '—'}#${r.ncm || '—'}`,
      descricao: `Protocolo ${r.protocolo || '—'}`,
      campo: CAMPO_MVA[r.motivo] ?? 'desconhecido',
      motivo: r.motivo,
      valorRecebido: serializarValor(r.valor),
      severidade: severidadePorMotivo(r.motivo),
    });
  }

  return linhas;
}

export interface ResumoRejeicoes {
  total: number;
  criticos: number;
  atencao: number;
  porCatalogo: Record<CatalogoOverlay, number>;
  porMotivo: Array<{ motivo: string; quantidade: number }>;
}

/** Agrega as linhas auditáveis para os cartões de topo da tela. */
export function resumirRejeicoes(linhas: RejeicaoAuditavel[]): ResumoRejeicoes {
  const porCatalogo: Record<CatalogoOverlay, number> = { icms: 0, iss: 0, ncm: 0, monofasico: 0, mva_st: 0 };
  const motivos = new Map<string, number>();
  let criticos = 0;

  for (const l of linhas) {
    porCatalogo[l.catalogo] += 1;
    if (l.severidade === 'critico') criticos += 1;
    motivos.set(l.motivo, (motivos.get(l.motivo) ?? 0) + 1);
  }

  return {
    total: linhas.length,
    criticos,
    atencao: linhas.length - criticos,
    porCatalogo,
    porMotivo: [...motivos.entries()]
      .map(([motivo, quantidade]) => ({ motivo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade),
  };
}

/**
 * Converte os alertas de DRIFT do catálogo de MVA/ST em linhas auditáveis.
 *
 * Diferença conceitual em relação a `coletarRejeicoesOverlay`: aqui o registro
 * não foi descartado pelo overlay — ele foi aceito, mas diverge do catálogo de
 * NCMs ou carece de lastro (protocolo sem UF signatária, NCM sujeito à ST sem
 * protocolo). São falhas de CADASTRO que precisam da mesma trilha de correção,
 * por isso compartilham a tabela `overlay_rejeicoes_auditoria`.
 */
export function coletarDriftMvaAuditavel(
  alertas: readonly AlertaCatalogo[],
): RejeicaoAuditavel[] {
  return alertas
    .filter((a) => a.catalogo === 'protocolos_st')
    .map((a) => ({
      catalogo: 'mva_st' as const,
      identificador: a.item,
      descricao: a.mensagem,
      campo: a.campo,
      // Prefixo `drift_` evita colisão com os motivos de rejeição do overlay,
      // preservando a leitura correta do agregado por motivo.
      motivo: `drift_${a.campo}`,
      valorRecebido: a.valorBanco === null ? null : String(a.valorBanco),
      severidade: a.severidade,
    }));
}
