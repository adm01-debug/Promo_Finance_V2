import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AcaoRecomendada {
  id: string;
  empresa_id: string | null;
  titulo: string;
  descricao: string;
  urgencia: "baixa" | "media" | "alta" | "critica";
  impacto_estimado: number | null;
  impacto_tipo: "reais" | "percentual" | "score" | null;
  link_resolucao: string | null;
  fonte: string;
  ordem: number;
  gerado_em: string;
  expires_at: string;
}

export function useAcoesRecomendadas(empresaId?: string) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["acoes-recomendadas", empresaId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("acoes_recomendadas")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("ordem", { ascending: true })
        .limit(5);
      if (empresaId) q = q.eq("empresa_id", empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AcaoRecomendada[];
    },
    staleTime: 5 * 60_000,
  });

  const regenerar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "gerar-acoes-recomendadas",
        { body: empresaId ? { empresa_id: empresaId } : {} }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ações recomendadas atualizadas");
      qc.invalidateQueries({ queryKey: ["acoes-recomendadas"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { ...list, regenerar };
}
