import type { NavigateFunction } from 'react-router-dom';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Brain,
  Calculator,
  CheckCircle,
  Clock,
  Download,
  FileBarChart,
  FileText,
  Home,
  Landmark,
  RefreshCw,
  Receipt,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaletteCommandGroup, PaletteCommandItem } from './commandPalette.types';

type ItemOptions = Omit<PaletteCommandItem, 'id' | 'title' | 'icon' | 'action'>;

function route(
  navigate: NavigateFunction,
  id: string,
  title: string,
  icon: LucideIcon,
  href: string,
  options: ItemOptions = {}
): PaletteCommandItem {
  return { id, title, icon, action: () => navigate(href), ...options };
}

export function buildNavigationCommandGroups(navigate: NavigateFunction): PaletteCommandGroup[] {
  return [
    {
      heading: 'Navegação Rápida',
      items: [
        route(navigate, 'home', 'Dashboard', Home, '/', {
          subtitle: 'Visão geral financeira',
          keywords: ['inicio', 'home', 'dashboard'],
          shortcut: ['⌥', 'D'],
        }),
        route(navigate, 'expert', 'Expert IA', Sparkles, '/expert', {
          subtitle: 'Assistente inteligente',
          keywords: ['ia', 'ai', 'expert', 'assistente'],
          shortcut: ['⌥', 'E'],
          badge: 'IA',
          badgeVariant: 'default',
        }),
        route(navigate, 'bi', 'BI & Analytics', BarChart3, '/bi', {
          subtitle: 'Dashboards avançados',
          keywords: ['bi', 'analytics', 'graficos'],
          shortcut: ['⌥', 'B'],
        }),
        route(navigate, 'inteligencia', 'Inteligência Operacional', Brain, '/inteligencia', {
          subtitle: 'Monitoramento neural & IA',
          keywords: ['ia', 'inteligencia', 'saude', 'score'],
          shortcut: ['⌥', 'I'],
          badge: 'Neural',
          badgeVariant: 'secondary',
        }),
        route(navigate, 'fluxo', 'Fluxo de Caixa', TrendingUp, '/fluxo-caixa', {
          subtitle: 'Projeções e cenários',
          keywords: ['fluxo', 'caixa', 'projecao'],
          shortcut: ['⌥', 'F'],
        }),
        route(navigate, 'metas', 'Metas Financeiras', Target, '/metas', {
          subtitle: 'Gestão de objetivos estrategicos',
          keywords: ['metas', 'objetivos', 'performance', 'ia', 'saude'],
        }),
        route(
          navigate,
          'alertas-preditivos',
          'Alertas Preditivos',
          Brain,
          '/inteligencia#alertas-preditivos',
          {
            subtitle: 'Gestão proativa de riscos',
            keywords: ['risco', 'alerta', 'preditivo', 'ia'],
          }
        ),
      ],
    },
    {
      heading: 'Financeiro',
      items: [
        route(navigate, 'receber', 'Contas a Receber', ArrowDownCircle, '/contas-receber', {
          subtitle: 'Receitas e cobranças',
          keywords: ['receber', 'receitas', 'cobrar'],
          shortcut: ['⌥', 'R'],
        }),
        route(navigate, 'pagar', 'Contas a Pagar', ArrowUpCircle, '/contas-pagar', {
          subtitle: 'Despesas e pagamentos',
          keywords: ['pagar', 'despesas'],
          shortcut: ['⌥', 'P'],
        }),
        route(navigate, 'conciliacao', 'Conciliação Bancária', CheckCircle, '/conciliacao', {
          subtitle: 'Conciliar extratos',
          keywords: ['conciliacao', 'extrato', 'banco'],
          shortcut: ['⌥', 'C'],
        }),
        route(
          navigate,
          'bloqueios',
          'Bloqueios por Duplicidade',
          Shield,
          '/contas-pagar/bloqueios',
          {
            subtitle: 'Auditoria anti-duplicidade',
            keywords: ['duplicidade', 'bloqueio', 'auditoria'],
            badge: '10/10',
          }
        ),
        route(navigate, 'boletos', 'Boletos', Receipt, '/boletos', {
          subtitle: 'Emitir e gerenciar',
          keywords: ['boleto', 'cobranca'],
        }),
        route(navigate, 'cobrancas', 'Cobranças', AlertTriangle, '/cobrancas', {
          subtitle: 'Inadimplência e régua',
          keywords: ['cobranca', 'inadimplencia'],
        }),
        route(navigate, 'bancos', 'Contas Bancárias', Landmark, '/contas-bancarias', {
          subtitle: 'Saldos e movimentações',
          keywords: ['banco', 'conta', 'saldo'],
        }),
        route(navigate, 'tesouraria', 'Tesouraria Multi-CNPJ', Landmark, '/tesouraria', {
          subtitle: 'Gestão de caixa centralizada',
          keywords: ['tesouraria', 'caixa', 'multi-cnpj'],
        }),
      ],
    },
    {
      heading: 'Reforma Tributária (IBS/CBS)',
      items: [
        route(navigate, 'reforma', 'Dashboard Reforma Tributária', Scale, '/reforma-tributaria', {
          subtitle: 'Visão geral da transição',
          keywords: ['tributario', 'ibs', 'cbs', 'reforma'],
          badge: 'Nova',
        }),
        route(
          navigate,
          'split-payment',
          'Split Payment (IBS/CBS)',
          RefreshCw,
          '/tributario/split-payment',
          {
            subtitle: 'Segregação de impostos real-time',
            keywords: ['split', 'payment', 'imposto', 'real-time'],
          }
        ),
        route(
          navigate,
          'conciliacao-trib',
          'Conciliação Tributária',
          CheckCircle,
          '/tributario/conciliacao',
          {
            subtitle: 'Divergências fiscais x contábil',
            keywords: ['conciliacao', 'fiscal', 'contabil'],
          }
        ),
        route(navigate, 'incentivos', 'Incentivos Fiscais', Sparkles, '/tributario/incentivos', {
          subtitle: 'Gestão de benefícios e isenções',
          keywords: ['incentivo', 'beneficio', 'isencao'],
        }),
        route(
          navigate,
          'auditoria-trib',
          'Auditoria & Compliance',
          Shield,
          '/tributario/auditoria',
          {
            subtitle: 'Verificação de conformidade fiscal',
            keywords: ['auditoria', 'compliance', 'fiscal'],
          }
        ),
        route(navigate, 'comparativo', 'Comparativo de Regimes', Scale, '/tributario/comparativo', {
          subtitle: 'Lucro Real vs Presumido vs IBS/CBS',
          keywords: ['comparativo', 'regime', 'lucro', 'real', 'presumido'],
        }),
        route(navigate, 'cashback', 'Cashback Simulador', RefreshCw, '/tributario/cashback', {
          subtitle: 'Cálculo de devolução de impostos',
          keywords: ['cashback', 'devolucao', 'imposto'],
        }),
        route(navigate, 'fechamento', 'Fechamento Mensal', Clock, '/tributario/fechamento-mensal', {
          subtitle: 'Workflow de encerramento fiscal',
          keywords: ['fechamento', 'mensal', 'fiscal', 'encerramento'],
        }),
      ],
    },
    {
      heading: 'Fiscal & Contábil',
      items: [
        route(navigate, 'nfe', 'Notas Fiscais', FileText, '/notas-fiscais', {
          subtitle: 'NF-e, NFS-e, CT-e',
          keywords: ['nota', 'fiscal', 'nfe'],
          shortcut: ['⌥', 'N'],
        }),
        route(navigate, 'import-xml', 'Importação XML', Download, '/tributario/importacao-xml', {
          subtitle: 'Carga em massa de documentos',
          keywords: ['xml', 'importacao', 'nota', 'fiscal'],
        }),
        route(navigate, 'sped', 'Exportação SPED', Download, '/tributario/sped', {
          subtitle: 'Geração de arquivos magnéticos',
          keywords: ['sped', 'fiscal', 'contabil', 'exportacao'],
        }),
        route(
          navigate,
          'relatorios-trib',
          'Relatórios Contábeis',
          FileBarChart,
          '/tributario/relatorios-contabeis',
          {
            subtitle: 'DRE, Balanço, Fluxo Tributário',
            keywords: ['relatorio', 'contabil', 'dre', 'balanco'],
          }
        ),
        route(navigate, 'per-dcomp', 'Per/Dcomp', Calculator, '/tributario/per-dcomp', {
          subtitle: 'Compensação de tributos federais',
          keywords: ['perdcomp', 'compensacao', 'tributo'],
        }),
        route(navigate, 'retencoes', 'Retenções na Fonte', Wallet, '/tributario/retencoes', {
          subtitle: 'Gestão de IRRF, CSLL, PIS, COFINS',
          keywords: ['retencao', 'fonte', 'irrf', 'csll'],
        }),
        route(navigate, 'contabilidade', 'Contabilidade & SPED', Calculator, '/contabilidade', {
          subtitle: 'Plano de contas e lançamentos',
          keywords: ['contabilidade', 'sped', 'ecd', 'ecf'],
        }),
      ],
    },
  ];
}
