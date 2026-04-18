// ============================================
// HOOK: useFechamentoTributario (P10)
// ============================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FechamentoCheck {
  id: string;
  label: string;
  ok: boolean;
  critical: boolean;
  detail: string;
}

export interface FechamentoResultado {
  success: boolean;
  status: "em_revisao" | "fechado";
  fechamento: Record<string, unknown> | null;
  checks: FechamentoCheck[];
  critical_fails?: FechamentoCheck[];
  message?: string;
  score?: number;
  total_apurado?: number;
}

export function useFechamentoTributario(empresaId?: string, ano?: number, mes?: number) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const fechamentoQuery = useQuery({
    queryKey: ["fechamento-tributario", empresaId, ano, mes],
    queryFn: async () => {
      if (!empresaId || !ano || !mes) return null;
      const { data, error } = await supabase
        .from("fechamentos_tributarios" as never)
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("ano", ano)
        .eq("mes", mes)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!empresaId && !!ano && !!mes,
  });

  const executar = useMutation({
    mutationFn: async (payload: {
      empresa_id: string;
      ano: number;
      mes: number;
      forcar?: boolean;
      justificativa?: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke<FechamentoResultado>(
        "executar-fechamento-tributario",
        { body: payload },
      );
      if (error) throw error;
      return data!;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["fechamento-tributario"] });
      if (res.status === "fechado") {
        toast({ title: "Fechamento concluído", description: "Período fechado com sucesso." });
      } else {
        toast({
          title: "Fechamento em revisão",
          description: res.message ?? "Etapas críticas pendentes.",
          variant: "destructive",
        });
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Erro no fechamento",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return {
    fechamento: fechamentoQuery.data,
    isLoading: fechamentoQuery.isLoading,
    executar: executar.mutateAsync,
    executando: executar.isPending,
    ultimoResultado: executar.data,
  };
}
