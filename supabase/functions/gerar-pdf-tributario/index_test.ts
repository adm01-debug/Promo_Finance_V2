/**
 * A memória de cálculo IBS/CBS do PDF (etapa 94) afirma qual regra de crédito
 * produziu os números. O texto sai por `doc.text()` e o buffer do jspdf não é
 * legível (streams comprimidos), então a guarda é sobre a fonte da função: se
 * alguém reescrever a nota, o teste quebra antes de o PDF voltar a afirmar algo
 * que a apuração não faz.
 */
import { assert, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const FONTE = await Deno.readTextFile(new URL('./index.ts', import.meta.url));

Deno.test('nota de crédito do PDF diz a regra e onde o crédito estimado aparece', () => {
  assertStringIncludes(FONTE, 'Crédito estimado por alíquota não entra neste total');
  assertStringIncludes(FONTE, 'aba Créditos do painel da Reforma Tributária');
  assertStringIncludes(FONTE, 'origem = xml_destacado e efeito_tributario = true');
});

Deno.test('nota de crédito do PDF não volta a somar a estimativa no total', () => {
  assert(
    !/ou de estimativa por alíquota/.test(FONTE),
    'a nota não pode voltar à redação que contradizia o rodapé da própria página'
  );
});

Deno.test('memória de cálculo avisa das apurações anteriores à regra por origem', () => {
  assertStringIncludes(FONTE, 'antes de 23/11/2026');
});
