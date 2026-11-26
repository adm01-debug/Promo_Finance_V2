// Edge Function: credito-analise
// Fila de análise de crédito da 1ª venda para o Financeiro (admin/financeiro):
//   listar            -> linhas de analises_credito (default: pendentes)
//   atualizar_dados   -> CNPJ corrigido (reconsulta CNPJ.já), Escavador e consulta
//                        financeira registrados pelo analista
//   decidir           -> aprovado/reprovado + limite/parcelas/parecer; devolve a
//                        decisão ao Promo Champions (receive-credit-decision) e,
//                        se aprovado e o cliente existe no Finance, grava o limite.
//   reenviar_callback -> reenvia ao Champions uma decisão já tomada cujo aviso
//                        falhou (mesma correlation_key; o Champions deduplica).
//
// verify_jwt=false: o guard é exigirPapel (JWT validado no Auth + user_roles).

import { createLogger } from '../_shared/observability.ts';
import { getRequestId } from '../_shared/correlation.ts';
import { corsHeadersPara } from '../_shared/cors.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { clientDeServico, exigirPapel } from '../_shared/auth-guard.ts';
import { createErrorResponse, parseJsonBody, validatePayload } from '../_shared/validation.ts';
import { CreditoAnaliseSchema } from '../_shared/credito/schemas.ts';
import { consultarCnpjInterno } from '../_shared/credito/cnpja.ts';
import {
  avaliarAlertas,
  destinoDoLimiteVinculo,
  escolherCadastroDoCnpj,
  filtroCnpjCliente,
  normalizarCnpj,
  vinculoDesatualizado,
} from '../_shared/credito/regras.ts';

const DEFAULT_CALLBACK_URL =
  'https://usyxfpqlsspldubptrdl.supabase.co/functions/v1/receive-credit-decision';
const PAPEIS = ['admin', 'financeiro'] as const;
const STATUS_ABERTOS = ['pendente', 'em_analise'];
// Aviso 'pendente' mais velho que isso = execução interrompida antes do envio.
const CALLBACK_EM_CURSO_MS = 2 * 60_000;

async function assinar(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256=${hex}`;
}

function responder(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeadersPara(req), 'Content-Type': 'application/json' },
  });
}

interface Analise {
  id: string;
  referencia_externa: string;
  status: string;
  cnpj: string | null;
  cliente_id: string | null;
  empresa_id: string | null;
  valor_pedido: number | null;
  dados_cnpja: unknown;
  dados_escavador: unknown;
  dados_consulta_financeira: unknown;
  limite_aprovado: number | null;
  limite_aplicado_em: string | null;
  parcelas_max: number | null;
  parecer: string | null;
  decidido_por: string | null;
  decidido_em: string | null;
  callback_status: string;
}

const CAMPOS_ANALISE =
  'id, referencia_externa, status, cnpj, cliente_id, empresa_id, valor_pedido, dados_cnpja, dados_escavador, dados_consulta_financeira, limite_aprovado, limite_aplicado_em, parcelas_max, parecer, decidido_por, decidido_em, callback_status';

/** IDs das empresas ativas do usuário (mesma regra da policy da tabela). */
async function empresasAcessiveis(
  admin: ReturnType<typeof clientDeServico>,
  userId: string
): Promise<string[]> {
  const { data, error } = await admin
    .from('user_empresas')
    .select('empresa_id')
    .eq('user_id', userId)
    .eq('ativo', true);
  if (error) throw error;
  return (data ?? []).map((linha) => (linha as { empresa_id: string }).empresa_id);
}

async function notificarChampions(
  analise: Analise,
  decisao: 'aprovado' | 'reprovado',
  limite: number | null,
  parcelas: number | null,
  parecer: string | null,
  decididoEm: string
): Promise<{ ok: boolean; erro?: string }> {
  const secret = Deno.env.get('CHAMPIONS_CREDITO_CALLBACK_SECRET');
  if (!secret) return { ok: false, erro: 'CHAMPIONS_CREDITO_CALLBACK_SECRET não configurada' };
  const url = Deno.env.get('CHAMPIONS_CREDITO_CALLBACK_URL') || DEFAULT_CALLBACK_URL;

  const body = JSON.stringify({
    event: 'credito.decidido',
    correlation_key: analise.id,
    payload: {
      pedido_id: analise.referencia_externa,
      analise_id: analise.id,
      decisao,
      limite_aprovado: limite,
      parcelas_max: parcelas,
      parecer,
      decidido_em: decididoEm,
    },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': await assinar(secret, body),
        'x-webhook-event': 'credito.decidido',
        'x-correlation-key': analise.id,
      },
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    if (res.ok) return { ok: true };
    return { ok: false, erro: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  } catch (err) {
    return { ok: false, erro: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(
  withEdgeObservability('credito-analise', async (req: Request) => {
    const cors = corsHeadersPara(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return responder(req, 405, { error: 'Método não permitido' });

    const logger = createLogger('credito-analise', getRequestId(req));
    const t0 = Date.now();

    const guard = await exigirPapel(req, PAPEIS);
    if (!guard.ok) return guard.resposta;

    const corpo = await parseJsonBody(req, 'credito-analise', cors);
    if (!corpo.success) return corpo.response;
    const validation = validatePayload(CreditoAnaliseSchema, corpo.data, 'credito-analise');
    if (!validation.success) {
      return createErrorResponse(validation.error, 400, validation.details, req);
    }
    const input = validation.data;
    const admin = clientDeServico();

    const registrarCallback = async (
      analiseId: string,
      callback: { ok: boolean; erro?: string }
    ) => {
      const patch = {
        callback_status: callback.ok ? 'enviado' : 'falhou',
        callback_erro: callback.ok ? null : (callback.erro ?? 'erro desconhecido').slice(0, 1000),
        callback_em: new Date().toISOString(),
      };
      const alvo = admin.from('analises_credito').update(patch).eq('id', analiseId);
      // Entrega já confirmada não volta para "falhou" por um reenvio que falhou
      // depois: o Champions já recebeu esta decisão.
      const { data, error } = await (callback.ok ? alvo : alvo.neq('callback_status', 'enviado'))
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      const { data: atual, error: erroAtual } = await admin
        .from('analises_credito')
        .select('*')
        .eq('id', analiseId)
        .single();
      if (erroAtual) throw erroAtual;
      return atual;
    };

    /**
     * Grava o limite aprovado no cadastro do cliente e marca a gravação na
     * análise (`limite_aplicado_em`). A marca é o que permite ao reenvio
     * completar uma execução interrompida sem reescrever um limite que o
     * Finance já ajustou no cadastro.
     *
     * O retorno separa os motivos de não gravar: `conflito` é o caso em que o
     * único cadastro vinculado guarda documento que a análise não tem (o
     * analista precisa resolver o vínculo) e quem chama decide entre seguir
     * sem limite ou desfazer a decisão.
     */
    type ResultadoLimite =
      | { tipo: 'escrito' }
      | { tipo: 'conflito' }
      | { tipo: 'sem_destino' }
      | { tipo: 'erro'; erro: unknown };

    const mensagemDoErro = (erro: unknown) =>
      erro instanceof Error
        ? erro.message
        : String((erro as { message?: string } | null)?.message ?? erro);

    const aplicarLimite = async (alvo: Analise, limite: number): Promise<ResultadoLimite> => {
      let gravou = false;
      if (alvo.cnpj) {
        let query = admin
          .from('clientes')
          .update({ limite_credito: limite })
          .or(filtroCnpjCliente(alvo.cnpj));
        // Quem autoriza o analista é a empresa da análise: crédito de cadastro
        // de outra empresa não muda por aqui.
        if (alvo.empresa_id) {
          query = query.eq('empresa_id', alvo.empresa_id);
        } else {
          const empresas = await empresasAcessiveis(admin, guard.dados.userId).catch(() => []);
          query = query.in('empresa_id', empresas);
        }
        const r = await query.select('id');
        if (r.error) return { tipo: 'erro', erro: r.error };
        gravou = (r.data?.length ?? 0) > 0;
      }
      if (!gravou && alvo.cliente_id) {
        // Vínculo por e-mail: recebe o limite quando o cadastro não guarda
        // documento que contradiga a análise. CNPJ apagado pelo analista conta
        // como contradição com cadastro que tem CNPJ: sem documento não há como
        // confirmar que é o mesmo cliente — quem chama decide (409 + desfazer).
        const { data: vinc, error: erroVinc } = await admin
          .from('clientes')
          .select('cnpj_cpf, empresa_id')
          .eq('id', alvo.cliente_id)
          .maybeSingle();
        if (erroVinc) return { tipo: 'erro', erro: erroVinc };
        const destino = destinoDoLimiteVinculo({
          cnpjAnalise: alvo.cnpj,
          documentoVinculo: vinc?.cnpj_cpf ?? null,
          empresaAnalise: alvo.empresa_id,
          empresaVinculo: (vinc as { empresa_id: string | null } | null)?.empresa_id ?? null,
        });
        if (destino !== 'gravar') return { tipo: destino };
        const { error: erroLimite } = await admin
          .from('clientes')
          .update({ limite_credito: limite })
          .eq('id', alvo.cliente_id);
        if (erroLimite) return { tipo: 'erro', erro: erroLimite };
        gravou = true;
      }
      if (!gravou) return { tipo: 'sem_destino' };
      const { error: erroMarca } = await admin
        .from('analises_credito')
        .update({ limite_aplicado_em: new Date().toISOString() })
        .eq('id', alvo.id);
      return erroMarca ? { tipo: 'erro', erro: erroMarca } : { tipo: 'escrito' };
    };

    try {
      if (input.action === 'listar') {
        const empresas = await empresasAcessiveis(admin, guard.dados.userId);
        let query = admin
          .from('analises_credito')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .limit(input.limite ?? 100);
        // Escopo por empresa: linhas sem empresa (1ª venda de um cliente que o
        // Finance ainda não cadastrou) ficam visíveis a qualquer
        // admin/financeiro ativo — a policy da tabela aplica a mesma regra.
        query =
          empresas.length > 0
            ? query.or(`empresa_id.is.null,empresa_id.in.(${empresas.join(',')})`)
            : query.is('empresa_id', null);
        const status = input.status ?? 'pendente';
        if (status === 'pendente') query = query.in('status', STATUS_ABERTOS);
        else if (status !== 'todos') query = query.eq('status', status);
        const { data, error, count } = await query;
        if (error) throw error;
        return responder(req, 200, {
          analises: data ?? [],
          total: count ?? data?.length ?? 0,
          agora: new Date().toISOString(),
        });
      }

      const { data: analiseRaw, error: getError } = await admin
        .from('analises_credito')
        .select(CAMPOS_ANALISE)
        .eq('id', input.analise_id)
        .maybeSingle();
      if (getError) throw getError;
      if (!analiseRaw) return responder(req, 404, { error: 'Análise não encontrada' });
      const analise = analiseRaw as Analise;
      const decidida = analise.status === 'aprovado' || analise.status === 'reprovado';

      // Empresa da análise fora do escopo do usuário: nem leitura, nem ação.
      if (analise.empresa_id) {
        const empresas = await empresasAcessiveis(admin, guard.dados.userId);
        if (!empresas.includes(analise.empresa_id)) {
          return responder(req, 403, { error: 'empresa_sem_acesso' });
        }
      }

      if (input.action === 'reenviar_callback') {
        if (!decidida) return responder(req, 409, { error: 'Análise ainda sem decisão' });
        if (analise.callback_status === 'enviado') {
          return responder(req, 409, { error: 'Champions já recebeu esta decisão' });
        }
        // 'pendente' recente = notificação original ainda em curso; velho = execução
        // interrompida entre gravar a decisão e avisar — aí o reenvio recupera.
        const decididoHa = Date.now() - Date.parse(analise.decidido_em ?? '');
        if (analise.callback_status === 'pendente' && decididoHa < CALLBACK_EM_CURSO_MS) {
          return responder(req, 409, { error: 'Aviso ao Champions ainda em andamento' });
        }
        // A decisão é gravada antes do limite do cliente: se a execução parou no
        // meio, o reenvio completa a aprovação em vez de só avisar o Champions.
        // A marca `limite_aplicado_em` garante que um limite já gravado — e que
        // pode ter sido ajustado depois pelo Finance — não seja reescrito.
        if (
          analise.status === 'aprovado' &&
          analise.limite_aprovado !== null &&
          !analise.limite_aplicado_em
        ) {
          const resultadoLimite = await aplicarLimite(analise, analise.limite_aprovado);
          if (resultadoLimite.tipo === 'erro') {
            logger.warn('limite_cliente_falhou', {
              error_message: mensagemDoErro(resultadoLimite.erro),
            });
          } else if (resultadoLimite.tipo !== 'escrito') {
            // Reenvio não desfaz decisão já avisada: registra para o Finance
            // ajustar o cadastro e libera `limite_aplicado` na resposta.
            logger.warn('limite_cliente_sem_destino', {
              context: { analise_id: analise.id, motivo: resultadoLimite.tipo },
            });
          }
        }
        const callback = await notificarChampions(
          analise,
          analise.status as 'aprovado' | 'reprovado',
          analise.limite_aprovado,
          analise.parcelas_max,
          analise.parecer,
          analise.decidido_em ?? new Date().toISOString()
        );
        const final = await registrarCallback(analise.id, callback);
        logger.info('callback_reenviado', {
          duration_ms: Date.now() - t0,
          status_code: 200,
          context: { analise_id: analise.id, callback_ok: callback.ok },
        });
        await logger.flush();
        return responder(req, 200, { analise: final, callback });
      }

      if (input.action === 'atualizar_dados') {
        if (decidida) return responder(req, 409, { error: 'Análise já decidida' });
        const patch: Record<string, unknown> = { status: 'em_analise' };
        // Campo enviado (mesmo vazio) sobrescreve; ausente mantém o que está.
        if (input.escavador !== undefined) {
          patch.dados_escavador = input.escavador
            ? { resumo: input.escavador, registrado_em: new Date().toISOString() }
            : null;
        }
        if (input.consulta_financeira !== undefined) {
          patch.dados_consulta_financeira = input.consulta_financeira
            ? { resumo: input.consulta_financeira, registrado_em: new Date().toISOString() }
            : null;
        }
        // Ação explícita do analista: o vínculo pode ter vindo do e-mail e sido
        // associado ao CNPJ depois, então só ele decide soltar — e a reconsulta
        // por CNPJ não devolve o vínculo na mesma chamada.
        if (input.desvincular_cliente) patch.cliente_id = null;
        const cnpjInformado = input.cnpj !== undefined;
        const novoCnpj = cnpjInformado && input.cnpj ? normalizarCnpj(input.cnpj) : null;
        if (input.cnpj && !novoCnpj)
          return responder(req, 400, { error: 'CNPJ inválido (14 dígitos)' });
        // Campo esvaziado: o analista apagou o documento — a ficha da Receita
        // vai junto, em vez de voltar preenchida pelo CNPJ antigo.
        if (cnpjInformado && !input.cnpj) {
          patch.cnpj = null;
          patch.dados_cnpja = null;
          patch.alertas = avaliarAlertas(null, analise.valor_pedido);
          // O vínculo é preservado, inclusive quando o cadastro vinculado tem
          // este mesmo documento: ele pode ter vindo do e-mail e recebido o
          // CNPJ depois — desfazer perderia o cliente certo da análise. Sem
          // CNPJ a aprovação não escreve em cadastro vinculado que tenha CNPJ
          // (ver `aplicarLimite` e a barreira em `decidir`), então o limite não
          // cai no cliente errado.
        }
        const cnpjMudou = Boolean(novoCnpj) && novoCnpj !== analise.cnpj;
        // Reconsulta quando o CNPJ mudou ou quando a consulta inicial falhou —
        // nesse caso pelo documento já gravado, sem tocar no vínculo (o
        // formulário pode estar com o CNPJ antigo de outro analista). Campo
        // intocado não reconsulta; campo apagado manda apagar.
        const cnpjConsultado =
          novoCnpj ??
          (!cnpjInformado && analise.cnpj && !analise.dados_cnpja ? analise.cnpj : null);
        if (cnpjConsultado && (cnpjMudou || !analise.dados_cnpja)) {
          patch.cnpj = cnpjConsultado;
          const consulta = await consultarCnpjInterno(admin, cnpjConsultado);
          if (consulta.ok) {
            patch.dados_cnpja = consulta.dados;
            patch.alertas = avaliarAlertas(consulta.dados, analise.valor_pedido);
          } else {
            logger.warn('cnpja_falhou', { error_message: consulta.erro });
            patch.dados_cnpja = null;
            patch.alertas = avaliarAlertas(null, analise.valor_pedido);
          }
        }
        // CNPJ corrigido: o vínculo com o cadastro segue o novo documento.
        // Só desfaz o vínculo antigo quando ele era mesmo do CNPJ anterior —
        // vínculo por e-mail (cliente sem CNPJ) precisa ser preservado.
        if (novoCnpj && cnpjMudou && !input.desvincular_cliente) {
          // O mesmo CNPJ pode estar cadastrado em mais de uma empresa: busca
          // primeiro na empresa da análise (escopada, limit 1) para o cadastro
          // certo não se perder num lote grande de candidatos.
          const campos = 'id, empresa_id';
          let candidatos: Array<{ id: string; empresa_id: string | null }> = [];
          if (analise.empresa_id) {
            const { data: escopado } = await admin
              .from('clientes')
              .select(campos)
              .or(filtroCnpjCliente(novoCnpj))
              .eq('empresa_id', analise.empresa_id)
              .limit(1);
            candidatos = (escopado ?? []) as Array<{ id: string; empresa_id: string | null }>;
          }
          if (candidatos.length === 0) {
            const { data: gerais } = await admin
              .from('clientes')
              .select(campos)
              .or(filtroCnpjCliente(novoCnpj))
              .limit(10);
            // Entre candidatos de outras empresas, os acessíveis vêm primeiro:
            // 403 só quando não existe cadastro acessível para este CNPJ.
            const empresas = await empresasAcessiveis(admin, guard.dados.userId).catch(
              (): string[] => []
            );
            candidatos = ((gerais ?? []) as Array<{ id: string; empresa_id: string | null }>).sort(
              (a, b) =>
                Number(empresas.includes(b.empresa_id ?? '')) -
                Number(empresas.includes(a.empresa_id ?? ''))
            );
          }
          const cli = escolherCadastroDoCnpj(candidatos, analise.empresa_id);
          if (cli?.id) {
            const empresaNova = cli.empresa_id;
            // Levar a análise para a empresa do cadastro novo só é legítimo com
            // acesso a ela: sem isso o analista tiraria a análise do escopo de
            // quem o autorizou.
            if (
              empresaNova &&
              empresaNova !== analise.empresa_id &&
              !(await empresasAcessiveis(admin, guard.dados.userId)).includes(empresaNova)
            ) {
              return responder(req, 403, { error: 'empresa_sem_acesso' });
            }
            patch.cliente_id = cli.id;
            patch.empresa_id = empresaNova;
          } else if (analise.cliente_id) {
            const { data: atual } = await admin
              .from('clientes')
              .select('cnpj_cpf')
              .eq('id', analise.cliente_id)
              .maybeSingle();
            if (vinculoDesatualizado(atual?.cnpj_cpf, analise.cnpj, novoCnpj)) {
              // Só o vínculo cai: a empresa da análise é mantida para a linha
              // não sair do escopo de quem pode vê-la.
              patch.cliente_id = null;
            }
          }
        }
        const { data: atualizada, error: updError } = await admin
          .from('analises_credito')
          .update(patch)
          .eq('id', analise.id)
          .in('status', STATUS_ABERTOS)
          .select('*')
          .maybeSingle();
        if (updError) throw updError;
        if (!atualizada) {
          return responder(req, 409, { error: 'Análise foi decidida por outro analista' });
        }
        return responder(req, 200, { analise: atualizada });
      }

      // decidir
      if (decidida) return responder(req, 409, { error: 'Análise já decidida' });
      const limite = input.decisao === 'aprovado' ? (input.limite_aprovado ?? null) : null;
      const parcelas = input.decisao === 'aprovado' ? (input.parcelas_max ?? null) : null;
      const parecer = input.parecer ?? null;
      const decididoEm = new Date().toISOString();

      // Sem CNPJ na análise o limite só poderia ir para o cadastro vinculado
      // por e-mail — e se esse cadastro já tem CNPJ não há como confirmar que é
      // o mesmo cliente. Melhor recusar com mensagem do que aprovar sem gravar.
      if (input.decisao === 'aprovado' && limite !== null && !analise.cnpj && analise.cliente_id) {
        const { data: vinc } = await admin
          .from('clientes')
          .select('cnpj_cpf')
          .eq('id', analise.cliente_id)
          .maybeSingle();
        if ((normalizarCnpj(vinc?.cnpj_cpf ?? '') ?? '').length === 14) {
          return responder(req, 409, { error: 'cnpj_necessario_limite' });
        }
      }

      // Transição condicionada ao estado aberto: duas decisões simultâneas
      // nunca se sobrescrevem — a segunda recebe 409.
      const { data: decidido, error: decError } = await admin
        .from('analises_credito')
        .update({
          status: input.decisao,
          limite_aprovado: limite,
          parcelas_max: parcelas,
          parecer,
          decidido_por: guard.dados.userId,
          decidido_em: decididoEm,
        })
        .eq('id', analise.id)
        .in('status', STATUS_ABERTOS)
        .select('id')
        .maybeSingle();
      if (decError) throw decError;
      if (!decidido) {
        return responder(req, 409, { error: 'Análise foi decidida por outro analista' });
      }

      let limiteAplicado = false;
      if (input.decisao === 'aprovado' && limite !== null) {
        const resultadoLimite = await aplicarLimite(analise, limite);
        if (resultadoLimite.tipo === 'erro') {
          logger.warn('limite_cliente_falhou', {
            error_message: mensagemDoErro(resultadoLimite.erro),
          });
        } else if (resultadoLimite.tipo === 'conflito') {
          // Aprovar sem gravar o limite deixaria o Champions recebendo por um
          // crédito que o cadastro não tem, e o analista sem ação: desfaz a
          // decisão e devolve o conflito para ele resolver o vínculo antes.
          const { data: revertida, error: erroReversao } = await admin
            .from('analises_credito')
            .update({
              status: analise.status,
              limite_aprovado: analise.limite_aprovado,
              parcelas_max: analise.parcelas_max,
              parecer: analise.parecer,
              decidido_por: analise.decidido_por ?? null,
              decidido_em: analise.decidido_em ?? null,
            })
            .eq('id', analise.id)
            .eq('status', 'aprovado')
            // Só desfaz a gravação que acabou de ser feita por esta execução.
            .eq('decidido_em', decididoEm)
            .select('id')
            .maybeSingle();
          if (erroReversao || !revertida) {
            logger.error('reversao_decisao_falhou', {
              context: {
                analise_id: analise.id,
                erro: erroReversao
                  ? mensagemDoErro(erroReversao)
                  : 'decisão alterada por outro analista antes da reversão',
              },
            });
          }
          logger.warn('limite_sem_destino', { context: { analise_id: analise.id } });
          return responder(req, 409, { error: 'limite_sem_destino' });
        } else {
          limiteAplicado = resultadoLimite.tipo === 'escrito';
        }
      }

      const callback = await notificarChampions(
        analise,
        input.decisao,
        limite,
        parcelas,
        parecer,
        decididoEm
      );
      const final = await registrarCallback(analise.id, callback);

      logger.info('decisao_registrada', {
        duration_ms: Date.now() - t0,
        status_code: 200,
        context: { analise_id: analise.id, decisao: input.decisao, callback_ok: callback.ok },
      });
      await logger.flush();
      return responder(req, 200, { analise: final, callback, limite_aplicado: limiteAplicado });
    } catch (err) {
      logger.error('fn_failure', {
        duration_ms: Date.now() - t0,
        status_code: 500,
        error_message: err instanceof Error ? err.message : 'Erro inesperado',
      });
      await logger.flush();
      return responder(req, 500, { error: 'Erro interno ao processar a análise' });
    }
  })
);
