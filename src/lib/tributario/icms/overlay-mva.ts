/**
 * OVERLAY DE MVA/ST POR PROTOCOLO — Camada defensiva entre os catálogos
 * versionados no banco (`protocolos_st`, `protocolos_st_ncms`,
 * `protocolos_st_ufs`) e o motor de ICMS-ST.
 *
 * Racional jurídico:
 *  - A MVA-ST é fixada por protocolo/convênio ICMS e vale APENAS entre as UFs
 *    signatárias, observado o papel de cada uma (remetente/destinatária).
 *    Aplicar MVA de protocolo do qual a UF não é signatária gera cobrança
 *    indevida — por isso a resolução exige casamento explícito origem→destino.
 *  - A substituição tributária pressupõe operação subsequente TRIBUTADA. Se a
 *    mercadoria é isenta, não tributada ou tem alíquota zero (ou o NCM não é
 *    sujeito à ST no catálogo), não há imposto presumido a reter: a regra
 *    jurídica PREVALECE sobre o cadastro de MVA. Esses casos são registrados
 *    como bloqueios, nunca como MVA aplicável.
 *  - Vigência: protocolos denunciados/alterados deixam de produzir MVA a
 *    partir da data de encerramento (recorte por data de referência).
 *
 * Regra de ouro: nenhum registro inválido chega ao motor. Ele é rejeitado com
 * motivo rastreável e o cálculo segue com a MVA informada manualmente.
 *
 * Módulo puro no núcleo (sem I/O, sem React, sem Supabase); expõe apenas um
 * registrador de índice efetivo para o runtime, no mesmo padrão dos demais
 * overlays (ICMS, ISS, NCM, monofásico).
 */

import { isUF } from './tabelas';
import type { SituacaoIcmsSt, UF } from './types';

/** Papel da UF no protocolo de ST. */
export type PapelProtocolo = 'ORIGEM' | 'DESTINO' | 'AMBOS';

/** Situações em que NÃO há operação subsequente tributada — logo, não há ST. */
export const SITUACOES_SEM_ST: readonly SituacaoIcmsSt[] = [
  'isenta',
  'nao_tributada',
  'aliquota_zero',
  'imune',
  'suspensa',
];

/** Registro cru de `protocolos_st_ncms` (já unido ao protocolo). */
export interface RegistroProtocoloNcmBanco {
  protocolo_id: string;
  protocolo_codigo?: string | null;
  ncm_codigo: string | null;
  mva_original: number | string | null;
  cest?: string | null;
  vigente_de?: string | null;
  vigente_ate?: string | null;
}

/** Registro cru de `protocolos_st_ufs`. */
export interface RegistroProtocoloUfBanco {
  protocolo_id: string;
  uf: string | null;
  papel?: string | null;
}

/** Regra jurídica por NCM, oriunda do catálogo `ncms`. */
export interface RegraJuridicaNcm {
  /** `sujeito_st` do catálogo. `false` bloqueia a retenção. */
  sujeitoSt?: boolean | null;
  /** Situação do ICMS na operação subsequente. */
  situacao?: SituacaoIcmsSt | null;
}

export type MotivoRejeicaoMva =
  | 'ncm_invalido'
  | 'protocolo_invalido'
  | 'mva_invalida'
  | 'mva_fora_da_faixa'
  | 'vigencia_invalida'
  | 'duplicado'
  | 'sem_uf_signataria'
  | 'uf_desconhecida'
  | 'papel_invalido';

export interface RejeicaoMva {
  /** NCM (ou sigla de UF, nas rejeições de signatárias). */
  ncm: string;
  protocolo: string;
  motivo: MotivoRejeicaoMva;
  valor: number | string | null;
}

/** Motivo pelo qual a regra jurídica afastou a MVA cadastrada. */
export type MotivoBloqueioMva =
  | 'ncm_nao_sujeito_st'
  | 'operacao_isenta'
  | 'operacao_nao_tributada'
  | 'aliquota_zero'
  | 'operacao_imune'
  | 'operacao_suspensa';

export interface BloqueioMva {
  ncm: string;
  protocolo: string;
  motivo: MotivoBloqueioMva;
  /** MVA que existia no cadastro e foi deliberadamente NÃO aplicada. */
  mvaIgnorada: number;
}

/** Entrada válida do índice: uma MVA por protocolo × NCM. */
export interface EntradaMvaSt {
  ncm: string;
  protocoloId: string;
  protocoloCodigo: string;
  mvaOriginal: number;
  cest: string | null;
  /** UFs habilitadas como remetentes no protocolo. */
  origens: UF[];
  /** UFs habilitadas como destinatárias no protocolo. */
  destinos: UF[];
}

/** Índice efetivo: NCM (8 dígitos) → entradas de protocolo. */
export type IndiceMvaSt = Record<string, EntradaMvaSt[]>;

export interface ResultadoOverlayMva {
  indice: IndiceMvaSt;
  /** Entradas aceitas (uma por protocolo × NCM). */
  aplicadas: EntradaMvaSt[];
  /** Registros descartados por inconsistência de cadastro. */
  rejeitadas: RejeicaoMva[];
  /** Registros válidos, porém afastados por regra jurídica (isenção, NT, zero). */
  bloqueadas: BloqueioMva[];
}

/**
 * Teto defensivo da MVA. As maiores MVAs praticadas no país (bebidas quentes,
 * cosméticos) ficam abaixo de 300%; qualquer valor acima é erro de carga.
 */
export const MVA_MAXIMA = 3;

const RE_NCM = /^\d{8}$/;
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;

function normalizarNcmCodigo(valor: string | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const limpo = String(valor).replace(/\D/g, '');
  return RE_NCM.test(limpo) ? limpo : null;
}

/**
 * Normaliza a MVA vinda como fração (0.4025), percentual (40.25) ou string
 * ('40,25'). Valores estritamente maiores que 1 são lidos como pontos
 * percentuais — MVA de 100% (=1) é lida como fração, e 100 como percentual.
 */
export function normalizarMva(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined) return null;
  const bruto = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor;
  if (!Number.isFinite(bruto)) return null;
  if (bruto < 0) return null;
  return bruto > 1 ? bruto / 100 : bruto;
}

function arredondar(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

function normalizarPapel(valor: string | null | undefined): PapelProtocolo | null {
  const p = (valor ?? 'AMBOS').toString().trim().toUpperCase();
  if (p === 'ORIGEM' || p === 'DESTINO' || p === 'AMBOS') return p;
  return null;
}

function vigenteEm(
  registro: { vigente_de?: string | null; vigente_ate?: string | null },
  referencia: string | null,
): boolean | null {
  const de = registro.vigente_de ?? null;
  const ate = registro.vigente_ate ?? null;
  if ((de !== null && !RE_DATA.test(de)) || (ate !== null && !RE_DATA.test(ate))) return null;
  if (de !== null && ate !== null && ate < de) return null;
  if (!referencia || !RE_DATA.test(referencia)) return true;
  if (de !== null && de > referencia) return false;
  if (ate !== null && ate < referencia) return false;
  return true;
}

function bloqueioDaSituacao(situacao: SituacaoIcmsSt): MotivoBloqueioMva | null {
  switch (situacao) {
    case 'isenta':
      return 'operacao_isenta';
    case 'nao_tributada':
      return 'operacao_nao_tributada';
    case 'aliquota_zero':
      return 'aliquota_zero';
    case 'imune':
      return 'operacao_imune';
    case 'suspensa':
      return 'operacao_suspensa';
    default:
      return null;
  }
}

export interface EntradaOverlayMva {
  ncms: readonly RegistroProtocoloNcmBanco[];
  ufs?: readonly RegistroProtocoloUfBanco[];
  /** Regras jurídicas por NCM (chave já normalizada ou com pontuação). */
  regras?: Readonly<Record<string, RegraJuridicaNcm>>;
  /** Data ISO da operação; recorta a vigência dos vínculos protocolo × NCM. */
  referencia?: string | null;
}

/**
 * Constrói o índice efetivo de MVA-ST por protocolo, validando cadastro e
 * preservando as regras jurídicas de isenção/não tributado/alíquota zero.
 *
 * Função pura: não faz I/O e não muta as entradas.
 */
export function aplicarOverlayMvaSt(entrada: EntradaOverlayMva): ResultadoOverlayMva {
  const referencia = entrada.referencia ?? null;
  const rejeitadas: RejeicaoMva[] = [];
  const bloqueadas: BloqueioMva[] = [];
  const aplicadas: EntradaMvaSt[] = [];
  const indice: IndiceMvaSt = {};

  // 1) Signatárias por protocolo — sem UF válida o protocolo não produz efeito.
  const origensPorProtocolo = new Map<string, Set<UF>>();
  const destinosPorProtocolo = new Map<string, Set<UF>>();

  for (const registro of entrada.ufs ?? []) {
    const protocolo = (registro?.protocolo_id ?? '').toString().trim();
    if (!protocolo) {
      rejeitadas.push({ ncm: '—', protocolo: '—', motivo: 'protocolo_invalido', valor: null });
      continue;
    }
    const sigla = (registro.uf ?? '').toString().trim().toUpperCase();
    if (!isUF(sigla)) {
      rejeitadas.push({ ncm: '—', protocolo, motivo: 'uf_desconhecida', valor: registro.uf ?? null });
      continue;
    }
    const papel = normalizarPapel(registro.papel);
    if (papel === null) {
      rejeitadas.push({ ncm: '—', protocolo, motivo: 'papel_invalido', valor: registro.papel ?? null });
      continue;
    }
    const uf = sigla as UF;
    if (papel === 'ORIGEM' || papel === 'AMBOS') {
      const set = origensPorProtocolo.get(protocolo) ?? new Set<UF>();
      set.add(uf);
      origensPorProtocolo.set(protocolo, set);
    }
    if (papel === 'DESTINO' || papel === 'AMBOS') {
      const set = destinosPorProtocolo.get(protocolo) ?? new Set<UF>();
      set.add(uf);
      destinosPorProtocolo.set(protocolo, set);
    }
  }

  // 2) Vínculos protocolo × NCM.
  const vistos = new Set<string>();

  for (const registro of entrada.ncms ?? []) {
    const protocolo = (registro?.protocolo_id ?? '').toString().trim();
    const codigo = (registro?.protocolo_codigo ?? protocolo).toString();
    const ncmBruto = registro?.ncm_codigo ?? null;
    const ncm = normalizarNcmCodigo(ncmBruto);

    if (!protocolo) {
      rejeitadas.push({ ncm: String(ncmBruto ?? '—'), protocolo: '—', motivo: 'protocolo_invalido', valor: null });
      continue;
    }
    if (ncm === null) {
      rejeitadas.push({ ncm: String(ncmBruto ?? '—'), protocolo: codigo, motivo: 'ncm_invalido', valor: ncmBruto });
      continue;
    }

    const chave = `${protocolo}#${ncm}`;
    if (vistos.has(chave)) {
      rejeitadas.push({ ncm, protocolo: codigo, motivo: 'duplicado', valor: registro.mva_original });
      continue;
    }
    vistos.add(chave);

    const vigencia = vigenteEm(registro, referencia);
    if (vigencia === null) {
      rejeitadas.push({
        ncm,
        protocolo: codigo,
        motivo: 'vigencia_invalida',
        valor: `${registro.vigente_de ?? '—'}..${registro.vigente_ate ?? '—'}`,
      });
      continue;
    }
    // Fora de vigência não é erro de cadastro: apenas não integra o índice.
    if (vigencia === false) continue;

    const mva = normalizarMva(registro.mva_original);
    if (mva === null) {
      rejeitadas.push({ ncm, protocolo: codigo, motivo: 'mva_invalida', valor: registro.mva_original });
      continue;
    }
    if (mva > MVA_MAXIMA) {
      rejeitadas.push({ ncm, protocolo: codigo, motivo: 'mva_fora_da_faixa', valor: registro.mva_original });
      continue;
    }

    const origens = [...(origensPorProtocolo.get(protocolo) ?? new Set<UF>())].sort();
    const destinos = [...(destinosPorProtocolo.get(protocolo) ?? new Set<UF>())].sort();
    if (origens.length === 0 || destinos.length === 0) {
      rejeitadas.push({ ncm, protocolo: codigo, motivo: 'sem_uf_signataria', valor: registro.mva_original });
      continue;
    }

    // 3) Regra jurídica prevalece sobre o cadastro de MVA.
    const regra = entrada.regras?.[ncm] ?? entrada.regras?.[String(ncmBruto ?? '')];
    if (regra) {
      if (regra.sujeitoSt === false) {
        bloqueadas.push({ ncm, protocolo: codigo, motivo: 'ncm_nao_sujeito_st', mvaIgnorada: arredondar(mva) });
        continue;
      }
      const motivo = regra.situacao ? bloqueioDaSituacao(regra.situacao) : null;
      if (motivo) {
        bloqueadas.push({ ncm, protocolo: codigo, motivo, mvaIgnorada: arredondar(mva) });
        continue;
      }
    }

    const item: EntradaMvaSt = {
      ncm,
      protocoloId: protocolo,
      protocoloCodigo: codigo,
      mvaOriginal: arredondar(mva),
      cest: registro.cest ?? null,
      origens,
      destinos,
    };
    aplicadas.push(item);
    indice[ncm] = [...(indice[ncm] ?? []), item];
  }

  return { indice, aplicadas, rejeitadas, bloqueadas };
}

/* -------------------------------------------------------------------------
 * Índice efetivo em runtime (mesmo padrão dos demais overlays)
 * ---------------------------------------------------------------------- */

let INDICE_EFETIVO: IndiceMvaSt = {};

/** Publica o índice validado para consumo do motor de ST. */
export function definirIndiceMvaStEfetivo(indice: IndiceMvaSt): void {
  INDICE_EFETIVO = indice ?? {};
}

/** Restaura o estado inicial (usado em testes e no logout). */
export function resetarIndiceMvaStEfetivo(): void {
  INDICE_EFETIVO = {};
}

export function obterIndiceMvaStEfetivo(): IndiceMvaSt {
  return INDICE_EFETIVO;
}

export interface ConsultaMvaSt {
  ncm: string;
  ufOrigem: UF;
  ufDestino: UF;
  /** Situação jurídica informada pela operação (prevalece sobre o protocolo). */
  situacao?: SituacaoIcmsSt;
  /** Índice alternativo (default: o efetivo em runtime). */
  indice?: IndiceMvaSt;
}

export interface ResolucaoMvaSt {
  /** `true` quando há MVA de protocolo aplicável à operação. */
  encontrado: boolean;
  mvaOriginal: number;
  protocolo: string | null;
  cest: string | null;
  /** Preenchido quando a regra jurídica afastou a ST. */
  bloqueio: MotivoBloqueioMva | null;
  /** Mensagens para a memória de cálculo. */
  alertas: string[];
}

/**
 * Resolve a MVA-ST aplicável a uma operação (NCM + par de UFs), respeitando
 * as UFs signatárias e as regras jurídicas de isenção/NT/zero.
 *
 * Havendo mais de um protocolo aplicável ao mesmo par de UFs, prevalece a
 * maior MVA (critério conservador em favor do sujeito ativo) e o conflito é
 * sinalizado para saneamento do cadastro.
 */
export function resolverMvaSt(consulta: ConsultaMvaSt): ResolucaoMvaSt {
  const vazio: ResolucaoMvaSt = {
    encontrado: false,
    mvaOriginal: 0,
    protocolo: null,
    cest: null,
    bloqueio: null,
    alertas: [],
  };

  const situacao = consulta.situacao;
  if (situacao) {
    const bloqueio = bloqueioDaSituacao(situacao);
    if (bloqueio) {
      return {
        ...vazio,
        bloqueio,
        alertas: [
          'Operação sem tributação subsequente (isenção, não incidência, alíquota zero, imunidade ou suspensão): a MVA do protocolo não foi aplicada e não há ICMS-ST a reter.',
        ],
      };
    }
  }

  const ncm = normalizarNcmCodigo(consulta.ncm);
  if (ncm === null) return vazio;

  const indice = consulta.indice ?? INDICE_EFETIVO;
  const candidatos = (indice[ncm] ?? []).filter(
    (e) => e.origens.includes(consulta.ufOrigem) && e.destinos.includes(consulta.ufDestino),
  );

  if (candidatos.length === 0) return vazio;

  const escolhido = [...candidatos].sort(
    (a, b) => b.mvaOriginal - a.mvaOriginal || a.protocoloCodigo.localeCompare(b.protocoloCodigo),
  )[0];

  const alertas = [
    `MVA de ${(escolhido.mvaOriginal * 100).toLocaleString('pt-BR', { maximumFractionDigits: 4 })}% obtida do protocolo ${escolhido.protocoloCodigo} (${consulta.ufOrigem}→${consulta.ufDestino}).`,
  ];
  if (candidatos.length > 1) {
    alertas.push(
      `Há ${candidatos.length} protocolos aplicáveis ao NCM ${ncm} nesse par de UFs; prevaleceu a maior MVA. Revise o cadastro.`,
    );
  }

  return {
    encontrado: true,
    mvaOriginal: escolhido.mvaOriginal,
    protocolo: escolhido.protocoloCodigo,
    cest: escolhido.cest,
    bloqueio: null,
    alertas,
  };
}

const ROTULO_MOTIVO: Record<MotivoRejeicaoMva, string> = {
  ncm_invalido: 'NCM inválido (exige 8 dígitos)',
  protocolo_invalido: 'protocolo sem identificador',
  mva_invalida: 'MVA não numérica ou negativa',
  mva_fora_da_faixa: 'MVA acima do teto defensivo de 300%',
  vigencia_invalida: 'vigência incoerente',
  duplicado: 'vínculo protocolo × NCM duplicado',
  sem_uf_signataria: 'protocolo sem UF signatária válida',
  uf_desconhecida: 'UF signatária desconhecida',
  papel_invalido: 'papel da UF inválido (ORIGEM/DESTINO/AMBOS)',
};

/** Traduz rejeições do overlay de MVA/ST em mensagens legíveis. */
export function descreverRejeicoesMva(rejeicoes: readonly RejeicaoMva[]): string[] {
  return rejeicoes.map(
    (r) => `Protocolo ${r.protocolo} · NCM ${r.ncm}: ${ROTULO_MOTIVO[r.motivo] ?? r.motivo.replace(/_/g, ' ')}`,
  );
}

const ROTULO_BLOQUEIO: Record<MotivoBloqueioMva, string> = {
  ncm_nao_sujeito_st: 'NCM não sujeito a ST no catálogo',
  operacao_isenta: 'operação isenta',
  operacao_nao_tributada: 'operação não tributada',
  aliquota_zero: 'alíquota zero',
  operacao_imune: 'operação imune',
  operacao_suspensa: 'operação com suspensão',
};

/** Traduz bloqueios jurídicos (MVA cadastrada, porém legalmente inaplicável). */
export function descreverBloqueiosMva(bloqueios: readonly BloqueioMva[]): string[] {
  return bloqueios.map(
    (b) => `Protocolo ${b.protocolo} · NCM ${b.ncm}: ${ROTULO_BLOQUEIO[b.motivo]} — MVA cadastrada não aplicada`,
  );
}
