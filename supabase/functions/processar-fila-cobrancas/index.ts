import { exigirInternaOuUsuarioComPapel } from '../_shared/auth-guard.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro } from '../_shared/erros.ts';
const log = createLogger('processar-fila-cobrancas');

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

    log.info('Iniciando processamento da fila de cobranças...');

    // 1. Reivindicar itens pendentes de forma atomica: a RPC processar_fila_cobrancas
    // usa FOR UPDATE SKIP LOCKED, eliminando a corrida do SELECT+UPDATE manual anterior
    // em que duas invocacoes concorrentes podiam pegar e enviar a mesma cobranca duas
    // vezes (Etapa E-010, PLANO_100.md; A-018 em AUDITORIA.md).
    const { data: fila, error: filaError } = await supabase.rpc('processar_fila_cobrancas', {
      p_limite: 20,
    });

    if (filaError) throw filaError;

    const results = [];

    if (fila && fila.length > 0) {
      const filaIds = fila.map((item: any) => item.fila_id);

      // A RPC devolve apenas fila_id/canal/destinatario/mensagem/cliente_nome/etapa/
      // conta_receber_id (ver migration 20260317001356). empresa_id, cliente_id e
      // tentativas nao fazem parte do retorno; buscamos aqui para preencher a
      // auditoria em execucoes_cobranca. Seguro: essas linhas ja estao reservadas
      // com status='processando' por esta chamada, sem corrida com outra invocacao.
      const { data: detalhesFila, error: detalhesError } = await supabase
        .from('fila_cobrancas')
        .select('id, empresa_id, cliente_id, tentativas')
        .in('id', filaIds);

      if (detalhesError) throw detalhesError;

      const detalhesPorId = new Map((detalhesFila || []).map((d: any) => [d.id, d]));

      for (const item of fila) {
        try {
          const canal = item.canal?.toLowerCase();
          let erroEnvio: string | null = `Canal ${canal} sem destinatário configurado`;

          if (canal === 'email' && item.destinatario) {
            const { error } = await supabase.functions.invoke('enviar-alerta-email', {
              headers: correlationHeaders(requestId),
              body: {
                tipo: 'vencimento',
                destinatario: item.destinatario,
                dados: {
                  titulo: `Cobrança: ${item.etapa}`,
                  mensagem: item.mensagem,
                  urlAcao: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/cobrancas`,
                },
              },
            });
            erroEnvio = error?.message ?? null;
          } else if (canal === 'whatsapp' && item.destinatario) {
            const { error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
              headers: correlationHeaders(requestId),
              body: {
                phone: item.destinatario,
                message: item.mensagem,
              },
            });
            erroEnvio = error?.message ?? null;
          }

          // Etapa E-009 (PLANO_100.md; A-013 em AUDITORIA.md): functions.invoke() nao
          // lanca excecao em erro HTTP -- so marcamos sucesso quando nao houver erro.
          const success = erroEnvio === null;
          const detalheItem = detalhesPorId.get(item.fila_id);

          // 2. Mover para execuções (log)
          await supabase.from('execucoes_cobranca').insert({
            empresa_id: detalheItem?.empresa_id ?? null,
            conta_receber_id: item.conta_receber_id,
            cliente_id: detalheItem?.cliente_id ?? null,
            cliente_nome: item.cliente_nome,
            etapa: item.etapa,
            canal: item.canal,
            destinatario: item.destinatario,
            mensagem: item.mensagem,
            status: success ? 'enviado' : 'falhou',
            provider: canal === 'email' ? 'resend' : 'whatsapp-ia',
            erro_mensagem: erroEnvio,
          });

          // 3. Atualizar status na fila
          await supabase
            .from('fila_cobrancas')
            .update({
              status: success ? 'enviado' : 'falhou',
              tentativas: (detalheItem?.tentativas || 0) + 1,
              erro_mensagem: erroEnvio,
            })
            .eq('id', item.fila_id);

          results.push({ id: item.fila_id, success });
        } catch (e) {
          log.error(`Falha ao processar item ${item.fila_id}:`, { error_message: mensagemErro(e) });
          await supabase
            .from('fila_cobrancas')
            .update({ status: 'falhou', erro: e instanceof Error ? e.message : String(e) })
            .eq('id', item.fila_id);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Erro processar fila:', { error_message: mensagemErro(error) });
    return new Response(JSON.stringify({ error: 'Erro interno ao processar a fila.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

if (import.meta.main) {
  Deno.serve(handler);
}
