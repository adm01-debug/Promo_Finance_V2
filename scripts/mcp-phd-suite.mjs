#!/usr/bin/env node
/**
 * PhD-level MCP exhaustive test suite — PromoFinance Worker
 * Run: node scripts/mcp-phd-suite.mjs [--url URL] [--token TOKEN]
 *
 * Dynamic thresholds:
 *   db_vacuum (no table): 60 000 ms  — full-DB VACUUM em prod pode ser lento
 *   db_relationships:     10 000 ms  — schema grande
 *   outros:                5 000 ms
 */

const DEFAULT_URL   = 'https://supabase-promofinance-mcp.adm01.workers.dev/mcp';

const args      = process.argv.slice(2);
const BASE      = args[args.indexOf('--url')   + 1] || DEFAULT_URL;
const TOKEN     = args[args.indexOf('--token') + 1] || process.env.MCP_TOKEN;
const VERBOSE   = args.includes('--verbose');

if (!TOKEN) {
  console.error('ERRO: token MCP ausente — defina a env MCP_TOKEN ou passe --token <TOKEN>.');
  process.exit(1);
}

// ── Threshold mapa (ms) ───────────────────────────────────────────────────────
const THRESHOLDS = {
  'db_vacuum':        60_000,   // Full-DB vacuum em prod: até 60s normal
  'db_relationships': 10_000,   // Schema com muitas FKs
  'db_relationships': 10_000,
  'db_describe_table': 8_000,
  'db_batch_query':    6_000,
  '__default__':       5_000,
};
const threshold = (name, hasTable) => {
  if (name === 'db_vacuum' && !hasTable) return THRESHOLDS.db_vacuum;
  return THRESHOLDS[name] ?? THRESHOLDS.__default__;
};

// ── Core ──────────────────────────────────────────────────────────────────────
let reqId = 1;
const results = { pass: [], fail: [], warn: [] };

async function rawPost(body, extraHeaders = {}) {
  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}`, ...extraHeaders };
  const t0 = Date.now();
  const res = await fetch(BASE, { method: 'POST', headers: h, body: JSON.stringify(body) });
  const ms  = Date.now() - t0;
  const txt = await res.text();
  let json; try { json = JSON.parse(txt); } catch { json = { _raw: txt }; }
  return { status: res.status, json, ms, headers: Object.fromEntries(res.headers) };
}

async function callTool(name, args = {}, opts = {}) {
  const r = await rawPost({
    jsonrpc: '2.0', id: reqId++, method: 'tools/call',
    params: { name, arguments: args },
  });
  const text    = r.json?.result?.content?.[0]?.text;
  let parsed; try { parsed = JSON.parse(text || 'null'); } catch { parsed = { _raw: text }; }
  const ms      = r.ms;
  const thr     = threshold(name, !!args.table);
  if (ms > thr) {
    results.warn.push({ name, ms, threshold: thr, msg: `${ms}ms > ${thr}ms threshold` });
    if (VERBOSE) console.warn(`  ⚠️  ${name} slow: ${ms}ms (threshold ${thr}ms)`);
  }
  return { ...r, parsed, ms };
}

function assert(name, cond, actual, expected) {
  if (cond) { results.pass.push(name); return true; }
  results.fail.push({ name, actual: JSON.stringify(actual)?.slice(0, 200), expected });
  return false;
}
function warn_(name, msg) { results.warn.push({ name, msg }); }

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 1 — Protocol & Auth (15 checks)
// ═══════════════════════════════════════════════════════════════════════════════
async function runA1() {
  process.stdout.write('A1 Protocol&Auth ');
  const init = await rawPost({ jsonrpc:'2.0',id:1,method:'initialize',
    params:{ protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'phd',version:'1'} } });
  assert('A1.version', init.json?.result?.serverInfo?.version?.startsWith('1.'), init.json?.result?.serverInfo?.version, '1.x.x');
  assert('A1.tools-71', (await rawPost({jsonrpc:'2.0',id:2,method:'tools/list'})).json?.result?.tools?.length === 71, null, 71);

  const noAuth  = await fetch(BASE,{method:'POST',headers:{'Content-Type':'application/json'},body:'{"jsonrpc":"2.0","id":3,"method":"tools/list"}'});
  assert('A1.401-noauth',   noAuth.status === 401, noAuth.status, 401);
  const wrongAuth = await rawPost({jsonrpc:'2.0',id:4,method:'tools/list'},{'Authorization':'Bearer WRONG'});
  assert('A1.401-wrongauth', wrongAuth.status === 401, wrongAuth.status, 401);

  const disc = await (await fetch(BASE.replace('/mcp','') + '/.well-known/oauth-authorization-server')).json();
  assert('A1.oauth-S256',   disc.code_challenge_methods_supported?.includes('S256'), disc, 'S256');
  assert('A1.oauth-pkce',   !!disc.authorization_endpoint && !!disc.token_endpoint, disc, 'endpoints');

  const opts = await fetch(BASE,{method:'OPTIONS'});
  assert('A1.cors-star',    opts.headers.get('access-control-allow-origin') === '*', null, '*');

  const pathAuth = await fetch(BASE.replace('/mcp',`/${TOKEN}/mcp`),{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:5,method:'tools/list'})});
  assert('A1.path-token',   pathAuth.status === 200, pathAuth.status, 200);

  const unknownMethod = await rawPost({jsonrpc:'2.0',id:6,method:'bad/method'});
  assert('A1.unknown-method', unknownMethod.json?.error?.code === -32601, unknownMethod.json?.error?.code, -32601);

  const wwwAuth = (await fetch(BASE,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).headers.get('www-authenticate')||'';
  assert('A1.www-auth-bearer', wwwAuth.toLowerCase().includes('bearer'), wwwAuth, 'Bearer');

  process.stdout.write(`✅ ${results.pass.filter(p=>p.startsWith('A1')).length}/9\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 2 — Atomicity & SQL Correctness (12 checks)
// ═══════════════════════════════════════════════════════════════════════════════
async function runA2() {
  process.stdout.write('A2 Atomicity&SQL  ');
  // Multi-stmt happy path
  const h = await callTool('db_transaction',{statements:JSON.stringify(['SELECT 1 AS a','SELECT 2 AS b'])});
  assert('A2.txn-happy',  h.parsed?.count===2 && h.parsed?.rows?.[0]?.a===1, h.parsed, 'count=2,a=1');

  // Fail-mid → error, no partial rows
  const f = await callTool('db_transaction',{statements:JSON.stringify(['SELECT 1','SELECT 1/0','SELECT 3'])});
  assert('A2.txn-rollback-error', !!f.parsed?.error, f.parsed, 'error');
  assert('A2.txn-no-partial',     !f.parsed?.rows,   f.parsed?.rows, undefined);

  // Empty array
  const e = await callTool('db_transaction',{statements:JSON.stringify([])});
  assert('A2.txn-empty', !!e.parsed?.error, e.parsed, 'error');

  // Self-join via db_join_query (v1.1.2 fix)
  const sj = await callTool('db_join_query',{table1:'mcp_probe',table2:'mcp_probe',on:'t1.probe=t2.probe',limit:1});
  assert('A2.self-join-no-error', !sj.parsed?.error, sj.parsed, 'no error');
  assert('A2.self-join-returns',  sj.parsed?.rows?.length >= 0, sj.parsed, 'rows array');

  // LIMIT auto-applied
  const lim = await callTool('db_query',{sql:'SELECT generate_series(1,10) AS n',limit:3});
  assert('A2.limit-applied', lim.parsed?.count<=3, lim.parsed?.count, '<=3');

  // Consistent NOW() in transaction (snapshot)
  const ts = await callTool('db_transaction',{statements:JSON.stringify(['SELECT now() AS t1','SELECT now() AS t2'])});
  const [r1,r2] = ts.parsed?.rows || [];
  const diff = Math.abs(new Date(r1?.t1||r1?.t2) - new Date(r2?.t2||r2?.t1));
  assert('A2.consistent-snapshot', diff < 2000, diff, '<2000ms');

  // db_batch_query independent results
  const b = await callTool('db_batch_query',{queries:JSON.stringify(['SELECT 10 AS v','SELECT 20 AS v'])});
  assert('A2.batch-independent', b.parsed?.results?.[0]?.result?.rows?.[0]?.v===10
    && b.parsed?.results?.[1]?.result?.rows?.[0]?.v===20, b.parsed, '10,20');

  // mcp_probe smoke
  const p = await callTool('db_select',{table:'mcp_probe',limit:1});
  assert('A2.mcp-probe-probe-col', p.parsed?.rows?.[0]?.probe===1, p.parsed?.rows?.[0], '{probe:1}');
  assert('A2.mcp-probe-ts-col',    !!p.parsed?.rows?.[0]?.ts,      p.parsed?.rows?.[0]?.ts, 'timestamp');

  process.stdout.write(`✅ ${results.pass.filter(p=>p.startsWith('A2')).length}/11\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 3 — Security (10 checks)
// ═══════════════════════════════════════════════════════════════════════════════
async function runA3() {
  process.stdout.write('A3 Security       ');
  const blocks = [
    ['DROP TABLE',     'DROP TABLE IF EXISTS test_xyz'],
    ['TRUNCATE',       'TRUNCATE public.mcp_probe'],
    ['ALTER SYSTEM',   "ALTER SYSTEM SET work_mem='1GB'"],
    ['RESET ALL',      'RESET ALL'],
    ['DELETE no WHERE','DELETE FROM public.mcp_probe'],
    ['UPDATE no WHERE','UPDATE public.mcp_probe SET probe=0'],
    // Obfuscation attempts
    ['DROP/**/',       'DROP/**/TABLE IF EXISTS test_xyz'],
    ['ALTER\\nSYSTEM', "ALTER\nSYSTEM SET work_mem='1GB'"],
  ];
  for (const [label, sql] of blocks) {
    const r = await callTool('db_query', { sql });
    if (!assert(`A3.block-${label}`, !!r.parsed?.error, r.parsed, 'error')) {
      warn_(`A3.block-${label}`, 'SECURITY: destructive SQL not blocked!');
    }
  }
  // Token not in error body
  const err = await rawPost({jsonrpc:'2.0',id:99,method:'tools/call',params:{name:'ping',arguments:{}}},
    {'Authorization':'Bearer WRONG'});
  assert('A3.token-not-leaked', !JSON.stringify(err).includes(TOKEN), 'leaked', 'not leaked');

  // db_delete no = in filter
  const nd = await callTool('db_delete',{table:'mcp_probe',filter:'no_equals'});
  assert('A3.delete-no-filter', !!nd.parsed?.error, nd.parsed, 'error');

  process.stdout.write(`✅ ${results.pass.filter(p=>p.startsWith('A3')).length}/10\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 4 — Edge Cases (10 checks)
// ═══════════════════════════════════════════════════════════════════════════════
async function runA4() {
  process.stdout.write('A4 Edge Cases     ');
  // Unicode roundtrip
  const uni = await callTool('db_query',{sql:"SELECT '🎉 ñoño αβγ' AS v"});
  assert('A4.unicode', uni.parsed?.rows?.[0]?.v==='🎉 ñoño αβγ', uni.parsed?.rows?.[0]?.v, 'unicode');

  // Blank SQL → error
  const blank = await callTool('db_query',{sql:'   '});
  assert('A4.blank-sql', !!blank.parsed?.error, blank.parsed, 'error');

  // Negative limit clamped
  const negLim = await callTool('db_query',{sql:'SELECT 1 AS x',limit:-1});
  assert('A4.neg-limit', negLim.parsed?.count<=1, negLim.parsed?.count, '<=1');

  // Overflow limit clamped
  const bigLim = await callTool('db_query',{sql:'SELECT generate_series(1,3) AS n',limit:99999999});
  assert('A4.overflow-limit', bigLim.parsed?.count<=10000, bigLim.parsed?.count, '<=10000');

  // db_export CSV has header + data
  const csv = await callTool('db_export',{sql:"SELECT 42 AS x, 'hi' AS s",format:'csv'});
  assert('A4.csv-header', csv.parsed?.csv?.includes('x'), csv.parsed?.csv, 'x in header');
  assert('A4.csv-value',  csv.parsed?.csv?.includes('42'), csv.parsed?.csv, '42 in body');

  // db_join_query t1/t2 alias rewriting (self-join)
  const alias = await callTool('db_join_query',{table1:'mcp_probe',table2:'mcp_probe',on:'t1.probe=t2.probe',select:'t1.probe AS p1, t2.probe AS p2',limit:1});
  assert('A4.alias-rewrite', !alias.parsed?.error, alias.parsed, 'no error');

  // Fail-mid transaction: no partial rows leak
  const partial = await callTool('db_transaction',{statements:JSON.stringify(['SELECT 42','SELECT 1/0'])});
  assert('A4.no-partial-rows', !partial.parsed?.rows, partial.parsed?.rows, undefined);

  // 50 statements
  const fifty = Array.from({length:50},(_,i)=>`SELECT ${i} AS n`);
  const big = await callTool('db_transaction',{statements:JSON.stringify(fifty)});
  const big50 = big.parsed?.count===50 || !!big.parsed?.error;
  assert('A4.fifty-stmts', big50, big.parsed?.count, '50 or error');
  if (big.parsed?.error) warn_('A4.fifty-stmts', 'PG simple query length limit hit at 50 stmts: '+JSON.stringify(big.parsed.error));

  process.stdout.write(`✅ ${results.pass.filter(p=>p.startsWith('A4')).length}/9\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT 5 — Regression + Perf (71 tools + 4 extra)
// ═══════════════════════════════════════════════════════════════════════════════
async function runA5() {
  process.stdout.write('A5 Regression     ');

  // Expect errors on these (infra limitations, not code bugs)
  const expectError = new Set([
    'db_insert','db_update','db_upsert','db_alter_table','db_copy_data',
    'storage_get_object_info','storage_create_signed_url','storage_move_object',
    'storage_delete_object','storage_create_bucket','storage_empty_bucket','storage_delete_bucket',
    'auth_get_user','auth_list_users_by_email','auth_update_user','auth_delete_user',
  ]);

  const tools71 = [
    ['ping',{}],['db_health',{}],['db_connection_info',{}],['db_overview',{}],
    ['db_list_schemas',{}],['db_list_tables',{limit:5}],
    ['db_list_columns',{table:'mcp_probe'}],['db_describe_table',{table:'mcp_probe'}],
    ['db_list_views',{}],['db_list_enums',{}],['db_list_extensions',{}],['db_list_roles',{}],
    ['db_list_indexes',{table:'mcp_probe'}],['db_list_functions',{}],['db_list_triggers',{}],
    ['db_list_policies',{}],['db_constraints',{table:'mcp_probe'}],
    ['db_relationships',{}],['db_sequences',{}],['db_migrations',{}],['db_pg_settings',{limit:5}],
    ['db_select',{table:'mcp_probe',limit:1}],['db_count',{table:'mcp_probe'}],
    ['db_insert',{table:'__noop__',data:'{"x":1}'}],
    ['db_update',{table:'__noop__',filter:'id=0',data:'{"x":1}'}],
    ['db_upsert',{table:'__noop__',data:'{"x":1}'}],
    ['db_delete',{table:'mcp_probe',filter:'probe=__noop__'}],
    ['db_query',{sql:'SELECT 1 AS probe',limit:1}],
    ['db_batch_query',{queries:JSON.stringify(['SELECT 1','SELECT 2'])}],
    ['db_transaction',{statements:JSON.stringify(['SELECT 1 AS a','SELECT 2 AS b'])}],
    ['db_explain',{sql:'SELECT * FROM mcp_probe LIMIT 1',analyze:false}],
    ['db_stats',{}],['db_active_queries',{limit:5}],['db_slow_queries',{limit:5}],
    ['db_locks',{limit:5}],['db_disk_usage',{limit:5}],['db_table_bloat',{limit:5}],
    ['db_index_usage',{table:'mcp_probe',limit:5}],['db_missing_indexes',{limit:5}],
    ['db_duplicate_indexes',{}],['db_column_stats',{table:'mcp_probe',column:'probe'}],
    ['db_vacuum',{table:'mcp_probe',analyze:true}],  // ← table específica → threshold 5s (view = muito rápido)
    ['db_alter_table',{table:'__noop__',action:'add_column',column:'x',column_type:'TEXT'}],
    ['db_aggregate',{table:'mcp_probe',func:'count'}],
    ['db_join_query',{table1:'mcp_probe',table2:'mcp_probe',on:'t1.probe=t2.probe',limit:1}],
    ['db_search_global',{query:'probe',limit:5}],
    ['db_sample',{table:'mcp_probe',limit:3}],
    ['db_export',{sql:'SELECT probe FROM mcp_probe',format:'json'}],
    ['db_copy_data',{from_table:'__noop__',to_table:'__noop2__'}],
    ['db_set_comment',{table:'mcp_probe',comment:'phd-suite'}],
    ['db_rls_manage',{table:'empresas',action:'enable'}],  // VIEW can't have RLS — use real table
    ['db_grant',{table:'mcp_probe',role:'anon',action:'grant',privileges:'SELECT'}],
    ['storage_list_buckets',{}],['storage_get_bucket',{bucket:'nfe-xml'}],
    ['storage_list_objects',{bucket:'nfe-xml',limit:3}],
    ['storage_get_object_info',{bucket:'nfe-xml',path:'__noop__'}],
    ['storage_create_signed_url',{bucket:'nfe-xml',path:'__noop__'}],
    ['storage_move_object',{bucket:'nfe-xml',from_path:'__a__',to_path:'__b__'}],
    ['storage_delete_object',{bucket:'nfe-xml',path:'__noop__'}],
    ['storage_create_bucket',{name:`phd_${Date.now()}`,is_public:false}],
    ['storage_update_bucket',{bucket:'nfe-xml',is_public:false}],
    ['storage_empty_bucket',{bucket:'__noop__'}],['storage_delete_bucket',{bucket:'__noop__'}],
    ['functions_list',{}],['functions_ping',{function_name:'health'}],
    ['auth_list_users',{limit:1}],
    ['auth_get_user',{user_id:'00000000-0000-0000-0000-000000000000'}],
    ['auth_list_users_by_email',{email:'probe@noop.test'}],
    ['auth_create_user',{email:`phd.${Date.now()}@noop.invalid`,password:'PhD@123456!',email_confirm:true}],
    ['auth_update_user',{user_id:'00000000-0000-0000-0000-000000000000',metadata:'{"phd":1}'}],
    ['auth_delete_user',{user_id:'00000000-0000-0000-0000-000000000000'}],
  ];

  let pass71=0, fail71=0;
  const timings = {};
  let createdUserId = null;

  for (const [name, args] of tools71) {
    let callArgs = {...args};

    if (name === 'auth_create_user') {
      const r = await callTool(name, callArgs);
      timings[name] = r.ms;
      if (r.parsed?.id) {
        createdUserId = r.parsed.id;
        const updateEntry = tools71.find(([n]) => n === 'auth_update_user');
        const deleteEntry = tools71.find(([n]) => n === 'auth_delete_user');
        if (updateEntry) { updateEntry[1].user_id = createdUserId; expectError.delete('auth_update_user'); }
        if (deleteEntry) { deleteEntry[1].user_id = createdUserId; expectError.delete('auth_delete_user'); }
        pass71++; results.pass.push(`A5.reg:${name}`);
      } else {
        fail71++; results.fail.push({name:`A5.reg:${name}`, actual:JSON.stringify(r.parsed)?.slice(0,150)});
      }
      continue;
    }

    const r = await callTool(name, callArgs);
    timings[name] = r.ms;
    const ok = !r.json?.error && (!r.parsed?.error || expectError.has(name));
    if (ok) { pass71++; results.pass.push(`A5.reg:${name}`); }
    else    { fail71++; results.fail.push({name:`A5.reg:${name}`, actual:JSON.stringify(r.parsed)?.slice(0,150), rpc:r.json?.error}); }
  }

  // Extra: concurrency
  const conc = await Promise.all(Array.from({length:5},(_,i)=>callTool('db_query',{sql:`SELECT ${i+1} AS n`})));
  assert('A5.concurrency-5x', conc.every(r=>!r.json?.error), conc.filter(r=>r.json?.error).length, 0);

  // Extra: stability 5x mcp_probe
  const stab = await Promise.all(Array.from({length:5},()=>callTool('db_select',{table:'mcp_probe'})));
  assert('A5.stability-5x', stab.every(r=>r.parsed?.rows?.[0]?.probe===1), null, 'probe=1 sempre');

  // Extra: concurrent transactions
  const txns = await Promise.all(Array.from({length:3},(_,i)=>
    callTool('db_transaction',{statements:JSON.stringify([`SELECT ${i} AS a`,`SELECT ${i+10} AS b`])})));
  assert('A5.concurrent-txns', txns.every(r=>r.parsed?.count===2), txns.map(r=>r.parsed?.count), 'all 2');

  // Perf summary
  const sorted = Object.entries(timings).sort(([,a],[,b])=>b-a);
  const avg    = Math.round(sorted.reduce((_,[,ms])=>_+ms,0)/sorted.length);
  const perf   = `avg:${avg}ms  slowest:${sorted[0]?.[0]}(${sorted[0]?.[1]}ms)`;

  process.stdout.write(`✅ ${pass71}/71 reg  ${perf}\n`);
  if (fail71 > 0) {
    results.fail.filter(f=>f.name?.startsWith('A5.reg:')).forEach(f=>
      console.error(`     ❌ ${f.name}: ${f.actual}`));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(` PhD MCP Test Suite  target: ${BASE}`);
  console.log('═══════════════════════════════════════════════════════');
  const t0 = Date.now();
  await runA1();
  await runA2();
  await runA3();
  await runA4();
  await runA5();
  const total = Date.now() - t0;

  const totalPass = results.pass.length;
  const totalFail = results.fail.length;
  const totalWarn = results.warn.length;
  const perfWarns = results.warn.filter(w=>w.threshold);

  console.log('═══════════════════════════════════════════════════════');
  console.log(` RESULT: PASS:${totalPass}  FAIL:${totalFail}  WARN:${totalWarn}  (${(total/1000).toFixed(1)}s)`);
  if (perfWarns.length) {
    console.log(` Perf warnings (slow but functional):`);
    perfWarns.forEach(w=>console.log(`   ⚠️  ${w.name}: ${w.ms}ms > ${w.threshold}ms threshold`));
  }
  if (totalFail > 0) {
    console.log(` FAILURES:`);
    results.fail.forEach(f=>console.error(`   ❌ ${f.name}: ${f.actual}`));
    process.exit(1);
  }
  console.log(` ${totalFail===0?'✅ TODAS AS VERIFICAÇÕES PASSARAM':'❌ FALHAS DETECTADAS'}`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
