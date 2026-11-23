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

Deno.test('aliquotas saem em fracao decimal, nao em percentual', async () => {
  // O XML traz 11.30 / 5.00 / 9.00. A convencao do sistema (a mesma de
  // src/lib/nfe/parse-ibscbs.ts e das colunas p_* de notas_fiscais_itens) e
  // fracao: guardar 9 no lugar de 0.09 multiplicaria a aliquota por 100.
  const item = extrairIbscbs(await ler(FIXTURE))!.itens[0];
  assertEquals(item.pIBSUF, 0.113);
  assertEquals(item.pIBSMun, 0.05);
  assertEquals(item.pCBS, 0.09);
  assertEquals(item.pIs, 0.01);
});

Deno.test('paridade com o parser do front: mesma escala de aliquota', async () => {
  const item = extrairIbscbs(await ler(FIXTURE))!.itens[0];
  // Os testes de src/lib/nfe/parse-ibscbs.ts esperam exatamente estes valores.
  for (const p of [item.pIBSUF, item.pIBSMun, item.pCBS, item.pIs]) {
    assert(p !== undefined && p < 1, `aliquota deve ser fracao, veio ${p}`);
  }
});

Deno.test('cada tributo tem o proprio gRed de reducao', async () => {
  const item = extrairIbscbs(await ler(FIXTURE))!.itens[0];
  assertEquals(item.gRedUF?.pRedAliq, 0.5);
  assertEquals(item.gRedUF?.pAliqEfet, 0.0565);
  assertEquals(item.gRedMun?.pRedAliq, 0.3);
  assertEquals(item.gRedMun?.pAliqEfet, 0.035);
  assertEquals(item.gRedCBS?.pRedAliq, 0.1);
  assertEquals(item.gRedCBS?.pAliqEfet, 0.081);
});

Deno.test('grupo IS traz base, unidade tributavel e quantidade', async () => {
  const item = extrairIbscbs(await ler(FIXTURE))!.itens[0];
  assertEquals(item.vBCIs, 100);
  // pISEspec e aliquota por valor (R$/unidade), nao percentual: nao divide.
  assertEquals(item.pIsEspec, 0.5);
  assertEquals(item.uTrib, 'UN');
  assertEquals(item.qTrib, 100);
});

Deno.test('gRed ausente nao vira reducao zerada', () => {
  const xml =
    '<nfeProc><NFe><infNFe Id="NFe1">' +
    '<det nItem="1"><imposto><IBSCBS><CST>200</CST><gIBSCBS><vBC>100.00</vBC>' +
    '<gIBSUF><pIBSUF>11.30</pIBSUF><vIBSUF>5.65</vIBSUF></gIBSUF>' +
    '</gIBSCBS></IBSCBS></imposto></det>' +
    '</infNFe></NFe></nfeProc>';
  const item = extrairIbscbs(xml)!.itens[0];
  assertEquals(item.pIBSUF, 0.113);
  assertEquals(item.gRedUF, undefined);
  assertEquals(item.gRedMun, undefined);
  assertEquals(item.gRedCBS, undefined);
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
