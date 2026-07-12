import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryReportFilters {
  from: string; // ISO date
  to: string;   // ISO date
  status?: string;
  customer?: string;
  region?: string; // substring da delivery_address
}

interface OrderRow {
  id: string;
  status: string;
  customer_name: string;
  delivery_address: string;
  pickup_address: string;
  vehicle_type: string;
  total_cost: number;
  distance_meters: number | null;
  delay_minutes: number | null;
  duration_minutes: number | null;
  scheduled_at: string;
  actual_delivery: string | null;
  cost_center: string | null;
  outcome: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
}

async function fetchOrders(f: DeliveryReportFilters): Promise<OrderRow[]> {
  let q = supabase
    .from('lalamove_orders')
    .select('id,status,customer_name,delivery_address,pickup_address,vehicle_type,total_cost,distance_meters,delay_minutes,duration_minutes,scheduled_at,actual_delivery,cost_center,outcome,delivery_latitude,delivery_longitude')
    .gte('scheduled_at', f.from)
    .lte('scheduled_at', `${f.to}T23:59:59`)
    .order('scheduled_at', { ascending: false })
    .limit(5000);

  if (f.status && f.status !== 'ALL') q = q.eq('status', f.status as never);
  if (f.customer) q = q.ilike('customer_name', `%${f.customer}%`);
  if (f.region) q = q.ilike('delivery_address', `%${f.region}%`);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as OrderRow[];
}

export function useDeliveryReports(filters: DeliveryReportFilters) {
  const query = useQuery({
    queryKey: ['delivery-reports', filters],
    queryFn: () => fetchOrders(filters),
    staleTime: 60_000,
  });

  const analytics = useMemo(() => {
    const orders = query.data || [];
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const cancelled = orders.filter((o) => o.status === 'CANCELLED' || o.status === 'REJECTED' || o.status === 'EXPIRED').length;
    const onTime = orders.filter((o) => o.status === 'COMPLETED' && (o.delay_minutes ?? 0) <= 0).length;
    const totalCost = orders.reduce((s, o) => s + Number(o.total_cost || 0), 0);
    const totalKm = orders.reduce((s, o) => s + Number(o.distance_meters || 0), 0) / 1000;
    const avgCost = total ? totalCost / total : 0;
    const avgDelay = (() => {
      const arr = orders.filter((o) => o.delay_minutes != null).map((o) => o.delay_minutes as number);
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    })();
    const avgDuration = (() => {
      const arr = orders.filter((o) => o.duration_minutes != null).map((o) => o.duration_minutes as number);
      return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    })();
    const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    const completionRate = total ? (completed / total) * 100 : 0;
    const onTimeRate = completed ? (onTime / completed) * 100 : 0;

    // Cost by vehicle type
    const byVehicle = groupBy(orders, (o) => o.vehicle_type);
    const costByVehicle = Object.entries(byVehicle).map(([k, v]) => ({
      key: k,
      orders: v.length,
      cost: v.reduce((s, o) => s + Number(o.total_cost || 0), 0),
      avg: v.length ? v.reduce((s, o) => s + Number(o.total_cost || 0), 0) / v.length : 0,
    })).sort((a, b) => b.cost - a.cost);

    // Cost by cost_center
    const byCostCenter = groupBy(orders, (o) => o.cost_center || 'Não atribuído');
    const costByCostCenter = Object.entries(byCostCenter).map(([k, v]) => ({
      key: k,
      orders: v.length,
      cost: v.reduce((s, o) => s + Number(o.total_cost || 0), 0),
    })).sort((a, b) => b.cost - a.cost).slice(0, 10);

    // Daily series (cost + count)
    const byDay = groupBy(orders, (o) => o.scheduled_at.slice(0, 10));
    const dailySeries = Object.entries(byDay).map(([day, v]) => ({
      day,
      orders: v.length,
      cost: v.reduce((s, o) => s + Number(o.total_cost || 0), 0),
      avgDelay: v.filter((o) => o.delay_minutes != null).length
        ? v.filter((o) => o.delay_minutes != null).reduce((s, o) => s + (o.delay_minutes as number), 0) /
          v.filter((o) => o.delay_minutes != null).length
        : 0,
    })).sort((a, b) => a.day.localeCompare(b.day));

    // Geography — extract city/region heuristic (last part after comma or first UF token)
    const byRegion = groupBy(orders, (o) => extractRegion(o.delivery_address));
    const regionSeries = Object.entries(byRegion).map(([k, v]) => ({
      key: k,
      orders: v.length,
      cost: v.reduce((s, o) => s + Number(o.total_cost || 0), 0),
      avgDelay: v.filter((o) => o.delay_minutes != null).length
        ? v.filter((o) => o.delay_minutes != null).reduce((s, o) => s + (o.delay_minutes as number), 0) /
          v.filter((o) => o.delay_minutes != null).length
        : 0,
    })).sort((a, b) => b.orders - a.orders).slice(0, 15);

    // Top customers
    const byCustomer = groupBy(orders, (o) => o.customer_name || 'Sem cliente');
    const topCustomers = Object.entries(byCustomer).map(([k, v]) => ({
      key: k,
      orders: v.length,
      cost: v.reduce((s, o) => s + Number(o.total_cost || 0), 0),
    })).sort((a, b) => b.cost - a.cost).slice(0, 10);

    // Status distribution
    const byStatus = groupBy(orders, (o) => o.status);
    const statusDistribution = Object.entries(byStatus).map(([k, v]) => ({ key: k, value: v.length }));

    return {
      kpis: {
        total, completed, cancelled, totalCost, totalKm, avgCost, avgDelay,
        avgDuration, costPerKm, completionRate, onTimeRate,
      },
      costByVehicle, costByCostCenter, dailySeries,
      regionSeries, topCustomers, statusDistribution,
    };
  }, [query.data]);

  return { ...query, analytics };
}

function groupBy<T>(arr: T[], key: (x: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of arr) {
    const k = key(item);
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}

function extractRegion(address: string | null | undefined): string {
  if (!address) return 'Não informado';
  const ufMatch = address.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
  if (ufMatch) {
    const parts = address.split(',').map((p) => p.trim());
    const cityIdx = parts.findIndex((p) => p.toUpperCase().includes(ufMatch[1]));
    if (cityIdx > 0) return `${parts[cityIdx - 1]}/${ufMatch[1]}`;
    return ufMatch[1];
  }
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Não informado';
}
