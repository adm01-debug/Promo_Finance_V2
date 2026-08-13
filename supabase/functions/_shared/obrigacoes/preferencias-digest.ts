/**
 * Etapa R — Preferências por usuário para o digest de conformidade fiscal.
 *
 * Motor 100% puro e determinístico: decide QUEM recebe o digest em uma dada
 * execução, COM QUAIS alertas e para QUAL endereço. Nenhuma leitura de relógio,
 * `Math.random` ou I/O acontece aqui — o instante de referência é sempre
 * injetado pelo chamador (`ContextoEnvio`), o que torna o comportamento
 * reproduzível em testes e auditável em produção.
 *
 * Decisões de projeto:
 * - Nunca lança: linhas do banco podem conter valores fora do domínio (enum
 *   novo, array nulo, hora 99). Tudo é normalizado para o caminho seguro.
 * - "Vazio = tudo": `empresas_filtro` vazio significa todas as empresas, e não
 *   nenhuma — o default de um usuário que nunca configurou nada deve ser
 *   receber o panorama completo, não silêncio.
 * - Janela de hora tolerante: o cron pode atrasar. Um envio agendado para as
 *   08h ainda dispara se a execução ocorrer entre 08h e 08h + `toleranciaHoras`.
 * - Idempotência delegada por hash: o motor devolve o hash do conjunto de
 *   alertas de cada destinatário; o chamador compara com `ultimo_hash` para
 *   não reenviar conteúdo idêntico.
 */
import type { AlertaDigest } from './digest.ts';

/** Severidades aceitas, da mais grave para a menos grave. */
export const SEVERIDADES_DIGEST = ['critica', 'alta', 'media', 'baixa'] as const;
export type SeveridadeDigest = (typeof SEVERIDADES_DIGEST)[number];

/** Frequências de envio suportadas. */
export const FREQUENCIAS_DIGEST = ['diaria', 'semanal', 'mensal'] as const;
export type FrequenciaDigest = (typeof FREQUENCIAS_DIGEST)[number];

const PESO: Record<SeveridadeDigest, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

/** Preferência normalizada de um usuário. */
export interface PreferenciaDigest {
  readonly userId: string;
  readonly email: string;
  readonly ativo: boolean;
  readonly frequencia: FrequenciaDigest;
  /** 0 = domingo … 6 = sábado. Só relevante em `semanal`. */
  readonly diaSemana: number;
  /** 1..28 (28 evita meses curtos). Só relevante em `mensal`. */
  readonly diaMes: number;
  /** Hora local de envio, 0..23. */
  readonly horaEnvio: number;
  readonly severidadeMinima: SeveridadeDigest;
  readonly tiposIgnorados: readonly string[];
  /** Vazio = todas as empresas. */
  readonly empresasFiltro: readonly string[];
  readonly maxAlertas: number;
  readonly ultimoHash: string | null;
}

/** Linha crua vinda do banco (colunas snake_case, tipos frouxos). */
export interface PreferenciaDigestRaw {
  user_id?: unknown;
  email?: unknown;
  ativo?: unknown;
  frequencia?: unknown;
  dia_semana?: unknown;
  dia_mes?: unknown;
  hora_envio?: unknown;
  severidade_minima?: unknown;
  tipos_ignorados?: unknown;
  empresas_filtro?: unknown;
  max_alertas?: unknown;
  ultimo_hash?: unknown;
}

/** Instante de referência da execução, sempre injetado. */
export interface ContextoEnvio {
  /** 0 = domingo … 6 = sábado. */
  readonly diaSemana: number;
  /** Dia do mês, 1..31. */
  readonly diaMes: number;
  /** Hora local, 0..23. */
  readonly hora: number;
  /** Quantas horas após `horaEnvio` ainda contam como "na janela". Default 2. */
  readonly toleranciaHoras?: number;
  /** Último dia do mês corrente (28..31), usado para ancorar `diaMes` alto. */
  readonly ultimoDiaDoMes?: number;
}

/** Plano de envio para um destinatário. */
export interface PlanoEnvioDigest {
  readonly preferencia: PreferenciaDigest;
  readonly email: string;
  readonly alertas: readonly AlertaDigest[];
  /** Hash determinístico do conteúdo selecionado. */
  readonly hash: string;
  /** true quando o hash é idêntico ao último envio — chamador deve pular. */
  readonly duplicado: boolean;
}

/** Resultado agregado do planejamento, incluindo o descarte auditável. */
export interface ResultadoPlanejamento {
  readonly envios: readonly PlanoEnvioDigest[];
  readonly ignorados: readonly {
    readonly userId: string;
    readonly motivo: 'inativo' | 'fora-da-janela' | 'sem-email' | 'sem-alertas' | 'duplicado';
  }[];
}

const inteiro = (valor: unknown, min: number, max: number, padrao: number): number => {
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return padrao;
  const truncado = Math.trunc(n);
  if (truncado < min || truncado > max) return padrao;
  return truncado;
};

const listaTexto = (valor: unknown): readonly string[] => {
  if (!Array.isArray(valor)) return [];
  const itens = valor
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return [...new Set(itens)].sort();
};

/** E-mail minimamente válido (a validação forte fica no banco/Zod). */
const emailValido = (valor: unknown): string => {
  if (typeof valor !== 'string') return '';
  const limpo = valor.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpo) ? limpo : '';
};

/** Normaliza uma linha crua em uma preferência segura de usar. */
export function normalizarPreferencia(raw: PreferenciaDigestRaw): PreferenciaDigest {
  const frequencia = FREQUENCIAS_DIGEST.includes(raw.frequencia as FrequenciaDigest)
    ? (raw.frequencia as FrequenciaDigest)
    : 'diaria';
  const severidade = SEVERIDADES_DIGEST.includes(raw.severidade_minima as SeveridadeDigest)
    ? (raw.severidade_minima as SeveridadeDigest)
    : 'media';

  return {
    userId: typeof raw.user_id === 'string' ? raw.user_id : '',
    email: emailValido(raw.email),
    // Ausente (usuário sem linha migrada) é tratado como ativo.
    ativo: raw.ativo === undefined || raw.ativo === null ? true : raw.ativo === true,
    frequencia,
    diaSemana: inteiro(raw.dia_semana, 0, 6, 1),
    diaMes: inteiro(raw.dia_mes, 1, 28, 1),
    horaEnvio: inteiro(raw.hora_envio, 0, 23, 8),
    severidadeMinima: severidade,
    tiposIgnorados: listaTexto(raw.tipos_ignorados),
    empresasFiltro: listaTexto(raw.empresas_filtro),
    maxAlertas: inteiro(raw.max_alertas, 1, 500, 50),
    ultimoHash: typeof raw.ultimo_hash === 'string' && raw.ultimo_hash ? raw.ultimo_hash : null,
  };
}

/**
 * Decide se a preferência está na janela de envio do contexto informado.
 * `diaMes` acima do último dia do mês é ancorado no último dia — assim uma
 * preferência para o dia 28 nunca some em fevereiro.
 */
export function estaNaJanela(pref: PreferenciaDigest, ctx: ContextoEnvio): boolean {
  if (!pref.ativo) return false;

  const tolerancia = inteiro(ctx.toleranciaHoras, 0, 23, 2);
  const hora = inteiro(ctx.hora, 0, 23, 0);
  if (hora < pref.horaEnvio || hora > pref.horaEnvio + tolerancia) return false;

  if (pref.frequencia === 'diaria') return true;
  if (pref.frequencia === 'semanal') return inteiro(ctx.diaSemana, 0, 6, -1) === pref.diaSemana;

  const ultimoDia = inteiro(ctx.ultimoDiaDoMes, 28, 31, 31);
  const alvo = Math.min(pref.diaMes, ultimoDia);
  return inteiro(ctx.diaMes, 1, 31, -1) === alvo;
}

/** Aplica severidade mínima, tipos ignorados, empresas e teto de volume. */
export function filtrarAlertas(
  pref: PreferenciaDigest,
  alertas: readonly AlertaDigest[],
): readonly AlertaDigest[] {
  const empresas = new Set(pref.empresasFiltro);
  const tipos = new Set(pref.tiposIgnorados);
  const limite = PESO[pref.severidadeMinima];

  const selecionados = alertas.filter((a) => {
    const sev = SEVERIDADES_DIGEST.includes(a.severidade as SeveridadeDigest)
      ? (a.severidade as SeveridadeDigest)
      : 'baixa';
    if (PESO[sev] > limite) return false;
    if (tipos.has(String(a.tipo))) return false;
    if (empresas.size > 0 && !empresas.has(a.empresaId)) return false;
    return true;
  });

  // Ordenação total determinística antes de aplicar o teto, para que o corte
  // preserve sempre os alertas mais graves e não dependa da ordem da consulta.
  const ordenados = [...selecionados].sort((a, b) => {
    const pa = PESO[(a.severidade as SeveridadeDigest) in PESO ? (a.severidade as SeveridadeDigest) : 'baixa'];
    const pb = PESO[(b.severidade as SeveridadeDigest) in PESO ? (b.severidade as SeveridadeDigest) : 'baixa'];
    if (pa !== pb) return pa - pb;
    if (a.empresaNome !== b.empresaNome) return a.empresaNome < b.empresaNome ? -1 : 1;
    if (a.competencia !== b.competencia) return a.competencia < b.competencia ? 1 : -1;
    if (a.tipo !== b.tipo) return String(a.tipo) < String(b.tipo) ? -1 : 1;
    return a.titulo < b.titulo ? -1 : a.titulo > b.titulo ? 1 : 0;
  });

  return ordenados.slice(0, pref.maxAlertas);
}

/** Hash FNV-1a de 32 bits, em hexadecimal — mesmo algoritmo do digest. */
export function hashAlertas(alertas: readonly AlertaDigest[]): string {
  const fonte = alertas
    .map((a) => `${a.empresaId}|${a.tipo}|${a.severidade}|${a.competencia}|${a.titulo}`)
    .join('\n');
  let h = 0x811c9dc5;
  for (let i = 0; i < fonte.length; i += 1) {
    h ^= fonte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Constrói o plano de envio para todas as preferências, na ordem estável dos
 * e-mails. Preferências descartadas são reportadas com o motivo, o que permite
 * ao job logar exatamente por que alguém não recebeu o digest.
 */
export function planejarEnvios(
  preferencias: readonly PreferenciaDigestRaw[],
  alertas: readonly AlertaDigest[],
  ctx: ContextoEnvio,
): ResultadoPlanejamento {
  const envios: PlanoEnvioDigest[] = [];
  const ignorados: { userId: string; motivo: ResultadoPlanejamento['ignorados'][number]['motivo'] }[] = [];

  for (const raw of preferencias) {
    const pref = normalizarPreferencia(raw);
    if (!pref.ativo) {
      ignorados.push({ userId: pref.userId, motivo: 'inativo' });
      continue;
    }
    if (!pref.email) {
      ignorados.push({ userId: pref.userId, motivo: 'sem-email' });
      continue;
    }
    if (!estaNaJanela(pref, ctx)) {
      ignorados.push({ userId: pref.userId, motivo: 'fora-da-janela' });
      continue;
    }
    const selecionados = filtrarAlertas(pref, alertas);
    if (selecionados.length === 0) {
      ignorados.push({ userId: pref.userId, motivo: 'sem-alertas' });
      continue;
    }
    const hash = hashAlertas(selecionados);
    if (pref.ultimoHash && pref.ultimoHash === hash) {
      ignorados.push({ userId: pref.userId, motivo: 'duplicado' });
      continue;
    }
    envios.push({ preferencia: pref, email: pref.email, alertas: selecionados, hash, duplicado: false });
  }

  envios.sort((a, b) => (a.email < b.email ? -1 : a.email > b.email ? 1 : 0));
  return { envios, ignorados };
}
