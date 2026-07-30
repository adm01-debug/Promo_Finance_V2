import { describe, it, expect } from 'vitest';
import {
  parsePlanoContasCsv,
  compararCodigos,
  PLANO_CONTAS_CSV_TEMPLATE,
} from '../plano-contas-csv-importer';

const HEADER = 'codigo;descricao;tipo;natureza';

describe('parsePlanoContasCsv — cabeçalho e formato', () => {
  it('rejeita arquivo vazio', () => {
    expect(() => parsePlanoContasCsv('   \n\n')).toThrow(/vazio/i);
  });

  it('rejeita cabeçalho sem colunas obrigatórias', () => {
    expect(() => parsePlanoContasCsv('codigo;descricao')).toThrow(/tipo, natureza/);
  });

  it('aceita "nome" como sinônimo de "descricao"', () => {
    const r = parsePlanoContasCsv('codigo;nome;tipo;natureza\n1;ATIVO;ativo;devedora');
    expect(r.contas[0].descricao).toBe('ATIVO');
  });

  it('detecta separador vírgula e tabulação', () => {
    const virgula = parsePlanoContasCsv('codigo,descricao,tipo,natureza\n1,ATIVO,ativo,devedora');
    const tab = parsePlanoContasCsv('codigo\tdescricao\ttipo\tnatureza\n1\tATIVO\tativo\tdevedora');
    expect(virgula.contas).toHaveLength(1);
    expect(tab.contas).toHaveLength(1);
  });

  it('remove BOM UTF-8 e aspas envolventes', () => {
    const r = parsePlanoContasCsv(`\uFEFF${HEADER}\n"1";"ATIVO";"ativo";"devedora"`);
    expect(r.contas[0].codigo).toBe('1');
    expect(r.contas[0].descricao).toBe('ATIVO');
  });
});

describe('parsePlanoContasCsv — normalização de valores', () => {
  it('normaliza tipo com acento, plural e maiúsculas', () => {
    const r = parsePlanoContasCsv(
      `${HEADER}\n4;Receitas;RECEITAS;credora\n5;Custos;Custos;devedora\n3;PL;patrimônio liquido;credora`,
    );
    expect(r.contas.map((c) => c.tipo)).toEqual(['patrimonio_liquido', 'receita', 'custo']);
  });

  it('aceita D/C e sinônimos como natureza', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1;A;ativo;D\n2;B;passivo;crédito`);
    expect(r.contas.map((c) => c.natureza)).toEqual(['devedora', 'credora']);
  });

  it('rejeita tipo e natureza desconhecidos', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1;A;xpto;devedora\n2;B;ativo;neutra`);
    expect(r.contas).toHaveLength(0);
    expect(r.invalidas.map((i) => i.erro)).toEqual([
      expect.stringContaining('Tipo inválido'),
      expect.stringContaining('Natureza inválida'),
    ]);
  });
});

describe('parsePlanoContasCsv — validação de código', () => {
  it('rejeita código ausente, malformado e duplicado', () => {
    const r = parsePlanoContasCsv(
      `${HEADER}\n;Sem codigo;ativo;devedora\n1.A;Letra;ativo;devedora\n1;Ativo;ativo;devedora\n1;Repetido;ativo;devedora`,
    );
    expect(r.contas).toHaveLength(1);
    expect(r.invalidas).toHaveLength(3);
    expect(r.invalidas[2].erro).toMatch(/duplicado.*linha 4/);
  });

  it('rejeita segmento vazio no código', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1..2;Quebrado;ativo;devedora`);
    expect(r.invalidas[0].erro).toMatch(/apenas números/);
  });

  it('exige descrição', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1;;ativo;devedora`);
    expect(r.invalidas[0].erro).toMatch(/Descrição/);
  });
});

describe('parsePlanoContasCsv — hierarquia', () => {
  const CSV = `${HEADER}
1.1.01;Caixa;ativo;devedora
1;ATIVO;ativo;devedora
1.1;ATIVO CIRCULANTE;ativo;devedora`;

  it('deriva nível e conta superior', () => {
    const r = parsePlanoContasCsv(CSV);
    expect(r.contas.map((c) => [c.codigo, c.nivel, c.codigo_pai])).toEqual([
      ['1', 1, null],
      ['1.1', 2, '1'],
      ['1.1.01', 3, '1.1'],
    ]);
  });

  it('ordena por código hierárquico, não alfabeticamente', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1.10;Dez;ativo;devedora\n1;Raiz;ativo;devedora\n1.2;Dois;ativo;devedora`);
    expect(r.contas.map((c) => c.codigo)).toEqual(['1', '1.2', '1.10']);
  });

  it('rejeita conta órfã (pai ausente no arquivo)', () => {
    const r = parsePlanoContasCsv(`${HEADER}\n1;ATIVO;ativo;devedora\n2.5.9;Órfã;passivo;credora`);
    expect(r.contas.map((c) => c.codigo)).toEqual(['1']);
    expect(r.invalidas[0].erro).toMatch(/Conta superior "2\.5" não existe/);
  });

  it('marca contas sintéticas (com filhas) como não lançáveis', () => {
    const r = parsePlanoContasCsv(CSV);
    const porCodigo = Object.fromEntries(r.contas.map((c) => [c.codigo, c.aceita_lancamento]));
    expect(porCodigo).toEqual({ '1': false, '1.1': false, '1.1.01': true });
  });

  it('respeita aceita_lancamento explícito em contas analíticas', () => {
    const r = parsePlanoContasCsv(
      `${HEADER};aceita_lancamento\n1;ATIVO;ativo;devedora;sim\n1.1;Caixa;ativo;devedora;nao`,
    );
    // "1" tem filha → forçado a false mesmo declarado "sim"
    expect(r.contas.find((c) => c.codigo === '1')?.aceita_lancamento).toBe(false);
    expect(r.contas.find((c) => c.codigo === '1.1')?.aceita_lancamento).toBe(false);
  });

  it('captura código referencial quando presente', () => {
    const r = parsePlanoContasCsv(`${HEADER};codigo_referencial\n1;ATIVO;ativo;devedora;1.01`);
    expect(r.contas[0].codigo_referencial).toBe('1.01');
  });

  it('define codigo_referencial nulo quando a coluna existe mas está vazia', () => {
    const r = parsePlanoContasCsv(`${HEADER};codigo_referencial\n1;ATIVO;ativo;devedora;`);
    expect(r.contas[0].codigo_referencial).toBeNull();
  });
});

describe('compararCodigos', () => {
  it('ordena numericamente por segmento', () => {
    expect(compararCodigos('1.2', '1.10')).toBeLessThan(0);
    expect(compararCodigos('2', '1.99')).toBeGreaterThan(0);
    expect(compararCodigos('1.1', '1.1')).toBe(0);
  });

  it('coloca o pai antes da filha', () => {
    expect(compararCodigos('1', '1.1')).toBeLessThan(0);
  });
});

describe('PLANO_CONTAS_CSV_TEMPLATE', () => {
  it('é um arquivo válido e integralmente aceito pelo parser', () => {
    const r = parsePlanoContasCsv(PLANO_CONTAS_CSV_TEMPLATE);
    expect(r.invalidas).toEqual([]);
    expect(r.contas).toHaveLength(r.totalLinhas);
    expect(r.contas.length).toBeGreaterThanOrEqual(13);
  });

  it('mantém o balanço estrutural: ativo devedor, passivo/PL credores', () => {
    const r = parsePlanoContasCsv(PLANO_CONTAS_CSV_TEMPLATE);
    for (const c of r.contas) {
      if (c.tipo === 'ativo' || c.tipo === 'despesa' || c.tipo === 'custo') {
        expect(c.natureza).toBe('devedora');
      }
      if (c.tipo === 'passivo' || c.tipo === 'patrimonio_liquido' || c.tipo === 'receita') {
        expect(c.natureza).toBe('credora');
      }
    }
  });
});
