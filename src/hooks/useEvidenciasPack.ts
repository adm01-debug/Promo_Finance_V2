import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EvidenciaPacote {
  id: string;
  gerado_por_email: string | null;
  periodo_inicio: string;
  periodo_fim: string;
  escopos: string[];
  storage_path: string;
  tamanho_bytes: number | null;
  created_at: string;
  manifest: Record<string, unknown>;
}

export function useEvidenciasPacotes() {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["evidencias-pacotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evidencias_pacotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as EvidenciaPacote[];
    },
  });

  const gerar = useMutation({
    mutationFn: async (input: { periodo_inicio: string; periodo_fim: string; escopos: string[] }) => {
      const { data, error } = await supabase.functions.invoke("gerar-pacote-evidencias", {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { signed_url: string; pacote: EvidenciaPacote };
    },
    onSuccess: (d) => {
      toast.success("Pacote gerado com sucesso");
      window.open(d.signed_url, "_blank");
      qc.invalidateQueries({ queryKey: ["evidencias-pacotes"] });
      qc.invalidateQueries({ queryKey: ["compliance-kpis"] });
    },
    onError: (e: Error) => toast.error(`Falha ao gerar: ${e.message}`),
  });

  const baixar = useMutation({
    mutationFn: async (storagePath: string) => {
      const { data, error } = await supabase.storage
        .from("relatorios-tributarios")
        .createSignedUrl(storagePath, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
    onSuccess: (url) => window.open(url, "_blank"),
    onError: (e: Error) => toast.error(`Falha: ${e.message}`),
  });

  return { ...list, gerar, baixar };
}
