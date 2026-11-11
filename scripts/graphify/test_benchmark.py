import contextlib
import hashlib
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import benchmark
import run


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

            def simular_rg(args, cwd, **_kwargs):
                term, files = args[4], args[5:]
                hits = [name for name in files if term in (cwd / name).read_text()]
                return subprocess.CompletedProcess(args, 0 if hits else 1,
                                                   stdout="\n".join(hits) + ("\n" if hits else ""))

            case = {"profile": "perfil", "term": "original", "expectedSource": "src/a.ts"}
            with patch.object(benchmark, "validate_freshness", side_effect=alterar_worktree), \
                    patch.object(benchmark.subprocess, "run", side_effect=simular_rg):
                result = benchmark.run_case(root, case, repetitions=3)
            self.assertTrue(result["rg"]["expected_found"])
            self.assertNotIn("original", source.read_text())

            (run / "corpus/src/a.ts").write_text("corpus adulterado")
            with patch.object(benchmark, "validate_freshness", return_value=True), \
                    self.assertRaisesRegex(ValueError, "desatualizada"):
                benchmark.run_case(root, case, repetitions=3)

    def test_mediana_sem_repeticoes_e_recusada(self):
        for repetitions in (0, -1):
            with self.subTest(repetitions=repetitions), self.assertRaisesRegex(ValueError, "ao menos uma"):
                benchmark.median_time(list, repetitions)

    def test_execucao_sem_corpus_preservado_e_recusada(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            execucao = root / "graphify-out/perfil/execucao-a"
            (execucao / "graphify-out").mkdir(parents=True)
            graph, raw = execucao / "graphify-out/graph.json", execucao / "extracao-bruta.json"
            graph.write_text('{"nodes": []}')
            raw.write_text("{}")
            (execucao / "evidencia.json").write_text(json.dumps({
                "status": "validado_com_limitacoes", "files": {"src/a.ts": "a" * 64},
                "artifacts": {"graph": hashlib.sha256(graph.read_bytes()).hexdigest(),
                              "raw": hashlib.sha256(raw.read_bytes()).hexdigest()}}))
            case = {"profile": "perfil", "term": "x", "expectedSource": "src/a.ts"}
            with patch.object(benchmark, "validate_freshness", return_value=True), \
                    self.assertRaisesRegex(ValueError, "Corpus preservado"):
                benchmark.run_case(root, case, repetitions=3)
            with self.assertRaisesRegex(ValueError, "Nenhuma execução completa"):
                benchmark.run_case(root, {**case, "profile": "sem-execucao"}, repetitions=3)

    @unittest.skipUnless(shutil.which("rg"), "ripgrep não instalado")
    def test_ripgrep_real_trata_termo_como_literal(self):
        with tempfile.TemporaryDirectory() as directory:
            corpus = Path(directory)
            (corpus / "src").mkdir()
            (corpus / "src/a b.ts").write_text("const x = '--files'; // a.b\n")
            (corpus / "src/c.ts").write_text("const y = 'axb';\n")
            files = ["src/a b.ts", "src/c.ts"]
            self.assertEqual(benchmark.rg_hits(corpus, "--files", files), ["src/a b.ts"])
            self.assertEqual(benchmark.rg_hits(corpus, "a.b", files), ["src/a b.ts"])
            self.assertEqual(benchmark.rg_hits(corpus, "ausente", files), [])
            with self.assertRaises(subprocess.CalledProcessError):
                benchmark.rg_hits(corpus, "x", ["src/inexistente.ts"])


class TesteCasosDeBenchmark(unittest.TestCase):
    def gravar(self, conteudo):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        path = Path(temp.name) / "casos.json"
        path.write_text(conteudo)
        return path

    def test_arquivo_sem_casos_ou_com_caso_incompleto_falha_fechado(self):
        caso = {"profile": "p", "term": "t", "expectedSource": "src/a.ts"}
        invalidos = ["[]", "{}", "null", json.dumps([caso, "texto"]), json.dumps([{**caso, "term": ""}]),
                     json.dumps([{**caso, "expectedSource": 1}]),
                     json.dumps([{key: value for key, value in caso.items() if key != "profile"}])]
        for conteudo in invalidos:
            with self.subTest(conteudo=conteudo), self.assertRaises(ValueError):
                benchmark.load_cases(self.gravar(conteudo))
        with self.assertRaises(ValueError):
            benchmark.load_cases(self.gravar("{nao e json"))
        self.assertEqual(benchmark.load_cases(self.gravar(json.dumps([caso]))), [caso])

    def test_casos_versionados_apontam_para_perfil_e_ancora_existentes(self):
        config = run.load_config()
        cases = benchmark.load_cases(benchmark.CASES)
        self.assertEqual(len({(case["profile"], case["term"]) for case in cases}), len(cases))
        for case in cases:
            with self.subTest(perfil=case["profile"]):
                profile = run.profile_config(config, case["profile"])
                anchor = run.ROOT / case["expectedSource"]
                self.assertTrue(run.is_allowed_path(case["expectedSource"]))
                declared = case["expectedSource"] in profile.get("files", []) or any(
                    case["expectedSource"].startswith(prefix) for prefix in profile.get("includePrefixes", []))
                self.assertTrue(declared, "âncora fora do recorte do perfil")
                if anchor.is_file():
                    # Sem o termo no arquivo-âncora a busca textual nunca acerta e a comparação nasce enviesada.
                    self.assertIn(case["term"], anchor.read_text(encoding="utf-8"))


class TesteExecucaoBenchmark(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.output = Path(self.temp.name) / "saida"
        self.cases = Path(self.temp.name) / "casos.json"
        self.cases.write_text(json.dumps([
            {"profile": "p", "term": "achado", "expectedSource": "src/a.ts"},
            {"profile": "p", "term": "perdido", "expectedSource": "src/b.ts"}]))

    def executar(self, *argv, run_case=None):
        stdout, stderr = io.StringIO(), io.StringIO()
        chamadas = []

        def caso_simulado(root, case, repetitions):
            chamadas.append((case["term"], repetitions))
            achou = case["term"] == "achado"
            return {**case, "graph": {"median_ms": 0.1, "hits": int(achou), "expected_found": achou},
                    "rg": {"median_ms": 0.2, "hits": 0, "expected_found": False},
                    "interpretation": "medição_local_nao_generalizavel"}

        with patch.object(sys, "argv", ["benchmark.py", "--cases", str(self.cases), "--output-root",
                                        str(self.output), *argv]), \
                patch.object(benchmark, "run_case", side_effect=run_case or caso_simulado), \
                contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            benchmark.main()
        return stdout.getvalue(), chamadas

    def test_resumo_conta_casos_sem_resposta_sem_dividir_por_zero(self):
        stdout, chamadas = self.executar("--repetitions", "3")
        self.assertEqual(chamadas, [("achado", 3), ("perdido", 3)])
        summary = json.loads(stdout.splitlines()[0])
        self.assertEqual((summary["cases"], summary["graph_expected_found"], summary["rg_expected_found"]), (2, 1, 0))
        (resultado,) = self.output.glob("execucao-*/benchmark.json")
        self.assertEqual(resultado.parent.stat().st_mode & 0o777, 0o700)
        salvo = json.loads(resultado.read_text())
        self.assertEqual(salvo["summary"], summary)
        self.assertEqual([item["term"] for item in salvo["results"]], ["achado", "perdido"])

    def test_menos_de_tres_repeticoes_sai_com_2_sem_gravar(self):
        with self.assertRaises(SystemExit) as saida:
            self.executar("--repetitions", "2")
        self.assertEqual(saida.exception.code, 2)
        self.assertFalse(self.output.exists())

    def test_arquivo_de_casos_vazio_nao_reporta_sucesso(self):
        self.cases.write_text("[]")
        with self.assertRaisesRegex(ValueError, "lista não vazia"):
            self.executar()
        self.assertFalse(self.output.exists())

    def test_falha_em_um_caso_nao_grava_resultado_parcial(self):
        def falha(root, case, repetitions):
            raise ValueError("Nenhuma execução completa para o perfil: p")

        with self.assertRaisesRegex(ValueError, "Nenhuma execução completa"):
            self.executar(run_case=falha)
        self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
