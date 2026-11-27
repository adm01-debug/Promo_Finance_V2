import { assertEquals } from 'jsr:@std/assert@1';
import {
  avaliarAlertas,
  bloqueioParaAprovarComLimite,
  destinoDoLimiteVinculo,
  escolherCadastroDoCnpj,
  filtroCnpjCliente,
  formatarCnpj,
  mesesDesde,
  normalizarCnpj,
  vinculoDesatualizado,
} from './regras.ts';

const HOJE = new Date('2026-11-26T12:00:00Z');

Deno.test('sem dados do CNPJ.já: alerta crítico de CNPJ ausente', () => {
  const alertas = avaliarAlertas(null, 1000, HOJE);
  assertEquals(
    alertas.map((a) => a.codigo),
    ['cnpj_ausente']
  );
  assertEquals(alertas[0].nivel, 'critico');
});

Deno.test('empresa ativa, antiga, capital maior que o pedido: sem alertas', () => {
  const alertas = avaliarAlertas(
    {
      situacaoCadastral: 'Ativa',
      dataAbertura: '2015-03-10',
      capitalSocial: 100000,
      meiOptante: false,
    },
    25000,
    HOJE
  );
  assertEquals(alertas, []);
});

Deno.test('baixada, recente, MEI e capital menor que o pedido acumulam alertas', () => {
  const alertas = avaliarAlertas(
    {
      situacaoCadastral: 'Baixada',
      dataAbertura: '2026-06-01',
      capitalSocial: 5000,
      meiOptante: true,
    },
    12000,
    HOJE
  );
  assertEquals(
    alertas.map((a) => a.codigo),
    ['situacao_cadastral', 'empresa_recente', 'mei', 'capital_menor_que_pedido']
  );
  assertEquals(alertas[0].nivel, 'critico');
});

Deno.test('mesesDesde conta meses completos', () => {
  assertEquals(mesesDesde('2025-11-26T12:00:00Z', HOJE), 12);
  assertEquals(mesesDesde('2025-11-27T12:00:00Z', HOJE), 11);
  assertEquals(mesesDesde(null, HOJE), null);
  assertEquals(mesesDesde('data-invalida', HOJE), null);
});

Deno.test('normalizarCnpj aceita só 14 dígitos não repetidos', () => {
  assertEquals(normalizarCnpj('12.345.678/0001-95'), '12345678000195');
  assertEquals(normalizarCnpj('123'), null);
  assertEquals(normalizarCnpj('11111111111111'), null);
  assertEquals(normalizarCnpj(null), null);
});

Deno.test('filtro do cadastro casa o CNPJ com e sem máscara', () => {
  assertEquals(formatarCnpj('12345678000195'), '12.345.678/0001-95');
  assertEquals(
    filtroCnpjCliente('12345678000195'),
    'cnpj_cpf.eq."12345678000195",cnpj_cpf.eq."12.345.678/0001-95"'
  );
});

Deno.test('vinculoDesatualizado só descarta vínculo casado pelo CNPJ anterior', () => {
  // Cadastro vinculado pelo CNPJ antigo → precisa ser refeito.
  assertEquals(vinculoDesatualizado('12345678000195', '12345678000195', '98765432000110'), true);
  assertEquals(
    vinculoDesatualizado('12.345.678/0001-95', '12345678000195', '98765432000110'),
    true
  );
  // Vínculo por e-mail (documento diferente) → preservado.
  assertEquals(vinculoDesatualizado('11222333000181', '12345678000195', '98765432000110'), false);
  // Cliente pessoa física → preservado (normalizarCnpj não reconhece CPF).
  assertEquals(vinculoDesatualizado('12345678909', '12345678000195', '98765432000110'), false);
  // Sem mudança de CNPJ, sem CNPJ anterior ou sem CNPJ novo → nada a refazer.
  assertEquals(vinculoDesatualizado('12345678000195', '12345678000195', '12345678000195'), false);
  assertEquals(vinculoDesatualizado('12345678000195', null, '98765432000110'), false);
  assertEquals(vinculoDesatualizado('12345678000195', '12345678000195', null), false);
});

Deno.test('limite no vínculo por e-mail só grava sem documento contrário', () => {
  const empresaA = '11111111-1111-4111-8111-111111111111';
  const empresaB = '22222222-2222-4222-8222-222222222222';
  const base = { empresaAnalise: empresaA, empresaVinculo: empresaA };

  // Cadastro com o mesmo CNPJ da análise → grava.
  assertEquals(
    destinoDoLimiteVinculo({
      ...base,
      cnpjAnalise: '12345678000195',
      documentoVinculo: '12.345.678/0001-95',
    }),
    'gravar'
  );
  // Cadastro sem documento → grava.
  assertEquals(
    destinoDoLimiteVinculo({
      ...base,
      cnpjAnalise: null,
      documentoVinculo: null,
    }),
    'gravar'
  );
  // Cadastro com CNPJ e análise sem CNPJ → conflito (o analista decide).
  assertEquals(
    destinoDoLimiteVinculo({
      ...base,
      cnpjAnalise: null,
      documentoVinculo: '12345678000195',
    }),
    'conflito'
  );
  // Cadastro com outro CNPJ e análise com CNPJ → o limite segue pelo CNPJ.
  assertEquals(
    destinoDoLimiteVinculo({
      ...base,
      cnpjAnalise: '98765432000110',
      documentoVinculo: '12345678000195',
    }),
    'sem_destino'
  );
  // Cadastro de outra empresa → não recebe o limite.
  assertEquals(
    destinoDoLimiteVinculo({
      cnpjAnalise: null,
      documentoVinculo: null,
      empresaAnalise: empresaA,
      empresaVinculo: empresaB,
    }),
    'sem_destino'
  );
  // Vínculo sem empresa (cadastro antigo) → grava.
  assertEquals(
    destinoDoLimiteVinculo({
      cnpjAnalise: null,
      documentoVinculo: null,
      empresaAnalise: empresaA,
      empresaVinculo: null,
    }),
    'gravar'
  );
});

Deno.test('cadastro do CNPJ prefere a empresa da análise', () => {
  const empresaA = '11111111-1111-4111-8111-111111111111';
  const empresaB = '22222222-2222-4222-8222-222222222222';
  const daA = { id: 'cli-a', empresa_id: empresaA };
  const daB = { id: 'cli-b', empresa_id: empresaB };

  // Mesmo CNPJ em duas empresas: fica o cadastro da empresa da análise — em
  // qualquer ordem de retorno e mesmo quando há um terceiro cadastro sem empresa.
  const semEmpresa = { id: 'cli-x', empresa_id: null };
  assertEquals(escolherCadastroDoCnpj([daB, daA], empresaA)?.id, 'cli-a');
  assertEquals(escolherCadastroDoCnpj([daA, daB], empresaB)?.id, 'cli-b');
  assertEquals(escolherCadastroDoCnpj([semEmpresa, daA, daB], empresaA)?.id, 'cli-a');
  // Sem candidato na empresa da análise → primeiro cadastro encontrado.
  assertEquals(escolherCadastroDoCnpj([daB], empresaA)?.id, 'cli-b');
  // Análise sem empresa → primeiro cadastro encontrado.
  assertEquals(escolherCadastroDoCnpj([semEmpresa, daB], null)?.id, 'cli-x');
  // Nenhum cadastro → sem vínculo.
  assertEquals(escolherCadastroDoCnpj([], empresaA), null);
});

Deno.test('aprovar com limite só é liberado quando há destino para gravar', () => {
  // Cobre a decisão de liberar ou recusar ANTES de gravar. A gravação em si é de
  // aplicarLimite, que só escreve quando encontra o cadastro do destino.
  // Com CNPJ na análise: sempre há destino.
  assertEquals(
    bloqueioParaAprovarComLimite({
      cnpjAnalise: '12345678000195',
      clienteId: null,
      documentoVinculo: null,
    }),
    null
  );
  // Sem CNPJ e sem vínculo: recusa (o analista informa o CNPJ ou revincula).
  assertEquals(
    bloqueioParaAprovarComLimite({
      cnpjAnalise: null,
      clienteId: null,
      documentoVinculo: null,
    }),
    'cnpj_necessario_limite'
  );
  // Sem CNPJ e vínculo que guarda outro CNPJ: recusa.
  assertEquals(
    bloqueioParaAprovarComLimite({
      cnpjAnalise: null,
      clienteId: '11111111-1111-4111-8111-111111111111',
      documentoVinculo: '12.345.678/0001-95',
    }),
    'cnpj_necessario_limite'
  );
  // Sem CNPJ e vínculo sem documento: grava no vínculo.
  assertEquals(
    bloqueioParaAprovarComLimite({
      cnpjAnalise: null,
      clienteId: '11111111-1111-4111-8111-111111111111',
      documentoVinculo: null,
    }),
    null
  );
  // Sem CNPJ e vínculo de pessoa física: grava no vínculo.
  assertEquals(
    bloqueioParaAprovarComLimite({
      cnpjAnalise: null,
      clienteId: '11111111-1111-4111-8111-111111111111',
      documentoVinculo: '12345678901',
    }),
    null
  );
});
