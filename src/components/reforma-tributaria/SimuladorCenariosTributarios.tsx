// ============================================
// SIMULADOR DE CENÁRIOS TRIBUTÁRIOS
// Comparação sistema antigo vs novo
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  BarChart3, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Minus,
  Scale,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { formatCurrency } from '@/lib/formatters';
import { RegimeEspecial, CategoriaIS } from '@/types/reforma-tributaria';

export function SimuladorCenariosTributarios() {
  const { 
    executarSimulacao, 
    isSimulando,
    simularCenario,
    regimesEspeciais,
    anoReferencia,
  } = useReformaTributaria();

  // Estado do formulário
  const [faturamentoAnual, setFaturamentoAnual] = useState(5000000);
  const [comprasAnual, setComprasAnual] = useState(2500000);
  const [servicosTomadosAnual, setServicosTomadosAnual] = useState(500000);
  const [percentualVendas, setPercentualVendas] = useState(80);
  const [percentualServicos, setPercentualServicos] = useState(20);
  const [regimeEspecial, setRegimeEspecial] = useState<RegimeEspecial>('nenhum');
  const [temProdutosIS, setTemProdutosIS] = useState(false);
  const [categoriaIS, setCategoriaIS] = useState<CategoriaIS>('bebidas_alcoolicas');

  const [resultadosProjecao, setResultadosProjecao] = useState<{ ano: number; resultado: ReturnType<typeof simularCenario> }[]>([]);

  // Resultado para o ano selecionado
  const resultadoAtual = useMemo(() => {
    return simularCenario({
      faturamentoAnual,
      comprasAnual,
      servicosTomadosAnual,
      percentualVendas,
      percentualServicos,
      regimeEspecial,
      temProdutosIS,
      categoriaIS: temProdutosIS ? categoriaIS : undefined,
    }, anoReferencia);
  }, [faturamentoAnual, comprasAnual, servicosTomadosAnual, percentualVendas, percentualServicos, regimeEspecial, temProdutosIS, categoriaIS, anoReferencia, simularCenario]);

  // Executar projeção para todos os anos
  const handleExecutarProjecao = async () => {
    const dados = {
      faturamentoAnual,
      comprasAnual,
      servicosTomadosAnual,
      percentualVendas,
      percentualServicos,
      regimeEspecial,
      temProdutosIS,
      categoriaIS: temProdutosIS ? categoriaIS : undefined,
    };

    const resultados = await executarSimulacao(dados);
    setResultadosProjecao(resultados);
  };

  // Dados para gráfico de barras comparativo
  const dadosComparativo = [
    { 
      categoria: 'ICMS', 
      antigo: resultadoAtual.icmsAntigo, 
      novo: 0,
    },
    { 
      categoria: 'ISS', 
      antigo: resultadoAtual.issAntigo, 
      novo: 0,
    },
    { 
      categoria: 'PIS', 
      antigo: resultadoAtual.pisAntigo, 
      novo: 0,
    },
    { 
      categoria: 'COFINS', 
      antigo: resultadoAtual.cofinsAntigo, 
      novo: 0,
    },
    { 
      categoria: 'CBS', 
      antigo: 0, 
      novo: resultadoAtual.cbsNovo,
    },
    { 
      categoria: 'IBS', 
      antigo: 0, 
      novo: resultadoAtual.ibsNovo,
    },
    { 
      categoria: 'IS', 
      antigo: 0, 
      novo: resultadoAtual.isNovo,
    },
  ].filter(d => d.antigo > 0 || d.novo > 0);

  // Dados para gráfico de linha (projeção temporal)
  const dadosProjecao = resultadosProjecao.map(({ ano, resultado }) => ({
    ano: String(ano),
    antigo: resultado.totalAntigo,
    novo: resultado.totalNovo,
    diferenca: resultado.totalNovo - resultado.totalAntigo,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Formulário de Entrada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Configure os parâmetros para simulação comparativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Faturamento */}
            <div className="space-y-2">
              <Label>Faturamento Anual</Label>
              <Input
                type="number"
                value={faturamentoAnual}
                onChange={(e) => setFaturamentoAnual(Number(e.target.value))}
                min={0}
                step={100000}
              />
              <p className="text-xs text-muted-foreground">
                {formatCurrency(faturamentoAnual)}
              </p>
            </div>

            {/* Distribuição Vendas/Serviços */}
            <div className="space-y-4">
              <Label>Distribuição do Faturamento</Label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Vendas de Produtos: {percentualVendas}%</span>
                  <span>Serviços: {percentualServicos}%</span>
                </div>
                <Slider
                  value={[percentualVendas]}
                  onValueChange={([v]) => {
                    setPercentualVendas(v);
                    setPercentualServicos(100 - v);
                  }}
                  max={100}
                  step={5}
                />
              </div>
            </div>

            {/* Compras e Serviços Tomados */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Compras Anuais</Label>
                <Input
                  type="number"
                  value={comprasAnual}
                  onChange={(e) => setComprasAnual(Number(e.target.value))}
                  min={0}
                  step={50000}
                />
              </div>
              <div className="space-y-2">
                <Label>Serviços Tomados</Label>
                <Input
                  type="number"
                  value={servicosTomadosAnual}
                  onChange={(e) => setServicosTomadosAnual(Number(e.target.value))}
                  min={0}
                  step={50000}
                />
              </div>
            </div>

            <Separator />

            {/* Regime Especial */}
            <div className="space-y-2">
              <Label>Regime Especial</Label>
              <Select 
                value={regimeEspecial} 
                onValueChange={(v) => setRegimeEspecial(v as RegimeEspecial)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Nenhum (alíquota padrão)</SelectItem>
                  {regimesEspeciais.map((regime) => (
                    <SelectItem key={regime.regime} value={regime.regime}>
                      {regime.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Imposto Seletivo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Produtos Sujeitos ao IS</Label>
                  <p className="text-xs text-muted-foreground">Imposto Seletivo sobre produtos nocivos</p>
                </div>
                <Switch checked={temProdutosIS} onCheckedChange={setTemProdutosIS} />
              </div>
              
              {temProdutosIS && (
                <Select 
                  value={categoriaIS} 
                  onValueChange={(v) => setCategoriaIS(v as CategoriaIS)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebidas_alcoolicas">Bebidas Alcoólicas</SelectItem>
                    <SelectItem value="bebidas_acucaradas">Bebidas Açucaradas</SelectItem>
                    <SelectItem value="produtos_fumigenos">Produtos Fumígenos</SelectItem>
                    <SelectItem value="veiculos">Veículos</SelectItem>
                    <SelectItem value="combustiveis_fosseis">Combustíveis Fósseis</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button 
              className="w-full" 
              onClick={handleExecutarProjecao}
              disabled={isSimulando}
            >
              {isSimulando ? 'Calculando...' : 'Projetar 2026-2033'}
            </Button>
          </CardContent>
        </Card>

        {/* Resultado Comparativo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparativo {anoReferencia}
            </CardTitle>
            <CardDescription>
              Sistema antigo vs novo modelo IBS/CBS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Sistema Antigo</p>
                <p className="text-2xl font-bold">{formatCurrency(resultadoAtual.totalAntigo)}</p>
                <p className="text-xs text-muted-foreground">
                  {resultadoAtual.cargaAntigaPercentual.toFixed(2)}% do faturamento
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Sistema Novo</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(resultadoAtual.totalNovo)}</p>
                <p className="text-xs text-muted-foreground">
                  {resultadoAtual.cargaNovaPercentual.toFixed(2)}% do faturamento
                </p>
              </div>
            </div>

            {/* Indicador de Impacto */}
            <div className={`p-4 rounded-lg border-2 ${
              resultadoAtual.impacto === 'economia' 
                ? 'bg-success/5 border-success/20' 
                : resultadoAtual.impacto === 'aumento'
                  ? 'bg-destructive/5 border-destructive/20'
                  : 'bg-muted border-border'
            }`}>
              <div className="flex items-center gap-3">
                {resultadoAtual.impacto === 'economia' ? (
                  <TrendingDown className="h-8 w-8 text-success" />
                ) : resultadoAtual.impacto === 'aumento' ? (
                  <TrendingUp className="h-8 w-8 text-destructive" />
                ) : (
                  <Minus className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className={`font-semibold ${
                    resultadoAtual.impacto === 'economia' 
                      ? 'text-success' 
                      : resultadoAtual.impacto === 'aumento'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  }`}>
                    {resultadoAtual.impacto === 'economia' 
                      ? `Economia de ${formatCurrency(Math.abs(resultadoAtual.diferencaAbsoluta))}`
                      : resultadoAtual.impacto === 'aumento'
                        ? `Aumento de ${formatCurrency(resultadoAtual.diferencaAbsoluta)}`
                        : 'Impacto Neutro'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Variação de {resultadoAtual.diferencaPercentual.toFixed(2)}% na carga tributária
                  </p>
                </div>
              </div>
            </div>

            {/* Créditos */}
            <div className="p-4 bg-secondary/10 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Créditos Recuperáveis (Não-Cumulatividade Plena)</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CBS</span>
                  <span className="font-semibold">{formatCurrency(resultadoAtual.creditosCBSRecuperaveis)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IBS</span>
                  <span className="font-semibold">{formatCurrency(resultadoAtual.creditosIBSRecuperaveis)}</span>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-medium">
                <span>Total Créditos</span>
                <span className="text-secondary">{formatCurrency(resultadoAtual.creditosTotalRecuperaveis)}</span>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Observações</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {resultadoAtual.observacoes.map((obs, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gráfico Comparativo por Tributo */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por Tributo</CardTitle>
            <CardDescription>Sistema antigo vs novo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosComparativo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="antigo" name="Sistema Antigo" fill="hsl(var(--muted-foreground))" />
                <Bar dataKey="novo" name="Sistema Novo" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projeção Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Projeção 2026-2033</CardTitle>
            <CardDescription>Evolução durante a transição</CardDescription>
          </CardHeader>
          <CardContent>
            {resultadosProjecao.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosProjecao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                  <Line 
                    type="monotone" 
                    dataKey="antigo" 
                    name="Sistema Antigo"
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="novo" 
                    name="Sistema Novo"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Clique em "Projetar 2026-2033" para visualizar</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SimuladorCenariosTributarios;
