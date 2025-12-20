import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export interface MetaFinanceira {
  id: string;
  tipo: 'receita' | 'despesa' | 'inadimplencia' | 'economia';
  titulo: string;
  valor_meta: number;
  mes: number;
  ano: number;
  ativo: boolean;
}

export function useMetasFinanceiras(mes?: number, ano?: number) {
  const queryClient = useQueryClient();
  const mesAtual = mes || new Date().getMonth() + 1;
  const anoAtual = ano || new Date().getFullYear();

  const { data: metas, isLoading } = useQuery({
    queryKey: ['metas-financeiras', mesAtual, anoAtual],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .eq('ativo', true);

      if (error) throw error;
      return data as MetaFinanceira[];
    },
  });

  const upsertMeta = useMutation({
    mutationFn: async (meta: Partial<MetaFinanceira> & { tipo: string; valor_meta: number }) => {
      const { data: existing } = await supabase
        .from('metas_financeiras')
        .select('id')
        .eq('tipo', meta.tipo)
        .eq('mes', meta.mes || mesAtual)
        .eq('ano', meta.ano || anoAtual)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('metas_financeiras')
          .update({
            valor_meta: meta.valor_meta,
            titulo: meta.titulo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('metas_financeiras')
          .insert({
            tipo: meta.tipo,
            titulo: meta.titulo || getTituloDefault(meta.tipo),
            valor_meta: meta.valor_meta,
            mes: meta.mes || mesAtual,
            ano: meta.ano || anoAtual,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metas-financeiras'] });
      toast({
        title: 'Meta atualizada',
        description: 'A meta financeira foi salva com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar meta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getMetaByTipo = (tipo: string): number => {
    const meta = metas?.find(m => m.tipo === tipo);
    if (meta) return meta.valor_meta;
    
    // Default values
    switch (tipo) {
      case 'receita': return 150000;
      case 'despesa': return 100000;
      case 'inadimplencia': return 5;
      default: return 0;
    }
  };

  return {
    metas,
    isLoading,
    upsertMeta,
    getMetaByTipo,
    mesAtual,
    anoAtual,
  };
}

function getTituloDefault(tipo: string): string {
  switch (tipo) {
    case 'receita': return 'Meta de Receitas';
    case 'despesa': return 'Limite de Despesas';
    case 'inadimplencia': return 'Inadimplência Máxima';
    case 'economia': return 'Meta de Economia';
    default: return 'Meta';
  }
}
