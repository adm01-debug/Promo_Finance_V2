// Shared parsing helpers for OFX/CSV bank statements

export function parseOFXDate(dateStr: string): Date {
  // OFX date format: YYYYMMDDHHMMSS or YYYYMMDD
  if (!/^\d{8}(\d{6})?/.test(dateStr)) {
    throw new Error(`Data OFX inválida: ${dateStr}`);
  }
  const year = parseInt(dateStr.substring(0, 4), 10);
  const month = parseInt(dateStr.substring(4, 6), 10) - 1;
  const day = parseInt(dateStr.substring(6, 8), 10);
  const hour = dateStr.length > 8 ? parseInt(dateStr.substring(8, 10), 10) : 0;
  const min = dateStr.length > 10 ? parseInt(dateStr.substring(10, 12), 10) : 0;
  const sec = dateStr.length > 12 ? parseInt(dateStr.substring(12, 14), 10) : 0;

  const d = new Date(year, month, day, hour, min, sec);
  if (isNaN(d.getTime())) {
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
    if (isNaN(d.getTime())) throw new Error(`Data inválida: ${dateStr}`);
    return d;
  }

  // YYYY-MM-DD or YYYY/MM/DD (ISO-like, local time)
  match = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (match) {
    const d = new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10),
    );
    if (isNaN(d.getTime())) throw new Error(`Data inválida: ${dateStr}`);
    return d;
  }

  // No native fallback — too ambiguous (US MM/DD/YYYY vs BR DD/MM/YYYY
  // would parse to different days silently). Reject explicitly.
  throw new Error(`Formato de data não reconhecido: ${dateStr}`);
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
