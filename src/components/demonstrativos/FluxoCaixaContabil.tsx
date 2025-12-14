import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Building, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContasPagar, useContasReceber, useContasBancarias } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';

interface FluxoCaixaContabilProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
}

interface FluxoLinha {
  codigo: string;
  descricao: string;
  valor: number;
  nivel: number;
  tipo: 'entrada' | 'saida' | 'subtotal' | 'total';
}

export const FluxoCaixaContabil = ({ periodo, mes, ano, empresaId }: FluxoCaixaContabilProps) => {
  const { data: contasReceber } = useContasReceber();
  const { data: contasPagar } = useContasPagar();
  const { data: contasBancarias } = useContasBancarias();

  const fluxo = useMemo(() => {
    const dataInicio = new Date(ano, mes, 1);
    const dataFim = new Date(ano, mes + 1, 0);
    const mesAnteriorFim = new Date(ano, mes, 0);

    // Filtrar por empresa
    const bancosEmpresa = (contasBancarias || []).filter(
      cb => empresaId === 'todas' || cb.empresa_id === empresaId
    );

    const receberEmpresa = (contasReceber || []).filter(
      cr => empresaId === 'todas' || cr.empresa_id === empresaId
    );

    const pagarEmpresa = (contasPagar || []).filter(
      cp => empresaId === 'todas' || cp.empresa_id === empresaId
    );

    // Saldo Inicial (simplificado - usa saldo atual menos movimentações do mês)
    const saldoAtual = bancosEmpresa.reduce((acc, cb) => acc + cb.saldo_atual, 0);

    // Recebimentos no período
    const recebimentosPeriodo = receberEmpresa.filter(cr => {
      if (!cr.data_recebimento) return false;
      const data = new Date(cr.data_recebimento);
      return data >= dataInicio && data <= dataFim && cr.status === 'pago';
    });

    // Pagamentos no período
    const pagamentosPeriodo = pagarEmpresa.filter(cp => {
      if (!cp.data_pagamento) return false;
      const data = new Date(cp.data_pagamento);
      return data >= dataInicio && data <= dataFim && cp.status === 'pago';
    });

    // ATIVIDADES OPERACIONAIS
    const recebimentoClientes = recebimentosPeriodo.reduce(
      (acc, r) => acc + (r.valor_recebido || r.valor), 0
    );

    const pagamentoFornecedores = pagamentosPeriodo
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('fornecedor') || 
                   p.centros_custo?.nome?.toLowerCase().includes('mercadoria') ||
                   p.centros_custo?.nome?.toLowerCase().includes('produto'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const pagamentoSalarios = pagamentosPeriodo
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('pessoal') || 
                   p.centros_custo?.nome?.toLowerCase().includes('salário') ||
                   p.centros_custo?.nome?.toLowerCase().includes('folha'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const pagamentoImpostos = pagamentosPeriodo
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('imposto') || 
                   p.centros_custo?.nome?.toLowerCase().includes('tributo') ||
                   p.centros_custo?.nome?.toLowerCase().includes('fiscal'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const outrasDespesasOp = pagamentosPeriodo
      .filter(p => !p.centros_custo?.nome?.toLowerCase().includes('fornecedor') && 
                   !p.centros_custo?.nome?.toLowerCase().includes('mercadoria') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('produto') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('pessoal') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('salário') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('folha') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('imposto') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('tributo') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('fiscal') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('investimento') &&
                   !p.centros_custo?.nome?.toLowerCase().includes('empréstimo'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const fluxoOperacional = recebimentoClientes - pagamentoFornecedores - pagamentoSalarios - pagamentoImpostos - outrasDespesasOp;

    // ATIVIDADES DE INVESTIMENTO
    const investimentos = pagamentosPeriodo
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('investimento') ||
                   p.centros_custo?.nome?.toLowerCase().includes('imobilizado'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const fluxoInvestimento = -investimentos;

    // ATIVIDADES DE FINANCIAMENTO
    const emprestimosRecebidos = 0;
    const emprestimosPagos = pagamentosPeriodo
      .filter(p => p.centros_custo?.nome?.toLowerCase().includes('empréstimo') ||
                   p.centros_custo?.nome?.toLowerCase().includes('financiamento'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const fluxoFinanciamento = emprestimosRecebidos - emprestimosPagos;

    // Variação Total
    const variacaoTotal = fluxoOperacional + fluxoInvestimento + fluxoFinanciamento;

    // Saldo Inicial calculado
    const saldoInicial = saldoAtual - variacaoTotal;
    const saldoFinal = saldoInicial + variacaoTotal;

    const operacional: FluxoLinha[] = [
      { codigo: '1', descricao: 'ATIVIDADES OPERACIONAIS', valor: fluxoOperacional, nivel: 0, tipo: 'subtotal' },
      { codigo: '1.1', descricao: '(+) Recebimento de Clientes', valor: recebimentoClientes, nivel: 1, tipo: 'entrada' },
      { codigo: '1.2', descricao: '(-) Pagamento a Fornecedores', valor: -pagamentoFornecedores, nivel: 1, tipo: 'saida' },
      { codigo: '1.3', descricao: '(-) Pagamento de Salários', valor: -pagamentoSalarios, nivel: 1, tipo: 'saida' },
      { codigo: '1.4', descricao: '(-) Pagamento de Impostos', valor: -pagamentoImpostos, nivel: 1, tipo: 'saida' },
      { codigo: '1.5', descricao: '(-) Outras Despesas Operacionais', valor: -outrasDespesasOp, nivel: 1, tipo: 'saida' },
    ];

    const investimento: FluxoLinha[] = [
      { codigo: '2', descricao: 'ATIVIDADES DE INVESTIMENTO', valor: fluxoInvestimento, nivel: 0, tipo: 'subtotal' },
      { codigo: '2.1', descricao: '(-) Aquisição de Imobilizado', valor: -investimentos, nivel: 1, tipo: 'saida' },
    ];

    const financiamento: FluxoLinha[] = [
      { codigo: '3', descricao: 'ATIVIDADES DE FINANCIAMENTO', valor: fluxoFinanciamento, nivel: 0, tipo: 'subtotal' },
      { codigo: '3.1', descricao: '(+) Empréstimos Recebidos', valor: emprestimosRecebidos, nivel: 1, tipo: 'entrada' },
      { codigo: '3.2', descricao: '(-) Pagamento de Empréstimos', valor: -emprestimosPagos, nivel: 1, tipo: 'saida' },
    ];

    return { 
      operacional, 
      investimento, 
      financiamento, 
      saldoInicial, 
      saldoFinal, 
      variacaoTotal,
      fluxoOperacional,
      fluxoInvestimento,
      fluxoFinanciamento
    };
  }, [contasReceber, contasPagar, contasBancarias, mes, ano, empresaId]);

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderLinha = (linha: FluxoLinha, index: number) => (
    <motion.tr
      key={linha.codigo}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`
        border-t border-border/30 transition-colors hover:bg-muted/30
        ${linha.nivel === 0 ? 'font-bold bg-muted/30' : ''}
      `}
    >
      <td className="p-3 text-sm text-muted-foreground">{linha.codigo}</td>
      <td className={`p-3 text-sm ${linha.nivel === 1 ? 'pl-8' : ''}`}>
        <div className="flex items-center gap-2">
          {linha.tipo === 'entrada' && <ArrowUpCircle className="h-4 w-4 text-success" />}
          {linha.tipo === 'saida' && <ArrowDownCircle className="h-4 w-4 text-destructive" />}
          {linha.descricao}
        </div>
      </td>
      <td className={`p-3 text-sm text-right tabular-nums ${
        linha.valor > 0 ? 'text-success' : linha.valor < 0 ? 'text-destructive' : ''
      }`}>
        {formatCurrency(Math.abs(linha.valor))}
      </td>
    </motion.tr>
  );

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              Saldo Inicial
            </div>
            <div className="text-2xl font-bold">{formatCurrency(fluxo.saldoInicial)}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Operacional
            </div>
            <div className={`text-2xl font-bold ${fluxo.fluxoOperacional >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(fluxo.fluxoOperacional)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building className="h-4 w-4" />
              Investimento
            </div>
            <div className={`text-2xl font-bold ${fluxo.fluxoInvestimento >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(fluxo.fluxoInvestimento)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Coins className="h-4 w-4" />
              Saldo Final
            </div>
            <div className="text-2xl font-bold">{formatCurrency(fluxo.saldoFinal)}</div>
            <Badge variant={fluxo.variacaoTotal >= 0 ? 'default' : 'destructive'} className="mt-2">
              {fluxo.variacaoTotal >= 0 ? '+' : ''}{formatCurrency(fluxo.variacaoTotal)}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Demonstrativo Completo */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Demonstração do Fluxo de Caixa (Método Direto)
          </CardTitle>
          <CardDescription>
            Período: {meses[mes]} de {ano}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold text-sm w-20">Código</th>
                  <th className="text-left p-3 font-semibold text-sm">Descrição</th>
                  <th className="text-right p-3 font-semibold text-sm w-40">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {/* Saldo Inicial */}
                <tr className="bg-primary/10 font-bold">
                  <td className="p-3 text-sm">-</td>
                  <td className="p-3 text-sm">SALDO INICIAL DE CAIXA</td>
                  <td className="p-3 text-sm text-right tabular-nums">{formatCurrency(fluxo.saldoInicial)}</td>
                </tr>

                {/* Operacional */}
                {fluxo.operacional.map((linha, index) => renderLinha(linha, index))}

                {/* Investimento */}
                {fluxo.investimento.map((linha, index) => renderLinha(linha, index + fluxo.operacional.length))}

                {/* Financiamento */}
                {fluxo.financiamento.map((linha, index) => renderLinha(linha, index + fluxo.operacional.length + fluxo.investimento.length))}

                {/* Variação */}
                <tr className="bg-muted/50 font-bold">
                  <td className="p-3 text-sm">4</td>
                  <td className="p-3 text-sm">(=) VARIAÇÃO LÍQUIDA DE CAIXA</td>
                  <td className={`p-3 text-sm text-right tabular-nums ${
                    fluxo.variacaoTotal >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {formatCurrency(fluxo.variacaoTotal)}
                  </td>
                </tr>

                {/* Saldo Final */}
                <tr className="bg-primary/10 font-bold">
                  <td className="p-3 text-sm">5</td>
                  <td className="p-3 text-sm">(=) SALDO FINAL DE CAIXA</td>
                  <td className="p-3 text-sm text-right tabular-nums">{formatCurrency(fluxo.saldoFinal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <p>Demonstração elaborada pelo método direto conforme CPC 03 (R2)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
