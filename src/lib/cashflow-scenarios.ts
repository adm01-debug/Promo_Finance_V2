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
    multiplicadorReceitas: 0.8, // -20% receitas
    multiplicadorDespesas: 1.1, // +10% despesas
    probabilidadeAtraso: 0.3, // 30% de atrasos
  },
};

/**
 * PRNG puro (mulberry32) semeado por string.
 *
 * O jitter de atraso vinha de `Math.random()`: a MESMA consulta devolvia 900 ou
 * 765 em execucoes diferentes, sem rastro de como o numero saiu, e nenhum teste
 * podia travar o contrato (achado F06). Agora o fator e derivado de
 * `data | cenario | semente`: igual para a mesma projecao, diferente entre dias
 * e cenarios, e reproduzivel por quem auditar o numero.
 */
function hashSemente(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fator deterministico em [0, 1) para um dia/cenario/semente. */
export function fatorAtrasoDeterministico(
  data: string,
  cenario: CenarioTipo,
  semente = ''
): number {
  let a = hashSemente(`${data}|${cenario}|${semente}`);
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export interface OpcoesProjecao {
  /**
   * Entra no hash do fator de atraso. Use o id da empresa + periodo para que
   * duas empresas no mesmo dia nao recebam o mesmo jitter, mantendo cada uma
   * reproduzivel.
   */
  semente?: string;
}

// Gerar projeções para um cenário específico
export function gerarProjecaoCenario(
  dadosBase: ProjecaoDiaria[],
  cenario: CenarioTipo,
  saldoInicial: number,
  opcoes: OpcoesProjecao = {}
): ProjecaoCenario[] {
  const config = CENARIOS_CONFIG[cenario];
  let saldoAcumulado = saldoInicial;

  return dadosBase.map((dia) => {
    // Aplicar multiplicadores e o fator de atraso DETERMINISTICO do dia
    const receitasAjustadas =
      dia.receitas *
      config.multiplicadorReceitas *
      (1 -
        config.probabilidadeAtraso * fatorAtrasoDeterministico(dia.data, cenario, opcoes.semente));
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
  saldoInicial: number,
  opcoes: OpcoesProjecao = {}
): Record<CenarioTipo, ProjecaoCenario[]> {
  return {
    otimista: gerarProjecaoCenario(dadosBase, 'otimista', saldoInicial, opcoes),
    realista: gerarProjecaoCenario(dadosBase, 'realista', saldoInicial, opcoes),
    pessimista: gerarProjecaoCenario(dadosBase, 'pessimista', saldoInicial, opcoes),
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
    const diaRuptura = dados.find((d) => d.saldo <= limiteRupturaTotal);
    const diaRiscoAlto = dados.find(
      (d) => d.saldo <= limiteRiscoAlto && d.saldo > limiteRupturaTotal
    );
    const diaRiscoMedio = dados.find(
      (d) => d.saldo <= limiteRiscoMedio && d.saldo > limiteRiscoAlto
    );

    [diaRuptura, diaRiscoAlto, diaRiscoMedio].filter(Boolean).forEach((dia) => {
      if (!dia) return;

      const dataEvento = new Date(dia.data);
      dataEvento.setHours(0, 0, 0, 0);
      const diasAteEvento = Math.ceil(
        (dataEvento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );
      const tipo =
        dia.saldo <= limiteRupturaTotal
          ? 'ruptura'
          : dia.saldo <= limiteRiscoAlto
            ? 'risco_alto'
            : 'risco_medio';

      alertas.push({
        id: `${tipo}-${cenario}-${dia.data}`,
        tipo,
        data: dia.data,
        saldoProjetado: dia.saldo,
        cenario: cenario as CenarioTipo,
        mensagem:
          tipo === 'ruptura'
            ? `Ruptura de caixa projetada no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`
            : tipo === 'risco_alto'
              ? `Saldo crítico projetado no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`
              : `Saldo de atenção projetado no cenário ${CENARIOS_CONFIG[cenario as CenarioTipo].nome}`,
        diasAteEvento,
        acaoSugerida:
          tipo === 'ruptura'
            ? 'Antecipar recebíveis ou renegociar pagamentos urgentes'
            : tipo === 'risco_alto'
              ? 'Revisar fluxo de pagamentos e priorizar despesas essenciais'
              : 'Monitorar recebimentos e revisar a projeção de caixa',
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
  projecoes: Record<CenarioTipo, ProjecaoCenario[]>,
  /**
   * Saldo de onde a projecao parte. Sem ele, periodo sem movimento devolvia
   * `saldoFinal: 0` e `saldoMinimo: 0` -- ou seja, dizia que a empresa zerou o
   * caixa quando na verdade nao houve nada projetado (achado F07). Com ele, a
   * ausencia de movimento preserva o saldo atual.
   */
  saldoInicial = 0
): Record<CenarioTipo, MetricaCenario> {
  const resultado = {} as Record<CenarioTipo, MetricaCenario>;

  Object.entries(projecoes).forEach(([cenario, dados]) => {
    const saldos = dados.map((d) => d.saldo);
    const vazio = saldos.length === 0;
    resultado[cenario as CenarioTipo] = {
      // `?? saldoInicial` em vez de `|| 0`: saldo final legitimamente zero
      // continua zero, e projecao vazia volta para o saldo de partida.
      saldoFinal: vazio ? saldoInicial : (saldos[saldos.length - 1] ?? saldoInicial),
      saldoMinimo: vazio ? saldoInicial : Math.min(...saldos),
      diasCriticos: saldos.filter((s) => s < 100000).length,
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
