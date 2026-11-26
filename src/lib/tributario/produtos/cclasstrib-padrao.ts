/**
 * Etapa 86 do plano RT/RFB: enquadramento tributario padrao por produto.
 *
 * O catalogo de produtos e do Bling; aqui ficam apenas as decisoes puras do
 * padrao: como normalizar o que foi digitado, o que validar antes de gravar e
 * qual cClassTrib sugerir quando outro produto do mesmo NCM ja tem um. Nao ha
 * tabela oficial NCM -> cClassTrib publicada, entao a sugestao e o consenso do
 * proprio cadastro, nunca um chute.
 */

export interface PadraoProduto {
  produto_id: string;
  ncm: string | null;
  cst: string;
  cclasstrib: string;
  atualizado_em: string;
}

/** NCM valido = 8 digitos. Aceita mascara (`1234.56.78`) e devolve so digitos. */
export function normalizarNcm(ncm?: string | null): string | null {
  const digitos = (ncm ?? '').replace(/\D/g, '');
  return digitos.length === 8 ? digitos : null;
}

export function normalizarCodigo(valor?: string | null, tamanho = 0): string {
  return (valor ?? '').replace(/\D/g, '').slice(0, tamanho);
}

const chave = (cst: string, cclasstrib: string) => `${cst}|${cclasstrib}`;

/**
 * Sugestao por NCM: o enquadramento que a maioria dos outros produtos deste NCM
 * ja usa. Empate fica com o mais recente, para a resposta nao variar entre dois
 * refreshes. Sem NCM valido ou sem nenhum outro produto com o mesmo NCM, nao
 * sugere nada.
 */
export function sugerirPadraoPorNcm(
  padroes: readonly PadraoProduto[],
  ncm?: string | null,
  produtoId?: string
): PadraoProduto | null {
  const alvo = normalizarNcm(ncm);
  if (!alvo) return null;

  const candidatos = padroes.filter(
    (p) => normalizarNcm(p.ncm) === alvo && p.produto_id !== produtoId
  );
  if (candidatos.length === 0) return null;

  const votos = new Map<string, { total: number; recente: PadraoProduto }>();
  for (const candidato of candidatos) {
    const k = chave(candidato.cst, candidato.cclasstrib);
    const atual = votos.get(k);
    if (!atual) {
      votos.set(k, { total: 1, recente: candidato });
      continue;
    }
    atual.total += 1;
    if (candidato.atualizado_em > atual.recente.atualizado_em) atual.recente = candidato;
  }

  let vencedor: { total: number; recente: PadraoProduto } | null = null;
  for (const voto of votos.values()) {
    if (
      !vencedor ||
      voto.total > vencedor.total ||
      (voto.total === vencedor.total && voto.recente.atualizado_em > vencedor.recente.atualizado_em)
    ) {
      vencedor = voto;
    }
  }

  return vencedor ? vencedor.recente : null;
}

/** Validacao do que vai para o banco. Devolve a mensagem de erro ou `null` se ok. */
export function validarPadrao(entrada: {
  cst?: string | null;
  cclasstrib?: string | null;
  ncm?: string | null;
}): string | null {
  const cst = normalizarCodigo(entrada.cst, 3);
  const cclasstrib = normalizarCodigo(entrada.cclasstrib, 6);
  if (cst.length !== 3) return 'Informe o CST com 3 digitos.';
  if (cclasstrib.length !== 6) return 'Informe o cClassTrib com 6 digitos.';
  const ncm = (entrada.ncm ?? '').replace(/\D/g, '');
  if (ncm.length !== 0 && ncm.length !== 8) return 'NCM deve ter 8 digitos (ou ficar vazio).';
  return null;
}
