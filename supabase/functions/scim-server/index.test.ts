// E2E tests for SCIM server: Users + Groups CRUD with empresa/provider isolation.
// Verifies that user_empresas + user_roles reflect changes automatically per empresa & provider.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SCIM_BASE = `${SUPABASE_URL}/functions/v1/scim-server/scim/v2`;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

interface Ctx {
  empresaId: string;
  providerId: string;
  token: string;
  tokenId: string;
  cleanup: Array<() => Promise<void>>;
  createdEmails: string[];
}

async function setupCtx(label: string): Promise<Ctx> {
  const tag = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const cnpj = String(Date.now()).padStart(14, "0").slice(-14);

  const { data: emp, error: eErr } = await admin.from("empresas").insert({
    cnpj, razao_social: `SCIM Test ${tag}`, ativo: true,
  }).select("id").single();
  if (eErr || !emp) throw new Error(`empresa: ${eErr?.message}`);

  const { data: prov, error: pErr } = await admin.from("sso_providers").insert({
    nome: `prov-${tag}`, tipo: "oidc", ativo: false, empresa_id: emp.id,
  }).select("id").single();
  if (pErr || !prov) throw new Error(`provider: ${pErr?.message}`);

  const token = `scim_test_${tag}_${crypto.randomUUID()}`;
  const token_hash = await sha256(token);
  const { data: tok, error: tErr } = await admin.from("scim_tokens").insert({
    nome: `tok-${tag}`, empresa_id: emp.id, provider_id: prov.id,
    token_hash, token_prefix: token.slice(0, 12), ativo: true,
  }).select("id").single();
  if (tErr || !tok) throw new Error(`token: ${tErr?.message}`);

  return {
    empresaId: emp.id, providerId: prov.id, token, tokenId: tok.id,
    createdEmails: [], cleanup: [
      async () => { await admin.from("scim_tokens").delete().eq("id", tok.id); },
      async () => { await admin.from("sso_role_mappings").delete().eq("provider_id", prov.id); },
      async () => { await admin.from("sso_providers").delete().eq("id", prov.id); },
      async () => { await admin.from("user_empresas").delete().eq("empresa_id", emp.id); },
      async () => { await admin.from("empresas").delete().eq("id", emp.id); },
    ],
  };
}

async function teardown(ctx: Ctx) {
  // Remove auth users created via SCIM
  for (const email of ctx.createdEmails) {
    const { data: prof } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (prof?.id) {
      await admin.from("user_roles").delete().eq("user_id", prof.id);
      await admin.auth.admin.deleteUser(prof.id).catch(() => {});
    }
  }
  for (const fn of ctx.cleanup) await fn().catch(() => {});
}

async function scim(ctx: Ctx, method: string, path: string, body?: unknown) {
  const resp = await fetch(`${SCIM_BASE}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${ctx.token}`,
      "Content-Type": "application/scim+json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await resp.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* 204 */ }
  return { status: resp.status, body: json, contentType: resp.headers.get("content-type") };
}

// ─────────────── USERS ───────────────

Deno.test("Users: POST creates user_empresas + user_roles, isolated by empresa", async () => {
  const ctx = await setupCtx("users-post");
  try {
    const email = `scim_${Date.now()}@test.local`;
    ctx.createdEmails.push(email);
    const r = await scim(ctx, "POST", "/Users", {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      userName: email, name: { formatted: "SCIM User" },
      emails: [{ value: email, primary: true }], active: true,
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": { department: "financeiro" },
    });
    assertEquals(r.status, 201, JSON.stringify(r.body));
    assert(r.contentType?.includes("scim+json"));
    const id = r.body.id;

    // user_empresas reflects empresa + role
    const { data: link } = await admin.from("user_empresas")
      .select("empresa_id, role, ativo, provisioned_via")
      .eq("id", id).maybeSingle();
    assertEquals(link?.empresa_id, ctx.empresaId);
    assertEquals(link?.role, "financeiro");
    assertEquals(link?.ativo, true);
    assertEquals(link?.provisioned_via, "scim");

    // user_roles upserted (additive)
    const { data: prof } = await admin.from("profiles").select("id").eq("email", email).single();
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", prof!.id);
    assert(roles?.some(r => r.role === "financeiro"), "user_roles must include financeiro");
  } finally { await teardown(ctx); }
});

Deno.test("Users: PATCH replace active=false deactivates user_empresas", async () => {
  const ctx = await setupCtx("users-patch");
  try {
    const email = `scim_${Date.now()}_p@test.local`;
    ctx.createdEmails.push(email);
    const created = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const id = created.body.id;

    const r = await scim(ctx, "PATCH", `/Users/${id}`, {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      Operations: [{ op: "replace", path: "active", value: false }],
    });
    assertEquals(r.status, 200, JSON.stringify(r.body));
    assertEquals(r.body.active, false);

    const { data: link } = await admin.from("user_empresas").select("ativo").eq("id", id).single();
    assertEquals(link?.ativo, false);
  } finally { await teardown(ctx); }
});

Deno.test("Users: PATCH enterprise.department updates role + user_roles", async () => {
  const ctx = await setupCtx("users-role");
  try {
    const email = `scim_${Date.now()}_r@test.local`;
    ctx.createdEmails.push(email);
    const created = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const id = created.body.id;

    const r = await scim(ctx, "PATCH", `/Users/${id}`, {
      Operations: [{
        op: "replace",
        path: `urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:department`,
        value: "operacional",
      }],
    });
    assertEquals(r.status, 200, JSON.stringify(r.body));

    const { data: link } = await admin.from("user_empresas").select("role").eq("id", id).single();
    assertEquals(link?.role, "operacional");

    const { data: prof } = await admin.from("profiles").select("id").eq("email", email).single();
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", prof!.id);
    assert(roles?.some(r => r.role === "operacional"));
  } finally { await teardown(ctx); }
});

Deno.test("Users: PUT full replace updates fields atomically", async () => {
  const ctx = await setupCtx("users-put");
  try {
    const email = `scim_${Date.now()}_u@test.local`;
    ctx.createdEmails.push(email);
    const created = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const id = created.body.id;

    const r = await scim(ctx, "PUT", `/Users/${id}`, {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
      userName: email, name: { formatted: "Renamed User" },
      emails: [{ value: email, primary: true }], active: true,
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": { department: "admin" },
    });
    assertEquals(r.status, 200, JSON.stringify(r.body));

    const { data: link } = await admin.from("user_empresas")
      .select("role, profiles!inner(full_name)").eq("id", id).single();
    assertEquals(link?.role, "admin");
    assertEquals((link as any)?.profiles?.full_name, "Renamed User");
  } finally { await teardown(ctx); }
});

Deno.test("Users: DELETE soft-disables user_empresas (ativo=false)", async () => {
  const ctx = await setupCtx("users-del");
  try {
    const email = `scim_${Date.now()}_d@test.local`;
    ctx.createdEmails.push(email);
    const created = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const id = created.body.id;

    const r = await scim(ctx, "DELETE", `/Users/${id}`);
    assertEquals(r.status, 204);

    const { data: link } = await admin.from("user_empresas").select("ativo").eq("id", id).single();
    assertEquals(link?.ativo, false);
  } finally { await teardown(ctx); }
});

Deno.test("Users: cross-empresa isolation — token A cannot see user from empresa B", async () => {
  const a = await setupCtx("iso-a");
  const b = await setupCtx("iso-b");
  try {
    const email = `scim_${Date.now()}_iso@test.local`;
    b.createdEmails.push(email);
    const created = await scim(b, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    assertEquals(created.status, 201);
    const idInB = created.body.id;

    const r = await scim(a, "GET", `/Users/${idInB}`);
    assertEquals(r.status, 404, "Token A must not access User from empresa B");
  } finally { await teardown(a); await teardown(b); }
});

// ─────────────── GROUPS ───────────────

Deno.test("Groups: POST creates sso_role_mappings bound to provider", async () => {
  const ctx = await setupCtx("groups-post");
  try {
    const r = await scim(ctx, "POST", "/Groups", {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
      displayName: "financeiro",
    });
    assertEquals(r.status, 201, JSON.stringify(r.body));
    const id = r.body.id;

    const { data: g } = await admin.from("sso_role_mappings")
      .select("provider_id, idp_group, app_role").eq("id", id).single();
    assertEquals(g?.provider_id, ctx.providerId);
    assertEquals(g?.idp_group, "financeiro");
    assertEquals(g?.app_role, "financeiro");
  } finally { await teardown(ctx); }
});

Deno.test("Groups: PATCH add member updates user_empresas role + user_roles", async () => {
  const ctx = await setupCtx("groups-patch");
  try {
    const email = `scim_${Date.now()}_gm@test.local`;
    ctx.createdEmails.push(email);
    const u = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const userId = u.body.id;

    const g = await scim(ctx, "POST", "/Groups", { displayName: "admin" });
    const groupId = g.body.id;

    const r = await scim(ctx, "PATCH", `/Groups/${groupId}`, {
      schemas: ["urn:ietf:params:scim:api:messages:2.0:PatchOp"],
      Operations: [{ op: "add", path: "members", value: [{ value: userId }] }],
    });
    assertEquals(r.status, 200, JSON.stringify(r.body));

    const { data: link } = await admin.from("user_empresas").select("role, user_id").eq("id", userId).single();
    assertEquals(link?.role, "admin");

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", link!.user_id);
    assert(roles?.some(r => r.role === "admin"));
  } finally { await teardown(ctx); }
});

Deno.test("Groups: PATCH replace members removes excluded ones (role -> visualizador)", async () => {
  const ctx = await setupCtx("groups-replace");
  try {
    const email = `scim_${Date.now()}_gr@test.local`;
    ctx.createdEmails.push(email);
    const u = await scim(ctx, "POST", "/Users", {
      userName: email, emails: [{ value: email, primary: true }], active: true,
    });
    const userId = u.body.id;
    const g = await scim(ctx, "POST", "/Groups", {
      displayName: "operacional",
      members: [{ value: userId }],
    });
    const groupId = g.body.id;

    // sanity
    const { data: pre } = await admin.from("user_empresas").select("role").eq("id", userId).single();
    assertEquals(pre?.role, "operacional");

    const r = await scim(ctx, "PATCH", `/Groups/${groupId}`, {
      Operations: [{ op: "replace", path: "members", value: [] }],
    });
    assertEquals(r.status, 200);

    const { data: post } = await admin.from("user_empresas").select("role").eq("id", userId).single();
    assertEquals(post?.role, "visualizador");
  } finally { await teardown(ctx); }
});

Deno.test("Groups: PATCH displayName renames idp_group", async () => {
  const ctx = await setupCtx("groups-rename");
  try {
    const g = await scim(ctx, "POST", "/Groups", { displayName: "old-name" });
    const id = g.body.id;
    const r = await scim(ctx, "PATCH", `/Groups/${id}`, {
      Operations: [{ op: "replace", path: "displayName", value: "new-name" }],
    });
    assertEquals(r.status, 200);
    const { data: row } = await admin.from("sso_role_mappings").select("idp_group").eq("id", id).single();
    assertEquals(row?.idp_group, "new-name");
  } finally { await teardown(ctx); }
});

Deno.test("Groups: DELETE removes mapping and respects provider isolation", async () => {
  const a = await setupCtx("gdel-a");
  const b = await setupCtx("gdel-b");
  try {
    const g = await scim(a, "POST", "/Groups", { displayName: "to-del" });
    const id = g.body.id;

    // token from empresa B must NOT delete A's group
    const cross = await scim(b, "DELETE", `/Groups/${id}`);
    assertEquals(cross.status, 404);
    const { data: stillThere } = await admin.from("sso_role_mappings").select("id").eq("id", id).maybeSingle();
    assert(stillThere, "Group should still exist after cross-empresa DELETE attempt");

    // token from empresa A succeeds
    const r = await scim(a, "DELETE", `/Groups/${id}`);
    assertEquals(r.status, 204);
    const { data: gone } = await admin.from("sso_role_mappings").select("id").eq("id", id).maybeSingle();
    assertEquals(gone, null);
  } finally { await teardown(a); await teardown(b); }
});
