import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { extrairIbscbs } from '../ibscbs.ts';

const FIXTURE = new URL('../../sefaz/__fixtures__/procNFe-ibscbs-2026.xml', import.meta.url);
const RESN = new URL('../../sefaz/__fixtures__/resNFe-resumo.xml', import.meta.url);

const ler = async (u: URL) => await Deno.readTextFile(u);

Deno.test('procNFe completo extrai item com CST, cClassTrib e CBS destacada', async () => {
  const nota = extrairIbscbs(await ler(FIXTURE));
  assert(nota, 'deveria reconhecer a nota completa');
  assertEquals(nota.itens.length, 1);
  const item = nota.itens[0];
  assertEquals(item.nItem, 1);
  assertEquals(item.cst, '200');
  assertEquals(item.cClassTrib, '000123');
  assertEquals(item.vBC, 100);
  assertEquals(item.vIBSUF, 5.65);
  assertEquals(item.vIBSMun, 5);
  assertEquals(item.vCBS, 9);
  assertEquals(item.vIBS, 10.65);
});

Deno.test('procNFe completo extrai o grupo IS do item', async () => {
  const nota = extrairIbscbs(await ler(FIXTURE))!;
  assertEquals(nota.itens[0].cstIs, '200');
  assertEquals(nota.itens[0].cClassTribIs, '000123');
  assertEquals(nota.itens[0].vIS, 1);
});

Deno.test('procNFe completo extrai os totais do grupo', async () => {
  const nota = extrairIbscbs(await ler(FIXTURE))!;
  assertEquals(nota.totais.vBCIBSCBS, 100);
  assertEquals(nota.totais.vIBS, 10.65);
  assertEquals(nota.totais.vIBSUF, 5.65);
  assertEquals(nota.totais.vIBSMun, 5);
});

Deno.test('resNFe (resumo) nao produz grupo IBS/CBS nem credito', async () => {
  const xml = await ler(RESN);
  assertEquals(extrairIbscbs(xml), null);
});

Deno.test('nota sem grupo IBSCBS devolve lista de itens vazia', () => {
  const xml =
    '<nfeProc><NFe><infNFe Id="NFe1">' +
    '<det nItem="1"><prod><NCM>12345678</NCM></prod>' +
    '<imposto><ICMS><CST>00</CST></ICMS></imposto></det>' +
    '<total><ICMSTot><vNF>10.00</vNF></ICMSTot></total>' +
    '</infNFe></NFe></nfeProc>';
  const nota = extrairIbscbs(xml)!;
  assertEquals(nota.itens.length, 0);
  assertEquals(nota.totais.vCBS, undefined);
});

Deno.test('XML que nao e NF-e completa devolve null', () => {
  assertEquals(extrairIbscbs('<resNFe><chNFe>1</chNFe></resNFe>'), null);
  assertEquals(extrairIbscbs('lixo'), null);
});
