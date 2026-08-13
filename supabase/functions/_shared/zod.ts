/**
 * Fonte única de verdade do Zod para todas as Edge Functions.
 *
 * Motivo: convivíamos com três especificadores diferentes
 * (`deno.land/x/zod@v3.22.4`, `npm:zod@3.23.8` e `esm.sh/zod@3.23.8`).
 * Cada especificador produz um grafo de tipos distinto, então um `ZodType`
 * criado em `_shared/validation.ts` não era atribuível a um schema declarado
 * numa função que importava outra cópia — isso gerava erros TS2589
 * ("type instantiation is excessively deep") e casts defensivos espalhados.
 *
 * Regra: NENHUM arquivo em `supabase/functions/` deve importar zod
 * diretamente. Importe sempre `{ z }` daqui.
 */
export { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
export type { ZodError, ZodIssue, ZodSchema, ZodType, ZodTypeAny } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
