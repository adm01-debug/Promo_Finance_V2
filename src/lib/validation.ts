export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}

export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  const calc = (x: number) => {
    const slice = cnpj.slice(0, x);
    let factor = x - 7;
    let sum = 0;
    for (let i = x; i >= 1; i--) {
      sum += parseInt(slice[x - i]) * factor--;
      if (factor < 2) factor = 9;
    }
    const result = 11 - (sum % 11);
    return result > 9 ? 0 : result;
  };
  return calc(12) === parseInt(cnpj[12]) && calc(13) === parseInt(cnpj[13]);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

export function isValidCEP(cep: string): boolean {
  return /^\d{5}-?\d{3}$/.test(cep);
}

export function required(message = 'Campo obrigatório') {
  return (value: any) => (value ? undefined : message);
}

export function minLength(min: number, message?: string) {
  return (value: string) =>
    value && value.length >= min ? undefined : message || `Mínimo ${min} caracteres`;
}

export function maxLength(max: number, message?: string) {
  return (value: string) =>
    value && value.length <= max ? undefined : message || `Máximo ${max} caracteres`;
}

export function email(message = 'Email inválido') {
  return (value: string) => (isValidEmail(value) ? undefined : message);
}

export function cpf(message = 'CPF inválido') {
  return (value: string) => (isValidCPF(value) ? undefined : message);
}

export function cnpj(message = 'CNPJ inválido') {
  return (value: string) => (isValidCNPJ(value) ? undefined : message);
}

// Aliases para compatibilidade
export const validateEmail = email;
export const validateRequired = required;
export const validateMinLength = minLength;
export const validateMaxLength = maxLength;
export const validateCPF = cpf;
export const validateCNPJ = cnpj;
