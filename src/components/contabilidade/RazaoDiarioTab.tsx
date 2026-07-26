import { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { BookText, Download, FileSpreadsheet, FileText, ArrowRightLeft } from 'lucide-react';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { FilterPresetsManager } from './FilterPresetsManager';
import { logUserAction } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  exportDiarioCSV,
  exportDiarioPDF,
  exportRazaoCSV,
  exportRazaoPDF,
  exportLivroDiarioOficialPDF,
  exportLivroRazaoOficialPDF,
  type LivroOficialParams,
} from '@/lib/export-contabil';

import { toast } from 'sonner';
import type { DatePreset, RazaoFilters } from './razao-diario/types';
import { useRazaoDiarioData } from './razao-diario/useRazaoDiarioData';
import { FiltersBar } from './razao-diario/FiltersBar';
import { DiarioTable } from './razao-diario/DiarioTable';
import { RazaoList } from './razao-diario/RazaoList';

interface Props { empresaId?: string; ano: number }

const toIsoDate = (d: Date) => format(d, 'yyyy-MM-dd');

export function RazaoDiarioTab({ empresaId, ano }: Props) {
  const { user } = useAuth();
  const [modo, setModo] = useState<'diario' | 'razao'>('diario');

  const defaults = useMemo<RazaoFilters>(() => ({
    preset: 'ano',
    dataInicio: `${ano}-01-01`,
    dataFim: `${ano}-12-31`,
    contaId: 'todas',
    busca: '',
  }), [ano]);

  const filtersController = useManagedFilters<RazaoFilters>({
    entityType: 'razao-diario',
    defaults,
    localStorageKey: 'app-razao-diario-filters',
  });
  const { preset, dataInicio, dataFim, contaId, busca } = filtersController.values;
  const setPreset = (p: DatePreset) => filtersController.setField('preset', p);
  const setDataInicio = (v: string) => filtersController.setField('dataInicio', v);
  const setDataFim = (v: string) => filtersController.setField('dataFim', v);
  const setContaId = (v: string) => filtersController.setField('contaId', v);
  const setBusca = (v: string) => filtersController.setField('busca', v);

  useEffect(() => {
    if (!filtersController.isHydrated) return;
    if (preset === 'ano') {
      filtersController.setValues({
        ...filtersController.values,
        dataInicio: `${ano}-01-01`,
        dataFim: `${ano}-12-31`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, filtersController.isHydrated]);

  const handlePreset = (p: DatePreset) => {
    const hoje = new Date();
    let ini = dataInicio; let fim = dataFim;
    switch (p) {
      case 'all': ini = `${ano}-01-01`; fim = `${ano}-12-31`; break;
      case 'today': ini = toIsoDate(startOfDay(hoje)); fim = toIsoDate(endOfDay(hoje)); break;
      case 'last7': ini = toIsoDate(startOfDay(subDays(hoje, 6))); fim = toIsoDate(endOfDay(hoje)); break;
      case 'last30': ini = toIsoDate(startOfDay(subDays(hoje, 29))); fim = toIsoDate(endOfDay(hoje)); break;
      case 'mes': ini = toIsoDate(startOfMonth(hoje)); fim = toIsoDate(endOfMonth(hoje)); break;
      case 'ano': ini = toIsoDate(startOfYear(new Date(ano, 0, 1))); fim = toIsoDate(endOfYear(new Date(ano, 0, 1))); break;
      case 'custom': filtersController.setField('preset', p); return;
    }
    const oldValues = { ...filtersController.values };
    const nextValues = { ...filtersController.values, preset: p, dataInicio: ini, dataFim: fim };
    filtersController.setValues(nextValues);
    if (user) {
      logUserAction({
        userId: user.id,
        actionType: 'filter_change',
        entityType: 'razao-diario',
        oldValue: oldValues,
        newValue: nextValues,
      });
    }
  };

  const { isLoading, plano, empresaHeader, diario, totaisDiario, razao } = useRazaoDiarioData({
    empresaId, ano, dataInicio, dataFim, contaId, busca,
  });

  const ctxExport = { empresa: empresaHeader, dataInicio, dataFim };

  const exportar = (formato: 'csv' | 'pdf') => {
    if (modo === 'diario') {
      if (diario.length === 0) return toast.warning('Nada para exportar.');
      if (formato === 'csv') exportDiarioCSV(diario, ctxExport); else exportDiarioPDF(diario, ctxExport);
      toast.success(`Diário exportado (${diario.length} partidas).`);
    } else {
      if (razao.length === 0) return toast.warning('Nada para exportar.');
      if (formato === 'csv') exportRazaoCSV(razao, ctxExport); else exportRazaoPDF(razao, ctxExport);
      toast.success(`Razão exportado (${razao.length} contas).`);
    }
  };

  /**
   * Livro oficial: mesma base do relatório de tela, porém com termo de
   * abertura/encerramento e numeração sequencial de folhas.
   */
  const exportarLivroOficial = () => {
    const params: LivroOficialParams = { numeroLivro: ano - 2000 };
    if (modo === 'diario') {
      if (diario.length === 0) return toast.warning('Nada para exportar.');
      exportLivroDiarioOficialPDF(diario, ctxExport, params);
      toast.success('Livro Diário oficial gerado com termos de abertura e encerramento.');
    } else {
      if (razao.length === 0) return toast.warning('Nada para exportar.');
      exportLivroRazaoOficialPDF(razao, ctxExport, params);
      toast.success('Livro Razão oficial gerado com termos de abertura e encerramento.');
    }
  };


  if (!empresaId) {
    return (
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="relative z-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-3xl w-fit mx-auto animate-pulse">
            <BookText className="h-12 w-12 text-primary opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black tracking-tight">Razão & Diário</p>
            <p className="text-sm font-medium opacity-60 max-w-xs mx-auto">Selecione uma empresa para visualizar os demonstrativos analíticos.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const countLabel = modo === 'diario'
    ? `${diario.length.toLocaleString('pt-BR')} partidas`
    : `${razao.length.toLocaleString('pt-BR')} contas`;

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <CardHeader className="p-8 pb-4 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn('p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500')}>
              <BookText className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black tracking-tighter">Razão & Diário</CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Demonstrativos contábeis detalhados por período</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-2 relative z-10 space-y-8">
        <FiltersBar
          ano={ano}
          busca={busca} setBusca={setBusca}
          preset={preset} handlePreset={handlePreset}
          dataInicio={dataInicio} dataFim={dataFim}
          setDataInicio={setDataInicio} setDataFim={setDataFim} setPreset={setPreset}
          contaId={contaId} setContaId={setContaId}
          plano={plano as Array<{ id: string; codigo: string; nome?: string; descricao?: string; tipo: string }>}
          filtersController={filtersController}
          countLabel={countLabel}
        />

        <div className="flex flex-wrap items-center justify-between gap-6 bg-card/[0.03] p-4 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <FilterPresetsManager
              entityType="razao-diario"
              empresaId={empresaId}
              currentFilters={filtersController.values}
              onLoadPreset={(f) => filtersController.setValues(f)}
            />
            <ToggleGroup type="single" value={modo} onValueChange={(v) => v && setModo(v as 'diario' | 'razao')} className="bg-background/40 p-1 rounded-2xl border border-white/5">
              <ToggleGroupItem value="diario" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 font-black uppercase text-[10px] tracking-widest">Diário</ToggleGroupItem>
              <ToggleGroupItem value="razao" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all px-6 font-black uppercase text-[10px] tracking-widest">Razão</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20">
              <ArrowRightLeft className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Filtros Cruzados Ativos</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-10 rounded-2xl font-black gap-2 border-white/10 bg-card/5 hover:bg-card/10 px-6 transition-all hover:translate-y-[-2px]">
                <Download className="h-4 w-4 text-primary" /> Exportar Livros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 px-3 py-2">Selecionar Formato</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-card/5" />
              <DropdownMenuItem onClick={() => exportar('csv')} className="rounded-xl gap-3 py-3 cursor-pointer">
                <div className="p-2 bg-success/20 rounded-lg"><FileSpreadsheet className="h-4 w-4 text-success" /></div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Excel (.csv)</span>
                  <span className="text-[10px] opacity-50">Auditoria & Planilhas</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportar('pdf')} className="rounded-xl gap-3 py-3 cursor-pointer">
                <div className="p-2 bg-destructive/20 rounded-lg"><FileText className="h-4 w-4 text-destructive" /></div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">Documento (.pdf)</span>
                  <span className="text-[10px] opacity-50">Relatório de Governança</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-12">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-12 w-24 rounded-xl" />
                <Skeleton className="h-12 flex-1 rounded-xl" />
                <Skeleton className="h-12 w-32 rounded-xl" />
              </div>
            ))}
          </div>
        ) : modo === 'diario' ? (
          <DiarioTable diario={diario} totais={totaisDiario} />
        ) : (
          <RazaoList razao={razao} />
        )}
      </CardContent>
    </Card>
  );
}
