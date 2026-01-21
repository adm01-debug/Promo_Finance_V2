import { z } from 'zod';

// ============================================================
// VALIDADORES CUSTOMIZADOS
// ============================================================

// CPF Validator
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export function validateCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === parseInt(numbers[10]);
}

// CNPJ Validator
const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;

export function validateCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, '');
  if (numbers.length !== 14) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(numbers[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  return digit === parseInt(numbers[13]);
}

// ============================================================
// SCHEMAS BASE
// ============================================================

// String schemas
export const requiredString = z.string().min(1, 'Campo obrigatório');
export const optionalString = z.string().optional();
export const emailSchema = z.string().email('Email inválido');
export const phoneSchema = z.string().regex(/^\(\d{2}\)\s?\d{4,5}-\d{4}$/, 'Telefone inválido');
export const cpfSchema = z.string().refine(validateCPF, 'CPF inválido');
export const cnpjSchema = z.string().refine(validateCNPJ, 'CNPJ inválido');
export const cepSchema = z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido');

// Number schemas
export const positiveNumber = z.number().positive('Deve ser maior que zero');
export const nonNegativeNumber = z.number().nonnegative('Não pode ser negativo');
export const currencySchema = z.number().positive('Valor deve ser maior que zero');
export const percentageSchema = z.number().min(0).max(100, 'Percentual inválido');

// Date schemas
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');
export const futureDateSchema = z.string().refine(
  (date) => new Date(date) >= new Date(new Date().toDateString()),
  'Data deve ser futura'
);
export const pastDateSchema = z.string().refine(
  (date) => new Date(date) <= new Date(),
  'Data deve ser passada'
);

// ============================================================
// SCHEMAS DE DOMÍNIO - FINANCEIRO
// ============================================================

// Conta a Pagar
export const contaPagarSchema = z.object({
  descricao: requiredString.max(200, 'Máximo 200 caracteres'),
  valor: currencySchema,
  dataVencimento: dateSchema,
  dataPagamento: dateSchema.optional().nullable(),
  fornecedorId: z.string().uuid('Fornecedor inválido').optional().nullable(),
  categoriaId: z.string().uuid('Categoria inválida').optional().nullable(),
  status: z.enum(['pendente', 'paga', 'vencida', 'cancelada', 'parcial']),
  observacoes: optionalString,
  recorrente: z.boolean().default(false),
  recorrenciaTipo: z.enum(['mensal', 'semanal', 'anual']).optional(),
  parcelas: z.number().int().positive().optional(),
  parcelaAtual: z.number().int().positive().optional(),
});

export type ContaPagarInput = z.infer<typeof contaPagarSchema>;

// Conta a Receber
export const contaReceberSchema = z.object({
  descricao: requiredString.max(200, 'Máximo 200 caracteres'),
  valor: currencySchema,
  dataVencimento: dateSchema,
  dataRecebimento: dateSchema.optional().nullable(),
  clienteId: z.string().uuid('Cliente inválido').optional().nullable(),
  categoriaId: z.string().uuid('Categoria inválida').optional().nullable(),
  status: z.enum(['pendente', 'recebida', 'vencida', 'cancelada', 'parcial']),
  observacoes: optionalString,
  recorrente: z.boolean().default(false),
  recorrenciaTipo: z.enum(['mensal', 'semanal', 'anual']).optional(),
  parcelas: z.number().int().positive().optional(),
  parcelaAtual: z.number().int().positive().optional(),
});

export type ContaReceberInput = z.infer<typeof contaReceberSchema>;

// Cliente
export const clienteSchema = z.object({
  nome: requiredString.max(100, 'Máximo 100 caracteres'),
  email: emailSchema.optional().or(z.literal('')),
  telefone: phoneSchema.optional().or(z.literal('')),
  cpfCnpj: z.string().optional().refine(
    (val) => !val || validateCPF(val) || validateCNPJ(val),
    'CPF/CNPJ inválido'
  ),
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']),
  endereco: z.object({
    logradouro: optionalString,
    numero: optionalString,
    complemento: optionalString,
    bairro: optionalString,
    cidade: optionalString,
    estado: z.string().length(2, 'Estado inválido').optional().or(z.literal('')),
    cep: cepSchema.optional().or(z.literal('')),
  }).optional(),
  observacoes: optionalString,
  ativo: z.boolean().default(true),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

// Fornecedor
export const fornecedorSchema = z.object({
  razaoSocial: requiredString.max(150, 'Máximo 150 caracteres'),
  nomeFantasia: optionalString.transform(val => val || undefined),
  email: emailSchema.optional().or(z.literal('')),
  telefone: phoneSchema.optional().or(z.literal('')),
  cnpj: cnpjSchema.optional().or(z.literal('')),
  inscricaoEstadual: optionalString,
  endereco: z.object({
    logradouro: optionalString,
    numero: optionalString,
    complemento: optionalString,
    bairro: optionalString,
    cidade: optionalString,
    estado: z.string().length(2, 'Estado inválido').optional().or(z.literal('')),
    cep: cepSchema.optional().or(z.literal('')),
  }).optional(),
  contato: z.object({
    nome: optionalString,
    telefone: optionalString,
    email: optionalString,
  }).optional(),
  observacoes: optionalString,
  ativo: z.boolean().default(true),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;

// Categoria
export const categoriaSchema = z.object({
  nome: requiredString.max(50, 'Máximo 50 caracteres'),
  tipo: z.enum(['despesa', 'receita']),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  icone: optionalString,
  ativo: z.boolean().default(true),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;

// ============================================================
// SCHEMAS DE AUTENTICAÇÃO
// ============================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  remember: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: requiredString.max(100, 'Máximo 100 caracteres'),
  email: emailSchema,
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve ter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve ter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve ter pelo menos um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================
// SCHEMAS DE CONFIGURAÇÃO
// ============================================================

export const userProfileSchema = z.object({
  name: requiredString.max(100),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  avatar: z.string().url('URL inválida').optional().or(z.literal('')),
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;

export const companyProfileSchema = z.object({
  name: requiredString.max(150),
  cnpj: cnpjSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  address: z.object({
    logradouro: optionalString,
    numero: optionalString,
    complemento: optionalString,
    bairro: optionalString,
    cidade: optionalString,
    estado: z.string().length(2).optional().or(z.literal('')),
    cep: cepSchema.optional().or(z.literal('')),
  }).optional(),
  logo: z.string().url('URL inválida').optional().or(z.literal('')),
});

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;

// ============================================================
// HELPERS
// ============================================================

export function formatZodErrors(
  errors: z.ZodError
): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = error.message;
    }
  });
  
  return formattedErrors;
}

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: formatZodErrors(result.error) };
}
