import { useMemo } from 'react';
import { Download, FileSpreadsheet, FileText, Gauge } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useIndicesContabeis, useSerieIndices } from '@/hooks/useIndicesContabeis';
import type { EmpresaHeader } from '@/lib/export-contabil';
import { IndicesToolbar } from './indices/IndicesToolbar';
import { IndicesGrid } from './indices/IndicesGrid';
import { IndicesSerieChart } from './indices/IndicesSerieChart';
import { exportIndicesCSV, exportIndicesPDF } from './indices/exporters';
import type { IndicesFilters } from './indices/types';

interface Props {
  empresaId?: string;
  ano: number;
}

export function IndicesTab({ empresaId, ano }: Props) {
  const { data: empresas = [] } = useEmpresas();

  const [filters, setFilters] = useLocalStorageState<IndicesFilters>('contabilidade:indices-filtros', {
    dataInicio: `${ano}-01-01`,
    dataFim: `${ano}-12-31`,
    compararAnterior: true,
    busca: '',
    serie: ['liquidez_corrente', 'margem_liquida'],
  });

  const setField = <K extends keyof IndicesFilters>(key: K, value: IndicesFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const { data, isLoading, error } = useIndicesContabeis({
    empresaId,
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    compararAnterior: filters.compararAnterior,
  });

  const { data: pontos = [], isLoading: loadingSerie } = useSerieIndices({
    empresaId,
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
  });

  const indices = data?.indices ?? [];
  const comDados = indices.filter((i) => i.valor !== null).length;

  const empresaHeader = useMemo<EmpresaHeader | undefined>(() => {
    const e = empresas.find((x) => x.id === empresaId);
    if (!e) return undefined;
    return { razao_social: e.razao_social, nome_fantasia: e.nome_fantasia, cnpj: e.cnpj };
  }, [empresas, empresaId]);

  const toggleSerie = (chave: string) => {
    const atual = filters.serie;
    setField(
      'serie',
      atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave].slice(-3),
    );
  };

  const exportar = (formato: 'csv' | 'pdf') => {
    if (indices.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    const ctx = { empresa: empresaHeader, dataInicio: filters.dataInicio, dataFim: filters.dataFim };
    if (formato === 'csv') exportIndicesCSV(indices, data?.anteriores ?? null, ctx);
    else exportIndicesPDF(indices, data?.anteriores ?? null, ctx);
    toast.success(`Índices exportados (${indices.length} indicadores).`);
  };

  if (!empresaId) {
    return (
      <Card className="p-12 text-center">
        <CardContent className="space-y-3">
          <Gauge className="mx-auto h-12 w-12 text-primary opacity-40" aria-hidden />
          <p className="text-xl font-black tracking-tight">Índices econômico-financeiros</p>
          <p className="text-sm text-muted-foreground">
            Selecione uma empresa para calcular liquidez, endividamento, rentabilidade e prazos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" aria-hidden />
              Índices econômico-financeiros
            </CardTitle>
            <CardDescription>
              Calculados a partir do balancete consolidado no banco — sem digitação manual.
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-2xl">
                <Download className="mr-2 h-4 w-4" aria-hidden />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportar('csv')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden />
                Planilha (.csv)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportar('pdf')}>
                <FileText className="mr-2 h-4 w-4" aria-hidden />
                Relatório (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="space-y-6">
          <IndicesToolbar
            values={filters}
            setField={setField}
            countLabel={`${comDados} de ${indices.length} com base contábil`}
          />

          {error && (
            <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              Não foi possível calcular os índices: {(error as Error).message}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : (
            <IndicesGrid
              indices={indices}
              anteriores={data?.anteriores ?? null}
              busca={filters.busca}
            />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="text-base">Série histórica mensal</CardTitle>
          <CardDescription>Até três indicadores simultâneos dentro do período selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <IndicesSerieChart
            pontos={pontos}
            disponiveis={indices}
            selecionados={filters.serie}
            onToggle={toggleSerie}
            isLoading={loadingSerie}
          />
        </CardContent>
      </Card>
    </div>
  );
}
