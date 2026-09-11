"""Cenários sintéticos de segurança e falhas; não são testes do banco real."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import run


class TesteInventario(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.name = "src/exemplo.ts"
        self.path = self.root / self.name
        self.path.parent.mkdir()
        self.path.write_text("export const valor = 1;\n")
        self.config = {"files": [self.name], "maxFiles": 2, "maxBytes": 1024}
        self.mock = patch.object(run, "command", return_value=self.name + "\0").start()
        self.addCleanup(patch.stopall)

    def test_bytes_do_snapshot_nao_mudam_quando_o_original_muda(self):
        files = run.inventory(self.root, self.config)
        self.path.write_text("alterado por outro agente")
        self.assertEqual(files[self.name], b"export const valor = 1;\n")

    def test_arquivo_nao_rastreado(self):
        self.mock.return_value = ""
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_caminhos_proibidos(self):
        for name in ["../fora.ts", "/tmp/fora.ts", "src/.env.ts", "src/secrets.ts",
                     "src/credentials.ts", "src/dump.ts", "src/types.ts", "src/a.sql",
                     "docs/a.ts", "src/../a.ts", "src\\a.ts"]:
            with self.subTest(name=name):
                self.config["files"] = [name]
                self.mock.return_value = name + "\0"
                with self.assertRaises(ValueError):
                    run.inventory(self.root, self.config)

    def test_corpus_vazio_duplicado_ou_acima_do_limite(self):
        for names in [[], [self.name, self.name], ["src/a.ts", "src/b.ts", "src/c.ts"]]:
            with self.subTest(names=names):
                self.config["files"] = names
                with self.assertRaises(ValueError):
                    run.inventory(self.root, self.config)

    def test_arquivo_apagado(self):
        self.path.unlink()
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_link_simbolico(self):
        self.path.unlink()
        self.path.symlink_to(self.root / "outro.ts")
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_diretorio_simbolico(self):
        self.path.parent.rename(self.root / "real")
        self.path.parent.symlink_to(self.root / "real", target_is_directory=True)
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_orcamento_por_arquivo(self):
        self.config["maxBytes"] = 1
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_orcamento_agregado(self):
        other = self.root / "src/outro.ts"
        other.write_text("export const valor = 2;\n")
        self.config.update(files=[self.name, "src/outro.ts"], maxBytes=30)
        self.mock.return_value += "src/outro.ts\0"
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)

    def test_credenciais_e_binario_nao_sao_impressos(self):
        for content in ["ghp_" + "a" * 30, "sb_secret_" + "a" * 30,
                        "-----BEGIN PRIVATE KEY-----", "eyJ" + "a" * 20 + "." + "b" * 20 + "." + "c" * 20,
                        "binario\0oculto"]:
            with self.subTest(tipo=content[:3]):
                self.path.write_text(content)
                with self.assertRaises(ValueError) as error:
                    run.inventory(self.root, self.config)
                self.assertNotIn(content, str(error.exception))

    def test_utf8_invalido(self):
        self.path.write_bytes(b"\xff\xfe")
        with self.assertRaises(ValueError):
            run.inventory(self.root, self.config)


class TesteGrafo(unittest.TestCase):
    def setUp(self):
        self.data = {"nodes": [{"id": "a", "source_file": "src/a.ts"}], "edges": []}

    def test_grafo_valido(self):
        self.assertEqual(run.validate_graph(self.data, ["src/a.ts"])["nodes"], 1)

    def test_vazio(self):
        with self.assertRaises(ValueError):
            run.validate_graph({"nodes": []}, [])

    def test_id_duplicado(self):
        self.data["nodes"] *= 2
        with self.assertRaises(ValueError):
            run.validate_graph(self.data, [])

    def test_extracao_parcial(self):
        with self.assertRaises(ValueError):
            run.validate_graph(self.data, ["src/b.ts"])

    def test_referencia_externa_bruta_e_lacuna_nao_aresta_inventada(self):
        self.data["edges"] = [{"source": "a", "target": "externo"}]
        self.assertEqual(run.validate_graph(self.data, [], raw=True)["unresolved_edges"], 1)
        self.assertEqual(len(self.data["nodes"]), 1)
        with self.assertRaises(ValueError):
            run.validate_graph(self.data, [])

    def test_formato_links(self):
        del self.data["edges"]
        self.data["links"] = [{"source": "ausente", "target": "a"}]
        with self.assertRaises(ValueError):
            run.validate_graph(self.data, [])


class TesteExecucao(unittest.TestCase):
    def test_nao_herda_credenciais_nem_flags_de_llm(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {
            "SUPABASE_SERVICE_ROLE_KEY": "sentinela", "OPENAI_API_KEY": "sentinela",
            "GRAPHIFY_FORCE": "1", "HTTPS_PROXY": "sentinela",
        }):
            env = run.isolated_env(Path(directory))
            for name in ["SUPABASE_SERVICE_ROLE_KEY", "OPENAI_API_KEY", "GRAPHIFY_FORCE", "HTTPS_PROXY"]:
                self.assertNotIn(name, env)

    def test_versao_incorreta_nao_cria_artefatos(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(run.shutil, "which", return_value="graphify"), \
                patch.object(run, "command", return_value="graphify 0.0.0"):
            root = Path(directory)
            with self.assertRaises(ValueError):
                run.analyze(root, {"version": "0.9.48", "name": "teste"}, {})
            self.assertFalse((root / "graphify-out").exists())

    def test_ferramenta_ausente(self):
        with patch.object(run.shutil, "which", return_value=None):
            with self.assertRaisesRegex(ValueError, "uv tool install"):
                run.analyze(Path("."), {"version": "0.9.48", "name": "teste"}, {})

    def test_timeout_marca_falha_e_preserva_saida_anterior(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(run.shutil, "which", return_value="graphify"):
            root = Path(directory)
            output = root / "graphify-out" / "teste"
            output.mkdir(parents=True)
            previous = output / "graph.json"
            previous.write_text("evidencia anterior")

            def fake(args, *unused):
                if "--version" in args:
                    return "graphify 0.9.48"
                if "extract" in args:
                    raise subprocess.TimeoutExpired(args, 1)
                return "commit-sintetico"

            with patch.object(run, "command", side_effect=fake):
                with self.assertRaises(subprocess.TimeoutExpired):
                    run.analyze(root, {"version": "0.9.48", "name": "teste", "timeoutSeconds": 1}, {"src/a.ts": b"const a=1;"})
            self.assertEqual(previous.read_text(), "evidencia anterior")
            evidence = list(output.glob("execucao-*/evidencia.json"))
            self.assertEqual(len(evidence), 1)
            self.assertEqual(json.loads(evidence[0].read_text())["status"], "falhou")

    def test_saida_simbolica_recusada(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(run.shutil, "which", return_value="graphify"), \
                patch.object(run, "command", return_value="graphify 0.9.48"):
            root = Path(directory)
            (root / "graphify-out").symlink_to(root / "fora", target_is_directory=True)
            with self.assertRaises(ValueError):
                run.analyze(root, {"version": "0.9.48", "name": "teste"}, {})

    def test_falha_na_copia_preserva_manifesto_de_auditoria(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(run.shutil, "which", return_value="graphify"):
            root = Path(directory)

            def fake_command(args, *unused):
                if "--version" in args:
                    return "graphify 0.9.48"
                return "commit-sintetico"

            original = Path.write_bytes

            def fail_corpus(path, content):
                if "corpus" in path.parts:
                    raise OSError("falha sintética de cópia")
                return original(path, content)

            with patch.object(run, "command", side_effect=fake_command), \
                    patch.object(Path, "write_bytes", fail_corpus):
                with self.assertRaises(OSError):
                    run.analyze(root, {"version": "0.9.48", "name": "teste", "timeoutSeconds": 1},
                                {"src/a.ts": b"const a=1;"})
            evidence = list((root / "graphify-out/teste").glob("execucao-*/evidencia.json"))
            self.assertEqual(len(evidence), 1)
            self.assertEqual(json.loads(evidence[0].read_text())["status"], "falhou")


if __name__ == "__main__":
    unittest.main()
