/**
 * Etapa J — Score de Conformidade Fiscal.
 *
 * Consolida o calendário de obrigações acessórias (motor determinístico) com
 * os registros persistidos de entrega para produzir um indicador auditável de
 * conformidade da empresa em escopo.
 *
 * Regras de pontuação (determinísticas, sem dependência de relógio interno —
 * o "hoje" já está refletido na `situacao` de cada `ItemCalendario`):
 *
 * | Situação do item                              | Peso  |
 * |-----------------------------------------------|-------|
 * | Entregue no prazo ou dispensada               | 1,00  |
 * | Entregue com atraso                           | 0,60  |
 * | Pendente e ainda dentro do prazo              | 1,00  |
 * | Pendente vencendo hoje                        | 0,80  |
 * | Pendente e vencida                            | 0,00  |
 *
 * O score é a média ponderada × 100, arredondada a 1 casa. Itens futuros
 * contam como conformes porque ainda não há inadimplência — o que penaliza é
 * o vencimento sem entrega.
 */
import type { ItemCalendario, Orgao } from './types.ts';

/** Status persistido de uma entrega (espelha `entregas_obrigacoes.status`). */
export type StatusRegistro = 'pendente' | 'entregue' | 'dispensada' | 'retificada';

/** Registro mínimo necessário para avaliar conformidade. */
export interface RegistroEntrega {
  readonly obrigacaoId: string;
  readonly competencia: string;
  readonly status: StatusRegistro;
  /** Data efetiva de entrega em ISO (AAAA-MM-DD), quando houver. */
  readonly dataEntrega?: string | null;
  /** Multa já apurada e registrada, em reais. */
  readonly valorMulta?: number | null;
}

/** Classificação qualitativa do score. */
export type NivelConformidade = 'critico' | 'atencao' | 'bom' | 'excelente';

/** Recorte de conformidade por órgão destinatário. */
export interface ConformidadePorOrgao {
  readonly orgao: Orgao;
  readonly total: number;
  readonly vencidas: number;
  readonly score: number;
}

/** Resultado consolidado do diagnóstico de conformidade. */
export interface ResultadoConformidade {
  readonly total: number;
  readonly entregues: number;
  readonly dispensadas: number;
  readonly retificadas: number;
  readonly entreguesComAtraso: number;
  readonly vencidasPendentes: number;
  readonly venceHoje: number;
  readonly pendentesNoPrazo: number;
  /** 0–100, uma casa decimal. */
  readonly score: number;
  readonly nivel: NivelConformidade;
  /** Percentual de entregas feitas dentro do prazo (0–100, 1 casa). */
  readonly pontualidade: number;
  /** Soma das multas registradas nos itens do período. */
  readonly multaRegistrada: number;
  readonly porOrgao: readonly ConformidadePorOrgao[];
  /** Itens vencidos sem entrega, ordenados do mais antigo para o mais recente. */
  readonly criticos: readonly ItemCalendario[];
}

const PESO_ENTREGUE = 1;
const PESO_ATRASADO = 0.6;
const PESO_VENCE_HOJE = 0.8;

const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Chave estável obrigação+competência. */
const chave = (obrigacaoId: string, competencia: string) => `${obrigacaoId}::${competencia}`;

/** Converte o score numérico em faixa qualitativa. */
export function classificarConformidade(score: number): NivelConformidade {
  if (score >= 95) return 'excelente';
  if (score >= 85) return 'bom';
  if (score >= 60) return 'atencao';
  return 'critico';
}

/** Rótulos em pt-BR para exibição na UI. */
export const NIVEL_LABEL: Record<NivelConformidade, string> = {
  critico: 'Crítico',
  atencao: 'Atenção',
  bom: 'Bom',
  excelente: 'Excelente',
};

/**
 * Avalia a conformidade fiscal de um conjunto de itens do calendário.
 *
 * @param itens itens materializados por `gerarCalendario`
 * @param registros entregas persistidas (qualquer ordem; chaves duplicadas → última vence)
 */
export function calcularConformidade(
  itens: readonly ItemCalendario[],
  registros: readonly RegistroEntrega[] = []
): ResultadoConformidade {
  const indice = new Map<string, RegistroEntrega>();
  for (const r of registros) indice.set(chave(r.obrigacaoId, r.competencia), r);

  let entregues = 0;
  let dispensadas = 0;
  let retificadas = 0;
  let entreguesComAtraso = 0;
  let vencidasPendentes = 0;
  let venceHoje = 0;
  let pendentesNoPrazo = 0;
  let multaRegistrada = 0;
  let pesoObtido = 0;

  const porOrgao = new Map<Orgao, { total: number; vencidas: number; peso: number }>();
  const criticos: ItemCalendario[] = [];

  for (const item of itens) {
    const registro = indice.get(chave(item.obrigacaoId, item.competencia));
    const bucket = porOrgao.get(item.orgao) ?? { total: 0, vencidas: 0, peso: 0 };
    bucket.total += 1;

    if (registro?.valorMulta && Number.isFinite(registro.valorMulta)) {
      multaRegistrada += Math.max(0, registro.valorMulta);
    }

    let peso: number;

    if (registro && (registro.status === 'entregue' || registro.status === 'retificada')) {
      entregues += 1;
      if (registro.status === 'retificada') retificadas += 1;
      const atrasada = Boolean(registro.dataEntrega) && (registro.dataEntrega as string) > item.prazo;
      if (atrasada) entreguesComAtraso += 1;
      peso = atrasada ? PESO_ATRASADO : PESO_ENTREGUE;
    } else if (registro?.status === 'dispensada') {
      dispensadas += 1;
      peso = PESO_ENTREGUE;
    } else if (item.situacao === 'vencida') {
      vencidasPendentes += 1;
      bucket.vencidas += 1;
      criticos.push(item);
      peso = 0;
    } else if (item.situacao === 'vence_hoje') {
      venceHoje += 1;
      peso = PESO_VENCE_HOJE;
    } else {
      pendentesNoPrazo += 1;
      peso = PESO_ENTREGUE;
    }

    pesoObtido += peso;
    bucket.peso += peso;
    porOrgao.set(item.orgao, bucket);
  }

  const total = itens.length;
  const score = total === 0 ? 100 : round1((pesoObtido / total) * 100);
  const totalEntregues = entregues + dispensadas;
  const pontualidade =
    totalEntregues === 0 ? 100 : round1(((totalEntregues - entreguesComAtraso) / totalEntregues) * 100);

  criticos.sort((a, b) => (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0));

  return {
    total,
    entregues,
    dispensadas,
    retificadas,
    entreguesComAtraso,
    vencidasPendentes,
    venceHoje,
    pendentesNoPrazo,
    score,
    nivel: classificarConformidade(score),
    pontualidade,
    multaRegistrada: round2(multaRegistrada),
    porOrgao: [...porOrgao.entries()]
      .map(([orgao, b]) => ({
        orgao,
        total: b.total,
        vencidas: b.vencidas,
        score: b.total === 0 ? 100 : round1((b.peso / b.total) * 100),
      }))
      .sort((a, b) => a.score - b.score || a.orgao.localeCompare(b.orgao)),
    criticos,
  };
}
