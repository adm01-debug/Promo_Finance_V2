/**
 * Testes de regressão para deduplicação de notificações de filtros salvos.
 *
 * Cobertura:
 *  - Set in-memory bloqueia disparo duplicado dentro da mesma sessão.
 *  - Após "refresh" (Set vazio), `last_seen_at` continua bloqueando eventos
 *    antigos — garantia de que recarregar a aba não gera notificação repetida.
 *  - Eventos novos pós-refresh passam normalmente.
 *  - Clamp anti-spam corresponde aos limites do trigger no banco (1..100 / 1..1440).
 */
import { describe, it, expect } from "vitest";
import { checkShouldDispatch, clampRateLimit } from "../savedFilterDedup";

describe("savedFilterDedup > checkShouldDispatch", () => {
  it("aceita evento novo nunca visto", () => {
    const r = checkShouldDispatch({
      rowId: "row-1",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: new Set(),
    });
    expect(r.shouldDispatch).toBe(true);
    expect(r.reason).toBeNull();
  });

  it("rejeita duplicata in-session via Set", () => {
    const seen = new Set(["row-1"]);
    const r = checkShouldDispatch({
      rowId: "row-1",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen,
    });
    expect(r.shouldDispatch).toBe(false);
    expect(r.reason).toBe("duplicate_in_session");
  });

  it("rejeita evento mais antigo ou igual ao last_seen_at (cross-refresh)", () => {
    // Cenário: usuário recebeu notificação ontem, deu refresh hoje.
    // Set está vazio, mas last_seen_at no banco bloqueia o re-disparo.
    const r = checkShouldDispatch({
      rowId: "row-antigo",
      rowTimestamp: "2026-01-14T08:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: new Set(),
    });
    expect(r.shouldDispatch).toBe(false);
    expect(r.reason).toBe("older_than_last_seen");
  });

  it("rejeita evento com timestamp exatamente igual ao last_seen_at", () => {
    // Limite inclusivo evita a janela de 1ms onde poderia repetir.
    const ts = "2026-01-15T09:00:00Z";
    const r = checkShouldDispatch({
      rowId: "row-edge",
      rowTimestamp: ts,
      lastSeenAt: ts,
      seen: new Set(),
    });
    expect(r.shouldDispatch).toBe(false);
    expect(r.reason).toBe("older_than_last_seen");
  });

  it("simulação de refresh: eventos antigos rejeitados, novos passam", () => {
    // Sessão 1: vê row-A em 10h, marca last_seen_at = 10h.
    const session1Seen = new Set<string>();
    const r1 = checkShouldDispatch({
      rowId: "row-A",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: session1Seen,
    });
    expect(r1.shouldDispatch).toBe(true);
    session1Seen.add("row-A"); // chamador adiciona após despachar

    // Refresh — Set zerado, last_seen_at agora é 10h (atualizado no banco).
    const session2Seen = new Set<string>();
    const lastSeenPostMark = "2026-01-15T10:00:00Z";

    // Re-entrega de row-A pelo realtime: deve ser rejeitado por timestamp.
    const r2 = checkShouldDispatch({
      rowId: "row-A",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: lastSeenPostMark,
      seen: session2Seen,
    });
    expect(r2.shouldDispatch).toBe(false);
    expect(r2.reason).toBe("older_than_last_seen");

    // Mas um evento novo (row-B em 11h) passa normalmente.
    const r3 = checkShouldDispatch({
      rowId: "row-B",
      rowTimestamp: "2026-01-15T11:00:00Z",
      lastSeenAt: lastSeenPostMark,
      seen: session2Seen,
    });
    expect(r3.shouldDispatch).toBe(true);
  });

  it("aceita timestamps em ms", () => {
    const r = checkShouldDispatch({
      rowId: "row-num",
      rowTimestamp: 2_000,
      lastSeenAt: 1_000,
      seen: new Set(),
    });
    expect(r.shouldDispatch).toBe(true);
  });

  // ----- Defesa de permissão (assinatura órfã / cross-user) -----
  it("rejeita quando subscription pertence a outro usuário (permissão revogada)", () => {
    // Cenário: trigger fn_revoke_orphan_saved_filter_subscriptions já apagou
    // a assinatura no banco, mas o cliente ainda tem o snapshot antigo em
    // cache. A guarda no helper bloqueia o disparo silenciosamente.
    const r = checkShouldDispatch({
      rowId: "row-X",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: new Set(),
      subscriptionUserId: "user-other",
      currentUserId: "user-me",
    });
    expect(r.shouldDispatch).toBe(false);
    expect(r.reason).toBe("permission_revoked");
  });

  it("aceita quando subscription bate com o usuário logado", () => {
    const r = checkShouldDispatch({
      rowId: "row-Y",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: new Set(),
      subscriptionUserId: "user-me",
      currentUserId: "user-me",
    });
    expect(r.shouldDispatch).toBe(true);
  });

  it("ignora a guarda quando currentUserId não foi fornecido (compat retroativa)", () => {
    // Mantém comportamento anterior se o chamador não passar o pareamento.
    const r = checkShouldDispatch({
      rowId: "row-Z",
      rowTimestamp: "2026-01-15T10:00:00Z",
      lastSeenAt: "2026-01-15T09:00:00Z",
      seen: new Set(),
      subscriptionUserId: "user-other",
    });
    expect(r.shouldDispatch).toBe(true);
  });
});

describe("savedFilterDedup > clampRateLimit", () => {
  it("aplica defaults quando entradas inválidas", () => {
    expect(clampRateLimit({ max: undefined, windowMin: undefined })).toEqual({
      max: 5,
      windowMin: 10,
    });
    expect(clampRateLimit({ max: NaN, windowMin: NaN })).toEqual({
      max: 5,
      windowMin: 10,
    });
  });

  it("clampa max ao intervalo 1..100", () => {
    expect(clampRateLimit({ max: 0, windowMin: 10 }).max).toBe(1);
    expect(clampRateLimit({ max: -50, windowMin: 10 }).max).toBe(1);
    expect(clampRateLimit({ max: 999, windowMin: 10 }).max).toBe(100);
  });

  it("clampa janela ao intervalo 1..1440 minutos", () => {
    expect(clampRateLimit({ max: 5, windowMin: 0 }).windowMin).toBe(1);
    expect(clampRateLimit({ max: 5, windowMin: 99_999 }).windowMin).toBe(1440);
  });

  it("arredonda valores fracionários", () => {
    expect(clampRateLimit({ max: 5.7, windowMin: 10.4 })).toEqual({
      max: 6,
      windowMin: 10,
    });
  });
});
