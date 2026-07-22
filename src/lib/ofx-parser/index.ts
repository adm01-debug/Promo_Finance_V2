// Dispatcher — auto-detect bank statement format
import type { ResultadoImportacao } from './types';
import { parseOFC, parseOFX } from './ofx-sgml';
import { parseCSV } from './csv';

export * from './types';
export { parseOFX, parseOFC } from './ofx-sgml';
export { parseCSV } from './csv';
export { parseExcel } from './xlsx';

export function parseExtratoBancario(
  content: string,
  fileName: string,
  mapeamento?: Record<string, string>,
): ResultadoImportacao {
  const extension = fileName.toLowerCase().split('.').pop();
  const contentUpper = content.toUpperCase();

  if (contentUpper.includes('<OFX>') || contentUpper.includes('OFXHEADER')) {
    return parseOFX(content, fileName);
  }

  if (contentUpper.includes('<OFC>') || contentUpper.includes('DOCTYPE OFC')) {
    return parseOFC(content, fileName);
  }

  switch (extension) {
    case 'ofx':
      return parseOFX(content, fileName);
    case 'ofc':
      return parseOFC(content, fileName);
    case 'csv':
    case 'txt':
      return parseCSV(content, fileName, mapeamento);
    default:
      if (content.includes(',') || content.includes(';')) {
        return parseCSV(content, fileName);
      }
      return {
        sucesso: false,
        erro: `Formato de arquivo não suportado: ${extension}`,
        avisos: [],
      };
  }
}
