// Teste de carga: N leituras em `profiles` no projeto apontado por SUPABASE_URL.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/stress-test.ts
// Opcionais: STRESS_TOTAL (500), STRESS_CONCURRENCY (50), STRESS_TIMEOUT_MS (30000),
//            STRESS_ALLOW_PRODUCTION=1 (libera o projeto de produção).
// Exit: 0 sem falhas · 1 alguma requisição falhou · 2 configuração inválida.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

function inteiroPositivo(nome: string, padrao: number): number {
  const bruto = process.env[nome];
  if (bruto === undefined || bruto === '') return padrao;
  const n = Number(bruto);
  if (!Number.isInteger(n) || n <= 0) {
    console.error(`❌ ${nome} inválido: ${bruto} (use inteiro > 0)`);
    process.exit(2);
  }
  return n;
}

// Carga com service role não pode cair em produção por engano: o ref canônico
// vem do supabase/config.toml (project_id) e exige liberação explícita.
function refDeProducao(): string | null {
  try {
    const toml = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
    return toml.match(/^project_id\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  } catch {
    return null;
  }
}

let hostAlvo: string;
try {
  hostAlvo = new URL(SUPABASE_URL).hostname;
} catch {
  console.error('❌ SUPABASE_URL não é uma URL válida');
  process.exit(2);
}
const refProd = refDeProducao();
if (refProd && hostAlvo.split('.')[0] === refProd && process.env.STRESS_ALLOW_PRODUCTION !== '1') {
  console.error(
    `❌ ${hostAlvo} é o projeto de PRODUÇÃO — carga recusada. Para insistir: STRESS_ALLOW_PRODUCTION=1`
  );
  process.exit(2);
}

const TOTAL_REQUESTS = inteiroPositivo('STRESS_TOTAL', 500);
const CONCURRENT_REQUESTS = inteiroPositivo('STRESS_CONCURRENCY', 50);
const TIMEOUT_MS = inteiroPositivo('STRESS_TIMEOUT_MS', 30_000);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runStressTest() {
  console.log('--- Starting Load & Stress Test ---');
  console.log(`Target: ${hostAlvo}`);

  const start = Date.now();
  let successCount = 0;
  let failCount = 0;
  let primeiroErro: string | null = null;

  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    // O último lote pode ser menor: sem o min, TOTAL não múltiplo de
    // CONCURRENCY disparava mais requisições do que o total informado.
    const batch = Array.from({ length: Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - i) }).map(
      async () => {
        try {
          const { error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1)
            .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
          if (error) throw error;
          successCount++;
        } catch (err) {
          failCount++;
          primeiroErro ??=
            err instanceof Error
              ? err.message
              : String((err as { message?: unknown })?.message ?? err);
        }
      }
    );

    await Promise.all(batch);
  }

  const duration = Date.now() - start;
  const avgLatency = duration / TOTAL_REQUESTS;

  console.log(`Summary:
- Total: ${TOTAL_REQUESTS}
- Success: ${successCount}
- Fails: ${failCount}
- Duration: ${duration}ms
- Avg Latency: ${avgLatency.toFixed(2)}ms`);
  if (failCount > 0) {
    console.error(`❌ ${failCount} requisição(ões) falharam. Primeiro erro: ${primeiroErro}`);
    process.exit(1);
  }
}

runStressTest().catch((err) => {
  console.error('❌ Erro inesperado no teste de carga:', err instanceof Error ? err.message : err);
  process.exit(1);
});
