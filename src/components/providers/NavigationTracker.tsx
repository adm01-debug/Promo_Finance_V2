import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useRecentItems } from '@/hooks/useRecentItems';

// Route label mapping
const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard-receber': 'Dashboard Receber',
  '/dashboard-empresa': 'Dashboard Empresa',
  '/bi': 'BI Analytics',
  '/contas-pagar': 'Contas a Pagar',
  '/contas-receber': 'Contas a Receber',
  '/notas-fiscais': 'Notas Fiscais',
  '/fluxo-caixa': 'Fluxo de Caixa',
  '/relatorios': 'Relatórios',
  '/expert': 'Expert IA',
  '/conciliacao': 'Conciliação',
  '/cobrancas': 'Cobranças',
  '/boletos': 'Boletos',
  '/clientes': 'Clientes',
  '/fornecedores': 'Fornecedores',
  '/empresas': 'Empresas',
  '/contas-bancarias': 'Contas Bancárias',
  '/centro-custos': 'Centros de Custo',
  '/aprovacoes': 'Aprovações',
  '/alertas': 'Alertas',
  '/configuracoes': 'Configurações',
  '/usuarios': 'Usuários',
  '/audit-logs': 'Logs de Auditoria',
  '/seguranca': 'Segurança',
  '/demonstrativos': 'Demonstrativos',
  '/pagamentos-recorrentes': 'Pagamentos Recorrentes',
  '/bitrix24': 'Bitrix24',
  '/reforma-tributaria': 'Reforma Tributária',
};

// Routes to exclude from tracking
const excludedRoutes = ['/auth', '/404'];

export function NavigationTracker() {
  const location = useLocation();
  const { addRecentItem } = useRecentItems();

  useEffect(() => {
    const path = location.pathname;
    
    // Don't track excluded routes
    if (excludedRoutes.includes(path)) return;
    
    // Get label for route
    const label = routeLabels[path];
    
    // Only track known routes
    if (label) {
      addRecentItem(path, label);
    }
  }, [location.pathname, addRecentItem]);

  // This component doesn't render anything
  return null;
}
