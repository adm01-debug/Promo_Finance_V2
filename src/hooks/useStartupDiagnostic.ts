// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface DiagnosticResult {
  id: string;
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

export const useStartupDiagnostic = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([
    { id: 'connection', name: 'Conectividade com Banco de Dados', status: 'pending' },
    { id: 'tables', name: 'Estrutura de Tabelas Essenciais', status: 'pending' },
    { id: 'rpcs', name: 'Funções de Sistema (RPCs)', status: 'pending' },
    { id: 'auth', name: 'Configuração de Autenticação', status: 'pending' },
  ]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const updateStatus = (id: string, status: DiagnosticResult['status'], message?: string) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, status, message } : r));
  };

  const runDiagnostics = async () => {
    setIsComplete(false);
    setHasError(false);

    // 1. Connection Check
    updateStatus('connection', 'loading');
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 is just empty result, which is fine
         throw error;
      }
      updateStatus('connection', 'success');
    } catch (error) {
      logger.error('Diagnostic Error (connection):', error);
      updateStatus('connection', 'error', 'Não foi possível conectar ao banco de dados.');
      setHasError(true);
    }

    // 2. Tables Check
    updateStatus('tables', 'loading');
    try {
      const essentialTables = ['profiles', 'centros_custo', 'anomalias_detectadas', 'active_tracking', 'empresas'];
      const { data, error } = await supabase
        .rpc('check_tables_existence', { tables: essentialTables } as any);
      
      // If RPC doesn't exist, we fallback to a manual check via information_schema if possible, 
      // but usually we can't query information_schema directly from client easily due to RLS.
      // So let's try a simple query for each.
      
      const missingTables = [];
      for (const table of essentialTables) {
        const { error: tableError } = await supabase.from(table as any).select('count', { count: 'exact', head: true }).limit(0);
        if (tableError && (tableError.code === '42P01' || tableError.message.includes('does not exist'))) {
          missingTables.push(table);
        }
      }

      if (missingTables.length > 0) {
        updateStatus('tables', 'error', `Tabelas ausentes: ${missingTables.join(', ')}`);
        setHasError(true);
      } else {
        updateStatus('tables', 'success');
      }
    } catch (error) {
      logger.error('Diagnostic Error (tables):', error);
      updateStatus('tables', 'error', 'Erro ao validar estrutura de tabelas.');
      setHasError(true);
    }

    // 3. RPCs Check
    updateStatus('rpcs', 'loading');
    try {
      const essentialRPCs = ['has_role', 'get_user_roles', 'get_user_permissions'];
      const missingRPCs = [];

      for (const rpc of essentialRPCs) {
        const { error: rpcError } = await supabase.rpc(rpc as any, { _role: 'user', _user_id: '00000000-0000-0000-0000-000000000000' } as any);
        // If it's a "function does not exist" error, it's missing. 
        // Note: has_role might return error because of argument mismatch, but we check the message.
        if (rpcError && (rpcError.message.includes('function') && rpcError.message.includes('does not exist'))) {
          missingRPCs.push(rpc);
        }
      }

      if (missingRPCs.length > 0) {
        updateStatus('rpcs', 'error', `Funções ausentes: ${missingRPCs.join(', ')}`);
        setHasError(true);
      } else {
        updateStatus('rpcs', 'success');
      }
    } catch (error) {

      logger.error('Diagnostic Error (rpcs):', error);
      updateStatus('rpcs', 'error', 'Erro ao validar funções de sistema.');
      setHasError(true);
    }

    // 4. Auth Check
    updateStatus('auth', 'loading');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      updateStatus('auth', 'success', session ? 'Sessão ativa detectada' : 'Pronto para login');
    } catch (error) {
      logger.error('Diagnostic Error (auth):', error);
      updateStatus('auth', 'error', 'Erro ao validar configuração de autenticação.');
      setHasError(true);
    }

    setIsComplete(true);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return { results, isComplete, hasError, retry: runDiagnostics };
};
