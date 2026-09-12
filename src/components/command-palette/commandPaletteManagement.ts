import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Bell,
  Building2,
  CheckCircle,
  Download,
  Key,
  Moon,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  Sun,
  Target,
  UserCog,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { navegarParaNovoRegistro } from '@/lib/navigation-intent';
import type { PaletteCommandGroup, PaletteCommandItem } from './commandPalette.types';

type SetTheme = (theme: 'light' | 'dark') => void;
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

export function buildManagementCommandGroups(
  navigate: NavigateFunction,
  setTheme: SetTheme
): PaletteCommandGroup[] {
  return [
    {
      heading: 'Cadastros & CRM',
      items: [
        route(navigate, 'clientes', 'Clientes', Users, '/clientes', {
          subtitle: 'Base de clientes & WhatsApp',
          keywords: ['cliente', 'cadastro'],
          shortcut: ['⌥', 'C'],
        }),
        route(navigate, 'scoring', 'Scoring & Risco', Target, '/clientes#scoring', {
          subtitle: 'Análise de crédito neural',
          keywords: ['scoring', 'risco', 'credito'],
          badge: 'IA',
        }),
        route(navigate, 'portal-tokens', 'Portal de Tokens', Key, '/clientes/portal-tokens', {
          subtitle: 'Gestão de acesso cliente',
          keywords: ['portal', 'token', 'acesso'],
        }),
        route(navigate, 'fornecedores', 'Fornecedores', Building2, '/fornecedores', {
          subtitle: 'Parceiros comerciais',
          keywords: ['fornecedor', 'parceiro'],
          shortcut: ['⌥', 'U'],
        }),
        route(navigate, 'vendedores', 'Vendedores', UserCog, '/vendedores', {
          subtitle: 'Equipe comercial',
          keywords: ['vendedor', 'comercial'],
        }),
        route(navigate, 'empresas', 'Empresas', Building2, '/empresas', {
          subtitle: 'CNPJs cadastrados',
          keywords: ['empresa', 'cnpj'],
        }),
        route(navigate, 'centros', 'Centros de Custo', Target, '/centro-custos', {
          subtitle: 'Categorização financeira',
          keywords: ['centro', 'custo', 'categoria'],
        }),
      ],
    },
    {
      heading: 'Compliance & Administração',
      items: [
        route(navigate, 'aprovacoes', 'Workflow de Aprovações', CheckCircle, '/aprovacoes', {
          subtitle: 'Controle de alçadas',
          keywords: ['aprovacao', 'workflow'],
          shortcut: ['⌥', 'O'],
        }),
        route(navigate, 'audit', 'Logs de Auditoria', Shield, '/audit-logs', {
          subtitle: 'Histórico de ações (Trail)',
          keywords: ['auditoria', 'log', 'historico'],
        }),
        route(navigate, 'seguranca', 'Segurança & MFA', Shield, '/seguranca', {
          subtitle: 'Proteção de conta',
          keywords: ['seguranca', 'senha', 'mfa'],
        }),
        route(navigate, 'privacidade', 'Privacidade & LGPD', Shield, '/configuracoes/privacidade', {
          subtitle: 'Direitos do titular',
          keywords: ['lgpd', 'privacidade'],
        }),
      ],
    },
    {
      heading: 'Ações Rápidas',
      items: [
        {
          id: 'nova-receita',
          title: 'Nova Conta a Receber',
          icon: Plus,
          action: () => {
            navigate('/contas-receber', { state: navegarParaNovoRegistro() });
          },
          keywords: ['nova', 'receita', 'criar'],
          shortcut: ['⌘', '⇧', 'R'],
        },
        {
          id: 'nova-despesa',
          title: 'Nova Conta a Pagar',
          icon: Plus,
          action: () => {
            navigate('/contas-pagar', { state: navegarParaNovoRegistro() });
          },
          keywords: ['nova', 'despesa', 'criar'],
          shortcut: ['⌘', '⇧', 'P'],
        },
        {
          id: 'exportar',
          title: 'Exportar Dados',
          icon: Download,
          action: () => {
            const button = document.querySelector<HTMLButtonElement>('[data-export]');
            if (button) button.click();
            else toast.info('Navegue até a página desejada para exportar');
          },
          keywords: ['exportar', 'download', 'excel', 'pdf'],
          shortcut: ['⌘', '⇧', 'E'],
        },
        {
          id: 'atualizar',
          title: 'Atualizar Dados',
          icon: RefreshCw,
          action: () => {
            window.dispatchEvent(new CustomEvent('refresh-data'));
            toast.success('Atualização solicitada');
          },
          keywords: ['atualizar', 'refresh', 'sync'],
          shortcut: ['⌘', '⇧', 'R'],
        },
      ],
    },
    {
      heading: 'Preferências',
      items: [
        {
          id: 'theme-light',
          title: 'Tema Claro',
          icon: Sun,
          action: () => setTheme('light'),
          keywords: ['tema', 'claro', 'light'],
        },
        {
          id: 'theme-dark',
          title: 'Tema Escuro',
          icon: Moon,
          action: () => setTheme('dark'),
          keywords: ['tema', 'escuro', 'dark'],
        },
        route(navigate, 'alertas', 'Alertas', Bell, '/alertas', {
          subtitle: 'Notificações do sistema',
          keywords: ['alerta', 'notificacao'],
          shortcut: ['⌥', 'A'],
        }),
        route(navigate, 'config', 'Configurações', Settings, '/configuracoes', {
          subtitle: 'Preferências do sistema',
          keywords: ['configuracao', 'settings', 'preferencias'],
        }),
      ],
    },
  ];
}
