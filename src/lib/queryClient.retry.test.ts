/**
 * Teste — defaults de retry do QueryClient (Etapa 31)
 *
 * `mutations.retry` era `1`: toda mutação que falhasse era reenviada 1s depois,
 * sem sequer excluir 4xx como o predicado de `queries` faz. A Etapa 31 flagrou
 * o efeito em produção pelo E2E offline: um clique em "Ciência da Operação"
 * gerava dois POSTs em `sefaz-manifestar` (t+3409ms e t+4425ms).
 *
 * O cliente não tem como saber se a falha veio antes ou depois do efeito no
 * servidor. Reenviar uma operação não idempotente a executa duas vezes — dois
 * eventos na SEFAZ, dois boletos no Asaas, duas baixas. Nenhuma das 465
 * `useMutation` do app declarava `retry`, então todas herdavam esse reenvio
 * sem que ninguém o tivesse pedido.
 *
 * Queries continuam com retry: são leituras, repetir é inofensivo.
 */
import { describe, it, expect } from 'vitest';
import { queryClient } from './queryClient';

describe('defaults do QueryClient', () => {
  it('não reexecuta mutação automaticamente', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(false);
  });

  it('não deixa retryDelay de mutação configurado, que só teria uso com retry', () => {
    expect(queryClient.getDefaultOptions().mutations?.retryDelay).toBeUndefined();
  });

  it('mantém retry em queries, que são leituras e podem repetir', () => {
    const retry = queryClient.getDefaultOptions().queries?.retry;
    expect(typeof retry).toBe('function');

    const decidir = retry as (n: number, e: unknown) => boolean;
    // 4xx é erro de contrato: repetir não muda a resposta.
    expect(decidir(0, { status: 403 })).toBe(false);
    // 5xx e falha de rede podem ser transitórios.
    expect(decidir(0, { status: 503 })).toBe(true);
    expect(decidir(3, { status: 503 })).toBe(false);
  });
});
