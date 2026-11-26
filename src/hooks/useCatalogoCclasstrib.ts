// Catalogo oficial de cClassTrib vigente, para escolha em tela (etapa 53).
//
// Best effort, como o resto da leitura de catalogo: sem resposta do banco a
// lista volta vazia e a tela avisa "catalogo indisponivel" — nao inventa codigo.
import { useQuery } from '@tanstack/react-query';
import {
  horizonteVigencia,
  listarCclasstribVigentes,
  type CclasstribCatalogo,
} from '@/lib/tributario/catalogos/cclasstrib';
import {
  buscarFundamentosLegais,
  fundamentosVazios,
  type FundamentosLegais,
} from '@/lib/tributario/catalogos/fundamentacao-legal';
import { hojeIso } from '@/lib/tributario/catalogos/repositorio';
import { lerConsulta, salvarConsulta } from '@/lib/offline/fiscal-cache';

export const CHAVE_CATALOGO_CCLASSTRIB = 'catalogo-cclasstrib-vigente';

export interface CatalogoCclasstrib {
  opcoes: CclasstribCatalogo[];
  /** Codigos existentes no catalogo carregado (usado no default por NCM). */
  codigos: ReadonlySet<string>;
  carregando: boolean;
  indisponivel: boolean;
}

export function useCatalogoCclasstrib(): CatalogoCclasstrib {
  const { data = [], isLoading } = useQuery({
    queryKey: [CHAVE_CATALOGO_CCLASSTRIB],
    queryFn: () => listarCclasstribVigentes(),
    staleTime: 30 * 60 * 1000,
  });

  return {
    opcoes: data,
    codigos: new Set(data.map((linha) => linha.cclasstrib)),
    carregando: isLoading,
    indisponivel: !isLoading && data.length === 0,
  };
}

export const CHAVE_CLASSIFICACAO_TRIBUTARIA = 'cclasstrib-com-fundamentos';

interface ClassificacaoTributariaCache {
  opcoes: CclasstribCatalogo[];
  fundamentos: FundamentosLegais;
}

export interface ClassificacaoTributaria extends ClassificacaoTributariaCache {
  carregando: boolean;
  indisponivel: boolean;
  /** O dado veio do cache offline (IndexedDB) e pode estar defasado. */
  offline: boolean;
  /** Quando o dado offline foi gravado (epoch ms), para o selo "Offline". */
  offlineGravadoEm: number | null;
}

/**
 * cClassTrib vigentes + fundamento legal, com fallback offline (etapa 84).
 *
 * As leituras de catalogo sao *best effort* e devolvem lista vazia quando a
 * consulta falha, sem lancar. Por isso lista vazia aqui e tratada como "nao
 * consegui carregar": o cache entra antes de declarar o catalogo indisponivel.
 * A gravacao usa o menor `fim_vigencia` como teto, entao a entrada deixa de ser
 * servida assim que a vigencia encerra (etapa 85), mesmo dentro do TTL.
 */
export function useClassificacaoTributaria(): ClassificacaoTributaria {
  const vazio = () => fundamentosVazios(hojeIso());

  const { data, isLoading } = useQuery({
    queryKey: [CHAVE_CLASSIFICACAO_TRIBUTARIA],
    queryFn: async (): Promise<
      ClassificacaoTributariaCache & { offline: boolean; gravadoEm: number | null }
    > => {
      const opcoes = await listarCclasstribVigentes();

      if (opcoes.length === 0) {
        const cache = await lerConsulta<ClassificacaoTributariaCache>(
          CHAVE_CLASSIFICACAO_TRIBUTARIA
        );
        if (cache) return { ...cache.payload, offline: true, gravadoEm: cache.gravadoEm };
        return { opcoes, fundamentos: vazio(), offline: false, gravadoEm: null };
      }

      const fundamentos = await buscarFundamentosLegais(opcoes.map((o) => o.cclasstrib));
      void salvarConsulta(
        CHAVE_CLASSIFICACAO_TRIBUTARIA,
        { opcoes, fundamentos },
        { fimVigencia: horizonteVigencia(opcoes) }
      );
      return { opcoes, fundamentos, offline: false, gravadoEm: null };
    },
    staleTime: 30 * 60 * 1000,
  });

  return {
    opcoes: data?.opcoes ?? [],
    fundamentos: data?.fundamentos ?? vazio(),
    carregando: isLoading,
    indisponivel: !isLoading && (data?.opcoes.length ?? 0) === 0,
    offline: data?.offline ?? false,
    offlineGravadoEm: data?.gravadoEm ?? null,
  };
}
