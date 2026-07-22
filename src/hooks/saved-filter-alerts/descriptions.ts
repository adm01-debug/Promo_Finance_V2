import type { SavedFilterPayload } from "@/hooks/useSavedFilters";

/** Descreve a ordenação ativa do preset em forma curta para o toast. */
export function describeSort(payload: SavedFilterPayload<unknown>): string | null {
  if (!payload.sort) return null;
  return `Ordenado por ${payload.sort.key} ${payload.sort.dir.toUpperCase()}`;
}

/** Descreve as colunas visíveis do preset em forma curta para o toast. */
export function describeColumns(payload: SavedFilterPayload<unknown>): string | null {
  const cols = payload.columns;
  if (!cols?.length) return null;
  const head = cols.slice(0, 4).join(", ");
  const extra = cols.length > 4 ? ` +${cols.length - 4}` : "";
  return `Colunas: ${head}${extra}`;
}

/** Compõe a descrição do toast incorporando colunas/ordenação salvas. */
export function buildDescription(
  base: string,
  payload: SavedFilterPayload<unknown>,
): string {
  const extras = [describeColumns(payload), describeSort(payload)].filter(
    Boolean,
  ) as string[];
  return extras.length > 0 ? `${base}\n${extras.join(" · ")}` : base;
}
