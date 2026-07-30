// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BloqueiosFilters } from "./types";

export function useBloqueiosData(filters: BloqueiosFilters) {
  const bloqueiosQuery = useQuery({
    queryKey: ["bloqueios-duplicidade", filters],
    queryFn: async () => {
      let query = supabase
        .from("bloqueios_duplicidade")
        .select(`
          *,
          perfil:profiles!bloqueios_duplicidade_usuario_id_fkey (
            id, full_name, avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (filters.empresa_id !== "all") query = query.eq("empresa_id", filters.empresa_id);
      if (filters.competencia) query = query.ilike("dados_tentativa->>mes_vencimento", `%${filters.competencia}%`);
      if (filters.fornecedor) {
        query = query.or(
          `dados_tentativa->>fornecedor_nome.ilike.%${filters.fornecedor}%,dados_tentativa->>cnpj_fornecedor.ilike.%${filters.fornecedor}%`,
        );
      }
      if (filters.documento) query = query.ilike("dados_tentativa->>numero_documento", `%${filters.documento}%`);
      if (filters.valor) query = query.eq("valor_bloqueado", parseFloat(filters.valor.replace(",", ".")));

      if (filters.periodo !== "all") {
        const now = new Date();
        const startDate = new Date();
        if (filters.periodo === "today") startDate.setHours(0, 0, 0, 0);
        if (filters.periodo === "week") startDate.setDate(now.getDate() - 7);
        if (filters.periodo === "month") startDate.setMonth(now.getMonth() - 1);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const empresasQuery = useQuery({
    queryKey: ["empresas-simples"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("id, nome_fantasia, cnpj");
      if (error) throw error;
      return data;
    },
  });

  return { bloqueiosQuery, empresasQuery };
}
