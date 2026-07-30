import type { BulkResult, BulkUserInput } from './sandbox-bulk-runner';

export interface ParsedCsv {
  users: BulkUserInput[];
  errors: Array<{ line: number; message: string }>;
}

function splitLine(line: string, delim: string): string[] {
  // Parser CSV simples: suporta aspas duplas; campos sem aspas não podem conter o delimitador.
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { cur += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === delim) { out.push(cur); cur = ''; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) ?? []).length;
  const comma = (headerLine.match(/,/g) ?? []).length;
  return semi > comma ? ';' : ',';
}

/**
 * Parse CSV com cabeçalho na primeira linha. Coluna `groups` separada por `|`.
 * Demais colunas viram campos livres no objeto de claims.
 */
export function parseBulkCsv(text: string): ParsedCsv {
  const errors: ParsedCsv['errors'] = [];
  const users: BulkUserInput[] = [];

  // Remove BOM
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 1) {
    errors.push({ line: 0, message: 'CSV vazio' });
    return { users, errors };
  }

  const delim = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delim).map(h => h.toLowerCase());
  if (!headers.includes('email')) {
    errors.push({ line: 1, message: 'Cabeçalho deve conter coluna "email"' });
    return { users, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], delim);
    if (cols.length !== headers.length) {
      errors.push({
        line: i + 1,
        message: `Esperava ${headers.length} colunas, recebeu ${cols.length}`,
      });
      continue;
    }
    const claims: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      const val = cols[idx];
      if (h === 'groups') {
        claims[h] = val ? val.split('|').map(g => g.trim()).filter(Boolean) : [];
      } else if (val === '') {
        claims[h] = '';
      } else {
        claims[h] = val;
      }
    });
    users.push({ row: i + 1, claims });
  }

  return { users, errors };
}

/**
 * Parse JSON array de claims. Cada item vira um BulkUserInput (row 1-based).
 */
export function parseBulkJson(text: string): ParsedCsv {
  const errors: ParsedCsv['errors'] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    errors.push({ line: 0, message: `JSON inválido: ${(e as Error).message}` });
    return { users: [], errors };
  }
  if (!Array.isArray(parsed)) {
    errors.push({ line: 0, message: 'Esperava um array de objetos' });
    return { users: [], errors };
  }
  const users: BulkUserInput[] = [];
  parsed.forEach((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ line: i + 1, message: 'Item não é um objeto' });
      return;
    }
    users.push({ row: i + 1, claims: item as Record<string, unknown> });
  });
  return { users, errors };
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [user, domain] = email.split('@');
  const head = user.slice(0, 1);
  const tail = user.length > 2 ? user.slice(-1) : '';
  return `${head}${'*'.repeat(Math.max(1, user.length - 2))}${tail}@${domain}`;
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Exporta resultado do lote como CSV UTF-8 com BOM (compatível com Excel pt-BR).
 */
export function exportBulkResultsCsv(results: BulkResult[]): string {
  const headers = ['linha', 'email_mascarado', 'dominio', 'grupos', 'papel_resolvido', 'grupo_casado', 'outcome', 'motivo'];
  const rows = results.map(r => {
    const p = r.result?.preview;
    const emailRaw = p?.email ?? (r.claims.email as string | undefined) ?? '';
    return [
      r.row,
      p?.email ?? maskEmail(String(emailRaw)),
      p?.domain ?? '',
      (p?.groups ?? []).join('|'),
      p?.resolved_role ?? '',
      p?.matched_group ?? '',
      r.outcome,
      r.reason ?? '',
    ];
  });
  const lines = [headers.join(';'), ...rows.map(r => r.map(csvEscape).join(';'))];
  return '\uFEFF' + lines.join('\r\n');
}

/**
 * Helper p/ disparar download no browser.
 */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const BULK_EXAMPLE_USERS = [
  { email: 'admin.financeiro@empresa.com.br', name: 'Ana Admin', groups: ['Admins-Financeiro'] },
  { email: 'admin.ti@empresa.com.br', name: 'Bruno Admin TI', groups: ['Admins-TI'] },
  { email: 'op1@empresa.com.br', name: 'Carla Operação', groups: ['Operacional'] },
  { email: 'op2@empresa.com.br', name: 'Diego Operação', groups: ['Operacional', 'Todos'] },
  { email: 'fin1@empresa.com.br', name: 'Eva Financeiro', groups: ['Admins-Financeiro', 'Todos'] },
  { email: 'visitante@empresa.com.br', name: 'Fábio Visitante', groups: [] },
  { email: 'multi@empresa.com.br', name: 'Gabi Multi', groups: ['Operacional', 'Admins-Financeiro'] },
  { email: 'externo@gmail.com', name: 'Hugo Externo', groups: ['Operacional'] },
  { email: 'ContatO@EMPRESA.COM.BR', name: 'Iara Caixa Mista', groups: ['Operacional'] },
  { email: 'malformado-sem-arroba', name: 'João Bug', groups: ['Operacional'] },
  { email: '', name: 'Sem Email', groups: ['Operacional'] },
  { email: 'kaio@empresa.com.br', name: 'Kaio Sem Grupo', groups: ['Desconhecido-X'] },
];
