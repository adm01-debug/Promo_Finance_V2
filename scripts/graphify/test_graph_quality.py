import contextlib
import hashlib
import io
import json
import os
import sys
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

    def test_grafo_vazio_gera_metricas_zeradas_e_svg_valido(self):
        for raw, final in (({}, {}), ({"links": []}, {"nodes": [], "edges": []})):
            with self.subTest(final=final):
                result = quality.quality_metrics(raw, final)
                self.assertEqual((result["nodes"], result["edges"], result["raw_edges"]), (0, 0, 0))
                self.assertEqual((result["communities"], result["manual_review_sample"]), ({}, []))
                ET.fromstring(quality.summary_svg(result))
        self.assertEqual(quality.query_graph({}, "x"), {"matches": [], "nodes": [], "edges": [], "truncated": False})
        self.assertEqual(quality.shortest_path({}, "a", "b"), [])

    def test_no_isolado_tem_coesao_indefinida_sem_divisao_por_zero(self):
        graph = {"nodes": [{"id": "so", "label": "Isolado", "source_file": "src/lib/so.ts"}], "links": []}
        result = quality.quality_metrics(graph, graph)
        self.assertEqual(result["communities"], {"sem-comunidade": {
            "label": "src/lib/so.ts", "nodes": 1, "internal_edges": 0, "boundary_edges": 0, "cohesion": None}})
        self.assertIn("coesão=n/d", quality.summary_svg(result))
        self.assertEqual(quality.query_graph(graph, "isolado")["nodes"], graph["nodes"])
        self.assertEqual(quality.shortest_path(graph, "isolado", "isolado"), ["so"])

    def test_arestas_duplicadas_sao_agrupadas_por_direcao(self):
        raw = {**self.graph, "links": [
            {"source": "a", "target": "b", "relation": "calls"}, {"source": "a", "target": "b", "relation": "calls"},
            {"source": "b", "target": "a", "relation": "calls"}, {"source": "b", "target": "c"},
        ]}
        result = quality.quality_metrics(raw, self.graph)
        self.assertEqual(result["parallel_relation_details_raw"],
                         [{"source": "a", "target": "b", "count": 2, "relations": {"calls": 2}}])
        self.assertEqual(result["resolved_edges_removed_or_collapsed"], 2)
        self.assertEqual(len(quality.query_graph({**self.graph, "links": raw["links"]}, "ContasPagar")["edges"]), 3)

    def test_origem_sem_componentes_nao_interrompe_o_rotulo(self):
        self.assertEqual(quality.community_label([{"source_file": "."}, {"source_file": ""}, {}]), "sem-origem")
        self.assertEqual(quality.community_label([{"source_file": "."}, {"source_file": "src/lib/a.ts"}]), "src/lib/a.ts")

    def test_orcamento_de_consulta_e_caminho_em_ciclo(self):
        with self.assertRaises(ValueError):
            quality.query_graph(self.graph, "ContasPagar", max_nodes=0)
        full = quality.query_graph(self.graph, "ContasPagar", max_nodes=3)
        self.assertEqual(([node["id"] for node in full["nodes"]], full["truncated"]), (["a", "b", "c"], False))
        ciclo = {"nodes": [{"id": "a"}, {"id": "b"}, {"id": "z"}],
                 "links": [{"source": "a", "target": "b"}, {"source": "b", "target": "a"}]}
        self.assertEqual(quality.shortest_path(ciclo, "a", "z"), [])

    def test_evidencia_que_nao_e_objeto_e_recusada(self):
        for evidence in ([], None, "validado_com_limitacoes", {"status": "falhou"}, {"status": "iniciado"}):
            with self.subTest(evidence=evidence), self.assertRaisesRegex(ValueError, "não está validada"):
                quality.validate_freshness(Path("."), evidence)

    def test_evidencia_de_outro_commit_e_recusada(self):
        with patch.object(quality, "command", return_value="outro\n"), \
                self.assertRaisesRegex(ValueError, "outro commit"):
            quality.validate_freshness(Path("."), {"status": "validado_com_limitacoes", "commit": "sha",
                                                   "files": {"a.ts": "a" * 64}})

    def test_nome_de_perfil_nao_compoe_caminho_fora_da_saida(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            run = root / "fora/execucao-a"
            (run / "graphify-out").mkdir(parents=True)
            (run / "graphify-out/graph.json").write_text("{}")
            (run / "extracao-bruta.json").write_text("{}")
            (run / "evidencia.json").write_text('{"status":"validado_com_limitacoes"}')
            (root / "graphify-out").mkdir()
            for profile in ("../fora", "", "a/b", "Perfil", None):
                with self.subTest(profile=profile), self.assertRaisesRegex(ValueError, "perfil inválido"):
                    quality.latest_profile_files(root, profile)

    def test_manifesto_corrompido_e_ignorado_e_empate_de_data_usa_o_nome(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            runs = {name: root / "graphify-out/p" / name for name in
                    ("execucao-a", "execucao-b", "execucao-c", "execucao-d", "execucao-e", "execucao-f")}
            manifests = {"execucao-a": '{"status":"validado_com_limitacoes"}',
                         "execucao-b": '{"status":"validado_com_limitacoes"}',
                         "execucao-c": "{truncado", "execucao-d": "null", "execucao-e": "[]",
                         "execucao-f": '{"status":"iniciado"}'}
            for name, run in runs.items():
                (run / "graphify-out").mkdir(parents=True)
                (run / "graphify-out/graph.json").write_text("{}")
                (run / "extracao-bruta.json").write_text("{}")
                (run / "evidencia.json").write_text(manifests[name])
                os.utime(run, (1_700_000_000, 1_700_000_000))
            self.assertEqual(quality.latest_profile_files(root, "p")[2].parent.name, "execucao-b")
            (runs["execucao-b"] / "extracao-bruta.json").unlink()
            self.assertEqual(quality.latest_profile_files(root, "p")[2].parent.name, "execucao-a")
            (runs["execucao-a"] / "evidencia.json").write_text('{"status":"falhou"}')
            with self.assertRaisesRegex(ValueError, "Nenhuma execução completa"):
                quality.latest_profile_files(root, "p")
            with self.assertRaisesRegex(ValueError, "Nenhuma execução completa"):
                quality.latest_profile_files(root, "sem-execucoes")


class TesteExecucaoQualidade(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        (self.root / "src").mkdir(parents=True)
        (self.root / "src/a.ts").write_text("export const a = 1;")
        self.graph = self.root / "grafo.json"
        self.raw = self.root / "bruto.json"
        self.evidence = self.root / "evidencia.json"
        nodes = [{"id": "a", "label": "a", "community": 0, "source_file": "src/a.ts"},
                 {"id": "b", "label": "<b>", "community": 1, "source_file": "src/a.ts"}]
        self.graph.write_text(json.dumps({"nodes": nodes, "links": [{"source": "a", "target": "b", "relation": "calls"}]}))
        self.raw.write_text(json.dumps({"nodes": nodes, "links": [
            {"source": "a", "target": "b", "relation": "calls"}, {"source": "a", "target": "fora", "relation": "imports"}]}))
        self.gravar_evidencia()
        self.output = Path(self.temp.name) / "saida"
        patch.object(quality, "ROOT", self.root).start()
        patch.object(quality, "command", return_value="sha\n").start()
        self.addCleanup(patch.stopall)

    def gravar_evidencia(self, **extra):
        self.evidence.write_text(json.dumps({
            "status": "validado_com_limitacoes", "commit": "sha",
            "files": {"src/a.ts": hashlib.sha256((self.root / "src/a.ts").read_bytes()).hexdigest()},
            "artifacts": {"graph": hashlib.sha256(self.graph.read_bytes()).hexdigest(),
                          "raw": hashlib.sha256(self.raw.read_bytes()).hexdigest()}, **extra}))

    def executar(self, *argv):
        stdout, stderr = io.StringIO(), io.StringIO()
        with patch.object(sys, "argv", ["graph_quality.py", *argv, "--output-root", str(self.output)]), \
                contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            quality.main()
        return stdout.getvalue()

    def explicitos(self):
        return [str(self.graph), "--raw", str(self.raw), "--evidence", str(self.evidence)]

    def test_caminhos_explicitos_geram_qualidade_e_svg_reprodutiveis(self):
        primeira = self.executar(*self.explicitos())
        self.executar(*self.explicitos())
        self.assertEqual(json.loads(primeira.splitlines()[0]), {
            "nodes": 2, "edges": 1, "raw_unresolved_edges": 1,
            "resolved_edges_removed_or_collapsed": 0, "parallel_relation_groups_raw": 0})
        resultados = sorted(self.output.glob("execucao-*/qualidade.json"))
        self.assertEqual(len(resultados), 2)
        self.assertEqual(resultados[0].read_bytes(), resultados[1].read_bytes())
        svgs = [item.with_name("comunidades.svg").read_text() for item in resultados]
        self.assertEqual(svgs[0], svgs[1])
        ET.fromstring(svgs[0])
        self.assertEqual(resultados[0].parent.stat().st_mode & 0o777, 0o700)

    def test_argumentos_incoerentes_saem_com_2_e_saida_simbolica_com_1(self):
        for argv in ([], [str(self.graph)], ["--profile", "pilot", str(self.graph)],
                     ["--profile", "pilot", "--raw", str(self.raw)]):
            with self.subTest(argv=argv), self.assertRaises(SystemExit) as saida:
                self.executar(*argv)
            self.assertEqual(saida.exception.code, 2)
        real = Path(self.temp.name) / "real"
        real.mkdir()
        self.output.symlink_to(real, target_is_directory=True)
        with self.assertRaises(SystemExit) as saida:
            self.executar(*self.explicitos())
        self.assertEqual(saida.exception.code, 1)
        self.assertEqual(list(real.iterdir()), [])

    def test_evidencia_invalida_falha_antes_de_gravar_qualquer_saida(self):
        casos = {
            "json malformado": lambda: self.evidence.write_text("{nao e json"),
            "status falhou": lambda: self.gravar_evidencia(status="falhou"),
            "outro commit": lambda: self.gravar_evidencia(commit="antigo"),
            "fonte alterada": lambda: (self.root / "src/a.ts").write_text("mudou"),
            "grafo adulterado": lambda: self.graph.write_text("{}"),
        }
        for nome, preparar in casos.items():
            with self.subTest(caso=nome):
                self.setUp()
                preparar()
                with self.assertRaises(ValueError):
                    self.executar(*self.explicitos())
                self.assertFalse(self.output.exists())

    def test_grafo_malformado_com_hash_coerente_ainda_falha(self):
        self.graph.write_text("{nao e json")
        self.gravar_evidencia()
        with self.assertRaises(ValueError):
            self.executar(*self.explicitos())
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
