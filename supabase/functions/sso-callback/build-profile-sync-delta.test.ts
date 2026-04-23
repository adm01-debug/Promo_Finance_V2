/**
 * Testes de idempotência para `buildProfileSyncDelta`.
 *
 * Garante que valores semanticamente iguais (incluindo diferenças de espaço
 * em branco e capitalização irrelevante) NÃO geram changes nem updates,
 * evitando audit-log ruidoso e UPDATEs desnecessários no Postgres.
 */
import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { buildProfileSyncDelta } from "./profile-sync-delta.ts";

const baseCurrent = {
  full_name: "Alice Silva",
  avatar_url: "https://cdn.example.com/avatar/alice.png",
  telefone: "+55 11 99999-0000",
};

Deno.test("idempotência: incoming idêntico ao current → changes/updates vazios", () => {
  const r = buildProfileSyncDelta(baseCurrent, { ...baseCurrent });
  assertEquals(r.changes, {});
  assertEquals(r.updates, {});
});

Deno.test("idempotência: espaços extras nas pontas (incoming) são ignorados", () => {
  const r = buildProfileSyncDelta(baseCurrent, {
    full_name: "  Alice Silva  ",
    avatar_url: "\thttps://cdn.example.com/avatar/alice.png\n",
    telefone: " +55 11 99999-0000 ",
  });
  assertEquals(r.changes, {});
  assertEquals(r.updates, {});
});

Deno.test("idempotência: espaços extras no current também são ignorados", () => {
  const r = buildProfileSyncDelta(
    {
      full_name: "  Alice Silva  ",
      avatar_url: " https://cdn.example.com/avatar/alice.png ",
      telefone: "+55 11 99999-0000\n",
    },
    baseCurrent,
  );
  assertEquals(r.changes, {});
  assertEquals(r.updates, {});
});

Deno.test("idempotência: incoming vazio/whitespace-only nunca sobrescreve", () => {
  const r = buildProfileSyncDelta(baseCurrent, {
    full_name: "   ",
    avatar_url: "",
    telefone: "\t\n",
  });
  assertEquals(r.changes, {});
  assertEquals(r.updates, {});
});

Deno.test("idempotência: null/undefined em incoming nunca geram changes", () => {
  const r1 = buildProfileSyncDelta(baseCurrent, {
    full_name: null,
    avatar_url: null,
    telefone: null,
  });
  assertEquals(r1.changes, {});
  assertEquals(r1.updates, {});

  const r2 = buildProfileSyncDelta(baseCurrent, {});
  assertEquals(r2.changes, {});
  assertEquals(r2.updates, {});
});

Deno.test("delta real: mudança apenas em telefone gera UM update", () => {
  const r = buildProfileSyncDelta(baseCurrent, {
    full_name: "  Alice Silva  ", // igual após trim
    avatar_url: baseCurrent.avatar_url, // igual
    telefone: "+55 11 98888-1111", // diferente
  });
  assertEquals(Object.keys(r.changes), ["telefone"]);
  assertEquals(r.updates, { telefone: "+55 11 98888-1111" });
  assertObjectMatch(r.changes.telefone as Record<string, unknown>, {
    from: "+55 11 99999-0000",
    to: "+55 11 98888-1111",
  });
});

Deno.test("delta real: incoming com espaços em valor diferente é normalizado e gera update", () => {
  const r = buildProfileSyncDelta(baseCurrent, {
    full_name: "  Alice Souza  ",
  });
  assertEquals(r.updates, { full_name: "Alice Souza" });
  assertEquals(r.changes.full_name, {
    from: "Alice Silva",
    to: "Alice Souza",
  });
});

Deno.test("idempotência: current com null + incoming whitespace → não cria campo", () => {
  const r = buildProfileSyncDelta(
    { full_name: null, avatar_url: null, telefone: null },
    { full_name: "   ", avatar_url: "", telefone: "  " },
  );
  assertEquals(r.changes, {});
  assertEquals(r.updates, {});
});

Deno.test("delta real: current null + incoming válido → cria campo (from=null)", () => {
  const r = buildProfileSyncDelta(
    { full_name: null, avatar_url: null, telefone: null },
    { full_name: "  Alice Silva  ", telefone: "11999990000" },
  );
  assertEquals(r.updates, {
    full_name: "Alice Silva",
    telefone: "11999990000",
  });
  assertEquals(r.changes.full_name, { from: null, to: "Alice Silva" });
  assertEquals(r.changes.telefone, { from: null, to: "11999990000" });
});

Deno.test("idempotência: chamadas repetidas convergem (segundo run = no-op)", () => {
  // Primeiro run aplica as mudanças.
  const first = buildProfileSyncDelta(
    { full_name: null, avatar_url: null, telefone: "+55 11 99999-0000" },
    {
      full_name: "  Alice Silva  ",
      avatar_url: "https://cdn.example.com/a.png",
      telefone: "+55 11 99999-0000",
    },
  );
  assertEquals(Object.keys(first.updates).sort(), ["avatar_url", "full_name"]);

  // "Aplicamos" os updates ao current e re-rodamos com os mesmos incoming.
  const newCurrent = {
    full_name: first.updates.full_name ?? null,
    avatar_url: first.updates.avatar_url ?? null,
    telefone: "+55 11 99999-0000",
  };
  const second = buildProfileSyncDelta(newCurrent, {
    full_name: "  Alice Silva  ",
    avatar_url: "https://cdn.example.com/a.png",
    telefone: "+55 11 99999-0000",
  });
  assertEquals(second.changes, {});
  assertEquals(second.updates, {});
});
