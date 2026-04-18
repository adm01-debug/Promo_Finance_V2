import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOOL_DEF = {
  type: "function",
  function: {
    name: "extract_nf_data",
    description: "Extrai dados estruturados de uma nota fiscal brasileira (NFe/NFSe).",
    parameters: {
      type: "object",
      properties: {
        cnpj_emissor: { type: "string", description: "CNPJ do emissor (apenas dígitos)" },
        razao_social_emissor: { type: "string" },
        cnpj_tomador: { type: "string", description: "CNPJ do tomador/destinatário (apenas dígitos)" },
        razao_social_tomador: { type: "string" },
        numero_nf: { type: "string" },
        data_emissao: { type: "string", description: "ISO YYYY-MM-DD" },
        valor_total: { type: "number" },
        descricao: { type: "string" },
        cfop: { type: "string" },
        impostos: {
          type: "object",
          properties: {
            icms: { type: "number" }, ipi: { type: "number" },
            pis: { type: "number" }, cofins: { type: "number" },
            iss: { type: "number" }, cbs: { type: "number" }, ibs: { type: "number" },
          },
        },
      },
      required: ["valor_total", "data_emissao"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurado");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { arquivo_url, arquivo_base64, arquivo_tipo, arquivo_nome, empresa_id } = await req.json();
    if (!arquivo_base64 && !arquivo_url) {
      return new Response(JSON.stringify({ error: "arquivo_base64 ou arquivo_url é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Cria registro inicial em status processando
    const { data: registro, error: errReg } = await supabase
      .from("notas_fiscais_ocr").insert({
        empresa_id: empresa_id ?? null,
        arquivo_url: arquivo_url ?? `inline:${arquivo_nome ?? "nf"}`,
        arquivo_nome, arquivo_tipo,
        status: "processando",
        criado_por: user.id,
      }).select("id").single();
    if (errReg) throw errReg;

    const imageUrl = arquivo_base64
      ? `data:${arquivo_tipo ?? "image/jpeg"};base64,${arquivo_base64}`
      : arquivo_url;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em OCR de notas fiscais brasileiras. Extraia os dados solicitados via tool calling. Use apenas dígitos para CNPJs. Datas em ISO YYYY-MM-DD.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia os dados desta nota fiscal." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [TOOL_DEF],
        tool_choice: { type: "function", function: { name: "extract_nf_data" } },
      }),
    });

    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      const status = aiResp.status === 429 ? 429 : aiResp.status === 402 ? 402 : 500;
      const msg = aiResp.status === 429 ? "Rate limit excedido" : aiResp.status === 402 ? "Créditos esgotados" : "Erro AI";
      await supabase.from("notas_fiscais_ocr").update({ status: "erro", mensagem_erro: `${msg}: ${errTxt}` }).eq("id", registro.id);
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("IA não retornou tool call");

    const dadosExtraidos = JSON.parse(toolCall.function.arguments);

    await supabase.from("notas_fiscais_ocr").update({
      status: "sucesso", dados_extraidos: dadosExtraidos,
    }).eq("id", registro.id);

    return new Response(JSON.stringify({
      success: true, id: registro.id, dados_extraidos: dadosExtraidos,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ocr error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
