import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const BITRIX_DOMAIN = Deno.env.get("BITRIX24_DOMAIN");
const BITRIX_CLIENT_ID = Deno.env.get("BITRIX24_CLIENT_ID");
const BITRIX_CLIENT_SECRET = Deno.env.get("BITRIX24_CLIENT_SECRET");

interface SyncBody {
  avatar_url?: string | null;
  telefone?: string | null;
}

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Limpa telefone removendo espaços e separadores comuns, preservando + inicial. */
function normalizePhone(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  return (hasPlus ? "+" : "") + digits;
}

/** Obtém token Bitrix válido: tenta tabela `bitrix_oauth_tokens`, faz refresh se preciso, cai em env. */
async function getBitrixToken(admin: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: tokenRow } = await admin
    .from("bitrix_oauth_tokens")
    .select("access_token, refresh_token, expires_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tokenRow?.access_token) {
    const expiresAt = tokenRow.expires_at ? new Date(tokenRow.expires_at).getTime() : 0;
    if (expiresAt - Date.now() > 5 * 60 * 1000) return tokenRow.access_token;

    if (tokenRow.refresh_token && BITRIX_DOMAIN && BITRIX_CLIENT_ID && BITRIX_CLIENT_SECRET) {
      try {
        const r = await fetch(`https://${BITRIX_DOMAIN}/oauth/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: BITRIX_CLIENT_ID,
            client_secret: BITRIX_CLIENT_SECRET,
            refresh_token: tokenRow.refresh_token,
          }),
        });
        if (r.ok) {
          const d = await r.json();
          const newExp = new Date(Date.now() + (d.expires_in || 3600) * 1000).toISOString();
          await admin.from("bitrix_oauth_tokens").insert({
            access_token: d.access_token,
            refresh_token: d.refresh_token,
            expires_at: newExp,
          });
          return d.access_token as string;
        }
      } catch (_) { /* ignore, fallback abaixo */ }
    }
  }

  return Deno.env.get("BITRIX24_ACCESS_TOKEN") ?? null;
}

async function bitrixCall(method: string, payload: Record<string, unknown>) {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = await getBitrixToken(admin);
  if (!token) throw new Error("bitrix_token_missing");
  if (!BITRIX_DOMAIN) throw new Error("bitrix_domain_missing");

  const url = `https://${BITRIX_DOMAIN}/rest/${method}.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, auth: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(`bitrix_api_error:${data.error || res.status}:${data.error_description || ""}`);
  }
  return data.result;
}

/** Procura o primeiro contato Bitrix por email. Retorna ID ou null. */
async function findBitrixContactByEmail(email: string): Promise<string | null> {
  const result = await bitrixCall("crm.contact.list", {
    filter: { EMAIL: email },
    select: ["ID", "EMAIL", "PHONE"],
  });
  if (Array.isArray(result) && result.length > 0) return String(result[0].ID);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "method_not_allowed" }, 405);

  // Autenticação: precisamos do user logado
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "unauthorized" }, 401);

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResp({ error: "unauthorized" }, 401);
  const user = userData.user;

  // Body
  let body: SyncBody;
  try {
    body = (await req.json()) as SyncBody;
  } catch {
    return jsonResp({ error: "invalid_json" }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Carrega valores atuais do profile como fallback (caso o cliente envie só um dos campos)
  const { data: profile } = await admin
    .from("profiles")
    .select("email, avatar_url, telefone, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.email) return jsonResp({ error: "profile_email_missing" }, 404);

  const emailLower = String(profile.email).toLowerCase();
  const avatarUrl =
    body.avatar_url !== undefined ? body.avatar_url : (profile.avatar_url ?? null);
  const telefoneNorm = normalizePhone(
    body.telefone !== undefined ? body.telefone : profile.telefone,
  );

  if (!avatarUrl && !telefoneNorm) {
    return jsonResp({ ok: true, skipped: true, reason: "nothing_to_sync" });
  }

  if (!BITRIX_DOMAIN) {
    return jsonResp({ error: "bitrix_not_configured" }, 503);
  }

  try {
    const contactId = await findBitrixContactByEmail(emailLower);
    if (!contactId) {
      // Log e retorno graceful — não criamos contato automaticamente.
      await admin.from("audit_logs").insert({
        user_id: user.id,
        user_email: emailLower,
        action: "UPDATE",
        table_name: "bitrix_profile_sync",
        record_id: null,
        new_data: {
          status: "contact_not_found",
          email: emailLower,
        },
        details: "Bitrix24: contato não encontrado por email",
      });
      return jsonResp({ ok: false, error: "bitrix_contact_not_found" }, 404);
    }

    const fields: Record<string, unknown> = {};
    if (telefoneNorm) {
      fields.PHONE = [{ VALUE: telefoneNorm, VALUE_TYPE: "WORK" }];
    }
    if (avatarUrl) {
      // Bitrix aceita PHOTO como objeto { fileData: [name, base64] } ou URL via UF.
      // Quando é URL pública, gravamos em campo customizado UF_CRM_AVATAR_URL (se existir)
      // e também tentamos PHOTO via fetch + base64.
      fields.UF_CRM_AVATAR_URL = avatarUrl;
      try {
        const imgRes = await fetch(avatarUrl);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          // base64 encode
          let bin = "";
          for (let i = 0; i < buf.byteLength; i++) bin += String.fromCharCode(buf[i]);
          const b64 = btoa(bin);
          const ext = (avatarUrl.split(".").pop() || "jpg").split("?")[0].toLowerCase();
          const safeExt = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
          fields.PHOTO = { fileData: [`avatar.${safeExt}`, b64] };
        }
      } catch (_) { /* avatar opcional, segue sem PHOTO */ }
    }

    await bitrixCall("crm.contact.update", {
      id: contactId,
      fields,
    });

    await admin.from("audit_logs").insert({
      user_id: user.id,
      user_email: emailLower,
      action: "UPDATE",
      table_name: "bitrix_profile_sync",
      record_id: contactId,
      new_data: {
        bitrix_contact_id: contactId,
        synced_fields: Object.keys(fields),
        avatar_url: avatarUrl ?? null,
        telefone: telefoneNorm ?? null,
      },
      details: "Sincronização avatar/telefone do perfil para Bitrix24",
    });

    return jsonResp({
      ok: true,
      bitrix_contact_id: contactId,
      synced_fields: Object.keys(fields),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sync-profile-to-bitrix] error", msg);
    await admin.from("audit_logs").insert({
      user_id: user.id,
      user_email: emailLower,
      action: "UPDATE",
      table_name: "bitrix_profile_sync",
      record_id: null,
      new_data: { error: msg },
      details: "Falha ao sincronizar perfil para Bitrix24",
    });
    return jsonResp({ ok: false, error: "sync_failed", details: msg }, 500);
  }
});
