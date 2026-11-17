import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Brain, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { paginarTudo } from '@/lib/paginar-postgrest';
import {
  calcularProbabilidadeAtraso,
  determinarNivelRisco,
  gerarAcaoSugerida,
  gerarFatoresRisco,
  teveAtraso,
} from './previsao/risco';
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
/**
 * Quantos `cliente_id` por consulta de historico. `.in()` viaja na URL do GET:
 * 100 UUIDs dao ~3,9 KB, com folga para os outros filtros; mil dariam ~39 KB e
 * estourariam o limite de URI.
 */
const IDS_POR_LOTE = 100;

function useAnaliseInadimplencia(empresaId?: string) {
  return useQuery({
    // `enabled` abaixo: sem empresa a consulta NAO roda. No primeiro acesso
    // `currentEmpresaId` nasce null (AuthProvider) e o EmpresaScopeProvider só
    // escolhe a empresa num efeito posterior -- nesse intervalo a consulta sem
    // `empresa_id` agregava TODAS as empresas que o RLS permite, e a tela
    // mostrava uma previsao multiempresa antes do refetch (achado P1 do Codex
    // na PR #404). AGENTS.md secao 4: isolamento por empresa_id.
    queryKey: ['analise-inadimplencia', empresaId ?? 'sem-empresa'],
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

      // Historico de TODOS os clientes numa consulta, antes do loop. Era uma
      // consulta por cliente, serial dentro do `for`: com 50 clientes eram 51
      // idas ao banco e a tela ficava em carregamento durante a sequencia
      // inteira (achado P2 do Codex na PR #404).
      const idsReais = [...clientesMap.values()]
        .map((e) => e.clienteIdReal)
        .filter((id): id is string => id != null);

      const historicoPorCliente = new Map<string, HistoricoContaData[]>();
      // Lotes de IDS_POR_LOTE: `.in()` vai na URL do GET, e mil UUIDs dao ~39 KB
      // -- passa do limite de URI do gateway e derruba a previsao inteira
      // (achado P2 do Codex na PR #404). Paginar nao resolve isso: cada pagina
      // repete o filtro completo.
      for (let i = 0; i < idsReais.length; i += IDS_POR_LOTE) {
        const lote = idsReais.slice(i, i + IDS_POR_LOTE);
        // O historico tambem fica na empresa: sem isso, atraso do mesmo cliente
        // em OUTRA empresa elevaria o risco aqui.
        let qHistorico = supabase
          .from('contas_receber')
          .select('cliente_id, status, data_vencimento, data_recebimento', { count: 'exact' })
          .in('cliente_id', lote)
          .lt('data_vencimento', format(hoje, 'yyyy-MM-dd'))
          // sem ordenacao unica, cada janela podia repetir e omitir linhas
          .order('id');
        if (empresaId) qHistorico = qHistorico.eq('empresa_id', empresaId);

        // Paginado: cliente antigo pode ter mais de 1.000 titulos vencidos, e
        // taxa de atraso sobre pagina parcial e numero errado.
        const todoHistorico = await paginarTudo<{
          cliente_id: string | null;
          status: string | null;
          data_vencimento: string | null;
          data_recebimento: string | null;
        }>(qHistorico);

        for (const h of todoHistorico) {
          if (!h.cliente_id) continue;
          const lista = historicoPorCliente.get(h.cliente_id) ?? [];
          lista.push({
            status: h.status ?? '',
            data_vencimento: h.data_vencimento ?? null,
            data_recebimento: h.data_recebimento ?? null,
          });
          historicoPorCliente.set(h.cliente_id, lista);
        }
      }

      for (const [clienteId, { clienteIdReal, cliente, contas }] of clientesMap.entries()) {
        // Sem cadastro de cliente nao existe historico consultavel: a coluna e
        // uuid. A tela diz que o historico nao foi avaliado -- em vez de
        // derrubar a previsao inteira ou fingir zero atraso.
        const historicoAvaliado = clienteIdReal != null;
        const historico = clienteIdReal ? (historicoPorCliente.get(clienteIdReal) ?? []) : [];

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
    enabled: !!empresaId,
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
  const semEmpresa = !empresaId;

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

      {semEmpresa ? (
        <div className="flex items-center justify-center h-64 rounded-lg border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground max-w-md text-center px-6">
            Selecione uma empresa para calcular a previsão. Sem empresa, a análise somaria clientes
            de todas as empresas acessíveis num único ranking de risco.
          </p>
        </div>
      ) : isLoading ? (
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
