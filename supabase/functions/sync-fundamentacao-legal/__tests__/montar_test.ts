/**
 * Etapa 82 — mapeamento de `/fundamentacoes-legais` para
 * `catalogo_fundamentacao` e filtro de encerramento por chave composta.
 *
 * O caro de errar aqui nao e o transporte: e gravar fundamento de codigo que nao
 * existe, perder o texto de uma linha repetida ou montar um filtro PostgREST que
 * encerra a vigencia da chave errada. Os casos abaixo fixam esses pontos.
 */
import { assertEquals } from 'jsr:@std/assert@1.0.6';
import { chaveFundamento, filtroAusentes, literalPostgrest, montarFundamentos } from '../montar.ts';

const VIGENCIA = '2026-01-01';

const linha = (over: Record<string, unknown> = {}) => ({
  codigoClassificacaoTributaria: '000001',
  codigoSituacaoTributaria: '000',
  conjuntoTributo: 'CBS e IBS',
  descricaoClassificacaoTributaria: 'Situacoes tributadas integralmente',
  descricaoSituacaoTributaria: 'Tributacao integral',
  referenciaNormativa: 'LC 214/2025, art. 11',
  texto: 'Art. 11. ...',
  textoCurto: 'LC 214/2025',
  ...over,
});

Deno.test('payload fora do contrato vira lista vazia', () => {
  for (const payload of [null, undefined, 'texto', 42, { linhas: [] }]) {
    const m = montarFundamentos(payload, VIGENCIA, 'V0073');
    assertEquals(m.linhas, []);
    assertEquals(m.presentes, []);
    assertEquals(m.agrupadas, 0);
  }
});

Deno.test('linha valida vai para a tabela com vigencia e versao da base', () => {
  const m = montarFundamentos([linha()], VIGENCIA, 'V0073');
  assertEquals(m.linhas.length, 1);
  assertEquals(m.linhas[0], {
    cclasstrib: '000001',
    cst: '000',
    conjunto_tributo: 'CBS e IBS',
    descricao_cclasstrib: 'Situacoes tributadas integralmente',
    descricao_cst: 'Tributacao integral',
    texto: 'Art. 11. ...',
    texto_curto: 'LC 214/2025',
    referencia_normativa: 'LC 214/2025, art. 11',
    inicio_vigencia: VIGENCIA,
    versao_it: 'V0073',
  });
  assertEquals(m.presentes, ['000001|000|CBS e IBS']);
});

Deno.test('codigo fora do formato e descartado, nao gravado', () => {
  const casos = [
    linha({ codigoClassificacaoTributaria: '00001' }),
    linha({ codigoClassificacaoTributaria: 'BBBBBB' }),
    linha({ codigoSituacaoTributaria: '00' }),
    linha({ codigoSituacaoTributaria: '0000' }),
    linha({ conjuntoTributo: '   ' }),
    linha({ conjuntoTributo: null }),
  ];
  const m = montarFundamentos(casos, VIGENCIA, 'V0073');
  assertEquals(m.linhas, []);
  assertEquals(m.presentes, []);
  assertEquals(m.ignoradas.length, casos.length);
});

Deno.test('pontuacao no codigo e normalizada antes da checagem de tamanho', () => {
  const m = montarFundamentos(
    [linha({ codigoClassificacaoTributaria: '0000-01', codigoSituacaoTributaria: '0 0 0' })],
    VIGENCIA,
    'V0073'
  );
  assertEquals(m.linhas[0].cclasstrib, '000001');
  assertEquals(m.linhas[0].cst, '000');
});

Deno.test('texto vazio vira null em vez de string vazia', () => {
  const m = montarFundamentos(
    [linha({ texto: '   ', textoCurto: '', referenciaNormativa: null })],
    VIGENCIA,
    'V0073'
  );
  assertEquals(m.linhas[0].texto, null);
  assertEquals(m.linhas[0].texto_curto, null);
  assertEquals(m.linhas[0].referencia_normativa, null);
});

Deno.test('quebra de linha do texto legal e preservada', () => {
  const m = montarFundamentos([linha({ texto: 'Art. 11.\n§ 1º ...' })], VIGENCIA, 'V0073');
  assertEquals(m.linhas[0].texto, 'Art. 11.\n§ 1º ...');
});

Deno.test('linha nao-objeto e ignorada', () => {
  const m = montarFundamentos([null, 'x', 7, linha()], VIGENCIA, 'V0073');
  assertEquals(m.linhas.length, 1);
  assertEquals(m.ignoradas, ['linha_nao_objeto', 'linha_nao_objeto', 'linha_nao_objeto']);
});

Deno.test('chave repetida funde os textos sem duplicar o mesmo trecho', () => {
  const m = montarFundamentos(
    [
      linha({ texto: 'Art. 11.', textoCurto: 'LC 214/2025', referenciaNormativa: 'LC 214/2025' }),
      linha({ texto: 'Art. 12.', textoCurto: 'LC 214/2025', referenciaNormativa: 'LC 214/2025' }),
      linha({ texto: 'Art. 11.', textoCurto: 'LC 214/2025', referenciaNormativa: 'LC 214/2025' }),
    ],
    VIGENCIA,
    'V0073'
  );
  assertEquals(m.linhas.length, 1);
  assertEquals(m.agrupadas, 2);
  assertEquals(m.linhas[0].texto, 'Art. 11.\n\nArt. 12.');
  assertEquals(m.linhas[0].texto_curto, 'LC 214/2025');
  assertEquals(m.linhas[0].referencia_normativa, 'LC 214/2025');
  assertEquals(m.presentes, ['000001|000|CBS e IBS']);
});

Deno.test('chave inclui o conjunto de tributos', () => {
  const m = montarFundamentos(
    [linha(), linha({ conjuntoTributo: 'CBS' }), linha({ conjuntoTributo: 'IBS' })],
    VIGENCIA,
    'V0073'
  );
  assertEquals(
    new Set(m.presentes),
    new Set(['000001|000|CBS e IBS', '000001|000|CBS', '000001|000|IBS'])
  );
});

Deno.test('literal do PostgREST preserva espaco e neutraliza a sintaxe do filtro', () => {
  assertEquals(literalPostgrest('CBS e IBS'), '"CBS e IBS"');
  assertEquals(literalPostgrest('a,b(c)"d'), '"a b c d"');
});

Deno.test('filtro de encerramento separa as chaves por and', () => {
  assertEquals(
    filtroAusentes([chaveFundamento('000001', '000', 'CBS e IBS')]),
    'and(cclasstrib.eq."000001",cst.eq."000",conjunto_tributo.eq."CBS e IBS")'
  );
  assertEquals(
    filtroAusentes([
      chaveFundamento('000001', '000', 'CBS e IBS'),
      chaveFundamento('000002', '200', 'CBS'),
    ]),
    'and(cclasstrib.eq."000001",cst.eq."000",conjunto_tributo.eq."CBS e IBS"),' +
      'and(cclasstrib.eq."000002",cst.eq."200",conjunto_tributo.eq."CBS")'
  );
  assertEquals(filtroAusentes([]), '');
});

Deno.test('chave com conjunto contendo pipe nao perde o valor', () => {
  const chave = chaveFundamento('000001', '000', 'CBS|IBS');
  assertEquals(
    filtroAusentes([chave]),
    'and(cclasstrib.eq."000001",cst.eq."000",conjunto_tributo.eq."CBS|IBS")'
  );
});
