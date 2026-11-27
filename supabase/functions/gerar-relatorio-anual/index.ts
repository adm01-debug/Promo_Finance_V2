// ============================================
// EDGE FUNCTION: gerar-relatorio-anual
// Agrega dados anuais para Relatório Tributário PDF (P6)
// ============================================
import { createLogger } from '../_shared/observability.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { validateContract } from '../_shared/contract-validator.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { exigirInternaOuUsuarioComPapel } from '../_shared/auth-guard.ts';

const RelatorioAnualBodySchema = z.object({
  empresa_id: z.string().uuid(),
  ano: z.number().int().min(2020).max(2100),
});
type ReqBody = z.infer<typeof RelatorioAnualBodySchema>;

Deno.serve(
  withEdgeObservability('gerar-relatorio-anual', async (req) => {
    const corsHeaders = corsHeadersPara(req);
    const requestId = getRequestId(req);

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const logger = createLogger('gerar-relatorio-anual', requestId);
    const t0 = Date.now();
    logger.info('fn_start');

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

      // Dois chamadores legitimos:
      //   1. usuario logado (tela Relatorio Tributario): JWT + papel RBAC + vinculo;
      //   2. `enviar-relatorios-tributarios-agendados` (job pg_cron), que invoca
      //      esta funcao com o client service_role e NAO tem usuario.
      // Antes daqui a funcao exigia claims + user_roles em qualquer chamada, entao
      // o envio agendado levava 401 em 100% das execucoes: o relatorio nunca saia
      // e o agendamento ficava vencido para sempre.
      const authHeader = req.headers.get('Authorization') ?? `Bearer ${serviceKey}`;
      const guard = await exigirInternaOuUsuarioComPapel(
        req,
        ['admin', 'financeiro', 'contador_readonly'],
        'Apenas admin, financeiro ou contador_readonly pode gerar o relatorio anual.'
      );
      if (!guard.ok) return guard.resposta;

      const admin = guard.dados.supabase;
      const chamadaInterna = guard.dados.origem === 'interna';

      const rawBody = await req.json().catch(() => ({}));
      const validation = await validateContract(RelatorioAnualBodySchema, rawBody);
      if (!validation.success) return validation.response;
      const body: ReqBody = validation.data;

      // user_roles e global (nao por empresa): sem esta checagem, qualquer usuario
      // autenticado com papel admin/financeiro/contador_readonly em UMA empresa
      // gera relatorio de QUALQUER empresa via este client service_role (que ignora
      // RLS). O job interno nao tem usuario e nao escolhe empresa: o `empresa_id`
      // vem de `relatorios_tributarios_agendados`, tabela que so o service_role
      // escreve.
      if (!chamadaInterna && guard.dados.userId) {
        const { data: vinculo } = await admin
          .from('user_empresas')
          .select('id')
          .eq('user_id', guard.dados.userId)
          .eq('empresa_id', body.empresa_id)
          .eq('ativo', true)
          .maybeSingle();
        if (!vinculo) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // Empresa
      const { data: empresa } = await admin
        .from('empresas')
        .select('razao_social, cnpj, regime_tributario')
        .eq('id', body.empresa_id)
        .maybeSingle();

      // Série anual (12 meses) via vw_tributario_dashboard
      const { data: serieRaw } = await admin
        .from('vw_tributario_dashboard')
        .select('*')
        .eq('empresa_id', body.empresa_id)
        .eq('ano', body.ano)
        .order('mes', { ascending: true });

      const serie = serieRaw ?? [];

      // Alertas resolvidos no ano
      const inicio = `${body.ano}-01-01`;
      const fim = `${body.ano}-12-31`;
      const { data: alertasResolvidos } = await admin
        .from('alertas_tributarios')
        .select('id, tipo, titulo, prioridade, resolvido_em')
        .eq('empresa_id', body.empresa_id)
        .eq('resolvido', true)
        .gte('resolvido_em', inicio)
        .lte('resolvido_em', fim);

      // Decidir regime (mês 12 de referência)
      let decisao: Record<string, unknown> | null = null;
      try {
        const decRes = await fetch(`${supabaseUrl}/functions/v1/decidir-regime`, {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
            ...correlationHeaders(requestId),
          },
          body: JSON.stringify({
            empresaId: body.empresa_id,
            anoReferencia: body.ano,
            mesReferencia: 12,
          }),
        });
        if (decRes.ok) decisao = await decRes.json();
      } catch (e) {
        logger.warn('decidir_regime_fallback', {
          error_message: e instanceof Error ? e.message : String(e),
        });
      }

      // Totais anuais
      const sum = (k: string) =>
        serie.reduce((acc: number, s: Record<string, number>) => acc + Number(s[k] ?? 0), 0);
      const faturamentoAnual = sum('faturamento');
      const tributosAnuais = sum('total_tributos');
      const cargaEfetiva = faturamentoAnual > 0 ? (tributosAnuais / faturamentoAnual) * 100 : 0;

      logger.info('data_aggregated', {
        context: {
          empresa_id: body.empresa_id,
          ano: body.ano,
          meses: serie.length,
        },
      });

      const payload = {
        empresa: {
          razao_social: empresa?.razao_social ?? 'Empresa',
          cnpj: empresa?.cnpj ?? '—',
          regime_atual: empresa?.regime_tributario ?? '—',
        },
        ano: body.ano,
        kpis: {
          faturamento_anual: faturamentoAnual,
          tributos_anuais: tributosAnuais,
          carga_efetiva: cargaEfetiva,
          meses_apurados: serie.length,
        },
        apuracao_mensal: serie,
        decisao_regime: decisao,
        alertas_resolvidos: alertasResolvidos ?? [],
        gerado_em: new Date().toISOString(),
      };

      logger.info('fn_success', {
        duration_ms: Date.now() - t0,
        status_code: 200,
      });
      await logger.flush();

      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
  })
);
