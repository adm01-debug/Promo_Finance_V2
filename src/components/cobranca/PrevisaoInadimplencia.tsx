import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Brain,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
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
}

function calcularProbabilidadeAtraso(cliente: ClienteData, contasPendentes: ContaData[], historicoContas: HistoricoContaData[]): number {
  let score = 0;
  const scoreCliente = cliente.score || 100;
  if (scoreCliente < 50) score += 30;
  else if (scoreCliente < 70) score += 20;
  else if (scoreCliente < 85) score += 10;

  const contasVencidas = historicoContas.filter(c => c.status === 'vencido');
  const taxaAtraso = historicoContas.length > 0
    ? (contasVencidas.length / historicoContas.length) * 100
    : 0;
  if (taxaAtraso > 30) score += 40;
  else if (taxaAtraso > 15) score += 25;
  else if (taxaAtraso > 5) score += 10;

  const totalPendente = contasPendentes.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  const limiteCredito = cliente.limite_credito || 10000;
  const utilizacao = (totalPendente / limiteCredito) * 100;
  if (utilizacao > 100) score += 20;
  else if (utilizacao > 80) score += 15;
  else if (utilizacao > 50) score += 5;

  const proximoVencimento = contasPendentes
    .map(c => new Date(c.data_vencimento))
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

function gerarFatoresRisco(cliente: ClienteData, contasPendentes: ContaData[], historicoContas: HistoricoContaData[]): string[] {
  const fatores: string[] = [];
  if ((cliente.score || 100) < 70) {
    fatores.push(`Score baixo (${cliente.score || 0})`);
  }
  const contasVencidas = historicoContas.filter(c => c.status === 'vencido');
  if (contasVencidas.length > 0) {
    fatores.push(`${contasVencidas.length} atraso(s) no histórico`);
  }
  const totalPendente = contasPendentes.reduce((sum, c) => sum + c.valor - (c.valor_recebido || 0), 0);
  if (totalPendente > (cliente.limite_credito || 10000)) {
    fatores.push('Limite de crédito excedido');
  }
  const proximoVencimento = contasPendentes
    .map(c => new Date(c.data_vencimento))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  if (proximoVencimento && differenceInDays(proximoVencimento, new Date()) <= 7) {
    fatores.push('Vencimento próximo');
  }
  return fatores.length > 0 ? fatores : ['Nenhum fator de risco identificado'];
}

function gerarAcaoSugerida(nivelRisco: 'alto' | 'medio' | 'baixo', fatores: string[]): string {
  if (nivelRisco === 'alto') {
    if (fatores.some(f => f.includes('atraso'))) {
      return 'Entrar em contato imediatamente para negociação preventiva';
    }
    return 'Monitorar de perto e preparar régua de cobrança preventiva';
  }
  if (nivelRisco === 'medio') {
    return 'Enviar lembrete amigável antes do vencimento';
  }
  return 'Manter acompanhamento padrão';
}

function useAnaliseInadimplencia() {
  return useQuery({
    queryKey: ['analise-inadimplencia'],
    queryFn: async (): Promise<AnaliseInadimplencia> => {
      const hoje = new Date();
      const em30Dias = addDays(hoje, 30);

      const { data: contasPendentes } = await supabase
        .from('contas_receber')
        .select(`
          id, valor, valor_recebido, data_vencimento, status, cliente_id, cliente_nome,
          clientes(id, razao_social, nome_fantasia, score, limite_credito)
        `)
        .in('status', ['pendente', 'parcial'])
        .gte('data_vencimento', format(hoje, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(em30Dias, 'yyyy-MM-dd'))
        .order('data_vencimento');

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

      const clientesMap = new Map<string, any>();
      contasPendentes.forEach(conta => {
        const clienteId = conta.cliente_id || conta.cliente_nome;
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            cliente: conta.clientes || { razao_social: conta.cliente_nome },
            contas: [],
          });
        }
        clientesMap.get(clienteId).contas.push(conta);
      });

      const clientesAnalise: ClienteRisco[] = [];

      for (const [clienteId, { cliente, contas }] of clientesMap.entries()) {
        const { data: historico } = await supabase
          .from('contas_receber')
          .select('status')
          .eq('cliente_id', clienteId)
          .lt('data_vencimento', format(hoje, 'yyyy-MM-dd'));

        const probabilidade = calcularProbabilidadeAtraso(cliente, contas, historico || []);
        const nivelRisco = determinarNivelRisco(probabilidade);
        const fatoresRisco = gerarFatoresRisco(cliente, contas, historico || []);

        interface ContaReceberData {
          valor: number;
          valor_recebido: number | null;
          data_vencimento: string;
        }

        const totalPendente = contas.reduce((sum: number, c: ContaReceberData) => sum + c.valor - (c.valor_recebido || 0), 0);
        const proximoVencimento = contas
          .map((c: ContaReceberData) => new Date(c.data_vencimento))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

        clientesAnalise.push({
          id: clienteId,
          nome: cliente.razao_social || 'Cliente não identificado',
          nomeFantasia: cliente.nome_fantasia,
          score: cliente.score || 100,
          totalPendente,
          diasAteVencimento: proximoVencimento ? differenceInDays(proximoVencimento, hoje) : 0,
          historicoAtrasos: (historico || []).filter(c => c.status === 'vencido').length,
          probabilidadeAtraso: probabilidade,
          nivelRisco,
          fatoresRisco,
          acaoSugerida: gerarAcaoSugerida(nivelRisco, fatoresRisco),
        });
      }

      clientesAnalise.sort((a, b) => b.probabilidadeAtraso - a.probabilidadeAtraso);

      const clientesAltoRisco = clientesAnalise.filter(c => c.nivelRisco === 'alto');
      const clientesMedioRisco = clientesAnalise.filter(c => c.nivelRisco === 'medio');
      const clientesBaixoRisco = clientesAnalise.filter(c => c.nivelRisco === 'baixo');

      return {
        clientes: clientesAnalise,
        resumo: {
          totalEmRisco: clientesAnalise.length,
          clientesAltoRisco: clientesAltoRisco.length,
          clientesMedioRisco: clientesMedioRisco.length,
          clientesBaixoRisco: clientesBaixoRisco.length,
          valorTotalRisco: clientesAltoRisco.reduce((sum, c) => sum + c.totalPendente, 0) +
            clientesMedioRisco.reduce((sum, c) => sum + c.totalPendente, 0) * 0.5,
        },
        geradoEm: new Date().toISOString(),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function PrevisaoInadimplencia() {
  const [tabAtiva, setTabAtiva] = useState('todos');
  const { data, isLoading, refetch, isFetching } = useAnaliseInadimplencia();

  const clientesFiltrados = data?.clientes.filter(c => {
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
            <p className="text-sm text-muted-foreground">
              Análise preditiva dos próximos 30 dias
            </p>
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
