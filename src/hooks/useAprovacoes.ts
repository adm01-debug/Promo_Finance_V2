import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { toastApprovalSuccess } from '@/lib/toast-confetti';
import { mustSucceed } from '@/lib/supabase-write';

export interface ConfiguracaoAprovacao {
  id: string;
  empresa_id: string | null;
  valor_minimo_aprovacao: number;
  aprovadores_obrigatorios: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoAprovacao {
  id: string;
  conta_pagar_id: string;
  solicitado_por: string;
  solicitado_em: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  aprovado_por: string | null;
  aprovado_em: string | null;
  motivo_rejeicao: string | null;
  observacoes: string | null;
  created_at: string;
  nivel_atual: number;
  total_niveis: number;
  assinaturas: unknown[];
  conta_pagar?: {
    id: string;
    descricao: string;
    valor: number;
    fornecedor_nome: string;
    data_vencimento: string;
    status: string;
  };
  solicitante?: {
    full_name: string | null;
    email: string;
  };
  aprovador?: {
    full_name: string | null;
    email: string;
  };
}

export interface FluxoNivel {
  id: string;
  empresa_id: string;
  ordem: number;
  nome: string;
  descricao: string;
  valor_minimo: number;
  aprovadores_obrigatorios: number;
}

export interface ComentarioAprovacao {
  id: string;
  solicitacao_id: string;
  user_id: string;
  comentario: string;
  created_at: string;
}

export const useConfiguracaoAprovacao = (empresaId?: string) => {
  return useQuery({
    queryKey: ['configuracao-aprovacao', empresaId ?? 'all'],
    queryFn: async () => {
      // `maybeSingle()` devolve erro quando o filtro casa mais de uma linha, e
      // producao tem 6 linhas com ativo=true na mesma empresa (tres faixas --
      // 5.000 / 50.000 / 999.999 -- semeadas duas vezes em 2026-07-28). O erro
      // caia no `throw` abaixo, a configuracao nunca carregava, e os tres
      // consumidores decidem por `!config?.ativo` -> requerAprovacao = false:
      // a alcada configurada pelo dono nunca era exigida de pagamento nenhum.
      // Escolha conservadora e deterministica: a MENOR faixa ativa, que e a que
      // mais protege. Escopo por empresa quando o chamador souber qual e.
      let q = supabase
        .from('configuracoes_aprovacao')
        .select('*')
        .eq('ativo', true)
        .order('valor_minimo_aprovacao', { ascending: true })
        .limit(1);
      if (empresaId) q = q.eq('empresa_id', empresaId);

      const { data, error } = await q;

      if (error) throw error;
      return (data?.[0] ?? null) as ConfiguracaoAprovacao | null;
    },
  });
};

/**
 * Configuracao que o PAINEL edita. Diferente da efetiva: nao descarta as faixas
 * inativas. Com a leitura efetiva, desativar o workflow zerava a lista de faixas
 * ativas, o painel ficava sem registro e `handleSave` saia no `if (!config)` --
 * nao havia como reativar pela tela, mesmo com as linhas intactas no banco.
 *
 * A ordem e `ativo` primeiro, depois valor: o painel tem que mostrar a MESMA
 * faixa que decide o pagamento. Ordenando so por valor, com a faixa de 50.000
 * inativa e a de 5.000 reativada em 100.000, o painel lia a de 50.000 (inativa)
 * e anunciava "Workflow desativado. Todos os pagamentos serao liberados
 * automaticamente" enquanto RegistrarPagamentoDialog lia a de 100.000 e seguia
 * exigindo aprovacao -- achado P2 do Codex na revisao da PR #400. `nullslast`
 * porque `ativo` e nullable (default true) e DESC traria NULL na frente.
 */
export const useConfiguracaoAprovacaoEditavel = (empresaId?: string) => {
  return useQuery({
    queryKey: ['configuracao-aprovacao-editavel', empresaId ?? 'all'],
    queryFn: async () => {
      let q = supabase
        .from('configuracoes_aprovacao')
        .select('*')
        .order('ativo', { ascending: false, nullsFirst: false })
        .order('valor_minimo_aprovacao', { ascending: true })
        .limit(1);
      if (empresaId) q = q.eq('empresa_id', empresaId);

      const { data, error } = await q;

      if (error) throw error;
      return (data?.[0] ?? null) as ConfiguracaoAprovacao | null;
    },
  });
};

export const useUpdateConfiguracaoAprovacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      config: Partial<ConfiguracaoAprovacao> & { id: string; valor_minimo_original?: number }
    ) => {
      // UM unico update, na FAIXA editada (empresa + valor que o painel carregou).
      //
      // As rodadas anteriores desta PR tentaram cinco escopos diferentes e cada
      // um quebrava outro lado, porque o painel apresenta UM "Alcada Minima
      // Global" enquanto a tabela guarda tres faixas (5.000 / 50.000 / 999.999)
      // para a mesma empresa. Com tres faixas, nenhuma gravacao desta tela pode
      // estar certa:
      //   - so o id        -> a duplicata de mesmo valor segue a menor e o
      //                       limite salvo nao faz efeito;
      //   - a empresa toda -> apaga os patamares de 50.000 e 999.999;
      //   - a faixa + um
      //     segundo update
      //     para `ativo`   -> dois requests sem transacao: falhando o segundo, o
      //                       limite fica gravado, o erro aparece, e a nova
      //                       tentativa acusa conflito contra um valor que nao
      //                       existe mais.
      //
      // Entao em vez de adivinhar, a gravacao RECUSA o que nao pode virar o
      // limite efetivo, e diz qual faixa esta no caminho. Nao perde dado, nao
      // precisa de transacao, e nunca anuncia sucesso para algo sem efeito.
      const porFaixa = config.empresa_id != null && config.valor_minimo_original != null;

      if (porFaixa) {
        const { data: outras, error: erroOutras } = await supabase
          .from('configuracoes_aprovacao')
          .select('valor_minimo_aprovacao')
          .eq('empresa_id', config.empresa_id as string)
          .eq('ativo', true)
          .neq('valor_minimo_aprovacao', config.valor_minimo_original as number)
          .order('valor_minimo_aprovacao', { ascending: true })
          .limit(1);
        if (erroOutras) throw erroOutras;

        const menorOutra = outras?.[0]?.valor_minimo_aprovacao as number | undefined;
        const fmt = (v: number) =>
          v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        if (menorOutra != null) {
          // Desligar aqui nao desliga o workflow: a outra faixa ativa continua
          // exigindo aprovacao, e o card anuncia liberacao total.
          if (config.ativo === false) {
            throw new Error(
              `Existe outra faixa ativa em ${fmt(menorOutra)} para esta empresa. ` +
                'Desativar aqui nao desliga o workflow: pagamentos acima desse valor ' +
                'continuariam exigindo aprovacao. Remova a duplicidade de faixas antes.'
            );
          }
          // Subir o limite acima de outra faixa ativa nao muda o limite efetivo.
          if (config.valor_minimo_aprovacao != null && config.valor_minimo_aprovacao > menorOutra) {
            throw new Error(
              `Existe outra faixa ativa em ${fmt(menorOutra)}, menor que o valor ` +
                'informado. O limite efetivo continuaria sendo o dela, entao a ' +
                'alteracao nao teria efeito. Remova a duplicidade de faixas antes.'
            );
          }
        }
      }

      const patch = {
        valor_minimo_aprovacao: config.valor_minimo_aprovacao,
        aprovadores_obrigatorios: config.aprovadores_obrigatorios,
        ativo: config.ativo,
      };

      const base = supabase.from('configuracoes_aprovacao').update(patch);
      const { data, error } = porFaixa
        ? await base
            .eq('empresa_id', config.empresa_id as string)
            .eq('valor_minimo_aprovacao', config.valor_minimo_original as number)
            .select()
        : await base.eq('id', config.id).select();

      if (error) throw error;

      // `data: []` com `error: null` acontece quando o filtro nao casa linha
      // nenhuma: outro administrador mudou a faixa entre o carregamento e o
      // salvamento. Sem esta checagem, o toast anunciava sucesso e nada tinha
      // sido gravado.
      if (porFaixa && (!data || data.length === 0)) {
        throw new Error(
          'A faixa foi alterada por outra pessoa desde que esta tela carregou. ' +
            'Recarregue a configuracao e tente de novo.'
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracao-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['configuracao-aprovacao-editavel'] });
      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de aprovação foram salvas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useFluxosNiveis = () => {
  return useQuery({
    queryKey: ['fluxos-aprovacao-niveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fluxos_aprovacao_niveis')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as FluxoNivel[];
    },
  });
};

export const useUpdateFluxoNivel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (nivel: Partial<FluxoNivel> & { id: string }) => {
      const { data, error } = await supabase
        .from('fluxos_aprovacao_niveis')
        .update(nivel)
        .eq('id', nivel.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fluxos-aprovacao-niveis'] });
      toast({ title: 'Fluxo atualizado' });
    },
  });
};

export const useComentariosAprovacao = (solicitacaoId: string) => {
  return useQuery({
    queryKey: ['aprovacao-comentarios', solicitacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('aprovacao_comentarios')
        .select('*')
        .eq('solicitacao_id', solicitacaoId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as ComentarioAprovacao[];
    },
    enabled: !!solicitacaoId,
  });
};

export const useAdicionarComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ solicitacaoId, texto }: { solicitacaoId: string; texto: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('aprovacao_comentarios')
        // TODO(2026-08-14): usuario_id→user_id e texto→comentario (nomes canônicos em aprovacao_comentarios)
        .insert({
          solicitacao_id: solicitacaoId,
          user_id: userData.user.id,
          comentario: texto,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['aprovacao-comentarios', variables.solicitacaoId],
      });
    },
  });
};

export const useSolicitacoesAprovacao = () => {
  return useQuery({
    queryKey: ['solicitacoes-aprovacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select(
          `
          *,
          conta_pagar:contas_pagar(id, descricao, valor, fornecedor_nome, data_vencimento, status)
        `
        )
        .order('solicitado_em', { ascending: false });

      if (error) throw error;
      return data as unknown as SolicitacaoAprovacao[];
    },
  });
};

export const useSolicitacoesPendentes = () => {
  return useQuery({
    queryKey: ['solicitacoes-pendentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .select(
          `
          *,
          conta_pagar:contas_pagar(id, descricao, valor, fornecedor_nome, data_vencimento, status)
        `
        )
        .eq('status', 'pendente')
        .order('solicitado_em', { ascending: true });

      if (error) throw error;
      return data as unknown as SolicitacaoAprovacao[];
    },
  });
};

export const useCriarSolicitacaoAprovacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      contaPagarId,
      observacoes,
    }: {
      contaPagarId: string;
      observacoes?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .insert({
          conta_pagar_id: contaPagarId,
          solicitado_por: userData.user.id,
          observacoes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      toast({
        title: 'Solicitação enviada',
        description: 'O pagamento foi enviado para aprovação.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao solicitar aprovação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useAprovarSolicitacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      // Antes eram dois UPDATEs em requisições separadas, nesta ordem:
      // encerrava a solicitação e só então gravava o aprovador na conta. Uma
      // falha no segundo passo deixava a solicitação aprovada e a conta sem
      // aprovador — e, como já não estava pendente, não havia o que
      // reprocessar pela tela. Pior: `conta_pagar_id` nulo fazia
      // `.eq('id', null)` devolver `error: null` sem tocar em linha alguma,
      // e a aprovação era celebrada com confete sobre nada.
      //
      // A função faz as duas gravações na mesma transação, verifica o
      // ROW_COUNT de cada uma e trava a solicitação com `FOR UPDATE`, o que
      // serializa dois aprovadores clicando ao mesmo tempo. É SECURITY
      // INVOKER: o RLS continua decidindo o que cada usuário alcança.
      return await mustSucceed(
        supabase.rpc('aprovar_solicitacao_pagamento', { p_solicitacao_id: solicitacaoId }),
        'aprovar a solicitação de pagamento'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['contas-pagar'] });
      // Use confetti toast for approval success
      toastApprovalSuccess('O pagamento foi aprovado e liberado para execução.');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useRejeitarSolicitacao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ solicitacaoId, motivo }: { solicitacaoId: string; motivo: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('solicitacoes_aprovacao')
        .update({
          status: 'rejeitado',
          aprovado_por: userData.user.id,
          aprovado_em: new Date().toISOString(),
          motivo_rejeicao: motivo,
        })
        .eq('id', solicitacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-aprovacao'] });
      queryClient.invalidateQueries({ queryKey: ['solicitacoes-pendentes'] });
      toast({
        title: 'Pagamento rejeitado',
        description: 'O pagamento foi rejeitado.',
        variant: 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

export const useVerificarAprovacaoNecessaria = () => {
  const { data: config } = useConfiguracaoAprovacao();

  return (valor: number): boolean => {
    if (!config || !config.ativo) return false;
    return valor >= config.valor_minimo_aprovacao;
  };
};
