import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Escopo = "financeiro" | "tributario" | "sistema" | "conformidade";

interface Body {
  periodo_inicio: string;
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
  return "\uFEFF" + lines.join("\n");
}

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ProgressEvent {
  step: string;
  label: string;
  index: number;
  total: number;
  percent: number;
  detail?: string;
}

type Emit = (ev: ProgressEvent | { done: true; payload: unknown } | { error: string }) => void;

const ESCOPO_CONFIG: Record<Escopo, { table: string; dateCol: string; filename: string; label: string }> = {
  financeiro: { table: "auditoria_financeira", dateCol: "created_at", filename: "trilha-financeira.csv", label: "trilha financeira" },
  tributario: { table: "auditoria_tributaria", dateCol: "criado_em", filename: "trilha-tributaria.csv", label: "trilha tributária" },
  sistema: { table: "audit_logs", dateCol: "created_at", filename: "trilha-sistema.csv", label: "trilha de sistema" },
  conformidade: { table: "verificacoes_conformidade", dateCol: "created_at", filename: "conformidade-fiscal.csv", label: "conformidade fiscal" },
};

async function processarPacote(
  body: Body,
  user: { id: string; email: string | null | undefined },
  admin: ReturnType<typeof createClient>,
  emit: Emit,
) {
  const inicioISO = `${body.periodo_inicio}T00:00:00.000Z`;
  const fimISO = `${body.periodo_fim}T23:59:59.999Z`;

  // Etapas: 1 coleta por escopo + zip + upload + db = escopos.length + 3
  const escopos = body.escopos;
  const totalSteps = escopos.length + 3;
  let idx = 0;
  const send = (step: string, label: string, detail?: string) => {
    idx += 1;
    emit({
      step,
      label,
      index: idx,
      total: totalSteps,
      percent: Math.round((idx / totalSteps) * 100),
      detail,
    });
  };

  const zip = new JSZip();
  const manifest: Record<string, unknown> = {
    gerado_em: new Date().toISOString(),
    gerado_por: user.email,
    gerado_por_id: user.id,
    periodo_inicio: body.periodo_inicio,
    periodo_fim: body.periodo_fim,
    escopos,
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

  for (const escopo of escopos) {
    const cfg = ESCOPO_CONFIG[escopo];
    const { data } = await admin
      .from(cfg.table)
      .select("*")
      .gte(cfg.dateCol, inicioISO)
      .lte(cfg.dateCol, fimISO)
      .order(cfg.dateCol, { ascending: false })
      .limit(50000);
    const rows = (data ?? []) as Record<string, unknown>[];
    await adicionarArquivo(cfg.filename, rows);
    send(`coleta_${escopo}`, `Coletando ${cfg.label}`, `${rows.length.toLocaleString("pt-BR")} registros`);
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
com os hashes em manifest.json.

Unix:    shasum -a 256 trilha-financeira.csv
Windows: Get-FileHash trilha-financeira.csv -Algorithm SHA256
`,
  );

  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  send("compactar", "Compactando ZIP", `${(zipBytes.byteLength / 1024 / 1024).toFixed(2)} MB`);

  const filename = `evidencias_${body.periodo_inicio}_${body.periodo_fim}_${Date.now()}.zip`;
  const storagePath = `evidencias/${filename}`;
  const { error: uploadErr } = await admin.storage
    .from("relatorios-tributarios")
    .upload(storagePath, zipBytes, { contentType: "application/zip", upsert: false });
  if (uploadErr) throw uploadErr;
  send("upload", "Enviando ao storage seguro");

  const { data: signed, error: signErr } = await admin.storage
    .from("relatorios-tributarios")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  if (signErr) throw signErr;

  const { data: pacote, error: insErr } = await admin
    .from("evidencias_pacotes")
    .insert({
      gerado_por: user.id,
      gerado_por_email: user.email,
      periodo_inicio: body.periodo_inicio,
      periodo_fim: body.periodo_fim,
      escopos,
      storage_path: storagePath,
      manifest,
      tamanho_bytes: zipBytes.byteLength,
    })
    .select()
    .single();
  if (insErr) throw insErr;

  // Trilha de auditoria explícita: cada geração de pacote vira um EXPORT em audit_logs
  // com manifest completo (incluindo SHA-256 por arquivo) em new_data e um
  // resumo legível em details.
  const arquivos = manifest.arquivos as Record<string, { linhas: number; sha256: string }>;
  const totalLinhas = Object.values(arquivos).reduce((s, a) => s + a.linhas, 0);
  const detalhes =
    `Pacote de evidências gerado | período=${body.periodo_inicio}→${body.periodo_fim} | ` +
    `escopos=${escopos.join(",")} | arquivos=${Object.keys(arquivos).length} | ` +
    `linhas_total=${totalLinhas} | tamanho=${(zipBytes.byteLength / 1024 / 1024).toFixed(2)}MB | ` +
    `storage=${storagePath}`;

  const { error: auditErr } = await admin.rpc("log_audit", {
    _action: "EXPORT",
    _table_name: "evidencias_pacotes",
    _record_id: (pacote as { id: string }).id,
    _old_data: null,
    _new_data: {
      pacote_id: (pacote as { id: string }).id,
      storage_path: storagePath,
      tamanho_bytes: zipBytes.byteLength,
      periodo_inicio: body.periodo_inicio,
      periodo_fim: body.periodo_fim,
      escopos,
      manifest, // contém arquivos + sha256 + gerado_em
    },
    _details: detalhes,
  });
  if (auditErr) {
    // Não bloqueia a geração — apenas loga e segue
    console.error("audit_logs insert falhou:", auditErr.message);
  }

  send("registrar", "Registrando pacote", "concluído");

  return { ok: true, pacote, signed_url: signed.signedUrl, manifest };
}

async function autenticar(req: Request) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return { error: "unauthorized" as const, status: 401 };

  const admin = createClient(url, serviceKey);
  const { data: roleCheck } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleCheck) return { error: "forbidden: admin only" as const, status: 403 };

  return { admin, user: userData.user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await autenticar(req);
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body.periodo_inicio || !body.periodo_fim || !Array.isArray(body.escopos) || body.escopos.length === 0) {
    return new Response(JSON.stringify({ error: "invalid payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const wantStream = new URL(req.url).searchParams.get("stream") === "1";

  if (wantStream) {
    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        const send = (obj: unknown) => {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          const result = await processarPacote(body, auth.user, auth.admin, send as Emit);
          send({ done: true, payload: result });
        } catch (e) {
          send({ error: e instanceof Error ? e.message : "unknown" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  // Modo JSON tradicional (compatibilidade)
  try {
    const result = await processarPacote(body, auth.user, auth.admin, () => {});
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-pacote-evidencias error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
