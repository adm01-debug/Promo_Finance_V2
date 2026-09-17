import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildEcdLinhas } from './layout.ts';
import { ECD_FIXTURE } from './__fixtures__/ecd-fixture.ts';

/**
 * Golden file + invariantes estruturais para o SPED ECD — mesmo raciocínio
 * da Etapa 39 para o motor tributário: golden sozinho não pega regressão
 * fora do cenário fixado, invariante sozinho não pega drift de conteúdo.
 * Os dois juntos cobrem as duas correções da Etapa 40 (posição do `I051`
 * e completude do bloco `9900`) de ângulos diferentes.
 */

const GOLDEN_PATH = new URL('./__fixtures__/ecd-golden.txt', import.meta.url);

Deno.test('gerar-sped-ecd layout: bate com o golden file', async () => {
  const golden = (await Deno.readTextFile(GOLDEN_PATH)).split('\n').filter((l) => l.length > 0);
  const linhas = buildEcdLinhas(ECD_FIXTURE);
  assertEquals(linhas, golden);
});

Deno.test('gerar-sped-ecd layout: cada I051 está imediatamente após o I050 da mesma conta', () => {
  const linhas = buildEcdLinhas(ECD_FIXTURE);
  const contasComRef = ECD_FIXTURE.plano.filter(
    (c) => c.tipo === 'analitica' && c.codigo_referencial
  );
  assert(
    contasComRef.length > 0,
    'fixture precisa ter pelo menos uma conta com codigo_referencial'
  );

  for (const conta of contasComRef) {
    const idxI050 = linhas.findIndex(
      (l) => l.startsWith('|I050|') && l.includes(`|${conta.codigo}|`)
    );
    assert(idxI050 >= 0, `I050 da conta ${conta.codigo} não encontrado`);
    assertEquals(
      linhas[idxI050 + 1],
      `|I051|01||${conta.codigo_referencial}|`,
      `I051 de ${conta.codigo} deveria vir logo após seu I050, não em outro ponto do arquivo`
    );
  }
});

Deno.test('gerar-sped-ecd layout: contas sem código referencial não geram I051', () => {
  const linhas = buildEcdLinhas(ECD_FIXTURE);
  const semRef = ECD_FIXTURE.plano.filter((c) => !(c.tipo === 'analitica' && c.codigo_referencial));
  assert(semRef.length > 0, 'fixture precisa ter pelo menos uma conta sem codigo_referencial');

  for (const conta of semRef) {
    const idxI050 = linhas.findIndex(
      (l) => l.startsWith('|I050|') && l.includes(`|${conta.codigo}|`)
    );
    assert(idxI050 >= 0, `I050 da conta ${conta.codigo} não encontrado`);
    assert(
      !linhas[idxI050 + 1]?.startsWith('|I051|'),
      `conta ${conta.codigo} não deveria ter I051 em seguida`
    );
  }
});

Deno.test(
  'gerar-sped-ecd layout: bloco 9900 lista cada tipo de registro com a contagem real',
  () => {
    const linhas = buildEcdLinhas(ECD_FIXTURE);

    const contagemReal = new Map<string, number>();
    for (const l of linhas) {
      const tipo = l.split('|')[1];
      // '9900' é conferido à parte (linha abaixo); '9999' fecha o ARQUIVO,
      // não o bloco 9, e por isso `buildBloco9` não gera entrada para ele.
      if (tipo && tipo !== '9900' && tipo !== '9999') {
        contagemReal.set(tipo, (contagemReal.get(tipo) ?? 0) + 1);
      }
    }

    const entradas9900 = new Map(
      linhas
        .filter((l) => l.startsWith('|9900|'))
        .map((l) => {
          const [, , tipo, qtd] = l.split('|');
          return [tipo, Number(qtd)] as [string, number];
        })
    );

    for (const [tipo, qtd] of contagemReal) {
      assertEquals(
        entradas9900.get(tipo),
        qtd,
        `9900 deveria contar ${qtd} ocorrência(s) de ${tipo}`
      );
    }
    // A entrada de código '9900' conta a si mesma.
    assertEquals(entradas9900.get('9900'), entradas9900.size);
  }
);

Deno.test('gerar-sped-ecd layout: 9990 e 9999 refletem o total real de linhas', () => {
  const linhas = buildEcdLinhas(ECD_FIXTURE);
  const idx9001 = linhas.indexOf('|9001|0|');
  const linha9990 = linhas.find((l) => l.startsWith('|9990|'))!;
  const linha9999 = linhas.find((l) => l.startsWith('|9999|'))!;
  const idx9990 = linhas.indexOf(linha9990);

  // 9990 = quantidade de linhas do bloco 9 (de 9001 até 9990, inclusive).
  assertEquals(Number(linha9990.split('|')[2]), idx9990 - idx9001 + 1);
  // 9999 = total de linhas do arquivo inteiro, incluindo-se.
  assertEquals(Number(linha9999.split('|')[2]), linhas.length);
});
