import { describe, it, expect } from 'vitest';
import {
  chaveBancaria,
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

const pix = (empresaId: string, id: string, referencia?: string, conta?: string) =>
  pendente(empresaId, {
    id,
    descricao: 'PIX RECEBIDO',
    valor: 100,
    numeroReferencia: referencia,
    conta_bancaria_id: conta,
  });

describe('chaveBancaria', () => {
  it('ignora a posição no arquivo quando o banco manda a referência do crédito', () => {
    expect(chaveBancaria(pix('emp-1', 'ofx-789-0', '789'))).toBe(
      chaveBancaria(pix('emp-1', 'ofx-789-3', '789'))
    );
  });

  it('separa créditos de empresas e contas diferentes', () => {
    const base = chaveBancaria(pix('emp-1', 'tx-1', '789', 'cb-1'));
    expect(base).not.toBe(chaveBancaria(pix('emp-2', 'tx-1', '789', 'cb-1')));
    expect(base).not.toBe(chaveBancaria(pix('emp-1', 'tx-1', '789', 'cb-2')));
  });

  it('não inventa identidade quando o extrato não traz referência', () => {
    // CSV: duas linhas iguais no mesmo dia são dois lançamentos, não um.
    expect(chaveBancaria(pix('emp-1', 'csv-1-171'))).toBeNull();
    expect(chaveBancaria(pix('emp-1', 'csv-9-998'))).toBeNull();
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
      [pix('emp-1', 'tx-a', '789')],
      [pix('emp-2', 'tx-a', '789')]
    );

    expect(mescladas).toHaveLength(2);
    expect(mescladas.map((d) => d.empresaId)).toEqual(['emp-1', 'emp-2']);
  });

  it('preserva as ocorrências de um CSV quando as linhas são indistinguíveis', () => {
    const mescladas = mesclarPendentes([], [pix('emp-1', 'csv-1-171'), pix('emp-1', 'csv-2-172')]);

    // Dois PIX de R$ 100,00 no mesmo dia: cada um precisa do seu alerta.
    expect(mescladas).toHaveLength(2);
  });

  it('não apaga a pendência anterior de um crédito sem identidade bancária', () => {
    const mescladas = mesclarPendentes([pix('emp-1', 'csv-1-171')], [pix('emp-1', 'csv-9-998')]);

    expect(mescladas).toHaveLength(2);
  });

  it('substitui a pendência antiga quando o crédito volta com a mesma referência', () => {
    const antiga = pix('emp-1', 'ofx-999-0', '999');
    const nova = pix('emp-1', 'ofx-999-6', '999');

    const mescladas = mesclarPendentes([antiga], [nova]);

    // Um único alerta pendente para o crédito, já com a transação do lote atual.
    expect(mescladas).toHaveLength(1);
    expect(mescladas[0].transacao.id).toBe('ofx-999-6');
  });

  it('descarta a pendência antiga quando o alerta do crédito foi gravado agora', () => {
    const antiga = pix('emp-1', 'ofx-999-0', '999');
    const tentada = pix('emp-1', 'ofx-999-6', '999');

    // O crédito voltou ao lote, desta vez o insert passou: nada fica pendente.
    expect(mesclarPendentes([antiga], [], [tentada])).toHaveLength(0);
  });
});
