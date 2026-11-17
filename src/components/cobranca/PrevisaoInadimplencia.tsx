import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Brain, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { paginarTudo } from '@/lib/paginar-postgrest';
import { format, differenceInDays, addDays } from 'date-fns';
import { PrevisaoKPIs } from './previsao/PrevisaoKPIs';
import { PrevisaoClientesList } from './previsao/PrevisaoClientesList';
import type { ClienteRisco } from './previsao/PrevisaoClienteCard';

interface AnaliseInadimplencia {
  clientes: ClienteRisco[];
  resumo: {
    totalEmRisco: number;
    clientesAltoRisco: number;
    clientesMedioRisco: number;
    clientesBaixoRisco: number;
    valorTotalRisco: number;
  };
  geradoEm: string;
}

interface ClienteData {
  score: number | null;
  limite_credito: number | null;
}

interface ContaData {
  valor: number;
  valor_recebido: number | null;
  status: string;
  data_vencimento: string;
}

interface HistoricoContaData {
  status: string;
  data_vencimento: string | null;
  data_recebimento: string | null;
}

interface ClienteMapCliente {
  score: number | null;
  limite_credito: number | null;
  ramo_atividade: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
}

/**
 * `clientes.score` esta na escala 0-1000: o unico produtor e
 * useScoringClientes.ts:144 (`recalcularScoreMutation`), que grava o resultado
 * de `Math.min(1000, ...)`. Este arquivo comparava com 50/70/85 -- limites de
 * uma escala 0-100 -- entao um cliente recalculado com 250 (critico para o
 * produtor) recebia ZERO ponto de risco, igual a um de 850.
 *
 * As faixas abaixo sao as mesmas do produtor (useScoringClientes.ts:372-373):
 * >= 700 baixo, >= 500 medio, >= 300 alto, < 300 critico.
 */
const SCORE_RISCO_ALTO = 300;
const SCORE_RISCO_MEDIO = 500;
const SCORE_RISCO_BAIXO = 700;

/** Titulo em atraso: vencido em aberto OU recebido depois do vencimento. */
function teveAtraso(c: HistoricoContaData): boolean {
  if (c.status === 'cancelado') return false;
  if (c.status === 'vencido') return true;
  if (c.data_recebimento && c.data_vencimento) {
    return c.data_recebimento > c.data_vencimento;
  }
  return false;
}

function calcularProbabilidadeAtraso(
  cliente: ClienteData,
  contasPendentes: ContaData[],
  historicoContas: HistoricoContaData[]
): number {
  let score = 0;
  // `null` e desconhecido, nao bom: nao pontua, e `gerarFatoresRisco` avisa que
  // o score nao foi calculado. Zero e valor real e cai na pior faixa.
  const scoreCliente = cliente.score;
  if (scoreCliente != null) {
    if (scoreCliente < SCORE_RISCO_ALTO) score += 30;
    else if (scoreCliente < SCORE_RISCO_MEDIO) score += 20;
    else if (scoreCliente < SCORE_RISCO_BAIXO) score += 10;
  }

  const contasVencidas = historicoContas.filter(teveAtraso);
  const taxaAtraso =
    historicoContas.length > 0 ? (contasVencidas.length / historicoContas.length) * 100 : 0;
  if (taxaAtraso > 30) score += 40;
  else if (taxaAtraso > 15) score += 25;
  else if (taxaAtraso > 5) score += 10;

  const totalPendente = contasPendentes.reduce(
    (sum, c) => sum + c.valor - (c.valor_recebido || 0),
    0
  );
  const limiteCredito = cliente.limite_credito || 10000;
  const utilizacao = (totalPendente / limiteCredito) * 100;
  if (utilizacao > 100) score += 20;
  else if (utilizacao > 80) score += 15;
  else if (utilizacao > 50) score += 5;

  const proximoVencimento = contasPendentes
    .map((c) => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (proximoVencimento) {
    const diasAteVencimento = differenceInDays(proximoVencimento, new Date());
    if (diasAteVencimento <= 3) score += 10;
    else if (diasAteVencimento <= 7) score += 5;
  }

  return Math.min(score, 100);
}

function determinarNivelRisco(probabilidade: number): 'alto' | 'medio' | 'baixo' {
  if (probabilidade >= 60) return 'alto';
  if (probabilidade >= 30) return 'medio';
  return 'baixo';
}

function gerarFatoresRisco(
  cliente: ClienteData,
  contasPendentes: ContaData[],
  historicoContas: HistoricoContaData[]
): string[] {
  const fatores: string[] = [];
  if (cliente.score == null) {
    fatores.push('Score não calculado para este cliente');
  } else if (cliente.score < SCORE_RISCO_BAIXO) {
    fatores.push(`Score baixo (${cliente.score} de 1000)`);
  }
  const contasVencidas = historicoContas.filter(teveAtraso);
  if (contasVencidas.length > 0) {
    fatores.push(`${contasVencidas.length} atraso(s) no histórico`);
  }
  const totalPendente = contasPendentes.reduce(
    (sum, c) => sum + c.valor - (c.valor_recebido || 0),
    0
  );
  if (totalPendente > (cliente.limite_credito || 10000)) {
    fatores.push('Limite de crédito excedido');
  }
  const proximoVencimento = contasPendentes
    .map((c) => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  if (proximoVencimento && differenceInDays(proximoVencimento, new Date()) <= 7) {
    fatores.push('Vencimento próximo');
  }
  // Sem fallback aqui: quem chama ainda acrescenta setor e cadastro, e aplicar
  // "nenhum fator" antes disso punha as duas coisas no mesmo cartao -- "Nenhum
  // fator de risco identificado" ao lado de "Setor de alto risco" (achado P2 do
  // Codex na PR #404). O fallback entra em `comFallback()`, no fim.
  return fatores;
}

function gerarAcaoSugerida(nivelRisco: 'alto' | 'medio' | 'baixo', fatores: string[]): string {
  if (nivelRisco === 'alto') {
    if (fatores.some((f) => f.includes('atraso'))) {
      return 'Entrar em contato imediatamente para negociação preventiva';
    }
    return 'Monitorar de perto e preparar régua de cobrança preventiva';
  }
  if (nivelRisco === 'medio') {
    return 'Enviar lembrete amigável antes do vencimento';
  }
  return 'Manter acompanhamento padrão';
}

function useAnaliseInadimplencia(empresaId?: string) {
  return useQuery({
    queryKey: ['analise-inadimplencia', empresaId ?? 'all'],
    queryFn: async (): Promise<AnaliseInadimplencia> => {
      const hoje = new Date();
      const em30Dias = addDays(hoje, 30);

      // Filtro funcional por empresa, alem do RLS: sem ele a tela somaria
      // clientes de todas as empresas acessiveis num unico ranking de risco.
      // AGENTS.md secao 4 pede isolamento por empresa_id, e o achado F17 da
      // auditoria de 2026-09-10 registra que "RLS pode restringir acesso, mas
      // nao substitui filtro funcional da empresa selecionada".
      let qPendentes = supabase
        .from('contas_receber')
        .select(
          `
          id, valor, valor_recebido, data_vencimento, status, cliente_id, cliente_nome,
          clientes(id, razao_social, nome_fantasia, score, limite_credito, ramo_atividade)
        `,
          { count: 'exact' }
        )
        .in('status', ['pendente', 'parcial'])
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(em30Dias, 'yyyy-MM-dd'))
        // `id` como desempate: paginacao por offset exige ordenacao UNICA. Com
        // varios titulos no mesmo vencimento, janelas diferentes podiam
        // devolver os empates em ordens diferentes -- titulo repetido numa
        // pagina e omitido na outra, sem a contagem perceber (achado do Devin e
        // P2 do Codex).
        .order('data_vencimento')
        .order('id');
      if (empresaId) qPendentes = qPendentes.eq('empresa_id', empresaId);

      // Erro de consulta NAO pode virar "nenhum cliente em risco": a tela
      // mostrava zeros como analise concluida (achado do Devin na PR #404).
      //
      // E nao basta um await: o PostgREST corta em 1.000 linhas SEM erro, entao
      // empresa com mais titulos no periodo publicava analise parcial como
      // concluida -- clientes, contagens e `valorTotalRisco` sao somados aqui,
      // no cliente (achado P1 do Codex; o proprio
      // docs/PLANO_AUDITORIA_FINANCEIRA_100_ETAPAS_2026-09-10.md:48 registra
      // somatorio local limitado a 1.000 como P1).
      const contasPendentes = await paginarTudo(qPendentes);

      if (!contasPendentes || contasPendentes.length === 0) {
        return {
          clientes: [],
          resumo: {
            totalEmRisco: 0,
            clientesAltoRisco: 0,
            clientesMedioRisco: 0,
            clientesBaixoRisco: 0,
            valorTotalRisco: 0,
          },
          geradoEm: new Date().toISOString(),
        };
      }

      const clientesMap = new Map<
        string,
        {
          /**
           * `cliente_id` de verdade, quando existe. A CHAVE do mapa pode ser o
           * nome digitado (titulo sem cadastro, permitido por
           * ContaReceberForm.tsx:187 `cliente_id: data.cliente_id || null`), e
           * manda-la para `.eq('cliente_id', ...)` -- coluna uuid -- derruba a
           * consulta. Com o `throw` desta PR, um unico titulo desses abortava a
           * previsao de TODOS os clientes (achado P1 do Codex / Devin, #404).
           */
          clienteIdReal: string | null;
          cliente: ClienteMapCliente;
          contas: ContaData[];
        }
      >();
      contasPendentes.forEach((conta) => {
        const clienteId = conta.cliente_id || conta.cliente_nome || 'sem-cliente';
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            clienteIdReal: conta.cliente_id ?? null,
            cliente: conta.clientes || {
              score: null,
              limite_credito: null,
              ramo_atividade: null,
              razao_social: conta.cliente_nome,
              nome_fantasia: null,
            },
            contas: [],
          });
        }
        const entry = clientesMap.get(clienteId);
        if (entry) {
          entry.contas.push({
            valor: conta.valor,
            valor_recebido: conta.valor_recebido,
            status: conta.status ?? '',
            data_vencimento: conta.data_vencimento,
          });
        }
      });

      const clientesAnalise: ClienteRisco[] = [];

      for (const [clienteId, { clienteIdReal, cliente, contas }] of clientesMap.entries()) {
        // Sem cadastro de cliente nao existe historico consultavel: a coluna e
        // uuid. Pular a consulta, e dizer na tela que o historico nao foi
        // avaliado -- em vez de derrubar a previsao inteira ou fingir zero
        // atraso.
        const historicoAvaliado = clienteIdReal != null;
        let historico: Array<{
          status: string | null;
          data_vencimento: string | null;
          data_recebimento: string | null;
        }> | null = null;

        if (historicoAvaliado) {
          // O historico que alimenta a probabilidade tambem fica na empresa: sem
          // isso, atraso do mesmo cliente em OUTRA empresa elevaria o risco aqui.
          let qHistorico = supabase
            .from('contas_receber')
            .select('status, data_vencimento, data_recebimento', { count: 'exact' })
            .eq('cliente_id', clienteIdReal)
            .lt('data_vencimento', format(hoje, 'yyyy-MM-dd'))
            // sem ordenacao, cada janela podia trazer linhas em ordem diferente
            .order('id');
          if (empresaId) qHistorico = qHistorico.eq('empresa_id', empresaId);

          // Mesma razao: cliente antigo pode ter mais de 1.000 titulos vencidos,
          // e taxa de atraso sobre pagina parcial e numero errado.
          historico = await paginarTudo(qHistorico);
        }

        const historicoContas: HistoricoContaData[] = (historico ?? []).map((h) => ({
          status: h.status ?? '',
          data_vencimento: h.data_vencimento ?? null,
          data_recebimento: h.data_recebimento ?? null,
        }));
        const probabilidade = calcularProbabilidadeAtraso(cliente, contas, historicoContas);
        const nivelRisco = determinarNivelRisco(probabilidade);
        const fatoresRisco = gerarFatoresRisco(cliente, contas, historicoContas);

        if (!historicoAvaliado) {
          fatoresRisco.push('Sem cadastro de cliente: histórico não avaliado');
        }

        // Refinamento por Ramo de Atividade (Engine 10/10)
        if (cliente.ramo_atividade && ['Construção', 'Varejo'].includes(cliente.ramo_atividade)) {
          fatoresRisco.push(`Setor de alto risco: ${cliente.ramo_atividade}`);
        }

        // Fallback DEPOIS de todos os fatores.
        if (fatoresRisco.length === 0) {
          fatoresRisco.push('Nenhum fator de risco identificado');
        }

        interface ContaReceberData {
          valor: number;
          valor_recebido: number | null;
          data_vencimento: string;
        }

        const totalPendente = contas.reduce(
          (sum: number, c: ContaReceberData) => sum + c.valor - (c.valor_recebido || 0),
          0
        );
        const proximoVencimento = contas
          .map((c: ContaReceberData) => new Date(c.data_vencimento))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

        clientesAnalise.push({
          id: clienteId,
          clienteIdReal,
          nome: cliente.razao_social || 'Cliente não identificado',
          nomeFantasia: cliente.nome_fantasia,
          score: cliente.score,
          totalPendente,
          diasAteVencimento: proximoVencimento ? differenceInDays(proximoVencimento, hoje) : 0,
          historicoAtrasos: historicoContas.filter(teveAtraso).length,
          probabilidadeAtraso: probabilidade,
          nivelRisco,
          fatoresRisco,
          acaoSugerida: gerarAcaoSugerida(nivelRisco, fatoresRisco),
        });
      }

      clientesAnalise.sort((a, b) => b.probabilidadeAtraso - a.probabilidadeAtraso);

      const clientesAltoRisco = clientesAnalise.filter((c) => c.nivelRisco === 'alto');
      const clientesMedioRisco = clientesAnalise.filter((c) => c.nivelRisco === 'medio');
      const clientesBaixoRisco = clientesAnalise.filter((c) => c.nivelRisco === 'baixo');

      return {
        clientes: clientesAnalise,
        resumo: {
          totalEmRisco: clientesAnalise.length,
          clientesAltoRisco: clientesAltoRisco.length,
          clientesMedioRisco: clientesMedioRisco.length,
          clientesBaixoRisco: clientesBaixoRisco.length,
          valorTotalRisco:
            clientesAltoRisco.reduce((sum, c) => sum + c.totalPendente, 0) +
            clientesMedioRisco.reduce((sum, c) => sum + c.totalPendente, 0) * 0.5,
        },
        geradoEm: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface PrevisaoInadimplenciaProps {
  /** Empresa selecionada. Sem ela, a analise some de empresas diferentes. */
  empresaId?: string;
}

export function PrevisaoInadimplencia({ empresaId }: PrevisaoInadimplenciaProps) {
  const [tabAtiva, setTabAtiva] = useState('todos');
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAnaliseInadimplencia(empresaId);

  const clientesFiltrados =
    data?.clientes.filter((c) => {
      if (tabAtiva === 'todos') return true;
      return c.nivelRisco === tabAtiva;
    }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Previsão de Inadimplência</h2>
            <p className="text-sm text-muted-foreground">Análise preditiva dos próximos 30 dias</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analisando dados históricos...</p>
          </div>
        </div>
      ) : isError ? (
        /*
         * Sem este estado, falha de consulta aparecia como KPI zerado: "nenhum
         * cliente em risco, R$ 0" com cara de analise concluida (achado do
         * Devin na PR #404). Ausencia de analise nao e ausencia de risco.
         */
        <div
          role="alert"
          className="flex items-center justify-center h-64 rounded-lg border border-destructive/30 bg-destructive/5"
        >
          <div className="text-center space-y-3 px-6">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-sm font-medium">Não foi possível calcular a previsão.</p>
            <p className="text-xs text-muted-foreground max-w-md">
              Os indicadores não são exibidos para não passar falta de dados como ausência de risco.{' '}
              {error instanceof Error ? error.message : 'Erro ao consultar os recebíveis.'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              Tentar de novo
            </Button>
          </div>
        </div>
      ) : (
        <>
          <PrevisaoKPIs
            totalEmRisco={data?.resumo.totalEmRisco || 0}
            clientesAltoRisco={data?.resumo.clientesAltoRisco || 0}
            clientesMedioRisco={data?.resumo.clientesMedioRisco || 0}
            valorTotalRisco={data?.resumo.valorTotalRisco || 0}
          />

          <PrevisaoClientesList
            tabAtiva={tabAtiva}
            onTabChange={setTabAtiva}
            clientesFiltrados={clientesFiltrados}
            totalEmRisco={data?.resumo.totalEmRisco || 0}
            clientesAltoRisco={data?.resumo.clientesAltoRisco || 0}
            clientesMedioRisco={data?.resumo.clientesMedioRisco || 0}
            clientesBaixoRisco={data?.resumo.clientesBaixoRisco || 0}
          />
        </>
      )}
    </div>
  );
}
