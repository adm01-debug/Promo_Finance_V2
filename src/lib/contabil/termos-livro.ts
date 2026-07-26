/**
 * Termos de abertura e encerramento de livros contábeis (Diário / Razão).
 *
 * Base normativa: art. 1.181 do Código Civil, NBC ITG 2000 (R1) e
 * Instrução Normativa DREI para livros mercantis. Os termos são texto puro,
 * sem dependência de DOM, para permitir teste unitário determinístico e
 * reuso tanto no PDF quanto em exportações textuais.
 */

export type TipoLivro = 'DIARIO' | 'RAZAO';

export interface TermoParams {
  /** Tipo do livro — define o rótulo oficial impresso no termo. */
  tipoLivro: TipoLivro;
  /** Razão social completa da empresa. */
  razaoSocial: string;
  /** CNPJ (com ou sem máscara). */
  cnpj: string;
  /** NIRE / registro na Junta Comercial (opcional para entidades sem registro). */
  nire?: string | null;
  /** Nome do órgão de registro (ex.: "JUCESP"). */
  orgaoRegistro?: string | null;
  /** Município da sede. */
  municipio?: string | null;
  /** UF da sede. */
  uf?: string | null;
  /** Número sequencial do livro. */
  numeroLivro: number;
  /** Data inicial do período escriturado (ISO yyyy-MM-dd). */
  dataInicio: string;
  /** Data final do período escriturado (ISO yyyy-MM-dd). */
  dataFim: string;
  /** Total de páginas efetivamente escrituradas. */
  totalPaginas: number;
  /** Nome do contador responsável. */
  contadorNome?: string | null;
  /** Registro CRC do contador. */
  contadorCrc?: string | null;
  /** Nome do representante legal. */
  responsavelNome?: string | null;
}

const LABEL_LIVRO: Record<TipoLivro, string> = {
  DIARIO: 'LIVRO DIÁRIO',
  RAZAO: 'LIVRO RAZÃO',
};

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** Converte `yyyy-MM-dd` em `dd/MM/yyyy` sem depender de fuso horário. */
export function formatarDataIso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Converte `yyyy-MM-dd` em data por extenso ("5 de março de 2026"). */
export function dataPorExtenso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const mesIndex = Number(m[2]) - 1;
  if (mesIndex < 0 || mesIndex > 11) return iso;
  return `${Number(m[3])} de ${MESES[mesIndex]} de ${m[1]}`;
}

function identificacao(p: TermoParams): string {
  const partes = [
    p.razaoSocial.trim() || '—',
    `inscrita no CNPJ sob o nº ${p.cnpj?.trim() || '—'}`,
  ];
  if (p.nire) {
    partes.push(`registrada na ${p.orgaoRegistro || 'Junta Comercial'} sob o NIRE nº ${p.nire}`);
  }
  if (p.municipio || p.uf) {
    partes.push(`com sede em ${[p.municipio, p.uf].filter(Boolean).join('/')}`);
  }
  return partes.join(', ');
}

function assinaturas(p: TermoParams): string[] {
  const linhas: string[] = [];
  if (p.responsavelNome) {
    linhas.push(`${p.responsavelNome} — Representante Legal`);
  }
  if (p.contadorNome) {
    linhas.push(`${p.contadorNome} — Contador(a)${p.contadorCrc ? ` · CRC ${p.contadorCrc}` : ''}`);
  }
  return linhas;
}

/** Termo de Abertura, impresso na primeira página do livro. */
export function buildTermoAbertura(p: TermoParams): string[] {
  const label = LABEL_LIVRO[p.tipoLivro];
  return [
    `TERMO DE ABERTURA — ${label} Nº ${p.numeroLivro}`,
    '',
    `Contém este livro ${p.totalPaginas} página(s), numeradas sequencialmente de 1 a ${p.totalPaginas}, `
      + `todas rubricadas por meio eletrônico, e servirá como ${label.toLowerCase()} da empresa `
      + `${identificacao(p)}.`,
    '',
    `Período escriturado: de ${formatarDataIso(p.dataInicio)} a ${formatarDataIso(p.dataFim)}.`,
    ...assinaturas(p).length ? ['', 'Responsáveis:', ...assinaturas(p)] : [],
  ];
}

/** Termo de Encerramento, impresso na última página do livro. */
export function buildTermoEncerramento(p: TermoParams): string[] {
  const label = LABEL_LIVRO[p.tipoLivro];
  return [
    `TERMO DE ENCERRAMENTO — ${label} Nº ${p.numeroLivro}`,
    '',
    `Contém este livro ${p.totalPaginas} página(s), numeradas sequencialmente de 1 a ${p.totalPaginas}, `
      + `e encerra a escrituração do ${label.toLowerCase()} da empresa ${identificacao(p)}, `
      + `referente ao período de ${formatarDataIso(p.dataInicio)} a ${formatarDataIso(p.dataFim)}.`,
    '',
    `${p.municipio ? `${p.municipio}, ` : ''}${dataPorExtenso(p.dataFim)}.`,
    ...assinaturas(p).length ? ['', 'Responsáveis:', ...assinaturas(p)] : [],
  ];
}
