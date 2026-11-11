#!/usr/bin/env python3
"""
Cenários de scripts/migrate-functions.sh com a CLI `supabase` substituída por
um stub no PATH (nenhuma rede, nenhum projeto real).

Foco: contrato usado por .github/workflows/functions-deploy.yml — `--only`,
gate de secrets, política de JWT fail-closed, exit codes e log JSONL.
"""
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "scripts" / "migrate-functions.sh"

STUB_SUPABASE = r"""#!/usr/bin/env bash
printf '%s\n' "$*" >> "$CAP"
if [[ "$1 $2" == "secrets list" ]]; then
  if [[ -n "${SECRETS_FAIL:-}" ]]; then echo "Unauthorized" >&2; exit 1; fi
  printf '  NAME | DIGEST\n  ---- | ------\n'
  for s in ${SECRETS_PRESENT:-}; do printf '  %s | abc\n' "$s"; done
  exit 0
fi
if [[ "$1 $2" == "functions deploy" ]]; then
  for f in ${DEPLOY_FAIL:-}; do
    if [[ "$3" == "$f" ]]; then
      echo "erro ao implantar $3 \"aspas\" token=$SUPABASE_ACCESS_TOKEN"
      exit 1
    fi
  done
  echo "Deployed $3"
fi
"""

CONFIG_PADRAO = """project_id = "x"

[functions.alpha]
verify_jwt = true

[functions.beta]
verify_jwt = false

[functions.gamma]
verify_jwt = true
"""

MANIFEST_PADRAO = {
    "vars": [
        {"name": "RESEND_API_KEY", "scope": "edge", "required": True, "dest": "supabase_vault"},
        {"name": "SUPABASE_DB_URL", "scope": "edge", "required": True, "dest": "supabase_vault"},
        {"name": "OPCIONAL", "scope": "edge", "required": False, "dest": "supabase_vault"},
        {"name": "SUPABASE_URL", "scope": "edge", "required": False, "dest": "supabase_auto"},
    ]
}

TOKEN = "sbp_token_super_secreto_123"


class Sandbox:
    """Repo mínimo em diretório temporário + stub da CLI."""

    def __init__(self, functions=("beta", "gamma", "alpha"), config=CONFIG_PADRAO, manifest=MANIFEST_PADRAO):
        self.dir = Path(tempfile.mkdtemp(prefix="pf-migrate-fn-"))
        self.repo = self.dir / "repo"
        self.bin = self.dir / "bin"
        self.logs = self.dir / "logs"
        self.tmp = self.dir / "tmp"
        self.cap = self.dir / "cap.log"
        for d in (self.repo / "supabase" / "functions" / "_shared", self.bin, self.logs, self.tmp):
            d.mkdir(parents=True)
        for fn in functions:
            self.add_function(fn)
        (self.repo / "supabase" / "config.toml").write_text(config)
        if manifest is not None:
            (self.repo / "env.manifest.json").write_text(json.dumps(manifest))
        stub = self.bin / "supabase"
        stub.write_text(STUB_SUPABASE)
        stub.chmod(0o755)
        self.cap.write_text("")

    def add_function(self, name, index=True):
        d = self.repo / "supabase" / "functions" / name
        d.mkdir(parents=True, exist_ok=True)
        if index:
            (d / "index.ts").write_text("// stub\n")

    def run(self, *args, env_extra=None, drop=(), com_cli=True):
        env = {
            "PATH": (str(self.bin) + ":" if com_cli else "") + "/usr/local/bin:/usr/bin:/bin",
            "HOME": str(self.dir),
            "TMPDIR": str(self.tmp),
            "CAP": str(self.cap),
            "DEPLOY_LOG_DIR": str(self.logs),
            "SUPABASE_ACCESS_TOKEN": TOKEN,
            "SUPABASE_PROJECT_REF": "refteste",
            "REQUIRED_SECRETS": "RESEND_API_KEY",
            "SECRETS_PRESENT": "RESEND_API_KEY",
        }
        if env_extra:
            env.update(env_extra)
        for k in drop:
            env.pop(k, None)
        return subprocess.run(
            ["bash", str(SCRIPT), *args],
            capture_output=True, text=True, env=env, cwd=self.repo, timeout=30, check=False, stdin=subprocess.DEVNULL,
        )

    def calls(self):
        return [line for line in self.cap.read_text().splitlines() if line]

    def deploys(self):
        return [c for c in self.calls() if c.startswith("functions deploy")]

    def log_files(self):
        return sorted(self.logs.glob("deploy-log-*.jsonl"))

    def log(self):
        files = self.log_files()
        assert files, "nenhum log JSONL gerado"
        return [json.loads(line) for line in files[-1].read_text().splitlines() if line]

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class Base(unittest.TestCase):
    sandbox_kwargs = {}

    def setUp(self):
        self.sb = Sandbox(**self.sandbox_kwargs)
        self.addCleanup(self.sb.cleanup)


class TestArgumentosEPreflight(Base):
    def test_help_sem_env_exit0(self):
        r = self.sb.run("--help", drop=("SUPABASE_ACCESS_TOKEN", "SUPABASE_PROJECT_REF"))
        self.assertEqual(r.returncode, 0)
        self.assertIn("Uso:", r.stdout)
        self.assertIn("DEPLOY_LOG_DIR", r.stdout)
        self.assertEqual(self.sb.calls(), [])

    def test_argumento_desconhecido_exit2(self):
        r = self.sb.run("--dryrun")
        self.assertEqual(r.returncode, 2)
        self.assertIn("Argumento desconhecido", r.stderr)
        self.assertEqual(self.sb.calls(), [])

    def test_token_ausente_falha_sem_chamar_cli(self):
        for valor in (None, ""):
            with self.subTest(valor=valor):
                r = self.sb.run(
                    env_extra={} if valor is None else {"SUPABASE_ACCESS_TOKEN": valor},
                    drop=("SUPABASE_ACCESS_TOKEN",) if valor is None else (),
                )
                self.assertNotEqual(r.returncode, 0)
                self.assertIn("SUPABASE_ACCESS_TOKEN é obrigatório", r.stderr)
                self.assertEqual(self.sb.calls(), [])

    def test_project_ref_ausente_falha(self):
        r = self.sb.run(drop=("SUPABASE_PROJECT_REF",))
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("SUPABASE_PROJECT_REF é obrigatório", r.stderr)

    def test_cli_ausente_exit3(self):
        if shutil.which("supabase", path="/usr/local/bin:/usr/bin:/bin"):
            self.skipTest("supabase CLI real instalada no sistema")
        r = self.sb.run(com_cli=False)
        self.assertEqual(r.returncode, 3)
        self.assertIn("supabase CLI não encontrado", r.stderr)

    def test_pasta_functions_inexistente_exit4(self):
        r = self.sb.run(env_extra={"FUNCTIONS_DIR": "nao/existe"})
        self.assertEqual(r.returncode, 4)
        self.assertEqual(self.sb.calls(), [])

    def test_pasta_sem_nenhuma_function_exit4(self):
        vazia = self.sb.repo / "vazia"
        vazia.mkdir()
        r = self.sb.run(env_extra={"FUNCTIONS_DIR": "vazia"})
        self.assertEqual(r.returncode, 4, r.stderr)
        self.assertIn("Nenhuma function", r.stderr)

    def test_pasta_de_log_inexistente_exit4(self):
        r = self.sb.run(env_extra={"DEPLOY_LOG_DIR": str(self.sb.dir / "nao-existe")})
        self.assertEqual(r.returncode, 4)
        self.assertEqual(self.sb.deploys(), [])


class TestOnly(Base):
    def test_only_vazio_nao_vira_deploy_de_tudo(self):
        # Regressão: `--only ""` implantava TODAS as functions.
        r = self.sb.run("--only", "")
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
        self.assertIn("lista vazia", r.stderr)
        self.assertEqual(self.sb.calls(), [])

    def test_only_so_virgulas_e_espacos_exit2(self):
        for valor in (",,", " , ", "   "):
            with self.subTest(valor=valor):
                r = self.sb.run("--only", valor)
                self.assertEqual(r.returncode, 2)
                self.assertEqual(self.sb.calls(), [])

    def test_only_sem_valor_exit2_com_mensagem(self):
        r = self.sb.run("--only")
        self.assertEqual(r.returncode, 2)
        self.assertIn("--only exige", r.stderr)
        self.assertNotIn("unbound variable", r.stderr)

    def test_only_apara_espacos(self):
        r = self.sb.run("--only", " alpha , beta ")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.deploys(), [
            "functions deploy alpha --project-ref refteste",
            "functions deploy beta --project-ref refteste --no-verify-jwt",
        ])

    def test_only_duplicado_implanta_uma_vez(self):
        r = self.sb.run("--only", "alpha,alpha,alpha,")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.deploys(), ["functions deploy alpha --project-ref refteste"])
        self.assertEqual(self.sb.log()[-1]["total"], 1)

    def test_only_preserva_ordem_informada(self):
        self.sb.run("--only", "gamma,alpha")
        self.assertEqual([c.split()[2] for c in self.sb.deploys()], ["gamma", "alpha"])

    def test_only_nome_invalido_exit2(self):
        for nome in ("a;b", "../alpha", ".*", "alpha beta", "$(id)", "alpha/index", "ação"):
            with self.subTest(nome=nome):
                r = self.sb.run("--only", nome)
                self.assertEqual(r.returncode, 2, r.stderr)
                self.assertIn("inválido", r.stderr)
                self.assertEqual(self.sb.calls(), [])

    def test_only_inexistente_exit4(self):
        r = self.sb.run("--only", "alpha,fantasma")
        self.assertEqual(r.returncode, 4)
        self.assertIn("'fantasma' não existe", r.stderr)
        self.assertEqual(self.sb.deploys(), [])

    def test_only_pasta_sem_index_exit4(self):
        self.sb.add_function("semindex", index=False)
        r = self.sb.run("--only", "semindex")
        self.assertEqual(r.returncode, 4)

    def test_only_sem_bloco_no_config_exit6(self):
        self.sb.add_function("nova")
        r = self.sb.run("--only", "nova")
        self.assertEqual(r.returncode, 6)
        self.assertIn("nova", r.stderr)
        self.assertEqual(self.sb.deploys(), [])
        self.assertEqual(self.sb.log()[-1]["missing"], ["nova"])

    def test_only_nao_avisa_funcoes_fora_do_lote(self):
        # Regressão: todo deploy unitário listava o config.toml inteiro como aviso.
        r = self.sb.run("--only", "alpha")
        self.assertEqual(r.returncode, 0)
        self.assertNotIn("fora do lote", r.stderr)
        cobertura = [e for e in self.sb.log() if e["event"] == "config_coverage"]
        self.assertEqual(cobertura[0]["status"], "ok")

    def test_only_sem_required_secrets_nao_consulta_secrets(self):
        r = self.sb.run("--only", "alpha", drop=("REQUIRED_SECRETS",))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.calls(), ["functions deploy alpha --project-ref refteste"])


class TestLoteCompleto(Base):
    def test_ordem_deterministica_e_flags_jwt(self):
        r = self.sb.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.calls(), [
            "secrets list --project-ref refteste",
            "functions deploy alpha --project-ref refteste",
            "functions deploy beta --project-ref refteste --no-verify-jwt",
            "functions deploy gamma --project-ref refteste",
        ])
        resumo = self.sb.log()[-1]
        self.assertEqual((resumo["event"], resumo["total"], resumo["ok"], resumo["failed"]), ("summary", 3, 3, 0))

    def test_ignora_shared_ocultas_e_pastas_sem_index(self):
        self.sb.add_function(".oculta")
        self.sb.add_function("rascunho", index=False)
        (self.sb.repo / "supabase" / "functions" / "solto_test.ts").write_text("//\n")
        r = self.sb.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(self.sb.deploys()), 3)

    def test_dry_run_nao_implanta(self):
        r = self.sb.run("--dry-run")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.deploys(), [])
        eventos = [e for e in self.sb.log() if e["event"] == "deploy"]
        self.assertEqual([e["status"] for e in eventos], ["dry-run"] * 3)
        self.assertEqual({e["fn"]: e["flag"] for e in eventos},
                         {"alpha": "jwt-padrao", "beta": "--no-verify-jwt", "gamma": "jwt-padrao"})
        self.assertIn("Dry-run: sim", r.stdout)

    def test_function_sem_bloco_exit6_antes_de_qualquer_deploy(self):
        self.sb.add_function("sem-bloco")
        r = self.sb.run()
        self.assertEqual(r.returncode, 6)
        self.assertIn("sem-bloco", r.stderr)
        self.assertEqual(self.sb.deploys(), [])

    def test_bloco_orfao_no_config_apenas_avisa(self):
        cfg = self.sb.repo / "supabase" / "config.toml"
        cfg.write_text(cfg.read_text() + "\n[functions.orfa]\nverify_jwt = true\n")
        r = self.sb.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("fora do lote", r.stderr)
        self.assertIn("orfa", r.stderr)
        cobertura = [e for e in self.sb.log() if e["event"] == "config_coverage"][0]
        self.assertEqual((cobertura["status"], cobertura["extra"]), ("warning", ["orfa"]))

    def test_falha_no_meio_continua_e_sai_1(self):
        r = self.sb.run(env_extra={"DEPLOY_FAIL": "beta"})
        self.assertEqual(r.returncode, 1)
        self.assertEqual(len(self.sb.deploys()), 3)
        log = self.sb.log()
        self.assertEqual({e["fn"]: e["status"] for e in log if e["event"] == "deploy"},
                         {"alpha": "ok", "beta": "failed", "gamma": "ok"})
        self.assertEqual((log[-1]["ok"], log[-1]["failed"]), (2, 1))
        self.assertIn("Falhas:  1", r.stdout)

    def test_stop_on_fail_interrompe_e_registra_pendentes(self):
        self.sb.add_function("delta")
        cfg = self.sb.repo / "supabase" / "config.toml"
        cfg.write_text(cfg.read_text() + "\n[functions.delta]\nverify_jwt = true\n")
        r = self.sb.run(env_extra={"DEPLOY_FAIL": "beta", "STOP_ON_FAIL": "1"})
        self.assertEqual(r.returncode, 1)
        self.assertEqual([c.split()[2] for c in self.sb.deploys()], ["alpha", "beta"])
        self.assertIn("--only delta,gamma", r.stderr)
        parada = [e for e in self.sb.log() if e["event"] == "stopped"]
        self.assertEqual(parada[0]["pending"], ["delta", "gamma"])
        self.assertEqual(self.sb.log()[-1]["event"], "summary")

    def test_stop_on_fail_na_ultima_nao_lista_pendentes(self):
        r = self.sb.run(env_extra={"DEPLOY_FAIL": "gamma", "STOP_ON_FAIL": "1"})
        self.assertEqual(r.returncode, 1)
        self.assertNotIn("Não tentadas", r.stderr)
        self.assertEqual([e for e in self.sb.log() if e["event"] == "stopped"], [])

    def test_token_nao_vaza_para_o_log_de_erro(self):
        r = self.sb.run(env_extra={"DEPLOY_FAIL": "alpha"})
        self.assertEqual(r.returncode, 1)
        bruto = self.sb.log_files()[-1].read_text()
        self.assertNotIn(TOKEN, bruto)
        erro = [e for e in self.sb.log() if e.get("status") == "failed"][0]["error"]
        self.assertIn('erro ao implantar alpha "aspas" token=***', erro)
        self.assertNotIn(TOKEN, r.stdout + r.stderr)

    def test_log_unico_por_execucao_e_jsonl_valido(self):
        # Regressão: duas execuções no mesmo minuto truncavam o mesmo arquivo.
        self.sb.run()
        self.sb.run("--dry-run")
        arquivos = self.sb.log_files()
        self.assertEqual(len(arquivos), 2)
        for arq in arquivos:
            linhas = [json.loads(l) for l in arq.read_text().splitlines()]
            self.assertEqual(linhas[-1]["event"], "summary")
            for linha in linhas:
                self.assertTrue({"ts", "event", "fn", "status"} <= set(linha))

    def test_nao_deixa_temporarios(self):
        self.sb.run(env_extra={"DEPLOY_FAIL": "beta"})
        self.sb.run(env_extra={"SECRETS_FAIL": "1"})
        self.assertEqual(list(self.sb.tmp.iterdir()), [])


class TestPoliticaJwt(Base):
    def _config(self, corpo):
        (self.sb.repo / "supabase" / "config.toml").write_text(corpo)

    def test_verify_jwt_ausente_recusa_so_aquela_function(self):
        self._config("[functions.alpha]\n\n[functions.beta]\nverify_jwt = false\n\n[functions.gamma]\nverify_jwt = true\n")
        r = self.sb.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("alpha: verify_jwt ausente", r.stderr)
        self.assertEqual([c.split()[2] for c in self.sb.deploys()], ["beta", "gamma"])
        falha = [e for e in self.sb.log() if e.get("status") == "failed"][0]
        self.assertEqual(falha["reason"], "verify_jwt_missing")

    def test_verify_jwt_invalido_recusa(self):
        for valor in ('"true"', "TRUE", "1", "yes"):
            with self.subTest(valor=valor):
                self._config(f"[functions.alpha]\nverify_jwt = {valor}\n")
                self.sb.cap.write_text("")
                r = self.sb.run("--only", "alpha")
                self.assertEqual(r.returncode, 1)
                self.assertIn("verify_jwt inválido", r.stderr)
                self.assertEqual(self.sb.deploys(), [])

    def test_verify_jwt_com_comentario_inline_e_espacos(self):
        self._config("[functions.alpha]\n  verify_jwt=false   # webhook público\n\n[functions.beta]\nverify_jwt  =  true # padrão\n")
        r = self.sb.run("--only", "alpha,beta")
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.deploys(), [
            "functions deploy alpha --project-ref refteste --no-verify-jwt",
            "functions deploy beta --project-ref refteste",
        ])

    def test_verify_jwt_de_outro_bloco_nao_vaza(self):
        # alpha sem verify_jwt; a chave seguinte pertence a outra seção.
        self._config("[functions.alpha]\nimport_map = \"x\"\n\n[auth]\nverify_jwt = false\n")
        r = self.sb.run("--only", "alpha")
        self.assertEqual(r.returncode, 1)
        self.assertEqual(self.sb.deploys(), [])

    def test_nome_com_ponto_nao_herda_politica_de_bloco_parecido(self):
        # Regressão: o nome virava regex e `a.c` casava o bloco [functions.abc].
        for fn in ("abc", "a.c"):
            self.sb.add_function(fn)
        self._config(
            "[functions.abc]\nverify_jwt = false\n\n[functions.a.c]\nverify_jwt = true\n\n"
            "[functions.alpha]\nverify_jwt = true\n\n[functions.beta]\nverify_jwt = false\n\n"
            "[functions.gamma]\nverify_jwt = true\n"
        )
        r = self.sb.run()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("functions deploy a.c --project-ref refteste", self.sb.deploys())
        self.assertIn("functions deploy abc --project-ref refteste --no-verify-jwt", self.sb.deploys())


class TestGateDeSecrets(Base):
    def test_secret_faltando_exit5_sem_deploy(self):
        r = self.sb.run(env_extra={"REQUIRED_SECRETS": "RESEND_API_KEY, FALTA_UM"})
        self.assertEqual(r.returncode, 5)
        self.assertIn("FALTA_UM", r.stderr)
        self.assertEqual(self.sb.deploys(), [])
        self.assertEqual(self.sb.log()[-1]["missing"], ["FALTA_UM"])

    def test_nome_e_literal_nao_regex(self):
        # Regressão: "RESEND.API.KEY" casava RESEND_API_KEY e aprovava o gate.
        r = self.sb.run(env_extra={"REQUIRED_SECRETS": "RESEND.API.KEY"})
        self.assertEqual(r.returncode, 5)
        self.assertEqual(self.sb.deploys(), [])

    def test_prefixo_nao_basta(self):
        r = self.sb.run(env_extra={"REQUIRED_SECRETS": "RESEND_API"})
        self.assertEqual(r.returncode, 5)

    def test_lista_so_com_separadores_nao_aprova_gate(self):
        # Regressão: " , " não checava nada e imprimia "todos presentes".
        r = self.sb.run(env_extra={"REQUIRED_SECRETS": " , "})
        self.assertEqual(r.returncode, 5)
        self.assertNotIn("✅ Todos os secrets", r.stdout)
        self.assertEqual(self.sb.deploys(), [])

    def test_log_registra_nomes_aparados(self):
        r = self.sb.run("--dry-run", env_extra={
            "REQUIRED_SECRETS": " RESEND_API_KEY ,, OUTRO ", "SECRETS_PRESENT": "RESEND_API_KEY OUTRO"})
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.log()[0]["checked"], ["RESEND_API_KEY", "OUTRO"])

    def test_falha_da_cli_avisa_e_bloqueia(self):
        r = self.sb.run(env_extra={"SECRETS_FAIL": "1"})
        self.assertEqual(r.returncode, 5)
        self.assertIn("retornou erro", r.stderr)
        self.assertIn("Unauthorized", r.stderr)
        self.assertEqual(self.sb.deploys(), [])

    def test_sem_env_usa_manifest_e_ignora_supabase_reservado(self):
        r = self.sb.run("--dry-run", drop=("REQUIRED_SECRETS",))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(self.sb.log()[0]["checked"], ["RESEND_API_KEY"])

    def test_sem_env_e_manifest_ausente_exit5(self):
        (self.sb.repo / "env.manifest.json").unlink()
        r = self.sb.run(drop=("REQUIRED_SECRETS",))
        self.assertEqual(r.returncode, 5)
        self.assertIn("gate não pode ser pulado", r.stderr)
        self.assertEqual(self.sb.calls(), [])

    def test_sem_env_e_manifest_invalido_exit5(self):
        (self.sb.repo / "env.manifest.json").write_text("{nao é json")
        r = self.sb.run(drop=("REQUIRED_SECRETS",))
        self.assertEqual(r.returncode, 5)

    def test_sem_env_e_manifest_sem_required_exit5(self):
        (self.sb.repo / "env.manifest.json").write_text('{"vars": []}')
        r = self.sb.run(drop=("REQUIRED_SECRETS",))
        self.assertEqual(r.returncode, 5)


if __name__ == "__main__":
    unittest.main(verbosity=2)
