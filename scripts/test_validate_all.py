#!/usr/bin/env python3
"""
Cenários de scripts/validate-all.sh (smoke-test agregador).

O script é copiado para uma árvore falsa (`<tmp>/scripts/`) com scripts
mínimos, de modo que cada cenário controla exatamente o que passa e o que
falha. Foco: nenhum passo falho pode virar PASS/SKIP, o resumo sempre sai e o
exit code reflete o total de FAIL.
"""
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPT = REPO_ROOT / "scripts" / "validate-all.sh"

# Saída grande DEPOIS do marcador de sucesso: reproduz o SIGPIPE de
# `cmd | grep -q` sob pipefail (o grep sai no 1º match e o script ainda escreve).
RUIDO = "head -c 400000 /dev/zero | tr '\\0' 'x'; echo\n"

ZOD_FALSO = r"""#!/usr/bin/env bash
if [[ "${1:-}" == "--help" ]]; then echo "Uso: zod-coverage.sh (BASELINE_FILE)"; exit 0; fi
if [[ ! -f "$BASELINE_FILE" ]]; then echo 0 > "$BASELINE_FILE"; exit 0; fi
b="$(tr -d '[:space:]' < "$BASELINE_FILE")"
[[ "$b" =~ ^[0-9]+$ ]] || exit 2
if [[ "$b" -eq 0 ]]; then echo "❌ Regressão (baseline 0)"; exit 1; fi
echo "✅ Sem regressão (baseline $b)"
""" + RUIDO

REPLAY_FALSO = r"""#!/usr/bin/env bash
if [[ "${1:-}" == "--help" ]]; then echo "Uso: test-migration-replay-safety.sh"; exit 0; fi
echo "OK: migrations sem padrões proibidos"
""" + RUIDO


class Arvore:
    def __init__(self):
        self.dir = Path(tempfile.mkdtemp(prefix="pf-validate-all-"))
        self.root = self.dir / "repo"
        self.scripts = self.root / "scripts"
        self.tmp = self.dir / "tmp"
        (self.scripts / "security").mkdir(parents=True)
        self.tmp.mkdir()
        shutil.copy(SCRIPT, self.scripts / "validate-all.sh")
        self.escreve("security/zod-coverage.sh", ZOD_FALSO)
        self.escreve("security/test-migration-replay-safety.sh", REPLAY_FALSO)
        self.escreve("security/test-canonical-db-gates.mjs", "export {};\n")

    def escreve(self, rel, conteudo):
        alvo = self.scripts / rel
        alvo.parent.mkdir(parents=True, exist_ok=True)
        alvo.write_text(conteudo)
        return alvo

    def run(self, *args):
        env = {
            "PATH": "/usr/local/bin:/usr/bin:/bin",
            "HOME": str(self.dir),
            "TMPDIR": str(self.tmp),
        }
        r = subprocess.run(["bash", str(self.scripts / "validate-all.sh"), *args],
                           capture_output=True, text=True, env=env, cwd=self.dir, timeout=120, check=False, stdin=subprocess.DEVNULL)
        r.limpo = re.sub(r"\x1b\[[0-9;]*m", "", r.stdout)
        return r


def resumo(r):
    m = re.search(r"PASS: (\d+)\s+FAIL: (\d+)\s+SKIP: (\d+)", r.limpo)
    assert m, f"resumo ausente — o script abortou antes do fim:\n{r.limpo[-800:]}\n{r.stderr[-400:]}"
    return tuple(int(x) for x in m.groups())


class Base(unittest.TestCase):
    def setUp(self):
        self.av = Arvore()
        self.addCleanup(shutil.rmtree, self.av.dir, True)


class TestArgumentos(Base):
    def test_help(self):
        for flag in ("--help", "-h"):
            r = self.av.run(flag)
            self.assertEqual(r.returncode, 0)
            self.assertIn("Uso:", r.stdout)
            self.assertIn("--fast", r.stdout)
            self.assertNotIn("PASS", r.stdout)

    def test_argumento_desconhecido_exit2(self):
        # Regressão: qualquer argumento era aceito em silêncio (inclusive --fast, que não fazia nada).
        r = self.av.run("--rapido")
        self.assertEqual(r.returncode, 2)
        self.assertIn("Argumento desconhecido", r.stderr)
        self.assertNotIn("PASS", r.stdout)


class TestArvoreSaudavel(Base):
    def test_exit0_resumo_e_contagem_coerente(self):
        r = self.av.run()
        p, f, s = resumo(r)
        self.assertEqual((r.returncode, f), (0, 0), r.limpo[-1500:])
        self.assertEqual(p, r.limpo.count("✅ PASS"))
        self.assertEqual(s, len(re.findall(r"^⏭", r.limpo, re.M)))
        self.assertGreater(p, 5)

    def test_marcador_de_sucesso_antes_de_saida_grande_nao_vira_fail(self):
        # Regressão: `cmd | grep -q` sob pipefail dava 141 (SIGPIPE) → FAIL falso.
        for _ in range(3):
            r = self.av.run("--fast")
            self.assertIn("✅ PASS zod-coverage.sh lógica de não-regressão", r.limpo)
            self.assertIn("✅ PASS test-migration-replay-safety.sh\n", r.limpo)
            self.assertEqual(r.returncode, 0, r.limpo[-1500:])

    def test_nao_deixa_temporarios(self):
        # Regressão: o py_compile deixava __pycache__ ao lado de cada .py verificado.
        self.av.escreve("util/modulo.py", "X = 1\n")
        self.av.run()
        self.assertEqual(list(self.av.tmp.iterdir()), [])
        self.assertEqual(list(self.av.root.rglob("__pycache__")), [])


class TestSintaxe(Base):
    def _assert_fail(self, rel, conteudo, rotulo):
        self.av.escreve(rel, conteudo)
        r = self.av.run("--fast")
        _, f, _ = resumo(r)
        self.assertEqual(r.returncode, 1)
        self.assertGreaterEqual(f, 1)
        self.assertRegex(r.limpo, rf"❌ FAIL {rotulo}")
        self.assertNotRegex(r.limpo, rf"✅ PASS {rotulo}")

    def test_bash_invalido(self):
        self._assert_fail("quebrado.sh", "#!/usr/bin/env bash\nif then fi (\n", r"bash -n \S+quebrado\.sh")

    def test_python_invalido(self):
        self._assert_fail("quebrado.py", "def x(:\n", r"py_compile \S+quebrado\.py")

    def test_mjs_invalido(self):
        self._assert_fail("ci/quebrado.mjs", "const = ;\n", r"node --check quebrado\.mjs")

    def test_js_invalido_tambem_e_verificado(self):
        # Regressão: só *.mjs era verificado; generate-design-audit.js ficava de fora.
        self._assert_fail("quebrado.js", "const = ;\n", r"node --check quebrado\.js")

    def test_arquivo_com_espaco_no_nome(self):
        self.av.escreve("com espaco.sh", "#!/usr/bin/env bash\necho ok\n")
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 0, r.limpo[-800:])
        self.assertRegex(r.limpo, r"✅ PASS bash -n \S+com espaco\.sh")


class TestSuites(Base):
    PY_OK = "import unittest\nclass T(unittest.TestCase):\n    def test_a(self):\n        pass\nunittest.main()\n"
    PY_FALHA = "import unittest\nclass T(unittest.TestCase):\n    def test_a(self):\n        self.fail('x')\nunittest.main()\n"
    MJS_OK = "import test from 'node:test';\ntest('a', () => {});\n"
    MJS_FALHA = "import test from 'node:test';\nimport assert from 'node:assert/strict';\ntest('a', () => { assert.equal(1, 2); });\n"

    def test_suite_python_nova_e_descoberta(self):
        # Regressão: lista fixa de 13 arquivos — suíte nova nunca rodava.
        self.av.escreve("qualquer/test_nova.py", self.PY_OK)
        r = self.av.run()
        self.assertEqual(r.returncode, 0, r.limpo[-800:])
        self.assertRegex(r.limpo, r"✅ PASS scripts/qualquer/test_nova\.py: Ran 1 test")

    def test_suite_python_falhando_reprova(self):
        self.av.escreve("test_falha.py", self.PY_FALHA)
        r = self.av.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL scripts/test_falha.py", r.limpo)

    def test_suite_python_que_sai_0_sem_ok_reprova(self):
        self.av.escreve("test_mudo.py", "print('nada rodou')\n")
        r = self.av.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL scripts/test_mudo.py", r.limpo)

    def test_suite_node_e_descoberta_e_falha_reprova(self):
        self.av.escreve("a/bom.unit.mjs", self.MJS_OK)
        r = self.av.run()
        self.assertEqual(r.returncode, 0, r.limpo[-800:])
        self.assertRegex(r.limpo, r"✅ PASS scripts/a/bom\.unit\.mjs: # pass 1")
        self.av.escreve("a/ruim.unit.mjs", self.MJS_FALHA)
        r = self.av.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL scripts/a/ruim.unit.mjs", r.limpo)

    def test_fast_pula_suites(self):
        self.av.escreve("test_falha.py", self.PY_FALHA)
        self.av.escreve("ruim.unit.mjs", self.MJS_FALHA)
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 0, r.limpo[-800:])
        for rotulo in ("type-check: --fast", "python unit tests: --fast", "node unit tests: --fast"):
            self.assertIn(rotulo, r.limpo)
        self.assertNotIn("test_falha.py:", r.limpo)


class TestCenariosDeScripts(Base):
    def test_help_que_sai_diferente_de_zero_vira_fail_com_resumo(self):
        # Regressão: `out=$(bash x -h)` sob set -e abortava tudo sem resumo.
        self.av.escreve("ci/check-baseline-drift.sh", "#!/usr/bin/env bash\necho 'explodiu' >&2\nexit 7\n")
        r = self.av.run("--fast")
        _, f, _ = resumo(r)
        self.assertEqual(r.returncode, 1)
        self.assertGreaterEqual(f, 1)
        self.assertIn("❌ FAIL check-baseline-drift.sh -h", r.limpo)

    def test_gate_que_nao_emite_ok_reprova(self):
        self.av.escreve("security/test-migration-replay-safety.sh", "#!/usr/bin/env bash\necho 'FALHA: padrão proibido'\nexit 1\n")
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL test-migration-replay-safety.sh: não retornou OK:", r.limpo)

    def test_zod_sem_marcador_reprova(self):
        self.av.escreve("security/zod-coverage.sh", "#!/usr/bin/env bash\necho 'nada'\n")
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL zod-coverage.sh", r.limpo)

    def test_staging_migrate_que_aceita_rodar_sem_env_reprova(self):
        # Regressão: virava SKIP ("não detectou env ausente") e o smoke-test passava.
        self.av.escreve("staging-migrate.sh", "#!/usr/bin/env bash\necho 'Uso: staging-migrate.sh'\nexit 0\n")
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 1)
        self.assertIn("❌ FAIL staging-migrate.sh: saiu 0 sem nenhuma env obrigatória", r.limpo)

    def test_staging_migrate_real_passa_e_nao_suja_tmp(self):
        shutil.copy(REPO_ROOT / "scripts" / "staging-migrate.sh", self.av.scripts / "staging-migrate.sh")
        r = self.av.run("--fast")
        self.assertEqual(r.returncode, 0, r.limpo[-800:])
        self.assertIn("✅ PASS staging-migrate.sh --help → Uso:", r.limpo)
        self.assertIn("✅ PASS staging-migrate.sh sem env → exit!=0", r.limpo)
        self.assertEqual(list(self.av.tmp.iterdir()), [])

    def test_migrate_cron_jobs_real_help(self):
        shutil.copy(REPO_ROOT / "scripts" / "migrate-cron-jobs.sh", self.av.scripts / "migrate-cron-jobs.sh")
        r = self.av.run("--fast")
        self.assertIn("✅ PASS migrate-cron-jobs.sh --help → Uso:", r.limpo)
        self.assertEqual(r.returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
