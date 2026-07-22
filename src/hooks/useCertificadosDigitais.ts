import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CertificadoDigital {
  id: string;
  empresa_id: string;
  cnpj: string;
  razao_social: string | null;
  pfx_storage_path: string;
  valido_de: string | null;
  valido_ate: string;
  ambiente: 'homologacao' | 'producao';
  uf: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useCertificadosDigitais(empresaId?: string) {
  return useQuery({
    queryKey: ['certificados-digitais', empresaId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('empresas_certificados')
        .select('*')
        .order('valido_ate', { ascending: true });
      if (empresaId) q = q.eq('empresa_id', empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CertificadoDigital[];
    },
  });
}

export interface UploadCertificadoInput {
  empresa_id: string;
  file: File;
  password: string;
  ambiente: 'homologacao' | 'producao';
  uf: string;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export function useUploadCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadCertificadoInput) => {
      const pfx_base64 = await fileToBase64(input.file);
      const { data, error } = await supabase.functions.invoke('nfe-upload-certificado', {
        body: {
          empresa_id: input.empresa_id,
          pfx_base64,
          password: input.password,
          ambiente: input.ambiente,
          uf: input.uf,
        },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.text === 'function') {
          try {
            const t = await ctx.text();
            throw new Error(t || error.message);
          } catch { /* noop */ }
        }
        throw new Error(error.message);
      }
      if (data?.error) throw new Error(String(data.error));
      return data as {
        ok: boolean;
        cert_id: string;
        cnpj: string;
        razao_social: string | null;
        valido_de: string | null;
        valido_ate: string;
        ambiente: 'homologacao' | 'producao';
      };
    },
    onSuccess: (res) => {
      toast.success(`Certificado do CNPJ ${res.cnpj} cadastrado. Válido até ${new Date(res.valido_ate).toLocaleDateString('pt-BR')}`);
      qc.invalidateQueries({ queryKey: ['certificados-digitais'] });
    },
    onError: (err: Error) => {
      toast.error(`Falha ao processar certificado: ${err.message}`);
    },
  });
}

export function useToggleCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('empresas_certificados')
        .update({ ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Certificado atualizado');
      qc.invalidateQueries({ queryKey: ['certificados-digitais'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
