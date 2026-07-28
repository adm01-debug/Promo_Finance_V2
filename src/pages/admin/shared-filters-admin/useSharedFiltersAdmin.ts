import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { supabaseDyn } from '@/lib/supabase-dynamic';
import {
  buildBundle,
  downloadBundle,
  parseBundle,
  SharedFilterBundleParseError,
  type SharedFilterBundleItem,
} from '@/lib/sharedFiltersExport';
import {
  validateSharing,
  SavedFilterSharingError,
  type AppRole as ValidatedAppRole,
} from '@/hooks/savedFiltersValidation';
import { logAudit } from './audit';
import type {
  AppRole,
  EmpresaLite,
  ProfileLite,
  SharedFilterRow,
} from './types';

interface AuthLike {
  user: { id: string; email?: string | null } | null;
  currentEmpresaId: string | null;
}

export function useSharedFiltersAdmin(auth: AuthLike) {
  const { user, currentEmpresaId } = auth;
  const qc = useQueryClient();
  const queryKey = ['admin-shared-filters'] as const;

  const rowsQuery = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async (): Promise<SharedFilterRow[]> => {
      const { data, error } = await supabaseDyn
        .from('saved_filters')
        .select(
          'id,user_id,created_by,entity_type,name,filters,is_default,is_shared,empresa_id,shared_with_roles,created_at,updated_at',
        )
        .eq('is_shared', true)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SharedFilterRow[];
    },
  });

  const rows = rowsQuery.data ?? [];

  const ownerIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean))),
    [rows],
  );
  const empresaIds = useMemo(
    () => Array.from(new Set(rows.map((r) => r.empresa_id).filter(Boolean))) as string[],
    [rows],
  );

  const ownersQuery = useQuery({
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

  const empresasQuery = useQuery({
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
      const { error } = await supabaseDyn
        .from('saved_filters')
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
      const { error } = await supabaseDyn
        .from('saved_filters')
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

  async function fetchTenantRoles(empresaId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_empresas')
      .select('role')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);
    if (error) throw new Error(error.message);
    const set = new Set<string>();
    (data ?? []).forEach((r: { role: string | null }) => {
      if (r?.role) set.add(r.role);
    });
    return Array.from(set);
  }

  const importBundle = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Sessão expirada');
      if (!currentEmpresaId)
        throw new Error('Selecione uma empresa atual antes de importar.');

      const text = await file.text();
      const bundle = parseBundle(text);
      const tenantRoles = await fetchTenantRoles(currentEmpresaId);

      let inserted = 0;
      let skipped = 0;
      const reasons: string[] = [];

      for (const item of bundle.items as SharedFilterBundleItem[]) {
        let normalized: { sharedWithRoles: ValidatedAppRole[] };
        try {
          normalized = validateSharing({
            isShared: true,
            sharedWithRoles: item.shared_with_roles,
            empresaId: currentEmpresaId,
            tenantRoles,
          });
        } catch (e) {
          skipped++;
          reasons.push(
            `${item.name}: ${
              e instanceof SavedFilterSharingError ? e.message : 'validação falhou'
            }`,
          );
          continue;
        }

        const { error } = await supabaseDyn
          .from('saved_filters')
          .upsert(
            {
              user_id: user.id,
              created_by: user.id,
              entity_type: item.entity_type,
              name: item.name,
              filters: item.filters as never,
              is_default: false,
              is_shared: true,
              empresa_id: currentEmpresaId,
              shared_with_roles: normalized.sharedWithRoles,
            },
            { onConflict: 'user_id,entity_type,name' },
          );
        if (error) {
          skipped++;
          reasons.push(`${item.name}: ${error.message}`);
          continue;
        }
        inserted++;
      }

      await logAudit({
        filterId: '00000000-0000-0000-0000-000000000000',
        details: `Import de bundle: ${inserted} importado(s), ${skipped} ignorado(s); origem_empresa=${bundle.exportedFromEmpresaId ?? '—'}; destino_empresa=${currentEmpresaId}; admin=${user.id}`,
        oldData: { reasons },
        newData: { inserted, skipped, total: bundle.items.length },
      });

      return { inserted, skipped, total: bundle.items.length, reasons };
    },
    onSuccess: (r) => {
      if (r.inserted > 0)
        toast.success(`${r.inserted} filtro(s) importado(s) com sucesso`);
      if (r.skipped > 0)
        toast.warning(
          `${r.skipped} filtro(s) ignorado(s)${r.reasons[0] ? `: ${r.reasons[0]}` : ''}`,
        );
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => {
      const prefix = e instanceof SharedFilterBundleParseError ? 'Arquivo' : 'Erro';
      toast.error(`${prefix}: ${e.message}`);
    },
  });

  function handleExport(exportableRows: SharedFilterRow[]) {
    if (exportableRows.length === 0) {
      toast.error('Nenhum filtro compartilhado da empresa atual para exportar.');
      return;
    }
    const bundle = buildBundle({
      rows: exportableRows.map((r) => ({
        entity_type: r.entity_type,
        name: r.name,
        filters: (r as unknown as { filters?: unknown }).filters ?? {},
        shared_with_roles: r.shared_with_roles,
        empresa_id: r.empresa_id,
        user_id: r.user_id,
      })),
      ownersById: ownersQuery.data ?? {},
      exportedBy: user ? { id: user.id, email: user.email ?? null } : null,
      fromEmpresaId: currentEmpresaId ?? null,
    });
    downloadBundle(bundle);
    toast.success(`${bundle.items.length} filtro(s) exportados`);
  }

  return {
    rows,
    isLoading: rowsQuery.isLoading,
    isFetching: rowsQuery.isFetching,
    refetch: rowsQuery.refetch,
    ownersMap: ownersQuery.data ?? {},
    empresasMap: empresasQuery.data ?? {},
    empresaIds,
    updateRoles,
    revokeAll,
    importBundle,
    handleExport,
  };
}
