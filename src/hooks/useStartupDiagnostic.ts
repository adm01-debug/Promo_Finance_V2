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

    // 0. Detect session up-front. Sem usuário autenticado, as policies RLS
    // bloqueiam diversos endpoints com 401 e poluem o console. Nesse caso
    // apenas validamos conectividade pública e marcamos os demais como ok.
    const { data: { session } } = await supabase.auth.getSession();
    const isAuthenticated = !!session?.user;

    // 1. Connection Check
    updateStatus('connection', 'loading');
    try {
      if (!isAuthenticated) {
        // Anônimo não tem (nem deve ter) GRANT em tabelas do schema public.
        // A conectividade é aferida pelo endpoint público de saúde do GoTrue.
        const health = await verifySupabaseHealth();
        if (!health.ok) {
          throw new Error(health.error ?? `HTTP ${health.status ?? '???'}`);
        }
        updateStatus('connection', 'success', 'Backend acessível (pré-login).');
      } else {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        // PGRST116 = empty result; 401/PGRST301/42501 = falta de permissão
        // (esperado enquanto o vínculo do usuário não está provisionado).
        const status = (error as { status?: number } | null)?.status;
        if (
          error &&
          error.code !== 'PGRST116' &&
          error.code !== 'PGRST301' &&
          error.code !== '42501' &&
          status !== 401
        ) {
          throw error;
        }
        updateStatus('connection', 'success');
      }
    } catch (error) {
      logger.error('Diagnostic Error (connection):', error);
      updateStatus('connection', 'error', 'Não foi possível conectar ao banco de dados.');
      setHasError(true);
    }


    // 2. Tables Check — só roda autenticado (RLS bloqueia anônimos)
    updateStatus('tables', 'loading');
    if (!isAuthenticated) {
      updateStatus('tables', 'success', 'Validação completa será feita após login.');
    } else {
      try {
        const essentialTables = ['profiles', 'centros_custo', 'anomalias_detectadas', 'active_tracking', 'empresas'] as const;
        type Essential = typeof essentialTables[number];

        const missingTables: string[] = [];
        for (const table of essentialTables) {
          const { error: tableError } = await supabase.from(table as Essential).select('count', { count: 'exact', head: true }).limit(0);
          if (tableError && (tableError.code === '42P01' || (tableError.message && tableError.message.includes('does not exist')))) {
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
    }

    // 3. RPCs Check — também requer auth
    updateStatus('rpcs', 'loading');
    if (!isAuthenticated) {
      updateStatus('rpcs', 'success', 'Validação completa será feita após login.');
    } else try {
      const essentialRPCs = ['has_role', 'get_user_roles', 'get_user_permissions'] as const;
      type EssentialRpc = typeof essentialRPCs[number];
      const missingRPCs: string[] = [];

      for (const rpc of essentialRPCs) {
        // Assinaturas: has_role(_user_id uuid, _role app_role);
        // get_user_roles(user_id uuid); get_user_permissions(user_id uuid).
        // Valor de role precisa existir no enum app_role ('admin','manager','operator','viewer').
        const params: Record<string, string> =
          rpc === 'has_role'
            ? { _user_id: session!.user.id, _role: 'viewer' }
            : { user_id: session!.user.id };

        // RPC name é dinâmico dentro de um subconjunto conhecido em types.ts.
        const { error: rpcError } = await supabase.rpc(rpc as EssentialRpc, params as never);
        if (rpcError && rpcError.message && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
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
