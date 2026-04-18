// Edge: copilot-global
// Assistente IA contextual para todas as páginas. SSE streaming via Lovable AI Gateway.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const ROLES_PERMITIDOS = new Set(["admin", "financeiro", "visualizador"]);

function buildSystemPrompt(contexto: string): string {
  const base =
    "Você é o Copilot Global, um assistente IA especialista em gestão financeira e tributária brasileira. " +
    "Responda em português, de forma concisa, com markdown leve (negrito, listas). " +
    "Use as ferramentas disponíveis para buscar dados reais antes de responder. " +
    "Se a pergunta exigir dados específicos da empresa, use as tools.";
  switch (contexto) {
    case "tributario":
    case "reforma-tributaria":
      return `${base} Você está na área TRIBUTÁRIA. Foco em CBS/IBS/IS, Reforma Tributária, LC 214/25, créditos.`;
    case "admin":
      return `${base} Você está em ADMIN. Foco em saúde do sistema, automações, anomalias, SLO.`;
    case "financeiro":
    default:
      return `${base} Você está em FINANCEIRO. Foco em contas a pagar/receber, fluxo de caixa, conciliação.`;
  }
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "consultar_kpis_financeiros",
      description: "Retorna KPIs financeiros agregados: total a pagar, a receber, saldo bancário",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_acoes_recomendadas",
      description: "Lista as ações recomendadas pela IA (top 5 priorizadas)",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_alertas_criticos",
      description: "Lista alertas críticos não lidos do usuário",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "consultar_health_score",
      description: "Retorna o último health score operacional calculado",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

async function executeTool(name: string, sb: ReturnType<typeof createClient>, userId: string) {
  try {
    if (name === "consultar_kpis_financeiros") {
      const [{ data: cp }, { data: cr }, { data: contas }] = await Promise.all([
        sb.from("contas_pagar").select("valor,status").in("status", ["pendente", "vencido", "atrasado"]),
        sb.from("contas_receber").select("valor,status").in("status", ["pendente", "vencido", "atrasado"]),
        sb.from("contas_bancarias").select("saldo_atual").eq("ativo", true),
      ]);
      const totalPagar = (cp ?? []).reduce((s: number, x: any) => s + Number(x.valor || 0), 0);
      const totalReceber = (cr ?? []).reduce((s: number, x: any) => s + Number(x.valor || 0), 0);
      const saldoTotal = (contas ?? []).reduce((s: number, x: any) => s + Number(x.saldo_atual || 0), 0);
      return { totalPagar, totalReceber, saldoTotal, saldoLiquido: saldoTotal + totalReceber - totalPagar };
    }
    if (name === "listar_acoes_recomendadas") {
      const { data } = await sb.from("acoes_recomendadas").select("titulo,descricao,urgencia,impacto_estimado").gt("expires_at", new Date().toISOString()).order("ordem").limit(5);
      return data ?? [];
    }
    if (name === "buscar_alertas_criticos") {
      const { data } = await sb.from("alertas").select("titulo,mensagem,prioridade,created_at").eq("user_id", userId).eq("lido", false).in("prioridade", ["alta", "critica"]).order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    }
    if (name === "consultar_health_score") {
      const { data } = await (sb as any).from("health_scores_operacionais").select("*").order("calculado_em", { ascending: false }).limit(1).maybeSingle();
      return data ?? { mensagem: "Nenhum health score calculado ainda" };
    }
    return { erro: "tool desconhecida" };
  } catch (e) {
    return { erro: (e as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "no auth" }), { status: 401, headers: corsHeaders });

    const sbUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await sbUser.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: "invalid auth" }), { status: 401, headers: corsHeaders });

    // RBAC
    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await sbAdmin.from("user_roles").select("role").eq("user_id", userData.user.id).maybeSingle();
    if (!roleRow || !ROLES_PERMITIDOS.has((roleRow as any).role)) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const contexto = String(body.contexto_pagina ?? "financeiro");
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const fullMessages = [
      { role: "system", content: buildSystemPrompt(contexto) },
      ...messages,
    ];

    // Loop tool calls (até 3 iterações)
    let workingMessages = fullMessages;
    for (let iter = 0; iter < 3; iter++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: workingMessages,
          tools: TOOLS,
          stream: false,
        }),
      });

      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Tente em alguns segundos." }), { status: 429, headers: corsHeaders });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), { status: 402, headers: corsHeaders });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("AI gateway:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: corsHeaders });
      }

      const data = await resp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      if (msg.tool_calls?.length) {
        workingMessages = [...workingMessages, msg];
        for (const tc of msg.tool_calls) {
          const result = await executeTool(tc.function.name, sbAdmin, userData.user.id);
          workingMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue; // próximo iter
      }

      // Resposta final → stream simulado em uma única mensagem
      const final = msg.content ?? "";
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          const chunkSize = 40;
          for (let i = 0; i < final.length; i += chunkSize) {
            const chunk = final.slice(i, i + chunkSize);
            const sse = `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`;
            controller.enqueue(enc.encode(sse));
          }
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(JSON.stringify({ error: "tool loop excedido" }), { status: 500, headers: corsHeaders });
  } catch (e) {
    console.error("copilot-global:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
