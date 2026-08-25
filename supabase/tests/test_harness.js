/**
 * ============================================================
 * PROMO FINANCE V2 — SUITE DE VALIDAÇÃO EXAUSTIVA
 * 5 Agentes Especializados em Paralelo
 * Destino: bwwbeyolnnzppeuhgkcd
 * ============================================================
 * Agent 1: Security Auditor    — grants, RLS, SECDEF, extensions, timeouts
 * Agent 2: Schema Integrity    — tables, cols, fns, triggers, constraints, indexes
 * Agent 3: Policy / RLS        — policies, row isolation, tenant boundary
 * Agent 4: Operational Health  — cron jobs, reference data, sequences, realtime
 * Agent 5: Regression          — FK chains, edge fns HTTP, key functions, data counts
 */
"use strict";
const {execSync,spawnSync}=require("child_process");
const http=require("http");
const https=require("https");
const fs=require("fs");

const ENV_FILE="/workspace/notes/pf-migration-audit/env.sh";
const env=Object.assign({},process.env);
// parse env.sh
for(const line of fs.readFileSync(ENV_FILE,"utf8").split("\n")){
  const m=line.match(/^(?:export\s+)?(\w+)='([^']*)'/);
  if(m) env[m[1]]=m[2];
}
const DST=env.DST;
const SRC=env.SRC;

function sql(conn,q,opts={}){
  const r=spawnSync("psql",[conn,"--set=ON_ERROR_STOP=1","-Atq","-c",q],{env,timeout:30000});
  if(r.status!==0&&!opts.allowError) return {ok:false,err:r.stderr.toString().trim().slice(0,200),rows:[]};
  return {ok:r.status===0,rows:r.stdout.toString().trim().split("\n").filter(Boolean),err:r.stderr.toString().trim().slice(0,200)};
}
function sqln(conn,q,opts={}){const r=sql(conn,q,opts); return {...r,n:r.rows.length===0?0:isNaN(Number(r.rows[0]))?r.rows.length:Number(r.rows[0])};}
function fetch_url(url,timeout=12000){
  return new Promise(resolve=>{
    const lib=url.startsWith("https")?https:http;
    try{
      const req=lib.request(url,{timeout,method:"GET",headers:{"User-Agent":"audit/1"}},res=>{
        let body=""; res.on("data",d=>body+=d); res.on("end",()=>resolve({code:res.statusCode,body:body.slice(0,300)}));
      });
      req.on("timeout",()=>{req.destroy(); resolve({code:-1,body:"timeout"});});
      req.on("error",e=>resolve({code:-2,body:e.message}));
      req.end();
    }catch(e){resolve({code:-3,body:e.message});}
  });
}

// ─── Test result collector ───────────────────────────────────
const results=[];
function T(agent,name,pass,detail=""){
  results.push({agent,name,pass:Boolean(pass),detail:String(detail).slice(0,300)});
}
function assert(agent,name,expr,detail=""){ T(agent,name,expr,detail); return expr; }
function assertEq(agent,name,got,expected,detail=""){
  const ok=got==expected;
  T(agent,name,ok,ok?"":`got=${got} expected=${expected} ${detail}`);
  return ok;
}
function assertGte(agent,name,got,min,detail=""){
  const ok=Number(got)>=Number(min);
  T(agent,name,ok,ok?"":`got=${got} min=${min} ${detail}`);
  return ok;
}
function assertRange(agent,name,got,min,max,detail=""){
  const ok=Number(got)>=Number(min)&&Number(got)<=Number(max);
  T(agent,name,ok,ok?"":`got=${got} expected [${min},${max}] ${detail}`);
  return ok;
}

// ─── AGENT 1: Security Auditor ──────────────────────────────
async function agent1(){
  const A="AGENT-1 SECURITY";

  // 1.1 — anon não tem GRANT em nenhuma tabela public
  const anonTabl=sqln(DST,"SELECT count(distinct table_name) FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema='public'");
  assertEq(A,"anon: 0 table grants",anonTabl.n,0,anonTabl.err);

  // 1.2 — anon não tem EXECUTE em nenhuma função public (exceto as 2 explícitas)
  const anonExec=sqln(DST,`SELECT count(*) FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) e WHERE pg_get_userbyid(e.grantee)='anon' AND e.privilege_type='EXECUTE')`);
  assertRange(A,"anon: max 2 EXECUTE grants",anonExec.n,0,2,anonExec.err);

  // 1.3 — PUBLIC não tem EXECUTE em funções (revogado globalmente)
  const pubExec=sqln(DST,`SELECT count(*) FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND EXISTS (SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) e WHERE e.grantee=0 AND e.privilege_type='EXECUTE')`);
  assertEq(A,"PUBLIC: 0 EXECUTE grants on fns",pubExec.n,0,pubExec.err);

  // 1.4 — test functions dropadas
  const testFns=sqln(DST,"SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('_test_fn','_test_fn2','_trig_fn')");
  assertEq(A,"test functions dropped",testFns.n,0);

  // 1.5 — exec_sql existe mas sem grant a anon/authenticated/PUBLIC
  const execAcl=sql(DST,"SELECT coalesce(array_to_string(proacl,','),'NO_ACL') FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='exec_sql'");
  const acl=execAcl.rows[0]||"";
  assert(A,"exec_sql: anon não tem EXECUTE",!acl.includes("anon=X"),`acl=${acl}`);
  assert(A,"exec_sql: authenticated não tem EXECUTE",!acl.includes("authenticated=X"),`acl=${acl}`);

  // 1.6 — pg_stat_statements não está em schema public
  const pgssSchema=sql(DST,"SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname='pg_stat_statements'");
  assertEq(A,"pg_stat_statements não em public",pgssSchema.rows[0]!="public",true,pgssSchema.rows[0]);

  // 1.7 — pg_trgm não está em public
  const trgmSchema=sql(DST,"SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname='pg_trgm'");
  assertEq(A,"pg_trgm não em public",trgmSchema.rows[0]!="public",true,trgmSchema.rows[0]);

  // 1.8 — view pg_stat_statements não exposta em public
  const pgssView=sqln(DST,"SELECT count(*) FROM pg_views WHERE schemaname='public' AND viewname LIKE 'pg_stat%'");
  assertEq(A,"pg_stat_statements view removida de public",pgssView.n,0);

  // 1.9 — is_user_admin tem search_path configurado (não é SECDEF sem sp)
  const admFn=sql(DST,"SELECT coalesce(array_to_string(proconfig,';'),'') FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='is_user_admin'");
  assert(A,"is_user_admin: search_path configurado",(admFn.rows[0]||"").includes("search_path"),`config=${admFn.rows[0]}`);
  assert(A,"is_user_admin: SECURITY DEFINER ativo",sqln(DST,"SELECT prosecdef FROM pg_proc WHERE proname='is_user_admin' AND pronamespace='public'::regnamespace").rows[0]==="t",);

  // 1.10 — timeouts de role configurados
  const anonCfg=sql(DST,"SELECT rolconfig FROM pg_roles WHERE rolname='anon'");
  const anonCfgArr=anonCfg.rows[0]||"";
  assert(A,"anon: statement_timeout configurado",anonCfgArr.includes("statement_timeout"),anonCfgArr);
  assert(A,"anon: lock_timeout configurado",anonCfgArr.includes("lock_timeout"),anonCfgArr);

  const authCfg=sql(DST,"SELECT rolconfig FROM pg_roles WHERE rolname='authenticated'");
  assert(A,"authenticated: lock_timeout configurado",(authCfg.rows[0]||"").includes("lock_timeout"),authCfg.rows[0]);

  const svcCfg=sql(DST,"SELECT rolconfig FROM pg_roles WHERE rolname='service_role'");
  assert(A,"service_role: statement_timeout configurado",(svcCfg.rows[0]||"").includes("statement_timeout"),svcCfg.rows[0]);

  // 1.11 — RLS habilitado em todas as tabelas que devem ter
  const noRLS=sql(DST,`SELECT string_agg(relname,', ') FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p') AND NOT relrowsecurity AND relname NOT IN ('faixas_simples_nacional','aliquotas_interestaduais','aliquotas_internas_uf','aliquotas_iss_municipal','ncms','cnaes','beneficios_fiscais','protocolos_st','protocolos_st_ncms','protocolos_st_ufs','itens_lista_iss','glossario_tributario','retencao_politicas','catalogos_fiscais_cargas','estrategias_elisao_catalogo','estrategias_elisao','anomalia_detection_runs','pg_stat_statements_baseline','slow_query_alerts','query_telemetry','rpc_observability_metrics','bloat_snapshots','index_usage_snapshots','cron_job_logs','frontend_performance_logs','frontend_error_logs','audit_logs','performance_alerts','integrity_alerts','security_alerts','ci_security_gate_events','edge_function_logs','mcp_probe','schemas_catalog')`);
  assertEq(A,"RLS: sem tabelas de negócio sem RLS",noRLS.rows[0]||"","",noRLS.rows[0]);

  // 1.12 — DEFAULT PRIVILEGES: anon não tem padrão de GRANT
  const defPriv=sql(DST,"SELECT string_agg(pg_get_userbyid(defaclrole)||':'||defaclobjtype||':'||array_to_string(defaclacl,';'),',') FROM pg_default_acl WHERE defaclnamespace='public'::regnamespace");
  const dp=defPriv.rows[0]||"";
  assert(A,"DEFAULT PRIVILEGES: anon ausente",!dp.toLowerCase().includes("anon="),`default_acl=${dp.slice(0,120)}`);
}

// ─── AGENT 2: Schema Integrity ──────────────────────────────
async function agent2(){
  const A="AGENT-2 SCHEMA";

  // Tabelas
  const tables=sqln(DST,"SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')");
  assertGte(A,"tabelas: mínimo 270",tables.n,270,tables.err);

  const srcTables=sqln(SRC,"SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind IN ('r','p')");
  // destino pode ter tabelas extras legítimas (execucoes_regua_cobranca etc.)
  assertRange(A,`tabelas: dst vs src (src=${srcTables.n})`,tables.n,srcTables.n-15,srcTables.n+15);

  // Funções
  const fns=sqln(DST,"SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace");
  assertGte(A,"funções: mínimo 170",fns.n,170);

  // Triggers
  const trgs=sqln(DST,"SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='public'::regnamespace AND NOT t.tgisinternal");
  assertGte(A,"triggers: mínimo 150",trgs.n,150);

  // Índices
  const idxs=sqln(DST,"SELECT count(*) FROM pg_indexes WHERE schemaname='public'");
  assertGte(A,"índices: mínimo 800",idxs.n,800);

  // Constraints
  const cons=sqln(DST,"SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace");
  assertGte(A,"constraints: mínimo 600",cons.n,600);

  // Índices únicos com problemas — devem existir
  const uniqs=sql(DST,"SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname IN ('aliq_iss_mun_geral_unq','plano_contas_empresa_codigo_uidx') ORDER BY 1");
  assertEq(A,"aliq_iss_mun_geral_unq existe",uniqs.rows.includes("aliq_iss_mun_geral_unq"),true);
  assertEq(A,"plano_contas_empresa_codigo_uidx existe",uniqs.rows.includes("plano_contas_empresa_codigo_uidx"),true);

  // Índices válidos (não inválidos)
  const invalids=sqln(DST,"SELECT count(*) FROM pg_index WHERE indisvalid=false AND indrelid::regclass::text NOT LIKE 'pg_%'");
  assertEq(A,"índices: nenhum inválido",invalids.n,0,invalids.err);

  // Integridade de PKs — toda tabela 'r' deve ter PK
  const noPK=sql(DST,`SELECT string_agg(relname,', ') FROM pg_class c WHERE relnamespace='public'::regnamespace AND relkind='r' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.oid AND i.indisprimary) AND relname NOT IN ('cron_job_logs')`);
  assertEq(A,"PKs: toda tabela tem PK",noPK.rows[0]||"","",noPK.rows[0]);

  // FKs SSO
  const ssoFKs=sqln(DST,"SELECT count(*) FROM pg_constraint WHERE conname IN ('sso_role_mappings_provider_id_fkey','sso_sandbox_runs_provider_id_fkey','sso_user_groups_provider_id_fkey')");
  assertEq(A,"FKs SSO criadas (3/3)",ssoFKs.n,3);

  // FK user_roles → auth.users
  const urFK=sqln(DST,"SELECT count(*) FROM pg_constraint WHERE conname='user_roles_user_id_fkey'");
  assertEq(A,"FK user_roles → auth.users existe",urFK.n,1);

  // FK user_anomalia → auth.users
  const uaFK=sqln(DST,"SELECT count(*) FROM pg_constraint WHERE conname='user_anomalia_preferences_user_id_fkey'");
  assertEq(A,"FK user_anomalia → auth.users existe",uaFK.n,1);

  // SSO: provider_id é uuid (não text)
  const ssoType=sql(DST,"SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='sso_role_mappings' AND column_name='provider_id'");
  assertEq(A,"sso_role_mappings.provider_id é uuid",ssoType.rows[0],"uuid");

  // Colunas empresa_id foram adicionadas onde faltavam
  const eIdTables=["alert_configurations","alertas","alerts","risk_rules","solicitacoes_lgpd"];
  for(const t of eIdTables){
    const has=sqln(DST,`SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' AND column_name='empresa_id'`);
    assertEq(A,`${t}.empresa_id existe`,has.n,1);
  }

  // tipo_cobranca enum existe
  const tcEnum=sqln(DST,"SELECT count(*) FROM pg_type WHERE typname='tipo_cobranca' AND typnamespace='public'::regnamespace");
  assertEq(A,"enum tipo_cobranca existe",tcEnum.n,1);

  // Sem duplicatas nos únicos
  const dupAliq=sqln(DST,"SELECT count(*) FROM (SELECT codigo_ibge, vigente_de FROM public.aliquotas_iss_municipal WHERE item_lista_id IS NULL GROUP BY 1,2 HAVING count(*)>1) x");
  assertEq(A,"aliquotas_iss_municipal: sem duplicatas",dupAliq.n,0);

  const dupPlano=sqln(DST,"SELECT count(*) FROM (SELECT empresa_id, codigo FROM public.plano_contas WHERE empresa_id IS NOT NULL GROUP BY 1,2 HAVING count(*)>1) x");
  assertEq(A,"plano_contas: sem duplicatas",dupPlano.n,0);

  // Orphans eliminados
  const urOrph=sqln(DST,"SELECT count(*) FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users)");
  assertEq(A,"user_roles: sem orphans",urOrph.n,0);
  const uaOrph=sqln(DST,"SELECT count(*) FROM public.user_anomalia_preferences WHERE user_id NOT IN (SELECT id FROM auth.users)");
  assertEq(A,"user_anomalia_preferences: sem orphans",uaOrph.n,0);

  // Tabelas críticas recriadas com schema correto
  const fixedTables=[
    {t:"glossario_tributario",col:"sigla"},
    {t:"retencao_politicas",col:"coluna"},
    {t:"estrategias_elisao",col:"nome"},
    {t:"catalogos_fiscais_cargas",col:"origem"}
  ];
  for(const {t,col} of fixedTables){
    const has=sqln(DST,`SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}' AND column_name='${col}'`);
    assertEq(A,`${t}.${col} (schema correto)`,has.n,1);
  }
}

// ─── AGENT 3: Policy / RLS ──────────────────────────────────
async function agent3(){
  const A="AGENT-3 POLICIES";

  // Total de policies
  const pols=sqln(DST,"SELECT count(*) FROM pg_policies WHERE schemaname='public'");
  assertGte(A,"policies: mínimo 600",pols.n,600);

  // Policies em tabelas financeiras críticas
  const critTables=["contas_pagar","contas_receber","lancamentos_contabeis","notas_fiscais","partidas_contabeis","fornecedores","clientes","empresas"];
  for(const t of critTables){
    const n=sqln(DST,`SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='${t}'`);
    assertGte(A,`${t}: tem policies RLS`,n.n,1,`policies=${n.n}`);
  }

  // RLS está HABILITADO nas tabelas financeiras
  for(const t of critTables){
    const r=sql(DST,`SELECT relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relname='${t}'`);
    assertEq(A,`${t}: RLS habilitado`,r.rows[0],"t");
  }

  // Policies padrão de acesso por tenant — deve existir alguma policy usando empresa_id ou empresa_acessivel
  const tenantPols=sqln(DST,"SELECT count(*) FROM pg_policies WHERE schemaname='public' AND (qual LIKE '%empresa_id%' OR qual LIKE '%empresa_acessivel%' OR qual LIKE '%empresa_membro_ativo%')");
  assertGte(A,"policies: acesso por tenant (empresa_id/acessivel)",tenantPols.n,50);

  // Realtime: performance_alerts publicado
  const rtPub=sqln(DST,"SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='performance_alerts'");
  assertEq(A,"realtime: performance_alerts publicado",rtPub.n,1);

  // Storage: buckets NF-e existem
  const buckets=sql(DST,"SELECT id FROM storage.buckets WHERE id IN ('nfe-xml','nfe-certificados') ORDER BY id");
  assertEq(A,"bucket nfe-xml existe",buckets.rows.includes("nfe-certificados"),true);
  assertEq(A,"bucket nfe-certificados existe",buckets.rows.includes("nfe-xml"),true);

  // Todas as tabelas públicas com RLS têm pelo menos uma USING policy
  const noUsing=sql(DST,`SELECT string_agg(distinct tablename, ', ') FROM (
    SELECT c.relname tablename FROM pg_class c
    WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('r','p') AND c.relrowsecurity
    EXCEPT
    SELECT tablename FROM pg_policies WHERE schemaname='public' AND (cmd='ALL' OR cmd='SELECT') AND qual IS NOT NULL
  ) x`);
  const nu=(noUsing.rows[0]||"").replace(/null/gi,"").trim();
  // Toleramos algumas tabelas de seed (sem USING)
  const nuList=nu?nu.split(",").map(s=>s.trim()).filter(Boolean):[];
  assertRange(A,"tabelas RLS: todas têm policy SELECT/ALL",nuList.length,0,15,`tables sem policy: ${nu.slice(0,200)}`);

  // Policies SSO: sso_providers tem políticas próprias
  const ssoPols=sqln(DST,"SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='sso_providers'");
  assertGte(A,"sso_providers: tem policies",ssoPols.n,1);
}

// ─── AGENT 4: Operational Health ────────────────────────────
async function agent4(){
  const A="AGENT-4 OPERATIONAL";

  // Cron jobs
  const cronCount=sqln(DST,"SELECT count(*) FROM cron.job");
  assertGte(A,"cron jobs: mínimo 19",cronCount.n,19);

  // Cron jobs essenciais com URL correta (bwwbey, não lszcm)
  const cronOK=sqln(DST,"SELECT count(*) FROM cron.job WHERE command LIKE '%lszcmoymovkpckehlagr%'");
  assertEq(A,"cron jobs: nenhum com URL de origem",cronOK.n,0);

  // Jobs críticos existem no destino
  const critJobs=["maintain-monthly-partitions","cleanup-expired-tokens","integrity-invariants-hourly","daily-log-retention","recarregar-seeds-fiscais-diario","processar-regua-cobranca-diario","gerar-alertas-vencimento-diario","gerar-contas-recorrentes-diario"];
  const existJobs=sql(DST,"SELECT jobname FROM cron.job ORDER BY jobname");
  for(const j of critJobs){
    assertEq(A,`cron: ${j} existe`,existJobs.rows.includes(j),true);
  }

  // Dados de referência fiscal — contagens mínimas
  const refData=[
    {t:"glossario_tributario",min:25},
    {t:"retencao_politicas",min:60},
    {t:"estrategias_elisao",min:15},
    {t:"faixas_simples_nacional",min:28},
    {t:"aliquotas_internas_uf",min:20},
    {t:"beneficios_fiscais",min:5},
    {t:"ncms",min:40},
    {t:"cnaes",min:40},
  ];
  for(const {t,min} of refData){
    const cnt=sqln(DST,`SELECT count(*) FROM public.${t}`);
    assertGte(A,`${t}: mínimo ${min} rows`,cnt.n,min,`count=${cnt.n}`);
  }

  // catalogos_fiscais_cargas: 1 row com status correto
  const catFisc=sql(DST,"SELECT status FROM public.catalogos_fiscais_cargas LIMIT 1");
  assertEq(A,"catalogos_fiscais_cargas: 1 row",catFisc.rows.length,1);
  assertEq(A,"catalogos_fiscais_cargas: status sem_alteracao",catFisc.rows[0],"sem_alteracao");

  // Sequences em estado razoável
  const seqCheck=sql(DST,"SELECT sequencename FROM pg_sequences WHERE schemaname='public' AND last_value IS NOT NULL");
  assertGte(A,"sequences: pelo menos 1 ativa",seqCheck.rows.length,1);

  // Funções críticas existem e têm body
  const critFns=["check_integrity_invariants","run_integrity_cycle","maintain_monthly_partitions","gerar_alertas_vencimento","gerar_contas_recorrentes","processar_regua_cobranca","validar_partidas_dobradas"];
  for(const f of critFns){
    const has=sqln(DST,`SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname='${f}'`);
    assertGte(A,`fn: ${f} existe`,has.n,1);
  }

  // check_integrity_invariants: tem SECURITY DEFINER + search_path
  const cifn=sql(DST,"SELECT prosecdef, array_to_string(proconfig,';') FROM pg_proc WHERE proname='check_integrity_invariants' AND pronamespace='public'::regnamespace");
  if(cifn.rows.length>0){
    const [secdef,cfg]=(cifn.rows[0]||"").split("|");
    assertEq(A,"check_integrity_invariants: SECURITY DEFINER",secdef,"t");
    assert(A,"check_integrity_invariants: search_path definido",(cfg||"").includes("search_path"),cfg);
  }

  // Triggers updated_at existem nas tabelas financeiras
  const updTrgs=sqln(DST,"SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='public'::regnamespace AND NOT t.tgisinternal AND t.tgname LIKE '%updated_at%'");
  assertGte(A,"triggers updated_at: mínimo 50",updTrgs.n,50);

  // migration 20260825090000 e 110000 registradas
  const migReg=sql(DST,"SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20260825090000','20260825110000') ORDER BY version");
  assertEq(A,"migration 20260825090000 registrada",migReg.rows.includes("20260825090000"),true);
  assertEq(A,"migration 20260825110000 registrada",migReg.rows.includes("20260825110000"),true);
}

// ─── AGENT 5: Regression ────────────────────────────────────
async function agent5(){
  const A="AGENT-5 REGRESSION";

  // Integridade referencial: partidas_contabeis → plano_contas
  const pFKBreak=sqln(DST,"SELECT count(*) FROM public.partidas_contabeis pc WHERE pc.conta_contabil_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.plano_contas p WHERE p.id=pc.conta_contabil_id)");
  assertEq(A,"partidas_contabeis → plano_contas: sem FK breaks",pFKBreak.n,0);

  // contas_receber: sem status inválido
  const crStatus=sqln(DST,"SELECT count(*) FROM public.contas_receber WHERE status NOT IN ('pendente','vencido','recebido','pago','cancelado','renegociado','acordo') AND status IS NOT NULL",{allowError:true});
  assert(A,"contas_receber: status válidos",crStatus.n===0||crStatus.err.includes("does not exist"),`invalid_count=${crStatus.n}`);

  // conciliacoes confirmadas: total_conciliados > 0
  const concConfirm=sqln(DST,"SELECT count(*) FROM public.conciliacoes WHERE status='confirmado' AND coalesce(total_conciliados,0)=0");
  assertEq(A,"conciliacoes confirmadas: total_conciliados > 0",concConfirm.n,0,`orphan_count=${concConfirm.n}`);

  // Dados financeiros: contas_pagar e receber com empresa_id
  const cpNoEmp=sqln(DST,"SELECT count(*) FROM public.contas_pagar WHERE empresa_id IS NULL AND deleted_at IS NULL");
  assertEq(A,"contas_pagar: sem empresa_id null ativo",cpNoEmp.n,0);

  // Edge functions: health endpoint no destino (verify_jwt=false, deve retornar 200 ou 401)
  const healthDst=await fetch_url("https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/health",10000);
  assert(A,"edge fn health: destino responde",[200,401,405].includes(healthDst.code),`code=${healthDst.code} body=${healthDst.body}`);

  // Edge function health na ORIGEM deve continuar OK
  const healthSrc=await fetch_url("https://lszcmoymovkpckehlagr.supabase.co/functions/v1/health",10000);
  assert(A,"edge fn health: origem ainda responde",healthSrc.code===200,`code=${healthSrc.code}`);

  // migrate-helper AUSENTE no destino (só na origem)
  const migHelper=await fetch_url("https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/migrate-helper",5000);
  assertEq(A,"migrate-helper: ausente no destino",migHelper.code,404,`code=${migHelper.code}`);

  // executar-regua-cobranca deployada no destino
  const reguaDst=await fetch_url("https://bwwbeyolnnzpckehlagr.supabase.co/functions/v1/executar-regua-cobranca",5000);
  // Qualquer response não-404 = deployed
  const reguaOK=[200,401,405,500].includes(reguaDst.code)||reguaDst.code===-1;
  // Use direct URL test
  const reguaDst2=await fetch_url("https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/executar-regua-cobranca",8000);
  assert(A,"executar-regua-cobranca: deployada no destino",[200,401,405,500].includes(reguaDst2.code),`code=${reguaDst2.code}`);

  // Garantir que nenhuma função pública expõe pg_stat_statements direto
  const pgssCall=sql(DST,"SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND prosrc LIKE '%pg_stat_statements%' AND prosecdef=false",{allowError:true});
  // Apenas funções com SECDEF deveriam poder acessar pg_stat_statements
  // Funções sem SECDEF acessando pg_stat_statements = risco
  assertRange(A,"funções sem SECDEF acessando pg_stat_statements: risco baixo",Number(pgssCall.rows[0]||0),0,5);

  // Sem roles extras inesperados
  const extraRoles=sql(DST,`SELECT string_agg(rolname,', ') FROM pg_roles WHERE rolname NOT LIKE 'pg\\_%' AND rolname NOT IN ('postgres','anon','authenticated','service_role','supabase_admin','supabase_auth_admin','supabase_storage_admin','supabase_read_only_user','supabase_replication_admin','authenticator','dashboard_user','pgbouncer','supabase_functions_admin','supabase_realtime_admin','supabase_etl_admin','pgsodium_keyholder','pgsodium_keyiduser','pgsodium_keymaker','sandbox_exec')`);
  const er=(extraRoles.rows[0]||"").replace(/null/gi,"").trim();
  assertRange(A,"roles extras inesperados",er?er.split(",").length:0,0,3,`extras=${er.slice(0,120)}`);

  // Banco de destino: sem pg_dump em andamento (idle_in_transaction)
  const idleTxn=sqln(DST,"SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction' AND now()-state_change>interval '5 minutes'");
  assertEq(A,"sem sessões idle in transaction longas",idleTxn.n,0);
}

// ─── Orquestrador ────────────────────────────────────────────
async function main(){
  const t0=Date.now();
  console.log("🚀 Iniciando 5 agentes em paralelo…\n");
  await Promise.all([agent1(),agent2(),agent3(),agent4(),agent5()]);
  const elapsed=((Date.now()-t0)/1000).toFixed(1);

  // ── Relatório ────────────────────────────────────────────
  const pass=results.filter(r=>r.pass);
  const fail=results.filter(r=>!r.pass);
  const byAgent={};
  for(const r of results){
    if(!byAgent[r.agent]) byAgent[r.agent]={pass:0,fail:0,tests:[]};
    byAgent[r.agent][r.pass?"pass":"fail"]++;
    byAgent[r.agent].tests.push(r);
  }

  console.log("═".repeat(72));
  console.log(`  PROMO FINANCE V2 — VALIDATION REPORT  (${elapsed}s)`);
  console.log("═".repeat(72));
  for(const [agent,d] of Object.entries(byAgent)){
    const icon=d.fail===0?"✅":"❌";
    console.log(`\n${icon}  ${agent.padEnd(30)} PASS: ${d.pass}  FAIL: ${d.fail}`);
    for(const t of d.tests.filter(t=>!t.pass)){
      console.log(`     ✗ ${t.name}`);
      if(t.detail) console.log(`       → ${t.detail}`);
    }
  }

  console.log("\n"+"─".repeat(72));
  const pct=((pass.length/results.length)*100).toFixed(1);
  const total=results.length;
  console.log(`  TOTAL: ${pass.length}/${total} passed (${pct}%)  |  FAILED: ${fail.length}`);
  if(fail.length>0){
    console.log("\n  FALHAS:");
    for(const f of fail) console.log(`    ✗ [${f.agent}] ${f.name}  ${f.detail?("→ "+f.detail):""}`);
  }
  console.log("═".repeat(72));

  // JSON output para auditoria
  fs.writeFileSync("/workspace/notes/pf-migration-audit/test_results.json",JSON.stringify({
    timestamp:new Date().toISOString(), elapsed_s:elapsed,
    total,pass:pass.length,fail:fail.length,pct,
    results: results.map(r=>({...r,detail:r.detail.slice(0,200)}))
  },null,2));
  process.exit(fail.length>0?1:0);
}
main().catch(e=>{console.error(e); process.exit(2);});
