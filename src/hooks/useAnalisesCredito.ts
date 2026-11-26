import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { EdgeFunctionError, invokeEdge } from '@/lib/edge-function-error';

const FUNCAO = 'credito-analise';

/** Códigos da edge function traduzidos para o que o analista precisa fazer. */
const MENSAGENS: Record<string, string> = {
  empresa_sem_acesso: 'Esta análise é de outra empresa — você não tem acesso a ela.',
  'Análise já decidida': 'Esta análise já foi decidida por outro usuário. Recarregue a fila.',
  'Análise foi decidida por outro analista':
    'Esta análise já foi decidida por outro usuário. Recarregue a fila.',
  callback_falhou: 'A decisão foi salva, mas o Champions não recebeu. Tente reenviar.',
};

function mensagemCredito(err: unknown): string {
  if (err instanceof EdgeFunctionError) {
    const codigo = err.body?.error;
    if (codigo && MENSAGENS[codigo]) return MENSAGENS[codigo];
    if (err.isAuthError || err.isForbidden) {
      return 'Você não tem permissão para analisar crédito (perfil admin ou financeiro da empresa).';
    }
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

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
  empresa_id: string | null;
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
  total?: number;
  error?: string;
}

interface RespostaMutacao {
  analise?: AnaliseCredito;
  callback?: { ok: boolean; erro?: string };
  error?: string;
}

function chamar<T>(body: Record<string, unknown>): Promise<T> {
  return invokeEdge<T>(FUNCAO, body);
}

export interface DecisaoCreditoInput {
  analiseId: string;
  decisao: 'aprovado' | 'reprovado';
  limiteAprovado?: number | null;
  parcelasMax?: number | null;
  parecer?: string | null;
}

/** Campo `undefined` = não tocado (omitido da requisição); `null` = apagado de propósito. */
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
      const resposta = await chamar<RespostaListar>({
        action: 'listar',
        status: filtro,
        limite: 200,
      });
      const analises = resposta.analises ?? [];
      return { analises, total: resposta.total ?? analises.length };
    },
    enabled: !!user,
    staleTime: 60 * 1000,
    // A fila recebe pedidos do Champions sem ação do analista: repuxa sozinha.
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
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
        toast.warning(
          `Crédito ${rotulo}, mas o Champions não recebeu: ${resposta.callback?.erro ?? 'erro'}`
        );
      }
    },
    onError: (err: Error) => toast.error(`Erro ao registrar decisão: ${mensagemCredito(err)}`),
  });

  const atualizarDados = useMutation({
    mutationFn: (input: DadosCreditoInput) =>
      chamar<RespostaMutacao>({
        action: 'atualizar_dados',
        analise_id: input.analiseId,
        cnpj: input.cnpj,
        escavador: input.escavador,
        consulta_financeira: input.consultaFinanceira,
      }),
    onSuccess: () => {
      invalidar();
      toast.success('Dados da análise atualizados');
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar dados: ${mensagemCredito(err)}`),
  });

  const reenviarCallback = useMutation({
    mutationFn: (analiseId: string) =>
      chamar<RespostaMutacao>({ action: 'reenviar_callback', analise_id: analiseId }),
    onSuccess: (resposta) => {
      invalidar();
      if (resposta.callback?.ok) toast.success('Champions avisado da decisão');
      else toast.warning(`Champions ainda não recebeu: ${resposta.callback?.erro ?? 'erro'}`);
    },
    onError: (err: Error) => toast.error(`Erro ao reenviar: ${mensagemCredito(err)}`),
  });

  return {
    analises: query.data?.analises ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    erroCarga: query.error ? mensagemCredito(query.error) : null,
    refetch: query.refetch,
    decidir: decidir.mutate,
    isDecidindo: decidir.isPending,
    atualizarDados: atualizarDados.mutate,
    isAtualizando: atualizarDados.isPending,
    reenviarCallback: reenviarCallback.mutate,
    isReenviando: reenviarCallback.isPending,
  };
}
