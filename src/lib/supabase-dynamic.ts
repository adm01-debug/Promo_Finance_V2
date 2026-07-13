/**
 * Cliente dinâmico do Supabase para tabelas ainda não presentes nos tipos gerados.
 *
 * Motivação: o gerador de tipos do Supabase reflete apenas o snapshot do schema
 * conhecido pelo Lovable. Algumas tabelas (saved_filters, saved_filter_subscriptions,
 * sso_sandbox_runs, trilha_auditoria, sso_user_groups, etc.) são criadas em
 * migrations posteriores e ainda não estão no `Database` gerado.
 *
 * Em vez de espalhar `(supabase as any)` pelo código-base, centralizamos aqui
 * um único ponto de cast — auditável, tipado por builder mínimo e documentado.
 *
 * Uso: `import { supabaseDyn } from '@/lib/supabase-dynamic'`.
 */
import { supabase } from '@/integrations/supabase/client';

type Filter<T> = {
  eq: (col: string, val: unknown) => T;
  neq: (col: string, val: unknown) => T;
  gt: (col: string, val: unknown) => T;
  gte: (col: string, val: unknown) => T;
  lt: (col: string, val: unknown) => T;
  lte: (col: string, val: unknown) => T;
  in: (col: string, vals: unknown[]) => T;
  is: (col: string, val: unknown) => T;
  like: (col: string, val: string) => T;
  ilike: (col: string, val: string) => T;
  or: (expr: string) => T;
  contains: (col: string, val: unknown) => T;
  match: (query: Record<string, unknown>) => T;
};

interface QueryResult<Row = Record<string, unknown>> {
  data: Row[] | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

interface SingleResult<Row = Record<string, unknown>> {
  data: Row | null;
  error: { message: string; code?: string } | null;
}

interface SelectBuilder<Row = Record<string, unknown>> extends Filter<SelectBuilder<Row>>, Promise<QueryResult<Row>> {
  order: (col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) => SelectBuilder<Row>;
  limit: (n: number) => SelectBuilder<Row>;
  range: (from: number, to: number) => SelectBuilder<Row>;
  single: () => Promise<SingleResult<Row>>;
  maybeSingle: () => Promise<SingleResult<Row>>;
}

interface MutationBuilder<Row = Record<string, unknown>> extends Filter<MutationBuilder<Row>>, Promise<QueryResult<Row>> {
  select: (cols?: string) => SelectBuilder<Row>;
  single: () => Promise<SingleResult<Row>>;
}

interface TableBuilder<Row = Record<string, unknown>> {
  select: (cols?: string, opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) => SelectBuilder<Row>;
  insert: (row: Partial<Row> | Partial<Row>[]) => MutationBuilder<Row>;
  update: (row: Partial<Row>) => MutationBuilder<Row>;
  upsert: (row: Partial<Row> | Partial<Row>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) => MutationBuilder<Row>;
  delete: () => MutationBuilder<Row>;
}

export interface SupabaseDyn {
  from: <Row = Record<string, unknown>>(table: string) => TableBuilder<Row>;
  rpc: <T = unknown>(fn: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: { message: string } | null }>;
}

// Cast único e localizado. Todas as chamadas a tabelas fora do schema tipado
// devem passar por este símbolo — nada de `(supabase as any)` espalhado.
export const supabaseDyn = supabase as unknown as SupabaseDyn;
