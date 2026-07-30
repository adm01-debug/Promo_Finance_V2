import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function PaginationControls({ pagina, setPagina, hasMore, onRefetch }: { pagina: number; setPagina: (p: number) => void; hasMore: boolean; onRefetch: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Página {pagina}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => { setPagina(pagina - 1); setTimeout(onRefetch, 50); }}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => { setPagina(pagina + 1); setTimeout(onRefetch, 50); }}>
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}
