import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { dataAlvoUtc, normalizarCanais, normalizarDiasGatilho, type CanalRegua } from './domain.ts';
import { z } from '../_shared/zod.ts';
import { corsHeaders, corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { createLogger } from '../_shared/observability.ts';
import { contextoErro } from '../_shared/erros.ts';

const log = createLogger('executar-regua-cobranca');

const BodySchema = z.object({ dry_run: z.boolean().default(false) });

const mensagemErro = (erro: unknown) => (erro instanceof Error ? erro.message : 'Erro inesperado');

Deno.serve(async (req) => {
  const _t0 = Date.now();
  try {
    const corsHeaders = corsHeadersPara(req);
    const res = (body: Record<string, unknown>, status = 200) =>
      resposta(body, status, corsHeaders);
    const requestId = getRequestId(req);

    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
    if (req.method !== 'POST') return res({ error: 'Método não permitido' }, 405);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const cronSecret = Deno.env.get('REGUA_CRON_SECRET');
    if (!supabaseUrl || !serviceRoleKey || !cronSecret)
      return res({ error: 'Configuração interna ausente' }, 500);

    if (req.headers.get('x-cron-secret') !== cronSecret)
      return res({ error: 'Não autorizado' }, 401);

    try {
      const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
      if (!parsed.success) return res({ error: 'Payload inválido' }, 400);
      const dryRun = parsed.data.dry_run;
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: regras, error: regrasError } = await supabase
        .from('regua_cobranca')
        .select('id,nome,descricao,dias_gatilho,canais,empresa_id,etapa,ordem')
        .eq('ativo', true)
        .eq('auto_executar', true)
        .order('ordem', { ascending: true });

      if (regrasError) throw regrasError;

      const detalhes: Array<Record<string, unknown>> = [];
      const agora = new Date();

      for (const regra of regras ?? []) {
        if (!regra.empresa_id) continue;
        const dias = normalizarDiasGatilho(regra.dias_gatilho);
        const canais = normalizarCanais(regra.canais);

        for (const dia of dias) {
          const dataVencimento = dataAlvoUtc(agora, dia);
          const { data: contas, error: contasError } = await supabase
            .from('contas_receber')
            .select('id,valor,data_vencimento,clientes(nome,email,telefone)')
            .eq('empresa_id', regra.empresa_id)
            .eq('data_vencimento', dataVencimento)
            .in('status', ['pendente', 'vencido', 'parcial', 'atrasado']);

          if (contasError) throw contasError;

          for (const conta of contas ?? []) {
            for (const canal of canais) {
              const etapa = regra.etapa || regra.nome;
              const correlationId = crypto.randomUUID();

              if (dryRun) {
                detalhes.push({
                  conta_id: conta.id,
                  regra: regra.nome,
                  etapa,
                  canal,
                  dia,
                  dry_run: true,
                });
                continue;
              }

              const { data: execucao, error: reservaError } = await supabase
                .from('execucoes_regua_cobranca')
                .insert({
                  empresa_id: regra.empresa_id,
                  conta_receber_id: conta.id,
                  etapa,
                  canal,
                  status: 'processando',
                  metadata: { regra_id: regra.id, dia_gatilho: dia, correlation_id: correlationId },
                })
                .select('id')
                .single();

              if (reservaError?.code === '23505') continue;
              if (reservaError) throw reservaError;

              const erroEnvio = await enviarCobranca(supabase, canal, conta, regra, requestId);
              const sucesso = erroEnvio === null;
              const { error: atualizacaoError } = await supabase
                .from('execucoes_regua_cobranca')
                .update({ status: sucesso ? 'sucesso' : 'falha', mensagem_erro: erroEnvio })
                .eq('id', execucao.id);

              if (atualizacaoError) throw atualizacaoError;
              detalhes.push({
                conta_id: conta.id,
                regra: regra.nome,
                etapa,
                canal,
                success: sucesso,
                correlation_id: correlationId,
              });
            }
          }
        }
      }

      return res({
        success: true,
        dry_run: dryRun,
        processed: detalhes.length,
        details: detalhes,
      });
    } catch (erro) {
      log.error('Erro régua cobrança:', {
        error_message: mensagemErro(erro),
        context: contextoErro(erro),
      });
      return res({ error: mensagemErro(erro) }, 500);
    }
  } finally {
    await log.flush(Date.now() - _t0);
  }
});

async function enviarCobranca(
  supabase: SupabaseClient<any, any, any>,
  canal: CanalRegua,
  conta: {
    valor: number;
    data_vencimento: string;
    clientes:
      | { nome?: string; email?: string; telefone?: string }
      | Array<{ nome?: string; email?: string; telefone?: string }>
      | null;
  },
  regra: { nome: string; descricao: string | null },
  requestId: string
): Promise<string | null> {
  const template = regra.descricao || 'Seu título está próximo do vencimento.';
  const mensagem = template.replace('{{valor}}', String(conta.valor));
  const cliente = Array.isArray(conta.clientes) ? conta.clientes[0] : conta.clientes;

  if (canal === 'email' && cliente?.email) {
    const { error } = await supabase.functions.invoke('enviar-alerta-email', {
      headers: correlationHeaders(requestId),
      body: {
        tipo: 'vencimento',
        destinatario: cliente.email,
        dados: {
          titulo: `Lembrete de Pagamento: ${regra.nome}`,
          mensagem,
          valor: conta.valor,
          dataVencimento: conta.data_vencimento,
        },
      },
    });
    return error?.message ?? null;
  }

  if (canal === 'whatsapp' && cliente?.telefone) {
    const { error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
      headers: correlationHeaders(requestId),
      body: { phone: cliente.telefone, message: mensagem },
    });
    return error?.message ?? null;
  }

  return `Canal ${canal} sem provedor ou contato configurado`;
}

function resposta(
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = corsHeaders
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}
