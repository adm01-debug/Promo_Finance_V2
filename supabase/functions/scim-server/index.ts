// SCIM 2.0 server — Users + Groups com provisioning real em user_empresas + user_roles
// Path: /functions/v1/scim-server/scim/v2/{ServiceProviderConfig|ResourceTypes|Schemas|Users|Groups}/{id?}
import { corsHeaders } from "npm:@supabase/supabase-js/cors";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const APP_ROLES = ["admin", "financeiro", "operacional", "visualizador"] as const;
type AppRole = typeof APP_ROLES[number];

const scimHeaders = { ...corsHeaders, "Content-Type": "application/scim+json" };

// ============================== utils ==============================

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function err(status: number, detail: string, scimType?: string) {
  const body: Record<string, unknown> = {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    detail,
    status: String(status),
  };
  if (scimType) body.scimType = scimType;
  return new Response(JSON.stringify(body), { status, headers: scimHeaders });
}

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: scimHeaders });
}

function truncate(v: unknown, max = 4000) {
  try {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    return s.length > max ? s.slice(0, max) + "…[truncated]" : v;
  } catch { return null; }
}

async function logOp(admin: SupabaseClient, opts: {
  tokenId: string | null; empresaId: string | null;
  resource: string; operation: string;
  externalId: string | null; userId: string | null;
  status: number; reqBody: unknown; resBody: unknown; t0: number;
}) {
  try {
    await admin.from("scim_operations_log").insert({
      token_id: opts.tokenId, empresa_id: opts.empresaId,
      resource_type: opts.resource, operation: opts.operation,
      external_id: opts.externalId, user_id: opts.userId, status_code: opts.status,
      request_body: truncate(opts.reqBody) as any,
      response_body: truncate(opts.resBody) as any,
      duration_ms: Date.now() - opts.t0,
    });
  } catch {/* nunca derruba a request */}
}

// ============================== role resolver ==============================

async function resolveRole(
  admin: SupabaseClient,
  providerId: string | null,
  hint: string | null | undefined,
): Promise<AppRole> {
  const h = (hint ?? "").trim();
  if (!h) return "visualizador";
  if ((APP_ROLES as readonly string[]).includes(h.toLowerCase())) {
    return h.toLowerCase() as AppRole;
  }
  if (providerId) {
    const { data } = await admin
      .from("sso_role_mappings")
      .select("app_role")
      .eq("provider_id", providerId)
      .eq("idp_group", h)
      .maybeSingle();
    if (data?.app_role && (APP_ROLES as readonly string[]).includes(data.app_role)) {
      return data.app_role as AppRole;
    }
  }
  return "visualizador";
}

async function syncUserRole(admin: SupabaseClient, userId: string, role: AppRole) {
  // RBAC aditivo: insere se ainda não tem essa role; não remove outras.
  await admin.from("user_roles").upsert(
    { user_id: userId, role },
    { onConflict: "user_id,role", ignoreDuplicates: true } as any,
  );
}

// ============================== user lookup (escala >50) ==============================

async function findAuthUserByEmail(admin: SupabaseClient, email: string) {
  // 1) profiles (canônico — sempre criado pelo trigger handle_new_user)
  const { data: prof } = await admin
    .from("profiles").select("id, email, full_name").eq("email", email).maybeSingle();
  if (prof?.id) return { id: prof.id as string, email: prof.email as string, full_name: (prof as any).full_name as string | null };

  // 2) fallback: scan paginado (raro)
  let page = 1;
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) return null;
    const u = data.users.find(x => x.email?.toLowerCase() === email);
    if (u) return { id: u.id, email: u.email!, full_name: (u.user_metadata?.full_name as string | undefined) ?? null };
    if (data.users.length < 200) return null;
    page++;
  }
  return null;
}

// ============================== SCIM filter parser ==============================

interface FilterClause { attr: string; op: "eq"; value: string }

/**
 * Parser SCIM 2.0 (RFC 7644 §3.4.2.2) — suporta:
 *   - operador `eq` (único comparador necessário para provisioners típicos)
 *   - composição com `and` (case-insensitive, múltiplas cláusulas)
 *   - valores entre aspas: `userName eq "foo@bar.com"`
 *   - booleanos sem aspas: `active eq true`
 *   - números sem aspas: `meta.version eq 3`
 *   - parênteses simples envolvendo cláusulas (ignorados, sem grupos OR aninhados)
 *   - prefixos de schema URN (ex.: `urn:...:User:userName`)
 */
function parseFilter(filter: string): FilterClause[] | null {
  if (!filter) return [];
  // Remove parênteses externos/internos simples — não suportamos OR/NOT/agrupamento real.
  const sanitized = filter.replace(/[()]/g, " ").trim();
  if (!sanitized) return [];
  // Rejeita explicitamente operadores não suportados para evitar matching parcial.
  if (/\s+(or|not)\s+/i.test(sanitized)) return null;

  const parts = sanitized.split(/\s+and\s+/i);
  const clauses: FilterClause[] = [];
  for (const raw of parts) {
    const p = raw.trim();
    if (!p) continue;
    const m = p.match(
      /^([A-Za-z0-9_.:\-]+)\s+eq\s+(?:"((?:[^"\\]|\\.)*)"|(true|false)|(-?\d+(?:\.\d+)?))$/i,
    );
    if (!m) return null;
    const value = m[2] !== undefined ? m[2].replace(/\\(.)/g, "$1") : (m[3] ?? m[4]);
    clauses.push({ attr: m[1], op: "eq", value });
  }
  return clauses;
}

/** Normaliza o nome do atributo do filtro removendo prefixos de schema URN. */
function normalizeFilterAttr(attr: string): string {
  const lower = attr.toLowerCase();
  const userPrefix = "urn:ietf:params:scim:schemas:core:2.0:user:";
  const groupPrefix = "urn:ietf:params:scim:schemas:core:2.0:group:";
  const entPrefix = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:user:";
  if (lower.startsWith(userPrefix)) return lower.slice(userPrefix.length);
  if (lower.startsWith(groupPrefix)) return lower.slice(groupPrefix.length);
  if (lower.startsWith(entPrefix)) return lower.slice(entPrefix.length);
  return lower;
}

// ============================== SCIM serializers ==============================

function userToScim(profile: { email: string; full_name: string | null }, link: any, empresaId: string) {
  return {
    schemas: [
      "urn:ietf:params:scim:schemas:core:2.0:User",
      "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
    ],
    id: link.id,
    externalId: link.scim_external_id ?? undefined,
    userName: profile.email,
    name: { formatted: profile.full_name || profile.email },
    displayName: profile.full_name || profile.email,
    emails: [{ value: profile.email, primary: true, type: "work" }],
    active: link.ativo,
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
      organization: empresaId,
      department: link.role,
    },
    meta: {
      resourceType: "User",
      created: link.created_at,
      lastModified: link.updated_at,
      location: `/scim/v2/Users/${link.id}`,
    },
  };
}

function groupToScim(mapping: any, members: Array<{ value: string; display: string }>) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
    id: mapping.id,
    displayName: mapping.idp_group,
    members: members.map(m => ({ value: m.value, display: m.display, type: "User" })),
    meta: {
      resourceType: "Group",
      created: mapping.created_at,
      location: `/scim/v2/Groups/${mapping.id}`,
    },
  };
}

// ============================== discovery payloads ==============================

const SCHEMAS_PAYLOAD = {
  Resources: [
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:User",
      name: "User", description: "SCIM core User",
      attributes: [
        { name: "userName", type: "string", required: true, uniqueness: "server" },
        { name: "name", type: "complex", subAttributes: [{ name: "formatted", type: "string" }] },
        { name: "displayName", type: "string" },
        { name: "emails", type: "complex", multiValued: true, subAttributes: [
          { name: "value", type: "string" }, { name: "primary", type: "boolean" }, { name: "type", type: "string" },
        ]},
        { name: "active", type: "boolean" },
        { name: "externalId", type: "string" },
      ],
      meta: { resourceType: "Schema", location: "/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User" },
    },
    {
      id: "urn:ietf:params:scim:schemas:core:2.0:Group",
      name: "Group", description: "SCIM core Group",
      attributes: [
        { name: "displayName", type: "string", required: true },
        { name: "members", type: "complex", multiValued: true, subAttributes: [
          { name: "value", type: "string" }, { name: "display", type: "string" },
        ]},
      ],
      meta: { resourceType: "Schema", location: "/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:Group" },
    },
    {
      id: "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
      name: "EnterpriseUser",
      description: "Enterprise extension — department mapeia app_role (admin|financeiro|operacional|visualizador) ou idp_group de sso_role_mappings",
      attributes: [
        { name: "organization", type: "string" },
        { name: "department", type: "string" },
      ],
      meta: { resourceType: "Schema", location: "/scim/v2/Schemas/urn:ietf:params:scim:schemas:extension:enterprise:2.0:User" },
    },
  ],
};

const RESOURCE_TYPES_PAYLOAD = {
  Resources: [
    {
      id: "User", name: "User", endpoint: "/Users",
      description: "SCIM 2.0 User",
      schema: "urn:ietf:params:scim:schemas:core:2.0:User",
      schemaExtensions: [{
        schema: "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User",
        required: false,
      }],
      meta: { resourceType: "ResourceType", location: "/scim/v2/ResourceTypes/User" },
    },
    {
      id: "Group", name: "Group", endpoint: "/Groups",
      description: "SCIM 2.0 Group (mapeado para sso_role_mappings)",
      schema: "urn:ietf:params:scim:schemas:core:2.0:Group",
      meta: { resourceType: "ResourceType", location: "/scim/v2/ResourceTypes/Group" },
    },
  ],
};

const SP_CONFIG_PAYLOAD = {
  schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
  documentationUri: "https://docs.lovable.dev/integrations/scim",
  patch: { supported: true },
  bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
  filter: { supported: true, maxResults: 200 },
  changePassword: { supported: false },
  sort: { supported: false },
  etag: { supported: false },
  authenticationSchemes: [{
    type: "oauthbearertoken", name: "OAuth Bearer Token",
    description: "SCIM token emitido em /SSO Admin → SCIM",
    primary: true,
  }],
  meta: { resourceType: "ServiceProviderConfig", location: "/scim/v2/ServiceProviderConfig" },
};

function listResp<T>(resources: T[], total: number, startIndex: number) {
  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: total, startIndex,
    itemsPerPage: resources.length, Resources: resources,
  };
}

// ============================== handlers: Users ==============================

async function listUsers(admin: SupabaseClient, empresaId: string, url: URL) {
  const startIndex = Math.max(parseInt(url.searchParams.get("startIndex") || "1"), 1);
  const count = Math.min(Math.max(parseInt(url.searchParams.get("count") || "50"), 0), 200);
  const filter = url.searchParams.get("filter") || "";
  const clauses = parseFilter(filter);
  if (clauses === null) return err(400, `Filter not supported: ${filter}`, "invalidFilter");

  let q = admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)", { count: "exact" })
    .eq("empresa_id", empresaId);

  for (const c of clauses) {
    const a = c.attr.toLowerCase();
    if (a === "username" || a === "emails" || a === "emails.value") q = q.eq("profiles.email", c.value.toLowerCase());
    else if (a === "externalid") q = q.eq("scim_external_id", c.value);
    else if (a === "active") q = q.eq("ativo", c.value === "true");
    else return err(400, `Unsupported filter attribute: ${c.attr}`, "invalidFilter");
  }

  if (count === 0) {
    const { count: total } = await q;
    return ok(listResp([], total ?? 0, startIndex));
  }
  const { data, count: total } = await q.range(startIndex - 1, startIndex - 1 + count - 1);
  const Resources = (data ?? []).map((row: any) => userToScim(row.profiles, row, empresaId));
  return ok(listResp(Resources, total ?? Resources.length, startIndex));
}

async function getUser(admin: SupabaseClient, empresaId: string, id: string) {
  const { data: link } = await admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)")
    .eq("id", id).eq("empresa_id", empresaId).maybeSingle();
  if (!link) return err(404, "User not found");
  return ok(userToScim((link as any).profiles, link, empresaId));
}

async function createUser(admin: SupabaseClient, providerId: string | null, empresaId: string, body: any) {
  const email = String(body?.userName || body?.emails?.[0]?.value || "").toLowerCase().trim();
  const fullName = body?.name?.formatted || body?.displayName || email;
  const externalId: string | null = body?.externalId ?? null;
  const active = body?.active !== false;
  const ext = body?.["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"];
  const departmentHint = ext?.department ?? null;
  if (!email) return err(400, "userName/emails.value required", "invalidValue");

  const role = await resolveRole(admin, providerId, departmentHint);

  let user = await findAuthUserByEmail(admin, email);
  if (!user) {
    const c = await admin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { full_name: fullName, scim_provisioned: true },
    });
    if (c.error || !c.data.user) return err(500, c.error?.message || "Failed to create auth user");
    user = { id: c.data.user.id, email, full_name: fullName };
    // garante row em profiles caso o trigger falhe
    await admin.from("profiles").upsert({ id: user.id, email, full_name: fullName });
  } else if (fullName && fullName !== user.full_name) {
    await admin.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  }

  const { data: link, error: linkErr } = await admin.from("user_empresas").upsert({
    user_id: user.id, empresa_id: empresaId, role,
    provisioned_via: "scim", scim_external_id: externalId, ativo: active,
  }, { onConflict: "user_id,empresa_id" }).select("*, profiles!inner(id,email,full_name)").single();
  if (linkErr || !link) return err(500, linkErr?.message || "Failed to upsert user_empresas");

  await syncUserRole(admin, user.id, role);

  return ok(userToScim((link as any).profiles, link, empresaId), 201);
}

interface UserPatchResult {
  empresaUpdates: Record<string, unknown>;
  profileUpdates: Record<string, unknown>;
  newRoleHint: string | null;
  newEmail: string | null;
  invalidPath: string | null;
  invalidOp: string | null;
}

const ENTERPRISE_URN = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:user";
const USER_URN = "urn:ietf:params:scim:schemas:core:2.0:user";

/** Normaliza um path SCIM removendo o prefixo do schema URN do User core, deixando filtros intactos. */
function normalizePath(rawPath: string): string {
  let p = rawPath.trim();
  // remove o URN do User core, se presente (case-insensitive)
  const lower = p.toLowerCase();
  if (lower.startsWith(`${USER_URN}:`)) p = p.slice(USER_URN.length + 1);
  return p;
}

/** Extrai o "primary email" de um array SCIM emails. */
function extractPrimaryEmail(emails: unknown): string | null {
  if (!Array.isArray(emails)) return null;
  const primary = emails.find((e) => e && typeof e === "object" && (e as any).primary === true);
  const chosen = primary || emails.find((e) => e && typeof e === "object" && (e as any).value);
  const v = chosen && (chosen as any).value;
  return typeof v === "string" && v.trim() ? v.trim().toLowerCase() : null;
}

/** Aplica um valor a um campo "atômico" do User (compartilhado por PATCH com path e PATCH sem path). */
function assignField(out: UserPatchResult, field: string, action: string, value: unknown): boolean {
  switch (field) {
    case "active":
      out.empresaUpdates.ativo = action === "remove" ? false : !!value;
      return true;
    case "displayname":
    case "name.formatted":
      out.profileUpdates.full_name = action === "remove" ? "" : String(value ?? "");
      return true;
    case "name.givenname":
    case "name.familyname": {
      // Combina givenName + familyName quando possível
      const current = (out.profileUpdates.full_name as string | undefined) ?? "";
      const parts = current.split(" ").filter(Boolean);
      if (field === "name.givenname") parts[0] = String(value ?? "");
      else parts[parts.length === 0 ? 0 : parts.length - 1] = String(value ?? "");
      out.profileUpdates.full_name = parts.join(" ").trim();
      return true;
    }
    case "externalid":
      out.empresaUpdates.scim_external_id = action === "remove" ? null : (value ?? null);
      return true;
    case `${ENTERPRISE_URN}:department`:
    case "department":
      out.newRoleHint = action === "remove" ? "visualizador" : String(value ?? "");
      return true;
    default:
      return false;
  }
}

function applyPatchOps(ops: any[]): UserPatchResult {
  const out: UserPatchResult = {
    empresaUpdates: {}, profileUpdates: {},
    newRoleHint: null, newEmail: null,
    invalidPath: null, invalidOp: null,
  };

  for (const op of ops || []) {
    const action = String(op?.op || "").toLowerCase();
    if (!["add", "replace", "remove"].includes(action)) {
      out.invalidOp = op?.op ?? "(missing)";
      return out;
    }
    const rawPath = String(op?.path ?? "");
    const normalized = normalizePath(rawPath);
    const path = normalized.toLowerCase();
    const value = op?.value;

    // ---------- PATCH sem path: value é objeto com atributos top-level ----------
    if (!path && value && typeof value === "object") {
      if ("active" in value) out.empresaUpdates.ativo = !!value.active;
      if ("displayName" in value) out.profileUpdates.full_name = String(value.displayName);
      if (value?.name?.formatted) out.profileUpdates.full_name = String(value.name.formatted);
      if (value?.name?.givenName || value?.name?.familyName) {
        const g = value.name.givenName ?? "";
        const f = value.name.familyName ?? "";
        out.profileUpdates.full_name = `${g} ${f}`.trim();
      }
      if ("externalId" in value) out.empresaUpdates.scim_external_id = value.externalId ?? null;
      const ext = value["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"];
      if (ext?.department) out.newRoleHint = String(ext.department);
      if (Array.isArray(value.emails)) {
        const e = extractPrimaryEmail(value.emails);
        if (e) out.newEmail = e;
      }
      continue;
    }

    // ---------- PATCH com filtro emails[primary eq true].value ----------
    // Aceita variações: emails[primary eq true].value | emails[type eq "work"].value
    if (path.startsWith("emails[")) {
      // Para qualquer filtro em emails que ataque .value, aplicamos como troca de e-mail primário
      if (path.endsWith(".value")) {
        const v = typeof value === "string" ? value : (Array.isArray(value) ? value[0]?.value : null);
        if (typeof v === "string" && v.trim()) {
          out.newEmail = v.trim().toLowerCase();
          continue;
        }
      }
      out.invalidPath = rawPath;
      return out;
    }

    // ---------- PATCH replace inteiro de emails ----------
    if (path === "emails") {
      const e = extractPrimaryEmail(value);
      if (e) { out.newEmail = e; continue; }
      out.invalidPath = rawPath;
      return out;
    }

    // ---------- Campos atômicos ----------
    if (assignField(out, path, action, value)) continue;

    out.invalidPath = rawPath || "(empty)";
    return out;
  }
  return out;
}

/** Atualiza o e-mail principal do usuário em auth.users + profiles. */
async function updateUserEmail(admin: SupabaseClient, userId: string, newEmail: string): Promise<string | null> {
  const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
    email: newEmail, email_confirm: true,
  });
  if (authErr) return authErr.message;
  const { error: profErr } = await admin.from("profiles").update({ email: newEmail }).eq("id", userId);
  if (profErr) return profErr.message;
  return null;
}

async function patchUser(admin: SupabaseClient, providerId: string | null, empresaId: string, id: string, body: any) {
  const { data: link } = await admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)")
    .eq("id", id).eq("empresa_id", empresaId).maybeSingle();
  if (!link) return err(404, "User not found");

  // Validação básica do envelope SCIM PatchOp
  const schemas: string[] = Array.isArray(body?.schemas) ? body.schemas : [];
  if (schemas.length && !schemas.some((s) => String(s).toLowerCase() === "urn:ietf:params:scim:api:messages:2.0:patchop")) {
    return err(400, "Missing PatchOp schema", "invalidSyntax");
  }
  if (!Array.isArray(body?.Operations) || body.Operations.length === 0) {
    return err(400, "Operations array required", "invalidValue");
  }

  const result = applyPatchOps(body.Operations);
  if (result.invalidOp) return err(400, `Unsupported op: ${result.invalidOp}`, "invalidSyntax");
  if (result.invalidPath) return err(400, `Unsupported path: ${result.invalidPath}`, "invalidPath");

  if (result.newRoleHint) {
    const role = await resolveRole(admin, providerId, result.newRoleHint);
    result.empresaUpdates.role = role;
  }

  // 1. Email primário (auth + profiles)
  if (result.newEmail && result.newEmail !== (link as any).profiles.email) {
    const errMsg = await updateUserEmail(admin, link.user_id as string, result.newEmail);
    if (errMsg) return err(500, `Email update failed: ${errMsg}`);
  }

  // 2. Profile (full_name)
  if (Object.keys(result.profileUpdates).length) {
    await admin.from("profiles").update(result.profileUpdates).eq("id", (link as any).profiles.id);
  }

  // 3. user_empresas (active, externalId, role)
  if (Object.keys(result.empresaUpdates).length) {
    await admin.from("user_empresas").update(result.empresaUpdates).eq("id", id);
  }
  if (result.empresaUpdates.role) {
    await syncUserRole(admin, link.user_id as string, result.empresaUpdates.role as AppRole);
  }

  const { data: fresh } = await admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)")
    .eq("id", id).maybeSingle();
  return ok(userToScim((fresh as any).profiles, fresh, empresaId));
}

async function putUser(admin: SupabaseClient, providerId: string | null, empresaId: string, id: string, body: any) {
  const { data: link } = await admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)")
    .eq("id", id).eq("empresa_id", empresaId).maybeSingle();
  if (!link) return err(404, "User not found");

  const ext = body?.["urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"];
  const role = await resolveRole(admin, providerId, ext?.department ?? null);
  const active = body?.active !== false;
  const externalId: string | null = body?.externalId ?? null;
  const fullName = body?.name?.formatted
    || (body?.name?.givenName || body?.name?.familyName
      ? `${body.name.givenName ?? ""} ${body.name.familyName ?? ""}`.trim()
      : null)
    || body?.displayName;

  // PUT é replace completo: aceita troca de e-mail primário via userName ou emails[primary=true].value
  const newEmail =
    extractPrimaryEmail(body?.emails)
    || (typeof body?.userName === "string" && body.userName.trim()
        ? body.userName.trim().toLowerCase()
        : null);

  if (newEmail && newEmail !== (link as any).profiles.email) {
    const errMsg = await updateUserEmail(admin, link.user_id as string, newEmail);
    if (errMsg) return err(500, `Email update failed: ${errMsg}`);
  }

  if (fullName) {
    await admin.from("profiles").update({ full_name: fullName }).eq("id", (link as any).profiles.id);
  }
  await admin.from("user_empresas").update({
    role, ativo: active, scim_external_id: externalId,
  }).eq("id", id);
  await syncUserRole(admin, link.user_id as string, role);

  const { data: fresh } = await admin.from("user_empresas")
    .select("*, profiles!inner(id,email,full_name)")
    .eq("id", id).maybeSingle();
  return ok(userToScim((fresh as any).profiles, fresh, empresaId));
}

async function deleteUser(admin: SupabaseClient, empresaId: string, id: string) {
  const { data: link } = await admin.from("user_empresas")
    .select("user_id, scim_external_id").eq("id", id).eq("empresa_id", empresaId).maybeSingle();
  if (!link) return err(404, "User not found");
  await admin.from("user_empresas").update({ ativo: false }).eq("id", id);
  return { resp: new Response(null, { status: 204, headers: scimHeaders }), userId: link.user_id as string, externalId: link.scim_external_id as string | null };
}

// ============================== handlers: Groups ==============================

async function listProviderIdsForEmpresa(admin: SupabaseClient, empresaId: string): Promise<string[]> {
  const { data } = await admin.from("sso_providers").select("id").eq("empresa_id", empresaId);
  return (data ?? []).map((p: any) => p.id);
}

async function fetchGroupMembers(admin: SupabaseClient, empresaId: string, role: AppRole) {
  const { data } = await admin.from("user_empresas")
    .select("id, profiles!inner(email)").eq("empresa_id", empresaId).eq("role", role).eq("ativo", true);
  return (data ?? []).map((r: any) => ({ value: r.id as string, display: r.profiles.email as string }));
}

async function listGroups(admin: SupabaseClient, empresaId: string, url: URL) {
  const provIds = await listProviderIdsForEmpresa(admin, empresaId);
  if (!provIds.length) return ok(listResp([], 0, 1));

  const startIndex = Math.max(parseInt(url.searchParams.get("startIndex") || "1"), 1);
  const count = Math.min(Math.max(parseInt(url.searchParams.get("count") || "50"), 0), 200);
  const filter = url.searchParams.get("filter") || "";
  const clauses = parseFilter(filter);
  if (clauses === null) return err(400, `Filter not supported: ${filter}`, "invalidFilter");

  let q = admin.from("sso_role_mappings").select("*", { count: "exact" }).in("provider_id", provIds);
  for (const c of clauses) {
    if (c.attr.toLowerCase() === "displayname") q = q.eq("idp_group", c.value);
    else return err(400, `Unsupported filter attribute: ${c.attr}`, "invalidFilter");
  }

  const { data, count: total } = await q.range(startIndex - 1, startIndex - 1 + count - 1);
  const Resources = await Promise.all((data ?? []).map(async (g: any) =>
    groupToScim(g, await fetchGroupMembers(admin, empresaId, g.app_role as AppRole))
  ));
  return ok(listResp(Resources, total ?? Resources.length, startIndex));
}

async function getGroup(admin: SupabaseClient, empresaId: string, id: string) {
  const provIds = await listProviderIdsForEmpresa(admin, empresaId);
  if (!provIds.length) return err(404, "Group not found");
  const { data: g } = await admin.from("sso_role_mappings").select("*")
    .eq("id", id).in("provider_id", provIds).maybeSingle();
  if (!g) return err(404, "Group not found");
  return ok(groupToScim(g, await fetchGroupMembers(admin, empresaId, (g as any).app_role)));
}

async function createGroup(admin: SupabaseClient, providerId: string | null, empresaId: string, body: any) {
  if (!providerId) return err(400, "Group provisioning requires SCIM token bound to provider_id");
  // Garante que provider pertence à empresa do token
  const { data: prov } = await admin.from("sso_providers").select("id,empresa_id")
    .eq("id", providerId).maybeSingle();
  if (!prov || prov.empresa_id !== empresaId) return err(403, "Provider mismatch");

  const displayName = String(body?.displayName || "").trim();
  if (!displayName) return err(400, "displayName required", "invalidValue");
  const role = await resolveRole(admin, providerId, displayName);

  const { data: g, error } = await admin.from("sso_role_mappings").upsert(
    { provider_id: providerId, idp_group: displayName, app_role: role },
    { onConflict: "provider_id,idp_group" }
  ).select().single();
  if (error || !g) return err(500, error?.message || "Failed to create group");

  // Aplica members iniciais (se enviados)
  for (const m of body?.members ?? []) {
    if (m?.value) await applyMemberRole(admin, empresaId, m.value, (g as any).app_role);
  }
  return ok(groupToScim(g, await fetchGroupMembers(admin, empresaId, (g as any).app_role)), 201);
}

async function applyMemberRole(admin: SupabaseClient, empresaId: string, linkId: string, role: AppRole) {
  const { data: link } = await admin.from("user_empresas").select("user_id")
    .eq("id", linkId).eq("empresa_id", empresaId).maybeSingle();
  if (!link) return;
  await admin.from("user_empresas").update({ role }).eq("id", linkId);
  await syncUserRole(admin, link.user_id as string, role);
}

async function patchGroup(admin: SupabaseClient, empresaId: string, id: string, body: any) {
  const provIds = await listProviderIdsForEmpresa(admin, empresaId);
  if (!provIds.length) return err(404, "Group not found");
  const { data: g } = await admin.from("sso_role_mappings").select("*")
    .eq("id", id).in("provider_id", provIds).maybeSingle();
  if (!g) return err(404, "Group not found");

  const role = (g as any).app_role as AppRole;

  for (const op of body?.Operations || []) {
    const action = String(op?.op || "").toLowerCase();
    const rawPath = (op?.path ?? "").toLowerCase();
    const value = op?.value;

    if (rawPath === "displayname") {
      await admin.from("sso_role_mappings").update({ idp_group: String(value ?? "") }).eq("id", id);
      continue;
    }
    if (rawPath === "members" || rawPath.startsWith("members")) {
      const members: any[] = Array.isArray(value) ? value : (value ? [value] : []);
      if (action === "add") {
        for (const m of members) if (m?.value) await applyMemberRole(admin, empresaId, m.value, role);
      } else if (action === "remove") {
        for (const m of members) if (m?.value) await applyMemberRole(admin, empresaId, m.value, "visualizador");
      } else if (action === "replace") {
        const current = await fetchGroupMembers(admin, empresaId, role);
        const incoming = new Set(members.map(m => m.value).filter(Boolean));
        for (const cur of current) if (!incoming.has(cur.value)) await applyMemberRole(admin, empresaId, cur.value, "visualizador");
        for (const v of incoming) await applyMemberRole(admin, empresaId, v, role);
      }
      continue;
    }
    return err(400, `Unsupported path: ${op?.path}`, "invalidPath");
  }

  const { data: fresh } = await admin.from("sso_role_mappings").select("*").eq("id", id).maybeSingle();
  return ok(groupToScim(fresh, await fetchGroupMembers(admin, empresaId, (fresh as any).app_role)));
}

async function putGroup(admin: SupabaseClient, empresaId: string, id: string, body: any) {
  return patchGroup(admin, empresaId, id, {
    Operations: [
      ...(body?.displayName ? [{ op: "replace", path: "displayName", value: body.displayName }] : []),
      { op: "replace", path: "members", value: body?.members ?? [] },
    ],
  });
}

async function deleteGroup(admin: SupabaseClient, empresaId: string, id: string) {
  const provIds = await listProviderIdsForEmpresa(admin, empresaId);
  if (!provIds.length) return err(404, "Group not found");
  const { error } = await admin.from("sso_role_mappings").delete()
    .eq("id", id).in("provider_id", provIds);
  if (error) return err(500, error.message);
  return new Response(null, { status: 204, headers: scimHeaders });
}

// ============================== main handler ==============================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1\/scim-server/, "") || "/";
  const seg = path.split("/").filter(Boolean); // ["scim","v2",resource,id?]
  const resource = seg[2];
  const id = seg[3];

  try {
    // ---------- Discovery (público) ----------
    if (req.method === "GET" && resource === "ServiceProviderConfig") return ok(SP_CONFIG_PAYLOAD);
    if (req.method === "GET" && resource === "ResourceTypes") {
      if (id) {
        const r = RESOURCE_TYPES_PAYLOAD.Resources.find(x => x.id === id);
        return r ? ok(r) : err(404, "ResourceType not found");
      }
      return ok(listResp(RESOURCE_TYPES_PAYLOAD.Resources, RESOURCE_TYPES_PAYLOAD.Resources.length, 1));
    }
    if (req.method === "GET" && resource === "Schemas") {
      if (id) {
        const s = SCHEMAS_PAYLOAD.Resources.find(x => x.id === id);
        return s ? ok(s) : err(404, "Schema not found");
      }
      return ok(listResp(SCHEMAS_PAYLOAD.Resources, SCHEMAS_PAYLOAD.Resources.length, 1));
    }

    // ---------- Auth ----------
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return err(401, "Missing bearer token");
    const tokenHash = await sha256(auth.slice(7));
    const { data: tok } = await admin.from("scim_tokens").select("*")
      .eq("token_hash", tokenHash).eq("ativo", true).maybeSingle();
    if (!tok) return err(401, "Invalid token");
    if (tok.expires_at && new Date(tok.expires_at) < new Date()) return err(401, "Token expired");
    admin.from("scim_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tok.id).then(() => {});

    const empresaId = tok.empresa_id as string;
    const providerId = (tok.provider_id ?? null) as string | null;

    let resp: Response;
    let opName = req.method.toLowerCase();
    let externalId: string | null = null;
    let userId: string | null = null;
    const reqBody = ["POST", "PUT", "PATCH"].includes(req.method) ? await req.clone().json().catch(() => null) : null;

    // ---------- Users ----------
    if (resource === "Users") {
      if (req.method === "GET" && !id) { resp = await listUsers(admin, empresaId, url); opName = "list"; }
      else if (req.method === "GET" && id) { resp = await getUser(admin, empresaId, id); opName = "get"; }
      else if (req.method === "POST" && !id) { resp = await createUser(admin, providerId, empresaId, reqBody); opName = "create"; externalId = reqBody?.externalId ?? null; }
      else if (req.method === "PATCH" && id) { resp = await patchUser(admin, providerId, empresaId, id, reqBody); opName = "patch"; }
      else if (req.method === "PUT" && id) { resp = await putUser(admin, providerId, empresaId, id, reqBody); opName = "put"; }
      else if (req.method === "DELETE" && id) {
        const r = await deleteUser(admin, empresaId, id);
        resp = r.resp; opName = "delete"; userId = r.userId; externalId = r.externalId;
      }
      else resp = err(405, "Method not allowed");
    }
    // ---------- Groups ----------
    else if (resource === "Groups") {
      if (req.method === "GET" && !id) { resp = await listGroups(admin, empresaId, url); opName = "list"; }
      else if (req.method === "GET" && id) { resp = await getGroup(admin, empresaId, id); opName = "get"; }
      else if (req.method === "POST" && !id) { resp = await createGroup(admin, providerId, empresaId, reqBody); opName = "create"; }
      else if (req.method === "PATCH" && id) { resp = await patchGroup(admin, empresaId, id, reqBody); opName = "patch"; }
      else if (req.method === "PUT" && id) { resp = await putGroup(admin, empresaId, id, reqBody); opName = "put"; }
      else if (req.method === "DELETE" && id) { resp = await deleteGroup(admin, empresaId, id); opName = "delete"; }
      else resp = err(405, "Method not allowed");
    }
    else resp = err(404, `Resource ${resource ?? "(none)"} not supported`);

    // log (best-effort, não bloqueia resposta)
    let resBodyForLog: unknown = null;
    if (resp.status !== 204 && resp.headers.get("content-type")?.includes("scim+json")) {
      try { resBodyForLog = await resp.clone().json(); } catch {}
    }
    await logOp(admin, {
      tokenId: tok.id, empresaId, resource: resource || "unknown", operation: opName,
      externalId, userId, status: resp.status,
      reqBody, resBody: resBodyForLog, t0,
    });
    return resp;
  } catch (e) {
    return err(500, e instanceof Error ? e.message : "unknown");
  }
});
