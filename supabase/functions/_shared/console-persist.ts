/**
 * console-persist — tee de console.* para edge_function_logs
 *
 * Importado como side-effect por _shared/cors.ts (e, portanto, por toda Edge
 * Function que importa o módulo CORS). Intercepta console.log/info/warn/error
 * e persiste os argumentos em `edge_function_logs`, mantendo a saída normal
 * do console para os logs nativos do runtime.
 *
 * Com isso as funções que ainda usam console.* passam a ter rastro
 * persistente consultável, sem reescrever os ~56 handlers existentes.
 * request_id só é preenchido no caminho explícito via createLogger() do
 * observability.ts — este tee não conhece o Request.
 *
 * Salvaguardas:
 * - ignora o próprio echo estruturado do EdgeLogger (linha JSON com shape
 *   {function_name, level, event}) para não duplicar inserts;
 * - nunca lança exceção (observabilidade não pode derrubar a função);
 * - no-op em DENO_TESTING e quando SUPABASE_URL/SERVICE_ROLE_KEY ausentes.
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

interface ConsoleLogRow {
  function_name: string;
  level: 'info' | 'warn' | 'error';
  event: string;
  metadata?: Record<string, unknown>;
}

// O nome da função não é derivável de um módulo compartilhado; o runtime da
// Supabase pode expô-lo por env em algumas versões. Na dúvida, 'console-tee'
// identifica a origem do registro (e o context.raw traz a mensagem completa).
const FUNCTION_NAME =
  Deno.env.get('SUPABASE_FUNCTION_NAME') ?? Deno.env.get('EDGE_FUNCTION_NAME') ?? 'console-tee';

const originais = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

// Teto do buffer: em falhas persistentes descartamos o excedente mais novo
// em vez de deixar a fila crescer até estourar a memória do isolado.
const LIMITE_BUFFER = 200;
// Reenvios com backoff após falha de insert — a fila não pode depender de
// um próximo log para andar (isolado pode morrer sem outra mensagem).
const MAX_REENVIOS = 3;
let reenvios = 0;
let reenvioAgendado: Promise<void> | null = null;
const buffer: ConsoleLogRow[] = [];
let agendado: Promise<void> | null = null;
let inserindo = false;

// Mantém a promise viva além do response quando o runtime suporta waitUntil.
function segurarNoIsolado(p: Promise<unknown>): void {
  const edgeRuntime = (globalThis as Record<string, unknown>)['EdgeRuntime'] as
    | { waitUntil?: (p: Promise<unknown>) => void }
    | undefined;
  edgeRuntime?.waitUntil?.(p);
}

function ehEchoEstruturado(arg: unknown): boolean {
  if (typeof arg !== 'string') return false;
  const s = arg.trim();
  if (!s.startsWith('{')) return false;
  try {
    const parsed = JSON.parse(s) as Record<string, unknown>;
    return (
      typeof parsed['function_name'] === 'string' &&
      typeof parsed['level'] === 'string' &&
      typeof parsed['event'] === 'string'
    );
  } catch {
    return false;
  }
}

// O Logger legado (_shared/logger.ts) emite JSON {function, message, context}
// só para o console — sem insert próprio. O tee reaproveita os campos para
// gravar a linha com a função e a mensagem reais em vez de 'console-tee'.
interface LogLegado {
  functionName: string;
  event: string;
  metadata: Record<string, unknown>;
}

function parseLogLegado(arg: unknown): LogLegado | null {
  if (typeof arg !== 'string') return null;
  const s = arg.trim();
  if (!s.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(s) as Record<string, unknown>;
    if (typeof parsed['function'] !== 'string' || typeof parsed['message'] !== 'string') {
      return null;
    }
    return {
      functionName: parsed['function'],
      event: parsed['message'].slice(0, 2000),
      metadata:
        parsed['context'] && typeof parsed['context'] === 'object'
          ? (parsed['context'] as Record<string, unknown>)
          : {},
    };
  } catch {
    return null;
  }
}

// Redação de credenciais: o tee grava os argumentos inteiros em
// edge_function_logs, então um valor de env que pareça segredo não pode ir
// parar na tabela quando uma função o loga por descuido.
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

function redigir(s: string): string {
  let out = s;
  for (const segredo of segredos()) out = out.split(segredo).join('[REDACTED]');
  return out;
}

function redigirObj(x: unknown): unknown {
  if (typeof x === 'string') return redigir(x);
  if (Array.isArray(x)) return x.map(redigirObj);
  if (x !== null && typeof x === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) out[k] = redigirObj(v);
    return out;
  }
  return x;
}

function serializar(arg: unknown): unknown {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack };
  }
  if (typeof arg === 'bigint') return arg.toString();
  if (typeof arg === 'function') return `[fn ${arg.name || 'anon'}]`;
  return arg;
}

function agendarFlush(): void {
  if (Deno.env.get('DENO_TESTING')) return;
  if (buffer.length >= 10) {
    // waitUntil mantém o lote vivo se o handler responder antes do insert.
    segurarNoIsolado(flush());
    return;
  }
  if (agendado === null) {
    agendado = new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          await flush();
        } finally {
          agendado = null;
          resolve();
        }
      }, 2000);
    });
    segurarNoIsolado(agendado);
  }
}

function agendarReenvio(): void {
  if (Deno.env.get('DENO_TESTING') || reenvioAgendado !== null) return;
  reenvioAgendado = new Promise<void>((resolve) => {
    setTimeout(async () => {
      // Libera a trava ANTES do flush: uma nova falha dentro dele precisa
      // poder agendar a próxima tentativa.
      reenvioAgendado = null;
      try {
        await flush();
      } finally {
        resolve();
      }
    }, 5000 * reenvios);
  });
  segurarNoIsolado(reenvioAgendado);
}

let client: SupabaseClient | null | undefined;

async function flush(): Promise<void> {
  if (inserindo || buffer.length === 0) return;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    buffer.length = 0;
    return;
  }
  inserindo = true;
  const rows = buffer.splice(0, buffer.length);
  let falha: string | null = null;
  try {
    if (client === undefined) client = createClient(url, key);
    const { error } = (await client?.from('edge_function_logs').insert(rows)) ?? {};
    if (error) falha = error.message;
  } catch (err) {
    falha = err instanceof Error ? err.message : String(err);
  } finally {
    inserindo = false;
  }
  if (!falha) {
    reenvios = 0;
    return;
  }
  // Falha transitória (rede, RLS, restart): recoloca o lote e agenda nova
  // tentativa com backoff em vez de perder os registros definitivamente.
  buffer.unshift(...rows.slice(0, Math.max(0, LIMITE_BUFFER - buffer.length)));
  originais.error('[console-persist] insert falhou:', falha);
  reenvios++;
  if (reenvios <= MAX_REENVIOS) agendarReenvio();
}

function interceptar(level: 'info' | 'warn' | 'error', original: (...args: unknown[]) => void) {
  return (...args: unknown[]) => {
    original(...args);
    try {
      if (args.length === 1 && ehEchoEstruturado(args[0])) return;
      const legado = args.length === 1 ? parseLogLegado(args[0]) : null;
      const event = redigir(
        legado?.event ??
          args
            .map((a) => (typeof a === 'string' ? a : JSON.stringify(serializar(a))))
            .join(' ')
            .slice(0, 2000)
      );
      buffer.push({
        function_name: legado?.functionName ?? FUNCTION_NAME,
        level,
        event,
        metadata: redigirObj(legado?.metadata ?? { raw: args.map(serializar) }) as Record<
          string,
          unknown
        >,
      });
      agendarFlush();
    } catch {
      // nunca propagar
    }
  };
}

if (!Deno.env.get('DENO_TESTING')) {
  console.log = interceptar('info', originais.log);
  console.info = interceptar('info', originais.info);
  console.warn = interceptar('warn', originais.warn);
  console.error = interceptar('error', originais.error);
}
