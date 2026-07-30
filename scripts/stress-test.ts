import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runStressTest() {
  console.log('--- Starting Load & Stress Test ---');
  const CONCURRENT_REQUESTS = 50;
  const TOTAL_REQUESTS = 500;
  
  const start = Date.now();
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENT_REQUESTS) {
    const batch = Array.from({ length: CONCURRENT_REQUESTS }).map(async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        successCount++;
      } catch (err) {
        failCount++;
      }
    });
    
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
}

runStressTest().catch(console.error);
