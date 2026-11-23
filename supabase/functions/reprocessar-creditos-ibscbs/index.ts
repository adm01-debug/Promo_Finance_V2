// Edge: reprocessar-creditos-ibscbs (etapa 50 do plano RT/RFB)
//
// As NF-e já ingeridas antes da etapa 49 têm o XML no storage mas nenhum grupo
// IBS/CBS em `nfe_recebidas.raw_metadata`. Sem isso o crédito delas fica
// "estimado" para sempre, mesmo com valor destacado no documento.
//
// Este job lê o XML de novo, extrai o grupo e REGRAVA o crédito com
// `origem='xml_destacado'`. Idempotente por `chave_acesso`: rodar duas vezes
// não duplica crédito nem nota.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersComSegredoPara, exigirChamadaInterna } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { extrairIbscbs, type IbscbsNota } from '../_shared/nfe/ibscbs.ts';
import { NFE_XML_BUCKET, buildXmlPath } from '../_shared/nfe/xml-storage.ts';
import { z } from '../_shared/zod.ts';

const log = createLogger('reprocessar-creditos-ibscbs');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** 2026 é ano de teste: o valor é destacado, mas o crédito é informativo. */
export const ANO_INICIO_APROPRIACAO = 2027;

/** Quantas notas processar por invocação — o cron roda várias vezes até drenar. */
const LOTE_PADRAO = 200;

export interface CreditoReprocessado {
  tipo_tributo: 'CBS' | 'IBS';
  valor_credito: number;
  saldo_disponivel: number;
  data_origem: string;
  competencia_origem: string;
  status: string;
  origem: 'xml_destacado' | 'estimado';
  efeito_tributario: boolean;
  ano_fato_gerador: number;
}

export interface ResultadoNota {
  chave_acesso: string;
  status: 'regravado' | 'sem_grupo' | 'sem_xml' | 'xml_invalido' | 'credito_utilizado' | 'erro';
  creditos?: CreditoReprocessado[];
  motivo?: string;
}

/**
 * Data civil da emissão no fuso de Brasília.
 *
 * `data_emissao` é `timestamptz`: o recorte em UTC joga uma nota emitida às 22h
 * de 31/12 em Brasília para 01/01 do ano seguinte, o que a faria nascer com
 * efeito tributário um ano antes da hora. `en-CA` devolve `YYYY-MM-DD`.
 */
export function dataCivilBrasilia(dataEmissao: string | null): string | null {
  if (!dataEmissao) return null;
  const d = new Date(dataEmissao);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function anoDe(dataCivil: string | null): number {
  const ano = Number(dataCivil?.slice(0, 4));
  return Number.isFinite(ano) && ano > 2000 ? ano : new Date().getFullYear();
}

/**
 * Converte o grupo IBS/CBS extraído em linhas de `creditos_tributarios`.
 *
 * Espelha exatamente o cálculo de `src/hooks/useImportacaoXMLNFe.ts` (etapa
 * 43/44), porque o crédito de uma nota não pode depender de quem o importou:
 * se o backfill calculasse diferente do front, a mesma NF-e teria dois valores
 * conforme a data de importação.
 *
 * Devolve `[]` quando a nota não tem valor destacado — nota monofásica
 * (`gMono`) destacada em grupo próprio não gera crédito no regime regular.
 */
export function montarCreditos(
  grupo: IbscbsNota | null,
  nota: { data_emissao: string | null }
): CreditoReprocessado[] {
  const vCBS = grupo?.totais?.vCBS;
  const vIBS = grupo?.totais?.vIBS;
  const temGrupo = vCBS !== undefined || vIBS !== undefined;
  if (!temGrupo) return [];

  // Nota monofásica destaca em `gMono`, não em `gIBS`/`gCBS`: o valor existe
  // mas está fora do regime regular, então não é crédito apropriável. Se o
  // grupo regular veio ausente/zerado, não há o que regravar.
  const cbs = vCBS ?? 0;
  const ibs = vIBS ?? 0;
  if (cbs <= 0 && ibs <= 0) return [];

  const dataCivil = dataCivilBrasilia(nota.data_emissao);
  const anoFatoGerador = anoDe(dataCivil);
  // Sem data de emissão não há como provar o ano do fato gerador: mantém o
  // crédito como informativo em vez de apropriá-lo por presunção.
  const efeitoTributario = dataCivil !== null && anoFatoGerador >= ANO_INICIO_APROPRIACAO;
  const mes = dataCivil?.slice(5, 7) ?? String(new Date().getMonth() + 1).padStart(2, '0');
  const base = {
    data_origem: dataCivil ?? new Date().toISOString().slice(0, 10),
    competencia_origem: `${anoFatoGerador}-${mes}`,
    status: 'disponivel',
    origem: 'xml_destacado' as const,
    efeito_tributario: efeitoTributario,
    ano_fato_gerador: anoFatoGerador,
  };

  const creditos: CreditoReprocessado[] = [];
  if (cbs > 0) {
    creditos.push({
      ...base,
      tipo_tributo: 'CBS',
      valor_credito: cbs,
      saldo_disponivel: efeitoTributario ? cbs : 0,
    });
  }
  if (ibs > 0) {
    creditos.push({
      ...base,
      tipo_tributo: 'IBS',
      valor_credito: ibs,
      saldo_disponivel: efeitoTributario ? ibs : 0,
    });
  }
  return creditos;
}

/** Lê o XML do storage e devolve o grupo, sem tocar no banco. */
async function extrairDoStorage(
  sb: any,
  xmlPath: string
): Promise<{ grupo: IbscbsNota | null; status: ResultadoNota['status']; motivo?: string }> {
  const { data: blob, error } = await sb.storage.from(NFE_XML_BUCKET).download(xmlPath);
  if (error || !blob) {
    return { grupo: null, status: 'sem_xml', motivo: error?.message ?? 'objeto ausente' };
  }
  const xml = await blob.text();
  const grupo = extrairIbscbs(xml);
  if (!grupo) {
    return { grupo: null, status: 'xml_invalido', motivo: 'sem infNFe no XML' };
  }
  return { grupo, status: 'regravado' };
}

/**
 * Registra que o XML desta nota já foi examinado e não rende crédito regular.
 *
 * Sem isso a nota volta em todo lote (o cursor é `raw_metadata->ibscbs IS
 * NULL`) e o lote de 200 nunca drena: as mesmas notas sem destaque ocupam as
 * vagas e as demais ficam permanentemente sem correção.
 */
async function marcarRevisada(sb: any, nota: any, status: string, motivo: string) {
  return await (sb as any)
    .from('nfe_recebidas')
    .update({
      raw_metadata: {
        ...(nota.raw_metadata ?? {}),
        ibscbs: { revisado: true, status, motivo, em: new Date().toISOString() },
      },
    })
    .eq('id', nota.id);
}

export const handler = async (req: Request) => {
  const corsHeaders = corsHeadersComSegredoPara(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const params = z
      .object({
        limite: z.coerce.number().int().positive().catch(LOTE_PADRAO),
        empresa_id: z.string().uuid().optional(),
      })
      .safeParse({
        limite: url.searchParams.get('limite') ?? undefined,
        empresa_id: url.searchParams.get('empresa_id') ?? undefined,
      });
    if (!params.success) {
      return new Response(
        JSON.stringify({ ok: false, error: 'parâmetros inválidos', detalhes: params.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const limite = Math.min(params.data.limite, 1000);
    const empresaId = params.data.empresa_id;

    // Só notas com XML completo e ainda sem grupo: as que a etapa 49 já
    // preencheu não precisam de releitura (idempotência barata, sem I/O).
    // `ambiente = producao` mantém destaque de homologação fora do crédito
    // apropriável — o teste de homologação não é movimentação real.
    let q = (sb as any)
      .from('nfe_recebidas')
      .select('id, empresa_id, chave_acesso, xml_path, data_emissao, valor_total, raw_metadata')
      .eq('xml_completo', true)
      .eq('ambiente', 'producao')
      .not('xml_path', 'is', null)
      .is('raw_metadata->ibscbs', null)
      .order('id', { ascending: true })
      .limit(limite);
    if (empresaId) q = q.eq('empresa_id', empresaId);

    const { data: notas, error: erroBusca } = await q;
    if (erroBusca) throw erroBusca;

    const resultados: ResultadoNota[] = [];
    let notasComCredito = 0;
    let creditosRegravados = 0;

    for (const nota of (notas ?? []) as any[]) {
      // Path canônico derivado da nota: `xml_path` é dado de entrada e apontar
      // para o objeto de outra empresa entregaria XML de terceiro a este job.
      const xmlPath = buildXmlPath(nota.empresa_id, nota.chave_acesso);
      const { grupo, status, motivo } = await extrairDoStorage(sb, xmlPath);
      if (status !== 'regravado' || !grupo) {
        // Conteúdo é definitivo: marcar evita reprocessar para sempre.
        await marcarRevisada(sb, nota, status, motivo ?? 'sem grupo regular');
        resultados.push({ chave_acesso: nota.chave_acesso, status, motivo });
        continue;
      }

      const creditos = montarCreditos(grupo, { data_emissao: nota.data_emissao });
      if (creditos.length === 0) {
        await marcarRevisada(sb, nota, 'sem_grupo', 'XML sem valor regular destacado');
        resultados.push({
          chave_acesso: nota.chave_acesso,
          status: 'sem_grupo',
          motivo: 'XML sem valor regular destacado',
        });
        continue;
      }

      // 1) troca os créditos estimados pelos destacados da própria nota.
      //    O RPC é DELETE + INSERT na mesma transação: ou troca tudo, ou nada.
      //    Ele vem ANTES do marcador: se falhar, a nota continua fora de
      //    `raw_metadata->ibscbs` e volta no próximo lote para ser corrigida.
      const { error: erroRpc } = await (sb as any).rpc('reprocessar_creditos_nfe', {
        p_chave_acesso: nota.chave_acesso,
        p_creditos: creditos,
      });
      if (erroRpc) {
        // Crédito já usado não se corrige por reescrita: marca a nota como
        // revisada para não gastar lote a cada hora com o mesmo documento.
        if (String(erroRpc.message ?? '').includes('credito_ja_utilizado')) {
          await marcarRevisada(sb, nota, 'credito_utilizado', 'Crédito já utilizado/compensado');
          resultados.push({
            chave_acesso: nota.chave_acesso,
            status: 'credito_utilizado',
            motivo: 'Crédito já utilizado/compensado',
          });
          continue;
        }
        resultados.push({
          chave_acesso: nota.chave_acesso,
          status: 'erro',
          motivo: erroRpc.message,
        });
        continue;
      }

      notasComCredito++;
      creditosRegravados += creditos.length;

      // 2) marca o grupo na nota — o mesmo campo que a etapa 49 escreve.
      const { error: erroPatch } = await (sb as any)
        .from('nfe_recebidas')
        .update({ raw_metadata: { ...(nota.raw_metadata ?? {}), ibscbs: grupo } })
        .eq('id', nota.id);
      resultados.push({
        chave_acesso: nota.chave_acesso,
        status: 'regravado',
        creditos,
        ...(erroPatch ? { motivo: `crédito regravado; metadata não: ${erroPatch.message}` } : {}),
      });
    }

    const resumo = {
      ok: true,
      candidatas: (notas ?? []).length,
      notas_com_credito: notasComCredito,
      creditos_regravados: creditosRegravados,
      falhas: resultados.filter((r) => r.status === 'erro').length,
      restantes: (notas ?? []).length === limite,
      resultados,
    };
    log.info('reprocessamento concluido', {
      context: {
        candidatas: resumo.candidatas,
        notas_com_credito: resumo.notas_com_credito,
        creditos_regravados: resumo.creditos_regravados,
        falhas: resumo.falhas,
      },
    });

    return new Response(JSON.stringify(resumo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    log.error('reprocessar-creditos-ibscbs:', {
      error_message: mensagemErro(e),
      context: contextoErro(e),
    });
    // Sem o texto do erro no corpo: detalhe fica no log (CodeQL
    // js/stack-trace-exposure).
    return new Response(JSON.stringify({ ok: false, error: 'falha_reprocessamento' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

if (import.meta.main) {
  Deno.serve(
    withEdgeObservability('reprocessar-creditos-ibscbs', async (req) => {
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
