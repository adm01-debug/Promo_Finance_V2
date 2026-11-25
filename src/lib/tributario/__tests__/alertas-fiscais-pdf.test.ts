import { describe, expect, it } from 'vitest';
import {
  fundamentoEmLinha,
  fundamentosDistintos,
  gerarAlertasFiscaisPdf,
  linhasAlertas,
  type NotaComAlertas,
} from '../relatorio-pdf/alertas-fiscais';

const fundamento = {
  referencia: 'LC 214/2025',
  texto: 'Art. 11. Texto do artigo 11.',
};

const nota = (alertas: NotaComAlertas['alertas']): NotaComAlertas => ({
  numero: '123',
  emitente: 'Fornecedor LTDA',
  data: '01/06/2026',
  alertas,
});

describe('linhasAlertas', () => {
  it('gera uma linha por alerta com nota, regra e fundamento', () => {
    const linhas = linhasAlertas([
      nota([
        { codigo: 'REG-011', campo: 'cClassTrib', mensagem: 'CST\ndivergente', fundamento },
        { codigo: 'REG-012', campo: 'NCM', mensagem: 'NCM ausente' },
      ]),
    ]);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toEqual([
      '123',
      'Fornecedor LTDA',
      '01/06/2026',
      'REG-011',
      'cClassTrib',
      'CST divergente',
      'LC 214/2025 — Art. 11. Texto do artigo 11.',
    ]);
    expect(linhas[1][6]).toBe('—');
  });

  it('sem alerta nao gera linha', () => {
    expect(linhasAlertas([nota([])])).toEqual([]);
  });
});

describe('fundamentoEmLinha', () => {
  it('corta textos longos e mantem o inicio', () => {
    const texto = 'A'.repeat(400);
    const linha = fundamentoEmLinha({ referencia: 'LC 214/2025', texto });
    expect(linha.length).toBe(220);
    expect(linha.endsWith('…')).toBe(true);
  });

  it('usa travessao quando nao ha fundamento', () => {
    expect(fundamentoEmLinha(undefined)).toBe('—');
  });
});

describe('fundamentosDistintos', () => {
  it('deduplica a mesma norma repetida em itens diferentes', () => {
    const r = fundamentosDistintos([
      nota([
        { codigo: 'REG-011', campo: 'cClassTrib', mensagem: 'a', fundamento },
        { codigo: 'REG-013', campo: 'cClassTrib', mensagem: 'b', fundamento },
      ]),
      nota([{ codigo: 'REG-012', campo: 'NCM', mensagem: 'c' }]),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0].referencia).toBe('LC 214/2025');
  });
});

describe('gerarAlertasFiscaisPdf', () => {
  it('gera um PDF com a tabela e a fundamentacao integral', () => {
    const doc = gerarAlertasFiscaisPdf([
      nota([{ codigo: 'REG-011', campo: 'cClassTrib', mensagem: 'CST divergente', fundamento }]),
    ]);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('gera PDF vazio sem alerta e sem fundamento', () => {
    const doc = gerarAlertasFiscaisPdf([nota([])]);
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
