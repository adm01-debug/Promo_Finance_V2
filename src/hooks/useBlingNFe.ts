import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) {
    const msg = error.message || 'Erro ao comunicar com Bling';
    // Gap #13: friendly 403 scope error
    if (msg.includes('403') || msg.includes('Forbidden')) {
      throw new Error('Sem permissão para esta ação no Bling. Verifique se o app OAuth possui o escopo necessário (ex: "98048 - Notas Fiscais").');
    }
    throw new Error(msg);
  }
  if (data?.error) {
    if (data.status === 403) {
      throw new Error('Escopo OAuth insuficiente. Reconecte o Bling com as permissões de NF-e habilitadas.');
    }
    throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  }
  return data;
}

function mapNFeItem(item: any): BlingNFe {
  return {
    id: item.id,
    numero: String(item.numero || '').padStart(9, '0'),
    serie: String(item.serie || '1'),
    situacao: item.situacao?.id ?? item.situacao ?? 0,
    situacaoDescricao: SITUACAO_MAP[item.situacao?.id ?? item.situacao] || 'Desconhecida',
    dataEmissao: item.dataEmissao || item.data,
    valorTotal: item.valorNota ?? item.totalNota ?? 0,
    chaveAcesso: item.chaveAcesso,
    contato: item.contato ? {
      id: item.contato.id,
      nome: item.contato.nome,
      cnpj: item.contato.numeroDocumento,
    } : undefined,
    naturezaOperacao: item.naturezaOperacao?.descricao || item.naturezaOperacao,
    xml: item.xml,
    linkDanfe: item.linkDanfe || item.link_danfe,
    linkPDF: item.linkPDF || item.link_pdf || item.linkPdf,
    tipo: item.tipo,
  };
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
    } catch (err: any) {
      toast.error(`Erro ao listar NF-e: ${err.message}`);
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
    } catch (err: any) {
      toast.error(`Erro ao criar NF-e: ${err.message}`);
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
      return data;
    } catch (err: any) {
      toast.error(`Erro ao enviar NF-e para SEFAZ: ${err.message}`);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const buscarNFe = useCallback(async (nfeId: number) => {
    try {
      const data = await callBlingProxy('buscar_nfe', { id: nfeId });
      return data?.data ? mapNFeItem(data.data) : null;
    } catch (err: any) {
      toast.error(`Erro ao buscar NF-e: ${err.message}`);
      return null;
    }
  }, []);

  const cancelarNFe = useCallback(async (ids: number[]) => {
    setSyncing(true);
    try {
      await callBlingProxy('cancelar_nfe', { ids });
      toast.success('NF-e cancelada no Bling!');
    } catch (err: any) {
      toast.error(`Erro ao cancelar NF-e: ${err.message}`);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  const lancarEstoque = useCallback(async (nfeId: number) => {
    try {
      await callBlingProxy('lancar_estoque_nfe', { id: nfeId });
      toast.success('Estoque lançado!');
    } catch (err: any) {
      toast.error(`Erro ao lançar estoque: ${err.message}`);
    }
  }, []);

  const lancarContas = useCallback(async (nfeId: number) => {
    try {
      await callBlingProxy('lancar_contas_nfe', { id: nfeId });
      toast.success('Contas lançadas!');
    } catch (err: any) {
      toast.error(`Erro ao lançar contas: ${err.message}`);
    }
  }, []);

  /** Gap #3: Token revocation */
  const revogarToken = useCallback(async () => {
    try {
      await callBlingProxy('revogar_token');
      toast.success('Token Bling revogado com sucesso.');
    } catch (err: any) {
      toast.error(`Erro ao revogar token: ${err.message}`);
    }
  }, []);

  /** Gap #12: Health check */
  const healthCheck = useCallback(async () => {
    try {
      const data = await callBlingProxy('dados_empresa');
      return { ok: true, empresa: data?.data };
    } catch (err: any) {
      return { ok: false, error: err.message };
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
