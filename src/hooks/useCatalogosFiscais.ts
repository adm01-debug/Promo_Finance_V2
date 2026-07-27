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
import {
  aplicarOverlayUfs,
  ufsAusentesNoBanco,
  type ResultadoOverlay,
} from '@/lib/tributario/icms/overlay';
import type { UF } from '@/lib/tributario/icms/types';

export interface CatalogosFiscaisData {
  painel: ResumoPainelCatalogos;
  overlay: ResultadoOverlay;
  /** UFs conhecidas pelo motor e ausentes no catálogo do banco. */
  ufsAusentes: UF[];
}

export function useCatalogosFiscais() {
  return useQuery<CatalogosFiscaisData>({
    queryKey: ['catalogos-fiscais', 'painel'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [ufs, interestaduais, faixas] = await Promise.all([
        buscarUfs(),
        buscarAliquotasInterestaduais(),
        buscarFaixasSimples(),
      ]);

      const registros = ufs.map((uf) => ({
        sigla: uf.sigla,
        aliquota_interna_padrao: uf.aliquota_interna_padrao,
        aliquota_fcp: uf.aliquota_fcp,
      }));

      return {
        painel: resumirPainelCatalogos({ ufs, interestaduais, faixas }),
        overlay: aplicarOverlayUfs(registros),
        ufsAusentes: ufsAusentesNoBanco(registros),
      };
    },
  });
}
