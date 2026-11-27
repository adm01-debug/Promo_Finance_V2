/**
 * A memória de cálculo IBS/CBS do PDF (etapa 94) afirma qual regra de crédito
 * produziu os números e com qual empresa a aba Créditos abre. O buffer do jspdf
 * não é legível (streams comprimidos), então a emissão da nota é exercitada com
 * um dublê da página — e a fonte é conferida só para garantir que a página da
 * memória de cálculo é quem emite a nota.
 */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { notaCreditoApuracao, renderNotaCreditoApuracao } from './memoria-calculo.ts';

const FONTE = await Deno.readTextFile(new URL('./index.ts', import.meta.url));

Deno.test('a nota de crédito é impressa na página com a regra e o destino do crédito estimado', () => {
  const impressos: string[] = [];
  renderNotaCreditoApuracao({ text: (texto) => impressos.push(texto) }, 'Alfa Ltda');

  assertEquals(impressos.length, 1, 'a nota tem de sair em uma única chamada de doc.text');
  assertStringIncludes(impressos[0], 'origem XML destacado');
  assertStringIncludes(impressos[0], 'Crédito estimado por alíquota não entra neste total');
  assertStringIncludes(impressos[0], 'aba Créditos do painel da Reforma Tributária');
  assertStringIncludes(impressos[0], 'com a empresa Alfa Ltda selecionada');
});

Deno.test('a nota de crédito não volta a somar a estimativa no total', () => {
  assert(
    !/ou de estimativa por alíquota/.test(notaCreditoApuracao('Alfa Ltda')),
    'a nota não pode voltar à redação que contradizia o rodapé da própria página'
  );
});

Deno.test('quem emite a nota é a página da memória de cálculo', () => {
  const titulo = FONTE.indexOf("'Memória de Cálculo IBS/CBS'");
  const rodape = FONTE.indexOf('Base legal: LC 214/2025 arts. 7-11', titulo);
  const pagina = FONTE.slice(FONTE.lastIndexOf('doc.addPage();', titulo), rodape);

  assert(titulo > 0 && rodape > titulo, 'o título ou o rodapé da memória de cálculo sumiu do handler');
  assertStringIncludes(pagina, 'doc.addPage();');
  assertStringIncludes(pagina, 'renderNotaCreditoApuracao(doc, empresaNome);');
  // Nota que sai antes da página existir não chega ao PDF.
  assert(
    pagina.indexOf('doc.addPage();') < pagina.indexOf('renderNotaCreditoApuracao(doc, empresaNome);'),
    'a nota tem de ser emitida depois de a página ser criada'
  );
});

Deno.test('memória de cálculo avisa das apurações anteriores à regra por origem', () => {
  assertStringIncludes(FONTE, 'antes de 23/11/2026');
});
