/**
 * Painel administrativo de catálogos fiscais.
 *
 * Exibe a coerência entre a fonte de verdade versionada (banco) e as tabelas
 * canônicas do motor tributário. Toda a agregação vem do módulo puro
 * `catalogos/painel`; esta página é apenas apresentação.
 */
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { useCatalogosFiscais } from '@/hooks/useCatalogosFiscais';
import type { SituacaoCatalogo } from '@/lib/tributario/catalogos/painel';

const SITUACAO_LABEL: Record<SituacaoCatalogo, string> = {
  ok: 'Coerente',
  divergente: 'Divergente',
  vazio: 'Sem dados',
};

const SITUACAO_VARIANT: Record<SituacaoCatalogo, 'default' | 'destructive' | 'outline'> = {
  ok: 'default',
  divergente: 'destructive',
  vazio: 'outline',
};

export default function CatalogosFiscais() {
  const { data, isLoading, error, refetch, isFetching } = useCatalogosFiscais();

  return (
    <MainLayout>
      <PageBackground />
      <div className="space-y-6">
        <PageHeader
          title="Catálogos Fiscais"
          subtitle="Coerência entre a base versionada e as tabelas do motor tributário"
          icon={Database}
          actions={
            <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Revalidar
            </Button>
          }
        />

        <div className="space-y-6">
          {error && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível carregar os catálogos: {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          )}

          {data && (
            <>
              <Alert variant={data.painel.situacaoGeral === 'ok' ? 'success' : 'error'}>
                {data.painel.situacaoGeral === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {data.painel.situacaoGeral === 'ok'
                    ? `${data.painel.totalRegistros} registros verificados — nenhuma divergência entre banco e motor.`
                    : `${data.painel.totalProblemas} problema(s) detectado(s) em ${data.painel.totalRegistros} registros verificados.`}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.painel.catalogos.map((catalogo) => (
                  <Card key={catalogo.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{catalogo.titulo}</CardTitle>
                        <Badge variant={SITUACAO_VARIANT[catalogo.situacao]}>
                          {SITUACAO_LABEL[catalogo.situacao]}
                        </Badge>
                      </div>
                      <CardDescription>
                        {catalogo.registros} registro(s)
                        {catalogo.esperado !== null ? ` de ${catalogo.esperado} esperados` : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {catalogo.problemas.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Paridade total com as constantes do motor.
                        </p>
                      ) : (
                        <ul className="space-y-1 text-sm text-destructive max-h-48 overflow-y-auto">
                          {catalogo.problemas.slice(0, 25).map((p) => (
                            <li key={p}>• {p}</li>
                          ))}
                          {catalogo.problemas.length > 25 && (
                            <li className="text-muted-foreground">
                              …e mais {catalogo.problemas.length - 25} problema(s).
                            </li>
                          )}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
