import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChecklistItem { id: string; label: string; status: 'ok' | 'warn' | 'error'; detail?: string; itens?: string[] }

export interface SpedValidacaoResult {
  mode: 'validate';
  empresa: { cnpj: string; razao_social: string };
  periodo: { inicio: string; fim: string };
  total_lancamentos: number;
  checklist: ChecklistItem[];
  validacoes: { erros: string[]; avisos: string[] };
}

export interface EcdReferencia {
  id: string;
  hash_sha256: string | null;
  recibo_transmissao: string | null;
  status: string;
  created_at: string;
}

export interface ApuracaoPreview {
  lucro_liquido: number;
  base_irpj: number;
  irpj: number;
  csll: number;
}

export interface SpedEcfValidacaoResult extends SpedValidacaoResult {
  ecd_referencia: EcdReferencia | null;
  apuracao_preview: ApuracaoPreview;
}

export interface SpedGeracaoResult {
  url: string;
  file_name: string;
  total_linhas: number;
  total_lancamentos: number;
  hash_sha256: string;
  checklist: ChecklistItem[];
  validacoes: { erros: string[]; avisos: string[] };
  empresa: { cnpj: string; razao_social: string };
  periodo: { inicio: string; fim: string };
  arquivo_id?: string;
}

export function useSpedContabilHistorico(empresaId?: string) {
  return useQuery({
    queryKey: ['sped-contabil-historico', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];
      const { data, error } = await supabase
        .from('sped_contabil_arquivos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!empresaId,
  });
}

export function useSpedEcdValidacao() {
  return useMutation({
    mutationFn: async ({ empresaId, anoCalendario }: { empresaId: string; anoCalendario: number }) => {
      const { data, error } = await supabase.functions.invoke('gerar-sped-ecd', {
        body: { empresa_id: empresaId, ano_calendario: anoCalendario, mode: 'validate' },
      });
      if (error) throw error;
      if (data?.error && !data?.checklist) throw new Error(data.error);
      return data as SpedValidacaoResult;
    },
    onError: (e: Error) => toast.error(`Falha na validação: ${e.message}`),
  });
}

export function useSpedEcfValidacao() {
  return useMutation({
    mutationFn: async ({ empresaId, anoCalendario }: { empresaId: string; anoCalendario: number }) => {
      const { data, error } = await supabase.functions.invoke('gerar-sped-ecf', {
        body: { empresa_id: empresaId, ano_calendario: anoCalendario, mode: 'validate' },
      });
      if (error) throw error;
      if (data?.error && !data?.checklist) throw new Error(data.error);
      return data as SpedEcfValidacaoResult;
    },
    onError: (e: Error) => toast.error(`Falha na validação ECF: ${e.message}`),
  });
}

export function useGerarSpedContabil() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ empresaId, anoCalendario, tipo, silent }: { empresaId: string; anoCalendario: number; tipo: 'ECD' | 'ECF'; silent?: boolean }) => {
      const fnName = tipo === 'ECD' ? 'gerar-sped-ecd' : 'gerar-sped-ecf';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { empresa_id: empresaId, ano_calendario: anoCalendario },
      });
      if (error) throw error;
      if (data?.error) {
        const err = new Error(data.error) as Error & { checklist?: ChecklistItem[]; validacoes?: { erros: string[]; avisos: string[] } };
        err.checklist = data.checklist;
        err.validacoes = data.validacoes;
        throw err;
      }
      return { ...data, _silent: silent } as SpedGeracaoResult & { _silent?: boolean };
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['sped-contabil-historico'] });
      if (data.validacoes.erros.length > 0) {
        toast.error(`SPED ${vars.tipo} gerado com ${data.validacoes.erros.length} erro(s)`);
      } else {
        toast.success(`SPED ${vars.tipo} gerado com sucesso (${data.total_lancamentos} lançamentos)`);
      }
      if (!data._silent) window.open(data.url, '_blank');
    },
    onError: (e: Error) => toast.error(`Falha ao gerar SPED: ${e.message}`),
  });
}

export function useRegistrarTransmissaoSped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ arquivoId, recibo }: { arquivoId: string; recibo: string }) => {
      const { error } = await supabase
        .from('sped_contabil_arquivos')
        .update({ status: 'transmitido', recibo_transmissao: recibo })
        .eq('id', arquivoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sped-contabil-historico'] });
      toast.success('Transmissão registrada');
    },
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });
}
