import { exigirInternaOuUsuarioComPapel } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
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

    // 1. Buscar todas as empresas ativas
    const { data: empresas } = await supabase.from('empresas').select('id, razao_social');

    for (const empresa of empresas || []) {
      const { data: config } = await supabase
        .from('asaas_config')
        .select('alert_email_address')
        .eq('empresa_id', empresa.id)
        .maybeSingle();

      if (!config?.alert_email_address) continue;

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

      const { count: falhasFila } = await supabase
        .from('asaas_sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
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
  Deno.serve(async (req) => {
    const _t0 = Date.now();
    try {
      return await handler(req);
    } finally {
      await log.flush(Date.now() - _t0);
    }
  });
}
