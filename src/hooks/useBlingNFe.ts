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
}

interface BlingNFeFilters {
  dataEmissaoInicial?: string;
  dataEmissaoFinal?: string;
  situacao?: number;
  pagina?: number;
  limite?: number;
}

async function callBlingProxy(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message || 'Erro ao comunicar com Bling');
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useBlingNFe() {
  const [notas, setNotas] = useState<BlingNFe[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const listarNFe = useCallback(async (filtros?: BlingNFeFilters) => {
    setLoading(true);
    try {
      const data = await callBlingProxy('listar_nfe', { filtros });
      const items = data?.data || [];
      setNotas(items.map((item: any) => ({
        id: item.id,
        numero: String(item.numero || '').padStart(9, '0'),
        serie: String(item.serie || '1'),
        situacao: item.situacao?.id || item.situacao || 0,
        situacaoDescricao: parseSituacao(item.situacao?.id || item.situacao),
        dataEmissao: item.dataEmissao || item.data,
        valorTotal: item.valorNota || item.totalNota || 0,
        chaveAcesso: item.chaveAcesso,
        contato: item.contato ? {
          id: item.contato.id,
          nome: item.contato.nome,
          cnpj: item.contato.numeroDocumento,
        } : undefined,
        naturezaOperacao: item.naturezaOperacao?.descricao || item.naturezaOperacao,
        xml: item.xml,
      })));
      return items;
    } catch (err: any) {
      toast.error(`Erro ao listar NF-e do Bling: ${err.message}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const criarNFe = useCallback(async (nfeData: Record<string, unknown>) => {
    setSyncing(true);
    try {
      const data = await callBlingProxy('criar_nfe', { data: nfeData });
      toast.success('NF-e criada no Bling com sucesso!');
      return data;
    } catch (err: any) {
      toast.error(`Erro ao criar NF-e no Bling: ${err.message}`);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

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
      return data?.data;
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

  return {
    notas,
    loading,
    syncing,
    listarNFe,
    criarNFe,
    enviarSefaz,
    buscarNFe,
    cancelarNFe,
    lancarEstoque,
    lancarContas,
  };
}

function parseSituacao(situacao: number | undefined): string {
  const map: Record<number, string> = {
    1: 'Pendente',
    2: 'Cancelada',
    3: 'Aguardando Recibo',
    4: 'Rejeitada',
    5: 'Autorizada',
    6: 'Emitida DANFE',
    7: 'Registrada',
    8: 'Aguardando Protocolo',
    9: 'Denegada',
    10: 'Consulta Situação',
    11: 'Inutilizada',
  };
  return map[situacao || 0] || 'Desconhecida';
}
