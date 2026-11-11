// Relatório (somente leitura) da última execução do simulador de webhooks.
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/generate-simulation-report.ts
// Exit: 0 relatório gerado (ou nenhuma execução registrada) · 1 erro de consulta/config.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateReport() {
  console.log('📊 Generating Webhook Simulation Report...');

  const { data: latestRun, error: runError } = await supabase
    .from('webhook_simulation_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1)
    // maybeSingle: com .single() a tabela vazia virava erro PGRST116 e o ramo
    // "No simulation runs found" abaixo nunca era alcançado.
    .maybeSingle();

  if (runError) {
    console.error('❌ Error fetching latest run:', runError.message);
    process.exit(1);
  }

  if (!latestRun) {
    console.log('ℹ️ No simulation runs found.');
    return;
  }

  console.log(`\n--- Run Details [${latestRun.id}] ---`);
  console.log(`Function: ${latestRun.target_function}`);
  console.log(`Status: ${latestRun.status}`);
  console.log(`Scenarios: ${latestRun.total_scenarios}`);
  console.log(`Success: ${latestRun.success_count}`);
  console.log(`Failure: ${latestRun.failure_count}`);
  console.log(`Started: ${latestRun.started_at}`);
  console.log(`Finished: ${latestRun.finished_at || 'In progress'}`);

  const { data: results, error: resultsError } = await supabase
    .from('webhook_simulation_results')
    .select('response_status, duration_ms, success')
    .eq('run_id', latestRun.id);

  if (resultsError) {
    console.error('❌ Error fetching results:', resultsError.message);
    process.exit(1);
  }

  if (results && results.length > 0) {
    const avgDuration = results.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / results.length;
    const statusCounts = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.response_status] = (acc[r.response_status] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n--- Performance Metrics ---`);
    console.log(`Average Latency: ${avgDuration.toFixed(2)}ms`);
    console.log(`HTTP Status Distribution:`, statusCounts);
  }

  console.log('\n✅ Report generated successfully.');
}

generateReport().catch((err) => {
  console.error('❌ Unexpected error generating report:', err instanceof Error ? err.message : err);
  process.exit(1);
});
