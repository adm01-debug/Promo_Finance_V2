import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TablePagination } from '@/components/ui/table-pagination';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { cn } from '@/lib/utils';

interface StandardTableCardProps {
  children: ReactNode;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  className?: string;
  pageSize?: number;
}

export function StandardTableCard({
  children,
  isLoading = false,
  pagination,
  className,
  pageSize = 10,
}: StandardTableCardProps) {
  return (
    <Card className={cn("border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10", className)}>
      {isLoading ? (
        <TableShimmerSkeleton rows={pageSize} columns={8} showCheckbox showAvatar />
      ) : (
        <>
          <div className="overflow-x-auto">
            {children}
          </div>
          {pagination && (
            <div className="p-6 border-t border-white/5 bg-black/20">
              <TablePagination 
                currentPage={pagination.currentPage} 
                totalPages={pagination.totalPages} 
                pageSize={pagination.pageSize} 
                totalItems={pagination.totalItems} 
                onPageChange={pagination.onPageChange} 
                onPageSizeChange={pagination.onPageSizeChange} 
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}
