export interface ObrigacaoAcessoria {
  codigo: string;
  nome: string;
  periodicidade: 'mensal' | 'trimestral' | 'anual' | 'evento';
  orgaoDestino: 'RFB' | 'CGIBS' | 'SEFAZ' | 'Prefeitura';
  prazoEntrega: string;
  penalidade: string;
  ativa: boolean;
  inicioVigencia: Date;
}

export const OBRIGACOES_ACESSORIAS_REFORMA: ObrigacaoAcessoria[] = [
  {
    codigo: 'EFD-IBS-CBS',
    nome: 'Escrituração Fiscal Digital IBS/CBS',
    periodicidade: 'mensal',
    orgaoDestino: 'RFB',
    prazoEntrega: 'Até o 20º dia do mês subsequente',
    penalidade: 'Multa de 0,5% sobre o faturamento',
    ativa: true,
    inicioVigencia: new Date('2026-01-01'),
  },
  {
    codigo: 'DCTF-IBS-CBS',
    nome: 'Declaração de Débitos e Créditos Tributários - IBS/CBS',
    periodicidade: 'mensal',
    orgaoDestino: 'RFB',
    prazoEntrega: 'Até o 15º dia do mês subsequente',
    penalidade: 'Multa mínima de R$ 500',
    ativa: true,
    inicioVigencia: new Date('2026-01-01'),
  },
];
