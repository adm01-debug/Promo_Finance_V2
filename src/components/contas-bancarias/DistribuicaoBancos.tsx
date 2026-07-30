import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Building2, type LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ContaBancaria } from '@/hooks/useFinancialData';

interface Props {
  contas: ContaBancaria[];
  saldoTotal: number;
  showSaldos: boolean;
  getBancoInfo: (banco: string) => { icon: LucideIcon; color: string };
}

export function DistribuicaoBancos({ contas, saldoTotal, showSaldos, getBancoInfo }: Props) {
  if (contas.length === 0) return null;

  const grupos = contas.reduce((acc, c) => {
    if (!acc[c.banco]) acc[c.banco] = { total: 0, count: 0 };
    acc[c.banco].total += c.saldo_atual;
    acc[c.banco].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Distribuição por Banco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(grupos).map(([banco, data]) => {
            const info = getBancoInfo(banco);
            const BancoIcon = info.icon;
            const percentual = saldoTotal > 0 ? (data.total / saldoTotal) * 100 : 0;
            return (
              <div key={banco} className="flex items-center gap-4">
                <div className={cn("p-2 rounded-lg", info.color)}>
                  <BancoIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{banco}</span>
                    <span className="text-sm text-muted-foreground">
                      {data.count} conta{data.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={percentual} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-24 text-right">
                      {showSaldos ? formatCurrency(data.total) : '••••••'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
