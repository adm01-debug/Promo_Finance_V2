"""Cenários sintéticos de segurança e falhas; não são testes do banco real."""

import contextlib
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

import benchmark
import graph_quality as quality
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
        for names in [[], [self.name, self.name], ["src/a.ts", "src/b.ts", "src/c.ts"],
                      [""], [{"arquivo": self.name}], [[self.name]]]:
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
        with self.assertRaisesRegex(ValueError, f"UTF-8 válido: {self.name}"):
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

    def test_falha_ao_obter_commit_preserva_manifesto_inicial(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(run.shutil, "which", return_value="graphify"):
            root = Path(directory)

            def fake_command(args, *unused):
                if "--version" in args:
                    return "graphify 0.9.48"
                raise subprocess.CalledProcessError(1, args)

            with patch.object(run, "command", side_effect=fake_command), \
                    self.assertRaises(subprocess.CalledProcessError):
                run.analyze(root, {"version": "0.9.48", "name": "teste", "timeoutSeconds": 1},
                            {"src/a.ts": b"const a=1;"})
            manifests = list((root / "graphify-out/teste").glob("execucao-*/evidencia.json"))
            self.assertEqual(len(manifests), 1)
            self.assertEqual(json.loads(manifests[0].read_text())["status"], "falhou")
            self.assertFalse(list((root / "graphify-out/teste").glob("execucao-*/.evidencia.json.tmp")))


# CLI falso: reproduz só o contrato que o wrapper usa (version, extract, diagnose, cluster-only).
# O comportamento vem do arquivo "modo" ao lado dele, porque o wrapper não repassa variáveis de ambiente.
GRAPHIFY_FALSO = r"""#!/usr/bin/env python3
import json, os, sys, time
from pathlib import Path

aqui = Path(__file__).resolve().parent
modo = (aqui / "modo").read_text().strip()
args = sys.argv[1:]
with (aqui / "chamadas.jsonl").open("a") as registro:
    registro.write(json.dumps({"args": args, "env": dict(os.environ), "cwd": os.getcwd()}) + "\n")
if args == ["--version"]:
    print("graphify 0.0.1" if modo == "versao-errada" else "graphify 9.9.9")
elif args[0] == "extract":
    corpus, saida = Path(args[1]), Path(args[args.index("--out") + 1])
    if modo == "falha-extract":
        sys.stderr.write("conteudo-privado-da-dependencia\n")
        sys.exit(3)
    if modo == "lento":
        time.sleep(5)
    nomes = sorted(p.relative_to(corpus).as_posix() for p in corpus.rglob("*")
                   if p.is_file() and ".git" not in p.relative_to(corpus).parts)
    if modo == "parcial":
        nomes = nomes[:-1]
    nodes = [{"id": nome, "label": Path(nome).stem, "source_file": nome} for nome in nomes]
    links = [{"source": nomes[0], "target": nomes[-1], "relation": "imports"},
             {"source": nomes[0], "target": nomes[-1], "relation": "calls"},
             {"source": nomes[0], "target": "pacote-externo", "relation": "imports"}]
    (saida / "graphify-out").mkdir()
    (saida / "graphify-out" / "graph.json").write_text(
        "{nao e json" if modo == "json-invalido" else json.dumps({"nodes": nodes, "links": links}))
    print("extraidos", len(nodes))
elif args[:2] == ["diagnose", "multigraph"]:
    print(json.dumps({"summary": {"parallel_pairs": 1}}))
elif args[0] == "cluster-only":
    caminho = Path(args[1]) / "graphify-out" / "graph.json"
    grafo = json.loads(caminho.read_text())
    ids = {node["id"] for node in grafo["nodes"]}
    for indice, node in enumerate(grafo["nodes"]):
        node["community"] = indice % 2
    if modo != "aresta-pendurada":
        grafo["links"] = [link for link in grafo["links"] if link["target"] in ids][:1]
    caminho.write_text(json.dumps(grafo))
    caminho.with_name("GRAPH_REPORT.md").write_text("# Relatorio do fornecedor\n")
    print("agrupado")
else:
    sys.exit(64)
"""


class TesteConfiguracao(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.config = Path(self.temp.name) / "config.json"

    def executar(self, *argv):
        stderr = io.StringIO()
        with patch.object(run, "CONFIG", self.config), patch.object(sys, "argv", ["run.py", *argv]), \
                contextlib.redirect_stderr(stderr), self.assertRaises(SystemExit) as saida:
            run.main()
        return saida.exception.code, stderr.getvalue()

    def test_configuracao_ausente_ou_malformada_sai_com_codigo_1_e_mensagem(self):
        casos = {None: "config.json", "{quebrado": "não é JSON válido", "[]": "precisa de",
                 '{"version": "1", "profiles": []}': "precisa de", '{"profiles": {}}': "precisa de",
                 '{"version": 1, "profiles": {}}': "precisa de"}
        for conteudo, esperado in casos.items():
            with self.subTest(conteudo=conteudo):
                if conteudo is not None:
                    self.config.write_text(conteudo)
                codigo, mensagem = self.executar("inventory")
                self.assertEqual(codigo, 1)
                self.assertIn("Falha na análise Graphify:", mensagem)
                self.assertIn(esperado, mensagem)
                self.assertNotIn("Traceback", mensagem)

    def test_perfil_invalido_sai_com_1_e_argumento_invalido_com_2(self):
        self.config.write_text('{"version": "1", "profiles": {"pilot": {"maxFiles": 0}}}')
        self.assertEqual(self.executar("inventory")[0], 1)
        self.assertEqual(self.executar("inventory", "--profile", "../x"), (1, "Falha na análise Graphify: Nome de perfil inválido.\n"))
        self.assertEqual(self.executar("inventory", "--profile", "ausente")[0], 1)
        self.assertEqual(self.executar("subcomando-inexistente")[0], 2)
        self.assertEqual(self.executar()[0], 2)

    def test_configuracao_versionada_e_valida_e_atende_o_workflow(self):
        config = run.load_config()
        for name in config["profiles"]:
            with self.subTest(perfil=name):
                self.assertEqual(run.profile_config(config, name)["name"], name)
        workflow = run.ROOT / ".github/workflows/graphify.yml"
        if not workflow.is_file():
            self.skipTest("workflow ausente nesta cópia")
        # Perfil citado no workflow e ausente da configuração só falharia em tempo de CI.
        text = workflow.read_text()
        matriz = re.search(r"profile:\n((?:[ \t]+- [a-z][a-z0-9-]+\n)+)", text)
        citados = re.findall(r"--profile ([a-z][a-z0-9-]+)", text) + re.findall(r"- (\S+)", matriz.group(1) if matriz else "")
        self.assertGreaterEqual(len(citados), 2)
        self.assertEqual([name for name in citados if name not in config["profiles"]], [])

    def test_link_simbolico_acima_da_raiz_nao_bloqueia_o_inventario(self):
        # tempfile no macOS mora sob /var -> /private/var; só link dentro do repositório é recusado.
        real = Path(self.temp.name) / "real"
        (real / "projetos/repo/src").mkdir(parents=True)
        (real / "projetos/repo/src/a.ts").write_text("export const a = 1;\n")
        atalho = Path(self.temp.name) / "atalho"
        atalho.symlink_to(real, target_is_directory=True)
        with patch.object(run, "command", return_value="src/a.ts\0"):
            files = run.inventory(atalho / "projetos/repo", {"files": ["src/a.ts"], "maxFiles": 1, "maxBytes": 100})
        self.assertEqual(list(files), ["src/a.ts"])


class TestePilotoPontaAPonta(unittest.TestCase):
    """Wrapper real + CLI falso: valida diretórios, evidência e códigos de saída sem o pacote graphify."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name)
        self.root = base / "repo"
        self.fontes = {"src/a.ts": b"import { b } from './b';\nexport const a = b;\n",
                       "src/b.ts": b"export const b = 1;\n"}
        for name, content in self.fontes.items():
            (self.root / name).parent.mkdir(parents=True, exist_ok=True)
            (self.root / name).write_bytes(content)
        (self.root / "src/ignorado.test.ts").write_text("fora do corpus")
        self.config = base / "config.json"
        self.config.write_text(json.dumps({"version": "9.9.9", "profiles": {"pilot": {
            "maxFiles": 5, "maxBytes": 4096, "timeoutSeconds": 1, "files": sorted(self.fontes)}}}))
        self.bin = base / "bin"
        self.bin.mkdir()
        (self.bin / "graphify").write_text(GRAPHIFY_FALSO)
        (self.bin / "graphify").chmod(0o755)
        self.modo("ok")
        real_command = run.command

        def command(args, cwd, env=None, timeout=180):
            if args[:2] == ["git", "ls-files"]:
                return "\0".join([*self.fontes, "src/ignorado.test.ts"]) + "\0"
            if args[:2] == ["git", "rev-parse"]:
                return "commit-sintetico\n"
            if args[:2] == ["git", "status"]:
                return ""
            return real_command(args, cwd, env, timeout)

        for alvo in (run, quality):
            patch.object(alvo, "command", side_effect=command).start()
            patch.object(alvo, "ROOT", self.root).start()
        patch.object(run, "CONFIG", self.config).start()
        patch.dict(os.environ, {"PATH": f"{self.bin}{os.pathsep}{os.environ['PATH']}",
                                "SUPABASE_SERVICE_ROLE_KEY": "sentinela", "HTTPS_PROXY": "sentinela"}).start()
        self.addCleanup(patch.stopall)

    def modo(self, nome):
        (self.bin / "modo").write_text(nome)

    def executar(self, *argv):
        stdout, stderr = io.StringIO(), io.StringIO()
        codigo = 0
        with patch.object(sys, "argv", ["run.py", *argv]), \
                contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            try:
                run.main()
            except SystemExit as saida:
                codigo = saida.code
        return codigo, stdout.getvalue(), stderr.getvalue()

    def execucoes(self):
        return sorted((self.root / "graphify-out/pilot").glob("execucao-*"))

    def test_piloto_grava_evidencia_ligada_aos_bytes_e_aos_artefatos(self):
        codigo, stdout, stderr = self.executar("pilot")
        self.assertEqual((codigo, stderr), (0, ""))
        self.assertIn("Perfil pilot: 2 arquivos", stdout)
        (execucao,) = self.execucoes()
        self.assertEqual(execucao.stat().st_mode & 0o777, 0o700)
        evidence = json.loads((execucao / "evidencia.json").read_text())
        self.assertEqual(evidence["status"], "validado_com_limitacoes")
        self.assertEqual(evidence["commit"], "commit-sintetico")
        self.assertEqual((evidence["profile"], evidence["version"]), ("pilot", "graphify 9.9.9"))
        self.assertFalse(evidence["source_worktree_dirty"])
        self.assertEqual(evidence["files"], {name: hashlib.sha256(content).hexdigest()
                                             for name, content in self.fontes.items()})
        self.assertEqual(evidence["raw"], {"nodes": 2, "edges": 3, "unresolved_edges": 1})
        self.assertEqual(evidence["graph"], {"nodes": 2, "edges": 1, "unresolved_edges": 0})
        graph = execucao / "graphify-out/graph.json"
        raw = execucao / "extracao-bruta.json"
        self.assertEqual(evidence["artifacts"], {"graph": hashlib.sha256(graph.read_bytes()).hexdigest(),
                                                 "raw": hashlib.sha256(raw.read_bytes()).hexdigest()})
        self.assertTrue(json.loads(raw.read_text())["directed"])
        self.assertEqual(json.loads((execucao / "diagnostico.json").read_text()), {"summary": {"parallel_pairs": 1}})
        self.assertEqual(sorted(p.relative_to(execucao / "corpus").as_posix()
                                for p in (execucao / "corpus/src").rglob("*")), sorted(self.fontes))
        report = (execucao / "graphify-out/GRAPH_REPORT.md").read_text()
        self.assertTrue(report.startswith("> Perfil `pilot` parcial"))
        self.assertIn("1 referências sem destino", report)
        self.assertTrue(report.endswith("# Relatorio do fornecedor\n"))
        self.assertFalse(list(execucao.glob(".*.tmp")))

    def test_ferramenta_roda_so_sobre_a_copia_e_sem_segredos_do_ambiente(self):
        self.assertEqual(self.executar("pilot")[0], 0)
        (execucao,) = self.execucoes()
        chamadas = [json.loads(line) for line in (self.bin / "chamadas.jsonl").read_text().splitlines()]
        extract = next(item for item in chamadas if item["args"][0] == "extract")
        self.assertEqual(extract["args"], ["extract", str(execucao / "corpus"), "--code-only", "--no-cluster",
                                           "--max-workers", "2", "--no-gitignore", "--out", str(execucao)])
        for item in chamadas[1:]:
            self.assertEqual(item["cwd"], str(execucao))
            self.assertEqual(item["env"]["HOME"], str(execucao / "ambiente"))
            self.assertNotIn("SUPABASE_SERVICE_ROLE_KEY", item["env"])
            self.assertNotIn("HTTPS_PROXY", item["env"])
        self.assertNotIn("update", [item["args"][0] for item in chamadas])

    def test_inventario_nao_exige_ferramenta_nem_escreve_saida(self):
        (self.bin / "graphify").unlink()
        # PATH só com a pasta vazia: um graphify real instalado na máquina não pode mudar o resultado.
        patch.dict(os.environ, {"PATH": str(self.bin)}).start()
        codigo, stdout, _ = self.executar("inventory", "--list")
        self.assertEqual(codigo, 0)
        self.assertEqual(stdout.splitlines()[1:], sorted(self.fontes))
        self.assertFalse((self.root / "graphify-out").exists())
        codigo, _, stderr = self.executar("analyze")
        self.assertEqual(codigo, 1)
        self.assertIn("uv tool install graphifyy==9.9.9", stderr)
        self.assertFalse((self.root / "graphify-out").exists())

    def test_falhas_da_ferramenta_saem_com_1_marcam_evidencia_e_nao_vazam_saida(self):
        casos = {"falha-extract": "CalledProcessError em graphify", "lento": "TimeoutExpired em graphify",
                 "parcial": "Extração parcial", "json-invalido": "Falha na análise Graphify:",
                 "aresta-pendurada": "aresta sem nó"}
        for indice, (modo, esperado) in enumerate(casos.items(), start=1):
            with self.subTest(modo=modo):
                self.modo(modo)
                codigo, _, stderr = self.executar("analyze", "--profile", "pilot")
                self.assertEqual(codigo, 1)
                self.assertIn(esperado, stderr)
                self.assertNotIn("conteudo-privado", stderr)
                self.assertNotIn("Traceback", stderr)
                status = [json.loads((item / "evidencia.json").read_text())["status"] for item in self.execucoes()]
                self.assertEqual(status, ["falhou"] * indice)
        with self.assertRaisesRegex(ValueError, "Nenhuma execução completa"):
            quality.latest_profile_files(self.root, "pilot")

    def test_versao_divergente_nao_cria_diretorio_de_saida(self):
        self.modo("versao-errada")
        codigo, _, stderr = self.executar("pilot")
        self.assertEqual(codigo, 1)
        self.assertIn("esperada graphify 9.9.9", stderr)
        self.assertFalse((self.root / "graphify-out").exists())

    def test_execucoes_concorrentes_nao_se_misturam_e_geram_o_mesmo_grafo(self):
        config = run.profile_config(run.load_config(self.config), "pilot")
        files = run.inventory(self.root, config)
        erros = []

        def analisar():
            try:
                run.analyze(self.root, config, files)
            except Exception as error:  # noqa: BLE001 - o teste precisa ver qualquer falha da thread
                erros.append(error)

        threads = [threading.Thread(target=analisar) for _ in range(3)]
        # Um único redirecionamento na thread principal: por thread, a restauração de sys.stdout se cruzaria.
        with contextlib.redirect_stdout(io.StringIO()):
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
        self.assertEqual(erros, [])
        evidences = [json.loads((item / "evidencia.json").read_text()) for item in self.execucoes()]
        self.assertEqual(len(evidences), 3)
        self.assertEqual({item["status"] for item in evidences}, {"validado_com_limitacoes"})
        self.assertEqual(len({json.dumps(item["artifacts"], sort_keys=True) for item in evidences}), 1)

    def test_qualidade_e_benchmark_consomem_a_execucao_validada_mais_recente(self):
        self.modo("falha-extract")
        self.assertEqual(self.executar("pilot")[0], 1)
        self.modo("ok")
        self.assertEqual(self.executar("pilot")[0], 0)
        saida = Path(self.temp.name) / "qualidade"
        with patch.object(sys, "argv", ["graph_quality.py", "--profile", "pilot", "--output-root", str(saida)]), \
                contextlib.redirect_stdout(io.StringIO()) as stdout:
            quality.main()
        self.assertEqual(json.loads(stdout.getvalue().splitlines()[0]), {
            "nodes": 2, "edges": 1, "raw_unresolved_edges": 1,
            "resolved_edges_removed_or_collapsed": 1, "parallel_relation_groups_raw": 1})
        (resultado,) = saida.glob("execucao-*/qualidade.json")
        self.assertEqual(json.loads(resultado.read_text())["parallel_relation_details_raw"], [
            {"source": "src/a.ts", "target": "src/b.ts", "count": 2, "relations": {"calls": 1, "imports": 1}}])
        ET.fromstring(resultado.with_name("comunidades.svg").read_text())

        def rg_simulado(args, cwd, **_kwargs):
            term, names = args[4], args[5:]
            hits = [name for name in names if term in (cwd / name).read_text()]
            return subprocess.CompletedProcess(args, 0 if hits else 1, stdout="".join(f"{hit}\n" for hit in hits))

        with patch.object(benchmark.subprocess, "run", side_effect=rg_simulado):
            caso = benchmark.run_case(self.root, {"profile": "pilot", "term": "b", "expectedSource": "src/b.ts"}, 3)
        self.assertTrue(caso["graph"]["expected_found"])
        self.assertTrue(caso["rg"]["expected_found"])
        self.assertEqual((caso["graph"]["hits"], caso["rg"]["hits"]), (1, 2))

        (self.root / "src/a.ts").write_text("alterado depois da análise")
        with patch.object(sys, "argv", ["graph_quality.py", "--profile", "pilot", "--output-root", str(saida)]), \
                self.assertRaisesRegex(ValueError, "desatualizada"):
            quality.main()


if __name__ == "__main__":
    unittest.main()
