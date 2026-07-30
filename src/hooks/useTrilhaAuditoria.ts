import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TrilhaTipo = "financeira" | "tributaria" | "sistema" | "conformidade";

export interface TrilhaFiltros {
  inicio?: string; // YYYY-MM-DD
  fim?: string;
  busca?: string;
  acao?: string;
  usuario?: string;
  pagina?: number;
  porPagina?: number;
}

const TABELA_POR_TIPO: Record<TrilhaTipo, { table: string; dateCol: string; userCol?: string }> = {
  financeira: { table: "auditoria_financeira", dateCol: "created_at", userCol: "user_email" },
  tributaria: { table: "auditoria_tributaria", dateCol: "criado_em", userCol: "user_email" },
  sistema: { table: "audit_logs", dateCol: "created_at", userCol: "user_email" },
  conformidade: { table: "verificacoes_conformidade", dateCol: "created_at" },
};

/**
 * A trilha combina 4 tabelas heterogêneas (auditoria_financeira, auditoria_tributaria,
 * audit_logs, verificacoes_conformidade). `.from()` do supabase-js é fortemente
 * tipado por nome de tabela via generics — chamá-lo com uma string dinâmica
 * exige um único ponto de cast. Encapsulamos aqui para evitar `(supabase as any)`
 * espalhado pelo código e restringir o escopo do unsafe a uma função pequena.
 */
type QueryBuilder = {
  select(cols: string, opts?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): QueryBuilder;
  order(col: string, opts?: { ascending?: boolean }): QueryBuilder;
  limit(n: number): QueryBuilder;
  range(from: number, to: number): QueryBuilder;
  gte(col: string, val: string): QueryBuilder;
  lte(col: string, val: string): QueryBuilder;
  eq(col: string, val: string): QueryBuilder;
  or(expr: string): QueryBuilder;
  not(col: string, op: string, val: unknown): QueryBuilder;
  then: PromiseLike<{ data: unknown[] | null; error: { message: string } | null; count?: number | null }>["then"];
};

function fromDynamic(table: string): QueryBuilder {
  // supabase.from é sobrecarregado por nome de tabela; cast único evita `any` global.
  return (supabase.from as unknown as (t: string) => QueryBuilder)(table);
}

function aplicarFiltros(q: QueryBuilder, tipo: TrilhaTipo, f: TrilhaFiltros): QueryBuilder {
  const cfg = TABELA_POR_TIPO[tipo];
  if (f.inicio) q = q.gte(cfg.dateCol, `${f.inicio}T00:00:00`);
  if (f.fim) q = q.lte(cfg.dateCol, `${f.fim}T23:59:59`);
  if (f.acao && f.acao !== "todas") {
    if (tipo === "financeira") q = q.eq("operacao", f.acao);
    else if (tipo === "tributaria") q = q.eq("acao", f.acao);
    else if (tipo === "sistema") q = q.eq("action", f.acao);
  }
  if (f.usuario && cfg.userCol) {
    q = q.eq(cfg.userCol, f.usuario);
  }
  if (f.busca) {
    if (tipo === "financeira") q = q.or(`tabela.ilike.%${f.busca}%,acao.ilike.%${f.busca}%`);
    else if (tipo === "tributaria") q = q.or(`entidade_tipo.ilike.%${f.busca}%,user_email.ilike.%${f.busca}%`);
    else if (tipo === "sistema")
      q = q.or(`details.ilike.%${f.busca}%,user_email.ilike.%${f.busca}%,table_name.ilike.%${f.busca}%`);
  }
  return q;
}

export function useTrilhaAuditoria(tipo: TrilhaTipo, filtros: TrilhaFiltros = {}) {
  const { pagina = 1, porPagina = 50 } = filtros;
  const cfg = TABELA_POR_TIPO[tipo];
  return useQuery({
    queryKey: [
      "trilha-auditoria",
      tipo,
      filtros.inicio,
      filtros.fim,
      filtros.busca,
      filtros.acao,
      filtros.usuario,
      pagina,
      porPagina,
    ],
    queryFn: async () => {
      let q = fromDynamic(cfg.table)
        .select("*", { count: "exact" })
        .order(cfg.dateCol, { ascending: false });
      q = aplicarFiltros(q, tipo, filtros);
      const from = (pagina - 1) * porPagina;
      q = q.range(from, from + porPagina - 1);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 };
    },
  });
}

const EXPORT_CAP = 5000;

export async function fetchTrilhaCompleto(tipo: TrilhaTipo, filtros: TrilhaFiltros) {
  const cfg = TABELA_POR_TIPO[tipo];
  let q = fromDynamic(cfg.table)
    .select("*")
    .order(cfg.dateCol, { ascending: false })
    .limit(EXPORT_CAP);
  q = aplicarFiltros(q, tipo, filtros);
  const { data, error } = await q;
  if (error) throw error;
  return {
    rows: (data ?? []) as Record<string, unknown>[],
    truncado: (data?.length ?? 0) >= EXPORT_CAP,
    cap: EXPORT_CAP,
  };
}

export async function fetchUsuariosTrilha(tipo: TrilhaTipo): Promise<string[]> {
  const cfg = TABELA_POR_TIPO[tipo];
  if (!cfg.userCol) return [];
  const { data, error } = await fromDynamic(cfg.table)
    .select(cfg.userCol)
    .not(cfg.userCol, "is", null)
    .order(cfg.dateCol, { ascending: false })
    .limit(1000);
  if (error) return [];
  const set = new Set<string>();
  for (const r of data ?? []) {
    const v = (r as Record<string, unknown>)[cfg.userCol!];
    if (typeof v === "string" && v.trim()) set.add(v);
  }
  return Array.from(set).sort();
}
