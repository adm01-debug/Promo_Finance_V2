import { formatCNPJ, validateCNPJ } from './cnpj';
import { formatCPF, validateCPF } from './cpf';

export function validateCPFOrCNPJ(document: string): boolean {
  const clean = document.replace(/\D/g, '');
  if (clean.length === 11) return validateCPF(clean);
  if (clean.length === 14) return validateCNPJ(clean);
  return false;
}

export function formatCPFOrCNPJ(document: string): string {
  const clean = document.replace(/\D/g, '');
  if (clean.length === 11) return formatCPF(clean);
  if (clean.length === 14) return formatCNPJ(clean);
  return document;
}
