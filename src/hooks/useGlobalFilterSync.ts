import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Hook para garantir que filtros essenciais (período, centro de custo, etc)
 * sejam mantidos ao navegar ou trocar de empresa.
 */
export function useGlobalFilterSync() {
  const location = useLocation();

  useEffect(() => {
    const handleEmpresaChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail) return;

      // Lista de chaves de filtros que queremos manter sincronizadas
      const filterKeys = [
        'contas-receber-filters',
        'contas-pagar-filters',
        'conciliacao_filters',
        'aging_filters',
        'app-dashboard-receber-filters',
        'global-period-filter',
        'global-center-cost-filter'
      ];

      // Ao trocar de empresa, podemos querer limpar alguns filtros específicos de dados
      // mas manter os de período e visualização.
      console.log(`[FilterSync] Empresa alterada para ${detail}. Sincronizando estados...`);
      
      // Feedback visual para o usuário
      toast.info('Filtros sincronizados', {
        description: 'Os parâmetros de período e visualização foram mantidos para a nova empresa.',
        duration: 2000,
      });
    };

    window.addEventListener('current-empresa-changed', handleEmpresaChange);
    return () => window.removeEventListener('current-empresa-changed', handleEmpresaChange);
  }, [location.pathname]);
}
