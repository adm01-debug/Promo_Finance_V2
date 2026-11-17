/**
 * Casamento de CNAE com `benchmarks_setoriais.cnae_prefix`.
 *
 * A direcao da comparacao e o que importa: `cnae_prefix` e o PREFIXO e o CNAE da
 * empresa e o codigo completo. O seed da tabela grava prefixo de 2 digitos
 * (supabase/migrations/20260417155857_...sql:82-90: '47', '10', '62', '69'),
 * entao pedir `cnae_prefix ILIKE '<4 primeiros digitos>%'` nunca casa: '4781%'
 * nao encontra '47'. Era o defeito de gerar-alertas-tributarios e, por copia,
 * da primeira versao de comparar-benchmark-setorial (PR #403).
 *
 * Aqui montamos os prefixos que ABRANGEM o codigo da empresa, do mais
 * especifico ao mais generico, para consultar com `.in()` e escolher o mais
 * longo.
 */

/** Prefixos de 7 a 2 digitos que abrangem o CNAE informado, mais longo primeiro. */
export function prefixosCnaeCandidatos(cnae: unknown): string[] {
  const digitos = String(cnae ?? '').replace(/\D/g, '');
  if (digitos.length < 2) return [];
  const candidatos: string[] = [];
  for (let n = Math.min(digitos.length, 7); n >= 2; n--) {
    candidatos.push(digitos.slice(0, n));
  }
  return candidatos;
}

/**
 * Ordena linhas de benchmark pelo prefixo mais especifico (mais longo) primeiro.
 * O sort de Array e estavel, entao empate de tamanho preserva a ordem que a
 * consulta ja trouxe (por vigencia, quando houver).
 */
export function porPrefixoMaisEspecifico<T extends { cnae_prefix?: unknown }>(linhas: T[]): T[] {
  return linhas
    .slice()
    .sort((a, b) => String(b.cnae_prefix ?? '').length - String(a.cnae_prefix ?? '').length);
}

/**
 * Vocabulario canonico de regime tributario, identico nos dois CHECKs do banco:
 *   empresas.regime_tributario      -> mei | simples_nacional | lucro_presumido
 *                                      | lucro_real | arbitrado (ou NULL)
 *   benchmarks_setoriais.regime     -> os mesmos cinco (NOT NULL)
 * (migrations 20260728163134_...sql:10 e o check empresas_regime_tributario_check)
 */
export const REGIMES_CANONICOS = [
  'mei',
  'simples_nacional',
  'lucro_presumido',
  'lucro_real',
  'arbitrado',
] as const;

export type RegimeCanonico = (typeof REGIMES_CANONICOS)[number];

/**
 * Devolve o regime no vocabulario que a tabela aceita, ou null quando a empresa
 * nao tem regime registrado.
 *
 * Consultar `benchmarks_setoriais` com rotulo curto ('simples', 'presumido',
 * 'real') NUNCA casa: os dois CHECKs proibem esses valores. Era o que
 * comparar-benchmark-setorial fazia -- mesmo com a tabela semeada, o resultado
 * seria sempre a referencia interna.
 */
export function regimeParaBenchmark(regimeEmpresa: unknown): RegimeCanonico | null {
  const v = String(regimeEmpresa ?? '')
    .trim()
    .toLowerCase();
  if ((REGIMES_CANONICOS as readonly string[]).includes(v)) return v as RegimeCanonico;
  // tolera os rotulos curtos que circulavam no codigo antigo
  const curtos: Record<string, RegimeCanonico> = {
    simples: 'simples_nacional',
    presumido: 'lucro_presumido',
    real: 'lucro_real',
  };
  return curtos[v] ?? null;
}

/** Chave da faixa de referencia interna, que usa rotulos curtos. */
export function chaveReferenciaInterna(
  regime: RegimeCanonico | null
): 'simples' | 'presumido' | 'real' {
  if (regime === 'lucro_presumido') return 'presumido';
  if (regime === 'lucro_real' || regime === 'arbitrado') return 'real';
  return 'simples';
}
