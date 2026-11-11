import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import code_references as code


class TesteReferenciasCodigo(unittest.TestCase):
    def test_extrai_so_argumentos_literais_e_conta_dinamicos(self):
        text = """client.from('contas_pagar').select();
client.rpc("calcular_total", {a: 1});
client.functions.invoke('enviar-alerta-email');
client.from(nomeDinamico).select();
client.rpc(nomeDinamico);
client.functions.invoke(nomeDinamico);
navigate('/financeiro');
useQuery({ queryKey: ['contas-pagar'] });
useMutation({ mutationKey: ["baixar-conta"] });
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in refs], [
            ("relation", "contas_pagar", 1), ("rpc", "calcular_total", 2),
            ("edge_function", "enviar-alerta-email", 3), ("route", "/financeiro", 7),
            ("query_key", "contas-pagar", 8), ("mutation_key", "baixar-conta", 9)
        ])
        self.assertEqual({kind: dynamic[kind] for kind in ("relation", "rpc", "edge_function")},
                         {"relation": 1, "rpc": 1, "edge_function": 1})

    def test_correlacao_nao_inventa_match(self):
        refs = [{"kind": "relation", "name": "nao_existe"},
                {"kind": "rpc", "name": "funcao"},
                {"kind": "edge_function", "name": "fn"},
                {"kind": "route", "name": "/x"}]
        catalog = {"objects": [{"kind": "table", "name": "public.existe"},
                               {"kind": "function", "name": "public.funcao"}]}
        items = code.correlate(refs, catalog, {"outra"})
        self.assertEqual([item["catalog_match"] for item in items], [False, True, False, None])

    def test_linha_e_confidence_sao_rastreaveis(self):
        refs, _ = code.extract_references("src/a.ts", "\nclient.from('t')")
        self.assertEqual(refs[0]["line"], 2)
        self.assertEqual(refs[0]["confidence"], "LITERAL")

    def test_chaves_parcialmente_dinamicas_sao_contadas(self):
        text = """useQuery({ queryKey: ['contas', contaId] });
useMutation({ mutationKey: ["baixar", payload.id] });
useQuery({ queryKey: ['estatica,com-virgula', 'segmento', 2026] });
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([item["name"] for item in refs if item["kind"] == "query_key"],
                         ["contas", "estatica,com-virgula"])
        self.assertEqual(dynamic["query_key"], 1)
        self.assertEqual(dynamic["mutation_key"], 1)

    def test_literal_em_outra_linha_nao_e_contado_como_dinamico(self):
        text = """client
  .from(
    'contas_pagar'
  ).select();
client.rpc(
  'calcular_total',
  { a: 1 },
);
client.functions.invoke(
  'enviar-alerta-email',
  { body: {} },
);
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in refs], [
            ("relation", "contas_pagar", 2), ("rpc", "calcular_total", 5), ("edge_function", "enviar-alerta-email", 9),
        ])
        self.assertEqual({kind: dynamic[kind] for kind in ("relation", "rpc", "edge_function")},
                         {"relation": 0, "rpc": 0, "edge_function": 0})

    def test_literal_com_cast_typescript_continua_literal(self):
        text = """client.from('relatorios' as never).select();
client.rpc(
  'totais' as never,
  { p: 1 } as never,
);
client.functions.invoke("fn-x" as unknown as Nome, {});
client.from(tabela as 'a' | 'b').select();
client.rpc(nome as Rpc, params as never);
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in refs], [
            ("relation", "relatorios", 1), ("rpc", "totais", 2), ("edge_function", "fn-x", 6),
        ])
        self.assertEqual({kind: dynamic[kind] for kind in ("relation", "rpc", "edge_function")},
                         {"relation": 1, "rpc": 1, "edge_function": 0})

    def test_array_from_e_bucket_de_storage_nao_sao_relacoes(self):
        text = """const a = Array.from(new Set(ids));
const b = Uint8Array.from(atob(x), c => c.charCodeAt(0));
const c = Buffer.from(texto);
const d = Array.from('abc');
await supabase.storage.from(BUCKET).upload(p, f);
await client.storage
  .from('anexos')
  .remove([p]);
await supabase.from(tabela).select();
await (supabase as any).from(outra).select();
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([item for item in refs if item["kind"] == "relation"], [])
        self.assertEqual(dynamic["relation"], 2)

    def test_comentario_de_linha_inteira_nao_gera_referencia(self):
        text = """/**
 * @example
 *   supabase.from('contas_pagar').update({});
 */
// queryClient.invalidateQueries({ queryKey: ['contas-pagar'] })
// client.from(dinamico)
client.from('real').select();
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in refs], [("relation", "real", 7)])
        self.assertEqual(dynamic["relation"], 0)

    def test_rota_exige_identificador_path_inteiro(self):
        text = """<Route path="/contas" element={<A />} />
const rota = { path: '/admin' };
const filepath = '/tmp/x';
const opcoes = { xpath: '/html/body' };
navigate('/destino');
"""
        refs, _ = code.extract_references("src/a.tsx", text)
        self.assertEqual([item["name"] for item in refs if item["kind"] == "route"],
                         ["/contas", "/admin", "/destino"])

    def test_extracao_e_deterministica(self):
        text = "a.from('t'); a.rpc('f'); a.from(x); useQuery({ queryKey: ['k', id] });"
        self.assertEqual(code.extract_references("src/a.ts", text), code.extract_references("src/a.ts", text))


class TesteExecucaoReferencias(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.output = Path(self.temp.name) / "saida"
        for name, content in {
            "src/a.ts": "import { b } from './b';\nclient.from('existe');\nclient.from('ausente' as never);\n"
                        "client.rpc('funcao');\nclient.functions.invoke('minha-fn');\nclient.from(dinamica);\n",
            "src/b.ts": "export const b = 1;\n",
            "src/a.test.ts": "client.from('so_em_teste');\n",
            "supabase/functions/minha-fn/index.ts": "Deno.serve(() => new Response('ok'));\n",
            "supabase/migrations/001.sql": "CREATE TABLE public.existe (id int);\n"
                                           "CREATE FUNCTION public.funcao() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$;\n",
        }.items():
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
        self.tracked = ["src/a.ts", "src/b.ts", "src/a.test.ts", "supabase/functions/minha-fn/index.ts",
                        "supabase/migrations/001.sql"]

        def fake_command(args, *_unused):
            return "\0".join(self.tracked) + "\0" if "ls-files" in args else "commit-sintetico\n"

        inventory, edge_names = code.migration_inventory, code.edge_function_names
        patch.object(code, "ROOT", self.root).start()
        patch.object(code, "command", side_effect=fake_command).start()
        patch.object(code, "source_files", lambda: [name for name in self.tracked if code.is_allowed_path(name)]).start()
        patch.object(code, "migration_inventory", lambda: inventory(self.root)).start()
        patch.object(code, "edge_function_names", lambda: edge_names(self.root)).start()
        patch.object(sys, "argv", ["code_references.py", "--output-root", str(self.output)]).start()
        patch("builtins.print").start()
        self.addCleanup(patch.stopall)

    def artefato(self, nome):
        encontrados = list(self.output.glob(f"execucao-*/{nome}"))
        self.assertEqual(len(encontrados), 1)
        return json.loads(encontrados[0].read_text())

    def test_correlaciona_ponta_a_ponta_e_ignora_arquivos_de_teste(self):
        code.main()
        result = self.artefato("referencias-codigo.json")
        self.assertEqual([(item["kind"], item["name"], item["catalog_match"]) for item in result["references"]], [
            ("relation", "existe", True), ("relation", "ausente", False),
            ("rpc", "funcao", True), ("edge_function", "minha-fn", True),
        ])
        self.assertEqual(result["unmatched"], {"relation": 1, "rpc": 0, "edge_function": 0})
        self.assertEqual(result["dynamic_calls"]["relation"], 1)
        self.assertEqual(result["import_resolution"], {"RESOLVED": 1, "EXTERNAL": 0, "MISSING": 0})
        evidence = self.artefato("evidencia.json")
        self.assertEqual(evidence["status"], "validado_com_limitacoes")
        self.assertEqual(sorted(evidence["hashes"]), ["src/a.ts", "src/b.ts", "supabase/functions/minha-fn/index.ts"])

    def test_duas_execucoes_geram_o_mesmo_artefato(self):
        code.main()
        code.main()
        results = sorted(self.output.glob("execucao-*/referencias-codigo.json"))
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].read_bytes(), results[1].read_bytes())

    def test_falha_marca_evidencia_e_nao_grava_referencias(self):
        (self.root / "src/b.ts").write_bytes(b"\xff\xfe")
        with self.assertRaises(ValueError):
            code.main()
        self.assertEqual(self.artefato("evidencia.json")["status"], "falhou")
        self.assertFalse(list(self.output.glob("execucao-*/referencias-codigo.json")))

    def test_saida_simbolica_recusada(self):
        real = Path(self.temp.name) / "real"
        real.mkdir()
        self.output.symlink_to(real, target_is_directory=True)
        with self.assertRaises(SystemExit) as error, patch.object(sys, "stderr"):
            code.main()
        self.assertEqual(error.exception.code, 1)
        self.assertEqual(list(real.iterdir()), [])


if __name__ == "__main__":
    unittest.main()
