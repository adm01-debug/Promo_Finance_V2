import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dice5, TrendingUp, TrendingDown, Target, Info, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ProjecaoFluxo {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface SimulacaoMonteCarloProps {
  projecoes: ProjecaoFluxo[];
  saldoInicial: number;
  isLoading?: boolean;
}

interface ResultadoMonteCarlo {
  percentil10: number[];
  percentil50: number[];
  percentil90: number[];
  probabilidadeRuptura: number;
  saldoMedioFinal: number;
  desviopadrao: number;
}

// Função para simular cenários usando Monte Carlo
function executarMonteCarlo(
  projecoes: ProjecaoFluxo[],
  saldoInicial: number,
  numSimulacoes: number = 1000
): ResultadoMonteCarlo {
  if (projecoes.length === 0) {
    return {
      percentil10: [],
      percentil50: [],
      percentil90: [],
      probabilidadeRuptura: 0,
      saldoMedioFinal: saldoInicial,
      desviopadrao: 0,
    };
  }

  const dias = projecoes.length;
  const simulacoes: number[][] = [];

  // Calcular variabilidade histórica (simulando com +/- 20% de variação)
  const variacaoReceita = 0.20;
  const variacaoDespesa = 0.15;

  // Executar N simulações
  for (let s = 0; s < numSimulacoes; s++) {
    const saldos: number[] = [];
    let saldoAtual = saldoInicial;

    for (let d = 0; d < dias; d++) {
      const proj = projecoes[d];
      
      // Aplicar variação aleatória (distribuição normal aproximada)
      const fatorReceita = 1 + (Math.random() - 0.5) * 2 * variacaoReceita;
      const fatorDespesa = 1 + (Math.random() - 0.5) * 2 * variacaoDespesa;
      
      const receitaSimulada = proj.receitas * fatorReceita;
      const despesaSimulada = proj.despesas * fatorDespesa;
      
      saldoAtual = saldoAtual + receitaSimulada - despesaSimulada;
      saldos.push(saldoAtual);
    }
    
    simulacoes.push(saldos);
  }

  // Calcular percentis para cada dia
  const percentil10: number[] = [];
  const percentil50: number[] = [];
  const percentil90: number[] = [];

  for (let d = 0; d < dias; d++) {
    const saldosDia = simulacoes.map(sim => sim[d]).sort((a, b) => a - b);
    percentil10.push(saldosDia[Math.floor(numSimulacoes * 0.10)]);
    percentil50.push(saldosDia[Math.floor(numSimulacoes * 0.50)]);
    percentil90.push(saldosDia[Math.floor(numSimulacoes * 0.90)]);
  }

  // Calcular probabilidade de ruptura (saldo < 0 em algum momento)
  const simulacoesComRuptura = simulacoes.filter(sim => sim.some(s => s < 0)).length;
  const probabilidadeRuptura = (simulacoesComRuptura / numSimulacoes) * 100;

  // Saldo médio final e desvio padrão
  const saldosFinais = simulacoes.map(sim => sim[sim.length - 1]);
  const saldoMedioFinal = saldosFinais.reduce((a, b) => a + b, 0) / numSimulacoes;
  const variancia = saldosFinais.reduce((sum, s) => sum + Math.pow(s - saldoMedioFinal, 2), 0) / numSimulacoes;
  const desviopadrao = Math.sqrt(variancia);

  return {
    percentil10,
    percentil50,
    percentil90,
    probabilidadeRuptura,
    saldoMedioFinal,
    desviopadrao,
  };
}

export function SimulacaoMonteCarlo({ 
  projecoes, 
  saldoInicial,
  isLoading = false 
}: SimulacaoMonteCarloProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [seed, setSeed] = useState(0);

  const resultado = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = seed; // trigger recalculation
    return executarMonteCarlo(projecoes, saldoInicial, 1000);
  }, [projecoes, saldoInicial, seed]);

  const handleReSimular = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSeed(prev => prev + 1);
      setIsSimulating(false);
    }, 500);
  };

  // Dados para o gráfico
  const dadosGrafico = projecoes.map((proj, idx) => ({
    data: proj.data.slice(5),
    p10: resultado.percentil10[idx] || 0,
    p50: resultado.percentil50[idx] || 0,
    p90: resultado.percentil90[idx] || 0,
  }));

  // Cor baseada na probabilidade de ruptura
  const getCorRisco = () => {
    if (resultado.probabilidadeRuptura <= 5) return 'text-success';
    if (resultado.probabilidadeRuptura <= 20) return 'text-warning';
    return 'text-destructive';
  };

  if (isLoading || projecoes.length === 0) {
    return (
      <Card className="card-elevated">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-[200px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Dice5 className="h-5 w-5 text-primary" />
              Simulação Monte Carlo
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>1.000 simulações com variação de ±20% nas receitas e ±15% nas despesas. 
                    O intervalo de confiança de 80% mostra a faixa entre os percentis 10 e 90.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReSimular}
              disabled={isSimulating}
              className="gap-2"
            >
              {isSimulating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Re-simular
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Métricas principais */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Prob. Ruptura</p>
              <p className={cn("text-xl font-bold font-display", getCorRisco())}>
                {resultado.probabilidadeRuptura.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Saldo Médio Final</p>
              <p className={cn(
                "text-xl font-bold font-display",
                resultado.saldoMedioFinal >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(resultado.saldoMedioFinal)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Desvio Padrão</p>
              <p className="text-xl font-bold font-display text-muted-foreground">
                ±{formatCurrency(resultado.desviopadrao)}
              </p>
            </div>
          </div>

          {/* Gráfico com intervalos de confiança */}
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="gradientConfidence" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="data" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(v) => `${(v/1000).toFixed(0)}K`}
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={10}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(v: number, name: string) => [
                    formatCurrency(v),
                    name === 'p10' ? 'Pessimista (P10)' : name === 'p50' ? 'Mediana (P50)' : 'Otimista (P90)'
                  ]}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                
                {/* Área de confiança (P10-P90) */}
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="url(#gradientConfidence)"
                  fillOpacity={1}
                />
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="none"
                  fill="hsl(var(--card))"
                  fillOpacity={1}
                />
                
                {/* Linhas de percentis */}
                <Area
                  type="monotone"
                  dataKey="p10"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                  name="p10"
                />
                <Area
                  type="monotone"
                  dataKey="p50"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="none"
                  name="p50"
                />
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="hsl(var(--success))"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                  name="p90"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 bg-destructive" style={{ borderTop: '2px dashed' }} />
              <span className="text-muted-foreground">Pessimista (P10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 bg-primary" />
              <span className="text-muted-foreground">Mediana (P50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-0.5 w-4 bg-success" style={{ borderTop: '2px dashed' }} />
              <span className="text-muted-foreground">Otimista (P90)</span>
            </div>
          </div>

          {/* Alerta se risco alto */}
          {resultado.probabilidadeRuptura > 20 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <TrendingDown className="h-4 w-4" />
              <span>Risco elevado de ruptura de caixa. Considere antecipar recebíveis ou postergar pagamentos.</span>
            </div>
          )}

          {resultado.probabilidadeRuptura <= 5 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Baixo risco. Fluxo de caixa saudável com alta margem de segurança.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
