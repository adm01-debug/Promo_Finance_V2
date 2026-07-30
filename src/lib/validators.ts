/**
 * Thin compatibility shim re-exporting the canonical Brazilian-document
 * validators. The historical `validators.ts` and `brazilian-validators.ts`
 * shipped two slightly different CPF/CNPJ implementations; consolidating on
 * `brazilian-validators.ts` (the more thoroughly-tested one) and re-exporting
 * here keeps existing imports working without duplicating logic.
 */
export {
  validateCPF,
  validateCNPJ,
  validateCPFOrCNPJ,
  validatePhone,
  validateCEP,
  validateState,
  validateBankAccount,
  validatePIXKey,
} from './brazilian-validators';

/**
 * Validates an e-mail using a permissive RFC-5322-ish regex.
 * Kept here (not in brazilian-validators.ts) because it isn't BR-specific.
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
