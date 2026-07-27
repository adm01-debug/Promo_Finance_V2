// Hook de leitura dos catálogos fiscais versionados no banco.
import { useQuery } from '@tanstack/react-query';
import {
  buscarAliquotasInterestaduais,
  buscarFaixasSimples,
  buscarUfs,
} from '@/lib/tributario/catalogos/repositorio';
import {
  resumirPainelCatalogos,
  type ResumoPainelCatalogos,
} from '@/lib/tributario/catalogos/painel';

export function useCatalogosFiscais() {
  return useQuery<ResumoPainelCatalogos>({
    queryKey: ['catalogos-fiscais', 'painel'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [ufs, interestaduais, faixas] = await Promise.all([
        buscarUfs(),
        buscarAliquotasInterestaduais(),
        buscarFaixasSimples(),
      ]);
      return resumirPainelCatalogos({ ufs, interestaduais, faixas });
    },
  });
}
