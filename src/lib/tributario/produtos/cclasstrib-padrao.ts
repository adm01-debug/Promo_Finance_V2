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
  codigo: string | null;
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

/** Codigo comercial (SKU) do Bling pronto para comparacao. */
export function normalizarCodigoComercial(codigo?: string | null): string {
  return (codigo ?? '').trim().toUpperCase();
}

/**
 * Enquadramento gravado para o SKU informado no item da NF-e.
 *
 * O SKU e texto livre no Bling e nao e unico entre produtos: quando dois
 * produtos o compartilham com enquadramentos diferentes nao existe resposta
 * honesta, entao devolve `null` e a emissao cai na regra por NCM.
 */
export function resolverPadraoPorCodigo(
  padroes: readonly PadraoProduto[],
  codigo?: string | null
): PadraoProduto | null {
  const alvo = normalizarCodigoComercial(codigo);
  if (!alvo) return null;

  const candidatos = padroes.filter((p) => normalizarCodigoComercial(p.codigo) === alvo);
  if (candidatos.length === 0) return null;

  const primeiro = candidatos[0];
  // O NCM entra na comparacao porque ele tambem e herdado pelo item da nota:
  // dois produtos com o mesmo par CST/cClassTrib e NCMs diferentes nao tem
  // resposta unica para o NCM.
  const divergente = candidatos.some(
    (c) =>
      c.cst !== primeiro.cst ||
      c.cclasstrib !== primeiro.cclasstrib ||
      (normalizarNcm(c.ncm) ?? '') !== (normalizarNcm(primeiro.ncm) ?? '')
  );
  return divergente ? null : primeiro;
}

/** Resolvedor de SKU -> padrao (o `porCodigo` do hook). */
export type ResolverPadraoPorCodigo = (codigo?: string | null) => PadraoProduto | null;

/**
 * Outro produto ja usa este SKU com enquadramento diferente?
 *
 * O SKU e a unica chave que o item da NF-e conhece, entao dois produtos com o
 * mesmo SKU e enquadramentos diferentes deixam o item sem resposta (o
 * `resolverPadraoPorCodigo` devolve `null`). Gravar o segundo padrao so
 * produziria essa ambiguidade: o cadastro barra antes, com quem ja ocupa o SKU.
 */
export function conflitoDeSku(
  padroes: readonly PadraoProduto[],
  entrada: {
    produto_id?: string | null;
    codigo?: string | null;
    cst?: string | null;
    cclasstrib?: string | null;
    ncm?: string | null;
  }
): PadraoProduto | null {
  const alvo = normalizarCodigoComercial(entrada.codigo);
  if (!alvo) return null;

  const cst = normalizarCodigo(entrada.cst, 3);
  const cclasstrib = normalizarCodigo(entrada.cclasstrib, 6);
  const ncm = normalizarNcm(entrada.ncm) ?? '';

  for (const padrao of padroes) {
    if (String(padrao.produto_id) === String(entrada.produto_id ?? '')) continue;
    if (normalizarCodigoComercial(padrao.codigo) !== alvo) continue;
    if (
      padrao.cst === cst &&
      padrao.cclasstrib === cclasstrib &&
      (normalizarNcm(padrao.ncm) ?? '') === ncm
    ) {
      continue;
    }
    return padrao;
  }
  return null;
}

/**
 * NCM do item depois da troca de SKU.
 *
 * O NCM herdado do padrao do produto anterior nao pode sobreviver a troca: ao
 * digitar `KIT-12` o formulario passa por `KIT-1` e herda o NCM dele. O NCM
 * digitado a mao fica de pe.
 */
export function ncmAposTrocaDeCodigo(
  resolver: ResolverPadraoPorCodigo,
  entrada: { codigoAnterior?: string | null; ncmAtual?: string | null; codigoNovo?: string | null }
): string {
  const herdado = normalizarNcm(resolver(entrada.codigoAnterior)?.ncm) ?? '';
  const atual = (entrada.ncmAtual ?? '').trim();
  if (atual && (normalizarNcm(atual) ?? atual) !== herdado) return atual;
  return resolver(entrada.codigoNovo)?.ncm ?? '';
}

/**
 * cClassTrib que sobrevive a troca de SKU quando o novo SKU nao tem padrao.
 *
 * Sai de cena o padrao herdado do produto anterior; a escolha manual do
 * operador fica de pe e volta para a regra por NCM como classificacao atual.
 */
export function cclasstribManualAposTroca(
  resolver: ResolverPadraoPorCodigo,
  entrada: { codigoAnterior?: string | null; cclasstribAtual?: string | null }
): string | undefined {
  const herdado = resolver(entrada.codigoAnterior);
  if (herdado && entrada.cclasstribAtual === herdado.cclasstrib) return undefined;
  return entrada.cclasstribAtual ?? undefined;
}

/**
 * Coerencia entre CST e cClassTrib no que foi digitado. O catalogo oficial diz
 * qual CST acompanha cada cClassTrib, e o validador fiscal ja trata o par
 * contraditorio como divergencia (REG-011). Só valida quando existe referencia
 * vigente: com o catalogo da RFB vazio a digitacao manual continua livre.
 */
export function validarCoerenciaCst(
  entrada: { cst?: string | null; cclasstrib?: string | null },
  opcoes: readonly { cst: string; cclasstrib: string }[]
): string | null {
  const cclasstrib = normalizarCodigo(entrada.cclasstrib, 6);
  if (cclasstrib.length !== 6 || opcoes.length === 0) return null;

  const referencia = opcoes.find((o) => normalizarCodigo(o.cclasstrib, 6) === cclasstrib);
  if (!referencia) return null;

  const cst = normalizarCodigo(entrada.cst, 3);
  const cstReferencia = normalizarCodigo(referencia.cst, 3);
  if (cst === cstReferencia) return null;

  return `O cClassTrib ${cclasstrib} usa CST ${cstReferencia} no catalogo da RFB (informado: ${cst || 'vazio'}).`;
}
