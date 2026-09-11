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


if __name__ == "__main__":
    unittest.main()
