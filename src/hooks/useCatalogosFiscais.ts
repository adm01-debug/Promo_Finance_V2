// Hook de leitura dos catálogos fiscais versionados no banco.
import { useQuery } from '@tanstack/react-query';
import {
  buscarAliquotasInterestaduais,
  buscarAliquotasIssMunicipais,
  buscarFaixasSimples,
  buscarItensListaIss,
  buscarNcms,
  buscarUfs,
} from '@/lib/tributario/catalogos/repositorio';
import {
  aplicarOverlayIss,
  definirTabelaIssEfetiva,
  type ResultadoOverlayIss,
} from '@/lib/tributario/ipi-iss/overlay-iss';
import {
  resumirPainelCatalogos,
  type ResumoPainelCatalogos,
} from '@/lib/tributario/catalogos/painel';
import {
  gerarAlertasCatalogos,
  type ResumoAlertasCatalogos,
} from '@/lib/tributario/catalogos/alertas';

import {
  aplicarOverlayUfs,
  ufsAusentesNoBanco,
  type ResultadoOverlay,
} from '@/lib/tributario/icms/overlay';
import { definirTabelaUfsEfetiva } from '@/lib/tributario/icms/tabelas';
import {
  aplicarOverlayNcm,
  type ResultadoOverlayNcm,
} from '@/lib/tributario/ipi-iss/overlay-ncm';
import { definirTabelaTipiEfetiva } from '@/lib/tributario/ipi-iss/tabelas';
import {
  aplicarOverlayMonofasico,
  type ResultadoOverlayMonofasico,
} from '@/lib/tributario/monofasico/overlay-monofasico';
import { definirOverrideMonofasico } from '@/lib/tributario/monofasico/classificar';
import type { UF } from '@/lib/tributario/icms/types';

export interface CatalogosFiscaisData {
  painel: ResumoPainelCatalogos;
  overlay: ResultadoOverlay;
  /** UFs conhecidas pelo motor e ausentes no catálogo do banco. */
  ufsAusentes: UF[];
  /** Catálogo municipal de ISS validado contra a faixa legal da LC 116. */
  overlayIss: ResultadoOverlayIss;
  /** Catálogo de NCMs validado contra o teto de IPI e o formato de 8 dígitos. */
  overlayNcm: ResultadoOverlayNcm;
  /** Marcador monofásico do catálogo sobrepondo o classificador embarcado. */
  overlayMonofasico: ResultadoOverlayMonofasico;
  /** Alertas proativos de divergência, com item e campo divergentes. */
  alertas: ResumoAlertasCatalogos;
}


export function useCatalogosFiscais() {
  return useQuery<CatalogosFiscaisData>({
    queryKey: ['catalogos-fiscais', 'painel'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [ufs, interestaduais, faixas, issMunicipal, itensIss, ncms] = await Promise.all([
        buscarUfs(),
        buscarAliquotasInterestaduais(),
        buscarFaixasSimples(),
        buscarAliquotasIssMunicipais(),
        buscarItensListaIss(),
        buscarNcms(),
      ]);

      const registros = ufs.map((uf) => ({
        sigla: uf.sigla,
        aliquota_interna_padrao: uf.aliquota_interna_padrao,
        aliquota_fcp: uf.aliquota_fcp,
      }));

      const overlay = aplicarOverlayUfs(registros);
      // A tabela efetiva do motor passa a refletir o catálogo versionado.
      // Somente valores já validados pelo overlay chegam aqui.
      definirTabelaUfsEfetiva(overlay.tabela);

      // ISS: somente registros dentro do piso/teto da LC 116 chegam ao motor.
      const overlayIss = aplicarOverlayIss(issMunicipal);
      definirTabelaIssEfetiva(overlayIss.tabela);

      // IPI: o catálogo `ncms` sobrepõe a TIPI embarcada após validação de
      // formato (8 dígitos) e de teto (300%). Registros inválidos são
      // rejeitados e o motor segue com a alíquota canônica do código.
      const overlayNcm = aplicarOverlayNcm(ncms);
      definirTabelaTipiEfetiva(overlayNcm.tabela);

      // Monofásico: o marcador `monofasico_pis_cofins` do catálogo sobrepõe o
      // classificador embarcado (inclui ou exclui NCMs da tributação
      // concentrada). Alíquotas continuam vindo dos grupos legais do motor.
      const overlayMonofasico = aplicarOverlayMonofasico(ncms);
      definirOverrideMonofasico(overlayMonofasico.override);

      return {
        painel: resumirPainelCatalogos({ ufs, interestaduais, faixas, itensIss, ncms }),
        overlay,
        ufsAusentes: ufsAusentesNoBanco(registros),
        overlayIss,
        overlayNcm,
        overlayMonofasico,
      };
    },
  });
}
