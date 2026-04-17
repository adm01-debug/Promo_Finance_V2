// ============================================
// CSV IMPORTER — Faturamento + Folha mensal
// Detecta encoding, separador e valida linhas
// ============================================

export type CsvKind = 'faturamento' | 'folha';

export interface FaturamentoRow {
  ano: number;
  mes: number;
  receita_bruta: number;
  receita_servicos: number;
  receita_revenda: number;
  receita_industria: number;
  receita_exportacao: number;
}

export interface FolhaRow {
  ano: number;
  mes: number;
  salarios: number;
  pro_labore: number;
  encargos: number;
  total_folha: number;
  numero_funcionarios: number;
}

export interface CsvParseResult<T> {
  rows: T[];
  errors: { line: number; message: string }[];
  separator: string;
  encoding: string;
  totalLines: number;
}

const HEADER_FATURAMENTO = [
  'ano',
  'mes',
  'receita_bruta',
  'receita_servicos',
  'receita_revenda',
  'receita_industria',
  'receita_exportacao',
];

const HEADER_FOLHA = [
  'ano',
  'mes',
  'salarios',
  'pro_labore',
  'encargos',
  'total_folha',
  'numero_funcionarios',
];

/** Detecta encoding tentando UTF-8 primeiro; fallback Latin-1 se houver caractere de substituição. */
async function decodeFile(file: File): Promise<{ text: string; encoding: string }> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (!utf8.includes('\uFFFD')) return { text: utf8, encoding: 'utf-8' };
  const latin1 = new TextDecoder('iso-8859-1').decode(buf);
  return { text: latin1, encoding: 'iso-8859-1' };
}

/** Detecta o separador mais frequente entre `,` `;` e tab. */
function detectSeparator(sample: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of sample) if (ch in counts) counts[ch]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ',';
}

/** Converte string numérica BR/US em number. Aceita "1.234,56", "1234.56", "1234". */
function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw
    .trim()
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')
    .replace(/[^\d,.\-]/g, '');
  if (!cleaned) return 0;
  // Heurística BR: "1.234,56" → último separador é vírgula
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    return Number(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return Number(cleaned.replace(/,/g, ''));
}

function splitCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function parseCsv<T>(
  file: File,
  kind: CsvKind,
): Promise<CsvParseResult<T>> {
  const { text, encoding } = await decodeFile(file);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: { line: number; message: string }[] = [];

  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: 'Arquivo vazio ou sem dados.' }], separator: ',', encoding, totalLines: 0 };
  }

  const sep = detectSeparator(lines[0]);
  const headerRaw = splitCsvLine(lines[0], sep).map(normalizeHeader);
  const expected = kind === 'faturamento' ? HEADER_FATURAMENTO : HEADER_FOLHA;

  // Mapeia índices das colunas esperadas
  const colIdx: Record<string, number> = {};
  for (const col of expected) colIdx[col] = headerRaw.indexOf(col);

  const missing = expected.filter((c) => colIdx[c] === -1 && c !== 'numero_funcionarios');
  if (missing.length > 0) {
    errors.push({
      line: 1,
      message: `Colunas obrigatórias faltando: ${missing.join(', ')}. Esperado: ${expected.join(', ')}`,
    });
    return { rows: [], errors, separator: sep, encoding, totalLines: lines.length - 1 };
  }

  const rows: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], sep);
    try {
      const ano = Number(cols[colIdx.ano]);
      const mes = Number(cols[colIdx.mes]);
      if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
        errors.push({ line: i + 1, message: `Ano inválido: "${cols[colIdx.ano]}"` });
        continue;
      }
      if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
        errors.push({ line: i + 1, message: `Mês inválido: "${cols[colIdx.mes]}"` });
        continue;
      }
      if (kind === 'faturamento') {
        const row: FaturamentoRow = {
          ano,
          mes,
          receita_bruta: parseNumber(cols[colIdx.receita_bruta]),
          receita_servicos: parseNumber(cols[colIdx.receita_servicos]),
          receita_revenda: parseNumber(cols[colIdx.receita_revenda]),
          receita_industria: parseNumber(cols[colIdx.receita_industria]),
          receita_exportacao: parseNumber(cols[colIdx.receita_exportacao]),
        };
        if (row.receita_bruta <= 0) {
          errors.push({ line: i + 1, message: 'Receita bruta deve ser > 0' });
          continue;
        }
        rows.push(row as unknown as T);
      } else {
        const row: FolhaRow = {
          ano,
          mes,
          salarios: parseNumber(cols[colIdx.salarios]),
          pro_labore: parseNumber(cols[colIdx.pro_labore]),
          encargos: parseNumber(cols[colIdx.encargos]),
          total_folha: parseNumber(cols[colIdx.total_folha]),
          numero_funcionarios:
            colIdx.numero_funcionarios >= 0 ? Number(cols[colIdx.numero_funcionarios] || 0) : 0,
        };
        if (row.total_folha <= 0) {
          row.total_folha = row.salarios + row.pro_labore + row.encargos;
        }
        if (row.total_folha <= 0) {
          errors.push({ line: i + 1, message: 'Total da folha deve ser > 0' });
          continue;
        }
        rows.push(row as unknown as T);
      }
    } catch (e) {
      errors.push({ line: i + 1, message: e instanceof Error ? e.message : 'Erro ao processar linha' });
    }
  }

  return { rows, errors, separator: sep, encoding, totalLines: lines.length - 1 };
}

export function downloadCsvTemplate(kind: CsvKind) {
  const ano = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  const headers =
    kind === 'faturamento'
      ? HEADER_FATURAMENTO.join(';')
      : HEADER_FOLHA.join(';');
  const example =
    kind === 'faturamento'
      ? `${ano};${mes};100000,00;30000,00;50000,00;20000,00;0,00`
      : `${ano};${mes};25000,00;5000,00;7500,00;37500,00;5`;
  const csv = `${headers}\n${example}\n`;
  // BOM para Excel reconhecer UTF-8
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `template-${kind}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
