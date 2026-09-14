import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildEfdContribuicoesLinhas } from './layout.ts';
import {
  EFD_CONTRIB_COM_CREDITO,
  EFD_CONTRIB_SEM_APURACAO,
  EFD_CONTRIB_SEM_CREDITO,
} from './__fixtures__/efd-contribuicoes-fixture.ts';

/**
 * Golden file + invariantes estruturais para o EFD-Contribuições.
 *
 * O cenário "sem crédito" é o que teria pego o defeito original antes de
 * ir para produção: `M990` era cravado em `5`, que só está certo quando o
 * `M100` condicional está presente. Sem crédito, o bloco M tem 4 registros
 * (M001, M200, M210, M990) e o arquivo antigo mentia sobre a própria
 * contagem — por isso ele ganha asserção própria, não só o golden do
 * cenário "com crédito".
 */

const GOLDEN_COM_CREDITO = new URL(
  './__fixtures__/efd-contribuicoes-com-credito-golden.txt',
  import.meta.url
);

Deno.test('exportar-sped-contribuicoes layout: bate com o golden file (com crédito)', async () => {
  const golden = (await Deno.readTextFile(GOLDEN_COM_CREDITO))
    .split('\n')
    .filter((l) => l.length > 0);
  const linhas = buildEfdContribuicoesLinhas(EFD_CONTRIB_COM_CREDITO);
  assertEquals(linhas, golden);
});

function valorDoRegistro(linhas: string[], tipo: string): string {
  const linha = linhas.find((l) => l.startsWith(`|${tipo}|`));
  if (!linha) throw new Error(`registro ${tipo} não encontrado`);
  return linha.split('|')[2];
}

Deno.test(
  'exportar-sped-contribuicoes layout: M990 conta 5 registros quando M100 está presente',
  () => {
    const linhas = buildEfdContribuicoesLinhas(EFD_CONTRIB_COM_CREDITO);
    assertEquals(
      linhas.some((l) => l.startsWith('|M100|')),
      true,
      'M100 deveria estar presente'
    );
    assertEquals(valorDoRegistro(linhas, 'M990'), '5');
  }
);

Deno.test(
  'exportar-sped-contribuicoes layout: M990 conta 4 registros quando M100 está ausente',
  () => {
    // Este é o caso que o `|M990|5|` cravado errava: sem M100, o bloco M tem
    // M001, M200, M210, M990 — 4 registros, não 5.
    const linhas = buildEfdContribuicoesLinhas(EFD_CONTRIB_SEM_CREDITO);
    assertEquals(
      linhas.some((l) => l.startsWith('|M100|')),
      false,
      'M100 não deveria estar presente'
    );
    assertEquals(valorDoRegistro(linhas, 'M990'), '4');
  }
);

Deno.test(
  'exportar-sped-contribuicoes layout: sem apuração nenhuma (null) não quebra e ainda fecha o bloco M em 4',
  () => {
    const linhas = buildEfdContribuicoesLinhas(EFD_CONTRIB_SEM_APURACAO);
    assertEquals(
      linhas.some((l) => l.startsWith('|M100|')),
      false
    );
    assertEquals(valorDoRegistro(linhas, 'M990'), '4');
  }
);

for (const [nome, fixture] of [
  ['com crédito', EFD_CONTRIB_COM_CREDITO],
  ['sem crédito', EFD_CONTRIB_SEM_CREDITO],
] as const) {
  Deno.test(`exportar-sped-contribuicoes layout: bloco 9900 completo e correto (${nome})`, () => {
    const linhas = buildEfdContribuicoesLinhas(fixture);

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

    // Antes da Etapa 40 este bloco não existia — `entradas9900.size` era 0.
    for (const [tipo, qtd] of contagemReal) {
      assertEquals(
        entradas9900.get(tipo),
        qtd,
        `9900 deveria contar ${qtd} ocorrência(s) de ${tipo}`
      );
    }
    assertEquals(entradas9900.get('9900'), entradas9900.size);

    const idx9001 = linhas.indexOf('|9001|0|');
    const linha9990 = linhas.find((l) => l.startsWith('|9990|'))!;
    const linha9999 = linhas.find((l) => l.startsWith('|9999|'))!;
    assertEquals(Number(linha9990.split('|')[2]), linhas.indexOf(linha9990) - idx9001 + 1);
    assertEquals(Number(linha9999.split('|')[2]), linhas.length);
  });
}
