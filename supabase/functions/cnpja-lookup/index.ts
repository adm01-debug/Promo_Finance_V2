// Edge Function: cnpja-lookup
// Consulta dados cadastrais e tributários de CNPJ via API CNPJá Plus.
// Padrões: validação manual de JWT, retry exponencial, cache em memória 1h.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CnpjaCacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CnpjaCacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora

function sanitizeCnpj(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  return true;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCnpjaWithRetry(
  cnpj: string,
  apiKey: string,
  maxRetries = 3,
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt <= maxRetries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`https://api.cnpja.com/office/${cnpj}`, {
        method: "GET",
        headers: {
          Authorization: apiKey,
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) return res;
        const backoff = 2 ** attempt * 500 + Math.random() * 250;
        await sleep(backoff);
        attempt += 1;
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) throw err;
      const backoff = 2 ** attempt * 500 + Math.random() * 250;
      await sleep(backoff);
      attempt += 1;
    }
  }

  throw lastError ?? new Error("CNPJá: falha desconhecida após retries");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validação manual do JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Configuração Supabase ausente" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const cnpj = sanitizeCnpj(String(body?.cnpj ?? ""));

    if (!isValidCnpj(cnpj)) {
      return new Response(
        JSON.stringify({ error: "CNPJ inválido. Informe 14 dígitos." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cache
    const cached = cache.get(cnpj);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(
        JSON.stringify({ data: cached.data, cached: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = Deno.env.get("CNPJA_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CNPJA_API_KEY não configurada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const res = await fetchCnpjaWithRetry(cnpj, apiKey.trim());
    const text = await res.text();

    if (!res.ok) {
      return new Response(
        JSON.stringify({
          error: `CNPJá retornou ${res.status}`,
          detail: text.slice(0, 500),
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let raw: any;
    try {
      raw = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta CNPJá inválida" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Normalização para formato consumível pelo frontend
    const company = raw?.company ?? {};
    const address = raw?.address ?? {};
    const mainActivity = raw?.mainActivity ?? {};
    const sideActivities = Array.isArray(raw?.sideActivities)
      ? raw.sideActivities
      : [];
    const simples = company?.simples ?? null;
    const simei = company?.simei ?? null;

    let regimeAtual: "simples" | "mei" | "presumido_real" = "presumido_real";
    if (simei?.optant) regimeAtual = "mei";
    else if (simples?.optant) regimeAtual = "simples";

    const normalized = {
      cnpj,
      razaoSocial: company?.name ?? raw?.alias ?? "",
      nomeFantasia: raw?.alias ?? "",
      situacaoCadastral: raw?.status?.text ?? null,
      dataAbertura: raw?.founded ?? null,
      capitalSocial: company?.equity ?? null,
      naturezaJuridica: company?.nature?.text ?? null,
      porte: company?.size?.text ?? null,
      regimeAtual,
      simplesOptante: !!simples?.optant,
      meiOptante: !!simei?.optant,
      cnaePrincipal: mainActivity?.id
        ? {
            codigo: String(mainActivity.id),
            descricao: mainActivity.text ?? "",
          }
        : null,
      cnaesSecundarios: sideActivities.map((s: any) => ({
        codigo: String(s.id ?? ""),
        descricao: s.text ?? "",
      })),
      endereco: {
        logradouro: address?.street ?? "",
        numero: address?.number ?? "",
        complemento: address?.details ?? "",
        bairro: address?.district ?? "",
        cidade: address?.city ?? "",
        uf: address?.state ?? "",
        cep: address?.zip ?? "",
      },
      raw,
    };

    cache.set(cnpj, { data: normalized, expiresAt: Date.now() + CACHE_TTL_MS });

    return new Response(
      JSON.stringify({ data: normalized, cached: false }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    console.error("[cnpja-lookup] erro:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
