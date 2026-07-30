import { useEffect, useState } from 'react';
import { BarChart3, PieChart, Scale, Search } from 'lucide-react';
import { useDemonstrativosContabeis, type FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useUserDemonstrativoPreferences } from '@/hooks/useUserDemonstrativoPreferences';
import { logUserAction } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DreBalancoToolbar } from './dre-balanco/DreBalancoToolbar';
import { DreView } from './dre-balanco/DreView';
import { BalancoView } from './dre-balanco/BalancoView';
import { LancamentosDrillDown } from './dre-balanco/LancamentosDrillDown';
import { exportarBalanco, exportarDRE } from './dre-balanco/exporters';
import type { DrillDownState, ModoDemonstrativo } from './dre-balanco/types';

interface Props { empresaId?: string; ano: number; anoFim?: number }

export function DreBalancoTab({ empresaId, ano }: Props) {
  const { user } = useAuth();
  const { preferences, update: updatePrefs } = useUserDemonstrativoPreferences();

  const [modo, setModo] = useState<ModoDemonstrativo>('dre');
  const [fonte, setFonte] = useState<FonteDemonstrativo>('competencia');
  const [mes, setMes] = useState(() => new Date().getMonth());
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('todas');
  const [drillDown, setDrillDown] = useState<DrillDownState>({ open: false });

  useEffect(() => {
    if (preferences) {
      if (preferences.modo_padrao) setModo(preferences.modo_padrao);
      if (preferences.fonte_padrao) setFonte(preferences.fonte_padrao);
    }
  }, [preferences]);

  useEffect(() => {
    if (preferences?.filtros_por_empresa?.[selectedEmpresaId]) {
      const f = preferences.filtros_por_empresa[selectedEmpresaId];
      if (f.mes !== undefined) setMes(f.mes);
    } else if (selectedEmpresaId === 'todas') {
      setMes(new Date().getMonth());
    }
  }, [selectedEmpresaId, preferences]);

  const handleSetModo = (v: ModoDemonstrativo) => {
    setModo(v);
    updatePrefs.mutate({ modo_padrao: v });
  };

  const handleSetFonte = (v: FonteDemonstrativo) => {
    setFonte(v);
    updatePrefs.mutate({ fonte_padrao: v });
  };

  const handleSetMes = (v: number) => {
    setMes(v);
    const currentFiltros = preferences?.filtros_por_empresa || {};
    updatePrefs.mutate({
      filtros_por_empresa: {
        ...currentFiltros,
        [selectedEmpresaId]: { ...currentFiltros[selectedEmpresaId], mes: v },
      },
    });
  };

  const resetPreferences = async () => {
    const oldValues = { ...preferences };
    setModo('dre');
    setFonte('competencia');
    setMes(new Date().getMonth());
    setSelectedEmpresaId(empresaId || 'todas');

    updatePrefs.mutate({
      modo_padrao: 'dre',
      fonte_padrao: 'competencia',
      filtros_por_empresa: {},
      drill_down_estado: {},
    });

    if (user) {
      await logUserAction({
        userId: user.id,
        actionType: 'filters_reset',
        entityType: 'dre-balanco',
        oldValue: oldValues,
        newValue: { modo: 'dre', fonte: 'competencia', mes: new Date().getMonth() },
      });
    }

    toast.info('Preferências restauradas para o padrão.');
  };

  const handleLoadPreset = (filters: Record<string, unknown>) => {
    const modoPreset = filters.modo as ModoDemonstrativo | undefined;
    const fontePreset = filters.fonte as FonteDemonstrativo | undefined;
    const mesPreset = filters.mes as number | undefined;
    const empresaPreset = filters.empresaId as string | undefined;

    if (modoPreset) setModo(modoPreset);
    if (fontePreset) setFonte(fontePreset);
    if (mesPreset !== undefined) setMes(mesPreset);
    if (empresaPreset) setSelectedEmpresaId(empresaPreset);

    updatePrefs.mutate({
      modo_padrao: modoPreset || modo,
      fonte_padrao: fontePreset || fonte,
      filtros_por_empresa: {
        ...preferences?.filtros_por_empresa,
        [empresaPreset || selectedEmpresaId]: { mes: mesPreset },
      },
    });
  };

  const handleSetDrillDown = (state: DrillDownState) => {
    setDrillDown(state);
    updatePrefs.mutate({
      drill_down_estado: { ...state } as unknown as Record<string, boolean>,
    });
  };

  const { dre: dreNovo, balanco: balancoNovo, isLoading: isLoadingNovo } = useDemonstrativosContabeis({
    empresaId: selectedEmpresaId,
    ano,
    mes,
    fonte,
  });

  const { data: empresas = [] } = useEmpresas();
  const empresa = empresas.find((e) => e.id === selectedEmpresaId);
  const empresaTitulo = empresa
    ? (empresa.nome_fantasia || empresa.razao_social)
    : (selectedEmpresaId === 'todas' ? 'Consolidado' : 'Empresa');

  const handleExport = (format: 'pdf' | 'json') => {
    const ctx = { empresaTitulo, empresaCnpj: empresa?.cnpj, ano, mes, fonte };
    if (modo === 'dre') exportarDRE(format, dreNovo, ctx);
    else exportarBalanco(format, balancoNovo, ctx);
  };

  if (!empresaId) {
    return (
      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardContent className="relative z-10 text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-3xl w-fit mx-auto animate-pulse">
            <PieChart className="h-12 w-12 text-primary opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-black tracking-tight">DRE & Balanço</p>
            <p className="text-sm font-medium opacity-60 max-w-xs mx-auto">Selecione uma empresa para visualizar as demonstrações financeiras e patrimoniais.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={drillDown.open} onOpenChange={(open) => handleSetDrillDown({ ...drillDown, open })}>
        <DialogContent className="max-w-5xl border-none bg-background/95 backdrop-blur-3xl shadow-3xl rounded-[2.5rem] p-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="p-8 pb-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">{drillDown.titulo}</DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">{drillDown.subtitulo}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 pt-0 relative z-10">
            <LancamentosDrillDown
              empresaId={selectedEmpresaId}
              ano={ano}
              mes={mes}
              centroResultado={drillDown.centro_resultado}
              tipoBp={drillDown.tipo_bp}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={cn('p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500')}>
                {modo === 'dre' ? <BarChart3 className="h-8 w-8" /> : <Scale className="h-8 w-8" />}
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tighter">
                  {modo === 'dre' ? 'Demonstração de Resultado' : 'Balanço Patrimonial'}
                </CardTitle>
                <CardDescription className="text-sm font-medium opacity-60">Performance financeira e saúde patrimonial corporativa</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-2 relative z-10 space-y-8">
          <DreBalancoToolbar
            modo={modo}
            fonte={fonte}
            mes={mes}
            ano={ano}
            selectedEmpresaId={selectedEmpresaId}
            empresas={empresas}
            onChangeModo={handleSetModo}
            onChangeFonte={handleSetFonte}
            onChangeMes={handleSetMes}
            onChangeEmpresa={setSelectedEmpresaId}
            onReset={resetPreferences}
            onLoadPreset={handleLoadPreset}
            onExport={handleExport}
          />

          {isLoadingNovo ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : modo === 'dre' ? (
            <DreView dre={dreNovo} empresaTitulo={empresaTitulo} ano={ano} mes={mes} onOpenDrill={setDrillDown} />
          ) : (
            <BalancoView balanco={balancoNovo} empresaTitulo={empresaTitulo} ano={ano} mes={mes} onOpenDrill={setDrillDown} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
