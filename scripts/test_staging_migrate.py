#!/usr/bin/env python3
"""
Cenários de scripts/staging-migrate.sh (orquestrador de promoção para staging).

O orquestrador é copiado para uma árvore temporária junto com os scripts REAIS
migrate-functions.sh e migrate-cron-jobs.sh; os sub-scripts de outras pastas
(integrity, healthcheck, data-migrate) e as CLIs (supabase, psql, envsubst,
curl) são stubs que registram cada chamada. Nenhuma rede, nenhum banco.
"""
import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = REPO_ROOT / "scripts"
SISTEMA = "/usr/local/bin:/usr/bin:/bin"

STUB_SUPABASE = r"""#!/usr/bin/env bash
printf 'supabase %s\n' "$*" >> "$CAP"
if [[ "$1 $2" == "secrets list" ]]; then
  [[ -n "${SECRETS_FAIL:-}" ]] && { echo "Unauthorized" >&2; exit 1; }
  printf '  NAME | DIGEST\n  ---- | ------\n'
  for s in ${SECRETS_PRESENT:-}; do printf '  %s | abc\n' "$s"; done
  exit 0
fi
if [[ "$1 $2" == "db push" ]]; then exit "${DB_PUSH_RC:-0}"; fi
if [[ "$1 $2" == "functions deploy" ]]; then
  for f in ${DEPLOY_FAIL:-}; do [[ "$3" == "$f" ]] && exit 1; done
fi
exit 0
"""

# Só consome stdin quando o SQL vem por heredoc (sem -f/-c), como o psql real.
STUB_PSQL = r"""#!/usr/bin/env bash
printf 'psql %s\n' "$*" >> "$CAP"
for a in "$@"; do
  [[ "$a" == "-Atc" ]] && { echo 13; exit 0; }
  [[ "$a" == "-f" || "$a" == "-c" ]] && exit 0
done
cat >/dev/null
exit 0
"""

STUB_ENVSUBST = "#!/usr/bin/env bash\ncat\n"
STUB_CURL = "#!/usr/bin/env bash\nexit 0\n"

# Sub-script de outra família: registra argumentos + env recebido e sai com o
# código pedido em <NOME>_RC.
SUB_SCRIPT = r"""#!/usr/bin/env bash
nome="__NOME__"
printf 'sub:%s args=[%s] STAGING_DB_URL=%s STAGING_PROJECT_REF=%s PROD_DB_URL=%s PROD_PROJECT_REF=%s\n' \
  "$nome" "$*" "${STAGING_DB_URL:-}" "${STAGING_PROJECT_REF:-}" "${PROD_DB_URL:-}" "${PROD_PROJECT_REF:-}" >> "$CAP"
echo '{"step":"x","assertion":"y","status":"pass"}'
rc_var="$(echo "${nome}_RC" | tr 'a-z-' 'A-Z_')"
exit "${!rc_var:-0}"
"""

PASSOS_COMPLETOS = ["preflight", "baseline", "schema", "secrets", "functions", "crons", "integrity", "healthcheck", "summary"]


class Base(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix="pf-staging-migrate-"))
        self.addCleanup(shutil.rmtree, self.dir, True)
        self.root = self.dir / "repo"
        self.bin = self.dir / "bin"
        self.logs = self.dir / "logs"
        self.cap = self.dir / "cap.log"
        for d in (self.root / "scripts", self.bin, self.logs, self.dir / "tmp"):
            d.mkdir(parents=True)
        self.cap.write_text("")
        for nome in ("staging-migrate.sh", "migrate-functions.sh", "migrate-cron-jobs.sh", "migrate-cron-jobs.sql"):
            shutil.copy(SCRIPTS / nome, self.root / "scripts" / nome)
        for rel, nome in (("integrity/dump-baseline.sh", "baseline"), ("integrity/run.sh", "integrity"),
                          ("healthcheck/run.sh", "healthcheck"), ("data-migrate.sh", "data")):
            alvo = self.root / "scripts" / rel
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text(SUB_SCRIPT.replace("__NOME__", nome))
        for fn, jwt in (("alpha", "true"), ("beta", "false")):
            d = self.root / "supabase" / "functions" / fn
            d.mkdir(parents=True)
            (d / "index.ts").write_text("//\n")
        (self.root / "supabase" / "config.toml").write_text(
            "[functions.alpha]\nverify_jwt = true\n\n[functions.beta]\nverify_jwt = false\n")
        for nome, corpo in (("supabase", STUB_SUPABASE), ("psql", STUB_PSQL), ("envsubst", STUB_ENVSUBST), ("curl", STUB_CURL)):
            self._stub(nome, corpo)

    def _stub(self, nome, corpo):
        alvo = self.bin / nome
        alvo.write_text(corpo)
        alvo.chmod(0o755)

    def run_script(self, *args, env_extra=None, drop=()):
        env = {
            "PATH": f"{self.bin}:{SISTEMA}",
            "HOME": str(self.dir),
            "TMPDIR": str(self.dir / "tmp"),
            "CAP": str(self.cap),
            "STAGING_LOG_DIR": str(self.logs),
            "DEPLOY_LOG_DIR": str(self.logs),
            "PROD_DB_URL": "postgresql://prod/db",
            "STAGING_DB_URL": "postgresql://staging/db",
            "STAGING_PROJECT_REF": "refstaging",
            "STAGING_ANON_KEY": "anon.staging-key",
            "SUPABASE_ACCESS_TOKEN": "sbp_teste",
            "REQUIRED_SECRETS": "RESEND_API_KEY,OUTRO",
            "SECRETS_PRESENT": "RESEND_API_KEY OUTRO",
            "PROD_PROJECT_REF": "refprod",
        }
        if env_extra:
            env.update(env_extra)
        for k in drop:
            env.pop(k, None)
        # cwd = raiz falsa: migrate-functions.sh resolve supabase/ a partir do cwd,
        # como no workflow (que roda da raiz do repositório).
        return subprocess.run(["bash", str(self.root / "scripts" / "staging-migrate.sh"), *args],
                              capture_output=True, text=True, env=env, cwd=self.root, timeout=60, check=False, stdin=subprocess.DEVNULL)

    def calls(self):
        return [l for l in self.cap.read_text().splitlines() if l]

    def jsonl(self):
        arquivos = sorted(self.logs.glob("staging-migrate-*.jsonl"))
        self.assertEqual(len(arquivos), 1, "esperado exatamente um log do orquestrador")
        return [json.loads(l) for l in arquivos[0].read_text().splitlines() if l]

    def status(self):
        """Último status registrado por passo, na ordem de aparição."""
        visto = {}
        for linha in self.jsonl():
            visto[linha["step"]] = linha["status"]
        return visto

    def assert_falhou_em(self, r, passo, trecho):
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        ultima = self.jsonl()[-1]
        self.assertEqual((ultima["step"], ultima["status"]), (passo, "fail"))
        self.assertIn(trecho, ultima["detail"])
        self.assertIn(f"❌ {passo} falhou", r.stderr)
        self.assertNotIn("staging-migrate concluído", r.stdout)


class TestArgumentos(Base):
    def test_help_lista_todas_as_flags_aceitas(self):
        r = self.run_script("--help", drop=("PROD_DB_URL", "STAGING_DB_URL"))
        self.assertEqual(r.returncode, 0)
        self.assertIn("Uso:", r.stdout)
        fonte = (SCRIPTS / "staging-migrate.sh").read_text()
        aceitas = set(re.findall(r"^\s+(--[a-z-]+)\) [A-Z_]+=1 ;;", fonte, re.M))
        self.assertGreaterEqual(len(aceitas), 8)
        for flag in aceitas:
            self.assertIn(flag, r.stdout, f"{flag} aceita mas ausente do --help")
        self.assertEqual(list(self.logs.iterdir()), [])

    def test_flag_desconhecida_exit2_sem_efeito(self):
        r = self.run_script("--dry-run", "--dryrun")
        self.assertEqual(r.returncode, 2)
        self.assertIn("Flag desconhecida: --dryrun", r.stderr)
        self.assertEqual(self.calls(), [])
        self.assertEqual(list(self.logs.iterdir()), [])

    def test_pasta_de_log_inexistente_falha_antes_de_tudo(self):
        r = self.run_script(env_extra={"STAGING_LOG_DIR": str(self.dir / "nao-existe")})
        self.assertEqual(r.returncode, 1)
        self.assertIn("pasta de log não existe", r.stderr)
        self.assertEqual(self.calls(), [])


class TestPreflight(Base):
    def test_env_obrigatoria_ausente(self):
        for nome in ("PROD_DB_URL", "STAGING_DB_URL", "STAGING_PROJECT_REF", "STAGING_ANON_KEY",
                     "SUPABASE_ACCESS_TOKEN", "REQUIRED_SECRETS"):
            with self.subTest(nome=nome):
                shutil.rmtree(self.logs)
                self.logs.mkdir()
                r = self.run_script(drop=(nome,))
                self.assert_falhou_em(r, "preflight", f"env {nome} ausente")
                self.assertEqual(self.calls(), [])

    def test_binario_faltando(self):
        (self.bin / "supabase").unlink()
        if shutil.which("supabase", path=SISTEMA):
            self.skipTest("supabase CLI real instalada no sistema")
        r = self.run_script()
        self.assert_falhou_em(r, "preflight", "binário faltando: supabase")

    def test_guard_rail_ref_de_producao(self):
        r = self.run_script(env_extra={"STAGING_PROJECT_REF": "refprod"})
        self.assert_falhou_em(r, "preflight", "STAGING_PROJECT_REF == PROD_PROJECT_REF")
        self.assertEqual(self.calls(), [])

    def test_guard_rail_mesma_url_de_banco(self):
        # Regressão: só o ref era comparado; schema/crons seguem STAGING_DB_URL.
        r = self.run_script(env_extra={"STAGING_DB_URL": "postgresql://prod/db"})
        self.assert_falhou_em(r, "preflight", "STAGING_DB_URL == PROD_DB_URL")
        self.assertEqual(self.calls(), [])

    def test_guard_rail_url_de_staging_com_ref_de_producao(self):
        r = self.run_script(env_extra={"STAGING_DB_URL": "postgresql://postgres.refprod:pw@pooler:6543/postgres"})
        self.assert_falhou_em(r, "preflight", "contém PROD_PROJECT_REF")
        self.assertEqual(self.calls(), [])

    def test_sem_prod_project_ref_ainda_compara_urls(self):
        r = self.run_script(env_extra={"STAGING_DB_URL": "postgresql://prod/db"}, drop=("PROD_PROJECT_REF",))
        self.assert_falhou_em(r, "preflight", "STAGING_DB_URL == PROD_DB_URL")


class TestFluxoCompleto(Base):
    def test_ordem_dos_passos_e_contrato_dos_subscripts(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(list(self.status()), PASSOS_COMPLETOS)
        self.assertTrue(all(v == "ok" for v in self.status().values()), self.status())
        c = self.calls()
        self.assertTrue(c[0].startswith("sub:baseline"), c[0])
        self.assertIn("supabase db push --db-url postgresql://staging/db", c)
        self.assertIn("supabase secrets list --project-ref refstaging", c)
        # functions: ref de STAGING, política de JWT do config.toml
        self.assertIn("supabase functions deploy alpha --project-ref refstaging", c)
        self.assertIn("supabase functions deploy beta --project-ref refstaging --no-verify-jwt", c)
        # crons: aplica no banco de STAGING (regressão do #258: env errado)
        aplica = [x for x in c if x.startswith("psql") and " -f " in x]
        self.assertEqual(len(aplica), 1)
        self.assertIn("postgresql://staging/db", aplica[0])
        self.assertFalse(any("postgresql://prod/db" in x for x in c if x.startswith("psql")))
        integ = [x for x in c if x.startswith("sub:integrity")][0]
        self.assertIn("args=[--json-only]", integ)
        self.assertIn("STAGING_DB_URL=postgresql://staging/db STAGING_PROJECT_REF=refstaging", integ)
        self.assertIn("args=[--json-only]", [x for x in c if x.startswith("sub:healthcheck")][0])
        self.assertFalse(any(x.startswith("sub:data") for x in c))
        # ordem real de execução
        ordem = [i for i, x in enumerate(c) if x.startswith(("sub:baseline", "supabase db push", "supabase functions deploy alpha", "sub:integrity", "sub:healthcheck"))]
        self.assertEqual(ordem, sorted(ordem))
        self.assertEqual(len(ordem), 5)
        self.assertEqual(len(list(self.logs.glob("integrity-*.jsonl"))), 1)
        self.assertEqual(len(list(self.logs.glob("healthcheck-*.jsonl"))), 1)
        self.assertIn("✅ staging-migrate concluído", r.stdout)

    def test_stdout_e_jsonl_valido_ate_o_resumo(self):
        self.run_script("--skip-baseline")
        linhas = self.jsonl()
        for linha in linhas:
            self.assertEqual(set(linha), {"ts", "step", "status", "detail"})
        self.assertEqual((linhas[-1]["step"], linhas[-1]["status"]), ("summary", "ok"))
        self.assertIn("staging-migrate-", linhas[-1]["detail"])

    def test_dry_run_nao_escreve_em_staging(self):
        r = self.run_script("--dry-run")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        st = self.status()
        self.assertEqual((st["baseline"], st["schema"], st["healthcheck"]), ("skipped", "skipped", "skipped"))
        self.assertEqual((st["functions"], st["crons"], st["integrity"]), ("ok", "ok", "ok"))
        c = self.calls()
        self.assertFalse(any(x.startswith(("sub:baseline", "sub:healthcheck", "supabase db push", "supabase functions deploy", "psql")) for x in c), c)
        self.assertTrue(any(x.startswith("sub:integrity") for x in c))

    def test_only_functions_vira_only(self):
        r = self.run_script("--skip-baseline", env_extra={"ONLY_FUNCTIONS": "beta"})
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        deploys = [x for x in self.calls() if x.startswith("supabase functions deploy")]
        self.assertEqual(deploys, ["supabase functions deploy beta --project-ref refstaging --no-verify-jwt"])


class TestFlagsDeEscopo(Base):
    def _roda(self, *flags):
        r = self.run_script(*flags)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        return self.status(), self.calls()

    def test_skip_baseline(self):
        st, c = self._roda("--skip-baseline")
        self.assertEqual(st["baseline"], "skipped")
        self.assertFalse(any(x.startswith("sub:baseline") for x in c))

    def test_skip_schema(self):
        st, c = self._roda("--skip-schema")
        self.assertEqual(st["schema"], "skipped")
        self.assertFalse(any("db push" in x for x in c))
        self.assertTrue(any(x.startswith("supabase functions deploy") for x in c))

    def test_skip_functions(self):
        st, c = self._roda("--skip-functions")
        self.assertEqual(st["functions"], "skipped")
        self.assertFalse(any(x.startswith("supabase functions deploy") for x in c))
        self.assertTrue(any("db push" in x for x in c))

    def test_skip_crons(self):
        st, c = self._roda("--skip-crons")
        self.assertEqual(st["crons"], "skipped")
        self.assertFalse(any(x.startswith("psql") and " -f " in x for x in c))

    def test_skip_healthcheck(self):
        st, c = self._roda("--skip-healthcheck")
        self.assertEqual(st["healthcheck"], "skipped")
        self.assertFalse(any(x.startswith("sub:healthcheck") for x in c))

    def test_only_integrity_pula_fases_de_escrita(self):
        st, c = self._roda("--only-integrity")
        self.assertEqual(list(st), ["preflight", "baseline", "integrity", "healthcheck", "summary"])
        self.assertEqual(st["baseline"], "skipped")
        self.assertEqual([x.split()[0] for x in c], ["sub:integrity", "sub:healthcheck"])

    def test_with_data_passa_yes_e_alvos(self):
        st, c = self._roda("--with-data", "--skip-baseline")
        self.assertEqual(st["data"], "ok")
        dados = [x for x in c if x.startswith("sub:data")]
        self.assertEqual(len(dados), 1)
        self.assertIn("args=[--yes]", dados[0])
        self.assertIn("PROD_DB_URL=postgresql://prod/db PROD_PROJECT_REF=refprod", dados[0])

    def test_with_data_em_dry_run_nao_confirma(self):
        _, c = self._roda("--with-data", "--dry-run")
        self.assertIn("args=[--dry-run]", [x for x in c if x.startswith("sub:data")][0])


class TestFalhas(Base):
    def test_secret_faltando_interrompe_antes_do_deploy(self):
        r = self.run_script(env_extra={"SECRETS_PRESENT": "RESEND_API_KEY"})
        self.assert_falhou_em(r, "secrets", "faltando: OUTRO")
        self.assertFalse(any(x.startswith("supabase functions deploy") for x in self.calls()))

    def test_falha_da_cli_de_secrets_nao_vira_lista_de_faltantes(self):
        # Regressão: erro de token/rede aparecia como "faltando: <todos>".
        r = self.run_script(env_extra={"SECRETS_FAIL": "1"})
        self.assert_falhou_em(r, "secrets", "supabase secrets list falhou")
        self.assertNotIn("faltando:", self.jsonl()[-1]["detail"])

    def test_required_secrets_so_com_separadores(self):
        r = self.run_script(env_extra={"REQUIRED_SECRETS": " , ,"})
        self.assert_falhou_em(r, "secrets", "nenhum nome válido")

    def test_nome_de_secret_e_literal(self):
        r = self.run_script(env_extra={"REQUIRED_SECRETS": "RESEND.API.KEY"})
        self.assert_falhou_em(r, "secrets", "faltando: RESEND.API.KEY")

    def test_falha_no_baseline(self):
        r = self.run_script(env_extra={"BASELINE_RC": "1"})
        self.assert_falhou_em(r, "baseline", "dump-baseline falhou")
        self.assertEqual(len(self.calls()), 1)

    def test_falha_no_db_push(self):
        r = self.run_script(env_extra={"DB_PUSH_RC": "1"})
        self.assert_falhou_em(r, "schema", "supabase db push falhou")
        self.assertFalse(any(x.startswith("supabase secrets") for x in self.calls()))

    def test_falha_no_deploy_interrompe_antes_dos_crons(self):
        r = self.run_script(env_extra={"DEPLOY_FAIL": "alpha"})
        self.assert_falhou_em(r, "functions", "migrate-functions falhou")
        c = self.calls()
        self.assertFalse(any(x.startswith("psql") and " -f " in x for x in c), c)
        self.assertFalse(any(x.startswith(("sub:integrity", "sub:healthcheck")) for x in c), c)

    def test_falha_na_integridade_interrompe_antes_do_healthcheck(self):
        r = self.run_script(env_extra={"INTEGRITY_RC": "3"})
        self.assert_falhou_em(r, "integrity", "assertions falharam")
        self.assertIn(str(self.logs), self.jsonl()[-1]["detail"])
        self.assertFalse(any(x.startswith("sub:healthcheck") for x in self.calls()))

    def test_falha_no_healthcheck(self):
        r = self.run_script(env_extra={"HEALTHCHECK_RC": "2"})
        self.assert_falhou_em(r, "healthcheck", "assertions falharam")

    def test_falha_no_data_migrate(self):
        r = self.run_script("--with-data", env_extra={"DATA_RC": "1"})
        self.assert_falhou_em(r, "data", "data-migrate falhou")
        self.assertFalse(any(x.startswith("sub:integrity") for x in self.calls()))


if __name__ == "__main__":
    unittest.main(verbosity=2)
