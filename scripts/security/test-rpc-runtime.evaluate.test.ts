/**
 * Testes unitários de `evaluate` (scripts/security/test-rpc-runtime.ts).
 *
 * Rodar:  bun test scripts/security/test-rpc-runtime.evaluate.test.ts
 *
 * O runner é o do Bun (`bun:test`): o Vitest do projeto só inclui `src/**` e o
 * tsconfig.e2e.json exclui este arquivo, então nenhum outro comando o executa.
 * O fluxo completo do probe (login, matriz, registro remoto) é coberto por
 * `python3 scripts/security/test_gates_http.py`.
 */
import { describe, expect, it } from 'bun:test';
import { evaluate } from './test-rpc-runtime';

describe('evaluate', () => {
  it('aceita 404/PGRST202 para anon e authenticated', () => {
    expect(evaluate('anon', 'confirmar_conciliacao', { status: 404, code: 'PGRST202' })).toBe(true);
    expect(
      evaluate('authenticated', 'confirmar_conciliacao', { status: 404, code: 'PGRST202' })
    ).toBe(true);
  });

  it('aceita 401 apenas para anon', () => {
    expect(evaluate('anon', 'confirmar_conciliacao', { status: 401 })).toBe(true);
    expect(evaluate('authenticated', 'confirmar_conciliacao', { status: 401 })).toBe(false);
  });

  it('aceita 403 apenas quando for ACL da função alvo', () => {
    expect(
      evaluate('authenticated', 'desfazer_conciliacao', {
        status: 403,
        code: '42501',
        message: 'permission denied for function desfazer_conciliacao',
      })
    ).toBe(true);
  });

  it('rejeita 403 genérico ou de função diferente', () => {
    expect(
      evaluate('authenticated', 'desfazer_conciliacao', {
        status: 403,
        code: '42501',
        message: 'permission denied for table contas_pagar',
      })
    ).toBe(false);

    expect(
      evaluate('authenticated', 'desfazer_conciliacao', {
        status: 403,
        code: '42501',
        message: 'permission denied for function confirmar_conciliacao',
      })
    ).toBe(false);

    expect(
      evaluate('authenticated', 'desfazer_conciliacao', {
        status: 403,
        code: 'PGRST301',
        message: 'JWT expired',
      })
    ).toBe(false);
  });

  it('rejeita 403 de função cujo nome apenas começa com o da função alvo', () => {
    // Regressão: a comparação por prefixo aprovava o 403 de
    // `desfazer_conciliacao_manual`, que só ocorre já DENTRO do corpo do alvo.
    const acl = (fn: string, message: string) =>
      evaluate('authenticated', fn, { status: 403, code: '42501', message });

    expect(
      acl('desfazer_conciliacao', 'permission denied for function desfazer_conciliacao_manual')
    ).toBe(false);
    expect(
      acl('confirmar_conciliacao', 'permission denied for function "confirmar_conciliacao_manual"')
    ).toBe(false);
    expect(
      acl('nfe_link_conta_pagar', 'permission denied for function nfe_link_conta_pagar2')
    ).toBe(false);
    expect(
      acl('desfazer_conciliacao_manual', 'permission denied for function desfazer_conciliacao')
    ).toBe(false);
  });

  it('aceita o nome com aspas, em outra caixa ou seguido de pontuação', () => {
    const acl = (fn: string, message: string) =>
      evaluate('anon', fn, { status: 403, code: '42501', message });

    expect(
      acl('desfazer_conciliacao', 'permission denied for function "desfazer_conciliacao"')
    ).toBe(true);
    expect(
      acl('desfazer_conciliacao', 'Permission denied for function DESFAZER_CONCILIACAO.')
    ).toBe(true);
    expect(acl('Desfazer_Conciliacao', 'permission denied for function desfazer_conciliacao')).toBe(
      true
    );
  });

  it('rejeita qualquer resposta que indique execução ou erro fora da ACL', () => {
    for (const role of ['anon', 'authenticated'] as const) {
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 200 })).toBe(false);
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 204 })).toBe(false);
      expect(
        evaluate(role, 'nfe_link_conta_pagar', {
          status: 400,
          code: 'P0001',
          message: 'nfe inválida',
        })
      ).toBe(false);
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 500, code: 'XX000' })).toBe(false);
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 404 })).toBe(false);
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 404, code: 'PGRST116' })).toBe(false);
      expect(evaluate(role, 'nfe_link_conta_pagar', { status: 403, code: '42501' })).toBe(false);
      expect(
        evaluate(role, 'nfe_link_conta_pagar', {
          status: 403,
          message: 'permission denied for function nfe_link_conta_pagar',
        })
      ).toBe(false);
    }
  });
});
