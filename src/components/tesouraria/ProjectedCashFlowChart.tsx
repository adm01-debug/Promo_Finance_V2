
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrencyCompact, formatDateShort } from '@/lib/formatters';
import { addDays, format, startOfDay } from 'date-fns';

interface ProjectedCashFlowChartProps {
  pagar: any[];
  receber: any[];
  saldoAtual: number;
}

export function ProjectedCashFlowChart({ pagar, receber, saldoAtual }: ProjectedCashFlowChartProps) {
  const chartData = useMemo(() => {
    const data = [];
    const today = startOfDay(new Date());
    let cumulativeSaldo = saldoAtual;

    // Projected next 30 days
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayPagar = pagar
        .filter(p => p.data_vencimento === dateStr && ['pendente', 'vencido'].includes(p.status))
        .reduce((sum, p) => sum + (p.valor || 0), 0);
      
      const dayReceber = receber
        .filter(r => r.data_vencimento === dateStr && ['pendente', 'vencido'].includes(r.status))
        .reduce((sum, r) => sum + (r.valor || 0), 0);
      
      cumulativeSaldo += (dayReceber - dayPagar);

      data.push({
        name: formatDateShort(date),
        receber: dayReceber,
        pagar: dayPagar,
        saldo: cumulativeSaldo,
      });
    }

    return data;
  }, [pagar, receber, saldoAtual]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Fluxo de Caixa Projetado (30 Dias)</CardTitle>
        <CardDescription>Simulação de saldo com base em títulos a pagar e receber</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReceber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPagar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#888888' }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#888888' }}
              tickFormatter={(value) => formatCurrencyCompact(value)}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              formatter={(value: number) => [formatCurrencyCompact(value), '']}
            />
            <Legend verticalAlign="top" height={36}/>
            <Area 
              type="monotone" 
              dataKey="receber" 
              name="Entradas" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorReceber)" 
            />
            <Area 
              type="monotone" 
              dataKey="pagar" 
              name="Saídas" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorPagar)" 
            />
            <Area 
              type="monotone" 
              dataKey="saldo" 
              name="Saldo Projetado" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSaldo)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
