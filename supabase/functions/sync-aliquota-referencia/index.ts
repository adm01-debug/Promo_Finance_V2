// Edge: sync-aliquota-referencia (etapa 81 do plano RT/RFB)
//
// Mantem `catalogo_aliquota_referencia` alinhado com a API publica de dados
// abertos da RFB: uma linha por ano e ente (CBS nacional, IBS por UF, IBS por
// municipio). E a serie que diz quanto e a aliquota de referencia em cada ano da
// transicao — sem ela, quem consulta o catalogo nao tem de onde tirar o numero.
//
// Fonte: https://piloto-cbs.tributos.gov.br/servico/calculadora-consumo/api/calculadora/dados-abertos
// (`/aliquota-uniao`, `/aliquota-uf?codigoUf=`, `/aliquota-municipio?codigoMunicipio=`,
// todas com `data=AAAA-MM-DD`; `/ufs` traduz codigo IBGE da UF em sigla).
//
// Duas limitacoes da fonte estao no desenho, nao no acaso:
//   1. o piloto bloqueia por taxa depois de ~30 requisicoes seguidas e responde
//      200 com HTML — a rodada para na primeira resposta nao-JSON e retoma na
//      proxima execucao (a ordenacao por pendencia faz a tabela convergir);
//   2. aliquota ainda nao publicada responde 404 com corpo JSON: e ausencia de
//      dado (2027 em diante), registrada no resumo, nunca erro.
//
// `aliquotaPropria` e `formaAplicacao` vem no payload e nao tem coluna: a tabela
// guarda a aliquota de referencia (desenho da etapa 38) e os dois ficam no log. Em
// 2026 a API nao publica nenhum dos dois, ou seja, nao ha dado perdido.
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
  erroHttp,
  erroNaoJson,
  normalizarData,
  type VersaoApi,
} from '../_shared/rfb-dados-abertos.ts';
import {
  extrairUfs,
  MIN_UFS,
  montarMunicipio,
  montarUf,
  montarUniao,
  ordenarPorPendencia,
  type AliquotaApi,
  type LinhaAliquota,
  type TributoAliquota,
} from './montar.ts';

const log = createLogger('sync-aliquota-referencia');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TABELA = 'catalogo_aliquota_referencia';
/** Tabela de ISS municipal: e a lista de municipios que o sistema realmente usa. */
const TABELA_ISS = 'aliquotas_iss_municipal';

/** Intervalo entre consultas: espaca a rajada sem tornar a rodada longa demais. */
const PAUSA_MS = 1200;
/** Teto de UFs por rodada (o Brasil inteiro e 27). */
const MAX_UFS = 27;
/** Teto de municipios por rodada: a fonte bloqueia por taxa antes disso. */
const MAX_MUNICIPIOS = 40;
/** Teto absoluto de requisicoes por execucao, independente do escopo. */
const MAX_REQUISICOES = 70;
const PAGINA = 1000;
const MAX_PAGINAS = 100;

type Cliente = SupabaseClient<any, any, any>;

/** Bloqueio por taxa do WAF: para a rodada e preserva o que ja foi gravado. */
class InterrupcaoWaf extends Error {}

interface Gravado {
  id: string;
  uf: string | null;
}

interface ResultadoEscopo {
  consultados: number;
  gravados: number;
  nao_publicadas: number;
  pendentes: number;
  interrompido: boolean;
}

/** `id` do registro por chave de ente, para atualizar sem depender de upsert. */
function chaveDe(
  tributo: TributoAliquota | string,
  uf: string | null,
  municipio: string | null
): string {
  return `${String(tributo).trim()}|${String(uf ?? '')
    .trim()
    .toUpperCase()}|${String(municipio ?? '').trim()}`;
}

function chaveLinha(linha: LinhaAliquota): string {
  return chaveDe(linha.tributo, linha.uf, linha.municipio_ibge);
}

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Le as linhas do ano. O upsert do PostgREST casa com **um** indice unico, e
 * `catalogo_aliquota_referencia` tem tres indices parciais (um por granularidade
 * de tributo) — `on_conflict` nao consegue apontar para eles. Por isso a leitura:
 * quem existe e atualizado por `id`, quem nao existe e inserido.
 */
async function listarGravados(sb: Cliente, ano: number): Promise<Map<string, Gravado>> {
  const mapa = new Map<string, Gravado>();
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const inicio = pagina * PAGINA;
    const { data, error } = await sb
      .from(TABELA)
      .select('id, tributo, uf, municipio_ibge')
      .eq('ano', ano)
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const registro of linhas) {
      const id = String(registro.id ?? '').trim();
      if (!id) continue;
      mapa.set(
        chaveDe(
          String(registro.tributo ?? ''),
          registro.uf === null || registro.uf === undefined ? null : String(registro.uf).trim(),
          registro.municipio_ibge === null || registro.municipio_ibge === undefined
            ? null
            : String(registro.municipio_ibge).trim()
        ),
        {
          id,
          uf: registro.uf === null || registro.uf === undefined ? null : String(registro.uf).trim(),
        }
      );
    }
    if (linhas.length < PAGINA) break;
  }
  return mapa;
}

/** Grava as linhas do escopo: `update` por `id` no que existe, `insert` no resto. */
async function gravar(
  sb: Cliente,
  linhas: LinhaAliquota[],
  gravados: Map<string, Gravado>
): Promise<number> {
  const inserir: Array<Record<string, unknown>> = [];
  const atualizar: Array<Record<string, unknown>> = [];
  for (const linha of linhas) {
    const existente = gravados.get(chaveLinha(linha));
    if (existente) {
      atualizar.push({ id: existente.id, ...linha, carregado_em: new Date().toISOString() });
    } else {
      inserir.push({ ...linha });
    }
  }
  if (inserir.length > 0) {
    const { error } = await sb.from(TABELA).insert(inserir);
    if (error) throw error;
  }
  if (atualizar.length > 0) {
    const { error } = await sb.from(TABELA).upsert(atualizar, { onConflict: 'id' });
    if (error) throw error;
  }
  return inserir.length + atualizar.length;
}

/**
 * Consulta uma rota de aliquota. `404` e "ainda nao publicada" (devolve `null`),
 * resposta nao-JSON e bloqueio por taxa (interrompe a rodada) e qualquer outro
 * erro sobe: falha de rede nao pode virar "sem aliquota" em silencio.
 */
async function consultar(caminho: string): Promise<AliquotaApi | null> {
  try {
    return await buscarDadosAbertos<AliquotaApi>(caminho);
  } catch (e) {
    if (erroHttp(e, 404)) return null;
    if (erroNaoJson(e)) throw new InterrupcaoWaf(String(mensagemErro(e)).slice(0, 60));
    throw e;
  }
}

/**
 * Municipios que o sistema usa: a lista vem de `aliquotas_iss_municipal`, nao de
 * um universo arbitrario — consultar todos os 5.570 municipios do pais seria
 * varredura sem uso e impossivel pela taxa da fonte.
 */
async function listarMunicipios(sb: Cliente): Promise<Map<string, string | null>> {
  const mapa = new Map<string, string | null>();
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const inicio = pagina * PAGINA;
    const { data, error } = await sb
      .from(TABELA_ISS)
      .select('codigo_ibge, uf')
      .range(inicio, inicio + PAGINA - 1);
    if (error) throw error;
    const linhas = (data ?? []) as unknown as Array<Record<string, unknown>>;
    for (const registro of linhas) {
      const codigo = String(registro.codigo_ibge ?? '').trim();
      if (!/^\d{7}$/.test(codigo) || mapa.has(codigo)) continue;
      mapa.set(
        codigo,
        registro.uf === null || registro.uf === undefined ? null : String(registro.uf).trim()
      );
    }
    if (linhas.length < PAGINA) break;
  }
  return mapa;
}

function vazio(): ResultadoEscopo {
  return { consultados: 0, gravados: 0, nao_publicadas: 0, pendentes: 0, interrompido: false };
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
      z.object({
        data: z.string().trim().optional(),
        escopo: z.enum(['uf', 'municipio', 'todos']).optional(),
        limite: z.coerce.number().int().positive().max(200).optional(),
      }),
      {
        data: url.searchParams.get('data') ?? undefined,
        escopo: url.searchParams.get('escopo') ?? undefined,
        limite: url.searchParams.get('limite') ?? undefined,
      },
      'sync-aliquota-referencia'
    );
    if (!params.success) {
      return createValidationErrorResponse(params.details, corsHeaders, 'Parâmetros inválidos');
    }
    const data = normalizarData(params.data.data);
    const ano = Number(data.slice(0, 4));
    const escopo = params.data.escopo ?? 'uf';
    const tetoUf = Math.min(params.data.limite ?? MAX_UFS, MAX_UFS);
    const tetoMunicipio = Math.min(params.data.limite ?? MAX_MUNICIPIOS, MAX_MUNICIPIOS);

    const versao = await buscarDadosAbertos<VersaoApi>('versao');
    const versaoDb = String(versao?.versaoDb ?? '').trim() || null;

    // As siglas sao a unica ponte entre o codigo IBGE exigido pela API e a coluna
    // `uf`: sem a lista completa de UFs a rodada de UF nao tem como escrever certo.
    const ufsApi = await buscarDadosAbertos<unknown>(`ufs?data=${encodeURIComponent(data)}`);
    const ufs = extrairUfs(ufsApi);
    if (ufs.size < MIN_UFS) {
      log.error('lista de UFs fora do contrato', { context: { data, ufs: ufs.size } });
      return json({ ok: false, error: 'resposta_invalida' }, 502);
    }

    const gravados = await listarGravados(sb, ano);
    let requisicoes = 2;
    let interrompido = false;
    // O teto de requisicoes corta a lista no meio: o resumo continua ok, mas a
    // rodada nao cobre o escopo inteiro (o painel de saude le este campo).
    let truncada = false;

    // CBS nacional: uma linha, sem ente.
    const cbs = vazio();
    let linhaCbs: LinhaAliquota | null = null;
    try {
      const respostaUniao = await consultar(`aliquota-uniao?data=${encodeURIComponent(data)}`);
      requisicoes += 1;
      linhaCbs = montarUniao(respostaUniao, ano);
      if (linhaCbs) {
        cbs.consultados = 1;
        cbs.gravados = await gravar(sb, [linhaCbs], gravados);
      } else {
        cbs.nao_publicadas = 1;
      }
    } catch (e) {
      if (!(e instanceof InterrupcaoWaf)) throw e;
      interrompido = true;
      cbs.interrompido = true;
    }

    const uf = vazio();
    if (!interrompido && escopo !== 'municipio') {
      // `ordenarPorPendencia` trabalha com as chaves da fonte (codigo IBGE da UF):
      // o que ja existe no catalogo guarda sigla, entao o mapa reverso traduz.
      const codigoPorSigla = new Map<string, string>();
      for (const [codigo, sigla] of ufs) codigoPorSigla.set(sigla, codigo);
      const gravadosUf = new Set<string>();
      for (const [chave, registro] of gravados) {
        if (!chave.startsWith('ibs_uf|') || !registro.uf) continue;
        const codigo = codigoPorSigla.get(registro.uf);
        if (codigo) gravadosUf.add(codigo);
      }
      const selecao = ordenarPorPendencia([...ufs.keys()], gravadosUf, tetoUf);
      uf.pendentes = selecao.pendentes;
      const linhas: LinhaAliquota[] = [];
      try {
        for (const codigoUf of selecao.alvos) {
          if (requisicoes >= MAX_REQUISICOES) {
            truncada = true;
            break;
          }
          if (uf.consultados > 0) await espera(PAUSA_MS);
          requisicoes += 1;
          const resposta = await consultar(
            `aliquota-uf?data=${encodeURIComponent(data)}&codigoUf=${codigoUf}`
          );
          uf.consultados += 1;
          const linha = montarUf(ufs.get(codigoUf), resposta, ano);
          if (linha) linhas.push(linha);
          else uf.nao_publicadas += 1;
        }
      } catch (e) {
        if (!(e instanceof InterrupcaoWaf)) throw e;
        interrompido = true;
        uf.interrompido = true;
      }
      if (linhas.length > 0) uf.gravados = await gravar(sb, linhas, gravados);
    }

    const municipio = vazio();
    if (!interrompido && escopo !== 'uf') {
      const municipios = await listarMunicipios(sb);
      // Municipio que ja esta no catalogo mas saiu da lista de ISS continua sendo
      // atualizado: a aliquota de referencia nao depende de o sistema usa-lo hoje.
      for (const [chave, registro] of gravados) {
        if (!chave.startsWith('ibs_mun|')) continue;
        const codigo = chave.split('|')[2] ?? '';
        if (/^\d{7}$/.test(codigo) && !municipios.has(codigo)) municipios.set(codigo, registro.uf);
      }
      const gravadosMun = new Set<string>();
      for (const chave of gravados.keys()) {
        if (chave.startsWith('ibs_mun|')) gravadosMun.add((chave.split('|')[2] ?? '').trim());
      }
      const selecao = ordenarPorPendencia([...municipios.keys()], gravadosMun, tetoMunicipio);
      municipio.pendentes = selecao.pendentes;
      const linhas: LinhaAliquota[] = [];
      try {
        for (const codigo of selecao.alvos) {
          if (requisicoes >= MAX_REQUISICOES) {
            truncada = true;
            break;
          }
          if (municipio.consultados > 0) await espera(PAUSA_MS);
          requisicoes += 1;
          const resposta = await consultar(
            `aliquota-municipio?data=${encodeURIComponent(data)}&codigoMunicipio=${codigo}`
          );
          municipio.consultados += 1;
          const linha = montarMunicipio(codigo, municipios.get(codigo), resposta, ano);
          if (linha) linhas.push(linha);
          else municipio.nao_publicadas += 1;
        }
      } catch (e) {
        if (!(e instanceof InterrupcaoWaf)) throw e;
        interrompido = true;
        municipio.interrompido = true;
      }
      if (linhas.length > 0) municipio.gravados = await gravar(sb, linhas, gravados);
    }

    const resumo = {
      ok: !interrompido,
      data,
      ano,
      escopo,
      versao_oficial: versaoDb,
      ambiente: versao.ambiente ?? null,
      ufs_oficiais: ufs.size,
      interrompido_por_bloqueio: interrompido,
      requisicoes,
      cbs: { gravado: cbs.gravados, nao_publicada: cbs.nao_publicadas },
      uf,
      municipio,
    };
    log.info('sync concluido', {
      context: {
        // O painel de saude (etapa 83) casa esta linha com o `request_end` pelo
        // `request_id`: sem o id aqui o run bem sucedido nao prova o escopo.
        request_id: req.headers.get('x-request-id') ?? null,
        data,
        ano,
        escopo,
        versao_oficial: versaoDb,
        interrompido,
        truncada,
        requisicoes,
        cbs_gravado: cbs.gravados,
        uf_gravados: uf.gravados,
        uf_consultados: uf.consultados,
        uf_nao_publicadas: uf.nao_publicadas,
        uf_pendentes: uf.pendentes,
        municipio_gravados: municipio.gravados,
        municipio_consultados: municipio.consultados,
        municipio_nao_publicadas: municipio.nao_publicadas,
        municipio_pendentes: municipio.pendentes,
      },
    });
    return json(resumo, 200);
  } catch (e) {
    log.error('sync-aliquota-referencia:', {
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
    withEdgeObservability('sync-aliquota-referencia', async (req) => {
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
