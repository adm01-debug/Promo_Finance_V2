import { describe, expect, it, vi } from 'vitest';
import { buildManagementCommandGroups } from './commandPaletteManagement';

describe('comandos de criação rápida', () => {
  it('leva a intenção de abrir o formulário até a rota de destino', () => {
    const navigate = vi.fn();
    const grupos = buildManagementCommandGroups(navigate, vi.fn());
    const comandos = grupos.flatMap((grupo) => grupo.items);

    comandos.find((comando) => comando.id === 'nova-receita')?.action();
    comandos.find((comando) => comando.id === 'nova-despesa')?.action();

    expect(navigate).toHaveBeenNthCalledWith(1, '/contas-receber', {
      state: { openNewRecord: true },
    });
    expect(navigate).toHaveBeenNthCalledWith(2, '/contas-pagar', {
      state: { openNewRecord: true },
    });
  });
});
