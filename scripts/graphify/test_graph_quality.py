import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import xml.etree.ElementTree as ET

import graph_quality as quality


class TesteQualidadeGrafo(unittest.TestCase):
    def setUp(self):
        self.graph = {
            "nodes": [
                {"id": "a", "label": "ContasPagar", "community": 0, "source_file": "src/pages/A.tsx"},
                {"id": "b", "label": "useContas", "community": 0, "source_file": "src/hooks/b.ts"},
                {"id": "c", "label": "supabase", "community": 1, "source_file": "src/lib/c.ts"},
            ],
            "links": [
                {"source": "a", "target": "b", "relation": "calls"},
                {"source": "b", "target": "c", "relation": "uses"},
            ],
        }

    def test_metricas_expoem_lacunas_colapso_e_coesao(self):
        raw = {**self.graph, "links": self.graph["links"] + [
            {"source": "a", "target": "b", "relation": "calls"},
            {"source": "a", "target": "ausente", "relation": "imports"},
        ]}
        result = quality.quality_metrics(raw, self.graph)
        self.assertEqual(result["raw_unresolved_edges"], 1)
        self.assertEqual(result["resolved_edges_removed_or_collapsed"], 1)
        self.assertEqual(result["parallel_relation_groups_raw"], 1)
        self.assertEqual(result["communities"]["0"]["cohesion"], 0.5)

    def test_consulta_tem_teto_e_termo_inexistente_e_caminho(self):
        result = quality.query_graph(self.graph, "ContasPagar", max_nodes=2)
        self.assertEqual(len(result["nodes"]), 2)
        self.assertTrue(result["truncated"])
        self.assertEqual(quality.query_graph(self.graph, "inexistente")["nodes"], [])
        self.assertEqual(quality.shortest_path(self.graph, "ContasPagar", "supabase"), ["a", "b", "c"])

    def test_frescor_exige_commit_status_e_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "a.ts").write_text("ok")
            digest = hashlib.sha256(b"ok").hexdigest()
            evidence = {"status": "validado_com_limitacoes", "commit": "sha", "files": {"a.ts": digest}}
            with patch.object(quality, "command", return_value="sha"):
                self.assertTrue(quality.validate_freshness(root, evidence))
                (root / "a.ts").write_text("mudou")
                with self.assertRaises(ValueError):
                    quality.validate_freshness(root, evidence)

    def test_svg_e_offline_e_escapa_rotulo_hostil(self):
        metrics = {"communities": {"0": {"label": "<script>alert(1)</script>", "nodes": 1,
                                              "cohesion": 1.0}}}
        svg = quality.summary_svg(metrics)
        ET.fromstring(svg)
        self.assertNotIn("<script>", svg)
        self.assertNotIn("http://", svg.replace("http://www.w3.org/2000/svg", ""))

    def test_localiza_execucao_completa_mais_recente(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = root / "graphify-out/p/execucao-a"
            new = root / "graphify-out/p/execucao-b"
            for run in (old, new):
                (run / "graphify-out").mkdir(parents=True)
                (run / "graphify-out/graph.json").write_text("{}")
                (run / "extracao-bruta.json").write_text("{}")
                (run / "evidencia.json").write_text("{}")
            graph, raw, evidence = quality.latest_profile_files(root, "p")
            self.assertEqual(graph.parent.parent, new)
            self.assertEqual(raw.parent, new)
            self.assertEqual(evidence.parent, new)


if __name__ == "__main__":
    unittest.main()
