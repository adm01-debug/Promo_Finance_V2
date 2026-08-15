// Sub-componentes da página RelatoriosEntregas — extraídos para zerar max-lines.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface KpiCardProps { label: string; value: string; loading: boolean; icon?: React.ReactNode; onClick?: () => void }
export function KpiCard({ label, value, loading, icon, onClick }: KpiCardProps) {
  const interactive = !!onClick && !loading;
  return (
    <Card
      onClick={interactive ? onClick : undefined}
      className={interactive ? 'cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30' : ''}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs">{label}</span>
          {icon}
        </div>
        <div className="mt-1 text-2xl font-bold">
          {loading ? <Skeleton className="h-8 w-24" /> : value}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChartCardProps { title: string; loading: boolean; children: React.ReactNode }
export function ChartCard({ title, loading, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[280px] w-full" /> : children}
      </CardContent>
    </Card>
  );
}

interface Column<T> { key: keyof T | string; label: string; align?: 'left' | 'right'; render?: (row: T) => React.ReactNode }
interface TableSimpleProps<T> { rows: T[]; columns: Column<T>[]; onRowClick?: (row: T) => void }
export function TableSimple<T extends Record<string, unknown>>({ rows, columns, onRowClick }: TableSimpleProps<T>) {
  if (!rows.length) return <p className="py-4 text-center text-sm text-muted-foreground">Sem dados no período</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {columns.map((c) => (
              <th key={String(c.key)} className={`py-2 pr-4 font-medium ${c.align === 'right' ? 'text-right' : ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`border-b last:border-0 hover:bg-muted/40 ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((c) => (
                <td key={String(c.key)} className={`py-2 pr-4 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(r) : String(r[c.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
