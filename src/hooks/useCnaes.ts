import { useQuery } from '@tanstack/react-query';
import {
  buscarCnaes,
  normalizarCodigoCnae,
  type CnaeCatalogo,
} from '@/lib/tributario/catalogos/repositorio';

/**
 * Catálogo de CNAEs (somente leitura).
 *
 * O catálogo é pequeno e muda com baixíssima frequência (parâmetros fiscais
 * revisados por norma, não por operação), então mantemos um `staleTime` longo
 * para evitar refetch a cada montagem de formulário.
 */
export function useCnaes() {
  return useQuery<CnaeCatalogo[]>({
    queryKey: ['catalogo', 'cnaes'],
    queryFn: buscarCnaes,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

/** Resultado da consulta de um código específico contra o catálogo. */
export interface ResolucaoCnae {
  /** Registro catalogado, quando encontrado. */
  registro: CnaeCatalogo | null;
  /** `true` quando o código está completo (7 dígitos) mas não existe no catálogo. */
  naoCatalogado: boolean;
  /** `true` enquanto o catálogo ainda está sendo carregado. */
  carregando: boolean;
}

/**
 * Resolve um código CNAE digitado contra o catálogo, tolerando qualquer
 * formatação de entrada (`3299099`, `32.99-0/99`, `3299-0/99`).
 *
 * Distingue deliberadamente três estados — encontrado, não catalogado e
 * incompleto — porque o formulário precisa avisar o usuário no segundo caso
 * em vez de degradar em silêncio para um fallback conservador.
 */
export function useResolucaoCnae(codigo: string | null | undefined): ResolucaoCnae {
  const { data, isLoading } = useCnaes();
  const alvo = normalizarCodigoCnae(codigo ?? '');

  if (isLoading) return { registro: null, naoCatalogado: false, carregando: true };
  if (alvo.length < 7) return { registro: null, naoCatalogado: false, carregando: false };

  const registro = (data ?? []).find((c) => c.codigoNumerico === alvo) ?? null;
  return { registro, naoCatalogado: registro === null, carregando: false };
}
