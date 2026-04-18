// ============================================
// EDGE FUNCTION: enviar-relatorios-tributarios-agendados (P7)
// Cron diário 06:00 — drena agendamentos vencidos, gera PDF e envia por e-mail.
// ============================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Agendamento {
  id: string;
  empresa_id: string;
  ano: number;
  frequencia: 'mensal' | 'trimestral' | 'anual';
  dia_envio: number;
  destinatarios: string[];
  proximo_envio_em: string;
}

function calcularProximoEnvio(freq: Agendamento['frequencia'], dia: number): string {
  const d = new Date();
  d.setUTCHours(6, 0, 0, 0);
  if (freq === 'mensal') d.setUTCMonth(d.getUTCMonth() + 1);
  else if (freq === 'trimestral') d.setUTCMonth(d.getUTCMonth() + 3);
  else d.setUTCFullYear(d.getUTCFullYear() + 1);
  d.setUTCDate(Math.min(dia, 28));
  return d.toISOString();
}

async function gerarPdf(payload: Record<string, unknown>, empresa: string, ano: number): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([595, 842]);
  const { height } = page.getSize();
  let y = height - 60;

  page.drawText('Relatório Anual Tributário', { x: 50, y, size: 22, font: fontBold, color: rgb(0.1, 0.2, 0.5) });
  y -= 30;
  page.drawText(`${empresa} · Ano ${ano}`, { x: 50, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 40;

  const kpis = (payload.kpis ?? {}) as Record<string, number | string>;
  page.drawText('Sumário Executivo', { x: 50, y, size: 14, font: fontBold });
  y -= 22;
  for (const [k, v] of Object.entries(kpis)) {
    page.drawText(`${k}: ${typeof v === 'number' ? v.toLocaleString('pt-BR') : String(v)}`, { x: 60, y, size: 10, font });
    y -= 16;
    if (y < 80) break;
  }

  y -= 20;
  page.drawText('Gerado automaticamente pelo agendador.', { x: 50, y: 40, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
  return await pdf.save();
}

async function enviarEmail(destinatarios: string[], assunto: string, corpoHtml: string, anexoUrl: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'Tributário <onboarding@resend.dev>',
      to: destinatarios,
      subject: assunto,
      html: `${corpoHtml}<p><a href="${anexoUrl}">Baixar relatório PDF</a> (link válido por 7 dias)</p>`,
    }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('enviar-relatorios-tributarios-agendados');
  const t0 = Date.now();
  logger.info('fn_start');

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const { data: agendamentos, error } = await sb
      .from('relatorios_tributarios_agendados')
      .select('id, empresa_id, ano, frequencia, dia_envio, destinatarios, proximo_envio_em')
      .eq('ativo', true)
      .lte('proximo_envio_em', new Date().toISOString())
      .limit(50);

    if (error) throw error;
    const lista = (agendamentos ?? []) as Agendamento[];

    let processados = 0;
    let falhas = 0;

    for (const ag of lista) {
      try {
        if (!ag.destinatarios?.length) {
          logger.warn('sem_destinatarios', { context: { id: ag.id } });
          continue;
        }

        // Gera o relatório anual reusando edge P6
        const { data: relatorio, error: relErr } = await sb.functions.invoke('gerar-relatorio-anual', {
          body: { empresa_id: ag.empresa_id, ano: ag.ano },
        });
        if (relErr || !relatorio) throw new Error(relErr?.message || 'relatorio_vazio');

        const { data: empresa } = await sb.from('empresas').select('razao_social').eq('id', ag.empresa_id).maybeSingle();
        const nomeEmp = empresa?.razao_social ?? 'Empresa';

        const pdfBytes = await gerarPdf(relatorio as Record<string, unknown>, nomeEmp, ag.ano);
        const path = `agendados/${ag.empresa_id}/${ag.ano}/${Date.now()}.pdf`;

        const { error: upErr } = await sb.storage
          .from('relatorios-tributarios')
          .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: false });
        if (upErr) throw upErr;

        const { data: signed } = await sb.storage
          .from('relatorios-tributarios')
          .createSignedUrl(path, 7 * 24 * 60 * 60);

        const ok = await enviarEmail(
          ag.destinatarios,
          `Relatório Tributário ${ag.ano} — ${nomeEmp}`,
          `<p>Olá,</p><p>Segue o relatório tributário automático de <strong>${nomeEmp}</strong> para o ano <strong>${ag.ano}</strong>.</p>`,
          signed?.signedUrl ?? '',
        );

        await sb
          .from('relatorios_tributarios_agendados')
          .update({
            ultimo_envio_em: new Date().toISOString(),
            proximo_envio_em: calcularProximoEnvio(ag.frequencia, ag.dia_envio),
          })
          .eq('id', ag.id);

        if (ok) processados++;
        else falhas++;
      } catch (err) {
        falhas++;
        logger.error('agendamento_falhou', {
          error_message: (err as Error).message,
          context: { id: ag.id },
        });
      }
    }

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { total: lista.length, processados, falhas },
    });
    await logger.flush();
    return new Response(JSON.stringify({ total: lista.length, processados, falhas }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = (err as Error).message || 'Erro interno';
    logger.error('fn_failure', { duration_ms: Date.now() - t0, status_code: 500, error_message: msg });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
