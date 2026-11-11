"""Testes do banco.sql contra um Postgres de verdade (efemero), com um schema sintetico hostil.

Rodar: python3 -m unittest scripts/inventario/test_banco_sql.py   (ou test-all.sh)

Servidor: sem configuracao, sobe um Postgres proprio em diretorio temporario, porta livre, so em
127.0.0.1 (precisa de initdb/pg_ctl/psql no PATH ou em /usr/lib/postgresql/*/bin e de usuario nao
root). Para usar um servidor ja de pe (ex.: rodando como root), exporte INVENTARIO_PG_PORTA e,
se preciso, INVENTARIO_PG_USUARIO (padrao postgres; autenticacao trust). Sem servidor, tudo se
auto-pula. Nunca conecta fora de 127.0.0.1.
"""
import glob
import json
import os
import re
import shutil
import socket
import subprocess
import tempfile
import unittest
from pathlib import Path

AQUI = Path(__file__).resolve().parent
SQL = AQUI / "banco.sql"
HOST = "127.0.0.1"

_servidor = {"porta": None, "usuario": "postgres", "dir": None, "bin": None, "motivo_skip": None}


def _achar(nome):
    achado = shutil.which(nome)
    if achado:
        return achado
    candidatos = sorted(glob.glob(f"/usr/lib/postgresql/*/bin/{nome}"))
    return candidatos[-1] if candidatos else None


def _porta_livre():
    with socket.socket() as s:
        s.bind((HOST, 0))
        return s.getsockname()[1]


def setUpModule():
    psql = _achar("psql")
    if not psql:
        _servidor["motivo_skip"] = "psql ausente"
        return
    _servidor["psql"] = psql
    porta = os.environ.get("INVENTARIO_PG_PORTA")
    if porta:
        _servidor["porta"] = int(porta)
        _servidor["usuario"] = os.environ.get("INVENTARIO_PG_USUARIO", "postgres")
        return
    initdb, pg_ctl = _achar("initdb"), _achar("pg_ctl")
    if not initdb or not pg_ctl:
        _servidor["motivo_skip"] = "initdb/pg_ctl ausentes e INVENTARIO_PG_PORTA nao definida"
        return
    if os.geteuid() == 0:
        _servidor["motivo_skip"] = "initdb nao roda como root; defina INVENTARIO_PG_PORTA com um servidor local"
        return
    pasta = tempfile.mkdtemp(prefix="inv-pg-")
    porta = _porta_livre()
    try:
        subprocess.run([initdb, "-D", f"{pasta}/data", "-A", "trust", "-U", "postgres", "--no-sync"],
                       check=True, capture_output=True)
        opcoes = f"-p {porta} -c unix_socket_directories= -c listen_addresses={HOST} -c fsync=off"
        subprocess.run([pg_ctl, "-D", f"{pasta}/data", "-o", opcoes, "-l", f"{pasta}/log", "-w", "-t", "60", "start"],
                       check=True, capture_output=True)
    except (subprocess.CalledProcessError, OSError) as erro:
        shutil.rmtree(pasta, ignore_errors=True)
        _servidor["motivo_skip"] = f"nao consegui subir o Postgres efemero: {erro}"
        return
    _servidor.update(porta=porta, dir=pasta, pg_ctl=pg_ctl)


def tearDownModule():
    if _servidor.get("dir"):
        subprocess.run([_servidor["pg_ctl"], "-D", f"{_servidor['dir']}/data", "-m", "immediate", "stop"],
                       capture_output=True, check=False)
        shutil.rmtree(_servidor["dir"], ignore_errors=True)


def psql(banco, *args, entrada=None, somente_leitura=False):
    """Roda psql no servidor local e devolve o CompletedProcess (texto)."""
    env = dict(os.environ, PGCONNECT_TIMEOUT="10")
    for chave in ("PGPASSWORD", "PGSERVICE", "PGSSLMODE"):
        env.pop(chave, None)
    if somente_leitura:
        env["PGOPTIONS"] = "-c default_transaction_read_only=on"
    cmd = [_servidor["psql"], "-h", HOST, "-p", str(_servidor["porta"]), "-U", _servidor["usuario"],
           "-d", banco, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", *args]
    return subprocess.run(cmd, input=entrada, capture_output=True, text=True, env=env, timeout=120, check=False)


def consulta(banco, sql):
    r = psql(banco, "-c", sql)
    assert r.returncode == 0, r.stderr
    return r.stdout.strip()


def criar_banco(nome, extra_create=""):
    psql("postgres", "-c", f'DROP DATABASE IF EXISTS "{nome}"')
    r = psql("postgres", "-c", f'CREATE DATABASE "{nome}" TEMPLATE template0 ENCODING UTF8 {extra_create}')
    assert r.returncode == 0, r.stderr


def apagar_banco(nome):
    psql("postgres", "-c", f'DROP DATABASE IF EXISTS "{nome}" WITH (FORCE)')


def inventario(banco, somente_leitura=True):
    """Executa o banco.sql e devolve (JSON, texto cru)."""
    r = psql(banco, "-f", str(SQL), somente_leitura=somente_leitura)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout), r.stdout


CRON_E_LEDGER = r"""
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigserial primary key, schedule text, command text, nodename text, nodeport int,
                       database text, username text, active boolean default true, jobname text);
CREATE TABLE cron.job_run_details (jobid bigint, runid bigserial, job_pid int, database text, username text,
                                   command text, status text, return_message text, start_time timestamptz, end_time timestamptz);
CREATE SCHEMA supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations (version text primary key, name text);
INSERT INTO supabase_migrations.schema_migrations VALUES ('20260101000000','a'),('20260102000000','b');
"""

HOSTIL = CRON_E_LEDGER + r"""
CREATE SCHEMA extra; CREATE TABLE extra.fora_do_public (id int);
CREATE TABLE public.normal (id int primary key, nota text, outra int);
INSERT INTO public.normal VALUES (1,'x',NULL),(2,NULL,NULL);
CREATE TABLE public."Maiúscula Com Espaço" (id int, "col""aspa" text);
INSERT INTO public."Maiúscula Com Espaço" VALUES (1,NULL);
CREATE TABLE public."com'apostrofo" (id int);
CREATE TABLE public."a(b" (id int);
CREATE TABLE public."a+b*c[d" (id int);
CREATE TABLE public."back\slash" (id int);
CREATE TABLE public."a.b" (id int);
CREATE TABLE public."c.d" (id int);
CREATE TABLE public."a|b" (id int);
CREATE TABLE public.vazia (id int);
CREATE TABLE public.rls_sem_policy (id int); ALTER TABLE public.rls_sem_policy ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.rls_policy_true (id int); ALTER TABLE public.rls_policy_true ENABLE ROW LEVEL SECURITY;
CREATE POLICY p_true ON public.rls_policy_true USING (true);
ALTER TABLE public.rls_policy_true FORCE ROW LEVEL SECURITY;
CREATE TYPE public.cor AS ENUM ('a','b');
CREATE TABLE public.com_enum (c public.cor);
COMMENT ON TABLE public.normal IS E'comentario com | pipe\nquebra de linha e "aspas"';
COMMENT ON COLUMN public.normal.nota IS E'outra | linha\nquebrada';
CREATE VIEW public.v_normal AS SELECT id FROM public.normal;
CREATE MATERIALIZED VIEW public.mv_normal AS SELECT id FROM public.normal;
CREATE TABLE public.so_na_view (id int);
CREATE VIEW public.v_so_na_view AS SELECT id FROM public.so_na_view;
CREATE FUNCTION public.f_definer() RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT count(*)::int FROM public.rls_policy_true $$;
CREATE FUNCTION public.f_metachar() RETURNS int LANGUAGE sql AS $$ SELECT 1 /* axb e c.d */ $$;
CREATE FUNCTION public.f_trg() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER t1 BEFORE INSERT ON public.normal FOR EACH ROW EXECUTE FUNCTION public.f_trg();
CREATE TRIGGER t2 BEFORE UPDATE ON public.normal FOR EACH ROW EXECUTE FUNCTION public.f_trg();
CREATE TABLE public.particionada (id int, d date) PARTITION BY RANGE (d);
CREATE TABLE public.particionada_2026 PARTITION OF public.particionada FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
INSERT INTO public.particionada VALUES (1,'2026-05-01'),(2,'2026-06-01'),(3,'2026-07-01');
INSERT INTO cron.job (schedule, command, jobname, active) VALUES
 ('0 3 * * *', $$SELECT public.f_definer(); SELECT net.http_post(url:='https://x.supabase.co/functions/v1/a', headers:='{"Authorization":"Bearer SEGREDOSEGREDOSEGREDOSEGREDO"}'::jsonb)$$, 'job-ok', true),
 ('*/5 * * * *', 'SELECT 1', 'job-ruim', true),
 ('0 4 * * *', 'SELECT 1', 'job"aspa|pipe', true),
 ('0 4 * * 1', 'SELECT 1', 'Semanal', true),
 ('30 seconds', 'SELECT 1', 'inativo', false);
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
 SELECT 1,'succeeded','ok', now()-interval '1 hour', now()-interval '1 hour'+interval '3 seconds';
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
 SELECT 2, CASE WHEN g%10=0 THEN 'failed' ELSE 'succeeded' END,
        CASE WHEN g%10=0 THEN 'job startup timeout' ELSE 'ok' END,
        now()-(g||' minutes')::interval, now()-(g||' minutes')::interval + interval '1 second'
   FROM generate_series(1,100) g;
INSERT INTO cron.job_run_details (jobid, status, return_message, start_time, end_time)
 VALUES (2,'succeeded','x', now()-interval '10 days', now()-interval '10 days');
"""

NOMES_HOSTIS = ["a(b", "a+b*c[d", "back\\slash", "a.b", "c.d", "a|b", "Maiúscula Com Espaço", "com'apostrofo"]


class BancoSqlHostil(unittest.TestCase):
    banco = f"inv_hostil_{os.getpid()}"

    @classmethod
    def setUpClass(cls):
        if _servidor["motivo_skip"]:
            raise unittest.SkipTest(_servidor["motivo_skip"])
        criar_banco(cls.banco)
        r = psql(cls.banco, "-q", entrada=HOSTIL)
        assert r.returncode == 0, r.stderr
        cls.inv, cls.cru = inventario(cls.banco)

    @classmethod
    def tearDownClass(cls):
        if not _servidor["motivo_skip"]:
            apagar_banco(cls.banco)

    def tabela(self, nome):
        achadas = [t for t in self.inv["tabelas"] if t["nome"] == nome]
        self.assertEqual(len(achadas), 1, f"{nome!r} deveria aparecer exatamente 1 vez")
        return achadas[0]

    def test_saida_e_uma_linha_com_um_json_e_roda_em_transacao_somente_leitura(self):
        self.assertEqual(self.cru.strip().count("\n"), 0)
        self.assertEqual(self.inv["format_version"], 1)
        for chave in ("medido_em", "resumo", "extensoes", "tabelas", "cron"):
            self.assertIn(chave, self.inv)
        self.assertRegex(self.inv["medido_em"], r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$")

    def test_nome_de_tabela_com_metacaractere_de_regex_nao_derruba_o_inventario(self):
        # "a(b" fazia o banco responder `invalid regular expression: parentheses () not balanced`
        # e o inventario inteiro (todas as tabelas) deixava de existir.
        for nome in NOMES_HOSTIS:
            self.tabela(nome)

    def test_tabelas_batem_com_o_catalogo_sem_faltar_nem_duplicar(self):
        esperado = json.loads(consulta(self.banco, """
            SELECT json_agg(c.relname ORDER BY c.relname COLLATE "C") FROM pg_class c
              JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r','p')"""))
        nomes = [t["nome"] for t in self.inv["tabelas"]]
        self.assertEqual(nomes, esperado)
        self.assertEqual(len(nomes), len(set(nomes)))
        self.assertEqual(self.inv["resumo"]["tabelas_public"], len(esperado))
        self.assertNotIn("fora_do_public", nomes)

    def test_rls_policies_e_triggers_por_tabela_batem_com_o_catalogo(self):
        linhas = json.loads(consulta(self.banco, """
            SELECT json_agg(json_build_object('nome', c.relname, 'rls', c.relrowsecurity, 'forcado', c.relforcerowsecurity,
                   'policies', (SELECT count(*) FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = c.relname),
                   'triggers', (SELECT count(*) FROM pg_trigger t WHERE t.tgrelid = c.oid AND NOT t.tgisinternal)))
              FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE n.nspname = 'public' AND c.relkind IN ('r','p')"""))
        for ref in linhas:
            t = self.tabela(ref["nome"])
            self.assertEqual((t["rls"], t["rls_forcado"], t["policies"], t["triggers"]),
                             (ref["rls"], ref["forcado"], ref["policies"], ref["triggers"]), ref["nome"])
        self.assertEqual(self.tabela("rls_sem_policy")["policies"], 0)
        self.assertTrue(self.tabela("rls_sem_policy")["rls"])
        self.assertEqual(self.tabela("rls_policy_true")["policies"], 1)
        self.assertEqual(self.tabela("normal")["triggers"], 2)

    def test_linhas_exatas_com_tabela_vazia_colunas_null_e_particionada(self):
        self.assertEqual(self.tabela("normal")["linhas"], 2)
        self.assertEqual(self.tabela("vazia")["linhas"], 0)
        self.assertEqual(self.tabela("Maiúscula Com Espaço")["linhas"], 1)
        self.assertEqual(self.tabela("particionada")["linhas"], 3)
        self.assertEqual(self.tabela("particionada_2026")["linhas"], 3)
        self.assertTrue(all(t["linhas_exatas"] for t in self.inv["tabelas"]))
        self.assertTrue(all(isinstance(t["bytes"], int) for t in self.inv["tabelas"]))

    def test_citada_no_banco_escapa_o_nome_da_tabela(self):
        # citadas por view, view materializada, trigger function ou funcao SECURITY DEFINER
        self.assertTrue(self.tabela("normal")["citada_no_banco"])
        self.assertTrue(self.tabela("so_na_view")["citada_no_banco"])
        self.assertTrue(self.tabela("rls_policy_true")["citada_no_banco"])
        self.assertFalse(self.tabela("vazia")["citada_no_banco"])
        # `.` do nome nao pode virar curinga: f_metachar cita "axb" e "c.d"
        self.assertFalse(self.tabela("a.b")["citada_no_banco"], "a.b casou com axb")
        self.assertTrue(self.tabela("c.d")["citada_no_banco"])
        # fronteira de palavra: `norm` nao seria citada por `normal`
        self.assertFalse(self.tabela("a|b")["citada_no_banco"])

    def test_resumo_confere_com_o_catalogo(self):
        esperado = json.loads(consulta(self.banco, """
            SELECT json_build_object(
              'policies', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'),
              'funcoes', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                           WHERE n.nspname = 'public' AND p.prokind IN ('f','p')),
              'views', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                         WHERE n.nspname = 'public' AND c.relkind IN ('v','m')),
              'triggers', (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
                            JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE n.nspname = 'public' AND NOT t.tgisinternal),
              'sem_rls', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relrowsecurity))"""))
        r = self.inv["resumo"]
        self.assertEqual(r["policies"], esperado["policies"])
        self.assertEqual(r["funcoes_public"], esperado["funcoes"])
        self.assertEqual(r["views_public"], esperado["views"])
        self.assertEqual(r["triggers_public"], esperado["triggers"])
        self.assertEqual(r["tabelas_sem_rls"], esperado["sem_rls"])
        self.assertEqual(r["cron_jobs"], 5)
        self.assertEqual(r["cron_ativos"], 4)
        self.assertEqual((r["ledger_registros"], r["ledger_versao_max"]), (2, "20260102000000"))

    def test_cron_nao_vaza_o_comando_e_extrai_so_o_nome_das_funcoes(self):
        self.assertNotIn("SEGREDO", self.cru)
        self.assertNotIn("Bearer", self.cru)
        self.assertNotIn("supabase.co", self.cru)
        jobs = {j["nome"]: j for j in self.inv["cron"]["jobs"]}
        self.assertEqual(jobs["job-ok"]["chama"], ["net.http_post", "public.f_definer"])
        self.assertEqual(jobs["job-ruim"]["chama"], [])
        self.assertEqual(set(jobs), {"job-ok", "job-ruim", 'job"aspa|pipe', "Semanal", "inativo"})

    def test_cron_telemetria_bate_com_contagem_independente(self):
        jobs = {j["nome"]: j for j in self.inv["cron"]["jobs"]}
        ruim = jobs["job-ruim"]
        esperado = json.loads(consulta(self.banco, """
            SELECT json_build_object(
              'e7', count(*) FILTER (WHERE start_time > now() - interval '7 days'),
              'e24', count(*) FILTER (WHERE start_time > now() - interval '24 hours'),
              'f7', count(*) FILTER (WHERE start_time > now() - interval '7 days' AND status = 'failed'),
              'timeout', count(*) FILTER (WHERE status = 'failed' AND return_message LIKE 'job startup timeout%'))
              FROM cron.job_run_details WHERE jobid = 2"""))
        self.assertEqual((ruim["execucoes_7d"], ruim["execucoes_24h"], ruim["falhas_7d"], ruim["startup_timeout_7d"]),
                         (esperado["e7"], esperado["e24"], esperado["f7"], esperado["timeout"]))
        self.assertEqual((ruim["execucoes_7d"], ruim["falhas_7d"], ruim["taxa_falha_7d_pct"]), (100, 10, 10.0))
        self.assertEqual(jobs["job-ok"]["duracao_max_s_7d"], 3)
        self.assertIsNone(jobs["job-ok"]["ultima_falha"])
        # job sem nenhuma execucao: zeros (nao null) e sem divisao por zero
        self.assertEqual((jobs["Semanal"]["execucoes_7d"], jobs["Semanal"]["taxa_falha_7d_pct"]), (0, 0))
        self.assertEqual(self.inv["cron"]["historico"]["linhas"], 102)
        self.assertEqual(self.inv["cron"]["historico"]["mais_de_7_dias"], 1)

    def test_ordem_das_listas_e_por_code_point(self):
        nomes = [t["nome"] for t in self.inv["tabelas"]]
        self.assertEqual(nomes, sorted(nomes))
        jobs = [j["nome"] for j in self.inv["cron"]["jobs"]]
        self.assertEqual(jobs, sorted(jobs))  # 'Semanal' (S maiusculo) antes de 'inativo'

    def test_duas_execucoes_seguidas_dao_o_mesmo_json_fora_da_data_declarada(self):
        def sem_data(i):
            i = json.loads(json.dumps(i))
            i.pop("medido_em")
            return i
        outro, _ = inventario(self.banco)
        self.assertEqual(sem_data(outro), sem_data(self.inv))

    def test_sql_so_le(self):
        sem_comentarios = re.sub(r"--[^\n]*", "", SQL.read_text(encoding="utf-8"))
        self.assertIsNone(re.search(r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COPY|VACUUM)\b",
                                    sem_comentarios, re.IGNORECASE))
        self.assertEqual(sem_comentarios.count(";"), 1, "uma unica instrucao")


class BancoSqlOrdemIndependenteDoLocale(unittest.TestCase):
    banco = f"inv_locale_{os.getpid()}"

    @classmethod
    def setUpClass(cls):
        if _servidor["motivo_skip"]:
            raise unittest.SkipTest(_servidor["motivo_skip"])
        psql("postgres", "-c", f'DROP DATABASE IF EXISTS "{cls.banco}"')
        r = psql("postgres", "-c", f"CREATE DATABASE \"{cls.banco}\" TEMPLATE template0 ENCODING UTF8 "
                 "LOCALE_PROVIDER icu ICU_LOCALE 'en-US'")
        if r.returncode != 0:
            raise unittest.SkipTest(f"servidor sem ICU: {r.stderr.strip()[:120]}")
        cls.criado = True
        r = psql(cls.banco, "-q", entrada=CRON_E_LEDGER + """
            CREATE TABLE public.b (id int); CREATE TABLE public."A" (id int); CREATE TABLE public.a_b (id int);
            CREATE TABLE public.ab (id int); CREATE TABLE public."B" (id int);
            INSERT INTO cron.job (schedule, command, jobname) VALUES ('0 1 * * *','select 1','b'),
              ('0 1 * * *','select 1','A'),('0 1 * * *','select 1','a_b'),('0 1 * * *','select 1','ab'),('0 1 * * *','select 1','B');""")
        assert r.returncode == 0, r.stderr

    @classmethod
    def tearDownClass(cls):
        if getattr(cls, "criado", False):
            apagar_banco(cls.banco)

    def test_ordem_nao_acompanha_o_collation_do_banco(self):
        # no ICU en-US 'a_b' < 'A' < 'ab' < 'b' < 'B'; por code point: A, B, a_b, ab, b
        ordem_banco = consulta(self.banco, "SELECT string_agg(relname::text, ',' ORDER BY relname::text COLLATE \"default\") FROM pg_class "
                                           "WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'")
        self.assertNotEqual(ordem_banco, "A,B,a_b,ab,b", "o locale de teste precisa divergir de code point")
        inv, _ = inventario(self.banco)
        self.assertEqual([t["nome"] for t in inv["tabelas"]], ["A", "B", "a_b", "ab", "b"])
        self.assertEqual([j["nome"] for j in inv["cron"]["jobs"]], ["A", "B", "a_b", "ab", "b"])


class BancoSqlIncompleto(unittest.TestCase):
    banco = f"inv_sem_cron_{os.getpid()}"

    @classmethod
    def setUpClass(cls):
        if _servidor["motivo_skip"]:
            raise unittest.SkipTest(_servidor["motivo_skip"])
        criar_banco(cls.banco)
        assert psql(cls.banco, "-c", "CREATE TABLE public.t (id int)").returncode == 0

    @classmethod
    def tearDownClass(cls):
        if not _servidor["motivo_skip"]:
            apagar_banco(cls.banco)

    def test_banco_sem_pg_cron_falha_alto_em_vez_de_gerar_inventario_vazio(self):
        r = psql(self.banco, "-f", str(SQL), somente_leitura=True)
        self.assertNotEqual(r.returncode, 0)
        self.assertEqual(r.stdout.strip(), "")
        self.assertIn("cron", r.stderr)


class BancoSqlContratoComGerarBanco(unittest.TestCase):
    """A saida real do banco.sql tem de passar no gerar-banco.mjs (extrairInventario + montarInventario)."""
    banco = f"inv_contrato_{os.getpid()}"
    tabelas = tuple(f"tab_{i:02d}" for i in range(12))

    @classmethod
    def setUpClass(cls):
        if _servidor["motivo_skip"]:
            raise unittest.SkipTest(_servidor["motivo_skip"])
        if not shutil.which("node"):
            raise unittest.SkipTest("node ausente")
        criar_banco(cls.banco)
        criar = "".join(f"CREATE TABLE public.{t} (id int);" for t in cls.tabelas)
        r = psql(cls.banco, "-q", entrada=CRON_E_LEDGER + criar
                 + "ALTER TABLE public.tab_00 ENABLE ROW LEVEL SECURITY;"
                 + "INSERT INTO cron.job (schedule, command, jobname) VALUES ('0 3 * * *','SELECT public.f()','job');")
        assert r.returncode == 0, r.stderr

    @classmethod
    def tearDownClass(cls):
        if not _servidor["motivo_skip"]:
            apagar_banco(cls.banco)

    def test_gerar_banco_aceita_a_saida_do_sql_e_nao_deixa_resto(self):
        _, cru = inventario(self.banco)
        raiz = Path(tempfile.mkdtemp(prefix="inv ção "))
        try:
            (raiz / "scripts/inventario").mkdir(parents=True)
            for f in ("gerar-banco.mjs", "gerar-rotas.mjs", "banco.sql"):
                shutil.copy(AQUI / f, raiz / "scripts/inventario" / f)
            tipos = raiz / "src/integrations/supabase/types.ts"
            tipos.parent.mkdir(parents=True)
            corpo = "".join(f"      {t}: {{\n        Row: {{ id: string }}\n      }}\n" for t in self.tabelas)
            tipos.write_text(f"export type Database = {{\n  public: {{\n    Tables: {{\n{corpo}    }}\n    Views: {{\n    }}\n  }}\n}}\n")
            (raiz / "supabase/functions/e").mkdir(parents=True)
            (raiz / "supabase/functions/e/index.ts").write_text("export {};\n")
            (raiz / "entrada.json").write_text(json.dumps({"rows": [{"inventario": json.loads(cru)}]}))
            env = {k: v for k, v in os.environ.items()
                   if not re.match(r"^(GITHUB_TOKEN|GH_TOKEN|SUPABASE_|INVENTARIO_)", k)}
            r = subprocess.run(["node", str(raiz / "scripts/inventario/gerar-banco.mjs"), "--entrada", str(raiz / "entrada.json")],
                               capture_output=True, text=True, env=env, cwd=raiz, timeout=60, check=False)
            self.assertEqual(r.returncode, 0, r.stderr)
            saida = json.loads((raiz / "inventario/estado/banco.json").read_text())
            self.assertEqual(len(saida["tabelas"]), 12)
            self.assertIn("tabela_sem_rls", [a["tipo"] for a in saida["alertas"]])
            self.assertEqual(sorted(p.name for p in (raiz / "inventario/estado").iterdir()), ["banco.json"])
        finally:
            shutil.rmtree(raiz, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
