import { assertEquals } from 'jsr:@std/assert@1';
import {
  avaliarAlertas,
  filtroCnpjCliente,
  formatarCnpj,
  mesesDesde,
  normalizarCnpj,
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
  assertEquals(mesesDesde('2025-11-26', HOJE), 12);
  assertEquals(mesesDesde('2025-11-27', HOJE), 11);
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
