import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentEmpresaId } from '@/hooks/useUserEmpresas';
import { CHAVE_QUERY_NOTAS } from '@/hooks/useNotasFiscaisLocais';
import { queryClient } from '@/lib/queryClient';
import { toast } from 'sonner';

export interface BlingNFe {
  id: number;
  numero: string;
  serie: string;
  situacao: number;
  situacaoDescricao: string;
  dataEmissao: string;
  valorTotal: number;
  chaveAcesso?: string;
  contato?: {
    id: number;
    nome: string;
    cnpj?: string;
  };
  naturezaOperacao?: string;
  xml?: string;
  linkDanfe?: string;
  linkPDF?: string;
  tipo?: number; // 0=entrada, 1=saída
}

/** Bling API v3 real situation codes */
const SITUACAO_MAP: Record<number, string> = {
  1: 'Em Digitação',
  2: 'Validando',
  3: 'Aguardando Retorno',
  4: 'Validada',
  5: 'Processando',
  6: 'Autorizada',
  7: 'Cancelada',
  8: 'Rejeitada',
  9: 'Denegada',
  10: 'Inutilizada',
};

export interface BlingNFeFilters {
  dataEmissaoInicial?: string;
  dataEmissaoFinal?: string;
  situacao?: number;
  tipo?: number;
  numero?: string;
  pagina?: number;
  limite?: number;
}

/** Typed payload for creating NF-e via Bling API v3 */
export interface BlingNFeCreatePayload {
  tipo: number; // 0=entrada, 1=saída
  naturezaOperacao: { id: number };
  contato: { id: number };
  loja?: { id: number };
  itens: Array<{
    produto: { id: number };
    quantidade: number;
    valor: number;
    codigo?: string;
    descricao?: string;
    unidade?: string;
    tipo?: string;
    origem?: number;
    informacoesAdicionais?: string;
  }>;
  parcelas?: Array<{
    formaPagamento: { id: number };
    conta?: { id: number };
    dataVencimento: string;
    valor: number;
    observacoes?: string;
  }>;
  transporte?: {
    frete?: number; // 0=emitente, 1=destinatário, 2=terceiros, 9=sem frete
    transportador?: { id?: number };
    volumes?: Array<{
      quantidade?: number;
      especie?: string;
      pesoBruto?: number;
      pesoLiquido?: number;
    }>;
  };
  informacoesComplementares?: string;
  observacoesInternas?: string;
  dataOperacao?: string;
  numeroDocumento?: string;
}

async function callBlingProxy(action: string, params: Record<string, unknown> = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) {
    const msg = error.message || 'Erro ao comunicar com Bling';
    // Gap #13: friendly 403 scope error
    if (msg.includes('403') || msg.includes('Forbidden')) {
      throw new Error(
        'Sem permissão para esta ação no Bling. Verifique se o app OAuth possui o escopo necessário (ex: "98048 - Notas Fiscais").'
      );
    }
    throw new Error(msg);
  }
  if (data?.error) {
    if (data.status === 403) {
      throw new Error(
        'Escopo OAuth insuficiente. Reconecte o Bling com as permissões de NF-e habilitadas.'
      );
    }
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  }
  return data;
}

interface BlingNFeRawItem {
  id: number;
  numero?: string | number;
  serie?: string | number;
  situacao?: { id?: number } | number;
  dataEmissao: string;
  data?: string;
  valorNota?: number;
  totalNota?: number;
  chaveAcesso?: string;
  contato?: { id: number; nome: string; numeroDocumento?: string };
  naturezaOperacao?: { descricao?: string } | string;
  xml?: string;
  linkDanfe?: string;
  link_danfe?: string;
  linkPDF?: string;
  link_pdf?: string;
  linkPdf?: string;
  tipo?: number;
}

function mapNFeItem(item: BlingNFeRawItem): BlingNFe {
  const situacaoId =
    typeof item.situacao === 'object' && item.situacao !== null ? item.situacao.id : undefined;
  const situacao = situacaoId ?? (typeof item.situacao === 'number' ? item.situacao : 0);
  return {
    id: item.id,
    numero: String(item.numero || '').padStart(9, '0'),
    serie: String(item.serie || '1'),
    situacao,
    situacaoDescricao: SITUACAO_MAP[situacao] || 'Desconhecida',
    dataEmissao: item.dataEmissao || item.data || '',
    valorTotal: item.valorNota ?? item.totalNota ?? 0,
    chaveAcesso: item.chaveAcesso,
    contato: item.contato
      ? {
          id: item.contato.id,
          nome: item.contato.nome,
          cnpj: item.contato.numeroDocumento,
        }
      : undefined,
    naturezaOperacao:
      typeof item.naturezaOperacao === 'object' && item.naturezaOperacao
        ? item.naturezaOperacao.descricao
        : typeof item.naturezaOperacao === 'string'
          ? item.naturezaOperacao
          : undefined,
    xml: item.xml,
    linkDanfe: item.linkDanfe || item.link_danfe,
    linkPDF: item.linkPDF || item.link_pdf || item.linkPdf,
    tipo: item.tipo,
  };
}

/**
 * Etapa 58: após cancelar no Bling, invalida o crédito IBS/CBS destacado da nota.
 *
 * O protocolo de cancelamento vem do próprio Bling (`buscar_nfe`); quando a
 * resposta não traz protocolo nem chave, a nota local não existe, ou a RPC
 * falha, a pendência é anunciada em vez de silenciosamente zerar ou manter
 * crédito indevido.
 */
export async function estornarCreditosCancelados(ids: number[]) {
  const pendentes: string[] = [];
  for (const id of ids) {
    try {
      const resposta = await callBlingProxy('buscar_nfe', { id });
      const nfe = (resposta?.data ?? {}) as Record<string, unknown>;
      const chave = typeof nfe.chaveAcesso === 'string' ? nfe.chaveAcesso : null;
      const cancelamento = (nfe.cancelamento ?? {}) as Record<string, unknown>;
      const protocoloBruto =
        cancelamento.protocolo ?? nfe.protocoloCancelamento ?? nfe.protocolo ?? null;
      const protocolo =
        typeof protocoloBruto === 'string' && protocoloBruto.trim() ? protocoloBruto.trim() : null;

      if (!chave || !protocolo) {
        pendentes.push(String(id));
        continue;
      }

      const { data: nota } = await supabase
        .from('notas_fiscais')
        .select('id')
        .eq('chave_acesso', chave)
        .maybeSingle();

      if (!nota?.id) {
        pendentes.push(String(id));
        continue;
      }

      const { error } = await supabase.rpc('cancelar_nfe_estornar_xml_destacado', {
        p_nota_id: nota.id,
        p_protocolo: protocolo,
        p_chave_acesso: chave,
        p_sefaz_confirmado: true,
      });
      if (error) pendentes.push(String(id));
    } catch {
      pendentes.push(String(id));
    }
  }

  if (pendentes.length > 0) {
    toast.warning('Cancelamento no Bling sem estorno de crédito', {
      description: `NF-e(s) ${pendentes.join(', ')}: sem chave/protocolo local. Reprocessar na conferência fiscal.`,
    });
  }
}

/**
 * Etapa 55: guarda o XML autorizado e materializa os itens da nota.
 *
 * Precisa do `empresa_id` porque a edge valida o vínculo do usuário com a
 * empresa antes de gravar; sem ele, usuário multi-empresa cai em
 * `empresa_obrigatoria`. Falha aqui é silenciosa de propósito: o envio para
 * a SEFAZ já aconteceu e o XML pode ser recuperado depois.
 */
export async function guardarXmlAutorizado(blingNfeId: number) {
  const empresaId = getCurrentEmpresaId();
  const { data, error } = await supabase.functions.invoke('guardar-xml-nfe-autorizada', {
    body: { bling_nfe_id: blingNfeId, empresa_id: empresaId },
  });
  if (error || data?.error) return null;
  // `refetchType: 'all'` porque o envio sai da aba do Bling e a lista de notas
  // pode estar desmontada; a chave é escopada por empresa para não recarregar
  // o cache de empresas que o usuário abriu antes.
  await queryClient.invalidateQueries({
    queryKey: [...CHAVE_QUERY_NOTAS, empresaId],
    refetchType: 'all',
  });
  return data;
}

export function useBlingNFe() {
  const [notas, setNotas] = useState<BlingNFe[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  /** Gap #4: Automatic pagination — fetches ALL pages */
  const listarNFe = useCallback(async (filtros?: BlingNFeFilters, fetchAllPages = true) => {
    setLoading(true);
    try {
      const allItems: BlingNFe[] = [];
      let pagina = filtros?.pagina || 1;
      const limite = filtros?.limite || 100;

      // Gap #16: protect against date range > 366 days
      if (filtros?.dataEmissaoInicial && filtros?.dataEmissaoFinal) {
        const start = new Date(filtros.dataEmissaoInicial);
        const end = new Date(filtros.dataEmissaoFinal);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 366) {
          toast.error('O intervalo de datas não pode exceder 366 dias.');
          setLoading(false);
          return [];
        }
      }

      while (true) {
        const apiFilters = { ...filtros, pagina, limite };
        const data = await callBlingProxy('listar_nfe', { filtros: apiFilters });
        const items = data?.data || [];
        const mapped = items.map(mapNFeItem);
        allItems.push(...mapped);

        // If less than limit returned, we've reached the last page
        if (!fetchAllPages || items.length < limite) break;
        pagina++;

        // Safety: max 50 pages (5000 items)
        if (pagina > 50) break;
      }

      setNotas(allItems);
      setTotalItems(allItems.length);
      return allItems;
    } catch (err: unknown) {
      toast.error(`Erro ao listar NF-e: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /** Gap #2: Typed NF-e creation with proper Bling v3 payload */
  const criarNFe = useCallback(async (nfeData: BlingNFeCreatePayload) => {
    setSyncing(true);
    try {
      const data = await callBlingProxy('criar_nfe', { data: nfeData });
      toast.success('NF-e criada no Bling com sucesso!');
      return data;
    } catch (err: unknown) {
      toast.error(`Erro ao criar NF-e: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  /** Gap #10: enviarEmail toggle exposed */
  const enviarSefaz = useCallback(async (nfeId: number, enviarEmail = false) => {
    setSyncing(true);
    try {
      const data = await callBlingProxy('enviar_nfe_sefaz', { id: nfeId, enviarEmail });
      toast.success('NF-e enviada para SEFAZ via Bling!');
      // Etapa 55: o XML autorizado só existe depois do retorno da SEFAZ. A
      // gravação roda em segundo plano e falhar aqui não pode desfazer o
      // envio — o usuário já recebeu autorização; a nota fica sem XML e
      // aparece na conferência fiscal até ser reprocessada.
      void guardarXmlAutorizado(nfeId).catch(() => undefined);
      return data;
    } catch (err: unknown) {
      toast.error(
        `Erro ao enviar NF-e para SEFAZ: ${err instanceof Error ? err.message : String(err)}`
      );
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const buscarNFe = useCallback(async (nfeId: number) => {
    try {
      const data = await callBlingProxy('buscar_nfe', { id: nfeId });
      return data?.data ? mapNFeItem(data.data) : null;
    } catch (err: unknown) {
      toast.error(`Erro ao buscar NF-e: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }, []);

  const cancelarNFe = useCallback(async (ids: number[]) => {
    setSyncing(true);
    try {
      await callBlingProxy('cancelar_nfe', { ids });
      toast.success('NF-e cancelada no Bling!');
      // Etapa 58: cancelar no Bling precisa invalidar o crédito IBS/CBS
      // destacado. Sem isso a nota cancelada continuava gerando crédito
      // utilizável (o XML e o crédito ficavam intactos no banco local).
      await estornarCreditosCancelados(ids);
    } catch (err: unknown) {
      toast.error(`Erro ao cancelar NF-e: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const lancarEstoque = useCallback(async (nfeId: number) => {
    try {
      await callBlingProxy('lancar_estoque_nfe', { id: nfeId });
      toast.success('Estoque lançado!');
    } catch (err: unknown) {
      toast.error(`Erro ao lançar estoque: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const lancarContas = useCallback(async (nfeId: number) => {
    try {
      await callBlingProxy('lancar_contas_nfe', { id: nfeId });
      toast.success('Contas lançadas!');
    } catch (err: unknown) {
      toast.error(`Erro ao lançar contas: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  /** Gap #3: Token revocation */
  const revogarToken = useCallback(async () => {
    try {
      await callBlingProxy('revogar_token');
      toast.success('Token Bling revogado com sucesso.');
    } catch (err: unknown) {
      toast.error(`Erro ao revogar token: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  /** Gap #12: Health check */
  const healthCheck = useCallback(async () => {
    try {
      const data = await callBlingProxy('dados_empresa');
      return { ok: true, empresa: data?.data };
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }, []);

  return {
    notas,
    loading,
    syncing,
    totalItems,
    listarNFe,
    criarNFe,
    enviarSefaz,
    buscarNFe,
    cancelarNFe,
    lancarEstoque,
    lancarContas,
    revogarToken,
    healthCheck,
  };
}
