import type { ColumnDef } from './ColumnVisibilityMenu';

/**
 * Garante que todas as colunas marcadas como `locked` apareçam na lista de
 * visíveis, removendo-as primeiro para preservar a ordem definida em `columns`
 * e evitando duplicações. Use este helper ao carregar presets salvos
 * (incluindo presets antigos que possam ter sido salvos sem a trava).
 */
export function mergeLockedColumns(
  visible: string[],
  columns: ColumnDef[],
): string[] {
  const lockedKeys = columns.filter((c) => c.locked).map((c) => c.key);
  if (lockedKeys.length === 0) return visible;
  const filtered = visible.filter((k) => !lockedKeys.includes(k));
  // Mantém a ordem original definida em `columns` para as travadas
  const orderedLocked = columns
    .filter((c) => c.locked)
    .map((c) => c.key);
  return [...orderedLocked, ...filtered];
}
