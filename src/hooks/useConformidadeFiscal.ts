// Hook: validação de conformidade fiscal
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConformidadeItem {
  id: string;
  titulo: string;
  descricao: string;
  status: 'aprovado' | 'atencao' | 'reprovado';
  peso: number;
  detalhes?: string;
}

export interface ConformidadeResultado {
  id?: string;
  empresa_id: string;
  periodo: string;
  score: number;
  nivel: 'excelente' | 'bom' | 'atencao' | 'critico';
  total_checks: number;
  checks_aprovados: number;
  itens: ConformidadeItem[];
  gerado_em: string;
}

export function useConformidadeFiscal(empresaId?: string, periodo?: string) {
  const qc = useQueryClient();
  const periodoFinal = periodo ?? new Date().toISOString().slice(0, 7);
  const queryKey = ['conformidade-fiscal', empresaId, periodoFinal];

  const query = useQuery<ConformidadeResultado | null>({
    queryKey,
    queryFn: async () => {
      if (!empresaId) return null;
      // Buscar último resultado persistido
      const { data: ultimo } = await supabase
        .from('verificacoes_conformidade')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('periodo', periodoFinal)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultimo) {
        return {
          id: ultimo.id,
          empresa_id: ultimo.empresa_id,
          periodo: ultimo.periodo,
          score: ultimo.score,
          nivel: ultimo.nivel as ConformidadeResultado['nivel'],
          total_checks: ultimo.total_checks,
          checks_aprovados: ultimo.checks_aprovados,
          itens: ultimo.itens as unknown as ConformidadeItem[],
          gerado_em: ultimo.created_at,
        };
      }
      return null;
    },
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000,
  });

  const verificar = useMutation({
    mutationFn: async () => {
      if (!empresaId) throw new Error('empresa_id obrigatório');
      const { data, error } = await supabase.functions.invoke('verificar-conformidade-fiscal', {
        body: { empresa_id: empresaId, periodo: periodoFinal },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as ConformidadeResultado;
    },
    onSuccess: (data) => {
      qc.setQueryData(queryKey, data);
      toast.success(`Verificação concluída: ${data.score}/100 (${data.nivel})`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, verificar };
}
