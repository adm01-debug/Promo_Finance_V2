/**
 * Utilitários puros do Balancete de Verificação.
 *
 * Toda a agregação pesada acontece no Postgres (`fn_balancete`); aqui ficam
 * apenas transformações de apresentação — determinísticas e testáveis.
 */

export interface BalanceteRow {
  conta_id: string;
  codigo: string;
  nome: string;
  tipo: string;
  natureza: string;
  nivel: number;
  aceita_lancamento: boolean;
  saldo_anterior: number;
  debitos: number;
  creditos: number;
  saldo_final: number;
}

export interface BalanceteTotais {
  /** Soma dos débitos do período (apenas contas analíticas — evita dupla contagem). */
  debitos: number;
  /** Soma dos créditos do período (apenas contas analíticas). */
  creditos: number;
  /** Diferença D-C; deve ser zero em escrituração íntegra. */
  diferenca: number;
  /** Escrituração balanceada dentro da tolerância de 1 centavo. */
  balanceado: boolean;
  /** Soma dos saldos finais devedores (saldo > 0). */
  saldoDevedor: number;
  /** Soma dos saldos finais credores (saldo < 0), em valor absoluto. */
  saldoCredor: number;
  /** Quantidade de contas consideradas na totalização. */
  contas: number;
}

const TOLERANCIA = 0.005;

/** Arredonda para 2 casas evitando erro de ponto flutuante acumulado. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Totaliza apenas as contas analíticas (`aceita_lancamento`), pois as
 * sintéticas já contêm o somatório dos descendentes e duplicariam os valores.
 */
export function computeBalanceteTotais(rows: readonly BalanceteRow[]): BalanceteTotais {
  const analiticas = rows.filter((r) => r.aceita_lancamento);
  let debitos = 0;
  let creditos = 0;
  let saldoDevedor = 0;
  let saldoCredor = 0;

  for (const r of analiticas) {
    debitos += Number(r.debitos) || 0;
    creditos += Number(r.creditos) || 0;
    const saldo = Number(r.saldo_final) || 0;
    if (saldo > 0) saldoDevedor += saldo;
    else if (saldo < 0) saldoCredor += -saldo;
  }

  const diferenca = round2(debitos - creditos);
  return {
    debitos: round2(debitos),
    creditos: round2(creditos),
    diferenca,
    balanceado: Math.abs(diferenca) < TOLERANCIA,
    saldoDevedor: round2(saldoDevedor),
    saldoCredor: round2(saldoCredor),
    contas: analiticas.length,
  };
}

/** Separa um saldo líquido (D-C) nas colunas devedora/credora do balancete. */
export function splitSaldo(saldo: number): { devedor: number; credor: number } {
  const v = Number(saldo) || 0;
  if (v > 0) return { devedor: round2(v), credor: 0 };
  if (v < 0) return { devedor: 0, credor: round2(-v) };
  return { devedor: 0, credor: 0 };
}

export interface BalanceteFilterOptions {
  /** Exibe apenas contas até este nível hierárquico. */
  nivelMax?: number | null;
  /** Oculta contas sem movimento e sem saldo no período. */
  apenasComMovimento?: boolean;
  /** Busca textual por código ou nome. */
  busca?: string;
}

/** Filtro de apresentação aplicado sobre o retorno já consolidado da RPC. */
export function filterBalancete(
  rows: readonly BalanceteRow[],
  { nivelMax, apenasComMovimento, busca }: BalanceteFilterOptions = {},
): BalanceteRow[] {
  const termo = (busca ?? '').trim().toLowerCase();
  return rows.filter((r) => {
    if (nivelMax != null && r.nivel > nivelMax) return false;
    if (apenasComMovimento) {
      const semMovimento =
        Math.abs(r.debitos) < TOLERANCIA &&
        Math.abs(r.creditos) < TOLERANCIA &&
        Math.abs(r.saldo_anterior) < TOLERANCIA &&
        Math.abs(r.saldo_final) < TOLERANCIA;
      if (semMovimento) return false;
    }
    if (termo && !`${r.codigo} ${r.nome}`.toLowerCase().includes(termo)) return false;
    return true;
  });
}
