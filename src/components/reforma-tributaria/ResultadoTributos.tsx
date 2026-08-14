import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, Landmark, AlertTriangle, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { ResultadoCalculo } from '@/lib/reforma-tributaria-calculator';

interface Props {
  resultado: ResultadoCalculo;
  anoReferencia: number;
  faseAtual: string;
}

export function ResultadoTributos({ resultado, anoReferencia, faseAtual }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resultado do Cálculo
          </CardTitle>
          <CardDescription>
            Tributos calculados para {anoReferencia} - Fase: {faseAtual.replace('_', ' ')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultado.detalhamento.some(d => d.includes('isenta')) ? (
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Operação Isenta</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {resultado.detalhamento.find(d => d.includes('isenta'))}
              </p>
            </div>
          ) : (
            <>
              {/* Tributos Novos */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Tributos Novos (IBS/CBS)
                </h4>

                <div className="flex items-center justify-between p-3 bg-cbs/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-cbs" />
                    <span>CBS (Federal)</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-cbs">{formatCurrency(resultado.valorCBS)}</p>
                    <p className="text-xs text-muted-foreground">{resultado.aliquotaCBS.toFixed(2)}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-ibs/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-ibs" />
                    <span>IBS (Est/Mun)</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-ibs">{formatCurrency(resultado.valorIBS)}</p>
                    <p className="text-xs text-muted-foreground">{resultado.aliquotaIBS.toFixed(2)}%</p>
                  </div>
                </div>

                {resultado.valorIS > 0 && (
                  <div className="flex items-center justify-between p-3 bg-imposto-seletivo/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-imposto-seletivo" />
                      <span>IS (Seletivo)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-imposto-seletivo">{formatCurrency(resultado.valorIS)}</p>
                      <p className="text-xs text-muted-foreground">{resultado.aliquotaIS.toFixed(2)}%</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Tributos Residuais */}
              {resultado.totalTributosAntigos > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Tributos Residuais (Transição)
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {resultado.icmsResidual > 0 && (
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">ICMS</span>
                        <span>{formatCurrency(resultado.icmsResidual)}</span>
                      </div>
                    )}
                    {resultado.issResidual > 0 && (
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">ISS</span>
                        <span>{formatCurrency(resultado.issResidual)}</span>
                      </div>
                    )}
                    {resultado.pisResidual > 0 && (
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">PIS</span>
                        <span>{formatCurrency(resultado.pisResidual)}</span>
                      </div>
                    )}
                    {resultado.cofinsResidual > 0 && (
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span className="text-muted-foreground">COFINS</span>
                        <span>{formatCurrency(resultado.cofinsResidual)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* Totais */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base de Cálculo</span>
                  <span className="font-semibold">{formatCurrency(resultado.valorBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tributos Novos</span>
                  <span className="font-semibold">{formatCurrency(resultado.totalTributosNovos)}</span>
                </div>
                {resultado.totalTributosAntigos > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tributos Antigos</span>
                    <span className="font-semibold">{formatCurrency(resultado.totalTributosAntigos)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Carga Tributária Total</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(resultado.totalTributosNovos + resultado.totalTributosAntigos)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alíquota Efetiva</span>
                  <Badge variant="secondary">
                    {resultado.cargaTributariaPercentual.toFixed(2)}%
                  </Badge>
                </div>
              </div>

              {/* Split Payment */}
              {resultado.valorTotalSplitPayment > 0 && (
                <>
                  <Separator />
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" />
                      Split Payment (Retenção Automática)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CBS Retido</span>
                        <span>{formatCurrency(resultado.valorSplitPaymentCBS)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">IBS Retido</span>
                        <span>{formatCurrency(resultado.valorSplitPaymentIBS)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <span className="font-medium">Valor Líquido a Receber</span>
                      <span className="font-bold text-accent">
                        {formatCurrency(resultado.valorBase - resultado.valorTotalSplitPayment)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Detalhamento do Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {resultado.detalhamento.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
