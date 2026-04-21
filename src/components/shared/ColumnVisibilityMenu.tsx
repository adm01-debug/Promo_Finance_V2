import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Columns } from "lucide-react";

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

export function ColumnVisibilityMenu({
  columns,
  visible,
  onChange,
}: ColumnVisibilityMenuProps) {
  const toggle = (key: string, on: boolean) => {
    const next = on
      ? Array.from(new Set([...visible, key]))
      : visible.filter((k) => k !== key);
    onChange(next);
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
            >
              {col.label}
              {col.locked && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  fixo
                </span>
              )}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
