/**
 * Etapa O — Comparativo de conformidade fiscal entre as empresas do grupo.
 * Página de apresentação: todo o cálculo vem do motor puro `compararConformidade`.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  AlertTriangle,
  BarChart3,
  Download,
  Info,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserEmpresas } from '@/hooks/useUserEmpresas';
import {
  useComparativoConformidade,
  type EmpresaComparavel,
} from '@/hooks/useComparativoConformidade';
import { ComparativoTemporalChart } from '@/components/tributario/ComparativoTemporalChart';
import {
  exportarComparativoCsv,
  NIVEL_LABEL,
  type DirecaoTendencia,
  type LinhaComparativo,
  type NivelConformidade,
} from '@/lib/tributario/obrigacoes';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const competenciaBR = (c: string | null) =>
  c && c.length === 7 ? `${c.slice(5)}/${c.slice(0, 4)}` : '—';

const NIVEL_VARIANT: Record<NivelConformidade, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    excelente: 'default',
    bom: 'secondary',
    atencao: 'outline',
    critico: 'destructive',
  };

const DIRECAO_CLASSE: Record<DirecaoTendencia, string> = {
  alta: 'text-success',
  estavel: 'text-muted-foreground',
  queda: 'text-destructive',
};

function IconeDirecao({ direcao }: { readonly direcao: DirecaoTendencia }) {
  const Icon = direcao === 'alta' ? TrendingUp : direcao === 'queda' ? TrendingDown : Minus;
  return <Icon className={cn('h-4 w-4', DIRECAO_CLASSE[direcao])} aria-hidden="true" />;
}

function LinhaRanking({ linha }: { readonly linha: LinhaComparativo }) {
  return (
    <TableRow className={cn(linha.semDados && 'opacity-60')}>
      <TableCell className="font-mono tabular-nums">
        <span className="inline-flex items-center gap-1">
          {linha.posicao === 1 && !linha.semDados && (
            <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
          )}
          {linha.posicao}º
        </span>
      </TableCell>
      <TableCell className="font-medium">
        {linha.nome}
        {linha.defasada && (
          <Badge variant="outline" className="ml-2 text-xs">
            defasada
          </Badge>
        )}
        {linha.semDados && (
          <Badge variant="outline" className="ml-2 text-xs">
            sem dados
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {competenciaBR(linha.competenciaAvaliada)}
      </TableCell>
      <TableCell className="text-right font-semibold tabular-nums">
        {linha.semDados ? '—' : linha.score.toFixed(1)}
      </TableCell>
      <TableCell>
        <Badge variant={NIVEL_VARIANT[linha.nivel]}>{NIVEL_LABEL[linha.nivel]}</Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span className={cn('inline-flex items-center gap-1', DIRECAO_CLASSE[linha.direcao])}>
          <IconeDirecao direcao={linha.direcao} />
          {linha.scoreAnterior === null ? '—' : `${linha.delta > 0 ? '+' : ''}${linha.delta.toFixed(1)}`}
        </span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {linha.semDados ? '—' : linha.media.toFixed(1)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {linha.obrigacoesVencidas > 0 ? (
          <span className="text-destructive font-medium">{linha.obrigacoesVencidas}</span>
        ) : (
          linha.obrigacoesVencidas
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">{brl(linha.multaAcumulada)}</TableCell>
    </TableRow>
  );
}

export default function ComparativoConformidade() {
  const { data: vinculos, isLoading: carregandoEmpresas } = useUserEmpresas();
  const [competencia, setCompetencia] = useState<string>('auto');

  const empresas = useMemo<EmpresaComparavel[]>(
    () =>
      (vinculos ?? [])
        .filter((v) => v.ativo)
        .map((v) => ({
          id: v.empresa_id,
          nome: v.empresa.nome_fantasia?.trim() || v.empresa.razao_social,
        })),
    [vinculos]
  );

  const { comparativo, series, isLoading, isFetching, error, refetch } = useComparativoConformidade(
    empresas,
    competencia === 'auto' ? undefined : competencia
  );
  const { linhas, resumo } = comparativo;

  // Competências disponíveis para o filtro, derivadas das séries carregadas.
  const competencias = useMemo(() => {
    const conjunto = new Set<string>();
    for (const linha of linhas) {
      for (const ponto of linha.tendencia.pontos) conjunto.add(ponto.competencia);
    }
    return [...conjunto].sort().reverse();
  }, [linhas]);

  const exportar = () => {
    const csv = exportarComparativoCsv(comparativo);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparativo-conformidade-${resumo.competenciaReferencia ?? 'grupo'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Comparativo exportado em CSV.');
  };

  const carregando = carregandoEmpresas || isLoading;

  return (
    <MainLayout>
      <div className="relative">
        <PageBackground />
        <PageHeader
          title="Comparativo de Conformidade"
          subtitle="Ranking do score fiscal entre as empresas do grupo, com tendência e multas acumuladas."
          icon={BarChart3}
        />

        <div className="space-y-6 p-4 md:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={competencia} onValueChange={setCompetencia}>
              <SelectTrigger className="w-[220px]" aria-label="Competência de referência">
                <SelectValue placeholder="Competência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Última competência disponível</SelectItem>
                {competencias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {competenciaBR(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Atualizar
            </Button>

            <Button variant="outline" onClick={exportar} disabled={linhas.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>

            <Button variant="ghost" asChild>
              <Link to="/tributario/obrigacoes">Ver calendário de obrigações</Link>
            </Button>
          </div>

          {error && (
            <Alert variant="error">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Não foi possível carregar o histórico de conformidade: {error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Score médio do grupo</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {carregando ? <Skeleton className="h-8 w-20" /> : resumo.scoreMedio.toFixed(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Ponderado por obrigações: {resumo.scorePonderado.toFixed(1)}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Competência de referência</CardDescription>
                <CardTitle className="text-3xl">
                  {competenciaBR(resumo.competenciaReferencia)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {resumo.avaliadas} de {resumo.empresas} empresa(s) com histórico
                {resumo.defasadas > 0 && ` · ${resumo.defasadas} defasada(s)`}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Obrigações vencidas</CardDescription>
                <CardTitle
                  className={cn(
                    'text-3xl tabular-nums',
                    resumo.vencidasTotal > 0 && 'text-destructive'
                  )}
                >
                  {resumo.vencidasTotal}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Amplitude do grupo: {resumo.amplitude.toFixed(1)} pts
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Multa acumulada</CardDescription>
                <CardTitle className="text-3xl tabular-nums">{brl(resumo.multaTotal)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {resumo.melhor ? `Melhor: ${resumo.melhor.nome}` : 'Sem empresas avaliadas'}
              </CardContent>
            </Card>
          </div>

          <ComparativoTemporalChart series={series} isLoading={isLoading} />

          <Card>
            <CardHeader>
              <CardTitle>Ranking por empresa</CardTitle>
              <CardDescription>
                Empresas sem snapshot na competência de referência são avaliadas pelo último
                histórico disponível e sinalizadas como defasadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {carregando ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : linhas.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma empresa disponível para comparação. Gere o histórico de conformidade no
                    calendário de obrigações.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Competência</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead>Nível</TableHead>
                        <TableHead className="text-right">Variação</TableHead>
                        <TableHead className="text-right">Média</TableHead>
                        <TableHead className="text-right">Vencidas</TableHead>
                        <TableHead className="text-right">Multa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linhas.map((linha) => (
                        <LinhaRanking key={linha.empresaId} linha={linha} />
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
