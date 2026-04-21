import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Escopo = "financeiro" | "tributario" | "sistema" | "conformidade";

interface Body {
  periodo_inicio: string; // YYYY-MM-DD
  periodo_fim: string;
  escopos: Escopo[];
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  // BOM UTF-8 para Excel
  return "\uFEFF" + lines.join("\n");
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Cliente para validar JWT
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente service role para checar role e ler trilhas
    const admin = createClient(url, serviceKey);
    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.periodo_inicio || !body.periodo_fim || !Array.isArray(body.escopos) || body.escopos.length === 0) {
      return new Response(JSON.stringify({ error: "invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inicioISO = `${body.periodo_inicio}T00:00:00.000Z`;
    const fimISO = `${body.periodo_fim}T23:59:59.999Z`;

    const zip = new JSZip();
    const manifest: Record<string, unknown> = {
      gerado_em: new Date().toISOString(),
      gerado_por: userData.user.email,
      gerado_por_id: userData.user.id,
      periodo_inicio: body.periodo_inicio,
      periodo_fim: body.periodo_fim,
      escopos: body.escopos,
      arquivos: {} as Record<string, { linhas: number; sha256: string }>,
    };

    const adicionarArquivo = async (nome: string, rows: Record<string, unknown>[]) => {
      const csv = toCSV(rows);
      const hash = await sha256(csv);
      zip.file(nome, csv);
      (manifest.arquivos as Record<string, { linhas: number; sha256: string }>)[nome] = {
        linhas: rows.length,
        sha256: hash,
      };
    };

    if (body.escopos.includes("financeiro")) {
      const { data } = await admin
        .from("auditoria_financeira")
        .select("*")
        .gte("created_at", inicioISO)
        .lte("created_at", fimISO)
        .order("created_at", { ascending: false })
        .limit(50000);
      await adicionarArquivo("trilha-financeira.csv", (data ?? []) as Record<string, unknown>[]);
    }

    if (body.escopos.includes("tributario")) {
      const { data } = await admin
        .from("auditoria_tributaria")
        .select("*")
        .gte("criado_em", inicioISO)
        .lte("criado_em", fimISO)
        .order("criado_em", { ascending: false })
        .limit(50000);
      await adicionarArquivo("trilha-tributaria.csv", (data ?? []) as Record<string, unknown>[]);
    }

    if (body.escopos.includes("sistema")) {
      const { data } = await admin
        .from("audit_logs")
        .select("*")
        .gte("created_at", inicioISO)
        .lte("created_at", fimISO)
        .order("created_at", { ascending: false })
        .limit(50000);
      await adicionarArquivo("trilha-sistema.csv", (data ?? []) as Record<string, unknown>[]);
    }

    if (body.escopos.includes("conformidade")) {
      const { data } = await admin
        .from("verificacoes_conformidade")
        .select("*")
        .gte("created_at", inicioISO)
        .lte("created_at", fimISO)
        .order("created_at", { ascending: false })
        .limit(50000);
      await adicionarArquivo("conformidade-fiscal.csv", (data ?? []) as Record<string, unknown>[]);
    }

    const manifestJson = JSON.stringify(manifest, null, 2);
    zip.file("manifest.json", manifestJson);
    zip.file(
      "README.txt",
      `Pacote de Evidências de Auditoria
Gerado em: ${manifest.gerado_em}
Gerado por: ${manifest.gerado_por}
Período: ${body.periodo_inicio} a ${body.periodo_fim}

Para validar a integridade dos arquivos, calcule SHA-256 de cada CSV e compare
com os hashes em manifest.json. Hashes idênticos garantem que os arquivos não
foram alterados após a geração.

Em sistemas Unix:  shasum -a 256 trilha-financeira.csv
Em Windows PS:     Get-FileHash trilha-financeira.csv -Algorithm SHA256
`
    );

    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    const filename = `evidencias_${body.periodo_inicio}_${body.periodo_fim}_${Date.now()}.zip`;
    const storagePath = `evidencias/${filename}`;

    const { error: uploadErr } = await admin.storage
      .from("relatorios-tributarios")
      .upload(storagePath, zipBytes, { contentType: "application/zip", upsert: false });
    if (uploadErr) throw uploadErr;

    const { data: signed, error: signErr } = await admin.storage
      .from("relatorios-tributarios")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (signErr) throw signErr;

    const { data: pacote, error: insErr } = await admin
      .from("evidencias_pacotes")
      .insert({
        gerado_por: userData.user.id,
        gerado_por_email: userData.user.email,
        periodo_inicio: body.periodo_inicio,
        periodo_fim: body.periodo_fim,
        escopos: body.escopos,
        storage_path: storagePath,
        manifest,
        tamanho_bytes: zipBytes.byteLength,
      })
      .select()
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({ ok: true, pacote, signed_url: signed.signedUrl, manifest }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("gerar-pacote-evidencias error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
