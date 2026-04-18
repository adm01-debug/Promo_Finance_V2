// ============================================
// HOOK: useRelatorioAnual (P6)
// Chama edge function gerar-relatorio-anual e expõe gerarPDF()
// ============================================
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  gerarRelatorioAnualPDF,
  type RelatorioAnualPayload,
} from '@/components/tributario/relatorios/RelatorioAnualTributarioPDF';
import { toast } from 'sonner';

export function useRelatorioAnual(empresaId?: string, ano?: number) {
  const query = useQuery<RelatorioAnualPayload>({
    queryKey: ['relatorio-anual', empresaId, ano],
    queryFn: async () => {
      if (!empresaId || !ano) throw new Error('empresa e ano obrigatórios');
      const { data, error } = await supabase.functions.invoke(
        'gerar-relatorio-anual',
        { body: { empresa_id: empresaId, ano } }
      );
      if (error) throw error;
      return data as RelatorioAnualPayload;
    },
    enabled: !!empresaId && !!ano,
    staleTime: 30 * 60 * 1000,
  });

  const gerarPDF = async () => {
    try {
      const data = query.data;
      if (!data) {
        toast.error('Dados do relatório ainda não disponíveis');
        return;
      }
      const doc = gerarRelatorioAnualPDF(data);
      const filename = `relatorio-anual-tributario-${ano}-${data.empresa.razao_social.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      toast.success('Relatório anual gerado com sucesso! 🎉');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao gerar PDF');
    }
  };

  return { ...query, gerarPDF };
}
