import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.49.4';
import {
  aplicarVariaveis,
  dataAlvoUtc,
  normalizarCanais,
  normalizarDiasGatilho,
  type CanalRegua,
  type DadosMensagem,
  type TemplateCobranca,
} from './domain.ts';
import { z } from '../_shared/zod.ts';
import { corsHeaders, corsHeadersPara } from '../_shared/cors.ts';
import { getRequestId, correlationHeaders } from '../_shared/correlation.ts';
import { createLogger } from '../_shared/observability.ts';
import { contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';

const log = createLogger('executar-regua-cobranca');

const BodySchema = z.object({ dry_run: z.boolean().default(false) });

const mensagemErro = (erro: unknown) => (erro instanceof Error ? erro.message : 'Erro inesperado');

Deno.serve(
  withEdgeObservability('executar-regua-cobranca', async (req) => {
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
                    metadata: {
                      regra_id: regra.id,
                      dia_gatilho: dia,
                      correlation_id: correlationId,
                    },
                  })
                  .select('id')
                  .single();

                if (reservaError?.code === '23505') continue;
                if (reservaError) throw reservaError;

                // Leitura de template (ou qualquer falha do envio) precisa
                // finalizar a reserva: uma linha presa em `processando`
                // bloqueia aquele conta/etapa/canal no dia pelo índice de
                // idempotência (achado do review da PR #571).
                let erroEnvio: string | null;
                try {
                  erroEnvio = await enviarCobranca(supabase, canal, conta, regra, requestId, {
                    empresaId: regra.empresa_id,
                    etapa,
                  });
                } catch (erro) {
                  erroEnvio = mensagemErro(erro);
                }
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
      log.info('request', { duration_ms: Date.now() - _t0 });
      await log.flush();
    }
  })
);

/**
 * Mensagem real do envio: o template ativo de `templates_cobranca` para a
 * empresa/etapa/canal. Antes desta mudança o texto vinha de
 * `regua_cobranca.descricao` — campo de descrição da etapa, não de mensagem —
 * então editar um template em Configurações não mudava nenhuma cobrança
 * automática (achado do review da PR #571).
 */
async function carregarTemplate(
  supabase: SupabaseClient<any, any, any>,
  empresaId: string,
  etapa: string,
  canal: CanalRegua
): Promise<TemplateCobranca | null> {
  const { data, error } = await supabase
    .from('templates_cobranca')
    .select('assunto,corpo')
    .eq('empresa_id', empresaId)
    .eq('etapa', etapa)
    .eq('canal', canal)
    .eq('ativo', true)
    // `updated_at` existe em todas as versões da tabela; `padrao` não, e um
    // ORDER BY em coluna ausente derrubaria o envio inteiro.
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as TemplateCobranca | null) ?? null;
}

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
  requestId: string,
  origem: { empresaId: string; etapa: string }
): Promise<string | null> {
  const cliente = Array.isArray(conta.clientes) ? conta.clientes[0] : conta.clientes;
  const template = await carregarTemplate(supabase, origem.empresaId, origem.etapa, canal);
  const corpoBase =
    template?.corpo?.trim() || regra.descricao || 'Seu título está próximo do vencimento.';
  const dados: DadosMensagem = {
    cliente: cliente?.nome ?? 'cliente',
    valor: conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    vencimento: new Date(`${conta.data_vencimento}T00:00:00Z`).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    }),
  };
  const mensagem = aplicarVariaveis(corpoBase, dados);
  // Assunto também passa pelas variáveis: `{{cliente}}` no assunto chegava
  // literal ao cliente (achado do review da PR #571).
  const assunto = aplicarVariaveis(
    template?.assunto?.trim() || `Lembrete de Pagamento: ${regra.nome}`,
    dados
  );

  if (canal === 'email' && cliente?.email) {
    // Texto cru: quem monta o HTML do e-mail (`enviar-alerta-email`) e que
    // escapa. Escapar aqui mostrava entidades ao cliente no WhatsApp, que usa
    // a mesma mensagem, e apagava o trecho entre `<` e `>` do assunto.
    const { error } = await supabase.functions.invoke('enviar-alerta-email', {
      headers: correlationHeaders(requestId),
      body: {
        tipo: 'vencimento',
        destinatario: cliente.email,
        dados: {
          titulo: assunto,
          mensagem: mensagem,
          valor: conta.valor,
          dataVencimento: conta.data_vencimento,
        },
      },
    });
    return error?.message ?? null;
  }

  if (canal === 'whatsapp' && cliente?.telefone) {
    // `whatsapp-ia-proativo` valida com schema estrito: exigia `action` e lia
    // `data.telefone`/`data.mensagem`. O envio direto (`phone`/`message`) era
    // recusado com 400 (achado do review da PR #571).
    const { error } = await supabase.functions.invoke('whatsapp-ia-proativo', {
      headers: correlationHeaders(requestId),
      body: { action: 'enviar-mensagem', data: { telefone: cliente.telefone, mensagem } },
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
