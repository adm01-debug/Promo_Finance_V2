import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmpresas, useContasBancarias, useContasPagar, useContasReceber } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Landmark, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SALDO_MINIMO_ALERTA = 1000;

export function TesourariaCentralizada() {
  const { data: empresas = [], isLoading: le } = useEmpresas();
  const { data: contas = [], isLoading: lc } = useContasBancarias();
  const { data: pagar = [] } = useContasPagar();
  const { data: receber = [] } = useContasReceber();

  const [filtroEmpresa, setFiltroEmpresa] = useState<string>('all');
  const [busca, setBusca] = useState('');

  const isLoading = le || lc;

  const contasFiltradas = useMemo(() => {
    let lista = contas.map((c: any) => {
      const emp = empresas.find(e => e.id === c.empresa_id);
      const pagarPendente = pagar
        .filter((p: any) => p.conta_bancaria_id === c.id && ['pendente', 'vencido'].includes(p.status))
        .reduce((s: number, p: any) => s + (p.valor || 0), 0);
      const receberPendente = receber
        .filter((r: any) => r.conta_bancaria_id === c.id && ['pendente', 'vencido'].includes(r.status))
        .reduce((s: number, r: any) => s + (r.valor || 0), 0);

      return {
        ...c,
        empresaNome: emp?.nome_fantasia || emp?.razao_social || 'N/A',
        empresaCNPJ: emp?.cnpj || '',
        pagarPendente,
        receberPendente,
        saldoProjetado: (c.saldo_atual || 0) + receberPendente - pagarPendente,
        alertaBaixo: (c.saldo_atual || 0) < SALDO_MINIMO_ALERTA,
      };
    });

    if (filtroEmpresa !== 'all') {
      lista = lista.filter(c => c.empresa_id === filtroEmpresa);
    }
    if (busca) {
      const b = busca.toLowerCase();
      lista = lista.filter(c => c.banco.toLowerCase().includes(b) || c.empresaNome.toLowerCase().includes(b));
    }

    return lista.sort((a, b) => b.saldo_atual - a.saldo_atual);
  }, [contas, empresas, pagar, receber, filtroEmpresa, busca]);

  const saldoTotal = contasFiltradas.reduce((s, c) => s + (c.saldo_atual || 0), 0);
  const contasAlerta = contasFiltradas.filter(c => c.alertaBaixo).length;

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as empresas</SelectItem>
            {empresas.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar banco..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Landmark className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{contasFiltradas.length} Contas</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(saldoTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-xs text-muted-foreground">Total a Receber</p>
              <p className="text-lg font-bold tabular-nums text-emerald-600">
                {formatCurrency(contasFiltradas.reduce((s, c) => s + c.receberPendente, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        {contasAlerta > 0 && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo Baixo</p>
                <p className="text-lg font-bold text-destructive">{contasAlerta} conta(s)</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {contasFiltradas.map(conta => {
          const pct = saldoTotal > 0 ? ((conta.saldo_atual || 0) / saldoTotal) * 100 : 0;
          return (
            <Card key={conta.id} className={cn(conta.alertaBaixo && 'border-destructive/40')}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    {conta.banco}
                  </CardTitle>
                  {conta.alertaBaixo && (
                    <Badge variant="destructive" className="text-[10px]">Saldo Baixo</Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {conta.empresaNome} • Ag {conta.agencia} / Cc {conta.conta}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Saldo Atual</span>
                  <span className={cn('font-bold tabular-nums', conta.saldo_atual >= 0 ? 'text-foreground' : 'text-destructive')}>
                    {formatCurrency(conta.saldo_atual || 0)}
                  </span>
                </div>
                <Progress value={Math.max(0, Math.min(pct, 100))} className="h-1.5" />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                    <span className="text-muted-foreground">Receber:</span>
                    <span className="font-medium">{formatCurrency(conta.receberPendente)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-destructive" />
                    <span className="text-muted-foreground">Pagar:</span>
                    <span className="font-medium">{formatCurrency(conta.pagarPendente)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Projetado</span>
                  <span className={cn('font-bold tabular-nums', conta.saldoProjetado >= 0 ? 'text-primary' : 'text-destructive')}>
                    {formatCurrency(conta.saldoProjetado)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
