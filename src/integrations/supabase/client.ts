import { createClient } from '@supabase/supabase-js';
import { addBreadcrumb } from '@/lib/telemetry';
import type { Database } from './types';

// Fallbacks garantem que builds publicados sem injeção de env continuem funcionando.
// As chaves abaixo são públicas (anon) e seguras para o bundle do frontend.
const FALLBACK_PROJECT_ID = 'lszcmoymovkpckehlagr';
const FALLBACK_URL = `https://${FALLBACK_PROJECT_ID}.supabase.co`;
const FALLBACK_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzemNtb3ltb3ZrcGNrZWhsYWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODE2MTAsImV4cCI6MjA5NDI1NzYxMH0.ksTr8881Ic6U5doXsrEETVL9fGsaddNPf-m1lAt1pw0';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  FALLBACK_PUBLISHABLE_KEY;
const SUPABASE_PROJECT_ID =
  (import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined) || FALLBACK_PROJECT_ID;

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
        }
      });
    }
    return value;
  }
};

export const supabase = new Proxy(supabaseInstance, supabaseProxyHandler) as unknown as typeof supabaseInstance;
