import { createRng } from "./rng";
import { duplicate, reorder, shouldFail } from "./faults";
import {
  makeExtrato,
  makeLancamentos,
  type ExtratoLinha,
  type LancamentoFixture,
} from "./fixtures/conciliacao";
import { makeWebhookStream, type WebhookEvent } from "./fixtures/webhooks";
import { makeBoletos, makeReguaEtapas } from "./fixtures/cobranca";
import { makeAnomalias, makeAcoes } from "./fixtures/anomalias";
import { checkAll } from "./invariants";
import type { ScenarioResult, ScenarioSpec, ScenarioState } from "./types";

function emptyState(): ScenarioState {
  return {
    empresaId: "emp-1",
    contas: { saldoInicial: 10_000, saldoFinal: 10_000 },
    transacoes: [],
    lancamentos: [],
    webhookEvents: [],
    anomalias: [],
    reguaDisparos: [],
    auditLogs: [],
  };
}

function runConciliacao(spec: ScenarioSpec, state: ScenarioState): number {
  const rng = createRng(spec.seed);
  const extrato: ExtratoLinha[] = makeExtrato(rng, spec.size);
  const lancs: LancamentoFixture[] = makeLancamentos(rng, extrato);
  let mutations = 0;

  state.lancamentos = lancs.map((l) => ({ id: l.id, tipo: l.tipo, valor: l.valor }));

  const seenExt = new Set<string>();
  for (let i = 0; i < extrato.length; i++) {
    const tx = extrato[i];
    const fail = shouldFail(spec.fault, rng, i);
    if (fail) continue; // falha na mutação: transação NÃO entra no banco (invariantes seguem válidos)

    // Idempotência por transacao_externa_id
    if (seenExt.has(tx.transacaoExternaId)) continue;
    seenExt.add(tx.transacaoExternaId);

    // Match determinístico: mesmo índice e mesmo valor absoluto
    const lanc = lancs.find(
      (l) => Math.abs(l.valor - Math.abs(tx.valor)) < 0.01 && l.data === tx.data,
    );

    state.transacoes.push({
      id: tx.id,
      transacaoExternaId: tx.transacaoExternaId,
      valor: tx.valor,
      conciliada: !!lanc,
      lancamentoId: lanc?.id,
    });
    mutations++;
  }

  // Atualiza saldo respeitando conservação
  const soma = state.transacoes.reduce((acc, t) => acc + t.valor, 0);
  state.contas.saldoFinal = Number((state.contas.saldoInicial + soma).toFixed(2));
  return mutations;
}

function runWebhooks(spec: ScenarioSpec, state: ScenarioState): number {
  const rng = createRng(spec.seed);
  let stream: WebhookEvent[] = makeWebhookStream(rng, spec.size);

  if (spec.fault.kind === "reorder") stream = reorder(stream, rng);
  if (spec.fault.kind === "duplicate") {
    stream = duplicate(stream, spec.fault.param ?? 3, rng);
  }

  // Fila de "eventos pendentes" + reprocessamento ordenado por ts (correção causal).
  const processedIds = new Map<string, number>(); // eventId -> invocations efetivas
  const finalEvents = new Map<
    string,
    { paymentId: string; tipo: WebhookEvent["tipo"]; ts: number }
  >();
  let mutations = 0;

  for (let i = 0; i < stream.length; i++) {
    const evt = stream[i];
    const fail = shouldFail(spec.fault, rng, i);
    if (fail) continue;

    // Idempotência: se já processamos este eventId, ignora (não conta invocação efetiva).
    if (processedIds.has(evt.eventId)) continue;
    processedIds.set(evt.eventId, 1);
    finalEvents.set(evt.eventId, { paymentId: evt.paymentId, tipo: evt.tipo, ts: evt.ts });
    mutations++;
  }

  // Ordenação causal: processedAt segue ts do evento (garante CREATED antes de CONFIRMED).
  state.webhookEvents = Array.from(finalEvents.entries()).map(([id, e]) => ({
    id,
    paymentId: e.paymentId,
    tipo: e.tipo,
    processedAt: e.ts,
    invocations: 1,
  }));

  return mutations;
}

function runCobranca(spec: ScenarioSpec, state: ScenarioState): number {
  const rng = createRng(spec.seed);
  const boletos = makeBoletos(rng, spec.size);
  const etapas = makeReguaEtapas();
  const janela = "2026-07-22";
  const disparados = new Set<string>();
  let mutations = 0;

  for (let i = 0; i < boletos.length; i++) {
    const b = boletos[i];
    if (b.status !== "vencido") continue;
    for (const et of etapas) {
      const fail = shouldFail(spec.fault, rng, i * etapas.length);
      if (fail) continue;
      const k = `${b.id}::${et.id}::${janela}`;
      if (disparados.has(k)) continue;
      disparados.add(k);
      state.reguaDisparos.push({ boletoId: b.id, etapa: et.id, janela });
      mutations++;
    }
  }
  return mutations;
}

function runAnomalias(spec: ScenarioSpec, state: ScenarioState): number {
  const rng = createRng(spec.seed);
  const anomalias = makeAnomalias(rng, spec.size);
  const acoes = makeAcoes(rng, spec.size);
  let mutations = 0;

  state.anomalias = anomalias.map((a) => ({
    id: a.id,
    status: "nova",
    statusHistory: ["nova"],
  }));

  for (let i = 0; i < anomalias.length; i++) {
    const acao = acoes[i];
    if (acao === "pular") continue;
    const fail = shouldFail(spec.fault, rng, i);
    if (fail) continue;

    const a = state.anomalias[i];
    // Monotonicidade: só transita se estado atual for 'nova'
    if (a.status !== "nova") continue;

    const novo = acao === "confirmar" ? "confirmada" : "falso_positivo";
    const de = a.status;
    a.status = novo;
    a.statusHistory.push(novo);
    state.auditLogs.push({ entidade: "anomalia", entidadeId: a.id, de, para: novo });
    mutations++;
  }
  return mutations;
}

export function runScenario(spec: ScenarioSpec): ScenarioResult {
  const state = emptyState();
  const t0 =
    typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

  let mutations = 0;
  switch (spec.domain) {
    case "conciliacao":
      mutations = runConciliacao(spec, state);
      break;
    case "webhooks":
      mutations = runWebhooks(spec, state);
      break;
    case "cobranca":
      mutations = runCobranca(spec, state);
      break;
    case "anomalias":
      mutations = runAnomalias(spec, state);
      break;
  }

  const violations = checkAll(state);
  const t1 =
    typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

  return { spec, durationMs: t1 - t0, mutations, violations };
}
