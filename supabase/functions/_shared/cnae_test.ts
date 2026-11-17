import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  chaveReferenciaInterna,
  porPrefixoMaisEspecifico,
  prefixosCnaeCandidatos,
  regimeParaBenchmark,
} from './cnae.ts';

Deno.test('prefixos cobrem o codigo da empresa, do mais especifico ao mais generico', () => {
  assertEquals(prefixosCnaeCandidatos('4781400'), [
    '4781400',
    '478140',
    '47814',
    '4781',
    '478',
    '47',
  ]);
});

Deno.test('ignora pontuacao do CNAE formatado', () => {
  assertEquals(prefixosCnaeCandidatos('47.81-4/00'), prefixosCnaeCandidatos('4781400'));
});

Deno.test('o seed de 2 digitos CASA (era o defeito)', () => {
  // '10' é o prefixo da Indústria de Alimentos no seed; o filtro antigo pedia
  // '1091%' e nunca encontrava.
  assertEquals(prefixosCnaeCandidatos('1091102').includes('10'), true);
});

Deno.test('CNAE ausente ou curto nao gera candidato', () => {
  assertEquals(prefixosCnaeCandidatos(null), []);
  assertEquals(prefixosCnaeCandidatos(''), []);
  assertEquals(prefixosCnaeCandidatos('4'), []);
});

Deno.test('escolhe o prefixo mais longo, e empate mantem a ordem recebida', () => {
  const linhas = [
    { cnae_prefix: '47', setor: 'Comercio' },
    { cnae_prefix: '4781', setor: 'Vestuario' },
    { cnae_prefix: '47', setor: 'Comercio (vigencia antiga)' },
  ];
  const ordenado = porPrefixoMaisEspecifico(linhas);
  assertEquals(ordenado[0].setor, 'Vestuario');
  assertEquals(ordenado[1].setor, 'Comercio');
});

Deno.test('regime para benchmark usa o vocabulario dos CHECKs do banco', () => {
  assertEquals(regimeParaBenchmark('simples_nacional'), 'simples_nacional');
  assertEquals(regimeParaBenchmark('lucro_presumido'), 'lucro_presumido');
  // rotulo curto antigo: o CHECK proibe, entao traduz
  assertEquals(regimeParaBenchmark('simples'), 'simples_nacional');
  assertEquals(regimeParaBenchmark('presumido'), 'lucro_presumido');
  assertEquals(regimeParaBenchmark('real'), 'lucro_real');
  // empresa sem regime: null, para nao consultar com valor impossivel
  assertEquals(regimeParaBenchmark(null), null);
  assertEquals(regimeParaBenchmark('inventado'), null);
});

Deno.test('faixa de referencia interna mapeia do canonico para o rotulo curto', () => {
  assertEquals(chaveReferenciaInterna('simples_nacional'), 'simples');
  assertEquals(chaveReferenciaInterna('mei'), 'simples');
  assertEquals(chaveReferenciaInterna('lucro_presumido'), 'presumido');
  assertEquals(chaveReferenciaInterna('lucro_real'), 'real');
  assertEquals(chaveReferenciaInterna('arbitrado'), 'real');
  assertEquals(chaveReferenciaInterna(null), 'simples');
});
