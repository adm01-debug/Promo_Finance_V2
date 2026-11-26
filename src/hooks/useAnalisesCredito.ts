import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type StatusAnaliseCredito = 'pendente' | 'em_analise' | 'aprovado' | 'reprovado';
export type FiltroAnaliseCredito = StatusAnaliseCredito | 'todos';

export interface AlertaCredito {
  codigo: string;
  nivel: 'critico' | 'atencao' | 'info';
  mensagem: string;
}

export interface DadosCnpjaAnalise {
  razaoSocial?: string;
  situacaoCadastral?: string | null;
  dataAbertura?: string | null;
  capitalSocial?: number | null;
  porte?: string | null;
  regimeAtual?: string;
  endereco?: { cidade?: string; uf?: string } | null;
}

export interface AnaliseCredito {
  id: string;
  origem: string;
  referencia_externa: string;
  pedido_numero: string | null;
  valor_pedido: number | null;
  cliente_id: string | null;
  cliente_nome: string | null;
  cliente_empresa: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cnpj: string | null;
  vendedor_email: string | null;
  status: StatusAnaliseCredito;
  dados_cnpja: DadosCnpjaAnalise | null;
  dados_escavador: { resumo?: string; registrado_em?: string } | null;
  dados_consulta_financeira: { resumo?: string; registrado_em?: string } | null;
  alertas: AlertaCredito[];
  limite_aprovado: number | null;
  parcelas_max: number | null;
  parecer: string | null;
  decidido_em: string | null;
  callback_status: 'pendente' | 'enviado' | 'falhou' | 'nao_aplicavel';
  callback_erro: string | null;
  solicitado_em: string | null;
  created_at: string;
}

interface RespostaListar {
  analises?: AnaliseCredito[];
  error?: string;
}

interface RespostaMutacao {
  analise?: AnaliseCredito;
  callback?: { ok: boolean; erro?: string };
  error?: string;
}

async function chamar<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T & { error?: string }>('credito-analise', {
    body,
  });
  if (error) throw new Error(error.message);
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

export interface DecisaoCreditoInput {
  analiseId: string;
  decisao: 'aprovado' | 'reprovado';
  limiteAprovado?: number | null;
  parcelasMax?: number | null;
  parecer?: string | null;
}

export interface DadosCreditoInput {
  analiseId: string;
  cnpj?: string | null;
  escavador?: string | null;
  consultaFinanceira?: string | null;
}

export function useAnalisesCredito(filtro: FiltroAnaliseCredito = 'pendente') {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const chave = ['analises-credito', filtro];

  const query = useQuery({
    queryKey: chave,
    queryFn: async () => {
      const resposta = await chamar<RespostaListar>({ action: 'listar', status: filtro, limite: 200 });
      return resposta.analises ?? [];
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['analises-credito'] });

  const decidir = useMutation({
    mutationFn: (input: DecisaoCreditoInput) =>
      chamar<RespostaMutacao>({
        action: 'decidir',
        analise_id: input.analiseId,
        decisao: input.decisao,
        limite_aprovado: input.limiteAprovado ?? null,
        parcelas_max: input.parcelasMax ?? null,
        parecer: input.parecer ?? null,
      }),
    onSuccess: (resposta, input) => {
      invalidar();
      const rotulo = input.decisao === 'aprovado' ? 'aprovado' : 'reprovado';
      if (resposta.callback?.ok) {
        toast.success(`Crédito ${rotulo} e Champions avisado`);
      } else {
        toast.warning(`Crédito ${rotulo}, mas o Champions não recebeu: ${resposta.callback?.erro ?? 'erro'}`);
      }
    },
    onError: (err: Error) => toast.error(`Erro ao registrar decisão: ${err.message}`),
  });

  const atualizarDados = useMutation({
    mutationFn: (input: DadosCreditoInput) =>
      chamar<RespostaMutacao>({
        action: 'atualizar_dados',
        analise_id: input.analiseId,
        cnpj: input.cnpj ?? null,
        escavador: input.escavador ?? null,
        consulta_financeira: input.consultaFinanceira ?? null,
      }),
    onSuccess: () => {
      invalidar();
      toast.success('Dados da análise atualizados');
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar dados: ${err.message}`),
  });

  return {
    analises: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    decidir: decidir.mutate,
    isDecidindo: decidir.isPending,
    atualizarDados: atualizarDados.mutate,
    isAtualizando: atualizarDados.isPending,
  };
}
