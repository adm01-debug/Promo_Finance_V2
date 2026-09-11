import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

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

    def test_busca_textual_usa_corpus_preservado_apos_mudanca_concorrente(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = root / "graphify-out/perfil/execucao-teste"
            (run / "graphify-out").mkdir(parents=True)
            (run / "corpus/src").mkdir(parents=True)
            source = root / "src/a.ts"
            source.parent.mkdir(parents=True)
            source.write_text("const ancora = 'original';")
            (run / "corpus/src/a.ts").write_text(source.read_text())
            graph_path = run / "graphify-out/graph.json"
            raw_path = run / "extracao-bruta.json"
            graph_path.write_text(json.dumps({
                "nodes": [{"id": "ancora", "label": "original", "source_file": "src/a.ts"}],
                "edges": [],
            }))
            raw_path.write_text("{}")
            (run / "evidencia.json").write_text(json.dumps({
                "status": "validado_com_limitacoes",
                "commit": "sha",
                "files": {"src/a.ts": hashlib.sha256(source.read_bytes()).hexdigest()},
                "artifacts": {
                    "graph": hashlib.sha256(graph_path.read_bytes()).hexdigest(),
                    "raw": hashlib.sha256(raw_path.read_bytes()).hexdigest(),
                },
            }))

            def alterar_worktree(*_args):
                source.write_text("const ancora = 'alterado';")
                return True

            case = {"profile": "perfil", "term": "original", "expectedSource": "src/a.ts"}
            with patch.object(benchmark, "validate_freshness", side_effect=alterar_worktree):
                result = benchmark.run_case(root, case, repetitions=3)
            self.assertTrue(result["rg"]["expected_found"])
            self.assertNotIn("original", source.read_text())

            (run / "corpus/src/a.ts").write_text("corpus adulterado")
            with patch.object(benchmark, "validate_freshness", return_value=True), \
                    self.assertRaisesRegex(ValueError, "desatualizada"):
                benchmark.run_case(root, case, repetitions=3)


if __name__ == "__main__":
    unittest.main()
