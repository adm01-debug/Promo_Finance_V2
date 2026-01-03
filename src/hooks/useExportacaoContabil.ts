import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export interface LancamentoContabil {
  data: string;
  conta_debito: string;
  conta_credito: string;
  valor: number;
  historico: string;
  documento?: string;
  centro_custo?: string;
}

export interface ConfigExportacao {
  formato: 'SPED' | 'ECD' | 'CSV' | 'SICONTABIL' | 'DOMINIO';
  periodo_inicio: string;
  periodo_fim: string;
  incluir_encerramento: boolean;
  empresa_id?: string;
}

// Mapeamento de contas para código contábil
const mapeamentoContas: Record<string, string> = {
  'receita_servicos': '3.1.01.001',
  'receita_produtos': '3.1.02.001',
  'despesa_pessoal': '4.1.01.001',
  'despesa_aluguel': '4.1.02.001',
  'despesa_servicos': '4.1.03.001',
  'caixa': '1.1.01.001',
  'banco': '1.1.02.001',
  'clientes': '1.1.03.001',
  'fornecedores': '2.1.01.001',
  'capital_social': '2.4.01.001'
};

export function useExportacaoContabil() {
  const [exportando, setExportando] = useState(false);

  // Buscar contas a pagar
  const { data: contasPagar } = useQuery({
    queryKey: ['contas-pagar-contabil'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select('*, centro_custo:centros_custo(codigo, nome)')
        .order('data_emissao', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar contas a receber
  const { data: contasReceber } = useQuery({
    queryKey: ['contas-receber-contabil'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_receber')
        .select('*, centro_custo:centros_custo(codigo, nome)')
        .order('data_emissao', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Buscar plano de contas
  const { data: planoContas } = useQuery({
    queryKey: ['plano-contas-export'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plano_contas')
        .select('*')
        .order('codigo');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Gerar lançamentos contábeis
  const gerarLancamentos = (config: ConfigExportacao): LancamentoContabil[] => {
    const lancamentos: LancamentoContabil[] = [];
    const inicio = new Date(config.periodo_inicio);
    const fim = new Date(config.periodo_fim);

    // Lançamentos de contas a pagar (despesas)
    contasPagar?.forEach(cp => {
      const data = new Date(cp.data_emissao);
      if (data >= inicio && data <= fim) {
        // Lançamento de provisão
        lancamentos.push({
          data: cp.data_emissao,
          conta_debito: '4.1.03.001', // Despesa
          conta_credito: '2.1.01.001', // Fornecedores
          valor: cp.valor,
          historico: `Provisão: ${cp.descricao}`,
          documento: cp.numero_documento || undefined,
          centro_custo: (cp.centro_custo as any)?.codigo
        });

        // Lançamento de pagamento (se pago)
        if (cp.status === 'pago' && cp.data_pagamento) {
          lancamentos.push({
            data: cp.data_pagamento,
            conta_debito: '2.1.01.001', // Fornecedores
            conta_credito: '1.1.02.001', // Banco
            valor: cp.valor_pago || cp.valor,
            historico: `Pagamento: ${cp.descricao}`,
            documento: cp.numero_documento || undefined,
            centro_custo: (cp.centro_custo as any)?.codigo
          });
        }
      }
    });

    // Lançamentos de contas a receber (receitas)
    contasReceber?.forEach(cr => {
      const data = new Date(cr.data_emissao);
      if (data >= inicio && data <= fim) {
        // Lançamento de provisão
        lancamentos.push({
          data: cr.data_emissao,
          conta_debito: '1.1.03.001', // Clientes
          conta_credito: '3.1.01.001', // Receita
          valor: cr.valor,
          historico: `Faturamento: ${cr.descricao}`,
          documento: cr.numero_documento || undefined,
          centro_custo: (cr.centro_custo as any)?.codigo
        });

        // Lançamento de recebimento (se recebido)
        if (cr.status === 'pago' && cr.data_recebimento) {
          lancamentos.push({
            data: cr.data_recebimento,
            conta_debito: '1.1.02.001', // Banco
            conta_credito: '1.1.03.001', // Clientes
            valor: cr.valor_recebido || cr.valor,
            historico: `Recebimento: ${cr.descricao}`,
            documento: cr.numero_documento || undefined,
            centro_custo: (cr.centro_custo as any)?.codigo
          });
        }
      }
    });

    return lancamentos.sort((a, b) => a.data.localeCompare(b.data));
  };

  // Exportar para SPED Contábil
  const exportarSPED = (lancamentos: LancamentoContabil[]): string => {
    const linhas: string[] = [];
    
    // Registro 0000 - Abertura
    linhas.push('|0000|LECD|01012025|31012025|EMPRESA EXEMPLO|00000000000000|UF|00000000|');
    
    // Registro I050 - Plano de Contas
    planoContas?.forEach(conta => {
      linhas.push(`|I050|${conta.codigo}|${conta.tipo === 'sintetica' ? 'S' : 'A'}|${conta.nivel}||${conta.descricao}|`);
    });

    // Registro I200 - Lançamentos
    lancamentos.forEach((lanc, idx) => {
      const dataFormatada = format(new Date(lanc.data), 'ddMMyyyy');
      linhas.push(`|I200|${String(idx + 1).padStart(6, '0')}|${dataFormatada}|${lanc.valor.toFixed(2)}|N|`);
      linhas.push(`|I250|${lanc.conta_debito}|D|${lanc.valor.toFixed(2)}|`);
      linhas.push(`|I250|${lanc.conta_credito}|C|${lanc.valor.toFixed(2)}|`);
    });

    // Registro 9999 - Encerramento
    linhas.push(`|9999|${linhas.length + 1}|`);

    return linhas.join('\n');
  };

  // Exportar para ECD
  const exportarECD = (lancamentos: LancamentoContabil[]): string => {
    const linhas: string[] = [];
    
    // Header ECD
    linhas.push('0000|LECD|01012025|31012025|EMPRESA|00000000000000|');
    
    // Lançamentos no formato ECD
    lancamentos.forEach((lanc, idx) => {
      const dataFormatada = format(new Date(lanc.data), 'ddMMyyyy');
      linhas.push(
        `I200|${String(idx + 1).padStart(10, '0')}|${dataFormatada}|` +
        `${lanc.conta_debito}|${lanc.conta_credito}|${lanc.valor.toFixed(2).replace('.', ',')}|` +
        `${lanc.historico}|${lanc.documento || ''}|`
      );
    });

    return linhas.join('\n');
  };

  // Exportar para CSV
  const exportarCSV = (lancamentos: LancamentoContabil[]): string => {
    const header = 'Data;Conta Débito;Conta Crédito;Valor;Histórico;Documento;Centro de Custo\n';
    const linhas = lancamentos.map(lanc => 
      `${format(new Date(lanc.data), 'dd/MM/yyyy')};` +
      `${lanc.conta_debito};${lanc.conta_credito};` +
      `${lanc.valor.toFixed(2).replace('.', ',')};` +
      `"${lanc.historico}";${lanc.documento || ''};${lanc.centro_custo || ''}`
    ).join('\n');

    return header + linhas;
  };

  // Exportar para sistemas específicos
  const exportarSicontabil = (lancamentos: LancamentoContabil[]): string => {
    return lancamentos.map((lanc, idx) => 
      `${String(idx + 1).padStart(5, '0')}` +
      `${format(new Date(lanc.data), 'ddMMyyyy')}` +
      `${lanc.conta_debito.padEnd(20)}` +
      `${lanc.conta_credito.padEnd(20)}` +
      `${String(Math.round(lanc.valor * 100)).padStart(15, '0')}` +
      `${lanc.historico.substring(0, 200).padEnd(200)}`
    ).join('\n');
  };

  const exportarDominio = (lancamentos: LancamentoContabil[]): string => {
    return lancamentos.map(lanc => 
      `1|${format(new Date(lanc.data), 'dd/MM/yyyy')}|` +
      `${lanc.conta_debito}|${lanc.conta_credito}|` +
      `${lanc.valor.toFixed(2)}|${lanc.historico}|N|`
    ).join('\n');
  };

  // Função principal de exportação
  const exportar = async (config: ConfigExportacao) => {
    setExportando(true);
    try {
      const lancamentos = gerarLancamentos(config);
      
      if (lancamentos.length === 0) {
        toast.warning('Nenhum lançamento encontrado no período');
        return null;
      }

      let conteudo: string;
      let extensao: string;
      let mimeType: string;

      switch (config.formato) {
        case 'SPED':
          conteudo = exportarSPED(lancamentos);
          extensao = 'txt';
          mimeType = 'text/plain';
          break;
        case 'ECD':
          conteudo = exportarECD(lancamentos);
          extensao = 'txt';
          mimeType = 'text/plain';
          break;
        case 'SICONTABIL':
          conteudo = exportarSicontabil(lancamentos);
          extensao = 'txt';
          mimeType = 'text/plain';
          break;
        case 'DOMINIO':
          conteudo = exportarDominio(lancamentos);
          extensao = 'txt';
          mimeType = 'text/plain';
          break;
        default:
          conteudo = exportarCSV(lancamentos);
          extensao = 'csv';
          mimeType = 'text/csv';
      }

      // Criar e baixar arquivo
      const blob = new Blob([conteudo], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exportacao_${config.formato.toLowerCase()}_${format(new Date(), 'yyyyMMdd')}.${extensao}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exportação ${config.formato} gerada com sucesso`, {
        description: `${lancamentos.length} lançamentos exportados`
      });

      return { lancamentos: lancamentos.length, arquivo: link.download };
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao gerar exportação');
      return null;
    } finally {
      setExportando(false);
    }
  };

  // Estatísticas do período
  const getEstatisticasPeriodo = (inicio: string, fim: string) => {
    const lancamentos = gerarLancamentos({
      formato: 'CSV',
      periodo_inicio: inicio,
      periodo_fim: fim,
      incluir_encerramento: false
    });

    const totalDebitos = lancamentos.reduce((acc, l) => acc + l.valor, 0);
    const totalCreditos = lancamentos.reduce((acc, l) => acc + l.valor, 0);

    return {
      total_lancamentos: lancamentos.length,
      total_debitos: totalDebitos,
      total_creditos: totalCreditos,
      contas_utilizadas: [...new Set([
        ...lancamentos.map(l => l.conta_debito),
        ...lancamentos.map(l => l.conta_credito)
      ])].length
    };
  };

  return {
    exportar,
    exportando,
    gerarLancamentos,
    getEstatisticasPeriodo,
    planoContas,
    formatosDisponiveis: ['SPED', 'ECD', 'CSV', 'SICONTABIL', 'DOMINIO'] as const
  };
}
