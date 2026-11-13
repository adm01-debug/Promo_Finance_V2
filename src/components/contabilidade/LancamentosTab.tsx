import { useMemo } from 'react';
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
import { Activity, BookOpen, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { NovoLancamentoDialog } from './NovoLancamentoDialog';
import { Badge } from '@/components/ui/badge';
import { logUserAction } from '@/lib/audit-logger';
import { useAuth } from '@/hooks/useAuth';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { usePlanoContas } from '@/hooks/usePlanoContas';
import { formatCurrency } from '@/lib/formatters';
import { ImportLancamentosCSVDialog } from './ImportLancamentosCSVDialog';
import type { Props, LancamentosFilters, DatePreset } from './LancamentosTab.types';
import { LANCAMENTOS_DEFAULTS } from './LancamentosTab.helpers';
import { LancamentosTabConteudo } from './LancamentosTabConteudo';

export function LancamentosTab({ empresaId, ano }: Props) {
  const { user } = useAuth();
  // Filtros gerenciados
  const filtersController = useManagedFilters<LancamentosFilters>({
    entityType: 'lancamentos-contabeis',
    defaults: LANCAMENTOS_DEFAULTS,
    localStorageKey: 'app-lancamentos-filters',
  });
  const {
    busca,
    preset,
    dataInicio: dataInicioStr,
    dataFim: dataFimStr,
  } = filtersController.values;
  const dataInicio = useMemo(
    () => (dataInicioStr ? new Date(`${dataInicioStr}T00:00:00`) : undefined),
    [dataInicioStr]
  );
  const dataFim = useMemo(
    () => (dataFimStr ? new Date(`${dataFimStr}T23:59:59`) : undefined),
    [dataFimStr]
  );
  const setBusca = (v: string) => filtersController.setField('busca', v);
  const setDataInicio = (d: Date | undefined) =>
    filtersController.setField('dataInicio', d ? format(d, 'yyyy-MM-dd') : null);
  const setDataFim = (d: Date | undefined) =>
    filtersController.setField('dataFim', d ? format(d, 'yyyy-MM-dd') : null);

  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);
  const { data: plano = [] } = usePlanoContas(empresaId);

  const contasAnaliticas = plano.filter((p) => p.tipo === 'analitica');
  const handlePreset = (p: DatePreset) => {
    const hoje = new Date();
    let ini: Date | undefined;
    let fim: Date | undefined;
    switch (p) {
      case 'all':
        break;
      case 'today':
        ini = startOfDay(hoje);
        fim = endOfDay(hoje);
        break;
      case 'last7':
        ini = startOfDay(subDays(hoje, 6));
        fim = endOfDay(hoje);
        break;
      case 'last30':
        ini = startOfDay(subDays(hoje, 29));
        fim = endOfDay(hoje);
        break;
      case 'mes':
        ini = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      case 'ano':
        ini = startOfYear(new Date(ano, 0, 1));
        fim = endOfYear(new Date(ano, 0, 1));
        break;
      case 'custom':
        return filtersController.setField('preset', p);
    }

    const oldValues = { ...filtersController.values };
    const nextValues = {
      ...filtersController.values,
      preset: p,
      dataInicio: ini ? format(ini, 'yyyy-MM-dd') : null,
      dataFim: fim ? format(fim, 'yyyy-MM-dd') : null,
    };

    filtersController.setValues(nextValues);

    if (user) {
      logUserAction({
        userId: user.id,
        actionType: 'filter_change',
        entityType: 'lancamentos-contabeis',
        oldValue: oldValues,
        newValue: nextValues,
      });
    }
  };

  const lancsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return lancs
      .map((l) => ({
        id: l.id,
        numero_lancamento: l.numero_lancamento ?? 0,
        data_lancamento: l.data_lancamento,
        historico: l.historico ?? '',
        origem: l.origem ?? '',
        valor_total: l.valor_total,
        status: l.status,
      }))
      .filter((l) => {
        if (dataInicio || dataFim) {
          const dl = new Date(l.data_lancamento + 'T00:00:00');
          if (dataInicio && dl < dataInicio) return false;
          if (dataFim && dl > dataFim) return false;
        }
        if (termo) {
          const hay = `${l.historico} ${l.numero_lancamento}`.toLowerCase();
          if (!hay.includes(termo)) return false;
        }
        return true;
      });
  }, [lancs, busca, dataInicio, dataFim]);

  const volumeFinanceiro = useMemo(
    () => lancsFiltrados.reduce((acc, l) => acc + (Number(l.valor_total) || 0), 0),
    [lancsFiltrados]
  );

  return (
    <div className="space-y-10">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            Total Lançamentos
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums">
              {lancsFiltrados.length}
            </p>
            <span className="text-[10px] font-bold text-primary/60">Registros em {ano}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/5 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/kpi:scale-110 transition-transform">
            <Zap className="h-20 w-20 text-success" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
            Volume Financeiro
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black tracking-tighter tabular-nums text-success">
              {formatCurrency(volumeFinanceiro)}
            </p>
            <ArrowUpRight className="h-4 w-4 text-success opacity-40" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-success/20 ring-1 ring-success/30 p-6 rounded-[2.5rem] relative overflow-hidden group/kpi"
        >
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover/kpi:scale-110 transition-transform">
            <ShieldCheck className="h-20 w-20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            Status de Auditoria
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-4xl font-black tracking-tighter">100%</p>
            <Badge
              variant="outline"
              className="border-none bg-success/20 text-success font-black text-[10px] px-3 py-1 rounded-full"
            >
              CONFORME
            </Badge>
          </div>
        </motion.div>
      </div>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <CardHeader className="p-8 pb-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-primary shadow-xl shadow-primary/20 text-primary-foreground transform group-hover:scale-110 transition-all duration-500">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black tracking-tighter">Livro Diário</CardTitle>
                <CardDescription className="text-sm font-medium opacity-60">
                  Gestão analítica de partidas dobradas em {ano}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ImportLancamentosCSVDialog
                empresaId={empresaId}
                planoContas={contasAnaliticas}
                ano={ano}
              />
              <NovoLancamentoDialog empresaId={empresaId} planoContas={contasAnaliticas} />
            </div>
          </div>
        </CardHeader>
        <LancamentosTabConteudo
          empresaId={empresaId}
          filtersController={filtersController}
          busca={busca}
          setBusca={setBusca}
          preset={preset}
          handlePreset={handlePreset}
          ano={ano}
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
          lancsFiltrados={lancsFiltrados}
          lancs={lancs}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}
