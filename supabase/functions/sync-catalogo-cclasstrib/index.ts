// Edge: sync-catalogo-cclasstrib (etapa 79 do plano RT/RFB)
//
// Mantem o espelho local do catalogo cClassTrib alinhado com a API publica de
// dados abertos da RFB. Sem o espelho atualizado, uma nota com cClassTrib novo
// (ou com percentual de reducao revisado) faz o validador acusar divergencia
// contra um catalogo velho â€” alerta falso em cima de documento correto.
//
// Fonte: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos
// (host confirmado no `application-offline.yml` do repositorio oficial
// ReceitaFederal/calculadora-rtc-regime-regular; `/versao` respondeu
// ambiente=apr, versaoDb=V0073 em 2026-11-24).
//
// Escreve com service_role: nao aceita JWT de usuario, so chamada interna
// (`x-cron-secret` do segredo `internal_jobs`).
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersComSegredoPara, exigirChamadaInterna } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { createValidationErrorResponse } from '../_shared/contract-response.ts';
import { validatePayload } from '../_shared/validation.ts';
import { z } from '../_shared/zod.ts';
import {
  MIN_CLASSIFICACOES_API,
  VIGENCIA_BASE_CATALOGO,
  compararVersao,
  decidirEncerramentos,
  montarLinhas,
  normalizarData,
  type ClassificacaoApi,
  type SituacaoApi,
} from './montar.ts';

const log = createLogger('sync-catalogo-cclasstrib');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Base fixa: URL publica da calculadora oficial, sem segredo nem parametro. */
export const BASE_DADOS_ABERTOS =
  'https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos';

const TABELA = 'catalogo_cclasstrib';
const TIMEOUT_MS = 30_000;

export interface VersaoApi {
  ambiente?: string | null;
  dataVersaoDb?: string | null;
  versaoDb?: string | null;
  descricaoVersaoDb?: string | null;
}

export async function buscarDadosAbertos<T>(caminho: string): Promise<T> {
  const resposta = await fetch(`${BASE_DADOS_ABERTOS}/${caminho}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!resposta.ok) throw new Error(`dados_abertos_http_${resposta.status}`);
  // O WAF do piloto responde 200 com HTML "Request Rejected" quando bloqueia o
  // IP, em vez de 403. Sem esta checagem o sync morreria num erro de parse sem
  // dizer o motivo; pior, um HTML vazio poderia passar pelos pisos de guarda.
  const corpo = await resposta.text();
  try {
    return JSON.parse(corpo) as T;
  } catch {
    const inicio = corpo.slice(0, 120).replace(/\s+/g, ' ');
    throw new Error(`dados_abertos_nao_json: ${inicio}`);
  }
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
      z.object({
        data: z.string().trim().optional(),
        forcar: z.string().optional(),
      }),
      {
        data: url.searchParams.get('data') ?? undefined,
        forcar: url.searchParams.get('forcar') ?? undefined,
      },
      'sync-catalogo-cclasstrib'
    );
    if (!params.success) {
      return createValidationErrorResponse(params.details, corsHeaders, 'Parâmetros inválidos');
    }
    const data = normalizarData(params.data.data);
    // `validatePayload` exige schema cujo entrada e saida coincidem, entao a
    // conversao de `forcar` sai do Zod em vez de virar `transform`.
    const forcar = params.data.forcar === '1' || params.data.forcar === 'true';

    // 1. Versao da base oficial: vira `versao_it` e barra downgrade.
    const versao = await buscarDadosAbertos<VersaoApi>('versao');
    const versaoDb = String(versao?.versaoDb ?? '').trim();
    if (!versaoDb) {
      log.error('versao da base oficial sem identificador', { context: { data } });
      return json({ ok: false, error: 'versao_indisponivel' }, 502);
    }

    const { data: local, error: erroLocal } = await sb
      .from(TABELA)
      .select('cclasstrib')
      .eq('inicio_vigencia', VIGENCIA_BASE_CATALOGO)
      .is('fim_vigencia', null)
      .limit(1000);
    if (erroLocal) throw erroLocal;
    const abertos: string[] = (local ?? []).map((l: { cclasstrib: string }) =>
      String(l.cclasstrib).trim()
    );

    const { data: atual, error: erroVersao } = await sb
      .from(TABELA)
      .select('versao_it')
      .order('versao_it', { ascending: false })
      .limit(1);
    if (erroVersao) throw erroVersao;
    const versaoLocal: string | null = atual?.[0]?.versao_it ?? null;
    if (!forcar && versaoLocal && compararVersao(versaoDb, versaoLocal) < 0) {
      log.info('sync ignorado: base oficial anterior a local', {
        context: { versao_oficial: versaoDb, versao_local: versaoLocal },
      });
      return json({
        ok: true,
        motivo: 'versao_anterior',
        data,
        versao_oficial: versaoDb,
        versao_local: versaoLocal,
      });
    }

    // 2. Catalogo vigente na data consultada.
    const [classificacoes, situacoes] = await Promise.all([
      buscarDadosAbertos<ClassificacaoApi[]>(
        `classificacoes-tributarias/cbs-ibs?data=${encodeURIComponent(data)}`
      ),
      buscarDadosAbertos<SituacaoApi[]>(
        `situacoes-tributarias/cbs-ibs?data=${encodeURIComponent(data)}`
      ),
    ]);
    if (!Array.isArray(classificacoes) || !Array.isArray(situacoes)) {
      log.error('resposta da base oficial fora do contrato', { context: { data } });
      return json({ ok: false, error: 'resposta_invalida' }, 502);
    }

    const mapeamento = montarLinhas(classificacoes, situacoes, versaoDb);
    if (mapeamento.linhas.length < MIN_CLASSIFICACOES_API) {
      log.error('catalogo oficial abaixo do piso: nada foi escrito', {
        context: { data, recebidas: classificacoes.length, mapeadas: mapeamento.linhas.length },
      });
      return json(
        {
          ok: false,
          error: 'resposta_insuficiente',
          data,
          recebidas: classificacoes.length,
          mapeadas: mapeamento.linhas.length,
          minimo: MIN_CLASSIFICACOES_API,
        },
        502
      );
    }

    // 3. Espelho: upsert por (codigo, vigencia). `exige_gibscbs` e `ind_dir`
    // ficam fora do payload de proposito â€” a API nao os publica, entao o valor
    // semeado a partir do banco oficial e preservado.
    const { error: erroUpsert } = await sb
      .from(TABELA)
      .upsert(mapeamento.linhas, { onConflict: 'cclasstrib,inicio_vigencia' });
    if (erroUpsert) throw erroUpsert;

    // 4. Encerramento guardado do que desapareceu do catalogo oficial. A lista de
    // presenca vem de `mapeamento.presentes`, nao de `mapeamento.linhas`: um
    // codigo publicado cujo vinculo de CST falhou continua na Receita e nao pode
    // ser encerrado por falha nossa (ele reaparece em `sem_cst` no resumo).
    const recebidos = mapeamento.presentes;
    const decisao = decidirEncerramentos(abertos, recebidos, data);
    let encerradas = 0;
    if (decisao.encerrar.length > 0) {
      const { error: erroEncerrar, count } = await sb
        .from(TABELA)
        .update({ fim_vigencia: data }, { count: 'exact' })
        .in(
          'cclasstrib',
          decisao.encerrar.map((e) => e.cclasstrib)
        )
        .eq('inicio_vigencia', VIGENCIA_BASE_CATALOGO)
        .is('fim_vigencia', null);
      if (erroEncerrar) throw erroEncerrar;
      encerradas = count ?? decisao.encerrar.length;
    }

    const resumo = {
      ok: true,
      data,
      versao_oficial: versaoDb,
      data_versao: versao.dataVersaoDb ?? null,
      ambiente: versao.ambiente ?? null,
      recebidas: classificacoes.length,
      situacoes: situacoes.length,
      gravadas: mapeamento.linhas.length,
      encerradas,
      ausentes: decisao.ausentes,
      encerramento_bloqueado: decisao.bloqueado ? decisao.motivo : null,
      sem_cst: mapeamento.sem_cst,
      ambiguas: mapeamento.ambiguas,
      ignoradas: mapeamento.ignoradas,
    };
    log.info('sync concluido', {
      context: {
        // O painel de saude (etapa 83) casa esta linha com o `request_end` pelo
        // `request_id`: sem o id aqui o run bem sucedido nao conta como frescor.
        request_id: req.headers.get('x-request-id') ?? null,
        data,
        versao_oficial: versaoDb,
        gravadas: resumo.gravadas,
        encerradas,
        sem_cst: resumo.sem_cst.length,
        ignoradas: resumo.ignoradas.length,
      },
    });
    return json(resumo);
  } catch (e) {
    log.error('sync-catalogo-cclasstrib:', {
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
    withEdgeObservability('sync-catalogo-cclasstrib', async (req) => {
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
