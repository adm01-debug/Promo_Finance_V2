let fallbackState = 0x9e3779b9;

function nextUint32(): number {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    return c.getRandomValues(new Uint32Array(1))[0];
  }
  // Ambientes sem WebCrypto (jsdom antigo em testes): mulberry32, um PRNG
  // simples — os call-sites são usos não-criptográficos (jitter, cores,
  // simulação), então a ausência de CSPRNG não compromete segurança.
  fallbackState = (fallbackState + 0x6d2b79f5) >>> 0;
  let t = fallbackState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return (t ^ (t >>> 14)) >>> 0;
}

/**
 * secureRandomInt(min, max) — inteiro uniforme em [min, max) com
 * amostragem por rejeição (regra js/biased-cryptographic-random do
 * CodeQL: a rejeição é o que remove o viés do módulo; nunca transformar
 * o valor aleatório com divisão/adição fora deste helper).
 *
 * Para usos não-criptográficos (jitter de retry, ids, cores) onde só se
 * quer um inteiro justo — não usar como aleatoriedade de segurança sem
 * revisão do caso.
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return min;
  // Maior múltiplo de `range` que cabe em 2^32: valores acima são
  // rejeitados para que todos os resultados saiam com a mesma chance.
  const limit = Math.floor(0x100000000 / range) * range;
  let v: number;
  do {
    v = nextUint32();
  } while (v >= limit);
  return min + (v % range);
}
