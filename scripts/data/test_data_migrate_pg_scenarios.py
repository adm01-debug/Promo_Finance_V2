#!/usr/bin/env python3
"""
Cenários ponta a ponta de scripts/data-migrate.sh, scripts/data/copy-table.sh,
rollback.sh e verify.sh contra um Postgres local descartável (pg_efemero.py):
dois bancos no mesmo cluster fazem o papel de PROD e STAGING.

Sem Postgres local (initdb/pg_ctl/psql) as classes que dependem dele são
puladas; as de validação de argumentos rodam sempre.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pg_efemero import PgEfemero

REPO_ROOT = Path(__file__).resolve().parents[2]
MIGRATE = REPO_ROOT / "scripts" / "data-migrate.sh"
COPY = REPO_ROOT / "scripts" / "data" / "copy-table.sh"
ROLLBACK = REPO_ROOT / "scripts" / "data" / "rollback.sh"
VERIFY = REPO_ROOT / "scripts" / "data" / "verify.sh"
LIB = REPO_ROOT / "scripts" / "data" / "lib-alvo.sh"

UUID_OK = "7f3c1a52-9b0e-4c1d-8a77-0d6f2e5b9c10"
SEGREDO = "ZZ_DADO_SIGILOSO_DE_PROD"

SCHEMA = """
DROP SCHEMA IF EXISTS _migration CASCADE;
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
CREATE TABLE empresas (id uuid PRIMARY KEY, nome text NOT NULL);
CREATE TABLE clientes (
  id uuid PRIMARY KEY, empresa_id uuid NOT NULL REFERENCES empresas(id),
  nome text, doc bytea, meta jsonb, obs text,
  nome_upper text GENERATED ALWAYS AS (upper(nome)) STORED);
CREATE TABLE pedidos (id bigserial PRIMARY KEY, cliente_id uuid REFERENCES clientes(id),
  valor numeric(12,2), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE vazia (id int PRIMARY KEY, x text);
CREATE TABLE sem_id (a text, b text);
CREATE TABLE fora_manifesto (id int PRIMARY KEY, empresa_id uuid REFERENCES empresas(id));
CREATE TABLE webhooks_log (id int PRIMARY KEY);
CREATE TABLE user_sessions (id int PRIMARY KEY);
"""

DADOS_PROD = f"""
INSERT INTO empresas VALUES ('00000000-0000-0000-0000-000000000001','Promo'),
  ('00000000-0000-0000-0000-000000000002','Outra "aspas" Ltda');
INSERT INTO clientes(id,empresa_id,nome,doc,meta,obs) VALUES
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','{SEGREDO}',
  '\\xdeadbeef', '{{"a":[1,2,{{"b":null}}],"t":"x\\ty"}}', E'linha1\\nlinha2\\tcom tab \\\\ barra'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','José ç ü 🚀', NULL, NULL, NULL),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','', '\\x', '{{}}', '\\N');
INSERT INTO pedidos(cliente_id,valor,created_at) VALUES
 ('10000000-0000-0000-0000-000000000001', 10.50, now()),
 ('10000000-0000-0000-0000-000000000002', 99.99, now() - interval '200 days'),
 (NULL, 0, now());
INSERT INTO sem_id VALUES (E'a\\tb', E'c\\nd'), (NULL, ''), ('x','y');
INSERT INTO webhooks_log VALUES (1); INSERT INTO user_sessions VALUES (1);
CREATE TABLE so_prod (id int);
"""

DADOS_STG = """
INSERT INTO empresas VALUES ('00000000-0000-0000-0000-0000000000aa','Staging velha');
INSERT INTO clientes(id,empresa_id,nome) VALUES
  ('10000000-0000-0000-0000-0000000000aa','00000000-0000-0000-0000-0000000000aa','Cliente staging');
INSERT INTO pedidos(cliente_id,valor) VALUES ('10000000-0000-0000-0000-0000000000aa', 1);
INSERT INTO vazia VALUES (1,'lixo staging');
INSERT INTO sem_id VALUES ('s','t');
INSERT INTO fora_manifesto VALUES (1,'00000000-0000-0000-0000-0000000000aa');
"""

MANIFESTO = """
version: 1
defaults:
  columns: "*"
  truncate_before: true
  snapshot: true
blacklist_extra:
  - user_sessions
groups:
  - name: base
    tables:
      - empresas
      - clientes
      - vazia
      - sem_id
  - name: recente
    where: "created_at > now() - interval '90 days'"
    tables:
      - pedidos
"""

# O que comparar entre PROD e STAGING depois da cópia (bytea/jsonb/NULL/tab/\\n
# em forma textual estável).
COMPARACOES = [
    "SELECT id, nome FROM empresas ORDER BY id",
    ("SELECT id, empresa_id, nome, encode(doc,'hex'), meta::text, obs, nome_upper,"
     " doc IS NULL, meta IS NULL, obs IS NULL FROM clientes ORDER BY id"),
    "SELECT a, b, a IS NULL FROM sem_id ORDER BY 1, 2",
    ("SELECT id, cliente_id, valor FROM pedidos"
     " WHERE created_at > now() - interval '90 days' ORDER BY id"),
    "SELECT count(*) FROM vazia",
]

ESTADO_STG = [
    "SELECT nome FROM empresas ORDER BY 1",
    "SELECT nome, nome_upper FROM clientes ORDER BY 1",
    "SELECT count(*), max(valor) FROM pedidos",
    "SELECT x FROM vazia ORDER BY 1",
    "SELECT a, b FROM sem_id ORDER BY 1",
]


def _exige_python_yq():
    """O data-migrate.sh lê o manifesto com o python-yq (wrapper do jq)."""
    if not (shutil.which("yq") and shutil.which("jq")):
        raise unittest.SkipTest("yq/jq não instalados")
    versao = subprocess.run(["yq", "--version"], capture_output=True, text=True)
    if "mikefarah" in (versao.stdout + versao.stderr).lower():
        raise unittest.SkipTest("yq instalado é o mikefarah/yq; os scripts usam o python-yq")


class _ComPostgres(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        _exige_python_yq()
        cls.pg = PgEfemero()
        try:
            for papel in ("service_role", "anon", "authenticated"):
                cls.pg.psql("postgres", f"CREATE ROLE {papel}")
            cls.pg.criar_db("prod")
            cls.pg.criar_db("stg")
        except Exception:
            cls.pg.parar()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.pg.parar()

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="data-cenarios-")
        self.addCleanup(lambda: subprocess.run(["rm", "-rf", self.tmp]))
        self.pg.psql("prod", SCHEMA + DADOS_PROD)
        self.pg.psql("stg", SCHEMA + DADOS_STG)
        self.manifesto(MANIFESTO)

    # ---- helpers -----------------------------------------------------------
    def manifesto(self, texto):
        self.caminho_manifesto = os.path.join(self.tmp, "tables.yaml")
        Path(self.caminho_manifesto).write_text(texto)

    def env(self, **extra):
        env = os.environ.copy()
        for k in ("PROD_PROJECT_REF", "STAGING_PROJECT_REF", "SNAPSHOT_MAX_ROWS",
                  "DATA_MIGRATE_ALVO_OK"):
            env.pop(k, None)
        env.update({
            "PROD_DB_URL": self.pg.url("prod"),
            "STAGING_DB_URL": self.pg.url("stg"),
            "MANIFEST": self.caminho_manifesto,
            "TMPDIR": self.tmp,
        })
        env.update(extra)
        return env

    def rodar(self, script, *args, **extra_env):
        return subprocess.run(["bash", str(script), *args], capture_output=True, text=True,
                              env=self.env(**extra_env), timeout=180, stdin=subprocess.DEVNULL)

    def run_id(self, r):
        m = re.search(r"^RUN_ID=(\S+)$", r.stdout, re.MULTILINE)
        self.assertIsNotNone(m, r.stdout + r.stderr)
        return m.group(1)

    def estado(self, db, consultas):
        return [self.pg.psql(db, q) for q in consultas]

    def assert_staging_igual_prod(self):
        for q in COMPARACOES:
            self.assertEqual(self.pg.psql("prod", q), self.pg.psql("stg", q), q)

    def log_do_run(self):
        logs = sorted(Path(self.tmp).glob("data-migrate-*.jsonl"))
        self.assertTrue(logs, "log JSONL não foi criado em TMPDIR")
        return logs[-1]


class TestCopiaCompleta(_ComPostgres):
    def test_copia_completa_deixa_staging_igual_a_prod(self):
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assert_staging_igual_prod()
        # O run_id devolvido pelo INSERT ... RETURNING é um UUID (regressão do
        # "uuid\\nINSERT 0 1", que fazia toda tabela falhar).
        self.assertRegex(self.run_id(r), r"^[0-9a-f-]{36}$")
        self.assertEqual(self.pg.psql("stg", "SELECT status FROM _migration.runs"), "done")
        self.assertEqual(
            self.pg.psql("stg", "SELECT count(*) FROM _migration.checkpoints WHERE status='done'"), "5")

    def test_log_e_jsonl_valido_e_sem_linha_de_dado(self):
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        linhas = [l for l in self.log_do_run().read_text().splitlines() if l]
        self.assertGreater(len(linhas), 10)
        for linha in linhas:
            json.loads(linha)  # "COPY 3" do psql de destino quebrava aqui
        self.assertNotIn(SEGREDO, r.stdout + r.stderr + "\n".join(linhas))

    def test_sequence_acompanha_ids_copiados(self):
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        maior = int(self.pg.psql("stg", "SELECT max(id) FROM pedidos"))
        novo = int(self.pg.psql("stg", "INSERT INTO pedidos(valor) VALUES (1) RETURNING id"))
        self.assertGreater(novo, maior)

    def test_rodar_duas_vezes_e_idempotente(self):
        for _ in range(2):
            r = self.rodar(MIGRATE, "--yes")
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assert_staging_igual_prod()
        self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM _migration.runs WHERE status='done'"), "2")

    def test_dry_run_nao_escreve_em_staging(self):
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--dry-run")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("[COPY] base/empresas", r.stdout)
        self.assertEqual(self.pg.psql("stg", "SELECT to_regnamespace('_migration') IS NULL"), "t")
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_plano_avisa_tabelas_esvaziadas_pelo_cascade(self):
        r = self.rodar(MIGRATE, "--dry-run")
        self.assertIn("fora_manifesto", r.stdout)
        self.assertIn("sem snapshot", r.stdout)

    def test_tabela_ausente_no_destino_e_blacklist_sao_puladas(self):
        self.manifesto(MANIFESTO.replace("      - sem_id\n",
                                         "      - sem_id\n      - so_prod\n      - webhooks_log\n      - user_sessions\n"))
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"\[SKIP\] base/so_prod .*ausente em staging")
        self.assertRegex(r.stdout, r"\[SKIP\] base/webhooks_log .*blacklist")
        self.assertRegex(r.stdout, r"\[SKIP\] base/user_sessions .*blacklist")
        self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM webhooks_log"), "0")
        self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM user_sessions"), "0")

    def test_colunas_em_ordem_diferente_casam_por_nome(self):
        self.pg.psql("stg", "DROP TABLE sem_id; CREATE TABLE sem_id (b text, a text)")
        r = self.rodar(MIGRATE, "--yes", "--tables", "sem_id")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        q = "SELECT a, b FROM sem_id ORDER BY 1, 2"
        self.assertEqual(self.pg.psql("prod", q), self.pg.psql("stg", q))

    def test_identity_always_e_coluna_com_maiuscula_copiam_e_revertem(self):
        ddl = ('CREATE TABLE ident (id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,'
               ' "Nome Completo" text)')
        self.pg.psql("prod", ddl + "; INSERT INTO ident(\"Nome Completo\") VALUES ('a'),('b'),('c')")
        self.pg.psql("stg", ddl + "; INSERT INTO ident(\"Nome Completo\") VALUES ('velho')")
        self.manifesto(MANIFESTO.replace("      - sem_id\n", "      - sem_id\n      - ident\n"))
        r = self.rodar(MIGRATE, "--yes", "--tables", "ident")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        q = 'SELECT id, "Nome Completo" FROM ident ORDER BY id'
        self.assertEqual(self.pg.psql("prod", q), self.pg.psql("stg", q))
        rb = self.rodar(ROLLBACK, "--run-id", self.run_id(r))
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        self.assertEqual(self.pg.psql("stg", q), "1|velho")

    def test_senha_da_url_nao_aparece_em_saida_nem_log(self):
        senha = "S3nhaUltraSecreta"
        r = self.rodar(
            MIGRATE, "--yes",
            PROD_DB_URL=f"postgresql://postgres:{senha}@127.0.0.1:{self.pg.porta}/prod",
            STAGING_DB_URL=f"postgresql://postgres:{senha}@127.0.0.1:{self.pg.porta}/stg")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        tudo = r.stdout + r.stderr + self.log_do_run().read_text()
        tudo += "".join(p.read_text() for p in Path(self.tmp).glob("data-plan-*.json"))
        self.assertNotIn(senha, tudo)


class TestManifesto(_ComPostgres):
    def test_truncate_before_false_nao_trunca(self):
        self.manifesto(MANIFESTO.replace("truncate_before: true", "truncate_before: false")
                       .replace("snapshot: true", "snapshot: false"))
        self.rodar(MIGRATE, "--yes", "--tables", "sem_id")
        # 1 linha que já estava em staging + 3 de prod (antes: `false // true`
        # virava true e a linha de staging era truncada).
        self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM sem_id"), "4")

    def test_snapshot_false_nao_cria_snapshot(self):
        self.manifesto(MANIFESTO.replace("snapshot: true", "snapshot: false"))
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.pg.psql(
            "stg", "SELECT count(*) FROM pg_tables WHERE schemaname='_migration' AND tablename LIKE 'snap_%'"), "0")
        rb = self.rodar(ROLLBACK, "--run-id", self.run_id(r))
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        self.assertIn("sem snapshot", rb.stdout)

    def test_snapshot_max_rows_aborta_antes_de_truncar(self):
        antes = self.estado("stg", ESTADO_STG)
        for extra, texto in (({"SNAPSHOT_MAX_ROWS": "0"}, MANIFESTO),
                             ({}, MANIFESTO.replace("snapshot: true", "snapshot: true\n  snapshot_max_rows: 0"))):
            self.manifesto(texto)
            r = self.rodar(MIGRATE, "--yes", **extra)
            self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
            self.assertIn("nenhuma tabela foi truncada", r.stdout)
            self.assertEqual(antes, self.estado("stg", ESTADO_STG))
            self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM fora_manifesto"), "1")

    def test_where_invalido_para_a_tabela_nao_trunca(self):
        self.manifesto(MANIFESTO.replace("      - pedidos\n", "      - pedidos\n      - sem_id\n")
                       .replace("      - vazia\n      - sem_id\n", "      - vazia\n"))
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("origem ilegível", r.stdout)
        self.assertEqual(self.pg.psql("stg", "SELECT a || b FROM sem_id"), "st")
        self.assertEqual(self.pg.psql("stg", "SELECT nome FROM empresas"), "Staging velha")

    def test_nome_de_tabela_invalido_aborta_sem_tocar_nos_bancos(self):
        for nome in ("empresas; DROP TABLE clientes", "Empresas", "x') OR ('1'='1", '"aspas"'):
            self.manifesto(MANIFESTO.replace("      - vazia\n", f"      - {json.dumps(nome)}\n"))
            r = self.rodar(MIGRATE, "--yes")
            self.assertEqual(r.returncode, 1, nome + r.stdout + r.stderr)
            self.assertIn("nome de tabela inválido", r.stdout)
            self.assertEqual(self.pg.psql("prod", "SELECT count(*) FROM clientes"), "3")
            self.assertEqual(self.pg.psql("stg", "SELECT count(*) FROM clientes"), "1")

    def test_nome_de_grupo_invalido_aborta(self):
        self.manifesto(MANIFESTO.replace("name: base", "name: \"ba'se\""))
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("nome de grupo inválido", r.stdout)

    def test_manifesto_ilegivel_ou_sem_grupos_aborta(self):
        for texto in ("groups: [\n  - name: x\n   tables: {", "version: 1\ndefaults: {}\n", ""):
            self.manifesto(texto)
            r = self.rodar(MIGRATE, "--yes")
            self.assertEqual(r.returncode, 1, repr(texto) + r.stdout + r.stderr)
            self.assertIn("manifesto inválido", r.stdout)
        self.assertEqual(self.pg.psql("stg", "SELECT nome FROM empresas"), "Staging velha")

    def test_group_inexistente_e_tables_fora_da_allowlist_abortam(self):
        r = self.rodar(MIGRATE, "--yes", "--group", "nao_existe")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("--group não existe no manifesto", r.stdout)
        r = self.rodar(MIGRATE, "--yes", "--tables", "empresas,fora_manifesto")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("fora da allowlist", r.stdout)
        self.assertEqual(self.pg.psql("stg", "SELECT nome FROM empresas"), "Staging velha")

    def test_group_filtra_apenas_o_grupo(self):
        r = self.rodar(MIGRATE, "--yes", "--group", "base")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.pg.psql(
            "stg", "SELECT string_agg(table_name, ',' ORDER BY table_name) FROM _migration.checkpoints"),
            "clientes,empresas,sem_id,vazia")


class TestAlvo(_ComPostgres):
    def assert_recusado(self, r, trecho):
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn(trecho, r.stdout)
        # Nada foi escrito em "produção".
        self.assertEqual(self.pg.psql("prod", "SELECT to_regnamespace('_migration') IS NULL"), "t")
        self.assertEqual(self.pg.psql("prod", "SELECT count(*) FROM clientes"), "3")

    def test_url_identica_e_recusada(self):
        r = self.rodar(MIGRATE, "--yes", STAGING_DB_URL=self.pg.url("prod"))
        self.assert_recusado(r, "PROD_DB_URL == STAGING_DB_URL")

    def test_mesmo_banco_por_url_diferente_e_recusado(self):
        r = self.rodar(MIGRATE, "--yes", STAGING_DB_URL=self.pg.url("prod", "?application_name=outro"))
        self.assert_recusado(r, "mesmo banco")

    def test_mesmo_banco_por_outro_role_e_outro_fuso_e_recusado(self):
        # Role sem acesso a pg_control_system() e com TimeZone própria: a
        # identidade do banco não pode depender de nenhum dos dois.
        self.pg.psql("postgres", "DROP ROLE IF EXISTS leitor_tz; CREATE ROLE leitor_tz LOGIN;"
                                 "ALTER ROLE leitor_tz SET timezone = 'America/Sao_Paulo'")
        self.pg.psql("prod", "REVOKE EXECUTE ON FUNCTION pg_control_system() FROM PUBLIC")
        self.addCleanup(self.pg.psql, "prod", "GRANT EXECUTE ON FUNCTION pg_control_system() TO PUBLIC")
        r = self.rodar(MIGRATE, "--yes", PROD_DB_URL=f"postgresql://leitor_tz@127.0.0.1:{self.pg.porta}/prod",
                       STAGING_DB_URL=self.pg.url("prod"))
        self.assert_recusado(r, "mesmo banco")

    def test_staging_com_ref_de_producao_e_recusado(self):
        r = self.rodar(MIGRATE, "--yes", PROD_PROJECT_REF="127.0.0.1")
        self.assert_recusado(r, "projeto de produção")

    def test_ref_de_producao_diferente_nao_bloqueia_o_fluxo(self):
        # Mesmo ambiente que o staging-migrate.sh passa: refs distintos.
        r = self.rodar(MIGRATE, "--yes", PROD_PROJECT_REF="prodrefaaaaaaaaaaaaa",
                       STAGING_PROJECT_REF="stgrefbbbbbbbbbbbbbb")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assert_staging_igual_prod()

    def test_prod_fora_do_ar_nao_vira_sucesso(self):
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--yes", PROD_DB_URL="postgresql://postgres@127.0.0.1:1/prod")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("PROD_DB_URL", r.stdout)
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_copy_table_avulso_recusa_mesmo_banco(self):
        r = self.rodar(COPY, "--run-id", UUID_OK, "--table", "empresas", "--group", "base",
                       STAGING_DB_URL=self.pg.url("prod", "?application_name=outro"))
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertIn("mesmo banco", r.stderr)
        self.assertEqual(self.pg.psql("prod", "SELECT count(*) FROM empresas"), "2")

    def test_rollback_recusa_alvo_de_producao(self):
        r = self.rodar(ROLLBACK, "--run-id", UUID_OK,
                       STAGING_DB_URL=self.pg.url("prod", "?application_name=outro"))
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertIn("mesmo banco", r.stderr)
        r = self.rodar(ROLLBACK, "--run-id", UUID_OK, PROD_PROJECT_REF="127.0.0.1")
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertIn("projeto de produção", r.stderr)


class TestFalhaERollback(_ComPostgres):
    def test_rollback_restaura_pai_e_filhas(self):
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        rid = self.run_id(r)
        seco = self.rodar(ROLLBACK, "--run-id", rid, "--dry-run")
        self.assertEqual(seco.returncode, 0, seco.stderr)
        self.assertIn('"status":"dry_run"', seco.stdout)
        self.assert_staging_igual_prod()  # dry-run não mexe em nada
        rb = self.rodar(ROLLBACK, "--run-id", rid)
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        # clientes < empresas na ordem alfabética: restaurar tabela a tabela
        # com TRUNCATE CASCADE esvaziava clientes de novo ao chegar em empresas.
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))
        self.assertEqual(self.pg.psql("stg", "SELECT status FROM _migration.runs"), "rolled_back")
        for linha in rb.stdout.splitlines():
            if linha.startswith("{"):
                json.loads(linha)
        de_novo = self.rodar(ROLLBACK, "--run-id", rid)
        self.assertEqual(de_novo.returncode, 0, de_novo.stderr)
        self.assertIn("Nada a reverter", de_novo.stdout)
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_falha_no_meio_reporta_erro_e_rollback_restaura_tudo(self):
        self.pg.psql("stg", "ALTER TABLE clientes DROP COLUMN obs")
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("data-migrate falhou", r.stdout)
        self.assertEqual(self.pg.psql("stg", "SELECT status FROM _migration.runs"), "failed")
        self.assertEqual(self.pg.psql(
            "stg", "SELECT status FROM _migration.checkpoints WHERE table_name='clientes'"), "failed")
        rb = self.rodar(ROLLBACK, "--run-id", self.run_id(r))
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        # pedidos nem chegou a ser copiada com sucesso, mas foi esvaziada pelo
        # CASCADE de empresas: o snapshot é tirado antes do primeiro TRUNCATE.
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_resume_conclui_o_que_faltou_e_preserva_snapshot_original(self):
        self.pg.psql("stg", "ALTER TABLE clientes DROP COLUMN obs")
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--yes")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        rid = self.run_id(r)
        self.pg.psql("stg", "ALTER TABLE clientes ADD COLUMN obs text")
        r2 = self.rodar(MIGRATE, "--resume", rid)
        self.assertEqual(r2.returncode, 0, r2.stdout + r2.stderr)
        self.assertIn("already done", r2.stdout)
        self.assert_staging_igual_prod()
        self.pg.psql("stg", "ALTER TABLE clientes DROP COLUMN obs")
        rb = self.rodar(ROLLBACK, "--run-id", rid)
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_erro_de_copy_nao_despeja_dado_de_producao_no_log(self):
        # nome inteiro em staging: o COPY falha com o valor de prod na mensagem.
        self.pg.psql("stg", "DROP TABLE clientes CASCADE; CREATE TABLE clientes ("
                            "id uuid PRIMARY KEY, empresa_id uuid, nome int, doc bytea, meta jsonb, obs text)")
        r = self.rodar(MIGRATE, "--yes", "--tables", "empresas,clientes")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        tudo = r.stdout + r.stderr + self.log_do_run().read_text()
        self.assertNotIn(SEGREDO, tudo)
        self.assertNotIn("deadbeef", tudo)
        self.assertIn("valor omitido", tudo)
        for linha in self.log_do_run().read_text().splitlines():
            json.loads(linha)

    def test_rollback_de_run_interrompido_em_running(self):
        antes = self.estado("stg", ESTADO_STG)
        r = self.rodar(MIGRATE, "--yes")
        rid = self.run_id(r)
        self.pg.psql("stg", "UPDATE _migration.checkpoints SET status='running' WHERE table_name='empresas';"
                            "UPDATE _migration.checkpoints SET status='pending' WHERE table_name='pedidos'")
        rb = self.rodar(ROLLBACK, "--run-id", rid)
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        self.assertEqual(antes, self.estado("stg", ESTADO_STG))

    def test_rollback_com_snapshot_ausente_nao_altera_nada(self):
        r = self.rodar(MIGRATE, "--yes")
        rid = self.run_id(r)
        snap = self.pg.psql("stg", "SELECT snapshot_table FROM _migration.checkpoints WHERE table_name='pedidos'")
        self.pg.psql("stg", f"DROP TABLE {snap}")
        rb = self.rodar(ROLLBACK, "--run-id", rid)
        self.assertEqual(rb.returncode, 1, rb.stdout + rb.stderr)
        self.assertIn("snapshot ausente", rb.stderr)
        self.assert_staging_igual_prod()  # transação única: nada foi truncado
        self.assertEqual(self.pg.psql("stg", "SELECT status FROM _migration.runs"), "done")

    def test_rollback_run_inexistente_e_staging_sem_bookkeeping(self):
        self.pg.psql("stg", (REPO_ROOT / "scripts" / "data" / "checkpoint.sql").read_text())
        r = self.rodar(ROLLBACK, "--run-id", UUID_OK)
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("run_id não encontrado", r.stderr)
        self.pg.psql("stg", "DROP SCHEMA _migration CASCADE")
        r = self.rodar(ROLLBACK, "--run-id", UUID_OK)
        self.assertNotEqual(r.returncode, 0)

    def test_nome_longo_ganha_snapshot_proprio(self):
        a = "tabela_de_nome_muito_longo_para_caber_no_snapshot_aaaa"
        b = "tabela_de_nome_muito_longo_para_caber_no_snapshot_bbbb"
        for db, valor in (("prod", "novo"), ("stg", "velho")):
            self.pg.psql(db, f"CREATE TABLE {a} (v text); CREATE TABLE {b} (v text);"
                             f"INSERT INTO {a} VALUES ('{valor}-a'); INSERT INTO {b} VALUES ('{valor}-b')")
        self.manifesto(MANIFESTO.replace("      - sem_id\n", f"      - sem_id\n      - {a}\n      - {b}\n"))
        r = self.rodar(MIGRATE, "--yes", "--tables", f"{a},{b}")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        snaps = self.pg.psql("stg", "SELECT snapshot_table FROM _migration.checkpoints ORDER BY table_name").split("\n")
        self.assertEqual(len(set(snaps)), 2, snaps)
        for s in snaps:
            self.assertLessEqual(len(s.split(".", 1)[1]), 63)
            self.assertEqual(self.pg.psql("stg", f"SELECT to_regclass('{s}') IS NOT NULL"), "t")
        rb = self.rodar(ROLLBACK, "--run-id", self.run_id(r))
        self.assertEqual(rb.returncode, 0, rb.stdout + rb.stderr)
        self.assertEqual(self.pg.psql("stg", f"SELECT v FROM {a}"), "velho-a")
        self.assertEqual(self.pg.psql("stg", f"SELECT v FROM {b}"), "velho-b")


class TestVerifyComBanco(_ComPostgres):
    def test_verify_sem_bookkeeping_falha_em_vez_de_passar(self):
        r = self.rodar(VERIFY, "--run-id", UUID_OK)
        self.assertGreaterEqual(r.returncode, 1, r.stdout + r.stderr)
        linhas = [json.loads(l) for l in r.stdout.splitlines() if l]
        self.assertTrue(any(l["assertion"] == "checkpoints" and l["status"] == "fail" for l in linhas), linhas)

    def test_verify_acusa_divergencia_de_contagem(self):
        r = self.rodar(MIGRATE, "--yes")
        rid = self.run_id(r)
        ok = self.rodar(VERIFY, "--run-id", rid)
        self.assertEqual(ok.returncode, 0, ok.stdout + ok.stderr)
        self.pg.psql("stg", "DELETE FROM sem_id WHERE a = 'x'")
        ruim = self.rodar(VERIFY, "--run-id", rid)
        self.assertEqual(ruim.returncode, 1, ruim.stdout + ruim.stderr)
        linhas = [json.loads(l) for l in ruim.stdout.splitlines() if l]
        falhas = [l for l in linhas if l["status"] == "fail"]
        self.assertEqual([(l["assertion"], l["table"]) for l in falhas], [("count", "sem_id")])


class TestArgumentos(unittest.TestCase):
    """Validação de argumentos: não precisa de banco (falha antes do 1º psql)."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="data-args-")
        self.addCleanup(shutil.rmtree, self.tmp, True)

    def rodar(self, script, *args, **extra):
        env = os.environ.copy()
        env.update({"PROD_DB_URL": "postgresql://x@127.0.0.1:1/p",
                    "STAGING_DB_URL": "postgresql://x@127.0.0.1:1/s",
                    "DATA_MIGRATE_ALVO_OK": "1",
                    "TMPDIR": self.tmp})
        env.update(extra)
        return subprocess.run(["bash", str(script), *args], capture_output=True, text=True,
                              env=env, timeout=30, stdin=subprocess.DEVNULL)

    def test_flag_sem_valor_sai_com_2_e_mensagem(self):
        for script, flag in ((MIGRATE, "--group"), (MIGRATE, "--tables"), (MIGRATE, "--resume"),
                             (COPY, "--run-id"), (COPY, "--where"), (ROLLBACK, "--run-id"),
                             (VERIFY, "--run-id")):
            r = self.rodar(script, flag)
            self.assertEqual(r.returncode, 2, f"{script.name} {flag}: {r.stderr}")
            self.assertIn("exige um valor", r.stderr)

    def test_run_id_que_nao_e_uuid_e_recusado(self):
        injecao = "x' OR '1'='1"
        for script, args in ((MIGRATE, ["--resume", injecao]),
                             (COPY, ["--run-id", injecao, "--table", "t", "--group", "g"]),
                             (ROLLBACK, ["--run-id", injecao]),
                             (VERIFY, ["--run-id", injecao])):
            r = self.rodar(script, *args)
            self.assertEqual(r.returncode, 2, f"{script.name}: {r.stdout}{r.stderr}")
            self.assertRegex(r.stderr, "UUID")

    def test_copy_table_valida_tabela_grupo_e_booleans(self):
        base = ["--run-id", UUID_OK, "--table", "t", "--group", "g"]
        casos = {
            "nome de tabela inválido": ["--run-id", UUID_OK, "--table", "T;drop", "--group", "g"],
            "nome de grupo inválido": ["--run-id", UUID_OK, "--table", "t", "--group", "g'x"],
            "--truncate aceita": base + ["--truncate", "talvez"],
            "--snapshot aceita": base + ["--snapshot", "1"],
            "--snapshot-max-rows aceita": base + ["--snapshot-max-rows", "muitas"],
            "flag desconhecida": base + ["--forca"],
            "run-id/table/group obrigatórios": ["--table", "t"],
        }
        for trecho, args in casos.items():
            r = self.rodar(COPY, *args)
            self.assertEqual(r.returncode, 2, f"{trecho}: {r.stdout}{r.stderr}")
            self.assertIn(trecho, r.stderr)

    def test_env_ausente_sai_com_erro(self):
        for script, args in ((COPY, ["--run-id", UUID_OK, "--table", "t", "--group", "g"]),
                             (ROLLBACK, ["--run-id", UUID_OK]), (VERIFY, ["--run-id", UUID_OK])):
            r = self.rodar(script, *args, STAGING_DB_URL="")
            self.assertEqual(r.returncode, 2, f"{script.name}: {r.stderr}")
        r = self.rodar(MIGRATE, "--yes", PROD_DB_URL="")
        self.assertEqual(r.returncode, 1)
        self.assertIn("PROD_DB_URL ausente", r.stdout)

    def test_yq_em_go_e_recusado_com_mensagem_clara(self):
        pasta = tempfile.mkdtemp(prefix="yq-go-")
        self.addCleanup(shutil.rmtree, pasta, True)
        stub = Path(pasta) / "yq"
        stub.write_text("#!/usr/bin/env bash\necho 'yq (https://github.com/mikefarah/yq/) version v4.44.1'\n")
        stub.chmod(0o755)
        r = self.rodar(MIGRATE, "--dry-run", PATH=f"{pasta}:{os.environ['PATH']}")
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("python-yq", r.stdout)

    def test_manifesto_versionado_e_coerente(self):
        _exige_python_yq()
        # tables.yaml real: nomes dentro da régua do engine e nenhuma tabela
        # listada que a blacklist (padrão ou extra) descartaria em silêncio.
        manifesto = str(REPO_ROOT / "scripts" / "data" / "tables.yaml")
        filtro = "{g: [.groups[].name], t: [.groups[].tables[]], b: .blacklist_extra, d: .defaults}"
        r = subprocess.run(["yq", "-c", filtro, manifesto], capture_output=True, text=True, timeout=30)
        self.assertEqual(r.returncode, 0, r.stderr)
        dados = json.loads(r.stdout)
        padrao = re.compile(r"^(audit_logs.*|.*_logs?|.*_telemetry|frontend_error_logs.*|frontend_performance_logs|"
                            r"runtime_error_logs|rate_limit_logs|webhooks_log|login_attempts|sso_login_attempts|"
                            r"blocked_ips|cron_job_logs|query_telemetry.*)$")
        self.assertEqual(len(dados["t"]), len(set(dados["t"])), "tabela repetida no manifesto")
        for g in dados["g"]:
            self.assertRegex(g, r"^[A-Za-z0-9_-]+$")
        for t in dados["t"]:
            self.assertRegex(t, r"^[a-z_][a-z0-9_]*$")
            self.assertNotIn(t, dados["b"])
            self.assertIsNone(padrao.match(t), t)
        self.assertIs(dados["d"]["truncate_before"], True)
        self.assertIs(dados["d"]["snapshot"], True)

    def test_help_sai_com_0(self):
        for script in (MIGRATE, COPY, ROLLBACK, VERIFY):
            r = self.rodar(script, "--help")
            self.assertEqual(r.returncode, 0, f"{script.name}: {r.stderr}")
            self.assertTrue(r.stdout.strip(), script.name)

    def test_scripts_passam_no_bash_n_e_shellcheck_sem_erro(self):
        for script in (MIGRATE, COPY, ROLLBACK, VERIFY, LIB):
            r = subprocess.run(["bash", "-n", str(script)], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
        if subprocess.run(["which", "shellcheck"], capture_output=True).returncode != 0:
            self.skipTest("shellcheck não instalado")
        r = subprocess.run(["shellcheck", "-x", "-S", "error", str(MIGRATE), str(COPY), str(ROLLBACK),
                            str(VERIFY), str(LIB)], capture_output=True, text=True, cwd=str(REPO_ROOT))
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)
