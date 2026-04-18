// Edge Function: gerar-pdf-tributario
// Gera PDF executivo com recomendação tributária e faz upload no bucket
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1';
import autoTable from 'https://esm.sh/jspdf-autotable@3.8.2';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReqBody {
  empresaId: string;
  anoReferencia: number;
  mesReferencia: number;
}

const formatBRL = (n: number) =>
  n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

const formatPct = (n: number) => `${n.toFixed(2)}%`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = createLogger('gerar-pdf-tributario');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } =
      await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ReqBody = await req.json();
    if (!body.empresaId || !body.anoReferencia || !body.mesReferencia) {
      return new Response(
        JSON.stringify({ error: 'empresaId, anoReferencia e mesReferencia obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Chama decidir-regime internamente
    const decidirRes = await fetch(
      `${supabaseUrl}/functions/v1/decidir-regime`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!decidirRes.ok) {
      const errText = await decidirRes.text();
      throw new Error(`decidir-regime falhou: ${errText}`);
    }

    const decisao = await decidirRes.json();

    // Busca empresa
    const { data: empresa } = await supabaseAdmin
      .from('empresas')
      .select('razao_social, cnpj')
      .eq('id', body.empresaId)
      .maybeSingle();

    const empresaNome = empresa?.razao_social ?? 'Empresa';
    const cnpj = empresa?.cnpj ?? '—';
    const periodo = `${String(body.mesReferencia).padStart(2, '0')}/${body.anoReferencia}`;

    // === Geração do PDF ===
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // CAPA
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('Recomendação Tributária Executiva', 15, 30);
    doc.setFontSize(11);
    doc.text(`Período de referência: ${periodo}`, 15, 42);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(empresaNome, 15, 80);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`CNPJ: ${cnpj}`, 15, 87);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text('Regime recomendado:', 15, 110);
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // primary
    doc.text(decisao?.recomendado?.nome ?? '—', 15, 122);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(
      `Carga efetiva estimada: ${formatPct(decisao?.recomendado?.cargaEfetiva ?? 0)}`,
      15,
      132
    );
    doc.text(
      `Tributos anuais: ${formatBRL(decisao?.recomendado?.totalTributos ?? 0)}`,
      15,
      140
    );

    if (decisao?.economiaAnualVsAtual && decisao.economiaAnualVsAtual > 0) {
      doc.setFillColor(220, 252, 231);
      doc.rect(15, 155, pageWidth - 30, 25, 'F');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.text('Economia potencial vs. regime atual:', 20, 165);
      doc.setFontSize(16);
      doc.text(formatBRL(decisao.economiaAnualVsAtual), 20, 175);
    }

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(
      `Documento gerado em ${new Date().toLocaleString('pt-BR')}`,
      15,
      280
    );

    // PÁGINA 2 — Resumo Executivo
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Resumo Executivo', 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const justificativa = decisao?.justificativa ?? 'Análise baseada nos parâmetros informados.';
    const splitJust = doc.splitTextToSize(justificativa, pageWidth - 30);
    doc.text(splitJust, 15, 32);

    if (decisao?.alertas?.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9);
      doc.text('Alertas:', 15, 70);
      doc.setFontSize(9);
      decisao.alertas.forEach((alerta: string, i: number) => {
        const split = doc.splitTextToSize(`• ${alerta}`, pageWidth - 30);
        doc.text(split, 15, 78 + i * 10);
      });
    }

    // PÁGINA 3 — Comparativo
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Comparativo dos 3 Regimes', 15, 20);

    const cenarios = decisao?.cenarios ?? [];
    autoTable(doc, {
      startY: 28,
      head: [['Regime', 'Elegível', 'IRPJ+CSLL', 'PIS+COFINS', 'CPP', 'ICMS+ISS', 'Total', 'Carga']],
      body: cenarios.map((c: Record<string, number | string | boolean>) => [
        String(c.nome ?? '—'),
        c.elegivel ? 'Sim' : 'Não',
        formatBRL(Number(c.irpj ?? 0) + Number(c.csll ?? 0)),
        formatBRL(Number(c.pis ?? 0) + Number(c.cofins ?? 0)),
        formatBRL(Number(c.cpp ?? 0)),
        formatBRL(Number(c.icms ?? 0) + Number(c.iss ?? 0)),
        formatBRL(Number(c.totalTributos ?? 0)),
        formatPct(Number(c.cargaEfetiva ?? 0)),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // PÁGINA 4 — Justificativa Legal
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Justificativa Legal', 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const legal = [
      'Resolução CGSN nº 140/2018 — Regulamentação do Simples Nacional',
      'Lei Complementar nº 224/2025 — Atualização dos limites e tabelas do Simples',
      'Tema 779 do STF — Constitucionalidade do regime cumulativo PIS/COFINS',
      'EC 132/2023 — Reforma Tributária do Consumo (CBS + IBS)',
      'LC 214/2025 — Regulamentação CBS/IBS, vigência gradual 2026-2033',
      'Lei 15.270/2025 — Imposto de Renda PF Mínimo (IRPFM) sobre dividendos',
    ];
    legal.forEach((l, i) => {
      doc.text(`• ${l}`, 15, 32 + i * 8);
    });

    // PÁGINA 5 — Cronograma Reforma
    doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Cronograma Reforma Tributária 2026-2033', 15, 20);
    autoTable(doc, {
      startY: 28,
      head: [['Ano', 'Marco', 'Alíquotas']],
      body: [
        ['2026', 'Teste de transição', 'CBS 0,9% + IBS 0,1%'],
        ['2027', 'CBS plena, fim PIS/COFINS', 'CBS ~9%'],
        ['2028', 'CBS consolidada', 'CBS ~9%'],
        ['2029', 'IBS inicia (10%)', 'CBS ~9% + IBS ~1,8%'],
        ['2030', 'IBS 20%', 'CBS ~9% + IBS ~3,6%'],
        ['2031', 'IBS 30%', 'CBS ~9% + IBS ~5,4%'],
        ['2032', 'IBS 40%', 'CBS ~9% + IBS ~7,2%'],
        ['2033', 'IBS pleno, fim ICMS/ISS', 'CBS ~9% + IBS ~18%'],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Gera PDF como Uint8Array
    const pdfBuffer = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Upload no bucket
    const timestamp = Date.now();
    const path = `${body.empresaId}/${body.anoReferencia}-${String(body.mesReferencia).padStart(2, '0')}-${timestamp}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('relatorios-tributarios')
      .upload(path, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    // Signed URL (1 hora)
    const { data: signed } = await supabaseAdmin.storage
      .from('relatorios-tributarios')
      .createSignedUrl(path, 3600);

    // Base64 também (para download direto)
    const base64 = btoa(String.fromCharCode(...pdfBytes));

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { empresaId: body.empresaId, periodo },
    });
    await logger.flush();
    return new Response(
      JSON.stringify({
        success: true,
        path,
        signedUrl: signed?.signedUrl,
        base64,
        empresaNome,
        periodo,
        regimeRecomendado: decisao?.recomendado?.nome,
        economiaAnual: decisao?.economiaAnualVsAtual ?? 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    logger.error('fn_failure', {
      duration_ms: Date.now() - t0,
      status_code: 500,
      error_message: msg,
    });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
