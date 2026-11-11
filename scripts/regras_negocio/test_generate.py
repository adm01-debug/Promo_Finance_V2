"""Regressões offline do gerador de regras; não acessam banco nem APIs de LLM."""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path


SCRIPT = Path(__file__).with_name("generate.py")
SPEC = importlib.util.spec_from_file_location("context_rules_generate", SCRIPT)
generator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(generator)


class CurrentSqlSourcesTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="context-rules-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.files = []

    def write(self, name, content):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(content, encoding="utf-8")
        self.files.append(file)
        return file

    def schema(self):
        return generator.parse_sql_schema(self.root, self.files)

    def test_foreign_migration_cannot_replace_current_table(self):
        current = "supabase/migrations/20260101000000_orders.sql"
        self.write(current, "CREATE TABLE public.orders (id uuid, created_at timestamptz);")
        self.write("supabase/migrations/_foreign/another-project/20250101000000_orders.sql",
                   "CREATE TABLE public.orders (id uuid, changed_at timestamptz);")
        schema = self.schema()
        self.assertEqual([c["name"] for c in schema["tables"]["orders"]["columns"]], ["id", "created_at"])
        self.assertEqual(schema["tables"]["orders"]["src"], current)
        self.assertEqual(schema["sources"], [current])

    def test_superseded_migration_cannot_undo_current_changes(self):
        self.write("supabase/migrations/20260101000000_orders.sql", "CREATE TABLE public.orders (id uuid);")
        self.write("supabase/migrations/20260102000000_status.sql", "ALTER TABLE public.orders ADD COLUMN status text;")
        self.write("supabase/migrations/_superseded/20250101000000_orders.sql", "DROP TABLE public.orders;")
        schema = self.schema()
        self.assertIn("orders", schema["tables"])
        self.assertEqual([c["name"] for c in schema["tables"]["orders"]["columns"]], ["id", "status"])
        self.assertEqual(len(schema["sources"]), 2)

    def test_archived_objects_do_not_contribute_to_schema_or_rules(self):
        sql = """
CREATE TYPE order_state AS ENUM ('open', 'done');
CREATE TABLE public.orders (id uuid PRIMARY KEY, status order_state DEFAULT 'open', amount numeric CHECK (amount >= 0));
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select ON public.orders FOR SELECT TO authenticated USING (true);
CREATE FUNCTION public.ensure_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'amount cannot be negative';
  RETURN NEW;
END;
$$;
CREATE TRIGGER ensure_order_before BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.ensure_order();
CREATE INDEX orders_status ON public.orders (status);
CREATE VIEW public.open_orders AS SELECT * FROM public.orders;
GRANT SELECT ON public.orders TO authenticated;
COMMENT ON TABLE public.orders IS 'Current orders';
SELECT cron.schedule('daily_orders', '0 0 * * *', $$SELECT 1$$);
"""
        self.write("supabase/migrations/20260101000000_orders.sql", sql)
        self.write("supabase/seed.sql", "INSERT INTO public.orders (id) VALUES ('current');")
        expected = self.schema()
        for key in ("tables", "policies", "triggers", "functions", "enums", "indexes", "cron_jobs",
                    "views", "rls", "grants", "raises", "seed", "comments"):
            self.assertTrue(expected[key], key)
        self.write("supabase/migrations/_foreign/old-project/20240101000000_schema.sql",
                   sql.replace("orders", "foreign_orders").replace("order_state", "foreign_state").replace("ensure_order", "ensure_foreign"))
        self.write("supabase/migrations/_superseded/20240102000000_seed.sql", "INSERT INTO public.orders (id) VALUES ('historical');")
        self.assertEqual(self.schema(), expected)

    def test_archive_only_repository_has_no_current_sql_schema(self):
        self.write("db/migrations/_foreign/old.sql", "CREATE TABLE old_foreign (id uuid);")
        self.write("db/migrations/_superseded/old.sql", "CREATE TABLE old_superseded (id uuid);")
        schema = self.schema()
        self.assertEqual(schema["sources"], [])
        self.assertEqual(schema["tables"], {})

    def test_exact_directory_names_leave_other_sql_sources_visible(self):
        # O nome de um diretório acima da raiz do repo não muda seu significado.
        self.root = self.root / "_foreign" / "project"
        paths = [
            "supabase/migrations/_foreign.sql",
            "supabase/migrations/_superseded.sql",
            "supabase/migrations/customer_foreign/active.sql",
            "supabase/migrations/_superseded_backup/active.sql",
            "packages/store/prisma/migrations/20260101/active.sql",
            "db/current.sql",
            "sql/current.sql",
            "database/current.sql",
            "prisma/current.sql",
            "custom/schema.sql",
        ]
        for index, name in enumerate(paths):
            self.write(name, f"CREATE TABLE current_{index} (id uuid);")
        schema = self.schema()
        self.assertEqual(schema["sources"], sorted(paths))
        self.assertEqual(set(schema["tables"]), {f"current_{i}" for i in range(len(paths))})

    def test_current_prisma_and_types_fallback_remain_available(self):
        self.write("prisma/schema.prisma", "model Store {\n id String @id\n}\n")
        self.write("src/database.types.ts", """
export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
        }
      }
    }
  }
}
""")
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"Store", "customers"})
        self.assertEqual(schema["tables"]["Store"]["origin"], "prisma")
        self.assertEqual(schema["tables"]["customers"]["origin"], "types.ts")

    def test_archived_sql_is_not_current_code_but_remains_in_file_inventory(self):
        current = self.write("supabase/migrations/20260101000000_retention.sql", "SELECT now() - interval '7 days';")
        archived = self.write("supabase/migrations/_superseded/20250101000000_retention.sql", "SELECT now() - interval '365 days';")
        self.assertTrue(generator.analyze_code_file(current, self.root)["temporal"])
        self.assertIsNone(generator.analyze_code_file(archived, self.root))
        files = generator.walk_repo(self.root, self.root / "output")
        self.assertEqual(set(files), {current, archived})

    def test_cli_rules_profile_uses_current_schema_and_temporal_rules(self):
        current = "supabase/migrations/20260101000000_orders.sql"
        archived = "supabase/migrations/_superseded/20250101000000_orders.sql"
        self.write(current, "CREATE TABLE public.orders (id uuid, created_at timestamptz);\nSELECT now() - interval '7 days';")
        self.write(archived, "CREATE TABLE public.orders (id uuid, historical_status text);\nSELECT now() - interval '365 days';")
        subprocess.run([sys.executable, str(SCRIPT), "--repo", str(self.root), "--out", "output",
                        "--profile", "regras", "--no-pointer"], check=True, capture_output=True, text=True, timeout=30)
        context = json.loads((self.root / "output/context.json").read_text(encoding="utf-8"))
        self.assertEqual(context["schema"]["sources"], [current])
        self.assertEqual([c["name"] for c in context["schema"]["tables"]["orders"]["columns"]], ["id", "created_at"])
        self.assertEqual(context["rules"]["temporal"], [{"file": current, "line": "SELECT now() - interval '7 days';"}])
        self.assertIn(current, context["code_files"])
        self.assertNotIn(archived, context["code_files"])
        self.assertEqual(context["meta"]["files_total"], 2)
        rendered = (self.root / "output/07-REGRAS-DE-NEGOCIO.md").read_text(encoding="utf-8")
        self.assertIn("7 days", rendered)
        self.assertNotIn("365 days", rendered)
        self.assertNotIn("historical_status", rendered)
        self.assertFalse((self.root / "AGENTS.md").exists())



class Fixture(unittest.TestCase):
    """Repo sintético em tmpdir: migrations numeradas, código e execução do CLI."""

    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="regras-negocio-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name) / "repo"
        self.root.mkdir()
        self.files = []
        self.seq = 0

    def write(self, name, content, encoding="utf-8"):
        file = self.root / name
        file.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            file.write_bytes(content)
        else:
            file.write_text(content, encoding=encoding)
        self.files.append(file)
        return file

    def sql(self, content):
        self.seq += 1
        name = f"supabase/migrations/202601010000{self.seq:02d}_m{self.seq}.sql"
        self.write(name, content)
        return name

    def schema(self):
        return generator.parse_sql_schema(self.root, self.files)

    def policies(self, schema, table):
        return {p["name"]: p for p in schema["policies"] if p["table"] == table}

    def columns(self, schema, table):
        return {c["name"]: c["type"] for c in schema["tables"][table]["columns"]}

    def cli(self, *args, out="saida", env=None, repo=None):
        environment = {k: v for k, v in os.environ.items() if not k.startswith("AI_CONTEXT_") and k != "ANTHROPIC_API_KEY"}
        environment.update({"PYTHONDONTWRITEBYTECODE": "1", **(env or {})})
        return subprocess.run([sys.executable, str(SCRIPT), "--repo", str(repo or self.root), "--out", out, *args],
                              capture_output=True, text=True, timeout=60, env=environment, check=False)

    def gerar(self, *args, **kwargs):
        result = self.cli("--profile", "regras", "--no-pointer", *args, **kwargs)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads((self.root / kwargs.get("out", "saida") / "context.json").read_text(encoding="utf-8"))

    def saida(self, name, out="saida"):
        return (self.root / out / name).read_text(encoding="utf-8")


class SqlTokenizerTests(unittest.TestCase):
    def statements(self, text):
        return generator.split_sql_statements(generator.strip_sql_comments(text))

    def test_apostrofo_em_identificador_entre_aspas_nao_abre_literal(self):
        got = self.statements('CREATE POLICY "it\'s mine" ON t USING (true); SELECT 1; SELECT 2;')
        self.assertEqual(got, ['CREATE POLICY "it\'s mine" ON t USING (true);', "SELECT 1;", "SELECT 2;"])

    def test_comentario_de_linha_dentro_de_literal_e_preservado(self):
        got = self.statements("INSERT INTO t VALUES ('a -- b'); SELECT 2; -- fim; x")
        self.assertEqual(got, ["INSERT INTO t VALUES ('a -- b');", "SELECT 2;"])

    def test_barra_asterisco_em_literal_nao_abre_comentario(self):
        got = self.statements("SELECT 'pasta/*'; SELECT cron.schedule('j', '*/5 * * * *', 'x'); /* c; c */ SELECT 3;")
        self.assertEqual(got, ["SELECT 'pasta/*';", "SELECT cron.schedule('j', '*/5 * * * *', 'x');", "SELECT 3;"])

    def test_comentario_de_bloco_aninhado_some_inteiro(self):
        self.assertEqual(self.statements("SELECT 1 /* a /* b; */ c; */ ; SELECT 8;"), ["SELECT 1;", "SELECT 8;"])

    def test_split_em_texto_cru_nao_divide_dentro_de_comentario(self):
        got = generator.split_sql_statements("SELECT 1; -- a; b\nSELECT 2 /* c; d */;")
        self.assertEqual(len(got), 2)
        self.assertTrue(got[1].startswith("-- a; b\nSELECT 2"))

    def test_dollar_tag_com_digito_protege_o_corpo(self):
        got = self.statements("CREATE FUNCTION f() RETURNS int AS $b1$ SELECT 1; -- x; y\n $b1$ LANGUAGE sql; SELECT 4;")
        self.assertEqual(len(got), 2)
        self.assertIn("$b1$ SELECT 1; \n $b1$", got[0])

    def test_dollar_aninhado_com_tags_diferentes(self):
        got = self.statements("DO $$ BEGIN EXECUTE $q$ SELECT ';' $q$; END $$; SELECT 5;")
        self.assertEqual(got, ["DO $$ BEGIN EXECUTE $q$ SELECT ';' $q$; END $$;", "SELECT 5;"])

    def test_parametro_posicional_e_cifrao_em_identificador_nao_sao_dollar_quote(self):
        self.assertEqual(self.statements("SELECT $1 || $2; SELECT a$b$c; SELECT 9;"), ["SELECT $1 || $2;", "SELECT a$b$c;", "SELECT 9;"])

    def test_e_string_com_aspa_escapada_por_barra(self):
        self.assertEqual(self.statements(r"SELECT E'a\';b'; SELECT 6;"), [r"SELECT E'a\';b';", "SELECT 6;"])

    def test_barra_em_literal_comum_nao_escapa_a_aspa(self):
        self.assertEqual(self.statements(r"SELECT regexp_replace(x, '\D', ''); SELECT 6;"),
                         [r"SELECT regexp_replace(x, '\D', '');", "SELECT 6;"])

    def test_aspas_dobradas_em_literal_e_em_identificador(self):
        got = self.statements("SELECT 'a'';b', \"c\"\";d\"; SELECT 7;")
        self.assertEqual(got, ["SELECT 'a'';b', \"c\"\";d\";", "SELECT 7;"])

    def test_literal_sem_fechar_nao_trava_nem_divide(self):
        self.assertEqual(len(self.statements("SELECT 'abc; SELECT 10;")), 1)

    def test_apostrofo_solto_em_corpo_dollar_nao_vaza_para_fora(self):
        got = self.statements("COMMENT ON TABLE t IS $$don't -- fica$$; SELECT 12; -- some\nSELECT 13;")
        self.assertEqual(got, ["COMMENT ON TABLE t IS $$don't -- fica$$;", "SELECT 12;", "SELECT 13;"])

    def test_entrada_vazia_ou_so_separadores(self):
        for text in ("", "   \n", ";;; ;\n", "-- só comentário", "/* só bloco */"):
            with self.subTest(text=text):
                self.assertEqual(self.statements(text), [])

    def test_crlf_e_comentario_no_fim_do_arquivo(self):
        self.assertEqual(self.statements("SELECT 1; -- c\r\nSELECT 2; -- sem quebra final"), ["SELECT 1;", "SELECT 2;"])

    def test_mask_sql_literals_preserva_tamanho_e_esconde_conteudo(self):
        text = "EXECUTE 'CREATE POLICY p ON t'; CREATE POLICY \"x y\" ON t; SELECT $a$ drop policy $a$;"
        masked = generator.mask_sql_literals(text)
        self.assertEqual(len(masked), len(text))
        self.assertEqual(len(generator.re.findall(r"policy", masked, generator.re.I)), 1)
        self.assertEqual(masked.index("CREATE POLICY \""), text.index("CREATE POLICY \""))

    def test_split_columns_respeita_parenteses_colchetes_e_literais(self):
        got = generator.split_columns("a numeric(15,2), b text[] DEFAULT ARRAY['x','y']::text[], c text DEFAULT 'p,q', CHECK (a IN (1,2))")
        self.assertEqual(got, ["a numeric(15,2)", "b text[] DEFAULT ARRAY['x','y']::text[]", "c text DEFAULT 'p,q'", "CHECK (a IN (1,2))"])

    def test_balanced_ignora_apostrofo_em_comentario_js(self):
        text = "{ a: ['x'], // can't voltar\n b: [], /* don't */ c: 'http://x/}' }; const z = '}';"
        self.assertEqual(text[generator.balanced(text, 0, "{", "}")], "}")
        self.assertEqual(text[:generator.balanced(text, 0, "{", "}") + 1].count("c:"), 1)
        self.assertEqual(generator.balanced("{ sem fim", 0, "{", "}"), -1)


class SqlFuzzTests(Fixture):
    TOKENS = ("'", '"', "$$", "$a$", "$1", "--", "/*", "*/", ";", "\n", "(", ")", "[", "]", ",", " ", "E'", "\\", "''", "CREATE POLICY p ON t ",
              "CREATE TABLE t (", "id uuid", "ALTER TABLE t ", "ADD COLUMN c numeric(1,2)", "DO ", "BEGIN ", "END ", "IF NOT EXISTS ", "THEN ",
              "EXECUTE ", "format(", "USING (", "WITH CHECK (", "DROP POLICY p ON t", "ALTER POLICY p ON t ", "RENAME TO ", "TO authenticated ",
              "CREATE TYPE e AS ENUM (", "'a'", "DROP TABLE t", "cron.schedule(", "cron.unschedule(", "CREATE TRIGGER x BEFORE UPDATE OF a, b ON t ",
              "EXECUTE FUNCTION f()", "CREATE FUNCTION f() RETURNS int AS ", "LANGUAGE sql", "CREATE VIEW v AS SELECT 1", "ENABLE ROW LEVEL SECURITY",
              "DROP CONSTRAINT k", "ADD CONSTRAINT k CHECK (", "status", "ção", "\r\n", "\t", "COMMENT ON TABLE t IS ")

    def test_sql_malformado_nunca_derruba_nem_trava_o_replay(self):
        import random
        rnd = random.Random(20261109)
        migration = self.write("supabase/migrations/20260101000001_fuzz.sql", "")
        for case in range(400):
            text = "".join(rnd.choice(self.TOKENS) for _ in range(rnd.randint(0, 60)))
            with self.subTest(case=case, text=text):
                self.assertEqual(len(generator.mask_sql_literals(text)), len(text))
                for statement in generator.split_sql_statements(generator.strip_sql_comments(text)):
                    self.assertTrue(statement.endswith(";"))
                    generator.do_block_statements(statement)
                    self.assertTrue(generator.expand_alter_table(statement))
                migration.write_text(text, encoding="utf-8")
                schema = self.schema()
                self.assertEqual(schema["sources"], ["supabase/migrations/20260101000001_fuzz.sql"])
                json.dumps(schema)


class PolicyReplayTests(Fixture):
    def test_nome_com_apostrofo_nao_engole_os_statements_seguintes(self):
        # Regressão: "company's" abria um literal e a função/trigger/política seguintes sumiam.
        src = self.sql("""
CREATE TABLE public.regras (id uuid, empresa_id uuid);
ALTER TABLE public.regras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their company's rules" ON public.regras FOR SELECT USING (empresa_id IS NOT NULL);
CREATE POLICY "Users can insert rules" ON public.regras FOR INSERT WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.sync_regra() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RAISE EXCEPTION 'regra inválida';
END;
$$;
CREATE TRIGGER regras_sync AFTER UPDATE ON public.regras FOR EACH ROW EXECUTE FUNCTION public.sync_regra();
""")
        schema = self.schema()
        pols = self.policies(schema, "regras")
        self.assertEqual(set(pols), {"Users can view their company's rules", "Users can insert rules"})
        self.assertEqual(pols["Users can view their company's rules"]["cmd"], "SELECT")
        self.assertEqual(pols["Users can view their company's rules"]["src"], src)
        self.assertIn("sync_regra", schema["functions"])
        self.assertTrue(schema["functions"]["sync_regra"]["security_definer"])
        self.assertEqual([t["name"] for t in schema["triggers"]], ["regras_sync"])
        self.assertEqual(schema["raises"], [{"function": "sync_regra", "msg": "regra inválida", "src": src}])

    def test_variacoes_do_cabecalho_da_politica(self):
        cases = [
            ('CREATE POLICY p1 ON t USING (true);', ("p1", "t", "ALL", "public", "permissive", "true", "")),
            ('CREATE POLICY "Política Ação" ON public.t FOR SELECT TO authenticated USING (auth.uid() = dono);',
             ("Política Ação", "t", "SELECT", "authenticated", "permissive", "auth.uid() = dono", "")),
            ('CREATE POLICY p3 ON "public"."t" AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);',
             ("p3", "t", "INSERT", "anon, authenticated", "restrictive", "", "false")),
            ('create policy p4\n  on storage.objects\n  for update\n  to service_role\n  using (bucket_id = \'a\')\n  with check (bucket_id = \'a\');',
             ("p4", "storage.objects", "UPDATE", "service_role", "permissive", "bucket_id = 'a'", "bucket_id = 'a'")),
            ("CREATE POLICY p5 ON t FOR DELETE USING (EXISTS (SELECT 1 FROM u WHERE u.id = t.dono AND u.nome <> ')' AND u.x = ';'));",
             ("p5", "t", "DELETE", "public", "permissive", "EXISTS (SELECT 1 FROM u WHERE u.id = t.dono AND u.nome <> ')' AND u.x = ';')", "")),
            ('CREATE POLICY p6 ON t AS PERMISSIVE FOR ALL TO public USING ((a = 1)) WITH CHECK ((a = 2));',
             ("p6", "t", "ALL", "public", "permissive", "(a = 1)", "(a = 2)")),
        ]
        self.sql("CREATE TABLE t (id uuid, dono uuid, a int);\n" + "\n".join(st for st, _ in cases))
        got = {p["name"]: (p["name"], p["table"], p["cmd"], p["roles"], p["mode"], p["using"], p["check"]) for p in self.schema()["policies"]}
        for _, expected in cases:
            with self.subTest(policy=expected[0]):
                self.assertEqual(got[expected[0]], expected)

    def test_expressao_longa_e_cortada_com_marca_visivel(self):
        long_expr = " OR ".join(f"coluna_{i} = {i}" for i in range(60))
        self.sql(f"CREATE TABLE t (id uuid);\nCREATE POLICY p ON t USING ({long_expr});")
        using = self.schema()["policies"][0]["using"]
        self.assertTrue(using.endswith(" …"))
        self.assertLessEqual(len(using), 302)
        self.assertTrue(using.startswith("coluna_0 = 0 OR coluna_1 = 1"))

    def test_politica_recriada_fica_com_a_ultima_definicao(self):
        self.sql("CREATE TABLE a (id uuid); CREATE TABLE b (id uuid);\n"
                 "CREATE POLICY p ON a FOR SELECT USING (true);\nCREATE POLICY p ON b FOR SELECT USING (true);")
        last = self.sql("DROP POLICY IF EXISTS p ON a;\nCREATE POLICY p ON a FOR UPDATE TO authenticated USING (false);")
        schema = self.schema()
        self.assertEqual(len(schema["policies"]), 2)
        self.assertEqual((self.policies(schema, "a")["p"]["cmd"], self.policies(schema, "a")["p"]["using"], self.policies(schema, "a")["p"]["src"]),
                         ("UPDATE", "false", last))
        self.assertEqual(self.policies(schema, "b")["p"]["cmd"], "SELECT")

    def test_create_policy_repetido_sem_drop_substitui_em_vez_de_duplicar(self):
        self.sql("CREATE TABLE a (id uuid);\nCREATE POLICY p ON a FOR SELECT USING (true);")
        self.sql("CREATE POLICY p ON public.a FOR SELECT USING (id IS NOT NULL);")
        self.assertEqual([p["using"] for p in self.schema()["policies"]], ["id IS NOT NULL"])

    def test_drop_policy_so_remove_da_tabela_citada(self):
        self.sql('CREATE TABLE a (id uuid); CREATE TABLE b (id uuid);\n'
                 'CREATE POLICY "Ver tudo" ON a USING (true);\nCREATE POLICY "Ver tudo" ON b USING (true);\n'
                 'DROP POLICY "Ver tudo" ON public.b;\nDROP POLICY IF EXISTS inexistente ON a;')
        self.assertEqual([(p["name"], p["table"]) for p in self.schema()["policies"]], [("Ver tudo", "a")])

    def test_alter_policy_muda_so_o_que_cita(self):
        self.sql('CREATE TABLE a (id uuid);\n'
                 'CREATE POLICY p ON a FOR UPDATE TO authenticated USING (id = 1) WITH CHECK (id = 2);\n'
                 'CREATE POLICY "q q" ON a FOR SELECT USING (true);')
        last = self.sql('ALTER POLICY p ON public.a USING (id = 10);\n'
                        'ALTER POLICY p ON a TO service_role, anon;\n'
                        'ALTER POLICY "q q" ON a RENAME TO "r r";\n'
                        'ALTER POLICY fantasma ON a USING (false);')
        pols = self.policies(self.schema(), "a")
        self.assertEqual(set(pols), {"p", "r r"})
        self.assertEqual((pols["p"]["cmd"], pols["p"]["roles"], pols["p"]["using"], pols["p"]["check"], pols["p"]["src"]),
                         ("UPDATE", "service_role, anon", "id = 10", "id = 2", last))
        self.assertEqual(pols["r r"]["using"], "true")

    def test_alter_policy_with_check_isolado(self):
        self.sql("CREATE TABLE a (id uuid);\nCREATE POLICY p ON a TO authenticated USING (id = 1);\nALTER POLICY p ON a WITH CHECK (id = 3);")
        pol = self.schema()["policies"][0]
        self.assertEqual((pol["roles"], pol["using"], pol["check"]), ("authenticated", "id = 1", "id = 3"))

    def test_drop_table_leva_politicas_triggers_indices_e_rls(self):
        # Regressão: a tabela recriada herdava as políticas da tabela antiga.
        self.sql("""
CREATE TABLE public.defs (id uuid, nome text);
ALTER TABLE public.defs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins gerenciam" ON public.defs USING (true);
CREATE INDEX defs_nome ON public.defs (nome);
CREATE FUNCTION public.f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
CREATE TRIGGER defs_t BEFORE INSERT ON public.defs FOR EACH ROW EXECUTE FUNCTION public.f();
""")
        self.sql("DROP TABLE IF EXISTS public.defs CASCADE;")
        schema = self.schema()
        self.assertNotIn("defs", schema["tables"])
        self.assertEqual((schema["policies"], schema["triggers"], schema["indexes"], schema["rls"]), ([], [], [], {}))
        self.sql("CREATE TABLE public.defs (id uuid);")
        schema = self.schema()
        self.assertEqual(list(self.columns(schema, "defs")), ["id"])
        self.assertEqual((schema["policies"], schema["triggers"], schema["indexes"], schema["rls"]), ([], [], [], {}))

    def test_drop_table_com_lista_de_nomes(self):
        self.sql('CREATE TABLE a (id uuid); CREATE TABLE b (id uuid); CREATE TABLE c (id uuid);\n'
                 'CREATE POLICY p ON b USING (true);\nDROP TABLE a, public."b" RESTRICT;')
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"c"})
        self.assertEqual(schema["policies"], [])

    def test_rename_table_carrega_politicas_triggers_indices_e_rls(self):
        self.sql("""
CREATE TABLE public.logs (id uuid);
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.logs USING (true);
CREATE INDEX logs_id ON public.logs (id);
CREATE FUNCTION public.f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
CREATE TRIGGER logs_t BEFORE INSERT ON public.logs FOR EACH ROW EXECUTE FUNCTION public.f();
ALTER TABLE public.logs RENAME TO logs_legacy;
""")
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"logs_legacy"})
        self.assertEqual(schema["rls"], {"logs_legacy": "enabled"})
        for kind in ("policies", "triggers", "indexes"):
            self.assertEqual([x["table"] for x in schema[kind]], ["logs_legacy"], kind)

    def test_politica_estatica_em_bloco_do_entra_no_replay(self):
        # Regressão: DO $$ IF NOT EXISTS ... CREATE POLICY era ignorado e a tabela parecia sem política.
        self.sql("CREATE TABLE public.budgets (id uuid, empresa_id uuid);\nALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;\n"
                 "CREATE POLICY antiga ON public.budgets FOR INSERT WITH CHECK (true);")
        src = self.sql("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can view their company''s budgets') THEN
        CREATE POLICY "Users can view their company's budgets"
            ON public.budgets FOR SELECT
            USING (empresa_id IS NOT NULL);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'budgets') THEN
        DROP POLICY IF EXISTS antiga ON public.budgets;
        CREATE POLICY nova ON public.budgets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
""")
        schema = self.schema()
        pols = self.policies(schema, "budgets")
        self.assertEqual(set(pols), {"Users can view their company's budgets", "nova"})
        self.assertEqual((pols["nova"]["cmd"], pols["nova"]["check"], pols["nova"]["src"]), ("INSERT", "auth.uid() IS NOT NULL", src))
        self.assertEqual(schema["policies_dinamicas"], [])

    def test_execute_de_literal_fixo_em_bloco_do_e_resolvido(self):
        self.sql("CREATE TABLE public.contratos (id uuid);\nCREATE POLICY \"Todos veem\" ON public.contratos FOR SELECT USING (true);")
        self.sql("""
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contratos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Todos veem" ON public.contratos';
    EXECUTE 'CREATE POLICY "Só o dono" ON public.contratos FOR SELECT USING (dono = ''eu'')';
  END IF;
END $do$;
""")
        schema = self.schema()
        self.assertEqual({n: p["using"] for n, p in self.policies(schema, "contratos").items()}, {"Só o dono": "dono = 'eu'"})
        self.assertEqual(schema["policies_dinamicas"], [])

    def test_politica_por_format_e_sinalizada_sem_inventar_politica(self):
        self.sql("CREATE TABLE public.darfs (id uuid); CREATE TABLE public.outra (id uuid);")
        src = self.sql("""
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['darfs', 'authenticated', 'nao_existe'] LOOP
    EXECUTE format('CREATE POLICY "auth select %1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
  END LOOP;
END $$;
""")
        schema = self.schema()
        self.assertEqual(schema["policies"], [])
        self.assertEqual(schema["policies_dinamicas"], [{"src": src, "tabelas": ["darfs"]}])

    def test_drop_policy_dinamico_tambem_e_sinalizado_com_a_tabela(self):
        self.sql("CREATE TABLE public.bitrix (id uuid);\nCREATE POLICY p ON public.bitrix USING (true);")
        src = self.sql("""
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'bitrix' LOOP
    EXECUTE format('DROP POLICY %I ON public.bitrix', r.policyname);
  END LOOP;
END $$;
""")
        schema = self.schema()
        self.assertEqual(schema["policies_dinamicas"], [{"src": src, "tabelas": ["bitrix"]}])
        self.assertEqual([p["name"] for p in schema["policies"]], ["p"])

    def test_bloco_do_sem_politica_nao_e_sinalizado(self):
        self.sql("CREATE TABLE t (id uuid);\nDO $$ BEGIN PERFORM 1; RAISE NOTICE 'nada'; END $$;")
        self.assertEqual(self.schema()["policies_dinamicas"], [])

    def test_aviso_de_politica_dinamica_aparece_na_matriz(self):
        self.sql("CREATE TABLE public.darfs (id uuid);")
        self.sql("DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['darfs'] LOOP\n"
                 "EXECUTE format('DROP POLICY IF EXISTS x ON public.%I', t); END LOOP; END $$;")
        self.gerar()
        rendered = self.saida("10-ACESSO-E-SEGURANCA.md")
        self.assertIn("NÃO VERIFICADO — a matriz acima está incompleta", rendered)
        self.assertIn("`DROP POLICY` dinâmico já removeu", rendered)
        self.assertIn("> Tabelas afetadas: `darfs`", rendered)


class AlterTableTests(Fixture):
    def test_varias_acoes_no_mesmo_alter_table(self):
        # Regressão: só a primeira ação era lida e numeric(15,2) virava "numeric(15".
        self.sql("CREATE TABLE public.contas (id uuid);")
        self.sql("""
ALTER TABLE public.contas
  ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS severidades TEXT[] NOT NULL DEFAULT ARRAY['critica','alta']::TEXT[],
  ADD COLUMN obs text DEFAULT 'a, b',
  ADD CONSTRAINT contas_valor_chk CHECK (valor_desconto >= 0),
  ENABLE ROW LEVEL SECURITY;
""")
        schema = self.schema()
        self.assertEqual(self.columns(schema, "contas"), {
            "id": "uuid", "valor_desconto": "NUMERIC(15,2) NOT NULL DEFAULT 0",
            "severidades": "TEXT[] NOT NULL DEFAULT ARRAY['critica','alta']::TEXT[]", "obs": "text DEFAULT 'a, b'"})
        self.assertEqual(schema["tables"]["contas"]["constraints"], ["constraint contas_valor_chk CHECK (valor_desconto >= 0)"])
        self.assertEqual(schema["rls"], {"contas": "enabled"})

    def test_tipo_com_virgula_em_alter_de_uma_acao_so(self):
        self.sql("CREATE TABLE t (id uuid);\nALTER TABLE t ADD COLUMN valor numeric(15,2);\nALTER TABLE t ADD COLUMN IF NOT EXISTS valor numeric(1,1);")
        self.assertEqual(self.columns(self.schema(), "t"), {"id": "uuid", "valor": "numeric(15,2)"})

    def test_alter_column_default_not_null_e_tipo(self):
        self.sql("CREATE TABLE t (id uuid, status text DEFAULT 'novo', n int);")
        self.sql("ALTER TABLE t ALTER COLUMN status SET DEFAULT 'ativo';\nALTER TABLE t ALTER COLUMN status SET NOT NULL;\n"
                 "ALTER TABLE t ALTER COLUMN n TYPE numeric(10,2) USING n::numeric(10,2), ALTER COLUMN n SET DEFAULT 0;")
        cols = self.columns(self.schema(), "t")
        self.assertEqual(cols["status"], "text DEFAULT 'ativo' not null")
        self.assertNotIn("SET DEFAULT", cols["status"])
        self.assertEqual(cols["n"], "numeric(10,2) DEFAULT 0")
        self.sql("ALTER TABLE t ALTER COLUMN status DROP NOT NULL, ALTER COLUMN status DROP DEFAULT;")
        self.assertEqual(self.columns(self.schema(), "t")["status"], "text")

    def test_drop_e_rename_de_coluna(self):
        self.sql('CREATE TABLE "Pedidos" (id uuid, a int, b int);\nALTER TABLE "Pedidos" DROP COLUMN IF EXISTS a, RENAME COLUMN b TO c;')
        self.assertEqual(list(self.columns(self.schema(), "Pedidos")), ["id", "c"])

    def test_estado_de_rls_segue_a_ultima_instrucao(self):
        self.sql("CREATE TABLE a (id uuid); CREATE TABLE b (id uuid); CREATE TABLE c (id uuid); CREATE TABLE d (id uuid);\n"
                 "ALTER TABLE a ENABLE ROW LEVEL SECURITY;\nALTER TABLE a DISABLE ROW LEVEL SECURITY;\n"
                 "ALTER TABLE b ENABLE ROW LEVEL SECURITY, FORCE ROW LEVEL SECURITY;\nALTER TABLE ONLY public.c ENABLE ROW LEVEL SECURITY;")
        self.assertEqual(self.schema()["rls"], {"a": "disabled", "b": "forced", "c": "enabled"})

    def test_constraint_com_o_mesmo_nome_fica_com_a_ultima_definicao(self):
        self.sql("CREATE TABLE boletos (id uuid, status text);\n"
                 "ALTER TABLE boletos ADD CONSTRAINT chk_status CHECK (status IN ('a','b')) NOT VALID;")
        self.sql("ALTER TABLE boletos ADD CONSTRAINT chk_status CHECK (status IN ('a','b','c'));")
        self.assertEqual(self.schema()["tables"]["boletos"]["constraints"], ["constraint chk_status CHECK (status IN ('a','b','c'))"])
        self.sql("ALTER TABLE boletos DROP CONSTRAINT IF EXISTS chk_status;")
        self.assertEqual(self.schema()["tables"]["boletos"]["constraints"], [])

    def test_check_da_coluna_e_substituido_pela_constraint_de_nome_automatico(self):
        self.sql("CREATE TABLE public.pedidos (id uuid, status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado')));")
        self.sql("ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text]));")
        schema = self.schema()
        self.assertEqual(self.columns(schema, "pedidos")["status"], "text NOT NULL DEFAULT 'pendente'")
        self.assertEqual(len(schema["tables"]["pedidos"]["constraints"]), 1)
        self.sql("ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_status_check;")
        self.assertEqual(self.schema()["tables"]["pedidos"]["constraints"], [])

    def test_fk_por_add_constraint_marca_a_coluna(self):
        self.sql("CREATE TABLE pai (id uuid); CREATE TABLE filho (id uuid, pai_id uuid);\n"
                 "ALTER TABLE filho ADD CONSTRAINT filho_pai_fk FOREIGN KEY (pai_id) REFERENCES public.pai(id) ON DELETE CASCADE;")
        col = next(c for c in self.schema()["tables"]["filho"]["columns"] if c["name"] == "pai_id")
        self.assertEqual(col["fk"], "pai.id ON DELETE CASCADE")

    def test_ddl_estatico_dentro_de_bloco_do(self):
        # Regressão: coluna, CHECK e enum criados atrás de guarda idempotente não existiam para o gerador.
        self.sql("CREATE TABLE public.contas (id uuid, status text);")
        self.sql("""
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contas' AND column_name = 'empresa_id') THEN
    ALTER TABLE public.contas ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  ALTER TABLE public.contas ADD CONSTRAINT contas_status_chk CHECK (status IN ('aberta','paga'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $do$ BEGIN
  IF to_regclass('public.contas') IS NOT NULL THEN
    ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
  ELSE
    RAISE NOTICE 'ALTER TABLE public.contas DROP COLUMN status';
  END IF;
END $do$;
""")
        schema = self.schema()
        self.assertEqual(list(self.columns(schema, "contas")), ["id", "status", "empresa_id"])
        self.assertEqual(schema["tables"]["contas"]["columns"][2]["fk"], "empresas.id ON DELETE CASCADE")
        self.assertEqual(schema["tables"]["contas"]["constraints"], ["constraint contas_status_chk CHECK (status IN ('aberta','paga'))"])
        self.assertEqual(schema["rls"], {"contas": "enabled"})

    def test_ultima_definicao_de_create_table_vence_mesmo_com_if_not_exists(self):
        # Comportamento mantido de propósito: neste repo as migrations de reconciliação redeclaram a tabela
        # com IF NOT EXISTS e são elas que batem com produção (medido contra types.ts).
        first = self.sql("CREATE TABLE public.darfs (id uuid, antigo text);")
        last = self.sql("CREATE TABLE IF NOT EXISTS public.darfs (id uuid, novo text);")
        schema = self.schema()
        self.assertEqual(list(self.columns(schema, "darfs")), ["id", "novo"])
        self.assertNotEqual(first, last)
        self.assertEqual(schema["tables"]["darfs"]["src"], last)

    def test_migrations_sao_aplicadas_em_ordem_de_nome(self):
        self.write("supabase/migrations/20260102000000_b.sql", "ALTER TABLE t ALTER COLUMN v SET DEFAULT 2;")
        self.write("supabase/migrations/20260103000000_c.sql", "ALTER TABLE t ALTER COLUMN v SET DEFAULT 3;")
        self.write("supabase/migrations/001_a.sql", "CREATE TABLE t (v int DEFAULT 1);")
        self.assertEqual(self.columns(self.schema(), "t"), {"v": "int DEFAULT 3"})


class EnumAndObjectReplayTests(Fixture):
    def test_enum_criado_em_bloco_do_e_evoluido(self):
        # Regressão: a maioria dos enums do repo nasce em DO $$ ... EXCEPTION WHEN duplicate_object.
        self.sql("""
DO $$ BEGIN
  CREATE TYPE public.nfe_status AS ENUM ('pendente', 'ciencia');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE TYPE papel AS ENUM ('admin');
""")
        self.sql("""
ALTER TYPE public.nfe_status ADD VALUE IF NOT EXISTS 'confirmada';
ALTER TYPE public.nfe_status ADD VALUE IF NOT EXISTS 'confirmada';
DO $$ BEGIN ALTER TYPE papel ADD VALUE 'contador'; END $$;
ALTER TYPE papel RENAME VALUE 'admin' TO 'administrador';
""")
        self.assertEqual(self.schema()["enums"], {"nfe_status": ["pendente", "ciencia", "confirmada"], "papel": ["administrador", "contador"]})
        self.sql("DROP TYPE IF EXISTS public.papel CASCADE;")
        self.assertEqual(set(self.schema()["enums"]), {"nfe_status"})

    def test_drop_de_view_indice_funcao_e_trigger(self):
        self.sql("""
CREATE TABLE t (id uuid, a int);
CREATE VIEW public.v1 AS SELECT * FROM t;
CREATE MATERIALIZED VIEW mv AS SELECT 1;
CREATE OR REPLACE VIEW v2 WITH (security_invoker = true) AS SELECT id FROM t;
CREATE INDEX i1 ON t (a); CREATE UNIQUE INDEX i2 ON t (id) WHERE a > 0;
CREATE FUNCTION public.f() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
CREATE TRIGGER tg BEFORE INSERT ON t FOR EACH ROW EXECUTE FUNCTION public.f();
""")
        schema = self.schema()
        self.assertEqual(set(schema["views"]), {"v1", "mv", "v2"})
        self.assertEqual([(i["name"], i["unique"]) for i in schema["indexes"]], [("i1", False), ("i2", True)])
        self.sql("DROP VIEW IF EXISTS public.v1, v2 CASCADE;\nDROP MATERIALIZED VIEW mv;\nDROP INDEX CONCURRENTLY IF EXISTS public.i1;\n"
                 "DROP TRIGGER IF EXISTS tg ON public.t;\nDROP FUNCTION IF EXISTS public.f();")
        schema = self.schema()
        self.assertEqual((schema["views"], schema["triggers"], schema["functions"]), ({}, [], {}))
        self.assertEqual([i["name"] for i in schema["indexes"]], ["i2"])

    def test_trigger_com_update_of_e_constraint_trigger(self):
        # Regressão: "UPDATE OF a, b" e CREATE CONSTRAINT TRIGGER não casavam e a regra sumia da seção D.
        self.sql("""
CREATE TABLE public.contas_pagar (id uuid, valor numeric, fornecedor_id uuid);
CREATE TRIGGER trg_duplicidade BEFORE INSERT OR UPDATE OF fornecedor_id, valor ON public.contas_pagar
  FOR EACH ROW WHEN (NEW.valor > 0) EXECUTE FUNCTION public.validar_duplicidade();
CREATE CONSTRAINT TRIGGER trg_partidas AFTER INSERT OR UPDATE OR DELETE ON public.contas_pagar
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.validar_partidas();
CREATE OR REPLACE TRIGGER trg_stmt AFTER TRUNCATE ON contas_pagar EXECUTE PROCEDURE auditar();
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_do') THEN
    CREATE TRIGGER trg_do BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.touch();
  END IF;
END $$;
""")
        triggers = {t["name"]: (t["when"], t["table"], t["function"], t["condition"], t["each"]) for t in self.schema()["triggers"]}
        self.assertEqual(triggers, {
            "trg_duplicidade": ("BEFORE INSERT OR UPDATE OF FORNECEDOR_ID, VALOR", "contas_pagar", "validar_duplicidade", "NEW.valor > 0", "row"),
            "trg_partidas": ("AFTER INSERT OR UPDATE OR DELETE", "contas_pagar", "validar_partidas", "", "row"),
            "trg_stmt": ("AFTER TRUNCATE", "contas_pagar", "auditar", "", "statement"),
            "trg_do": ("BEFORE UPDATE", "contas_pagar", "touch", "", "row")})

    def test_view_materializada_if_not_exists_e_indice_on_only(self):
        self.sql("CREATE TABLE public.logs (id uuid, sev text);\n"
                 "CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_alertas AS WITH w AS (SELECT 1) SELECT * FROM w;\n"
                 "CREATE INDEX IF NOT EXISTS idx_logs_sev ON ONLY public.logs USING btree (sev, id DESC);")
        schema = self.schema()
        self.assertEqual(schema["views"]["mv_alertas"]["body"], "WITH w AS (SELECT 1) SELECT * FROM w")
        self.assertEqual([(i["name"], i["table"], i["columns"]) for i in schema["indexes"]], [("idx_logs_sev", "logs", "sev, id DESC")])

    def test_funcao_redefinida_troca_corpo_e_erros(self):
        self.sql("CREATE FUNCTION public.valida(p int) RETURNS void LANGUAGE plpgsql AS $fn$ BEGIN RAISE EXCEPTION 'valor antigo'; END; $fn$;")
        src = self.sql("CREATE OR REPLACE FUNCTION public.valida(p int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$\n"
                       "BEGIN\n  -- comentário com ; e 'aspas\n  RAISE EXCEPTION 'valor novo: %', p;\nEND; $fn$;")
        schema = self.schema()
        fn = schema["functions"]["valida"]
        self.assertEqual((fn["src"], fn["security_definer"], fn["search_path"], fn["raises"]), (src, True, True, ["valor novo: %"]))
        self.assertEqual(schema["raises"], [{"function": "valida", "msg": "valor novo: %", "src": src}])

    def test_cron_reagendado_vale_o_ultimo_e_unschedule_remove(self):
        # Regressão: corpo em $cron$...$cron$ era ignorado e job reagendado aparecia duplicado.
        self.sql("""
SELECT cron.schedule('diario', '0 3 * * *', $$SELECT 1$$);
SELECT cron.schedule('com-tag', '*/5 * * * *', $cron$ SELECT public.capture(500); $cron$);
SELECT cron.schedule('aspas', '0 0 * * *', 'SELECT net.http_post(url := ''https://x.example/a'')');
SELECT cron.schedule('some', '0 1 * * *', $$SELECT 2$$);
-- SELECT cron.schedule('comentado', '0 0 * * *', 'SELECT 9');
""")
        last = self.sql("""
SELECT cron.unschedule('diario') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'diario');
SELECT cron.schedule('diario', '30 4 * * *', $$SELECT 3$$);
DO $$ BEGIN PERFORM cron.unschedule('some'); END $$;
""")
        jobs = {j["job"]: (j["schedule"], j["body"], j["src"]) for j in self.schema()["cron_jobs"]}
        self.assertEqual(set(jobs), {"diario", "com-tag", "aspas"})
        self.assertEqual(jobs["diario"], ("30 4 * * *", "SELECT 3", last))
        self.assertEqual(jobs["com-tag"][:2], ("*/5 * * * *", "SELECT public.capture(500);"))
        self.assertEqual(jobs["aspas"][1], "SELECT net.http_post(url := 'https://x.example/a')")
        self.assertEqual(len(self.schema()["cron_jobs"]), 3)

    def test_comment_on_comentado_nao_conta(self):
        self.sql("CREATE TABLE t (id uuid);\n-- COMMENT ON TABLE t IS 'falso';\nCOMMENT ON TABLE public.t IS 'Pedidos d''água';")
        schema = self.schema()
        self.assertEqual(schema["comments"], {"table:t": "Pedidos d'água"})
        self.assertEqual(schema["tables"]["t"]["comment"], "Pedidos d'água")

    def test_seed_nao_altera_schema(self):
        self.sql("CREATE TABLE planos (id int, nome text);")
        self.write("supabase/seed.sql", "INSERT INTO public.planos (id, nome) VALUES (1, 'básico'); -- DROP TABLE planos;\nDROP TABLE planos;")
        schema = self.schema()
        self.assertIn("planos", schema["tables"])
        self.assertEqual(schema["seed"], [{"table": "planos", "columns": "id, nome", "values": "(1, 'básico')", "src": "supabase/seed.sql"}])



TYPES_TS = """export type Json = string | number | boolean | null;

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { query?: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      pedidos: {
        Row: {
          id: string;
          so_no_banco: string | null;
          status: string;
        };
        Insert: {
          id?: string;
        };
        Relationships: [];
      };
      so_types: {
        Row: {
          id: string;
          etapa: Database['public']['Enums']['etapa_envio'];
          status: string;
          status_alterado_em: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      vw_resumo: {
        Row: {
          total: number | null;
        };
      };
    };
    Functions: {
      confirmar_pedido: {
        Args: { p_id: string };
        Returns: Json;
      };
      so_nome: { Args: never; Returns: number };
    };
    Enums: {
      etapa_envio: 'novo' | 'enviado';
      papel:
        | 'admin'
        | 'leitor';
      ja_na_migration: "x" | "y";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
"""


class TypesFileTests(Fixture):
    def prepare(self, padding=0):
        self.sql("CREATE TYPE ja_na_migration AS ENUM ('migration');\nCREATE TABLE public.pedidos (id uuid, status text);\n"
                 "ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;\nCREATE POLICY p ON public.pedidos FOR SELECT USING (true);")
        self.write("src/integrations/supabase/types.ts", TYPES_TS + "// " + "x" * padding + "\n")

    def test_types_ts_maior_que_o_limite_de_codigo_continua_sendo_lido(self):
        # Regressão: o types.ts real (697 KB) passou de MAX_FILE_BYTES e era ignorado sem aviso.
        self.prepare(padding=generator.MAX_FILE_BYTES + 10)
        schema = self.schema()
        self.assertEqual(schema["types_file"], "src/integrations/supabase/types.ts")
        self.assertIn("so_types", schema["tables"])
        self.assertEqual(schema["tables"]["so_types"]["origin"], "types.ts")
        self.assertEqual(schema["sources"][-1], "src/integrations/supabase/types.ts")

    def test_tabelas_views_enums_e_funcoes_do_schema_public(self):
        self.prepare()
        schema = self.schema()
        self.assertEqual(set(schema["tables"]), {"pedidos", "so_types"})
        self.assertEqual(schema["tables"]["pedidos"]["origin"], "migration")
        self.assertEqual(self.columns(schema, "pedidos"), {"id": "uuid", "status": "text", "so_no_banco": "string | null"})
        self.assertEqual(set(schema["views"]), {"vw_resumo"})
        self.assertEqual(schema["enums"], {"ja_na_migration": ["migration"], "etapa_envio": ["novo", "enviado"], "papel": ["admin", "leitor"]})
        self.assertEqual(set(schema["functions"]), {"confirmar_pedido", "so_nome"})

    def test_view_definida_na_migration_nao_e_sobrescrita(self):
        self.prepare()
        src = self.sql("CREATE VIEW public.vw_resumo AS SELECT count(*) AS total FROM public.pedidos;")
        self.assertEqual(self.schema()["views"]["vw_resumo"], {"body": "SELECT count(*) AS total FROM public.pedidos", "src": src})

    def test_tabela_so_do_types_nao_vira_alarme_de_rls_nem_lacuna_de_status(self):
        self.prepare()
        self.write("src/pages/Tela.tsx", "export async function carregar(supabase) {\n  await supabase.from('so_types').select('id, status');\n"
                                         "  await supabase.from('pedidos').select('id');\n  return supabase.rpc('confirmar_pedido');\n}\n")
        context = self.gerar()
        self.assertEqual(context["access"]["matrix"]["so_types"]["rls"], "não verificado")
        self.assertEqual(context["access"]["matrix"]["pedidos"]["rls"], "enabled")
        self.assertEqual([r for r in context["access"]["risky"] if r["table"] == "so_types"], [])
        self.assertEqual([i for i in context["audit"]["issues"] if i["kind"] in ("tabela", "rpc", "coluna")], [])
        gaps = "\n".join(context["audit"]["gaps"])
        self.assertNotIn("so_types.status", gaps)
        self.assertNotIn("status_alterado_em", gaps)
        self.assertIn("`pedidos.status` é uma coluna de status sem enum/CHECK", gaps)
        states = {(c["table"], c["column"]): c["allowed"] for c in context["rules"]["state_machines"]["columns"]}
        self.assertEqual(states[("so_types", "etapa")], ["novo", "enviado"])
        rendered = self.saida("10-ACESSO-E-SEGURANCA.md")
        self.assertIn("| `so_types` | não verificado | ? | ? | ? | ? |", rendered)
        self.assertIn("RLS e políticas NÃO VERIFICADOS", rendered)

    def test_arquivo_types_de_componente_nao_e_confundido(self):
        self.sql("CREATE TABLE t (id uuid);")
        self.write("src/components/x/types.ts", "export type Linha = { Row: string };\n")
        schema = self.schema()
        self.assertEqual((schema["types_file"], set(schema["tables"])), ("", {"t"}))


class StateMachineTests(Fixture):
    def test_valores_permitidos_por_enum_check_e_constraint(self):
        self.sql("""
DO $$ BEGIN CREATE TYPE public.etapa AS ENUM ('a', 'b'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE public.pedidos (
  id uuid,
  etapa public.etapa NOT NULL DEFAULT 'a',
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'pago')),
  situacao text,
  estado_livre text,
  status_alterado_em timestamptz,
  status_alterado_por uuid,
  response_status integer,
  drill_estado jsonb NOT NULL DEFAULT '{}'::jsonb,
  status_at timestamptz
);
ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_situacao_chk CHECK (situacao = ANY (ARRAY['x'::text, 'y'::text]));
""")
        context = self.gerar()
        cols = {c["column"]: c for c in context["rules"]["state_machines"]["columns"]}
        # Regressão: timestamptz/uuid/integer/jsonb com "status" no nome viravam lacuna de máquina de estado.
        self.assertEqual(set(cols), {"etapa", "status", "situacao", "estado_livre"})
        self.assertEqual((cols["etapa"]["enum"], cols["etapa"]["allowed"], cols["etapa"]["default"]), ("etapa", ["a", "b"], "a"))
        self.assertEqual((cols["status"]["allowed"], cols["status"]["default"]), (["novo", "pago"], "novo"))
        self.assertEqual(cols["situacao"]["allowed"], ["x", "y"])
        self.assertEqual(cols["estado_livre"]["allowed"], [])
        gaps = "\n".join(context["audit"]["gaps"])
        self.assertIn("`pedidos.estado_livre` é uma coluna de status sem enum/CHECK", gaps)
        self.assertIn("`pedidos.status` tem valores ['novo', 'pago'] mas nenhum mapa de transições", gaps)
        self.assertNotIn("status_alterado", gaps)
        self.assertNotIn("response_status", gaps)
        rendered = self.saida("07-REGRAS-DE-NEGOCIO.md")
        self.assertIn("| `pedidos` | `status` | `novo`, `pago` | `novo` |", rendered)
        self.assertIn("| `pedidos` | `estado_livre` | **livre (sem enum/CHECK)** |  |", rendered)

    def test_mapa_de_transicao_vazio_nao_silencia_a_lacuna(self):
        # Regressão: `const fluxoPorData = {}` contava como mapa e escondia a lacuna de todas as colunas.
        self.sql("CREATE TABLE public.pedidos (id uuid, status text CHECK (status IN ('novo', 'pago')));")
        self.write("src/hooks/useFluxo.ts", "export function useFluxo() {\n  const fluxoPorData: Record<string, number> = {};\n  return fluxoPorData;\n}\n")
        context = self.gerar()
        self.assertEqual(context["rules"]["transition_maps"], [])
        self.assertTrue(any("nenhum mapa de transições" in g for g in context["audit"]["gaps"]))

    def test_mapa_de_transicao_declarado_some_com_a_lacuna_e_sobrevive_a_comentario_com_apostrofo(self):
        self.sql("CREATE TABLE public.pedidos (id uuid, status text CHECK (status IN ('novo', 'pago')));")
        # Regressão: o apóstrofo de "can't" abria uma string, o fechamento não era achado e o mapa sumia.
        self.write("src/lib/pedidos.ts", "export const STATUS_TRANSITIONS = {\n  novo: ['pago'], // can't voltar\n  pago: [],\n};\n"
                                         "export const OUTRA = { a: 1 };\n")
        context = self.gerar()
        self.assertEqual(context["rules"]["transition_maps"],
                         [{"file": "src/lib/pedidos.ts", "name": "STATUS_TRANSITIONS", "body": "novo: ['pago'], // can't voltar pago: [],"}])
        self.assertFalse(any("nenhum mapa de transições" in g for g in context["audit"]["gaps"]))

    def test_valores_de_status_no_codigo_e_inconsistencias(self):
        self.sql("CREATE TABLE public.pedidos (id uuid, status text CHECK (status IN ('novo', 'pago')));")
        self.write("src/lib/pedidos.ts", """
export function avaliar(p: any, body: any) {
  if (typeof body.status === 'string') return 0;
  if (typeof p.state !== 'object') return 0;
  if (p.status === 'pago') return 1;
  if (p.status === 'fantasma') return 2;
  switch (p.status) { case 'novo': return 3; case 'arquivado': return 4; }
  return supabase.from('pedidos').update({ status: 'pago' }).eq('status', 'novo');
}
""")
        self.write("src/lib/pedidos.test.ts", "it('ignora', () => { expect(p.status === 'so_no_teste').toBe(true); });\n")
        context = self.gerar()
        usage = context["rules"]["state_machines"]["usage"]
        self.assertEqual(sorted(usage["status"]), ["arquivado", "fantasma", "novo", "pago"])
        self.assertNotIn("state", usage)
        self.assertEqual(usage["status"]["pago"], ["compara:src/lib/pedidos.ts", "escreve:src/lib/pedidos.ts"])
        self.assertEqual(usage["status"]["novo"], ["compara:src/lib/pedidos.ts", "filtra:src/lib/pedidos.ts"])
        problems = sorted(i["msg"] for i in context["audit"]["issues"] if i["kind"] == "status")
        self.assertEqual(problems, ["valor `arquivado` para `status` usado no código não existe em nenhum enum do banco/TS",
                                    "valor `fantasma` para `status` usado no código não existe em nenhum enum do banco/TS"])
        self.assertEqual(context["rules"]["tests"], [{"file": "src/lib/pedidos.test.ts", "name": "ignora"}])


class AccessMatrixTests(Fixture):
    def prepare(self):
        self.sql("""
CREATE TABLE public.contas (id uuid, empresa_id uuid, valor numeric(15,2), saldo float8, email text, deleted_at timestamptz);
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY tudo ON public.contas FOR ALL TO authenticated USING (empresa_id = 1) WITH CHECK (empresa_id = 2);
CREATE POLICY bloqueio ON public.contas AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);
CREATE TABLE public.segredos (id uuid);
ALTER TABLE public.segredos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.aberta (id uuid);
CREATE TABLE public.so_leitura (id uuid);
ALTER TABLE public.so_leitura ENABLE ROW LEVEL SECURITY;
CREATE POLICY ler ON public.so_leitura FOR SELECT USING (true);
CREATE FUNCTION public.perigosa() RETURNS void LANGUAGE sql SECURITY DEFINER AS $$ SELECT 1 $$;
CREATE FUNCTION public.segura() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$ SELECT 1 $$;
GRANT SELECT, INSERT ON public.contas TO authenticated;
REVOKE ALL ON public.segredos FROM anon;
""")
        self.write("src/pages/Tela.tsx", """
export async function tela(supabase) {
  await supabase.from('segredos').select('id');
  await supabase.from('aberta').select('id');
  await supabase.from('so_leitura').select('id');
  await supabase.from('so_leitura').insert({ id: 1 });
  await supabase.from('contas').delete().eq('id', 1);
  await supabase.from('nao_existe').select('*');
  await supabase.rpc('rpc_fantasma');
  await supabase.functions.invoke('edge-fantasma');
}
""")
        self.write("supabase/functions/job/index.ts", "const k = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');\nawait supabase.from('aberta').select('id');\n")

    def test_matriz_usa_with_check_no_insert_e_marca_restritiva(self):
        self.prepare()
        matrix = self.gerar()["access"]["matrix"]
        self.assertEqual(matrix["contas"]["rls"], "enabled")
        self.assertEqual(matrix["contas"]["SELECT"], ["authenticated: empresa_id = 1"])
        self.assertEqual(matrix["contas"]["INSERT"], ["authenticated: empresa_id = 2"])
        self.assertEqual(matrix["contas"]["DELETE"], ["authenticated: empresa_id = 1", "authenticated, anon [RESTRICTIVE]: false"])
        self.assertEqual(matrix["aberta"], {"rls": "não encontrado", "SELECT": [], "INSERT": [], "UPDATE": [], "DELETE": []})
        rendered = self.saida("10-ACESSO-E-SEGURANCA.md")
        self.assertIn("| `aberta` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |", rendered)
        self.assertIn("| `segredos` | enabled | — | — | — | — |", rendered)

    def test_celula_longa_da_matriz_e_cortada_com_marca(self):
        self.sql("CREATE TABLE t (id uuid);\nCREATE POLICY p ON t FOR SELECT USING (" + " AND ".join(f"c{i} = {i}" for i in range(40)) + ");")
        cell = self.gerar()["access"]["matrix"]["t"]["SELECT"][0]
        self.assertTrue(cell.endswith(" …"))
        self.assertLessEqual(len(cell), 142)

    def test_riscos_e_inconsistencias_detectados(self):
        self.prepare()
        context = self.gerar()
        risky = {(r["table"], r["issue"].split(" →")[0].split(" (")[0]) for r in context["access"]["risky"]}
        self.assertEqual(risky, {("segredos", "RLS ligado sem nenhuma política"), ("aberta", "acessada do front"),
                                 ("so_leitura", "front faz INSERT mas nenhuma política RLS permite INSERT")})
        issues = {(i["kind"], i["msg"].split("`")[1]) for i in context["audit"]["issues"]}
        self.assertEqual(issues, {("rls", "segredos"), ("rls", "aberta"), ("rls", "so_leitura"), ("tabela", "nao_existe"), ("rpc", "rpc_fantasma"),
                                  ("edge", "edge-fantasma"), ("segurança", "perigosa"), ("dinheiro", "contas.saldo")})
        access = context["access"]
        self.assertEqual(access["security_definer_fns"], ["perigosa", "segura"])
        self.assertEqual(access["service_role_files"], ["supabase/functions/job/index.ts"])
        self.assertEqual(access["tenant_key"], "empresa_id")
        self.assertIn(["contas", "deleted_at"], access["soft_delete"])
        self.assertIn(["contas", "email"], access["pii"])
        self.assertEqual({(g["kind"], g["privs"], g["object"], g["roles"]) for g in access["grants"]},
                         {("grant", "select, insert", "contas", "authenticated"), ("revoke", "all", "segredos", "anon")})
        self.assertEqual(json.loads(self.saida("manifest.json"))["inconsistencias"], len(context["audit"]["issues"]))


def git(repo, *args):
    environment = {**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.invalid", "GIT_COMMITTER_NAME": "t",
                   "GIT_COMMITTER_EMAIL": "t@example.invalid", "GIT_CONFIG_GLOBAL": os.devnull, "GIT_CONFIG_SYSTEM": os.devnull}
    return subprocess.run(["git", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", *args], cwd=repo, check=True,
                          capture_output=True, text=True, timeout=30, env=environment).stdout.strip()


class CliTests(Fixture):
    ARQUIVOS = ("07-REGRAS-DE-NEGOCIO.md", "10-ACESSO-E-SEGURANCA.md", "11-GLOSSARIO-E-LACUNAS.md")

    def prepare(self):
        self.sql("CREATE TYPE papel AS ENUM ('admin', 'leitor');\nCREATE TABLE public.pedidos (id uuid, status text CHECK (status IN ('novo','pago')), "
                 "empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE);\nCREATE TABLE public.empresas (id uuid);\n"
                 "ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;\nCREATE POLICY \"Ação do usuário\" ON public.pedidos USING (true);")
        self.write("src/lib/calc.ts", "export const LIMITE_DIAS = 7;\nexport function calcularTotal(a: number, b: number) {\n  return a * 0.15 + b;\n}\n"
                                      "export const pedidoSchema = z.object({ valor: z.number().min(1) });\n"
                                      "export async function ler(s) { if (!s) throw new Error('Pedido não encontrado'); return s.from('pedidos').select('id, status'); }\n")
        self.write("src/lib/calc.test.ts", "describe('cálculo', () => { it('soma o total', () => {}); });\n")

    def test_perfil_regras_emite_exatamente_o_que_o_manifest_declara(self):
        self.prepare()
        result = self.cli("--profile", "regras", "--schema-snapshot", "docs/contexto/supabase", "--index-path", "docs/contexto/00-INDEX.md", "--no-pointer",
                          out="docs/contexto/regras")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "")
        self.assertIn("aviso: snapshot docs/contexto/supabase não existe", result.stderr)
        out = self.root / "docs/contexto/regras"
        manifest = json.loads((out / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["arquivos"], [*self.ARQUIVOS, "context.json"])
        self.assertEqual((manifest["entrada"], manifest["perfil"], manifest["produtor"], manifest["versao"], manifest["schema_real_em"], manifest["commit"]),
                         ("07-REGRAS-DE-NEGOCIO.md", "regras", "ai-context-sync", generator.VERSION, "", ""))
        # Regressão: o gate do contexto.yml calcula a idade com datetime.fromisoformat(s.replace("Z", "+00:00"));
        # o formato antigo ("AAAA-MM-DD HH:MM UTC") estourava ValueError e a idade virava sempre 9999 h.
        self.assertRegex(manifest["gerado_em"], r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")
        generated = datetime.fromisoformat(manifest["gerado_em"].replace("Z", "+00:00"))
        self.assertLess(abs((datetime.now(timezone.utc) - generated).total_seconds()), 300)
        self.assertEqual(sorted(p.name for p in out.iterdir()), sorted(manifest["arquivos"] + [".state.json", "manifest.json", "manual"]))
        self.assertEqual(sorted(p.name for p in (out / "manual").iterdir()), ["README.md", "TEMPLATE-regras-de-negocio.md"])
        for name in manifest["arquivos"]:
            self.assertGreater((out / name).stat().st_size, 0, name)
        context = json.loads((out / "context.json").read_text(encoding="utf-8"))
        self.assertEqual((manifest["inconsistencias"], manifest["lacunas"]), (len(context["audit"]["issues"]), len(context["audit"]["gaps"])))
        self.assertEqual(context["meta"]["generated_at"], generated.strftime("%Y-%m-%d %H:%M UTC"))
        self.assertFalse((self.root / "AGENTS.md").exists())
        self.assertFalse((self.root / "CLAUDE.md").exists())
        rules = (out / "07-REGRAS-DE-NEGOCIO.md").read_text(encoding="utf-8")
        for expected in ("| `pedidos` | Ação do usuário | ALL | public | permissive | `true` |  |", "**calcularTotal(a: number, b: number)**",
                         "return a * 0.15 + b;", "| `LIMITE_DIAS` | `7` | `src/lib/calc.ts` |", "| Pedido não encontrado | `src/lib/calc.ts` |",
                         "**pedidoSchema** (`src/lib/calc.ts`, z.object)", "| papel | `admin`, `leitor` | banco |", "soma o total",
                         "| `pedidos` | `empresa_id` | FK → empresas.id ON DELETE CASCADE |"):
            self.assertIn(expected, rules)

    def test_duas_execucoes_com_hash_seed_diferente_sao_identicas(self):
        self.prepare()
        self.sql("CREATE TABLE a (id uuid, b_id uuid REFERENCES b(id) ON DELETE CASCADE); CREATE TABLE b (id uuid, c_id uuid REFERENCES c(id) ON DELETE CASCADE); CREATE TABLE c (id uuid);")
        # saídas fora do repo: a pasta de uma execução não pode virar entrada da outra
        outs = [self.root.parent / "s1", self.root.parent / "s2"]
        for seed, out in zip(("1", "987654"), outs):
            self.assertEqual(self.cli("--profile", "full", "--no-pointer", out=str(out), env={"PYTHONHASHSEED": seed}).returncode, 0)
        normalize = lambda text: generator.re.sub(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?: UTC|:\d{2}Z)", "<agora>", text)
        names = sorted(p.name for p in outs[0].iterdir() if p.is_file())
        self.assertEqual(names, sorted(p.name for p in outs[1].iterdir() if p.is_file()))
        self.assertEqual(len(names), 12 + 3)
        for name in names:
            self.assertEqual(normalize((outs[0] / name).read_text(encoding="utf-8")), normalize((outs[1] / name).read_text(encoding="utf-8")), name)
        self.assertEqual(sorted(p.name for p in self.root.iterdir()), ["src", "supabase"])

    def test_segunda_execucao_sem_mudanca_nao_escreve_e_check_reflete_o_estado(self):
        self.prepare()
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer", "--check").returncode, 1)
        self.assertFalse((self.root / "saida").exists())
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer").returncode, 0)
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer", "--check").returncode, 0)
        before = {p.name: p.read_bytes() for p in (self.root / "saida").iterdir() if p.is_file()}
        os.utime(self.root / "saida/manifest.json", (1, 1))
        second = self.cli("--profile", "regras", "--no-pointer")
        self.assertEqual(second.returncode, 0)
        self.assertIn("nada mudou — nenhuma escrita", second.stderr)
        self.assertEqual((self.root / "saida/manifest.json").stat().st_mtime, 1)
        self.assertEqual({p.name: p.read_bytes() for p in (self.root / "saida").iterdir() if p.is_file()}, before)
        self.sql("CREATE TABLE nova (id uuid);")
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer", "--check").returncode, 1)
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer").returncode, 0)
        self.assertIn("nova", json.loads(self.saida("context.json"))["schema"]["tables"])

    def test_saida_apagada_ou_corrompida_e_regerada(self):
        self.prepare()
        self.gerar()
        original = self.saida("07-REGRAS-DE-NEGOCIO.md")
        (self.root / "saida/10-ACESSO-E-SEGURANCA.md").unlink()
        result = self.cli("--profile", "regras", "--no-pointer")
        self.assertIn("saída incompleta (10-ACESSO-E-SEGURANCA.md)", result.stderr)
        self.assertTrue((self.root / "saida/10-ACESSO-E-SEGURANCA.md").is_file())
        # Regressão: .state.json que não é objeto e .md com bytes inválidos derrubavam toda execução seguinte.
        for state in ("[]", "nao é json", '"texto"'):
            with self.subTest(state=state):
                (self.root / "saida/.state.json").write_text(state, encoding="utf-8")
                (self.root / "saida/07-REGRAS-DE-NEGOCIO.md").write_bytes(b"\xff\xfe\x00lixo")
                result = self.cli("--profile", "regras", "--no-pointer")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(generator.re.sub(r"\d\d:\d\d UTC", "", self.saida("07-REGRAS-DE-NEGOCIO.md")), generator.re.sub(r"\d\d:\d\d UTC", "", original))
                self.assertIn("facts_hash", json.loads(self.saida(".state.json")))

    def test_argumentos_invalidos_saem_com_2_sem_escrever_nada(self):
        self.prepare()
        (self.root / "arquivo.txt").write_text("x", encoding="utf-8")
        cases = [
            (["--profile", "regras", "--flag-que-nao-existe"], {}, "unrecognized arguments"),
            (["--profile", "xyz"], {}, "invalid choice"),
            ([], {"env": {"AI_CONTEXT_PROFILE": "xyz"}}, "perfil inválido: 'xyz'"),
            (["--profile", "regras"], {"repo": self.root / "nao-existe"}, "--repo não é um diretório"),
            (["--profile", "regras"], {"out": "."}, "--out precisa ser uma pasta própria"),
            (["--profile", "regras"], {"out": ""}, "--out precisa ser uma pasta própria"),
            (["--profile", "regras"], {"out": "arquivo.txt"}, "--out precisa ser uma pasta própria"),
        ]
        before = sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob("*"))
        for args, kwargs, message in cases:
            with self.subTest(args=args, kwargs=kwargs):
                result = self.cli("--no-pointer", *args, **kwargs)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertIn(message, result.stderr)
                self.assertNotIn("Traceback", result.stderr)
        self.assertEqual(sorted(p.relative_to(self.root).as_posix() for p in self.root.rglob("*")), before)
        self.assertFalse((self.root / "nao-existe").exists())

    def test_perfil_por_variavel_de_ambiente_valida(self):
        self.prepare()
        self.assertEqual(self.cli("--no-pointer", env={"AI_CONTEXT_PROFILE": "regras"}).returncode, 0)
        self.assertEqual(json.loads(self.saida("manifest.json"))["arquivos"], [*self.ARQUIVOS, "context.json"])

    def test_repo_vazio_gera_saida_valida_e_declara_as_lacunas(self):
        context = self.gerar()
        self.assertEqual((context["schema"]["tables"], context["schema"]["policies"], context["meta"]["files_total"]), ({}, [], 0))
        gaps = "\n".join(context["audit"]["gaps"])
        for expected in ("Nenhuma regra manual", "Nenhum teste encontrado", "Nenhum perfil/role identificado", "Nenhum schema encontrado"):
            self.assertIn(expected, gaps)
        self.assertIn("_nenhum item encontrado_", self.saida("07-REGRAS-DE-NEGOCIO.md"))
        self.assertIn("commit `n/d` · branch `n/d`", self.saida("07-REGRAS-DE-NEGOCIO.md"))

    def test_snapshot_ausente_arquivo_ou_corrompido_nao_derruba(self):
        self.prepare()
        (self.root / "snap-arquivo").write_text("não é pasta", encoding="utf-8")
        (self.root / "snap/dentro").mkdir(parents=True)
        (self.root / "snap/manifest.json").write_bytes(b"\xff{ nao json")
        (self.root / "snap/tabelas.md").write_text("# tabelas\n", encoding="utf-8")
        (self.root / "snap/vazio.md").write_text("", encoding="utf-8")
        for snapshot, expected in (("nao-existe", ""), ("snap-arquivo", ""), ("snap", "snap")):
            with self.subTest(snapshot=snapshot):
                result = self.cli("--profile", "full", "--no-pointer", "--schema-snapshot", snapshot, out=f"o-{snapshot}")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(json.loads(self.saida("manifest.json", f"o-{snapshot}"))["schema_real_em"], expected)
                database = self.saida("06-BANCO-DE-DADOS.md", f"o-{snapshot}")
                if expected:
                    self.assertIn("fonte de verdade é o snapshot do banco real", database)
                    self.assertIn("- `snap/tabelas.md`", database)
                    self.assertNotIn("vazio.md", database)
                else:
                    self.assertIn(f"aviso: snapshot {snapshot} não existe", result.stderr)
                    self.assertIn("schema reconstruído do repositório", database)
                    self.assertIn("### `pedidos` — RLS: **enabled**", database)

    def test_acentos_bom_crlf_e_bytes_invalidos(self):
        self.write("supabase/migrations/20260101000001_acentos.sql",
                   "\ufeff-- migração com acentuação\r\nCREATE TABLE public.lançamentos_x (id uuid, descrição text);\r\n"
                   "CREATE TABLE public.notas (id uuid, situacao text CHECK (situacao IN ('não_paga', 'paga')));\r\n"
                   "COMMENT ON TABLE public.notas IS 'Notas fiscais — emissão e cobrança';\r\n"
                   "CREATE POLICY \"Usuários veem só o que é seu\" ON public.notas FOR SELECT USING (true);\r\n")
        self.write("supabase/migrations/20260101000002_latin1.sql", "CREATE TABLE public.latin (id uuid); -- coment\xe1rio".encode("latin-1"))
        self.write("src/lib/texto.ts", "export function validar(x: string) { if (!x) throw new Error('Descrição é obrigatória'); }\n")
        context = self.gerar()
        self.assertEqual(set(context["schema"]["tables"]), {"lançamentos_x", "notas", "latin"})
        self.assertEqual(context["schema"]["tables"]["notas"]["comment"], "Notas fiscais — emissão e cobrança")
        self.assertEqual(context["schema"]["policies"][0]["name"], "Usuários veem só o que é seu")
        rules = (self.root / "saida/07-REGRAS-DE-NEGOCIO.md").read_bytes().decode("utf-8")
        self.assertIn("Usuários veem só o que é seu", rules)
        self.assertIn("`não_paga`, `paga`", rules)
        self.assertIn("Descrição é obrigatória", rules)
        self.assertNotIn("\r", rules)
        self.assertNotIn("\ufeff", rules)
        self.assertIn("Notas fiscais — emissão e cobrança", self.saida("11-GLOSSARIO-E-LACUNAS.md"))

    def test_regras_manuais_entram_na_secao_a_e_nao_sao_sobrescritas(self):
        self.prepare()
        manual = self.root / "docs/contexto/regras/manual"
        manual.mkdir(parents=True)
        (manual / "regras.md").write_text("## Aprovação\nPagamento acima de R$ 10.000 exige dois aprovadores.\n", encoding="utf-8")
        (manual / "README.md").write_text("meu readme\n", encoding="utf-8")
        (manual / "TEMPLATE-regras-de-negocio.md").write_text("meu template\n", encoding="utf-8")
        context = self.gerar(out="docs/contexto/regras")
        rules = self.saida("07-REGRAS-DE-NEGOCIO.md", "docs/contexto/regras")
        self.assertIn("### regras.md\n\n## Aprovação\nPagamento acima de R$ 10.000 exige dois aprovadores.", rules)
        self.assertNotIn("meu readme", rules)
        self.assertNotIn("meu template", rules)
        self.assertEqual((manual / "README.md").read_text(encoding="utf-8"), "meu readme\n")
        self.assertEqual((manual / "TEMPLATE-regras-de-negocio.md").read_text(encoding="utf-8"), "meu template\n")
        self.assertEqual([m["file"] for m in context["manual"]], ["regras.md"])
        self.assertFalse(any("Nenhuma regra manual" in g for g in context["audit"]["gaps"]))
        self.assertIn("- `manual/regras.md`", self.saida("11-GLOSSARIO-E-LACUNAS.md", "docs/contexto/regras"))
        # a pasta de saída (com manual/) não volta como entrada do inventário
        self.assertEqual(context["meta"]["files_total"], len(self.files))

    def test_segredo_no_codigo_nao_vaza_para_a_saida(self):
        self.prepare()
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" + ".eyJyb2xlIjoic2VydmljZV9yb2xlIn0.abcDEF123"
        self.write("src/lib/segredo.ts", f"// regra: token fixo não pode ir para produção {token}\n"
                                         f"export function validarToken(t: string) {{ if (t !== '{token}') throw new Error('Token inválido para {token}'); }}\n")
        self.sql(f"CREATE TABLE cfg (id uuid, chave text DEFAULT '{token}');")
        self.gerar()
        for name in [*self.ARQUIVOS, "context.json"]:
            self.assertNotIn(token, self.saida(name), name)
        self.assertIn("[REDACTED]", self.saida("07-REGRAS-DE-NEGOCIO.md"))

    def test_troca_de_perfil_remove_os_arquivos_do_perfil_anterior(self):
        self.prepare()
        self.assertEqual(self.cli("--profile", "full", "--no-pointer").returncode, 0)
        self.assertTrue((self.root / "saida/01-VISAO-GERAL.md").is_file())
        # Regressão: com os mesmos fatos a troca de perfil caía em "nada mudou" e o manifest seguia dizendo full.
        self.assertEqual(self.cli("--profile", "regras", "--no-pointer").returncode, 0)
        self.assertEqual(sorted(p.name for p in (self.root / "saida").glob("*.md")), list(self.ARQUIVOS))
        self.assertEqual(json.loads(self.saida("manifest.json"))["perfil"], "regras")
        self.assertEqual(self.cli("--profile", "codigo", "--no-pointer").returncode, 0)
        self.assertEqual(len(list((self.root / "saida").glob("*.md"))), 9)
        self.assertFalse((self.root / "saida/07-REGRAS-DE-NEGOCIO.md").exists())
        self.assertEqual(json.loads(self.saida("manifest.json"))["entrada"], "00-INDEX.md")

    def test_ponteiro_so_e_escrito_sem_no_pointer_e_e_idempotente(self):
        self.prepare()
        (self.root / "AGENTS.md").write_text("# Regras do dono\n\nNão mexer.\n", encoding="utf-8")
        self.assertEqual(self.cli("--profile", "regras", "--index-path", "docs/contexto/00-INDEX.md").returncode, 0)
        first = (self.root / "AGENTS.md").read_text(encoding="utf-8")
        self.assertTrue(first.startswith("# Regras do dono\n\nNão mexer.\n\n<!-- ai-context-sync:start -->"))
        self.assertIn("leia `docs/contexto/00-INDEX.md`", first)
        self.assertFalse((self.root / "CLAUDE.md").exists())
        self.assertEqual(self.cli("--profile", "regras", "--index-path", "docs/contexto/00-INDEX.md", "--force").returncode, 0)
        self.assertEqual((self.root / "AGENTS.md").read_text(encoding="utf-8"), first)
        self.assertEqual(first.count("ai-context-sync:start"), 1)

    def test_llm_sem_chave_segue_sem_rede(self):
        self.prepare()
        result = self.cli("--profile", "full", "--no-pointer", "--llm")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ANTHROPIC_API_KEY ausente — síntese narrativa desativada", result.stderr)
        self.assertNotIn("Síntese narrativa", self.saida("01-VISAO-GERAL.md"))

    def test_codigo_fora_do_app_nao_vira_regra_nem_inconsistencia(self):
        self.prepare()
        ghost = "export const X = { status: 'fantasma_script' };\nawait supabase.from('tabela_fantasma').select('*');\nthrow new Error('Erro do script de apoio');\n"
        self.write("scripts/apoio.ts", ghost)
        self.write("docs/exemplo.ts", ghost)
        context = self.gerar()
        self.assertNotIn("fantasma_script", context["rules"]["state_machines"]["usage"].get("status", {}))
        self.assertEqual([i for i in context["audit"]["issues"] if "tabela_fantasma" in i["msg"]], [])
        self.assertIn({"file": "scripts/apoio.ts", "msg": "Erro do script de apoio"}, context["rules"]["error_messages"])

    def test_commit_do_manifest_e_o_ultimo_commit_que_nao_e_do_bot(self):
        self.prepare()
        git(self.root, "init", "-q", "-b", "main")
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", "feat: primeira | versão")
        human = git(self.root, "rev-parse", "HEAD")
        self.gerar()
        self.assertEqual(json.loads(self.saida("manifest.json"))["commit"], human)
        self.assertIn(f"commit `{human[:10]}` · branch `main`", self.saida("07-REGRAS-DE-NEGOCIO.md"))
        git(self.root, "add", "-A")
        git(self.root, "commit", "-q", "-m", generator.BOT_COMMIT_PREFIX + ": atualiza contexto")
        self.assertNotEqual(git(self.root, "rev-parse", "HEAD"), human)
        self.gerar("--force")
        self.assertEqual(json.loads(self.saida("manifest.json"))["commit"], human)


if __name__ == "__main__":
    unittest.main()
