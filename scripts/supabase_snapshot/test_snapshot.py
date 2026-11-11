#!/usr/bin/env python3
"""Regressões offline: uma coleta parcial não pode destruir o SQL já publicado."""

from __future__ import annotations

import contextlib
import copy
import datetime as dt
import importlib.util
import io
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import types
import unittest
from unittest import mock


class OfflineConnection:
    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def execute(self, command):
        if not command.startswith("SET "):
            raise AssertionError("O teste offline não permite consultas ao banco")

    def rollback(self):
        pass


def function(name="demo", value=1):
    return {
        "schema": "public", "name": name, "args": "", "returns": "integer",
        "language": "sql", "kind": "function", "is_trigger_fn": False,
        "security_definer": False, "volatility": "v", "config": [],
        "execute_api_roles": ["authenticated"], "execute_public": False,
        "definition": f"CREATE FUNCTION public.{name}() RETURNS integer LANGUAGE sql AS $$ SELECT {value} $$;",
    }


def migration(version="20260101000000", name="demo", statements=None):
    return {
        "version": version, "name": name,
        "statements": statements if statements is not None else [
            "CREATE TABLE public.demo_table (id integer);",
            "CREATE INDEX demo_id ON public.demo_table (id);",
        ],
    }


def structural_records(records):
    return [{k: v for k, v in row.items() if k != "callers"} for row in records] if records is not None else None


class SnapshotFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="snapshot-sql-test-")
        self.addCleanup(self.temp.cleanup)
        self.out = pathlib.Path(self.temp.name) / "output"

        # Nem driver instalado nem credenciais são necessários. Qualquer tentativa real falha.
        driver = types.ModuleType("psycopg")
        driver.connect = mock.Mock(side_effect=AssertionError("Conexão real proibida no teste"))
        rows = types.ModuleType("psycopg.rows")
        rows.dict_row = object()
        spec = importlib.util.spec_from_file_location("snapshot_tested", pathlib.Path(__file__).with_name("snapshot.py"))
        self.snapshot = importlib.util.module_from_spec(spec)
        env = {
            "SUPABASE_DB_URL": "offline-fixture", "SNAPSHOT_DIR": str(self.out),
            "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": "",
        }
        with mock.patch.dict(sys.modules, {"psycopg": driver, "psycopg.rows": rows}):
            with mock.patch.dict(os.environ, env, clear=True):
                spec.loader.exec_module(self.snapshot)

        self.source_files = [("src/client.ts", "supabase.rpc('demo')")]

    def collect(self, *, failures=(), functions=None, migrations=None):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        snapshot._SLUG_SEEN.clear()
        records = {
            "server": {"server_version": "offline-fixture"},
            "functions": [function()] if functions is None else functions,
            "migrations": [migration()] if migrations is None else migrations,
        }

        def section(name):
            @snapshot.section(name)
            def collect_section(_conn):
                if name in failures:
                    raise PermissionError(f"Falha simulada na seção {name}")
                return copy.deepcopy(records[name])
            return collect_section

        snapshot.DB_SECTIONS = [section(name) for name in records]
        with mock.patch.object(snapshot.psycopg, "connect", return_value=OfflineConnection()):
            with mock.patch.object(snapshot, "scan_code_files", return_value=self.source_files):
                with mock.patch.object(snapshot.urllib.request, "urlopen", side_effect=AssertionError("HTTP proibido no teste")):
                    with mock.patch.object(snapshot.subprocess, "run", side_effect=AssertionError("Comando externo proibido no teste")):
                        with contextlib.redirect_stdout(io.StringIO()):
                            return snapshot.main()

    def metadata(self):
        return json.loads((self.out / "snapshot.json").read_text(encoding="utf-8"))

    def function_sql(self, name="demo"):
        return self.out / "functions" / "public" / f"{name}__{self.snapshot.sha('')}.sql"

    def migration_sql(self, version="20260101000000", name="demo"):
        return self.out / "migrations" / f"{version}_{name}.sql"

    def error_sections(self):
        return {error["section"] for error in self.metadata()["errors"]}


class SnapshotSQLRecoveryTests(SnapshotFixture):
    def test_output_marker_is_created_preserved_and_recovers_legacy_snapshot(self):
        self.out.mkdir()  # diretório existente e vazio também é um alvo novo válido.
        self.assertEqual(self.collect(), 0)
        marker = self.out / self.snapshot.OUTPUT_MARKER
        self.assertEqual(marker.read_text(encoding="utf-8"), self.snapshot.OUTPUT_MARKER_CONTENT)
        marker.unlink()  # snapshot.json v2 identifica uma saída legítima anterior ao marcador.
        self.assertEqual(self.collect(), 0)
        self.assertEqual(marker.read_text(encoding="utf-8"), self.snapshot.OUTPUT_MARKER_CONTENT)

    def test_unowned_nonempty_output_is_rejected_before_collection(self):
        unowned = pathlib.Path(self.temp.name) / "unowned"
        unowned.mkdir()
        sentinel = unowned / "user.txt"
        sentinel.write_text("não apagar", encoding="utf-8")
        self.snapshot.OUT = unowned
        with mock.patch.object(self.snapshot, "introspect_db", side_effect=AssertionError("coleta proibida")):
            with contextlib.redirect_stderr(io.StringIO()) as stderr:
                self.assertEqual(self.snapshot.main(), 2)
        self.assertIn("sem marcador/snapshot válido", stderr.getvalue())
        self.assertEqual(sentinel.read_text(encoding="utf-8"), "não apagar")
        self.assertFalse((unowned / self.snapshot.OUTPUT_MARKER).exists())

    def test_broad_output_paths_are_rejected_before_collection(self):
        cwd = pathlib.Path.cwd().resolve()
        unsafe = {pathlib.Path(cwd.anchor).resolve(), pathlib.Path.home().resolve(), cwd, cwd.parent}
        for path in unsafe:
            with self.subTest(path=path):
                self.snapshot.OUT = path
                with mock.patch.object(self.snapshot, "introspect_db", side_effect=AssertionError("coleta proibida")):
                    with contextlib.redirect_stderr(io.StringIO()) as stderr:
                        self.assertEqual(self.snapshot.main(), 2)
                self.assertIn("SNAPSHOT_DIR inseguro", stderr.getvalue())

    def test_successful_collection_writes_full_sql_with_compact_metadata(self):
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.function_sql().read_text().strip(), function()["definition"])
        self.assertEqual(self.migration_sql().read_text().strip(), "\n\n".join(migration()["statements"]))
        metadata = self.metadata()
        self.assertIsNone(metadata["db"]["functions"][0]["definition"])
        self.assertEqual(metadata["db"]["migrations"][0]["statements"], 2)
        self.assertEqual(metadata["errors"], [])

    def test_repeated_failures_preserve_sql_counts_hashes_and_db_callers(self):
        self.assertEqual(self.collect(), 0)
        original_function = self.function_sql().read_bytes()
        original_migration = self.migration_sql().read_bytes()
        original_metadata = self.metadata()["db"]
        self.source_files = []

        for _ in range(2):
            self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
            self.assertEqual(self.function_sql().read_bytes(), original_function)
            self.assertEqual(self.migration_sql().read_bytes(), original_migration)
            metadata = self.metadata()
            self.assertEqual(structural_records(metadata["db"]["functions"]), structural_records(original_metadata["functions"]))
            self.assertEqual(metadata["db"]["functions"][0]["callers"]["db"], original_metadata["functions"][0]["callers"]["db"])
            self.assertEqual(metadata["db"]["functions"][0]["callers"]["code"], [])
            self.assertEqual(metadata["db"]["migrations"], original_metadata["migrations"])
            self.assertEqual(set(metadata["carried"]), {"functions", "migrations"})
            self.assertEqual(self.error_sections(), {"functions", "migrations"})
            for name in ("functions", "migrations"):
                self.assertIn("versão anterior", (self.out / f"{name}.md").read_text())
            for name in ("functions.md", "README.md"):
                document = (self.out / name).read_text()
                self.assertIn("| código do repo | coleta atual |", document)
                self.assertIn("| outras funções | coleta anterior; corpos SQL não atualizados |", document)

    def test_failed_functions_allow_healthy_migrations_to_update(self):
        self.collect()
        old_function = self.function_sql().read_bytes()
        statements = ["ALTER TABLE public.demo_table ADD COLUMN name text;"]
        self.assertEqual(self.collect(failures={"functions"}, migrations=[migration(statements=statements)]), 0)
        self.assertEqual(self.function_sql().read_bytes(), old_function)
        self.assertEqual(self.migration_sql().read_text().strip(), statements[0])
        self.assertEqual(self.metadata()["carried"], ["functions"])

    def test_failed_migrations_allow_healthy_functions_to_update(self):
        self.collect()
        old_migration = self.migration_sql().read_bytes()
        changed = function(value=2)
        self.assertEqual(self.collect(failures={"migrations"}, functions=[changed]), 0)
        self.assertEqual(self.function_sql().read_text().strip(), changed["definition"])
        self.assertEqual(self.migration_sql().read_bytes(), old_migration)
        self.assertEqual(self.metadata()["carried"], ["migrations"])

    def test_next_healthy_collection_replaces_sql_and_prunes_removed_objects(self):
        obsolete_migration = migration("20260102000000", "obsolete")
        self.collect(functions=[function(), function("obsolete")], migrations=[migration(), obsolete_migration])
        self.collect(failures={"functions", "migrations"})
        self.assertTrue(self.function_sql("obsolete").is_file())
        self.assertTrue(self.migration_sql("20260102000000", "obsolete").is_file())

        changed = function(value=3)
        statements = ["ALTER TABLE public.demo_table ADD COLUMN enabled boolean;"]
        self.assertEqual(self.collect(functions=[changed], migrations=[migration(statements=statements)]), 0)
        self.assertFalse(self.function_sql("obsolete").exists())
        self.assertFalse(self.migration_sql("20260102000000", "obsolete").exists())
        self.assertEqual(self.function_sql().read_text().strip(), changed["definition"])
        self.assertEqual(self.migration_sql().read_text().strip(), statements[0])
        self.assertEqual(self.metadata()["carried"], [])
        self.assertEqual(self.metadata()["errors"], [])
        self.assertNotIn("versão anterior", (self.out / "functions.md").read_text())

    def test_missing_previous_sql_is_reported_without_fake_content_or_links(self):
        self.collect()
        original_migrations = self.metadata()["db"]["migrations"]
        shutil.rmtree(self.out / "functions")
        shutil.rmtree(self.out / "migrations")

        self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
        self.assertFalse(self.function_sql().exists())
        self.assertFalse(self.migration_sql().exists())
        self.assertEqual(self.metadata()["db"]["migrations"], original_migrations)
        self.assertTrue({"functions.sql", "migrations.sql"}.issubset(self.error_sections()))
        for name in ("functions", "migrations"):
            document = (self.out / f"{name}.md").read_text()
            self.assertIn("SQL indisponível", document)
            self.assertNotIn(f"]({name}/", document)

    def test_failed_first_collection_does_not_claim_empty_sections(self):
        self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
        self.assertFalse(self.function_sql().exists())
        self.assertFalse(self.migration_sql().exists())
        self.assertEqual(self.metadata()["carried"], [])
        self.assertEqual(self.error_sections(), {"functions", "migrations"})
        for name in ("functions", "migrations"):
            document = (self.out / f"{name}.md").read_text()
            self.assertIn("Coleta indisponível", document)
            self.assertNotIn("_nenhum_", document)
            self.assertIn(f"| {name} | n/d |", (self.out / "README.md").read_text())

    def test_successful_empty_sections_are_not_reported_as_collection_failures(self):
        self.assertEqual(self.collect(functions=[], migrations=[]), 0)
        self.assertEqual(self.metadata()["errors"], [])
        self.assertEqual(self.metadata()["carried"], [])
        for name in ("functions", "migrations"):
            self.assertIn("_nenhum_", (self.out / f"{name}.md").read_text())
            self.assertIn(f"| {name} | 0 |", (self.out / "README.md").read_text())

    def test_aggregate_and_window_without_sql_remain_healthy_catalog_entries(self):
        entries = [{**function(f"demo_{kind}"), "kind": kind, "definition": None} for kind in ("aggregate", "window")]
        self.assertEqual(self.collect(functions=entries), 0)
        self.assertEqual(self.error_sections(), set())
        self.assertEqual([f["kind"] for f in self.metadata()["db"]["functions"]], ["aggregate", "window"])
        for entry in entries:
            self.assertFalse(self.function_sql(entry["name"]).exists())
        document = (self.out / "functions.md").read_text()
        self.assertIn("SQL não coletado para este tipo", document)
        self.assertNotIn("](functions/", document)
        self.assertEqual(self.collect(failures={"functions"}), 0)
        self.assertEqual(self.error_sections(), {"functions"})
        self.assertEqual(self.metadata()["carried"], ["functions"])
        self.assertEqual(self.collect(functions=entries), 0)
        self.assertEqual(self.error_sections(), set())


class SnapshotFailureMatrixTests(SnapshotFixture):
    """24 sequências: seção × histórico/SQL disponível × repetição × recuperação."""

    def exercise_failure_recovery(self, section, history, attempts, recovery):
        if history != "none":
            self.collect(functions=[function(), function("obsolete")],
                         migrations=[migration(), migration("20260102000000", "obsolete")])
            previous = copy.deepcopy(self.metadata()["db"][section])
            sql_before = {p.relative_to(self.out): p.read_bytes() for p in (self.out / section).rglob("*.sql")}
            if history == "metadata_only":
                shutil.rmtree(self.out / section)
        else:
            previous, sql_before = None, {}

        self.source_files = []  # não pode apagar callers da seção que veio do histórico
        for attempt in range(attempts):
            changed_function = function(value=attempt + 20)
            changed_statement = f"ALTER TABLE public.demo_table ADD COLUMN field_{attempt} integer;"
            self.assertEqual(self.collect(failures={section}, functions=[changed_function],
                                         migrations=[migration(statements=[changed_statement])]), 0)
            metadata = self.metadata()
            self.assertEqual(structural_records(metadata["db"][section]), structural_records(previous))
            if section == "functions" and previous:
                self.assertEqual(metadata["db"][section][0]["callers"]["db"], previous[0]["callers"]["db"])
                self.assertEqual(metadata["db"][section][0]["callers"]["code"], [])
            self.assertEqual(metadata["carried"], [section] if history != "none" else [])
            self.assertIn(section, self.error_sections())
            self.assertEqual(f"{section}.sql" in self.error_sections(), history == "metadata_only")
            document = (self.out / f"{section}.md").read_text()
            if history == "complete":
                for relative, contents in sql_before.items():
                    self.assertEqual((self.out / relative).read_bytes(), contents)
                self.assertIn("versão anterior", document)
                self.assertNotIn("SQL indisponível", document)
            else:
                self.assertFalse((self.out / section).exists())
                self.assertNotIn(f"]({section}/", document)
                self.assertIn("SQL indisponível" if history == "metadata_only" else "Coleta indisponível", document)
            if history == "none":
                self.assertIn(f"| {section} | n/d |", (self.out / "README.md").read_text())
            else:
                self.assertIn(f"| {section} | 2 |", (self.out / "README.md").read_text())
                # Falha da coleta não pode transformar registros conhecidos em remoções.
                changes = self.snapshot.diff_fingerprints(
                    self.snapshot.fingerprints({"db": {section: structural_records(previous)}}),
                    self.snapshot.fingerprints({"db": {section: structural_records(metadata["db"][section])}}))
                self.assertEqual(changes, [])
            if section == "functions":
                self.assertEqual(self.migration_sql().read_text().strip(), changed_statement)
            else:
                self.assertEqual(self.function_sql().read_text().strip(), changed_function["definition"])

        self.source_files = [("src/recovered.ts", "supabase.rpc('demo')")]
        final_function = function(value=99)
        final_statement = "ALTER TABLE public.demo_table ADD COLUMN recovered boolean;"
        functions = [] if section == "functions" and recovery == "empty" else [final_function]
        migrations = [] if section == "migrations" and recovery == "empty" else [migration(statements=[final_statement])]
        self.assertEqual(self.collect(functions=functions, migrations=migrations), 0)
        metadata = self.metadata()
        self.assertEqual(metadata["errors"], [])
        self.assertEqual(metadata["carried"], [])
        self.assertFalse(self.function_sql("obsolete").exists())
        self.assertFalse(self.migration_sql("20260102000000", "obsolete").exists())
        document = (self.out / f"{section}.md").read_text()
        self.assertNotIn("versão anterior", document)
        self.assertNotIn("SQL indisponível", document)
        if recovery == "empty":
            self.assertEqual(metadata["db"][section], [])
            self.assertFalse((self.out / section).exists())
            self.assertIn("_nenhum_", document)
        elif section == "functions":
            self.assertEqual(self.function_sql().read_text().strip(), final_function["definition"])
            self.assertEqual(metadata["db"][section][0]["callers"]["code"], [{"file": "src/recovered.ts", "hits": 1}])
        else:
            self.assertEqual(self.migration_sql().read_text().strip(), final_statement)
            self.assertEqual(metadata["db"][section][0]["statements"], 1)


def recovery_case(section, history, attempts, recovery):
    def run(self):
        self.exercise_failure_recovery(section, history, attempts, recovery)
    return run


for _section in ("functions", "migrations"):
    for _history in ("none", "complete", "metadata_only"):
        for _attempts in (1, 3):
            for _recovery in ("changed", "empty"):
                setattr(SnapshotFailureMatrixTests,
                        f"test_{_section}_{_history}_{_attempts}_failures_recover_{_recovery}",
                        recovery_case(_section, _history, _attempts, _recovery))


class SnapshotFunctionCallerTests(SnapshotFixture):
    def callers(self, files, *, scan_dirs=None, kind="function"):
        root = pathlib.Path(self.temp.name) / "repo"
        for relative, text in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        self.snapshot.REPO_ROOT = root
        self.snapshot.CODE_SCAN_DIRS = scan_dirs or ["."]
        db = {"functions": [{**function(), "kind": kind}]}
        with contextlib.redirect_stdout(io.StringIO()):
            self.snapshot.build_function_callers(db)
        return db["functions"][0]["callers"]["code"]

    def test_function_declaration_is_not_a_call(self):
        declarations = {
            "supabase/migrations/001.sql": function()["definition"],
            "supabase/migrations/002.sql": "CREATE OR REPLACE\nFUNCTION public.demo() RETURNS integer AS $$ SELECT 2 $$ LANGUAGE sql;",
            "supabase/migrations/003.sql": "CREATE PROCEDURE public.demo() LANGUAGE sql AS $$ SELECT 1 $$;",
        }
        self.assertEqual(self.callers(declarations), [])

    def test_aggregate_declarations_and_metadata_are_not_calls(self):
        statements = [
            "CREATE AGGREGATE public.demo(integer) (SFUNC = int4pl, STYPE = integer);",
            "DROP AGGREGATE IF EXISTS public.demo(integer);",
            "ALTER AGGREGATE public.demo(integer) OWNER TO postgres;",
            "COMMENT ON AGGREGATE public.demo(integer) IS 'description';",
        ]
        self.assertEqual(self.callers({f"supabase/migrations/{i}.sql": text for i, text in enumerate(statements)}, kind="aggregate"), [])

    def test_ddl_function_signatures_are_not_calls(self):
        statements = [
            "DROP FUNCTION IF EXISTS public.demo();",
            "ALTER FUNCTION public.demo() OWNER TO postgres;",
            "COMMENT ON FUNCTION public.demo() IS 'description';",
            "GRANT EXECUTE ON FUNCTION public.demo() TO authenticated;",
            "REVOKE EXECUTE ON FUNCTION public.demo() FROM anon;",
        ]
        self.assertEqual(self.callers({f"supabase/migrations/{i}.sql": text for i, text in enumerate(statements)}), [])

    def test_real_calls_inside_function_bodies_and_migrations_remain(self):
        text = "CREATE FUNCTION public.demo() RETURNS integer AS $$ SELECT public.demo(); $$ LANGUAGE sql;\nSELECT public.demo();"
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 2}])

    def test_ddl_like_text_does_not_hide_a_real_call_later_in_the_statement(self):
        text = "SELECT audit_note('ALTER FUNCTION public.demo()'), public.demo();"
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 1}])

    def test_multiple_signatures_are_ignored_but_default_argument_calls_remain(self):
        text = ("GRANT EXECUTE ON FUNCTION public.demo(), public.demo(integer) TO authenticated;\n"
                "CREATE FUNCTION public.other(value integer DEFAULT public.demo()) RETURNS integer AS $$ SELECT 1 $$ LANGUAGE sql;")
        self.assertEqual(self.callers({"supabase/migrations/active.sql": text}),
                         [{"file": "supabase/migrations/active.sql", "hits": 1}])

    def test_overlapping_scan_paths_do_not_duplicate_real_calls(self):
        self.assertEqual(self.callers({"src/hooks/useDemo.ts": "supabase.rpc('demo')"}, scan_dirs=["src", "src/hooks"]),
                         [{"file": "src/hooks/useDemo.ts", "hits": 1}])

    def test_historical_and_test_files_do_not_prove_current_usage(self):
        excluded = [
            "supabase/migrations/_foreign/other/old.sql", "supabase/migrations/_superseded/old.sql",
            "src/__tests__/client.ts", "src/tests/client.ts", "src/test/client.ts", "src/__fixtures__/client.ts",
            "src/fixtures/client.ts", "src/__mocks__/client.ts", "src/client.test.ts", "src/client.spec.ts",
            "scripts/ci/client.unit.mjs", "scripts/test_client.py", "server/client_test.go", "src/client.stories.tsx",
        ]
        files = {name: "supabase.rpc('demo'); SELECT public.demo();" for name in excluded}
        files["src/client.ts"] = "supabase.rpc('demo')"
        self.assertEqual(self.callers(files), [{"file": "src/client.ts", "hits": 1}])

    def test_similar_names_operational_scripts_and_custom_scan_paths_remain(self):
        names = ["runtime/testimonials.ts", "runtime/customer_foreign/client.ts", "runtime/_superseded_backup/client.ts",
                 "runtime/fixtures-page.ts", "scripts/operations/sync.ts", "supabase/migrations/_foreign.sql"]
        files = {name: "supabase.rpc('demo')" for name in names}
        # SQL reconhece a chamada SQL, não a sintaxe de RPC do cliente.
        files[names[-1]] = "SELECT public.demo();"
        files["src/not_selected.ts"] = "supabase.rpc('demo')"
        self.assertEqual(self.callers(files, scan_dirs=["runtime", "scripts/operations", "supabase/migrations"]),
                         [{"file": name, "hits": 1} for name in sorted(names)])


class SnapshotCallerFreshnessTests(SnapshotFixture):
    @staticmethod
    def database(stage):
        consumer = function(f"{stage}_consumer")
        consumer["definition"] = f"CREATE FUNCTION public.{stage}_consumer() RETURNS integer AS $$ SELECT public.demo() $$ LANGUAGE sql;"
        return {
            "functions": [function(), consumer],
            "cron": {"jobs": [{"jobid": stage, "jobname": stage, "command": "SELECT public.demo();"}]},
            "triggers": [{"schema": "public", "table": "orders", "name": f"{stage}_trigger", "function": "public.demo"}],
            "views": [{"schema": "public", "name": f"{stage}_view", "definition": "SELECT public.demo();"}],
        }

    def build(self, database, files):
        with mock.patch.object(self.snapshot, "scan_code_files", return_value=files):
            with contextlib.redirect_stdout(io.StringIO()):
                return self.snapshot.build_function_callers(database)

    def previous_database(self):
        previous = self.database("old")
        self.build(previous, [("src/old.ts", "supabase.rpc('demo')")])
        for entry in previous["functions"]:
            entry["definition_sha"] = self.snapshot.sha(entry["definition"])
            entry["definition"] = None
        return previous

    def exercise_sources(self, failed_sources):
        previous = self.previous_database()
        previous_copy = copy.deepcopy(previous)
        current = self.database("new")
        # introspect_db reutiliza a lista anterior; o mapa não pode alterar esse histórico em memória.
        current["functions"] = previous["functions"]
        self.snapshot.CARRIED[:] = ["functions", *failed_sources]
        for source in failed_sources:
            current[source] = previous[source]
        states = self.build(current, [("src/new.ts", "supabase.rpc('demo')")])
        callers = current["functions"][0]["callers"]
        self.assertEqual(callers["code"], [{"file": "src/new.ts", "hits": 1}])
        self.assertEqual(callers["code_total_files"], 1)
        self.assertEqual(callers["db"], ["public.old_consumer"])
        expected = {"cron": ["new:new"], "triggers": ["public.orders.new_trigger"], "views": ["public.new_view"]}
        for source in expected:
            if source in failed_sources:
                self.assertEqual(callers[source], previous_copy["functions"][0]["callers"][source])
                self.assertIn("anterior", states[source])
            else:
                self.assertEqual(callers[source], expected[source])
                self.assertIn("coleta atual", states[source])
        self.assertIn("anterior", states["db"])
        self.assertEqual(previous, previous_copy, "recalcular callers não pode reescrever a base do changelog")
        self.assertEqual([{k: v for k, v in f.items() if k != "callers"} for f in current["functions"]],
                         [{k: v for k, v in f.items() if k != "callers"} for f in previous_copy["functions"]])

        self.snapshot.CARRIED.clear()
        recovered = self.database("recovered")
        states = self.build(recovered, [("src/recovered.ts", "supabase.rpc('demo')")])
        callers = recovered["functions"][0]["callers"]
        self.assertEqual(callers["db"], ["public.recovered_consumer"])
        self.assertEqual(callers["cron"], ["recovered:recovered"])
        self.assertEqual(callers["triggers"], ["public.orders.recovered_trigger"])
        self.assertEqual(callers["views"], ["public.recovered_view"])
        self.assertTrue(all("coleta atual" in state for state in states.values()))

    def test_unavailable_sources_preserve_known_references_without_claiming_freshness(self):
        previous = self.previous_database()
        expected = copy.deepcopy(previous["functions"][0]["callers"])
        current = {"functions": previous["functions"], "cron": None, "triggers": None, "views": None}
        self.snapshot.CARRIED[:] = ["functions"]
        states = self.build(current, None)
        self.assertEqual(current["functions"][0]["callers"], expected)
        for source in ("code", "cron", "triggers", "views"):
            self.assertIn("indisponível", states[source])

    def test_successful_empty_sources_remove_old_references(self):
        previous = self.previous_database()
        current = {"functions": previous["functions"], "cron": {"jobs": []}, "triggers": [], "views": []}
        self.snapshot.CARRIED[:] = ["functions"]
        states = self.build(current, [])
        callers = current["functions"][0]["callers"]
        for source in ("code", "cron", "triggers", "views"):
            self.assertEqual(callers[source], [])
            self.assertIn("coleta atual", states[source])
        self.assertEqual(callers["code_total_files"], 0)
        self.assertEqual(callers["db"], ["public.old_consumer"])

    def test_unreadable_code_preserves_previous_code_references_and_reports_failure(self):
        previous = self.previous_database()
        expected = copy.deepcopy(previous["functions"][0]["callers"]["code"])
        root = pathlib.Path(self.temp.name) / "repo"
        (root / "src").mkdir(parents=True)
        (root / "src/client.ts").write_text("supabase.rpc('demo')", encoding="utf-8")
        self.snapshot.REPO_ROOT = root
        self.snapshot.CODE_SCAN_DIRS = ["src"]
        self.snapshot.CARRIED[:] = ["functions"]
        with mock.patch.object(pathlib.Path, "read_text", side_effect=PermissionError("fixture ilegível")):
            with contextlib.redirect_stdout(io.StringIO()):
                states = self.snapshot.build_function_callers(previous)
        self.assertEqual(previous["functions"][0]["callers"]["code"], expected)
        self.assertIn("indisponível", states["code"])
        self.assertTrue(any(e["section"] == "callers.code" for e in self.snapshot.ERRORS))

    def test_database_callers_include_defaults_on_the_first_definition_line(self):
        consumer = function("consumer")
        consumer["definition"] = (
            "CREATE OR REPLACE FUNCTION public.consumer(value integer DEFAULT public.demo())\n"
            " RETURNS integer\n LANGUAGE sql\n AS $function$ SELECT value $function$;"
        )
        database = {"functions": [function(), consumer]}
        self.build(database, [])
        self.assertEqual(database["functions"][0]["callers"]["db"], ["public.consumer"])
        self.assertEqual(database["functions"][1]["callers"]["db"], [])


class SnapshotHeartbeatTests(SnapshotFixture):
    def manifest(self):
        return json.loads((self.out / "manifest.json").read_text(encoding="utf-8"))

    def collect_at(self, instant, **options):
        class FrozenDateTime(dt.datetime):
            @classmethod
            def now(cls, tz=None):
                return instant.astimezone(tz) if tz is not None else instant.replace(tzinfo=None)
        with mock.patch.object(self.snapshot.dt, "datetime", FrozenDateTime):
            return self.collect(**options)

    def unified_index(self):
        script = pathlib.Path(__file__).resolve().parents[1] / "regras_negocio" / "indice.py"
        spec = importlib.util.spec_from_file_location("heartbeat_index", script)
        index = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(index)
        arguments = [str(script), "--repo", self.temp.name, "--out", "INDEX.md", "--remote", "owner/repo",
                     "--head", "a" * 40, "--fonte", "banco real=output"]
        with mock.patch.object(sys, "argv", arguments):
            with mock.patch.object(index, "git", side_effect=AssertionError("manifest/CHANGELOG dispensam fallback Git")):
                with contextlib.redirect_stderr(io.StringIO()):
                    self.assertEqual(index.main(), 0)
        return (pathlib.Path(self.temp.name) / "INDEX.md").read_text(encoding="utf-8")

    def test_unchanged_collection_refreshes_utc_heartbeat_without_structural_changes(self):
        first = dt.datetime(2026, 1, 1, 0, 0, tzinfo=dt.timezone.utc)
        second = first + dt.timedelta(minutes=10)
        self.assertEqual(self.collect_at(first), 0)
        original_manifest = self.manifest()
        original_snapshot = (self.out / "snapshot.json").read_bytes()
        original_changelog = (self.out / "CHANGELOG.md").read_bytes()
        original_fingerprints = self.snapshot.fingerprints(self.metadata())
        self.assertEqual(self.collect_at(second), 0)
        current_manifest = self.manifest()
        self.assertEqual(original_manifest["gerado_em"], "2026-01-01T00:00:00Z")
        self.assertEqual(current_manifest["gerado_em"], "2026-01-01T00:10:00Z")
        self.assertEqual(dt.datetime.fromisoformat(current_manifest["gerado_em"]).utcoffset(), dt.timedelta(0))
        self.assertEqual(current_manifest["entrada"], "README.md")
        self.assertEqual(current_manifest["gerador"], "scripts/supabase_snapshot/snapshot.py")
        self.assertEqual(current_manifest["erros"], [])
        self.assertEqual(current_manifest["carried"], [])
        self.assertEqual((self.out / "snapshot.json").read_bytes(), original_snapshot)
        self.assertEqual((self.out / "CHANGELOG.md").read_bytes(), original_changelog)
        self.assertEqual(self.snapshot.fingerprints(self.metadata()), original_fingerprints)

    def test_partial_heartbeat_includes_collection_and_render_errors(self):
        self.collect()
        shutil.rmtree(self.out / "functions")
        self.assertEqual(self.collect(failures={"functions"}), 0)
        manifest = self.manifest()
        self.assertEqual(manifest["erros"], self.metadata()["errors"])
        self.assertEqual({error["section"] for error in manifest["erros"]}, {"functions", "functions.sql"})
        self.assertEqual(manifest["carried"], ["functions"])
        self.assertIn("| parcial ·", self.unified_index())

    def test_recovery_clears_heartbeat_errors_and_carried_sections(self):
        self.collect()
        self.collect(failures={"functions", "migrations"})
        self.assertTrue(self.manifest()["erros"])
        self.assertEqual(set(self.manifest()["carried"]), {"functions", "migrations"})
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.manifest()["erros"], [])
        self.assertEqual(self.manifest()["carried"], [])

    def test_index_prefers_current_heartbeat_to_old_structural_changelog(self):
        self.collect()
        (self.out / "CHANGELOG.md").write_text("# Histórico\n\n## 2000-01-01 00:00 UTC\n", encoding="utf-8")
        document = self.unified_index()
        self.assertIn("| ok ·", document)
        self.assertNotIn("desatualizado", document)
        (self.out / "manifest.json").unlink()
        self.assertIn("| desatualizado ·", self.unified_index())

    def test_unavailable_collection_does_not_renew_previous_heartbeat(self):
        self.collect()
        before = (self.out / "manifest.json").read_bytes()
        with mock.patch.object(self.snapshot, "introspect_db", return_value=({"functions": None, "migrations": None}, {})):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(self.snapshot.main(), 1)
        self.assertEqual((self.out / "manifest.json").read_bytes(), before)

    def test_interrupted_render_does_not_publish_a_completed_heartbeat(self):
        with mock.patch.object(self.snapshot, "render_simple", side_effect=RuntimeError("falha de escrita simulada")):
            with self.assertRaisesRegex(RuntimeError, "falha de escrita"):
                self.collect()
        self.assertFalse((self.out / "manifest.json").exists())


def source_freshness_case(failed_sources):
    def run(self):
        self.exercise_sources(failed_sources)
    return run


for _mask in range(8):
    _sources = tuple(source for bit, source in enumerate(("cron", "triggers", "views")) if _mask & (1 << bit))
    setattr(SnapshotCallerFreshnessTests, f"test_functions_carried_with_{'_'.join(_sources) or 'no_other_failure'}",
            source_freshness_case(_sources))


class SnapshotDBStatsTests(SnapshotFixture):
    """Catálogo e resultados sintéticos; nenhum driver, socket ou banco real."""

    def stats(self, *, schema="extensions", auth_error=False, top=15, failure=None, empty=False):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.STAT_STATEMENTS_TOP = top
        calls = []

        def query(_conn, sql, params=None):
            calls.append((sql, params))
            compact = " ".join(sql.split())
            if "pg_extension" in compact:
                extension = params[0] if params else "pg_stat_statements"
                if extension == "pgmq":
                    return [{"present": 1}]
                if failure == "catalog":
                    raise PermissionError("catálogo indisponível na fixture")
                if schema is None:
                    return []
                if "extnamespace" in compact:
                    return [{"schema": schema}]
                return [{"present": 1}]  # has_ext do código anterior
            if "total_exec_time" in compact:
                # O backend de teste não inclui a extensão no search_path.
                # Aceita somente um identificador SQL delimitado, não texto cru.
                relation = re.search(
                    r'FROM\s+("(?:""|[^"])*")\.pg_stat_statements\s+s', sql, re.I)
                if relation is None or relation.group(1)[1:-1].replace('""', '"') != schema:
                    raise RuntimeError('relation "pg_stat_statements" does not exist')
                if failure == "permission":
                    raise PermissionError("view sem permissão na fixture")
                if failure == "missing":
                    raise RuntimeError("view removida depois da consulta ao catálogo")
                if failure == "timeout":
                    raise TimeoutError("statement timeout simulado")
                if failure == "row":
                    return [{"query": None}]
                return [] if empty else [{
                    "role": "fixture_reader", "calls": 3, "total_ms": 8,
                    "mean_ms": 2.67, "rows": 3, "query": "select 'literal-fixture'",
                }]
            if "pg_database_size" in compact:
                if failure == "database":
                    raise RuntimeError("banco indisponível na fixture")
                return [{"s": 123456}]
            if "pg_stat_activity" in compact:
                return [{"usename": "fixture_reader", "state": "idle", "n": 2}]
            if "sum(pg_total_relation_size" in compact:
                return [{"schema": "public", "bytes": 45678}]
            if "FROM storage.objects" in compact:
                return [{"bucket_id": "fixture", "objects": 2, "bytes": 42}]
            if "FROM auth." in compact:
                if auth_error:
                    raise PermissionError("permission denied for schema auth")
                if "auth.identities" in compact:
                    return [{"provider": "fixture", "users": 5}]
                if "auth.mfa_factors" in compact:
                    return [{"factor_type": "totp", "status": "verified", "total": 2}]
                return [{"c": 5}]
            if "pgmq.metrics_all()" in compact:
                return [{"queue_name": "fixture", "queue_length": 3, "newest_msg_age_sec": 1,
                         "oldest_msg_age_sec": 2, "total_messages": 4}]
            raise AssertionError(f"Consulta não prevista no modelo offline: {compact[:70]}")

        with mock.patch.object(snapshot, "q", side_effect=query):
            with mock.patch.object(snapshot.urllib.request, "urlopen", side_effect=AssertionError("HTTP proibido")):
                with contextlib.redirect_stdout(io.StringIO()):
                    result = snapshot.get_db_stats(OfflineConnection())
        errors = {error["section"] for error in snapshot.ERRORS}
        return result, calls, errors

    def assert_core_metrics(self, stats, auth_error):
        self.assertIsInstance(stats, dict, "Falha opcional não deve descartar db_stats")
        self.assertEqual(stats["database_bytes"], 123456)
        self.assertEqual(stats["connections"], [{"usename": "fixture_reader", "state": "idle", "n": 2}])
        self.assertEqual(stats["schema_bytes"], [{"schema": "public", "bytes": 45678}])
        self.assertEqual(stats["storage"], [{"bucket_id": "fixture", "objects": 2, "bytes": 42}])
        self.assertEqual(stats["queues"][0]["queue_length"], 3)
        self.assertEqual(bool(stats["auth"]), not auth_error)

    def exercise_schema(self, schema, auth_error):
        stats, calls, errors = self.stats(schema=schema, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertEqual(stats["top_queries"][0]["query"], "select '?'")
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        lookup = [(sql, params) for sql, params in calls if "extnamespace" in sql]
        self.assertEqual(len(lookup), 1)
        top_calls = [(sql, params) for sql, params in calls if "total_exec_time" in sql]
        self.assertEqual(len(top_calls), 1)
        # Sem binds, '%' no identificador não vira placeholder do psycopg.
        self.assertIsNone(top_calls[0][1])
        self.assertIn("LIMIT 15", top_calls[0][0])

    def exercise_availability(self, present, top, auth_error):
        stats, calls, errors = self.stats(schema="extensions" if present else None,
                                         top=top, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        self.assertEqual("top_queries" in stats, present and top > 0)
        stat_calls = [(sql, params) for sql, params in calls
                      if "total_exec_time" in sql or "extnamespace" in sql or params == ("pg_stat_statements",)]
        if top <= 0:
            self.assertEqual(stat_calls, [])
        elif present:
            self.assertEqual(len(stat_calls), 2)
            self.assertIn("LIMIT 1", stat_calls[-1][0])
        else:
            self.assertEqual(len(stat_calls), 1)

    def exercise_failure(self, failure, auth_error):
        stats, _, errors = self.stats(failure=failure, auth_error=auth_error)
        self.assert_core_metrics(stats, auth_error)
        self.assertNotIn("top_queries", stats)
        expected = {"db_stats.top_queries"} | ({"db_stats.auth"} if auth_error else set())
        self.assertEqual(errors, expected)

    def exercise_recovery(self, auth_error, empty):
        failed, _, errors = self.stats(failure="permission", auth_error=auth_error)
        self.assert_core_metrics(failed, auth_error)
        self.assertIn("db_stats.top_queries", errors)
        recovered, _, errors = self.stats(empty=empty, auth_error=auth_error)
        self.assert_core_metrics(recovered, auth_error)
        self.assertEqual(errors, {"db_stats.auth"} if auth_error else set())
        self.assertEqual(len(recovered["top_queries"]), 0 if empty else 1)
        self.assertNotIn("top_queries", failed, "Recuperação não deve alterar o resultado anterior")

    def test_schema_is_resolved_again_after_extension_moves(self):
        first, _, first_errors = self.stats(schema="extensions")
        second, _, second_errors = self.stats(schema='Stats "new"')
        self.assert_core_metrics(first, False)
        self.assert_core_metrics(second, False)
        self.assertEqual(first_errors | second_errors, set())
        self.assertEqual(first["top_queries"], second["top_queries"])

    def test_partial_metrics_remain_in_rendered_json_and_markdown(self):
        stats, _, errors = self.stats(failure="missing", auth_error=True)
        self.assert_core_metrics(stats, True)
        self.snapshot.render_stats({"db_stats": stats}, {}, {})
        rendered = json.loads((self.out / "stats.json").read_text())["db"]["db_stats"]
        self.assertEqual(rendered["database_bytes"], 123456)
        self.assertEqual(rendered["queues"][0]["queue_name"], "fixture")
        self.assertNotIn("top_queries", rendered)
        self.assertTrue((self.out / "stats.md").exists())
        self.assertEqual(errors, {"db_stats.auth", "db_stats.top_queries"})

    def test_mandatory_database_failure_keeps_section_error_contract(self):
        stats, _, errors = self.stats(failure="database")
        self.assertIsNone(stats)
        self.assertEqual(errors, {"db_stats"})


class SnapshotConfigurationTests(unittest.TestCase):
    def test_invalid_integer_environment_is_reported_without_traceback(self):
        script = pathlib.Path(__file__).with_name("snapshot.py")
        for key, value in (("CRON_RUNS_PER_JOB", "x"), ("STAT_STATEMENTS_TOP", "1.5"),
                           ("CODE_SCAN_MAX_FILES", "")):
            with self.subTest(key=key):
                driver = types.ModuleType("psycopg")
                driver.connect = mock.Mock(side_effect=AssertionError("conexão proibida"))
                rows = types.ModuleType("psycopg.rows")
                rows.dict_row = object()
                spec = importlib.util.spec_from_file_location(f"snapshot_invalid_{key}", script)
                snapshot = importlib.util.module_from_spec(spec)
                env = {"SUPABASE_DB_URL": "offline-fixture", key: value}
                with mock.patch.dict(sys.modules, {"psycopg": driver, "psycopg.rows": rows}):
                    with mock.patch.dict(os.environ, env, clear=True):
                        spec.loader.exec_module(snapshot)
                with contextlib.redirect_stderr(io.StringIO()) as stderr:
                    self.assertEqual(snapshot.main(), 2)
                message = stderr.getvalue()
                self.assertIn(f"Configuração inválida: {key}", message)
                self.assertNotIn("Traceback", message)


def db_stats_case(method, *args):
    def run(self):
        getattr(self, method)(*args)
    return run


for _index, _schema in enumerate((
        "extensions", "public", "analytics", "Query Metrics", 'stats"quoted',
        "select", "stats%raw", 'stats"; DROP TABLE private; --')):
    for _auth_error in (False, True):
        setattr(SnapshotDBStatsTests, f"test_schema_{_index}_auth_{_auth_error}",
                db_stats_case("exercise_schema", _schema, _auth_error))

for _present in (False, True):
    for _top in (0, -1, 1):
        for _auth_error in (False, True):
            setattr(SnapshotDBStatsTests, f"test_available_{_present}_top_{_top}_auth_{_auth_error}",
                    db_stats_case("exercise_availability", _present, _top, _auth_error))

for _failure in ("catalog", "permission", "missing", "timeout", "row"):
    for _auth_error in (False, True):
        setattr(SnapshotDBStatsTests, f"test_failure_{_failure}_auth_{_auth_error}",
                db_stats_case("exercise_failure", _failure, _auth_error))

for _auth_error in (False, True):
    for _empty in (False, True):
        setattr(SnapshotDBStatsTests, f"test_recovery_auth_{_auth_error}_empty_{_empty}",
                db_stats_case("exercise_recovery", _auth_error, _empty))


class SnapshotApiCarryOverTests(SnapshotFixture):
    """Falha transitória da Management API não pode apagar edge function que existe."""

    def introspect(self, *, previous, responder):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        snapshot._SLUG_SEEN.clear()
        with mock.patch.object(snapshot, "PROJECT_REF", "projeto-fixture"):
            with mock.patch.object(snapshot, "ACCESS_TOKEN", "token-fixture"):
                with mock.patch.object(snapshot, "api", side_effect=responder):
                    with contextlib.redirect_stdout(io.StringIO()):
                        return snapshot.introspect_api(previous)

    @staticmethod
    def edge(slug):
        return {"slug": slug, "name": slug, "status": "ACTIVE", "version": 1, "verify_jwt": True,
                "import_map": None, "entrypoint_path": None, "import_map_path": None,
                "created_at": None, "updated_at": None}

    def function_dir(self, slug_name):
        return self.out / "edge-functions" / self.snapshot.slug(slug_name)

    def test_falha_reaproveita_e_preserva_diretorio(self):
        existente = self.function_dir("cobranca")
        existente.mkdir(parents=True)
        (existente / "README.md").write_text("publicado antes", encoding="utf-8")

        def tudo_falha(_path):
            raise TimeoutError("Management API indisponível")

        out, _ = self.introspect(previous={"edge_functions": [self.edge("cobranca")]}, responder=tudo_falha)

        self.assertEqual([f["slug"] for f in out["edge_functions"]], ["cobranca"])
        self.assertIn("api.edge_functions", self.snapshot.CARRIED)
        self.assertTrue(existente.is_dir(), "coleta falhada apagou a função já publicada")
        # O README é reescrito a partir do metadado reaproveitado — segue descrevendo a função.
        self.assertIn("cobranca", (existente / "README.md").read_text(encoding="utf-8"))

    def test_coleta_bem_sucedida_ainda_poda_funcao_removida(self):
        removida = self.function_dir("antiga")
        removida.mkdir(parents=True)
        (removida / "README.md").write_text("não existe mais no projeto", encoding="utf-8")

        def so_funcoes(path):
            if path.endswith("/functions"):
                return [self.edge("cobranca")]
            raise TimeoutError("seção fora do escopo do teste")

        out, _ = self.introspect(previous={"edge_functions": [self.edge("cobranca"), self.edge("antiga")]},
                                 responder=so_funcoes)

        self.assertEqual([f["slug"] for f in out["edge_functions"]], ["cobranca"])
        self.assertNotIn("api.edge_functions", self.snapshot.CARRIED)
        self.assertFalse(removida.exists(), "coleta válida deixou de podar função removida")

    def test_falha_sem_coleta_anterior_nao_poda(self):
        orfa = self.function_dir("sem-historico")
        orfa.mkdir(parents=True)

        def tudo_falha(_path):
            raise TimeoutError("Management API indisponível")

        out, _ = self.introspect(previous=None, responder=tudo_falha)

        self.assertEqual(out["edge_functions"], [])
        self.assertTrue(orfa.is_dir(), "falha sem histórico apagou diretório publicado")


class SnapshotErrorRedactionTests(SnapshotFixture):
    """Mensagem de erro de subprocesso não pode levar a senha do DSN para a saída."""

    DSN = "postgresql://postgres.ref:SenhaSuperSecreta123@aws-0-x.pooler.supabase.com:5432/postgres"

    def test_timeout_de_subprocesso_nao_grava_a_senha(self):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        erro = snapshot.subprocess.TimeoutExpired(cmd=["pg_dump", "--schema-only", self.DSN], timeout=600)
        with contextlib.redirect_stdout(io.StringIO()) as saida:
            snapshot.record_error("pg_dump", erro)
        gravado = snapshot.ERRORS[0]["error"]
        self.assertNotIn("SenhaSuperSecreta123", gravado)
        self.assertNotIn("SenhaSuperSecreta123", saida.getvalue())
        # o resto da mensagem continua útil para diagnóstico
        self.assertIn("pg_dump", gravado)

    def test_erro_em_texto_tambem_e_redigido(self):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        with contextlib.redirect_stdout(io.StringIO()):
            snapshot.record_error("gen_types", f"falhou ao conectar em {self.DSN}")
        self.assertNotIn("SenhaSuperSecreta123", snapshot.ERRORS[0]["error"])


class SnapshotDsnScrubTests(SnapshotFixture):
    """Credencial embutida em DSN não pode sair na coleta, venha de onde vier."""

    def test_senha_de_dsn_e_redigida_mantendo_usuario_e_host(self):
        scrub = self.snapshot.scrub
        saida = scrub("postgresql://postgres.abc:SenhaReal123@aws-0-us-east-1.pooler.supabase.com:5432/postgres")
        self.assertNotIn("SenhaReal123", saida)
        self.assertIn("postgres.abc", saida)
        self.assertIn("aws-0-us-east-1.pooler.supabase.com", saida)

    def test_outros_esquemas_tambem(self):
        scrub = self.snapshot.scrub
        for dsn in ("redis://user:p4ssw0rd-secreta@cache:6379/0",
                    "amqp://fila:OutraSenha99@broker:5672/vhost"):
            self.assertNotIn("Senha", scrub(dsn).replace("[REDACTED]", ""))
            self.assertNotIn("p4ssw0rd-secreta", scrub(dsn))

    def test_url_sem_credencial_fica_intacta(self):
        scrub = self.snapshot.scrub
        for url in ("https://api.exemplo.com/v1/coisa",
                    "https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/health"):
            self.assertEqual(scrub(url), url)

    def test_redact_por_chave_continua_valendo(self):
        redact = self.snapshot.redact
        saida = redact({"connection_string": "postgresql://u:senha@h:5432/db", "db_host": "h"})
        self.assertEqual(saida["connection_string"], "[REDACTED]")
        self.assertEqual(saida["db_host"], "h")



def gfm_cells(line):
    """Células de uma linha de tabela GFM: pipe só separa se precedido por nº par de barras."""
    cells, current, backslashes = [], "", 0
    for char in line.strip():
        if char == "|" and backslashes % 2 == 0:
            cells.append(current)
            current = ""
        else:
            current += char
        backslashes = backslashes + 1 if char == "\\" else 0
    cells.append(current)
    return cells[1:-1] if len(cells) >= 2 else cells


def broken_markdown_tables(root):
    """Linhas cuja quantidade de células difere do cabeçalho, em todos os .md de root."""
    problems = []
    for document in sorted(pathlib.Path(root).rglob("*.md")):
        width, fence = None, None
        lines = document.read_text(encoding="utf-8").split("\n")
        for number, line in enumerate(lines, 1):
            marker = re.match(r"\s{0,3}(`{3,})", line)
            if marker and (fence is None or len(marker.group(1)) >= fence):
                fence, width = (None if fence else len(marker.group(1))), None
                continue
            if fence:
                continue
            if not line.startswith("|"):
                width = None
            elif width is None:
                if number < len(lines) and re.fullmatch(r"\|(---\|)+", lines[number]):
                    width = len(gfm_cells(line))
                else:
                    problems.append(f"{document.name}:{number} linha de tabela sem cabeçalho")
            elif len(gfm_cells(line)) != width:
                problems.append(f"{document.name}:{number} {len(gfm_cells(line))} células, cabeçalho tem {width}")
    return problems


def table(schema, name, **changes):
    return {"schema": schema, "name": name, "kind": "table", "rls_enabled": False, "rls_forced": False,
            "owner": "postgres", "comment": None, "is_partition": False, "parent": None, "partition_key": None,
            "partition_bound": None, "replica_identity": "default", "from_extension": False, **changes}


def column(schema, table_name, name, type_name="integer", **changes):
    return {"schema": schema, "table": table_name, "position": 1, "name": name, "type": type_name, "nullable": True,
            "default": None, "identity": None, "generated": None, "comment": None, "is_enum": False, **changes}


class SnapshotMarkdownRobustnessTests(SnapshotFixture):
    """Nomes e comentários hostis não podem quebrar tabela Markdown nem sobrescrever arquivo alheio."""

    def render(self, db, errors=()):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        snapshot._SLUG_SEEN.clear()
        snapshot.ERRORS.extend({"section": name, "error": "falha simulada"} for name in errors)
        with contextlib.redirect_stdout(io.StringIO()):
            snapshot.render_tables(db)
            snapshot.render_simple(db, {"enabled": False})

    def read(self, relative):
        return (self.out / relative).read_text(encoding="utf-8")

    def test_barra_antes_do_pipe_nao_abre_celula_nova(self):
        md_table = self.snapshot.md_table
        for value in ("a|b", "a\\|b", "a\\\\|b", "regex ^x\\|y$ e z|w", "fim\\", "|", "\\|\\|"):
            with self.subTest(value=value):
                row = md_table(["um", "dois"], [[value, "ok"]]).splitlines()[2]
                self.assertEqual(len(gfm_cells(row)), 2, row)
        # pipe simples continua com o mesmo escape de antes: saída já publicada não muda.
        self.assertEqual(self.snapshot.md_cell("a|b"), "a\\|b")

    def test_comentario_multilinha_fica_dentro_da_citacao(self):
        comment = "Empresas | do grupo\r\n## Colunas\n| falso | cabeçalho |\nregex a\\|b"
        self.render({"tables": [table("public", "empresas", comment=comment)]})
        document = self.read("tables/public/empresas.md")
        self.assertIn("> Empresas | do grupo\n> ## Colunas\n> | falso | cabeçalho |\n> regex a\\|b\n", document)
        self.assertEqual(document.count("\n## Colunas\n"), 1)
        self.assertEqual(broken_markdown_tables(self.out), [])

    def test_schemas_que_colidem_no_slug_nao_dividem_o_mesmo_arquivo(self):
        db = {"tables": [table("a b", "t"), table("a_b", "t"), table("public", "Ação"), table("public", "A_o")],
              "columns": [column("a b", "t", "só_no_primeiro"), column("a_b", "t", "só_no_segundo")]}
        self.render(db)
        links = re.findall(r"\]\((tables/[^)]+)\)", self.read("tables.md"))
        self.assertEqual(len(links), 4)
        self.assertEqual(len(set(links)), 4, links)
        titles = {self.read(link).splitlines()[0] for link in links}
        self.assertEqual(titles, {"# a b.t", "# a_b.t", "# public.Ação", "# public.A_o"})
        first, second = (self.read(link) for link in links[:2])
        self.assertIn("só_no_primeiro", first)
        self.assertIn("só_no_segundo", second)

    def test_funcoes_que_colidem_no_slug_mantem_cada_corpo(self):
        functions = [function("calc total", 1), function("calc_total", 2)]
        for record in functions:
            record["schema"] = "a b" if record["name"] == "calc total" else "a_b"
        functions += [function("calc total", 3), function("calc_total", 4)]
        self.assertEqual(self.collect(functions=functions), 0)
        links = re.findall(r"\]\((functions/[^)]+)\)", self.read("functions.md"))
        self.assertEqual(len(set(links)), 4, links)
        bodies = sorted(re.search(r"SELECT (\d)", self.read(link)).group(1) for link in links)
        self.assertEqual(bodies, ["1", "2", "3", "4"])

    def test_nome_so_de_pontos_nao_sai_da_pasta_de_saida(self):
        self.assertEqual(self.snapshot.slug(".."), "_")
        self.assertEqual(self.snapshot.slug("."), "_")
        self.assertEqual(self.snapshot.slug("a.b"), "a.b")
        self.render({"tables": [table("..", "README"), table(".", "x")]})
        self.assertFalse((self.out / "x.md").exists())
        self.assertFalse((self.out / "README.md").exists())
        self.assertEqual(len(list((self.out / "tables").rglob("*.md"))), 2)

    def test_quebra_de_linha_e_crases_nao_partem_titulo_nem_bloco_sql(self):
        view = {"schema": "public", "name": "v\ncerca", "kind": "view", "definition": "SELECT 'x\n```\ny' AS c;",
                "options": None, "owner": "postgres", "comment": None, "populated": None,
                "security_invoker": True, "depends_on": []}
        policy = {"schema": "public", "table": "t\nnl", "name": "p\nnl", "permissive": "PERMISSIVE",
                  "roles": ["public"], "cmd": "ALL", "using": "true", "with_check": None}
        self.render({"tables": [table("public", "t\nnl", rls_enabled=True)], "views": [view], "policies": [policy]})
        document = self.read("views.md")
        self.assertIn("## public.v cerca (view)\n", document)
        self.assertIn("\n````sql\nSELECT 'x\n```\ny' AS c;\n````\n", document)
        table_document = self.read("tables/public/t_nl.md")
        self.assertTrue(table_document.startswith("# public.t nl\n"))
        self.assertIn("### `p nl`\n", table_document)
        self.assertEqual(broken_markdown_tables(self.out), [])

    def test_view_sem_crases_mantem_o_bloco_de_tres(self):
        self.assertEqual(self.snapshot.sql_block("SELECT 1;"), "\n```sql\nSELECT 1;\n```\n")

    def test_enum_homonimo_em_outro_schema_nao_recebe_o_uso_alheio(self):
        types_ = [
            {"schema": "financeiro", "name": "status", "kind": "enum", "values": ["a"], "definition": None,
             "type_ref": "financeiro.status"},
            {"schema": "public", "name": "status", "kind": "enum", "values": ["b"], "definition": None,
             "type_ref": "status"},
            # registro reaproveitado de snapshot anterior à correção: só o nome está disponível.
            {"schema": "public", "name": "antigo", "kind": "enum", "values": ["c"], "definition": None},
        ]
        columns = [column("public", "contas", "st", "financeiro.status", is_enum=True),
                   column("public", "pedidos", "st", "status", is_enum=True),
                   column("public", "legado", "st", "antigo", is_enum=True)]
        self.render({"types": types_, "columns": columns})
        rows = {gfm_cells(line)[0].strip(): gfm_cells(line)[3].strip()
                for line in self.read("types-enums.md").splitlines() if line.startswith("| ") and "enum" in line}
        self.assertEqual(rows, {"financeiro.status": "public.contas.st", "public.status": "public.pedidos.st",
                                "public.antigo": "public.legado.st"})

    def test_type_ref_nao_entra_no_fingerprint(self):
        old = {"schema": "public", "name": "status", "kind": "enum", "values": ["a"], "definition": None}
        fingerprints = self.snapshot.fingerprints
        before = fingerprints({"db": {"types": [old]}})
        after = fingerprints({"db": {"types": [{**old, "type_ref": "status"}]}})
        self.assertEqual(self.snapshot.diff_fingerprints(before, after), [])
        changed = fingerprints({"db": {"types": [{**old, "values": ["a", "b"], "type_ref": "status"}]}})
        self.assertEqual([entry[:2] for entry in self.snapshot.diff_fingerprints(before, changed)],
                         [("types/enums", "alterado")])

    def test_secao_que_falhou_sem_historico_nao_vira_ausencia(self):
        db = {"tables": [table("public", "protegida", rls_enabled=True)], "policies": None, "columns": None,
              "cron": None, "queues": None, "views": None}
        self.render(db, errors=("policies", "columns", "cron", "queues", "views"))
        document = self.read("tables/public/protegida.md")
        self.assertNotIn("sem policies", document)
        self.assertIn("Seção `policies` indisponível", document)
        self.assertIn("Seção `columns` indisponível", document)
        self.assertNotIn("não instalada", self.read("cron.md"))
        self.assertIn("Seção `cron` indisponível", self.read("cron.md"))
        self.assertNotIn("não instalada", self.read("queues.md"))
        self.assertIn("Seção `queues` indisponível", self.read("queues.md"))
        self.assertIn("Seção `views` indisponível", self.read("views.md"))

    def test_secao_coletada_e_vazia_continua_sem_aviso(self):
        db = {"tables": [table("public", "protegida", rls_enabled=True)], "policies": [], "columns": [],
              "cron": {"installed": False, "jobs": []}, "queues": {"installed": False, "queues": []}, "views": []}
        self.render(db)
        document = self.read("tables/public/protegida.md")
        self.assertIn("RLS habilitado **sem policies**", document)
        self.assertNotIn("indisponível", document)
        self.assertEqual(self.read("cron.md"), "# Cron (pg_cron)\n\n_extensão pg_cron não instalada_\n")
        self.assertEqual(self.read("queues.md"), "# Queues (pgmq)\n\n_extensão pgmq não instalada_\n")
        self.assertEqual(self.read("views.md"), "# Views\n\n_nenhuma_\n")

    def test_opcao_security_invoker_aceita_as_grafias_do_postgres(self):
        pattern = re.search(r"~\* '([^']+)'", self.snapshot.SECURITY_INVOKER_ON).group(1)
        for option in ("security_invoker=true", "security_invoker=on", "security_invoker=1", "security_invoker=yes",
                       "security_invoker=TRUE", "security_invoker=t"):
            self.assertRegex(option.lower(), pattern)
        for option in ("security_invoker=false", "security_invoker=off", "security_invoker=0", "security_invoker=no",
                       "security_barrier=true", "xsecurity_invoker=true", "security_invoker=true1"):
            self.assertNotRegex(option.lower(), pattern)


class SnapshotUnavailableDatabaseTests(SnapshotFixture):
    """Banco fora do ar ou DSN errado: sai com 1, sem renovar o frescor e sem ecoar a credencial."""

    def tree(self):
        return {path.relative_to(self.out): path.read_bytes() for path in sorted(self.out.rglob("*")) if path.is_file()}

    def run_main(self, dsn, error):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        snapshot.CARRIED.clear()
        with (mock.patch.object(snapshot, "DB_URL", dsn),
              mock.patch.object(snapshot.psycopg, "connect", side_effect=error),
              contextlib.redirect_stdout(io.StringIO()) as stdout,
              contextlib.redirect_stderr(io.StringIO()) as stderr):
            code = snapshot.main()
        return code, stdout.getvalue() + stderr.getvalue()

    def test_todas_as_secoes_falhando_com_historico_nao_renova_o_frescor(self):
        self.assertEqual(self.collect(), 0)
        before = self.tree()
        self.assertEqual(self.collect(failures={"server", "functions", "migrations"}), 1)
        self.assertEqual(self.tree(), before)

    def test_uma_secao_nova_basta_para_publicar_a_coleta_parcial(self):
        self.assertEqual(self.collect(), 0)
        self.assertEqual(self.collect(failures={"functions", "migrations"}), 0)
        self.assertEqual(set(self.metadata()["carried"]), {"functions", "migrations"})

    def test_snapshot_anterior_com_estrutura_invalida_vira_primeira_coleta(self):
        for body in ('{"format_version": 2, "db": [1], "api": {}}', '{"format_version": 2, "db": "x", "api": []}',
                     '{"format_version": 2, "db": {"tables": "x"}, "api": {}}',
                     '{"format_version": 2, "db": {"functions": [{"name": 1}]}, "api": {}}', "[1, 2]", "lixo{"):
            with self.subTest(body=body):
                self.assertEqual(self.collect(), 0)
                (self.out / "snapshot.json").write_text(body, encoding="utf-8")
                self.assertEqual(self.collect(), 0)
                self.assertEqual(self.metadata()["db"]["functions"][0]["name"], "demo")
                self.assertEqual(self.metadata()["errors"], [])
                self.assertTrue((self.out / "manifest.json").is_file())
                self.assertTrue(self.function_sql().is_file())

    def test_falha_de_conexao_sai_com_1_sem_traceback_nem_pedaco_da_senha(self):
        cases = (
            ("postgresql://leitor:Senha@Arroba88@127.0.0.1:5432/db",
             "failed to resolve host 'Arroba88@127.0.0.1': [Errno -2] Name or service not known", ("Arroba88",)),
            ("postgresql://leitor:Senha Espaco55@127.0.0.1:5432/db",
             'unexpected spaces found in "Senha Espaco55", use percent-encoded spaces (%20) instead', ("Espaco55",)),
            ("postgresql://leitor:Senha%ZZporcento@127.0.0.1:5432/db",
             'invalid percent-encoded token: "Senha%ZZporcento"', ("ZZporcento",)),
            ("postgresql//leitor:SenhaTypo123@127.0.0.1:5432/db",
             'missing "=" after "postgresql//leitor:SenhaTypo123@127.0.0.1:5432/db" in connection info string',
             ("SenhaTypo123",)),
            ("host=h user=u password=SenhaKw22 dbname=d", 'erro citando password=SenhaKw22 literalmente', ("SenhaKw22",)),
            ("postgresql://u@h/db?password=SenhaQuery12&sslmode=require", "erro citando SenhaQuery12", ("SenhaQuery12",)),
            ("postgresql://u:S3nh%40%2FLeitor%231@h/db", "erro citando S3nh@/Leitor#1 e S3nh%40%2FLeitor%231",
             ("S3nh", "Leitor")),
        )
        for dsn, message, secrets in cases:
            with self.subTest(dsn=dsn):
                code, output = self.run_main(dsn, RuntimeError(message + "\nlinha 2 com " + secrets[0]))
                self.assertEqual(code, 1)
                self.assertIn("Banco indisponível: RuntimeError:", output)
                self.assertIn("[REDACTED]", output)
                self.assertNotIn("Traceback", output)
                for secret in secrets:
                    self.assertNotIn(secret, output)
                self.assertFalse((self.out / "manifest.json").exists())
                self.assertFalse((self.out / "snapshot.json").exists())

    def test_falha_de_conexao_preserva_o_snapshot_anterior(self):
        self.assertEqual(self.collect(), 0)
        before = self.tree()
        code, output = self.run_main("postgresql://u:SenhaBoa123@h/db", TimeoutError("connection timeout expired"))
        self.assertEqual(code, 1)
        self.assertIn("connection timeout expired", output)
        self.assertEqual(self.tree(), before)

    def test_excecao_original_do_driver_nao_fica_encadeada(self):
        snapshot = self.snapshot
        with (mock.patch.object(snapshot, "DB_URL", "postgresql://u:Senha@Arroba88@h/db"),
              mock.patch.object(snapshot.psycopg, "connect", side_effect=RuntimeError("host 'Arroba88@h'")),
              self.assertRaises(snapshot.DatabaseUnavailable) as caught):
            snapshot.connect_db()
        self.assertTrue(caught.exception.__suppress_context__)
        self.assertNotIn("Arroba88", str(caught.exception))

    def test_fragmentos_do_dsn_preservam_usuario_host_e_banco(self):
        fragments = self.snapshot.dsn_secret_fragments
        self.assertEqual(fragments("postgresql://postgres.ref:SenhaReal123@aws-0.pooler.supabase.com:5432/postgres"),
                         ["SenhaReal123"])
        self.assertEqual(fragments("postgresql://postgres@127.0.0.1:5432/postgres"), [])
        self.assertEqual(fragments("postgresql://127.0.0.1:5432/postgres"), [])
        self.assertEqual(fragments("offline-fixture"), [])
        self.assertEqual(fragments("host=h port=5432 user=u password='Senha Kw' dbname=d"), ["Senha"])

    def test_erro_de_secao_tambem_redige_pedaco_da_senha(self):
        snapshot = self.snapshot
        snapshot.ERRORS.clear()
        with (mock.patch.object(snapshot, "DB_URL", "postgresql://u:Senha%ZZporcento@h/db"),
              contextlib.redirect_stdout(io.StringIO()) as stdout):
            snapshot.record_error("pg_dump", 'pg_dump: error: invalid percent-encoded token: "Senha%ZZporcento"')
        self.assertNotIn("ZZporcento", snapshot.ERRORS[0]["error"] + stdout.getvalue())
        self.assertIn("invalid percent-encoded token", snapshot.ERRORS[0]["error"])

    def test_ajuda_nao_coleta_e_argumento_desconhecido_sai_com_2(self):
        stub = pathlib.Path(self.temp.name) / "stub" / "psycopg"
        stub.mkdir(parents=True)
        (stub / "__init__.py").write_text("def connect(*args, **kwargs):\n    raise SystemExit(99)\n", encoding="utf-8")
        (stub / "rows.py").write_text("dict_row = None\n", encoding="utf-8")
        env = {"PATH": os.environ.get("PATH", ""), "PYTHONPATH": str(stub.parent), "PYTHONDONTWRITEBYTECODE": "1",
               "SUPABASE_DB_URL": "postgresql://u:SenhaAjuda123@h/db", "SNAPSHOT_DIR": str(self.out)}
        script = str(pathlib.Path(__file__).with_name("snapshot.py"))
        for arguments, code in ((["--help"], 0), (["-h"], 0), (["--qualquer"], 2), (["docs/supabase"], 2)):
            with self.subTest(arguments=arguments):
                result = subprocess.run([sys.executable, script, *arguments], env=env, capture_output=True,
                                        text=True, timeout=60, check=False)
                self.assertEqual(result.returncode, code, result.stderr)
                self.assertIn("SUPABASE_DB_URL", result.stdout if code == 0 else result.stderr)
                self.assertNotIn("SenhaAjuda123", result.stdout + result.stderr)
                self.assertFalse(self.out.exists(), "ajuda/argumento inválido não pode iniciar a coleta")


def load_with_real_driver(dsn, out):
    """Carrega snapshot.py com o psycopg instalado (as demais classes usam um driver falso)."""
    spec = importlib.util.spec_from_file_location("snapshot_real_driver", pathlib.Path(__file__).with_name("snapshot.py"))
    module = importlib.util.module_from_spec(spec)
    env = {"SUPABASE_DB_URL": dsn, "SNAPSHOT_DIR": str(out), "PGDUMP": "false", "GEN_TYPES": "false", "REPO_ROOT": ""}
    with mock.patch.dict(os.environ, env, clear=True):
        spec.loader.exec_module(module)
    return module


def run_with_real_driver(dsn, out):
    module = load_with_real_driver(dsn, out)
    with contextlib.redirect_stdout(io.StringIO()) as stdout, contextlib.redirect_stderr(io.StringIO()) as stderr:
        code = module.main()
    return code, stdout.getvalue() + stderr.getvalue(), module


try:
    import psycopg as real_psycopg
except ImportError:  # a suíte offline não depende do driver
    real_psycopg = None


@unittest.skipIf(real_psycopg is None, "psycopg não instalado")
class SnapshotRealDriverDsnTests(unittest.TestCase):
    """Mensagens reais do driver para DSN malformado; o erro acontece antes de qualquer conexão."""

    def test_dsn_malformado_nao_ecoa_a_senha(self):
        with tempfile.TemporaryDirectory(prefix="snapshot-dsn-test-") as temp:
            for dsn, secret in (("postgresql://leitor:Senha Espaco55@127.0.0.1:1/db", "Espaco55"),
                                ("postgresql://leitor:Senha%ZZporcento@127.0.0.1:1/db", "ZZporcento"),
                                ("postgresql//leitor:SenhaTypo123@127.0.0.1:1/db", "SenhaTypo123")):
                with self.subTest(dsn=dsn):
                    out = pathlib.Path(temp) / "output"
                    code, output, _ = run_with_real_driver(dsn, out)
                    self.assertEqual(code, 1)
                    self.assertIn("Banco indisponível", output)
                    self.assertNotIn(secret, output)
                    self.assertNotIn("Traceback", output)
                    self.assertFalse((out / "manifest.json").exists())


POSTGRES_FIXTURE = r"""
CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN;
CREATE SCHEMA supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
INSERT INTO supabase_migrations.schema_migrations VALUES ('20260101000000', ARRAY['select 1'], 'inicial');
CREATE SCHEMA financeiro; CREATE SCHEMA "a b"; CREATE SCHEMA a_b;
CREATE TYPE public.status AS ENUM ('novo', 'pago|parcial');
CREATE TYPE financeiro.status AS ENUM ('a', 'b');
CREATE TABLE public.empresas (id int PRIMARY KEY, nome text);
COMMENT ON TABLE public.empresas IS E'Empresas | do grupo\n## Colunas\n| falso | cabeçalho |\nregex a\\|b';
COMMENT ON COLUMN public.empresas.nome IS E'nome | fantasia\ncom quebra e a\\|b';
CREATE TABLE public."Pedidos 2024" (id int PRIMARY KEY, st public.status, empresa_id int REFERENCES public.empresas (id),
  obs text DEFAULT 'a|b', CONSTRAINT "chk|pipe" CHECK (obs ~ '^a\|b'));
CREATE TABLE public.pedidos_2024 (id int PRIMARY KEY, st financeiro.status);
CREATE TABLE "a b".t (id int PRIMARY KEY, so_no_primeiro int);
CREATE TABLE a_b.t (id int PRIMARY KEY, so_no_segundo int);
CREATE TABLE public.vazia ();
CREATE TABLE public.sem_policy (id int PRIMARY KEY);
ALTER TABLE public.sem_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tudo liberado" ON public.empresas USING (true);
CREATE TABLE public.pai (a int, b int, PRIMARY KEY (b, a));
CREATE TABLE public.filho_permutado (id int PRIMARY KEY, x int, z int, FOREIGN KEY (z, x) REFERENCES public.pai (b, a));
CREATE INDEX ON public.filho_permutado (x, z);
CREATE TABLE public.filho_parcial (id int PRIMARY KEY, x int, z int, FOREIGN KEY (x, z) REFERENCES public.pai (b, a));
CREATE INDEX ON public.filho_parcial (x, z) WHERE id > 0;
CREATE TABLE public.filho_indexado (id int PRIMARY KEY, x int, z int, FOREIGN KEY (x, z) REFERENCES public.pai (b, a));
CREATE INDEX ON public.filho_indexado (x, z, id);
CREATE TABLE public.lanc (id int, dt date NOT NULL) PARTITION BY RANGE (dt);
CREATE TABLE public.lanc_2026 PARTITION OF public.lanc FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE VIEW public.v_sem AS SELECT id FROM public.empresas;
CREATE VIEW public.v_true WITH (security_invoker = true) AS SELECT id FROM public.empresas;
CREATE VIEW public.v_on WITH (security_invoker = on) AS SELECT id FROM public.empresas;
CREATE VIEW public.v_um WITH (security_invoker = 1) AS SELECT id FROM public.empresas;
CREATE VIEW public.v_yes WITH (security_barrier = true, security_invoker = yes) AS SELECT id FROM public.empresas;
CREATE VIEW public.v_off WITH (security_invoker = off) AS SELECT id FROM public.empresas;
CREATE MATERIALIZED VIEW public.mv AS SELECT count(*) AS n FROM public.empresas WITH NO DATA;
CREATE FUNCTION public.soma(a int, b int) RETURNS int LANGUAGE sql AS $$ SELECT a + b $$;
CREATE FUNCTION public.soma(a text) RETURNS text LANGUAGE sql AS $$ SELECT a $$;
CREATE FUNCTION public.secdef_ruim() RETURNS int LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.secdef_bom() RETURNS int LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$ SELECT 1 $$;
CREATE FUNCTION public.trg() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE TRIGGER "trg antes|x" BEFORE INSERT ON public."Pedidos 2024" FOR EACH ROW EXECUTE FUNCTION public.trg();
"""


class SnapshotPostgresTests(unittest.TestCase):
    """Ponta a ponta contra um Postgres descartável. Só roda com SNAPSHOT_TEST_DSN apontando para
    um servidor local (>= 15) onde o usuário pode criar banco; sem isso a classe inteira é pulada."""

    @classmethod
    def setUpClass(cls):
        admin = os.environ.get("SNAPSHOT_TEST_DSN", "").strip()
        if not admin:
            raise unittest.SkipTest("SNAPSHOT_TEST_DSN não definido")
        if real_psycopg is None:
            raise unittest.SkipTest("psycopg não instalado")
        from psycopg import conninfo
        try:
            host = conninfo.conninfo_to_dict(admin).get("host") or ""
        except real_psycopg.Error:
            raise unittest.SkipTest("SNAPSHOT_TEST_DSN inválido") from None
        if host not in ("127.0.0.1", "localhost", "::1"):
            raise unittest.SkipTest("SNAPSHOT_TEST_DSN precisa apontar para um servidor local descartável")
        cls.database = f"snapshot_it_{os.getpid()}"
        cls.role = f"snapshot_it_leitor_{os.getpid()}"
        cls.roles = [cls.role]
        try:
            with real_psycopg.connect(admin, autocommit=True, connect_timeout=5) as conn:
                if conn.info.server_version < 150000:
                    raise unittest.SkipTest("security_invoker exige Postgres >= 15")
                conn.execute(f'CREATE DATABASE "{cls.database}"')
        except real_psycopg.Error as error:
            raise unittest.SkipTest(f"Postgres local indisponível: {type(error).__name__}") from None
        cls.admin = admin
        cls.addClassCleanup(cls.drop_database)
        cls.dsn = conninfo.make_conninfo(admin, dbname=cls.database)
        with real_psycopg.connect(cls.dsn, autocommit=True) as conn:
            existing = {row[0] for row in conn.execute("SELECT rolname FROM pg_roles").fetchall()}
            fixture = POSTGRES_FIXTURE
            for role in ("anon", "authenticated", "service_role"):
                if role in existing:
                    fixture = fixture.replace(f"CREATE ROLE {role} NOLOGIN;", "")
                else:
                    cls.roles.append(role)  # roles são do cluster: o que a suíte criou, a suíte remove
            conn.execute(f'CREATE ROLE "{cls.role}" NOLOGIN')
            conn.execute(fixture)
        cls.restricted = conninfo.make_conninfo(cls.dsn, options=f"-c role={cls.role}")
        cls.temp = tempfile.TemporaryDirectory(prefix="snapshot-pg-test-")
        cls.addClassCleanup(cls.temp.cleanup)
        cls.out = pathlib.Path(cls.temp.name) / "output"
        cls.code, cls.log, cls.snapshot = run_with_real_driver(cls.dsn, cls.out)
        cls.first = {path.relative_to(cls.out): path.read_bytes() for path in cls.out.rglob("*") if path.is_file()}

    @classmethod
    def drop_database(cls):
        with real_psycopg.connect(cls.admin, autocommit=True) as conn:
            conn.execute(f'DROP DATABASE IF EXISTS "{cls.database}" WITH (FORCE)')
            for role in cls.roles:
                conn.execute(f'DROP ROLE IF EXISTS "{role}"')

    def read(self, relative):
        return (self.out / relative).read_text(encoding="utf-8")

    def data(self):
        return json.loads(self.read("snapshot.json"))["db"]

    def lints(self, code):
        return {lint["object"] for lint in self.data()["lints"] if lint["code"] == code}

    def test_coleta_completa_sem_erros(self):
        self.assertEqual(self.code, 0, self.log)
        # storage.* não existe num Postgres comum; todo o resto precisa ter sido coletado.
        self.assertEqual({error["section"] for error in json.loads(self.read("manifest.json"))["erros"]},
                         {"storage", "db_stats"})
        self.assertEqual(self.read("cron.md"), "# Cron (pg_cron)\n\n_extensão pg_cron não instalada_\n")

    def test_tabelas_do_catalogo_tem_um_arquivo_cada(self):
        with real_psycopg.connect(self.dsn, autocommit=True) as conn:
            catalog = {f"{schema}.{name}" for schema, name in conn.execute(
                "SELECT n.nspname, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace "
                "WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','financeiro','a b','a_b')").fetchall()}
        self.assertEqual({f"{t['schema']}.{t['name']}" for t in self.data()["tables"]}, catalog)
        files = [path for path in (self.out / "tables").rglob("*.md")]
        self.assertEqual({path.read_text(encoding="utf-8").splitlines()[0][2:] for path in files}, catalog)
        self.assertEqual(len(files), len(catalog))
        self.assertIn("so_no_primeiro", self.read("tables/a_b/t.md"))

    def test_markdown_integro_com_nomes_e_comentarios_hostis(self):
        self.assertEqual(broken_markdown_tables(self.out), [])
        self.assertEqual(self.read("tables/public/empresas.md").count("\n## Colunas\n"), 1)

    def test_chave_composta_mantem_a_ordem_e_o_par_de_colunas(self):
        constraints = {c["name"]: c for c in self.data()["constraints"]}
        self.assertEqual(constraints["pai_pkey"]["columns"], ["b", "a"])
        permuted = constraints["filho_permutado_z_x_fkey"]
        self.assertEqual((permuted["columns"], permuted["ref_columns"]), (["z", "x"], ["b", "a"]))
        partial = constraints["filho_parcial_x_z_fkey"]
        self.assertEqual((partial["columns"], partial["ref_columns"]), (["x", "z"], ["b", "a"]))
        self.assertIn("| public.filho_parcial | x, z | public.pai | b, a |", self.read("relationships.md"))

    def test_lint_de_fk_sem_indice_aceita_permutacao_e_recusa_indice_parcial(self):
        flagged = self.lints("fk_without_index")
        self.assertNotIn("public.filho_permutado.filho_permutado_z_x_fkey", flagged)
        self.assertNotIn("public.filho_indexado.filho_indexado_x_z_fkey", flagged)
        self.assertIn("public.filho_parcial.filho_parcial_x_z_fkey", flagged)
        self.assertIn("public.Pedidos 2024.Pedidos 2024_empresa_id_fkey", flagged)

    def test_security_invoker_reconhece_on_yes_e_1(self):
        views = {view["name"]: view["security_invoker"] for view in self.data()["views"]}
        self.assertEqual(views, {"v_sem": False, "v_true": True, "v_on": True, "v_um": True, "v_yes": True,
                                 "v_off": False, "mv": False})
        self.assertEqual(self.lints("view_security_definer"), {"public.v_sem", "public.v_off"})

    def test_lints_de_rls_e_security_definer(self):
        self.assertEqual(self.lints("rls_no_policies"), {"public.sem_policy"})
        self.assertIn("public.vazia", self.lints("rls_disabled"))
        self.assertEqual(self.lints("secdef_mutable_search_path"), {"public.secdef_ruim()"})

    def test_enum_homonimo_e_atribuido_ao_schema_certo(self):
        rows = {gfm_cells(line)[0].strip(): gfm_cells(line)[3].strip()
                for line in self.read("types-enums.md").splitlines() if line.startswith("| ") and "| enum |" in line}
        self.assertEqual(rows, {"financeiro.status": "public.pedidos_2024.st", "public.status": "public.Pedidos 2024.st"})

    def test_overloads_tem_um_sql_por_assinatura(self):
        soma = [f for f in self.data()["functions"] if f["name"] == "soma"]
        self.assertEqual(len(soma), 2)
        links = re.findall(r"\]\((functions/public/soma__[^)]+)\)", self.read("functions.md"))
        self.assertEqual(len(set(links)), 2)
        self.assertTrue(all((self.out / link).is_file() for link in links))

    def test_segunda_coleta_sem_mudanca_so_altera_o_carimbo(self):
        code, log, _ = run_with_real_driver(self.dsn, self.out)
        self.assertEqual(code, 0, log)
        second = {path.relative_to(self.out): path.read_bytes() for path in self.out.rglob("*") if path.is_file()}
        volatile = {pathlib.Path(name) for name in ("manifest.json", "stats.json", "stats.md", "cron-runs.md")}
        self.assertEqual(set(second), set(self.first))
        self.assertEqual([str(name) for name in sorted(self.first) if name not in volatile and self.first[name] != second[name]], [])
        manifests = [json.loads(tree[pathlib.Path("manifest.json")]) for tree in (self.first, second)]
        for manifest in manifests:
            manifest.pop("gerado_em")
        self.assertEqual(manifests[0], manifests[1])

    def test_sessao_do_coletor_e_somente_leitura_com_timeouts(self):
        snapshot = load_with_real_driver(self.dsn, self.out)
        observed = {}

        @snapshot.section("escrita")
        def write_attempt(conn):
            return snapshot.q(conn, "CREATE TABLE public.nao_pode_existir (id int)")

        @snapshot.section("insercao")
        def insert_attempt(conn):
            return snapshot.q(conn, "INSERT INTO public.pai VALUES (1, 1) RETURNING a")

        @snapshot.section("sessao")
        def session(conn):
            for name in ("statement_timeout", "lock_timeout", "default_transaction_read_only", "application_name"):
                observed[name] = snapshot.q(conn, f"SHOW {name}")[0][name]
            return observed

        snapshot.DB_SECTIONS = [write_attempt, insert_attempt, session]
        with contextlib.redirect_stdout(io.StringIO()):
            db, _ = snapshot.introspect_db(None)
        self.assertIsNone(db["escrita"])
        self.assertIsNone(db["insercao"])
        self.assertEqual([error["section"] for error in snapshot.ERRORS], ["escrita", "insercao"])
        self.assertTrue(all("read-only" in error["error"] for error in snapshot.ERRORS), snapshot.ERRORS)
        self.assertEqual(observed, {"statement_timeout": "90s", "lock_timeout": "5s",
                                    "default_transaction_read_only": "on", "application_name": "supabase-snapshot"})
        with real_psycopg.connect(self.dsn, autocommit=True) as conn:
            self.assertEqual(conn.execute("SELECT to_regclass('public.nao_pode_existir')::text, "
                                          "(SELECT count(*) FROM public.pai)").fetchone(), (None, 0))

    def test_permissao_negada_em_um_catalogo_reaproveita_sem_apagar(self):
        with tempfile.TemporaryDirectory(prefix="snapshot-pg-parcial-") as temp:
            out = pathlib.Path(temp) / "output"
            shutil.copytree(self.out, out)
            migration = out / "migrations" / "20260101000000_inicial.sql"
            before = migration.read_bytes()
            code, log, _ = run_with_real_driver(self.restricted, out)
            self.assertEqual(code, 0, log)
            manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
            self.assertIn("migrations", manifest["carried"])
            self.assertIn("permission denied", {e["section"]: e["error"] for e in manifest["erros"]}["migrations"])
            self.assertEqual(migration.read_bytes(), before)
            self.assertIn("Seção `migrations` não pôde ser atualizada", (out / "migrations.md").read_text(encoding="utf-8"))
            current = json.loads((out / "snapshot.json").read_text(encoding="utf-8"))["db"]
            self.assertEqual(current["migrations"], self.data()["migrations"])
            self.assertEqual(len(current["tables"]), len(self.data()["tables"]))

    def test_permissao_negada_sem_historico_nao_afirma_lista_vazia(self):
        with tempfile.TemporaryDirectory(prefix="snapshot-pg-inicial-") as temp:
            out = pathlib.Path(temp) / "output"
            code, log, _ = run_with_real_driver(self.restricted, out)
            self.assertEqual(code, 0, log)
            document = (out / "migrations.md").read_text(encoding="utf-8")
            self.assertIn("Coleta indisponível", document)
            self.assertNotIn("_nenhum_", document)
            self.assertIn("| migrations | permission denied", (out / "errors.md").read_text(encoding="utf-8"))

    def test_banco_inexistente_sai_com_1_e_preserva_a_saida(self):
        from psycopg import conninfo
        with tempfile.TemporaryDirectory(prefix="snapshot-pg-fora-") as temp:
            out = pathlib.Path(temp) / "output"
            shutil.copytree(self.out, out)
            before = {path.relative_to(out): path.read_bytes() for path in out.rglob("*") if path.is_file()}
            code, log, _ = run_with_real_driver(conninfo.make_conninfo(self.dsn, dbname="snapshot_it_nao_existe"), out)
            self.assertEqual(code, 1)
            self.assertIn("Banco indisponível", log)
            self.assertNotIn("Traceback", log)
            self.assertEqual({path.relative_to(out): path.read_bytes() for path in out.rglob("*") if path.is_file()}, before)

if __name__ == "__main__":
    unittest.main()
