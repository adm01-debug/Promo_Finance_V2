/**
 * Testes determinísticos do pipeline puro `evaluateClaims` + estratégia de mocks.
 *
 * - 100% offline: não dependem de `.env`, da função publicada nem do Supabase.
 * - Cobrem: JIT positivo, JIT bloqueado, primeiro-match-vence, allowlist de domínio,
 *   resiliência quando o `userLookup` falha, isolamento de `fetch` externo.
 */
import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

import { evaluateClaims, maskEmail } from "./pipeline.ts";
import {
  failingUserLookup,
  installFetchMock,
  makeUserLookup,
} from "./mocks.ts";

const BASE_CONFIG = {
  claim_mapping: { email: "email", full_name: "name", groups: "groups" },
  default_role: "visualizador",
  allowed_domains: ["jit-tests.example.com"],
  role_mappings: [
    { idp_group: "sso-admins", app_role: "admin" },
    { idp_group: "sso-financeiro", app_role: "financeiro" },
    { idp_group: "sso-operacional", app_role: "operacional" },
  ],
  auto_provision_users: true,
  provider_nome: null,
};

Deno.test("pipeline: JIT + role por grupo (usuário não existe)", async () => {
  const lookup = makeUserLookup([]); // pool vazio
  const result = await evaluateClaims({
    config: BASE_CONFIG,
    mock_claims: {
      email: "novo@jit-tests.example.com",
      name: "Novo Usuário",
      groups: ["sso-financeiro"],
    },
    userLookup: lookup,
  });

  assertEquals(result.success, true);
  assertEquals(result.errors, []);
  assertEquals(result.preview.user_exists, false);
  assertEquals(result.preview.would_jit_provision, true);
  assertEquals(result.preview.provision_blocked_reason, null);
  assertEquals(result.preview.resolved_role, "financeiro");
  assertEquals(result.preview.matched_group, "sso-financeiro");
  assertEquals(result.preview.default_role_used, false);
  assertEquals(result.preview.domain, "jit-tests.example.com");
  assertEquals(result.preview.domain_allowed, true);
  assertEquals(result.preview.role_mappings_evaluated.length, 3);
});

Deno.test("pipeline: usuário JÁ existe → não provisiona", async () => {
  const lookup = makeUserLookup(["existente@jit-tests.example.com"]);
  const result = await evaluateClaims({
    config: BASE_CONFIG,
    mock_claims: {
      email: "Existente@jit-tests.example.com", // case-insensitive
      name: "Já Existe",
      groups: ["sso-admins"],
    },
    userLookup: lookup,
  });

  assertEquals(result.preview.user_exists, true);
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(result.preview.provision_blocked_reason, null);
  assertEquals(result.preview.resolved_role, "admin");
});

Deno.test("pipeline: auto_provision_users=false bloqueia JIT com motivo", async () => {
  const result = await evaluateClaims({
    config: { ...BASE_CONFIG, auto_provision_users: false },
    mock_claims: {
      email: "bloqueado@jit-tests.example.com",
      name: "Bloqueado",
      groups: ["sso-financeiro"],
    },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.preview.user_exists, false);
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(
    result.preview.provision_blocked_reason,
    "auto_provision_users desabilitado no provider",
  );
  // Role mapping continua sendo avaliado para diagnóstico.
  assertEquals(result.preview.resolved_role, "financeiro");
});

Deno.test("pipeline: múltiplos grupos — primeiro match vence, demais 'skipped'", async () => {
  const result = await evaluateClaims({
    config: BASE_CONFIG,
    mock_claims: {
      email: "multi@jit-tests.example.com",
      name: "Multigrupo",
      groups: ["sso-admins", "sso-financeiro", "grupo-sem-mapping"],
    },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.preview.resolved_role, "admin");
  assertEquals(result.preview.matched_group, "sso-admins");

  const byGroup = Object.fromEntries(
    result.preview.role_mappings_evaluated.map((m) => [m.idp_group, m]),
  );
  assertEquals(byGroup["sso-admins"].status, "matched");
  assertEquals(byGroup["sso-financeiro"].status, "skipped");
  assertEquals(byGroup["sso-operacional"].status, "no_match");
  assert(result.preview.groups.includes("grupo-sem-mapping"));
});

Deno.test("pipeline: usuário EXISTE mas domínio fora da allowlist → success=false e não provisiona", async () => {
  const email = "existente@jit-tests.example.com";
  const lookup = makeUserLookup([email]);
  let lookupCalls = 0;
  const trackedLookup = async (e: string) => {
    lookupCalls++;
    return await lookup(e);
  };

  const result = await evaluateClaims({
    config: { ...BASE_CONFIG, allowed_domains: ["only-this.example.com"] },
    mock_claims: { email, name: "Existente Bloqueado", groups: ["sso-admins"] },
    userLookup: trackedLookup,
  });

  // Bloqueio de domínio prevalece sobre a existência do usuário.
  assertEquals(result.success, false);
  assertEquals(result.preview.domain_allowed, false);
  assert(
    result.errors.some((e) => e.includes("não está na lista permitida")),
  );

  // user_exists ainda é reportado (lookup é executado para diagnóstico),
  // mas would_jit_provision permanece false — JIT NÃO acontece em domínio bloqueado.
  assertEquals(result.preview.user_exists, true);
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(result.preview.provision_blocked_reason, null);
  assertEquals(lookupCalls, 1);

  // Role mapping continua avaliado para diagnóstico.
  assertEquals(result.preview.resolved_role, "admin");
  assertEquals(result.preview.matched_group, "sso-admins");
});

Deno.test("pipeline: usuário NÃO existe e domínio fora da allowlist → success=false, sem JIT", async () => {
  const email = "novo@jit-tests.example.com";
  const result = await evaluateClaims({
    config: { ...BASE_CONFIG, allowed_domains: ["only-this.example.com"] },
    mock_claims: { email, name: "Novo Bloqueado", groups: ["sso-financeiro"] },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.success, false);
  assertEquals(result.preview.domain_allowed, false);
  assertEquals(result.preview.user_exists, false);
  // Mesmo com auto_provision_users=true, JIT não dispara em domínio bloqueado.
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(result.preview.provision_blocked_reason, null);
  assert(
    result.errors.some((e) => e.includes("jit-tests.example.com")),
  );
});

Deno.test("pipeline: domínio fora da allowlist → success=false", async () => {
  const result = await evaluateClaims({
    config: { ...BASE_CONFIG, allowed_domains: ["only-this.example.com"] },
    mock_claims: {
      email: "fora@jit-tests.example.com",
      name: "Fora",
      groups: ["sso-admins"],
    },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.success, false);
  assertEquals(result.preview.domain_allowed, false);
  assert(
    result.errors.some((e) => e.includes("não está na lista permitida")),
  );
  // Mesmo bloqueado, mantém role mapping para diagnóstico.
  assertEquals(result.preview.resolved_role, "admin");
});

Deno.test("pipeline: claim de email ausente → erro estruturado", async () => {
  const result = await evaluateClaims({
    config: BASE_CONFIG,
    mock_claims: { name: "Sem Email", groups: [] },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.success, false);
  assert(result.errors.includes("Claim de email não encontrada"));
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(result.preview.user_exists, false);
});

Deno.test("pipeline: userLookup falhando (rede indisponível) → não bloqueia, marca false", async () => {
  const result = await evaluateClaims({
    config: BASE_CONFIG,
    mock_claims: {
      email: "qualquer@jit-tests.example.com",
      name: "Qualquer",
      groups: ["sso-financeiro"],
    },
    userLookup: failingUserLookup,
  });

  // Quando o lookup falha (retorna null), preserva defaults seguros.
  assertEquals(result.preview.user_exists, false);
  assertEquals(result.preview.would_jit_provision, false);
  assertEquals(result.preview.provision_blocked_reason, null);
  assertEquals(result.preview.resolved_role, "financeiro");
});

Deno.test("pipeline: claim_mapping customizado é respeitado", async () => {
  const result = await evaluateClaims({
    config: {
      ...BASE_CONFIG,
      claim_mapping: {
        email: "mail",
        full_name: "displayName",
        groups: "memberOf",
      },
    },
    mock_claims: {
      mail: "custom@jit-tests.example.com",
      displayName: "Custom Mapping",
      memberOf: ["sso-operacional"],
    },
    userLookup: makeUserLookup([]),
  });

  assertEquals(result.preview.full_name, "Custom Mapping");
  assertEquals(result.preview.groups, ["sso-operacional"]);
  assertEquals(result.preview.resolved_role, "operacional");
  assertEquals(result.preview.claim_mapping_used, {
    email: "mail",
    full_name: "displayName",
    groups: "memberOf",
  });
});

Deno.test("maskEmail: preserva domínio e mascara local-part", () => {
  assertEquals(maskEmail("alice@example.com"), "a***e@example.com");
  assertEquals(maskEmail("ab@example.com"), "a*@example.com");
  assertEquals(maskEmail("invalido"), "invalido");
});

// =====================================================================
// Estratégia de mocks de `fetch`: prova que NENHUMA chamada externa
// vaza para a rede em cenários determinísticos.
// =====================================================================

Deno.test("fetch-mock: intercepta chamadas externas e responde determinístico", async () => {
  const handle = installFetchMock([
    {
      method: "GET",
      urlPattern: "https://ipapi.co/json/",
      response: { status: 200, body: { ip: "10.0.0.1", country_code: "BR" } },
    },
    {
      method: "POST",
      urlPattern: /\/auth\/v1\/admin\/users/,
      response: { status: 200, body: { users: [] } },
    },
  ]);

  try {
    const r1 = await fetch("https://ipapi.co/json/");
    const j1 = await r1.json();
    assertEquals(j1.country_code, "BR");

    const r2 = await fetch("https://x.supabase.co/auth/v1/admin/users", {
      method: "POST",
    });
    const j2 = await r2.json();
    assertEquals(j2.users, []);

    assertEquals(handle.callCounts, [1, 1]);
    assertEquals(handle.calls.length, 2);
  } finally {
    handle.restore();
  }
});

Deno.test("fetch-mock: rejeita requisições não previstas (fail-fast)", async () => {
  const handle = installFetchMock([]);
  try {
    await assertRejects(
      () => fetch("https://api.qualquer-coisa.com/leak"),
      Error,
      "[fetch-mock] Nenhum matcher",
    );
  } finally {
    handle.restore();
  }
});

Deno.test("integração: pipeline + fetch-mock — zero rede mesmo simulando ipapi", async () => {
  const handle = installFetchMock([
    {
      urlPattern: "ipapi.co",
      response: { body: { ip: "1.1.1.1", country_code: "BR" } },
    },
  ]);
  try {
    // Simula um caller que enriquece claims após consultar ipapi.
    const geo = await (await fetch("https://ipapi.co/json/")).json();
    const result = await evaluateClaims({
      config: BASE_CONFIG,
      mock_claims: {
        email: `user-${geo.ip}@jit-tests.example.com`,
        name: `User from ${geo.country_code}`,
        groups: ["sso-admins"],
      },
      userLookup: makeUserLookup([]),
    });

    assertEquals(result.preview.would_jit_provision, true);
    assertEquals(result.preview.resolved_role, "admin");
    assertEquals(handle.callCounts[0], 1);
  } finally {
    handle.restore();
  }
});
