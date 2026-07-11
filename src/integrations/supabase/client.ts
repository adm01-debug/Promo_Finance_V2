import { createClient } from '@supabase/supabase-js';
import { addBreadcrumb } from '@/lib/telemetry';
import type { Database } from './types';

/**
 * Variáveis de ambiente obrigatórias. Sem fallback hardcoded:
 * builds sem injeção falham cedo com mensagem clara em vez de
 * silenciosamente apontar para um projeto Supabase antigo.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as
  | string
  | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_PROJECT_ID) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
    !SUPABASE_PROJECT_ID && 'VITE_SUPABASE_PROJECT_ID',
  ]
    .filter(Boolean)
    .join(', ');
  const msg =
    `[promo-finance] Configuração Supabase ausente: ${missing}. ` +
    `Defina essas variáveis no ambiente de build (.env ou Build Secrets) ` +
    `antes de publicar. Veja .env.example.`;
  // Falha explícita — melhor um erro de boot legível do que um bundle
  // apontando para credenciais erradas.
  throw new Error(msg);
}

const storageKey = `sb-${SUPABASE_PROJECT_ID}-auth-token`;

const supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// Proxy para interceptar chamadas e adicionar breadcrumbs
const supabaseProxyHandler: ProxyHandler<any> = {
  get(target, prop) {
    const value = target[prop];
    if (prop === 'from' && typeof value === 'function') {
      const fromFn = (...args: any[]) => {
        const tableName = args[0];
        addBreadcrumb(`Supabase: Accessing table ${tableName}`);
        return value.apply(target, args);
      };
      return fromFn;
    }
    if (prop === 'functions' && value) {
      return new Proxy(value, {
        get(fnTarget, fnProp) {
          const fnValue = fnTarget[fnProp];
          if (fnProp === 'invoke' && typeof fnValue === 'function') {
            const invokeFn = (...args: any[]) => {
              const fnName = args[0];
              const options = args[1];
              addBreadcrumb(`Supabase: Invoking Edge Function ${fnName}`, { options });
              return fnValue.apply(fnTarget, args);
            };
            return invokeFn;
          }
          return fnValue;
        },
      });
    }
    return value;
  },
};

export const supabase = new Proxy(
  supabaseInstance,
  supabaseProxyHandler,
) as unknown as typeof supabaseInstance;
