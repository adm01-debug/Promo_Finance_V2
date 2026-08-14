import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HistoricoEvento {
  id: string;
  boleto_id: string;
  tipo_evento: string;
  descricao: string;
  metadados: Record<string, unknown> | null;
  created_at: string;
  // Joins
  boleto_numero?: string;
  sacado_nome?: string;
}

export function useHistoricoBoletos() {
  return useQuery({
    queryKey: ['boletos-historico-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_cobrancas_boletos')
        .select(`
          *,
          boletos!inner (
            numero,
            sacado_nome
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return ((data ?? []) as unknown as Array<{ boletos?: { numero?: string; sacado_nome?: string } } & Record<string, unknown>>).map((item) => ({
        ...item,
        boleto_numero: item.boletos?.numero,
        sacado_nome: item.boletos?.sacado_nome,
      })) as unknown as HistoricoEvento[];
    },
  });
}
