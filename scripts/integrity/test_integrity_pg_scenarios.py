#!/usr/bin/env python3
"""
Cenários de scripts/integrity: run.sh (orquestrador), cada NN_*.sql contra o
schema mínimo que consulta (cenário são × violação), 04_endpoints.sh com curl
falso e dump-baseline.sh de verdade.

Banco: Postgres local descartável (scripts/data/pg_efemero.py). Rede: nenhuma —
`curl` é um stub no PATH. Onde o .sql apenas embrulha uma função canônica de
migration (gates #29–#35), a função é substituída por um dublê: o que se prova
é o embrulho (pass/fail/contagem/detalhe), não a regra da função.
"""
import datetime
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DIR = REPO_ROOT / "scripts" / "integrity"
sys.path.insert(0, str(REPO_ROOT / "scripts" / "data"))
from pg_efemero import PgEfemero

PASSOS = ["schema", "rls", "grants", "endpoints", "crons", "secdef", "exec_grants",
          "rpc_tenant_scope", "views", "tenant_indexes", "pii_mask", "index_bloat",
          "unused_indexes", "retencao", "views_pii_rpcs"]

STUB_CURL = r'''#!/usr/bin/env python3
import json, os, sys
argv = sys.argv[1:]
cfg = json.load(open(os.environ["STUB_CURL_CFG"]))
with open(cfg["log"], "a") as f:
    f.write(json.dumps(argv) + "\n")
juntos = " ".join(argv)
code = cfg.get("default", "200")
for regra in cfg.get("regras", []):
    if all(t in juntos for t in regra["contem"]):
        code = regra["code"]
        break
if code == "000":
    sys.stdout.write("000")
    sys.exit(7)
sys.stdout.write(code)
'''

BASE = """
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
DROP SCHEMA IF EXISTS auth CASCADE; CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
DROP SCHEMA IF EXISTS cron CASCADE; CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, jobname text, schedule text, active boolean DEFAULT true);
CREATE TABLE cron.job_run_details (runid bigserial PRIMARY KEY, jobid bigint, status text,
  return_message text, start_time timestamptz, end_time timestamptz);
CREATE TABLE public.contas (id uuid PRIMARY KEY, empresa_id uuid, dono uuid);
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY contas_dono ON public.contas FOR ALL TO authenticated USING (dono = auth.uid());
GRANT SELECT ON public.contas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas TO service_role;
CREATE VIEW public.v_contas WITH (security_invoker = on) AS SELECT id FROM public.contas;
"""

VARS = {
    "baseline_counts": '{"tables":1,"views":1,"indexes":1,"functions":0,"policies":1}',
    "allow_public": "[]",
    "expected_policies": "{}",
    "expected_crons": "[]",
    "allowed_secdef": '{"anon":[],"authenticated":[]}',
}


def _escreve_stub_curl(pasta, regras=None, default="200"):
    pasta = Path(pasta)
    pasta.mkdir(parents=True, exist_ok=True)
    stub = pasta / "curl"
    stub.write_text(STUB_CURL)
    stub.chmod(0o755)
    cfg = pasta / "curl.json"
    log = pasta / "curl.log"
    log.write_text("")
    cfg.write_text(json.dumps({"log": str(log), "regras": regras or [], "default": default}))
    return cfg, log


class _ComPostgres(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pg = PgEfemero()
        try:
            for papel in ("service_role", "anon", "authenticated"):
                cls.pg.psql("postgres", f"CREATE ROLE {papel}")
            cls.pg.psql("postgres", "CREATE ROLE auditor LOGIN")
            cls.pg.criar_db("stg")
        except Exception:
            cls.pg.parar()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.pg.parar()

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="integrity-cenarios-")
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.pg.psql("stg", BASE)

    def sql(self, texto):
        return self.pg.psql("stg", texto)

    def gate(self, arquivo, url=None, **vars_extra):
        """Roda um NN_*.sql como o run.sh roda e devolve {assertion: (status, expected, actual, detail)}."""
        variaveis = dict(VARS, **vars_extra)
        cmd = ["psql", url or self.pg.url("stg"), "-X", "-v", "ON_ERROR_STOP=1", "-q", "-A", "-t", "-F", "\t"]
        for k, v in variaveis.items():
            cmd += ["-v", f"{k}={v}"]
        cmd += ["-f", str(DIR / arquivo)]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, f"{arquivo}: {r.stderr}")
        saida = {}
        for linha in r.stdout.splitlines():
            campos = linha.split("\t")
            if len(campos) >= 4:
                saida[campos[0]] = (campos[1], campos[2], campos[3], campos[4] if len(campos) > 4 else "")
        return saida


class TestGatesSql(_ComPostgres):
    # ---- 01_schema ---------------------------------------------------------
    def test_01_contagens_batem_com_o_baseline(self):
        g = self.gate("01_schema.sql")
        for a in ("tables", "views", "indexes", "functions", "policies"):
            self.assertEqual(g[f"schema.{a}_count"][0], "pass", g)

    def test_01_acusa_divergencia_e_baseline_vazio(self):
        g = self.gate("01_schema.sql", baseline_counts='{"tables":2,"views":0,"indexes":9,"functions":3,"policies":4}')
        for a in ("tables", "views", "indexes", "functions", "policies"):
            self.assertEqual(g[f"schema.{a}_count"][0], "fail", g)
        g = self.gate("01_schema.sql", baseline_counts="{}")
        self.assertEqual(g["schema.tables_count"][:2], ("fail", "?"))

    def test_01_extensoes_lista_exatamente_as_ausentes(self):
        self.sql("CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE EXTENSION IF NOT EXISTS pg_trgm;"
                 "CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
        g = self.gate("01_schema.sql")
        status, _, ausentes, _ = g["schema.extensions"]
        # pg_cron, pg_net e vector não existem neste Postgres local: o ramo
        # "pass" desta assertion só é verificável no Supabase real.
        self.assertEqual(status, "fail")
        self.assertEqual(set(ausentes.split(",")), {"pg_cron", "pg_net", "vector"})

    def test_01_particoes_mensais(self):
        hoje = datetime.datetime.now(datetime.timezone.utc).date().replace(day=1)
        nomes = []
        for i in range(4):
            ano, mes = hoje.year + (hoje.month - 1 + i) // 12, (hoje.month - 1 + i) % 12 + 1
            for t in ("audit_logs", "frontend_error_logs"):
                nomes.append(f"{t}_{ano:04d}_{mes:02d}")
        self.sql(";".join(f"CREATE TABLE public.{n} (id int)" for n in nomes))
        self.assertEqual(self.gate("01_schema.sql")["schema.monthly_partitions"][0], "pass")
        self.sql(f"DROP TABLE public.{nomes[-1]}")
        status, _, falta, _ = self.gate("01_schema.sql")["schema.monthly_partitions"]
        self.assertEqual((status, falta), ("fail", nomes[-1]))

    # ---- 02_rls ------------------------------------------------------------
    def test_02_cenario_sao_passa(self):
        g = self.gate("02_rls.sql")
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.assertEqual(len(g), 4)

    def test_02_tabela_sem_rls_e_sem_policy_de_usuario(self):
        self.sql("CREATE TABLE public.aberta (id int)")
        g = self.gate("02_rls.sql")
        self.assertEqual(g["rls.all_tables_have_rls"][::2], ("fail", "aberta"))
        self.assertEqual(g["rls.user_scoped_reference_auth"][::2], ("fail", "aberta"))

    def test_02_policy_true_falha_fora_da_whitelist(self):
        self.sql("CREATE TABLE public.catalogo (id int); ALTER TABLE public.catalogo ENABLE ROW LEVEL SECURITY;"
                 "CREATE POLICY tudo ON public.catalogo FOR SELECT TO authenticated USING (true)")
        g = self.gate("02_rls.sql")
        self.assertEqual(g["rls.no_overpermissive_true"][::2], ("fail", "catalogo:tudo"))
        g = self.gate("02_rls.sql", allow_public='["catalogo"]')
        self.assertEqual(g["rls.no_overpermissive_true"][0], "pass")
        self.assertEqual(g["rls.user_scoped_reference_auth"][0], "pass")

    def test_02_security_invoker_on_e_true_passam_ausente_falha(self):
        self.sql("CREATE VIEW public.v_true WITH (security_invoker = true) AS SELECT 1 AS x;"
                 "CREATE VIEW public.v_on WITH (security_invoker = on) AS SELECT 1 AS x")
        self.assertEqual(self.gate("02_rls.sql")["rls.views_security_invoker"][0], "pass")
        self.sql("CREATE VIEW public.v_dono AS SELECT 1 AS x;"
                 "CREATE VIEW public.v_off WITH (security_invoker = false) AS SELECT 1 AS x")
        status, _, lista, _ = self.gate("02_rls.sql")["rls.views_security_invoker"]
        self.assertEqual(status, "fail")
        self.assertEqual(set(lista.split(",")), {"v_dono", "v_off"})

    # ---- 03_grants ---------------------------------------------------------
    def test_03_cenario_sao_passa(self):
        g = self.gate("03_grants.sql")
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.assertEqual(len(g), 3)

    def test_03_anon_fora_da_whitelist_ou_com_escrita(self):
        self.sql("GRANT SELECT ON public.contas TO anon")
        self.assertEqual(self.gate("03_grants.sql")["grants.anon_scope"][::2], ("fail", "contas:SELECT"))
        self.assertEqual(self.gate("03_grants.sql", allow_public='["contas"]')["grants.anon_scope"][0], "pass")
        self.sql("GRANT INSERT ON public.contas TO anon")
        self.assertEqual(self.gate("03_grants.sql", allow_public='["contas"]')["grants.anon_scope"][::2],
                         ("fail", "contas:INSERT"))

    def test_03_service_role_incompleto_e_authenticated_sem_select(self):
        self.sql("REVOKE DELETE ON public.contas FROM service_role; REVOKE SELECT ON public.contas FROM authenticated")
        g = self.gate("03_grants.sql")
        self.assertEqual(g["grants.service_role_full"][::2], ("fail", "contas"))
        self.assertEqual(g["grants.authenticated_matches_policies"][::2], ("fail", "contas"))

    # ---- 05_crons ----------------------------------------------------------
    ESPERADO = '[{"jobname":"regua","schedule":"0 12 * * *"}]'

    def test_05_cenario_sao_passa(self):
        self.sql("INSERT INTO cron.job(jobname, schedule) VALUES ('regua','0 12 * * *');"
                 "INSERT INTO cron.job_run_details(jobid, status, start_time, end_time) VALUES (1,'succeeded',now(),now())")
        g = self.gate("05_crons.sql", expected_crons=self.ESPERADO)
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.assertEqual(len(g), 4)

    def test_05_job_ausente_inativo_ou_com_schedule_diferente(self):
        g = self.gate("05_crons.sql", expected_crons=self.ESPERADO)
        self.assertEqual(g["crons.active_count"][0], "fail")
        self.assertEqual(g["crons.all_expected_present"][::2], ("fail", "regua"))
        self.assertEqual(g["crons.recent_activity"][0], "unverified")
        self.sql("INSERT INTO cron.job(jobname, schedule, active) VALUES ('regua','0 12 * * *', false)")
        self.assertEqual(self.gate("05_crons.sql", expected_crons=self.ESPERADO)["crons.all_expected_present"][0], "fail")
        self.sql("UPDATE cron.job SET active = true, schedule = '*/5 * * * *'")
        g = self.gate("05_crons.sql", expected_crons=self.ESPERADO)
        self.assertEqual(g["crons.all_expected_present"][0], "pass")
        self.assertEqual(g["crons.schedules_match"][::2], ("fail", "regua:0 12 * * *!=*/5 * * * *"))

    # ---- 06_secdef ---------------------------------------------------------
    def test_06_search_path_fixo_seguro_e_inseguro(self):
        self.assertEqual(self.gate("06_secdef.sql")["secdef.total_functions"][0], "unverified")
        self.sql("CREATE FUNCTION public.f_ok() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public AS 'SELECT 1'")
        g = self.gate("06_secdef.sql")
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.sql("CREATE FUNCTION public.f_solta(a int) RETURNS int LANGUAGE sql SECURITY DEFINER AS 'SELECT 1'")
        g = self.gate("06_secdef.sql")
        self.assertEqual(g["secdef.search_path_fixo"][0], "fail")
        self.assertIn("f_solta(a integer)", g["secdef.search_path_fixo"][3])
        self.sql("CREATE FUNCTION public.f_user() RETURNS int LANGUAGE sql SECURITY DEFINER "
                 "SET search_path = \"$user\", public AS 'SELECT 1'")
        g = self.gate("06_secdef.sql")
        self.assertEqual(g["secdef.search_path_seguro"][0], "fail")
        self.assertIn("f_user", g["secdef.search_path_seguro"][3])

    # ---- 07_exec_grants ----------------------------------------------------
    def test_07_allowlist_guard_e_triggers(self):
        permitido = '{"anon":[],"authenticated":["f_ok"]}'
        self.sql("CREATE FUNCTION public.f_ok() RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public "
                 "AS 'SELECT auth.uid()'; REVOKE ALL ON FUNCTION public.f_ok() FROM PUBLIC;"
                 "GRANT EXECUTE ON FUNCTION public.f_ok() TO authenticated")
        g = self.gate("07_exec_grants.sql", allowed_secdef=permitido)
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.assertEqual(len(g), 4)
        # Fora da allowlist + sem verificação interna + EXECUTE de PUBLIC (default do Postgres).
        self.sql("CREATE FUNCTION public.f_vaza() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = public "
                 "AS 'SELECT 1'")
        g = self.gate("07_exec_grants.sql", allowed_secdef=permitido)
        self.assertEqual(g["secdef.anon_exec_allowlist"][0], "fail")
        self.assertIn("f_vaza", g["secdef.anon_exec_allowlist"][3])
        self.assertEqual(g["secdef.auth_exec_allowlist"][0], "fail")
        self.assertEqual(g["secdef.guard_interno"][0], "fail")
        self.assertIn("f_vaza", g["secdef.guard_interno"][3])
        self.sql("DROP FUNCTION public.f_vaza(); CREATE FUNCTION public.f_trg() RETURNS trigger LANGUAGE plpgsql "
                 "SECURITY DEFINER SET search_path = public AS 'BEGIN RETURN NEW; END'")
        g = self.gate("07_exec_grants.sql", allowed_secdef='{"anon":["f_trg"],"authenticated":["f_ok","f_trg"]}')
        self.assertEqual(g["secdef.triggers_sem_exec"][0], "fail")
        self.assertIn("f_trg", g["secdef.triggers_sem_exec"][3])

    def test_07_sem_a_variavel_allowed_secdef_o_sql_aborta(self):
        # Documenta a dependência: é o run.sh que precisa passar a variável.
        r = subprocess.run(["psql", self.pg.url("stg"), "-X", "-q", "-v", "ON_ERROR_STOP=1",
                            "-f", str(DIR / "07_exec_grants.sql")], capture_output=True, text=True)
        self.assertNotEqual(r.returncode, 0)

    # ---- 08..13: embrulhos das funções canônicas ---------------------------
    DUBLES = (
        ("08_rpc_tenant_scope.sql", "rpc.tenant_scope", "gate_29_rpc_sem_escopo_empresa()",
         "funcao text, tabelas text", "'fn_x', 'contas'"),
        ("09_views.sql", "views.secure", "gate_30_views_inseguras()",
         "objeto text, tipo text, motivo text", "'v_x', 'view', 'sem invoker'"),
        ("10_tenant_indexes.sql", "tenant.indexes", "gate_31_tenant_sem_indice()", "tabela text", "'contas'"),
        ("11_pii_mask.sql", "pii.mask", "gate_32_pii_sem_mascara()", "objeto text", "'v_x'"),
        ("12_index_bloat.sql", "perf.index_redundante", "gate_33_indices_redundantes()",
         "tabela text, indice_redundante text", "'contas', 'idx_dup'"),
        ("13_unused_indexes.sql", "perf.index_ocioso", "gate_34_indices_nao_utilizados(dias int)",
         "tabela text, indice text, tamanho_kb bigint", "'contas', 'idx_x', 64::bigint"),
    )

    def test_08_a_13_embrulho_passa_sem_violacao_e_falha_com_violacao(self):
        for arquivo, assertion, assinatura, retorno, linha in self.DUBLES:
            nome = assinatura.split("(")[0]
            self.sql(f"CREATE OR REPLACE FUNCTION public.{assinatura} RETURNS TABLE({retorno}) "
                     f"LANGUAGE sql AS $f$ SELECT {linha} WHERE false $f$")
            g = self.gate(arquivo)
            self.assertEqual(g[assertion][:3], ("pass", "0", "0"), arquivo)
            self.sql(f"CREATE OR REPLACE FUNCTION public.{assinatura} RETURNS TABLE({retorno}) "
                     f"LANGUAGE sql AS $f$ SELECT {linha} UNION ALL SELECT {linha} $f$")
            g = self.gate(arquivo)
            self.assertEqual(g[assertion][:3], ("fail", "0", "2"), f"{arquivo}: {g}")
            self.assertIn(linha.split("'")[1], g[assertion][3], arquivo)
            self.sql(f"DROP FUNCTION public.{nome}")

    # ---- 14_retencao -------------------------------------------------------
    RETENCAO = """
      CREATE TABLE public.retencao_politicas (tabela text, coluna text, dias int, ativo boolean DEFAULT true, motivo text);
      CREATE TABLE public.cron_job_logs (job_name text, success boolean, executed_at timestamptz);
      CREATE TABLE public.evento_logs (id int, criado_em timestamptz, nota text);
      CREATE FUNCTION public.gate_35_tabelas_sem_retencao() RETURNS TABLE(tabela text) LANGUAGE sql
        AS $f$ SELECT 'public.evento_logs' WHERE NOT EXISTS (SELECT 1 FROM public.retencao_politicas) $f$;
    """

    def test_14_retencao_sao_violacoes_e_job(self):
        self.sql(self.RETENCAO)
        g = self.gate("14_retencao.sql")
        self.assertEqual(g["retencao.toda_tabela_log_tem_politica"][::2], ("fail", "1"))
        self.assertIn("evento_logs", g["retencao.toda_tabela_log_tem_politica"][3])
        self.assertEqual(g["retencao.job_diario_recente"][0], "unverified")
        self.sql("INSERT INTO public.retencao_politicas VALUES ('public.evento_logs','criado_em',30,true,null)")
        g = self.gate("14_retencao.sql")
        self.assertEqual(g["retencao.toda_tabela_log_tem_politica"][0], "pass")
        self.assertEqual(g["retencao.politicas_coerentes"][0], "pass")
        # coluna inexistente e coluna não temporal
        for coluna in ("nao_existe", "nota"):
            self.sql(f"UPDATE public.retencao_politicas SET coluna = '{coluna}'")
            g = self.gate("14_retencao.sql")
            self.assertEqual(g["retencao.politicas_coerentes"][::2], ("fail", "1"), coluna)
        self.sql("INSERT INTO public.cron_job_logs VALUES ('daily-log-retention', false, now()),"
                 "('daily-log-retention', true, now() - interval '3 days'), ('outro-job', true, now())")
        self.assertEqual(self.gate("14_retencao.sql")["retencao.job_diario_recente"][0], "fail")
        self.sql("INSERT INTO public.cron_job_logs VALUES ('daily-log-retention', true, now() - interval '1 hour')")
        self.assertEqual(self.gate("14_retencao.sql")["retencao.job_diario_recente"][0], "pass")

    def test_14_contrato_do_ci_grep_tab_fail_tab(self):
        # Mesma invocação do .github/workflows/ci.yml (Gate #35): só -f, e o
        # passo procura "\tfail\t" na saída.
        self.sql(self.RETENCAO)
        cmd = ["psql", self.pg.url("stg"), "-X", "-v", "ON_ERROR_STOP=1", "-f", str(DIR / "14_retencao.sql")]
        r = subprocess.run(cmd, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("\tfail\t", r.stdout)
        self.sql("INSERT INTO public.retencao_politicas VALUES ('public.evento_logs','criado_em',30,true,null)")
        r = subprocess.run(cmd, capture_output=True, text=True)
        self.assertNotIn("\tfail\t", r.stdout)
        self.assertIn("\tpass\t", r.stdout)

    # ---- 15_views_pii_rpcs -------------------------------------------------
    HARDENING = """
      CREATE FUNCTION public.gerar_numero_acordo() RETURNS text LANGUAGE sql AS $f$ SELECT 'A1' $f$;
      REVOKE ALL ON FUNCTION public.gerar_numero_acordo() FROM PUBLIC;
      CREATE FUNCTION public.resolve_sso_providers_for_domain(d text) RETURNS text LANGUAGE sql AS $f$ SELECT d $f$;
      CREATE FUNCTION public.pode_ver_dado_sensivel() RETURNS boolean LANGUAGE sql AS $f$ SELECT false $f$;
      CREATE FUNCTION public.mascarar_chave_pix(c text) RETURNS text LANGUAGE sql AS $f$ SELECT '***' $f$;
      CREATE TABLE public.recebiveis (id int, chave_pix text);
      CREATE VIEW public.vw_contas_receber_painel WITH (security_invoker = on) AS
        SELECT id, CASE WHEN public.pode_ver_dado_sensivel() THEN chave_pix
                        ELSE public.mascarar_chave_pix(chave_pix) END AS chave_pix FROM public.recebiveis;
    """

    def test_15_cenario_sao_passa(self):
        self.sql(self.HARDENING)
        g = self.gate("15_views_pii_rpcs.sql")
        self.assertEqual({v[0] for v in g.values()}, {"pass"}, g)
        self.assertEqual(len(g), 5)

    def test_15_acusa_cada_violacao(self):
        self.sql(self.HARDENING)
        self.sql("GRANT EXECUTE ON FUNCTION public.gerar_numero_acordo() TO anon;"
                 "REVOKE ALL ON FUNCTION public.resolve_sso_providers_for_domain(text) FROM PUBLIC;"
                 "CREATE VIEW public.vw_dre_mensal AS SELECT 1 AS x;"
                 "CREATE MATERIALIZED VIEW public.mv_performance_alerts_weekly AS SELECT 1 AS x;"
                 "GRANT SELECT ON public.mv_performance_alerts_weekly TO authenticated;"
                 "CREATE VIEW public.vw_transferencias_painel WITH (security_invoker = on) AS "
                 "SELECT id, chave_pix FROM public.recebiveis")
        g = self.gate("15_views_pii_rpcs.sql")
        self.assertEqual({a: v[0] for a, v in g.items()}, {
            "rpc.anon_cannot_execute_gerar_numero_acordo": "fail",
            "rpc.anon_can_execute_resolve_sso": "fail",
            "views.named_security_invoker": "fail",
            "views.matview_not_exposed_to_clients": "fail",
            "pii.named_views_mask_chave_pix": "fail",
        })
        self.assertIn("vw_transferencias_painel sem máscara", g["pii.named_views_mask_chave_pix"][3])
        self.assertIn("vw_dre_mensal", g["views.named_security_invoker"][3])

    def test_15_view_sem_mascara_e_acusada_mesmo_por_quem_nao_e_dono(self):
        # information_schema.views devolve view_definition NULL para não-donos.
        self.sql(self.HARDENING)
        self.sql("CREATE VIEW public.vw_transferencias_painel WITH (security_invoker = on) AS "
                 "SELECT id, chave_pix FROM public.recebiveis; GRANT USAGE ON SCHEMA public TO auditor")
        url = f"postgresql://auditor@127.0.0.1:{self.pg.porta}/stg"
        g = self.gate("15_views_pii_rpcs.sql", url=url)
        self.assertEqual(g["pii.named_views_mask_chave_pix"][::2], ("fail", "1"))


class TestRunSh(_ComPostgres):
    def setUp(self):
        super().setUp()
        self.cfg, self.log = _escreve_stub_curl(Path(self.tmp) / "bin")

    def env(self, **extra):
        env = os.environ.copy()
        env.pop("TEST_ADMIN_JWT", None)
        env.update({"PATH": f"{self.tmp}/bin:" + env["PATH"], "STUB_CURL_CFG": str(self.cfg),
                    "STAGING_DB_URL": self.pg.url("stg"), "STAGING_PROJECT_REF": "stgref",
                    "STAGING_ANON_KEY": "anon-key-de-teste", "TMPDIR": self.tmp})
        env.update(extra)
        return env

    def rodar(self, *args, script=None, **extra):
        return subprocess.run(["bash", str(script or DIR / "run.sh"), *args], capture_output=True,
                              text=True, env=self.env(**extra), timeout=120)

    def suite_propria(self, passos):
        """Copia run.sh para uma pasta com passos sintéticos (mesmo código, outros NN_*)."""
        pasta = Path(self.tmp) / "suite"
        (pasta / "baseline").mkdir(parents=True)
        shutil.copy(DIR / "run.sh", pasta / "run.sh")
        for nome, corpo in passos.items():
            (pasta / nome).write_text(corpo)
        return pasta / "run.sh"

    def test_roda_os_15_passos_e_emite_jsonl_valido(self):
        r = self.rodar("--json-only")
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        self.assertEqual(sorted({l["step"] for l in linhas}), sorted(PASSOS))
        for l in linhas:
            self.assertEqual(set(l), {"step", "assertion", "status", "expected", "actual", "detail"})
            self.assertIn(l["status"], ("pass", "fail", "unverified"), l)
        falhas = sum(1 for l in linhas if l["status"] == "fail")
        self.assertGreater(falhas, 0)
        self.assertEqual(r.returncode, min(falhas, 255))
        # ordem lexicográfica dos arquivos: 04_endpoints entra entre grants e crons
        ordem = list(dict.fromkeys(l["step"] for l in linhas))
        self.assertEqual(ordem, PASSOS)

    def test_passo_07_recebe_a_allowlist_do_baseline(self):
        r = self.rodar("--json-only")
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        do_07 = {l["assertion"]: l["status"] for l in linhas if l["step"] == "exec_grants"}
        self.assertEqual(set(do_07), {"secdef.anon_exec_allowlist", "secdef.auth_exec_allowlist",
                                      "secdef.guard_interno", "secdef.triggers_sem_exec"}, do_07)

    def test_passo_que_nao_roda_vira_fail_e_os_demais_seguem(self):
        r = self.rodar("--json-only")
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        quebrado = [l for l in linhas if l["assertion"] == "rpc_tenant_scope.execucao"]
        self.assertEqual(len(quebrado), 1)
        self.assertEqual(quebrado[0]["status"], "fail")
        self.assertIn("gate_29_rpc_sem_escopo_empresa", quebrado[0]["detail"])
        self.assertTrue(any(l["step"] == "views_pii_rpcs" for l in linhas))

    def test_modo_humano_tem_tabela_e_totais(self):
        r = self.rodar()
        self.assertIn("STEP", r.stdout.splitlines()[0])
        self.assertRegex(r.stdout, r"total=\d+ fails=\d+ unverified=\d+")
        self.assertNotIn("anon-key-de-teste", r.stdout + r.stderr)

    def test_exit_code_tem_teto_255(self):
        run = self.suite_propria({"01_muitas.sql": "\\pset format unaligned\n\\pset tuples_only on\n"
                                 "SELECT 'a.' || g, 'fail', '0', '1', '' FROM generate_series(1, 256) g;\n"})
        r = self.rodar("--json-only", script=run)
        self.assertEqual(len(r.stdout.splitlines()), 256)
        self.assertEqual(r.returncode, 255)  # antes: 256 % 256 = 0 → "sucesso"

    def test_tudo_pass_sai_com_0(self):
        run = self.suite_propria({"01_ok.sql": "\\pset format unaligned\n\\pset tuples_only on\n"
                                 "SELECT 'ok.um', 'pass', '1', '1', '';\nSELECT 'ok.dois', 'unverified', '1', '-', 'x';\n"})
        r = self.rodar("--json-only", script=run)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual([json.loads(l)["assertion"] for l in r.stdout.splitlines()], ["ok.um", "ok.dois"])

    def test_detail_com_aspas_barra_e_unicode_continua_json_valido(self):
        detalhe = 'tem "aspas", \\barra\\ e acentuação çã — 🚀'
        run = self.suite_propria({"01_txt.sql": "\\pset format unaligned\n\\pset tuples_only on\n"
                                 f"SELECT 'txt.detalhe', 'fail', '0', '1', $d${detalhe}$d$;\n"})
        r = self.rodar("--json-only", script=run)
        self.assertEqual(json.loads(r.stdout)["detail"], detalhe)

    def test_notice_e_mensagens_do_psql_nao_viram_assertion(self):
        run = self.suite_propria({"01_notice.sql": "\\pset format unaligned\n\\pset tuples_only on\n\\pset fieldsep '\\t'\n"
                                 "DO $$ BEGIN RAISE NOTICE 'aviso qualquer'; END $$;\n"
                                 "SELECT 'n.unica', 'pass', '1', '1', '';\n"})
        r = self.rodar("--json-only", script=run)
        self.assertEqual([json.loads(l)["assertion"] for l in r.stdout.splitlines()], ["n.unica"])
        self.assertEqual(r.returncode, 0)

    def test_ordem_lexicografica_mistura_sql_e_sh_e_sh_quebrado_vira_fail(self):
        emite = ("#!/usr/bin/env bash\n"
                 "echo '{\"step\":\"b\",\"assertion\":\"b.um\",\"status\":\"pass\",\"expected\":\"\",\"actual\":\"\",\"detail\":\"\"}'\n")
        run = self.suite_propria({
            "01_a.sql": "\\pset format unaligned\n\\pset tuples_only on\nSELECT 'a.um', 'pass', '1', '1', '';\n",
            "02_b.sh": emite,
            "03_c.sql": "\\pset format unaligned\n\\pset tuples_only on\nSELECT 'c.um', 'pass', '1', '1', '';\n",
            "04_d.sh": "#!/usr/bin/env bash\nexit 7\n",
            "05_e.sql": "SELECT 1/0;\n",
            "06_f.sql": "\\pset format unaligned\n\\pset tuples_only on\nSELECT 'f.um', 'pass', '1', '1', '';\n",
        })
        r = self.rodar("--json-only", script=run)
        linhas = [json.loads(l) for l in r.stdout.splitlines()]
        self.assertEqual([l["assertion"] for l in linhas],
                         ["a.um", "b.um", "c.um", "d.execucao", "e.execucao", "f.um"])
        self.assertEqual(r.returncode, 2)
        self.assertIn("division by zero", linhas[4]["detail"])

    def test_banco_inacessivel_falha_com_jsonl_e_sem_senha(self):
        r = self.rodar("--json-only", STAGING_DB_URL="postgresql://postgres:S3nhaSecreta@127.0.0.1:1/x")
        self.assertGreater(r.returncode, 0)
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        self.assertTrue(any(l["assertion"] == "schema.execucao" for l in linhas))
        self.assertNotIn("S3nhaSecreta", r.stdout + r.stderr)

    def test_env_obrigatoria_ajuda_e_argumento_desconhecido(self):
        for faltando in ("STAGING_DB_URL", "STAGING_PROJECT_REF", "STAGING_ANON_KEY"):
            r = self.rodar("--json-only", **{faltando: ""})
            self.assertNotEqual(r.returncode, 0, faltando)
            self.assertIn(faltando, r.stderr)
            self.assertEqual(r.stdout, "")
        for flag in ("--help", "-h"):
            r = self.rodar(flag)
            self.assertEqual(r.returncode, 0)
            self.assertIn("Uso:", r.stdout)
        for args in (["--json"], ["--json-only", "extra"]):
            r = self.rodar(*args)
            self.assertEqual(r.returncode, 2, args)
            self.assertIn("argumento desconhecido", r.stderr)


class TestDumpBaseline(_ComPostgres):
    def setUp(self):
        super().setUp()
        self.pasta = Path(self.tmp) / "integrity"
        self.pasta.mkdir()
        self.script = self.pasta / "dump-baseline.sh"
        shutil.copy(DIR / "dump-baseline.sh", self.script)
        self.sql("INSERT INTO cron.job(jobname, schedule, active) VALUES ('b','* * * * *',true),"
                 "('a','0 3 * * *',true),('parado','0 0 * * *',false)")

    def rodar(self, url=None):
        env = os.environ.copy()
        env["PROD_DB_URL"] = url or self.pg.url("stg")
        return subprocess.run(["bash", str(self.script)], capture_output=True, text=True, env=env, timeout=60)

    def test_gera_os_tres_baselines_e_preserva_a_whitelist(self):
        r = self.rodar()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        base = self.pasta / "baseline"
        self.assertEqual(json.loads((base / "schema-counts.json").read_text()),
                         {"tables": 1, "views": 1, "indexes": 1, "functions": 0, "policies": 1})
        self.assertEqual(json.loads((base / "expected-policies.json").read_text()), {"contas": 1})
        self.assertEqual(json.loads((base / "expected-crons.json").read_text()),
                         [{"jobname": "a", "schedule": "0 3 * * *"}, {"jobname": "b", "schedule": "* * * * *"}])
        self.assertEqual(json.loads((base / "allowed-public-tables.json").read_text()), [])
        (base / "allowed-public-tables.json").write_text('["catalogo"]')
        self.assertEqual(self.rodar().returncode, 0)
        self.assertEqual((base / "allowed-public-tables.json").read_text(), '["catalogo"]')
        self.assertEqual([p.name for p in base.iterdir() if p.name.startswith(".")], [])

    def test_baseline_gerado_alimenta_o_01_schema_com_pass(self):
        self.assertEqual(self.rodar().returncode, 0)
        contagens = (self.pasta / "baseline" / "schema-counts.json").read_text().strip()
        g = self.gate("01_schema.sql", baseline_counts=contagens)
        self.assertEqual(g["schema.tables_count"][0], "pass")
        self.assertEqual(g["schema.policies_count"][0], "pass")

    def test_falha_de_conexao_preserva_o_baseline_versionado(self):
        self.assertEqual(self.rodar().returncode, 0)
        base = self.pasta / "baseline"
        antes = {p.name: p.read_text() for p in base.iterdir()}
        r = self.rodar("postgresql://postgres:S3nhaSecreta@127.0.0.1:1/x")
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("S3nhaSecreta", r.stdout + r.stderr)
        # antes: schema-counts.json virava "{}" e os outros dois ficavam vazios
        self.assertEqual(antes, {p.name: p.read_text() for p in base.iterdir()})

    def test_prod_sem_schema_cron_nao_publica_nada(self):
        self.assertEqual(self.rodar().returncode, 0)
        base = self.pasta / "baseline"
        antes = {p.name: p.read_text() for p in base.iterdir()}
        self.sql("CREATE TABLE public.nova (id int); DROP SCHEMA cron CASCADE")
        self.assertNotEqual(self.rodar().returncode, 0)
        self.assertEqual(antes, {p.name: p.read_text() for p in base.iterdir()})

    def test_nao_escreve_no_banco_de_origem(self):
        antes = self.sql("SELECT count(*) FROM pg_class")
        self.assertEqual(self.rodar().returncode, 0)
        self.assertEqual(antes, self.sql("SELECT count(*) FROM pg_class"))


class TestEndpoints(unittest.TestCase):
    """04_endpoints.sh com curl falso: nenhum pacote sai da máquina."""

    SAO = (
        {"contem": ["/expert-agent", "Bearer invalid"], "code": "401"},
        {"contem": ["/expert-agent", '{"question":"ping"}'], "code": "200"},
        {"contem": ["/expert-agent"], "code": "422"},
        {"contem": ["/cnpja-lookup"], "code": "401"},
        {"contem": ["/asaas-webhook"], "code": "403"},
        {"contem": ["/bling-webhook"], "code": "401"},
        {"contem": ["/get-mapbox-token"], "code": "500"},
    )

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="endpoints-cenarios-")
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def rodar(self, regras, default="200", **extra):
        cfg, self.log = _escreve_stub_curl(Path(self.tmp) / "bin", regras, default)
        env = os.environ.copy()
        env.pop("TEST_ADMIN_JWT", None)
        env.update({"PATH": f"{self.tmp}/bin:" + env["PATH"], "STUB_CURL_CFG": str(cfg),
                    "STAGING_PROJECT_REF": "stgref", "STAGING_ANON_KEY": "anon-key-de-teste"})
        env.update(extra)
        r = subprocess.run(["bash", str(DIR / "04_endpoints.sh")], capture_output=True, text=True,
                           env=env, timeout=60)
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        return r, {l["assertion"]: l for l in linhas}

    def test_cenario_sao_com_jwt_admin_passa_tudo(self):
        r, a = self.rodar(self.SAO, TEST_ADMIN_JWT="jwt-admin-de-teste")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(a), 9)
        self.assertEqual({l["status"] for l in a.values()}, {"pass"}, a)
        self.assertEqual({l["step"] for l in a.values()}, {"endpoints"})
        self.assertNotIn("jwt-admin-de-teste", r.stdout + r.stderr)
        self.assertNotIn("anon-key-de-teste", r.stdout + r.stderr)

    def test_sem_jwt_admin_fica_unverified(self):
        _, a = self.rodar(self.SAO)
        self.assertEqual(a["expert_agent.invalid_payload_422"]["status"], "unverified")
        self.assertEqual(a["expert_agent.admin_200"]["status"], "unverified")
        self.assertEqual(sum(1 for l in a.values() if l["status"] == "pass"), 7)

    def test_codigo_inesperado_falha(self):
        _, a = self.rodar([], default="200")
        self.assertEqual(a["health.no_bearer_200"]["status"], "pass")
        for nome in ("cnpja_lookup.no_bearer_401", "expert_agent.invalid_bearer_401",
                     "asaas_webhook.no_token_403", "bling_webhook.no_auth_401"):
            self.assertEqual((a[nome]["status"], a[nome]["actual"]), ("fail", "200"), nome)
        self.assertEqual(a["mapbox_token.anon_bearer_runtime"]["status"], "pass")

    def test_rede_fora_reporta_000_e_nao_000000(self):
        r, a = self.rodar([], default="000")
        self.assertEqual(r.returncode, 0, r.stderr)
        chamadas = [l for l in a.values() if l["status"] != "unverified"]
        self.assertEqual(len(chamadas), 7)
        self.assertEqual({l["actual"] for l in chamadas}, {"000"})
        self.assertEqual({l["status"] for l in chamadas}, {"fail"})

    def test_toda_chamada_tem_timeout_e_vai_para_o_projeto_de_staging(self):
        self.rodar(self.SAO)
        chamadas = [json.loads(l) for l in Path(self.log).read_text().splitlines()]
        self.assertEqual(len(chamadas), 7)
        for argv in chamadas:
            self.assertIn("--max-time", argv)
            self.assertTrue(argv[-1].startswith("https://stgref.supabase.co/functions/v1/"), argv[-1])

    def test_env_obrigatoria(self):
        r, _ = self.rodar(self.SAO, STAGING_PROJECT_REF="")
        self.assertNotEqual(r.returncode, 0)
        r, _ = self.rodar(self.SAO, STAGING_ANON_KEY="")
        self.assertNotEqual(r.returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
