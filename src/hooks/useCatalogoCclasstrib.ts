// Catalogo oficial de cClassTrib vigente, para escolha em tela (etapa 53).
//
// Best effort, como o resto da leitura de catalogo: sem resposta do banco a
// lista volta vazia e a tela avisa "catalogo indisponivel" ? nao inventa codigo.
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarCclasstribVigentes,
  type CclasstribCatalogo,
} from '@/lib/tributario/catalogos/cclasstrib';
import {
  carregarClassificacaoTributaria,
  proximoVencimentoMs,
  type DadosClassificacaoTributaria,
  type PacoteClassificacaoTributaria,
} from '@/lib/tributario/catalogos/classificacao-offline';
import type { FundamentosLegais } from '@/lib/tributario/catalogos/fundamentacao-legal';
import {
  buscarFundamentosLegais,
  fundamentosVazios,
} from '@/lib/tributario/catalogos/fundamentacao-legal';
import { hojeIso } from '@/lib/tributario/catalogos/repositorio';
import { lerConsulta, salvarConsulta } from '@/lib/offline/fiscal-cache';

export const CHAVE_CATALOGO_CCLASSTRIB = 'catalogo-cclasstrib-vigente';

/** Quanto tempo uma leitura boa do catalogo vale antes de nova consulta. */
const TTL_CATALOGO_MS = 30 * 60 * 1000;

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
    // Lista vazia significa "nao consegui carregar". Marcar isso como fresco
    // por 30 min deixaria a tela sem catalogo depois da reconexao, porque o
    // `refetchOnReconnect` so reconsulta consulta vencida.
    staleTime: (query) => ((query.state.data?.length ?? 0) > 0 ? TTL_CATALOGO_MS : 0),
    // O `refetchOnMount: false` global (queryClient.ts) faria a lista vazia
    // sobreviver a sair e voltar para a tela depois de reconectar: vencida, ela
    // precisa ser reconsultada na remontagem.
    refetchOnMount: true,
    // Sem rede o queryFn nem roda no modo padrao: a tela ficaria carregando
    // para sempre em vez de assumir "catalogo indisponivel".
    networkMode: 'offlineFirst',
  });

  // Leitura vazia significa "nao consegui carregar" e nao pode apagar um
  // catalogo que ja estava em memoria: reabrir a tela sem rede zeraria o
  // seletor de cClassTrib. A consulta continua vencida (staleTime 0 quando veio
  // vazia), entao a proxima montagem ou reconexao tenta de novo.
  const ultimaListaBoa = useRef<CclasstribCatalogo[]>([]);
  if (data.length > 0) ultimaListaBoa.current = data;
  const opcoes = data.length > 0 ? data : ultimaListaBoa.current;

  return {
    opcoes,
    codigos: new Set(opcoes.map((linha) => linha.cclasstrib)),
    carregando: isLoading,
    indisponivel: !isLoading && opcoes.length === 0,
  };
}

export const CHAVE_CLASSIFICACAO_TRIBUTARIA = 'cclasstrib-com-fundamentos';

/** Maior atraso aceito por `setTimeout` (2^31-1 ms, ~24 dias). */
const MAX_AGENDAMENTO_MS = 2 ** 31 - 1;

/** Identidade estavel para o render enquanto a consulta nao devolve nada. */
const FUNDAMENTOS_VAZIOS = fundamentosVazios(hojeIso());

/** O pacote veio da rede e tem codigo: leitura que vale o TTL do catalogo. */
function pacoteAtualizado(pacote?: DadosClassificacaoTributaria): boolean {
  return !!pacote && !pacote.offline && pacote.opcoes.length > 0;
}

export interface ClassificacaoTributaria {
  opcoes: CclasstribCatalogo[];
  fundamentos: FundamentosLegais;
  carregando: boolean;
  indisponivel: boolean;
  /** O dado veio do cache offline (IndexedDB) e pode estar defasado. */
  offline: boolean;
  /** Quando o dado offline foi gravado (epoch ms), para o selo "Offline". */
  offlineGravadoEm: number | null;
  /** Ultimo dia em que o pacote exibido vale (ISO `YYYY-MM-DD`). */
  vigenciaAte: string | null;
}

/**
 * cClassTrib vigentes + fundamento legal, com fallback offline (etapa 84).
 *
 * A leitura de catalogo e *best effort*: lista vazia significa "nao consegui
 * carregar", nunca "nao existe". Quem decide cache x indisponivel, e se pode
 * regravar o cache, e `carregarClassificacaoTributaria`.
 *
 * O pacote vence no primeiro dos dois tetos (TTL do cache e fim de vigencia do
 * catalogo ou da norma). Quando o vencimento chega com a aba aberta, a consulta
 * e invalidada na hora: sem isso a classificacao vencida continuaria na tela
 * ate o proximo reload.
 */
export function useClassificacaoTributaria(): ClassificacaoTributaria {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [CHAVE_CLASSIFICACAO_TRIBUTARIA],
    queryFn: () =>
      carregarClassificacaoTributaria({
        listarOpcoes: () => listarCclasstribVigentes(),
        buscarFundamentos: (codigos) => buscarFundamentosLegais(codigos),
        lerCache: () => lerConsulta<PacoteClassificacaoTributaria>(CHAVE_CLASSIFICACAO_TRIBUTARIA),
        salvarCache: (pacote, opcoes) =>
          salvarConsulta(CHAVE_CLASSIFICACAO_TRIBUTARIA, pacote, opcoes),
      }),
    // Cache offline ou lista vazia nao e leitura boa: fica vencido na hora para
    // a reconexao (`refetchOnReconnect`) buscar o catalogo de verdade.
    staleTime: (query) => (pacoteAtualizado(query.state.data) ? TTL_CATALOGO_MS : 0),
    // Idem: cache offline e lista vazia ficam vencidos, mas o
    // `refetchOnMount: false` global impediria a reconsulta ao reabrir a tela.
    refetchOnMount: true,
    // Sem rede o queryFn nao roda no modo padrao e o fallback do IndexedDB
    // nunca aconteceria (aba eternamente "carregando" no offline).
    networkMode: 'offlineFirst',
  });

  const gravadoEm = data?.gravadoEm ?? null;
  const vigenciaAte = data?.vigenciaAte ?? null;
  const ultimoVencimentoInvalidado = useRef<string | null>(null);

  useEffect(() => {
    const vencimento = proximoVencimentoMs({ gravadoEm, vigenciaAte });
    if (vencimento === null) return;
    const assinatura = `${gravadoEm ?? ''}|${vigenciaAte ?? ''}`;
    const invalidar = () => {
      ultimoVencimentoInvalidado.current = assinatura;
      void queryClient.invalidateQueries({ queryKey: [CHAVE_CLASSIFICACAO_TRIBUTARIA] });
    };
    if (vencimento <= Date.now()) {
      // Ja vencido: uma unica invalidacao por pacote, senao o efeito refaz a
      // consulta a cada render enquanto a resposta nao chega.
      if (ultimoVencimentoInvalidado.current !== assinatura) invalidar();
      return;
    }
    // `setTimeout` nao aceita mais que MAX_AGENDAMENTO_MS: acima disso o
    // temporizador acorda cedo e se reagenda, em vez de invalidar um pacote que
    // ainda vale (o efeito nao roda de novo porque o pacote nao mudou).
    let timer = setTimeout(
      function agendar() {
        const restante = vencimento - Date.now();
        if (restante <= 0) {
          invalidar();
          return;
        }
        timer = setTimeout(agendar, Math.min(restante, MAX_AGENDAMENTO_MS));
      },
      Math.min(vencimento - Date.now(), MAX_AGENDAMENTO_MS)
    );
    return () => clearTimeout(timer);
  }, [gravadoEm, vigenciaAte, queryClient]);

  return {
    opcoes: data?.opcoes ?? [],
    fundamentos: data?.fundamentos ?? FUNDAMENTOS_VAZIOS,
    carregando: isLoading,
    indisponivel: !isLoading && (data?.opcoes.length ?? 0) === 0,
    offline: data?.offline ?? false,
    offlineGravadoEm: gravadoEm,
    vigenciaAte,
  };
}
