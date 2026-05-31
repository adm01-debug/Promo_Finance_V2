// CASH FLOW SCENARIO PROJECTIONS ENGINE

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
  hoje.setHours(0, 0, 0, 0);

  Object.entries(projecoes).forEach(([cenario, dados]) => {
    // Buscar o primeiro dia de ruptura ou risco alto para cada cenário
    const diaRuptura = dados.find(d => d.saldo <= limiteRupturaTotal);
    const diaRiscoAlto = dados.find(d => d.saldo <= limiteRiscoAlto && d.saldo > limiteRupturaTotal);
    
    [diaRuptura, diaRiscoAlto].filter(Boolean).forEach((dia) => {
      if (!dia) return;
      
      const dataEvento = new Date(dia.data);
      dataEvento.setHours(0, 0, 0, 0);
      const diasAteEvento = Math.ceil((dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const tipo = dia.saldo <= limiteRupturaTotal ? 'ruptura' : 'risco_alto';

      alertas.push({
        id: `${tipo}-${cenario}-${dia.data}`,
        tipo,
        data: dia.data,
        saldoProjetado: dia.saldo,
        cenario: cenario as CenarioTipo,
        mensagem: tipo === 'ruptura' 
          ? `Ruptura de caixa projetada no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`
          : `Saldo crítico projetado no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`,
        diasAteEvento,
        acaoSugerida: tipo === 'ruptura'
          ? 'Antecipar recebíveis ou renegociar pagamentos urgentes'
          : 'Revisar fluxo de pagamentos e priorizar despesas essenciais',
      });
    });
  });

  // Ordenar por severidade (ruptura > risco_alto) e depois por proximidade
  return alertas.sort((a, b) => {
    const severidade = { ruptura: 0, risco_alto: 1, risco_medio: 2, recuperacao: 3 };
    if (severidade[a.tipo] !== severidade[b.tipo]) {
      return severidade[a.tipo] - severidade[b.tipo];
    }
    return a.diasAteEvento - b.diasAteEvento;
  });
}

// Calcular métricas resumidas dos cenários
interface MetricaCenario {
  saldoFinal: number;
  saldoMinimo: number;
  diasCriticos: number;
}

export function calcularMetricasCenarios(
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>
): Record<CenarioTipo, MetricaCenario> {
  const resultado = {} as Record<CenarioTipo, MetricaCenario>;

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
