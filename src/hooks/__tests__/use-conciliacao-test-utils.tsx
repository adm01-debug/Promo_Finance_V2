// Helpers puros de teste do useConciliacaoPage (extraídos do arquivo de teste
// para modularização max-lines). Só podem viver aqui helpers que NÃO dependem
// do estado hoisted (vi.hoisted/vi.mock) do arquivo de teste.
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ExtratoOFX } from '@/lib/ofx-parser';

export function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

export function makeExtrato(overrides: Partial<ExtratoOFX> = {}): ExtratoOFX {
  return {
    formato: 'OFX',
    nomeArquivo: 'extrato.ofx',
    dataImportacao: new Date('2025-01-20'),
    conta: {
      banco: '001', agencia: '1234', conta: '56789', tipoConta: 'CC', moeda: 'BRL',
      saldoInicial: 0, saldoFinal: 100,
    },
    transacoes: [
      { id: 'tx-1', data: new Date('2025-01-15'), valor: 100, descricao: 'PAGAMENTO ABC', tipo: 'credito' },
    ],
    ...overrides,
  };
}

/** Match de alta confiança padrão (fixture repetido nos testes de importação). */
export function makeMatchAltaConfianca(tipo: 'receber' | 'pagar' = 'receber') {
  return new Map([
    ['tx-1', [{
      lancamentoId: 'lanc-1', lancamentoTipo: tipo,
      lancamento: { id: 'lanc-1', valor: 100 },
      confianca: 'alta', score: 0.95, motivos: [],
    }]],
  ]) as any;
}
