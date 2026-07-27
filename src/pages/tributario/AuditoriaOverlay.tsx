/**
 * Tela de auditoria das rejeições dos overlays de catálogo fiscal.
 *
 * Objetivo: rastrear rapidamente a origem de um dado ruim — qual catálogo,
 * qual item, qual campo e qual motivo fizeram o overlay descartar o registro
 * (nesses casos o motor segue com o valor canônico embarcado).
 *
 * Apresentação apenas: todos os agregados vêm do motor puro
 * `rejeicoes-auditoria` e a persistência é feita pela Edge Function.
 */
import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Upload, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalogosFiscais } from '@/hooks/useCatalogosFiscais';
import {
  useOverlayRejeicoesAuditoria,
  useRegistrarRejeicoesOverlay,
  useResolverRejeicaoOverlay,
  type FiltrosAuditoriaOverlay,
} from '@/hooks/useOverlayRejeicoesAuditoria';
import {
  coletarDriftMvaAuditavel,
  coletarRejeicoesOverlay,
  descreverMotivo,
  resumirRejeicoes,
  type CatalogoOverlay,
} from '@/lib/tributario/catalogos/rejeicoes-auditoria';

const ROTULO_CATALOGO: Record<CatalogoOverlay, string> = {
  icms: 'ICMS (UFs)',
  iss: 'ISS municipal',
  ncm: 'NCM / TIPI',
  monofasico: 'Monofásico',
  mva_st: 'MVA/ST por protocolo',
};

const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function AuditoriaOverlay() {
  const [catalogo, setCatalogo] = useState<FiltrosAuditoriaOverlay['catalogo']>('todos');
  const [situacao, setSituacao] = useState<FiltrosAuditoriaOverlay['situacao']>('abertas');
  const [busca, setBusca] = useState('');

  const catalogos = useCatalogosFiscais();
  const registros = useOverlayRejeicoesAuditoria({ catalogo, situacao, busca });
  const registrar = useRegistrarRejeicoesOverlay();
  const resolver = useResolverRejeicaoOverlay();

  // Rejeições detectadas AGORA em runtime (ainda não necessariamente gravadas).
  const detectadas = useMemo(() => {
    const dados = catalogos.data;
    if (!dados) return [];
    return [
      ...coletarRejeicoesOverlay({
        icms: dados.overlay.rejeitadas,
        iss: dados.overlayIss.rejeitadas,
        ncm: dados.overlayNcm.rejeitadas,
        monofasico: dados.overlayMonofasico.rejeitadas,
        mva_st: dados.overlayMva.rejeitadas,
      }),
      // Drift de cadastro do catálogo de MVA/ST: o registro não foi descartado,
      // mas está sem lastro ou divergente do catálogo de NCMs.
      ...coletarDriftMvaAuditavel(dados.alertas.alertas),
    ];
  }, [catalogos.data]);

  const resumo = useMemo(() => resumirRejeicoes(detectadas), [detectadas]);

  async function handleRegistrar() {
    if (!catalogos.data || detectadas.length === 0) return;
    try {
      const r = await registrar.mutateAsync({
        referencia: catalogos.data.referencia,
        rejeicoes: detectadas,
      });
      toast.success(
        `Auditoria atualizada: ${r.inseridos} nova(s), ${r.atualizados} reincidente(s).`,
      );
    } catch {
      toast.error('Não foi possível registrar as rejeições. Verifique suas permissões.');
    }
  }

  async function handleResolver(id: string, resolvido: boolean) {
    try {
      await resolver.mutateAsync({ id, resolvido });
      toast.success(resolvido ? 'Rejeição marcada como corrigida.' : 'Rejeição reaberta.');
    } catch {
      toast.error('Não foi possível atualizar a situação da rejeição.');
    }
  }

  const lista = registros.data ?? [];

  return (
    <MainLayout>
      <div className="relative">
        <PageBackground />
        <PageHeader
          title="Auditoria de Overlays"
          subtitle="Registros de catálogo recusados pelos overlays fiscais, com motivo, campo e valor recebido."
          icon={ShieldAlert}
        />

        <div className="space-y-6">
          {/* Detecção em runtime */}
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-warning" />
                  Detecção em runtime
                </CardTitle>
                <CardDescription>
                  Referência de vigência: {catalogos.data?.referencia ?? '—'} · registros recusados
                  não chegam ao motor (o cálculo usa o valor canônico embarcado).
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void catalogos.refetch()}
                  disabled={catalogos.isFetching}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${catalogos.isFetching ? 'animate-spin' : ''}`} />
                  Reanalisar
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegistrar}
                  disabled={detectadas.length === 0 || registrar.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Registrar na auditoria
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {catalogos.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : detectadas.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum registro rejeitado nesta carga — todos os catálogos foram aplicados.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Metric titulo="Total" valor={resumo.total} />
                  <Metric titulo="Críticos" valor={resumo.criticos} tom="destructive" />
                  <Metric titulo="Atenção" valor={resumo.atencao} tom="warning" />
                  <Metric
                    titulo="Catálogos afetados"
                    valor={
                      Object.values(resumo.porCatalogo).filter((n) => n > 0).length
                    }
                  />
                </div>
              )}
              {resumo.porMotivo.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resumo.porMotivo.map((m) => (
                    <Badge key={m.motivo} variant="outline">
                      {descreverMotivo(m.motivo)} · {m.quantidade}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico persistido */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de rejeições</CardTitle>
              <CardDescription>
                Rastreie a origem do dado e marque como corrigido após ajustar o catálogo.
              </CardDescription>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <Input
                  placeholder="Buscar por item, campo ou motivo…"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="md:max-w-sm"
                  aria-label="Buscar rejeições"
                />
                <Select
                  value={catalogo}
                  onValueChange={(v) => setCatalogo(v as FiltrosAuditoriaOverlay['catalogo'])}
                >
                  <SelectTrigger className="md:w-52" aria-label="Filtrar por catálogo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os catálogos</SelectItem>
                    {(Object.keys(ROTULO_CATALOGO) as CatalogoOverlay[]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {ROTULO_CATALOGO[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={situacao}
                  onValueChange={(v) => setSituacao(v as FiltrosAuditoriaOverlay['situacao'])}
                >
                  <SelectTrigger className="md:w-44" aria-label="Filtrar por situação">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="abertas">Em aberto</SelectItem>
                    <SelectItem value="resolvidas">Corrigidas</SelectItem>
                    <SelectItem value="todas">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {registros.isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : registros.isError ? (
                <Alert variant="error">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Falha ao carregar o histórico de auditoria.</AlertDescription>
                </Alert>
              ) : lista.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma rejeição registrada para os filtros selecionados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catálogo</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Valor recebido</TableHead>
                        <TableHead className="text-right">Ocorr.</TableHead>
                        <TableHead>Última detecção</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lista.map((r) => (
                        <TableRow key={r.id} className={r.resolvido_em ? 'opacity-60' : undefined}>
                          <TableCell>
                            <Badge variant="outline">{ROTULO_CATALOGO[r.catalogo] ?? r.catalogo}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.identificador}
                            {r.descricao && (
                              <span className="block text-xs text-muted-foreground">{r.descricao}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.campo}</TableCell>
                          <TableCell>
                            <Badge variant={r.severidade === 'critico' ? 'destructive' : 'secondary'}>
                              {descreverMotivo(r.motivo)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.valor_recebido ?? '—'}</TableCell>
                          <TableCell className="text-right">{r.ocorrencias}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dataHora(r.ultima_deteccao)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={resolver.isPending}
                              onClick={() => void handleResolver(r.id, !r.resolvido_em)}
                            >
                              {r.resolvido_em ? (
                                <>
                                  <Undo2 className="mr-2 h-4 w-4" />
                                  Reabrir
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Corrigido
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

interface MetricProps {
  titulo: string;
  valor: number;
  tom?: 'default' | 'destructive' | 'warning';
}

function Metric({ titulo, valor, tom = 'default' }: MetricProps) {
  const cor =
    tom === 'destructive'
      ? 'text-destructive'
      : tom === 'warning'
        ? 'text-warning'
        : 'text-foreground';
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className={`text-2xl font-semibold ${cor}`}>{valor}</p>
    </div>
  );
}
