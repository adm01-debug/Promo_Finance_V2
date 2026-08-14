import { supabase } from '@/integrations/supabase/client';

export async function blingAction(action: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado');

  const { data, error } = await supabase.functions.invoke('bling-proxy', {
    body: { action, ...params },
  });

  if (error) throw new Error(error.message || 'Erro na comunicação com Bling');
  if (data?.error) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
  return data;
}
