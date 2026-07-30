import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/formatters';

const CORES_GRAFICO = [
  'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(220, 70%, 50%)',
  'hsl(160, 70%, 40%)', 'hsl(280, 70%, 50%)', 'hsl(30, 80%, 50%)',
];

interface Totais {
  cbsAPagar: number; ibsAPagar: number; isAPagar: number;
  pisResidual: number; cofinsResidual: number; icmsResidual: number; issResidual: number;
}

interface Props {
  totais: Totais;
  faturamentoPeriodo: number;
  cargaTributariaEfetiva: number;
}

export function CargaEfetivaTab({ totais, faturamentoPeriodo, cargaTributariaEfetiva }: Props) {
  const composicao = [
    { nome: 'CBS', valor: totais.cbsAPagar },
    { nome: 'IBS', valor: totais.ibsAPagar },
    { nome: 'IS', valor: totais.isAPagar },
    { nome: 'PIS (Res.)', valor: totais.pisResidual },
    { nome: 'COFINS (Res.)', valor: totais.cofinsResidual },
    { nome: 'ICMS (Res.)', valor: totais.icmsResidual },
  ].filter(t => t.valor > 0);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Análise de Carga Tributária Efetiva</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-4">Composição da Carga</h4>
            <div className="space-y-3">
              {composicao.map((tributo, i) => {
                const percentual = faturamentoPeriodo > 0 ? (tributo.valor / faturamentoPeriodo) * 100 : 0;
                return (
                  <div key={tributo.nome} className="flex items-center gap-3">
                    <div className="w-20 text-sm font-medium">{tributo.nome}</div>
                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(percentual * 5, 100)}%`, backgroundColor: CORES_GRAFICO[i % CORES_GRAFICO.length] }} />
                    </div>
                    <div className="w-16 text-right text-sm">{percentual.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-6 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-4">Resumo Executivo</h4>
            <div className="space-y-4">
              <div className="flex justify-between"><span>Faturamento Período</span><span className="font-bold">{formatCurrency(faturamentoPeriodo)}</span></div>
              <div className="flex justify-between"><span>Total Tributos Novos</span><span className="font-medium text-blue-600">{formatCurrency(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar)}</span></div>
              <div className="flex justify-between"><span>Total Tributos Residuais</span><span className="font-medium text-orange-600">{formatCurrency(totais.pisResidual + totais.cofinsResidual + totais.icmsResidual + totais.issResidual)}</span></div>
              <Separator />
              <div className="flex justify-between text-lg"><span className="font-bold">Carga Tributária Efetiva</span><span className="font-bold text-primary">{cargaTributariaEfetiva.toFixed(2)}%</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
