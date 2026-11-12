import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { HeroKPICard, HeroKPIGrid } from './HeroKPICards';

interface DashboardExecutivoConteudoProps {
  metrics: {
    isLoading: boolean;
    empresas: {
      aliquota_rat: number | null;
      aliquota_terceiros: number | null;
      ativo: boolean;
      bairro: string | null;
      cep: string | null;
      cidade: string | null;
      cnae_principal: string | null;
      cnpj: string | null;
      codigo_fpas: string | null;
      cor_hex: string | null;
      created_at: string;
      email: string | null;
      endereco: string | null;
      estado: string | null;
      id: string;
      inscricao_estadual: string | null;
      is_padrao: boolean;
      logo_url: string | null;
      nome_fantasia: string | null;
      razao_social: string;
      regime_tributario: string | null;
      sigla: string | null;
      telefone: string | null;
      user_id: string;
    }[];
    centrosCusto: {
      ativo: boolean | null;
      codigo: string | null;
      created_at: string | null;
      descricao: string | null;
      empresa_id: string | null;
      id: string;
      nome: string;
      orcamento_previsto: number | null;
      orcamento_realizado: number | null;
      parent_id: string | null;
      responsavel: string | null;
      tipo: string | null;
      updated_at: string | null;
      user_id: string | null;
    }[];
    contasBancarias: import('@/hooks/financial/types').ContaBancariaComRegras[];
    contasBancariasFiltradas: import('@/hooks/financial/types').ContaBancariaComRegras[];
    contasPagarFiltradas: import('@/hooks/financial/views.types').ContasPagarPainelRow[];
    contasReceberFiltradas: import('@/hooks/financial/views.types').ContasReceberPainelRow[];
    clientes: import('@/hooks/useFinancialData').ExternalCliente[];
    aprovacoesPendentes: number;
    saldoTotal: number;
    receitasMes: number;
    despesasMes: number;
    totalReceber: number;
    totalPagar: number;
    totalVencidasReceber: number;
    totalVencidasPagar: number;
    inadimplencia: number;
    venceHojeReceber: import('@/hooks/financial/views.types').ContasReceberPainelRow[];
    venceHojePagar: import('@/hooks/financial/views.types').ContasPagarPainelRow[];
    vencidasReceber: import('@/hooks/financial/views.types').ContasReceberPainelRow[];
    vencidasPagar: import('@/hooks/financial/views.types').ContasPagarPainelRow[];
    statusContasPagar: { name: string; value: number; fill: string }[];
    dadosPorCentroCusto: { saldo: number; nome: string; pagar: number; receber: number }[];
    topClientesReceita: {
      posicao: number;
      adimplencia: number;
      id: string;
      nome: string;
      nomeFantasia: string | null;
      receita: number;
      pagos: number;
      pendentes: number;
      score: number | null;
    }[];
    fluxoCaixaProjetado: { data: string; receitas: number; despesas: number; saldo: number }[];
    totalDivergencias: number;
    boletosStats: {
      totalGerado: number;
      totalPago: number;
      totalVencido: number;
      totalPendente: number;
      countGerado: number;
      countEnviado: number;
      countPago: number;
      countVencido: number;
    };
    cobrancaKpis: import('@/hooks/useCobrancas').CobrancaKPIs;
  };
  inadimplenciaBadge: string;
  inadimplenciaBadgeVariant: 'destructive' | 'secondary';
}

export function DashboardExecutivoConteudo({
  metrics,
  inadimplenciaBadge,
  inadimplenciaBadgeVariant,
}: DashboardExecutivoConteudoProps) {
  return (
    <HeroKPIGrid layout="hero-first">
      <HeroKPICard
        title="Saldo Consolidado"
        value={metrics.saldoTotal}
        icon={Wallet}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        accentColor="hsl(221 100% 50%)"
        href="/contas-bancarias"
        size="hero"
        badge={`${metrics.contasBancariasFiltradas.length} contas ativas`}
        tooltip="Saldo total disponível em todas as contas conectadas"
      />
      <HeroKPICard
        title="Previsão de Recebimento"
        value={metrics.totalReceber}
        previousValue={metrics.totalReceber - metrics.receitasMes}
        icon={ArrowDownCircle}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        accentColor="hsl(150, 70%, 42%)"
        href="/contas-receber"
        size="primary"
        badge={
          metrics.receitasMes > 0 ? formatCurrency(metrics.receitasMes) + ' recebido' : undefined
        }
      />
      <HeroKPICard
        title="Compromissos a Pagar"
        value={metrics.totalPagar}
        previousValue={metrics.totalPagar - metrics.despesasMes}
        icon={ArrowUpCircle}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        accentColor="hsl(0, 78%, 55%)"
        href="/contas-pagar"
        size="primary"
        badge={metrics.despesasMes > 0 ? formatCurrency(metrics.despesasMes) + ' pago' : undefined}
      />
      <HeroKPICard
        title="Índice de Inadimplência"
        value={metrics.inadimplencia}
        icon={AlertTriangle}
        iconColor={
          metrics.inadimplencia > 10
            ? 'text-rose-600'
            : metrics.inadimplencia > 5
              ? 'text-amber-600'
              : 'text-emerald-600'
        }
        iconBg={
          metrics.inadimplencia > 10
            ? 'bg-rose-50'
            : metrics.inadimplencia > 5
              ? 'bg-amber-50'
              : 'bg-emerald-50'
        }
        accentColor={
          metrics.inadimplencia > 10
            ? 'hsl(0, 78%, 55%)'
            : metrics.inadimplencia > 5
              ? 'hsl(42, 95%, 48%)'
              : 'hsl(150, 70%, 42%)'
        }
        href="/cobrancas"
        size="primary"
        isPercentage
        isCurrency={false}
        badge={inadimplenciaBadge}
        badgeVariant={inadimplenciaBadgeVariant}
        riskLevel={
          metrics.inadimplencia > 15
            ? 'critical'
            : metrics.inadimplencia > 10
              ? 'high'
              : metrics.inadimplencia > 5
                ? 'medium'
                : 'none'
        }
      />
    </HeroKPIGrid>
  );
}
