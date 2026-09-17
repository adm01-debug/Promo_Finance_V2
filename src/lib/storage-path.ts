/**
 * Caminho de um objeto no Supabase Storage a partir da URL persistida.
 *
 * `anexos_financeiros` não tem coluna `storage_path`: o delete do `AnexoList`
 * lia `anexo.storage_path`, campo inexistente, e acabava chamando
 * `remove([''])` — todo anexo apagado pela tela deixava o arquivo no bucket.
 * A URL gravada na linha é o único ponteiro que sobra para o objeto.
 */
export const BUCKET_FINANCEIRO = 'financeiro';

/**
 * Extrai o caminho dentro do bucket a partir da URL.
 *
 * Cobre as duas formas que o cliente produz — `/object/public/<bucket>/…` e
 * `/object/sign/<bucket>/…?token=…` — e devolve `null` quando a URL não tem o
 * formato esperado. Devolver `null` é deliberado: sem caminho não há como
 * localizar o objeto, e responder um caminho inventado recriaria exatamente o
 * `remove([''])` silencioso que esta função existe para eliminar.
 */
export function caminhoNoStorage(
  url: string | null | undefined,
  bucket: string = BUCKET_FINANCEIRO
): string | null {
  if (!url) return null;
  const marcador = `/${bucket}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return null;

  const caminho = url.slice(i + marcador.length).split('?')[0];
  if (!caminho) return null;

  try {
    return decodeURIComponent(caminho);
  } catch {
    // URL com percent-encoding malformado: melhor o caminho cru do que nada.
    return caminho;
  }
}
