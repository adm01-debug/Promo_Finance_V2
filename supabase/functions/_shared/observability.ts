// Logger estruturado não-bloqueante para Edge Functions
// Faz buffer em memória e flush async para tabela edge_function_logs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface LogEntry {
  function_name: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  duration_ms?: number;
  status_code?: number;
  error_message?: string;
  context?: Record<string, unknown>;
}

export interface EdgeLogger {
  info: (event: string, extra?: Partial<LogEntry>) => void;
  warn: (event: string, extra?: Partial<LogEntry>) => void;
  error: (event: string, extra?: Partial<LogEntry>) => void;
  flush: () => Promise<void>;
}

export function createLogger(functionName: string): EdgeLogger {
  const buffer: LogEntry[] = [];
  const startedAt = Date.now();

  const push = (
    level: 'info' | 'warn' | 'error',
    event: string,
    extra?: Partial<LogEntry>
  ) => {
    const entry: LogEntry = {
      function_name: functionName,
      level,
      event,
      ...extra,
    };
    buffer.push(entry);
    // Console também (compatibilidade com supabase logs)
    try {
      console.log(JSON.stringify({ ts: new Date().toISOString(), ...entry }));
    } catch {
      console.log(`[${functionName}] ${level} ${event}`);
    }
  };

  const flush = async () => {
    if (buffer.length === 0) return;
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    try {
      const admin = createClient(url, key);
      const rows = buffer.splice(0, buffer.length);
      await admin.from('edge_function_logs').insert(rows);
    } catch (err) {
      // Nunca lançar — observabilidade não pode derrubar a função
      console.error(
        `[observability] flush failed for ${functionName}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  return {
    info: (event, extra) => push('info', event, extra),
    warn: (event, extra) => push('warn', event, extra),
    error: (event, extra) =>
      push('error', event, {
        ...extra,
        duration_ms: extra?.duration_ms ?? Date.now() - startedAt,
      }),
    flush,
  };
}
