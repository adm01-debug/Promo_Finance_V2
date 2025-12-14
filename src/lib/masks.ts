// Mask utilities for Brazilian document and phone formats

export function maskCnpjCpf(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ: 00.000.000/0000-00
    return digits
      .substring(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 10) {
    // Fixed: (00) 0000-0000
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  } else {
    // Mobile: (00) 00000-0000
    return digits
      .substring(0, 11)
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }
}

export function unmask(value: string): string {
  return value.replace(/\D/g, '');
}

// Validate CPF using the official algorithm
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

// Validate CNPJ using the official algorithm
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  
  if (digits.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;
  
  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits[13])) return false;
  
  return true;
}

// Validate either CPF or CNPJ based on length
export function validateCnpjCpf(value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null; message?: string } {
  const digits = value.replace(/\D/g, '');
  
  if (!digits) return { valid: true, type: null }; // Empty is valid (optional field)
  
  if (digits.length === 11) {
    const valid = validateCPF(digits);
    return { 
      valid, 
      type: 'cpf',
      message: valid ? undefined : 'CPF inválido' 
    };
  }
  
  if (digits.length === 14) {
    const valid = validateCNPJ(digits);
    return { 
      valid, 
      type: 'cnpj',
      message: valid ? undefined : 'CNPJ inválido' 
    };
  }
  
  return { 
    valid: false, 
    type: null,
    message: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)' 
  };
}
