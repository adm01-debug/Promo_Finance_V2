import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContasPagar, useContasReceber, useContasBancarias } from '@/hooks/useFinancialData';
import { useMemo } from 'react';
import { calcularPorCompetencia } from '@/lib/contabilidade/demonstrativos-competencia';
import type { PartidaRow } from '@/lib/contabilidade/demonstrativos-competencia';

export type {
  FonteDemonstrativo,
  DRELinha,
  BalancoLinha,
  ContaNaoClassificada,
  DemonstrativosResult,
} from '@/lib/contabilidade/demonstrativos-competencia';
import type {
  FonteDemonstrativo,
  DemonstrativosResult,
  DRELinha,
} from '@/lib/contabilidade/demonstrativos-competencia';

// ----------- Hook principal -----------
export function useDemonstrativosContabeis(params: {
  empresaId: string;
  ano: number;
  mes: number;
  fonte: FonteDemonstrativo;
}): DemonstrativosResult {
  const { empresaId, ano, mes, fonte } = params;

  // Caixa (legado): usa contas a pagar/receber + bancárias
  const { data: contasReceber } = useContasReceber();
  const { data: contasPagar } = useContasPagar();
  const { data: contasBancarias } = useContasBancarias();

  // Competência: lê partidas contábeis no período + acumulado até o fim do período
  const inicio = `${ano}-${String(mes + 1).padStart(2, '0')}-01`;
  const fimDate = new Date(ano, mes + 1, 0);
  const fim = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(fimDate.getDate()).padStart(2, '0')}`;

  const partidasQuery = useQuery({
    queryKey: ['demonstrativos-partidas', empresaId, ano, mes],
    queryFn: async () => {
      let q = supabase
        .from('partidas_contabeis')
        .select('tipo, valor, conta:plano_contas(id, codigo, descricao, nome, tipo, natureza, centro_resultado), lancamento:lancamentos_contabeis!inner(data_lancamento, empresa_id)')
        .lte('lancamento.data_lancamento', fim)
        .limit(20000);
      if (empresaId !== 'todas') q = q.eq('lancamento.empresa_id', empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as PartidaRow[];
    },
    enabled: fonte === 'competencia',
    staleTime: 5 * 60 * 1000,
  });

  return useMemo<DemonstrativosResult>(() => {
    if (fonte === 'competencia') {
      const all = partidasQuery.data || [];
      const periodo = all.filter(
        (p) => p.lancamento && p.lancamento.data_lancamento >= inicio && p.lancamento.data_lancamento <= fim,
      );
      const result = calcularPorCompetencia(periodo, all);
      const refsLanc = new Set(all.map((p) => p.lancamento?.data_lancamento + '|' + (p.conta?.codigo || '')));
      return {
        ...result,
        params: { empresaId, ano, mes, fonte },
        cobertura: { totalLancamentos: refsLanc.size, totalPartidas: all.length },
        origem: 'competencia',
        isLoading: partidasQuery.isLoading,
        error: (partidasQuery.error as Error) || null,
      };
    }

    // Caixa
    const dataInicio = new Date(ano, mes, 1);
    const dataFim = new Date(ano, mes + 1, 0);
    const recebimentos = (contasReceber || []).filter((cr) => {
      const data = new Date(cr.data_vencimento);
      const dentro = data >= dataInicio && data <= dataFim;
      const empOk = empresaId === 'todas' || cr.empresa_id === empresaId;
      return dentro && empOk && cr.status === 'pago';
    });
    const pagamentos = (contasPagar || []).filter((cp) => {
      const data = new Date(cp.data_vencimento);
      const dentro = data >= dataInicio && data <= dataFim;
      const empOk = empresaId === 'todas' || cp.empresa_id === empresaId;
      return dentro && empOk && cp.status === 'pago';
    });

    const receitaBruta = recebimentos.reduce((a, r) => a + (r.valor_recebido || r.valor), 0);
    const deducoes = receitaBruta * 0.0925;
    const receitaLiquida = receitaBruta - deducoes;
    const cmv = pagamentos
      .filter((p) => /mercadoria|produto/i.test(p.centro_custo_nome || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const lucroBruto = receitaLiquida - cmv;
    const despAdmin = pagamentos
      .filter((p) => /admin/i.test(p.centro_custo_nome || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const despCom = pagamentos
      .filter((p) => /comercial|vendas/i.test(p.centro_custo_nome || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const outrasOp = pagamentos
      .filter((p) => !/mercadoria|produto|admin|comercial|vendas/i.test(p.centro_custo_nome || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const despOp = despAdmin + despCom + outrasOp;
    const lucroOp = lucroBruto - despOp;
    const lucroAntesIR = lucroOp;
    const irCs = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0;
    const lucroLiquido = lucroAntesIR - irCs;
    const pct = (v: number) => (receitaBruta > 0 ? (Math.abs(v) / receitaBruta) * 100 : 0);

    const linhas: DRELinha[] = [
      { codigo: '1', descricao: 'RECEITA BRUTA DE VENDAS', valor: receitaBruta, percentual: 100, nivel: 0, tipo: 'receita' },
      { codigo: '2', descricao: '(-) DEDUÇÕES DA RECEITA', valor: -deducoes, percentual: pct(deducoes), nivel: 0, tipo: 'despesa' },
      { codigo: '3', descricao: '(=) RECEITA LÍQUIDA', valor: receitaLiquida, percentual: pct(receitaLiquida), nivel: 0, tipo: 'resultado' },
      { codigo: '4', descricao: '(-) CUSTO DAS MERCADORIAS VENDIDAS', valor: -cmv, percentual: pct(cmv), nivel: 0, tipo: 'despesa' },
      { codigo: '5', descricao: '(=) LUCRO BRUTO', valor: lucroBruto, percentual: pct(lucroBruto), nivel: 0, tipo: 'resultado' },
      { codigo: '6', descricao: '(-) DESPESAS OPERACIONAIS', valor: -despOp, percentual: pct(despOp), nivel: 0, tipo: 'despesa' },
      { codigo: '6.1', descricao: 'Despesas Administrativas', valor: -despAdmin, percentual: pct(despAdmin), nivel: 1, tipo: 'despesa' },
      { codigo: '6.2', descricao: 'Despesas Comerciais', valor: -despCom, percentual: pct(despCom), nivel: 1, tipo: 'despesa' },
      { codigo: '6.3', descricao: 'Outras Despesas Operacionais', valor: -outrasOp, percentual: pct(outrasOp), nivel: 1, tipo: 'despesa' },
      { codigo: '7', descricao: '(=) LUCRO OPERACIONAL', valor: lucroOp, percentual: pct(lucroOp), nivel: 0, tipo: 'resultado' },
      { codigo: '9', descricao: '(=) LUCRO ANTES DO IR/CSLL', valor: lucroAntesIR, percentual: pct(lucroAntesIR), nivel: 0, tipo: 'resultado' },
      { codigo: '10', descricao: '(-) IRPJ/CSLL', valor: -irCs, percentual: pct(irCs), nivel: 0, tipo: 'despesa' },
      { codigo: '11', descricao: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', valor: lucroLiquido, percentual: pct(lucroLiquido), nivel: 0, tipo: 'resultado' },
    ];

    // Balanço caixa (estimado, igual lógica anterior)
    const bancos = (contasBancarias || []).filter((cb) => empresaId === 'todas' || cb.empresa_id === empresaId);
    const caixa = bancos.reduce((a, b) => a + b.saldo_atual, 0);
    const crPend = (contasReceber || [])
      .filter((cr) => (empresaId === 'todas' || cr.empresa_id === empresaId) && (cr.status === 'pendente' || cr.status === 'vencido'))
      .reduce((a, cr) => a + cr.valor - (cr.valor_recebido || 0), 0);
    const cpPend = (contasPagar || [])
      .filter((cp) => (empresaId === 'todas' || cp.empresa_id === empresaId) && (cp.status === 'pendente' || cp.status === 'vencido'))
      .reduce((a, cp) => a + cp.valor - (cp.valor_pago || 0), 0);

    const ativoCirc = caixa + crPend;
    const imobilizado = 50000;
    const totalAtivo = ativoCirc + imobilizado;
    const obrTrib = cpPend * 0.1;
    const passivoCirc = cpPend + obrTrib;
    const capitalSocial = 30000;
    const lucrosAcum = totalAtivo - passivoCirc - capitalSocial;
    const pl = capitalSocial + lucrosAcum;
    const totalPassivo = passivoCirc + pl;

    return {
      params: { empresaId, ano, mes, fonte },
      dre: { linhas, receitaBruta, lucroLiquido, naoClassificadas: [], totalNaoClassificado: 0 },
      balanco: {
        ativo: [
          { codigo: '1', descricao: 'ATIVO TOTAL', valor: totalAtivo, nivel: 0 },
          { codigo: '1.1', descricao: 'ATIVO CIRCULANTE', valor: ativoCirc, nivel: 1 },
          { codigo: '1.1.1', descricao: 'Caixa e Equivalentes', valor: caixa, nivel: 2 },
          { codigo: '1.1.2', descricao: 'Contas a Receber', valor: crPend, nivel: 2 },
          { codigo: '1.2', descricao: 'ATIVO NÃO CIRCULANTE', valor: imobilizado, nivel: 1 },
        ],
        passivo: [
          { codigo: '2', descricao: 'PASSIVO TOTAL', valor: totalPassivo, nivel: 0 },
          { codigo: '2.1', descricao: 'PASSIVO CIRCULANTE', valor: passivoCirc, nivel: 1 },
          { codigo: '2.1.1', descricao: 'Fornecedores', valor: cpPend, nivel: 2 },
          { codigo: '2.1.2', descricao: 'Obrigações Tributárias', valor: obrTrib, nivel: 2 },
          { codigo: '3', descricao: 'PATRIMÔNIO LÍQUIDO', valor: pl, nivel: 0 },
          { codigo: '3.1', descricao: 'Capital Social', valor: capitalSocial, nivel: 1 },
          { codigo: '3.2', descricao: 'Lucros/Prejuízos Acumulados', valor: lucrosAcum, nivel: 1 },
        ],
        totalAtivo,
        totalPassivo,
        ativoCirculante: ativoCirc,
        ativoNaoCirculante: imobilizado,
        passivoCirculante: passivoCirc,
        patrimonioLiquido: pl,
        equilibrado: Math.abs(totalAtivo - totalPassivo) < 0.01,
      },
      cobertura: { totalLancamentos: 0, totalPartidas: 0 },
      origem: 'caixa',
      isLoading: false,
      error: null,
    };
  }, [fonte, partidasQuery.data, partidasQuery.isLoading, partidasQuery.error, contasReceber, contasPagar, contasBancarias, empresaId, ano, mes, inicio, fim]);
}
