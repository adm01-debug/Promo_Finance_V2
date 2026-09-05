import { supabase } from '@/integrations/supabase/client';
import type { ExternalListResponse } from './types';
import { env } from '@/config/env';

const EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES = new Set([
  'EXTERNAL_DB_NOT_CONFIGURED',
  'EXTERNAL_DB_ERROR',
  'EXTERNAL_DB_TIMEOUT',
]);

function isExternalDataNotConfigured(payload: { error?: string; message?: string } | null): boolean {
  return (
    EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES.has(payload?.error ?? '') ||
    EXTERNAL_DATA_NOT_CONFIGURED_MESSAGES.has(payload?.message ?? '')
  );
}

export async function fetchExternalList<T>(params: {
  tabela: string;
  limit: number;
  page?: number;
  search?: string;
}): Promise<ExternalListResponse<T>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const projectId = env.SUPABASE_PROJECT_ID;
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
        apikey: env.SUPABASE_PUBLISHABLE_KEY,
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

  return payload as ExternalListResponse<T>;
}
