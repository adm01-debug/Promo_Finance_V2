#!/usr/bin/env node
// 03_realtime.mjs — assina postgres_changes, insere linha sintética,
// mede latência insert→recepção. Cleanup via delete no final.
//
// Requer: @supabase/supabase-js (já no projeto).
// Env: STAGING_PROJECT_REF, STAGING_ANON_KEY, STAGING_SERVICE_ROLE_KEY (para insert),
//      TEST_ADMIN_JWT (opcional; se ausente -> unverified para canal autenticado),
//      RUN_ID, OUT.
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const RUN_ID = process.env.RUN_ID;
const OUT = process.env.OUT;
const ref = process.env.STAGING_PROJECT_REF;
const anon = process.env.STAGING_ANON_KEY;
const service = process.env.STAGING_SERVICE_ROLE_KEY || '';

function emit(target, status, detail = '', latency_ms = null) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    check: 'realtime', target, status, detail, run_id: RUN_ID, latency_ms,
  });
  if (OUT) fs.appendFileSync(OUT, line + '\n');
  if (process.env.JSON_ONLY === '1') console.log(line);
  else process.stderr.write(line + '\n');
}

if (!ref || !anon) { emit('config', 'unverified', 'STAGING_PROJECT_REF/ANON_KEY ausente'); process.exit(0); }
if (!service)      { emit('config', 'unverified', 'STAGING_SERVICE_ROLE_KEY ausente (insert sintético indisponível)'); process.exit(0); }

const url = `https://${ref}.supabase.co`;
const sub = createClient(url, anon, { auth: { persistSession: false } });
const admin = createClient(url, service, { auth: { persistSession: false } });

async function testTable(table, buildRow) {
  return await new Promise(async (resolve) => {
    let received = null;
    const t0 = Date.now();
    const channel = sub
      .channel(`hc-${table}-${RUN_ID}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
        const r = payload?.new || {};
        const marker =
          r?.raw_payload?.healthcheck_run_id ??
          r?.metadata?.healthcheck_run_id ??
          null;
        if (marker === RUN_ID && !received) {
          received = Date.now();
        }
      })
      .subscribe();

    // aguarda subscribe
    await new Promise(r => setTimeout(r, 800));

    const row = buildRow();
    const { error } = await admin.from(table).insert(row).select('id').single();
    if (error) {
      emit(table, 'fail', `insert error: ${error.message}`);
      await sub.removeChannel(channel);
      return resolve();
    }

    const timeout = 5000;
    const start = Date.now();
    while (!received && Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, 100));
    }

    if (received) emit(table, 'pass', 'evento recebido', received - t0);
    else          emit(table, 'fail', `timeout ${timeout}ms sem evento`);

    await sub.removeChannel(channel);
    resolve();
  });
}

try {
  await testTable('webhook_events', () => ({
    event_type: 'healthcheck.realtime',
    raw_payload: { healthcheck_run_id: RUN_ID, ts: Date.now() },
  }));

  await testTable('alerts', () => ({
    type: 'SYSTEM',
    severity: 'INFO',
    title: 'healthcheck',
    message: 'realtime probe',
    metadata: { healthcheck_run_id: RUN_ID },
  }));
} catch (e) {
  emit('runner', 'fail', `exception: ${e?.message || String(e)}`);
} finally {
  // Cleanup best-effort (run.sh também limpa)
  await admin.from('webhook_events').delete().eq('raw_payload->>healthcheck_run_id', RUN_ID).then(() => {}, () => {});
  await admin.from('alerts').delete().eq('metadata->>healthcheck_run_id', RUN_ID).then(() => {}, () => {});
  process.exit(0);
}
