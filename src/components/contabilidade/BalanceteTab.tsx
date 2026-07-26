import { useMemo } from 'react';
import { BookOpenCheck, Download, FileSpreadsheet, FileText } from 'lucide-react';
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
import { useBalancete } from '@/hooks/useBalancete';
import { computeBalanceteTotais, filterBalancete } from '@/lib/contabil/balancete-utils';
import type { EmpresaHeader } from '@/lib/export-contabil';
import { BalanceteToolbar } from './balancete/BalanceteToolbar';
import { BalanceteTable } from './balancete/BalanceteTable';
import { exportBalanceteCSV, exportBalancetePDF } from './balancete/exporters';
import type { BalanceteFilters } from './balancete/types';

interface Props {
  empresaId?: string;
  ano: number;
}

export function BalanceteTab({ empresaId, ano }: Props) {
  const { data: empresas = [] } = useEmpresas();

  const [filters, setFilters] = useLocalStorageState<BalanceteFilters>('contabilidade:balancete-filtros', {
    dataInicio: `${ano}-01-01`,
    dataFim: `${ano}-12-31`,
    nivelMax: 'todos',
    apenasComMovimento: true,
    busca: '',
  });

  const setField = <K extends keyof BalanceteFilters>(key: K, value: BalanceteFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const nivelMax = filters.nivelMax === 'todos' ? null : Number(filters.nivelMax);

  const { data: rows = [], isLoading, error } = useBalancete({
    empresaId,
    dataInicio: filters.dataInicio,
    dataFim: filters.dataFim,
    nivelMax,
  });

  const visiveis = useMemo(
    () => filterBalancete(rows, {
      apenasComMovimento: filters.apenasComMovimento,
      busca: filters.busca,
    }),
    [rows, filters.apenasComMovimento, filters.busca],
  );

  // Totais sempre sobre o universo completo do período — filtros de tela não
  // podem mascarar um desbalanceamento da escrituração.
  const totais = useMemo(() => computeBalanceteTotais(rows), [rows]);

  const empresaHeader = useMemo<EmpresaHeader | undefined>(() => {
    const e = empresas.find((x) => x.id === empresaId);
    if (!e) return undefined;
    return { razao_social: e.razao_social, nome_fantasia: e.nome_fantasia, cnpj: e.cnpj };
  }, [empresas, empresaId]);

  const exportar = (formato: 'csv' | 'pdf') => {
    if (visiveis.length === 0) {
      toast.warning('Nada para exportar.');
      return;
    }
    const ctx = { empresa: empresaHeader, dataInicio: filters.dataInicio, dataFim: filters.dataFim };
    if (formato === 'csv') exportBalanceteCSV(visiveis, totais, ctx);
    else exportBalancetePDF(visiveis, totais, ctx);
    toast.success(`Balancete exportado (${visiveis.length} contas).`);
  };

  if (!empresaId) {
    return (
      <Card className="p-12 text-center">
        <CardContent className="space-y-3">
          <BookOpenCheck className="mx-auto h-12 w-12 text-primary opacity-40" aria-hidden />
          <p className="text-xl font-black tracking-tight">Balancete de Verificação</p>
          <p className="text-sm text-muted-foreground">Selecione uma empresa para gerar o balancete.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-black tracking-tighter">Balancete de Verificação</CardTitle>
          <CardDescription>
            Saldo anterior, movimento do período e saldo final — consolidado no banco de dados.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="rounded-2xl">
              <Download className="mr-2 h-4 w-4" aria-hidden /> Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Balancete</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportar('csv')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden /> CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportar('pdf')}>
              <FileText className="mr-2 h-4 w-4" aria-hidden /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-6">
        <BalanceteToolbar
          values={filters}
          setField={setField}
          countLabel={`${visiveis.length.toLocaleString('pt-BR')} contas`}
        />

        {error && (
          <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            Não foi possível carregar o balancete: {error.message}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
          </div>
        ) : (
          <BalanceteTable rows={visiveis} totais={totais} />
        )}
      </CardContent>
    </Card>
  );
}
