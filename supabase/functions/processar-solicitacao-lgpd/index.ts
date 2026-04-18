import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  solicitacao_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startedAt = Date.now();
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = (await req.json()) as Payload;
    if (!body?.solicitacao_id) {
      return new Response(JSON.stringify({ error: "solicitacao_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: sol, error: solErr } = await adminClient
      .from("solicitacoes_lgpd")
      .select("*")
      .eq("id", body.solicitacao_id)
      .maybeSingle();
    if (solErr || !sol) {
      return new Response(JSON.stringify({ error: "Solicitação não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permissão: dono ou admin
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (sol.user_id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUserId = sol.user_id;
    let payloadResposta: Record<string, unknown> = {};
    let urlDump: string | null = null;

    // Coletar dados do titular
    const [profile, alertas, audits, solicitacoes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", targetUserId).maybeSingle(),
      adminClient.from("alertas").select("*").eq("user_id", targetUserId).limit(1000),
      adminClient
        .from("audit_logs")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(1000),
      adminClient
        .from("solicitacoes_lgpd")
        .select("*")
        .eq("user_id", targetUserId),
    ]);

    const dump = {
      gerado_em: new Date().toISOString(),
      titular: { id: targetUserId, email: sol.user_email },
      profile: profile.data,
      alertas: alertas.data ?? [],
      audit_logs: audits.data ?? [],
      solicitacoes_lgpd: solicitacoes.data ?? [],
    };

    if (sol.tipo === "acesso") {
      payloadResposta = dump;
    } else if (sol.tipo === "portabilidade") {
      // Gera CSV agregado e faz upload
      const sections: string[] = [];
      sections.push(`# DUMP LGPD — ${sol.user_email} — ${new Date().toISOString()}`);
      for (const [name, rows] of Object.entries({
        profile: profile.data ? [profile.data] : [],
        alertas: alertas.data ?? [],
        audit_logs: audits.data ?? [],
        solicitacoes_lgpd: solicitacoes.data ?? [],
      })) {
        sections.push(`\n\n## ${name}`);
        const arr = rows as Record<string, unknown>[];
        if (arr.length === 0) {
          sections.push("(sem registros)");
          continue;
        }
        const headers = Object.keys(arr[0]);
        sections.push(headers.join(","));
        for (const r of arr) {
          sections.push(
            headers
              .map((h) => {
                const v = r[h];
                if (v == null) return "";
                const s = typeof v === "string" ? v : JSON.stringify(v);
                return `"${s.replace(/"/g, '""')}"`;
              })
              .join(",")
          );
        }
      }
      const csv = "\uFEFF" + sections.join("\n");
      const path = `lgpd/${targetUserId}/dump-${Date.now()}.csv`;
      const { error: upErr } = await adminClient.storage
        .from("relatorios-tributarios")
        .upload(path, new Blob([csv], { type: "text/csv" }), {
          contentType: "text/csv; charset=utf-8",
          upsert: true,
        });
      if (upErr) throw upErr;
      const { data: signed } = await adminClient.storage
        .from("relatorios-tributarios")
        .createSignedUrl(path, 60 * 60 * 24);
      urlDump = signed?.signedUrl ?? null;
      payloadResposta = { formato: "csv", path, registros: dump };
    } else if (sol.tipo === "exclusao" || sol.tipo === "anonimizacao") {
      const hashed = `anon-${targetUserId.slice(0, 8)}@removido.local`;
      await adminClient
        .from("profiles")
        .update({
          full_name: "Titular removido",
          email: hashed,
          avatar_url: null,
          phone: null,
        })
        .eq("id", targetUserId);
      payloadResposta = {
        anonimizado_em: new Date().toISOString(),
        email_substituto: hashed,
      };
    } else if (sol.tipo === "retificacao") {
      payloadResposta = {
        instrucoes:
          "Retificação requer revisão manual do administrador. Justificativa registrada.",
      };
    }

    // Atualiza solicitação
    await adminClient
      .from("solicitacoes_lgpd")
      .update({
        status: "atendida",
        payload_resposta: payloadResposta,
        url_dump: urlDump,
        atendida_em: new Date().toISOString(),
        atendida_por: userId,
      })
      .eq("id", sol.id);

    // Auditoria P9
    await adminClient.from("auditoria_tributaria").insert({
      acao: "update",
      entidade_tipo: "solicitacoes_lgpd",
      entidade_id: sol.id,
      user_id: userId,
      user_email: userData.user.email,
      payload_novo: { tipo: sol.tipo, atendida: true },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        tipo: sol.tipo,
        url_dump: urlDump,
        payload: payloadResposta,
        duration_ms: Date.now() - startedAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("processar-solicitacao-lgpd error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
