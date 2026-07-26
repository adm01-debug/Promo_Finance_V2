/**
 * Importador de Plano de Contas (CSV/TSV).
 *
 * Parser puro — sem I/O e sem dependência de React/Supabase — para que a
 * validação contábil seja integralmente testável em unidade.
 *
 * Regras aplicadas:
 *  - `codigo` hierárquico separado por ponto (`1`, `1.1`, `1.1.01`). O nível é
 *    derivado da quantidade de segmentos e o pai é o prefixo imediato.
 *  - `natureza` deve ser devedora ou credora; `tipo` deve pertencer ao conjunto
 *    contábil canônico (ativo, passivo, patrimonio_liquido, receita, despesa,
 *    custo, resultado).
 *  - Contas sintéticas (que possuem filhas) NÃO aceitam lançamento; contas
 *    analíticas (folhas) aceitam. O CSV pode sobrescrever explicitamente.
 */

/** Naturezas contábeis aceitas. */
export const NATUREZAS = ['devedora', 'credora'] as const;
export type NaturezaConta = (typeof NATUREZAS)[number];

/** Tipos (grupos) contábeis aceitos. */
export const TIPOS_CONTA = [
  'ativo',
  'passivo',
  'patrimonio_liquido',
  'receita',
  'despesa',
  'custo',
  'resultado',
] as const;
export type TipoConta = (typeof TIPOS_CONTA)[number];

/** Conta válida, pronta para persistência. */
export interface ParsedConta {
  /** Linha original no arquivo (1-based, incluindo cabeçalho). */
  linha: number;
  codigo: string;
  descricao: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  /** Derivado da quantidade de segmentos do código. */
  nivel: number;
  /** Código da conta superior, ou `null` para contas raiz. */
  codigo_pai: string | null;
  /** Código referencial CFC/RFB, quando informado. */
  codigo_referencial: string | null;
  /** Contas sintéticas não aceitam lançamento direto. */
  aceita_lancamento: boolean;
}

/** Linha rejeitada, com o motivo legível para o usuário. */
export interface ContaInvalida {
  linha: number;
  codigo: string;
  erro: string;
}

export interface PlanoContasParseResult {
  contas: ParsedConta[];
  invalidas: ContaInvalida[];
  /** Total de linhas de dados lidas (exclui cabeçalho e linhas em branco). */
  totalLinhas: number;
}

const HEADER_OBRIGATORIO = ['codigo', 'descricao', 'tipo', 'natureza'] as const;

/** Remove acentos e normaliza para comparação case-insensitive. */
function normalizar(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Detecta o separador dominante entre `;`, `,` e tab. */
function detectarSeparador(header: string): string {
  const candidatos = [';', ',', '\t'];
  let melhor = ';';
  let maior = -1;
  for (const sep of candidatos) {
    const n = header.split(sep).length;
    if (n > maior) {
      maior = n;
      melhor = sep;
    }
  }
  return melhor;
}

/** Converte texto livre em booleano; retorna `null` quando ausente/indefinido. */
function parseBooleano(valor: string): boolean | null {
  const v = normalizar(valor);
  if (!v) return null;
  if (['1', 'sim', 's', 'true', 'verdadeiro', 'analitica'].includes(v)) return true;
  if (['0', 'nao', 'n', 'false', 'falso', 'sintetica'].includes(v)) return false;
  return null;
}

/** Normaliza o tipo informado, aceitando sinônimos usuais em português. */
function parseTipo(valor: string): TipoConta | null {
  const v = normalizar(valor).replace(/[\s-]+/g, '_');
  const sinonimos: Record<string, TipoConta> = {
    ativo: 'ativo',
    passivo: 'passivo',
    patrimonio_liquido: 'patrimonio_liquido',
    pl: 'patrimonio_liquido',
    receita: 'receita',
    receitas: 'receita',
    despesa: 'despesa',
    despesas: 'despesa',
    custo: 'custo',
    custos: 'custo',
    resultado: 'resultado',
  };
  return sinonimos[v] ?? null;
}

/** Normaliza a natureza, aceitando as abreviações D/C. */
function parseNatureza(valor: string): NaturezaConta | null {
  const v = normalizar(valor);
  if (['devedora', 'debito', 'debitora', 'd'].includes(v)) return 'devedora';
  if (['credora', 'credito', 'c'].includes(v)) return 'credora';
  return null;
}

/**
 * Valida o formato do código hierárquico: segmentos numéricos separados por
 * ponto, sem segmentos vazios (`1..2` é inválido).
 */
function codigoValido(codigo: string): boolean {
  return /^\d+(\.\d+)*$/.test(codigo);
}

/** Deriva o código do pai a partir do prefixo imediato. */
function codigoPai(codigo: string): string | null {
  const idx = codigo.lastIndexOf('.');
  return idx === -1 ? null : codigo.slice(0, idx);
}

/**
 * Faz o parse de um CSV/TSV de plano de contas.
 *
 * @param texto Conteúdo bruto do arquivo (UTF-8, com ou sem BOM).
 * @returns Contas válidas ordenadas por código, além das linhas rejeitadas.
 * @throws Se o cabeçalho não contiver as colunas obrigatórias.
 */
export function parsePlanoContasCsv(texto: string): PlanoContasParseResult {
  const limpo = texto.replace(/^\uFEFF/, '');
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (linhas.length === 0) {
    throw new Error('Arquivo vazio.');
  }

  const separador = detectarSeparador(linhas[0]);
  const cabecalho = linhas[0].split(separador).map((c) => normalizar(c));

  const idx = {
    codigo: cabecalho.indexOf('codigo'),
    descricao: cabecalho.findIndex((c) => c === 'descricao' || c === 'nome'),
    tipo: cabecalho.indexOf('tipo'),
    natureza: cabecalho.indexOf('natureza'),
    codigo_referencial: cabecalho.indexOf('codigo_referencial'),
    aceita_lancamento: cabecalho.indexOf('aceita_lancamento'),
  };

  const faltantes = HEADER_OBRIGATORIO.filter((h) =>
    h === 'descricao' ? idx.descricao === -1 : idx[h] === -1,
  );
  if (faltantes.length > 0) {
    throw new Error(`Cabeçalho inválido — colunas obrigatórias ausentes: ${faltantes.join(', ')}.`);
  }

  const contas: ParsedConta[] = [];
  const invalidas: ContaInvalida[] = [];
  const vistos = new Map<string, number>();

  for (let i = 1; i < linhas.length; i++) {
    const linha = i + 1;
    const cols = linhas[i].split(separador).map((c) => c.trim().replace(/^"|"$/g, ''));

    const codigo = (cols[idx.codigo] ?? '').trim();
    const descricao = (cols[idx.descricao] ?? '').trim();

    if (!codigo) {
      invalidas.push({ linha, codigo: '', erro: 'Código da conta é obrigatório.' });
      continue;
    }
    if (!codigoValido(codigo)) {
      invalidas.push({ linha, codigo, erro: 'Código deve conter apenas números separados por ponto (ex.: 1.1.01).' });
      continue;
    }
    if (vistos.has(codigo)) {
      invalidas.push({ linha, codigo, erro: `Código duplicado — já informado na linha ${vistos.get(codigo)}.` });
      continue;
    }
    if (!descricao) {
      invalidas.push({ linha, codigo, erro: 'Descrição da conta é obrigatória.' });
      continue;
    }

    const tipo = parseTipo(cols[idx.tipo] ?? '');
    if (!tipo) {
      invalidas.push({ linha, codigo, erro: `Tipo inválido — use um de: ${TIPOS_CONTA.join(', ')}.` });
      continue;
    }

    const natureza = parseNatureza(cols[idx.natureza] ?? '');
    if (!natureza) {
      invalidas.push({ linha, codigo, erro: 'Natureza inválida — use devedora ou credora.' });
      continue;
    }

    vistos.set(codigo, linha);
    contas.push({
      linha,
      codigo,
      descricao,
      tipo,
      natureza,
      nivel: codigo.split('.').length,
      codigo_pai: codigoPai(codigo),
      codigo_referencial:
        idx.codigo_referencial >= 0 ? (cols[idx.codigo_referencial] || '').trim() || null : null,
      aceita_lancamento:
        idx.aceita_lancamento >= 0 ? (parseBooleano(cols[idx.aceita_lancamento] ?? '') ?? true) : true,
    });
  }

  // Ordena por código hierárquico (numérico por segmento) para que os pais
  // sejam sempre inseridos antes das filhas.
  contas.sort((a, b) => compararCodigos(a.codigo, b.codigo));

  // Rejeita contas cujo pai não existe no arquivo — evita hierarquia órfã.
  const codigos = new Set(contas.map((c) => c.codigo));
  const validas: ParsedConta[] = [];
  for (const conta of contas) {
    if (conta.codigo_pai && !codigos.has(conta.codigo_pai)) {
      invalidas.push({
        linha: conta.linha,
        codigo: conta.codigo,
        erro: `Conta superior "${conta.codigo_pai}" não existe no arquivo.`,
      });
      continue;
    }
    validas.push(conta);
  }

  // Contas com filhas são sintéticas — não aceitam lançamento direto.
  const paisComFilhas = new Set(
    validas.map((c) => c.codigo_pai).filter((c): c is string => c !== null),
  );
  for (const conta of validas) {
    if (paisComFilhas.has(conta.codigo)) conta.aceita_lancamento = false;
  }

  return {
    contas: validas,
    invalidas: invalidas.sort((a, b) => a.linha - b.linha),
    totalLinhas: linhas.length - 1,
  };
}

/** Compara dois códigos hierárquicos segmento a segmento (numericamente). */
export function compararCodigos(a: string, b: string): number {
  const sa = a.split('.').map(Number);
  const sb = b.split('.').map(Number);
  const n = Math.max(sa.length, sb.length);
  for (let i = 0; i < n; i++) {
    const diff = (sa[i] ?? -1) - (sb[i] ?? -1);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Modelo de CSV oferecido para download na UI. */
export const PLANO_CONTAS_CSV_TEMPLATE = [
  'codigo;descricao;tipo;natureza;codigo_referencial;aceita_lancamento',
  '1;ATIVO;ativo;devedora;1;nao',
  '1.1;ATIVO CIRCULANTE;ativo;devedora;1.01;nao',
  '1.1.01;Caixa;ativo;devedora;1.01.01;sim',
  '1.1.02;Bancos Conta Movimento;ativo;devedora;1.01.02;sim',
  '2;PASSIVO;passivo;credora;2;nao',
  '2.1;PASSIVO CIRCULANTE;passivo;credora;2.01;nao',
  '2.1.01;Fornecedores;passivo;credora;2.01.01;sim',
  '3;PATRIMONIO LIQUIDO;patrimonio_liquido;credora;2.03;nao',
  '3.1;Capital Social;patrimonio_liquido;credora;2.03.01;sim',
  '4;RECEITAS;receita;credora;3;nao',
  '4.1;Receita Bruta de Vendas;receita;credora;3.01;sim',
  '5;DESPESAS;despesa;devedora;4;nao',
  '5.1;Despesas Administrativas;despesa;devedora;4.01;sim',
].join('\n');
