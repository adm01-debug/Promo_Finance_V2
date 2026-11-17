import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Banknote, CheckCircle2, Scale, SearchX, Upload, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';
import { CATALOGO_PARA_DETECTOR, RISCO_BADGE } from './constants';
import type { RelatorioElisao, OportunidadeDetectada } from '@/lib/tributario/elisao';

export interface EstrategiaCatalogo {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  tipo: string | null;
  economia_estimada_padrao: number | null;
  ativo: boolean;
}

export function AnaliseTab({
  relatorio,
  catalogo = [],
}: {
  relatorio: RelatorioElisao;
  catalogo?: EstrategiaCatalogo[];
}) {
  const navigate = useNavigate();

  // Estratégias catalogadas que o motor não avalia: o código do catálogo não tem
  // detector correspondente (nem direto, nem via CATALOGO_PARA_DETECTOR).
  const avaliados = new Set(relatorio.oportunidades.map((o) => o.estrategia));
  const naoAvaliadas = catalogo.filter(
    (c) => !avaliados.has(c.codigo) && !avaliados.has(CATALOGO_PARA_DETECTOR[c.codigo] ?? '')
  );
  const economiaCatalogada = naoAvaliadas.reduce(
    (acc, c) => acc + Number(c.economia_estimada_padrao ?? 0),
    0
  );

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
                O motor avaliou {relatorio.total_oportunidades} estratégias, mas nenhuma se enquadra
                no perfil atual da empresa. Importe 12 meses de histórico de faturamento e folha
                para uma análise mais precisa.
              </p>
            </div>
            <Button
              onClick={() => navigate('/tributario/historico')}
              variant="outline"
              className="gap-2"
            >
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
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Próximos passos
                </div>
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

      {naoAvaliadas.length > 0 && (
        <Card className="border-dashed border-warning/40">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  Catalogadas, ainda não avaliadas automaticamente
                </CardTitle>
                <CardDescription>
                  {naoAvaliadas.length} de {catalogo.length} estratégias do catálogo não têm
                  detector no motor. Os valores abaixo são a estimativa de referência do catálogo,
                  não um cálculo para esta empresa — exigem análise manual do contador.
                </CardDescription>
              </div>
              {economiaCatalogada > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Referência do catálogo</div>
                  <div className="font-bold text-warning flex items-center gap-1">
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                    {formatCurrency(economiaCatalogada)}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {naoAvaliadas.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start justify-between gap-4 rounded-md bg-muted/40 p-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{c.nome}</div>
                    {c.descricao && (
                      <div className="text-xs text-muted-foreground">{c.descricao}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {c.tipo && (
                      <Badge variant="outline" className="text-xs">
                        {c.tipo.replace(/_/g, ' ')}
                      </Badge>
                    )}
                    {c.economia_estimada_padrao != null && (
                      <span className="text-sm font-semibold">
                        {formatCurrency(Number(c.economia_estimada_padrao))}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
