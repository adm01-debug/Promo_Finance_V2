import { createClient } from '@supabase/supabase-js';
import { addBreadcrumb } from '@/lib/telemetry';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL && 'VITE_SUPABASE_URL',
    !SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
  ]
    .filter(Boolean)
    .join(', ');
  throw new Error(
    `[supabase] Variáveis de ambiente ausentes: ${missing}. ` +
      `Copie .env.example para .env e preencha antes de iniciar o app.`,
  );
}

const storageKey = SUPABASE_PROJECT_ID
  ? `sb-${SUPABASE_PROJECT_ID}-auth-token`
  : 'sb-promo-finance-auth-token';

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
      return (...args: any[]) => {
        const tableName = args[0];
        addBreadcrumb(`Supabase: Accessing table ${tableName}`);
        return value.apply(target, args);
      };
    }
    if (prop === 'functions' && value) {
      return new Proxy(value, {
        get(fnTarget, fnProp) {
          const fnValue = fnTarget[fnProp];
          if (fnProp === 'invoke' && typeof fnValue === 'function') {
            return (...args: any[]) => {
              const fnName = args[0];
              const options = args[1];
              addBreadcrumb(`Supabase: Invoking Edge Function ${fnName}`, { options });
              return fnValue.apply(fnTarget, args);
            };
          }
          return fnValue;
        }
      });
    }
    return value;
  }
};

export const supabase = new Proxy(supabaseInstance, supabaseProxyHandler) as typeof supabaseInstance;
