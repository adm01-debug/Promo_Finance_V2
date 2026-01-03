import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OperacaoPendente {
  id: string;
  tabela: string;
  tipo: 'INSERT' | 'UPDATE' | 'DELETE';
  dados: Record<string, unknown>;
  criado_em: string;
  tentativas: number;
  erro?: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface SyncStatus {
  online: boolean;
  sincronizando: boolean;
  ultimaSync?: string;
  pendentes: number;
  erros: number;
}

const STORAGE_KEY = 'offline_queue';
const MAX_TENTATIVAS = 3;

export function useOfflineSyncAdvanced() {
  const [operacoesPendentes, setOperacoesPendentes] = useState<OperacaoPendente[]>([]);
  const [status, setStatus] = useState<SyncStatus>({
    online: navigator.onLine,
    sincronizando: false,
    pendentes: 0,
    erros: 0
  });

  // Carregar operações do localStorage
  useEffect(() => {
    const salvas = localStorage.getItem(STORAGE_KEY);
    if (salvas) {
      try {
        const ops = JSON.parse(salvas) as OperacaoPendente[];
        setOperacoesPendentes(ops);
        setStatus(prev => ({
          ...prev,
          pendentes: ops.length,
          erros: ops.filter(o => o.tentativas >= MAX_TENTATIVAS).length
        }));
      } catch (e) {
        console.error('Erro ao carregar queue offline:', e);
      }
    }
  }, []);

  // Salvar operações no localStorage
  const salvarQueue = useCallback((ops: OperacaoPendente[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
    setOperacoesPendentes(ops);
    setStatus(prev => ({
      ...prev,
      pendentes: ops.length,
      erros: ops.filter(o => o.tentativas >= MAX_TENTATIVAS).length
    }));
  }, []);

  // Adicionar operação à queue
  const adicionarOperacao = useCallback((
    tabela: string,
    tipo: 'INSERT' | 'UPDATE' | 'DELETE',
    dados: Record<string, unknown>,
    prioridade: 'alta' | 'media' | 'baixa' = 'media'
  ) => {
    const novaOp: OperacaoPendente = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tabela,
      tipo,
      dados,
      criado_em: new Date().toISOString(),
      tentativas: 0,
      prioridade
    };

    const novasOps = [...operacoesPendentes, novaOp]
      .sort((a, b) => {
        const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
        return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
      });

    salvarQueue(novasOps);
    
    // Tentar sincronizar imediatamente se online
    if (navigator.onLine) {
      sincronizarOperacao(novaOp);
    }

    return novaOp.id;
  }, [operacoesPendentes, salvarQueue]);

  // Sincronizar uma operação
  const sincronizarOperacao = async (op: OperacaoPendente): Promise<boolean> => {
    try {
      let resultado;

      switch (op.tipo) {
        case 'INSERT':
          resultado = await (supabase.from(op.tabela as any) as any).insert(op.dados);
          break;
        case 'UPDATE':
          const { id, ...dadosUpdate } = op.dados;
          resultado = await (supabase.from(op.tabela as any) as any)
            .update(dadosUpdate)
            .eq('id', id);
          break;
        case 'DELETE':
          resultado = await (supabase.from(op.tabela as any) as any)
            .delete()
            .eq('id', op.dados.id);
          break;
      }

      if (resultado.error) {
        throw resultado.error;
      }

      // Remover da queue se sucesso
      const novasOps = operacoesPendentes.filter(o => o.id !== op.id);
      salvarQueue(novasOps);
      
      return true;
    } catch (error: any) {
      // Incrementar tentativas
      const novasOps = operacoesPendentes.map(o => {
        if (o.id === op.id) {
          return { ...o, tentativas: o.tentativas + 1, erro: error.message };
        }
        return o;
      });
      salvarQueue(novasOps);
      
      return false;
    }
  };

  // Sincronizar todas as operações pendentes
  const sincronizarTudo = useCallback(async () => {
    if (!navigator.onLine || status.sincronizando || operacoesPendentes.length === 0) {
      return;
    }

    setStatus(prev => ({ ...prev, sincronizando: true }));

    let sucesso = 0;
    let falha = 0;

    for (const op of operacoesPendentes) {
      if (op.tentativas >= MAX_TENTATIVAS) {
        falha++;
        continue;
      }

      const resultado = await sincronizarOperacao(op);
      if (resultado) {
        sucesso++;
      } else {
        falha++;
      }

      // Delay entre operações para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setStatus(prev => ({ 
      ...prev, 
      sincronizando: false,
      ultimaSync: new Date().toISOString()
    }));

    if (sucesso > 0) {
      toast.success(`${sucesso} operações sincronizadas`);
    }
    if (falha > 0) {
      toast.warning(`${falha} operações com erro`);
    }
  }, [operacoesPendentes, status.sincronizando]);

  // Limpar operações com erro
  const limparErros = useCallback(() => {
    const novasOps = operacoesPendentes.filter(o => o.tentativas < MAX_TENTATIVAS);
    salvarQueue(novasOps);
    toast.success('Operações com erro removidas');
  }, [operacoesPendentes, salvarQueue]);

  // Retry de uma operação específica
  const retryOperacao = useCallback(async (opId: string) => {
    const op = operacoesPendentes.find(o => o.id === opId);
    if (!op) return;

    // Reset tentativas
    const novasOps = operacoesPendentes.map(o => 
      o.id === opId ? { ...o, tentativas: 0, erro: undefined } : o
    );
    salvarQueue(novasOps);

    // Tentar novamente
    await sincronizarOperacao({ ...op, tentativas: 0 });
  }, [operacoesPendentes, salvarQueue]);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, online: true }));
      toast.success('Conexão restaurada');
      // Auto-sync quando voltar online
      setTimeout(sincronizarTudo, 1000);
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, online: false }));
      toast.warning('Você está offline. Alterações serão salvas localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizarTudo]);

  // Auto-sync periódico
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && operacoesPendentes.length > 0) {
        sincronizarTudo();
      }
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [sincronizarTudo, operacoesPendentes.length]);

  // Helpers para operações comuns
  const criarContaPagar = (dados: Record<string, unknown>) => 
    adicionarOperacao('contas_pagar', 'INSERT', dados, 'alta');

  const criarContaReceber = (dados: Record<string, unknown>) => 
    adicionarOperacao('contas_receber', 'INSERT', dados, 'alta');

  const atualizarStatus = (tabela: string, id: string, status: string) =>
    adicionarOperacao(tabela, 'UPDATE', { id, status }, 'media');

  return {
    status,
    operacoesPendentes,
    adicionarOperacao,
    sincronizarTudo,
    limparErros,
    retryOperacao,
    // Helpers
    criarContaPagar,
    criarContaReceber,
    atualizarStatus
  };
}
