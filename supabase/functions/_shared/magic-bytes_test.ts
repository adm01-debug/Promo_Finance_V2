import { assertEquals, assertNotEquals } from 'jsr:@std/assert';
import {
  diretorioCentralZip,
  entradasDiretorioCentral,
  validarZipDiretorioCompleto,
} from './magic-bytes.ts';

// Monta um diretório central + EOCD sintéticos com os nomes dados, e o
// arquivo "cheio" de bytes à frente (o offset aponta para onde o CD ficaria
// num arquivo real). Devolve { arquivoTamanho, tail, cd } prontos p/ o parse.
function montarZip(nomes: string[], comentario = '') {
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

  const comentarioBytes = enc.encode(comentario);
  const eocd = new Uint8Array(22 + comentarioBytes.length);
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
  ev.setUint16(20, comentarioBytes.length, true);
  eocd.set(comentarioBytes, 22);

  const tail = new Uint8Array([...new Uint8Array(cdOffset - 900), ...eocd]);
  return {
    cd,
    tail,
    tamanhoArquivo: cdOffset + cd.length + eocd.length,
    cdOffset,
  };
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

Deno.test('diretório truncado pelo teto retorna null', () => {
  const { cd } = montarZip(['a.txt', 'b.txt', 'c.txt']);
  assertEquals(entradasDiretorioCentral(cd, 2), null);
});

Deno.test('zip benigno completo passa', () => {
  assertEquals(
    validarZipDiretorioCompleto('planilha.zip', ['[Content_Types].xml', 'xl/workbook.xml']),
    null
  );
});

Deno.test('comentário do zip com a assinatura PK\x05\x06 não engana o scan', () => {
  // A assinatura falsa fica DEPOIS do EOCD real: a varredura reversa a
  // encontra primeiro e só a descarta pelo comprimento do comentário.
  const { cd, tail, tamanhoArquivo, cdOffset } = montarZip(['a.txt'], 'xPK\x05\x06y');
  assertEquals(diretorioCentralZip(tail, tamanhoArquivo), {
    offset: cdOffset,
    tamanho: cd.length,
  });
});

Deno.test('EOCD com offsets inconsistentes falha fechado', () => {
  const { tail, tamanhoArquivo, cdOffset } = montarZip(['a.txt']);
  const eocdPos = tail.length - 22;
  const dv = new DataView(tail.buffer);
  dv.setUint32(eocdPos + 16, cdOffset - 8, true); // offset errado: CD não terminaria no EOCD
  assertEquals(diretorioCentralZip(tail, tamanhoArquivo), null);
});

Deno.test('diretório com cabeçalho inválido no meio retorna null', () => {
  const { cd } = montarZip(['a.txt', 'b.txt']);
  const quebrado = new Uint8Array(cd.length);
  quebrado.set(cd);
  quebrado[51] = 0x00; // corrompe a assinatura PK\x01\x02 da 2ª entrada
  assertEquals(entradasDiretorioCentral(quebrado), null);
});

Deno.test('diretório com bytes sobrando no fim retorna null', () => {
  const { cd } = montarZip(['a.txt']);
  assertEquals(entradasDiretorioCentral(new Uint8Array([...cd, 0x00, 0x00])), null);
});

// Zip64: CD + registro EOCD64 (56 B) + locator (20 B) + EOCD clássico com
// sentinelas 0xFFFF/0xFFFFFFFF — layout de um zip real com 65k+ entradas.
function montarZip64(nomes: string[]) {
  const entradas: number[] = [];
  const enc = new TextEncoder();
  for (const nome of nomes) {
    const n = enc.encode(nome);
    const h = new Uint8Array(46);
    const dv = new DataView(h.buffer);
    h[0] = 0x50;
    h[1] = 0x4b;
    h[2] = 0x01;
    h[3] = 0x02;
    dv.setUint16(28, n.length, true);
    entradas.push(...h, ...n);
  }
  const cd = new Uint8Array(entradas);
  const cdOffset = 1000;

  const e64 = new Uint8Array(56);
  const v64 = new DataView(e64.buffer);
  e64[0] = 0x50;
  e64[1] = 0x4b;
  e64[2] = 0x06;
  e64[3] = 0x06; // PK\x06\x06
  v64.setBigUint64(4, 44n, true); // tamanho do registro após este campo
  v64.setUint16(12, 45, true);
  v64.setUint16(14, 45, true);
  v64.setBigUint64(24, BigInt(nomes.length), true);
  v64.setBigUint64(32, BigInt(nomes.length), true);
  v64.setBigUint64(40, BigInt(cd.length), true);
  v64.setBigUint64(48, BigInt(cdOffset), true);

  const loc = new Uint8Array(20);
  const lv = new DataView(loc.buffer);
  loc[0] = 0x50;
  loc[1] = 0x4b;
  loc[2] = 0x06;
  loc[3] = 0x07; // PK\x06\x07
  lv.setBigUint64(8, BigInt(cdOffset + cd.length), true); // offset do EOCD64

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06;
  ev.setUint16(8, 0xffff, true); // sentinelas zip64
  ev.setUint16(10, 0xffff, true);
  ev.setUint32(12, 0xffffffff, true);
  ev.setUint32(16, 0xffffffff, true);

  const tail = new Uint8Array([...new Uint8Array(100), ...e64, ...loc, ...eocd]);
  return {
    cd,
    tail,
    tamanhoArquivo: cdOffset + cd.length + e64.length + loc.length + eocd.length,
    cdOffset,
  };
}

Deno.test('diretorioCentralZip resolve o diretório via registros ZIP64', () => {
  const { cd, tail, tamanhoArquivo, cdOffset } = montarZip64(['a.txt', 'b.txt']);
  assertEquals(diretorioCentralZip(tail, tamanhoArquivo), {
    offset: cdOffset,
    tamanho: cd.length,
  });
});

Deno.test('locator ZIP64 com EOCD64 inconsistente falha fechado', () => {
  const { tail, tamanhoArquivo } = montarZip64(['a.txt']);
  const corrompido = new Uint8Array(tail);
  corrompido[103] = 0x00; // corrompe a assinatura PK\x06\x06 do registro EOCD64
  assertEquals(diretorioCentralZip(corrompido, tamanhoArquivo), null);
});
