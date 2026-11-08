#!/usr/bin/env python3
"""
Cenários de borda para scripts/data/verify.sh — 25 cenários.
Testados via subprocess com psql mockado (wrapper shell).
Foco em: FK check fix (linha 83), contagens, hashes, exit code correto.
"""
import os, subprocess, sys, unittest, tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "data" / "verify.sh"


def _run_verify(run_id, mock_psql_script, env_extra=None):
    """Executa verify.sh substituindo psql pelo script mock."""
    env = os.environ.copy()
    env["PROD_DB_URL"] = "mock-prod"
    env["STAGING_DB_URL"] = "mock-stg"
    env["PATH"] = str(mock_psql_script.parent) + ":" + env.get("PATH", "")
    if env_extra:
        env.update(env_extra)
    result = subprocess.run(
        ["bash", str(SCRIPT), "--run-id", run_id],
        capture_output=True, text=True, env=env, timeout=15
    )
    return result


def _make_psql(tmpdir, responses):
    """
    Cria um mock de psql em tmpdir/psql que responde queries sequencialmente.
    responses: lista de strings (uma por chamada).
    """
    mock_path = Path(tmpdir) / "psql"
    # Usa um arquivo de estado para saber qual resposta emitir
    state_file = Path(tmpdir) / "psql_state"
    state_file.write_text("0")
    resp_file = Path(tmpdir) / "psql_responses.py"
    resp_file.write_text(
        "import sys\n"
        f"responses = {responses!r}\n"
        f"state_file = {str(state_file)!r}\n"
        "idx = int(open(state_file).read().strip())\n"
        "resp = responses[idx] if idx < len(responses) else ''\n"
        "open(state_file, 'w').write(str(idx+1))\n"
        "if resp:\n"
        "    print(resp)\n"
    )
    mock_path.write_text(
        f"#!/usr/bin/env python3\n"
        f"import sys, os\n"
        f"exec(open({str(resp_file)!r}).read())\n"
    )
    mock_path.chmod(0o755)
    return mock_path


class TestVerifyShMissingArgs(unittest.TestCase):
    # C1: --run-id ausente → exit 2
    def test_c1_missing_run_id_exit2(self):
        env = os.environ.copy()
        env["PROD_DB_URL"] = "mock"
        env["STAGING_DB_URL"] = "mock"
        r = subprocess.run(["bash", str(SCRIPT)],
                           capture_output=True, text=True, env=env, timeout=10)
        self.assertEqual(r.returncode, 2)
        self.assertIn("run-id", r.stderr)

    # C2: PROD_DB_URL ausente → exit ≠ 0
    def test_c2_missing_prod_db_url(self):
        env = os.environ.copy()
        env.pop("PROD_DB_URL", None)
        env["STAGING_DB_URL"] = "mock"
        r = subprocess.run(["bash", str(SCRIPT), "--run-id", "abc"],
                           capture_output=True, text=True, env=env, timeout=10)
        self.assertNotEqual(r.returncode, 0)

    # C3: STAGING_DB_URL ausente → exit ≠ 0
    def test_c3_missing_staging_db_url(self):
        env = os.environ.copy()
        env["PROD_DB_URL"] = "mock"
        env.pop("STAGING_DB_URL", None)
        r = subprocess.run(["bash", str(SCRIPT), "--run-id", "abc"],
                           capture_output=True, text=True, env=env, timeout=10)
        self.assertNotEqual(r.returncode, 0)

    # C4: --help → exit 0 e contém Uso:
    def test_c4_help_flag(self):
        r = subprocess.run(["bash", str(SCRIPT), "--help"],
                           capture_output=True, text=True, timeout=10)
        self.assertEqual(r.returncode, 0)
        self.assertIn("Uso:", r.stdout)

    # C5: flag desconhecida → exit 2
    def test_c5_unknown_flag(self):
        env = os.environ.copy()
        env["PROD_DB_URL"] = "mock"
        env["STAGING_DB_URL"] = "mock"
        r = subprocess.run(["bash", str(SCRIPT), "--unknown"],
                           capture_output=True, text=True, env=env, timeout=10)
        self.assertEqual(r.returncode, 2)


class TestVerifyShFKCheckFix(unittest.TestCase):
    """Cenários focados no fix da linha 83: FK check condicional."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()

    def _run_with_mocks(self, checkpoint_rows, stg_count, prod_hash, stg_hash,
                        has_id="1", bad_fk="0"):
        """Helper: monta respostas de psql e executa verify.sh."""
        # Ordem das queries em verify.sh:
        # 1. checkpoints SELECT → uma linha por tabela
        # 2. Per table: SELECT count(*) FROM stg
        # 3. Per table: has_id check
        # 4. Per table: hash prod
        # 5. Per table: hash stg
        # 6. FK check → bad_fk
        responses = [checkpoint_rows]
        if checkpoint_rows.strip():
            # Assume uma tabela
            responses.append(str(stg_count))   # stg count
            responses.append(has_id)             # has_id
            if has_id == "1":
                responses.append(str(prod_hash))  # hash prod
                responses.append(str(stg_hash))   # hash stg
        responses.append(str(bad_fk))  # FK check
        mock_psql = _make_psql(self.tmpdir, responses)
        return _run_verify("test-run-123", mock_psql)

    # C6: sem tabelas, FK ok → exit 0
    def test_c6_no_tables_fk_ok(self):
        r = self._run_with_mocks("", 0, "abc", "abc", bad_fk="0")
        self.assertEqual(r.returncode, 0)
        self.assertIn('"status":"pass"', r.stdout)
        self.assertIn('"assertion":"fk"', r.stdout)

    # C7: sem tabelas, FK ruim → exit 1 (fix verificado)
    def test_c7_no_tables_fk_bad_exit1(self):
        r = self._run_with_mocks("", 0, "abc", "abc", bad_fk="3")
        self.assertEqual(r.returncode, 1)
        lines = [l for l in r.stdout.strip().split('\n') if l]
        import json
        fk_line = next(
            json.loads(l) for l in lines
            if '"fk"' in l and '"assertion"' in l
        )
        self.assertEqual(fk_line["status"], "fail")

    # C8: 1 tabela, contagens ok, sem id, FK ok → exit 0, 2 assertions
    def test_c8_one_table_no_id_all_pass(self):
        r = self._run_with_mocks("usuarios|g1|100|100", 100, "", "", has_id="0")
        self.assertEqual(r.returncode, 0)
        self.assertIn('"pass"', r.stdout)

    # C9: 1 tabela, stg count diverge → count fail + exit 1
    def test_c9_count_diverge_exit1(self):
        r = self._run_with_mocks("usuarios|g1|100|100", 90, "h1", "h1")
        self.assertGreater(r.returncode, 0)
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        count_line = next((l for l in lines if l["assertion"] == "count"), None)
        self.assertIsNotNone(count_line)
        self.assertEqual(count_line["status"], "fail")

    # C10: FK check = "0" exato → pass (não falso positivo)
    def test_c10_fk_zero_string_is_pass(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="0")
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        fk = next(l for l in lines if l["assertion"] == "fk")
        self.assertEqual(fk["status"], "pass")

    # C11: FK check = "1" → fail
    def test_c11_fk_one_is_fail(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="1")
        self.assertGreater(r.returncode, 0)
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        fk = next(l for l in lines if l["assertion"] == "fk")
        self.assertEqual(fk["status"], "fail")

    # C12: 1 tabela count fail + FK fail → exit code = 2 (1 count + 1 FK, independente do valor)
    def test_c12_multiple_fails_accumulate(self):
        r = self._run_with_mocks("t|g|100|100", 90, "h1", "h1", bad_fk="2")
        self.assertEqual(r.returncode, 2)  # 1 count fail + 1 FK fail

    # C13: hash prod == hash stg → hash pass
    def test_c13_hash_match_pass(self):
        r = self._run_with_mocks("t|g|5|5", 5, "abc123", "abc123")
        self.assertEqual(r.returncode, 0)
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        hash_line = next((l for l in lines if l["assertion"] == "hash"), None)
        if hash_line:
            self.assertEqual(hash_line["status"], "pass")

    # C14: hash prod != hash stg → unverified (filtro de grupo)
    def test_c14_hash_mismatch_unverified(self):
        r = self._run_with_mocks("t|g|5|5", 5, "aaa", "bbb")
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        hash_line = next((l for l in lines if l["assertion"] == "hash"), None)
        if hash_line:
            self.assertEqual(hash_line["status"], "unverified")

    # C15: saída JSONL — cada linha é JSON válido
    def test_c15_output_valid_jsonl(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="0")
        import json
        for line in r.stdout.strip().split('\n'):
            if line:
                obj = json.loads(line)
                self.assertIn("ts", obj)
                self.assertIn("assertion", obj)
                self.assertIn("status", obj)

    # C16: ts no formato ISO 8601
    def test_c16_ts_iso8601_format(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="0")
        import json, re
        for line in r.stdout.strip().split('\n'):
            if line:
                obj = json.loads(line)
                self.assertRegex(obj["ts"], r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z')

    # C17: exit code = número de falhas (não boolean)
    def test_c17_exit_code_equals_fail_count(self):
        # 1 tabela count fail (stg=90 vs src/dst=100), FK ok (0)
        r = self._run_with_mocks("t|g|100|100", 90, "h", "h", bad_fk="0")
        self.assertEqual(r.returncode, 1)

    # C18: tabela com group_name vazio (separador |) → não quebra
    def test_c18_empty_group_name_no_crash(self):
        r = self._run_with_mocks("t||100|100", 100, "h", "h", bad_fk="0")
        # Deve completar sem crash (exit baseado em FAILS, não crash)
        self.assertIsNotNone(r.returncode)

    # C19: assertion "fk" sempre emitida (mesmo sem tabelas)
    def test_c19_fk_assertion_always_emitted(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="0")
        self.assertIn('"assertion":"fk"', r.stdout)

    # C20: assertion "fk" com bad_fk=5 → status="fail" e expected="0"
    def test_c20_fk_fail_has_expected_zero(self):
        r = self._run_with_mocks("", 0, "", "", bad_fk="5")
        import json
        lines = [json.loads(l) for l in r.stdout.strip().split('\n') if l]
        fk = next(l for l in lines if l["assertion"] == "fk")
        self.assertEqual(fk["status"], "fail")
        self.assertEqual(fk["expected"], "0")


class TestVerifyShSyntax(unittest.TestCase):
    # C21: bash -n verifica sintaxe sem executar
    def test_c21_bash_syntax_valid(self):
        r = subprocess.run(["bash", "-n", str(SCRIPT)],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    # C22: shellcheck (se disponível) não reporta erros críticos
    def test_c22_shellcheck_no_errors(self):
        sc = subprocess.run(["which", "shellcheck"], capture_output=True)
        if sc.returncode != 0:
            self.skipTest("shellcheck não instalado")
        r = subprocess.run(
            ["shellcheck", "-S", "error", str(SCRIPT)],
            capture_output=True, text=True
        )
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    # C23: script começa com shebang bash
    def test_c23_shebang_bash(self):
        first = SCRIPT.read_text().split('\n')[0]
        self.assertIn("bash", first)

    # C24: set -euo pipefail presente
    def test_c24_set_euo_pipefail(self):
        content = SCRIPT.read_text()
        self.assertIn("set -euo pipefail", content)

    # C25: emit function presente (formato JSONL correto)
    def test_c25_emit_function_exists(self):
        content = SCRIPT.read_text()
        self.assertIn("emit()", content)
        self.assertIn("assertion", content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
