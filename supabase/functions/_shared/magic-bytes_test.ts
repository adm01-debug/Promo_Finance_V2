import { assertEquals, assertNotEquals } from 'jsr:@std/assert';
import {
  diretorioCentralZip,
  entradasDiretorioCentral,
  validarZipDiretorioCompleto,
} from './magic-bytes.ts';

// Monta um diretório central + EOCD sintéticos com os nomes dados, e o
// arquivo "cheio" de bytes à frente (o offset aponta para onde o CD ficaria
// num arquivo real). Devolve { arquivoTamanho, tail, cd } prontos p/ o parse.
function montarZip(nomes: string[]) {
  const entradas: number[] = [];
  const enc = new TextEncoder();
  for (const nome of nomes) {
    const n = enc.encode(nome);
    const h = new Uint8Array(46);
    const dv = new DataView(h.buffer);
    h[0] = 0x50;
    h[1] = 0x4b;
    h[2] = 0x01;
    h[3] = 0x02; // PK\x01\x02
    dv.setUint16(28, n.length, true); // nome_len; extra/comentário = 0
    entradas.push(...h, ...n);
  }
  const cd = new Uint8Array(entradas);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06; // PK\x05\x06
  const cdOffset = 1000; // dados do arquivo antes do diretório central
  ev.setUint16(8, nomes.length, true); // total de entradas
  ev.setUint16(10, nomes.length, true);
  ev.setUint32(12, cd.length, true); // tamanho do CD
  ev.setUint32(16, cdOffset, true); // offset do CD

  const tail = new Uint8Array([...new Uint8Array(cdOffset - 900), ...eocd]);
  return { cd, tail, tamanhoArquivo: cdOffset + cd.length + eocd.length, cdOffset };
}

Deno.test('diretorioCentralZip localiza o EOCD na cauda', () => {
  const { cd, tail, tamanhoArquivo, cdOffset } = montarZip(['a.txt', 'b.png']);
  const dir = diretorioCentralZip(tail, tamanhoArquivo);
  assertEquals(dir, { offset: cdOffset, tamanho: cd.length });
});

Deno.test('diretorioCentralZip falha fechado sem EOCD', () => {
  assertEquals(diretorioCentralZip(new Uint8Array(100), 1000), null);
});

Deno.test('entradasDiretorioCentral lista TODAS as entradas', () => {
  const nomes = Array.from({ length: 50 }, (_, i) => `doc${i}.txt`);
  const { cd } = montarZip(nomes);
  assertEquals(entradasDiretorioCentral(cd), nomes);
});

Deno.test('JAR além das 40 primeiras entradas é detectado', () => {
  const nomes = [...Array.from({ length: 45 }, (_, i) => `legit${i}.txt`), 'META-INF/MANIFEST.MF'];
  const erro = validarZipDiretorioCompleto('disfarce.zip', nomes);
  assertNotEquals(erro, null);
});

Deno.test('zip benigno completo passa', () => {
  assertEquals(
    validarZipDiretorioCompleto('planilha.zip', ['[Content_Types].xml', 'xl/workbook.xml']),
    null
  );
});
