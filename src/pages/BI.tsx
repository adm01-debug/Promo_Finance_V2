import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  useEmpresas,
  useContasPagar,
  useContasReceber,
  useContasBancarias,
  useClientes,
  useCentrosCusto,
} from '@/hooks/useFinancialData';
import { format, subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { valorRecebidoEfetivo } from '@/lib/financeiro/valor-recebido-efetivo';
import { BIFuturista } from './BIFuturista';

export default function BI() {
  const { currentEmpresaId } = useAuth();
  const [periodo, setPeriodo] = useState('6');
  const [empresaId, setEmpresaId] = useState<string>(currentEmpresaId || 'todas');
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [usarPeriodoCustom, setUsarPeriodoCustom] = useState(false);
  const [futuristicMode, setFuturisticMode] = useState(true);
  const [filters, setFilters] = useState({ centroCustoId: 'todos', contaBancariaId: 'todos' });
  const [drillDownItem, setDrillDownItem] = useState<string | null>(null);

  // Sincroniza com a empresa ativa do sistema (so quando a selecao ainda e o default 'todas')
  useEffect(() => {
    if (currentEmpresaId) {
      setEmpresaId((prev) =>
        prev === 'todas' && prev !== currentEmpresaId ? currentEmpresaId : prev
      );
    }
  }, [currentEmpresaId]);

  const { data: empresas = [] } = useEmpresas();
  const { data: contasPagarBase = [] } = useContasPagar();
  const { data: contasReceberBase = [] } = useContasReceber();
  // Normaliza `valor` (nullable na view) uma única vez: consumo sempre como number
  const contasPagar = useMemo(
    () => contasPagarBase.map((c) => ({ ...c, valor: c.valor ?? 0 })),
    [contasPagarBase]
  );
  const contasReceber = useMemo(
    () => contasReceberBase.map((c) => ({ ...c, valor: c.valor ?? 0 })),
    [contasReceberBase]
  );
  const { data: contasBancarias = [] } = useContasBancarias();
  const { data: clientes = [] } = useClientes();
  const { data: centrosCusto = [] } = useCentrosCusto();

  const filteredPagar = useMemo(() => {
    let base =
      empresaId === 'todas' ? contasPagar : contasPagar.filter((c) => c.empresa_id === empresaId);
    if (filters.centroCustoId !== 'todos')
      base = base.filter((c) => c.centro_custo_id === filters.centroCustoId);
    return base;
  }, [contasPagar, empresaId, filters.centroCustoId]);

  const filteredReceber = useMemo(() => {
    let base =
      empresaId === 'todas'
        ? contasReceber
        : contasReceber.filter((c) => c.empresa_id === empresaId);
    if (filters.centroCustoId !== 'todos')
      base = base.filter((c) => c.centro_custo_id === filters.centroCustoId);
    return base;
  }, [contasReceber, empresaId, filters.centroCustoId]);

  const filteredContas = useMemo(
    () =>
      empresaId === 'todas'
        ? contasBancarias
        : contasBancarias.filter((c) => c.empresa_id === empresaId),
    [contasBancarias, empresaId]
  );

  const kpis = useMemo(() => {
    const saldoTotal = filteredContas.reduce((acc, c) => acc + (c.saldo_atual || 0), 0);
    const totalReceber = filteredReceber
      .filter((c) => c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado')
      .reduce((acc, c) => acc + c.valor, 0);
    const totalPagar = filteredPagar
      .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
      .reduce((acc, c) => acc + c.valor, 0);
    const vencidasReceber = filteredReceber.filter((c) => c.status === 'vencido');
    const totalVencidasReceber = vencidasReceber.reduce((acc, c) => acc + c.valor, 0);
    const inadimplencia = totalReceber > 0 ? (totalVencidasReceber / totalReceber) * 100 : 0;
    const receitaMes = filteredReceber
      .filter(
        (c) =>
          (c.status === 'pago' || c.status === 'recebido') &&
          c.data_recebimento &&
          new Date(c.data_recebimento).getMonth() === new Date().getMonth()
      )
      .reduce((acc, c) => acc + valorRecebidoEfetivo(c), 0);
    const despesaMes = filteredPagar
      .filter(
        (c) =>
          c.status === 'pago' &&
          c.data_pagamento &&
          new Date(c.data_pagamento).getMonth() === new Date().getMonth()
      )
      .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
    const lucroMes = receitaMes - despesaMes;
    const margemLucro = receitaMes > 0 ? (lucroMes / receitaMes) * 100 : 0;
    const lastMonth = subMonths(new Date(), 1);
    const receitaMesAnterior = filteredReceber
      .filter(
        (c) =>
          (c.status === 'pago' || c.status === 'recebido') &&
          c.data_recebimento &&
          new Date(c.data_recebimento).getMonth() === lastMonth.getMonth()
      )
      .reduce((acc, c) => acc + valorRecebidoEfetivo(c), 0);
    const variacaoReceita =
      receitaMesAnterior > 0 ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 : 0;
    return {
      saldoTotal,
      totalReceber,
      totalPagar,
      totalVencidasReceber,
      inadimplencia,
      receitaMes,
      despesaMes,
      lucroMes,
      margemLucro,
      variacaoReceita,
      liquidez: totalPagar > 0 ? saldoTotal / totalPagar : 0,
      clientesAtivos: clientes.filter((c) => c.ativo).length,
      contasAtivas: filteredContas.filter((c) => c.ativo).length,
    };
  }, [filteredContas, filteredReceber, filteredPagar, clientes]);

  const evolucaoMensal = useMemo(() => {
    const data: {
      mes: string;
      receitas: number;
      despesas: number;
      lucro: number;
      margem: number;
    }[] = [];
    if (usarPeriodoCustom && dataInicio && dataFim) {
      let current = startOfMonth(dataInicio);
      const endDate = endOfMonth(dataFim);
      while (current <= endDate) {
        const inicio = startOfMonth(current);
        const fim = endOfMonth(current);
        const receitas = filteredReceber
          .filter(
            (c) =>
              (c.status === 'pago' || c.status === 'recebido') &&
              c.data_recebimento &&
              new Date(c.data_recebimento) >= inicio &&
              new Date(c.data_recebimento) <= fim
          )
          .reduce((acc, c) => acc + valorRecebidoEfetivo(c), 0);
        const despesas = filteredPagar
          .filter(
            (c) =>
              c.status === 'pago' &&
              c.data_pagamento &&
              new Date(c.data_pagamento) >= inicio &&
              new Date(c.data_pagamento) <= fim
          )
          .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        data.push({
          mes: format(current, 'MMM/yy', { locale: ptBR }),
          receitas,
          despesas,
          lucro: receitas - despesas,
          margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0,
        });
        current = subMonths(current, -1);
      }
    } else {
      const meses = parseInt(periodo);
      for (let i = meses - 1; i >= 0; i--) {
        const mesRef = subMonths(new Date(), i);
        const inicio = startOfMonth(mesRef);
        const fim = endOfMonth(mesRef);
        const receitas = filteredReceber
          .filter(
            (c) =>
              (c.status === 'pago' || c.status === 'recebido') &&
              c.data_recebimento &&
              new Date(c.data_recebimento) >= inicio &&
              new Date(c.data_recebimento) <= fim
          )
          .reduce((acc, c) => acc + valorRecebidoEfetivo(c), 0);
        const despesas = filteredPagar
          .filter(
            (c) =>
              c.status === 'pago' &&
              c.data_pagamento &&
              new Date(c.data_pagamento) >= inicio &&
              new Date(c.data_pagamento) <= fim
          )
          .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        data.push({
          mes: format(mesRef, 'MMM/yy', { locale: ptBR }),
          receitas,
          despesas,
          lucro: receitas - despesas,
          margem: receitas > 0 ? ((receitas - despesas) / receitas) * 100 : 0,
        });
      }
    }
    return data;
  }, [filteredReceber, filteredPagar, periodo, usarPeriodoCustom, dataInicio, dataFim]);

  const statusReceber = useMemo(() => {
    const statusCount = { pago: 0, recebido: 0, pendente: 0, vencido: 0, parcial: 0 };
    filteredReceber.forEach((c) => {
      if (statusCount[c.status as keyof typeof statusCount] !== undefined)
        statusCount[c.status as keyof typeof statusCount]++;
    });
    return [
      {
        name: 'Pago',
        value: statusCount.pago + statusCount.recebido,
        color: 'hsl(var(--success))',
      },
      { name: 'Pendente', value: statusCount.pendente, color: 'hsl(var(--warning))' },
      { name: 'Vencido', value: statusCount.vencido, color: 'hsl(var(--destructive))' },
      { name: 'Parcial', value: statusCount.parcial, color: 'hsl(var(--chart-4))' },
    ].filter((s) => s.value > 0);
  }, [filteredReceber]);

  const agingReceber = useMemo(() => {
    const hoje = new Date();
    const aging = { aVencer: 0, ate30: 0, ate60: 0, ate90: 0, mais90: 0 };
    filteredReceber
      .filter((c) => c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado')
      .forEach((c) => {
        if (!c.data_vencimento) return;
        const dias = differenceInDays(hoje, new Date(c.data_vencimento));
        if (dias < 0) aging.aVencer += c.valor;
        else if (dias <= 30) aging.ate30 += c.valor;
        else if (dias <= 60) aging.ate60 += c.valor;
        else if (dias <= 90) aging.ate90 += c.valor;
        else aging.mais90 += c.valor;
      });
    return [
      { faixa: 'A Vencer', valor: aging.aVencer, fill: 'hsl(var(--success))' },
      { faixa: '1-30 dias', valor: aging.ate30, fill: 'hsl(var(--warning))' },
      { faixa: '31-60 dias', valor: aging.ate60, fill: 'hsl(var(--chart-4))' },
      { faixa: '61-90 dias', valor: aging.ate90, fill: 'hsl(var(--destructive))' },
      { faixa: '+90 dias', valor: aging.mais90, fill: 'hsl(142, 76%, 36%)' },
    ];
  }, [filteredReceber]);

  const topClientes = useMemo(() => {
    const clienteMap = new Map<string, number>();
    filteredReceber
      .filter((c) => c.status === 'pago' || c.status === 'recebido')
      .forEach((c) => {
        const nome = c.cliente_nome || 'Sem cliente';
        clienteMap.set(nome, (clienteMap.get(nome) || 0) + valorRecebidoEfetivo(c));
      });
    return Array.from(clienteMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [filteredReceber]);

  const distribuicaoCentros = useMemo(() => {
    const centroMap = new Map<string, number>();
    filteredPagar
      .filter((c) => c.status === 'pago')
      .forEach((c) => {
        const centro = centrosCusto.find((cc) => cc.id === c.centro_custo_id);
        const nome = centro?.nome || 'Sem centro';
        centroMap.set(nome, (centroMap.get(nome) || 0) + (c.valor_pago || c.valor));
      });
    return Array.from(centroMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [filteredPagar, centrosCusto]);

  const comparativoEmpresas = useMemo(() => {
    return empresas
      .filter((e) => e.ativo)
      .map((empresa) => {
        const er = contasReceber.filter((c) => c.empresa_id === empresa.id);
        const ep = contasPagar.filter((c) => c.empresa_id === empresa.id);
        const ec = contasBancarias.filter((c) => c.empresa_id === empresa.id);
        const receitas = er
          .filter((c) => c.status === 'pago' || c.status === 'recebido')
          .reduce((acc, c) => acc + valorRecebidoEfetivo(c), 0);
        const despesas = ep
          .filter((c) => c.status === 'pago')
          .reduce((acc, c) => acc + (c.valor_pago || c.valor), 0);
        const saldo = ec.reduce((acc, c) => acc + c.saldo_atual, 0);
        const aReceber = er
          .filter((c) => c.status !== 'pago' && c.status !== 'recebido' && c.status !== 'cancelado')
          .reduce((acc, c) => acc + c.valor, 0);
        const aPagar = ep
          .filter((c) => c.status !== 'pago' && c.status !== 'cancelado')
          .reduce((acc, c) => acc + c.valor, 0);
        const vencidas = er
          .filter((c) => c.status === 'vencido')
          .reduce((acc, c) => acc + c.valor, 0);
        const inadimplencia = aReceber > 0 ? (vencidas / aReceber) * 100 : 0;
        const lucro = receitas - despesas;
        const margem = receitas > 0 ? (lucro / receitas) * 100 : 0;
        const liquidez = aPagar > 0 ? saldo / aPagar : 0;
        const quitadas = er.filter((c) => c.status === 'pago' || c.status === 'recebido').length;
        const ticketMedio = quitadas > 0 ? receitas / quitadas : 0;
        return {
          id: empresa.id,
          nome: empresa.nome_fantasia || empresa.razao_social,
          cnpj: empresa.cnpj ?? '',
          receitas,
          despesas,
          lucro,
          margem,
          saldo,
          aReceber,
          aPagar,
          inadimplencia,
          liquidez,
          contasCount: ec.filter((c) => c.ativo).length,
          ticketMedio,
          saldoProjetado: saldo + aReceber - aPagar,
        };
      })
      .sort((a, b) => b.lucro - a.lucro);
  }, [empresas, contasReceber, contasPagar, contasBancarias]);

  // Adapta as linhas das views (campos nullable) para o shape exigido pelo BIDrillDown
  const drillDownData = useMemo(() => {
    if (!drillDownItem) return [];
    if (drillDownItem === 'pagar') {
      return filteredPagar.map((c) => ({
        id: c.id ?? '',
        fornecedor_nome: c.fornecedor_nome,
        descricao: c.descricao,
        data_vencimento: c.data_vencimento,
        data_pagamento: c.data_pagamento,
        created_at: c.created_at,
        status: c.status,
        valor: c.valor,
      }));
    }
    // Métricas sem dados próprios (ex.: 'conciliacao') abrem o diálogo vazio,
    // não com contas a receber — o tipo 'pagar' com dados de receber confunde.
    const receber =
      drillDownItem === 'atraso'
        ? filteredReceber.filter((c) => c.status === 'vencido')
        : drillDownItem === 'receber'
          ? filteredReceber
          : [];
    return receber.map((c) => ({
      id: c.id ?? '',
      cliente_nome: c.cliente_nome,
      descricao: c.descricao,
      data_vencimento: c.data_vencimento,
      created_at: c.created_at,
      status: c.status,
      valor: c.valor,
    }));
  }, [drillDownItem, filteredReceber, filteredPagar]);

  return (
    <MainLayout>
      <BIFuturista
        futuristicMode={futuristicMode}
        empresaId={empresaId}
        empresas={empresas}
        setFuturisticMode={setFuturisticMode}
        setEmpresaId={setEmpresaId}
        filters={filters}
        setFilters={setFilters}
        centrosCusto={centrosCusto}
        contasBancarias={contasBancarias}
        usarPeriodoCustom={usarPeriodoCustom}
        periodo={periodo}
        setUsarPeriodoCustom={setUsarPeriodoCustom}
        setPeriodo={setPeriodo}
        setDataInicio={setDataInicio}
        setDataFim={setDataFim}
        dataInicio={dataInicio}
        dataFim={dataFim}
        kpis={kpis}
        evolucaoMensal={evolucaoMensal}
        setDrillDownItem={setDrillDownItem}
        statusReceber={statusReceber}
        agingReceber={agingReceber}
        topClientes={topClientes}
        distribuicaoCentros={distribuicaoCentros}
        comparativoEmpresas={comparativoEmpresas}
        drillDownItem={drillDownItem}
        drillDownData={drillDownData}
      />
    </MainLayout>
  );
}
