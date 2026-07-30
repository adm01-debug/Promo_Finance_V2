import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';
import { exportToCSV } from '@/lib/export-utils';

export interface DrilldownOrder {
  id: string;
  status: string;
  customer_name: string;
  delivery_address: string;
  vehicle_type: string;
  total_cost: number;
  distance_meters: number | null;
  delay_minutes: number | null;
  duration_minutes: number | null;
  scheduled_at: string;
  cost_center: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle?: string;
  orders: DrilldownOrder[];
}

type SortKey = 'scheduled_at' | 'total_cost' | 'delay_minutes' | 'customer_name' | 'status';

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nfmt = (n: number, d = 0) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

const statusVariant = (s: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (s === 'COMPLETED') return 'default';
  if (['CANCELLED', 'REJECTED', 'EXPIRED'].includes(s)) return 'destructive';
  if (['PENDING', 'MATCHED'].includes(s)) return 'secondary';
  return 'outline';
};

export function DeliveryDrilldownDialog({ open, onOpenChange, title, subtitle, orders }: Props) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('scheduled_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? orders.filter(
          (o) =>
            (o.customer_name || '').toLowerCase().includes(q) ||
            (o.delivery_address || '').toLowerCase().includes(q) ||
            (o.cost_center || '').toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q),
        )
      : orders;

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [orders, search, sortKey, sortDir]);

  const totalCost = useMemo(() => filtered.reduce((s, o) => s + Number(o.total_cost || 0), 0), [filtered]);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(k);
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    if (!filtered.length) return;
    const columns = [
      { key: 'id', header: 'ID' },
      { key: 'scheduled_at', header: 'Agendado em' },
      { key: 'status', header: 'Status' },
      { key: 'customer_name', header: 'Cliente' },
      { key: 'delivery_address', header: 'Endereço' },
      { key: 'vehicle_type', header: 'Veículo' },
      { key: 'total_cost', header: 'Custo' },
      { key: 'distance_meters', header: 'Distância (m)' },
      { key: 'delay_minutes', header: 'Atraso (min)' },
      { key: 'duration_minutes', header: 'Duração (min)' },
      { key: 'cost_center', header: 'Centro de custo' },
    ] as const;
    exportToCSV(
      filtered as unknown as Record<string, unknown>[],
      columns as never,
      `drilldown-${title.toLowerCase().replace(/\s+/g, '-')}`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden p-0">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {subtitle ? `${subtitle} · ` : ''}
            {nfmt(filtered.length)} entrega{filtered.length === 1 ? '' : 's'} · Custo total {brl(totalCost)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 border-b bg-muted/30 p-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, endereço, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <div className="max-h-[65vh] overflow-auto">
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Nenhuma entrega encontrada com os critérios selecionados.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background/95 backdrop-blur">
                <tr className="border-b text-left text-muted-foreground">
                  <SortableTh label="Data" active={sortKey === 'scheduled_at'} dir={sortDir} onClick={() => toggleSort('scheduled_at')} />
                  <SortableTh label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
                  <SortableTh label="Cliente" active={sortKey === 'customer_name'} dir={sortDir} onClick={() => toggleSort('customer_name')} />
                  <th className="px-3 py-2 font-medium">Endereço</th>
                  <th className="px-3 py-2 font-medium">Veículo</th>
                  <SortableTh label="Custo" align="right" active={sortKey === 'total_cost'} dir={sortDir} onClick={() => toggleSort('total_cost')} />
                  <SortableTh label="Atraso" align="right" active={sortKey === 'delay_minutes'} dir={sortDir} onClick={() => toggleSort('delay_minutes')} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {new Date(o.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={statusVariant(o.status)} className="text-[10px]">{o.status}</Badge>
                    </td>
                    <td className="px-3 py-2">{o.customer_name || '—'}</td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-muted-foreground" title={o.delivery_address}>
                      {o.delivery_address || '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">{o.vehicle_type || '—'}</td>
                    <td className="px-3 py-2 text-right font-medium">{brl(Number(o.total_cost || 0))}</td>
                    <td className="px-3 py-2 text-right">
                      {o.delay_minutes == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={o.delay_minutes > 15 ? 'text-destructive' : o.delay_minutes > 5 ? 'text-warning' : ''}>
                          {nfmt(o.delay_minutes, 0)} min
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SortableThProps {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  align?: 'left' | 'right';
  onClick: () => void;
}
function SortableTh({ label, active, dir, align, onClick }: SortableThProps) {
  return (
    <th className={`px-3 py-2 font-medium ${align === 'right' ? 'text-right' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground' : ''}`}
      >
        {label}
        {active && <span className="text-[10px]">{dir === 'asc' ? '▲' : '▼'}</span>}
      </button>
    </th>
  );
}
