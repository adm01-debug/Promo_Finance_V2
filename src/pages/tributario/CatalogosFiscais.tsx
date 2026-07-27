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
import { descreverRejeicoesNcm } from '@/lib/tributario/ipi-iss/overlay-ncm';
import { descreverRejeicoesMonofasico } from '@/lib/tributario/monofasico/overlay-monofasico';

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

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      Overlay de alíquotas (banco → motor)
                    </CardTitle>
                    <Badge
                      variant={
                        data.overlay.rejeitadas.length > 0 || data.ufsAusentes.length > 0
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {data.overlay.aplicadas.length} sobreposição(ões)
                    </Badge>
                  </div>
                  <CardDescription>
                    Valores do banco aplicados sobre as constantes canônicas. Registros
                    inconsistentes são descartados e o motor mantém o valor do código.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {data.overlay.aplicadas.length === 0 ? (
                    <p className="text-muted-foreground">
                      Nenhuma sobreposição necessária — banco e motor idênticos.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {data.overlay.aplicadas.map((a) => (
                        <li key={`${a.uf}-${a.campo}`}>
                          • {a.uf} — {a.campo}: motor{' '}
                          {(a.valorCodigo * 100).toFixed(2)}% → banco{' '}
                          {(a.valorBanco * 100).toFixed(2)}%
                        </li>
                      ))}
                    </ul>
                  )}

                  {data.overlay.rejeitadas.length > 0 && (
                    <ul className="space-y-1 text-destructive">
                      {data.overlay.rejeitadas.map((r, i) => (
                        <li key={`${r.sigla}-${r.motivo}-${i}`}>
                          • {r.sigla || '(vazio)'} descartado: {r.motivo}
                        </li>
                      ))}
                    </ul>
                  )}

                  {data.ufsAusentes.length > 0 && (
                    <p className="text-destructive">
                      UFs ausentes no banco: {data.ufsAusentes.join(', ')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      ISS municipal (LC 116/2003)
                    </CardTitle>
                    <Badge
                      variant={data.overlayIss.rejeitadas.length > 0 ? 'destructive' : 'default'}
                    >
                      {data.overlayIss.municipiosCobertos} município(s)
                    </Badge>
                  </div>
                  <CardDescription>
                    Alíquotas municipais validadas contra o piso de 2% (art. 8º-A) e o teto
                    de 5% (art. 8º, II). Registros fora da faixa legal são descartados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {data.overlayIss.aceitas.length} alíquota(s) vigente(s) —{' '}
                    {data.overlayIss.aceitas.filter((a) => a.itemCodigo !== null).length}{' '}
                    específica(s) por item da lista.
                  </p>

                  {data.overlayIss.aceitas.filter((a) => a.itemCodigo !== null).length > 0 && (
                    <ul className="space-y-1">
                      {data.overlayIss.aceitas
                        .filter((a) => a.itemCodigo !== null)
                        .map((a) => (
                          <li key={`${a.codigoIbge}-${a.itemCodigo}`}>
                            • {a.municipio}/{a.uf} — item {a.itemCodigo}:{' '}
                            {(a.aliquota * 100).toFixed(2)}%
                          </li>
                        ))}
                    </ul>
                  )}

                  {data.overlayIss.rejeitadas.length > 0 && (
                    <ul className="space-y-1 text-destructive">
                      {data.overlayIss.rejeitadas.map((r, i) => (
                        <li key={`${r.codigoIbge}-${r.motivo}-${i}`}>
                          • {r.municipio || '(sem município)'}
                          {r.itemCodigo ? ` item ${r.itemCodigo}` : ''} descartado: {r.motivo}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">IPI — overlay da TIPI (NCM)</CardTitle>
                    <Badge
                      variant={data.overlayNcm.rejeitadas.length > 0 ? 'destructive' : 'default'}
                    >
                      {Object.keys(data.overlayNcm.tabela).length} NCM(s)
                    </Badge>
                  </div>
                  <CardDescription>
                    Alíquotas de IPI do catálogo sobrepõem a TIPI embarcada após validação de
                    formato (8 dígitos) e do teto de 300%. Registros inválidos são descartados
                    e o motor mantém o valor canônico do código.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {data.overlayNcm.aplicadas.length} sobreposição(ões) ·{' '}
                    {data.overlayNcm.adicionados.length} NCM(s) além da TIPI embarcada.
                  </p>

                  {data.overlayNcm.aplicadas.length > 0 && (
                    <ul className="space-y-1">
                      {data.overlayNcm.aplicadas.map((a) => (
                        <li key={a.ncm}>
                          • NCM {a.ncm}: código {(a.valorCodigo * 100).toFixed(2)}% → banco{' '}
                          {(a.valorBanco * 100).toFixed(2)}%
                        </li>
                      ))}
                    </ul>
                  )}

                  {data.overlayNcm.rejeitadas.length > 0 && (
                    <ul className="space-y-1 text-destructive">
                      {descreverRejeicoesNcm(data.overlayNcm.rejeitadas).map((m, i) => (
                        <li key={`${i}-${m}`}>• {m}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">PIS/COFINS — overlay monofásico (NCM)</CardTitle>
                    <Badge
                      variant={
                        data.overlayMonofasico.rejeitadas.length > 0 ? 'destructive' : 'default'
                      }
                    >
                      {Object.keys(data.overlayMonofasico.override).length} override(s)
                    </Badge>
                  </div>
                  <CardDescription>
                    O marcador <code>monofasico_pis_cofins</code> do catálogo é a fonte de verdade
                    do enquadramento. As alíquotas continuam vindo dos grupos legais do motor —
                    NCMs incluídos sem grupo mapeado exigem alíquota informada manualmente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    {data.overlayMonofasico.inclusoes.length} inclusão(ões) ·{' '}
                    {data.overlayMonofasico.exclusoes.length} exclusão(ões) frente ao catálogo
                    embarcado.
                  </p>

                  {data.overlayMonofasico.inclusoes.length > 0 && (
                    <ul className="space-y-1">
                      {data.overlayMonofasico.inclusoes.map((i) => (
                        <li key={i.ncm}>• NCM {i.ncm}: incluído no monofásico — {i.descricao}</li>
                      ))}
                    </ul>
                  )}

                  {data.overlayMonofasico.exclusoes.length > 0 && (
                    <ul className="space-y-1 text-warning">
                      {data.overlayMonofasico.exclusoes.map((e) => (
                        <li key={e.ncm}>
                          • NCM {e.ncm}: excluído pelo catálogo (grupo {e.grupo} não se aplica)
                        </li>
                      ))}
                    </ul>
                  )}

                  {data.overlayMonofasico.rejeitadas.length > 0 && (
                    <ul className="space-y-1 text-destructive">
                      {descreverRejeicoesMonofasico(data.overlayMonofasico.rejeitadas).map((m, i) => (
                        <li key={`${i}-${m}`}>• {m}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
