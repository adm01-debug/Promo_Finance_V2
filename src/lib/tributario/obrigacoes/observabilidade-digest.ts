/**
 * Etapa T — Observabilidade dos envios do digest de conformidade.
 *
 * Motor puro e determinístico: recebe as linhas de auditoria gravadas pela
 * Edge Function `enviar-digest-conformidade` e devolve os agregados exibidos
 * no painel admin. Nenhuma dependência de rede, relógio global ou React —
 * o que torna o comportamento reprodutível e testável em massa.
 *
 * Decisões de projeto:
 *  - `simulado` (sem chave Resend) NÃO é sucesso de entrega: é contado à parte,
 *    para não mascarar um ambiente sem provedor configurado.
 *  - Taxa de entrega considera apenas tentativas reais (`enviado` + `falhou`);
 *    ignorados são decisões de preferência, não falhas.
 *  - Toda divisão é protegida contra denominador zero.
 */

export type SituacaoEnvioDigest = 'enviado' | 'ignorado' | 'falhou' | 'simulado';

export interface RegistroEnvioDigest {
  readonly id: string;
  readonly execucaoId: string;
  readonly userId: string | null;
  readonly email: string;
  readonly situacao: SituacaoEnvioDigest;
  readonly motivo: string | null;
  readonly erro: string | null;
  readonly totalAlertas: number;
  readonly totalEmpresas: number;
  readonly severidadeMaxima: string | null;
  readonly multaTotal: number;
  readonly hashConteudo: string | null;
  readonly duplicado: boolean;
  readonly simulado: boolean;
  readonly criadoEm: string;
}

export interface ResumoObservabilidadeDigest {
  readonly total: number;
  readonly enviados: number;
  readonly falhas: number;
  readonly ignorados: number;
  readonly simulados: number;
  readonly duplicados: number;
  /** Percentual 0–100 sobre tentativas reais de entrega. */
  readonly taxaEntrega: number;
  /** Percentual 0–100 de falhas sobre tentativas reais. */
  readonly taxaFalha: number;
  readonly totalAlertas: number;
  readonly multaTotal: number;
  readonly destinatariosUnicos: number;
  readonly execucoes: number;
  readonly ultimaExecucaoEm: string | null;
}

export interface SerieDiaDigest {
  readonly dia: string;
  readonly enviados: number;
  readonly falhas: number;
  readonly ignorados: number;
  readonly simulados: number;
}

export interface MotivoAgrupado {
  readonly motivo: string;
  readonly quantidade: number;
}

export interface DestinatarioAgrupado {
  readonly email: string;
  readonly enviados: number;
  readonly falhas: number;
  readonly ultimoEnvioEm: string | null;
}

const pct = (parte: number, total: number): number =>
  total <= 0 ? 0 : Number(((parte / total) * 100).toFixed(2));

const numero = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Consolida os indicadores principais do período carregado. */
export function resumirEnvios(
  registros: readonly RegistroEnvioDigest[],
): ResumoObservabilidadeDigest {
  let enviados = 0;
  let falhas = 0;
  let ignorados = 0;
  let simulados = 0;
  let duplicados = 0;
  let totalAlertas = 0;
  let multaTotal = 0;
  let ultima: string | null = null;
  const emails = new Set<string>();
  const execucoes = new Set<string>();

  for (const r of registros) {
    switch (r.situacao) {
      case 'enviado':
        enviados += 1;
        break;
      case 'falhou':
        falhas += 1;
        break;
      case 'ignorado':
        ignorados += 1;
        break;
      case 'simulado':
        simulados += 1;
        break;
    }
    if (r.duplicado) duplicados += 1;
    totalAlertas += Math.max(0, numero(r.totalAlertas));
    multaTotal += Math.max(0, numero(r.multaTotal));
    if (r.situacao !== 'ignorado') emails.add(r.email);
    execucoes.add(r.execucaoId);
    if (ultima === null || r.criadoEm > ultima) ultima = r.criadoEm;
  }

  const tentativas = enviados + falhas;
  return {
    total: registros.length,
    enviados,
    falhas,
    ignorados,
    simulados,
    duplicados,
    taxaEntrega: pct(enviados, tentativas),
    taxaFalha: pct(falhas, tentativas),
    totalAlertas,
    multaTotal: Number(multaTotal.toFixed(2)),
    destinatariosUnicos: emails.size,
    execucoes: execucoes.size,
    ultimaExecucaoEm: ultima,
  };
}

/** Série diária (ISO `YYYY-MM-DD`) ordenada cronologicamente. */
export function serieDiaria(registros: readonly RegistroEnvioDigest[]): SerieDiaDigest[] {
  const mapa = new Map<string, { enviados: number; falhas: number; ignorados: number; simulados: number }>();
  for (const r of registros) {
    const dia = String(r.criadoEm).slice(0, 10);
    if (!dia) continue;
    const atual = mapa.get(dia) ?? { enviados: 0, falhas: 0, ignorados: 0, simulados: 0 };
    if (r.situacao === 'enviado') atual.enviados += 1;
    else if (r.situacao === 'falhou') atual.falhas += 1;
    else if (r.situacao === 'ignorado') atual.ignorados += 1;
    else atual.simulados += 1;
    mapa.set(dia, atual);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, v]) => ({ dia, ...v }));
}

/** Ranking dos motivos de descarte, do mais frequente ao menos. */
export function agruparMotivos(registros: readonly RegistroEnvioDigest[]): MotivoAgrupado[] {
  const mapa = new Map<string, number>();
  for (const r of registros) {
    if (r.situacao !== 'ignorado') continue;
    const motivo = (r.motivo ?? 'não informado').trim() || 'não informado';
    mapa.set(motivo, (mapa.get(motivo) ?? 0) + 1);
  }
  return [...mapa.entries()]
    .map(([motivo, quantidade]) => ({ motivo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.motivo.localeCompare(b.motivo));
}

/** Ranking por destinatário: prioriza quem mais falha. */
export function agruparDestinatarios(
  registros: readonly RegistroEnvioDigest[],
): DestinatarioAgrupado[] {
  const mapa = new Map<string, { enviados: number; falhas: number; ultimoEnvioEm: string | null }>();
  for (const r of registros) {
    if (r.situacao === 'ignorado') continue;
    const atual = mapa.get(r.email) ?? { enviados: 0, falhas: 0, ultimoEnvioEm: null };
    if (r.situacao === 'falhou') atual.falhas += 1;
    else {
      atual.enviados += 1;
      if (atual.ultimoEnvioEm === null || r.criadoEm > atual.ultimoEnvioEm) {
        atual.ultimoEnvioEm = r.criadoEm;
      }
    }
    mapa.set(r.email, atual);
  }
  return [...mapa.entries()]
    .map(([email, v]) => ({ email, ...v }))
    .sort((a, b) => b.falhas - a.falhas || b.enviados - a.enviados || a.email.localeCompare(b.email));
}

/** Últimas falhas, da mais recente para a mais antiga. */
export function ultimasFalhas(
  registros: readonly RegistroEnvioDigest[],
  limite = 20,
): RegistroEnvioDigest[] {
  return registros
    .filter((r) => r.situacao === 'falhou')
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, Math.max(0, limite));
}
