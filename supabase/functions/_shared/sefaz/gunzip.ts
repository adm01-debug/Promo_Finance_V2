/**
 * Utilidades gzip <-> base64 para o transporte DFe da SEFAZ.
 *
 * A SEFAZ devolve cada documento dentro de `<docZip>` como
 * base64(gzip(xml)). Aqui centralizamos o round-trip para que o
 * puxador real (Fase 2) e o mock (`__mocks__/soap-mock.ts`) usem
 * exatamente a mesma rotina — garantindo que qualquer teste de
 * corrupção seja fiel ao formato de produção.
 *
 * Implementação portátil (Deno + Node/Vitest) usando `CompressionStream`
 * e `DecompressionStream` (WICG Compression, disponível em Deno estável
 * e nos runtimes modernos). Sem dependência externa.
 */

async function streamThrough(
  input: Uint8Array,
  transform: TransformStream<BufferSource, Uint8Array>,
): Promise<Uint8Array> {
  const blob = new Blob([input as BlobPart]);
  const stream = (blob.stream() as unknown as ReadableStream<BufferSource>).pipeThrough(
    transform,
  );
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)) as unknown as number[],
    );
  }
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64.replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function gzipBase64(xml: string): Promise<string> {
  const bytes = new TextEncoder().encode(xml);
  const compressed = await streamThrough(bytes, new CompressionStream("gzip"));
  return bytesToBase64(compressed);
}

export async function gunzipBase64(b64: string): Promise<string> {
  const bytes = base64ToBytes(b64);
  const decompressed = await streamThrough(bytes, new DecompressionStream("gzip"));
  return new TextDecoder("utf-8").decode(decompressed);
}

/**
 * Produz um base64 que passa como base64 válido mas cujo conteúdo NÃO é
 * um stream gzip válido — usado pelos mocks para o cenário `gzip_corrupt`.
 */
export function corruptedGzipBase64(): string {
  const bogus = new Uint8Array([0x1f, 0x8b, 0x08, 0x00, 0xde, 0xad, 0xbe, 0xef, 0x00, 0x00]);
  return bytesToBase64(bogus);
}
