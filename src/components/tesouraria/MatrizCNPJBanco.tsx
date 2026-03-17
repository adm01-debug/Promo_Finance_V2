import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEmpresas, useContasBancarias } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function MatrizCNPJBanco() {
  const { data: empresas = [], isLoading: le } = useEmpresas();
  const { data: contas = [], isLoading: lc } = useContasBancarias();

  const isLoading = le || lc;

  const { bancos, matrizData, totaisBanco, totaisEmpresa, totalGeral } = useMemo(() => {
    // Unique banks
    const bancosSet = new Map<string, string>();
    contas.forEach((c: any) => {
      if (!bancosSet.has(c.banco)) bancosSet.set(c.banco, c.codigo_banco);
    });
    const bancos = Array.from(bancosSet.entries()).map(([nome, codigo]) => ({ nome, codigo }));

    // Build matrix
    const matrizData: Record<string, Record<string, { saldo: number; receber: number; pagar: number; contas: number }>> = {};
    
    empresas.forEach((emp) => {
      matrizData[emp.id] = {};
      bancos.forEach(b => {
        matrizData[emp.id][b.nome] = { saldo: 0, receber: 0, pagar: 0, contas: 0 };
      });
    });

    contas.forEach((c: any) => {
      if (matrizData[c.empresa_id]?.[c.banco]) {
        matrizData[c.empresa_id][c.banco].saldo += c.saldo_atual || 0;
        matrizData[c.empresa_id][c.banco].contas += 1;
      }
    });

    // Totals per bank
    const totaisBanco: Record<string, number> = {};
    bancos.forEach(b => {
      totaisBanco[b.nome] = empresas.reduce((s, emp) => s + (matrizData[emp.id]?.[b.nome]?.saldo || 0), 0);
    });

    // Totals per empresa
    const totaisEmpresa: Record<string, number> = {};
    empresas.forEach(emp => {
      totaisEmpresa[emp.id] = bancos.reduce((s, b) => s + (matrizData[emp.id]?.[b.nome]?.saldo || 0), 0);
    });

    const totalGeral = Object.values(totaisEmpresa).reduce((s, v) => s + v, 0);

    return { bancos, matrizData, totaisBanco, totaisEmpresa, totalGeral };
  }, [empresas, contas, pagar, receber]);

  if (isLoading) {
    return <Skeleton className="h-96 rounded-xl" />;
  }

  if (empresas.length === 0 || bancos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cadastre empresas e contas bancárias para visualizar a matriz.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Matriz CNPJ × Banco</CardTitle>
        <CardDescription>
          {empresas.length} empresa(s) × {bancos.length} banco(s) = {contas.length} conta(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-semibold text-muted-foreground sticky left-0 bg-card z-10 min-w-[180px]">
                Empresa / CNPJ
              </th>
              {bancos.map(b => (
                <th key={b.nome} className="text-right py-3 px-3 font-semibold text-muted-foreground min-w-[130px]">
                  <div className="flex flex-col items-end">
                    <span>{b.nome}</span>
                    <span className="text-xs font-normal">{b.codigo}</span>
                  </div>
                </th>
              ))}
              <th className="text-right py-3 px-3 font-bold text-foreground min-w-[130px] border-l border-border">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {empresas.map((emp, idx) => (
              <tr key={emp.id} className={cn('border-b border-border/50 hover:bg-muted/30 transition-colors', idx % 2 === 0 && 'bg-muted/10')}>
                <td className="py-3 px-2 sticky left-0 bg-card z-10">
                  <div>
                    <span className="font-medium text-foreground">{emp.nome_fantasia || emp.razao_social}</span>
                    <p className="text-xs text-muted-foreground font-mono">{emp.cnpj || '—'}</p>
                  </div>
                </td>
                {bancos.map(b => {
                  const cell = matrizData[emp.id]?.[b.nome];
                  const hasAccount = cell && cell.contas > 0;
                  return (
                    <td key={b.nome} className="text-right py-3 px-3">
                      {hasAccount ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-default">
                              <span className={cn('font-bold tabular-nums', cell.saldo >= 0 ? 'text-foreground' : 'text-destructive')}>
                                {formatCurrency(cell.saldo)}
                              </span>
                              <div className="flex items-center justify-end gap-1 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {cell.contas} ct
                                </Badge>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{cell.contas} conta(s) neste banco</p>
                            <p>Saldo: {formatCurrency(cell.saldo)}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="text-right py-3 px-3 border-l border-border">
                  <span className={cn('font-bold tabular-nums text-base', totaisEmpresa[emp.id] >= 0 ? 'text-primary' : 'text-destructive')}>
                    {formatCurrency(totaisEmpresa[emp.id] || 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/20">
              <td className="py-3 px-2 font-bold text-foreground sticky left-0 bg-muted/20 z-10">
                Total por Banco
              </td>
              {bancos.map(b => (
                <td key={b.nome} className="text-right py-3 px-3">
                  <span className={cn('font-bold tabular-nums', totaisBanco[b.nome] >= 0 ? 'text-foreground' : 'text-destructive')}>
                    {formatCurrency(totaisBanco[b.nome] || 0)}
                  </span>
                </td>
              ))}
              <td className="text-right py-3 px-3 border-l border-border">
                <span className={cn('font-extrabold tabular-nums text-lg', totalGeral >= 0 ? 'text-primary' : 'text-destructive')}>
                  {formatCurrency(totalGeral)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
