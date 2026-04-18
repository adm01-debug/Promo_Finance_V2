// ============================================
// HOOK: useDRETributaria (P10)
// ============================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DRETributaria {
  periodo: string;
  receita_bruta: number;
  deducoes: {
    cbs: number;
    ibs: number;
    imposto_seletivo: number;
    pis: number;
    cofins: number;
    icms: number;
    iss: number;
    total: number;
  };
  receita_liquida: number;
  custos: number;
  lucro_bruto: number;
  irpj: number;
  csll: number;
  lucro_liquido: number;
  carga_tributaria_pct: number;
  comparativo_regime_otimo: {
    regime: string;
    tributos_estimados: number;
    economia_potencial: number;
  } | null;
}

export function useDRETributaria(empresaId?: string, periodo?: string) {
  return useQuery({
    queryKey: ["dre-tributaria", empresaId, periodo],
    queryFn: async () => {
      if (!empresaId || !periodo) return null;
      const { data, error } = await supabase.functions.invoke<{ dre: DRETributaria }>(
        "gerar-dre-tributaria",
        { body: { empresa_id: empresaId, periodo } },
      );
      if (error) throw error;
      return data?.dre ?? null;
    },
    enabled: !!empresaId && !!periodo,
    staleTime: 30 * 60 * 1000,
  });
}
