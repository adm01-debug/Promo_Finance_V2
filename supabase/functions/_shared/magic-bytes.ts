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
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d && b !== 0x0c) return false;
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
