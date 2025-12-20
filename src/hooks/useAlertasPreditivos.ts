import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertaPreditivo {
  id: string;
  tipo: 'ruptura' | 'inadimplencia_provavel' | 'oportunidade_antecipacao' | 'concentracao_risco';
  titulo: string;
  descricao: string;
  probabilidade: number;
  impactoEstimado: number;
  dataPrevisao: Date;
  sugestoes: string[];
  prioridade: 'alta' | 'media' | 'baixa';
}

interface DadosFinanceiros {
  saldoAtual: number;
  receitasPrevistas: Array<{ valor: number; dataVencimento: Date; entidade: string }>;
  despesasPrevistas: Array<{ valor: number; dataVencimento: Date; entidade: string }>;
  historicoInadimplencia: Array<{ clienteId: string; diasAtraso: number }>;
}

// Função para enviar notificação push
async function enviarPushNotification(alerta: AlertaPreditivo) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Apenas alertas de alta prioridade ou ruptura
    if (alerta.prioridade !== 'alta' && alerta.tipo !== 'ruptura') return;

    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: user.id,
        title: `⚠️ ${alerta.titulo}`,
        body: alerta.descricao,
        tag: `alerta-${alerta.tipo}-${alerta.id}`,
        data: { url: '/alertas', alertaId: alerta.id },
        prioridade: alerta.prioridade === 'alta' ? 'alta' : 'media',
      },
    });

    console.log('[useAlertasPreditivos] Push notification enviada para alerta:', alerta.id);
  } catch (error) {
    console.error('[useAlertasPreditivos] Erro ao enviar push notification:', error);
  }
}

export function useAlertasPreditivos() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [alertas, setAlertas] = useState<AlertaPreditivo[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  const analisarFluxoCaixa = useCallback(async (dados: DadosFinanceiros): Promise<AlertaPreditivo[]> => {
    setIsAnalyzing(true);
    const novosAlertas: AlertaPreditivo[] = [];

    try {
      // Análise de ruptura de caixa
      let saldoProjetado = dados.saldoAtual;
      const hoje = new Date();
      
      for (let dia = 1; dia <= 30; dia++) {
        const dataAlvo = new Date(hoje);
        dataAlvo.setDate(dataAlvo.getDate() + dia);
        
        const receitasDia = dados.receitasPrevistas
          .filter(r => {
            const dataVenc = new Date(r.dataVencimento);
            return dataVenc.toDateString() === dataAlvo.toDateString();
          })
          .reduce((acc, r) => acc + r.valor, 0);
          
        const despesasDia = dados.despesasPrevistas
          .filter(d => {
            const dataVenc = new Date(d.dataVencimento);
            return dataVenc.toDateString() === dataAlvo.toDateString();
          })
          .reduce((acc, d) => acc + d.valor, 0);

        saldoProjetado = saldoProjetado + receitasDia - despesasDia;

        if (saldoProjetado < 0 && !novosAlertas.find(a => a.tipo === 'ruptura')) {
          novosAlertas.push({
            id: `ruptura-${dia}`,
            tipo: 'ruptura',
            titulo: 'Alerta de Ruptura de Caixa',
            descricao: `Projeção indica saldo negativo de ${Math.abs(saldoProjetado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em ${dia} dias`,
            probabilidade: 85,
            impactoEstimado: Math.abs(saldoProjetado),
            dataPrevisao: dataAlvo,
            sugestoes: [
              'Antecipar recebíveis',
              'Renegociar prazos de pagamento',
              'Priorizar cobranças urgentes'
            ],
            prioridade: 'alta',
          });
        }
      }

      // Análise de concentração de risco
      const totalReceber = dados.receitasPrevistas.reduce((acc, r) => acc + r.valor, 0);
      const porCliente = dados.receitasPrevistas.reduce((acc, r) => {
        acc[r.entidade] = (acc[r.entidade] || 0) + r.valor;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(porCliente).forEach(([cliente, valor]) => {
        const percentual = (valor / totalReceber) * 100;
        if (percentual > 30) {
          novosAlertas.push({
            id: `concentracao-${cliente}`,
            tipo: 'concentracao_risco',
            titulo: 'Concentração de Risco',
            descricao: `${cliente} representa ${percentual.toFixed(1)}% do total a receber`,
            probabilidade: 70,
            impactoEstimado: valor,
            dataPrevisao: new Date(),
            sugestoes: [
              'Diversificar carteira de clientes',
              'Monitorar saúde financeira do cliente',
              'Considerar seguro de crédito'
            ],
            prioridade: 'media',
          });
        }
      });

      // Análise de inadimplência provável
      const clientesRisco = dados.historicoInadimplencia
        .filter(h => h.diasAtraso > 15)
        .slice(0, 3);

      if (clientesRisco.length > 0) {
        const valorRisco = dados.receitasPrevistas
          .filter(r => clientesRisco.some(c => c.clienteId === r.entidade))
          .reduce((acc, r) => acc + r.valor, 0);

        if (valorRisco > 0) {
          novosAlertas.push({
            id: 'inadimplencia-provavel',
            tipo: 'inadimplencia_provavel',
            titulo: 'Risco de Inadimplência',
            descricao: `${clientesRisco.length} clientes com histórico de atraso têm recebíveis pendentes`,
            probabilidade: 65,
            impactoEstimado: valorRisco,
            dataPrevisao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            sugestoes: [
              'Contato preventivo com clientes',
              'Oferecer condições especiais para pagamento antecipado',
              'Acionar cobrança proativa'
            ],
            prioridade: 'media',
          });
        }
      }

      // Oportunidade de antecipação
      const descontoPossivel = dados.despesasPrevistas
        .filter(d => {
          const dias = Math.ceil((new Date(d.dataVencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          return dias > 10 && dias < 30;
        })
        .reduce((acc, d) => acc + d.valor * 0.02, 0); // 2% de desconto estimado

      if (descontoPossivel > 500 && dados.saldoAtual > dados.despesasPrevistas.reduce((acc, d) => acc + d.valor, 0) * 0.5) {
        novosAlertas.push({
          id: 'oportunidade-antecipacao',
          tipo: 'oportunidade_antecipacao',
          titulo: 'Oportunidade de Economia',
          descricao: `Possível economia de ${descontoPossivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com pagamentos antecipados`,
          probabilidade: 90,
          impactoEstimado: descontoPossivel,
          dataPrevisao: new Date(),
          sugestoes: [
            'Negociar descontos por antecipação',
            'Priorizar fornecedores com melhores condições',
            'Avaliar custo de oportunidade'
          ],
          prioridade: 'baixa',
        });
      }

      setAlertas(novosAlertas);
      setLastAnalysis(new Date());

      if (novosAlertas.length > 0) {
        toast.info('Análise preditiva concluída', {
          description: `${novosAlertas.length} alertas identificados`
        });

        // Enviar push notifications para alertas de alta prioridade
        const alertasAlta = novosAlertas.filter(a => a.prioridade === 'alta' || a.tipo === 'ruptura');
        for (const alerta of alertasAlta) {
          enviarPushNotification(alerta);
        }
      }

      return novosAlertas;
    } catch (error) {
      console.error('Erro na análise preditiva:', error);
      toast.error('Erro na análise preditiva');
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    alertas,
    lastAnalysis,
    analisarFluxoCaixa,
  };
}
