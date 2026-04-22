import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useContasPagar, useContasReceber, useContasBancarias } from '@/hooks/useFinancialData';
import { useMemo } from 'react';

export type FonteDemonstrativo = 'competencia' | 'caixa';

export interface DRELinha {
  codigo: string;
  descricao: string;
  valor: number;
  percentual: number;
  nivel: number;
  tipo: 'receita' | 'despesa' | 'resultado';
}

export interface BalancoLinha {
  codigo: string;
  descricao: string;
  valor: number;
  nivel: number;
}

export interface ContaNaoClassificada {
  conta_id?: string;
  codigo: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  partidas: number;
  centro_resultado_sugerido: string | null;
}

export interface DemonstrativosResult {
  dre: {
    linhas: DRELinha[];
    receitaBruta: number;
    lucroLiquido: number;
    naoClassificadas: ContaNaoClassificada[];
    totalNaoClassificado: number;
  };
  balanco: {
    ativo: BalancoLinha[];
    passivo: BalancoLinha[];
    totalAtivo: number;
    totalPassivo: number;
    ativoCirculante: number;
    ativoNaoCirculante: number;
    passivoCirculante: number;
    patrimonioLiquido: number;
    equilibrado: boolean;
  };
  origem: FonteDemonstrativo;
  cobertura: { totalLancamentos: number; totalPartidas: number };
  isLoading: boolean;
  error: Error | null;
}

interface PartidaRow {
  tipo: 'D' | 'C' | string;
  valor: number;
  conta: {
    id?: string;
    codigo: string;
    descricao: string | null;
    nome: string | null;
    tipo: string;
    natureza: string;
    centro_resultado: string | null;
  } | null;
  lancamento: { data_lancamento: string; empresa_id: string } | null;
}

// Sugere centro_resultado a partir do código/descrição da conta
function sugerirCentroResultado(codigo: string, descricao: string, tipo: string): string | null {
  const c = codigo.toLowerCase();
  const d = (descricao || '').toLowerCase();
  const t = tipo.toLowerCase();
  if (t === 'receita') {
    if (/financeir/.test(d)) return 'receita_financeira';
    return 'receita_operacional';
  }
  if (t === 'despesa') {
    if (/imposto|icms|iss|pis|cofins|simples/.test(d)) return 'deducao_receita';
    if (/cmv|custo.*(merc|produ)/.test(d)) return 'cmv';
    if (/admin|aluguel|escrit|contab/.test(d)) return 'despesa_administrativa';
    if (/comercial|vendas|marketing|publicid/.test(d)) return 'despesa_comercial';
    if (/financeir|juros|tarifa banc/.test(d)) return 'despesa_financeira';
    if (/irpj|csll/.test(d) || c.startsWith('3.4') || c.startsWith('3.5')) return 'irpj_csll';
    return 'despesa_operacional';
  }
  return null;
}

// ----------- Helpers de classificação -----------
function classificarLinhaDRE(centro: string | null, codigo: string): string {
  const c = (centro || '').toLowerCase();
  if (c.includes('deducao') || c.includes('dedução') || c.includes('imposto_venda')) return 'deducoes';
  if (c.includes('cmv') || c.includes('custo_merc') || c.includes('custo_produ')) return 'cmv';
  if (c.includes('despesa_admin') || c.includes('administrativ')) return 'desp_admin';
  if (c.includes('despesa_comercial') || c.includes('comercial') || c.includes('vendas')) return 'desp_comercial';
  if (c.includes('despesa_financeira')) return 'desp_financeira';
  if (c.includes('receita_financeira')) return 'rec_financeira';
  if (c.includes('irpj') || c.includes('csll') || codigo.startsWith('3.4') || codigo.startsWith('3.5')) return 'ir_csll';
  return 'outras_op';
}

function classificarLinhaBP(tipo: string, codigo: string): 'circulante_ativo' | 'nao_circ_ativo' | 'circulante_pas' | 'nao_circ_pas' | 'pl' {
  const t = tipo.toLowerCase();
  if (t === 'ativo' || codigo.startsWith('1')) {
    // 1.1 = circulante, 1.2 = não circulante
    return codigo.startsWith('1.2') ? 'nao_circ_ativo' : 'circulante_ativo';
  }
  if (t === 'passivo' || codigo.startsWith('2')) {
    if (codigo.startsWith('2.3') || codigo.startsWith('3')) return 'pl';
    return codigo.startsWith('2.2') ? 'nao_circ_pas' : 'circulante_pas';
  }
  return 'pl';
}

// ----------- Cálculo por COMPETÊNCIA -----------
function calcularPorCompetencia(
  partidasPeriodo: PartidaRow[],
  partidasAteFim: PartidaRow[],
): Pick<DemonstrativosResult, 'dre' | 'balanco' | 'cobertura'> {
  // ---------- DRE (apenas período) ----------
  const buckets = {
    receita_bruta: 0,
    deducoes: 0,
    cmv: 0,
    desp_admin: 0,
    desp_comercial: 0,
    desp_financeira: 0,
    rec_financeira: 0,
    ir_csll: 0,
    outras_op: 0,
  };

  for (const p of partidasPeriodo) {
    if (!p.conta) continue;
    const tipo = p.conta.tipo.toLowerCase();
    const isReceita = tipo === 'receita';
    const isDespesa = tipo === 'despesa';
    if (!isReceita && !isDespesa) continue;

    // Sinal contábil: receita aumenta com C; despesa aumenta com D
    let valor = 0;
    if (isReceita) valor = p.tipo === 'C' ? p.valor : -p.valor;
    if (isDespesa) valor = p.tipo === 'D' ? p.valor : -p.valor;

    const grupo = classificarLinhaDRE(p.conta.centro_resultado, p.conta.codigo);
    if (isReceita && grupo === 'rec_financeira') buckets.rec_financeira += valor;
    else if (isReceita) buckets.receita_bruta += valor;
    else buckets[grupo as keyof typeof buckets] += valor;
  }

  const receitaBruta = buckets.receita_bruta;
  const deducoes = buckets.deducoes;
  const receitaLiquida = receitaBruta - deducoes;
  const cmv = buckets.cmv;
  const lucroBruto = receitaLiquida - cmv;
  const despOp = buckets.desp_admin + buckets.desp_comercial + buckets.outras_op;
  const lucroOp = lucroBruto - despOp;
  const resFin = buckets.rec_financeira - buckets.desp_financeira;
  const lucroAntesIR = lucroOp + resFin;
  const irCsll = buckets.ir_csll;
  const lucroLiquido = lucroAntesIR - irCsll;

  const pct = (v: number) => (receitaBruta > 0 ? (Math.abs(v) / receitaBruta) * 100 : 0);
  const linhas: DRELinha[] = [
    { codigo: '1', descricao: 'RECEITA BRUTA DE VENDAS', valor: receitaBruta, percentual: 100, nivel: 0, tipo: 'receita' },
    { codigo: '2', descricao: '(-) DEDUÇÕES DA RECEITA', valor: -deducoes, percentual: pct(deducoes), nivel: 0, tipo: 'despesa' },
    { codigo: '3', descricao: '(=) RECEITA LÍQUIDA', valor: receitaLiquida, percentual: pct(receitaLiquida), nivel: 0, tipo: 'resultado' },
    { codigo: '4', descricao: '(-) CUSTO DAS MERCADORIAS VENDIDAS', valor: -cmv, percentual: pct(cmv), nivel: 0, tipo: 'despesa' },
    { codigo: '5', descricao: '(=) LUCRO BRUTO', valor: lucroBruto, percentual: pct(lucroBruto), nivel: 0, tipo: 'resultado' },
    { codigo: '6', descricao: '(-) DESPESAS OPERACIONAIS', valor: -despOp, percentual: pct(despOp), nivel: 0, tipo: 'despesa' },
    { codigo: '6.1', descricao: 'Despesas Administrativas', valor: -buckets.desp_admin, percentual: pct(buckets.desp_admin), nivel: 1, tipo: 'despesa' },
    { codigo: '6.2', descricao: 'Despesas Comerciais', valor: -buckets.desp_comercial, percentual: pct(buckets.desp_comercial), nivel: 1, tipo: 'despesa' },
    { codigo: '6.3', descricao: 'Outras Despesas Operacionais', valor: -buckets.outras_op, percentual: pct(buckets.outras_op), nivel: 1, tipo: 'despesa' },
    { codigo: '7', descricao: '(=) LUCRO OPERACIONAL', valor: lucroOp, percentual: pct(lucroOp), nivel: 0, tipo: 'resultado' },
    { codigo: '8', descricao: '(+/-) RESULTADO FINANCEIRO', valor: resFin, percentual: pct(resFin), nivel: 0, tipo: 'resultado' },
    { codigo: '9', descricao: '(=) LUCRO ANTES DO IR/CSLL', valor: lucroAntesIR, percentual: pct(lucroAntesIR), nivel: 0, tipo: 'resultado' },
    { codigo: '10', descricao: '(-) IRPJ/CSLL', valor: -irCsll, percentual: pct(irCsll), nivel: 0, tipo: 'despesa' },
    { codigo: '11', descricao: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', valor: lucroLiquido, percentual: pct(lucroLiquido), nivel: 0, tipo: 'resultado' },
  ];

  // ---------- BALANÇO (saldo até fim do período) ----------
  const bp = {
    circulante_ativo: 0,
    nao_circ_ativo: 0,
    circulante_pas: 0,
    nao_circ_pas: 0,
    pl_capital: 0,
    pl_outros: 0,
  };
  let resultadoExercicioAcumulado = 0;

  for (const p of partidasAteFim) {
    if (!p.conta) continue;
    const tipo = p.conta.tipo.toLowerCase();
    if (tipo === 'receita') {
      resultadoExercicioAcumulado += p.tipo === 'C' ? p.valor : -p.valor;
      continue;
    }
    if (tipo === 'despesa') {
      resultadoExercicioAcumulado -= p.tipo === 'D' ? p.valor : -p.valor;
      continue;
    }
    // ativo/passivo
    let saldo = 0;
    if (tipo === 'ativo') saldo = p.tipo === 'D' ? p.valor : -p.valor;
    else saldo = p.tipo === 'C' ? p.valor : -p.valor; // passivo/PL

    const grupo = classificarLinhaBP(tipo, p.conta.codigo);
    if (grupo === 'pl') {
      const c = (p.conta.codigo || '').toLowerCase();
      const desc = (p.conta.descricao || p.conta.nome || '').toLowerCase();
      if (desc.includes('capital') || c.startsWith('2.3.1') || c.startsWith('3.1')) bp.pl_capital += saldo;
      else bp.pl_outros += saldo;
    } else {
      bp[grupo] += saldo;
    }
  }

  const lucrosAcumulados = bp.pl_outros + resultadoExercicioAcumulado;
  const patrimonioLiquido = bp.pl_capital + lucrosAcumulados;
  const ativoCirc = bp.circulante_ativo;
  const ativoNC = bp.nao_circ_ativo;
  const totalAtivo = ativoCirc + ativoNC;
  const passivoCirc = bp.circulante_pas;
  const passivoNC = bp.nao_circ_pas;
  const totalPassivo = passivoCirc + passivoNC + patrimonioLiquido;

  const ativo: BalancoLinha[] = [
    { codigo: '1', descricao: 'ATIVO TOTAL', valor: totalAtivo, nivel: 0 },
    { codigo: '1.1', descricao: 'ATIVO CIRCULANTE', valor: ativoCirc, nivel: 1 },
    { codigo: '1.2', descricao: 'ATIVO NÃO CIRCULANTE', valor: ativoNC, nivel: 1 },
  ];
  const passivo: BalancoLinha[] = [
    { codigo: '2', descricao: 'PASSIVO TOTAL', valor: totalPassivo, nivel: 0 },
    { codigo: '2.1', descricao: 'PASSIVO CIRCULANTE', valor: passivoCirc, nivel: 1 },
    { codigo: '2.2', descricao: 'PASSIVO NÃO CIRCULANTE', valor: passivoNC, nivel: 1 },
    { codigo: '3', descricao: 'PATRIMÔNIO LÍQUIDO', valor: patrimonioLiquido, nivel: 0 },
    { codigo: '3.1', descricao: 'Capital Social', valor: bp.pl_capital, nivel: 1 },
    { codigo: '3.2', descricao: 'Lucros/Prejuízos Acumulados', valor: lucrosAcumulados, nivel: 1 },
  ];

  return {
    dre: { linhas, receitaBruta, lucroLiquido },
    balanco: {
      ativo,
      passivo,
      totalAtivo,
      totalPassivo,
      ativoCirculante: ativoCirc,
      ativoNaoCirculante: ativoNC,
      passivoCirculante: passivoCirc,
      patrimonioLiquido,
      equilibrado: Math.abs(totalAtivo - totalPassivo) < 0.01,
    },
    cobertura: { totalLancamentos: 0, totalPartidas: partidasAteFim.length },
  };
}

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
        .select('tipo, valor, conta:plano_contas(codigo, descricao, nome, tipo, natureza, centro_resultado), lancamento:lancamentos_contabeis!inner(data_lancamento, empresa_id)')
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
      .filter((p) => /mercadoria|produto/i.test(p.centro_custo || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const lucroBruto = receitaLiquida - cmv;
    const despAdmin = pagamentos
      .filter((p) => /admin/i.test(p.centro_custo || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const despCom = pagamentos
      .filter((p) => /comercial|vendas/i.test(p.centro_custo || ''))
      .reduce((a, p) => a + (p.valor_pago || p.valor), 0);
    const outrasOp = pagamentos
      .filter((p) => !/mercadoria|produto|admin|comercial|vendas/i.test(p.centro_custo || ''))
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
      dre: { linhas, receitaBruta, lucroLiquido },
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
