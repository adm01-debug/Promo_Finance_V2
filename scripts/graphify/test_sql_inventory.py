import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import sql_inventory as sql


class TesteSeparadorSql(unittest.TestCase):
    def test_protege_semicolon_em_strings_comentarios_e_dollar_quote(self):
        text = """-- ; comentário
CREATE FUNCTION public.f() RETURNS text AS $tag$ SELECT ';'; $tag$ LANGUAGE sql;
CREATE TABLE public.t (id int, texto text default ';'); /* ; */
"""
        self.assertEqual(len(sql.split_statements(text)), 2)

    def test_rejeita_constructo_nao_fechado(self):
        for text in ["SELECT 'aberto", "/* aberto", "SELECT $x$ aberto"]:
            with self.subTest(text=text):
                with self.assertRaises(ValueError):
                    sql.split_statements(text)

    def test_comentario_final_sem_linha_nova_e_valido(self):
        self.assertEqual(sql.split_statements("SELECT 1; -- comentário final"), ["SELECT 1;"])

    def test_extrai_objetos_e_alvos_sem_executar_sql(self):
        text = """CREATE TABLE IF NOT EXISTS public.contas (id uuid);
CREATE OR REPLACE FUNCTION public.somar(a integer, b integer) RETURNS integer LANGUAGE sql AS $$ SELECT a + b; $$;
CREATE UNIQUE INDEX ix_contas ON public.contas (id);
CREATE POLICY leitura ON public.contas FOR SELECT USING (true);
CREATE TRIGGER auditar BEFORE UPDATE ON public.contas EXECUTE FUNCTION public.somar();
CREATE TYPE public.status AS ENUM ('novo');
CREATE EXTENSION IF NOT EXISTS pg_cron;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.contas TO authenticated;
SELECT cron.schedule('job-diario', '* * * * *', 'SELECT 1');
"""
        objects = sql.objects_in_file("supabase/migrations/1.sql", text)
        self.assertEqual([item["kind"] for item in objects], [
            "table", "function", "index", "policy", "trigger", "enum", "extension", "alter_table", "grant", "job"
        ])
        self.assertEqual(objects[2]["details"]["target"], "public.contas")
        self.assertEqual(objects[3]["details"]["target"], "public.contas")
        self.assertEqual(objects[9]["name"], "job-diario")

    def test_linha_do_objeto_e_confianca(self):
        objects = sql.objects_in_file("x.sql", "\n\nCREATE TABLE public.t (id int);")
        self.assertEqual(objects[0]["line"], 3)
        self.assertEqual(objects[0]["confidence"], "LEXICAL")

    def test_comentarios_iniciais_nao_omitem_objeto(self):
        objects = sql.objects_in_file("x.sql", "-- motivo\n/* detalhe */\nCREATE TABLE public.t (id int);")
        self.assertEqual((objects[0]["kind"], objects[0]["line"]), ("table", 3))

    def test_artefato_nao_deve_reter_sql_literal(self):
        # O catálogo guarda metadados de objeto; o teste fixa essa barreira.
        objects = sql.objects_in_file("x.sql", "CREATE TABLE public.t (token text);")
        self.assertNotIn("token text", str(objects))

    def test_detecta_literal_sem_reproduzi_lo_no_catalogo(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            migrations = root / "supabase/migrations"
            migrations.mkdir(parents=True)
            literal = "eyJ" + "a" * 20 + "." + "b" * 20 + "." + "c" * 20
            (migrations / "001.sql").write_text(f"CREATE TABLE public.t (id int); -- {literal}")
            with patch.object(sql, "MIGRATIONS", migrations):
                result = sql.inventory(root)
            self.assertEqual(result["credential_like_migrations"], ["supabase/migrations/001.sql"])
            self.assertNotIn(literal, str(result["objects"]))

    def test_extrai_dependencias_indiretas_sem_corpos_sql(self):
        text = """CREATE TABLE public.filhos (
  id uuid, pai_id uuid REFERENCES public.pais(id)
);
CREATE TRIGGER auditar AFTER UPDATE ON public.filhos EXECUTE FUNCTION public.auditar_filhos();
CREATE POLICY leitura ON public.filhos USING (true);
CREATE FUNCTION public.listar() RETURNS SETOF public.filhos AS $$
  SELECT * FROM public.filhos JOIN public.pais ON true;
$$ LANGUAGE sql;
"""
        dependencies = sql.dependencies_in_file("x.sql", text)
        self.assertEqual([(item["kind"], item["source"], item["target"]) for item in dependencies], [
            ("foreign_key", "public.filhos", "public.pais"),
            ("trigger_function", "public.filhos", "public.auditar_filhos"),
            ("policy_table", "leitura", "public.filhos"),
            ("function_relation", "public.listar", "public.filhos"),
            ("function_relation", "public.listar", "public.pais"),
        ])

    def test_aliases_de_cte_nao_viram_relacoes_fisicas(self):
        text = """CREATE FUNCTION public.resumo() RETURNS SETOF public.final AS $$
WITH q AS (SELECT * FROM public.base),
     ct(id) AS MATERIALIZED (SELECT id FROM q JOIN public.outra ON true)
SELECT * FROM ct JOIN public.final ON true;
$$ LANGUAGE sql;
"""
        dependencies = sql.dependencies_in_file("x.sql", text)
        targets = [item["target"] for item in dependencies if item["kind"] == "function_relation"]
        self.assertEqual(targets, ["public.base", "public.outra", "public.final"])
        self.assertNotIn("q", targets)
        self.assertNotIn("ct", targets)

    def test_e_string_com_aspa_escapada_nao_engole_o_statement_seguinte(self):
        self.assertEqual(sql.split_statements("SELECT E'it\\'s; ok'; SELECT 2;"),
                         ["SELECT E'it\\'s; ok';", " SELECT 2;"])
        self.assertEqual(sql.split_statements("SELECT E'a\\\\'; SELECT 2;"),
                         ["SELECT E'a\\\\';", " SELECT 2;"])

    def test_barra_invertida_em_string_comum_continua_literal(self):
        # Só o prefixo E isolado ativa escape: LIKE'...' e ESCAPE '\' são strings padrão.
        for text in ["SELECT 1 WHERE a LIKE'%\\'; SELECT 2;", "SELECT 1 WHERE a LIKE 'x' ESCAPE '\\'; SELECT 2;"]:
            with self.subTest(text=text):
                self.assertEqual(len(sql.split_statements(text)), 2)

    def test_cifrao_em_identificador_nao_abre_dollar_quote(self):
        statements = sql.split_statements("CREATE TABLE a$b$c (id int); SELECT $1 + $2; DO $$ BEGIN NULL; END$$;")
        self.assertEqual(len(statements), 3)
        self.assertEqual(sql.objects_in_file("x.sql", statements[0])[0]["name"], "a$b$c")

    def test_divisao_tem_custo_linear_em_migration_grande(self):
        # A versão com text[index:] por caractere era quadrática: ~45 s neste tamanho.
        from time import perf_counter
        text = "INSERT INTO public.t VALUES (1, 'x');\n" * 40000
        start = perf_counter()
        self.assertEqual(len(sql.split_statements(text)), 40000)
        self.assertLess(perf_counter() - start, 10)

    def test_identificador_entre_aspas_com_espaco_ou_hifen(self):
        text = """CREATE POLICY "Users can view own data" ON public."contas pagar" FOR SELECT USING (true);
CREATE POLICY "leitura"
  ON public.contas FOR SELECT USING (true);
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE TRIGGER "on auth user created" AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.novo();
CREATE TABLE IF NOT EXISTS "public"."Minha Tabela" (id int REFERENCES "outro schema"."pai x"(id));
"""
        objects = sql.objects_in_file("x.sql", text)
        self.assertEqual([(item["kind"], item["name"], item["details"].get("target"), item["line"]) for item in objects], [
            ("policy", "Users can view own data", "public.contas pagar", 1),
            ("policy", "leitura", "public.contas", 2),
            ("extension", "uuid-ossp", None, 4),
            ("trigger", "on auth user created", "auth.users", 5),
            ("table", "public.Minha Tabela", None, 6),
        ])
        dependencies = sql.dependencies_in_file("x.sql", text)
        self.assertEqual([(item["kind"], item["source"], item["target"]) for item in dependencies], [
            ("policy_table", "Users can view own data", "public.contas pagar"),
            ("policy_table", "leitura", "public.contas"),
            ("trigger_function", "auth.users", "public.novo"),
            ("foreign_key", "public.Minha Tabela", "outro schema.pai x"),
        ])

    def test_trigger_or_replace_e_constraint(self):
        text = """CREATE OR REPLACE TRIGGER trg BEFORE UPDATE ON public.t FOR EACH ROW EXECUTE FUNCTION public.f();
CREATE CONSTRAINT TRIGGER ctrg AFTER INSERT ON public.u DEFERRABLE FOR EACH ROW EXECUTE PROCEDURE public.g();
"""
        self.assertEqual([(item["kind"], item["name"], item["details"]["target"])
                          for item in sql.objects_in_file("x.sql", text)],
                         [("trigger", "trg", "public.t"), ("trigger", "ctrg", "public.u")])
        self.assertEqual([(item["source"], item["target"], item["via"])
                          for item in sql.dependencies_in_file("x.sql", text)],
                         [("public.t", "public.f", "trg"), ("public.u", "public.g", "ctrg")])

    def test_clausulas_if_e_only_nao_viram_nome_de_objeto(self):
        text = """ALTER TABLE IF EXISTS public.t ADD COLUMN u_id int REFERENCES public.u(id);
ALTER TABLE IF EXISTS ONLY public.t ENABLE ROW LEVEL SECURITY;
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv AS SELECT 1;
CREATE INDEX IF NOT EXISTS ix ON ONLY public.t USING btree (id);
"""
        objects = sql.objects_in_file("x.sql", text)
        self.assertEqual([(item["kind"], item["name"], item["details"].get("target")) for item in objects], [
            ("alter_table", "public.t", None), ("alter_table", "public.t", None),
            ("view", "public.mv", None), ("index", "ix", "public.t"),
        ])
        self.assertEqual([(item["source"], item["target"]) for item in sql.dependencies_in_file("x.sql", text)],
                         [("public.t", "public.u")])

    def test_assinatura_de_funcao_nao_trunca_no_primeiro_parentese(self):
        text = ("CREATE FUNCTION public.f(p numeric(10,2) DEFAULT round(1.5), q text DEFAULT ')', "
                "r timestamptz DEFAULT (now() - interval '7 days')) RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;\n"
                "CREATE FUNCTION public.g() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;")
        objects = sql.objects_in_file("x.sql", text)
        self.assertEqual(objects[0]["details"]["target"],
                         "p numeric(10,2) DEFAULT round(1.5), q text DEFAULT ')', "
                         "r timestamptz DEFAULT (now() - interval '7 days')")
        self.assertEqual(objects[1]["details"]["target"], "")
        self.assertIsNone(sql.balanced_arguments("f(a (b)", 1))

    def test_grant_de_tabela_dispensa_palavra_chave_table(self):
        text = """GRANT SELECT, INSERT ON public.t TO authenticated;
GRANT ALL ON t TO service_role;
GRANT SELECT (a, b) ON public.t TO anon;
GRANT SELECT ON TABLE public.t TO "papel externo";
GRANT EXECUTE ON FUNCTION public.f(uuid, text) TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT authenticated TO authenticator;
"""
        objects = sql.objects_in_file("x.sql", text)
        self.assertEqual([(item["name"], item["details"]["target"], item["line"]) for item in objects], [
            ("public.t", "authenticated", 1), ("t", "service_role", 2), ("public.t", "anon", 3),
            ("public.t", "papel externo", 4), ("public.f(uuid, text)", "authenticated", 5),
        ])
        self.assertEqual({item["kind"] for item in objects}, {"grant"})

    def test_operador_distinct_from_e_trava_for_update_nao_viram_relacao(self):
        text = """CREATE FUNCTION public.f() RETURNS trigger AS $$
BEGIN
  IF NEW.valor IS DISTINCT FROM OLD.valor AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    PERFORM 1 FROM public.fila ORDER BY id FOR UPDATE SKIP LOCKED;
    PERFORM 1 FROM public.a JOIN LATERAL (SELECT 1) x ON true;
    UPDATE public.b SET x = 1;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
"""
        targets = [item["target"] for item in sql.dependencies_in_file("x.sql", text)]
        self.assertEqual(targets, ["public.fila", "public.a", "public.b"])

    def test_objetos_fora_do_escopo_continuam_fora_do_catalogo(self):
        # Limitação declarada: tabela temporária, tipo composto, DROP e SQL dinâmico não são catalogados.
        text = """CREATE TEMP TABLE _rascunho (id int);
CREATE TYPE public.par AS (a int, b int);
DROP TABLE IF EXISTS public.t;
DO $$ BEGIN
  EXECUTE format('CREATE POLICY %I ON public.%I USING (true)', 'p', 't');
  EXECUTE $ddl$
    CREATE VIEW public.v AS SELECT 1;
  $ddl$;
  RAISE NOTICE 'ELSE CREATE TABLE public.falsa (id int)';
  -- CREATE TABLE public.comentada (id int);
END $$;
"""
        self.assertEqual(sql.objects_in_file("x.sql", text), [])
        self.assertEqual(sql.dependencies_in_file("x.sql", text), [])

    def test_ddl_condicional_dentro_de_bloco_do_entra_no_catalogo(self):
        text = """-- enum idempotente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
    CREATE TYPE public.status AS ENUM ('novo', 'pago');
  END IF;
  ALTER TABLE public.contas ADD COLUMN dono uuid REFERENCES public.usuarios(id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $outro$ BEGIN CREATE POLICY "ler tudo" ON public.contas FOR SELECT USING (true); END $outro$;
DO LANGUAGE plpgsql $$ BEGIN
  IF true THEN CREATE TRIGGER trg AFTER INSERT ON public.contas FOR EACH ROW EXECUTE FUNCTION public.f();
  ELSE GRANT SELECT ON public.contas TO anon; END IF;
  PERFORM cron.schedule('job-do', '* * * * *', 'SELECT 1');
END $$;
"""
        objects = sql.objects_in_file("x.sql", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in objects], [
            ("enum", "public.status", 5), ("alter_table", "public.contas", 7), ("policy", "ler tudo", 10),
            ("job", "job-do", 14), ("trigger", "trg", 12), ("grant", "public.contas", 13),
        ])
        self.assertEqual([item["details"].get("do_block") for item in objects], [True, True, True, None, True, True])
        self.assertEqual([(item["kind"], item["source"], item["target"], item["line"])
                          for item in sql.dependencies_in_file("x.sql", text)], [
            ("foreign_key", "public.contas", "public.usuarios", 7),
            ("policy_table", "ler tudo", "public.contas", 10),
            ("trigger_function", "public.contas", "public.f", 12),
        ])

    def test_objeto_de_topo_nao_e_marcado_como_bloco_do(self):
        objects = sql.objects_in_file("x.sql", "CREATE TABLE public.t (id int);\nSELECT cron.schedule('j', '* * * * *', 'SELECT 1');")
        self.assertEqual([item["details"] for item in objects], [{}, {}])

    def test_numero_da_linha_sobrevive_a_crlf_e_statements_anteriores(self):
        text = "-- cabeçalho\r\nCREATE TABLE public.a (id int);\r\n\r\n/* bloco\r\n */\r\nCREATE TABLE public.b (id int);\r\n"
        self.assertEqual([(item["name"], item["line"]) for item in sql.objects_in_file("x.sql", text)],
                         [("public.a", 2), ("public.b", 6)])


class TesteExecucaoInventarioSql(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.migrations = self.root / "repo/supabase/migrations"
        self.migrations.mkdir(parents=True)
        (self.migrations / "002.sql").write_text("CREATE POLICY \"ler tudo\" ON public.t USING (true);\n")
        (self.migrations / "001.sql").write_text("CREATE TABLE public.t (id int);\n")
        self.output = self.root / "saida"
        inventory = sql.inventory
        patch.object(sql, "inventory", lambda: inventory(self.root / "repo")).start()
        patch.object(sql, "command", return_value="commit-sintetico\n").start()
        patch.object(sys, "argv", ["sql_inventory.py", "--output-root", str(self.output)]).start()
        patch("builtins.print").start()
        self.addCleanup(patch.stopall)

    def artefato(self, nome):
        encontrados = list(self.output.glob(f"execucao-*/{nome}"))
        self.assertEqual(len(encontrados), 1)
        return json.loads(encontrados[0].read_text())

    def test_grava_catalogo_e_evidencia_em_ordem_de_arquivo(self):
        sql.main()
        catalog = self.artefato("catalogo-migrations.json")
        self.assertEqual([(item["kind"], item["name"], item["migration"]) for item in catalog["objects"]], [
            ("table", "public.t", "supabase/migrations/001.sql"),
            ("policy", "ler tudo", "supabase/migrations/002.sql"),
        ])
        evidence = self.artefato("evidencia.json")
        self.assertEqual(evidence["status"], "validado_com_limitacoes")
        self.assertEqual(evidence["commit"], "commit-sintetico")
        self.assertEqual(evidence["counts"], {"table": 1, "policy": 1})
        self.assertEqual(sorted(evidence["hashes"]), ["supabase/migrations/001.sql", "supabase/migrations/002.sql"])

    def test_duas_execucoes_geram_catalogos_identicos_em_diretorios_distintos(self):
        sql.main()
        sql.main()
        catalogs = sorted(self.output.glob("execucao-*/catalogo-migrations.json"))
        self.assertEqual(len(catalogs), 2)
        self.assertEqual(catalogs[0].read_bytes(), catalogs[1].read_bytes())

    def test_sql_invalido_marca_falha_sem_catalogo(self):
        (self.migrations / "003.sql").write_text("SELECT 'aberto")
        with self.assertRaises(ValueError):
            sql.main()
        self.assertEqual(self.artefato("evidencia.json")["status"], "falhou")
        self.assertFalse(list(self.output.glob("execucao-*/catalogo-migrations.json")))

    def test_sem_migrations_falha_fechado(self):
        for path in self.migrations.glob("*.sql"):
            path.unlink()
        with self.assertRaisesRegex(ValueError, "Nenhuma migration"):
            sql.main()
        self.assertEqual(self.artefato("evidencia.json")["status"], "falhou")

    def test_saida_simbolica_recusada_sem_criar_execucao(self):
        real = self.root / "real"
        real.mkdir()
        self.output.symlink_to(real, target_is_directory=True)
        with self.assertRaises(SystemExit) as error, patch.object(sys, "stderr"):
            sql.main()
        self.assertEqual(error.exception.code, 1)
        self.assertEqual(list(real.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
