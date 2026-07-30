import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Columns, Lock } from "lucide-react";

export interface ColumnDef {
  key: string;
  label: string;
  locked?: boolean;
}

interface ColumnVisibilityMenuProps {
  columns: ColumnDef[];
  visible: string[];
  onChange: (visible: string[]) => void;
}

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

export function ColumnVisibilityMenu({
  columns,
  visible,
  onChange,
}: ColumnVisibilityMenuProps) {
  // Auto-correção: se chegar uma lista que não inclui uma coluna locked
  // (ex.: preset salvo antes da trava existir), reescreve para o pai uma
  // única vez para manter o estado consistente.
  useEffect(() => {
    const merged = mergeLockedColumns(visible, columns);
    if (
      merged.length !== visible.length ||
      merged.some((k, i) => k !== visible[i])
    ) {
      const sameSet =
        merged.length === visible.length &&
        merged.every((k) => visible.includes(k));
      if (!sameSet) onChange(merged);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, visible]);

  const toggle = (key: string, on: boolean) => {
    const col = columns.find((c) => c.key === key);
    // Trava: nunca permite desmarcar uma coluna locked
    if (col?.locked && !on) return;
    const next = on
      ? Array.from(new Set([...visible, key]))
      : visible.filter((k) => k !== key);
    // Reaplica trava antes de propagar (defesa em profundidade)
    onChange(mergeLockedColumns(next, columns));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns className="h-3.5 w-3.5" />
          Campos
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">
          Campos visíveis
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((col) => {
          const checked = col.locked || visible.includes(col.key);
          return (
            <DropdownMenuCheckboxItem
              key={col.key}
              checked={checked}
              disabled={col.locked}
              onCheckedChange={(v) => toggle(col.key, !!v)}
              onSelect={(e) => e.preventDefault()}
              title={col.locked ? "Coluna obrigatória — sempre visível" : undefined}
            >
              <span className="flex-1">{col.label}</span>
              {col.locked && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Lock className="h-2.5 w-2.5" /> fixo
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
