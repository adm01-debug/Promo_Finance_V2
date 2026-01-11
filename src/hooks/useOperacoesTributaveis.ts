// ============================================
// HOOK: OPERAÇÕES TRIBUTÁVEIS
// Gerencia operações com cálculo CBS/IBS/IS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALIQUOTAS_TRANSICAO, CONFIGURACOES_IS, REGIMES_ESPECIAIS } from '@/types/reforma-tributaria';

export interface OperacaoTributavel {
  id: string;
  empresa_id: string;
  tipo_operacao: 'venda' | 'compra' | 'servico_prestado' | 'servico_tomado' | 'importacao' | 'exportacao' | 'devolucao_venda' | 'devolucao_compra';
  
  // Documento
  documento_tipo: string;
  documento_numero?: string;
  documento_serie?: string;
  documento_chave?: string;
  nota_fiscal_id?: string;
  
  // Partes
  cliente_id?: string;
  fornecedor_id?: string;
  cnpj_cpf_contraparte?: string;
  nome_contraparte?: string;
  
  // Localização
  uf_origem?: string;
  uf_destino?: string;
  
  // Classificação
  cfop?: string;
  ncm?: string;
  
  // Valores
  valor_operacao: number;
  valor_desconto: number;
  valor_frete: number;
  base_calculo: number;
  
  // CBS/IBS/IS
  cbs_aliquota: number;
  cbs_valor: number;
  cbs_credito: number;
  ibs_aliquota: number;
  ibs_valor: number;
  ibs_credito: number;
  is_categoria?: string;
  is_aliquota: number;
  is_valor: number;
  
  // Tributos residuais
  icms_aliquota: number;
  icms_valor: number;
  iss_aliquota: number;
  iss_valor: number;
  pis_aliquota: number;
  pis_valor: number;
  cofins_aliquota: number;
  cofins_valor: number;
  
  // Regime especial
  regime_especial?: string;
  reducao_aliquota: number;
  isento: boolean;
  motivo_isencao?: string;
  
  // Split Payment
  split_payment: boolean;
  split_payment_valor: number;
  
  // Período
  data_operacao: string;
  competencia: string;
  
  // Controle
  apuracao_id?: string;
  status: 'pendente' | 'processado' | 'erro' | 'cancelado';
  erro_mensagem?: string;
  
  created_at: string;
  updated_at: string;
}

export interface CreateOperacaoInput {
  empresa_id: string;
  tipo_operacao: OperacaoTributavel['tipo_operacao'];
  documento_tipo: string;
  documento_numero?: string;
  documento_chave?: string;
  nota_fiscal_id?: string;
  cliente_id?: string;
  fornecedor_id?: string;
  cnpj_cpf_contraparte?: string;
  nome_contraparte?: string;
  uf_origem?: string;
  uf_destino?: string;
  cfop?: string;
  ncm?: string;
  valor_operacao: number;
  valor_desconto?: number;
  valor_frete?: number;
  is_categoria?: string;
  regime_especial?: string;
  isento?: boolean;
  motivo_isencao?: string;
  data_operacao: string;
}

// Função para obter alíquotas do ano
function obterAliquotasAno(ano: number) {
  const config = ALIQUOTAS_TRANSICAO.find(a => a.ano === ano);
  if (!config) {
    // Após 2033, usar alíquotas finais
    return { cbs: 0.088, ibs: 0.172, icms: 0, iss: 0, pis: 0, cofins: 0 };
  }
  return {
    cbs: config.cbs,
    ibs: config.ibs,
    icms: config.icmsResidual,
    iss: config.issResidual,
    pis: config.pisResidual,
    cofins: config.cofinsResidual,
  };
}

// Função para obter alíquota IS
function obterAliquotaIS(categoria?: string) {
  if (!categoria) return 0;
  const config = CONFIGURACOES_IS.find(c => c.categoria === categoria);
  return config?.aliquotaMaxima || 0;
}

// Função para obter redução de regime especial
function obterReducaoRegime(regime?: string) {
  if (!regime) return { cbs: 0, ibs: 0 };
  const config = REGIMES_ESPECIAIS.find(r => r.regime === regime);
  return {
    cbs: (config?.reducaoAliquotaCBS || 0) / 100,
    ibs: (config?.reducaoAliquotaIBS || 0) / 100,
  };
}

export function useOperacoesTributaveis(empresaId?: string) {
  const queryClient = useQueryClient();

  // Buscar operações
  const { data: operacoes, isLoading, error } = useQuery({
    queryKey: ['operacoes_tributaveis', empresaId],
    queryFn: async () => {
      let query = supabase
        .from('operacoes_tributaveis')
        .select('*')
        .order('data_operacao', { ascending: false })
        .limit(500);
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as OperacaoTributavel[];
    },
  });

  // Criar operação com cálculo automático
  const criarOperacao = useMutation({
    mutationFn: async (input: CreateOperacaoInput) => {
      const ano = new Date(input.data_operacao).getFullYear();
      const aliquotas = obterAliquotasAno(ano);
      const reducao = obterReducaoRegime(input.regime_especial);
      
      // Calcular base de cálculo
      const baseCalculo = input.valor_operacao - (input.valor_desconto || 0);
      
      // Verificar isenção
      const isento = input.isento || input.tipo_operacao === 'exportacao';
      
      // Calcular tributos se não isento
      let cbs_aliquota = 0, cbs_valor = 0, cbs_credito = 0;
      let ibs_aliquota = 0, ibs_valor = 0, ibs_credito = 0;
      let is_aliquota = 0, is_valor = 0;
      let icms_aliquota = 0, icms_valor = 0;
      let iss_aliquota = 0, iss_valor = 0;
      let pis_aliquota = 0, pis_valor = 0;
      let cofins_aliquota = 0, cofins_valor = 0;
      
      if (!isento) {
        // CBS
        cbs_aliquota = aliquotas.cbs * (1 - reducao.cbs);
        cbs_valor = baseCalculo * cbs_aliquota;
        
        // IBS
        ibs_aliquota = aliquotas.ibs * (1 - reducao.ibs);
        ibs_valor = baseCalculo * ibs_aliquota;
        
        // IS (Imposto Seletivo)
        is_aliquota = obterAliquotaIS(input.is_categoria);
        is_valor = baseCalculo * is_aliquota;
        
        // Tributos residuais
        icms_aliquota = aliquotas.icms;
        icms_valor = baseCalculo * icms_aliquota;
        iss_aliquota = aliquotas.iss;
        iss_valor = baseCalculo * iss_aliquota;
        pis_aliquota = aliquotas.pis;
        pis_valor = baseCalculo * pis_aliquota;
        cofins_aliquota = aliquotas.cofins;
        cofins_valor = baseCalculo * cofins_aliquota;
        
        // Se for compra/serviço tomado, calcular créditos
        if (['compra', 'servico_tomado'].includes(input.tipo_operacao)) {
          cbs_credito = cbs_valor;
          ibs_credito = ibs_valor;
        }
      }
      
      // Split payment (vendas)
      const split_payment = ['venda', 'servico_prestado'].includes(input.tipo_operacao) && ano >= 2026;
      const split_payment_valor = split_payment ? cbs_valor + ibs_valor + is_valor : 0;
      
      const competencia = input.data_operacao.slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('operacoes_tributaveis')
        .insert({
          ...input,
          valor_desconto: input.valor_desconto || 0,
          valor_frete: input.valor_frete || 0,
          base_calculo: baseCalculo,
          cbs_aliquota, cbs_valor, cbs_credito,
          ibs_aliquota, ibs_valor, ibs_credito,
          is_aliquota, is_valor,
          icms_aliquota, icms_valor,
          iss_aliquota, iss_valor,
          pis_aliquota, pis_valor,
          cofins_aliquota, cofins_valor,
          reducao_aliquota: Math.max(reducao.cbs, reducao.ibs),
          isento,
          split_payment,
          split_payment_valor,
          competencia,
          status: 'processado',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes_tributaveis'] });
      toast.success('Operação registrada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  // Importar operações de NF-e
  const importarDeNFe = useMutation({
    mutationFn: async ({ notaFiscalId, empresaId, tipoOperacao }: { 
      notaFiscalId: string; 
      empresaId: string; 
      tipoOperacao: 'venda' | 'compra' 
    }) => {
      // Buscar nota fiscal
      const { data: nf, error: nfError } = await supabase
        .from('notas_fiscais')
        .select('*')
        .eq('id', notaFiscalId)
        .single();
      
      if (nfError) throw nfError;
      
      // Criar operação
      const input: CreateOperacaoInput = {
        empresa_id: empresaId,
        tipo_operacao: tipoOperacao,
        documento_tipo: 'nfe',
        documento_numero: nf.numero,
        documento_chave: nf.chave_acesso,
        nota_fiscal_id: notaFiscalId,
        cnpj_cpf_contraparte: nf.cliente_cnpj,
        nome_contraparte: nf.cliente_nome,
        valor_operacao: Number(nf.valor_produtos),
        valor_desconto: Number(nf.valor_desconto) || 0,
        valor_frete: Number(nf.valor_frete) || 0,
        data_operacao: nf.data_emissao,
      };
      
      return criarOperacao.mutateAsync(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes_tributaveis'] });
      toast.success('Operação importada da NF-e');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao importar: ${error.message}`);
    },
  });

  // Cancelar operação
  const cancelarOperacao = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('operacoes_tributaveis')
        .update({ status: 'cancelado' })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes_tributaveis'] });
      toast.success('Operação cancelada');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar: ${error.message}`);
    },
  });

  // Estatísticas do período
  const useEstatisticasPeriodo = (ano: number, mes: number) => {
    return useQuery({
      queryKey: ['operacoes_estatisticas', empresaId, ano, mes],
      queryFn: async () => {
        const inicioMes = new Date(ano, mes - 1, 1).toISOString().split('T')[0];
        const fimMes = new Date(ano, mes, 0).toISOString().split('T')[0];
        
        let query = supabase
          .from('operacoes_tributaveis')
          .select('tipo_operacao, cbs_valor, ibs_valor, is_valor, cbs_credito, ibs_credito, icms_valor, iss_valor, pis_valor, cofins_valor')
          .gte('data_operacao', inicioMes)
          .lte('data_operacao', fimMes)
          .eq('status', 'processado');
        
        if (empresaId) {
          query = query.eq('empresa_id', empresaId);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        const stats = {
          totalOperacoes: data?.length || 0,
          debitos: { cbs: 0, ibs: 0, is: 0 },
          creditos: { cbs: 0, ibs: 0 },
          residuais: { icms: 0, iss: 0, pis: 0, cofins: 0 },
        };
        
        interface OperacaoTributavel {
          tipo_operacao: string;
          cbs_valor: number | null;
          ibs_valor: number | null;
          is_valor: number | null;
          cbs_credito: number | null;
          ibs_credito: number | null;
          icms_valor: number | null;
          iss_valor: number | null;
          pis_valor: number | null;
          cofins_valor: number | null;
        }
        
        (data || []).forEach((op: OperacaoTributavel) => {
          if (['venda', 'servico_prestado'].includes(op.tipo_operacao)) {
            stats.debitos.cbs += Number(op.cbs_valor) || 0;
            stats.debitos.ibs += Number(op.ibs_valor) || 0;
            stats.debitos.is += Number(op.is_valor) || 0;
          }
          stats.creditos.cbs += Number(op.cbs_credito) || 0;
          stats.creditos.ibs += Number(op.ibs_credito) || 0;
          stats.residuais.icms += Number(op.icms_valor) || 0;
          stats.residuais.iss += Number(op.iss_valor) || 0;
          stats.residuais.pis += Number(op.pis_valor) || 0;
          stats.residuais.cofins += Number(op.cofins_valor) || 0;
        });
        
        return stats;
      },
      enabled: !!ano && !!mes,
    });
  };

  return {
    operacoes,
    isLoading,
    error,
    criarOperacao,
    importarDeNFe,
    cancelarOperacao,
    useEstatisticasPeriodo,
  };
}
