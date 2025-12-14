// ============================================
// CASH FLOW SCENARIO PROJECTIONS ENGINE
// ============================================

export type CenarioTipo = 'otimista' | 'realista' | 'pessimista';

export interface CenarioConfig {
  tipo: CenarioTipo;
  nome: string;
  cor: string;
  descricao: string;
  // Multiplicadores para ajustar projeções
  multiplicadorReceitas: number;
  multiplicadorDespesas: number;
  probabilidadeAtraso: number; // % de receitas que podem atrasar
}

export interface ProjecaoDiaria {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ProjecaoCenario extends ProjecaoDiaria {
  cenario: CenarioTipo;
}

export interface AlertaRuptura {
  id: string;
  tipo: 'ruptura' | 'risco_alto' | 'risco_medio' | 'recuperacao';
  data: string;
  saldoProjetado: number;
  cenario: CenarioTipo;
  mensagem: string;
  diasAteEvento: number;
  acaoSugerida: string;
}

// Configurações dos cenários
export const CENARIOS_CONFIG: Record<CenarioTipo, CenarioConfig> = {
  otimista: {
    tipo: 'otimista',
    nome: 'Otimista',
    cor: 'hsl(150, 70%, 45%)',
    descricao: 'Cenário com aumento de receitas e redução de despesas',
    multiplicadorReceitas: 1.15, // +15% receitas
    multiplicadorDespesas: 0.95, // -5% despesas
    probabilidadeAtraso: 0.05, // 5% de atrasos
  },
  realista: {
    tipo: 'realista',
    nome: 'Realista',
    cor: 'hsl(24, 95%, 46%)',
    descricao: 'Cenário baseado em dados históricos',
    multiplicadorReceitas: 1.0,
    multiplicadorDespesas: 1.0,
    probabilidadeAtraso: 0.15, // 15% de atrasos
  },
  pessimista: {
    tipo: 'pessimista',
    nome: 'Pessimista',
    cor: 'hsl(0, 78%, 50%)',
    descricao: 'Cenário com redução de receitas e aumento de despesas',
    multiplicadorReceitas: 0.80, // -20% receitas
    multiplicadorDespesas: 1.10, // +10% despesas
    probabilidadeAtraso: 0.30, // 30% de atrasos
  },
};

// Gerar projeções para um cenário específico
export function gerarProjecaoCenario(
  dadosBase: ProjecaoDiaria[],
  cenario: CenarioTipo,
  saldoInicial: number
): ProjecaoCenario[] {
  const config = CENARIOS_CONFIG[cenario];
  let saldoAcumulado = saldoInicial;

  return dadosBase.map((dia) => {
    // Aplicar multiplicadores e simular atrasos
    const receitasAjustadas = dia.receitas * config.multiplicadorReceitas * (1 - config.probabilidadeAtraso * Math.random());
    const despesasAjustadas = dia.despesas * config.multiplicadorDespesas;
    
    saldoAcumulado = saldoAcumulado + receitasAjustadas - despesasAjustadas;

    return {
      data: dia.data,
      receitas: receitasAjustadas,
      despesas: despesasAjustadas,
      saldo: saldoAcumulado,
      cenario,
    };
  });
}

// Gerar projeções para todos os cenários
export function gerarTodasProjecoes(
  dadosBase: ProjecaoDiaria[],
  saldoInicial: number
): Record<CenarioTipo, ProjecaoCenario[]> {
  return {
    otimista: gerarProjecaoCenario(dadosBase, 'otimista', saldoInicial),
    realista: gerarProjecaoCenario(dadosBase, 'realista', saldoInicial),
    pessimista: gerarProjecaoCenario(dadosBase, 'pessimista', saldoInicial),
  };
}

// Detectar alertas de ruptura de caixa
export function detectarAlertasRuptura(
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>,
  limiteRupturaTotal: number = 0,
  limiteRiscoAlto: number = 50000,
  limiteRiscoMedio: number = 100000
): AlertaRuptura[] {
  const alertas: AlertaRuptura[] = [];
  const hoje = new Date();

  Object.entries(projecoes).forEach(([cenario, dados]) => {
    dados.forEach((dia) => {
      const dataEvento = new Date(dia.data);
      const diasAteEvento = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (dia.saldo <= limiteRupturaTotal) {
        alertas.push({
          id: `ruptura-${cenario}-${dia.data}`,
          tipo: 'ruptura',
          data: dia.data,
          saldoProjetado: dia.saldo,
          cenario: cenario as CenarioTipo,
          mensagem: `Ruptura de caixa projetada no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`,
          diasAteEvento,
          acaoSugerida: 'Antecipar recebíveis ou renegociar pagamentos',
        });
      } else if (dia.saldo <= limiteRiscoAlto) {
        alertas.push({
          id: `risco-alto-${cenario}-${dia.data}`,
          tipo: 'risco_alto',
          data: dia.data,
          saldoProjetado: dia.saldo,
          cenario: cenario as CenarioTipo,
          mensagem: `Saldo crítico projetado no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`,
          diasAteEvento,
          acaoSugerida: 'Revisar fluxo de pagamentos da semana',
        });
      } else if (dia.saldo <= limiteRiscoMedio) {
        alertas.push({
          id: `risco-medio-${cenario}-${dia.data}`,
          tipo: 'risco_medio',
          data: dia.data,
          saldoProjetado: dia.saldo,
          cenario: cenario as CenarioTipo,
          mensagem: `Atenção ao saldo no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`,
          diasAteEvento,
          acaoSugerida: 'Monitorar recebimentos previstos',
        });
      }
    });
  });

  // Ordenar por proximidade e severidade
  return alertas
    .sort((a, b) => {
      const severidade = { ruptura: 0, risco_alto: 1, risco_medio: 2, recuperacao: 3 };
      if (severidade[a.tipo] !== severidade[b.tipo]) {
        return severidade[a.tipo] - severidade[b.tipo];
      }
      return a.diasAteEvento - b.diasAteEvento;
    })
    .slice(0, 10); // Limitar a 10 alertas mais relevantes
}

// Calcular métricas resumidas dos cenários
export function calcularMetricasCenarios(
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>
): Record<CenarioTipo, { saldoFinal: number; saldoMinimo: number; diasCriticos: number }> {
  const resultado: Record<CenarioTipo, { saldoFinal: number; saldoMinimo: number; diasCriticos: number }> = {} as any;

  Object.entries(projecoes).forEach(([cenario, dados]) => {
    const saldos = dados.map(d => d.saldo);
    resultado[cenario as CenarioTipo] = {
      saldoFinal: saldos[saldos.length - 1] || 0,
      saldoMinimo: Math.min(...saldos),
      diasCriticos: saldos.filter(s => s < 100000).length,
    };
  });

  return resultado;
}

// Formatar dados para gráfico comparativo
export function formatarDadosGrafico(
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>
): Array<{ data: string; otimista: number; realista: number; pessimista: number }> {
  const dadosRealista = projecoes.realista;
  
  return dadosRealista.map((dia, index) => ({
    data: dia.data,
    otimista: projecoes.otimista[index]?.saldo || 0,
    realista: dia.saldo,
    pessimista: projecoes.pessimista[index]?.saldo || 0,
  }));
}
