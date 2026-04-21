// ============================================
// CSV IMPORTER — Lançamentos contábeis em lote
// Cada linha = uma partida; agrupa por lancamento_ref
// ============================================

import type { PlanoContaRow } from '@/hooks/usePlanoContas';

export interface ParsedPartida {
  conta_id: string;
  conta_codigo: string;
  tipo: 'D' | 'C';
  valor: number;
  historico_complementar?: string;
  linha: number;
}

export interface ParsedLancamento {
  ref: string;
  data: string; // YYYY-MM-DD
  historico: string;
  partidas: ParsedPartida[];
  total_debito: number;
  total_credito: number;
  balanceado: boolean;
  warnings: string[];
}

export interface CsvLancParseResult {
  lancamentos: ParsedLancamento[];
  errors: { line: number; ref?: string; message: string }[];
  warnings: { line: number; ref?: string; message: string }[];
  separator: string;
  encoding: string;
  totalLines: number;
  totalPartidas: number;
}

const HEADER_REQUIRED = ['lancamento_ref', 'data', 'historico', 'conta_codigo', 'tipo', 'valor'];
const HEADER_OPTIONAL = ['historico_complementar'];

async function decodeFile(file: File): Promise<{ text: string; encoding: string }> {
  const buf = await file.arrayBuffer();
  const utf8 = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (!utf8.includes('\uFFFD')) return { text: utf8, encoding: 'utf-8' };
  const latin1 = new TextDecoder('iso-8859-1').decode(buf);
  return { text: latin1, encoding: 'iso-8859-1' };
}

function detectSeparator(sample: string): string {
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  for (const ch of sample) if (ch in counts) counts[ch]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ';';
}

function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = raw.trim().replace(/\s/g, '').replace(/R\$/gi, '').replace(/[^\d,.\-]/g, '');
  if (!cleaned) return 0;
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
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
    } else if (ch === sep && !inQuotes) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const t = raw.trim();
  // ISO YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) {
    const d = new Date(`${t}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : t;
  }
  // BR DD/MM/YYYY
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (br) {
    const [, dd, mm, yyyy] = br;
    const iso2 = `${yyyy}-${mm}-${dd}`;
    const d = new Date(`${iso2}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : iso2;
  }
  return null;
}

export async function parseLancamentosCsv(
  file: File,
  planoContas: PlanoContaRow[],
): Promise<CsvLancParseResult> {
  const { text, encoding } = await decodeFile(file);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: CsvLancParseResult['errors'] = [];
  const warnings: CsvLancParseResult['warnings'] = [];

  if (lines.length < 2) {
    return { lancamentos: [], errors: [{ line: 0, message: 'Arquivo vazio ou sem dados.' }], warnings, separator: ';', encoding, totalLines: 0, totalPartidas: 0 };
  }

  const sep = detectSeparator(lines[0]);
  const headerRaw = splitCsvLine(lines[0], sep).map(normalizeHeader);
  const colIdx: Record<string, number> = {};
  for (const col of [...HEADER_REQUIRED, ...HEADER_OPTIONAL]) colIdx[col] = headerRaw.indexOf(col);

  const missing = HEADER_REQUIRED.filter((c) => colIdx[c] === -1);
  if (missing.length > 0) {
    errors.push({ line: 1, message: `Colunas obrigatórias faltando: ${missing.join(', ')}. Esperado: ${HEADER_REQUIRED.join(', ')}` });
    return { lancamentos: [], errors, warnings, separator: sep, encoding, totalLines: lines.length - 1, totalPartidas: 0 };
  }

  // Index plano de contas por código (apenas analíticas usáveis)
  const planoMap = new Map<string, PlanoContaRow>();
  for (const c of planoContas) {
    if (c.codigo) planoMap.set(c.codigo.trim(), c);
  }

  // Parse linha a linha (cada linha = 1 partida candidata)
  type RawRow = {
    line: number;
    ref: string;
    data: string | null;
    historico: string;
    conta_codigo: string;
    tipo: 'D' | 'C' | null;
    valor: number;
    historico_complementar?: string;
    conta?: PlanoContaRow;
    valid: boolean;
  };

  const rawRows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const cols = splitCsvLine(lines[i], sep);
    const ref = (cols[colIdx.lancamento_ref] || '').trim();
    const dataRaw = (cols[colIdx.data] || '').trim();
    const historico = (cols[colIdx.historico] || '').trim();
    const conta_codigo = (cols[colIdx.conta_codigo] || '').trim();
    const tipoRaw = (cols[colIdx.tipo] || '').trim().toUpperCase();
    const valor = parseNumber(cols[colIdx.valor]);
    const hc = colIdx.historico_complementar >= 0 ? (cols[colIdx.historico_complementar] || '').trim() : '';

    let valid = true;
    if (!ref) { errors.push({ line: lineNum, message: '`lancamento_ref` vazio' }); valid = false; }
    const dataIso = parseDate(dataRaw);
    if (!dataIso) { errors.push({ line: lineNum, ref, message: `Data inválida: "${dataRaw}" (use YYYY-MM-DD ou DD/MM/YYYY)` }); valid = false; }
    if (!historico) { errors.push({ line: lineNum, ref, message: 'Histórico vazio' }); valid = false; }
    const tipo: 'D' | 'C' | null = tipoRaw === 'D' || tipoRaw === 'DEBITO' || tipoRaw === 'DÉBITO' ? 'D'
      : tipoRaw === 'C' || tipoRaw === 'CREDITO' || tipoRaw === 'CRÉDITO' ? 'C' : null;
    if (!tipo) { errors.push({ line: lineNum, ref, message: `Tipo inválido: "${tipoRaw}" (use D ou C)` }); valid = false; }
    if (!(valor > 0)) { errors.push({ line: lineNum, ref, message: `Valor inválido: "${cols[colIdx.valor]}"` }); valid = false; }

    let conta: PlanoContaRow | undefined;
    if (conta_codigo) {
      conta = planoMap.get(conta_codigo);
      if (!conta) { errors.push({ line: lineNum, ref, message: `Conta "${conta_codigo}" não existe no plano da empresa` }); valid = false; }
      else if (conta.tipo !== 'analitica') {
        errors.push({ line: lineNum, ref, message: `Conta "${conta_codigo}" é sintética; use uma conta analítica` });
        valid = false;
      } else if (conta.ativo === false) {
        warnings.push({ line: lineNum, ref, message: `Conta "${conta_codigo}" está inativa` });
      }
    } else {
      errors.push({ line: lineNum, ref, message: 'Código da conta vazio' }); valid = false;
    }

    rawRows.push({ line: lineNum, ref, data: dataIso, historico, conta_codigo, tipo, valor, historico_complementar: hc || undefined, conta, valid });
  }

  // Agrupa por ref
  const groups = new Map<string, RawRow[]>();
  for (const r of rawRows) {
    if (!r.ref) continue;
    const arr = groups.get(r.ref) || [];
    arr.push(r);
    groups.set(r.ref, arr);
  }

  const lancamentos: ParsedLancamento[] = [];
  for (const [ref, rows] of groups) {
    const allValid = rows.every((r) => r.valid);
    const validRows = rows.filter((r) => r.valid && r.conta && r.tipo && r.data);

    // Datas divergentes
    const datasUnicas = new Set(validRows.map((r) => r.data!));
    if (datasUnicas.size > 1) {
      warnings.push({ line: rows[0].line, ref, message: `Datas divergentes no grupo (${[...datasUnicas].join(', ')}); usando a primeira` });
    }
    // Históricos divergentes
    const histUnicos = new Set(validRows.map((r) => r.historico));
    if (histUnicos.size > 1) {
      warnings.push({ line: rows[0].line, ref, message: 'Históricos divergentes no grupo; usando o primeiro' });
    }

    const partidas: ParsedPartida[] = validRows.map((r) => ({
      conta_id: r.conta!.id,
      conta_codigo: r.conta_codigo,
      tipo: r.tipo!,
      valor: r.valor,
      historico_complementar: r.historico_complementar,
      linha: r.line,
    }));

    const total_debito = partidas.filter((p) => p.tipo === 'D').reduce((s, p) => s + p.valor, 0);
    const total_credito = partidas.filter((p) => p.tipo === 'C').reduce((s, p) => s + p.valor, 0);
    const balanceado = Math.abs(total_debito - total_credito) < 0.01 && total_debito > 0;

    if (allValid && partidas.length < 2) {
      errors.push({ line: rows[0].line, ref, message: `Lançamento "${ref}" tem menos de 2 partidas` });
    }
    if (allValid && partidas.length >= 2 && !balanceado) {
      errors.push({
        line: rows[0].line,
        ref,
        message: `Lançamento "${ref}" não balanceia: D=${total_debito.toFixed(2)} ≠ C=${total_credito.toFixed(2)}`,
      });
    }

    const lancWarnings: string[] = [];
    if (datasUnicas.size > 1) lancWarnings.push('datas divergentes');
    if (histUnicos.size > 1) lancWarnings.push('históricos divergentes');

    lancamentos.push({
      ref,
      data: validRows[0]?.data || '',
      historico: validRows[0]?.historico || '',
      partidas,
      total_debito,
      total_credito,
      balanceado,
      warnings: lancWarnings,
    });
  }

  return {
    lancamentos,
    errors,
    warnings,
    separator: sep,
    encoding,
    totalLines: lines.length - 1,
    totalPartidas: rawRows.length,
  };
}

export function downloadLancamentosCsvTemplate() {
  const today = new Date().toISOString().slice(0, 10);
  const headers = [...HEADER_REQUIRED, ...HEADER_OPTIONAL].join(';');
  const example = [
    `1;${today};Pgto fornecedor NF 12345;2.1.01;D;1500,00;Parcela 1/3`,
    `1;${today};Pgto fornecedor NF 12345;1.1.01;C;1500,00;`,
    `2;${today};Recebimento cliente Acme;1.1.01;D;800,00;`,
    `2;${today};Recebimento cliente Acme;3.1.01;C;800,00;Vendas`,
  ].join('\n');
  const csv = `${headers}\n${example}\n`;
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template-lancamentos-contabeis.csv';
  a.click();
  URL.revokeObjectURL(url);
}
