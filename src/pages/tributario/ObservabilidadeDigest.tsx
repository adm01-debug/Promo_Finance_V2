/**
 * Etapa T — Observabilidade dos envios do digest de conformidade (admin).
 *
 * Página puramente de apresentação: todos os agregados vêm do motor puro
 * `observabilidade-digest`, e os dados brutos da tabela append-only
 * `digest_envios_log` (leitura restrita a admin por RLS).
 */
import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle2, Mail, RefreshCw, SkipForward } from 'lucide-react';
import { useDigestEnviosLog } from '@/hooks/useDigestEnviosLog';
import {
  agruparDestinatarios,
  agruparMotivos,
  resumirEnvios,
  serieDiaria,
  ultimasFalhas,
  type SituacaoEnvioDigest,
} from '@/lib/tributario/obrigacoes/observabilidade-digest';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const SITUACAO_VARIANT: Record<SituacaoEnvioDigest, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  enviado: 'default',
  simulado: 'secondary',
  ignorado: 'outline',
  falhou: 'destructive',
};

export default function ObservabilidadeDigest() {
  const [dias, setDias] = useState('30');
  const { data, isLoading, error, refetch, isFetching } = useDigestEnviosLog(Number(dias));

  const registros = useMemo(() => data ?? [], [data]);
  const resumo = useMemo(() => resumirEnvios(registros), [registros]);
  const serie = useMemo(() => serieDiaria(registros), [registros]);
  const motivos = useMemo(() => agruparMotivos(registros), [registros]);
  const destinatarios = useMemo(() => agruparDestinatarios(registros).slice(0, 10), [registros]);
  const falhas = useMemo(() => ultimasFalhas(registros, 15), [registros]);

  return (
    <MainLayout>
      <PageBackground>
        <PageHeader
          title="Observabilidade do Digest"
          description="Entregas, descartes e falhas do resumo fiscal enviado por e-mail."
        />

        <div className="flex flex-wrap items-center gap-3">
          <Select value={dias} onValueChange={setDias}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
            Atualizar
          </Button>
          <span className="text-sm text-muted-foreground">
            Último ciclo: {dataHora(resumo.ultimaExecucaoEm)} · {resumo.execucoes} execuç
            {resumo.execucoes === 1 ? 'ão' : 'ões'}
          </span>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar o histórico de envios. Esta página é restrita a
              administradores.
            </AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Entregues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{resumo.enviados}</p>
                <p className="text-xs text-muted-foreground">
                  Taxa de entrega {resumo.taxaEntrega}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Falhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{resumo.falhas}</p>
                <p className="text-xs text-muted-foreground">Taxa de falha {resumo.taxaFalha}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <SkipForward className="h-4 w-4 text-warning" /> Descartados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{resumo.ignorados}</p>
                <p className="text-xs text-muted-foreground">
                  {resumo.duplicados} por conteúdo repetido
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" /> Alcance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{resumo.destinatariosUnicos}</p>
                <p className="text-xs text-muted-foreground">
                  {resumo.totalAlertas} alertas · {brl(resumo.multaTotal)} em risco
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {resumo.simulados > 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {resumo.simulados} envio(s) ocorreram em modo simulado — o provedor de e-mail não
              estava configurado nesses ciclos.
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Volume diário</CardTitle>
            <CardDescription>Distribuição das situações por dia do período.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {serie.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum envio registrado no período.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="enviados" name="Entregues" stackId="a" fill="hsl(var(--success))" />
                  <Bar dataKey="simulados" name="Simulados" stackId="a" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="ignorados" name="Descartados" stackId="a" fill="hsl(var(--warning))" />
                  <Bar dataKey="falhas" name="Falhas" stackId="a" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Motivos de descarte</CardTitle>
              <CardDescription>Decisões das preferências de cada usuário.</CardDescription>
            </CardHeader>
            <CardContent>
              {motivos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum descarte no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ocorrências</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {motivos.map((m) => (
                      <TableRow key={m.motivo}>
                        <TableCell>{m.motivo}</TableCell>
                        <TableCell className="text-right font-medium">{m.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Destinatários</CardTitle>
              <CardDescription>Ordenados por incidência de falhas.</CardDescription>
            </CardHeader>
            <CardContent>
              {destinatarios.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum destinatário no período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>E-mail</TableHead>
                      <TableHead className="text-right">Entregues</TableHead>
                      <TableHead className="text-right">Falhas</TableHead>
                      <TableHead className="text-right">Último envio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {destinatarios.map((d) => (
                      <TableRow key={d.email}>
                        <TableCell className="font-medium">{d.email}</TableCell>
                        <TableCell className="text-right">{d.enviados}</TableCell>
                        <TableCell className="text-right">
                          {d.falhas > 0 ? (
                            <Badge variant="destructive">{d.falhas}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {dataHora(d.ultimoEnvioEm)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimas falhas</CardTitle>
            <CardDescription>Resposta bruta do provedor, truncada para auditoria.</CardDescription>
          </CardHeader>
          <CardContent>
            {falhas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma falha registrada. 🎉</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {falhas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="whitespace-nowrap">{dataHora(f.criadoEm)}</TableCell>
                      <TableCell>{f.email}</TableCell>
                      <TableCell>
                        <Badge variant={SITUACAO_VARIANT[f.situacao]}>{f.situacao}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {f.erro ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageBackground>
    </MainLayout>
  );
}
