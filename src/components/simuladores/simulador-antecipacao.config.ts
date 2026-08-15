export interface RecebiveisDisponiveis {
  id: string;
  cliente_nome: string;
  valor: number;
  data_vencimento: string;
  diasParaVencimento: number;
}

export interface InstituicaoFinanceira {
  id: string;
  nome: string;
  logo: string;
  taxaMensal: number;
  prazoAprovacao: string;
  limiteMin: number;
  limiteMax: number;
  rating: number;
  destaque?: boolean;
}

export interface SimulacaoResultado {
  instituicao: InstituicaoFinanceira;
  valorBruto: number;
  taxaTotal: number;
  valorLiquido: number;
  economia: number;
  diasMedio: number;
  taxaEfetiva: number;
}

export const TAXA_EMPRESTIMO_COMPARATIVO = 4;

export const INSTITUICOES: InstituicaoFinanceira[] = [
  { id: '1', nome: 'Banco Digital', logo: '🏦', taxaMensal: 1.89, prazoAprovacao: '2h', limiteMin: 1000, limiteMax: 500000, rating: 4.8, destaque: true },
  { id: '2', nome: 'FinTech Capital', logo: '💳', taxaMensal: 2.15, prazoAprovacao: '4h', limiteMin: 500, limiteMax: 200000, rating: 4.6 },
  { id: '3', nome: 'Crédito Express', logo: '⚡', taxaMensal: 2.49, prazoAprovacao: '1h', limiteMin: 100, limiteMax: 100000, rating: 4.4 },
  { id: '4', nome: 'Factoring Prime', logo: '🏢', taxaMensal: 1.75, prazoAprovacao: '24h', limiteMin: 10000, limiteMax: 2000000, rating: 4.9 },
  { id: '5', nome: 'Antecipa Já', logo: '🚀', taxaMensal: 2.99, prazoAprovacao: '30min', limiteMin: 50, limiteMax: 50000, rating: 4.2 },
];
