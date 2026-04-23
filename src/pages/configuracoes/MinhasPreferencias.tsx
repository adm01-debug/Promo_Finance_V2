import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Columns3,
  ExternalLink,
  Filter as FilterIcon,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  ShieldOff,
  Star,
  Trash2,
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  SAVED_FILTERS_CATALOG,
  findCatalogEntry,
  type FilterCatalogEntry,
} from './savedFiltersCatalog';

/** Linha enxuta usada apenas nesta tela (sem importar tipos do hook). */
interface PreferenciaRow {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  filters: {
    filters?: Record<string, unknown>;
    columns?: string[];
    sort?: { key: string; dir: 'asc' | 'desc' };
  } | null;
  is_default: boolean;
  is_shared: boolean;
  empresa_id: string | null;
  shared_with_roles: string[];
  updated_at: string;
}

interface ModuleGroup {
  entry: FilterCatalogEntry | { entityType: string; label: string; area: string; route: string };
  rows: PreferenciaRow[];
}

export default function MinhasPreferencias() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const queryKey = ['minhas-preferencias', user?.id] as const;

  const { data: rows = [], isLoading, isFetching, refetch } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async (): Promise<PreferenciaRow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .select(
          'id,user_id,entity_type,name,filters,is_default,is_shared,empresa_id,shared_with_roles,updated_at',
        )
        .eq('user_id', user.id)
        .order('entity_type', { ascending: true })
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as PreferenciaRow[];
    },
  });

  const setDefault = useMutation({
    mutationFn: async (row: PreferenciaRow) => {
      // Limpa default antigo da mesma entidade do usuário; trigger ensure_single_default_filter
      // já cuida disso, mas garantimos via update direto.
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .update({ is_default: !row.is_default })
        .eq('id', row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Preferência padrão atualizada');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const stopSharing = useMutation({
    mutationFn: async (row: PreferenciaRow) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .update({ is_shared: false, shared_with_roles: [] })
        .eq('id', row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Compartilhamento removido');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (row: PreferenciaRow) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .delete()
        .eq('id', row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Preferência removida');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  // Agrupa por módulo, considerando catálogo + entidades órfãs (sem catálogo)
  const groups = useMemo<ModuleGroup[]>(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.entity_type.toLowerCase().includes(q),
        )
      : rows;

    const byEntity = new Map<string, PreferenciaRow[]>();
    for (const r of filtered) {
      const arr = byEntity.get(r.entity_type) ?? [];
      arr.push(r);
      byEntity.set(r.entity_type, arr);
    }

    const out: ModuleGroup[] = [];
    // primeiro os módulos do catálogo (mantém ordem do catálogo)
    for (const entry of SAVED_FILTERS_CATALOG) {
      const list = byEntity.get(entry.entityType);
      if (list && list.length > 0) {
        out.push({ entry, rows: list });
        byEntity.delete(entry.entityType);
      } else if (!q) {
        // mostra módulo vazio quando não há busca, para usuário entender o catálogo
        out.push({ entry, rows: [] });
      }
    }
    // depois entidades órfãs (presets de telas ainda não catalogadas)
    for (const [entityType, list] of byEntity) {
      out.push({
        entry: {
          entityType,
          label: entityType,
          area: 'Outros',
          route: '#',
        },
        rows: list,
      });
    }
    return out;
  }, [rows, search]);

  const totals = useMemo(() => {
    return {
      total: rows.length,
      shared: rows.filter((r) => r.is_shared).length,
      defaults: rows.filter((r) => r.is_default).length,
      modulos: new Set(rows.map((r) => r.entity_type)).size,
    };
  }, [rows]);

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
                <h1 className="text-2xl font-bold tracking-tight font-display">
                  Minhas preferências
                </h1>
                <p className="text-sm text-muted-foreground">
                  Veja e ajuste os presets de filtros e colunas que sincronizam entre seus dispositivos.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/configuracoes/filtros-salvos">
                  <FilterIcon className="h-4 w-4" />
                  Diagnóstico
                </Link>
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

          {/* Resumo */}
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Presets salvos</div>
                <div className="text-2xl font-bold mt-1">{totals.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">Módulos com presets</div>
                <div className="text-2xl font-bold mt-1">{totals.modulos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3" /> Marcados como padrão
                </div>
                <div className="text-2xl font-bold mt-1">{totals.defaults}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> Compartilhados
                </div>
                <div className="text-2xl font-bold mt-1">{totals.shared}</div>
              </CardContent>
            </Card>
          </div>

          {/* Lista por módulo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Presets por módulo</CardTitle>
              <CardDescription>
                Cada preset guarda filtros, ordenação e colunas visíveis. O preset marcado como padrão é aplicado automaticamente ao abrir a tela.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do preset ou módulo…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="max-h-[65vh]">
                  <div className="space-y-6">
                    {groups.map((g) => (
                      <ModuleSection
                        key={g.entry.entityType}
                        group={g}
                        onToggleDefault={(r) => setDefault.mutate(r)}
                        onStopSharing={(r) => stopSharing.mutate(r)}
                        onDelete={(r) => remove.mutate(r)}
                        busyId={
                          setDefault.isPending || stopSharing.isPending || remove.isPending
                            ? (setDefault.variables as PreferenciaRow | undefined)?.id ??
                              (stopSharing.variables as PreferenciaRow | undefined)?.id ??
                              (remove.variables as PreferenciaRow | undefined)?.id ??
                              null
                            : null
                        }
                      />
                    ))}
                    {groups.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Nenhum preset encontrado{search ? ` para “${search}”` : ''}.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </TooltipProvider>
    </MainLayout>
  );
}

interface ModuleSectionProps {
  group: ModuleGroup;
  onToggleDefault: (row: PreferenciaRow) => void;
  onStopSharing: (row: PreferenciaRow) => void;
  onDelete: (row: PreferenciaRow) => void;
  busyId: string | null;
}

function ModuleSection({ group, onToggleDefault, onStopSharing, onDelete, busyId }: ModuleSectionProps) {
  const { entry, rows } = group;
  const catalog = findCatalogEntry(entry.entityType);
  return (
    <section className="rounded-lg border border-border bg-card/40">
      <div className="flex items-center justify-between gap-3 p-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold">{entry.label}</h2>
            <Badge variant="outline" className="text-[10px]">
              {entry.area}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              {entry.entityType}
            </span>
          </div>
          {catalog?.defaultsKeys?.length ? (
            <p className="text-xs text-muted-foreground mt-1">
              Campos sincronizados: {catalog.defaultsKeys.join(', ')}
            </p>
          ) : null}
        </div>
        {entry.route && entry.route !== '#' ? (
          <Button asChild variant="ghost" size="sm" className="gap-1 h-7">
            <Link to={entry.route}>
              <ExternalLink className="h-3 w-3" />
              Abrir tela
            </Link>
          </Button>
        ) : null}
      </div>
      <Separator />
      {rows.length === 0 ? (
        <div className="p-6 text-center text-xs text-muted-foreground">
          Nenhum preset salvo para este módulo. Aplique filtros ou ajuste colunas na tela e clique em <span className="font-semibold">Salvar preset</span>.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <PresetRow
              key={row.id}
              row={row}
              onToggleDefault={onToggleDefault}
              onStopSharing={onStopSharing}
              onDelete={onDelete}
              busy={busyId === row.id}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface PresetRowProps {
  row: PreferenciaRow;
  onToggleDefault: (row: PreferenciaRow) => void;
  onStopSharing: (row: PreferenciaRow) => void;
  onDelete: (row: PreferenciaRow) => void;
  busy: boolean;
}

function PresetRow({ row, onToggleDefault, onStopSharing, onDelete, busy }: PresetRowProps) {
  const filtersObj = (row.filters?.filters ?? {}) as Record<string, unknown>;
  const filterKeys = Object.keys(filtersObj);
  const columns = row.filters?.columns ?? [];
  const sort = row.filters?.sort ?? null;

  return (
    <li className="p-4 flex items-start justify-between gap-4 flex-wrap hover:bg-card/60 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{row.name}</span>
          {row.is_default && (
            <Badge variant="outline" className="gap-1 text-[10px] border-primary/40 text-primary">
              <Star className="h-3 w-3" /> Padrão
            </Badge>
          )}
          {row.is_shared && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <Share2 className="h-3 w-3" />
                  Compartilhado
                  {row.shared_with_roles.length > 0 && ` · ${row.shared_with_roles.length}`}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  {row.shared_with_roles.length === 0
                    ? 'Visível para todos os papéis do tenant.'
                    : `Papéis: ${row.shared_with_roles.join(', ')}`}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="grid gap-2 md:grid-cols-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-start gap-1">
            <FilterIcon className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{filterKeys.length}</span> filtro(s)
              {filterKeys.length > 0 && (
                <span className="block font-mono truncate">{filterKeys.join(', ')}</span>
              )}
            </span>
          </div>
          <div className="flex items-start gap-1">
            <Columns3 className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{columns.length}</span> coluna(s) sincronizada(s)
              {columns.length > 0 && (
                <span className="block font-mono truncate">{columns.join(', ')}</span>
              )}
            </span>
          </div>
          <div>
            {sort ? (
              <>
                Ordenação: <span className="font-mono text-foreground">{sort.key}</span>{' '}
                <span className="uppercase">{sort.dir}</span>
              </>
            ) : (
              <span>Sem ordenação salva</span>
            )}
            <div className="mt-1">
              Atualizado: {new Date(row.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch
                checked={row.is_default}
                disabled={busy}
                onCheckedChange={() => onToggleDefault(row)}
                aria-label="Marcar como padrão"
              />
              <span className="text-xs text-muted-foreground">Padrão</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Aplica este preset automaticamente ao abrir a tela.</p>
          </TooltipContent>
        </Tooltip>

        {row.is_shared && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8"
            disabled={busy}
            onClick={() => onStopSharing(row)}
          >
            <ShieldOff className="h-3 w-3" />
            Parar de compartilhar
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              disabled={busy}
              aria-label="Excluir preset"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir preset “{row.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove permanentemente o preset desta sua conta. Outras pessoas que receberam este preset compartilhado deixarão de vê-lo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(row)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
