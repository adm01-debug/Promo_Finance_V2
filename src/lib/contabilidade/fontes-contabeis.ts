import { supabaseDyn as supabase } from '@/lib/supabase-dynamic';
import type { FontesContabeis } from './simulacao-regimes';

/** Rótulos usados na UI para dizer de onde veio o faturamento apurado. */
export const ROTULO_FONTE: Record<FontesContabeis['fonteFaturamento'], string> = {
  notas_fiscais: 'Notas fiscais emitidas',
  contas_receber: 'Títulos a receber (sem notas fiscais no período)',
  sem_dados: 'Nenhuma receita encontrada no período',
};

const arredondar = (v: number) => Math.round(v * 100) / 100;

export function janela12m(agora: Date = new Date()): string {
  const d = new Date(agora.getTime());
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
}

function somar(linhas: Array<{ valor?: number | null; valor_total?: number | null }>): number {
  return linhas.reduce((acc, l) => acc + Number(l.valor_total ?? l.valor ?? 0), 0);
}

/**
 * Apura faturamento e compras dos últimos 12 meses no próprio sistema.
 * Faturamento vem de notas fiscais emitidas (não canceladas); quando não há
 * nenhuma nota no período, cai para os títulos a receber.
 */
export async function buscarFontesContabeis(empresaId: string): Promise<FontesContabeis> {
  const inicio = janela12m();

  const notas = await supabase
    .from('notas_fiscais')
    .select('valor_total, status')
    .eq('empresa_id', empresaId)
    .gte('data_emissao', inicio)
    .limit(5000);
  if (notas.error) throw notas.error;
  const notasValidas = (
    (notas.data ?? []) as Array<{
      valor_total: number | null;
      status: string | null;
    }>
  ).filter((n) => (n.status ?? '').toLowerCase() !== 'cancelada');

  let faturamento = somar(notasValidas);
  let titulosConsiderados = 0;
  let fonteFaturamento: FontesContabeis['fonteFaturamento'] = 'notas_fiscais';

  if (faturamento <= 0) {
    const titulos = await supabase
      .from('contas_receber')
      .select('valor, status')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .neq('status', 'cancelado')
      .gte('data_emissao', inicio)
      .limit(5000);
    if (titulos.error) throw titulos.error;
    titulosConsiderados = (titulos.data ?? []).length;
    faturamento = somar(titulos.data ?? []);
    fonteFaturamento = faturamento > 0 ? 'contas_receber' : 'sem_dados';
  }

  const compras = await supabase
    .from('contas_pagar')
    .select('valor, status')
    .eq('empresa_id', empresaId)
    .is('deleted_at', null)
    .neq('status', 'cancelado')
    .gte('data_emissao', inicio)
    .limit(5000);
  if (compras.error) throw compras.error;

  return {
    faturamento12m: arredondar(faturamento),
    comprasServicos12m: arredondar(somar(compras.data ?? [])),
    notasConsideradas: notasValidas.length,
    titulosConsiderados,
    fonteFaturamento,
    janelaInicio: inicio,
  };
}
