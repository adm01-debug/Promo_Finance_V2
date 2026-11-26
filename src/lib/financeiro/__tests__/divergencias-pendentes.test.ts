import { describe, it, expect } from 'vitest';
import { mesclarPendentes, type DivergenciaPendente } from '../divergencias-pendentes';

const pendente = (empresaId: string, id: string): DivergenciaPendente => ({
  empresaId,
  transacao: { id } as DivergenciaPendente['transacao'],
});

describe('mesclarPendentes', () => {
  it('acrescenta as novas sem perder as de lotes anteriores', () => {
    const anteriores = [pendente('emp-1', 'tx-a'), pendente('emp-1', 'tx-b')];
    const novas = [pendente('emp-1', 'tx-c')];

    expect(mesclarPendentes(anteriores, novas).map((d) => d.transacao.id)).toEqual([
      'tx-a',
      'tx-b',
      'tx-c',
    ]);
  });

  it('mantém pendências de empresas diferentes lado a lado', () => {
    const mescladas = mesclarPendentes([pendente('emp-1', 'tx-a')], [pendente('emp-2', 'tx-a')]);

    expect(mescladas).toHaveLength(2);
    expect(mescladas.map((d) => d.empresaId)).toEqual(['emp-1', 'emp-2']);
  });

  it('não duplica o mesmo crédito reimportado na mesma empresa', () => {
    const mescladas = mesclarPendentes(
      [pendente('emp-1', 'tx-a')],
      [pendente('emp-1', 'tx-a'), pendente('emp-1', 'tx-a')]
    );

    expect(mescladas).toHaveLength(1);
  });
});
