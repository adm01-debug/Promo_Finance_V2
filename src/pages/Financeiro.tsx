import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  BarChart3,
  Calculator,
  ShieldAlert,
  Target,
  ShoppingCart,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useContasPagar } from '@/hooks/financial/useContasPagar';
import { useContasReceber } from '@/hooks/financial/useContasReceber';
import { useBoletos } from '@/hooks/useBoletos';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const;

const quickLinks = [
  { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar', tone: 'text-destructive' },
  { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber', tone: 'text-success' },
  { label: 'Movimentações', icon: Wallet, href: '/movimentacoes', tone: 'text-primary' },
  { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa', tone: 'text-info' },
  { label: 'Gestão de Cobrança', icon: Receipt, href: '/cobrancas', tone: 'text-warning' },
  { label: 'Tesouraria Multi-CNPJ', icon: Wallet, href: '/tesouraria', tone: 'text-info' },
  { label: 'Simulador Antecipação', icon: Calculator, href: '/simulador-antecipacao', tone: 'text-primary' },
  { label: 'Auditoria Duplicidade', icon: ShieldAlert, href: '/contas-pagar/bloqueios', tone: 'text-destructive' },
  { label: 'Metas Financeiras', icon: Target, href: '/metas', tone: 'text-success' },
  { label: 'Gestão de Compras', icon: ShoppingCart, href: '/compras', tone: 'text-primary' },
];

export default function Financeiro() {
  const { data: contasPagar, isLoading: loadingPagar } = useContasPagar();
  const { data: contasReceber, isLoading: loadingReceber } = useContasReceber();
  const { stats: boletosStats, isLoading: loadingBoletos } = useBoletos();

  const kpis = useMemo(() => {
    const toPay = (contasPagar ?? [])
      .filter((c) => c.status === 'pendente' || c.status === 'atrasado' || c.status === 'vencido')
      .reduce((acc, c) => acc + (c.valor ?? 0), 0);

    const paidThisMonth = (contasPagar ?? [])
      .filter((c) => c.status === 'pago' && c.data_pagamento?.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((acc, c) => acc + (c.valor_pago ?? c.valor ?? 0), 0);

    const toReceive = (contasReceber ?? [])
      .filter((c) => c.status === 'pendente' || c.status === 'atrasado' || c.status === 'vencido')
      .reduce((acc, c) => acc + (c.valor ?? 0), 0);

    const receivedThisMonth = (contasReceber ?? [])
      .filter((c) => c.status === 'recebido' && c.data_recebimento?.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((acc, c) => acc + (c.valor_recebido ?? c.valor ?? 0), 0);

    return {
      toPay,
      paidThisMonth,
      toReceive,
      receivedThisMonth,
      saldoMes: receivedThisMonth - paidThisMonth,
    };
  }, [contasPagar, contasReceber]);

  const topVencidosPagar = useMemo(() => {
    return (contasPagar ?? [])
      .filter((c) => (c.status === 'atrasado' || c.status === 'vencido') && c.data_vencimento)
      .sort((a, b) => (a.data_vencimento ?? '').localeCompare(b.data_vencimento ?? ''))
      .slice(0, 5);
  }, [contasPagar]);

  const topVencidosReceber = useMemo(() => {
    return (contasReceber ?? [])
      .filter((c) => (c.status === 'atrasado' || c.status === 'vencido') && c.data_vencimento)
      .sort((a, b) => (a.data_vencimento ?? '').localeCompare(b.data_vencimento ?? ''))
      .slice(0, 5);
  }, [contasReceber]);

  const isLoading = loadingPagar || loadingReceber || loadingBoletos;

  return (
    <MainLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-display-md text-foreground">Visão Geral Financeira</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Indicadores consolidados de contas a pagar, receber e boletos emitidos.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            Atualizado agora
          </Badge>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="A Pagar (em aberto)"
            value={kpis.toPay}
            icon={ArrowUpCircle}
            tone="destructive"
            loading={isLoading}
          />
          <KpiCard
            label="Pago no mês"
            value={kpis.paidThisMonth}
            icon={CheckCircle2}
            tone="muted"
            loading={isLoading}
          />
          <KpiCard
            label="A Receber (em aberto)"
            value={kpis.toReceive}
            icon={ArrowDownCircle}
            tone="success"
            loading={isLoading}
          />
          <KpiCard
            label="Recebido no mês"
            value={kpis.receivedThisMonth}
            icon={TrendingUp}
            tone="success"
            loading={isLoading}
          />
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
                Saldo do mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {kpis.saldoMes >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-destructive" />
                )}
                <div>
                  <div
                    className={`text-3xl font-bold tabular-nums ${kpis.saldoMes >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatCurrency(kpis.saldoMes)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recebido − Pago no mês corrente
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Boletos em aberto</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(boletosStats?.totalPendente ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Boletos pagos</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(boletosStats?.totalPago ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Boletos vencidos</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(boletosStats?.totalVencido ?? 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-destructive" />
                Top 5 A pagar vencidos
              </CardTitle>
              <CardDescription>Mais antigos em atraso</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableShimmerSkeleton rows={5} columns={2} />
              ) : topVencidosPagar.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma conta a pagar vencida.
                </p>
              ) : (
                <ul className="space-y-2">
                  {topVencidosPagar.map((c) => (
                    <li
                      key={c.id ?? `${c.descricao}-${c.data_vencimento}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.descricao ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.fornecedor_nome_display ?? c.fornecedor_nome ?? 'Fornecedor'} •{' '}
                          {formatDate(c.data_vencimento)}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-destructive whitespace-nowrap">
                        {formatCurrency(c.valor ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-success" />
                Top 5 A receber vencidos
              </CardTitle>
              <CardDescription>Mais antigos em atraso</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableShimmerSkeleton rows={5} columns={2} />
              ) : topVencidosReceber.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhuma conta a receber vencida.
                </p>
              ) : (
                <ul className="space-y-2">
                  {topVencidosReceber.map((c) => (
                    <li
                      key={c.id ?? `${c.descricao}-${c.data_vencimento}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{c.descricao ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.cliente_nome_display ?? c.cliente_razao_social ?? 'Cliente'} •{' '}
                          {formatDate(c.data_vencimento)}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-success whitespace-nowrap">
                        {formatCurrency(c.valor ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atalhos do módulo financeiro</CardTitle>
              <CardDescription>Acesso rápido às áreas operacionais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {quickLinks.map((q) => {
                  const Icon = q.icon;
                  return (
                    <Button
                      key={q.href}
                      asChild
                      variant="outline"
                      className="h-auto py-4 flex-col items-start gap-2 justify-start text-left"
                    >
                      <Link to={q.href}>
                        <Icon className={`h-5 w-5 ${q.tone}`} />
                        <span className="text-sm font-medium leading-tight">{q.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'destructive' | 'success' | 'muted';
  loading: boolean;
}) {
  const toneClass =
    tone === 'destructive'
      ? 'bg-destructive/10 text-destructive'
      : tone === 'success'
      ? 'bg-success/10 text-success'
      : 'bg-muted text-muted-foreground';
  return (
    <Card className="stat-card h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="text-2xl font-black font-display mt-1 tabular-nums tracking-tighter">
              {loading ? '—' : formatCurrency(value)}
            </p>
          </div>
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${toneClass}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
