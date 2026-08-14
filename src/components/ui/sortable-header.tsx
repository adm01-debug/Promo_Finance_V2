import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;
  
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1 -ml-3 h-8 text-caption text-muted-foreground/60 hover:text-foreground", className)}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {isActive && currentDirection === 'asc' ? (
        <ArrowUp className="h-3 w-3" />
      ) : isActive && currentDirection === 'desc' ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}
