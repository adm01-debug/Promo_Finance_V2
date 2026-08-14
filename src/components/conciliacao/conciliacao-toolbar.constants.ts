import type { ColumnDef } from "@/components/shared/ColumnVisibilityMenu";

export interface ConciliacaoSort {
  key: "data" | "valor" | "descricao" | "tipo";
  dir: "asc" | "desc";
}

export const CONCILIACAO_COLUMNS: ColumnDef[] = [
  { key: "data", label: "Data" },
  { key: "descricao", label: "Descrição", locked: true },
  { key: "valor", label: "Valor", locked: true },
  { key: "tipo", label: "Tipo (ícone)" },
  { key: "acoes", label: "Ações", locked: true },
];

export const CONCILIACAO_DEFAULT_VISIBLE = CONCILIACAO_COLUMNS.map((c) => c.key);
export const CONCILIACAO_DEFAULT_SORT: ConciliacaoSort = {
  key: "data",
  dir: "desc",
};
