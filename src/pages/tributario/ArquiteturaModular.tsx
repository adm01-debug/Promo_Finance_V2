import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Layers, GitBranch } from 'lucide-react';
import { CAMADAS, MODULOS, detectarCiclos, violacoesDeCamada, type Modulo } from '@/lib/arquitetura/modulos';
import grafo from '@/lib/arquitetura/grafo-observado.json';

interface SnapshotGrafo {
  readonly arestasObservadas: readonly string[];
  readonly totalImportsAnalisados: number;
  readonly driftResumo: {
    readonly naoDeclaradas: number;
    readonly inversoesDeCamada: number;
    readonly declaradasSemUso: readonly string[];
  };
}

const SNAPSHOT = grafo as SnapshotGrafo;

function CardModulo({ modulo, observadas }: { modulo: Modulo; observadas: ReadonlySet<string> }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            <span className="text-muted-foreground mr-2 font-mono text-xs">{modulo.id}</span>
            {modulo.nome}
          </CardTitle>
          {modulo.puro ? (
            <Badge variant="outline" className="shrink-0 border-success text-success">
              puro
            </Badge>
          ) : null}
        </div>
        <CardDescription>{modulo.funcao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <p className="text-muted-foreground mb-1 font-medium uppercase tracking-wide">Dependências</p>
          <div className="flex flex-wrap gap-1">
            {modulo.dependencias.length === 0 ? (
              <span className="text-muted-foreground">nenhuma (módulo base)</span>
            ) : (
              modulo.dependencias.map((dep) => (
                <Badge
                  key={dep}
                  variant={observadas.has(`${modulo.id}->${dep}`) ? 'default' : 'secondary'}
                  className="font-mono"
                >
                  {dep}
                </Badge>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground mb-1 font-medium uppercase tracking-wide">Caminhos</p>
          <ul className="text-muted-foreground space-y-0.5 font-mono">
            {modulo.caminhos.map((caminho) => (
              <li key={caminho} className="truncate" title={caminho}>
                {caminho}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArquiteturaModular() {
  const observadas = useMemo(() => new Set(SNAPSHOT.arestasObservadas), []);
  const ciclos = useMemo(() => detectarCiclos(), []);
  const inversoes = useMemo(() => violacoesDeCamada(), []);
  const conforme =
    ciclos.length === 0 &&
    inversoes.length === 0 &&
    SNAPSHOT.driftResumo.naoDeclaradas === 0 &&
    SNAPSHOT.driftResumo.inversoesDeCamada === 0;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Layers className="h-6 w-6 text-primary" aria-hidden />
          Arquitetura Modular
        </h1>
        <p className="text-muted-foreground text-sm">
          Documentação viva dos {MODULOS.length} módulos em {CAMADAS.length} camadas, validada contra o grafo real de
          imports do repositório.
        </p>
      </header>

      <Alert variant={conforme ? 'success' : 'error'}>
        {conforme ? (
          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
        ) : (
          <AlertTriangle className="h-4 w-4" aria-hidden />
        )}
        <AlertTitle>{conforme ? 'Arquitetura conforme' : 'Drift arquitetural detectado'}</AlertTitle>
        <AlertDescription className="text-sm">
          {SNAPSHOT.totalImportsAnalisados} imports entre módulos analisados ·{' '}
          {SNAPSHOT.driftResumo.naoDeclaradas} dependência(s) não declarada(s) ·{' '}
          {SNAPSHOT.driftResumo.inversoesDeCamada} inversão(ões) de camada · {ciclos.length} ciclo(s) no manifesto.
        </AlertDescription>
      </Alert>

      {CAMADAS.map((camada) => {
        const modulos = MODULOS.filter((m) => m.camada === camada.id);
        return (
          <section key={camada.id} className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-semibold">
                Camada {camada.id} — {camada.nome}
              </h2>
              <span className="text-muted-foreground text-xs">{modulos.length} módulos</span>
            </div>
            <p className="text-muted-foreground text-sm">{camada.descricao}</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {modulos.map((modulo) => (
                <CardModulo key={modulo.id} modulo={modulo} observadas={observadas} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <GitBranch className="h-5 w-5 text-primary" aria-hidden />
          Arestas observadas no código
        </h2>
        <div className="flex flex-wrap gap-1">
          {SNAPSHOT.arestasObservadas.map((aresta) => (
            <Badge key={aresta} variant="outline" className="font-mono text-xs">
              {aresta.replace('->', ' → ')}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Dependências declaradas sem import correspondente em runtime (acoplamento apenas planejado ou via tipos):{' '}
          {SNAPSHOT.driftResumo.declaradasSemUso.length}.
        </p>
      </section>
    </div>
  );
}
