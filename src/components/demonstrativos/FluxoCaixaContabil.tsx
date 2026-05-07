import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Building, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useContasPagar, useContasReceber, useContasBancarias } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

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
      .filter(p => p.centro_custo.toLowerCase().includes('fornecedor') || 
                   p.centro_custo.toLowerCase().includes('mercadoria') ||
                   p.centro_custo.toLowerCase().includes('produto'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const pagamentoSalarios = pagamentosPeriodo
      .filter(p => p.centro_custo.toLowerCase().includes('pessoal') || 
                   p.centro_custo.toLowerCase().includes('salário') ||
                   p.centro_custo.toLowerCase().includes('folha'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const pagamentoImpostos = pagamentosPeriodo
      .filter(p => p.centro_custo.toLowerCase().includes('imposto') || 
                   p.centro_custo.toLowerCase().includes('tributo') ||
                   p.centro_custo.toLowerCase().includes('fiscal'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const outrasDespesasOp = pagamentosPeriodo
      .filter(p => !p.centro_custo.toLowerCase().includes('fornecedor') && 
                   !p.centro_custo.toLowerCase().includes('mercadoria') &&
                   !p.centro_custo.toLowerCase().includes('produto') &&
                   !p.centro_custo.toLowerCase().includes('pessoal') &&
                   !p.centro_custo.toLowerCase().includes('salário') &&
                   !p.centro_custo.toLowerCase().includes('folha') &&
                   !p.centro_custo.toLowerCase().includes('imposto') &&
                   !p.centro_custo.toLowerCase().includes('tributo') &&
                   !p.centro_custo.toLowerCase().includes('fiscal') &&
                   !p.centro_custo.toLowerCase().includes('investimento') &&
                   !p.centro_custo.toLowerCase().includes('empréstimo'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const fluxoOperacional = recebimentoClientes - pagamentoFornecedores - pagamentoSalarios - pagamentoImpostos - outrasDespesasOp;

    // ATIVIDADES DE INVESTIMENTO
    const investimentos = pagamentosPeriodo
      .filter(p => p.centro_custo.toLowerCase().includes('investimento') ||
                   p.centro_custo.toLowerCase().includes('imobilizado'))
      .reduce((acc, p) => acc + (p.valor_pago || p.valor), 0);

    const fluxoInvestimento = -investimentos;

    // ATIVIDADES DE FINANCIAMENTO
    const emprestimosRecebidos = 0;
    const emprestimosPagos = pagamentosPeriodo
      .filter(p => p.centro_custo.toLowerCase().includes('empréstimo') ||
                   p.centro_custo.toLowerCase().includes('financiamento'))
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.01,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={cn(
        "group transition-all duration-300 hover:bg-white/[0.03]",
        linha.nivel === 0 ? "bg-white/[0.02] font-black" : "font-medium"
      )}
    >
      <td className="p-6 text-[11px] font-mono text-muted-foreground/40 group-hover:text-primary transition-colors">
        {linha.codigo}
      </td>
      <td className={cn(
        "p-6 text-sm tracking-tight transition-all",
        linha.nivel === 1 ? "pl-14 opacity-80" : "text-base",
        linha.nivel === 0 ? "text-foreground" : "text-muted-foreground"
      )}>
        <div className="flex items-center gap-4">
          {linha.tipo === 'entrada' && (
            <div className="p-1.5 rounded-lg bg-success/10 text-success">
              <ArrowUpCircle className="h-4 w-4" />
            </div>
          )}
          {linha.tipo === 'saida' && (
            <div className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
              <ArrowDownCircle className="h-4 w-4" />
            </div>
          )}
          {linha.descricao}
        </div>
      </td>
      <td className={cn(
        "p-6 text-right tabular-nums font-bold text-base",
        linha.valor > 0 ? "text-success" : linha.valor < 0 ? "text-destructive" : "text-muted-foreground"
      )}>
        {formatCurrency(Math.abs(linha.valor))}
      </td>
    </motion.tr>
  );

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-primary/30 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Initial Balance</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Saldo Inicial</p>
                <div className="text-2xl font-black tracking-tight">{formatCurrency(fluxo.saldoInicial)}</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-success/30 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-success/10 text-success">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Operational</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Operacional</p>
                <div className={cn(
                  "text-2xl font-black tracking-tight",
                  fluxo.fluxoOperacional >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(fluxo.fluxoOperacional)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-blue-500/30 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Building className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Investment</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Investimento</p>
                <div className={cn(
                  "text-2xl font-black tracking-tight",
                  fluxo.fluxoInvestimento >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {formatCurrency(fluxo.fluxoInvestimento)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-primary/40 group transition-all duration-500 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Net Result</span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Saldo Final</p>
                <div className="text-2xl font-black tracking-tight">{formatCurrency(fluxo.saldoFinal)}</div>
              </div>
              <Badge variant={fluxo.variacaoTotal >= 0 ? 'default' : 'destructive'} className="mt-3 rounded-md px-3 font-black text-[10px] uppercase tracking-tighter">
                {fluxo.variacaoTotal >= 0 ? '+' : ''}{formatCurrency(fluxo.variacaoTotal)} Var.
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <CardHeader className="p-10 pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                  <Wallet className="h-6 w-6" />
                </div>
                Fluxo de Caixa
              </CardTitle>
              <CardDescription className="text-sm font-medium opacity-60">Demonstração pelo Método Direto (CPC 03)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10 pt-4 relative z-10">
          <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-black/20 shadow-inner">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 w-24">Código</th>
                    <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Discriminação das Atividades</th>
                    <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 w-48">Fluxo (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Saldo Inicial */}
                  <tr className="bg-primary/10 font-black">
                    <td className="p-6 text-[11px] font-mono opacity-40">-</td>
                    <td className="p-6 text-base text-primary uppercase tracking-tight">SALDO INICIAL DE DISPONIBILIDADES</td>
                    <td className="p-6 text-right tabular-nums text-lg">{formatCurrency(fluxo.saldoInicial)}</td>
                  </tr>

                  {/* Operacional */}
                  {fluxo.operacional.map((linha, index) => renderLinha(linha, index))}

                  {/* Investimento */}
                  {fluxo.investimento.map((linha, index) => renderLinha(linha, index + fluxo.operacional.length))}

                  {/* Financiamento */}
                  {fluxo.financiamento.map((linha, index) => renderLinha(linha, index + fluxo.operacional.length + fluxo.investimento.length))}

                  {/* Variação */}
                  <tr className="bg-white/[0.03] font-black">
                    <td className="p-6 text-[11px] font-mono text-muted-foreground/40">4</td>
                    <td className="p-6 text-base uppercase tracking-tight">(=) VARIAÇÃO LÍQUIDA DE CAIXA NO PERÍODO</td>
                    <td className={cn(
                      "p-6 text-right tabular-nums text-lg",
                      fluxo.variacaoTotal >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {formatCurrency(fluxo.variacaoTotal)}
                    </td>
                  </tr>

                  {/* Saldo Final */}
                  <tr className="bg-primary shadow-2xl font-black text-primary-foreground relative z-10">
                    <td className="p-6 text-[11px] font-mono opacity-50">5</td>
                    <td className="p-6 text-lg uppercase tracking-tight">(=) SALDO FINAL DE CAIXA E EQUIVALENTES</td>
                    <td className="p-6 text-right tabular-nums text-xl drop-shadow-md">{formatCurrency(fluxo.saldoFinal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="p-2 rounded-lg bg-white/5">
              <Coins className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Conformidade Técnica:</strong> Este relatório segue rigorosamente o método direto de apuração, segregando atividades operacionais, de investimento e financiamento para máxima transparência.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
