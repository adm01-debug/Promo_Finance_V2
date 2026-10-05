// Logger estruturado não-bloqueante para Edge Functions
// Faz buffer em memória e flush async para tabela edge_function_logs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Redação de credenciais: valores de env que pareçam segredo são mascarados no
// insert — um handler que logue um token por descuido não o espalha na tabela.
// Recomputado a cada chamada: um segredo criado depois do boot (Deno.env.set)
// também precisa ser mascarado nos registros seguintes.
function segredos(): string[] {
  try {
    return Object.entries(Deno.env.toObject())
      .filter(([k, v]) => /(KEY|SECRET|TOKEN|PASSWORD)/.test(k) && v.length >= 8)
      .map(([, v]) => v);
  } catch {
    return [];
  }
}

// Chaves cujo valor nunca vai para edge_function_logs: identificadores
// pessoais e credenciais embutidos em context/metadata — mesma regra do
// console-persist, porque a tabela libera leitura a todo admin sem escopo
// de empresa. Valores financeiros ficam: são o propósito da trilha.
const CHAVE_SENSIVEL =
  /(cpf|cnpj|senha|password|token|secret|segredo|chave|cart[aã]o|cvv|iban|ag[eê]ncia|conta_banc[aá]ria|api_?key|certificate|certificado|private|email|authorization|bearer|jwt|session)/i;

// PII em texto livre — mesmas regras do console-persist: e-mail/CPF/CNPJ
// interpolados em mensagens (Sentry e edge_function_logs são legíveis por
// admin) saem mascarados. Só formatos com separadores para não comer ids.
const PII_TEXTO: Array<[RegExp, string]> = [
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[EMAIL]'],
  [/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF]'],
  [/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '[CNPJ]'],
];

function redigir(x: unknown): unknown {
  if (typeof x === 'string') {
    let out = x;
    for (const segredo of segredos()) out = out.split(segredo).join('[REDACTED]');
    for (const [re, rotulo] of PII_TEXTO) out = out.replace(re, rotulo);
    return out;
  }
  if (Array.isArray(x)) return x.map(redigir);
  if (x !== null && typeof x === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      out[k] = CHAVE_SENSIVEL.test(k) ? '[REDACTED]' : redigir(v);
    }
    return out;
  }
  return x;
}

// Versão de redigir para payloads que saem da tabela (Sentry, webhooks):
// mesma substituição de valores de segredo, mas sem a regra de chave
// sensível — strings completas, não objetos.
export function redigirTexto(texto: string): string {
  let out = texto;
  for (const segredo of segredos()) out = out.split(segredo).join('[REDACTED]');
  return out;
}

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

// Instância vive no escopo do módulo e atravessa requisições do mesmo worker;
// o teto evita crescimento ilimitado de memória quando a função nunca chama
// flush(). Entradas descartadas continuam no stdout (console.log abaixo).
const MAX_BUFFER = 500;

export function createLogger(functionName: string, requestId?: string): EdgeLogger {
  const buffer: LogEntry[] = [];
  const startedAt = Date.now();

  const push = (level: 'info' | 'warn' | 'error', event: string, extra?: Partial<LogEntry>) => {
    const entry: LogEntry = {
      function_name: functionName,
      level,
      event,
      ...extra,
    };
    if (requestId) {
      entry.context = { request_id: requestId, ...(extra?.context ?? {}) };
    }
    buffer.push(entry);
    if (buffer.length > MAX_BUFFER) buffer.splice(0, buffer.length - MAX_BUFFER);
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
      // A API pública do logger fala `context`, mas a coluna real da tabela é
      // `metadata` — sem a tradução o PostgREST rejeita o lote inteiro.
      const rows = buffer
        .splice(0, buffer.length)
        .map(({ context, event, error_message, ...rest }) => ({
          ...rest,
          event: redigir(event) as string,
          ...(error_message !== undefined
            ? { error_message: redigir(error_message) as string }
            : {}),
          ...(context !== undefined
            ? { metadata: redigir(context) as Record<string, unknown> }
            : {}),
        }));
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
        // duration_ms só faz sentido para logger criado por requisição
        // (requestId); em logger de módulo ele mediria a vida do worker.
        duration_ms: extra?.duration_ms ?? (requestId ? Date.now() - startedAt : undefined),
      }),
    flush,
  };
}
