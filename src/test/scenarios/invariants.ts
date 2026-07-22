import type { InvariantViolation, ScenarioState } from "./types";

type InvariantFn = (state: ScenarioState) => InvariantViolation | null;

const idempotencyWebhook: InvariantFn = (state) => {
  const seen = new Map<string, number>();
  for (const e of state.webhookEvents) {
    seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
  }
  // Cada event_id deve resultar em exatamente 1 invocação efetiva.
  for (const e of state.webhookEvents) {
    if (e.invocations !== 1) {
      return {
        invariant: "idempotencyWebhook",
        message: `event ${e.id} teve ${e.invocations} invocações efetivas (esperado 1)`,
      };
    }
  }
  return null;
};

const unicidadeTransacoes: InvariantFn = (state) => {
  const chaves = new Set<string>();
  for (const t of state.transacoes) {
    const chave = `${state.empresaId}::${t.transacaoExternaId}`;
    if (chaves.has(chave)) {
      return {
        invariant: "unicidadeTransacoes",
        message: `duplicidade de (empresa_id, transacao_externa_id) = ${chave}`,
      };
    }
    chaves.add(chave);
  }
  return null;
};

const monotonicidadeAnomalia: InvariantFn = (state) => {
  for (const a of state.anomalias) {
    const idxFinal = a.statusHistory.findIndex(
      (s) => s === "confirmada" || s === "falso_positivo",
    );
    if (idxFinal >= 0) {
      const depois = a.statusHistory.slice(idxFinal + 1);
      if (depois.includes("nova")) {
        return {
          invariant: "monotonicidadeAnomalia",
          message: `anomalia ${a.id} regrediu para 'nova' após estado final`,
          details: a.statusHistory,
        };
      }
    }
  }
  return null;
};

const conservacaoSaldo: InvariantFn = (state) => {
  const soma = state.transacoes.reduce((acc, t) => acc + t.valor, 0);
  const esperado = state.contas.saldoInicial + soma;
  if (Math.abs(state.contas.saldoFinal - esperado) > 0.01) {
    return {
      invariant: "conservacaoSaldo",
      message: `saldo_final ${state.contas.saldoFinal} != esperado ${esperado.toFixed(2)}`,
    };
  }
  return null;
};

const contagemConciliada: InvariantFn = (state) => {
  const conciliadas = state.transacoes.filter((t) => t.conciliada).length;
  const pendentes = state.transacoes.length - conciliadas;
  if (conciliadas < 0 || pendentes < 0) {
    return { invariant: "contagemConciliada", message: "contagem negativa" };
  }
  if (conciliadas + pendentes !== state.transacoes.length) {
    return { invariant: "contagemConciliada", message: "conciliadas + pendentes != total" };
  }
  return null;
};

const semOrfaos: InvariantFn = (state) => {
  const lancIds = new Set(state.lancamentos.map((l) => l.id));
  for (const t of state.transacoes) {
    if (t.conciliada && t.lancamentoId && !lancIds.has(t.lancamentoId)) {
      return {
        invariant: "semOrfaos",
        message: `transação ${t.id} conciliada com lançamento inexistente ${t.lancamentoId}`,
      };
    }
  }
  return null;
};

const ordemCausalEventos: InvariantFn = (state) => {
  const porPayment = new Map<string, typeof state.webhookEvents>();
  for (const e of state.webhookEvents) {
    const arr = porPayment.get(e.paymentId) ?? [];
    arr.push(e);
    porPayment.set(e.paymentId, arr);
  }
  for (const [paymentId, events] of porPayment) {
    const ordenados = events.slice().sort((a, b) => a.processedAt - b.processedAt);
    const created = ordenados.findIndex((e) => e.tipo === "PAYMENT_CREATED");
    const confirmed = ordenados.findIndex((e) => e.tipo === "PAYMENT_CONFIRMED");
    if (created >= 0 && confirmed >= 0 && created > confirmed) {
      return {
        invariant: "ordemCausalEventos",
        message: `payment ${paymentId}: CONFIRMED processado antes de CREATED`,
      };
    }
  }
  return null;
};

const reguaSemDuplicidade: InvariantFn = (state) => {
  const chaves = new Set<string>();
  for (const d of state.reguaDisparos) {
    const k = `${d.boletoId}::${d.etapa}::${d.janela}`;
    if (chaves.has(k)) {
      return { invariant: "reguaSemDuplicidade", message: `disparo duplicado: ${k}` };
    }
    chaves.add(k);
  }
  return null;
};

const auditoriaCompleta: InvariantFn = (state) => {
  // toda transição em statusHistory (exceto o estado inicial) deve gerar exatamente 1 audit_log
  for (const a of state.anomalias) {
    const transicoes = a.statusHistory.length - 1;
    const logs = state.auditLogs.filter(
      (l) => l.entidade === "anomalia" && l.entidadeId === a.id,
    ).length;
    if (transicoes !== logs) {
      return {
        invariant: "auditoriaCompleta",
        message: `anomalia ${a.id}: ${transicoes} transições vs ${logs} audit_logs`,
      };
    }
  }
  return null;
};

const nfeIdempotenciaChave: InvariantFn = (state) => {
  const seen = new Set<string>();
  for (const r of state.nfe?.recebidas ?? []) {
    if (seen.has(r.chaveAcesso)) {
      return {
        invariant: "nfeIdempotenciaChave",
        message: `chave_acesso duplicada: ${r.chaveAcesso}`,
      };
    }
    seen.add(r.chaveAcesso);
  }
  return null;
};

const nfeMonotonicidadeNsu: InvariantFn = (state) => {
  const hist = state.nfe?.ultimoNsuHistory ?? [];
  for (let i = 1; i < hist.length; i++) {
    if (hist[i] < hist[i - 1]) {
      return {
        invariant: "nfeMonotonicidadeNsu",
        message: `ultimo_nsu regrediu: ${hist[i - 1]} → ${hist[i]}`,
      };
    }
  }
  return null;
};

const nfeSemOrfaosEventos: InvariantFn = (state) => {
  const chaves = new Set((state.nfe?.recebidas ?? []).map((r) => r.chaveAcesso));
  for (const e of state.nfe?.eventos ?? []) {
    if (!chaves.has(e.chaveAcesso)) {
      return {
        invariant: "nfeSemOrfaosEventos",
        message: `evento ${e.id} sem NF-e pai (chave=${e.chaveAcesso})`,
      };
    }
  }
  return null;
};

const nfeCursorNaoRegride: InvariantFn = (state) => {
  const nsus = (state.nfe?.recebidas ?? []).map((r) => r.nsu);
  for (let i = 1; i < nsus.length; i++) {
    if (nsus[i] < nsus[i - 1]) {
      return {
        invariant: "nfeCursorNaoRegride",
        message: `NSU processado fora de ordem: ${nsus[i - 1]} → ${nsus[i]}`,
      };
    }
  }
  return null;
};

const nfeManifestacaoValida: InvariantFn = (state) => {
  const validTransitions: Record<string, string[]> = {
    pendente: ["ciencia", "confirmada", "desconhecida", "nao_realizada"],
    ciencia: ["confirmada", "desconhecida", "nao_realizada"],
    confirmada: [],
    desconhecida: [],
    nao_realizada: [],
  };
  for (const r of state.nfe?.recebidas ?? []) {
    const h = r.manifestacaoHistory;
    for (let i = 1; i < h.length; i++) {
      const allowed = validTransitions[h[i - 1]] ?? [];
      if (!allowed.includes(h[i])) {
        return {
          invariant: "nfeManifestacaoValida",
          message: `transição inválida ${h[i - 1]} → ${h[i]} em ${r.chaveAcesso}`,
        };
      }
    }
  }
  return null;
};

export const INVARIANTS: Record<string, InvariantFn> = {
  idempotencyWebhook,
  unicidadeTransacoes,
  monotonicidadeAnomalia,
  conservacaoSaldo,
  contagemConciliada,
  semOrfaos,
  ordemCausalEventos,
  reguaSemDuplicidade,
  auditoriaCompleta,
  nfeIdempotenciaChave,
  nfeMonotonicidadeNsu,
  nfeSemOrfaosEventos,
  nfeCursorNaoRegride,
  nfeManifestacaoValida,
};

export function checkAll(state: ScenarioState): InvariantViolation[] {
  const out: InvariantViolation[] = [];
  for (const [name, fn] of Object.entries(INVARIANTS)) {
    const v = fn(state);
    if (v) out.push({ ...v, invariant: name });
  }
  return out;
}
