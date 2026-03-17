import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmpresas, useContasBancarias, useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { Building2, TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(142 76% 36%)',
  'hsl(38 92% 50%)',
];

export function ConsolidacaoMultiCNPJ() {
  const { data: empresas = [], isLoading: le } = useEmpresas();
  const { data: contas = [], isLoading: lc } = useContasBancarias();
  const { data: pagar = [], isLoading: lp } = useContasPagar();
  const { data: receber = [], isLoading: lr } = useContasReceber();

  const isLoading = le || lc || lp || lr;

  const consolidado = useMemo(() => {
    const porEmpresa = empresas.map((emp, idx) => {
      const contasEmp = contas.filter((c: any) => c.empresa_id === emp.id);
      const saldo = contasEmp.reduce((s: number, c: any) => s + (c.saldo_atual || 0), 0);
      const totalPagar = pagar
        .filter((p: any) => p.empresa_id === emp.id && ['pendente', 'vencido'].includes(p.status))
        .reduce((s: number, p: any) => s + (p.valor || 0), 0);
      const totalReceber = receber
        .filter((r: any) => r.empresa_id === emp.id && ['pendente', 'vencido'].includes(r.status))
        .reduce((s: number, r: any) => s + (r.valor || 0), 0);
      const vencidos = pagar.filter((p: any) => p.empresa_id === emp.id && p.status === 'vencido').length
        + receber.filter((r: any) => r.empresa_id === emp.id && r.status === 'vencido').length;

      return {
        id: emp.id,
        nome: emp.nome_fantasia || emp.razao_social,
        cnpj: emp.cnpj,
        saldo,
        totalPagar,
        totalReceber,
        liquido: saldo + totalReceber - totalPagar,
        numContas: contasEmp.length,
        vencidos,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      };
    });

    const saldoTotal = porEmpresa.reduce((s, e) => s + e.saldo, 0);
    const totalPagar = porEmpresa.reduce((s, e) => s + e.totalPagar, 0);
    const totalReceber = porEmpresa.reduce((s, e) => s + e.totalReceber, 0);
    const totalVencidos = porEmpresa.reduce((s, e) => s + e.vencidos, 0);

    return { porEmpresa, saldoTotal, totalPagar, totalReceber, totalVencidos };
  }, [empresas, contas, pagar, receber]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
        <Skeleton className="h-80 col-span-full rounded-xl" />
      </div>
    );
  }

  const chartData = consolidado.porEmpresa.map(e => ({
    nome: e.nome?.substring(0, 15) || 'N/A',
    Saldo: e.saldo,
    'A Receber': e.totalReceber,
    'A Pagar': e.totalPagar,
  }));

  const pieData = consolidado.porEmpresa.map(e => ({
    name: e.nome?.substring(0, 15) || 'N/A',
    value: Math.max(e.saldo, 0),
  }));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Wallet}
          label="Saldo Consolidado"
          value={formatCurrency(consolidado.saldoTotal)}
          positive={consolidado.saldoTotal >= 0}
        />
        <KPICard
          icon={TrendingUp}
          label="Total a Receber"
          value={formatCurrency(consolidado.totalReceber)}
          positive
        />
        <KPICard
          icon={TrendingDown}
          label="Total a Pagar"
          value={formatCurrency(consolidado.totalPagar)}
          positive={false}
        />
        <KPICard
          icon={consolidado.totalVencidos > 0 ? AlertTriangle : CheckCircle2}
          label="Itens Vencidos"
          value={String(consolidado.totalVencidos)}
          positive={consolidado.totalVencidos === 0}
        />
      </div>

      {/* Cards por CNPJ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {consolidado.porEmpresa.map((emp) => (
          <Card key={emp.id} className="border-l-4" style={{ borderLeftColor: emp.color }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: emp.color }} />
                {emp.nome}
              </CardTitle>
              <CardDescription className="text-xs font-mono">{emp.cnpj || '—'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo</span>
                <span className={cn('font-bold tabular-nums', emp.saldo >= 0 ? 'text-foreground' : 'text-destructive')}>
                  {formatCurrency(emp.saldo)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">A Receber</span>
                <span className="font-medium text-emerald-600 tabular-nums">{formatCurrency(emp.totalReceber)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">A Pagar</span>
                <span className="font-medium text-destructive tabular-nums">{formatCurrency(emp.totalPagar)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Líquido Projetado</span>
                <span className={cn('font-bold tabular-nums', emp.liquido >= 0 ? 'text-primary' : 'text-destructive')}>
                  {formatCurrency(emp.liquido)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{emp.numContas} conta(s)</span>
                {emp.vencidos > 0 && (
                  <span className="text-destructive font-medium">• {emp.vencidos} vencido(s)</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Comparativo por CNPJ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Saldo" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                <Bar dataKey="A Receber" fill="hsl(142 76% 36%)" radius={[4,4,0,0]} />
                <Bar dataKey="A Pagar" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribuição de Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, positive }: { icon: React.ElementType; label: string; value: string; positive: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', positive ? 'bg-primary/10' : 'bg-destructive/10')}>
            <Icon className={cn('h-5 w-5', positive ? 'text-primary' : 'text-destructive')} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn('text-lg font-bold tabular-nums', positive ? 'text-foreground' : 'text-destructive')}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
