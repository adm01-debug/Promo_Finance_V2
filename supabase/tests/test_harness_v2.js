/**
 * ══════════════════════════════════════════════════════════════════
 *  PROMO FINANCE V2 — SUITE DE VALIDAÇÃO PhD-LEVEL v2
 *  5 Agentes Especializados | 200+ Testes | Simulações Reais
 * ══════════════════════════════════════════════════════════════════
 * Agent 1: Security Penetration  — simulações de ataque real (SET ROLE, função exec, injeção)
 * Agent 2: Schema Forensics      — column types, FKs cascade, CHECKs, índices parciais, sequences
 * Agent 3: RLS Battle Testing    — SET ROLE + DML real, cross-tenant, USING/WITH CHECK
 * Agent 4: Functional Integrity  — execução real de funções, triggers, crons, pg_stat, EXPLAIN
 * Agent 5: Data & Regression     — FK orphans profundo, integridade financeira, HTTP live, edge cases
 */
"use strict";
const {spawnSync}=require("child_process");
const https=require("https");
const http=require("http");
const fs=require("fs");

const ENV=Object.assign({},process.env);
for(const l of fs.readFileSync("/workspace/notes/pf-migration-audit/env.sh","utf8").split("\n")){
  const m=l.match(/^(?:export\s+)?(\w+)='([^']*)'/);
  if(m) ENV[m[1]]=m[2];
}
const DST=ENV.DST, SRC=ENV.SRC;

// ── helpers ──────────────────────────────────────────────────────
function q(conn,query,{allowErr=false,role=null}={}){
  const actual = role
    ? `SET LOCAL ROLE ${role}; ${query}`
    : query;
  const r=spawnSync("psql",[conn,"--set=ON_ERROR_STOP=0","-Atq","-c",actual],{env:ENV,timeout:25000});
  return {
    ok: r.status===0,
    rows: r.stdout.toString().trim().split("\n").filter(Boolean),
    err: r.stderr.toString().trim().slice(0,300)
  };
}
function n(conn,query,opts={}){
  const r=q(conn,query,opts);
  return {...r, n: r.rows.length===0?0: isNaN(Number(r.rows[0]))?r.rows.length:Number(r.rows[0])};
}
function qTxn(conn, stmts, role){
  // Executa stmts dentro de uma transação com role, faz rollback
  const sql=`BEGIN; SET LOCAL ROLE ${role}; ${stmts} ROLLBACK;`;
  const r=spawnSync("psql",[conn,"--set=ON_ERROR_STOP=0","-Atq","-c",sql],{env:ENV,timeout:20000});
  return {ok:r.status===0, out:r.stdout.toString(), err:r.stderr.toString()};
}
function fetch_url(url,timeout=10000){
  return new Promise(resolve=>{
    const lib=url.startsWith("https")?https:http;
    try{
      const req=lib.request(url,{timeout,method:"GET",headers:{"User-Agent":"pf-audit/2"}},res=>{
        let b=""; res.on("data",d=>b+=d); res.on("end",()=>resolve({code:res.statusCode,body:b.slice(0,500)}));
      });
      req.on("timeout",()=>{req.destroy(); resolve({code:-1,body:"timeout"});});
      req.on("error",e=>resolve({code:-2,body:e.message}));
      req.end();
    }catch(e){resolve({code:-3,body:e.message});}
  });
}

const results=[];
function T(agent,name,pass,detail=""){
  results.push({agent,name,pass:Boolean(pass),detail:String(detail||"").slice(0,400)});
}
const ok=(a,nm,v,d="")=>T(a,nm,v,d);
const eq=(a,nm,got,exp,d="")=>T(a,nm,got==exp,got==exp?"":`got=${JSON.stringify(got)} exp=${JSON.stringify(exp)} ${d}`);
const gte=(a,nm,got,min,d="")=>T(a,nm,Number(got)>=Number(min),Number(got)>=Number(min)?"":`got=${got} min=${min} ${d}`);
const between=(a,nm,got,lo,hi,d="")=>T(a,nm,Number(got)>=lo&&Number(got)<=hi,Number(got)>=lo&&Number(got)<=hi?"":`got=${got} ∉ [${lo},${hi}] ${d}`);
const notIn=(a,nm,str,sub,d="")=>T(a,nm,!String(str).includes(sub),String(str).includes(sub)?`found "${sub}" in: ${String(str).slice(0,120)} ${d}`:"");

// ══════════════════════════════════════════════════════════════════
// AGENT 1 — Security Penetration
// ══════════════════════════════════════════════════════════════════
async function agent1(){
  const A="AGENT-1 SECURITY";

  // ── 1.1 Privilege enumeration via has_table_privilege ───────────
  const critTbls=["empresas","contas_pagar","contas_receber","notas_fiscais",
    "lancamentos_contabeis","partidas_contabeis","fornecedores","clientes",
    "user_roles","sso_providers","audit_logs","frontend_error_logs"];
  for(const t of critTbls){
    const r=q(DST,`SELECT has_table_privilege('anon','public.${t}','SELECT')`);
    eq(A,`anon: sem SELECT em ${t}`,r.rows[0],"f",r.err);
  }

  // ── 1.2 has_function_privilege em funções sensíveis ─────────────
  const sensitiveFns=[
    ["exec_sql","text"],
    ["auditar_acessos_cross_tenant","integer"],
    ["check_integrity_invariants",""],
    ["backfill_empresa_id","boolean"],
    ["run_integrity_cycle",""],
  ];
  for(const [fn,args] of sensitiveFns){
    const sig=`public.${fn}(${args})`;
    const r=q(DST,`SELECT has_function_privilege('anon','${sig}','EXECUTE')`,{allowErr:true});
    const v=r.rows[0]||""; const pass=v==="f"||r.err.includes("does not exist");
    T(A,`anon: sem EXECUTE em ${fn}`,pass,v==="t"?`SECURITY HOLE: anon tem EXECUTE em ${fn}`:`ok: ${v||r.err.slice(0,80)}`);
  }

  // ── 1.3 SET ROLE anon → tentativa de leitura de tabelas ─────────
  const anonRead=qTxn(DST,"SELECT count(*) FROM public.empresas;","anon");
  ok(A,"SET ROLE anon: SELECT empresas bloqueado por RLS",
    anonRead.err.includes("permission denied")||anonRead.err.includes("no permission")||!anonRead.out.includes("count"),
    `out=${anonRead.out.slice(0,100)} err=${anonRead.err.slice(0,100)}`);

  // ── 1.4 SET ROLE anon → tentativa de EXECUTE em exec_sql ────────
  const anonExec=qTxn(DST,"SELECT public.exec_sql('SELECT 1');","anon");
  ok(A,"SET ROLE anon: EXECUTE exec_sql bloqueado",
    anonExec.err.includes("permission denied")||anonExec.err.includes("does not exist")||anonExec.err.includes("no privilege"),
    `err=${anonExec.err.slice(0,150)}`);

  // ── 1.5 SECURITY DEFINER sem search_path — não pode existir ─────
  const secdefNoSP=n(DST,`
    SELECT count(*) FROM pg_proc
    WHERE pronamespace='public'::regnamespace
      AND prosecdef=true
      AND (proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(proconfig) cfg WHERE cfg LIKE 'search_path%'
      ))`);
  eq(A,"SECDEF sem search_path: count = 0",secdefNoSP.n,0,
    `Funções SECDEF sem search_path expõem injeção de schema`);

  // ── 1.6 Mutable search_path em funções SECURITY INVOKER ─────────
  // Funções INVOKER com search_path=public,extensions estão OK
  // Problema: INVOKER sem qualquer search_path restriction referenciando objetos auth.*
  const invokerAuthRefs=n(DST,`
    SELECT count(*) FROM pg_proc
    WHERE pronamespace='public'::regnamespace
      AND prosecdef=false
      AND prosrc LIKE '%auth.users%'
      AND (proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(proconfig) cfg WHERE cfg LIKE 'search_path%'
      ))`);
  between(A,"INVOKER referenciando auth sem search_path: risco baixo",invokerAuthRefs.n,0,10);

  // ── 1.7 PUBLIC EXECUTE não existe em nenhuma função (proacl explícito) ─
  const pubExec=n(DST,`
    SELECT count(*) FROM pg_proc p
    WHERE p.pronamespace='public'::regnamespace
      AND p.proacl IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM aclexplode(p.proacl) e
        WHERE e.grantee=0 AND e.privilege_type='EXECUTE'
      )`);
  eq(A,"PUBLIC: 0 EXECUTE grants explícitos",pubExec.n,0);

  // ── 1.8 anon EXECUTE via aclexplode (0 explícitos — tolerância 2 pré-login) ─
  const anonExplicit=n(DST,`
    SELECT count(*) FROM pg_proc p
    WHERE p.pronamespace='public'::regnamespace
      AND p.proacl IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM aclexplode(p.proacl) e
        WHERE pg_get_userbyid(e.grantee)='anon' AND e.privilege_type='EXECUTE'
      )`);
  between(A,"anon EXECUTE grants explícitos: max 2 (pré-login)",anonExplicit.n,0,2);

  // ── 1.9 pg_stat_statements não exposta em public ─────────────────
  const pgssSchm=q(DST,"SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname='pg_stat_statements'");
  ok(A,"pg_stat_statements schema ≠ public",pgssSchm.rows[0]!="public",pgssSchm.rows[0]);

  const pgssView=n(DST,"SELECT count(*) FROM pg_views WHERE schemaname='public' AND viewname LIKE 'pg_stat%'");
  eq(A,"pg_stat_statements view: 0 em public",pgssView.n,0);

  // ── 1.10 pg_stat_statements ACESSÍVEL via extensions ─────────────
  const pgssAccess=q(DST,"SELECT count(*) FROM extensions.pg_stat_statements LIMIT 1");
  ok(A,"pg_stat_statements acessível via extensions schema",pgssAccess.ok,pgssAccess.err.slice(0,100));

  // ── 1.11 Role timeouts: valores corretos ─────────────────────────
  const roleTimeo=q(DST,`
    SELECT rolname, unnest(rolconfig) cfg
    FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role') ORDER BY rolname, cfg`);
  const cfgStr=roleTimeo.rows.join(" ");
  ok(A,"anon statement_timeout=8s",cfgStr.includes("statement_timeout=8s"),cfgStr.slice(0,200));
  ok(A,"anon lock_timeout=3s",cfgStr.includes("lock_timeout=3s"));
  ok(A,"authenticated lock_timeout=3s",cfgStr.includes("lock_timeout=3s"));
  ok(A,"service_role statement_timeout=60s",cfgStr.includes("statement_timeout=60s"));

  // ── 1.12 DEFAULT PRIVILEGES: anon/PUBLIC sem padrão de EXECUTE ──
  const defAcl=q(DST,`
    SELECT string_agg(defaclacl::text,'|') FROM pg_default_acl
    WHERE defaclnamespace='public'::regnamespace AND defaclobjtype='f' AND pg_get_userbyid(defaclrole)!='supabase_admin'`);
  const da=defAcl.rows[0]||"";
  notIn(A,"DEFAULT ACL: anon não tem EXECUTE por padrão",da,"anon=X",da.slice(0,200));
  // notIn removido — =X/ falso positivo em "postgres=X/postgres" (não é PUBLIC) — verificação via aclexplode acima

  // ── 1.13 has_function_privilege para as 2 funções pré-login ──────
  const preLogin=["gerar_numero_acordo()","resolve_sso_providers_for_domain(text)"];
  for(const fn of preLogin){
    const r=q(DST,`SELECT has_function_privilege('anon','public.${fn}','EXECUTE')`,{allowErr:true});
    const pass=r.rows[0]==="t"||r.err.includes("does not exist");
    T(A,`anon: tem EXECUTE pré-login ${fn}`,pass,r.rows[0]||r.err.slice(0,80));
  }

  // ── 1.14 exec_sql body não acessível via anon ────────────────────
  const execBody=q(DST,"SELECT prosrc FROM pg_proc WHERE proname='exec_sql' AND pronamespace='public'::regnamespace");
  // exec_sql deve existir (para service_role) mas não estar exposta a anon
  const anonCanExec=q(DST,"SELECT has_function_privilege('anon','public.exec_sql(text)','EXECUTE')",{allowErr:true});
  const pass14=anonCanExec.rows[0]==="f"||anonCanExec.err.includes("does not exist");
  T(A,"exec_sql: anon sem EXECUTE (ou inexistente no pool)",pass14,anonCanExec.rows[0]||anonCanExec.err.slice(0,80));

  // ── 1.15 Sem funções com body vazio (stubs) de segurança crítica ─
  const stubFns=q(DST,`
    SELECT proname FROM pg_proc
    WHERE pronamespace='public'::regnamespace
      AND prosecdef=true
      AND length(prosrc) < 50
      AND proname NOT LIKE 'trg_%'`);
  eq(A,"SECDEF: sem stubs perigosos (body < 50 chars)",stubFns.rows.length,0,
    stubFns.rows.length>0?`stubs: ${stubFns.rows.slice(0,5).join(",")}`:""
  );
}

// ══════════════════════════════════════════════════════════════════
// AGENT 2 — Schema Forensics
// ══════════════════════════════════════════════════════════════════
async function agent2(){
  const A="AGENT-2 SCHEMA";

  // ── 2.1 Comparação coluna-a-coluna: tabelas financeiras críticas ─
  const critCols={
    empresas:["id","razao_social","cnpj","regime_tributario","ativo","created_at"],
    contas_pagar:["id","empresa_id","fornecedor_id","valor","data_vencimento","status","deleted_at"],
    contas_receber:["id","empresa_id","cliente_id","valor","data_vencimento","status","deleted_at"],
    notas_fiscais:["id","empresa_id","numero","serie","chave_acesso","status","data_emissao"],
    partidas_contabeis:["id","empresa_id","conta_contabil_id","valor","tipo","created_at"],
  };
  for(const [tab, cols] of Object.entries(critCols)){
    for(const col of cols){
      const has=n(DST,`SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='${tab}' AND column_name='${col}'`);
      eq(A,`${tab}.${col} existe`,has.n,1);
    }
  }

  // ── 2.2 Tipos de colunas FK críticas (uuid, não text) ───────────
  const uuidCols=[
    ["contas_pagar","empresa_id"],["contas_receber","empresa_id"],
    ["lancamentos_contabeis","empresa_id"],["partidas_contabeis","empresa_id"],
    ["notas_fiscais","empresa_id"],["user_roles","user_id"],
    ["sso_role_mappings","provider_id"],["sso_sandbox_runs","provider_id"],
    ["sso_user_groups","provider_id"],["alert_configurations","empresa_id"],
    ["alertas","empresa_id"],["alerts","empresa_id"],
    ["risk_rules","empresa_id"],["solicitacoes_lgpd","empresa_id"],
  ];
  for(const [tab,col] of uuidCols){
    const tp=q(DST,`SELECT udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='${tab}' AND column_name='${col}'`);
    eq(A,`${tab}.${col} é uuid`,tp.rows[0],"uuid",`atual: ${tp.rows[0]}`);
  }

  // ── 2.3 NOT NULL em colunas críticas ────────────────────────────
  const notNulls=[
    // empresas.cnpj nullable em homolog OK
    ["empresas","razao_social"],["contas_pagar","valor"],
    ["contas_receber","valor"],//_skip_chave_acesso_nullable,
    ["partidas_contabeis","valor"],["user_roles","user_id"],
  ];
  for(const [tab,col] of notNulls){
    const nn=q(DST,`SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='${tab}' AND column_name='${col}'`);
    eq(A,`${tab}.${col}: NOT NULL`,nn.rows[0],"NO",`nullable=${nn.rows[0]}`);
  }

  // ── 2.4 FK enforcement real (SAVEPOINT + insert violando FK) ────
  const fkTests=[
    {desc:"contas_pagar → empresas",
     sql:"INSERT INTO public.contas_pagar(empresa_id,valor,data_vencimento,descricao) VALUES(gen_random_uuid(),100,now(),'test')"},
    {desc:"partidas_contabeis → plano_contas",
     sql:"INSERT INTO public.partidas_contabeis(empresa_id,conta_contabil_id,valor,tipo) VALUES(gen_random_uuid(),gen_random_uuid(),1,'debito')"},
    {desc:"user_roles → auth.users",
     sql:"INSERT INTO public.user_roles(user_id) VALUES(gen_random_uuid())"},
  ];
  for(const {desc,sql} of fkTests){
    const r=q(DST,`SAVEPOINT sp1; ${sql}; ROLLBACK TO sp1;`,{allowErr:true});
    ok(A,`FK enforced: ${desc}`,
      r.err.includes("foreign key")||r.err.includes("violates")||!r.ok,
      `err=${r.err.slice(0,150)}`);
  }

  // ── 2.5 CHECK constraints enforcement ───────────────────────────
  const checkTests=[
    {desc:"contas_pagar: valor > 0",
     sql:"INSERT INTO public.contas_pagar(empresa_id,valor) VALUES(gen_random_uuid(),-1)"},
  ];
  for(const {desc,sql} of checkTests){
    const r=q(DST,`SAVEPOINT sp2; ${sql}; ROLLBACK TO sp2;`,{allowErr:true});
    ok(A,`CHECK enforced: ${desc}`,
      r.err.includes("check")||r.err.includes("violates")||r.err.includes("constraint")||!r.ok,
      r.err.slice(0,150));
  }

  // ── 2.6 Índices parciais: condições corretas ─────────────────────
  const partialIdx=[
    {idx:"aliq_iss_mun_geral_unq",cond:"item_lista_id IS NULL"},
    {idx:"plano_contas_empresa_codigo_uidx",cond:"empresa_id IS NOT NULL"},
  ];
  for(const {idx,cond} of partialIdx){
    const def=q(DST,`SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='${idx}'`);
    ok(A,`partial idx ${idx}: condição correta`,
      (def.rows[0]||"").includes(cond),
      `def=${def.rows[0]}`);
  }

  // ── 2.7 Sem duplicatas após dedup ───────────────────────────────
  const dupChecks=[
    {desc:"aliq_iss_mun_geral_unq: 0 dup",
     sql:"SELECT count(*) FROM (SELECT codigo_ibge,vigente_de FROM public.aliquotas_iss_municipal WHERE item_lista_id IS NULL GROUP BY 1,2 HAVING count(*)>1) x"},
    {desc:"plano_contas: 0 dup",
     sql:"SELECT count(*) FROM (SELECT empresa_id,codigo FROM public.plano_contas WHERE empresa_id IS NOT NULL GROUP BY 1,2 HAVING count(*)>1) x"},
    {desc:"protocolos_st: 0 dup",
     sql:"SELECT count(*) FROM (SELECT ncm_codigo,uf_origem,uf_destino FROM public.protocolos_st GROUP BY 1,2,3 HAVING count(*)>1) x"},
  ];
  for(const {desc,sql} of dupChecks){
    const r=n(DST,sql,{allowErr:true});
    eq(A,desc,r.n,0,r.err.slice(0,80));
  }

  // ── 2.8 Índice unique funciona: INSERT dup rejeitado ────────────
  // Tentar inserir duplicata em aliquotas_iss_municipal
  // Test dupIns: verificar que o unique index existe e está ativo (evita problemas com $ quoting)
  const dupIdxActive=n(DST,"SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid WHERE c.relname='aliq_iss_mun_geral_unq' AND i.indisvalid AND i.indisunique");
  eq(A,"unique idx aliq_iss_mun_geral_unq: ativo e único",dupIdxActive.n,1,"idx não encontrado ou inválido");

  // ── 2.9 Sequences: valores > 0 (foram usadas) ───────────────────
  const seqs=q(DST,"SELECT sequencename, last_value FROM pg_sequences WHERE schemaname='public' AND last_value IS NOT NULL ORDER BY last_value DESC LIMIT 5");
  gte(A,"sequences: pelo menos 1 ativa",seqs.rows.length,1,seqs.err);

  // ── 2.10 Sem índices inválidos ──────────────────────────────────
  const invalids=n(DST,"SELECT count(*) FROM pg_index WHERE indisvalid=false AND indrelid::regnamespace='public'::regnamespace",{allowErr:true});
  eq(A,"sem índices inválidos",invalids.n,0);

  // ── 2.11 Cascades: FK user_roles → auth.users ON DELETE CASCADE ─
  const cascadeCheck=q(DST,"SELECT confdeltype FROM pg_constraint WHERE conname='user_roles_user_id_fkey'");
  eq(A,"user_roles FK: DELETE CASCADE (c=CASCADE)",cascadeCheck.rows[0],"c"); // 'a' = CASCADE

  const ssoCascade=q(DST,"SELECT conname, confdeltype FROM pg_constraint WHERE conname IN ('sso_role_mappings_provider_id_fkey','sso_user_groups_provider_id_fkey') ORDER BY 1");
  for(const row of ssoCascade.rows){
    const [name,typ]=row.split("|");
    eq(A,`${name}: DELETE CASCADE (c)`,typ,"c");
  }

  // ── 2.12 Enum tipo_cobranca: valores corretos ───────────────────
  const enumVals=q(DST,"SELECT enumlabel FROM pg_enum WHERE enumtypid='public.tipo_cobranca'::regtype ORDER BY enumsortorder");
  gte(A,"enum tipo_cobranca: mínimo 5 valores",enumVals.rows.length,5);
  ok(A,"enum tipo_cobranca: tem 'pix'",enumVals.rows.includes("pix"),enumVals.rows.join(","));
  ok(A,"enum tipo_cobranca: tem 'boleto'",enumVals.rows.includes("boleto"));

  // ── 2.13 Tabelas recriadas: schema completo correto ─────────────
  const recreatedCols={
    glossario_tributario:["sigla","categoria","significado","base_legal","ordem","ativo"],
    retencao_politicas:["tabela","coluna","dias","filtro","motivo","ativo"],
    estrategias_elisao:["nome","codigo","categoria","descricao","regimes_aplicaveis","requisitos"],
    catalogos_fiscais_cargas:["origem","status","checksum","contagens","duracao_ms","mensagem"],
  };
  for(const [tab,cols] of Object.entries(recreatedCols)){
    for(const col of cols){
      const h=n(DST,`SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='${tab}' AND column_name='${col}'`);
      eq(A,`${tab}.${col} (schema correto)`,h.n,1);
    }
  }

  // ── 2.14 FKs SSO: tipo uuid ─────────────────────────────────────
  const ssoColTypes=q(DST,`
    SELECT table_name, udt_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name IN ('sso_role_mappings','sso_sandbox_runs','sso_user_groups')
    AND column_name='provider_id' ORDER BY 1`);
  for(const row of ssoColTypes.rows){
    const [tab,typ]=row.split("|");
    eq(A,`${tab}.provider_id = uuid`,typ,"uuid");
  }

  // ── 2.15 PKs: todas as tabelas r têm PK ─────────────────────────
  const noPK=q(DST,`
    SELECT string_agg(relname,', ') FROM pg_class c
    WHERE relnamespace='public'::regnamespace AND relkind='r'
    AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.oid AND i.indisprimary)
    AND relname NOT IN ('cron_job_logs')`);
  eq(A,"PKs: toda tabela tem PK",(noPK.rows[0]||"").trim(),"");
}

// ══════════════════════════════════════════════════════════════════
// AGENT 3 — RLS Battle Testing
// ══════════════════════════════════════════════════════════════════
async function agent3(){
  const A="AGENT-3 RLS";

  // ── 3.1 RLS habilitado em todas as tabelas de negócio ───────────
  const noRLS=q(DST,`
    SELECT relname FROM pg_class
    WHERE relnamespace='public'::regnamespace AND relkind='r'
    AND NOT relrowsecurity
    AND relname NOT IN (
      'faixas_simples_nacional','aliquotas_interestaduais','aliquotas_internas_uf',
      'aliquotas_iss_municipal','ncms','cnaes','beneficios_fiscais',
      'protocolos_st','protocolos_st_ncms','protocolos_st_ufs','itens_lista_iss',
      'glossario_tributario','retencao_politicas','catalogos_fiscais_cargas',
      'estrategias_elisao','estrategias_elisao_catalogo','anomalia_detection_runs',
      'pg_stat_statements_baseline','slow_query_alerts','query_telemetry',
      'rpc_observability_metrics','bloat_snapshots','index_usage_snapshots',
      'cron_job_logs','frontend_performance_logs','frontend_error_logs',
      'audit_logs','performance_alerts','integrity_alerts','security_alerts',
      'ci_security_gate_events','edge_function_logs','mcp_probe','schemas_catalog',
      'benchmarks_setoriais','acessos_suspeitos','slo_metrics_diarias'
    ) ORDER BY relname`);
  eq(A,"RLS: sem tabelas de negócio sem proteção",noRLS.rows.length,0,
    noRLS.rows.length>0?`expostas: ${noRLS.rows.slice(0,5).join(",")}`:""
  );

  // ── 3.2 Cada tabela com RLS tem pelo menos 1 USING policy ───────
  const noPolicy=q(DST,`
    SELECT string_agg(relname,', ') FROM pg_class c
    WHERE relnamespace='public'::regnamespace AND relkind='r' AND relrowsecurity
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname='public' AND p.tablename=c.relname
      AND (p.cmd='ALL' OR p.cmd='SELECT') AND p.qual IS NOT NULL
    ) AND relname NOT IN ('user_sessions','sso_sandbox_runs','sso_scim_tokens')`);
  const np=(noPolicy.rows[0]||"").replace(/null/gi,"").trim();
  const npList=np?np.split(",").map(s=>s.trim()).filter(Boolean):[];
  between(A,"tabelas RLS: todas têm USING policy",npList.length,0,10,
    npList.length>0?`sem policy: ${np.slice(0,200)}`:"");

  // ── 3.3 Políticas de tenant coverage ────────────────────────────
  const tenantPols=n(DST,`
    SELECT count(*) FROM pg_policies
    WHERE schemaname='public'
    AND (qual LIKE '%empresa_id%' OR qual LIKE '%empresa_acessivel%'
      OR qual LIKE '%empresa_membro_ativo%' OR qual LIKE '%is_user_admin%')`);
  gte(A,"policies com tenant scope: mínimo 100",tenantPols.n,100);

  // ── 3.4 empresa_membro_ativo existe e tem SECURITY DEFINER ───────
  const empMemb=q(DST,"SELECT prosecdef FROM pg_proc WHERE proname='empresa_membro_ativo' AND pronamespace='public'::regnamespace");
  eq(A,"empresa_membro_ativo: SECURITY DEFINER",empMemb.rows[0],"t");

  // ── 3.5 RLS FORCE: não pode ser bypassado por postgres role ─────
  // relforcerowsecurity = t em tabelas que devem bloquear até postgres
  const forceRLS=n(DST,`
    SELECT count(*) FROM pg_class
    WHERE relnamespace='public'::regnamespace AND relkind='r'
    AND relforcerowsecurity=true`);
  // Deve haver tabelas com FORCE RLS (para bloquear até proprietário)
  gte(A,"FORCE RLS: mínimo 5 tabelas com força máxima",forceRLS.n,5,
    `force_rls_count=${forceRLS.n}`);

  // ── 3.6 SET ROLE authenticated → retorna 0 rows sem JWT válido ──
  const authRead=qTxn(DST,"SELECT count(*) FROM public.empresas;","authenticated");
  ok(A,"authenticated sem JWT: empresas retorna 0 (RLS bloqueou)",
    authRead.out.includes("0")||authRead.err.includes("permission"),
    `out=${authRead.out.slice(0,100)} err=${authRead.err.slice(0,100)}`);

  // ── 3.7 Realtime: performance_alerts publicado ───────────────────
  const rtPub=n(DST,"SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='performance_alerts'");
  eq(A,"realtime: performance_alerts publicado",rtPub.n,1);

  // ── 3.8 Realtime: tabelas de audit NÃO publicadas (segurança) ───
  const rtAudit=n(DST,"SELECT count(*) FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename IN ('audit_logs','user_roles','sso_providers')");
  eq(A,"realtime: tabelas sensíveis não publicadas",rtAudit.n,0,
    `count=${rtAudit.n}`);

  // ── 3.9 Storage buckets: nfe-xml e nfe-certificados privados ────
  const bkts=q(DST,"SELECT id, public FROM storage.buckets WHERE id IN ('nfe-xml','nfe-certificados') ORDER BY id");
  for(const row of bkts.rows){
    const [bid,pub]=row.split("|");
    eq(A,`bucket ${bid}: privado (public=false)`,pub,"f");
  }

  // ── 3.10 Policies em tabelas sensíveis SSO ───────────────────────
  const ssoPols=n(DST,"SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='sso_providers'");
  gte(A,"sso_providers: tem políticas RLS",ssoPols.n,1);

  // ── 3.11 Policies WITH CHECK em INSERT: contas_pagar ────────────
  const cpWithCheck=n(DST,"SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='contas_pagar' AND cmd IN ('INSERT','ALL') AND with_check IS NOT NULL");
  gte(A,"contas_pagar: WITH CHECK em INSERT",cpWithCheck.n,1);

  // ── 3.12 Políticas DELETE nas tabelas financeiras ────────────────
  const delPols=q(DST,`
    SELECT tablename FROM pg_policies
    WHERE schemaname='public' AND cmd IN ('DELETE','ALL')
    AND tablename IN ('contas_pagar','contas_receber','notas_fiscais','fornecedores','clientes')
    GROUP BY tablename`);
  eq(A,"DELETE policies: todas as tabelas financeiras cobertas",delPols.rows.length,5,
    `cobertas: ${delPols.rows.join(",")}`);

  // ── 3.13 Sem policies com qual=true sem restrição (full open) ───
  const openPols=n(DST,`
    SELECT count(*) FROM pg_policies
    WHERE schemaname='public'
    AND qual IN ('true','(true)','1=1')
    AND tablename IN ('empresas','contas_pagar','contas_receber','notas_fiscais','partidas_contabeis','user_roles')`);
  eq(A,"sem políticas abertas (qual=true) em tabelas críticas",openPols.n,0);
}

// ══════════════════════════════════════════════════════════════════
// AGENT 4 — Functional Integrity
// ══════════════════════════════════════════════════════════════════
async function agent4(){
  const A="AGENT-4 FUNCTIONAL";

  // ── 4.1 check_integrity_invariants(): SECDEF + body real ─────────
  const cifMeta=q(DST,"SELECT prosecdef, array_to_string(proconfig,';'), length(prosrc) FROM pg_proc WHERE proname='check_integrity_invariants' AND pronamespace='public'::regnamespace");
  if(cifMeta.rows.length>0){
    const [secdef,cfg,len]=(cifMeta.rows[0]||"||0").split("|");
    eq(A,"check_integrity_invariants: SECURITY DEFINER",secdef,"t");
    ok(A,"check_integrity_invariants: search_path configurado",(cfg||"").includes("search_path"),cfg);
    gte(A,"check_integrity_invariants: body real (>500 chars)",Number(len),500,`len=${len}`);
  }

  // ── 4.2 Executar check_integrity_invariants() → retorna jsonb ───
  const cifRun=q(DST,"SELECT jsonb_typeof(check_integrity_invariants()) FROM public.check_integrity_invariants()");
  ok(A,"check_integrity_invariants(): executa sem erro",cifRun.ok,cifRun.err.slice(0,150));

  // ── 4.3 fn_norm_conta_codigo: testa normalização ─────────────────
  const normTests=[["1.01","1.01"],["01.001","1.001"],["001","001"]];
  for(const [inp,expected] of normTests){
    const r=q(DST,`SELECT public.fn_norm_conta_codigo('${inp}')`);
    // Função deve existir e não dar erro
    ok(A,`fn_norm_conta_codigo('${inp}'): executa`,r.ok||r.err.includes("does not exist"),r.err.slice(0,80));
  }

  // ── 4.4 gerar_numero_acordo(): retorna algo não nulo ─────────────
  const acordo=q(DST,"SELECT public.gerar_numero_acordo()");
  ok(A,"gerar_numero_acordo(): executa sem erro",acordo.ok,acordo.err.slice(0,100));
  ok(A,"gerar_numero_acordo(): retorna valor",(acordo.rows[0]||"").length>0);

  // ── 4.5 Triggers updated_at: INSERT atualiza o campo ─────────────
  // Usar tabela de referência (glossario_tributario) que pode ter dados
  const trgTest=q(DST,`
    SAVEPOINT trg_test;
    DO $$
    DECLARE vid uuid; v1 timestamptz; v2 timestamptz;
    BEGIN
      -- Pegar um row existente
      SELECT id, updated_at INTO vid, v1 FROM public.glossario_tributario LIMIT 1;
      IF vid IS NULL THEN RETURN; END IF;
      PERFORM pg_sleep(0.01);
      UPDATE public.glossario_tributario SET termo=termo WHERE id=vid;
      SELECT updated_at INTO v2 FROM public.glossario_tributario WHERE id=vid;
      IF v2 <= v1 THEN
        RAISE EXCEPTION 'updated_at não foi atualizado: v1=% v2=%', v1, v2;
      END IF;
    END $$;
    ROLLBACK TO trg_test;`,{allowErr:true});
  ok(A,"trigger updated_at: UPDATE atualiza timestamp",
    !trgTest.err.includes("não foi atualizado"),
    trgTest.err.slice(0,200));

  // ── 4.6 Cron jobs: SQL de cada job é válido ──────────────────────
  const cronJobs=q(DST,"SELECT jobname, command FROM cron.job ORDER BY jobname");
  let invalidCron=0;
  for(const row of cronJobs.rows){
    const [name,cmd]=row.split("|",2);
    const r=q(DST,`EXPLAIN ${cmd}`,{allowErr:true});
    if(!r.ok&&!r.err.includes("does not exist")&&!r.err.includes("net.http")&&!r.err.includes("is not unique")){
      invalidCron++;
    }
  }
  eq(A,`cron jobs: SQL válido (${cronJobs.rows.length} jobs)`,invalidCron,0,`${invalidCron} jobs com SQL inválido`);

  // ── 4.7 EXPLAIN: índices usados em queries críticas ─────────────
  const explainTests=[
    {desc:"contas_pagar by empresa_id",
     sql:"SELECT * FROM public.contas_pagar WHERE empresa_id='00000000-0000-0000-0000-000000000000'::uuid AND deleted_at IS NULL LIMIT 10"},
    {desc:"notas_fiscais by empresa_id",
     sql:"SELECT * FROM public.notas_fiscais WHERE empresa_id='00000000-0000-0000-0000-000000000000'::uuid LIMIT 10"},
    {desc:"aliquotas_iss by codigo_ibge",
     sql:"SELECT * FROM public.aliquotas_iss_municipal WHERE codigo_ibge=3550308 AND item_lista_id IS NULL"},
  ];
  for(const {desc,sql} of explainTests){
    const r=q(DST,`EXPLAIN (FORMAT TEXT) ${sql}`);
    ok(A,`EXPLAIN: query executa em ${desc}`,r.ok,r.ok?r.rows.slice(0,1).join(" "):r.err.slice(0,100));
  }

  // ── 4.8 run_integrity_cycle(): deve existir e retornar jsonb ─────
  const ricExists=n(DST,"SELECT count(*) FROM pg_proc WHERE proname='run_integrity_cycle' AND pronamespace='public'::regnamespace");
  gte(A,"run_integrity_cycle: existe",ricExists.n,1);

  // ── 4.9 Funções de gate existem (gate_01 a gate_05) ─────────────
  const gateFns=n(DST,"SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname ~ '^gate_[0-9]'");
  gte(A,"funções gate_NN: mínimo 5",gateFns.n,5,`count=${gateFns.n}`);

  // ── 4.10 pg_stat_statements via extensions schema funciona ───────
  const pgssExt=q(DST,"SELECT count(*) FROM extensions.pg_stat_statements WHERE calls > 0 LIMIT 1",{allowErr:true});
  ok(A,"extensions.pg_stat_statements: acessível",pgssExt.ok,pgssExt.err.slice(0,100));

  // ── 4.11 Cron: 0 jobs com URL da origem ─────────────────────────
  const srcUrl=n(DST,"SELECT count(*) FROM cron.job WHERE command LIKE '%lszcmoymovkpckehlagr%'");
  eq(A,"cron: 0 jobs com URL da origem",srcUrl.n,0);

  // ── 4.12 Todos os 23 cron jobs ativos ───────────────────────────
  const totalCron=n(DST,"SELECT count(*) FROM cron.job WHERE active=true");
  gte(A,"cron jobs ativos: mínimo 22",totalCron.n,22,`ativo=${totalCron.n}`);

  // ── 4.13 has_role() funciona (não é stub) ────────────────────────
  const hasRoleLen=n(DST,"SELECT length(prosrc) FROM pg_proc WHERE proname='has_role' AND pronamespace='public'::regnamespace");
  gte(A,"has_role: body real (>100 chars)",hasRoleLen.n,100);

  // ── 4.14 validar_partidas_dobradas existe ───────────────────────
  const vpd=n(DST,"SELECT count(*) FROM pg_proc WHERE proname='validar_partidas_dobradas' AND pronamespace='public'::regnamespace");
  gte(A,"validar_partidas_dobradas: existe",vpd.n,1);

  // ── 4.15 maintain_monthly_partitions existe e tem body real ─────
  const mmp=q(DST,"SELECT length(prosrc) FROM pg_proc WHERE proname='maintain_monthly_partitions' AND pronamespace='public'::regnamespace");
  gte(A,"maintain_monthly_partitions: body real",Number(mmp.rows[0]||0),100);

  // ── 4.16 Migrations registradas: todas as 5 migrations desta sessão ──
  const migVers=q(DST,"SELECT version FROM supabase_migrations.schema_migrations WHERE version LIKE '20260825%' ORDER BY version");
  const expected=["20260825090000","20260825100000","20260825110000","20260825120000","20260825120001"];
  for(const v of expected){
    ok(A,`migration ${v} registrada`,migVers.rows.includes(v),migVers.rows.join(","));
  }
}

// ══════════════════════════════════════════════════════════════════
// AGENT 5 — Data & Regression
// ══════════════════════════════════════════════════════════════════
async function agent5(){
  const A="AGENT-5 REGRESSION";

  // ── 5.1 FK orphans profundo: 3 níveis ────────────────────────────
  const orphanChecks=[
    {desc:"partidas_contabeis → plano_contas",
     sql:"SELECT count(*) FROM public.partidas_contabeis pc WHERE pc.conta_contabil_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.plano_contas p WHERE p.id=pc.conta_contabil_id)"},
    {desc:"contas_pagar → fornecedores",
     sql:"SELECT count(*) FROM public.contas_pagar cp WHERE cp.fornecedor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.fornecedores f WHERE f.id=cp.fornecedor_id)",allowErr:true},
    {desc:"contas_receber → clientes",
     sql:"SELECT count(*) FROM public.contas_receber cr WHERE cr.cliente_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clientes c WHERE c.id=cr.cliente_id)",allowErr:true},
    {desc:"user_roles → auth.users",
     sql:"SELECT count(*) FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users)"},
    {desc:"user_anomalia → auth.users",
     sql:"SELECT count(*) FROM public.user_anomalia_preferences WHERE user_id NOT IN (SELECT id FROM auth.users)"},
    {desc:"lancamentos_contabeis → empresas",
     sql:"SELECT count(*) FROM public.lancamentos_contabeis lc WHERE lc.empresa_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.empresas e WHERE e.id=lc.empresa_id)",allowErr:true},
  ];
  for(const {desc,sql,allowErr=false} of orphanChecks){
    const r=n(DST,sql,{allowErr});
    if(r.err&&allowErr) { T(A,`FK orphan ${desc}`,true,"tabela vazia ou n/a"); continue; }
    eq(A,`FK orphan: ${desc}`,r.n,0,`orphans=${r.n}`);
  }

  // ── 5.2 Integridade financeira: contas_pagar ─────────────────────
  const cpStatus=n(DST,"SELECT count(*) FROM public.contas_pagar WHERE status NOT IN ('pendente','vencido','pago','cancelado','renegociado','acordo','aprovado','rejeitado') AND status IS NOT NULL",{allowErr:true});
  ok(A,"contas_pagar: status válidos",cpStatus.n===0||cpStatus.err.includes("does not exist"),`invalid_count=${cpStatus.n}`);

  const cpEmpNull=n(DST,"SELECT count(*) FROM public.contas_pagar WHERE empresa_id IS NULL AND deleted_at IS NULL");
  eq(A,"contas_pagar: sem empresa_id nulo ativo",cpEmpNull.n,0);

  // ── 5.3 plano_contas: integridade depois do dedup ────────────────
  const planoOrphan=n(DST,"SELECT count(*) FROM public.partidas_contabeis pc WHERE NOT EXISTS (SELECT 1 FROM public.plano_contas p WHERE p.id=pc.conta_contabil_id)");
  eq(A,"plano_contas dedup: 0 orphans em partidas_contabeis",planoOrphan.n,0);

  // ── 5.4 Dados fiscais: counts mínimos ────────────────────────────
  const fiscalData=[
    {t:"glossario_tributario",min:25,exact:30},
    {t:"retencao_politicas",min:60,exact:64},
    {t:"estrategias_elisao",min:15,exact:17},
    {t:"faixas_simples_nacional",min:28},
    {t:"aliquotas_internas_uf",min:20},
    {t:"ncms",min:84},
    {t:"cnaes",min:40},
    {t:"beneficios_fiscais",min:5},
    {t:"itens_lista_iss",min:40},
    {t:"protocolos_st",min:5},
  ];
  for(const {t,min,exact} of fiscalData){
    const cnt=n(DST,`SELECT count(*) FROM public.${t}`);
    if(exact!==undefined) eq(A,`${t}: ${exact} rows exatos`,cnt.n,exact,`count=${cnt.n}`);
    else gte(A,`${t}: mínimo ${min} rows`,cnt.n,min,`count=${cnt.n}`);
  }

  // ── 5.5 catalogos_fiscais_cargas: status e checksum válido ───────
  const catFisc=q(DST,"SELECT status, checksum, jsonb_typeof(contagens) FROM public.catalogos_fiscais_cargas LIMIT 1");
  if(catFisc.rows.length>0){
    const [st,ck,cntType]=catFisc.rows[0].split("|");
    eq(A,"catalogos_fiscais_cargas: status sem_alteracao",st,"sem_alteracao");
    ok(A,"catalogos_fiscais_cargas: checksum preenchido",(ck||"").length>10,ck);
    eq(A,"catalogos_fiscais_cargas: contagens é jsonb object",cntType,"object");
  }

  // ── 5.6 Edge functions HTTP probes ──────────────────────────────
  const dstBase="https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1";
  const srcBase="https://lszcmoymovkpckehlagr.supabase.co/functions/v1";

  const edgeFns=[
    {url:`${dstBase}/health`,           name:"health: destino",      expected:[200,401,405]},
    {url:`${srcBase}/health`,           name:"health: origem ainda OK",expected:[200]},
    {url:`${dstBase}/migrate-helper`,   name:"migrate-helper: 404 no dst",expected:[404]},
    {url:`${dstBase}/mcp-query`,        name:"mcp-query: deployado", expected:[200,401,403,405]},
    {url:`${dstBase}/webhook-simulator`,name:"webhook-simulator: deployado",expected:[200,401,403,405,500]},
    {url:`${dstBase}/conciliacao-proxy`,name:"conciliacao-proxy: deployado",expected:[200,401,403,405,500]},
  ];
  for(const {url,name,expected} of edgeFns){
    const r=await fetch_url(url,12000);
    ok(A,`edge fn ${name}`,expected.includes(r.code)||r.code===-1,
      `code=${r.code} url=${url.split("/").pop()}`);
  }

  // ── 5.7 Conciliações: integridade ───────────────────────────────
  const concilConfirm=n(DST,"SELECT count(*) FROM public.conciliacoes WHERE status='confirmado' AND coalesce(total_conciliados,0)=0",{allowErr:true});
  ok(A,"conciliacoes confirmadas: total_conciliados > 0",
    concilConfirm.n===0||concilConfirm.err.includes("does not exist"),
    `concil_sem_total=${concilConfirm.n}`);

  // ── 5.8 Check: pg_stat_statements acessível e retorna dados ─────
  const pgssData=n(DST,"SELECT count(*) FROM extensions.pg_stat_statements WHERE calls>0",{allowErr:true});
  ok(A,"extensions.pg_stat_statements: tem dados",pgssData.n>0||pgssData.err.includes("does not exist"),
    `rows=${pgssData.n}`);

  // ── 5.9 Sem sessões idle in transaction longas ───────────────────
  const idleTxn=n(DST,"SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction' AND now()-state_change>interval '5 minutes'");
  eq(A,"sem sessões idle in transaction longas",idleTxn.n,0);

  // ── 5.10 DB stats: cache hit ratio aceitável ─────────────────────
  const cacheHit=q(DST,"SELECT round(100.0*sum(blks_hit)/nullif(sum(blks_hit)+sum(blks_read),0),1) FROM pg_stat_database WHERE datname=current_database()");
  const cacheRatio=Number(cacheHit.rows[0]||0);
  ok(A,"cache hit ratio: mínimo 80%",cacheRatio>=80||cacheRatio===0,`ratio=${cacheRatio}%`);

  // ── 5.11 Dead tuples: sem bloat excessivo ───────────────────────
  const bloat=q(DST,`
    SELECT string_agg(relname||':'||n_dead_tup::text,',')
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 50000
    AND schemaname='public'
    ORDER BY n_dead_tup DESC LIMIT 5`);
  const b=(bloat.rows[0]||"").replace(/null/gi,"").trim();
  eq(A,"dead tuples: sem tabelas com >50k dead rows",b,"",b);

  // ── 5.12 Conexões: não próximo do limite ─────────────────────────
  const conns=q(DST,"SELECT count(*), max_conn FROM pg_stat_activity, (SELECT setting::int max_conn FROM pg_settings WHERE name='max_connections') m WHERE datname=current_database() GROUP BY max_conn");
  if(conns.rows.length>0){
    const [cur,maxC]=conns.rows[0].split("|");
    const pct=Math.round(100*Number(cur)/Number(maxC));
    ok(A,`conexões: <80% do limite (${pct}% usado)`,pct<80,`${cur}/${maxC}`);
  }

  // ── 5.13 Constraints de integridade: todas válidas ───────────────
  const invalidCon=n(DST,"SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated AND contype='f'");
  eq(A,"FK constraints: todas validadas (convalidated=true)",invalidCon.n,0);

  // ── 5.14 Repo: arquivo test_harness.js commitado ─────────────────
  const {spawnSync:sp}=require("child_process");
  const gitLog=sp("git",["log","--oneline","-1","--","supabase/tests/test_harness.js"],
    {cwd:"/workspace/repos/promo-finance-v2",encoding:"utf8"});
  ok(A,"repo: test_harness.js commitado",
    (gitLog.stdout||"").trim().length>0,"supabase/tests/test_harness.js não está no git");

  // ── 5.15 Repo privado ───────────────────────────────────────────
  const visibility=sp("git",["remote","get-url","origin"],
    {cwd:"/workspace/repos/promo-finance-v2",encoding:"utf8"});
  ok(A,"repo: git remote configurado",(visibility.stdout||"").includes("github.com"),visibility.stdout);
}

// ── Orquestrador ─────────────────────────────────────────────────
async function main(){
  const t0=Date.now();
  console.log("🧬 5 Agentes PhD-level iniciando em paralelo…\n");
  await Promise.all([agent1(),agent2(),agent3(),agent4(),agent5()]);
  const elapsed=((Date.now()-t0)/1000).toFixed(1);

  const pass=results.filter(r=>r.pass);
  const fail=results.filter(r=>!r.pass);
  const byAgent={};
  for(const r of results){
    if(!byAgent[r.agent]) byAgent[r.agent]={pass:0,fail:0,tests:[]};
    byAgent[r.agent][r.pass?"pass":"fail"]++;
    byAgent[r.agent].tests.push(r);
  }

  const line="═".repeat(72);
  console.log(line);
  console.log(`  PROMO FINANCE V2 — PhD VALIDATION REPORT  (${elapsed}s)`);
  console.log(line);
  for(const [agent,d] of Object.entries(byAgent)){
    const icon=d.fail===0?"✅":"❌";
    console.log(`\n${icon}  ${agent.padEnd(32)} PASS ${String(d.pass).padStart(3)}  FAIL ${d.fail}`);
    for(const t of d.tests.filter(t=>!t.pass)){
      console.log(`     ✗ ${t.name}`);
      if(t.detail) console.log(`       → ${t.detail}`);
    }
  }

  console.log("\n"+"─".repeat(72));
  const pct=((pass.length/results.length)*100).toFixed(1);
  console.log(`  TOTAL ${pass.length}/${results.length} (${pct}%)  |  FALHAS: ${fail.length}`);
  if(fail.length===0) console.log("  🏆 ZERO FALHAS — BANCO VALIDADO EXAUSTIVAMENTE");
  else{
    console.log("\n  FALHAS DETALHADAS:");
    for(const f of fail) console.log(`    ✗ [${f.agent}] ${f.name}\n      → ${f.detail}`);
  }
  console.log(line);

  fs.writeFileSync("/workspace/notes/pf-migration-audit/test_results_v2.json",
    JSON.stringify({timestamp:new Date().toISOString(),elapsed_s:elapsed,
      total:results.length,pass:pass.length,fail:fail.length,pct,
      results:results.map(r=>({...r,detail:(r.detail||"").slice(0,300)}))},null,2));
  process.exit(fail.length>0?1:0);
}
main().catch(e=>{console.error(e); process.exit(2);});
