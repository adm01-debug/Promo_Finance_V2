"""Piloto Graphify local: corpus explícito, sem execução do código analisado."""

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone


ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("config.json")
SECRET = re.compile(
    r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|"
    r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9_-]{15,}|"
    r"eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,})"
)


def command(args, cwd, env=None, timeout=180):
    return subprocess.run(
        args, cwd=cwd, env=env, timeout=timeout, check=True,
        capture_output=True, text=True,
    ).stdout


def inventory(root, config):
    """Falha fechada; devolve os mesmos bytes que serão analisados."""
    tracked = set(command(["git", "ls-files", "-z"], root).split("\0"))
    names = config["files"]
    if not names or len(names) != len(set(names)) or len(names) > config["maxFiles"]:
        raise ValueError("Corpus vazio, duplicado ou acima do limite de arquivos.")
    files = {}
    for name in names:
        rel = PurePosixPath(name)
        if (rel.is_absolute() or ".." in rel.parts or "\\" in name
                or name not in tracked or rel.suffix not in {".ts", ".tsx", ".js", ".jsx"}
                or rel.parts[0] not in {"src", "supabase"}
                or any(part.startswith(".") for part in rel.parts)
                or any(word in name.lower() for word in ("secret", "credential", "dump", "types.ts"))):
            raise ValueError(f"Arquivo fora da política do piloto: {name}")
        path = root / name
        if any(parent.is_symlink() for parent in [path, *path.parents] if parent != root.parent):
            raise ValueError(f"Link simbólico não permitido: {name}")
        if not path.is_file() or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError(f"Arquivo ausente ou fora do repositório: {name}")
        if path.stat().st_size > config["maxBytes"]:
            raise ValueError("Arquivo excede o orçamento do piloto.")
        content = path.read_bytes()
        decoded = content.decode("utf-8")
        if "\0" in decoded or SECRET.search(decoded):
            raise ValueError(f"Conteúdo binário ou possível credencial; revisar sem divulgar: {name}")
        files[name] = content
    if sum(map(len, files.values())) > config["maxBytes"]:
        raise ValueError("Corpus excede o orçamento total de bytes.")
    return files


def isolated_env(run):
    # Não herdar tokens, proxies, credenciais de banco ou configuração de LLM.
    env = {key: os.environ[key] for key in ("PATH", "SYSTEMROOT", "LANG") if key in os.environ}
    env.update({"HOME": str(run / "ambiente"), "PYTHONUTF8": "1", "NO_COLOR": "1"})
    Path(env["HOME"]).mkdir()
    return env


def validate_graph(data, expected, *, raw=False):
    nodes = data.get("nodes", [])
    edges = data.get("edges", data.get("links", []))
    ids = {n["id"] for n in nodes}
    if not nodes or len(ids) != len(nodes):
        raise ValueError("Grafo vazio ou com identificadores duplicados.")
    dangling = sum(e.get("source") not in ids or e.get("target") not in ids for e in edges)
    if dangling and not raw:
        raise ValueError("Grafo com aresta sem nó de origem/destino.")
    sources = {n.get("source_file") for n in nodes}
    if not set(expected).issubset(sources):
        raise ValueError("Extração parcial: existem arquivos selecionados sem representação.")
    return {"nodes": len(nodes), "edges": len(edges), "unresolved_edges": dangling}


def pilot(root, config, files):
    executable = shutil.which("graphify")
    if not executable:
        raise ValueError(f"Instale a ferramenta de desenvolvimento: uv tool install graphifyy=={config['version']}")
    version = command([executable, "--version"], root).strip()
    if version != f"graphify {config['version']}":
        raise ValueError(f"Versão incompatível: esperada graphify {config['version']}.")
    output = root / "graphify-out"
    if output.is_symlink():
        raise ValueError("Diretório de saída não pode ser link simbólico.")
    output.mkdir(exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="piloto-", dir=output))
    run.chmod(0o700)
    env = isolated_env(run)
    corpus = run / "corpus"
    for name, content in files.items():
        target = corpus / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    # Limita a descoberta de raiz/aliases do extrator à cópia, não ao worktree pai.
    command(["git", "init", "--quiet", str(corpus)], run, env)
    evidence = {
        "status": "iniciado", "commit": command(["git", "rev-parse", "HEAD"], root).strip(),
        "timestamp": datetime.now(timezone.utc).isoformat(), "version": version,
        "source_worktree_dirty": bool(command(["git", "status", "--porcelain", "--", *files], root).strip()),
        "mode": "AST local; sem semântica LLM; sem banco de dados",
        "input_tokens": 0, "output_tokens": 0,
        "files": {name: hashlib.sha256(content).hexdigest() for name, content in files.items()},
    }
    manifest = run / "evidencia.json"
    manifest.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    print(f"Execução isolada: {run}", flush=True)
    try:
        # A exceção ao gitignore vale SOMENTE para a cópia previamente filtrada.
        log = command([executable, "extract", str(corpus), "--code-only", "--no-cluster",
                       "--max-workers", "2", "--no-gitignore", "--out", str(run)],
                      run, env, config["timeoutSeconds"])
        (run / "extracao.log").write_text(log)
        graph_path = run / "graphify-out" / "graph.json"
        raw = json.loads(graph_path.read_text())
        raw["directed"] = True
        graph_path.write_text(json.dumps(raw, ensure_ascii=False))
        (run / "extracao-bruta.json").write_text(json.dumps(raw, ensure_ascii=False))
        evidence["raw"] = validate_graph(raw, files, raw=True)
        diagnostic = command([executable, "diagnose", "multigraph", "--graph", str(graph_path), "--json"], run, env)
        (run / "diagnostico.json").write_text(diagnostic)
        evidence["diagnostic_summary"] = json.loads(diagnostic)["summary"]
        log = command([executable, "cluster-only", str(run), "--no-label", "--no-viz"],
                      run, env, config["timeoutSeconds"])
        (run / "agrupamento.log").write_text(log)
        evidence["graph"] = validate_graph(json.loads(graph_path.read_text()), files)
        evidence["status"] = "piloto_validado_com_limitacoes"
        evidence["limitations"] = [
            "Corpus parcial; ausência de relação não comprova código morto.",
            "Verificar diagnostico.json: agrupamento pode colapsar relações paralelas.",
            "AST não comprova segurança, fluxo financeiro, implantação ou uso em produção.",
            "Filtro de credenciais é heurístico; artefatos privados, nunca publicar automaticamente.",
        ]
        report = graph_path.with_name("GRAPH_REPORT.md")
        warning = (
            "> Piloto parcial, não auditoria de produção. A proveniência dos bytes está em ../evidencia.json.\n"
            f"> {evidence['raw']['unresolved_edges']} referências sem destino no corpus bruto; consultar ../diagnostico.json.\n"
            "> Não executar a sugestão genérica `graphify update .`: repetir `npm run graphify:pilot`.\n\n"
        )
        report.write_text(warning + report.read_text())
        print(json.dumps(evidence["graph"], ensure_ascii=False))
        print(f"Referências sem destino no corpus bruto: {evidence['raw']['unresolved_edges']}; consulte o diagnóstico.")
        print(f"Grafo: {graph_path}\nEvidência: {manifest}")
    except Exception:
        evidence["status"] = "falhou"
        raise
    finally:
        manifest.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    return run


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["inventory", "pilot"])
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text())
    try:
        files = inventory(ROOT, config)
        print(f"Corpus: {len(files)} arquivos, {sum(map(len, files.values()))} bytes; somente código.", flush=True)
        if args.action == "inventory":
            print("\n".join(files))
        else:
            pilot(ROOT, config, files)
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        # Não imprimir stdout/stderr de dependência: podem conter conteúdo privado.
        message = str(error) if isinstance(error, (ValueError, FileNotFoundError)) else type(error).__name__
        parser.exit(1, f"Falha no piloto Graphify: {message}\n")


if __name__ == "__main__":
    main()
