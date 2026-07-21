import { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { FilterCard } from './shared-filters-admin/FilterCard';
import { SummaryCard } from './shared-filters-admin/SummaryCard';
import { useSharedFiltersAdmin } from './shared-filters-admin/useSharedFiltersAdmin';

export default function SharedFiltersAdmin() {
  const { user, isAdmin, currentEmpresaId } = useAuth();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    rows,
    isLoading,
    isFetching,
    refetch,
    ownersMap,
    empresasMap,
    empresaIds,
    updateRoles,
    revokeAll,
    importBundle,
    handleExport,
  } = useSharedFiltersAdmin({ user, currentEmpresaId });

  const exportableRows = useMemo(() => {
    return currentEmpresaId
      ? rows.filter((r) => r.empresa_id === currentEmpresaId)
      : rows;
  }, [rows, currentEmpresaId]);

  function handlePickFile(file: File | null) {
    if (!file) return;
    importBundle.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const entityTypes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.entity_type))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (entityFilter !== 'all' && r.entity_type !== entityFilter) return false;
      if (!q) return true;
      const owner = ownersMap[r.user_id];
      const empresa = r.empresa_id ? empresasMap[r.empresa_id] : null;
      return (
        r.name.toLowerCase().includes(q) ||
        r.entity_type.toLowerCase().includes(q) ||
        (owner?.email ?? '').toLowerCase().includes(q) ||
        (owner?.full_name ?? '').toLowerCase().includes(q) ||
        (empresa?.nome_fantasia ?? '').toLowerCase().includes(q) ||
        (empresa?.razao_social ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, entityFilter, ownersMap, empresasMap]);

  const totals = useMemo(
    () => ({
      total: rows.length,
      entidades: entityTypes.length,
      empresas: empresaIds.length,
      sem_papeis: rows.filter((r) => (r.shared_with_roles ?? []).length === 0)
        .length,
    }),
    [rows, entityTypes.length, empresaIds.length],
  );

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
              <CardDescription>
                Apenas administradores podem gerenciar permissões de filtros
                compartilhados.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/configuracoes" aria-label="Voltar">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Permissões de filtros compartilhados
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie papéis com acesso a cada filtro salvo compartilhado e
                revogue seletivamente quando necessário.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handlePickFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleExport(exportableRows)}
              disabled={isLoading || exportableRows.length === 0}
              title={
                currentEmpresaId
                  ? 'Exporta filtros compartilhados da empresa atual'
                  : 'Exporta todos os filtros compartilhados visíveis'
              }
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={importBundle.isPending || !currentEmpresaId}
              title={
                currentEmpresaId
                  ? 'Importa um bundle .json para a empresa atual'
                  : 'Selecione uma empresa atual antes de importar'
              }
            >
              {importBundle.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar
            </Button>
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
              variant="outline"
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard label="Filtros compartilhados" value={totals.total} />
          <SummaryCard label="Entidades distintas" value={totals.entidades} />
          <SummaryCard label="Empresas envolvidas" value={totals.empresas} />
          <SummaryCard
            label="Sem papéis (todos podem ver)"
            value={totals.sem_papeis}
            tone={totals.sem_papeis > 0 ? 'warning' : 'default'}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Catálogo</CardTitle>
            <CardDescription>
              Cada cartão lista o dono, empresa, entidade e papéis com acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, dono, empresa ou entidade…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas entidades</SelectItem>
                  {entityTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="max-h-[65vh] pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Carregando…
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  Nenhum filtro compartilhado encontrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((row) => (
                    <FilterCard
                      key={row.id}
                      row={row}
                      owner={ownersMap[row.user_id]}
                      empresa={
                        row.empresa_id ? empresasMap[row.empresa_id] : undefined
                      }
                      onToggleRole={(role) => {
                        const current = new Set(row.shared_with_roles);
                        if (current.has(role)) current.delete(role);
                        else current.add(role);
                        updateRoles.mutate({
                          row,
                          nextRoles: Array.from(current),
                        });
                      }}
                      onRevoke={() => revokeAll.mutate(row)}
                      busy={updateRoles.isPending || revokeAll.isPending}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  );
}
