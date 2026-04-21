import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TrilhaTipo = "financeira" | "tributaria" | "sistema" | "conformidade";

export interface TrilhaFiltros {
  inicio?: string; // YYYY-MM-DD
  fim?: string;
  busca?: string;
  acao?: string;
  pagina?: number;
  porPagina?: number;
}

const TABELA_POR_TIPO: Record<TrilhaTipo, { table: string; dateCol: string }> = {
  financeira: { table: "auditoria_financeira", dateCol: "created_at" },
  tributaria: { table: "auditoria_tributaria", dateCol: "criado_em" },
  sistema: { table: "audit_logs", dateCol: "created_at" },
  conformidade: { table: "verificacoes_conformidade", dateCol: "created_at" },
};

export function useTrilhaAuditoria(tipo: TrilhaTipo, filtros: TrilhaFiltros = {}) {
  const { inicio, fim, busca, acao, pagina = 1, porPagina = 50 } = filtros;
  const cfg = TABELA_POR_TIPO[tipo];
  return useQuery({
    queryKey: ["trilha-auditoria", tipo, inicio, fim, busca, acao, pagina, porPagina],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any)
        .from(cfg.table)
        .select("*", { count: "exact" })
        .order(cfg.dateCol, { ascending: false });

      if (inicio) q = q.gte(cfg.dateCol, `${inicio}T00:00:00`);
      if (fim) q = q.lte(cfg.dateCol, `${fim}T23:59:59`);
      if (acao && acao !== "todas") {
        if (tipo === "financeira") q = q.eq("operacao", acao);
        else if (tipo === "tributaria") q = q.eq("acao", acao);
        else if (tipo === "sistema") q = q.eq("action", acao);
      }
      if (busca) {
        if (tipo === "financeira") q = q.or(`tabela.ilike.%${busca}%,acao.ilike.%${busca}%`);
        else if (tipo === "tributaria") q = q.or(`entidade_tipo.ilike.%${busca}%,user_email.ilike.%${busca}%`);
        else if (tipo === "sistema") q = q.or(`details.ilike.%${busca}%,user_email.ilike.%${busca}%,table_name.ilike.%${busca}%`);
      }

      const from = (pagina - 1) * porPagina;
      q = q.range(from, from + porPagina - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
    },
  });
}
