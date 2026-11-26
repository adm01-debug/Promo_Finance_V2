// Etapa 86: enquadramento tributario padrao por produto.
//
// Le todos os padroes de uma vez (o catalogo do Bling e paginado em 100 itens, a
// tabela e pequena) para a sugestao por NCM e a marcacao na lista saírem do mesmo
// snapshot, sem uma consulta por linha.
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  normalizarCodigo,
  normalizarNcm,
  validarPadrao,
  type PadraoProduto,
} from '@/lib/tributario/produtos/cclasstrib-padrao';

export const CHAVE_PADRAO_CCLASSTRIB = ['produto-cclasstrib-padrao'] as const;

export interface PadraoProdutoEntrada {
  produto_id: string;
  ncm?: string | null;
  cst: string;
  cclasstrib: string;
}

export function useProdutoCclasstribPadrao(habilitado = true) {
  const query = useQuery({
    queryKey: CHAVE_PADRAO_CCLASSTRIB,
    enabled: habilitado,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PadraoProduto[]> => {
      const { data, error } = await supabase
        .from('produto_cclasstrib_padrao')
        .select('produto_id, ncm, cst, cclasstrib, atualizado_em')
        .order('atualizado_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PadraoProduto[];
    },
  });

  const padroes = useMemo(() => query.data ?? [], [query.data]);
  const porProduto = useMemo(
    () => new Map(padroes.map((padrao) => [String(padrao.produto_id), padrao])),
    [padroes]
  );

  return { ...query, padroes, porProduto };
}

export function useProdutoCclasstribPadraoMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: CHAVE_PADRAO_CCLASSTRIB });

  const salvar = useMutation({
    mutationFn: async (entrada: PadraoProdutoEntrada) => {
      const erro = validarPadrao(entrada);
      if (erro) throw new Error(erro);
      const { error } = await supabase.from('produto_cclasstrib_padrao').upsert(
        {
          produto_id: String(entrada.produto_id),
          ncm: normalizarNcm(entrada.ncm),
          cst: normalizarCodigo(entrada.cst, 3),
          cclasstrib: normalizarCodigo(entrada.cclasstrib, 6),
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'produto_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enquadramento padrao do produto salvo');
      invalidar();
    },
    onError: (err: Error) => toast.error(`Nao foi possivel salvar: ${err.message}`),
  });

  const remover = useMutation({
    mutationFn: async (produtoId: string) => {
      const { error } = await supabase
        .from('produto_cclasstrib_padrao')
        .delete()
        .eq('produto_id', String(produtoId));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Enquadramento padrao removido');
      invalidar();
    },
    onError: (err: Error) => toast.error(`Nao foi possivel remover: ${err.message}`),
  });

  return { salvar, remover };
}
