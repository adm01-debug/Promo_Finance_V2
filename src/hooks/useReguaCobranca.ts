import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ============================================
// RÉGUA DE COBRANÇA
// ============================================
export function useReguaCobranca(empresaId?: string) {
  return useQuery({
    queryKey: ['regua-cobranca', empresaId],
    queryFn: async () => {
      let query = supabase.from('regua_cobranca').select('*').order('ordem');
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateReguaCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; ativo?: boolean; auto_executar?: boolean; dias_gatilho?: number; canais?: string[] }) => {
      const { error } = await supabase.from('regua_cobranca').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regua-cobranca'] }); toast.success('Régua atualizada!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// ============================================
// TEMPLATES DE COBRANÇA
// ============================================
export function useTemplatesCobranca(etapa?: string) {
  return useQuery({
    queryKey: ['templates-cobranca', etapa],
    queryFn: async () => {
      let query = supabase.from('templates_cobranca').select('*').order('etapa').order('canal');
      if (etapa) query = query.eq('etapa', etapa);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; corpo?: string; assunto?: string; tom?: string; ativo?: boolean }) => {
      const { error } = await supabase.from('templates_cobranca').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates-cobranca'] }); toast.success('Template atualizado!'); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// ============================================
// FILA DE COBRANÇAS
// ============================================
export function useFilaCobrancas(status?: string) {
  return useQuery({
    queryKey: ['fila-cobrancas', status],
    queryFn: async () => {
      let query = supabase.from('fila_cobrancas').select('*').order('created_at', { ascending: false }).limit(200);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// EXECUÇÕES DE COBRANÇA (log de disparos)
// ============================================
export function useExecucoesCobranca(empresaId?: string) {
  return useQuery({
    queryKey: ['execucoes-cobranca', empresaId],
    queryFn: async () => {
      let query = supabase.from('execucoes_cobranca').select('*').order('created_at', { ascending: false }).limit(200);
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// PROCESSAR RÉGUA (RPC)
// ============================================
export function useProcessarRegua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (empresaId?: string) => {
      const { data, error } = await supabase.rpc('processar_regua_cobranca', {
        p_empresa_id: empresaId || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['fila-cobrancas'] });
      qc.invalidateQueries({ queryKey: ['views', 'metricas-cobranca'] });
      const result = Array.isArray(data) ? data[0] : data;
      toast.success(`Régua processada! ${result?.total_enfileirados || 0} cobranças enfileiradas.`);
    },
    onError: (e: Error) => toast.error(`Erro ao processar régua: ${e.message}`),
  });
}

// ============================================
// PROCESSAR FILA (dequeue + enviar)
// ============================================
export function useProcessarFila() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (limite: number = 50) => {
      const { data, error } = await supabase.rpc('processar_fila_cobrancas', {
        p_limite: limite,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['fila-cobrancas'] });
      qc.invalidateQueries({ queryKey: ['execucoes-cobranca'] });
      toast.success(`${Array.isArray(data) ? data.length : 0} cobranças em processamento.`);
    },
    onError: (e: Error) => toast.error(`Erro ao processar fila: ${e.message}`),
  });
}

// ============================================
// CONFIRMAR ENVIO (callback pós-disparo)
// ============================================
export function useConfirmarEnvio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { filaId: string; provider?: string; providerMessageId?: string; sucesso?: boolean; erro?: string }) => {
      const { error } = await supabase.rpc('confirmar_envio_cobranca', {
        p_fila_id: params.filaId,
        p_provider: params.provider || null,
        p_provider_message_id: params.providerMessageId || null,
        p_sucesso: params.sucesso ?? true,
        p_erro: params.erro || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fila-cobrancas'] });
      qc.invalidateQueries({ queryKey: ['execucoes-cobranca'] });
    },
    onError: (e: Error) => toast.error(`Erro ao confirmar envio: ${e.message}`),
  });
}
