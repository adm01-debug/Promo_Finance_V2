// Edge: exportar-sped-contribuicoes — gera TXT EFD-Contribuições preliminar
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { createLogger } from '../_shared/observability.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}

function fmtNum(n: number | null | undefined): string {
  return (Number(n ?? 0)).toFixed(2).replace('.', ',');
}

function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${pad(date.getDate(), 2)}${pad(date.getMonth() + 1, 2)}${date.getFullYear()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const logger = createLogger('exportar-sped-contribuicoes');
  const t0 = Date.now();
  logger.info('fn_start');

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    const auth = req.headers.get('Authorization');
    if (!auth) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userData.user.id);
    const userRoles = (roles ?? []).map((r) => r.role);
    if (!userRoles.some((r) => ['admin', 'financeiro'].includes(r))) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const empresa_id = body.empresa_id as string | undefined;
    const periodo = body.periodo as string | undefined; // YYYY-MM

    if (!empresa_id || !periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'empresa_id e periodo (YYYY-MM) obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [ano, mes] = periodo.split('-').map(Number);
    const dtIni = new Date(ano, mes - 1, 1);
    const dtFim = new Date(ano, mes, 0);

    // Empresa
    const { data: empresa, error: empErr } = await admin
      .from('empresas')
      .select('cnpj, razao_social, inscricao_estadual, inscricao_municipal')
      .eq('id', empresa_id)
      .maybeSingle();
    if (empErr || !empresa) throw new Error('Empresa não encontrada');

    // Apuração
    const { data: apuracao } = await admin
      .from('apuracoes_tributarias')
      .select('*')
      .eq('empresa_id', empresa_id)
      .eq('ano', ano)
      .eq('mes', mes)
      .maybeSingle();

    const cnpjLimpo = (empresa.cnpj ?? '').replace(/\D/g, '');
    const linhas: string[] = [];

    // 0000 — Abertura do arquivo
    linhas.push(['0000', '006', '0', fmtDate(dtIni), fmtDate(dtFim),
      empresa.razao_social ?? '', cnpjLimpo, '', empresa.inscricao_estadual ?? '',
      empresa.inscricao_municipal ?? '', '0', '1'].join('|') + '|');

    // 0001 — Abertura do bloco 0
    linhas.push('|0001|0|');
    // 0140 — Estabelecimento
    linhas.push(['0140', '001', empresa.razao_social ?? '', cnpjLimpo,
      empresa.inscricao_estadual ?? '', '', '', empresa.inscricao_municipal ?? ''].join('|') + '|');
    // 0990 — Encerramento do bloco 0
    linhas.push(`|0990|${linhas.length + 1}|`);

    // M001 — Abertura do bloco M
    linhas.push('|M001|0|');

    // M100 — Crédito de PIS/Pasep (residual) — usando cbs_creditos como proxy aproximado
    if (apuracao?.cbs_creditos && Number(apuracao.cbs_creditos) > 0) {
      linhas.push(['M100', '101', '0', '', fmtNum(apuracao.cbs_creditos),
        fmtNum(0), fmtNum(0), '0', fmtNum(apuracao.cbs_creditos),
        fmtNum(apuracao.cbs_creditos), '', fmtNum(0), fmtNum(0)].join('|') + '|');
    }

    // M200 — Consolidação da contribuição (CBS)
    linhas.push(['M200', fmtNum(apuracao?.cbs_debitos), fmtNum(0),
      fmtNum(apuracao?.cbs_creditos), fmtNum(0), fmtNum(apuracao?.cbs_a_pagar),
      fmtNum(0), fmtNum(0), fmtNum(apuracao?.cbs_a_pagar)].join('|') + '|');

    // M210 — Detalhamento por código
    linhas.push(['M210', '01', fmtNum(apuracao?.cbs_debitos), fmtNum(apuracao?.cbs_debitos),
      '0,00', fmtNum(apuracao?.cbs_debitos), '0,00', '0,00', fmtNum(apuracao?.cbs_debitos),
      '0,00', '0,00', fmtNum(apuracao?.cbs_a_pagar)].join('|') + '|');

    // M990 — Encerramento bloco M
    linhas.push(`|M990|${5}|`);

    // 9001 — Abertura bloco 9
    linhas.push('|9001|0|');
    // 9990 — Encerramento bloco 9
    linhas.push(`|9990|2|`);
    // 9999 — Encerramento do arquivo
    linhas.push(`|9999|${linhas.length + 1}|`);

    const conteudo = linhas.join('\r\n') + '\r\n';
    const fileName = `sped/EFD-Contrib-${cnpjLimpo}-${periodo.replace('-', '')}.txt`;

    // Upload
    const { error: upErr } = await admin.storage
      .from('relatorios-tributarios')
      .upload(fileName, new Blob([conteudo], { type: 'text/plain' }), { upsert: true });
    if (upErr) throw upErr;

    const { data: signed, error: signErr } = await admin.storage
      .from('relatorios-tributarios')
      .createSignedUrl(fileName, 60 * 60 * 24); // 24h
    if (signErr) throw signErr;

    logger.info('fn_success', {
      duration_ms: Date.now() - t0,
      status_code: 200,
      context: { empresa_id, periodo, linhas: linhas.length, file: fileName },
    });
    await logger.flush();

    return new Response(JSON.stringify({
      url: signed.signedUrl,
      file_name: fileName,
      total_linhas: linhas.length,
      periodo,
      observacao: 'Arquivo PRELIMINAR para análise. Validar no Validador SPED da RFB antes da entrega oficial.',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('fn_failure', { duration_ms: Date.now() - t0, status_code: 500, error_message: msg });
    await logger.flush();
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
