import { supabase } from '@/integrations/supabase/client';
import { generateFluxoCaixaPDF } from '@/lib/pdf-generator';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';
import type { ActionResult } from './types';

export async function gerarRelatorio(tipo: string): Promise<ActionResult> {
  switch (tipo) {
    case 'fluxo_caixa': {
      const { data: contasPagar } = await supabase
        .from('contas_pagar')
        .select('data_vencimento, valor, status')
        .eq('status', 'pendente')
        .order('data_vencimento');

      const { data: contasReceber } = await supabase
        .from('contas_receber')
        .select('data_vencimento, valor, status')
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      const { data: saldos } = await supabase
        .from('contas_bancarias')
        .select('saldo_atual')
        .eq('ativo', true);

      const saldoInicial = saldos?.reduce((sum, c) => sum + Number(c.saldo_atual), 0) || 0;
      const fluxoPorData = new Map<string, { receitas: number; despesas: number }>();
      
      contasReceber?.forEach(c => {
        const data = c.data_vencimento;
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        atual.receitas += Number(c.valor);
        fluxoPorData.set(data, atual);
      });

      contasPagar?.forEach(c => {
        const data = c.data_vencimento;
        const atual = fluxoPorData.get(data) || { receitas: 0, despesas: 0 };
        atual.despesas += Number(c.valor);
        fluxoPorData.set(data, atual);
      });

      const sortedDates = Array.from(fluxoPorData.keys()).sort();
      let saldoAcumulado = saldoInicial;
      
      const dados = sortedDates.map(data => {
        const { receitas, despesas } = fluxoPorData.get(data)!;
        saldoAcumulado += receitas - despesas;
        return { data, receitas, despesas, saldo: saldoAcumulado };
      });

      if (dados.length === 0) {
        return { success: false, message: 'Não há dados para gerar o relatório de fluxo de caixa' };
      }

      generateFluxoCaixaPDF(dados, 'Relatório de Fluxo de Caixa - EXPERT');
      toast.success('Relatório de Fluxo de Caixa gerado!');
      return { success: true, message: 'Relatório de Fluxo de Caixa gerado com sucesso' };
    }

    case 'contas_pagar': {
      const { data } = await supabase
        .from('contas_pagar')
        .select('*')
        .eq('status', 'pendente')
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: false, message: 'Não há contas a pagar pendentes' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      return { success: true, message: `Relatório: ${data.length} contas a pagar pendentes, total de ${formatCurrency(total)}`, data };
    }

    case 'contas_receber': {
      const { data } = await supabase
        .from('contas_receber')
        .select('*')
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: false, message: 'Não há contas a receber pendentes' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      return { success: true, message: `Relatório: ${data.length} contas a receber pendentes/vencidas, total de ${formatCurrency(total)}`, data };
    }

    case 'inadimplencia': {
      const hoje = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('contas_receber')
        .select('*, clientes(razao_social, score)')
        .lt('data_vencimento', hoje)
        .in('status', ['pendente', 'vencido'])
        .order('data_vencimento');

      if (!data || data.length === 0) {
        return { success: true, message: 'Não há títulos em atraso - Excelente!' };
      }

      const total = data.reduce((sum, c) => sum + Number(c.valor), 0);
      return { success: true, message: `Relatório de Inadimplência: ${data.length} títulos vencidos, total de ${formatCurrency(total)}`, data };
    }

    default:
      return { success: false, message: `Tipo de relatório "${tipo}" não reconhecido` };
  }
}
