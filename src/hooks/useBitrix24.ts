import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';

interface SyncLog {
  id: string;
  tipo: 'entrada' | 'saida' | 'alteracao';
  entidade: string;
  status: 'pendente' | 'sucesso' | 'erro' | 'parcial';
  registros_processados: number;
  registros_com_erro: number;
  mensagem_erro: string | null;
  detalhes: Record<string, unknown> | null;
  iniciado_em: string;
  finalizado_em: string | null;
  created_at: string;
}

interface FieldMapping {
  id: string;
  entidade: string;
  campo_bitrix: string;
  campo_sistema: string;
  ativo: boolean;
  obrigatorio: boolean;
  transformacao: string | null;
}

interface SyncResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: number;
  data?: Record<string, unknown>;
}

export function useBitrix24() {
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const { data: syncLogs, isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ['bitrix-sync-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bitrix_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SyncLog[];
    },
  });

  const { data: fieldMappings, isLoading: mappingsLoading, refetch: refetchMappings } = useQuery({
    queryKey: ['bitrix-field-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bitrix_field_mappings')
        .select('*')
        .order('entidade', { ascending: true });
      if (error) throw error;
      return data as FieldMapping[];
    },
  });

  const { data: syncedDeals, isLoading: dealsLoading, refetch: refetchDeals } = useQuery({
    queryKey: ['bitrix-synced-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*')
        .not('bitrix_deal_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: syncedClients, isLoading: clientsLoading, refetch: refetchClients } = useQuery({
    queryKey: ['bitrix-synced-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .not('bitrix_id', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const callBitrixSync = useCallback(async (action: string, params?: Record<string, unknown>): Promise<SyncResult> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    const response = await fetch(
      `${env.SUPABASE_URL}/functions/v1/bitrix24-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, params }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erro na comunicação com Bitrix24');
    }
    return response.json();
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const result = await callBitrixSync('test_connection');
      setIsConnected(result.success);
      return result;
    } catch (error: unknown) {
      setIsConnected(false);
      logger.error('Erro ao testar conexão Bitrix24:', error);
      throw error;
    }
  }, [callBitrixSync]);

  const syncDealsMutation = useMutation({
    mutationFn: () => callBitrixSync('sync_deals'),
    onSuccess: (result) => {
      toast({ title: result.success ? 'Deals sincronizados' : 'Sincronização parcial', description: result.message, variant: result.success ? 'default' : 'destructive' });
      refetchLogs(); refetchDeals();
    },
    onError: (error: Error) => { toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' }); },
  });

  const syncContactsMutation = useMutation({
    mutationFn: () => callBitrixSync('sync_contacts'),
    onSuccess: (result) => {
      toast({ title: result.success ? 'Contatos sincronizados' : 'Sincronização parcial', description: result.message, variant: result.success ? 'default' : 'destructive' });
      refetchLogs(); refetchClients();
    },
    onError: (error: Error) => { toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' }); },
  });

  const syncCompaniesMutation = useMutation({
    mutationFn: () => callBitrixSync('sync_companies'),
    onSuccess: (result) => {
      toast({ title: result.success ? 'Empresas sincronizadas' : 'Sincronização parcial', description: result.message, variant: result.success ? 'default' : 'destructive' });
      refetchLogs(); refetchClients();
    },
    onError: (error: Error) => { toast({ title: 'Erro na sincronização', description: error.message, variant: 'destructive' }); },
  });

  const exportPaymentStatusMutation = useMutation({
    mutationFn: () => callBitrixSync('export_payment_status'),
    onSuccess: (result) => {
      toast({ title: result.success ? 'Status exportados' : 'Exportação parcial', description: result.message, variant: result.success ? 'default' : 'destructive' });
      refetchLogs();
    },
    onError: (error: Error) => { toast({ title: 'Erro na exportação', description: error.message, variant: 'destructive' }); },
  });

  const toggleMappingMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('bitrix_field_mappings').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchMappings();
      toast({ title: 'Mapeamento atualizado', description: 'Configuração salva com sucesso.' });
    },
  });

  const fullSync = useCallback(async () => {
    setIsSyncing(true); setSyncProgress(0);
    try {
      setSyncProgress(5);
      const connectionResult = await testConnection();
      if (!connectionResult.success) throw new Error('Falha na conexão com Bitrix24');
      setSyncProgress(20); await syncContactsMutation.mutateAsync();
      setSyncProgress(40); await syncCompaniesMutation.mutateAsync();
      setSyncProgress(60); await syncDealsMutation.mutateAsync();
      setSyncProgress(80); await exportPaymentStatusMutation.mutateAsync();
      setSyncProgress(100);
      toast({ title: 'Sincronização completa', description: 'Todos os dados foram sincronizados com sucesso.' });
    } catch (error: unknown) {
      toast({ title: 'Erro na sincronização', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' });
    } finally {
      setIsSyncing(false); setSyncProgress(0);
    }
  }, [testConnection, syncContactsMutation, syncCompaniesMutation, syncDealsMutation, exportPaymentStatusMutation, toast]);

  useEffect(() => { testConnection().catch(() => setIsConnected(false)); }, [testConnection]);

  const stats = {
    totalSincronizados: (syncedDeals?.length || 0) + (syncedClients?.length || 0),
    dealsImportados: syncedDeals?.length || 0,
    clientesImportados: syncedClients?.length || 0,
    ultimaSync: syncLogs?.[0]?.finalizado_em || syncLogs?.[0]?.iniciado_em,
    errosHoje: syncLogs?.filter(log => log.status === 'erro' && new Date(log.created_at).toDateString() === new Date().toDateString()).length || 0,
  };

  return {
    isConnected, isSyncing, syncProgress,
    syncLogs, fieldMappings, syncedDeals, syncedClients, stats,
    isLoading: logsLoading || mappingsLoading || dealsLoading || clientsLoading,
    testConnection,
    syncDeals: syncDealsMutation.mutate,
    syncContacts: syncContactsMutation.mutate,
    syncCompanies: syncCompaniesMutation.mutate,
    exportPaymentStatus: exportPaymentStatusMutation.mutate,
    fullSync,
    toggleMapping: toggleMappingMutation.mutate,
    refetchAll: () => { refetchLogs(); refetchMappings(); refetchDeals(); refetchClients(); },
  };
}
