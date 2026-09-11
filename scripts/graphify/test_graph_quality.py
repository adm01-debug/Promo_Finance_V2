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
            {"source": "a", "target": "b", "relation": "imports"},
            {"source": "a", "target": "ausente", "relation": "imports"},
        ]}
        result = quality.quality_metrics(raw, self.graph)
        self.assertEqual(result["raw_unresolved_edges"], 1)
        self.assertEqual(result["resolved_edges_removed_or_collapsed"], 2)
        self.assertEqual(result["parallel_relation_groups_raw"], 1)
        self.assertEqual(result["parallel_relation_details_raw"][0]["relations"],
                         {"calls": 2, "imports": 1})
        self.assertEqual(result["communities"]["0"]["cohesion"], 0.5)

    def test_consulta_tem_teto_e_termo_inexistente_e_caminho(self):
        result = quality.query_graph(self.graph, "ContasPagar", max_nodes=2)
        self.assertEqual(len(result["nodes"]), 2)
        self.assertTrue(result["truncated"])
        self.assertEqual(quality.query_graph(self.graph, "inexistente")["nodes"], [])
        self.assertEqual(quality.shortest_path(self.graph, "ContasPagar", "supabase"), ["a", "b", "c"])

    def test_caminho_respeita_direcao_por_padrao(self):
        graph = {**self.graph, "directed": True}
        self.assertEqual(quality.shortest_path(graph, "ContasPagar", "supabase"), ["a", "b", "c"])
        self.assertEqual(quality.shortest_path(graph, "supabase", "ContasPagar"), [])
        self.assertEqual(quality.shortest_path(graph, "supabase", "ContasPagar", directed=False),
                         ["c", "b", "a"])

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

    def test_frescor_rejeita_inventario_de_arquivos_ausente_ou_invalido(self):
        with patch.object(quality, "command", return_value="sha"):
            for files in (None, [], {}):
                with self.subTest(files=files), self.assertRaisesRegex(ValueError, "inventário"):
                    evidence = {"status": "validado_com_limitacoes", "commit": "sha"}
                    if files is not None:
                        evidence["files"] = files
                    quality.validate_freshness(Path("."), evidence)

    def test_frescor_rejeita_hash_invalido_e_travessia_de_diretorio(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with patch.object(quality, "command", return_value="sha"):
                for files in ({"a.ts": "curto"}, {"../fora.ts": "a" * 64},
                              {"src\\fora.ts": "a" * 64}):
                    with self.subTest(files=files), self.assertRaisesRegex(ValueError, "inválido"):
                        quality.validate_freshness(root, {
                            "status": "validado_com_limitacoes", "commit": "sha", "files": files,
                        })

    def test_svg_e_offline_e_escapa_rotulo_hostil(self):
        metrics = {"communities": {"0": {"label": "<script>alert(1)</script>", "nodes": 1,
                                              "cohesion": 1.0}}}
        svg = quality.summary_svg(metrics)
        ET.fromstring(svg)
        self.assertNotIn("<script>", svg)
        self.assertNotIn("http://", svg.replace("http://www.w3.org/2000/svg", ""))

    def test_artefatos_sao_vinculados_ao_manifesto_por_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            graph, raw = root / "graph.json", root / "raw.json"
            graph.write_text("grafo")
            raw.write_text("bruto")
            evidence = {"artifacts": {
                "graph": hashlib.sha256(graph.read_bytes()).hexdigest(),
                "raw": hashlib.sha256(raw.read_bytes()).hexdigest(),
            }}
            self.assertTrue(quality.validate_artifacts(graph, raw, evidence))
            graph.write_text("outro")
            with self.assertRaisesRegex(ValueError, "não corresponde"):
                quality.validate_artifacts(graph, raw, evidence)
            with self.assertRaisesRegex(ValueError, "não vincula"):
                quality.validate_artifacts(graph, raw, {})

    def test_localiza_execucao_completa_mais_recente(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            old = root / "graphify-out/p/execucao-a"
            new = root / "graphify-out/p/execucao-b"
            for run in (old, new):
                (run / "graphify-out").mkdir(parents=True)
                (run / "graphify-out/graph.json").write_text("{}")
                (run / "extracao-bruta.json").write_text("{}")
            (old / "evidencia.json").write_text('{"status":"validado_com_limitacoes"}')
            (new / "evidencia.json").write_text('{"status":"falhou"}')
            graph, raw, evidence = quality.latest_profile_files(root, "p")
            self.assertEqual(graph.parent.parent, old)
            self.assertEqual(raw.parent, old)
            self.assertEqual(evidence.parent, old)


if __name__ == "__main__":
    unittest.main()
