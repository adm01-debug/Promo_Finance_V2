/**
 * Centralized Validation Library
 * Validators and schemas for the entire application
 */

import { z } from 'zod';

// ==========================================
// REGEX PATTERNS
// ==========================================

export const REGEX = {
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CPF_UNMASKED: /^\d{11}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  CNPJ_UNMASKED: /^\d{14}$/,
  PHONE: /^\(\d{2}\)\s?\d{4,5}-\d{4}$/,
  PHONE_UNMASKED: /^\d{10,11}$/,
  CEP: /^\d{5}-\d{3}$/,
  CEP_UNMASKED: /^\d{8}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  DATE_BR: /^\d{2}\/\d{2}\/\d{4}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  CURRENCY: /^R?\$?\s*\d{1,3}(\.\d{3})*,\d{2}$/,
  BARCODE: /^\d{44,48}$/,
  PIX_KEY_EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PIX_KEY_PHONE: /^\+55\d{10,11}$/,
  PIX_KEY_RANDOM: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
} as const;

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Validate CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned[13])) return false;
  
  return true;
}

/**
 * Validate CPF or CNPJ
 */
export function validateCPFCNPJ(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) return validateCPF(value);
  if (cleaned.length === 14) return validateCNPJ(value);
  return false;
}

/**
 * Validate Email
 */
export function validateEmail(email: string): boolean {
  return REGEX.EMAIL.test(email);
}

/**
 * Validate Phone
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Validate CEP
 */
export function validateCEP(cep: string): boolean {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
}

/**
 * Validate PIX Key
 */
export function validatePixKey(key: string): { valid: boolean; type?: string } {
  const cleaned = key.trim();
  
  // CPF
  if (validateCPF(cleaned)) {
    return { valid: true, type: 'cpf' };
  }
  
  // CNPJ
  if (validateCNPJ(cleaned)) {
    return { valid: true, type: 'cnpj' };
  }
  
  // Email
  if (REGEX.PIX_KEY_EMAIL.test(cleaned)) {
    return { valid: true, type: 'email' };
  }
  
  // Phone
  if (REGEX.PIX_KEY_PHONE.test(cleaned) || validatePhone(cleaned)) {
    return { valid: true, type: 'phone' };
  }
  
  // Random Key (EVP)
  if (REGEX.PIX_KEY_RANDOM.test(cleaned)) {
    return { valid: true, type: 'evp' };
  }
  
  return { valid: false };
}

/**
 * Validate Barcode
 */
export function validateBarcode(barcode: string): boolean {
  const cleaned = barcode.replace(/\D/g, '');
  return cleaned.length >= 44 && cleaned.length <= 48;
}

// ==========================================
// ZOD SCHEMAS
// ==========================================

// Base schemas
export const cpfSchema = z.string().refine(validateCPF, { message: 'CPF inválido' });
export const cnpjSchema = z.string().refine(validateCNPJ, { message: 'CNPJ inválido' });
export const cpfCnpjSchema = z.string().refine(validateCPFCNPJ, { message: 'CPF/CNPJ inválido' });
export const emailSchema = z.string().email({ message: 'E-mail inválido' });
export const phoneSchema = z.string().refine(validatePhone, { message: 'Telefone inválido' });
export const cepSchema = z.string().refine(validateCEP, { message: 'CEP inválido' });

// Currency schema
export const currencySchema = z.number()
  .min(0.01, { message: 'Valor deve ser maior que zero' })
  .max(999999999.99, { message: 'Valor muito alto' });

// Date schemas
export const dateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Data inválida' }
);

export const futureDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date();
  },
  { message: 'Data deve ser futura' }
);

export const pastDateSchema = z.string().refine(
  (val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date <= new Date();
  },
  { message: 'Data deve ser passada' }
);

// ==========================================
// ENTITY SCHEMAS
// ==========================================

// Client schema
export const clienteSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  cnpj_cpf: cpfCnpjSchema.optional(),
  email: emailSchema.optional().or(z.literal('')),
  telefone: phoneSchema.optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  observacoes: z.string().optional(),
  limite_credito: currencySchema.optional(),
});

// Supplier schema
export const fornecedorSchema = z.object({
  razao_social: z.string().min(3, 'Razão social deve ter no mínimo 3 caracteres'),
  nome_fantasia: z.string().optional(),
  cnpj_cpf: cpfCnpjSchema.optional(),
  email: emailSchema.optional().or(z.literal('')),
  telefone: phoneSchema.optional().or(z.literal('')),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  observacoes: z.string().optional(),
});

// Account Payable schema
export const contaPagarSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  fornecedor_nome: z.string().min(2, 'Nome do fornecedor é obrigatório'),
  fornecedor_id: z.string().uuid().optional(),
  valor: currencySchema,
  data_vencimento: dateSchema,
  data_emissao: dateSchema.optional(),
  centro_custo_id: z.string().uuid().optional(),
  conta_bancaria_id: z.string().uuid().optional(),
  numero_documento: z.string().optional(),
  codigo_barras: z.string().optional(),
  observacoes: z.string().optional(),
  recorrente: z.boolean().optional(),
});

// Account Receivable schema
export const contaReceberSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório'),
  cliente_id: z.string().uuid().optional(),
  valor: currencySchema,
  data_vencimento: dateSchema,
  data_emissao: dateSchema.optional(),
  centro_custo_id: z.string().uuid().optional(),
  conta_bancaria_id: z.string().uuid().optional(),
  numero_documento: z.string().optional(),
  observacoes: z.string().optional(),
});

// Bank Account schema
export const contaBancariaSchema = z.object({
  banco: z.string().min(2, 'Nome do banco é obrigatório'),
  codigo_banco: z.string().min(3, 'Código do banco é obrigatório'),
  agencia: z.string().min(4, 'Agência é obrigatória'),
  conta: z.string().min(4, 'Conta é obrigatória'),
  tipo_conta: z.enum(['corrente', 'poupanca', 'investimento']),
  saldo_atual: z.number().optional(),
  saldo_disponivel: z.number().optional(),
});

// Cost Center schema
export const centroCustoSchema = z.object({
  codigo: z.string().min(2, 'Código é obrigatório'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  descricao: z.string().optional(),
  orcamento_previsto: currencySchema.optional(),
  parent_id: z.string().uuid().optional(),
});

// User Profile schema
export const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: emailSchema,
  telefone: phoneSchema.optional().or(z.literal('')),
  cargo: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string(),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

// ==========================================
// TYPE EXPORTS
// ==========================================

export type ClienteFormData = z.infer<typeof clienteSchema>;
export type FornecedorFormData = z.infer<typeof fornecedorSchema>;
export type ContaPagarFormData = z.infer<typeof contaPagarSchema>;
export type ContaReceberFormData = z.infer<typeof contaReceberSchema>;
export type ContaBancariaFormData = z.infer<typeof contaBancariaSchema>;
export type CentroCustoFormData = z.infer<typeof centroCustoSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Create a safe parser that returns typed result
 */
export function createSafeParser<T extends z.ZodSchema>(schema: T) {
  return (data: unknown): { success: true; data: z.infer<T> } | { success: false; errors: string[] } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return {
      success: false,
      errors: result.error.errors.map(e => e.message),
    };
  };
}

/**
 * Get first error message from validation
 */
export function getFirstError(errors: z.ZodError): string {
  return errors.errors[0]?.message || 'Erro de validação';
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = error.message;
    }
  });
  return formatted;
}
