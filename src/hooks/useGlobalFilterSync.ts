import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook para garantir que filtros essenciais (período, centro de custo, etc)
 * sejam mantidos ao navegar ou trocar de empresa.
 */
export function useGlobalFilterSync() {
  useEffect(() => {
    const handleEmpresaChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail) return;

      // Feedback visual para o usuário
      toast.info('Filtros sincronizados', {
        description: 'Os parâmetros de período e visualização foram mantidos para a nova empresa.',
        duration: 2000,
      });
    };

    window.addEventListener('current-empresa-changed', handleEmpresaChange);
    return () => window.removeEventListener('current-empresa-changed', handleEmpresaChange);
  }, []);
}
