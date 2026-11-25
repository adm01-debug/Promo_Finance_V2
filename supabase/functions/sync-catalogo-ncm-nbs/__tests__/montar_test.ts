/**
 * Etapa 80 — mapeamento das listas NCM/NBS para `catalogo_ncm` / `catalogo_nbs`
 * e guardas do cliente da API de dados abertos.
 *
 * O caro de errar aqui nao e o transporte, e o conteudo: um codigo gravado com
 * descricao suposta aparece para o usuario, e um encerramento de vigencia
 * indevido faz o validador acusar REG-012 em nota correta. Os casos abaixo
 * fixam exatamente esses pontos.
 */
import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import {
  buscarDadosAbertos,
  compararVersao,
  decidirEncerramentos,
  normalizarData,
  VIGENCIA_BASE_CATALOGO,
} from '../../_shared/rfb-dados-abertos.ts';
import { MIN_NBS_API, MIN_NCM_API, montarNbs, montarNcms } from '../montar.ts';

Deno.test('montarNcms grava so NCM de 8 digitos e mantem a vigencia base', () => {
  const m = montarNcms([
    { ncm: '22030000', descricao: 'Bebidas nao alcoolicas' },
    { ncm: '1012100', descricao: 'Codigo de 7 digitos - nao e NCM' },
    { ncm: '85.17', descricao: 'Formatado com pontos' },
    { ncm: '27101100', descricao: '  ' },
  ]);

  assertEquals(m.linhas.length, 1);
  assertEquals(m.linhas[0], {
    ncm: '22030000',
    descricao: 'Bebidas nao alcoolicas',
    inicio_vigencia: VIGENCIA_BASE_CATALOGO,
    fim_vigencia: null,
  });
  // Codigo publicado sem descricao continua na Receita: entra em `presentes`
  // (logo nao pode ser encerrado) e nao vira linha.
  assertEquals(m.presentes.includes('27101100'), true);
  assertEquals(m.ignoradas.sort(), ['1012100', '27101100', '85.17']);
});

Deno.test('montarNcms usa a descricao da ocorrencia util quando a primeira vem vazia', () => {
  const m = montarNcms([
    { ncm: '22030000', descricao: '' },
    { ncm: '22030000', descricao: 'Bebidas nao alcoolicas' },
    { ncm: '22030000', descricao: 'duplicata' },
  ]);

  assertEquals(m.linhas.length, 1);
  assertEquals(m.linhas[0].descricao, 'Bebidas nao alcoolicas');
  assertEquals(m.presentes, ['22030000']);
  // A duplicata nao gerou linha nem ficou ignorada: ela so foi descartada.
  assertEquals(m.ignoradas, []);
});

Deno.test('montarNcms aceita a chave `codigo` e devolve vazio sem lista', () => {
  assertEquals(montarNcms([{ codigo: '22030000', descricao: 'x' }]).linhas.length, 1);
  assertEquals(montarNcms(null).linhas.length, 0);
  assertEquals(montarNcms([]).presentes, []);
});

Deno.test('montarNbs aceita codigo de 2 a 9 digitos e descarta o resto', () => {
  const m = montarNbs([
    { codigo: '10101', descricao: 'Servicos de construcao' },
    { codigo: '1010100', descricao: 'NBS de 7 digitos' },
    { codigo: 'NBS-X', descricao: 'alfanumerico' },
    { codigo: '1', descricao: 'unico digito' },
  ]);

  assertEquals(
    m.linhas.map((l) => l.nbs),
    ['10101', '1010100']
  );
  assertEquals(m.linhas[0].inicio_vigencia, VIGENCIA_BASE_CATALOGO);
  assertEquals(m.linhas[0].fim_vigencia, null);
  assertEquals(m.presentes, ['10101', '1010100']);
  assertEquals(m.ignoradas, ['NBS-X', '1']);
});

Deno.test('montarNcms respeita uma vigencia de inicio explicita', () => {
  const m = montarNcms([{ ncm: '22030000', descricao: 'x' }], '2027-01-01');
  assertEquals(m.linhas[0].inicio_vigencia, '2027-01-01');
});

Deno.test('decidirEncerramentos bloqueia resposta curta', () => {
  assertEquals(decidirEncerramentos(['22030000'], ['11111111'], MIN_NCM_API), {
    ausentes: ['22030000'],
    bloqueado: true,
    motivo: 'resposta_insuficiente',
  });
  assertEquals(decidirEncerramentos(['22030000'], [], MIN_NBS_API).motivo, 'resposta_insuficiente');
});

Deno.test('decidirEncerramentos bloqueia desaparecimento acima do teto', () => {
  // 20% do universo ausente, com resposta acima do piso (MIN_NBS_API).
  const abertos = Array.from({ length: 100 }, (_, i) => String(1000000 + i));
  const recebidos = abertos
    .slice(0, 80)
    .concat(Array.from({ length: MIN_NBS_API }, (_, i) => String(2000000 + i)));
  const decisao = decidirEncerramentos(abertos, recebidos, MIN_NBS_API);
  assertEquals(decisao.bloqueado, true);
  assertEquals(decisao.motivo, 'ausentes_acima_do_limite');
  assertEquals(decisao.ausentes.length, 20);
});

Deno.test('decidirEncerramentos libera desaparecimento pequeno e catalogo vazio', () => {
  const abertos = Array.from({ length: 2000 }, (_, i) => String(1000000 + i));
  const decisao = decidirEncerramentos(abertos, abertos.slice(0, 1990), MIN_NCM_API);
  assertEquals(decisao.bloqueado, false);
  assertEquals(decisao.ausentes.length, 10);

  // Catalogo local vazio: nada a encerrar, e nao ha o que bloquear.
  const vazio = decidirEncerramentos([], abertos, 1000);
  assertEquals(vazio.bloqueado, false);
  assertEquals(vazio.ausentes, []);
});

Deno.test('buscarDadosAbertos trata HTML 200 do WAF como erro explicito', async () => {
  const waf = (async () =>
    new Response('<html><head><title>Request Rejected</title></head></html>', {
      status: 200,
    })) as unknown as typeof fetch;

  await assertRejects(() => buscarDadosAbertos('versao', waf), Error, 'dados_abertos_nao_json');
});

Deno.test('buscarDadosAbertos propaga o status HTTP e devolve o JSON valido', async () => {
  const erro500 = (async () => new Response('', { status: 500 })) as unknown as typeof fetch;
  await assertRejects(() => buscarDadosAbertos('versao', erro500), Error, 'dados_abertos_http_500');

  const ok = (async () =>
    new Response(JSON.stringify({ versaoDb: 'V0073' }), {
      status: 200,
    })) as unknown as typeof fetch;
  const corpo = await buscarDadosAbertos<{ versaoDb: string }>('versao', ok);
  assertEquals(corpo.versaoDb, 'V0073');
});

Deno.test('normalizarData aceita AAAA-MM-DD e cai para hoje quando malformada', () => {
  const agora = new Date('2026-11-25T15:00:00Z');
  assertEquals(normalizarData('2027-01-01', agora), '2027-01-01');
  assertEquals(normalizarData('01/01/2027', agora), '2026-11-25');
  assertEquals(normalizarData('2027-02-31', agora), '2026-11-25');
  assertEquals(normalizarData(undefined, agora), '2026-11-25');
});

Deno.test('compararVersao compara numericamente e trata ilegivel como anterior', () => {
  assert(compararVersao('V0073', 'V0072') > 0);
  assert(compararVersao('V0072', 'V0073') < 0);
  assertEquals(compararVersao('V0073', 'V0073'), 0);
  assert(compararVersao('', 'V0073') < 0);
});
