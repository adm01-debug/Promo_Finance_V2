#!/usr/bin/env python3
"""
Cenários de scripts/migrate-cron-jobs.sh + migrate-cron-jobs.sql.

- Wrapper: `psql` e `envsubst` substituídos por stubs no PATH (sem banco real).
- SQL: checagens estáticas de consistência (contagem × lista × validação inline).
- Integração opcional: defina PF_TEST_PG_URL apontando para um Postgres LOCAL
  descartável (127.0.0.1/localhost) — o teste cria um schema `cron` falso e
  aplica o SQL de verdade duas vezes (idempotência).
"""
import os
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlparse

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "scripts" / "migrate-cron-jobs.sh"
SQL = REPO_ROOT / "scripts" / "migrate-cron-jobs.sql"
SISTEMA = "/usr/local/bin:/usr/bin:/bin"

# Mesma semântica de `envsubst 'SHELL-FORMAT'`: só expande as variáveis listadas.
STUB_ENVSUBST = r'''#!/usr/bin/env python3
import os, re, sys
lista = set(re.findall(r"\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?", sys.argv[1])) if len(sys.argv) > 1 else None
def troca(m):
    nome = m.group(1) or m.group(2)
    if lista is not None and nome not in lista:
        return m.group(0)
    return os.environ.get(nome, "")
sys.stdout.write(re.sub(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)", troca, sys.stdin.read()))
'''

STUB_PSQL = r'''#!/usr/bin/env bash
printf '%s\n' "$*" >> "$CAP"
if [[ "$*" == *"to_regclass"* ]]; then
  printf '%s\n' "${PSQL_DETECT_SCHEMA-1}"
  exit "${PSQL_DETECT_RC:-0}"
fi
if [[ "$*" == *"vault.decrypted_secrets"* ]]; then
  printf '%s\n' "${PSQL_DETECT_HAS-0}"
  exit "${PSQL_DETECT_RC:-0}"
fi
prev=""
for a in "$@"; do
  if [[ "$prev" == "-f" ]]; then cp "$a" "$CAP.sql"; echo "aplicado"; exit "${PSQL_APPLY_RC:-0}"; fi
  if [[ "$a" == "-Atc" ]]; then printf '%s\n' "${PSQL_COUNT-33}"; exit "${PSQL_COUNT_RC:-0}"; fi
  prev="$a"
done
echo " jobname | schedule | active"
'''

FAKE_CRON = r"""
DROP SCHEMA IF EXISTS cron CASCADE;
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, schedule text NOT NULL, command text NOT NULL,
  active boolean DEFAULT true, jobname text UNIQUE);
CREATE FUNCTION cron.schedule(job_name text, schedule text, command text) RETURNS bigint LANGUAGE plpgsql AS $f$
DECLARE v bigint;
BEGIN
  INSERT INTO cron.job(schedule, command, jobname) VALUES (schedule, command, job_name)
  ON CONFLICT (jobname) DO UPDATE SET schedule = EXCLUDED.schedule, command = EXCLUDED.command
  RETURNING jobid INTO v;
  RETURN v;
END $f$;
CREATE FUNCTION cron.unschedule(job_name text) RETURNS boolean LANGUAGE plpgsql AS $f$
BEGIN
  DELETE FROM cron.job WHERE jobname = job_name;
  IF NOT FOUND THEN RAISE EXCEPTION 'could not find valid entry for job %', job_name; END IF;
  RETURN true;
END $f$;
"""

FAKE_VAULT = r"""
CREATE SCHEMA IF NOT EXISTS vault;
CREATE TABLE IF NOT EXISTS vault._secrets(name text PRIMARY KEY, value text NOT NULL, description text);
CREATE OR REPLACE FUNCTION vault.create_secret(_new_secret text, _new_name text, _new_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql AS $v$
BEGIN
  INSERT INTO vault._secrets(name, value, description) VALUES (_new_name, _new_secret, _new_description);
  RETURN '00000000-0000-0000-0000-000000000001'::uuid;
END $v$;
CREATE OR REPLACE FUNCTION vault.update_secret(_secret_id uuid, _new_secret text, _new_name text, _new_description text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $v$
BEGIN
  UPDATE vault._secrets SET value = _new_secret WHERE name = _new_name;
END $v$;
DROP VIEW IF EXISTS vault.decrypted_secrets;
CREATE VIEW vault.decrypted_secrets AS
  SELECT '00000000-0000-0000-0000-000000000001'::uuid AS id, name, value AS decrypted_secret
  FROM vault._secrets;
"""


class Base(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix="pf-migrate-cron-"))
        self.addCleanup(shutil.rmtree, self.dir, True)
        self.bin = self.dir / "bin"
        self.tmp = self.dir / "tmp"
        self.cap = self.dir / "cap.log"
        self.bin.mkdir()
        self.tmp.mkdir()
        self.cap.write_text("")
        self._stub("envsubst", STUB_ENVSUBST)
        self._stub("psql", STUB_PSQL)

    def _stub(self, nome, corpo):
        alvo = self.bin / nome
        alvo.write_text(corpo)
        alvo.chmod(0o755)

    def run_script(self, *args, env_extra=None, drop=(), script=SCRIPT):
        env = {
            "PATH": f"{self.bin}:{SISTEMA}",
            "HOME": str(self.dir),
            "TMPDIR": str(self.tmp),
            "CAP": str(self.cap),
            "DEST_DB_URL": "postgresql://stub/db",
            "PROJECT_REF": "refteste",
            "ANON_KEY": "eyJhbGciOi.J9-_x",
        }
        if env_extra:
            env.update(env_extra)
        for k in drop:
            env.pop(k, None)
        return subprocess.run(["bash", str(script), *args], capture_output=True, text=True, env=env, timeout=30, check=False, stdin=subprocess.DEVNULL)

    def psql_calls(self):
        return [l for l in self.cap.read_text().splitlines() if l]

    def copia_com_sql(self, sql):
        """Copia o wrapper para um diretório próprio ao lado de um SQL customizado."""
        d = self.dir / "copia"
        d.mkdir(exist_ok=True)
        shutil.copy(SCRIPT, d / "migrate-cron-jobs.sh")
        (d / "migrate-cron-jobs.sql").write_text(sql)
        return d / "migrate-cron-jobs.sh"


class TestArgumentos(Base):
    def test_help_sem_env(self):
        for flag in ("--help", "-h"):
            with self.subTest(flag=flag):
                r = self.run_script(flag, drop=("DEST_DB_URL", "PROJECT_REF", "ANON_KEY"))
                self.assertEqual(r.returncode, 0)
                self.assertIn("Uso:", r.stdout)
        self.assertEqual(self.psql_calls(), [])

    def test_argumento_desconhecido_nao_aplica_no_banco(self):
        # Regressão: `--dryrun` (typo) era ignorado e o SQL era aplicado de verdade.
        for args in (("--dryrun",), ("-n",), ("-v", "--dry-run"), ("--dry-run", "extra"), ("",)):
            with self.subTest(args=args):
                r = self.run_script(*args)
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                self.assertIn("Argumento desconhecido", r.stderr)
                self.assertEqual(self.psql_calls(), [])

    def test_env_obrigatoria_ausente_ou_vazia(self):
        for nome in ("DEST_DB_URL", "PROJECT_REF", "ANON_KEY"):
            for modo in ("ausente", "vazia"):
                with self.subTest(nome=nome, modo=modo):
                    r = self.run_script(
                        drop=(nome,) if modo == "ausente" else (),
                        env_extra={nome: ""} if modo == "vazia" else None,
                    )
                    self.assertNotEqual(r.returncode, 0)
                    self.assertIn(f"{nome} é obrigatório", r.stderr)
                    self.assertEqual(self.psql_calls(), [])

    def test_envsubst_ausente_exit3(self):
        if shutil.which("envsubst", path=SISTEMA):
            self.skipTest("envsubst real instalado no sistema")
        (self.bin / "envsubst").unlink()
        r = self.run_script()
        self.assertEqual(r.returncode, 3)
        self.assertIn("envsubst não encontrado", r.stderr)

    def test_psql_ausente_exit3(self):
        if shutil.which("psql", path=SISTEMA):
            self.skipTest("psql real instalado no sistema")
        (self.bin / "psql").unlink()
        r = self.run_script()
        self.assertEqual(r.returncode, 3)
        self.assertIn("psql não encontrado", r.stderr)


class TestDryRun(Base):
    def test_dry_run_nao_chama_psql_e_mostra_preview(self):
        r = self.run_script("--dry-run")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.psql_calls(), [])
        self.assertIn("DRY-RUN", r.stdout)
        self.assertIn("SELECT cron.schedule(", r.stdout)
        self.assertIn("$cron$ SELECT public.capture_slow_queries() $cron$", r.stdout)

    def test_renderizado_vai_para_tmpdir_e_e_identico_a_fonte(self):
        r = self.run_script("--dry-run", env_extra={"ANON_KEY": "CHAVE_SENTINELA.x"})
        self.assertEqual(r.returncode, 0, r.stderr)
        arquivos = list(self.tmp.glob("cron-final-*.sql"))
        self.assertEqual(len(arquivos), 1)
        # Interpolação ativa: PROJECT_REF entra nos hosts das edges; ANON_KEY não
        # tem mais placeholder no SQL e nada do ambiente pode vazar para o arquivo.
        esperado = SQL.read_text().replace("${PROJECT_REF}", "refteste")
        self.assertEqual(arquivos[0].read_text(), esperado)
        self.assertIn("https://refteste.supabase.co/functions", arquivos[0].read_text())
        self.assertNotIn("CHAVE_SENTINELA", arquivos[0].read_text())
        self.assertNotIn("${PROJECT_REF}", arquivos[0].read_text())

    def test_duas_execucoes_nao_colidem(self):
        self.run_script("--dry-run")
        self.run_script("--dry-run")
        self.assertEqual(len(list(self.tmp.glob("cron-final-*.sql"))), 2)


class TestAplicacao(Base):
    def test_aplica_valida_e_reporta_esperado_derivado_do_sql(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stderr)
        chamadas = self.psql_calls()
        self.assertEqual(len(chamadas), 5)
        self.assertTrue(all(c.startswith("-X ") and c.endswith("postgresql://stub/db") for c in chamadas), chamadas)
        self.assertIn("-v ON_ERROR_STOP=1", chamadas[2])
        self.assertIn("-v vault_schema=1 -v vault_has=0", chamadas[2])
        self.assertIn(" -f ", chamadas[2])
        esperado = len(re.findall(r"^SELECT cron\.schedule\(", SQL.read_text(), re.M))
        self.assertIn(f"✅ Total de jobs no destino: 33 (esperado ≥ {esperado})", r.stdout)
        self.assertEqual(Path(str(self.cap) + ".sql").read_text(),
                         SQL.read_text().replace("${PROJECT_REF}", "refteste"))
        logs = list(self.tmp.glob("cron-apply-*.log"))
        self.assertEqual(len(logs), 1)
        self.assertIn("aplicado", logs[0].read_text())

    def test_falha_do_psql_na_aplicacao_propaga(self):
        r = self.run_script(env_extra={"PSQL_APPLY_RC": "3"})
        self.assertEqual(r.returncode, 3)
        self.assertNotIn("✅", r.stdout)
        # 2× detecção do vault + 1× apply (a falha ocorre no apply)
        self.assertEqual(len(self.psql_calls()), 3)

    def test_contagem_abaixo_do_esperado_falha(self):
        # Regressão: imprimia "✅ Total ... 5 (esperado ≥ 13)" e saía 0.
        r = self.run_script(env_extra={"PSQL_COUNT": "5"})
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ Total de jobs no destino: 5", r.stderr)
        self.assertNotIn("✅", r.stdout)

    def test_contagem_nao_numerica_falha(self):
        for valor in ("", "13\nTime: 1,2 ms", "erro"):
            with self.subTest(valor=valor):
                r = self.run_script(env_extra={"PSQL_COUNT": valor})
                self.assertEqual(r.returncode, 1)
                self.assertNotIn("✅", r.stdout)

    def test_contagem_maior_que_o_esperado_passa(self):
        r = self.run_script(env_extra={"PSQL_COUNT": "40"})
        self.assertEqual(r.returncode, 0, r.stderr)

    def test_falha_na_consulta_de_contagem_propaga(self):
        r = self.run_script(env_extra={"PSQL_COUNT_RC": "2"})
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("✅", r.stdout)


class TestInterpolacao(Base):
    SQL_COM_PLACEHOLDER = (
        "SELECT cron.schedule('x', '* * * * *',\n"
        "  $cron$ SELECT net.http_post(url := 'https://${PROJECT_REF}.supabase.co/f',\n"
        "    headers := '{\"apikey\":\"${ANON_KEY}\"}'::jsonb); $cron$);\n"
        "-- ${HOME} e $USER não estão na whitelist\n"
    )

    def test_whitelist_expande_so_project_ref_e_anon_key(self):
        script = self.copia_com_sql(self.SQL_COM_PLACEHOLDER)
        r = self.run_script("--dry-run", script=script, env_extra={"USER": "fulano"})
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("https://refteste.supabase.co/f", r.stdout)
        self.assertIn('"apikey":"eyJhbGciOi.J9-_x"', r.stdout)
        self.assertIn("${HOME} e $USER", r.stdout)
        self.assertIn("$cron$", r.stdout)

    def test_valor_malicioso_em_placeholder_usado_exit2(self):
        script = self.copia_com_sql(self.SQL_COM_PLACEHOLDER)
        casos = {
            "PROJECT_REF": ["ref'; DROP TABLE x; --", "ref com espaco", "ref\nSELECT 1", "ref$cron$"],
            "ANON_KEY": ['k"}\'::jsonb); DROP TABLE x; --', "k\nDROP TABLE x;", "k k", "k'"],
        }
        for nome, valores in casos.items():
            for valor in valores:
                with self.subTest(nome=nome, valor=valor):
                    r = self.run_script(script=script, env_extra={nome: valor})
                    self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                    self.assertIn(f"{nome} inválido", r.stderr)
                    self.assertEqual(self.psql_calls(), [])

    def test_valor_estranho_nao_entra_no_sql_real(self):
        # Regressão: o comentário do cabeçalho tinha os placeholders e uma quebra
        # de linha no ANON_KEY virava SQL executável no destino.
        # Regressão: o cabeçalho tinha placeholders em comentário e uma quebra de
        # linha no ANON_KEY virava SQL executável no destino. Os placeholders de
        # comentário foram removidos; só PROJECT_REF é interpolado de fato.
        r = self.run_script(env_extra={"ANON_KEY": "k\nCREATE TABLE public.pwned(x int);"})
        self.assertEqual(r.returncode, 0, r.stderr)
        aplicado = Path(str(self.cap) + ".sql").read_text()
        self.assertNotIn("pwned", aplicado)
        self.assertEqual(aplicado, SQL.read_text().replace("${PROJECT_REF}", "refteste"))
        self.assertNotIn("k\nCREATE TABLE", aplicado)

    def test_sql_sem_cron_schedule_exit4(self):
        script = self.copia_com_sql("SELECT 1;\n")
        r = self.run_script(script=script)
        self.assertEqual(r.returncode, 4)
        self.assertEqual(self.psql_calls(), [])

    def test_sql_ausente_exit4(self):
        script = self.copia_com_sql("")
        script.with_suffix(".sql").unlink()
        r = self.run_script(script=script)
        self.assertEqual(r.returncode, 4)


class TestSqlConsistencia(unittest.TestCase):
    """O SQL fixa a contagem em três lugares; todos têm de bater com os jobs declarados."""

    @classmethod
    def setUpClass(cls):
        cls.sql = SQL.read_text()
        cls.agendados = re.findall(r"^SELECT cron\.schedule\(\s*'([^']+)',\s*'([^']+)',", cls.sql, re.M)
        cls.nomes = [n for n, _ in cls.agendados]

    def test_nomes_unicos(self):
        self.assertEqual(len(self.nomes), len(set(self.nomes)))
        self.assertGreater(len(self.nomes), 0)

    def test_todo_schedule_tem_unschedule_antes(self):
        linhas = self.sql.splitlines()
        for nome in self.nomes:
            i_un = linhas.index(f"SELECT pg_temp.safe_unschedule('{nome}');")
            self.assertEqual(linhas[i_un + 1], "SELECT cron.schedule(", nome)
            self.assertIn(f"'{nome}'", linhas[i_un + 2])
        self.assertEqual(len(re.findall(r"^SELECT pg_temp\.safe_unschedule\(", self.sql, re.M)), len(self.nomes))

    def test_expressoes_cron_tem_cinco_campos(self):
        for nome, expr in self.agendados:
            self.assertEqual(len(expr.split()), 5, f"{nome}: {expr}")

    def test_validacao_inline_bate_com_os_jobs(self):
        bloco = self.sql[self.sql.index("-- Validação inline"):]
        lista = re.search(r"jobname IN \((.*?)\);", bloco, re.S).group(1)
        self.assertEqual(sorted(re.findall(r"'([^']+)'", lista)), sorted(self.nomes))
        total = len(self.nomes)
        self.assertIn(f"IF v_count <> {total} THEN", bloco)
        self.assertIn(f"Esperado {total} jobs", bloco)
        self.assertIn(f"{total} cron jobs registrados", bloco)

    def test_cabecalho_e_comentarios_sem_placeholder_expansivel(self):
        self.assertIn(f"Recria os {len(self.nomes)} cron jobs", self.sql)
        for n, linha in enumerate(self.sql.splitlines(), 1):
            if linha.lstrip().startswith("--"):
                self.assertNotRegex(linha, r"\$\{?(PROJECT_REF|ANON_KEY)\b", f"linha {n}")

    def test_transacao_fecha(self):
        self.assertEqual(len(re.findall(r"^BEGIN;$", self.sql, re.M)), 1)
        self.assertEqual(len(re.findall(r"^COMMIT;$", self.sql, re.M)), 1)


def _pg_local():
    url = os.environ.get("PF_TEST_PG_URL", "")
    if not url or urlparse(url).hostname not in ("127.0.0.1", "localhost", "::1"):
        return None
    return url if shutil.which("psql") else None


@unittest.skipUnless(_pg_local(), "defina PF_TEST_PG_URL (Postgres local descartável) para rodar")
class TestIntegracaoPostgresLocal(Base):
    def setUp(self):
        super().setUp()
        (self.bin / "psql").unlink()  # usa o psql real
        self.url = _pg_local()
        self._psql("-c", FAKE_CRON)
        self.addCleanup(self._psql, "-c", "DROP SCHEMA IF EXISTS cron CASCADE;")

    def _psql(self, *args):
        return subprocess.run(["psql", "-X", self.url, "-v", "ON_ERROR_STOP=1", "-q", "-At", *args],
                              capture_output=True, text=True, timeout=30, check=True).stdout.strip()

    def test_aplica_e_e_idempotente(self):
        for _ in range(2):
            r = self.run_script(env_extra={"DEST_DB_URL": self.url})
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
            self.assertIn("✅ Total de jobs no destino: 33", r.stdout)
        self.assertEqual(self._psql("-c", "SELECT count(*), count(DISTINCT jobname) FROM cron.job"), "33|33")

    def test_job_extra_preexistente_e_preservado(self):
        self._psql("-c", "SELECT cron.schedule('outro-job', '* * * * *', 'SELECT 1')")
        r = self.run_script(env_extra={"DEST_DB_URL": self.url})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self._psql("-c", "SELECT count(*) FROM cron.job"), "34")

    def test_schedule_quebrado_aborta_tudo(self):
        self._psql("-c", "CREATE OR REPLACE FUNCTION cron.schedule(job_name text, schedule text, command text) "
                         "RETURNS bigint LANGUAGE plpgsql AS $f$ BEGIN IF job_name = 'pgss-weekly-baseline' THEN "
                         "RAISE EXCEPTION 'boom'; END IF; INSERT INTO cron.job(schedule, command, jobname) "
                         "VALUES (schedule, command, job_name); RETURN 1; END $f$;")
        r = self.run_script(env_extra={"DEST_DB_URL": self.url})
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("✅", r.stdout)
        self.assertEqual(self._psql("-c", "SELECT count(*) FROM cron.job"), "0")

    def test_provisiona_anon_key_no_vault(self):
        # BUG 4: anon_key ausente no vault quebra chave_anon_vault() fechada.
        # Sem o schema vault, o bloco só emite WARN e nada é gravado.
        self._psql("-c", FAKE_VAULT)
        self.addCleanup(self._psql, "-c", "DROP SCHEMA IF EXISTS vault CASCADE;")
        for _ in range(2):
            r = self.run_script(env_extra={"DEST_DB_URL": self.url, "ANON_KEY": "eyJhbGciOi.J9-_x"})
            self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        # idempotente: 2 aplicações, 1 linha, valor atual = último enviado
        self.assertEqual(self._psql("-c", "SELECT count(*) FROM vault._secrets"), "1")
        self.assertEqual(self._psql("-c", "SELECT value FROM vault._secrets"), "eyJhbGciOi.J9-_x")
        # BUG 5: quebra de linha final no secret entra no vault como caracter
        # literal e quebra chave_anon_vault(). Aplicar chave com \n final deve
        # gravar a chave já normalizada (trim do wrapper).
        r = self.run_script(env_extra={"DEST_DB_URL": self.url, "ANON_KEY": "sk-rotacionada.abc\n"})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self._psql("-c", "SELECT value FROM vault._secrets"), "sk-rotacionada.abc")

    def test_chave_terminada_em_rn_nao_e_truncada(self):
        # Devin BUG (cf4497df): sed 's/[\r\n]*$//' em modo POSIX casa as
        # letras 'r' e 'n' finais de uma chave válida e grava versão truncada
        # no vault, quebrando o apikey dos crons de conformidade. O wrapper
        # agora usa tr -d '\r\n' (remove só CR/LF — não letras).
        self._psql("-c", FAKE_VAULT)
        self.addCleanup(self._psql, "-c", "DROP SCHEMA IF EXISTS vault CASCADE;")
        # POSIXLY_CORRECT=1 reproduz o modo POSIX do GNU sed: se o trim via
        # sed voltar, a chave seria truncada e o teste falha aqui.
        r = self.run_script(env_extra={"DEST_DB_URL": self.url, "ANON_KEY": "chave-teste.rn", "POSIXLY_CORRECT": "1"})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self._psql("-c", "SELECT value FROM vault._secrets"), "chave-teste.rn")

    def test_rotaciona_anon_key_no_vault(self):
        # ANÁLISE Devin: o teste de integração não comprova rotação — duas
        # aplicações usavam o mesmo valor. Aqui a 2ª usa chave diferente e a
        # única entrada passa a conter o novo valor (update idempotente).
        self._psql("-c", FAKE_VAULT)
        self.addCleanup(self._psql, "-c", "DROP SCHEMA IF EXISTS vault CASCADE;")
        r = self.run_script(env_extra={"DEST_DB_URL": self.url, "ANON_KEY": "chave-v1.abc"})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self._psql("-c", "SELECT value FROM vault._secrets"), "chave-v1.abc")
        r = self.run_script(env_extra={"DEST_DB_URL": self.url, "ANON_KEY": "chave-v2.def"})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self._psql("-c", "SELECT count(*) FROM vault._secrets"), "1")
        self.assertEqual(self._psql("-c", "SELECT value FROM vault._secrets"), "chave-v2.def")

    def test_dry_run_nao_altera_o_banco(self):
        r = self.run_script("--dry-run", env_extra={"DEST_DB_URL": self.url})
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self._psql("-c", "SELECT count(*) FROM cron.job"), "0")


if __name__ == "__main__":
    unittest.main(verbosity=2)
