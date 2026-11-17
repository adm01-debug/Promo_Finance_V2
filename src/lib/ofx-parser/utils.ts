// Shared parsing helpers for OFX/CSV bank statements

export function parseOFXDate(dateStr: string): Date {
  // OFX date format: YYYYMMDDHHMMSS or YYYYMMDD
  if (!/^\d{8}(\d{6})?$/.test(dateStr)) {
    throw new Error(`Data OFX inválida: ${dateStr}`);
  }
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = dateStr.length > 8 ? parseInt(dateStr.substring(8, 10), 10) : 0;
  const min = dateStr.length > 10 ? parseInt(dateStr.substring(10, 12), 10) : 0;
  const sec = dateStr.length > 12 ? parseInt(dateStr.substring(12, 14), 10) : 0;

  const d = new Date(year, month, day, hour, min, sec);
  if (
    isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month ||
    d.getDate() !== day ||
    d.getHours() !== hour ||
    d.getMinutes() !== min ||
    d.getSeconds() !== sec
  ) {
    throw new Error(`Data OFX inválida: ${dateStr}`);
  }
  return d;
}

export function parseData(dateStr: string): Date {
  const cleaned = dateStr.replace(/"/g, '').trim();

  // DD/MM/YYYY or DD-MM-YYYY (Brazilian format)
  let match = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    let year = parseInt(match[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (
      isNaN(d.getTime()) ||
      d.getFullYear() !== year ||
      d.getMonth() !== month ||
      d.getDate() !== day
    ) {
      throw new Error(`Data inválida: ${dateStr}`);
    }
    return d;
  }

  // YYYY-MM-DD or YYYY/MM/DD (ISO-like, local time)
  match = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (
      isNaN(d.getTime()) ||
      d.getFullYear() !== year ||
      d.getMonth() !== month ||
      d.getDate() !== day
    ) {
      throw new Error(`Data inválida: ${dateStr}`);
    }
    return d;
  }

  // No native fallback — too ambiguous (US MM/DD/YYYY vs BR DD/MM/YYYY
  // would parse to different days silently). Reject explicitly.
  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
}

/**
 * Valor monetario de extrato bancario, em texto.
 *
 * Fica aqui, e nao em csv.ts, porque os dois parsers de extrato precisam da
 * MESMA regra: o parseCSV foi corrigido em 2026-09 e o parseExcel ficou com a
 * logica antiga (`parseFloat` depois de trocar a primeira virgula por ponto).
 * O resultado era que o mesmo extrato importado em .xlsx entrava com valor mil
 * vezes menor ("1.234,56" -> 1.234) e celula nao numerica entrava como NaN,
 * sem aviso. Uma funcao so para os dois impede a divergencia de voltar.
 *
 * Lanca em entrada invalida de proposito: os dois chamadores transformam o
 * throw em linha ignorada com aviso, em vez de aceitar numero inventado.
 */
export function parseValorMonetario(valorRaw: string): number {
  const cleaned = valorRaw
    .trim()
    .replace(/^R\$\s*/i, '')
    .replace(/\s/g, '');
  let normalized: string;
  if (/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+\.\d{1,2}$/.test(cleaned)) {
    // Extratos internacionais normalmente usam ponto decimal. So aceite essa
    // forma quando ela nao puder ser confundida com agrupamento BRL de milhar.
    normalized = cleaned;
  } else {
    throw new Error(`Valor inválido: ${valorRaw}`);
  }
  const valor = Number(normalized);
  if (!Number.isFinite(valor)) throw new Error(`Valor inválido: ${valorRaw}`);
  return valor;
}

export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
