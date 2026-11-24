/**
 * Etapa 55 — guardar XML autorizado do Bling.
 *
 * O teste mira as duas funcoes puras que decidem o que vai para o banco:
 * `statusDoProc` (o `cStat` do protocolo e a unica fonte real do status) e
 * `montarNota` (campos NOT NULL de `notas_fiscais`). O handler exige auth e
 * banco reais, entao o que dava para isolar sem infra foi isolado.
 */
import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { montarNota, statusDoProc } from '../index.ts';

const FIXTURES = new URL('../../_shared/sefaz/__fixtures__/', import.meta.url);
const ler = (nome: string) => Deno.readTextFile(new URL(nome, FIXTURES));

Deno.test('statusDoProc — cStat 100 vira autorizada', async () => {
  assertEquals(statusDoProc(await ler('procNFe-ibscbs-2026.xml')), 'autorizada');
});

Deno.test('statusDoProc — 101 cancelada, 110 denegada, ausente pendente', () => {
  assertEquals(statusDoProc('<infProt><cStat>101</cStat></infProt>'), 'cancelada');
  assertEquals(statusDoProc('<infProt><cStat>110</cStat></infProt>'), 'denegada');
  assertEquals(statusDoProc('<NFe/>'), 'pendente');
});

Deno.test('montarNota — XML manda nos campos, Bling so completa o que falta', async () => {
  const xml = await ler('procNFe-ibscbs-2026.xml');
  const nota = montarNota({
    xml,
    userId: '00000000-0000-0000-0000-000000000001',
    bling: {
      numero: '999',
      serie: '9',
      valorNota: 500,
      contato: { nome: 'CLIENTE DO BLING' },
      naturezaOperacao: { descricao: 'VENDA BLING' },
    },
  });

  assertEquals(nota.chave_acesso, '35260712345678000199550010000000011000000023');
  assertEquals(nota.numero, '1');
  assertEquals(nota.serie, '1');
  assertEquals(nota.valor_total, 100);
  assertEquals(nota.status, 'autorizada');
  assertEquals(nota.xml_nfe, xml);
  // NF-e de saida: o cliente da nota e o DESTINATARIO, nao o emitente.
  assertEquals(nota.cliente_nome, 'DESTINATARIO 2026 LTDA');
  assertEquals(nota.cliente_cnpj, '98765432000188');
});

Deno.test('montarNota — sem XML parseavel cai no Bling sem quebrar NOT NULL', () => {
  const nota = montarNota({
    xml: '<lixo/>',
    userId: '00000000-0000-0000-0000-000000000001',
    bling: { numero: 7, valorNota: 42, contato: { nome: 'FULANO' } },
  });
  assertEquals(nota.numero, '7');
  assertEquals(nota.serie, '1');
  assertEquals(nota.valor_total, 42);
  assertEquals(nota.valor_produtos, 42);
  assertEquals(nota.cliente_nome, 'FULANO');
  assertEquals(nota.status, 'pendente');
  assert(typeof nota.natureza_operacao === 'string' && nota.natureza_operacao.length > 0);
});
