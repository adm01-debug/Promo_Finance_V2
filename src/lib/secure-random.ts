/**
 * secureRandom() — substituto de Math.random() para usos não-criptográficos
 * (jitter de retry, ids de canal, simulações). Math.random() usa um PRNG
 * previsível; getRandomValues usa o CSPRNG do navegador.
 */
export function secureRandom(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
  }
  return Math.random();
}
