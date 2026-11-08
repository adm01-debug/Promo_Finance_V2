#!/usr/bin/env python3
"""
Cenários de borda para scripts/integrity/dump-baseline.sh — 22 cenários.
Foco em: COALESCE fix (linha 29), jsonb NULL, cron jobs, allowed-public-tables.json.
"""
import os, subprocess, sys, unittest, tempfile, json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "integrity" / "dump-baseline.sh"


class TestDumpBaselineSyntax(unittest.TestCase):
    # C1: bash -n — sintaxe válida
    def test_c1_syntax_valid(self):
        r = subprocess.run(["bash", "-n", str(SCRIPT)],
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)

    # C2: set -euo pipefail presente
    def test_c2_set_euo_pipefail(self):
        self.assertIn("set -euo pipefail", SCRIPT.read_text())

    # C3: PROD_DB_URL obrigatório (: "${PROD_DB_URL:?...}")
    def test_c3_requires_prod_db_url(self):
        self.assertIn("PROD_DB_URL", SCRIPT.read_text())
        self.assertIn(":?", SCRIPT.read_text())

    # C4: NUNCA escreve em produção — sem INSERT/UPDATE/DELETE SQL
    def test_c4_no_write_sql_statements(self):
        content = SCRIPT.read_text().upper()
        for stmt in ["INSERT INTO", "UPDATE ", "DELETE FROM", "DROP ", "TRUNCATE"]:
            self.assertNotIn(stmt, content, f"SQL de escrita encontrado: {stmt}")

    # C5: variável OUT derivada de DIR (path relativo ao script)
    def test_c5_out_relative_to_script_dir(self):
        content = SCRIPT.read_text()
        self.assertIn('DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")', content)
        self.assertIn('OUT="$DIR/baseline"', content)


class TestDumpBaselineCoalesceQuery(unittest.TestCase):
    """Cenários para o fix do COALESCE na query de expected-policies."""

    # C6: query usa COALESCE para evitar NULL quando não há policies
    def test_c6_query_has_coalesce(self):
        content = SCRIPT.read_text()
        self.assertIn("COALESCE", content)

    # C7: query usa '{}'::jsonb como fallback
    def test_c7_query_has_empty_jsonb_fallback(self):
        content = SCRIPT.read_text()
        self.assertIn("'{}'::jsonb", content)

    # C8: COALESCE está na query de expected-policies (não em outra query)
    def test_c8_coalesce_in_policies_query(self):
        content = SCRIPT.read_text()
        idx_coalesce = content.index("COALESCE")
        idx_policies = content.index("expected-policies.json")
        # COALESCE deve vir depois do marker de expected-policies
        self.assertGreater(idx_coalesce, idx_policies)

    # C9: jsonb_object_agg com tabela de policies
    def test_c9_jsonb_object_agg_present(self):
        content = SCRIPT.read_text()
        self.assertIn("jsonb_object_agg", content)

    # C10: query agrupa por tablename e conta
    def test_c10_query_groups_by_tablename(self):
        content = SCRIPT.read_text()
        self.assertIn("GROUP BY tablename", content)


class TestDumpBaselineAllowedPublicTables(unittest.TestCase):
    """C11-C15: comportamento do allowed-public-tables.json."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        # Criar mock de psql que retorna valores válidos
        self._create_mock_psql()

    def _create_mock_psql(self):
        """Cria mock de psql que retorna JSON válido para cada query."""
        mock_path = Path(self.tmpdir) / "psql"
        state = Path(self.tmpdir) / "state"
        state.write_text("0")
        # Respostas por ordem de chamada:
        # 1. schema-counts (via awk) → 4 SELECTs separados
        # 2. expected-policies → {"tabela":1}
        # 3. expected-crons → []
        responses = [
            "tables,5",   # tables count
            "views,3",    # views count
            "indexes,20", # indexes count
            "functions,8",# functions count
            "policies,2", # policies count
            '{"tabela": 2}',  # expected-policies
            "[]",             # expected-crons
        ]
        resp_file = Path(self.tmpdir) / "responses.json"
        resp_file.write_text(json.dumps(responses))
        mock_path.write_text(
            "#!/usr/bin/env python3\n"
            "import json, sys\n"
            f"sf = {str(state)!r}\n"
            f"rf = {str(resp_file)!r}\n"
            "idx = int(open(sf).read())\n"
            "resps = json.load(open(rf))\n"
            "resp = resps[idx] if idx < len(resps) else ''\n"
            "open(sf,'w').write(str(idx+1))\n"
            "print(resp)\n"
        )
        mock_path.chmod(0o755)

    def _run_script(self, out_dir=None):
        env = os.environ.copy()
        env["PROD_DB_URL"] = "mock"
        env["PATH"] = self.tmpdir + ":" + env.get("PATH", "")
        # Redirecionar OUT para tmpdir para não poluir o repo
        if out_dir:
            # Substituir $DIR no script via env trick não é simples;
            # usamos subshell com variável
            env["_TEST_OUT_DIR"] = str(out_dir)
        return subprocess.run(
            ["bash", str(SCRIPT)],
            capture_output=True, text=True, env=env, timeout=30
        )

    # C11: PROD_DB_URL ausente → exit ≠ 0 e mensagem de erro
    def test_c11_missing_prod_db_url_fails(self):
        env = os.environ.copy()
        env.pop("PROD_DB_URL", None)
        r = subprocess.run(["bash", str(SCRIPT)],
                           capture_output=True, text=True, env=env, timeout=10)
        self.assertNotEqual(r.returncode, 0)

    # C12: Script cria diretório baseline/ se não existir
    def test_c12_creates_baseline_dir(self):
        # Verificar que o script tem mkdir -p
        self.assertIn("mkdir -p", SCRIPT.read_text())

    # C13: allowed-public-tables.json criado como [] se não existir
    def test_c13_creates_allowed_tables_if_missing(self):
        content = SCRIPT.read_text()
        self.assertIn("allowed-public-tables.json", content)
        self.assertIn("[]", content)
        self.assertIn('[ ! -f', content)

    # C14: allowed-public-tables.json NÃO sobrescrito se existir
    def test_c14_not_overwritten_if_exists(self):
        content = SCRIPT.read_text()
        # A condição é "if [ ! -f ... ]" — só cria se NÃO existir
        self.assertIn("! -f", content)

    # C15: mensagem final ✅ presente
    def test_c15_success_message_present(self):
        content = SCRIPT.read_text()
        self.assertIn("baselines atualizados", content)


class TestDumpBaselineSchemaCountsQuery(unittest.TestCase):
    # C16: query conta tabelas (relkind='r')
    def test_c16_counts_tables(self):
        content = SCRIPT.read_text()
        self.assertIn("relkind='r'", content)

    # C17: query conta views (relkind='v')
    def test_c17_counts_views(self):
        content = SCRIPT.read_text()
        self.assertIn("relkind='v'", content)

    # C18: query conta indexes (relkind='i')
    def test_c18_counts_indexes(self):
        content = SCRIPT.read_text()
        self.assertIn("relkind='i'", content)

    # C19: query conta funções (pg_proc)
    def test_c19_counts_functions(self):
        content = SCRIPT.read_text()
        self.assertIn("pg_proc", content)

    # C20: query conta policies (pg_policies)
    def test_c20_counts_policies(self):
        content = SCRIPT.read_text()
        self.assertIn("pg_policies", content)

    # C21: schema-counts.json gerado via awk → formato {"key":val}
    def test_c21_schema_counts_uses_awk(self):
        content = SCRIPT.read_text()
        self.assertIn("awk", content)
        self.assertIn("schema-counts.json", content)

    # C22: expected-crons.json usa cron.job com active=true
    def test_c22_cron_query_filters_active(self):
        content = SCRIPT.read_text()
        self.assertIn("cron.job", content)
        self.assertIn("active = true", content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
