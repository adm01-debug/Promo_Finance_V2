import { z } from 'zod';

/** Converte uma fração decimal (0.058) para percentual (5.8), preservando null. */
export function paraPercentual(valor: number | null | undefined): number | null {
  return valor === null || valor === undefined || Number.isNaN(valor) ? null : Number((valor * 100).toFixed(4));
}

/** Converte percentual digitado (5.8) para fração decimal (0.058), preservando null. */
export function paraFracao(valor: number | null | undefined): number | null {
  return valor === null || valor === undefined || Number.isNaN(valor) ? null : Number((valor / 100).toFixed(6));
}

/** Máscara CNAE no formato 0000-0/00. */
export function applyCnaeMask(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 7);
  if (d.length <= 4) return d;
  if (d.length <= 5) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`;
}

export const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const empresaSchema = z.object({
  cnpj: z.string().min(14, 'CNPJ é obrigatório').max(18, 'CNPJ inválido'),
  razao_social: z.string().min(3, 'Razão Social é obrigatória').max(255, 'Máximo 255 caracteres'),
  nome_fantasia: z.string().max(255, 'Máximo 255 caracteres').optional().nullable(),
  inscricao_estadual: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  telefone: z.string().max(20, 'Máximo 20 caracteres').optional().nullable(),
  email: z.string().email('Email inválido').max(255, 'Máximo 255 caracteres').optional().nullable().or(z.literal('')),
  endereco: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
  cidade: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),
  estado: z.string().max(2, 'Selecione um estado').optional().nullable(),
  cep: z.string().max(10, 'CEP inválido').optional().nullable(),
  ativo: z.boolean(),
  cnae_principal: z
    .string()
    .max(9, 'CNAE inválido')
    .optional()
    .nullable()
    .refine(
      (v) => !v || (v.replace(/\D/g, '').length >= 2 && v.replace(/\D/g, '').length <= 7),
      'CNAE deve ter entre 2 e 7 dígitos',
    ),
  codigo_fpas: z.string().max(10, 'FPAS inválido').optional().nullable(),
  aliquota_rat: z
    .number({ invalid_type_error: 'Informe um percentual' })
    .min(0, 'Mínimo 0%')
    .max(6, 'Máximo 6%')
    .optional()
    .nullable(),
  aliquota_terceiros: z
    .number({ invalid_type_error: 'Informe um percentual' })
    .min(0, 'Mínimo 0%')
    .max(8, 'Máximo 8%')
    .optional()
    .nullable(),
});

export type EmpresaFormData = z.infer<typeof empresaSchema>;
