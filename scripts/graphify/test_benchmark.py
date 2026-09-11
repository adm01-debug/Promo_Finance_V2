import unittest

import benchmark


class TesteBenchmark(unittest.TestCase):
    def test_source_hits_retorna_origens_dos_nos_correspondentes(self):
        graph = {"nodes": [
            {"id": "a", "label": "ContasPagar", "source_file": "src/a.ts"},
            {"id": "b", "label": "Outro", "source_file": "src/b.ts"},
        ]}
        self.assertEqual(benchmark.source_hits(graph, "contaspagar"), ["src/a.ts"])

    def test_mediana_executa_numero_exato_de_repeticoes(self):
        calls = []
        median, result = benchmark.median_time(lambda: calls.append(1) or ["ok"], 3)
        self.assertEqual(len(calls), 3)
        self.assertEqual(result, ["ok"])
        self.assertGreaterEqual(median, 0)


if __name__ == "__main__":
    unittest.main()
