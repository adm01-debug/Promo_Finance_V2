import { differenceInDays } from 'date-fns';
import { TAXA_EMPRESTIMO_COMPARATIVO } from './simulador-antecipacao.config';
import type { RecebiveisDisponiveis, SimulacaoResultado } from './simulador-antecipacao.config';

export function calcularSimulacaoAntecipacao(params: {
  taxa: number;
  recebiveis: RecebiveisDisponiveis[];
  recebivelSelecionados: string[];
  dataAntecipacao: string;
}): Omit<SimulacaoResultado, 'instituicao'> | null {
  const { taxa, recebiveis, recebivelSelecionados, dataAntecipacao } = params;
  const selecionados = recebiveis.filter((r) => recebivelSelecionados.includes(r.id));
  if (selecionados.length === 0) return null;

  const valorBruto = selecionados.reduce((sum, r) => sum + r.valor, 0);
  const hoje = new Date(dataAntecipacao);

  let taxaTotal = 0;
  let diasPonderados = 0;

  selecionados.forEach((r) => {
    const diasAntecipados = differenceInDays(new Date(r.data_vencimento), hoje);
    const taxaProRata = (taxa / 100) * (diasAntecipados / 30);
    taxaTotal += r.valor * taxaProRata;
    diasPonderados += diasAntecipados * r.valor;
  });

  const diasMedio = valorBruto > 0 ? diasPonderados / valorBruto : 0;
  const valorLiquido = valorBruto - taxaTotal;
  const taxaEfetiva = valorBruto > 0 ? (taxaTotal / valorBruto) * 100 : 0;

  const custoEmprestimo = valorBruto * (TAXA_EMPRESTIMO_COMPARATIVO / 100) * (diasMedio / 30);
  const economia = custoEmprestimo - taxaTotal;

  return {
    valorBruto,
    taxaTotal,
    valorLiquido,
    economia: Math.max(0, economia),
    diasMedio: Math.round(diasMedio),
    taxaEfetiva,
  };
}
