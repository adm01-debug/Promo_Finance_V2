import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Tipos internos para os dados do Supabase
interface ContaReceberComCliente {
  id: string;
  valor: number;
  valor_recebido: number | null;
  data_vencimento: string;
  status: string;
  cliente_id: string | null;
  vendedor_id: string | null;
  clientes: { ramo_atividade: string | null } | null;
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
      const hoje = new Date().toISOString().split('T')[0];
      
      // Buscar contas a receber com dados do cliente
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

      // Agrupar por ramo de atividade
      const porRamo = new Map<string, {
        total_contas: number;
        total_vencido: number;
        valor_total: number;
        valor_vencido: number;
        dias_atraso_total: number;
      }>();

      (contas as ContaReceberComCliente[] | null)?.forEach((conta) => {
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
      const hoje = new Date().toISOString().split('T')[0];
      const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      // Buscar vendedores
      const { data: vendedores, error: vendedoresError } = await supabase
        .from("vendedores")
        .select("*")
        .eq("ativo", true);

      if (vendedoresError) throw vendedoresError;

      // Buscar contas a receber com vendedor
      const { data: contas, error: contasError } = await supabase
        .from("contas_receber")
        .select("*")
        .not("vendedor_id", "is", null);

      if (contasError) throw contasError;

      // Buscar recebimentos do mês para meta
      const { data: recebidosMes, error: recebidosError } = await supabase
        .from("contas_receber")
        .select("vendedor_id, valor_recebido")
        .eq("status", "pago")
        .gte("data_recebimento", inicioMes)
        .not("vendedor_id", "is", null);

      if (recebidosError) throw recebidosError;

      // Calcular recebido por vendedor no mês
      const recebidoPorVendedor = new Map<string, number>();
      recebidosMes?.forEach((r) => {
        const atual = recebidoPorVendedor.get(r.vendedor_id as string) || 0;
        recebidoPorVendedor.set(r.vendedor_id as string, atual + (r.valor_recebido || 0));
      });

      // Agrupar por vendedor
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
      
      (vendedores as VendedorData[] | null)?.forEach((vendedor) => {
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
