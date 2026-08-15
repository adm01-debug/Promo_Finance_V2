import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Filter as FilterIcon,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  Star,
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
  TooltipProvider,
} from '@/components/ui/tooltip';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  SAVED_FILTERS_CATALOG,
} from './savedFiltersCatalog';
import { ModuleSection, type ModuleGroup, type PreferenciaRow } from './MinhasPreferencias.parts';

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
      const { data, error } = await supabaseDyn
        .from('saved_filters')
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
      const { error } = await supabaseDyn
        .from('saved_filters')
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
      const { error } = await supabaseDyn
        .from('saved_filters')
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
      const { error } = await supabaseDyn
        .from('saved_filters')
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
