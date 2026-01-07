import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  RotateCcw,
  Save,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Calculator,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';

interface CenarioSimulacao {
  id: string;
  nome: string;
  descricao: string;
  variaveis: {
    receitaVariacao: number;
    despesaVariacao: number;
    inadimplenciaVariacao: number;
    diasAntecipacao: number;
  };
}

interface SimuladorCenariosProps {
  saldoAtual: number;
  receitasPrevistas: number;
  despesasPrevistas: number;
  taxaInadimplencia: number;
}

const CENARIOS_PREDEFINIDOS: CenarioSimulacao[] = [
  {
    id: 'otimista',
    nome: 'Otimista',
    descricao: 'Aumento de receitas e redução de inadimplência',
    variaveis: { receitaVariacao: 15, despesaVariacao: -5, inadimplenciaVariacao: -30, diasAntecipacao: 5 },
  },
  {
    id: 'conservador',
    nome: 'Conservador',
    descricao: 'Cenário atual sem grandes mudanças',
    variaveis: { receitaVariacao: 0, despesaVariacao: 0, inadimplenciaVariacao: 0, diasAntecipacao: 0 },
  },
  {
    id: 'pessimista',
    nome: 'Pessimista',
    descricao: 'Queda de receitas e aumento de inadimplência',
    variaveis: { receitaVariacao: -20, despesaVariacao: 10, inadimplenciaVariacao: 50, diasAntecipacao: -10 },
  },
];

export function SimuladorCenarios({
  saldoAtual,
  receitasPrevistas,
  despesasPrevistas,
  taxaInadimplencia,
}: SimuladorCenariosProps) {
  const [cenarioAtivo, setCenarioAtivo] = useState<string>('conservador');
  const [variaveis, setVariaveis] = useState({
    receitaVariacao: 0,
    despesaVariacao: 0,
    inadimplenciaVariacao: 0,
    diasAntecipacao: 0,
  });
  const [showDetails, setShowDetails] = useState(false);

  const cenarioPredefinido = CENARIOS_PREDEFINIDOS.find(c => c.id === cenarioAtivo);

  const handleCenarioChange = useCallback((cenarioId: string) => {
    setCenarioAtivo(cenarioId);
    const cenario = CENARIOS_PREDEFINIDOS.find(c => c.id === cenarioId);
    if (cenario) {
      setVariaveis(cenario.variaveis);
    }
  }, []);

  const handleVariavelChange = useCallback((key: keyof typeof variaveis, value: number) => {
    setVariaveis(prev => ({ ...prev, [key]: value }));
    setCenarioAtivo('custom');
  }, []);

  const resultadoSimulacao = useMemo(() => {
    const receitaAjustada = receitasPrevistas * (1 + variaveis.receitaVariacao / 100);
    const despesaAjustada = despesasPrevistas * (1 + variaveis.despesaVariacao / 100);
    const inadimplenciaAjustada = taxaInadimplencia * (1 + variaveis.inadimplenciaVariacao / 100);
    
    const receitaEfetiva = receitaAjustada * (1 - inadimplenciaAjustada / 100);
    const saldoFinal = saldoAtual + receitaEfetiva - despesaAjustada;
    
    const variacaoSaldo = saldoFinal - (saldoAtual + receitasPrevistas * (1 - taxaInadimplencia / 100) - despesasPrevistas);
    
    // Gerar dados para gráfico de 30 dias
    const dadosGrafico = [];
    let saldoAcumulado = saldoAtual;
    const saldoAcumuladoBase = saldoAtual;
    let saldoBase = saldoAtual;
    
    for (let dia = 0; dia <= 30; dia++) {
      const receitaDia = (receitaEfetiva / 30);
      const despesaDia = (despesaAjustada / 30);
      const receitaDiaBase = (receitasPrevistas * (1 - taxaInadimplencia / 100)) / 30;
      const despesaDiaBase = despesasPrevistas / 30;
      
      saldoAcumulado += receitaDia - despesaDia;
      saldoBase += receitaDiaBase - despesaDiaBase;
      
      dadosGrafico.push({
        dia: `D${dia}`,
        simulado: Math.round(saldoAcumulado),
        base: Math.round(saldoBase),
      });
    }

    return {
      receitaAjustada,
      despesaAjustada,
      inadimplenciaAjustada,
      receitaEfetiva,
      saldoFinal,
      variacaoSaldo,
      impactoPercentual: ((saldoFinal - saldoAtual) / saldoAtual) * 100,
      dadosGrafico,
      isPositivo: saldoFinal >= saldoAtual,
      alertaRuptura: saldoFinal < 0,
    };
  }, [saldoAtual, receitasPrevistas, despesasPrevistas, taxaInadimplencia, variaveis]);

  const resetar = () => {
    handleCenarioChange('conservador');
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              Simulador de Cenários
            </CardTitle>
            <CardDescription>Análise what-if para decisões financeiras</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetar}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Resetar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cenários predefinidos */}
        <div className="flex flex-wrap gap-2">
          {CENARIOS_PREDEFINIDOS.map(cenario => (
            <Button
              key={cenario.id}
              variant={cenarioAtivo === cenario.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleCenarioChange(cenario.id)}
              className="flex-1 min-w-[80px] text-xs sm:text-sm"
            >
              {cenario.nome}
            </Button>
          ))}
          {cenarioAtivo === 'custom' && (
            <Badge variant="secondary" className="text-xs">Personalizado</Badge>
          )}
        </div>

        {/* Variáveis de simulação */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span>Ajustar variáveis</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Variação de Receitas</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[variaveis.receitaVariacao]}
                    onValueChange={([v]) => handleVariavelChange('receitaVariacao', v)}
                    min={-50}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className={cn(
                    "text-sm font-mono w-12 text-right",
                    variaveis.receitaVariacao > 0 ? "text-success" : variaveis.receitaVariacao < 0 ? "text-destructive" : ""
                  )}>
                    {variaveis.receitaVariacao > 0 ? '+' : ''}{variaveis.receitaVariacao}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Variação de Despesas</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[variaveis.despesaVariacao]}
                    onValueChange={([v]) => handleVariavelChange('despesaVariacao', v)}
                    min={-50}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className={cn(
                    "text-sm font-mono w-12 text-right",
                    variaveis.despesaVariacao < 0 ? "text-success" : variaveis.despesaVariacao > 0 ? "text-destructive" : ""
                  )}>
                    {variaveis.despesaVariacao > 0 ? '+' : ''}{variaveis.despesaVariacao}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Variação de Inadimplência</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[variaveis.inadimplenciaVariacao]}
                    onValueChange={([v]) => handleVariavelChange('inadimplenciaVariacao', v)}
                    min={-50}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className={cn(
                    "text-sm font-mono w-12 text-right",
                    variaveis.inadimplenciaVariacao < 0 ? "text-success" : variaveis.inadimplenciaVariacao > 0 ? "text-destructive" : ""
                  )}>
                    {variaveis.inadimplenciaVariacao > 0 ? '+' : ''}{variaveis.inadimplenciaVariacao}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Antecipação (dias)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[variaveis.diasAntecipacao]}
                    onValueChange={([v]) => handleVariavelChange('diasAntecipacao', v)}
                    min={-15}
                    max={15}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">
                    {variaveis.diasAntecipacao > 0 ? '+' : ''}{variaveis.diasAntecipacao}d
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Resultado da simulação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50 border">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Receita Efetiva</p>
            <p className="text-sm sm:text-lg font-bold text-success truncate">
              {formatCurrency(resultadoSimulacao.receitaEfetiva)}
            </p>
            <p className={cn(
              "text-[10px] sm:text-xs",
              variaveis.receitaVariacao > 0 ? "text-success" : variaveis.receitaVariacao < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {variaveis.receitaVariacao > 0 ? '+' : ''}{variaveis.receitaVariacao}% vs base
            </p>
          </div>

          <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50 border">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Despesas Ajustadas</p>
            <p className="text-sm sm:text-lg font-bold text-destructive truncate">
              {formatCurrency(resultadoSimulacao.despesaAjustada)}
            </p>
            <p className={cn(
              "text-[10px] sm:text-xs",
              variaveis.despesaVariacao < 0 ? "text-success" : variaveis.despesaVariacao > 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {variaveis.despesaVariacao > 0 ? '+' : ''}{variaveis.despesaVariacao}% vs base
            </p>
          </div>

          <div className={cn(
            "text-center p-2 sm:p-3 rounded-lg border",
            resultadoSimulacao.alertaRuptura 
              ? "bg-destructive/10 border-destructive/30" 
              : resultadoSimulacao.isPositivo 
                ? "bg-success/10 border-success/30" 
                : "bg-warning/10 border-warning/30"
          )}>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo Final</p>
            <p className={cn(
              "text-sm sm:text-lg font-bold truncate",
              resultadoSimulacao.alertaRuptura 
                ? "text-destructive" 
                : resultadoSimulacao.isPositivo 
                  ? "text-success" 
                  : "text-warning"
            )}>
              {formatCurrency(resultadoSimulacao.saldoFinal)}
            </p>
            <div className="flex items-center justify-center gap-1">
              {resultadoSimulacao.variacaoSaldo > 0 ? (
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-success" />
              ) : resultadoSimulacao.variacaoSaldo < 0 ? (
                <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-destructive" />
              ) : null}
              <span className={cn(
                "text-[10px] sm:text-xs truncate",
                resultadoSimulacao.variacaoSaldo > 0 ? "text-success" : resultadoSimulacao.variacaoSaldo < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {resultadoSimulacao.variacaoSaldo > 0 ? '+' : ''}
                {formatCurrency(resultadoSimulacao.variacaoSaldo)}
              </span>
            </div>
          </div>
        </div>

        {/* Alerta de ruptura */}
        {resultadoSimulacao.alertaRuptura && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Alerta de Ruptura</p>
              <p className="text-sm text-muted-foreground">
                Este cenário resulta em saldo negativo. Considere ajustar as variáveis ou tomar ações preventivas.
              </p>
            </div>
          </div>
        )}

        {/* Gráfico de projeção */}
        <div className="h-[160px] sm:h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={resultadoSimulacao.dadosGrafico} margin={{ left: -10, right: 5 }}>
              <defs>
                <linearGradient id="simuladoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="dia" 
                tick={{ fontSize: 9 }} 
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 9 }} 
                tickLine={false}
                axisLine={false}
                width={35}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="base"
                name="Base"
                stroke="hsl(var(--muted-foreground))"
                fill="url(#baseGradient)"
                strokeWidth={1}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="simulado"
                name="Simulação"
                stroke="hsl(var(--primary))"
                fill="url(#simuladoGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Insights */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/30">
          <Lightbulb className="h-5 w-5 text-accent mt-0.5" />
          <div>
            <p className="font-medium text-sm">Insight</p>
            <p className="text-sm text-muted-foreground">
              {resultadoSimulacao.impactoPercentual > 10 
                ? `Este cenário aumenta seu saldo em ${resultadoSimulacao.impactoPercentual.toFixed(1)}%. Considere ações para alcançá-lo.`
                : resultadoSimulacao.impactoPercentual < -10
                  ? `Este cenário reduz seu saldo em ${Math.abs(resultadoSimulacao.impactoPercentual).toFixed(1)}%. Prepare contingências.`
                  : `Variação moderada de ${resultadoSimulacao.impactoPercentual.toFixed(1)}% no saldo. Cenário estável.`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
