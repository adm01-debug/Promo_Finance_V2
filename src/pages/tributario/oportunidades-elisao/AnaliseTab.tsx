// @ts-nocheck — depende de types de elisão dinâmicos
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Banknote, CheckCircle2, Scale, SearchX, Upload, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { RISCO_BADGE } from './constants';
import type { RelatorioElisao, OportunidadeDetectada } from '@/lib/tributario/elisao';

export function AnaliseTab({ relatorio }: { relatorio: RelatorioElisao }) {
  const navigate = useNavigate();
  return (
    <TabsContent value="analise" className="space-y-4 mt-4">
      {relatorio.total_aplicaveis === 0 && relatorio.total_oportunidades > 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="p-4 rounded-full bg-muted/50">
              <SearchX className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-semibold">Nenhuma oportunidade aplicável encontrada</h3>
              <p className="text-sm text-muted-foreground">
                O motor avaliou {relatorio.total_oportunidades} estratégias, mas nenhuma se enquadra no perfil
                atual da empresa. Importe 12 meses de histórico de faturamento e folha para uma análise mais
                precisa.
              </p>
            </div>
            <Button onClick={() => navigate('/tributario/historico')} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Importar histórico tributário
            </Button>
          </CardContent>
        </Card>
      )}
      {relatorio.oportunidades.map((o: OportunidadeDetectada) => (
        <Card
          key={o.estrategia}
          className={o.aplicavel ? 'border-primary/30' : 'opacity-60'}
          aria-label={`Estratégia ${o.nome} — ${o.aplicavel ? 'aplicável' : 'não aplicável'} — risco ${o.risco}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {o.aplicavel ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  {o.nome}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Scale className="h-3 w-3" />
                  {o.base_legal}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className={RISCO_BADGE[o.risco]} variant="outline">
                  Risco {o.risco}
                </Badge>
                {o.aplicavel && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Economia estimada</div>
                    <div className="font-bold text-primary flex items-center gap-1">
                      <Banknote className="h-4 w-4" />
                      {formatCurrency(o.economia_estimada)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{o.justificativa}</p>
            {o.aplicavel && (
              <div className="rounded-md bg-muted/50 p-3">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Próximos passos</div>
                <ul className="space-y-1 text-sm">
                  {o.proximos_passos.map((p: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {o.observacoes && (
              <Alert>
                <AlertDescription className="text-xs">{o.observacoes}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </TabsContent>
  );
}
