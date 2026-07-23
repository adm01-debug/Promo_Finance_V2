import { z } from 'zod';

export const receitasSchema = z.object({
  receitaBrutaAnual: z.number().min(0),
  percentualServicos: z.number().min(0).max(100),
  devolucoes: z.number().min(0).optional(),
  descontosIncondicionais: z.number().min(0).optional(),
});

export const folhaSchema = z.object({
  folhaAnual: z.number().min(0),
  proLabore: z.number().min(0).optional(),
  aliquotaRat: z.number().min(0).max(0.03).optional(),
  aliquotaTerceiros: z.number().min(0).max(0.1).optional(),
});

export const estadualMunicipalSchema = z.object({
  aliquotaIcms: z.number().min(0).max(0.4).optional(),
  aliquotaIcmsInterestadual: z.number().min(0).max(0.4).optional(),
  creditoIcmsCompras: z.number().min(0).optional(),
  icmsSt: z.number().min(0).optional(),
  difal: z.number().min(0).optional(),
  aliquotaIss: z.number().min(0).max(0.05).optional(),
});

export const creditosPisCofinsSchema = z.object({
  insumos: z.number().min(0).optional(),
  energiaEletrica: z.number().min(0).optional(),
  alugueisPj: z.number().min(0).optional(),
  depreciacao: z.number().min(0).optional(),
  fretesVenda: z.number().min(0).optional(),
  devolucoesVenda: z.number().min(0).optional(),
  arrendamentoMercantil: z.number().min(0).optional(),
  outros: z.number().min(0).optional(),
});

export const lalurSchema = z.object({
  adicoesMultas: z.number().min(0).optional(),
  adicoesBrindes: z.number().min(0).optional(),
  adicoesProvisoes: z.number().min(0).optional(),
  adicoesDoacoes: z.number().min(0).optional(),
  adicoesOutras: z.number().min(0).optional(),
  exclusoesDividendos: z.number().min(0).optional(),
  exclusoesReversaoProvisoes: z.number().min(0).optional(),
  exclusoesIncentivos: z.number().min(0).optional(),
  exclusoesOutras: z.number().min(0).optional(),
});

export const retencoesSchema = z.object({
  irrfSofrido: z.number().min(0).optional(),
  csrfSofrido: z.number().min(0).optional(),
  inssSofrido: z.number().min(0).optional(),
  issRetido: z.number().min(0).optional(),
});
