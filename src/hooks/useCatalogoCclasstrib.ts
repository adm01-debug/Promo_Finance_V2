// Catalogo oficial de cClassTrib vigente, para escolha em tela (etapa 53).
//
// Best effort, como o resto da leitura de catalogo: sem resposta do banco a
// lista volta vazia e a tela avisa "catalogo indisponivel" — nao inventa codigo.
import { useQuery } from '@tanstack/react-query';
import {
  listarCclasstribVigentes,
  type CclasstribCatalogo,
} from '@/lib/tributario/catalogos/cclasstrib';

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
