import { anteciparDiaUtil, isDiaUtil } from './dias-uteis.ts';
import { parsePeriodo, round2 } from './dias-uteis.ts';
import { OBRIGACOES, buscarObrigacao } from './catalogo.ts';
import type {
  AjusteDiaNaoUtil,
  ItemCalendario,
  MultaAtraso,
  Obrigacao,
  RegimeAplicavel,
  SituacaoObrigacao,
} from './types.ts';

const MS_DIA = 86_400_000;

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Posterga a data para o próximo dia útil, se necessário. */
export function postergarDiaUtil(data: Date): Date {
  const d = new Date(data.getTime());
  let guard = 0;
  while (!isDiaUtil(d) && guard < 30) {
    d.setUTCDate(d.getUTCDate() + 1);
    guard += 1;
  }
  return d;
}

function ajustar(data: Date, ajuste: AjusteDiaNaoUtil): Date {
  return ajuste === 'antecipa' ? anteciparDiaUtil(data) : postergarDiaUtil(data);
}

/** Retorna o N-ésimo dia útil (1-based) de um mês em UTC. */
export function enesimoDiaUtil(ano: number, mes: number, n: number): Date {
  if (n < 1) throw new Error(`N-ésimo dia útil inválido: ${n}`);
  const d = new Date(Date.UTC(ano, mes - 1, 1));
  let contador = 0;
  let guard = 0;
  while (guard < 62) {
    if (isDiaUtil(d)) {
      contador += 1;
      if (contador === n) return new Date(d.getTime());
    }
    d.setUTCDate(d.getUTCDate() + 1);
    guard += 1;
  }
  // Fallback defensivo: mês sem N dias úteis → último dia útil do mês.
  return anteciparDiaUtil(new Date(Date.UTC(ano, mes, 0)));
}

/** Último dia útil do mês informado (mes 1-12). */
export function ultimoDiaUtil(ano: number, mes: number): Date {
  return anteciparDiaUtil(new Date(Date.UTC(ano, mes, 0)));
}

/**
 * Calcula o prazo legal de entrega de uma obrigação.
 * @param obrigacao definição do catálogo
 * @param competencia "AAAA-MM" (mensais/trimestrais) ou "AAAA" (anuais)
 */
export function calcularPrazo(obrigacao: Obrigacao, competencia: string): string {
  const regra = obrigacao.regra;

  if (regra.tipo === 'dia_fixo_anual') {
    const ano = Number(/^(\d{4})/.exec(competencia.trim())?.[1]);
    if (!Number.isFinite(ano)) throw new Error(`Exercício inválido: "${competencia}"`);
    return toISO(ultimoDiaUtil(ano + 1, regra.mes));
  }

  const [ano, mes] = parsePeriodo(competencia);
  const alvoMes = mes + regra.mesesApos; // 1-based, pode extrapolar 12
  const anoAlvo = ano + Math.floor((alvoMes - 1) / 12);
  const mesAlvo = ((alvoMes - 1) % 12) + 1;

  if (regra.tipo === 'enesimo_dia_util') return toISO(enesimoDiaUtil(anoAlvo, mesAlvo, regra.n));
  if (regra.tipo === 'ultimo_dia_util') return toISO(ultimoDiaUtil(anoAlvo, mesAlvo));

  const ultimoDiaMes = new Date(Date.UTC(anoAlvo, mesAlvo, 0)).getUTCDate();
  const dia = Math.min(regra.dia, ultimoDiaMes);
  return toISO(ajustar(new Date(Date.UTC(anoAlvo, mesAlvo - 1, dia)), obrigacao.ajuste));
}

function diasEntre(deISO: string, ateISO: string): number {
  const a = Date.parse(`${deISO}T00:00:00Z`);
  const b = Date.parse(`${ateISO}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.round((b - a) / MS_DIA);
}

function situacaoDe(prazo: string, hoje: string, entregue: boolean): SituacaoObrigacao {
  if (entregue) return 'entregue';
  const dias = diasEntre(hoje, prazo);
  if (dias < 0) return 'vencida';
  if (dias === 0) return 'vence_hoje';
  return dias <= 7 ? 'proxima' : 'futura';
}

export interface GerarCalendarioParams {
  /** Competências mensais no formato AAAA-MM. */
  readonly competencias: readonly string[];
  /** Regime da empresa; 'todos' inclui o catálogo inteiro. */
  readonly regime: RegimeAplicavel;
  /** Data de referência ISO (AAAA-DD-MM inválido é ignorado). */
  readonly hoje: string;
  /** Chaves "obrigacaoId:competencia" já entregues. */
  readonly entregues?: ReadonlySet<string>;
  /** Restringe a determinadas obrigações. */
  readonly somente?: readonly string[];
}

/** Chave canônica de um item do calendário. */
export function chaveItem(obrigacaoId: string, competencia: string): string {
  return `${obrigacaoId}:${competencia}`;
}

/**
 * Materializa o calendário fiscal para as competências informadas.
 * Obrigações anuais são emitidas uma única vez por exercício (competência AAAA).
 */
export function gerarCalendario(params: GerarCalendarioParams): ItemCalendario[] {
  const { competencias, regime, hoje, entregues, somente } = params;
  const filtro = somente ? new Set(somente) : null;
  const itens: ItemCalendario[] = [];
  const vistos = new Set<string>();

  for (const obrigacao of OBRIGACOES) {
    if (filtro && !filtro.has(obrigacao.id)) continue;
    const aplicavel =
      regime === 'todos' ||
      obrigacao.regimes.includes('todos') ||
      obrigacao.regimes.includes(regime);
    if (!aplicavel) continue;

    for (const competencia of competencias) {
      if (!/^\d{4}-\d{2}$/.test(competencia)) continue;
      const chaveComp =
        obrigacao.periodicidade === 'anual' ? competencia.slice(0, 4) : competencia;
      const chave = chaveItem(obrigacao.id, chaveComp);
      if (vistos.has(chave)) continue;
      vistos.add(chave);

      const prazo = calcularPrazo(obrigacao, chaveComp);
      itens.push({
        obrigacaoId: obrigacao.id,
        nome: obrigacao.nome,
        orgao: obrigacao.orgao,
        competencia: chaveComp,
        prazo,
        situacao: situacaoDe(prazo, hoje, entregues?.has(chave) ?? false),
        diasRestantes: diasEntre(hoje, prazo),
        baseLegal: obrigacao.baseLegal,
      });
    }
  }

  return itens.sort((a, b) => (a.prazo === b.prazo ? a.nome.localeCompare(b.nome) : a.prazo < b.prazo ? -1 : 1));
}

/**
 * Multa por entrega em atraso.
 * A contagem é por mês-calendário ou fração, conforme art. 57 da MP 2.158-35/2001
 * e art. 12 da Lei 8.218/91 — sempre respeitando piso e teto da obrigação.
 */
export function calcularMultaAtraso(params: {
  readonly obrigacaoId: string;
  readonly prazo: string;
  readonly dataEntrega: string;
  /** Faturamento do período ou tributos declarados, conforme a base da obrigação. */
  readonly baseCalculo?: number;
}): MultaAtraso {
  const obrigacao = buscarObrigacao(params.obrigacaoId);
  if (!obrigacao) throw new Error(`Obrigação desconhecida: ${params.obrigacaoId}`);

  const diasAtraso = Math.max(0, diasEntre(params.prazo, params.dataEntrega));
  if (diasAtraso === 0) {
    return {
      diasAtraso: 0,
      mesesAtraso: 0,
      percentual: 0,
      valorCalculado: 0,
      valorDevido: 0,
      aplicouPiso: false,
      aplicouTeto: false,
    };
  }

  const mesesAtraso = Math.ceil(diasAtraso / 30);
  const base = Math.max(0, params.baseCalculo ?? 0);

  if (obrigacao.baseMulta === 'fixa' || obrigacao.multaMensal === 0) {
    return {
      diasAtraso,
      mesesAtraso,
      percentual: 0,
      valorCalculado: obrigacao.multaMinima,
      valorDevido: obrigacao.multaMinima,
      aplicouPiso: true,
      aplicouTeto: false,
    };
  }

  const bruto = mesesAtraso * obrigacao.multaMensal;
  const aplicouTeto = bruto > obrigacao.multaTeto;
  const percentual = aplicouTeto ? obrigacao.multaTeto : bruto;
  const valorCalculado = round2(base * percentual);
  const aplicouPiso = valorCalculado < obrigacao.multaMinima;

  return {
    diasAtraso,
    mesesAtraso,
    percentual,
    valorCalculado,
    valorDevido: round2(aplicouPiso ? obrigacao.multaMinima : valorCalculado),
    aplicouPiso,
    aplicouTeto,
  };
}

/** Gera as N competências mensais anteriores/posteriores a partir de uma base. */
export function competenciasAoRedor(base: string, antes: number, depois: number): string[] {
  const [ano, mes] = parsePeriodo(base);
  const out: string[] = [];
  for (let i = -antes; i <= depois; i += 1) {
    const total = ano * 12 + (mes - 1) + i;
    const a = Math.floor(total / 12);
    const m = (total % 12) + 1;
    out.push(`${String(a).padStart(4, '0')}-${String(m).padStart(2, '0')}`);
  }
  return out;
}

/** Exporta o calendário em CSV para auditoria. */
export function exportarCalendarioCsv(itens: readonly ItemCalendario[]): string {
  const head = 'obrigacao;orgao;competencia;prazo;situacao;dias_restantes;base_legal';
  const linhas = itens.map((i) =>
    [i.nome, i.orgao, i.competencia, i.prazo, i.situacao, i.diasRestantes, i.baseLegal]
      .map((c) => String(c).replace(/;/g, ','))
      .join(';'),
  );
  return [head, ...linhas].join('\n');
}
