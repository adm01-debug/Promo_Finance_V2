import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Aprende uma regra de conciliação a partir de um match manual confirmado.
 * Verifica se já existe regra com mesmo padrão; se sim, incrementa vezes_aplicada.
 */
export async function aprenderRegra(
  descricaoExtrato: string,
  entidadeNome: string,
  lancamentoTipo: 'pagar' | 'receber',
  entidadeId?: string,
) {
  // Normalize pattern
  const padrao = descricaoExtrato
    .toLowerCase()
    .replace(/[0-9]{2}\/[0-9]{2}\/[0-9]{4}/g, '') // remove dates
    .replace(/[0-9]+/g, '') // remove numbers
    .replace(/\s+/g, ' ')
    .trim();

  if (padrao.length < 4) return; // too short to be useful

  // Check existing
  const { data: existing } = await supabase
    .from('regras_conciliacao')
    .select('id, vezes_aplicada')
    .eq('padrao_descricao', padrao)
    .eq('entidade_nome', entidadeNome)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('regras_conciliacao')
      .update({ vezes_aplicada: (existing.vezes_aplicada || 0) + 1 })
      .eq('id', existing.id);
  } else {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from('regras_conciliacao').insert({
      padrao_descricao: padrao,
      entidade_nome: entidadeNome,
      lancamento_tipo: lancamentoTipo,
      entidade_id: entidadeId,
      created_by: user?.id,
    });
  }
}

/**
 * Aplica regras aprendidas a uma descrição de extrato.
 * Retorna a regra mais relevante, se houver.
 */
export async function aplicarRegras(descricaoExtrato: string) {
  const { data: regras } = await supabase
    .from('regras_conciliacao')
    .select('*')
    .eq('ativo', true)
    .order('vezes_aplicada', { ascending: false });

  if (!regras?.length) return null;

  const descNorm = descricaoExtrato.toLowerCase();

  for (const regra of regras) {
    if (descNorm.includes(regra.padrao_descricao)) {
      // Increment usage
      await supabase
        .from('regras_conciliacao')
        .update({ vezes_aplicada: (regra.vezes_aplicada || 0) + 1 })
        .eq('id', regra.id);
      return regra;
    }
  }

  return null;
}
