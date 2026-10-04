/**
 * Validação de magic bytes (assinaturas) para uploads.
 *
 * `accept=` e `file.type` são declarados pelo cliente e trivialmente
 * falsificáveis — um `.exe` renomeado para `.pdf` passa nos dois. Aqui
 * conferimos os primeiros bytes do arquivo: executáveis são sempre
 * rejeitados, e extensões binárias conhecidas precisam bater com a
 * assinatura real do formato. Tipos de texto (csv/ofx/xml/txt) passam
 * por heurística de texto UTF-8 sem bytes de controle.
 *
 * Uso:
 *   const erro = await validarMagicBytes(file, ['.pdf', '.png', '.jpg']);
 *   if (erro) { toast.error(erro); return; }
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

const MAGIC: Array<{ tipo: TipoDetectado; bytes: number[]; mascara?: number[] }> = [
  { tipo: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { tipo: 'png', bytes: [0x89, 0x50, 0x4e, 0x47] }, // \x89PNG
  { tipo: 'jpeg', bytes: [0xff, 0xd8, 0xff] }, // SOI
  { tipo: 'zip', bytes: [0x50, 0x4b, 0x03, 0x04] }, // PK\x03\x04 (zip/xlsx/docx)
  { tipo: 'gzip', bytes: [0x1f, 0x8b] },
  { tipo: 'webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP (verificação parcial)
  { tipo: 'exe', bytes: [0x4d, 0x5a] }, // MZ (PE/DOS)
  { tipo: 'elf', bytes: [0x7f, 0x45, 0x4c, 0x46] }, // \x7fELF
  { tipo: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xce] }, // 32-bit big-endian
  { tipo: 'macho', bytes: [0xce, 0xfa, 0xed, 0xfe] }, // 32-bit little-endian (Intel)
  { tipo: 'macho', bytes: [0xcf, 0xfa, 0xed, 0xfe] }, // 64-bit little-endian
  { tipo: 'macho', bytes: [0xfe, 0xed, 0xfa, 0xcf] }, // 64-bit big-endian
  { tipo: 'classe', bytes: [0xca, 0xfe, 0xba, 0xbe] }, // Java class / Mach fat
  { tipo: 'wasm', bytes: [0x00, 0x61, 0x73, 0x6d] }, // \0asm
  { tipo: 'script', bytes: [0x23, 0x21] }, // #!
];

const EXECUTAVEIS: ReadonlySet<TipoDetectado> = new Set([
  'exe',
  'elf',
  'macho',
  'wasm',
  'classe',
  'script',
]);

/** Extensões executáveis — bloqueadas por nome mesmo sem assinatura binária
 *  (ex.: `.jar` é zip válido e passaria na checagem de assinatura). */
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
  'vbs',
  'wsf',
]);

/** Extensão → tipos detectados aceitos. `zip` cobre xlsx/docx/ofx-zip etc. */
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
  p12: ['pfx', 'desconhecido'], // DER começa com 0x30 0x82 — genérico
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

/** Formatos de escritório são zip: exigir a entrada que os identifica por
 *  dentro impede que um `.jar`/`.apk` renomeado passe por `.xlsx`.
 *  OOXML (xlsx/xlsm/docx) obriga `[Content_Types].xml` como 1ª entrada do
 *  pacote + diretório próprio (`xl/`, `word/`); ODF (ods) obriga `mimetype`
 *  como 1ª entrada. Conferida na estrutura do zip, não como substring. */
const MARCADORES_OFFICE: Record<string, { primeira: string; prefixo?: string }> = {
  xlsx: { primeira: '[Content_Types].xml', prefixo: 'xl/' },
  xlsm: { primeira: '[Content_Types].xml', prefixo: 'xl/' },
  docx: { primeira: '[Content_Types].xml', prefixo: 'word/' },
  ods: { primeira: 'mimetype' },
};

/** Lê os nomes das entradas do zip pelos local file headers (PK\x03\x04).
 *  Não infla conteúdo — só a tabela de nomes na ordem gravada. */
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
  // BOM UTF-8 / UTF-16 são texto
  if (head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) return true;
  if (head[0] === 0xff && head[1] === 0xfe) return true;
  if (head[0] === 0xfe && head[1] === 0xff) return true;
  for (const b of head.subarray(0, Math.min(head.length, 512))) {
    // bytes de controle fora \t \n \r indicam binário
    if (b < 0x20 && b !== 0x09 && b !== 0x0a && b !== 0x0d && b !== 0x0c) return false;
    if (b === 0x00) return false;
  }
  return true;
}

export function detectarTipo(head: Uint8Array): TipoDetectado {
  for (const { tipo, bytes } of MAGIC) {
    if (corresponde(head, bytes)) return tipo;
  }
  // PEM / DER (certificados)
  const inicio = new TextDecoder().decode(head.subarray(0, 32));
  if (inicio.startsWith('-----BEGIN')) return 'pem';
  if (head[0] === 0x30 && (head[1] === 0x82 || head[1] === 0x83)) return 'pfx';
  if (inicio.trimStart().startsWith('<?xml') || inicio.trimStart().startsWith('<')) return 'xml';
  if (pareceTexto(head)) return 'texto';
  return 'desconhecido';
}

/**
 * Lê os primeiros bytes e confere contra a extensão declarada.
 * Regras: executável → sempre bloqueado; extensão mapeada → assinatura
 * precisa bater; extensão não mapeada → só bloqueia executáveis.
 * Retorna mensagem de erro ou null quando válido.
 */
export async function validarMagicBytes(
  file: File,
  extensoesAceitas?: string[]
): Promise<string | null> {
  // FileReader: único leitor que funciona igual no browser e no jsdom dos testes.
  const head = await new Promise<Uint8Array>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(new Uint8Array(r.result as ArrayBuffer));
    r.onerror = () => reject(r.error);
    // 32 KiB: entradas iniciais do zip (Content_Types, mimetype e os
    // primeiros diretórios) precisam caber na janela lida para validar
    // a estrutura de pacotes de escritório.
    r.readAsArrayBuffer(file.slice(0, 32768));
  });
  const tipo = detectarTipo(head);

  if (EXECUTAVEIS.has(tipo)) {
    return `${file.name}: conteúdo executável não é permitido em uploads`;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  // `accept` também pode declarar MIME types ("image/*") — só tokens que
  // parecem extensão entram na checagem.
  const aceitas = (extensoesAceitas ?? [])
    .map((e) => e.trim().replace(/^\./, '').toLowerCase())
    .filter((e) => /^[a-z0-9]+$/.test(e));

  // Se a UI declarou extensões aceitas, a extensão do arquivo precisa constar.
  if (aceitas.length > 0 && !aceitas.includes(ext)) {
    return `${file.name}: extensão .${ext} fora da lista aceita (${aceitas.join(', ')})`;
  }

  // Extensão executável → sempre bloqueada: a assinatura de `.jar` é zip
  // válida e o arquivo ainda carrega bytecode rodável.
  if (EXTENSOES_BLOQUEADAS.has(ext)) {
    return `${file.name}: extensão .${ext} não é permitida em uploads`;
  }

  const esperados = EXTENSAO_PARA_TIPOS[ext];
  if (esperados && !esperados.includes(tipo)) {
    return `${file.name}: conteúdo (${tipo}) não corresponde à extensão .${ext}`;
  }

  const office = MARCADORES_OFFICE[ext];
  if (tipo === 'zip' && office) {
    const entradas = entradasZip(head);
    const estruturaValida =
      entradas[0] === office.primeira &&
      (!office.prefixo || entradas.some((e) => e.startsWith(office.prefixo!)));
    if (!estruturaValida) {
      return `${file.name}: zip não é um pacote .${ext} válido`;
    }
  }

  return null;
}
