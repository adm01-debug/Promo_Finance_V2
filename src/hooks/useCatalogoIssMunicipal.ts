// Catálogo municipal de ISS: carrega, valida e injeta a tabela efetiva no motor.
import { useQuery } from '@tanstack/react-query';
import { buscarAliquotasIssMunicipais } from '@/lib/tributario/catalogos/repositorio';
import {
  aplicarOverlayIss,
  definirTabelaIssEfetiva,
  type ResultadoOverlayIss,
} from '@/lib/tributario/ipi-iss/overlay-iss';

export function useCatalogoIssMunicipal() {
  return useQuery<ResultadoOverlayIss>({
    queryKey: ['catalogo-iss-municipal'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const registros = await buscarAliquotasIssMunicipais();
      // Só passam ao motor os registros dentro do piso/teto da LC 116/2003.
      const overlay = aplicarOverlayIss(registros);
      definirTabelaIssEfetiva(overlay.tabela);
      return overlay;
    },
  });
}
