import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { buildBloco9 } from './bloco9.ts';
import { reg } from './push-helper.ts';

/**
 * `buildBloco9` é a correção comum aos três emissores SPED (ECD, ECF,
 * EFD-Contribuições): monta o bloco 9 (abertura, um `9900` por tipo de
 * registro com contagem real, fechamento) a partir das linhas já
 * emitidas, no lugar de uma lista de tipos cravada manualmente que
 * nenhuma das três funções mantinha sincronizada com o arquivo real — ver
 * Etapa 40 do plano.
 *
 * Fórmula usada para prever os números abaixo: D = nº de tipos DISTINTOS
 * em `linhasDeDados`. `ordem` (e portanto o nº de linhas `9900`) tem
 * D+3 entradas (os D tipos + '9001'+'9900'+'9990'). O bloco 9 inteiro tem
 * D+5 linhas (1 `9001` + as D+3 linhas `9900` + 1 `9990`).
 */

function entradas9900(bloco9: string[]): Map<string, string> {
  return new Map(
    bloco9
      .filter((l) => l.startsWith('|9900|'))
      .map((l) => {
        const [, , tipo, qtd] = l.split('|');
        return [tipo, qtd] as [string, string];
      })
  );
}

Deno.test('bloco9: um 9900 por tipo distinto, com a contagem real de ocorrências', () => {
  const linhasDeDados = [
    reg('0000', 'X'),
    reg('0001', '0'),
    reg('I050', 'a'),
    reg('I050', 'b'),
    reg('I050', 'c'),
    reg('I990', '4'),
  ];
  const bloco9 = buildBloco9(linhasDeDados);

  assertEquals(bloco9[0], reg('9001', '0'));

  const porTipo = entradas9900(bloco9);
  assertEquals(porTipo.get('0000'), '1');
  assertEquals(porTipo.get('0001'), '1');
  assertEquals(porTipo.get('I050'), '3'); // as três contas
  assertEquals(porTipo.get('I990'), '1');
  assertEquals(porTipo.get('9001'), '1'); // o próprio 9001 também entra
});

Deno.test('bloco9: a linha 9900 do próprio código 9900 conta a si mesma', () => {
  const linhasDeDados = [reg('0000', 'X'), reg('0001', '0')];
  const bloco9 = buildBloco9(linhasDeDados);

  // Tipos: 0000, 0001 (D=2) + 9001 + 9900 + 9990 = 5 linhas 9900.
  const porTipo = entradas9900(bloco9);
  assertEquals(porTipo.size, 5);
  assertEquals(porTipo.get('9900'), '5');
});

Deno.test('bloco9: 9990 fecha o bloco contando 9001 + todos os 9900 + si mesmo', () => {
  const linhasDeDados = [reg('0000', 'X')];
  const bloco9 = buildBloco9(linhasDeDados);
  // D=1 → 4 linhas 9900 (0000,9001,9900,9990). Bloco = 1(9001)+4+1(9990) = 6.
  const ultima = bloco9[bloco9.length - 1];
  assertEquals(ultima, reg('9990', 6));
  assertEquals(bloco9.length, 6);
});

Deno.test('bloco9: arquivo sem nenhuma linha de dados ainda monta um bloco 9 coerente', () => {
  const bloco9 = buildBloco9([]);
  // D=0 → 3 linhas 9900 (9001,9900,9990). Bloco = 1+3+1 = 5.
  assertEquals(bloco9.length, 5);
  assertEquals(bloco9[bloco9.length - 1], reg('9990', 5));
});

Deno.test('bloco9: ordem das linhas 9900 segue a ordem de primeira aparição no arquivo', () => {
  const linhasDeDados = [reg('J005', 'a'), reg('I050', 'x'), reg('I050', 'y'), reg('J005', 'b')];
  const bloco9 = buildBloco9(linhasDeDados);
  const codigos = bloco9.filter((l) => l.startsWith('|9900|')).map((l) => l.split('|')[2]);
  assertEquals(codigos, ['J005', 'I050', '9001', '9900', '9990']);
});
