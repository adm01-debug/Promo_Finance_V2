import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart3, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface ResultadoSimulacao {
  totalAntigo: number;
  totalNovo: number;
  cargaAntigaPercentual: number;
  cargaNovaPercentual: number;
  diferencaAbsoluta: number;
  diferencaPercentual: number;
  impacto: 'economia' | 'aumento' | 'neutro' | string;
  creditosCBSRecuperaveis: number;
  creditosIBSRecuperaveis: number;
  creditosTotalRecuperaveis: number;
  observacoes: string[];
}

interface SimuladorResultadoCardProps {
  resultado: ResultadoSimulacao;
  anoReferencia: number;
}

export function SimuladorResultadoCard({ resultado, anoReferencia }: SimuladorResultadoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Comparativo {anoReferencia}
        </CardTitle>
        <CardDescription>Sistema antigo vs novo modelo IBS/CBS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Sistema Antigo</p>
            <p className="text-2xl font-bold">{formatCurrency(resultado.totalAntigo)}</p>
            <p className="text-xs text-muted-foreground">
              {resultado.cargaAntigaPercentual.toFixed(2)}% do faturamento
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Sistema Novo</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(resultado.totalNovo)}</p>
            <p className="text-xs text-muted-foreground">
              {resultado.cargaNovaPercentual.toFixed(2)}% do faturamento
            </p>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border-2 ${
            resultado.impacto === 'economia'
              ? 'bg-success/5 border-success/20'
              : resultado.impacto === 'aumento'
                ? 'bg-destructive/5 border-destructive/20'
                : 'bg-muted border-border'
          }`}
        >
          <div className="flex items-center gap-3">
            {resultado.impacto === 'economia' ? (
              <TrendingDown className="h-8 w-8 text-success" />
            ) : resultado.impacto === 'aumento' ? (
              <TrendingUp className="h-8 w-8 text-destructive" />
            ) : (
              <Minus className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p
                className={`font-semibold ${
                  resultado.impacto === 'economia'
                    ? 'text-success'
                    : resultado.impacto === 'aumento'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                }`}
              >
                {resultado.impacto === 'economia'
                  ? `Economia de ${formatCurrency(Math.abs(resultado.diferencaAbsoluta))}`
                  : resultado.impacto === 'aumento'
                    ? `Aumento de ${formatCurrency(resultado.diferencaAbsoluta)}`
                    : 'Impacto Neutro'}
              </p>
              <p className="text-sm text-muted-foreground">
                Variação de {resultado.diferencaPercentual.toFixed(2)}% na carga tributária
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/10 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Créditos Recuperáveis (Não-Cumulatividade Plena)</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CBS</span>
              <span className="font-semibold">{formatCurrency(resultado.creditosCBSRecuperaveis)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IBS</span>
              <span className="font-semibold">{formatCurrency(resultado.creditosIBSRecuperaveis)}</span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-medium">
            <span>Total Créditos</span>
            <span className="text-secondary">{formatCurrency(resultado.creditosTotalRecuperaveis)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Observações</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {resultado.observacoes.map((obs, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
