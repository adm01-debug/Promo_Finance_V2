import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

type AppRole = 'admin' | 'financeiro' | 'operacional' | 'visualizador';

const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  operacional: 'Operacional',
  visualizador: 'Visualizador',
};

const ROLE_OPTIONS: AppRole[] = [
  'admin',
  'financeiro',
  'operacional',
  'visualizador',
];

interface SharedFilterRow {
  id: string;
  user_id: string;
  created_by: string | null;
  entity_type: string;
  name: string;
  is_default: boolean;
  is_shared: boolean;
  empresa_id: string | null;
  shared_with_roles: AppRole[];
  created_at: string;
  updated_at: string;
}

interface ProfileLite {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface EmpresaLite {
  id: string;
  razao_social: string | null;
  nome_fantasia: string | null;
}

async function logAudit(params: {
  filterId: string;
  details: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}) {
  try {
    await supabase.rpc('log_audit', {
      _action: 'UPDATE',
      _table_name: 'saved_filters',
      _record_id: params.filterId,
      _old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      _new_data: params.newData ? JSON.stringify(params.newData) : null,
      _details: params.details,
    });
  } catch (e) {
    logger.warn('[shared-filters-admin] audit log falhou', e);
  }
}

export default function SharedFiltersAdmin() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const queryKey = ['admin-shared-filters'] as const;

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<SharedFilterRow[]> => {
      const { data, error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .select(
          'id,user_id,created_by,entity_type,name,is_default,is_shared,empresa_id,shared_with_roles,created_at,updated_at',
        )
        .eq('is_shared', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SharedFilterRow[];
    },
  });

  const ownerIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))),
    [rows],
  );
  const empresaIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empresa_id).filter(Boolean))) as string[],
    [rows],
  );

  const { data: ownersMap = {} } = useQuery({
    queryKey: ['admin-shared-filters-owners', ownerIds.join(',')],
    enabled: ownerIds.length > 0,
    queryFn: async (): Promise<Record<string, ProfileLite>> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name')
        .in('id', ownerIds);
      if (error) throw error;
      const map: Record<string, ProfileLite> = {};
      (data ?? []).forEach((p) => {
        map[p.id] = p as ProfileLite;
      });
      return map;
    },
  });

  const { data: empresasMap = {} } = useQuery({
    queryKey: ['admin-shared-filters-empresas', empresaIds.join(',')],
    enabled: empresaIds.length > 0,
    queryFn: async (): Promise<Record<string, EmpresaLite>> => {
      const { data, error } = await supabase
        .from('empresas')
        .select('id,razao_social,nome_fantasia')
        .in('id', empresaIds);
      if (error) throw error;
      const map: Record<string, EmpresaLite> = {};
      (data ?? []).forEach((e) => {
        map[e.id] = e as EmpresaLite;
      });
      return map;
    },
  });

  const updateRoles = useMutation({
    mutationFn: async (input: {
      row: SharedFilterRow;
      nextRoles: AppRole[];
    }) => {
      const { row, nextRoles } = input;
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .update({ shared_with_roles: nextRoles })
        .eq('id', row.id);
      if (error) throw error;

      await logAudit({
        filterId: row.id,
        details: `Papéis atualizados em filtro "${row.name}" (entity=${row.entity_type}); empresa=${row.empresa_id ?? '—'}; antes=[${row.shared_with_roles.join(',')}]; depois=[${nextRoles.join(',')}]; admin=${user?.id ?? '—'}`,
        oldData: { shared_with_roles: row.shared_with_roles },
        newData: { shared_with_roles: nextRoles },
      });
    },
    onSuccess: () => {
      toast.success('Permissões atualizadas');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const revokeAll = useMutation({
    mutationFn: async (row: SharedFilterRow) => {
      const { error } = await supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('saved_filters' as any)
        .update({
          is_shared: false,
          shared_with_roles: [],
          empresa_id: null,
        })
        .eq('id', row.id);
      if (error) throw error;

      await logAudit({
        filterId: row.id,
        details: `Compartilhamento revogado completamente em "${row.name}" (entity=${row.entity_type}); empresa=${row.empresa_id ?? '—'}; roles_revogados=[${row.shared_with_roles.join(',')}]; admin=${user?.id ?? '—'}`,
        oldData: {
          is_shared: row.is_shared,
          shared_with_roles: row.shared_with_roles,
          empresa_id: row.empresa_id,
        },
        newData: { is_shared: false, shared_with_roles: [], empresa_id: null },
      });
    },
    onSuccess: () => {
      toast.success('Compartilhamento revogado');
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

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

  const totals = useMemo(() => {
    return {
      total: rows.length,
      entidades: entityTypes.length,
      empresas: empresaIds.length,
      sem_papeis: rows.filter((r) => (r.shared_with_roles ?? []).length === 0)
        .length,
    };
  }, [rows, entityTypes.length, empresaIds.length]);

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
        {/* Header */}
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

        {/* Resumo */}
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

        {/* Filtros */}
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

function SummaryCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warning';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div
          className={`text-2xl font-bold mt-1 ${
            tone === 'warning' && value > 0 ? 'text-warning' : ''
          }`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterCardProps {
  row: SharedFilterRow;
  owner?: ProfileLite;
  empresa?: EmpresaLite;
  onToggleRole: (role: AppRole) => void;
  onRevoke: () => void;
  busy: boolean;
}

function FilterCard({
  row,
  owner,
  empresa,
  onToggleRole,
  onRevoke,
  busy,
}: FilterCardProps) {
  const activeRoles = new Set(row.shared_with_roles);
  const empresaLabel =
    empresa?.nome_fantasia ?? empresa?.razao_social ?? row.empresa_id ?? '—';
  const ownerLabel = owner?.full_name || owner?.email || row.user_id;

  return (
    <div className="rounded-lg border border-border bg-card/60 p-4 hover:bg-card transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{row.name}</span>
            <Badge variant="outline" className="text-[10px]">
              {row.entity_type}
            </Badge>
            {row.is_default && (
              <Badge variant="secondary" className="text-[10px]">
                Padrão
              </Badge>
            )}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div>
              <span className="text-foreground font-medium">Dono:</span>{' '}
              {ownerLabel}
              {owner?.email && owner.full_name ? (
                <span className="opacity-70"> ({owner.email})</span>
              ) : null}
            </div>
            <div>
              <span className="text-foreground font-medium">Empresa:</span>{' '}
              {empresaLabel}
            </div>
            <div>
              <span className="text-foreground font-medium">
                Atualizado em:
              </span>{' '}
              {new Date(row.updated_at).toLocaleString('pt-BR')}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Revogar tudo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revogar compartilhamento?</AlertDialogTitle>
                <AlertDialogDescription>
                  O filtro <strong>{row.name}</strong> deixará de ser
                  compartilhado. O dono ainda pode usá-lo em sua biblioteca
                  pessoal. Esta ação será registrada na auditoria.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onRevoke}>
                  Confirmar revogação
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          Papéis com acesso
          {activeRoles.size === 0 && (
            <Badge
              variant="outline"
              className="text-[10px] border-warning/40 text-warning"
            >
              Todos os papéis da empresa
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => {
            const active = activeRoles.has(role);
            return (
              <Button
                key={role}
                size="sm"
                variant={active ? 'default' : 'outline'}
                disabled={busy}
                onClick={() => onToggleRole(role)}
                className="gap-1 h-7"
              >
                {active ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <ShieldOff className="h-3 w-3 opacity-60" />
                )}
                {ROLE_LABEL[role]}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
