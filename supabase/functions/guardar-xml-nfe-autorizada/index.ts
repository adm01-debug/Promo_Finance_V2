// Edge: guardar-xml-nfe-autorizada (etapa 55 do plano RT/RFB)
//
// Fecha o ciclo da NF-e de saida emitida pelo Bling: depois que a SEFAZ
// autoriza, o XML autorizado e a unica fonte confiavel do grupo IBS/CBS/IS.
// Sem guardar esse XML, o credito da nota fica "estimado" para sempre e os
// itens da nota (base da apuracao por item) nunca existem.
//
// Responsabilidades, nesta ordem:
//   1. buscar a NF-e no Bling (o proxy ja cuida de refresh do OAuth)
//   2. subir o XML no bucket privado `nfe-xml` (layout por empresa/chave)
//   3. extrair itens + grupo tributario
//   4. gravar nota + itens pela RPC `salvar_nfe_autorizada`
//
// A gravacao usa o client do USUARIO, nao o service_role: a RPC valida
// `auth.uid()` e `empresa_acessivel`, e chamar com service_role cairia em
// `not_authenticated`. O storage usa service_role porque o bucket nao tem
// policy de escrita para `authenticated`.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';
import { corsHeadersComSegredoPara, exigirUsuarioComEmpresa } from '../_shared/auth-guard.ts';
import { createLogger } from '../_shared/observability.ts';
import { mensagemErro, contextoErro } from '../_shared/erros.ts';
import { withEdgeObservability } from '../_shared/edge-observability.ts';
import { parseDoc } from '../_shared/sefaz/parser.ts';
import { extrairIbscbs } from '../_shared/nfe/ibscbs.ts';
import { extrairItens } from '../_shared/nfe/itens.ts';
import { uploadNfeXml } from '../_shared/nfe/xml-storage.ts';

const log = createLogger('guardar-xml-nfe-autorizada');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

export interface CorpoRequisicao {
  bling_nfe_id: number;
  empresa_id?: string | null;
}

export interface Dependencias {
  /** Chama o bling-proxy com o token do usuario (`action: buscar_nfe`). */
  buscarNfeBling: (blingNfeId: number) => Promise<Record<string, unknown> | null>;
}

/** `cStat` 100 = autorizada; 101 = cancelada; 110 = denegada. */
export function statusDoProc(xml: string): 'autorizada' | 'cancelada' | 'denegada' | 'pendente' {
  const cStat = xml.match(/<cStat>(\d{3})<\/cStat>/)?.[1];
  if (cStat === '100') return 'autorizada';
  if (cStat === '101') return 'cancelada';
  if (cStat === '110') return 'denegada';
  return 'pendente';
}

function numeroOuNulo(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Nome do destinatario — para NF-e de saida e ele o cliente da nota. */
function destinatarioDoXml(xml: string): string | null {
  const m = xml.match(/<dest[\s\S]*?<xNome>([^<]+)<\/xNome>/);
  return m?.[1]?.trim() || null;
}

function texto(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() ? v.trim() : null;
  // O Bling devolve `numero`/`serie` como number em algumas rotas.
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return null;
}

/**
 * Monta o `p_nota` da RPC a partir do XML autorizado e do objeto do Bling.
 *
 * Os campos NOT NULL de `notas_fiscais` (`numero`, `serie`, `cliente_nome`,
 * `natureza_operacao`, `valor_produtos`, `valor_total`, `created_by`) sao
 * preenchidos com o que o XML garante; o que so existe no Bling entra como
 * fallback. `created_by` e preenchido aqui porque a RPC nao tem como inferir
 * o dono da nota quando a linha e criada.
 */
export function montarNota(args: {
  xml: string;
  bling: Record<string, unknown>;
  userId: string;
}): Record<string, unknown> {
  const doc = parseDoc(args.xml);
  const chave = doc && doc.kind === 'nfe' ? doc.chaveAcesso : null;
  const nfe = doc && doc.kind === 'nfe' ? doc : null;

  const contato = args.bling.contato as { nome?: string; numeroDocumento?: string } | undefined;
  const natureza = args.bling.naturezaOperacao as { descricao?: string } | string | undefined;

  const valorTotal =
    nfe?.valorTotal ??
    numeroOuNulo(args.bling.valorNota) ??
    numeroOuNulo(args.bling.totalNota) ??
    0;

  return {
    numero: nfe?.numero ?? texto(args.bling.numero) ?? '',
    serie: nfe?.serie ?? texto(args.bling.serie) ?? '1',
    chave_acesso: chave,
    cliente_nome: destinatarioDoXml(args.xml) ?? contato?.nome ?? 'Consumidor final',
    cliente_cnpj: nfe?.cnpjDestinatario ?? contato?.numeroDocumento ?? null,
    data_emissao: nfe?.dataEmissao ?? texto(args.bling.dataEmissao) ?? new Date().toISOString(),
    valor_produtos: valorTotal,
    valor_total: valorTotal,
    natureza_operacao:
      (typeof natureza === 'object' && natureza ? natureza.descricao : natureza) ??
      'Venda de mercadoria',
    status: statusDoProc(args.xml),
    xml_nfe: args.xml,
    created_by: args.userId,
  };
}

async function chamarBlingProxy(
  token: string,
  blingNfeId: number
): Promise<Record<string, unknown> | null> {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/bling-proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'buscar_nfe', id: blingNfeId }),
  });

  const corpo = (await resp.json().catch(() => null)) as Record<string, unknown> | null;
  if (!resp.ok || !corpo || corpo.error) {
    const detalhe = corpo?.error ?? `HTTP ${resp.status}`;
    throw new Error(`buscar_nfe falhou: ${String(detalhe)}`);
  }
  // `blingFetch` embrulha o retorno em `{ data: {...} }` (formato Bling v3).
  const data = corpo.data ?? corpo;
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
}

export function createHandler(deps?: Partial<Dependencias>) {
  return async (req: Request): Promise<Response> => {
    const cors = corsHeadersComSegredoPara(req);

    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });

    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    let corpo: CorpoRequisicao;
    try {
      corpo = (await req.json()) as CorpoRequisicao;
    } catch {
      return json(400, { error: 'json_invalido' });
    }

    const blingNfeId = numeroOuNulo(corpo?.bling_nfe_id);
    if (!blingNfeId || blingNfeId <= 0) {
      return json(400, { error: 'bling_nfe_id_obrigatorio' });
    }

    const guard = await exigirUsuarioComEmpresa(req, corpo?.empresa_id ?? null);
    if (!guard.ok) return guard.resposta;
    const { userId, token, clientDoUsuario, empresaId } = guard.dados;

    try {
      const buscar = deps?.buscarNfeBling ?? ((id: number) => chamarBlingProxy(token, id));
      const bling = await buscar(blingNfeId);
      if (!bling) return json(404, { error: 'nfe_nao_encontrada_no_bling' });

      const xml = texto(bling.xml);
      if (!xml) {
        // NF-e em digitacao ainda nao tem XML autorizado; nao e erro de codigo.
        return json(409, {
          error: 'xml_indisponivel',
          message: 'A NF-e ainda nao possui XML autorizado no Bling.',
        });
      }

      const doc = parseDoc(xml);
      if (!doc || doc.kind !== 'nfe') {
        return json(422, { error: 'xml_nao_e_nfe', message: 'O XML recebido nao e uma NF-e.' });
      }
      if (doc.schemaTipo !== 'procNFe') {
        return json(422, {
          error: 'xml_sem_itens',
          message: 'Resumo (resNFe) nao traz itens nem grupo IBS/CBS.',
        });
      }
      if (!/^\d{44}$/.test(doc.chaveAcesso)) {
        return json(422, { error: 'chave_acesso_invalida' });
      }

      const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const { path } = await uploadNfeXml(admin, {
        empresaId,
        chave: doc.chaveAcesso,
        xml,
      });

      const grupo = extrairIbscbs(xml);
      const itens = extrairItens(xml);

      const nota = montarNota({ xml, bling, userId });

      const { data, error } = await clientDoUsuario.rpc('salvar_nfe_autorizada', {
        p_empresa_id: empresaId,
        p_nota: nota,
        p_itens: itens ? itens.itens : [],
      });

      if (error) {
        log.error('salvar_nfe_autorizada falhou', {
          error_message: mensagemErro(error),
          context: { ...contextoErro(error), empresa_id: empresaId, chave: doc.chaveAcesso },
        });
        return json(500, { error: 'falha_ao_gravar_nota', message: mensagemErro(error) });
      }

      log.info('xml autorizado guardado', {
        context: {
          empresa_id: empresaId,
          chave_acesso: doc.chaveAcesso,
          itens: itens?.itens.length ?? 0,
          tem_grupo: Boolean(grupo),
        },
      });

      return json(200, {
        ok: true,
        xml_path: path,
        chave_acesso: doc.chaveAcesso,
        itens_extraidos: itens?.itens.length ?? 0,
        tem_grupo_ibscbs: Boolean(grupo),
        nota: data,
      });
    } catch (e) {
      log.error('guardar-xml-nfe-autorizada:', {
        error_message: mensagemErro(e),
        context: contextoErro(e),
      });
      return json(500, { error: 'falha_ao_guardar_xml', message: mensagemErro(e) });
    }
  };
}

const handler = createHandler();

if (import.meta.main) {
  Deno.serve(withEdgeObservability('guardar-xml-nfe-autorizada', handler));
}
