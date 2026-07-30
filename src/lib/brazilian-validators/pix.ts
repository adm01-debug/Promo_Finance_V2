import { validateCNPJ } from './cnpj';
import { validateCPF } from './cpf';
import { validatePhone } from './phone';

export function validatePIXKey(
  key: string,
  type?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random',
): boolean {
  const cleanKey = key.trim();

  if (!type) {
    const cleanDigits = cleanKey.replace(/\D/g, '');
    if (cleanDigits.length === 11 && validateCPF(cleanDigits)) return true;
    if (cleanDigits.length === 14 && validateCNPJ(cleanDigits)) return true;
    if (
      (cleanDigits.length === 10 || cleanDigits.length === 11) &&
      validatePhone(cleanDigits)
    ) {
      return true;
    }
    if (cleanKey.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) return true;
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleanKey))
      return true;
    return false;
  }

  switch (type) {
    case 'cpf':
      return validateCPF(cleanKey);
    case 'cnpj':
      return validateCNPJ(cleanKey);
    case 'phone':
      return validatePhone(cleanKey);
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey);
    case 'random':
      return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleanKey);
    default:
      return false;
  }
}
