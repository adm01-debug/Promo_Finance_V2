import { describe, it, expect } from 'vitest';
import {
  chaveDaDivergencia,
  mesclarPendentes,
  type DivergenciaPendente,
} from '../divergencias-pendentes';

const pendente = (
  empresaId: string,
  transacao: Partial<DivergenciaPendente['transacao']> & { id: string }
): DivergenciaPendente => ({
  empresaId,
  transacao: {
    tipo: 'credito',
    data: new Date('2026-04-20T00:00:00'),
    valor: 999,
    descricao: 'PIX SEM PAR',
    ...transacao,
  } as DivergenciaPendente['transacao'],
});

describe('chaveDaDivergencia', () => {
  it('ignora a posição no arquivo quando o banco manda a referência do crédito', () => {
    const primeira = pendente('emp-1', { id: 'ofx-789-0', numeroReferencia: '789' });
    const terceira = pendente('emp-1', { id: 'ofx-789-3', numeroReferencia: '789' });

    expect(chaveDaDivergencia(primeira)).toBe(chaveDaDivergencia(terceira));
  });

  it('cai em data, valor e descrição quando o extrato não traz referência', () => {
    const a = pendente('emp-1', { id: 'csv-1-171', descricao: 'Pix recebido hoje' });
    const b = pendente('emp-1', { id: 'csv-9-998', descricao: 'PIX RECEBIDO HOJE' });

    expect(chaveDaDivergencia(a)).toBe(chaveDaDivergencia(b));
  });

  it('separa créditos de empresas diferentes', () => {
    expect(chaveDaDivergencia(pendente('emp-1', { id: 'tx-1' }))).not.toBe(
      chaveDaDivergencia(pendente('emp-2', { id: 'tx-1' }))
    );
  });
});

describe('mesclarPendentes', () => {
  it('acrescenta as novas sem perder as de lotes anteriores', () => {
    const anteriores = [
      pendente('emp-1', { id: 'tx-a', valor: 1500, descricao: 'TED RECEBIDA' }),
      pendente('emp-1', { id: 'tx-b', valor: 777, descricao: 'PIX SEM PAR 2' }),
    ];
    const novas = [pendente('emp-1', { id: 'tx-c', valor: 888, descricao: 'PIX SEM PAR 3' })];

    expect(mesclarPendentes(anteriores, novas).map((d) => d.transacao.id)).toEqual([
      'tx-a',
      'tx-b',
      'tx-c',
    ]);
  });

  it('mantém pendências de empresas diferentes lado a lado', () => {
    const mescladas = mesclarPendentes(
      [pendente('emp-1', { id: 'tx-a' })],
      [pendente('emp-2', { id: 'tx-a' })]
    );

    expect(mescladas).toHaveLength(2);
    expect(mescladas.map((d) => d.empresaId)).toEqual(['emp-1', 'emp-2']);
  });

  it('não duplica o mesmo crédito reimportado na mesma empresa', () => {
    const mescladas = mesclarPendentes(
      [pendente('emp-1', { id: 'tx-a' })],
      [pendente('emp-1', { id: 'tx-a' }), pendente('emp-1', { id: 'tx-a' })]
    );

    expect(mescladas).toHaveLength(1);
  });

  it('substitui a pendência antiga quando o crédito volta em outro extrato', () => {
    const antiga = pendente('emp-1', { id: 'ofx-999-0', numeroReferencia: '999' });
    const nova = pendente('emp-1', { id: 'ofx-999-6', numeroReferencia: '999' });

    const mescladas = mesclarPendentes([antiga], [nova]);

    // Um único alerta pendente para o crédito, já com a transação do lote atual.
    expect(mescladas).toHaveLength(1);
    expect(mescladas[0].transacao.id).toBe('ofx-999-6');
  });

  it('descarta a pendência antiga quando o alerta do crédito foi gravado agora', () => {
    const antiga = pendente('emp-1', { id: 'ofx-999-0', numeroReferencia: '999' });
    const tentada = pendente('emp-1', { id: 'ofx-999-6', numeroReferencia: '999' });

    // O crédito voltou ao lote, desta vez o insert passou: nada fica pendente.
    expect(mesclarPendentes([antiga], [], [tentada])).toHaveLength(0);
  });
});
