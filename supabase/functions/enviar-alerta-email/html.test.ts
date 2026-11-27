import { assertEquals } from 'jsr:@std/assert@1';
import { assuntoSeguro, escaparHtml, textoParaHtml } from './html.ts';

Deno.test('escaparHtml neutraliza a marcação do template', () => {
  assertEquals(escaparHtml('<b>Oi</b> & "aspas"'), '&lt;b&gt;Oi&lt;/b&gt; &amp; &quot;aspas&quot;');
});

Deno.test('textoParaHtml preserva as quebras de linha do template', () => {
  assertEquals(textoParaHtml('linha 1\nlinha 2'), 'linha 1<br />linha 2');
  assertEquals(textoParaHtml('a\r\nb\rc'), 'a<br />b<br />c');
});

Deno.test('assuntoSeguro mantém o nome entre < e > e corta CR/LF', () => {
  assertEquals(
    assuntoSeguro('Aviso de vencimento <Maria Souza> — R$ 150,00'),
    'Aviso de vencimento <Maria Souza> — R$ 150,00'
  );
  assertEquals(
    assuntoSeguro('Nota urgente\r\nBcc: outro@exemplo.com'),
    'Nota urgente Bcc: outro@exemplo.com'
  );
});
