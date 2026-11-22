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
import { NFE_XML_BUCKET } from '../_shared/nfe/xml-storage.ts';

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
  status: 'regravado' | 'sem_grupo' | 'sem_xml' | 'xml_invalido' | 'erro';
  creditos?: CreditoReprocessado[];
  motivo?: string;
}

function anoDe(dataEmissao: string | null): number {
  if (!dataEmissao) return new Date().getFullYear();
  const ano = Number(dataEmissao.slice(0, 4));
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

  const anoFatoGerador = anoDe(nota.data_emissao);
  const efeitoTributario = anoFatoGerador >= ANO_INICIO_APROPRIACAO;
  const mes = nota.data_emissao?.slice(5, 7) ?? String(new Date().getMonth() + 1).padStart(2, '0');
  const base = {
    data_origem: nota.data_emissao?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
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

export const handler = async (req: Request) => {
  const corsHeaders = corsHeadersComSegredoPara(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const guard = await exigirChamadaInterna(req);
  if (!guard.ok) return guard.resposta;

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const url = new URL(req.url);
    const limite = Math.min(Number(url.searchParams.get('limite')) || LOTE_PADRAO, 1000);
    const empresaId = url.searchParams.get('empresa_id');

    // Só notas com XML completo e ainda sem grupo: as que a etapa 49 já
    // preencheu não precisam de releitura (idempotência barata, sem I/O).
    let q = (sb as any)
      .from('nfe_recebidas')
      .select('id, empresa_id, chave_acesso, xml_path, data_emissao, valor_total, raw_metadata')
      .eq('xml_completo', true)
      .not('xml_path', 'is', null)
      .is('raw_metadata->ibscbs', null)
      .limit(limite);
    if (empresaId) q = q.eq('empresa_id', empresaId);

    const { data: notas, error: erroBusca } = await q;
    if (erroBusca) throw erroBusca;

    const resultados: ResultadoNota[] = [];
    let notasComCredito = 0;
    let creditosRegravados = 0;

    for (const nota of (notas ?? []) as any[]) {
      const { grupo, status, motivo } = await extrairDoStorage(sb, nota.xml_path);
      if (status !== 'regravado' || !grupo) {
        resultados.push({ chave_acesso: nota.chave_acesso, status, motivo });
        continue;
      }

      const creditos = montarCreditos(grupo, { data_emissao: nota.data_emissao });
      if (creditos.length === 0) {
        resultados.push({
          chave_acesso: nota.chave_acesso,
          status: 'sem_grupo',
          motivo: 'XML sem valor regular destacado',
        });
        continue;
      }

      // 1) marca o grupo na nota — o mesmo campo que a etapa 49 escreve
      const { error: erroPatch } = await (sb as any)
        .from('nfe_recebidas')
        .update({ raw_metadata: { ...(nota.raw_metadata ?? {}), ibscbs: grupo } })
        .eq('id', nota.id);
      if (erroPatch) {
        resultados.push({
          chave_acesso: nota.chave_acesso,
          status: 'erro',
          motivo: erroPatch.message,
        });
        continue;
      }

      // 2) troca os créditos estimados pelos destacados da própria nota.
      //    DELETE + INSERT dentro de um único RPC garante que uma falha no
      //    meio não deixa a nota sem crédito: ou troca tudo, ou nada.
      const { error: erroRpc } = await (sb as any).rpc('reprocessar_creditos_nfe', {
        p_chave_acesso: nota.chave_acesso,
        p_creditos: creditos,
      });
      if (erroRpc) {
        resultados.push({
          chave_acesso: nota.chave_acesso,
          status: 'erro',
          motivo: erroRpc.message,
        });
        continue;
      }

      notasComCredito++;
      creditosRegravados += creditos.length;
      resultados.push({ chave_acesso: nota.chave_acesso, status: 'regravado', creditos });
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
    return new Response(JSON.stringify({ ok: false, error: mensagemErro(e) }), {
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
