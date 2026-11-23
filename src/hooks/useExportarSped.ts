// Hook: exportação SPED EFD-Contribuições
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invokeEdge, handleEdgeError } from '@/lib/edge-function-error';

interface ExportacaoSped {
  url: string;
  file_name: string;
  total_linhas: number;
  periodo: string;
  observacao: string;
}

export function useExportarSped() {
  return useMutation({
    // invokeEdge lê o corpo do 4xx: sem isso o 422 de vigência (EFD extinta a
    // partir de 2027-01) virava "non-2xx status code" no toast.
    mutationFn: ({ empresaId, periodo }: { empresaId: string; periodo: string }) =>
      invokeEdge<ExportacaoSped>(
        'exportar-sped-contribuicoes',
        { empresa_id: empresaId, periodo },
        { silent: true }
      ),
    onSuccess: (data) => {
      toast.success(`SPED gerado (${data.total_linhas} linhas)`);
      window.open(data.url, '_blank');
    },
    onError: (e) => handleEdgeError(e, 'Falha ao gerar SPED'),
  });
}
