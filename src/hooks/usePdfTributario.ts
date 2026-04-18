import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GerarPdfParams {
  empresaId: string;
  anoReferencia: number;
  mesReferencia: number;
}

interface PdfResponse {
  success: boolean;
  path: string;
  signedUrl: string;
  base64: string;
  empresaNome: string;
  periodo: string;
  regimeRecomendado: string;
  economiaAnual: number;
}

export function useGerarPdfTributario() {
  return useMutation<PdfResponse, Error, GerarPdfParams>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke<PdfResponse>(
        'gerar-pdf-tributario',
        { body: params }
      );
      if (error) throw error;
      if (!data?.success) throw new Error('Falha ao gerar PDF');
      return data;
    },
    onSuccess: (data) => {
      // Download direto do base64
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${data.base64}`;
      link.download = `tributario-${data.empresaNome.replace(/\s+/g, '-').toLowerCase()}-${data.periodo.replace('/', '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF executivo gerado e baixado');
    },
    onError: (e) => toast.error(`Erro ao gerar PDF: ${e.message}`),
  });
}

interface EnviarBitrixParams {
  empresaId: string;
  signedUrl: string;
  empresaNome: string;
  periodo: string;
  regimeRecomendado: string;
  economiaAnual: number;
  dealId?: string;
}

interface BitrixResponse {
  success: boolean;
  dealId: string;
  dealUrl: string;
}

export function useEnviarBitrix24Tributario() {
  return useMutation<BitrixResponse, Error, EnviarBitrixParams>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke<BitrixResponse>(
        'enviar-bitrix24-tributario',
        { body: params }
      );
      if (error) throw error;
      if (!data?.success) throw new Error('Falha ao enviar para Bitrix24');
      return data;
    },
    onSuccess: (data) => {
      toast.success('Enviado ao CRM Bitrix24', {
        description: `Deal #${data.dealId}`,
        action: {
          label: 'Abrir no CRM',
          onClick: () => window.open(data.dealUrl, '_blank'),
        },
      });
    },
    onError: (e) => toast.error(`Erro Bitrix24: ${e.message}`),
  });
}
