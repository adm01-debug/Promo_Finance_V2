// Pré-validação de dados antes de gerar SPED ECD/ECF.
// Faz checagens cruzadas entre Razão (partidas contábeis) e DRE (demonstrativo)
// para sinalizar inconsistências antes da geração do arquivo oficial.
import { useMemo } from 'react';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';
import { useDemonstrativosContabeis } from '@/hooks/useDemonstrativosContabeis';

export type SeveridadeAlerta = 'error' | 'warning' | 'info';

export interface PreValidacaoAlerta {
  id: string;
  severidade: SeveridadeAlerta;
  categoria: 'razao' | 'dre' | 'cruzado' | 'cobertura';
  titulo: string;
  detalhe: string;
  valor?: number;
}

export interface PreValidacaoResult {
  isLoading: boolean;
  alertas: PreValidacaoAlerta[];
  totais: {
    erros: number;
    avisos: number;
    info: number;
  };
  resumo: {
    totalLancamentos: number;
    totalPartidas: number;
    debitoRazao: number;
    creditoRazao: number;
    diferencaRazao: number;
    receitaBruta: number;
    lucroLiquido: number;
    lancamentosNaoBalanceados: number;
    partidasSemConta: number;
  };
  podeGerar: boolean;
}

interface PartidaInline {
  tipo?: string;
  valor?: number;
  conta_id?: string | null;
  conta?: { codigo?: string; descricao?: string | null; nome?: string | null } | null;
}

interface LancamentoInline {
  id: string;
  data_lancamento: string;
  historico?: string | null;
  partidas?: PartidaInline[];
}

const TOLERANCIA = 0.01;

export function usePreValidacaoSped(empresaId: string | undefined, anoCalendario: number): PreValidacaoResult {
  const { data: lancs = [], isLoading: loadingLancs } = useLancamentosContabeis(empresaId, anoCalendario);
  // DRE acumulada do exercício (usa mes=11 = dezembro como fim do período).
  const dre = useDemonstrativosContabeis({
    empresaId: empresaId || 'todas',
    ano: anoCalendario,
    mes: 11,
    fonte: 'competencia',
  });

  return useMemo<PreValidacaoResult>(() => {
    const isLoading = loadingLancs || dre.isLoading;
    const alertas: PreValidacaoAlerta[] = [];

    const lancamentos = (lancs as LancamentoInline[]) || [];
    let debitoRazao = 0;
    let creditoRazao = 0;
    let lancNaoBalanceados = 0;
    let partidasSemConta = 0;
    let receitaRazao = 0;
    let despesaRazao = 0;
    let totalPartidas = 0;
    const datasSemPartida: string[] = [];
    const lancamentosForaPeriodo: string[] = [];
    const inicio = `${anoCalendario}-01-01`;
    const fim = `${anoCalendario}-12-31`;

    for (const l of lancamentos) {
      const partidas = l.partidas || [];
      if (partidas.length === 0) {
        datasSemPartida.push(l.data_lancamento);
        continue;
      }
      if (l.data_lancamento < inicio || l.data_lancamento > fim) {
        lancamentosForaPeriodo.push(l.id);
      }
      let dLanc = 0;
      let cLanc = 0;
      for (const p of partidas) {
        const v = Number(p.valor) || 0;
        totalPartidas++;
        if (!p.conta_id || !p.conta) partidasSemConta++;
        if (p.tipo === 'D') {
          dLanc += v;
          debitoRazao += v;
          // Heurística de classificação por código (3 = receita, 4/5 = despesa)
          const codigo = p.conta?.codigo || '';
          if (codigo.startsWith('4') || codigo.startsWith('5')) despesaRazao += v;
          if (codigo.startsWith('3')) receitaRazao -= v;
        } else if (p.tipo === 'C') {
          cLanc += v;
          creditoRazao += v;
          const codigo = p.conta?.codigo || '';
          if (codigo.startsWith('3')) receitaRazao += v;
          if (codigo.startsWith('4') || codigo.startsWith('5')) despesaRazao -= v;
        }
      }
      if (Math.abs(dLanc - cLanc) > TOLERANCIA) {
        lancNaoBalanceados++;
      }
    }

    const diferencaRazao = debitoRazao - creditoRazao;

    // ============ Alertas de RAZÃO ============
    if (lancamentos.length === 0) {
      alertas.push({
        id: 'razao-vazio',
        severidade: 'error',
        categoria: 'razao',
        titulo: 'Nenhum lançamento contábil no período',
        detalhe: `Não existem lançamentos para o ano-calendário ${anoCalendario}. O SPED não pode ser gerado vazio.`,
      });
    }

    if (Math.abs(diferencaRazao) > TOLERANCIA) {
      alertas.push({
        id: 'razao-desbalanceado',
        severidade: 'error',
        categoria: 'razao',
        titulo: 'Razão geral não fecha (Débitos ≠ Créditos)',
        detalhe: `Diferença global de R$ ${Math.abs(diferencaRazao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} entre débitos e créditos do período.`,
        valor: Math.abs(diferencaRazao),
      });
    }

    if (lancNaoBalanceados > 0) {
      alertas.push({
        id: 'lanc-nao-balanceados',
        severidade: 'error',
        categoria: 'razao',
        titulo: `${lancNaoBalanceados} lançamento(s) não balanceado(s)`,
        detalhe: 'Cada lançamento contábil precisa ter Σ Débitos = Σ Créditos. Corrija antes de transmitir o SPED.',
        valor: lancNaoBalanceados,
      });
    }

    if (partidasSemConta > 0) {
      alertas.push({
        id: 'partidas-sem-conta',
        severidade: 'error',
        categoria: 'razao',
        titulo: `${partidasSemConta} partida(s) sem conta contábil`,
        detalhe: 'Existem partidas com conta_id nulo ou conta não localizada no plano de contas.',
      });
    }

    if (datasSemPartida.length > 0) {
      alertas.push({
        id: 'lanc-sem-partidas',
        severidade: 'warning',
        categoria: 'razao',
        titulo: `${datasSemPartida.length} lançamento(s) sem partidas`,
        detalhe: 'Lançamentos sem partidas associadas serão ignorados pelo SPED.',
      });
    }

    if (lancamentosForaPeriodo.length > 0) {
      alertas.push({
        id: 'lanc-fora-periodo',
        severidade: 'warning',
        categoria: 'razao',
        titulo: `${lancamentosForaPeriodo.length} lançamento(s) fora do ano-calendário`,
        detalhe: `Lançamentos com data fora de ${anoCalendario} retornados pela consulta. Verifique filtros.`,
      });
    }

    // ============ Alertas de DRE ============
    if (dre.error) {
      alertas.push({
        id: 'dre-erro',
        severidade: 'error',
        categoria: 'dre',
        titulo: 'Falha ao calcular o DRE',
        detalhe: dre.error.message,
      });
    } else if (!dre.isLoading) {
      const receitaDre = dre.dre.receitaBruta;
      const lucro = dre.dre.lucroLiquido;

      if (receitaDre <= 0 && receitaRazao <= 0) {
        alertas.push({
          id: 'dre-sem-receita',
          severidade: 'warning',
          categoria: 'dre',
          titulo: 'DRE sem receitas no período',
          detalhe: 'Não foram detectadas contas de receita (tipo=receita ou código 3.x) com movimento. Confirme se a apuração está completa.',
        });
      }

      // Cruzamento Razão vs DRE
      if (receitaDre > 0 && receitaRazao > 0) {
        const difReceita = Math.abs(receitaDre - receitaRazao);
        const tolPct = receitaDre * 0.01; // 1% de tolerância para arredondamento e classificação
        if (difReceita > Math.max(tolPct, 1)) {
          alertas.push({
            id: 'cruz-receita',
            severidade: 'warning',
            categoria: 'cruzado',
            titulo: 'Receita do DRE diverge do Razão',
            detalhe: `DRE: R$ ${receitaDre.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Razão (contas 3.x): R$ ${receitaRazao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · Diferença: R$ ${difReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
            valor: difReceita,
          });
        }
      }

      if (!dre.balanco.equilibrado) {
        alertas.push({
          id: 'bp-desequilibrado',
          severidade: 'error',
          categoria: 'cruzado',
          titulo: 'Balanço Patrimonial não equilibrado',
          detalhe: `Ativo Total (R$ ${dre.balanco.totalAtivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) ≠ Passivo + PL (R$ ${dre.balanco.totalPassivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Diferença R$ ${Math.abs(dre.balanco.totalAtivo - dre.balanco.totalPassivo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        });
      }

      if (lucro < 0) {
        alertas.push({
          id: 'dre-prejuizo',
          severidade: 'info',
          categoria: 'dre',
          titulo: 'Apuração com prejuízo no exercício',
          detalhe: `Lucro líquido apurado: R$ ${lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Considere compensação de prejuízos fiscais na ECF.`,
        });
      }
    }

    // ============ Cobertura ============
    if (!isLoading && lancamentos.length > 0 && lancamentos.length < 12) {
      alertas.push({
        id: 'cobertura-baixa',
        severidade: 'info',
        categoria: 'cobertura',
        titulo: 'Cobertura baixa de lançamentos no exercício',
        detalhe: `Apenas ${lancamentos.length} lançamento(s) no ano. Confirme se a contabilidade do período está completa.`,
      });
    }

    const totais = {
      erros: alertas.filter((a) => a.severidade === 'error').length,
      avisos: alertas.filter((a) => a.severidade === 'warning').length,
      info: alertas.filter((a) => a.severidade === 'info').length,
    };

    return {
      isLoading,
      alertas,
      totais,
      resumo: {
        totalLancamentos: lancamentos.length,
        totalPartidas,
        debitoRazao,
        creditoRazao,
        diferencaRazao,
        receitaBruta: dre.dre?.receitaBruta ?? 0,
        lucroLiquido: dre.dre?.lucroLiquido ?? 0,
        lancamentosNaoBalanceados: lancNaoBalanceados,
        partidasSemConta,
      },
      podeGerar: !isLoading && totais.erros === 0,
    };
  }, [lancs, dre, loadingLancs, anoCalendario]);
}
