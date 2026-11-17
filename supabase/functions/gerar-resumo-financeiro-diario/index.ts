import { exigirInternaOuUsuarioComPapel, empresasDoUsuario } from '../_shared/auth-guard.ts';
import { lerConfigAsaas } from '../_shared/asaas-config.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
const log = createLogger('gerar-resumo-financeiro-diario');

export const handler = async (req: Request) => {
  const corsHeaders = corsHeadersPara(req);
  const requestId = getRequestId(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ctx = await exigirInternaOuUsuarioComPapel(
      req,
      ['admin', 'financeiro'],
      'Acesso restrito a admin ou financeiro'
    );
    if (!ctx.ok) return ctx.resposta;
    const supabase = ctx.dados.supabase;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    log.info('Gerando relatório diário de operações financeiras...');

    // 1. Empresas no escopo. Chamada interna (cron) processa todas; chamada de
    // usuário fica limitada às empresas a que ele está vinculado — o client é
    // service_role e ignora RLS, então sem este recorte um usuário financeiro
    // provocaria o envio do relatório de clientes que ele nem acessa (achado do
    // Codex na PR #421). Antes a coluna inexistente barrava qualquer envio.
    let escopoEmpresas: string[] | null = null;
    if (ctx.dados.origem === 'usuario' && ctx.dados.userId) {
      escopoEmpresas = await empresasDoUsuario(ctx.dados.userId);
      if (escopoEmpresas === null) {
        return new Response(JSON.stringify({ error: 'Falha ao validar vínculo de empresa.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (escopoEmpresas.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let consultaEmpresas = supabase.from('empresas').select('id, razao_social');
    if (escopoEmpresas) consultaEmpresas = consultaEmpresas.in('id', escopoEmpresas);
    const { data: empresas } = await consultaEmpresas;

    for (const empresa of empresas || []) {
      const { data: configRow } = await supabase
        .from('asaas_config')
        .select('configuracoes')
        .eq('empresa_id', empresa.id)
        .maybeSingle();
      const config = lerConfigAsaas(configRow);

      if (!config.alert_email_address) continue;

      // 2. Coletar estatísticas das últimas 24h
      const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { count: novosBoletos } = await supabase
        .from('asaas_payments')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresa.id)
        .gte('created_at', ontem);

      const { data: pagos } = await supabase
        .from('asaas_payments')
        .select('valor')
        .eq('empresa_id', empresa.id)
        .in('status', ['RECEIVED', 'CONFIRMED'])
        .gte('updated_at', ontem);

      const totalPago = pagos?.reduce((sum, p) => sum + Number(p.valor), 0) || 0;

      // Escopo por empresa: a fila não tem empresa_id, ela vem do pagamento.
      // Sem o filtro, o resumo de uma empresa sairia com a contagem de falhas
      // de todas — vazamento operacional entre empresas assim que alguém
      // configura o destinatário. O status gravado é 'FAILED' (maiúsculo, ver
      // asaas-proxy/index.ts:1107); com 'failed' a contagem era sempre zero.
      const { count: falhasFila } = await supabase
        .from('asaas_sync_queue')
        .select('id, asaas_payments!inner(empresa_id)', { count: 'exact', head: true })
        .eq('asaas_payments.empresa_id', empresa.id)
        .eq('status', 'FAILED')
        .gte('updated_at', ontem);

      // 3. Enviar e-mail de resumo
      await supabase.functions.invoke('enviar-alerta-email', {
        headers: correlationHeaders(requestId),
        body: {
          tipo: 'vencimento', // Usando um tipo existente ou criando novo
          destinatario: config.alert_email_address,
          dados: {
            titulo: `Resumo Operacional Diário - ${empresa.razao_social}`,
            mensagem: `Aqui está o resumo das últimas 24h:
            - Novos boletos emitidos: ${novosBoletos}
            - Total recebido: R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            - Falhas na fila de sincronização: ${falhasFila}
            
            Acesse o painel para detalhes completos.`,
            urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/asaas`,
          },
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Erro ao gerar relatório diário:', {
      error_message: mensagemErro(error),
      context: contextoErro(error),
    });
    return new Response(JSON.stringify({ error: 'Erro interno ao gerar o relatório diário.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

if (import.meta.main) {
  Deno.serve(
    withEdgeObservability('gerar-resumo-financeiro-diario', async (req) => {
      const _t0 = Date.now();
      try {
        return await handler(req);
      } finally {
        log.info('request', { duration_ms: Date.now() - _t0 });
        await log.flush();
      }
    })
  );
}
