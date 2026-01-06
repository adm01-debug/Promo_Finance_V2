// ============================================
// HOOK: INTEGRAÇÃO NF-e → CRÉDITOS TRIBUTÁRIOS
// Geração automática de créditos CBS/IBS
// ============================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Alíquotas padrão (podem variar por ano/regime)
const ALIQUOTAS_PADRAO = {
  cbs: 0.088, // 8.8%
  ibs: 0.178, // 17.8% (soma estadual + municipal)
};

interface NotaFiscalEntrada {
  id: string;
  empresa_id: string;
  numero: string;
  serie?: string;
  chave_acesso?: string;
  data_emissao: string;
  valor_total: number;
  valor_produtos: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  fornecedor_cnpj?: string;
  cfop?: string;
}

interface CreditoGerado {
  tipo_tributo: 'CBS' | 'IBS';
  valor_base: number;
  aliquota: number;
  valor_credito: number;
}

export function useIntegracaoNFCreditos() {
  const queryClient = useQueryClient();

  // Calcular créditos para uma NF de entrada
  const calcularCreditos = (nf: NotaFiscalEntrada, anoReferencia: number = 2026): CreditoGerado[] => {
    const creditos: CreditoGerado[] = [];
    const baseCalculo = nf.valor_produtos || nf.valor_total;

    // Verificar se o CFOP dá direito a crédito (entradas tributadas)
    const cfopsComCredito = ['1102', '1403', '1949', '2102', '2403', '2949', '3102'];
    const temDireitoCredito = !nf.cfop || cfopsComCredito.some(c => nf.cfop?.startsWith(c.substring(0, 1)));

    if (!temDireitoCredito) {
      return creditos;
    }

    // Ajustar alíquotas conforme ano da transição
    let aliquotaCBS = ALIQUOTAS_PADRAO.cbs;
    let aliquotaIBS = ALIQUOTAS_PADRAO.ibs;

    // Fase de transição (2026-2033)
    if (anoReferencia === 2026) {
      aliquotaCBS = 0.009; // 0.9%
      aliquotaIBS = 0.001; // 0.1%
    } else if (anoReferencia === 2027) {
      aliquotaCBS = 0.009;
      aliquotaIBS = 0.001;
    } else if (anoReferencia >= 2029 && anoReferencia <= 2032) {
      const fatorTransicao = (anoReferencia - 2028) * 0.1;
      aliquotaCBS = ALIQUOTAS_PADRAO.cbs * fatorTransicao;
      aliquotaIBS = ALIQUOTAS_PADRAO.ibs * fatorTransicao;
    } else if (anoReferencia >= 2033) {
      aliquotaCBS = ALIQUOTAS_PADRAO.cbs;
      aliquotaIBS = ALIQUOTAS_PADRAO.ibs;
    }

    if (aliquotaCBS > 0) {
      creditos.push({
        tipo_tributo: 'CBS',
        valor_base: baseCalculo,
        aliquota: aliquotaCBS,
        valor_credito: baseCalculo * aliquotaCBS,
      });
    }

    if (aliquotaIBS > 0) {
      creditos.push({
        tipo_tributo: 'IBS',
        valor_base: baseCalculo,
        aliquota: aliquotaIBS,
        valor_credito: baseCalculo * aliquotaIBS,
      });
    }

    return creditos;
  };

  // Gerar créditos a partir de uma NF
  const gerarCreditosNF = useMutation({
    mutationFn: async ({ 
      notaFiscal, 
      anoReferencia = new Date().getFullYear() 
    }: { 
      notaFiscal: NotaFiscalEntrada; 
      anoReferencia?: number;
    }) => {
      const creditos = calcularCreditos(notaFiscal, anoReferencia);
      
      if (creditos.length === 0) {
        throw new Error('Esta NF não gera direito a crédito tributário');
      }

      const competencia = format(new Date(notaFiscal.data_emissao), 'yyyy-MM');
      const creditosInseridos = [];

      for (const credito of creditos) {
        const { data, error } = await supabase
          .from('creditos_tributarios')
          .insert({
            empresa_id: notaFiscal.empresa_id,
            tipo_tributo: credito.tipo_tributo,
            tipo_credito: 'normal',
            competencia_origem: competencia,
            data_origem: notaFiscal.data_emissao,
            valor_base: credito.valor_base,
            aliquota: credito.aliquota,
            valor_credito: credito.valor_credito,
            saldo_disponivel: credito.valor_credito,
            status: 'disponivel',
            nota_fiscal_id: notaFiscal.id,
            fornecedor_id: notaFiscal.fornecedor_id,
            fornecedor_nome: notaFiscal.fornecedor_nome,
            fornecedor_cnpj: notaFiscal.fornecedor_cnpj,
            documento_numero: notaFiscal.numero,
            documento_serie: notaFiscal.serie,
            documento_chave: notaFiscal.chave_acesso,
            documento_tipo: 'nfe',
          })
          .select()
          .single();

        if (error) throw error;
        creditosInseridos.push(data);
      }

      return creditosInseridos;
    },
    onSuccess: (creditos) => {
      queryClient.invalidateQueries({ queryKey: ['creditos-tributarios'] });
      const totalCredito = creditos.reduce((sum, c) => sum + (c.valor_credito || 0), 0);
      toast.success(`Créditos gerados: R$ ${totalCredito.toFixed(2)}`, {
        description: `${creditos.length} crédito(s) de CBS/IBS registrados`,
      });
    },
    onError: (error) => {
      toast.error('Erro ao gerar créditos: ' + error.message);
    },
  });

  // Registrar operação tributável (para débitos em NFs de saída)
  const registrarOperacaoSaida = useMutation({
    mutationFn: async (notaFiscal: NotaFiscalEntrada) => {
      const baseCalculo = notaFiscal.valor_produtos || notaFiscal.valor_total;
      const competencia = format(new Date(notaFiscal.data_emissao), 'yyyy-MM-01');
      const anoReferencia = new Date(notaFiscal.data_emissao).getFullYear();

      let aliquotaCBS = ALIQUOTAS_PADRAO.cbs;
      let aliquotaIBS = ALIQUOTAS_PADRAO.ibs;

      if (anoReferencia === 2026) {
        aliquotaCBS = 0.009;
        aliquotaIBS = 0.001;
      }

      const insertData = {
        empresa_id: notaFiscal.empresa_id,
        tipo_operacao: 'venda',
        nota_fiscal_id: notaFiscal.id,
        documento_numero: notaFiscal.numero,
        documento_chave: notaFiscal.chave_acesso,
        data_operacao: notaFiscal.data_emissao,
        competencia,
        valor_operacao: notaFiscal.valor_total,
        base_calculo: baseCalculo,
        cbs_aliquota: aliquotaCBS,
        cbs_valor: baseCalculo * aliquotaCBS,
        ibs_aliquota: aliquotaIBS,
        ibs_valor: baseCalculo * aliquotaIBS,
        is_aliquota: 0,
        is_valor: 0,
        fornecedor_id: notaFiscal.fornecedor_id,
        nome_contraparte: notaFiscal.fornecedor_nome,
        cnpj_cpf_contraparte: notaFiscal.fornecedor_cnpj,
        cfop: notaFiscal.cfop,
        status: 'ativo',
      };

      const { data, error } = await supabase
        .from('operacoes_tributaveis')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operacoes-tributaveis'] });
      toast.success('Operação registrada');
    },
  });

  return {
    calcularCreditos,
    gerarCreditosNF,
    registrarOperacaoSaida,
    ALIQUOTAS_PADRAO,
  };
}

export default useIntegracaoNFCreditos;
