import { TrendingDown, Target, ShieldCheck, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ElisaoStatCardsProps {
  economiaTotal: number;
}

export function ElisaoStatCards({ economiaTotal }: ElisaoStatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-emerald-500/5 border-emerald-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Economia Potencial (Total)</CardTitle>
          <TrendingDown className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">
            R$ {economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-emerald-600/70 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Baseado em 12 meses de análise
          </p>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Gap de Eficiência</CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">8.4%</div>
          <Progress value={8.4} className="h-1.5 mt-2" />
          <p className="text-[10px] text-muted-foreground mt-1">
            Imposto pago acima do cenário otimizado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Regime Atual</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Lucro Presumido</div>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-[9px]">
              PIS/COFINS Cumulativo
            </Badge>
            <Badge variant="outline" className="text-[9px]">
              ICMS-ST
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
