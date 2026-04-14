import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, AlertTriangle, DollarSign, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  taxaAproveitamentoCreditos: number;
  creditosDisponiveis: number;
  percentualMigracao: number;
  criticos: number;
}

export function MetricasInsights({ taxaAproveitamentoCreditos, creditosDisponiveis, percentualMigracao, criticos }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Insights Automáticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {taxaAproveitamentoCreditos < 80 && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">Baixo aproveitamento de créditos</p>
                  <p className="text-sm text-muted-foreground">
                    Apenas {taxaAproveitamentoCreditos.toFixed(1)}% dos créditos estão sendo utilizados. 
                    Revise as entradas para maximizar o aproveitamento.
                  </p>
                </div>
              </div>
            </div>
          )}
          {creditosDisponiveis > 50000 && (
            <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-secondary mt-0.5" />
                <div>
                  <p className="font-medium">Créditos acumulados disponíveis</p>
                  <p className="text-sm text-muted-foreground">
                    Você tem {formatCurrency(creditosDisponiveis)} em créditos disponíveis. 
                    Considere utilizar para compensação.
                  </p>
                </div>
              </div>
            </div>
          )}
          {percentualMigracao > 50 && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">Boa aderência à reforma</p>
                  <p className="text-sm text-muted-foreground">
                    {percentualMigracao.toFixed(0)}% dos tributos já estão no novo sistema IBS/CBS.
                  </p>
                </div>
              </div>
            </div>
          )}
          {criticos === 0 && (
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">Compliance em dia</p>
                  <p className="text-sm text-muted-foreground">
                    Não há alertas críticos pendentes. Todas as obrigações estão sob controle.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
