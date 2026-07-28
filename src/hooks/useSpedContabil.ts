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

async function postBitrixLog(payload: {
  empresaId: string;
  tipo: 'ECD' | 'ECF';
  anoCalendario: number;
  status: 'gerado' | 'bloqueado' | 'transmitido';
  totalErros: number;
  totalAvisos: number;
  totalLinhas?: number;
  totalLancamentos?: number;
  hashSha256?: string | null;
  signedUrl?: string | null;
  arquivoId?: string | null;
}) {
  try {
    const { data: emp } = await supabase
      .from('empresas')
      .select('cnpj, razao_social')
      .eq('id', payload.empresaId)
      .maybeSingle();
    await supabase.functions.invoke('log-sped-bitrix24', {
      body: {
        ...payload,
        empresaNome: emp?.razao_social ?? '—',
        cnpj: emp?.cnpj ?? '—',
      },
    });
  } catch {
    // Best-effort: nunca bloqueia o fluxo de geração SPED
  }
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
        // Geração bloqueada por validações — registra log no Bitrix24 antes de propagar erro
        const erros: string[] = data?.validacoes?.erros ?? [];
        const avisos: string[] = data?.validacoes?.avisos ?? [];
        void postBitrixLog({
          empresaId, tipo, anoCalendario,
          status: 'bloqueado',
          totalErros: erros.length,
          totalAvisos: avisos.length,
        });
        const err = new Error(data.error) as Error & { checklist?: ChecklistItem[]; validacoes?: { erros: string[]; avisos: string[] } };
        err.checklist = data.checklist;
        err.validacoes = data.validacoes;
        throw err;
      }
      return { ...data, _silent: silent } as SpedGeracaoResult & { _silent?: boolean };
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['sped-contabil-historico'] });
      const erros = data.validacoes?.erros ?? [];
      const avisos = data.validacoes?.avisos ?? [];
      if (erros.length > 0) {
        toast.error(`SPED ${vars.tipo} gerado com ${erros.length} erro(s)`);
      } else {
        toast.success(`SPED ${vars.tipo} gerado com sucesso (${data.total_lancamentos} lançamentos)`);
      }
      // Log Bitrix24 — geração concluída (mesmo com erros não-bloqueantes registrados pelo backend)
      void postBitrixLog({
        empresaId: vars.empresaId,
        tipo: vars.tipo,
        anoCalendario: vars.anoCalendario,
        status: erros.length > 0 ? 'bloqueado' : 'gerado',
        totalErros: erros.length,
        totalAvisos: avisos.length,
        totalLinhas: data.total_linhas,
        totalLancamentos: data.total_lancamentos,
        hashSha256: data.hash_sha256,
        signedUrl: data.url,
        arquivoId: data.arquivo_id ?? null,
      });
      if (!data._silent) window.open(data.url, '_blank');
    },
    onError: (e: Error) => toast.error(`Falha ao gerar SPED: ${e.message}`),
  });
}

export function useRegistrarTransmissaoSped() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      arquivoId,
      recibo,
      tipo,
    }: { arquivoId: string; recibo: string; tipo?: 'ECD' | 'ECF' }) => {
      const { data: arquivo, error: fetchErr } = await supabase
        .from('sped_contabil_arquivos')
        .select('empresa_id, ano_calendario, tipo, validacoes, total_linhas, total_lancamentos, hash_sha256, storage_path')
        .eq('id', arquivoId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      const { error } = await supabase
        .from('sped_contabil_arquivos')
        .update({ status: 'transmitido', recibo_transmissao: recibo })
        .eq('id', arquivoId);
      if (error) throw error;
      return { recibo, tipo, arquivo, arquivoId };
    },
    onSuccess: ({ recibo, tipo, arquivo, arquivoId }) => {
      qc.invalidateQueries({ queryKey: ['sped-contabil-historico'] });
      const label = tipo ? `SPED ${tipo}` : 'SPED';
      // Alerta 1 — status transmitido
      toast.success(`${label} marcada como transmitida`, {
        description: 'Histórico atualizado · status alterado para “transmitido”.',
        duration: 5000,
      });
      // Alerta 2 — recibo salvo
      toast.success('Recibo salvo com sucesso', {
        description: `Nº ${recibo}`,
        duration: 6000,
      });
      // Log Bitrix24 — transmissão registrada
      if (arquivo?.empresa_id && arquivo?.ano_calendario) {
        const v = (arquivo.validacoes ?? {}) as { erros?: string[]; avisos?: string[] };
        void postBitrixLog({
          empresaId: arquivo.empresa_id,
          tipo: (tipo ?? (arquivo.tipo as 'ECD' | 'ECF')),
          anoCalendario: arquivo.ano_calendario,
          status: 'transmitido',
          totalErros: v.erros?.length ?? 0,
          totalAvisos: v.avisos?.length ?? 0,
          totalLinhas: arquivo.total_linhas ?? undefined,
          totalLancamentos: arquivo.total_lancamentos ?? undefined,
          hashSha256: arquivo.hash_sha256,
          arquivoId,
        });
      }
    },
    onError: (e: Error) => toast.error('Falha ao registrar transmissão', { description: e.message }),
  });
}
