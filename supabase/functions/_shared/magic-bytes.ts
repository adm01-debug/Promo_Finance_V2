/**
 * Validação de magic bytes no servidor — espelho de `src/lib/magic-bytes.ts`.
 *
 * O cliente valida por UX, mas quem chama o Storage/HTTP direto pula o
 * front: a conferência precisa acontecer de novo dentro da Edge Function
 * antes de gravar o objeto. Recebe bytes já lidos (sem FileReader) para
 * não depender de API de browser.
 */

export type TipoDetectado =
  | 'pdf'
  | 'png'
  | 'jpeg'
  | 'zip'
  | 'gzip'
  | 'pfx'
  | 'pem'
  | 'xml'
  | 'texto'
  | 'exe'
  | 'elf'
  | 'macho'
  | 'wasm'
  | 'classe'
  | 'script'
  | 'webp'
  | 'desconhecido';

const MAGIC: Array<{ tipo: TipoDetectado; bytes: number[] }> = [
  { tipo: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { tipo: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { tipo: 'jpeg', bytes: [0xff, 0xd8, 0xff] },
  { tipo: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { tipo: 'gzip', bytes: [0x1f, 0x8b] },
  { tipo: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { tipo: 'exe', bytes: [0x4d, 0x5a] },
  { tipo: 'elf', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { tipo: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xce] },
  { tipo: 'macho', bytes: [0xce, 0xfa, 0xed, 0xfe] },
  { tipo: 'macho', bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { tipo: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xcf] },
  { tipo: 'classe', bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { tipo: 'wasm', bytes: [0x00, 0x61, 0x73, 0x6d] },
  { tipo: 'script', bytes: [0x23, 0x21] },
];

const EXECUTAVEIS: ReadonlySet<TipoDetectado> = new Set([
  'exe',
  'elf',
  'macho',
  'wasm',
  'classe',
  'script',
]);

const EXTENSOES_BLOQUEADAS: ReadonlySet<string> = new Set([
  'apk',
  'app',
  'bat',
  'bin',
  'cmd',
  'com',
  'deb',
  'dll',
  'dmg',
  'dylib',
  'elf',
  'exe',
  'hta',
  'html',
  'htm',
  'ipa',
  'jar',
  'js',
  'mjs',
  'msi',
  'ps1',
  'rpm',
  'scr',
  'sh',
  'so',
  'svg',
  'vbs',
  'xht',
  'xhtml',
  'wsf',
]);

const EXTENSAO_PARA_TIPOS: Record<string, TipoDetectado[]> = {
  pdf: ['pdf'],
  png: ['png'],
  jpg: ['jpeg'],
  jpeg: ['jpeg'],
  webp: ['webp'],
  zip: ['zip'],
  xlsx: ['zip'],
  xlsm: ['zip'],
  docx: ['zip'],
  ods: ['zip'],
  gz: ['gzip'],
  pfx: ['pfx', 'desconhecido'],
  p12: ['pfx', 'desconhecido'],
  pem: ['pem'],
  cer: ['pfx', 'pem', 'desconhecido'],
  der: ['pfx', 'desconhecido'],
  xml: ['xml', 'texto'],
  ofx: ['texto', 'xml'],
  ofc: ['texto', 'xml'],
  csv: ['texto'],
  tsv: ['texto'],
  txt: ['texto'],
};

const MARCADORES_OFFICE: Record<string, { primeira: string; prefixo?: string }> = {
  xlsx: { primeira: '[Content_Types].xml', prefixo: 'xl/' },
  xlsm: { primeira: '[Content_Types].xml', prefixo: 'xl/' },
  docx: { primeira: '[Content_Types].xml', prefixo: 'word/' },
  ods: { primeira: 'mimetype' },
};

function entradasZip(head: Uint8Array, max = 40): string[] {
  const nomes: string[] = [];
  const dv = new DataView(head.buffer, head.byteOffset, head.byteLength);
  let pos = 0;
  while (nomes.length < max) {
    let idx = -1;
    for (let i = pos; i + 30 <= head.length; i++) {
      if (
        head[i] === 0x50 &&
        head[i + 1] === 0x4b &&
        head[i + 2] === 0x03 &&
        head[i + 3] === 0x04
      ) {
        idx = i;
        break;
      }
    }
    if (idx === -1) break;
    const nomeLen = dv.getUint16(idx + 26, true);
    const extraLen = dv.getUint16(idx + 28, true);
    if (nomeLen === 0 || idx + 30 + nomeLen > head.length) break;
    nomes.push(new TextDecoder().decode(head.subarray(idx + 30, idx + 30 + nomeLen)));
    pos = idx + 30 + nomeLen + extraLen;
  }
  return nomes;
}

/**
 * Localiza o diretório central do zip pelo EOCD (End Of Central Directory)
 * lido na CAUDA do arquivo. `entradasZip` só enxerga as primeiras entradas
 * da janela de cabeçalho — um JAR com 40+ arquivos benignos antes de
 * META-INF/MANIFEST.MF passaria. O diretório central lista TODAS as
 * entradas; sem ele a inspeção é incompleta e o upload deve falhar fechado.
 */
export function diretorioCentralZip(
  tail: Uint8Array,
  tamanhoArquivo: number
): { offset: number; tamanho: number } | null {
  const dv = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  // Posição absoluta do início da cauda dentro do arquivo completo.
  const baseTail = tamanhoArquivo - tail.length;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (tail[i] === 0x50 && tail[i + 1] === 0x4b && tail[i + 2] === 0x05 && tail[i + 3] === 0x06) {
      // O comentário do zip pode conter a assinatura PK\x05\x06: os campos
      // lidos ali são lixo do comentário, não um EOCD. Um EOCD real termina
      // exatamente no fim do arquivo (22 bytes fixos + comentário).
      const comentLen = dv.getUint16(i + 20, true);
      if (i + 22 + comentLen !== tail.length) continue;
      const cdSize = dv.getUint32(i + 12, true);
      const cdOffset = dv.getUint32(i + 16, true);
      // Num zip válido o diretório central termina imediatamente antes do
      // EOCD. Sem essa amarra, offsets lidos de uma assinatura falsa dentro
      // do comentário apontariam para qualquer lugar do arquivo.
      if (cdSize > 0 && cdOffset + cdSize === baseTail + i) {
        return { offset: cdOffset, tamanho: cdSize };
      }
      // ZIP64: o diretório central termina no registro EOCD64, não no EOCD
      // clássico — entre eles ficam EOCD64 + locator, e os campos de 32 bits
      // do EOCD trazem sentinelas. O locator resolve os offsets reais em
      // 64 bits (zip de 65k+ entradas cabe no limite de upload).
      const viaZip64 = diretorioViaZip64(tail, dv, i, baseTail);
      if (viaZip64) return viaZip64;
    }
  }
  return null;
}

/**
 * Resolve o diretório central quando o EOCD clássico em `eocdPos` é
 * precedido por um locator ZIP64 (PK\x06\x07, 20 bytes). Mesma disciplina
 * do caminho clássico: locator contíguo ao EOCD, EOCD64 contíguo ao
 * locator (o campo de tamanho de 8 bytes cobre o setor extensível) e CD
 * contíguo ao EOCD64. Qualquer desalinho retorna null — fail closed.
 */
function diretorioViaZip64(
  tail: Uint8Array,
  dv: DataView,
  eocdPos: number,
  baseTail: number
): { offset: number; tamanho: number } | null {
  const locPos = eocdPos - 20;
  if (locPos < 0) return null;
  if (
    tail[locPos] !== 0x50 ||
    tail[locPos + 1] !== 0x4b ||
    tail[locPos + 2] !== 0x06 ||
    tail[locPos + 3] !== 0x07
  ) {
    return null;
  }
  const eocd64Abs = dv.getBigUint64(locPos + 8, true); // offset absoluto do EOCD64
  const rel64 = eocd64Abs - BigInt(baseTail);
  if (rel64 < 0n || rel64 > BigInt(tail.length - 56)) return null;
  const r = Number(rel64);
  if (tail[r] !== 0x50 || tail[r + 1] !== 0x4b || tail[r + 2] !== 0x06 || tail[r + 3] !== 0x06) {
    return null;
  }
  const tamanho64 = dv.getBigUint64(r + 4, true); // registro após sig+size
  if (eocd64Abs + 12n + tamanho64 !== BigInt(baseTail + locPos)) return null;
  const cdSize64 = dv.getBigUint64(r + 40, true);
  const cdOffset64 = dv.getBigUint64(r + 48, true);
  if (
    cdSize64 <= 0n ||
    cdOffset64 + cdSize64 !== eocd64Abs ||
    cdSize64 > BigInt(Number.MAX_SAFE_INTEGER) ||
    cdOffset64 > BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return null;
  }
  return { offset: Number(cdOffset64), tamanho: Number(cdSize64) };
}

/**
 * Nomes de TODAS as entradas a partir dos bytes do diretório central.
 * Retorna null quando a lista excede `max` e ficou truncada — validar um
 * prefixo fingindo ser o arquivo inteiro reabriria o bypass de entradas
 * escondidas depois do corte. O teto cobre o pior caso: um zip de 10 MB
 * com entradas de nome mínimo comporta ~217 mil registros de 46 bytes.
 */
export function entradasDiretorioCentral(cd: Uint8Array, max = 250_000): string[] | null {
  const nomes: string[] = [];
  const dv = new DataView(cd.buffer, cd.byteOffset, cd.byteLength);
  let pos = 0;
  while (pos + 46 <= cd.length && nomes.length < max) {
    // Cabeçalho inválido no meio do diretório: não dá para confiar no
    // prefixo — entradas podem estar escondidas depois do ponto de parada.
    if (cd[pos] !== 0x50 || cd[pos + 1] !== 0x4b || cd[pos + 2] !== 0x01 || cd[pos + 3] !== 0x02) {
      return null;
    }
    const nomeLen = dv.getUint16(pos + 28, true);
    const extraLen = dv.getUint16(pos + 30, true);
    const comentLen = dv.getUint16(pos + 32, true);
    if (pos + 46 + nomeLen > cd.length) return null;
    nomes.push(new TextDecoder().decode(cd.subarray(pos + 46, pos + 46 + nomeLen)));
    pos += 46 + nomeLen + extraLen + comentLen;
  }
  // Qualquer byte não consumido (teto atingido, entrada truncada ou lixo
  // depois do último registro) significa lista incompleta → falha fechada.
  if (pos !== cd.length) return null;
  return nomes;
}

/**
 * Valida a lista COMPLETA de entradas de um zip (diretório central).
 * Complementa `validarMagicBytesServidor`, que só vê a janela inicial.
 */
export function validarZipDiretorioCompleto(nome: string, entradas: string[]): string | null {
  if (entradas.some((e) => e === 'META-INF/MANIFEST.MF' || e.endsWith('.class'))) {
    return `${nome}: zip com estrutura de executável Java não é permitido`;
  }
  return null;
}

function corresponde(head: Uint8Array, assinatura: number[]): boolean {
  if (head.length < assinatura.length) return false;
  return assinatura.every((b, i) => head[i] === b);
}

function pareceTexto(head: Uint8Array): boolean {
  if (head.length === 0) return true;
  if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) return true;
  if (head[0] === 0xff && head[1] === 0xfe) return true;
  if (head[0] === 0xfe && head[1] === 0xff) return true;
  for (const b of head.subarray(0, Math.min(head.length, 512))) {
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d && b !== 0x0c) {
      return false;
    }
    if (b === 0x00) return false;
  }
  return true;
}

export function detectarTipo(head: Uint8Array): TipoDetectado {
  for (const { tipo, bytes } of MAGIC) {
    if (corresponde(head, bytes)) return tipo;
  }
  const inicio = new TextDecoder().decode(head.subarray(0, 32));
  if (inicio.startsWith('-----BEGIN')) return 'pem';
  if (head[0] === 0x30 && (head[1] === 0x82 || head[1] === 0x83)) return 'pfx';
  if (inicio.trimStart().startsWith('<?xml') || inicio.trimStart().startsWith('<')) return 'xml';
  if (pareceTexto(head)) return 'texto';
  return 'desconhecido';
}

/**
 * Confere os bytes já lidos contra o nome declarado do arquivo.
 * Retorna mensagem de erro ou null quando válido.
 */
export function validarMagicBytesServidor(nome: string, head: Uint8Array): string | null {
  const tipo = detectarTipo(head);

  if (EXECUTAVEIS.has(tipo)) {
    return `${nome}: conteúdo executável não é permitido em uploads`;
  }

  const ext = nome.split('.').pop()?.toLowerCase() ?? '';
  if (EXTENSOES_BLOQUEADAS.has(ext)) {
    return `${nome}: extensão .${ext} não é permitida em uploads`;
  }

  const esperados = EXTENSAO_PARA_TIPOS[ext];
  if (esperados && !esperados.includes(tipo)) {
    return `${nome}: conteúdo (${tipo}) não corresponde à extensão .${ext}`;
  }

  if (tipo === 'zip') {
    const entradas = entradasZip(head);
    // JAR é zip comum: manifest + bytecode .class rodam com `java -jar`
    // mesmo renomeado para .zip. A assinatura PK não distingue os dois —
    // só a tabela de entradas.
    if (entradas.some((e) => e === 'META-INF/MANIFEST.MF' || e.endsWith('.class'))) {
      return `${nome}: zip com estrutura de executável Java não é permitido`;
    }
    const office = MARCADORES_OFFICE[ext];
    if (office) {
      const estruturaValida =
        entradas[0] === office.primeira &&
        (!office.prefixo || entradas.some((e) => e.startsWith(office.prefixo!)));
      if (!estruturaValida) {
        return `${nome}: zip não é um pacote .${ext} válido`;
      }
    }
  }

  return null;
}
