/**
 * Validators Library
 * Brazilian-specific and common validation utilities
 */

// CPF Validation
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit > 9) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// CNPJ Validation
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validate first digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  // Validate second digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
}

// CPF or CNPJ based on length
export function isValidCPFOrCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) return isValidCPF(cleaned);
  if (cleaned.length === 14) return isValidCNPJ(cleaned);
  return false;
}

// Email Validation
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Phone Validation (Brazilian)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // 10 digits (landline) or 11 digits (mobile)
  return cleaned.length === 10 || cleaned.length === 11;
}

// Mobile Phone Validation (Brazilian)
export function isValidMobilePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // 11 digits starting with 9
  return cleaned.length === 11 && cleaned.charAt(2) === '9';
}

// CEP Validation (Brazilian)
export function isValidCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}

// URL Validation
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Date Validation
export function isValidDate(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date && !isNaN(d.getTime());
}

// Future Date Validation
export function isFutureDate(date: string | Date): boolean {
  if (!isValidDate(date)) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d > new Date();
}

// Past Date Validation
export function isPastDate(date: string | Date): boolean {
  if (!isValidDate(date)) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

// Age Validation (minimum age)
export function isMinimumAge(birthDate: string | Date, minAge: number): boolean {
  if (!isValidDate(birthDate)) return false;
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - d.getFullYear();
  const monthDiff = today.getMonth() - d.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  
  return age >= minAge;
}

// Password Strength Validation
export interface PasswordStrength {
  score: number; // 0-5
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  feedback: string[];
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) score++;
  else feedback.push('Mínimo de 8 caracteres');
  
  if (password.length >= 12) score++;
  
  // Lowercase check
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Adicione letras minúsculas');
  
  // Uppercase check
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Adicione letras maiúsculas');
  
  // Number check
  if (/\d/.test(password)) score++;
  else feedback.push('Adicione números');
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Adicione caracteres especiais');
  
  // Normalize score to 0-5
  score = Math.min(score, 5);
  
  const levels: PasswordStrength['level'][] = ['weak', 'weak', 'fair', 'good', 'strong', 'excellent'];
  
  return {
    score,
    level: levels[score],
    feedback,
  };
}

// Required Field Validation
export function isRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// Min Length Validation
export function hasMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

// Max Length Validation
export function hasMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

// Length Range Validation
export function hasLengthBetween(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

// Number Range Validation
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Positive Number Validation
export function isPositive(value: number): boolean {
  return value > 0;
}

// Non-Negative Number Validation
export function isNonNegative(value: number): boolean {
  return value >= 0;
}

// Integer Validation
export function isInteger(value: number): boolean {
  return Number.isInteger(value);
}

// Credit Card Number Validation (Luhn Algorithm)
export function isValidCreditCard(number: string): boolean {
  const cleaned = number.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Detect Credit Card Brand
export function getCreditCardBrand(number: string): string | null {
  const cleaned = number.replace(/\D/g, '');
  
  const patterns: Record<string, RegExp> = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    jcb: /^(?:2131|1800|35)/,
    elo: /^(?:636368|636297|504175|438935|40117[89]|45763[12]|50904[0-9]|50905[0-9]|50906[0-9]|627780|63629[0-3]|636090)/,
    hipercard: /^(?:606282|3841)/,
  };
  
  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) return brand;
  }
  
  return null;
}

// Brazilian State Validation
export function isValidBrazilianState(uf: string): boolean {
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];
  return states.includes(uf.toUpperCase());
}

// Match Validation (for password confirmation)
export function doMatch(value1: string, value2: string): boolean {
  return value1 === value2;
}

// Alphanumeric Validation
export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

// Only Letters Validation
export function isAlpha(value: string): boolean {
  return /^[a-zA-Z]+$/.test(value);
}

// Only Numbers Validation
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

// Contains Only Allowed Characters
export function hasOnlyAllowedChars(value: string, allowed: string): boolean {
  const regex = new RegExp(`^[${allowed}]+$`);
  return regex.test(value);
}

// No Whitespace Validation
export function hasNoWhitespace(value: string): boolean {
  return !/\s/.test(value);
}

// Validation Result Type
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Combine Multiple Validations
export function validate(
  value: unknown,
  validations: Array<{ check: () => boolean; message: string }>
): ValidationResult {
  const errors: string[] = [];
  
  for (const validation of validations) {
    if (!validation.check()) {
      errors.push(validation.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
