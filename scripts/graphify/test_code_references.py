import unittest

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
"""
        refs, dynamic = code.extract_references("src/a.ts", text)
        self.assertEqual([(item["kind"], item["name"], item["line"]) for item in refs], [
            ("relation", "contas_pagar", 1), ("rpc", "calcular_total", 2),
            ("edge_function", "enviar-alerta-email", 3), ("route", "/financeiro", 7)
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


if __name__ == "__main__":
    unittest.main()
