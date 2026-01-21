import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  size = 'md',
  className,
}: PaginationProps) {
  // Don't render if only one page
  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let start = Math.max(currentPage - halfVisible, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }

    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis');
    }

    // Add visible pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }

    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      className={cn('flex items-center gap-1', className)}
      aria-label="Pagination"
    >
      {/* First page */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={sizeClasses[size]}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
      )}

      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={sizeClasses[size]}
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {/* Page numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-gray-400 dark:text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                onClick={() => onPageChange(page)}
                className={cn(
                  sizeClasses[size],
                  isActive && 'pointer-events-none'
                )}
                aria-label={`Página ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </Button>
            );
          })}
        </div>
      )}

      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={sizeClasses[size]}
        aria-label="Próxima página"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Last page */}
      {showFirstLast && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={sizeClasses[size]}
          aria-label="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      )}
    </nav>
  );
}

// Compact pagination with info text
interface PaginationWithInfoProps extends PaginationProps {
  totalItems: number;
  pageSize: number;
}

export function PaginationWithInfo({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  ...props
}: PaginationWithInfoProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Mostrando <span className="font-medium text-gray-900 dark:text-white">{startItem}</span>
        {' '}-{' '}
        <span className="font-medium text-gray-900 dark:text-white">{endItem}</span>
        {' '}de{' '}
        <span className="font-medium text-gray-900 dark:text-white">{totalItems}</span>
        {' '}resultados
      </p>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        {...props}
      />
    </div>
  );
}

// Simple pagination with page size selector
interface PaginationWithPageSizeProps extends PaginationWithInfoProps {
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function PaginationWithPageSize({
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  ...props
}: PaginationWithPageSizeProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Itens por página:
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
          className="h-8 px-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      
      <PaginationWithInfo pageSize={pageSize} {...props} />
    </div>
  );
}

export default Pagination;
