/**
 * Classificação de mensagens de validação SPED (ECF/ECD) em categorias
 * legíveis. Usado pelo histórico ECF para agrupar erros e avisos no
 * diálogo de detalhes, ajudando o usuário a entender rapidamente o que
 * bloqueou ou liberou a geração.
 *
 * As categorias derivam dos rótulos do checklist da edge `gerar-sped-ecf`
 * (período, CNPJ, hash, ECD, K355/L100, lançamentos, plano de contas,
 * CFC). Tudo o que não casar cai em "outros".
 */
export type ValidacaoCategoriaId =
  | 'periodo'
  | 'identificacao'
  | 'hash'
  | 'ecd'
  | 'cross_check'
  | 'lancamentos'
  | 'plano_contas'
  | 'cfc'
  | 'outros';

export interface ValidacaoCategoria {
  id: ValidacaoCategoriaId;
  label: string;
  description: string;
}

export const CATEGORIAS_VALIDACAO: ValidacaoCategoria[] = [
  { id: 'periodo', label: 'Período', description: 'Datas, ano-calendário e períodos de apuração.' },
  { id: 'identificacao', label: 'Identificação', description: 'CNPJ, razão social e dados cadastrais da empresa.' },
  { id: 'hash', label: 'Hash / Recibo', description: 'Hash SHA-256 e recibo de transmissão.' },
  { id: 'ecd', label: 'ECD vinculada', description: 'Localização e status da ECD do mesmo período.' },
  { id: 'cross_check', label: 'Cross-check ECF × ECD', description: 'Conferência K355 × L100 e demais saldos.' },
  { id: 'lancamentos', label: 'Lançamentos contábeis', description: 'Partidas, balancetes e saldos.' },
  { id: 'plano_contas', label: 'Plano de contas', description: 'Mapeamento e contas referenciais.' },
  { id: 'cfc', label: 'Conformidade CFC', description: 'Pendências do contador responsável.' },
  { id: 'outros', label: 'Outros', description: 'Validações que não casaram com as demais categorias.' },
];

const PADROES: { id: ValidacaoCategoriaId; pattern: RegExp }[] = [
  { id: 'periodo', pattern: /\b(per[ií]odo|ano[-\s]?calend|data\s+(inicial|final)|exerc[ií]cio)\b/i },
  { id: 'identificacao', pattern: /\b(cnpj|raz[ãa]o\s+social|empresa\b|inscri[çc][ãa]o)\b/i },
  { id: 'hash', pattern: /\b(hash|sha[-\s]?256|recibo)\b/i },
  { id: 'cross_check', pattern: /\b(cross[-\s]?check|k\s?355|l\s?100|conciliac[ãa]o)\b/i },
  { id: 'ecd', pattern: /\becd\b/i },
  { id: 'lancamentos', pattern: /\b(lan[çc]amento|partida|balancete|saldo|d[ée]bito|cr[ée]dito|i050|i150|i200|j100)\b/i },
  { id: 'plano_contas', pattern: /\b(plano\s+de\s+contas|conta\s+referencial|mapeamento|j050|j051)\b/i },
  { id: 'cfc', pattern: /\b(cfc|contador|crc)\b/i },
];

export function classificarValidacao(msg: string): ValidacaoCategoriaId {
  for (const { id, pattern } of PADROES) {
    if (pattern.test(msg)) return id;
  }
  return 'outros';
}

export interface ValidacoesAgrupadas {
  categoria: ValidacaoCategoria;
  erros: string[];
  avisos: string[];
  total: number;
}

/**
 * Agrupa listas de erros e avisos por categoria, preservando a ordem
 * original. Categorias sem nenhuma ocorrência são omitidas.
 */
export function agruparValidacoes(
  erros: string[],
  avisos: string[],
): ValidacoesAgrupadas[] {
  const buckets = new Map<ValidacaoCategoriaId, { erros: string[]; avisos: string[] }>();
  const ensure = (id: ValidacaoCategoriaId) => {
    if (!buckets.has(id)) buckets.set(id, { erros: [], avisos: [] });
    return buckets.get(id)!;
  };
  for (const m of erros) ensure(classificarValidacao(m)).erros.push(m);
  for (const m of avisos) ensure(classificarValidacao(m)).avisos.push(m);

  return CATEGORIAS_VALIDACAO
    .filter((c) => buckets.has(c.id))
    .map((c) => {
      const b = buckets.get(c.id)!;
      return {
        categoria: c,
        erros: b.erros,
        avisos: b.avisos,
        total: b.erros.length + b.avisos.length,
      };
    });
}
