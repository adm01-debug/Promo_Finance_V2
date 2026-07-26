import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { BalanceteRow } from '@/lib/contabil/balancete-utils';

const numero = z.coerce.number().finite().default(0);

const balanceteRowSchema = z.object({
  conta_id: z.string(),
  codigo: z.string(),
  nome: z.string(),
  tipo: z.string().nullable().transform((v) => v ?? ''),
  natureza: z.string().nullable().transform((v) => v ?? ''),
  nivel: z.coerce.number().int().min(1).catch(1),
  aceita_lancamento: z.boolean().nullable().transform((v) => v ?? true),
  saldo_anterior: numero,
  debitos: numero,
  creditos: numero,
  saldo_final: numero,
});

const balanceteSchema = z.array(balanceteRowSchema);

export interface UseBalanceteParams {
  empresaId?: string;
  dataInicio: string;
  dataFim: string;
  /** Corte hierárquico aplicado no banco (opcional). */
  nivelMax?: number | null;
}

/**
 * Balancete de verificação consolidado no Postgres (`fn_balancete`).
 * O front recebe as linhas já agregadas — nenhum cálculo de saldo em memória.
 */
export function useBalancete({ empresaId, dataInicio, dataFim, nivelMax }: UseBalanceteParams) {
  return useQuery<BalanceteRow[]>({
    queryKey: ['balancete', empresaId, dataInicio, dataFim, nivelMax ?? null],
    enabled: Boolean(empresaId && dataInicio && dataFim),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fn_balancete', {
        p_empresa_id: empresaId as string,
        p_data_inicio: dataInicio,
        p_data_fim: dataFim,
        ...(nivelMax != null ? { p_nivel_max: nivelMax } : {}),
      });

      if (error) throw new Error(error.message);

      const parsed = balanceteSchema.safeParse(data ?? []);
      if (!parsed.success) {
        throw new Error('Retorno do balancete em formato inesperado.');
      }
      // Normalização explícita: garante o contrato BalanceteRow (sem campos opcionais).
      return parsed.data.map<BalanceteRow>((r) => ({
        conta_id: r.conta_id ?? '',
        codigo: r.codigo ?? '',
        nome: r.nome ?? '',
        tipo: r.tipo ?? '',
        natureza: r.natureza ?? '',
        nivel: r.nivel ?? 1,
        aceita_lancamento: r.aceita_lancamento ?? true,
        saldo_anterior: r.saldo_anterior ?? 0,
        debitos: r.debitos ?? 0,
        creditos: r.creditos ?? 0,
        saldo_final: r.saldo_final ?? 0,
      }));

    },
  });
}
