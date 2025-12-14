import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { LineChart as LineChartIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { CenarioTipo, CENARIOS_CONFIG, ProjecaoCenario } from '@/lib/cashflow-scenarios';
import { cn } from '@/lib/utils';

interface GraficoCenariosProps {
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>;
  cenarioDestaque?: CenarioTipo;
  limiteRuptura?: number;
  limiteRiscoAlto?: number;
}

export function GraficoCenarios({ 
  projecoes, 
  cenarioDestaque = 'realista',
  limiteRuptura = 0,
  limiteRiscoAlto = 50000,
}: GraficoCenariosProps) {
  // Formatar dados para o gráfico
  const dadosGrafico = useMemo(() => {
    const dadosRealista = projecoes.realista;
    
    return dadosRealista.map((dia, index) => ({
      data: dia.data.slice(5), // Remove ano
      dataCompleta: dia.data,
      otimista: projecoes.otimista[index]?.saldo || 0,
      realista: dia.saldo,
      pessimista: projecoes.pessimista[index]?.saldo || 0,
    }));
  }, [projecoes]);

  // Calcular range do Y
  const yRange = useMemo(() => {
    const allValues = dadosGrafico.flatMap(d => [d.otimista, d.realista, d.pessimista]);
    const min = Math.min(...allValues, limiteRuptura, limiteRiscoAlto);
    const max = Math.max(...allValues);
    return { min: min * 0.9, max: max * 1.1 };
  }, [dadosGrafico, limiteRuptura, limiteRiscoAlto]);

  // Calcular métricas de cada cenário
  const metricas = useMemo(() => {
    return {
      otimista: {
        saldoFinal: projecoes.otimista[projecoes.otimista.length - 1]?.saldo || 0,
        variacao: (projecoes.otimista[projecoes.otimista.length - 1]?.saldo || 0) - (projecoes.otimista[0]?.saldo || 0),
      },
      realista: {
        saldoFinal: projecoes.realista[projecoes.realista.length - 1]?.saldo || 0,
        variacao: (projecoes.realista[projecoes.realista.length - 1]?.saldo || 0) - (projecoes.realista[0]?.saldo || 0),
      },
      pessimista: {
        saldoFinal: projecoes.pessimista[projecoes.pessimista.length - 1]?.saldo || 0,
        variacao: (projecoes.pessimista[projecoes.pessimista.length - 1]?.saldo || 0) - (projecoes.pessimista[0]?.saldo || 0),
      },
    };
  }, [projecoes]);

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            Projeção Comparativa de Cenários
          </CardTitle>
          <div className="flex items-center gap-3">
            {(Object.keys(CENARIOS_CONFIG) as CenarioTipo[]).map((cenario) => {
              const config = CENARIOS_CONFIG[cenario];
              const metrica = metricas[cenario];
              const Icon = cenario === 'otimista' ? TrendingUp : cenario === 'pessimista' ? TrendingDown : Minus;
              
              return (
                <div 
                  key={cenario} 
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
                    cenarioDestaque === cenario ? "bg-accent border-primary/30" : "bg-background"
                  )}
                >
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: config.cor }}
                  />
                  <span className="text-xs font-medium">{config.nome}</span>
                  <span className={cn(
                    "text-xs font-bold flex items-center gap-0.5",
                    metrica.variacao >= 0 ? "text-success" : "text-destructive"
                  )}>
                    <Icon className="h-3 w-3" />
                    {metrica.variacao >= 0 ? '+' : ''}{(metrica.variacao / 1000).toFixed(0)}K
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dadosGrafico}>
            <defs>
              <linearGradient id="colorOtimista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CENARIOS_CONFIG.otimista.cor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={CENARIOS_CONFIG.otimista.cor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRealista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CENARIOS_CONFIG.realista.cor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={CENARIOS_CONFIG.realista.cor} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPessimista" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CENARIOS_CONFIG.pessimista.cor} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={CENARIOS_CONFIG.pessimista.cor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            
            <XAxis 
              dataKey="data" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              tickMargin={8}
            />
            <YAxis 
              tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={11}
              domain={[yRange.min, yRange.max]}
            />
            
            {/* Linhas de referência para limites */}
            <ReferenceLine 
              y={limiteRuptura} 
              stroke="hsl(0, 78%, 50%)" 
              strokeDasharray="5 5"
              label={{ value: 'Ruptura', position: 'right', fill: 'hsl(0, 78%, 50%)', fontSize: 10 }}
            />
            <ReferenceLine 
              y={limiteRiscoAlto} 
              stroke="hsl(40, 100%, 50%)" 
              strokeDasharray="5 5"
              label={{ value: 'Risco', position: 'right', fill: 'hsl(40, 100%, 50%)', fontSize: 10 }}
            />
            
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload;
                return `Data: ${data?.dataCompleta || label}`;
              }}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            />
            
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            
            {/* Área Otimista */}
            <Area 
              type="monotone" 
              dataKey="otimista" 
              stroke={CENARIOS_CONFIG.otimista.cor}
              fill="url(#colorOtimista)" 
              strokeWidth={cenarioDestaque === 'otimista' ? 3 : 1.5}
              strokeOpacity={cenarioDestaque === 'otimista' ? 1 : 0.6}
              name="Otimista"
            />
            
            {/* Área Realista */}
            <Area 
              type="monotone" 
              dataKey="realista" 
              stroke={CENARIOS_CONFIG.realista.cor}
              fill="url(#colorRealista)" 
              strokeWidth={cenarioDestaque === 'realista' ? 3 : 1.5}
              strokeOpacity={cenarioDestaque === 'realista' ? 1 : 0.6}
              name="Realista"
            />
            
            {/* Área Pessimista */}
            <Area 
              type="monotone" 
              dataKey="pessimista" 
              stroke={CENARIOS_CONFIG.pessimista.cor}
              fill="url(#colorPessimista)" 
              strokeWidth={cenarioDestaque === 'pessimista' ? 3 : 1.5}
              strokeOpacity={cenarioDestaque === 'pessimista' ? 1 : 0.6}
              name="Pessimista"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
