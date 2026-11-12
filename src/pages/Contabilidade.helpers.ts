import {
  BookOpen,
  FileText,
  Calculator,
  BookText,
  BookOpenCheck,
  BarChart3,
  ShieldCheck,
  Gauge,
} from 'lucide-react';
import type { HomeCard } from './Contabilidade.types';

export const VALID_TABS = [
  'inicio',
  'plano',
  'lancamentos',
  'razao',
  'balancete',
  'indices',
  'dre',
  'auto',
  'elisao',
  'integracoes',
  'auditoria',
  'ecd',
  'ecf',
] as const;

export const ANO_DEFAULT = new Date().getFullYear() - 1;

export const HOME_CARDS: HomeCard[] = [
  {
    id: 'plano',
    label: 'Plano de Contas',
    description: 'Estruture e mantenha o plano referencial CFC.',
    icon: BookOpen,
    accent: 'text-primary',
  },
  {
    id: 'lancamentos',
    label: 'Lançamentos',
    description: 'Registre partidas dobradas no diário contábil.',
    icon: Calculator,
    accent: 'text-primary',
  },
  {
    id: 'razao',
    label: 'Razão & Diário',
    description: 'Consulte movimentação por conta e por data.',
    icon: BookText,
    accent: 'text-primary',
  },
  {
    id: 'balancete',
    label: 'Balancete',
    description: 'Saldo anterior, movimento e saldo final por conta.',
    icon: BookOpenCheck,
    accent: 'text-primary',
  },
  {
    id: 'indices',
    label: 'Índices',
    description: 'Liquidez, endividamento, rentabilidade, prazos e estrutura.',
    icon: Gauge,
    accent: 'text-success',
  },
  {
    id: 'dre',
    label: 'DRE & Balanço',
    description: 'Demonstrações apuradas pela escrituração contábil.',
    icon: BarChart3,
    accent: 'text-success',
  },

  {
    id: 'ecd',
    label: 'SPED ECD',
    description: 'Geração e validação da Escrituração Contábil Digital.',
    icon: FileText,
    accent: 'text-warning',
  },
  {
    id: 'ecf',
    label: 'SPED ECF',
    description: 'Escrituração Contábil Fiscal — depende da ECD do ano.',
    icon: FileText,
    accent: 'text-warning',
  },
  {
    id: 'elisao',
    label: 'Elisão Fiscal',
    description: 'Simulação de regimes e redução estratégica de carga tributária.',
    icon: ShieldCheck,
    accent: 'text-emerald-500',
  },
];
