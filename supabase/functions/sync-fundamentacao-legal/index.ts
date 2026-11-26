// Edge: sync-fundamentacao-legal (etapa 82 do plano RT/RFB)
//
// Mantem `catalogo_fundamentacao` alinhado com `/fundamentacoes-legais` da API
// publica de dados abertos da RFB. E a norma que sustenta cada cClassTrib: sem
// ela o alerta fiscal do item identifica a divergencia e nao a base legal.
//
// Fonte: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos
// (`/fundamentacoes-legais?data=AAAA-MM-DD`; 170 linhas em 2026-06-01).
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
  VIGENCIA_BASE_CATALOGO,
  type VersaoApi,
} from '../_shared/rfb-dados-abertos.ts';
import {
  chaveFundamento,
  filtroAusentes,
  MIN_FUNDAMENTACOES_API,
  montarFundamentos,
  type MapeamentoFundamentos,
} from './montar.ts';

const log = createLogger('sync-fundamentacao-legal');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TABELA = 'catalogo_fundamentacao';
const COLUNAS_CHAVE = 'cclasstrib, cst, conjunto_tributo';

/** Teto de linhas por pagina: o PostgREST corta a resposta no `max-rows`. */
const PAGINA = 1000;
/** Guarda contra laco infinito se a paginacao nunca encurtar. */
const MAX_PAGINAS = 10;
/**
 * Chaves por `update` de encerramento. O filtro `or` viaja na URL; acima disso o
 * PostgREST recusa por tamanho de requisicao.
 */
const CHAVES_POR_UPDATE = 40;

type Cliente = SupabaseClient<any, any, any>;

interface ResultadoFundamentacao {
  tabela: string;
  publicados: number;
  gravados: number;
  agrupadas: number;
  encerrados: number;
  ausentes: number;
  encerramento_bloqueado: string | null;
  ignoradas: string[];
}

/** Chaves com vigencia aberta na vigencia base, paginadas. */
async function listarAbertos(sb: Cliente): Promise<string[]> {
  const chaves: string[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const inicio = pagina * PAGINA;
    const { data, error } = await sb
      .from(TABELA)
      .select(COLUNAS_CHAVE)
      .eq('inicio_vigencia', VIGENCIA_BASE_CATALOGO)
      .is('fim_vigencia', null)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const linha of linhas) {
      const cclasstrib = String(linha.cclasstrib ?? '').trim();
      const cst = String(linha.cst ?? '').trim();
      const conjunto = String(linha.conjunto_tributo ?? '').trim();
      if (cclasstrib && cst && conjunto) {
        chaves.push(chaveFundamento(cclasstrib, cst, conjunto));
      }
    }
    if (linhas.length < PAGINA) break;
  }
  return chaves;
}

/**
 * Grava o catalogo e encerra a vigencia do que desapareceu da API.
 *
 * `filtroAusentes` monta um `or` de `and`s porque a chave e composta: nao existe
 * `in` de triplas no PostgREST.
 */
async function gravar(
  sb: Cliente,
  mapeamento: MapeamentoFundamentos,
  data: string
): Promise<ResultadoFundamentacao> {
  const resultado: ResultadoFundamentacao = {
    tabela: TABELA,
    publicados: mapeamento.presentes.length,
    gravados: 0,
    agrupadas: mapeamento.agrupadas,
    encerrados: 0,
    ausentes: 0,
    encerramento_bloqueado: null,
    ignoradas: mapeamento.ignoradas,
  };

  if (mapeamento.linhas.length < MIN_FUNDAMENTACOES_API) {
    resultado.encerramento_bloqueado = 'resposta_insuficiente';
    return resultado;
  }

  const { error: erroUpsert } = await sb.from(TABELA).upsert(mapeamento.linhas, {
    onConflict: 'cclasstrib,cst,conjunto_tributo,inicio_vigencia',
  });
  if (erroUpsert) throw erroUpsert;
  resultado.gravados = mapeamento.linhas.length;

  const abertos = await listarAbertos(sb);
  const decisao = decidirEncerramentos(abertos, mapeamento.presentes, MIN_FUNDAMENTACOES_API);
  resultado.ausentes = decisao.ausentes.length;
  if (decisao.bloqueado) {
    resultado.encerramento_bloqueado = decisao.motivo ?? 'bloqueado';
    return resultado;
  }

  for (let i = 0; i < decisao.ausentes.length; i += CHAVES_POR_UPDATE) {
    const grupo = decisao.ausentes.slice(i, i + CHAVES_POR_UPDATE);
    const { error: erroEncerrar, count } = await sb
      .from(TABELA)
      .update({ fim_vigencia: data }, { count: 'exact' })
      .or(filtroAusentes(grupo))
      .eq('inicio_vigencia', VIGENCIA_BASE_CATALOGO)
      .is('fim_vigencia', null);
    if (erroEncerrar) throw erroEncerrar;
    resultado.encerrados += count ?? grupo.length;
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
    const params = validatePayload(
      z.object({ data: z.string().trim().optional() }),
      { data: url.searchParams.get('data') ?? undefined },
      'sync-fundamentacao-legal'
    );
    if (!params.success) {
      return createValidationErrorResponse(params.details, corsHeaders, 'Parâmetros inválidos');
    }
    const data = normalizarData(params.data.data);

    // `versao_it` guarda a versao da base oficial: nao existe versao de IT
    // propria para fundamentacao legal, e a coluna e NOT NULL por consistencia
    // com os outros catalogos.
    const versao = await buscarDadosAbertos<VersaoApi>('versao');
    const versaoDb = String(versao?.versaoDb ?? '').trim() || null;

    const payload = await buscarDadosAbertos<unknown>(
      `fundamentacoes-legais?data=${encodeURIComponent(data)}`
    );
    if (!Array.isArray(payload)) {
      log.error('resposta da base oficial fora do contrato', { context: { data } });
      return json({ ok: false, error: 'resposta_invalida' }, 502);
    }

    const mapeamento = montarFundamentos(
      payload,
      VIGENCIA_BASE_CATALOGO,
      versaoDb ?? 'nao_informada'
    );
    const fundamentacao = await gravar(sb, mapeamento, data);

    const resumo = {
      ok: fundamentacao.gravados > 0,
      data,
      versao_oficial: versaoDb,
      ambiente: versao.ambiente ?? null,
      recebidos: payload.length,
      fundamentacao,
    };
    log.info('sync concluido', {
      context: {
        // O painel de saude (etapa 83) casa esta linha com o `request_end` pelo
        // `request_id`: sem o id aqui o run bem sucedido nao conta como frescor.
        request_id: req.headers.get('x-request-id') ?? null,
        data,
        versao_oficial: versaoDb,
        publicados: fundamentacao.publicados,
        gravados: fundamentacao.gravados,
        encerrados: fundamentacao.encerrados,
        ignoradas: fundamentacao.ignoradas.length,
      },
    });
    return json(resumo, resumo.ok ? 200 : 502);
  } catch (e) {
    log.error('sync-fundamentacao-legal:', {
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
    withEdgeObservability('sync-fundamentacao-legal', async (req) => {
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
