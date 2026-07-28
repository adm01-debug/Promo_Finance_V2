import { supabase } from '@/integrations/supabase/client';
import type { ExternalListResponse } from './types';

const EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES = new Set([
  'External DB not configured',
  'EXTERNAL_DB_NOT_CONFIGURED',
]);

export function isExternalDataNotConfigured(
  payload: ExternalListResponse<unknown> | null | undefined,
) {
  if (!payload) return false;
  return (
    EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES.has(payload.error ?? '') ||
    Boolean(payload.fallback) ||
    (payload.message?.toLowerCase().includes('não configurada') ?? false) ||
    (payload.message?.toLowerCase().includes('not configured') ?? false)
  );
}

export async function fetchExternalData<T>(params: {
  tabela: 'clientes' | 'fornecedores';
  limit: number;
  page?: number;
  search?: string;
}): Promise<ExternalListResponse<T>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const queryParams = new URLSearchParams({
    tabela: params.tabela,
    limit: String(params.limit),
    ...(params.page ? { page: String(params.page) } : {}),
    ...(params.search ? { search: params.search } : {}),
  });

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/external-data?${queryParams}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | ExternalListResponse<T>
    | null;

  if (!response.ok) {
    if (isExternalDataNotConfigured(payload)) {
      return { data: [], total: 0, total_pages: 0, fallback: true };
    }
    throw new Error(
      payload?.message || payload?.error || `Erro ao buscar ${params.tabela} externos`,
    );
  }

  if (isExternalDataNotConfigured(payload)) {
    return { ...payload, data: [], total: 0, total_pages: 0, fallback: true };
  }

  return payload ?? { data: [], total: 0, total_pages: 0 };
}
