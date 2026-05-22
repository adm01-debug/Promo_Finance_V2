import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: TablePaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-6 border-t border-white/5 bg-black/20 backdrop-blur-xl rounded-b-[2.5rem]">
      {/* Page size selector - hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
        <span>Exibindo</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-10 w-[80px] rounded-xl bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>por página</span>
      </div>

      {/* Item count - compact on mobile */}
      <div className="text-xs sm:text-sm text-muted-foreground text-center">
        <span className="sm:hidden">{startItem}-{endItem}/{totalItems}</span>
        <span className="hidden sm:inline">{startItem}-{endItem} de {totalItems} itens</span>
      </div>

      {/* Navigation buttons - compact on mobile */}
      <div className="flex items-center gap-1">
        {/* First page - hidden on mobile */}
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-1 px-4 bg-white/5 h-10 rounded-xl border border-white/10">
          <span className="text-xs sm:text-sm whitespace-nowrap font-black">
            <span className="text-primary">{currentPage}</span>
            <span className="text-muted-foreground/40 mx-1">/</span>
            <span className="text-muted-foreground/60">{totalPages || 1}</span>
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden sm:flex h-10 w-10 rounded-xl bg-white/5 border-white/10 hover:bg-primary/20 hover:text-primary transition-all"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
