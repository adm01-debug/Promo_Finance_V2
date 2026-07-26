/**
 * Etapa N — Motor de alertas automáticos sobre o histórico de conformidade.
 *
 * Funções 100% puras: recebem a série temporal já materializada
 * (`PontoHistorico[]`) e devolvem os alertas que devem existir naquele
 * instante. Nenhum I/O, nenhuma leitura de relógio e nenhuma dependência de
 * React — o mesmo código roda no frontend (pré-visualização) e no cron
 * (persistência em `alertas_tributarios`).
 *
 * Decisões de projeto:
 * - Cada alerta carrega uma `chave` determinística (`tipo:competencia`) para
 *   deduplicação idempotente no banco: reprocessar a mesma competência não
 *   duplica registros.
 * - Os limiares são parametrizáveis, mas têm defaults conservadores alinhados
 *   à classificação de conformidade já existente (`classificarConformidade`).
 * - A ausência de dados nunca gera alerta: sem série não há afirmação possível.
 */
import type { PontoHistorico } from './historico.ts';

/** Tipos de alerta emitidos pelo motor. */
export type TipoAlertaConformidade =
  | 'score_baixo'
  | 'queda_abrupta'
  | 'tendencia_negativa'
  | 'obrigacoes_vencidas'
  | 'multa_acumulada';

/** Severidade normalizada, compatível com a coluna `prioridade`. */
export type SeveridadeAlerta = 'baixa' | 'media' | 'alta' | 'critica';

/** Alerta derivado do histórico de conformidade. */
export interface AlertaConformidade {
  /** Chave determinística para deduplicação (`tipo:competencia`). */
  readonly chave: string;
  readonly tipo: TipoAlertaConformidade;
  readonly severidade: SeveridadeAlerta;
  /** Competência de referência (`AAAA-MM`). */
  readonly competencia: string;
  readonly titulo: string;
  readonly mensagem: string;
  /** Valor monetário associado, quando houver (multas). */
  readonly valor: number | null;
}

/** Limiares configuráveis do motor. */
export interface ConfigAlertasConformidade {
  /** Score abaixo do qual um alerta é emitido. Default 85. */
  readonly scoreMinimo: number;
  /** Score abaixo do qual o alerta vira crítico. Default 60. */
  readonly scoreCritico: number;
  /** Queda mínima (em pontos) contra a competência anterior. Default 10. */
  readonly quedaMinima: number;
  /** Nº de quedas consecutivas que caracteriza tendência negativa. Default 3. */
  readonly quedasConsecutivas: number;
  /** Multa acumulada (R$) na janela que dispara alerta. Default 1000. */
  readonly multaLimite: number;
  /** Janela (nº de competências finais) considerada para multas. Default 6. */
  readonly janelaMulta: number;
}

export const CONFIG_ALERTAS_PADRAO: ConfigAlertasConformidade = {
  scoreMinimo: 85,
  scoreCritico: 60,
  quedaMinima: 10,
  quedasConsecutivas: 3,
  multaLimite: 1000,
  janelaMulta: 6,
};

const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

const brl = (v: number) =>
  `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const rotulo = (competencia: string) => {
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano}`;
};

/** Ordem de gravidade usada para ordenar a saída (mais grave primeiro). */
const PESO_SEVERIDADE: Record<SeveridadeAlerta, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

function normalizarConfig(parcial?: Partial<ConfigAlertasConformidade>): ConfigAlertasConformidade {
  const c = { ...CONFIG_ALERTAS_PADRAO, ...(parcial ?? {}) };
  // Defesa contra configuração incoerente vinda de UI/banco.
  const scoreMinimo = Math.min(100, Math.max(0, c.scoreMinimo));
  const scoreCritico = Math.min(scoreMinimo, Math.max(0, c.scoreCritico));
  return {
    scoreMinimo,
    scoreCritico,
    quedaMinima: Math.max(0.1, c.quedaMinima),
    quedasConsecutivas: Math.max(2, Math.trunc(c.quedasConsecutivas)),
    multaLimite: Math.max(0, c.multaLimite),
    janelaMulta: Math.max(1, Math.trunc(c.janelaMulta)),
  };
}

/**
 * Avalia a série e devolve os alertas vigentes para a competência mais recente.
 *
 * A série deve estar em ordem cronológica crescente; entradas fora de ordem são
 * reordenadas defensivamente para não gerar falsos positivos de queda.
 */
export function avaliarAlertasConformidade(
  serie: readonly PontoHistorico[],
  configParcial?: Partial<ConfigAlertasConformidade>,
): AlertaConformidade[] {
  if (serie.length === 0) return [];

  const config = normalizarConfig(configParcial);
  const pontos = [...serie].sort((a, b) => (a.competencia < b.competencia ? -1 : 1));
  const atual = pontos[pontos.length - 1];
  const anterior = pontos.length > 1 ? pontos[pontos.length - 2] : null;
  const alertas: AlertaConformidade[] = [];

  // 1) Score abaixo do mínimo aceitável.
  if (atual.score < config.scoreMinimo) {
    const critico = atual.score < config.scoreCritico;
    alertas.push({
      chave: `score_baixo:${atual.competencia}`,
      tipo: 'score_baixo',
      severidade: critico ? 'critica' : 'alta',
      competencia: atual.competencia,
      titulo: `Conformidade fiscal ${critico ? 'crítica' : 'abaixo do mínimo'} em ${rotulo(atual.competencia)}`,
      mensagem:
        `O score de conformidade ficou em ${round1(atual.score).toFixed(1)} pontos, ` +
        `abaixo do mínimo de ${config.scoreMinimo}. ` +
        `${atual.vencidasPendentes} obrigação(ões) vencida(s) sem entrega e ` +
        `${atual.entreguesComAtraso} entregue(s) com atraso.`,
      valor: null,
    });
  }

  // 2) Queda abrupta contra a competência anterior.
  if (anterior) {
    const queda = round1(anterior.score - atual.score);
    if (queda >= config.quedaMinima) {
      alertas.push({
        chave: `queda_abrupta:${atual.competencia}`,
        tipo: 'queda_abrupta',
        severidade: queda >= config.quedaMinima * 2 ? 'alta' : 'media',
        competencia: atual.competencia,
        titulo: `Queda de ${queda.toFixed(1)} pontos na conformidade`,
        mensagem:
          `O score caiu de ${round1(anterior.score).toFixed(1)} (${rotulo(anterior.competencia)}) ` +
          `para ${round1(atual.score).toFixed(1)} (${rotulo(atual.competencia)}).`,
        valor: null,
      });
    }
  }

  // 3) Tendência negativa: N quedas consecutivas (mesmo que pequenas).
  let quedas = 0;
  for (let i = pontos.length - 1; i > 0; i -= 1) {
    if (pontos[i].score < pontos[i - 1].score) quedas += 1;
    else break;
  }
  if (quedas >= config.quedasConsecutivas) {
    alertas.push({
      chave: `tendencia_negativa:${atual.competencia}`,
      tipo: 'tendencia_negativa',
      severidade: 'media',
      competencia: atual.competencia,
      titulo: `Tendência negativa: ${quedas} competências consecutivas em queda`,
      mensagem:
        `A conformidade recua desde ${rotulo(pontos[pontos.length - 1 - quedas].competencia)}, ` +
        `acumulando ${round1(pontos[pontos.length - 1 - quedas].score - atual.score).toFixed(1)} pontos de perda.`,
      valor: null,
    });
  }

  // 4) Obrigações vencidas pendentes na competência atual.
  if (atual.vencidasPendentes > 0) {
    alertas.push({
      chave: `obrigacoes_vencidas:${atual.competencia}`,
      tipo: 'obrigacoes_vencidas',
      severidade: atual.vencidasPendentes >= 3 ? 'critica' : 'alta',
      competencia: atual.competencia,
      titulo: `${atual.vencidasPendentes} obrigação(ões) vencida(s) em ${rotulo(atual.competencia)}`,
      mensagem:
        `Existem ${atual.vencidasPendentes} obrigação(ões) com prazo legal expirado e sem entrega ` +
        `registrada, de um total de ${atual.total} previstas na competência.`,
      valor: null,
    });
  }

  // 5) Multa acumulada na janela recente.
  const janela = pontos.slice(-config.janelaMulta);
  const multa = round2(janela.reduce((acc, p) => acc + p.multaRegistrada, 0));
  if (multa >= config.multaLimite && multa > 0) {
    alertas.push({
      chave: `multa_acumulada:${atual.competencia}`,
      tipo: 'multa_acumulada',
      severidade: multa >= config.multaLimite * 3 ? 'alta' : 'media',
      competencia: atual.competencia,
      titulo: `Multas acumuladas de ${brl(multa)} nas últimas ${janela.length} competências`,
      mensagem:
        `O custo de não conformidade registrado entre ${rotulo(janela[0].competencia)} e ` +
        `${rotulo(atual.competencia)} soma ${brl(multa)}.`,
      valor: multa,
    });
  }

  return alertas.sort(
    (a, b) => PESO_SEVERIDADE[a.severidade] - PESO_SEVERIDADE[b.severidade] || a.tipo.localeCompare(b.tipo),
  );
}

/** Severidade máxima presente em uma lista de alertas (`null` se vazia). */
export function severidadeMaxima(alertas: readonly AlertaConformidade[]): SeveridadeAlerta | null {
  if (alertas.length === 0) return null;
  return alertas.reduce<SeveridadeAlerta>(
    (pior, a) => (PESO_SEVERIDADE[a.severidade] < PESO_SEVERIDADE[pior] ? a.severidade : pior),
    'baixa',
  );
}
