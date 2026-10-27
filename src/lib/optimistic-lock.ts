/**
 * Lock otimista para edições concorrentes.
 *
 * Duas pessoas editando a mesma conta hoje fazem last-write-wins silencioso:
 * quem salva por último sobrescreve o trabalho da outra sem aviso. Como os
 * triggers moddatetime atualizam `updated_at` em todo UPDATE, o timestamp que
 * a tela viu serve de versão: o update só casa se ninguém mexeu na linha
 * desde a leitura (`.eq('updated_at', visto)`), senão 0 linhas → conflito.
 */
import { supabase } from '@/integrations/supabase/client';

export class ConflitoVersaoError extends Error {
  constructor() {
    super('O registro foi alterado por outra pessoa desde que você abriu.');
    this.name = 'ConflitoVersaoError';
  }
}

export async function updateComLockOtimista(
  tabela: 'contas_pagar' | 'contas_receber',
  id: string,
  updatedAtVisto: string | null,
  patch: Record<string, unknown>
): Promise<string> {
  // updated_at é anulável nas linhas antigas: com versão vista nula o filtro
  // é `.is(null)` — `.eq(col, null)` nunca casa NULL no PostgREST.
  const novaVersao = new Date().toISOString();
  const update = supabase
    .from(tabela)
    .update({ ...patch, updated_at: novaVersao })
    .eq('id', id);
  const { data, error } = await (
    updatedAtVisto === null
      ? update.is('updated_at', null)
      : update.eq('updated_at', updatedAtVisto)
  ).select('id, updated_at');
  if (error) throw error;
  if (!data || data.length === 0) {
    // 0 linhas pode ser conflito de versão OU a RLS negando a escrita (o
    // PostgREST devolve seleção vazia sem erro nos dois casos). A linha ainda
    // com o updated_at visto = ninguém escreveu → permissão/remoção; um
    // updated_at diferente = outra pessoa escreveu → conflito de verdade.
    const { data: atual } = await supabase
      .from(tabela)
      .select('updated_at')
      .eq('id', id)
      .maybeSingle();
    if (atual && atual.updated_at !== updatedAtVisto) throw new ConflitoVersaoError();
    throw new Error('Sem permissão para alterar este registro, ou o registro não existe mais.');
  }
  // O trigger BEFORE UPDATE (update_updated_at_column) sobrescreve o
  // updated_at com o relógio do banco — a versão que vale é a devolvida
  // pelo select, não a que enviamos no patch.
  return data[0].updated_at ?? novaVersao;
}
