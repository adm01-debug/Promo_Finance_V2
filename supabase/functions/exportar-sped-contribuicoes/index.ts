// Edge: exportar-sped-contribuicoes — gera TXT EFD-Contribuições preliminar
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createErrorResponse, validatePayload } from '../_shared/validation.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { createLogger } from '../_shared/observability.ts';
import { buildEfdContribuicoesLinhas } from './layout.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roles } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('is_active', true);
    const userRoles = (roles ?? []).map((r) => r.role);
    if (!userRoles.some((r) => ['admin', 'financeiro'].includes(r))) {
      await logger.flush();
      return new Response(JSON.stringify({ error: 'Sem permissão' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const __contract = validatePayload(
      z.object({ empresa_id: z.string().uuid(), periodo: z.string().regex(/^\d{4}-\d{2}$/) }),
      (typeof body === 'object' ? body : {}) as unknown,
      'exportar-sped-contribuicoes'
    );
    if (!__contract.success) return createErrorResponse(__contract.error, 422, __contract.details);
    const empresa_id = body.empresa_id as string | undefined;
    const periodo = body.periodo as string | undefined; // YYYY-MM

    if (!empresa_id || !periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      await logger.flush();
      return new Response(
        JSON.stringify({ error: 'empresa_id e periodo (YYYY-MM) obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // financeiro sem vínculo ativo com a empresa pedia dados fiscais de
    // QUALQUER empresa via empresa_id arbitrário (achado P0 do cubic-dev-ai);
    // admin mantém acesso global, igual ao resto do sistema.
    if (!userRoles.includes('admin')) {
      const { data: vinculo } = await admin
        .from('user_empresas')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('empresa_id', empresa_id)
        .eq('ativo', true)
        .maybeSingle();
      if (!vinculo) {
        await logger.flush();
        return new Response(JSON.stringify({ error: 'Sem permissão para esta empresa' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const [ano, mes] = periodo.split('-').map(Number);

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

    // Montagem pura em `layout.ts`, testada com golden file + invariantes
    // (Etapa 40). Três correções ali em relação à versão anterior, que
    // montava tudo inline aqui com `.join('|')` cru: `M990` passa a contar
    // o bloco M de verdade (era cravado em `5`, certo só quando `M100`
    // condicional está presente — sem ele o bloco tem 4 registros); e o
    // bloco 9900 passa a existir (o arquivo não tinha NENHUM registro
    // `9900`) com `9990` refletindo essa contagem real (era cravado em `2`).
    const linhas = buildEfdContribuicoesLinhas({ empresa, apuracao, ano, mes });

    const conteudo = linhas.join('\r\n') + '\r\n';
    const fileName = `${empresa_id}/sped/EFD-Contrib-${cnpjLimpo}-${periodo.replace('-', '')}.txt`;

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

    return new Response(
      JSON.stringify({
        url: signed.signedUrl,
        file_name: fileName,
        total_linhas: linhas.length,
        periodo,
        observacao:
          'Arquivo PRELIMINAR para análise. Validar no Validador SPED da RFB antes da entrega oficial.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
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
