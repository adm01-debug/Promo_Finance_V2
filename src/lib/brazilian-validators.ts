/**
 * Brazilian Document Validators
 * Comprehensive validation utilities for CPF, CNPJ, and other Brazilian documents
 */

/**
 * Validates a Brazilian CPF (Cadastro de Pessoas Físicas)
 * @param cpf - CPF string with or without formatting
 * @returns boolean indicating if CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '');

  // CPF must have 11 digits
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) {
    return false;
  }

  return true;
}

/**
 * Validates a Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * @param cnpj - CNPJ string with or without formatting
 * @returns boolean indicating if CNPJ is valid
 */
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // CNPJ must have 14 digits
  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Check for known invalid CNPJs (all same digits)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false;
  }

  // Validate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) {
    return false;
  }

  // Validate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) {
    return false;
  }

  return true;
}

/**
 * Validates CPF or CNPJ based on length
 * @param document - Document string with or without formatting
 * @returns boolean indicating if document is valid
 */
export function validateCPFOrCNPJ(document: string): boolean {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length === 11) {
    return validateCPF(cleanDocument);
  }
  
  if (cleanDocument.length === 14) {
    return validateCNPJ(cleanDocument);
  }
  
  return false;
}

/**
 * Formats a CPF string
 * @param cpf - CPF string (only digits)
 * @returns formatted CPF (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return cpf;
  }
  
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats a CNPJ string
 * @param cnpj - CNPJ string (only digits)
 * @returns formatted CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) {
    return cnpj;
  }
  
  return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formats CPF or CNPJ based on length
 * @param document - Document string
 * @returns formatted document
 */
export function formatCPFOrCNPJ(document: string): string {
  const cleanDocument = document.replace(/\D/g, '');
  
  if (cleanDocument.length === 11) {
    return formatCPF(cleanDocument);
  }
  
  if (cleanDocument.length === 14) {
    return formatCNPJ(cleanDocument);
  }
  
  return document;
}

/**
 * Generates a valid random CPF
 * @returns formatted CPF string
 */
export function generateCPF(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 9 }, random);

  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += n[i] * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  n.push(remainder);

  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += n[i] * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  n.push(remainder);

  return formatCPF(n.join(''));
}

/**
 * Generates a valid random CNPJ
 * @returns formatted CNPJ string
 */
export function generateCNPJ(): string {
  const random = () => Math.floor(Math.random() * 10);
  const n = Array.from({ length: 8 }, random);
  n.push(0, 0, 0, 1); // Standard branch suffix

  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += n[i] * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  n.push(digit1);

  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += n[i] * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  n.push(digit2);

  return formatCNPJ(n.join(''));
}

/**
 * Validates a Brazilian phone number
 * @param phone - Phone number with or without formatting
 * @returns boolean indicating if phone is valid
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Valid formats: 10 digits (landline) or 11 digits (mobile)
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return false;
  }
  
  // Check valid DDD (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Mobile numbers start with 9
  if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') {
    return false;
  }
  
  return true;
}

/**
 * Formats a Brazilian phone number
 * @param phone - Phone number (only digits)
 * @returns formatted phone
 */
export function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Validates a Brazilian CEP (postal code)
 * @param cep - CEP with or without formatting
 * @returns boolean indicating if CEP is valid
 */
export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/\D/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
}

/**
 * Formats a Brazilian CEP
 * @param cep - CEP (only digits)
 * @returns formatted CEP (XXXXX-XXX)
 */
export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/\D/g, '');
  
  if (cleanCEP.length !== 8) {
    return cep;
  }
  
  return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Validates a Brazilian state abbreviation
 * @param state - Two-letter state code
 * @returns boolean indicating if state is valid
 */
export function validateState(state: string): boolean {
  const validStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  return validStates.includes(state.toUpperCase());
}

/**
 * Gets the state name from abbreviation
 * @param abbr - Two-letter state abbreviation
 * @returns full state name or empty string if invalid
 */
export function getStateName(abbr: string): string {
  const states: Record<string, string> = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins',
  };
  
  return states[abbr.toUpperCase()] || '';
}

/**
 * Gets all Brazilian states
 * @returns array of state objects with abbr and name
 */
export function getAllStates(): Array<{ abbr: string; name: string }> {
  return [
    { abbr: 'AC', name: 'Acre' },
    { abbr: 'AL', name: 'Alagoas' },
    { abbr: 'AP', name: 'Amapá' },
    { abbr: 'AM', name: 'Amazonas' },
    { abbr: 'BA', name: 'Bahia' },
    { abbr: 'CE', name: 'Ceará' },
    { abbr: 'DF', name: 'Distrito Federal' },
    { abbr: 'ES', name: 'Espírito Santo' },
    { abbr: 'GO', name: 'Goiás' },
    { abbr: 'MA', name: 'Maranhão' },
    { abbr: 'MT', name: 'Mato Grosso' },
    { abbr: 'MS', name: 'Mato Grosso do Sul' },
    { abbr: 'MG', name: 'Minas Gerais' },
    { abbr: 'PA', name: 'Pará' },
    { abbr: 'PB', name: 'Paraíba' },
    { abbr: 'PR', name: 'Paraná' },
    { abbr: 'PE', name: 'Pernambuco' },
    { abbr: 'PI', name: 'Piauí' },
    { abbr: 'RJ', name: 'Rio de Janeiro' },
    { abbr: 'RN', name: 'Rio Grande do Norte' },
    { abbr: 'RS', name: 'Rio Grande do Sul' },
    { abbr: 'RO', name: 'Rondônia' },
    { abbr: 'RR', name: 'Roraima' },
    { abbr: 'SC', name: 'Santa Catarina' },
    { abbr: 'SP', name: 'São Paulo' },
    { abbr: 'SE', name: 'Sergipe' },
    { abbr: 'TO', name: 'Tocantins' },
  ];
}

/**
 * Validates a Brazilian bank account
 * @param bank - Bank code
 * @param agency - Agency number
 * @param account - Account number
 * @returns boolean indicating if bank account format is valid
 */
export function validateBankAccount(bank: string, agency: string, account: string): boolean {
  // Basic validation - can be enhanced with specific bank rules
  const cleanBank = bank.replace(/\D/g, '');
  const cleanAgency = agency.replace(/\D/g, '');
  const cleanAccount = account.replace(/\D/g, '');
  
  // Bank code: 3 digits
  if (cleanBank.length !== 3) {
    return false;
  }
  
  // Agency: 4-5 digits
  if (cleanAgency.length < 4 || cleanAgency.length > 5) {
    return false;
  }
  
  // Account: 5-12 digits (varies by bank)
  if (cleanAccount.length < 5 || cleanAccount.length > 12) {
    return false;
  }
  
  return true;
}

/**
 * Validates a PIX key
 * @param key - PIX key
 * @param type - Type of PIX key (cpf, cnpj, phone, email, random)
 * @returns boolean indicating if PIX key is valid
 */
export function validatePIXKey(key: string, type?: 'cpf' | 'cnpj' | 'phone' | 'email' | 'random'): boolean {
  const cleanKey = key.trim();
  
  // Auto-detect type if not provided
  if (!type) {
    const cleanDigits = cleanKey.replace(/\D/g, '');
    
    if (cleanDigits.length === 11 && validateCPF(cleanDigits)) {
      return true;
    }
    
    if (cleanDigits.length === 14 && validateCNPJ(cleanDigits)) {
      return true;
    }
    
    if ((cleanDigits.length === 10 || cleanDigits.length === 11) && validatePhone(cleanDigits)) {
      return true;
    }
    
    if (cleanKey.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanKey)) {
      return true;
    }
    
    // Random key: 32 characters, alphanumeric with hyphens
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(cleanKey)) {
      return true;
    }
    
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
