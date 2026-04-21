// SCIM 2.0 server (Users + Groups, subset)
// Path layout: /functions/v1/scim-server/scim/v2/{Users|Groups|Schemas|ServiceProviderConfig|ResourceTypes}/{id?}
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const scimHeaders = { ...corsHeaders, "Content-Type": "application/scim+json" };

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function err(status: number, detail: string) {
  return new Response(JSON.stringify({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    detail, status,
  }), { status, headers: scimHeaders });
}

function userToScim(u: any, link: any, empresaId: string) {
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: link.id,
    externalId: link.scim_external_id,
    userName: u.email,
    name: { formatted: u.full_name || u.email },
    emails: [{ value: u.email, primary: true }],
    active: link.ativo,
    "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User": {
      organization: empresaId,
      department: link.role,
    },
    meta: { resourceType: "User", created: link.created_at, lastModified: link.updated_at },
  };
}

async function logOp(admin: SupabaseClient, tokenId: string | null, empresaId: string | null,
  resource: string, op: string, externalId: string | null, userId: string | null,
  status: number, reqBody: unknown, resBody: unknown, t0: number) {
  await admin.from("scim_operations_log").insert({
    token_id: tokenId, empresa_id: empresaId, resource_type: resource, operation: op,
    external_id: externalId, user_id: userId, status_code: status,
    request_body: reqBody as any, response_body: resBody as any,
    duration_ms: Date.now() - t0,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const url = new URL(req.url);
  // Strip /functions/v1/scim-server prefix
  const path = url.pathname.replace(/^\/functions\/v1\/scim-server/, "") || "/";
  const seg = path.split("/").filter(Boolean); // ["scim","v2","Users","id?"]

  // ServiceProviderConfig (público)
  if (seg.join("/") === "scim/v2/ServiceProviderConfig") {
    return new Response(JSON.stringify({
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
      patch: { supported: true }, bulk: { supported: false },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false }, sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [{ type: "oauthbearertoken", name: "OAuth Bearer Token", description: "SCIM token", primary: true }],
    }), { headers: scimHeaders });
  }

  // Auth: Bearer SCIM token
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return err(401, "Missing bearer token");
  const tokenHash = await sha256(auth.slice(7));
  const { data: tok } = await admin.from("scim_tokens").select("*")
    .eq("token_hash", tokenHash).eq("ativo", true).maybeSingle();
  if (!tok) return err(401, "Invalid token");
  if (tok.expires_at && new Date(tok.expires_at) < new Date()) return err(401, "Token expired");
  await admin.from("scim_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", tok.id);

  const empresaId = tok.empresa_id as string;
  const resource = seg[2]; // Users | Groups | Schemas | ResourceTypes
  const id = seg[3];

  try {
    if (resource === "Users") {
      // ===== Users =====
      if (req.method === "GET" && !id) {
        const filter = url.searchParams.get("filter") || "";
        const startIndex = parseInt(url.searchParams.get("startIndex") || "1");
        const count = Math.min(parseInt(url.searchParams.get("count") || "50"), 200);
        let q = admin.from("user_empresas")
          .select("*, profiles!inner(id,email,full_name)", { count: "exact" })
          .eq("empresa_id", empresaId)
          .range(startIndex - 1, startIndex - 1 + count - 1);

        const m = filter.match(/userName eq "([^"]+)"/i) || filter.match(/emails eq "([^"]+)"/i);
        const ext = filter.match(/externalId eq "([^"]+)"/i);
        if (m) q = q.eq("profiles.email", m[1].toLowerCase());
        if (ext) q = q.eq("scim_external_id", ext[1]);

        const { data, count: total } = await q;
        const Resources = (data || []).map((row: any) => userToScim(row.profiles, row, empresaId));
        const body = {
          schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
          totalResults: total || 0, startIndex, itemsPerPage: Resources.length, Resources,
        };
        await logOp(admin, tok.id, empresaId, "Users", "list", null, null, 200, { filter }, { count: Resources.length }, t0);
        return new Response(JSON.stringify(body), { headers: scimHeaders });
      }

      if (req.method === "POST" && !id) {
        const b = await req.json();
        const email = String(b.userName || b.emails?.[0]?.value || "").toLowerCase();
        const fullName = b.name?.formatted || b.displayName || email;
        const externalId = b.externalId || null;
        const active = b.active !== false;
        if (!email) return err(400, "userName/emails required");

        // Cria/recupera auth.user
        const { data: list } = await admin.auth.admin.listUsers();
        let user = list.users.find(u => u.email?.toLowerCase() === email);
        if (!user) {
          const c = await admin.auth.admin.createUser({
            email, email_confirm: true, user_metadata: { full_name: fullName },
          });
          if (c.error) return err(500, c.error.message);
          user = c.data.user!;
        }

        const { data: link, error: linkErr } = await admin.from("user_empresas").upsert({
          user_id: user.id, empresa_id: empresaId, role: "visualizador",
          provisioned_via: "scim", scim_external_id: externalId, ativo: active,
        }, { onConflict: "user_id,empresa_id" }).select().single();
        if (linkErr) return err(500, linkErr.message);

        const body = userToScim({ email, full_name: fullName }, link, empresaId);
        await logOp(admin, tok.id, empresaId, "Users", "create", externalId, user.id, 201, b, body, t0);
        return new Response(JSON.stringify(body), { status: 201, headers: scimHeaders });
      }

      if (req.method === "GET" && id) {
        const { data: link } = await admin.from("user_empresas").select("*, profiles!inner(*)")
          .eq("id", id).eq("empresa_id", empresaId).maybeSingle();
        if (!link) return err(404, "User not found");
        return new Response(JSON.stringify(userToScim((link as any).profiles, link, empresaId)), { headers: scimHeaders });
      }

      if ((req.method === "PUT" || req.method === "PATCH") && id) {
        const b = await req.json();
        const updates: any = {};
        if (req.method === "PUT") {
          if (typeof b.active === "boolean") updates.ativo = b.active;
        } else {
          // PATCH operations
          for (const op of (b.Operations || [])) {
            const value = op.value;
            if (op.path === "active" || (typeof value === "object" && "active" in (value || {}))) {
              updates.ativo = typeof value === "boolean" ? value : value.active;
            }
          }
        }
        const { data: link } = await admin.from("user_empresas").update(updates)
          .eq("id", id).eq("empresa_id", empresaId).select("*, profiles!inner(*)").single();
        const body = userToScim((link as any).profiles, link, empresaId);
        await logOp(admin, tok.id, empresaId, "Users", req.method === "PUT" ? "update" : "patch", link.scim_external_id, link.user_id, 200, b, body, t0);
        return new Response(JSON.stringify(body), { headers: scimHeaders });
      }

      if (req.method === "DELETE" && id) {
        await admin.from("user_empresas").update({ ativo: false }).eq("id", id).eq("empresa_id", empresaId);
        await logOp(admin, tok.id, empresaId, "Users", "delete", null, null, 204, null, null, t0);
        return new Response(null, { status: 204, headers: scimHeaders });
      }
    }

    if (resource === "Groups") {
      // Mapeia para sso_role_mappings (apenas leitura/CRUD básico)
      if (req.method === "GET" && !id) {
        const { data: provs } = await admin.from("sso_providers").select("id").eq("empresa_id", empresaId);
        const provIds = (provs || []).map(p => p.id);
        const { data } = await admin.from("sso_role_mappings").select("*").in("provider_id", provIds);
        const Resources = (data || []).map(g => ({
          schemas: ["urn:ietf:params:scim:schemas:core:2.0:Group"],
          id: g.id, displayName: g.idp_group,
          members: [], meta: { resourceType: "Group" },
        }));
        return new Response(JSON.stringify({
          schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
          totalResults: Resources.length, startIndex: 1, itemsPerPage: Resources.length, Resources,
        }), { headers: scimHeaders });
      }
      return err(501, "Group write not implemented in MVP");
    }

    return err(404, `Resource ${resource} not supported`);
  } catch (e) {
    return err(500, e instanceof Error ? e.message : "unknown");
  }
});
