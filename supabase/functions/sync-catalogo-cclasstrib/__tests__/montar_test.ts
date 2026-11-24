/**
 * Etapa 79 — mapeamento da API de dados abertos da RFB para a tabela
 * `catalogo_cclasstrib`.
 *
 * O caro de errar aqui nao e o transporte, e o conteudo: um CST suposto ou uma
 * vigencia inventada viram alerta fiscal falso (REG-011 / REG-013) em cima de
 * nota correta. Os casos abaixo fixam exatamente esses dois pontos, com os
 * numeros reais do catalogo oficial (200032 = reducao de 60%, CST 200).
 */
import { assert, assertEquals } from 'jsr:@std/assert@1';
import {
  compararVersao,
  decidirEncerramentos,
  fracaoReducao,
  hojeBrasilia,
  mapearCst,
  montarLinhas,
  normalizarData,
  VIGENCIA_BASE_CATALOGO,
  type ClassificacaoApi,
  type SituacaoApi,
} from '../montar.ts';

const SITUACOES: SituacaoApi[] = [
  {
    codigo: '200',
    descricao: 'Aliquota reduzida',
    classificacoesTributarias: [
      { codigo: '200032', descricao: 'Medicamentos registrados na Anvisa' },
      { codigo: '200002', descricao: 'Produtor rural nao contribuinte' },
    ],
  },
  {
    codigo: '000',
    descricao: 'Tributacao integral',
    classificacoesTributarias: [{ codigo: '000001', descricao: 'Primeiro fornecimento' }],
  },
];

const CLASSIFICACOES: ClassificacaoApi[] = [
  {
    codigo: '200032',
    descricao: 'Fornecimento dos medicamentos registrados na Anvisa',
    percentualReducaoCbs: 60.0,
    percentualReducaoIbsUf: 60.0,
    percentualReducaoIbsMun: 60.0,
  },
  {
    codigo: '000001',
    descricao: 'Primeiro fornecimento a qualquer titulo de bem',
    percentualReducaoCbs: 0,
    percentualReducaoIbsUf: 0,
    percentualReducaoIbsMun: 0,
  },
];

Deno.test('normalizarData — aceita ISO valida e cai para hoje em Brasilia no resto', () => {
  assertEquals(normalizarData('2026-11-24'), '2026-11-24');
  assertEquals(normalizarData(' 2027-01-01 '), '2027-01-01');
  // 30 de fevereiro rola para marco no Date do JS: precisa ser rejeitado.
  assertEquals(normalizarData('2026-02-30'), hojeBrasilia());
  assertEquals(normalizarData(''), hojeBrasilia());
  assertEquals(normalizarData(null), hojeBrasilia());
  assertEquals(normalizarData('24/11/2026'), hojeBrasilia());
  // 23h30 em Brasilia ainda e o dia anterior em UTC.
  assertEquals(normalizarData(undefined, new Date('2026-11-25T02:30:00Z')), '2026-11-24');
});

Deno.test('fracaoReducao — pontos percentuais viram fracao 0-1', () => {
  assertEquals(fracaoReducao(60), 0.6);
  assertEquals(fracaoReducao(100), 1);
  assertEquals(fracaoReducao(33.33), 0.3333);
  assertEquals(fracaoReducao(0), 0);
  assertEquals(fracaoReducao(null), 0);
  assertEquals(fracaoReducao(undefined), 0);
  assertEquals(fracaoReducao('nao-numero'), 0);
  assertEquals(fracaoReducao(-10), 0);
  assertEquals(fracaoReducao(250), 1);
});

Deno.test('mapearCst — junta CST pelas situacoes e descarta codigo em duas situacoes', () => {
  const { porCclasstrib, ambiguas } = mapearCst([
    { codigo: '200', classificacoesTributarias: [{ codigo: '200032' }] },
    { codigo: '000', classificacoesTributarias: [{ codigo: '200032' }] },
    { codigo: '400', classificacoesTributarias: [{ codigo: '400001' }, { codigo: 'invalido' }] },
    { codigo: '8', classificacoesTributarias: [{ codigo: '800001' }] },
  ]);
  assertEquals(porCclasstrib.get('400001'), '400');
  assertEquals(porCclasstrib.has('200032'), false);
  assertEquals(porCclasstrib.has('800001'), false);
  assertEquals(porCclasstrib.has('invalido'), false);
  assertEquals(ambiguas, ['200032']);
});

Deno.test('montarLinhas — grava vigencia do catalogo e fracao, sem CST suposto', () => {
  const { linhas, sem_cst, ignoradas, ambiguas } = montarLinhas(
    [
      ...CLASSIFICACOES,
      { codigo: '900001', descricao: 'Sem situacao que a reivindique' },
      { codigo: '200032', descricao: 'Repetida na resposta' },
      { codigo: 'ABC', descricao: 'Codigo invalido' },
      { codigo: '200099', descricao: '   ' },
    ],
    SITUACOES,
    'V0073'
  );

  assertEquals(
    linhas.map((l) => l.cclasstrib),
    ['200032', '000001']
  );
  const medicamento = linhas.find((l) => l.cclasstrib === '200032')!;
  assertEquals(medicamento.cst, '200');
  assertEquals(medicamento.p_red_cbs, 0.6);
  assertEquals(medicamento.p_red_ibs_uf, 0.6);
  assertEquals(medicamento.p_red_ibs_mun, 0.6);
  assertEquals(medicamento.versao_it, 'V0073');
  assertEquals(medicamento.inicio_vigencia, VIGENCIA_BASE_CATALOGO);
  assertEquals(medicamento.fim_vigencia, null);
  assertEquals(linhas.find((l) => l.cclasstrib === '000001')!.p_red_cbs, 0);

  assertEquals(sem_cst, ['900001']);
  assertEquals(ignoradas, ['200032', 'ABC', '200099']);
  assertEquals(ambiguas, []);

  // `exige_gibscbs` e `ind_dir` nao entram no payload: a API nao os publica e
  // o upsert atualiza exatamente as colunas enviadas — incluir um deles aqui
  // zeraria em producao o valor semeado a partir do banco oficial.
  assertEquals(Object.keys(medicamento).sort(), [
    'cclasstrib',
    'cst',
    'descricao',
    'fim_vigencia',
    'inicio_vigencia',
    'p_red_cbs',
    'p_red_ibs_mun',
    'p_red_ibs_uf',
    'versao_it',
  ]);
});

Deno.test('montarLinhas — lista vazia nao inventa linha', () => {
  const { linhas, sem_cst } = montarLinhas([], [], 'V0073');
  assertEquals(linhas.length, 0);
  assertEquals(sem_cst, []);
});

Deno.test('decidirEncerramentos — encerra o que sumiu dentro do limite', () => {
  const abertos = Array.from({ length: 170 }, (_, i) => String(100000 + i));
  const recebidos = abertos.slice(0, 165);
  const decisao = decidirEncerramentos(abertos, recebidos, '2026-11-24');
  assert(!decisao.bloqueado);
  assertEquals(decisao.encerrar.length, 5);
  assertEquals(decisao.encerrar[0].fim_vigencia, '2026-11-24');
  assertEquals(decisao.ausentes.length, 5);
});

Deno.test('decidirEncerramentos — nao encerra nada com resposta curta ou sumico grande', () => {
  const abertos = Array.from({ length: 170 }, (_, i) => String(100000 + i));

  // API devolveu 99 codigos: falha parcial, nao extincao de catalogo.
  const curta = decidirEncerramentos(abertos, abertos.slice(0, 99), '2026-11-24');
  assertEquals(curta.bloqueado, true);
  assertEquals(curta.motivo, 'resposta_insuficiente');
  assertEquals(curta.encerrar, []);

  // 150 de 170 presentes: 11,7% fora do limite.
  const sumico = decidirEncerramentos(abertos, abertos.slice(0, 150), '2026-11-24');
  assertEquals(sumico.bloqueado, true);
  assertEquals(sumico.motivo, 'ausentes_acima_do_limite');
  assertEquals(sumico.encerrar, []);
  assertEquals(sumico.ausentes.length, 20);

  // Catalogo local vazio: nada a encerrar e nada a bloquear.
  const vazio = decidirEncerramentos([], abertos, '2026-11-24');
  assertEquals(vazio.bloqueado, false);
  assertEquals(vazio.encerrar, []);
});

Deno.test('compararVersao — V0073 depois de V0072 e antes de V0080', () => {
  assert(compararVersao('V0073', 'V0072') > 0);
  assert(compararVersao('V0073', 'V0073') === 0);
  assert(compararVersao('V0072', 'V0073') < 0);
  assert(compararVersao('V0073', 'V0100') < 0);
  assertEquals(compararVersao('', 'V0073'), -73);
  assertEquals(compararVersao(null, undefined), 0);
});
