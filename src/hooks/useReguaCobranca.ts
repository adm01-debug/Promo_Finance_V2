import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// RÉGUA DE COBRANÇA
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

/**
 * `UPDATE`/`INSERT`/`DELETE` barrados por RLS volta com `error = null` e zero
 * linhas — o PostgREST não enxerga a linha para escrever e simplesmente não
 * devolve nada. Sem esta checagem a tela fechava o editor e mostrava
 * "atualizado" com o banco intacto (achado do review da PR #571).
 */
function exigirLinhaAfetada(data: Array<{ id: string }> | null, acao: string): void {
  if (!data?.length) {
    throw new Error(`Sem permissão para ${acao}: nenhum registro foi alterado.`);
  }
}

export function useUpdateReguaCobranca() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      ativo?: boolean;
      auto_executar?: boolean;
      dias_gatilho?: number[];
      canais?: string[];
    }) => {
      const { data: atualizado, error } = await supabase
        .from('regua_cobranca')
        .update(data)
        .eq('id', id)
        .select('id');
      if (error) throw error;
      exigirLinhaAfetada(atualizado, 'alterar a etapa da régua');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['regua-cobranca'] });
      toast.success('Régua atualizada!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// TEMPLATES DE COBRANÇA
export interface NovoTemplateCobranca {
  empresa_id: string;
  etapa: string;
  canal: string;
  tom: string;
  /** `templates_cobranca.nome` é NOT NULL sem default — o insert falha sem ele. */
  nome: string;
  assunto?: string | null;
  corpo: string;
}

export function useTemplatesCobranca(empresaId?: string) {
  return useQuery({
    queryKey: ['templates-cobranca', empresaId],
    queryFn: async () => {
      let query = supabase.from('templates_cobranca').select('*').order('etapa').order('canal');
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      corpo?: string;
      assunto?: string;
      tom?: string;
      ativo?: boolean;
    }) => {
      const { data: atualizado, error } = await supabase
        .from('templates_cobranca')
        .update(data)
        .eq('id', id)
        .select('id');
      if (error) throw error;
      exigirLinhaAfetada(atualizado, 'alterar o template');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates-cobranca'] });
      toast.success('Template atualizado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useCriarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: NovoTemplateCobranca) => {
      const { data: criado, error } = await supabase
        .from('templates_cobranca')
        .insert(template)
        .select('id');
      if (error) throw error;
      exigirLinhaAfetada(criado, 'criar o template');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates-cobranca'] });
      toast.success('Template criado!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useExcluirTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data: excluido, error } = await supabase
        .from('templates_cobranca')
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      exigirLinhaAfetada(excluido, 'excluir o template');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates-cobranca'] });
      toast.success('Template excluído!');
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

// FILA DE COBRANÇAS
export function useFilaCobrancas(status?: string) {
  return useQuery({
    queryKey: ['fila-cobrancas', status],
    queryFn: async () => {
      let query = supabase
        .from('fila_cobrancas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// EXECUÇÕES DE COBRANÇA (log de disparos)
export function useExecucoesCobranca(empresaId?: string) {
  return useQuery({
    queryKey: ['execucoes-cobranca', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('execucoes_cobranca')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (empresaId) query = query.eq('empresa_id', empresaId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// PROCESSAR RÉGUA (RPC)
export function useProcessarRegua() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      empresaId,
      simulate = false,
    }: { empresaId?: string; simulate?: boolean } = {}) => {
      const { data, error } = await supabase.rpc('processar_regua_cobranca', {
        p_empresa_id: empresaId,
        p_simulate: simulate,
      });
      if (error) throw error;
      return { data, simulate };
    },
    onSuccess: (result) => {
      const stats = (Array.isArray(result.data) ? result.data[0] : result.data) as {
        total_enfileirados?: number;
      } | null;
      if (result.simulate) {
        toast.info(
          `Simulação concluída! ${stats?.total_enfileirados || 0} cobranças seriam disparadas hoje.`
        );
      } else {
        qc.invalidateQueries({ queryKey: ['fila-cobrancas'] });
        qc.invalidateQueries({ queryKey: ['views', 'metricas-cobranca'] });
        toast.success(
          `Régua processada! ${stats?.total_enfileirados || 0} cobranças enfileiradas.`
        );
      }
    },
    onError: (e: Error) => toast.error(`Erro ao processar régua: ${e.message}`),
  });
}

// PROCESSAR FILA (dequeue + enviar)
export function useProcessarFila() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('processar-fila-cobrancas');
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

// CONFIRMAR ENVIO (callback pós-disparo)
export function useConfirmarEnvio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      filaId: string;
      provider?: string;
      providerMessageId?: string;
      sucesso?: boolean;
      erro?: string;
    }) => {
      const { error } = await supabase.rpc('confirmar_envio_cobranca', {
        p_fila_id: params.filaId,
        p_provider: params.provider,
        p_provider_message_id: params.providerMessageId,
        p_sucesso: params.sucesso ?? true,
        p_erro: params.erro,
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
