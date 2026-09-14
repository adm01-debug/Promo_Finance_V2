import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildEcfLinhas } from './layout.ts';
import { ECF_FIXTURE } from './__fixtures__/ecf-fixture.ts';

/**
 * Golden file + invariantes estruturais para o SPED ECF. O ECF não tem o
 * defeito de posicionamento do ECD (`J051` já nasce corretamente agrupado
 * sob o único `J050` do arquivo) — a única correção da Etapa 40 aqui é a
 * completude do bloco `9900`, então os invariantes cobrem só esse ponto.
 */

const GOLDEN_PATH = new URL('./__fixtures__/ecf-golden.txt', import.meta.url);

Deno.test('gerar-sped-ecf layout: bate com o golden file', async () => {
  const golden = (await Deno.readTextFile(GOLDEN_PATH)).split('\n').filter((l) => l.length > 0);
  const linhas = buildEcfLinhas(ECF_FIXTURE);
  assertEquals(linhas, golden);
});

Deno.test(
  'gerar-sped-ecf layout: bloco 9900 lista cada tipo de registro com a contagem real',
  () => {
    const linhas = buildEcfLinhas(ECF_FIXTURE);

    const contagemReal = new Map<string, number>();
    for (const l of linhas) {
      const tipo = l.split('|')[1];
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
    assertEquals(entradas9900.get('9900'), entradas9900.size);
  }
);

Deno.test('gerar-sped-ecf layout: 9990 e 9999 refletem o total real de linhas', () => {
  const linhas = buildEcfLinhas(ECF_FIXTURE);
  const idx9001 = linhas.indexOf('|9001|0|');
  const linha9990 = linhas.find((l) => l.startsWith('|9990|'))!;
  const linha9999 = linhas.find((l) => l.startsWith('|9999|'))!;
  const idx9990 = linhas.indexOf(linha9990);

  assertEquals(Number(linha9990.split('|')[2]), idx9990 - idx9001 + 1);
  assertEquals(Number(linha9999.split('|')[2]), linhas.length);
});

Deno.test('gerar-sped-ecf layout: J051 continua agrupado sob o único J050 do arquivo', () => {
  const linhas = buildEcfLinhas(ECF_FIXTURE);
  const idxJ050 = linhas.indexOf(linhas.find((l) => l.startsWith('|J050|'))!);
  const idxJ100 = linhas.indexOf(linhas.find((l) => l.startsWith('|J100|'))!);
  const entreJ050eJ100 = linhas.slice(idxJ050 + 1, idxJ100);
  // Tudo entre J050 e J100 deve ser J051 — sem defeito de posicionamento
  // aqui, mas o teste fixa essa garantia contra regressão futura.
  for (const l of entreJ050eJ100) {
    assertEquals(l.startsWith('|J051|'), true, `linha inesperada entre J050 e J100: ${l}`);
  }
});
