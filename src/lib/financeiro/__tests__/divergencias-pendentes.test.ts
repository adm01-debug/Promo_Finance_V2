import { describe, it, expect } from 'vitest';
import type { ExtratoOFX } from '@/lib/ofx-parser';
import {
  chaveBancaria,
  mesclarPendentes,
  origemCompativelComCadastro,
  origemDaTransacao,
  origemDoExtrato,
  type DivergenciaPendente,
} from '../divergencias-pendentes';

const BB = '001/1234/5678';
const ITAU = '341/9999/1111';

const pendente = (
  empresaId: string,
  transacao: Partial<DivergenciaPendente['transacao']> & { id: string },
  origemConta: string | null = null
): DivergenciaPendente => ({
  empresaId,
  origemConta,
  transacao: {
    tipo: 'credito',
    data: new Date('2026-04-20T00:00:00'),
    valor: 999,
    descricao: 'PIX SEM PAR',
    ...transacao,
  } as DivergenciaPendente['transacao'],
});

const pix = (empresaId: string, id: string, referencia?: string, origemConta?: string) =>
  pendente(
    empresaId,
    { id, descricao: 'PIX RECEBIDO', valor: 100, numeroReferencia: referencia },
    origemConta ?? null
  );

const extrato = (conta: Partial<ExtratoOFX['conta']>): ExtratoOFX => ({
  conta: {
    banco: '001',
    agencia: '1234',
    conta: '5678',
    tipoConta: 'checking',
    moeda: 'BRL',
    ...conta,
  },
  transacoes: [],
  dataImportacao: new Date('2026-04-21T00:00:00'),
  nomeArquivo: 'retorno.ofx',
  formato: 'OFX',
});

describe('origemDoExtrato', () => {
  it('usa banco, agência e conta do arquivo como identidade', () => {
    expect(origemDoExtrato(extrato({}))).toBe(BB);
  });

  it('devolve null quando o arquivo não traz o número da conta', () => {
    // CSV e Excel só rotulam o banco ("Importado via CSV"), sem ACCTID.
    expect(
      origemDoExtrato(extrato({ banco: 'Importado via CSV', agencia: '', conta: '' }))
    ).toBeNull();
  });
});

describe('origemDaTransacao', () => {
  it('prefere a conta do bloco que emitiu a transação', () => {
    const transacao = { ...pix('emp-1', 'ofx-123-1', '123', ITAU).transacao, origemConta: ITAU };

    expect(origemDaTransacao(transacao)).toBe(ITAU);
  });

  it('devolve null quando a transação veio de arquivo sem conta declarada', () => {
    expect(origemDaTransacao(pix('emp-1', 'csv-1-1').transacao)).toBeNull();
  });
});

describe('chaveBancaria', () => {
  it('ignora a posição no arquivo quando o banco manda a referência do crédito', () => {
    const primeira = chaveBancaria(pix('emp-1', 'ofx-789-0', '789', BB));

    expect(primeira).not.toBeNull();
    expect(primeira).toBe(chaveBancaria(pix('emp-1', 'ofx-789-3', '789', BB)));
  });

  it('não muda a identidade quando o destino do lote é outro', () => {
    // O destino é onde o lançamento é registrado; a identidade vem do arquivo,
    // então trocar a conta de destino entre importações não cria um crédito novo.
    const comDestino = (destino: string, id: string) =>
      chaveBancaria({
        empresaId: 'emp-1',
        origemConta: BB,
        transacao: { ...pix('emp-1', id, '789', BB).transacao, conta_bancaria_id: destino },
      });

    expect(comDestino('cb-1', 'ofx-789-0')).toBe(comDestino('cb-2', 'ofx-789-3'));
  });

  it('separa créditos de empresas e contas diferentes', () => {
    const base = chaveBancaria(pix('emp-1', 'tx-1', '789', BB));
    expect(base).not.toBe(chaveBancaria(pix('emp-2', 'tx-1', '789', BB)));
    expect(base).not.toBe(chaveBancaria(pix('emp-1', 'tx-1', '789', ITAU)));
  });

  it('não inventa identidade quando o extrato não traz referência', () => {
    // CSV: duas linhas iguais no mesmo dia são dois lançamentos, não um.
    expect(chaveBancaria(pix('emp-1', 'csv-1-171'))).toBeNull();
    expect(chaveBancaria(pix('emp-1', 'csv-9-998'))).toBeNull();
  });

  it('não inventa identidade quando a conta de origem é desconhecida', () => {
    // O FITID só é único dentro da conta: sem ela, o mesmo número pode ser de
    // outro crédito, de outra conta da mesma empresa.
    expect(chaveBancaria(pix('emp-1', 'ofx-789-0', '789'))).toBeNull();
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
      [pix('emp-1', 'tx-a', '789', BB)],
      [pix('emp-2', 'tx-a', '789', BB)]
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

  it('não substitui a pendência quando a conta de origem é desconhecida', () => {
    const mescladas = mesclarPendentes(
      [pix('emp-1', 'ofx-999-0', '999')],
      [pix('emp-1', 'ofx-999-6', '999')]
    );

    // Sem conta não há como provar que é o mesmo crédito: preservar as duas é
    // melhor do que apagar o alerta de um lançamento distinto.
    expect(mescladas).toHaveLength(2);
  });

  it('mantém pendências de contas diferentes com a mesma referência do banco', () => {
    const mescladas = mesclarPendentes(
      [pix('emp-1', 'ofx-1-0', '123', BB)],
      [pix('emp-1', 'ofx-1-6', '123', ITAU)]
    );

    // FITID 123 na conta A e FITID 123 na conta B são dois créditos.
    expect(mescladas).toHaveLength(2);
  });

  it('substitui a pendência antiga quando o crédito volta com a mesma referência', () => {
    const antiga = pix('emp-1', 'ofx-999-0', '999', BB);
    const nova = pix('emp-1', 'ofx-999-6', '999', BB);

    const mescladas = mesclarPendentes([antiga], [nova]);

    // Um único alerta pendente para o crédito, já com a transação do lote atual.
    expect(mescladas).toHaveLength(1);
    expect(mescladas[0].transacao.id).toBe('ofx-999-6');
  });

  it('descarta a pendência antiga quando o alerta do crédito foi gravado agora', () => {
    const antiga = pix('emp-1', 'ofx-999-0', '999', BB);
    const tentada = pix('emp-1', 'ofx-999-6', '999', BB);

    // O crédito voltou ao lote, desta vez o insert passou: nada fica pendente.
    expect(mesclarPendentes([antiga], [], [tentada])).toHaveLength(0);
  });
});

describe('origemCompativelComCadastro', () => {
  it('reconhece a mesma conta quando o cadastro traz o dígito verificador', () => {
    expect(origemCompativelComCadastro(BB, { conta: '00005678-9' })).toBe(true);
    expect(origemCompativelComCadastro(ITAU, { conta: '1111' })).toBe(true);
  });

  it('recusa a conta cadastrada de outro número', () => {
    // Crédito entrou no BB, destino escolhido foi o Itaú.
    expect(origemCompativelComCadastro(BB, { conta: '1111', numero_conta: '1111' })).toBe(false);
    expect(origemCompativelComCadastro(ITAU, { conta: '5678' })).toBe(false);
  });

  it('usa o código do banco quando o cadastro não tem o número da conta', () => {
    expect(origemCompativelComCadastro(BB, { codigo_banco: '001' })).toBe(true);
    expect(origemCompativelComCadastro(BB, { codigo_banco: '341' })).toBe(false);
  });

  it('não decide quando falta número de conta e código de banco', () => {
    expect(origemCompativelComCadastro(BB, {})).toBeNull();
    expect(origemCompativelComCadastro(BB, undefined)).toBeNull();
    expect(origemCompativelComCadastro(null, { conta: '5678' })).toBeNull();
    // Número curto demais para provar identidade (evita bloquear por coincidência).
    expect(origemCompativelComCadastro('001/1234/12', { conta: '345' })).toBeNull();
  });
});
