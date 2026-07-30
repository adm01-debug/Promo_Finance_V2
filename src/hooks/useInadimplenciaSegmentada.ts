import { todayISOLocal } from '@/lib/formatters';

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PredicaoInadimplencia {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  probabilidade: number;
  impacto_estimado: number;
  data_previsao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  status: string;
}

export interface VendedorData {
  id: string;
  nome: string;
  meta_mensal: number | null;
}

export type Vendedor = VendedorData;

export interface InadimplenciaPorRamo {
  ramo: string;
  total_contas: number;
  total_vencido: number;
  valor_total: number;
  valor_vencido: number;
  taxa_inadimplencia: number;
  dias_atraso_medio: number;
}

export interface InadimplenciaPorVendedor {
  vendedor_id: string;
  vendedor_nome: string;
  total_contas: number;
  total_vencido: number;
  valor_total: number;
  valor_vencido: number;
  taxa_inadimplencia: number;
  dias_atraso_medio: number;
  meta_mensal: number;
  atingimento_meta: number;
}

export function useInadimplenciaPorRamo() {
  return useQuery({
    queryKey: ["inadimplencia-por-ramo"],
    queryFn: async () => {
      const hoje = todayISOLocal();
      
      const { data: contas, error } = await supabase
        .from("contas_receber")
        .select(`
          id,
          valor,
          valor_recebido,
          data_vencimento,
          status,
          cliente_id,
          clientes!inner(ramo_atividade)
        `)
        .in("status", ["pendente", "vencido", "parcial"]);

      if (error) throw error;

      const porRamo = new Map<string, {
        total_contas: number;
        total_vencido: number;
        valor_total: number;
        valor_vencido: number;
        dias_atraso_total: number;
      }>();

      (contas as Array<Record<string, any>> | null)?.forEach((conta) => {
        const ramo = conta.clientes?.ramo_atividade || "Não informado";
        const valorPendente = conta.valor - (conta.valor_recebido || 0);
        const isVencido = conta.data_vencimento < hoje;
        const diasAtraso = isVencido 
          ? Math.floor((new Date().getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        if (!porRamo.has(ramo)) {
          porRamo.set(ramo, {
            total_contas: 0,
            total_vencido: 0,
            valor_total: 0,
            valor_vencido: 0,
            dias_atraso_total: 0,
          });
        }

        const stats = porRamo.get(ramo)!;
        stats.total_contas++;
        stats.valor_total += valorPendente;
        
        if (isVencido) {
          stats.total_vencido++;
          stats.valor_vencido += valorPendente;
          stats.dias_atraso_total += diasAtraso;
        }
      });

      const resultado: InadimplenciaPorRamo[] = [];
      porRamo.forEach((stats, ramo) => {
        resultado.push({
          ramo,
          total_contas: stats.total_contas,
          total_vencido: stats.total_vencido,
          valor_total: stats.valor_total,
          valor_vencido: stats.valor_vencido,
          taxa_inadimplencia: stats.total_contas > 0 
            ? (stats.total_vencido / stats.total_contas) * 100 
            : 0,
          dias_atraso_medio: stats.total_vencido > 0 
            ? stats.dias_atraso_total / stats.total_vencido 
            : 0,
        });
      });

      return resultado.sort((a, b) => b.taxa_inadimplencia - a.taxa_inadimplencia);
    },
  });
}

export function useInadimplenciaPorVendedor() {
  return useQuery({
    queryKey: ["inadimplencia-por-vendedor"],
    queryFn: async () => {
      const hoje = todayISOLocal();
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      const { data: vendedores, error: vendedoresError } = await supabase
        .from("vendedores")
        .select("*")
        .eq("ativo", true);

      if (vendedoresError) throw vendedoresError;

      const { data: contas, error: contasError } = await supabase
        .from("contas_receber")
        .select("*")
        .not("vendedor_id", "is", null);

      if (contasError) throw contasError;

      const { data: recebidosMes, error: recebidosError } = await supabase
        .from("contas_receber")
        .select("vendedor_id, valor_recebido")
        .eq("status", "pago")
        .gte("data_recebimento", inicioMes)
        .not("vendedor_id", "is", null);

      if (recebidosError) throw recebidosError;

      const recebidoPorVendedor = new Map<string, number>();
      recebidosMes?.forEach((r) => {
        const atual = recebidoPorVendedor.get(r.vendedor_id as string) || 0;
        recebidoPorVendedor.set(r.vendedor_id as string, atual + (r.valor_recebido || 0));
      });

      const porVendedor = new Map<string, {
        total_contas: number;
        total_vencido: number;
        valor_total: number;
        valor_vencido: number;
        dias_atraso_total: number;
      }>();

      contas?.forEach((conta) => {
        if (!conta.vendedor_id) return;
        
        const valorPendente = conta.valor - (conta.valor_recebido || 0);
        const isVencido = conta.data_vencimento < hoje && conta.status !== 'pago';
        const diasAtraso = isVencido 
          ? Math.floor((new Date().getTime() - new Date(conta.data_vencimento).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        if (!porVendedor.has(conta.vendedor_id)) {
          porVendedor.set(conta.vendedor_id, {
            total_contas: 0,
            total_vencido: 0,
            valor_total: 0,
            valor_vencido: 0,
            dias_atraso_total: 0,
          });
        }

        const stats = porVendedor.get(conta.vendedor_id)!;
        stats.total_contas++;
        stats.valor_total += valorPendente;
        
        if (isVencido) {
          stats.total_vencido++;
          stats.valor_vencido += valorPendente;
          stats.dias_atraso_total += diasAtraso;
        }
      });

      const resultado: InadimplenciaPorVendedor[] = [];
      
      (vendedores as Array<Record<string, any>> | null)?.forEach((vendedor) => {
        const stats = porVendedor.get(vendedor.id) || {
          total_contas: 0,
          total_vencido: 0,
          valor_total: 0,
          valor_vencido: 0,
          dias_atraso_total: 0,
        };

        const recebidoMes = recebidoPorVendedor.get(vendedor.id) || 0;
        const metaMensal = vendedor.meta_mensal || 0;
        
        resultado.push({
          vendedor_id: vendedor.id,
          vendedor_nome: vendedor.nome,
          total_contas: stats.total_contas,
          total_vencido: stats.total_vencido,
          valor_total: stats.valor_total,
          valor_vencido: stats.valor_vencido,
          taxa_inadimplencia: stats.total_contas > 0 
            ? (stats.total_vencido / stats.total_contas) * 100 
            : 0,
          dias_atraso_medio: stats.total_vencido > 0 
            ? stats.dias_atraso_total / stats.total_vencido 
            : 0,
          meta_mensal: metaMensal,
          atingimento_meta: metaMensal > 0 ? (recebidoMes / metaMensal) * 100 : 0,
        });
      });

      return resultado.sort((a, b) => b.taxa_inadimplencia - a.taxa_inadimplencia);
    },
  });
}

export function usePrevisoesInadimplencia() {
  return useQuery({
    queryKey: ["previsoes-inadimplencia"],
    queryFn: async () => {
      // Prioriza dados reais da tabela de alertas_preditivos (Predictive Engine 10/10)
      const { data, error } = await supabase
        .from("alertas_preditivos")
        .select("*")
        .eq("tipo", "inadimplencia")
        .eq("status", "pendente")
        .order("probabilidade", { ascending: false });

      if (error) throw error;
      
      // Se não houver alertas pré-gerados, retornamos vazio para que o front processe via algoritmo local
      // ou podemos disparar um RPC aqui para gerar novos alertas baseados em buckets
      return (data || []).map((item: any) => ({
        id: item.id,
        tipo: 'inadimplencia',
        titulo: item.titulo,
        descricao: item.descricao,
        probabilidade: item.probabilidade,
        impacto_estimado: item.valor_estimado,
        data_previsao: item.data_prevista,
        prioridade: item.probabilidade > 80 ? 'alta' : item.probabilidade > 50 ? 'media' : 'baixa',
        status: item.status as string
      })) as PredicaoInadimplencia[];
    },
  });
}

export function useRamosAtividade() {
  return useQuery({
    queryKey: ["ramos-atividade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("ramo_atividade")
        .not("ramo_atividade", "is", null);

      if (error) throw error;

      const ramos = [...new Set(data?.map(c => c.ramo_atividade).filter(Boolean))];
      return ramos.sort();
    },
  });
}

export function useVendedores() {
  return useQuery({
    queryKey: ["vendedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendedores")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
  });
}
