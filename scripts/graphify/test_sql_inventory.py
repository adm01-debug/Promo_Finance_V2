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


if __name__ == "__main__":
    unittest.main()
