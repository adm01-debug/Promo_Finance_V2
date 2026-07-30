import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  CloudOff,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { computeDivergence } from './filtros-salvos/helpers';
import { FilterRow } from './filtros-salvos/FilterRow';
import { HydrationFailuresAlert } from './filtros-salvos/HydrationFailuresAlert';
import { useFiltrosSalvosDiagnostics } from './filtros-salvos/useFiltrosSalvosDiagnostics';

/**
 * Página de diagnóstico e reconciliação de filtros salvos por tela.
 *
 * Concentra:
 * - Descoberta automática de entityTypes (Supabase + localStorage).
 * - Diagnóstico Conta × Dispositivo por entrada do catálogo.
 * - Alerta em tempo real de falhas de hidratação emitidas por `useManagedFilters`.
 */
export default function FiltrosSalvos() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const {
    diagnostics,
    catalog,
    globalSyncing,
    hydrationEvents,
    refreshOne,
    refreshAll,
  } = useFiltrosSalvosDiagnostics(user?.id);

  const hydrationFailures = useMemo(
    () => hydrationEvents.filter((e) => e.status === 'error').slice(-20).reverse(),
    [hydrationEvents],
  );

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        (e.localStorageKey ?? '').toLowerCase().includes(q),
    );
  }, [search, catalog]);

  const totals = useMemo(() => {
    const list = Object.values(diagnostics);
    const divergences = list.map((d) => computeDivergence(d).direction);
    return {
      total: catalog.length,
      remoteOk: list.filter((d) => d.remote === 'ok').length,
      localOk: list.filter((d) => d.local === 'ok').length,
      errors: list.filter((d) => d.remote === 'error').length,
      divergent: divergences.filter(
        (dir) =>
          dir === 'remote-newer' || dir === 'remote-only' || dir === 'local-newer' || dir === 'local-only',
      ).length,
    };
  }, [diagnostics, catalog.length]);

  return (
    <MainLayout>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/configuracoes" aria-label="Voltar para Configurações">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight font-display">Filtros salvos</h1>
                <p className="text-sm text-muted-foreground">
                  Diagnóstico de hidratação por tela: Supabase (sua conta) e localStorage (este dispositivo).
                </p>
              </div>
            </div>
            <Button onClick={refreshAll} disabled={globalSyncing} className="gap-2">
              {globalSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Forçar sincronização
            </Button>
          </div>

          {/* Resumo */}
          <div className="grid gap-3 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Telas catalogadas</div>
                <div className="text-2xl font-bold mt-1">{totals.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Database className="h-3 w-3" /> Sincronizadas (conta)
                </div>
                <div className="text-2xl font-bold mt-1 text-success">{totals.remoteOk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-3 w-3" /> Espelhadas (dispositivo)
                </div>
                <div className="text-2xl font-bold mt-1">{totals.localOk}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowLeftRight className="h-3 w-3" /> Divergentes
                </div>
                <div className="text-2xl font-bold mt-1 text-warning">{totals.divergent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CloudOff className="h-3 w-3" /> Erros de leitura
                </div>
                <div className="text-2xl font-bold mt-1 text-destructive">{totals.errors}</div>
              </CardContent>
            </Card>
          </div>

          <HydrationFailuresAlert failures={hydrationFailures} />

          {/* Lista */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Telas com filtros</CardTitle>
              <CardDescription>
                Cada linha mostra a entidade, a chave do localStorage e o status atual da hidratação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por entidade, área ou chave…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2">
                  {filteredCatalog.map((entry) => {
                    const diag = diagnostics[entry.entityType];
                    return (
                      <FilterRow
                        key={entry.entityType}
                        entry={entry}
                        diagnostic={diag}
                        onRefresh={() => refreshOne(entry)}
                        userId={user?.id}
                      />
                    );
                  })}
                  {filteredCatalog.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Nenhuma tela encontrada para "{search}".
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </TooltipProvider>
    </MainLayout>
  );
}
