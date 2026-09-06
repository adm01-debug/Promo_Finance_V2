/**
 * src/config/env.ts — Fonte única de verdade para configuração de ambiente.
 *
 * Regras:
 *  1. Nenhum outro arquivo pode ler `import.meta.env` diretamente.
 *     ESLint/no-restricted-syntax obriga o import daqui.
 *  2. Toda variável é validada com Zod na carga; build falha cedo com
 *     mensagem legível em vez de `undefined` propagando até um fetch.
 *  3. DEV e MODE são meta-flags do bundler (injetados pelo Vite
 *     automaticamente) — NÃO entram aqui; use `import.meta.env.DEV`
 *     onde necessário.
 *
 * Mapa de origem:
 *  - VITE_SUPABASE_URL            → projeto bwwbeyolnnzppeuhgkcd
 *  - VITE_SUPABASE_PUBLISHABLE_KEY → chave pública do projeto
 *  - VITE_SUPABASE_PROJECT_ID     → ref do projeto (sem .supabase.co)
 *  - VITE_BLING_CLIENT_ID         → app OAuth do Bling
 *  - VITE_VAPID_PUBLIC_KEY        → par VAPID gerado em 2026-09-05
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  /** URL base do Supabase, ex: https://bwwbeyolnnzppeuhgkcd.supabase.co */
  SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL deve ser uma URL válida')
    .refine((v) => v.includes('supabase.co'), {
      message: 'VITE_SUPABASE_URL deve apontar para supabase.co',
    }),

  /** Chave publicável (sb_publishable_…) — segura para expor no bundle */
  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_PUBLISHABLE_KEY parece inválida')
    .refine((v) => v.startsWith('sb_publishable_') || v.startsWith('eyJ'), {
      message: 'VITE_SUPABASE_PUBLISHABLE_KEY deve começar com sb_publishable_ ou eyJ',
    }),

  /** Ref do projeto — 20 chars alfanuméricos */
  SUPABASE_PROJECT_ID: z
    .string()
    .length(20, 'VITE_SUPABASE_PROJECT_ID deve ter exatamente 20 caracteres'),

  /** Client ID OAuth do Bling. Opcional — degradação graciosa sem ele. */
  BLING_CLIENT_ID: z.string().optional(),

  /**
   * Chave pública VAPID (base64url, 87 chars).
   * Opcional — web push desabilitado se ausente.
   */
  VAPID_PUBLIC_KEY: z
    .string()
    .min(80, 'VITE_VAPID_PUBLIC_KEY parece inválida (muito curta)')
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

function loadEnv(): Env {
  const raw = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    BLING_CLIENT_ID: import.meta.env.VITE_BLING_CLIENT_ID || undefined,
    VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined,
  };

  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ✖ ${i.path.join('.')} — ${i.message}`)
      .join('\n');
    throw new Error(
      `[promo-finance] Configuração de ambiente inválida:\n${issues}\n\n` +
        `Veja src/config/env.ts e .env.example para referência.`,
    );
  }

  return Object.freeze(result.data);
}

// ---------------------------------------------------------------------------
// Singleton — avaliado uma única vez na carga do módulo.
// Erros explodem antes do React montar; nenhum estado parcial.
// ---------------------------------------------------------------------------

export const env = loadEnv();

// ---------------------------------------------------------------------------
// Helper: URL base para chamadas a edge functions.
// Substitui `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`
// ---------------------------------------------------------------------------

export function edgeFunctionUrl(functionName: string): string {
  return `${env.SUPABASE_URL}/functions/v1/${functionName}`;
}
