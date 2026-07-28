import { describe, it, expect } from "vitest";
import { checkAll, INVARIANTS } from "../invariants";
import type { ScenarioState } from "../types";

function baseState(): ScenarioState {
  return {
    empresaId: "emp-1",
    contas: { saldoInicial: 1000, saldoFinal: 1000 },
    transacoes: [],
    lancamentos: [],
    webhookEvents: [],
    anomalias: [],
    reguaDisparos: [],
    auditLogs: [],
    nfe: { ultimoNsuHistory: [], recebidas: [], eventos: [] },
    entregas: [],
  };

}

describe("invariants", () => {
  it("estado vazio passa em todos", () => {
    expect(checkAll(baseState())).toEqual([]);
  });

  it("detecta duplicidade de transacao_externa_id", () => {
    const s = baseState();
    s.transacoes = [
      { id: "a", transacaoExternaId: "x", valor: 10, conciliada: false },
      { id: "b", transacaoExternaId: "x", valor: 20, conciliada: false },
    ];
    s.contas.saldoFinal = 1030;
    const violations = checkAll(s);
    expect(violations.some((v) => v.invariant === "unicidadeTransacoes")).toBe(true);
  });

  it("detecta violação de conservação de saldo", () => {
    const s = baseState();
    s.transacoes = [
      { id: "a", transacaoExternaId: "x", valor: 100, conciliada: false },
    ];
    s.contas.saldoFinal = 1_000_000;
    expect(INVARIANTS.conservacaoSaldo(s)).not.toBeNull();
  });

  it("detecta regressão de status de anomalia", () => {
    const s = baseState();
    s.anomalias = [
      { id: "a", status: "nova", statusHistory: ["nova", "confirmada", "nova"] },
    ];
    expect(INVARIANTS.monotonicidadeAnomalia(s)).not.toBeNull();
  });

  it("detecta órfão de lançamento", () => {
    const s = baseState();
    s.transacoes = [
      {
        id: "a",
        transacaoExternaId: "x",
        valor: 10,
        conciliada: true,
        lancamentoId: "fantasma",
      },
    ];
    s.contas.saldoFinal = 1010;
    expect(INVARIANTS.semOrfaos(s)).not.toBeNull();
  });

  it("detecta ordem causal invertida (CONFIRMED antes de CREATED)", () => {
    const s = baseState();
    s.webhookEvents = [
      { id: "e1", paymentId: "p1", tipo: "PAYMENT_CONFIRMED", processedAt: 10, invocations: 1 },
      { id: "e2", paymentId: "p1", tipo: "PAYMENT_CREATED", processedAt: 20, invocations: 1 },
    ];
    expect(INVARIANTS.ordemCausalEventos(s)).not.toBeNull();
  });

  it("detecta disparo duplicado de régua", () => {
    const s = baseState();
    s.reguaDisparos = [
      { boletoId: "b1", etapa: "et1", janela: "d1" },
      { boletoId: "b1", etapa: "et1", janela: "d1" },
    ];
    expect(INVARIANTS.reguaSemDuplicidade(s)).not.toBeNull();
  });

  it("detecta transição sem audit_log", () => {
    const s = baseState();
    s.anomalias = [
      { id: "a", status: "confirmada", statusHistory: ["nova", "confirmada"] },
    ];
    // sem auditLogs → deve violar
    expect(INVARIANTS.auditoriaCompleta(s)).not.toBeNull();
  });
});
