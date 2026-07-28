import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type TipoSolicitacaoLGPD =
  | "acesso"
  | "portabilidade"
  | "exclusao"
  | "retificacao"
  | "anonimizacao";

export interface SolicitacaoLGPD {
  id: string;
  user_id: string;
  user_email: string;
  tipo: TipoSolicitacaoLGPD;
  status: "aberta" | "em_analise" | "atendida" | "rejeitada";
  justificativa: string | null;
  payload_resposta: unknown;
  url_dump: string | null;
  atendida_em: string | null;
  created_at: string;
}

export function useSolicitacoesLGPD() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["solicitacoes-lgpd", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_lgpd")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SolicitacaoLGPD[];
    },
    enabled: !!user,
  });

  const criar = useMutation({
    mutationFn: async (input: { tipo: TipoSolicitacaoLGPD; justificativa?: string }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("solicitacoes_lgpd")
        .insert({
          user_id: user.id,
          user_email: user.email ?? "",
          tipo: input.tipo,
          justificativa: input.justificativa ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as SolicitacaoLGPD;
    },
    onSuccess: () => {
      toast.success("Solicitação registrada com sucesso");
      qc.invalidateQueries({ queryKey: ["solicitacoes-lgpd"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const processar = useMutation({
    mutationFn: async (solicitacao_id: string) => {
      const { data, error } = await supabase.functions.invoke("processar-solicitacao-lgpd", {
        body: { solicitacao_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Solicitação processada");
      qc.invalidateQueries({ queryKey: ["solicitacoes-lgpd"] });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  return { ...list, criar, processar };
}
