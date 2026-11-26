// Edge: sync-catalogo-ncm-nbs (etapa 80 do plano RT/RFB)
//
// Mantem os espelhos locais de NCM (`catalogo_ncm`) e NBS (`catalogo_nbs`)
// alinhados com a API publica de dados abertos da RFB. Sem eles, o validador da
// etapa 46 (`src/lib/tributario/validador-ncm-cst.ts`) nao tem contra o que
// comparar o NCM do item: o catalogo nasce vazio e nunca era preenchido.
//
// Fonte: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos
// (`/ncm/vigentes` e `/nbs/lista`, ambas exigem `data=AAAA-MM-DD`).
//
// Escreve com service_role: nao aceita JWT de usuario, so chamada interna
// (`x-cron-secret` do segredo `internal_jobs`).
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersComSegredoPara, exigirChamadaInterna } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { createValidationErrorResponse } from '../_shared/contract-response.ts';
import { validatePayload } from '../_shared/validation.ts';
import { z } from '../_shared/zod.ts';
import {
  buscarDadosAbertos,
  decidirEncerramentos,
  normalizarData,
  type VersaoApi,
} from '../_shared/rfb-dados-abertos.ts';
import {
  diaAnterior,
  MIN_NBS_API,
  MIN_NCM_API,
  montarNbs,
  montarNcms,
  semFimVigencia,
  separarReativados,
  type ItemListaApi,
  type Mapeamento,
} from './montar.ts';

const log = createLogger('sync-catalogo-ncm-nbs');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TABELA_NCM = 'catalogo_ncm';
const TABELA_NBS = 'catalogo_nbs';

/**
 * Teto de linhas por pagina na leitura dos codigos abertos. O PostgREST corta a
 * resposta no `max-rows` configurado (1000 no padrao do Supabase): uma leitura
 * unica de `catalogo_ncm` voltaria com 1.000 dos ~10 mil NCMs e a decisao de
 * encerramento seria tomada sobre um universo truncado.
 */
const PAGINA = 1000;
/** Guarda contra laco infinito se a paginacao nunca encurtar. */
const MAX_PAGINAS = 100;

type Cliente = SupabaseClient<any, any, any>;

interface ResultadoCatalogo {
  tabela: string;
  publicados: number;
  /** Linhas enviadas ao `upsert`: nao inclui `preservadas`, que nao e gravada. */
  gravados: number;
  encerrados: number;
  /** Codigos que voltaram a aparecer e abriram periodo novo na data da carga. */
  reativados: number;
  /** Periodos abertos fora da data-base: reativados numa carga anterior. */
  reabertas: number;
  /** Carga retroativa: linha preservada, o periodo aberto comeca depois. */
  preservadas: number;
  ausentes: number;
  encerramento_bloqueado: string | null;
  ignoradas: string[];
}

/**
 * Codigos da tabela, paginados.
 *
 * Traz todo codigo com qualquer linha, aberta ou encerrada: e o universo que
 * separa codigo novo de codigo reativado. Quem protege o encerramento e
 * `listarAbertos`.
 */
async function listarCodigos(sb: Cliente, tabela: string, coluna: string): Promise<string[]> {
  const codigos: string[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const inicio = pagina * PAGINA;
    const consulta = sb.from(tabela).select(coluna);
    // `range` sem `order` nao tem ordem estavel: o Postgres pode devolver as
    // linhas em ordem diferente entre duas paginas e a leitura repetiria ou
    // pularia codigos — justamente os que decidem o encerramento.
    const { data, error } = await consulta.order(coluna).range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const linha of linhas) codigos.push(String(linha[coluna] ?? '').trim());
    if (linhas.length < PAGINA) break;
  }
  return codigos.filter(Boolean);
}

/**
 * Periodos abertos (`fim_vigencia IS NULL`) como codigo -> `inicio_vigencia`.
 *
 * E o universo que a guarda de ausentes protege e, ao mesmo tempo, a unica
 * forma de distinguir o periodo base (`inicio_vigencia` = data-base) de um
 * periodo aberto por reativacao: o segundo nao pode voltar para a data-base.
 */
async function listarAbertos(
  sb: Cliente,
  tabela: string,
  coluna: string
): Promise<Map<string, string>> {
  const abertos = new Map<string, string>();
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const inicio = pagina * PAGINA;
    const { data, error } = await sb
      .from(tabela)
      .select(`${coluna},inicio_vigencia`)
      .is('fim_vigencia', null)
      .order(coluna)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const linha of linhas) {
      const codigo = String(linha[coluna] ?? '').trim();
      if (codigo) abertos.set(codigo, String(linha.inicio_vigencia ?? '').trim());
    }
    if (linhas.length < PAGINA) break;
  }
  return abertos;
}

/** Teto de codigos por `IN (...)` no encerramento. */
const LOTE_ENCERRAMENTO = 200;

/**
 * Grava um catalogo e fecha a vigencia do que desapareceu da API.
 *
 * O `upsert` nunca toca `fim_vigencia` (`semFimVigencia`): encerrar vigencia e
 * trabalho do passo de encerramento, que so roda depois das guardas.
 */
export async function gravar<T extends { inicio_vigencia: string }>(
  sb: Cliente,
  tabela: string,
  coluna: string,
  mapeamento: Mapeamento<T>,
  minimo: number,
  data: string
): Promise<ResultadoCatalogo> {
  const resultado: ResultadoCatalogo = {
    tabela,
    publicados: mapeamento.presentes.length,
    gravados: 0,
    encerrados: 0,
    reativados: 0,
    reabertas: 0,
    preservadas: 0,
    ausentes: 0,
    encerramento_bloqueado: null,
    ignoradas: mapeamento.ignoradas,
  };

  if (mapeamento.linhas.length < minimo) {
    resultado.encerramento_bloqueado = 'resposta_insuficiente';
    resultado.ausentes = 0;
    return resultado;
  }

  // Os dois conjuntos sao lidos ANTES do upsert:
  //  - `abertos` e o universo que a guarda de ausentes protege. Ler depois
  //    misturaria ao denominador os codigos que a propria carga acabou de
  //    inserir, diluindo a porcentagem e permitindo encerrar acima do teto;
  //  - `conhecidos` separa codigo novo de codigo reativado (ver
  //    `separarReativados`: reabrir o periodo antigo apagaria o encerramento).
  const abertos = await listarAbertos(sb, tabela, coluna);
  const conhecidos = await listarCodigos(sb, tabela, coluna);
  const { base, reativadas, reabertas, preservadas } = separarReativados(
    mapeamento.linhas,
    (linha) => String((linha as unknown as Record<string, unknown>)[coluna] ?? ''),
    { abertos, conhecidos },
    data
  );

  const gravarLote = async (linhasDoLote: T[]) => {
    if (linhasDoLote.length === 0) return;
    const { error } = await sb
      .from(tabela)
      .upsert(linhasDoLote.map(semFimVigencia), { onConflict: `${coluna},inicio_vigencia` });
    if (error) throw error;
  };
  await gravarLote(base);
  await gravarLote(reativadas);
  await gravarLote(reabertas);
  // `preservadas` nao e gravada: a chave dela e de um periodo futuro. Por isso
  // `gravados` e a soma dos lotes enviados, e nao `linhas.length`: o resumo
  // diria que gravou o que ficou so no relatorio.
  resultado.gravados = base.length + reativadas.length + reabertas.length;
  resultado.reativados = reativadas.length;
  resultado.reabertas = reabertas.length;
  resultado.preservadas = preservadas.length;

  const decisao = decidirEncerramentos([...abertos.keys()], mapeamento.presentes, minimo);
  resultado.ausentes = decisao.ausentes.length;
  if (decisao.bloqueado) {
    resultado.encerramento_bloqueado = decisao.motivo ?? 'bloqueado';
    return resultado;
  }
  // Em lotes: `in(...)` com o teto de 10% de ~10 mil NCMs estoura o tamanho de
  // URL do PostgREST e a carga inteira falharia no unico momento em que o
  // encerramento importa (atualizacao anual da RFB).
  // A lista que acabamos de ler ja nao traz o codigo: o ultimo dia em que ele
  // constava na fonte oficial e o dia anterior ao recorte, nao o dia da carga.
  // Gravar a propria `data` encurtava a vigencia em um dia e fazia a nota
  // emitida no ultimo dia valido sair com REG-012. O `lte` evita inverter o
  // periodo de uma linha aberta na propria data da carga (inicio > fim).
  const ultimoDiaVigente = diaAnterior(data);
  for (let i = 0; i < decisao.ausentes.length; i += LOTE_ENCERRAMENTO) {
    const lote = decisao.ausentes.slice(i, i + LOTE_ENCERRAMENTO);
    const { error: erroEncerrar, count } = await sb
      .from(tabela)
      .update({ fim_vigencia: ultimoDiaVigente }, { count: 'exact' })
      .in(coluna, lote)
      .is('fim_vigencia', null)
      .lte('inicio_vigencia', ultimoDiaVigente);
    if (erroEncerrar) throw erroEncerrar;
    resultado.encerrados += count ?? lote.length;
  }
  return resultado;
}

export const handler = async (req: Request) => {
  const corsHeaders = corsHeadersComSegredoPara(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const url = new URL(req.url);
    // `validatePayload` (AGENTS.md) em vez de `safeParse` solto: o helper marca o
    // desvio de contrato no log da funcao e devolve os campos para a resposta.
    const params = validatePayload(
      z.object({ data: z.string().trim().optional() }),
      { data: url.searchParams.get('data') ?? undefined },
      'sync-catalogo-ncm-nbs'
    );
    if (!params.success) {
      return createValidationErrorResponse(params.details, corsHeaders, 'Parâmetros inválidos');
    }
    const data = normalizarData(params.data.data);

    // Versao da base oficial: vai para o log e para o resumo. Nao ha guarda de
    // downgrade aqui porque `catalogo_ncm`/`catalogo_nbs` nao guardam versao —
    // e as duas listas nao carregam percentual, entao base anterior so significa
    // menos codigos, nunca percentual errado. O teto de ausentes cobre o resto.
    const versao = await buscarDadosAbertos<VersaoApi>('versao');
    const versaoDb = String(versao?.versaoDb ?? '').trim() || null;

    const [ncmsApi, nbsApi] = await Promise.all([
      buscarDadosAbertos<ItemListaApi[]>(`ncm/vigentes?data=${encodeURIComponent(data)}`),
      buscarDadosAbertos<ItemListaApi[]>(`nbs/lista?data=${encodeURIComponent(data)}`),
    ]);
    if (!Array.isArray(ncmsApi) || !Array.isArray(nbsApi)) {
      log.error('resposta da base oficial fora do contrato', { context: { data } });
      return json({ ok: false, error: 'resposta_invalida' }, 502);
    }

    const ncm = await gravar(sb, TABELA_NCM, 'ncm', montarNcms(ncmsApi), MIN_NCM_API, data);
    const nbs = await gravar(sb, TABELA_NBS, 'nbs', montarNbs(nbsApi), MIN_NBS_API, data);

    const resumo = {
      ok: ncm.gravados > 0 || nbs.gravados > 0,
      data,
      versao_oficial: versaoDb,
      ambiente: versao.ambiente ?? null,
      recebidos: { ncm: ncmsApi.length, nbs: nbsApi.length },
      ncm,
      nbs,
    };
    log.info('sync concluido', {
      context: {
        // O painel de saude (etapa 83) casa esta linha com o `request_end` pelo
        // `request_id`: sem o id aqui o run bem sucedido nao prova o escopo.
        request_id: req.headers.get('x-request-id') ?? null,
        data,
        versao_oficial: versaoDb,
        recebidos_ncm: ncmsApi.length,
        recebidos_nbs: nbsApi.length,
        ncm_gravados: ncm.gravados,
        nbs_gravados: nbs.gravados,
        ncm_encerrados: ncm.encerrados,
        nbs_encerrados: nbs.encerrados,
      },
    });
    return json(resumo, resumo.ok ? 200 : 502);
  } catch (e) {
    log.error('sync-catalogo-ncm-nbs:', {
      error_message: mensagemErro(e),
      context: contextoErro(e),
    });
    // Sem texto do erro no corpo: detalhe fica no log (CodeQL
    // js/stack-trace-exposure).
    return json({ ok: false, error: 'falha_sync' }, 500);
  }
};

if (import.meta.main) {
  Deno.serve(
    withEdgeObservability('sync-catalogo-ncm-nbs', async (req) => {
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
