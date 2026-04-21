import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Anomalia } from "@/hooks/useAnomaliasDetectadas";

export interface EntidadeRelacionada {
  tipo: string;
  encontrada: boolean;
  registro: Record<string, unknown> | null;
  rotaUI?: string;
}

export interface PontoHistorico {
  data: string;
  valor: number;
  descricao?: string | null;
  id?: string;
}

async function carregarEntidade(
  tipo: string,
  id: string | null
): Promise<EntidadeRelacionada> {
  if (!id) return { tipo, encontrada: false, registro: null };
  const tabelaPorTipo: Record<string, { table: string; rota: string }> = {
    movimentacao: { table: "movimentacoes", rota: "/movimentacoes" },
    conta_pagar: { table: "contas_pagar", rota: "/contas-pagar" },
    conta_receber: { table: "contas_receber", rota: "/contas-receber" },
    transacao_bancaria: { table: "transacoes_bancarias", rota: "/conciliacao" },
  };
  const cfg = tabelaPorTipo[tipo];
  if (!cfg) return { tipo, encontrada: false, registro: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from(cfg.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return {
    tipo,
    encontrada: !!data,
    registro: data ?? null,
    rotaUI: cfg.rota,
  };
}

async function carregarHistorico(
  anomalia: Anomalia
): Promise<PontoHistorico[]> {
  const trintaDias = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  try {
    if (anomalia.entidade_tipo === "movimentacao" && anomalia.empresa_id) {
      const { data } = await supabase
        .from("movimentacoes")
        .select("id, data_movimentacao, valor, descricao")
        .eq("empresa_id", anomalia.empresa_id)
        .gte("data_movimentacao", trintaDias)
        .order("data_movimentacao", { ascending: true })
        .limit(100);
      return (data ?? []).map((r) => ({
        id: r.id,
        data: r.data_movimentacao,
        valor: Math.abs(Number(r.valor)),
        descricao: r.descricao,
      }));
    }
    if (anomalia.entidade_tipo === "conta_pagar" && anomalia.empresa_id) {
      const { data } = await supabase
        .from("contas_pagar")
        .select("id, data_vencimento, valor, descricao")
        .eq("empresa_id", anomalia.empresa_id)
        .gte("data_vencimento", trintaDias)
        .order("data_vencimento", { ascending: true })
        .limit(100);
      return (data ?? []).map((r) => ({
        id: r.id,
        data: r.data_vencimento,
        valor: Number(r.valor),
        descricao: r.descricao,
      }));
    }
    if (anomalia.entidade_tipo === "transacao_bancaria") {
      const { data } = await supabase
        .from("transacoes_bancarias")
        .select("id, data, valor, descricao")
        .gte("data", trintaDias)
        .order("data", { ascending: true })
        .limit(100);
      return (data ?? []).map((r) => ({
        id: r.id,
        data: r.data,
        valor: Number(r.valor),
        descricao: r.descricao,
      }));
    }
  } catch {
    // tabelas podem ter colunas diferentes — fail-safe
  }
  return [];
}

async function carregarRelacionadas(anomalia: Anomalia): Promise<Anomalia[]> {
  let q = supabase
    .from("anomalias_detectadas")
    .select("*")
    .eq("entidade_tipo", anomalia.entidade_tipo)
    .neq("id", anomalia.id)
    .order("detectada_em", { ascending: false })
    .limit(20);
  if (anomalia.entidade_id) q = q.eq("entidade_id", anomalia.entidade_id);
  else if (anomalia.empresa_id) q = q.eq("empresa_id", anomalia.empresa_id);
  const { data } = await q;
  return (data ?? []) as Anomalia[];
}

export function useAnomaliaDetalhe(id: string | undefined) {
  return useQuery({
    queryKey: ["anomalia-detalhe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: anomalia, error } = await supabase
        .from("anomalias_detectadas")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!anomalia) throw new Error("Anomalia não encontrada");
      const a = anomalia as Anomalia;
      const [entidade, historico, relacionadas] = await Promise.all([
        carregarEntidade(a.entidade_tipo, a.entidade_id),
        carregarHistorico(a),
        carregarRelacionadas(a),
      ]);
      return { anomalia: a, entidade, historico, relacionadas };
    },
  });
}
