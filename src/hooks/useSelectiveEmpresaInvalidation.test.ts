import { describe, expect, it } from 'vitest';
import {
  RAIZES_AGNOSTICAS_A_EMPRESA,
  deveRemoverNaTrocaDeEmpresa,
} from './useSelectiveEmpresaInvalidation';

describe('deveRemoverNaTrocaDeEmpresa', () => {
  it('remove queries escopadas por empresa', () => {
    expect(deveRemoverNaTrocaDeEmpresa(['contas-pagar', 'list'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['views', 'fluxo-caixa', 'uuid'])).toBe(true);
  });

  it('remove chaves que a heurística antiga deixava passar', () => {
    // Nenhuma destas contém "empresa" nem o UUID trocado: eram justamente
    // os casos em que o cache servia dados do tenant anterior.
    expect(deveRemoverNaTrocaDeEmpresa(['centros_custo', 'all'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['auditoria-ia'])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa(['categorias'])).toBe(true);
  });

  it('preserva identidade do usuário e catálogos nacionais', () => {
    expect(deveRemoverNaTrocaDeEmpresa(['user-empresas'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['empresas'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['bancos'])).toBe(false);
    expect(deveRemoverNaTrocaDeEmpresa(['glossario-tributario'])).toBe(false);
  });

  it('é fail-closed para chaves sem raiz string', () => {
    expect(deveRemoverNaTrocaDeEmpresa([{ empresa_id: 'x' }])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa([])).toBe(true);
    expect(deveRemoverNaTrocaDeEmpresa([123])).toBe(true);
  });

  it('mantém user-empresas na allowlist (fonte da própria troca)', () => {
    // Guarda de regressão: removê-la derruba o EmpresaGuard para loading.
    expect(RAIZES_AGNOSTICAS_A_EMPRESA.has('user-empresas')).toBe(true);
  });
});
