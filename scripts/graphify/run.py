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
PROFILE_NAME = re.compile(r"^[a-z][a-z0-9-]{0,47}$")
ALLOWED_SUFFIXES = {".ts", ".tsx", ".js", ".jsx"}
EXCLUDED_PATHS = ("/__tests__/", "/__mocks__/", "/.graphify/", "/node_modules/")
EXCLUDED_NAMES = ("_test.ts", ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx")


def command(args, cwd, env=None, timeout=180):
    return subprocess.run(
        args, cwd=cwd, env=env, timeout=timeout, check=True,
        capture_output=True, text=True,
    ).stdout


def profile_config(config, name):
    """Seleciona um perfil versionado; regras não vêm do terminal."""
    if not PROFILE_NAME.fullmatch(name):
        raise ValueError("Nome de perfil inválido.")
    profile = config.get("profiles", {}).get(name)
    if not isinstance(profile, dict):
        raise ValueError(f"Perfil inexistente: {name}")
    merged = {**config, **profile, "name": name}
    for required in ("maxFiles", "maxBytes", "timeoutSeconds"):
        if not isinstance(merged.get(required), int) or merged[required] <= 0:
            raise ValueError(f"Perfil com {required} inválido.")
    if not merged.get("files") and not merged.get("includePrefixes"):
        raise ValueError("Perfil sem arquivos ou prefixos permitidos.")
    return merged


def is_allowed_path(name):
    rel = PurePosixPath(name)
    return not (
        rel.is_absolute() or ".." in rel.parts or "\\" in name
        or rel.suffix not in ALLOWED_SUFFIXES or rel.parts[0] not in {"src", "supabase"}
        or any(part.startswith(".") for part in rel.parts)
        or any(word in name.lower() for word in ("secret", "credential", "dump", "types.ts"))
        or any(marker in f"/{name}" for marker in EXCLUDED_PATHS)
        or name.endswith(EXCLUDED_NAMES)
    )


def selected_names(tracked, config):
    files = config.get("files")
    prefixes = config.get("includePrefixes")
    names = set()
    if files is not None:
        if not isinstance(files, list) or not files or len(files) != len(set(files)):
            raise ValueError("Lista de arquivos vazia ou duplicada.")
        names.update(files)
    if prefixes is not None:
        if not isinstance(prefixes, list) or not prefixes:
            raise ValueError("Prefixos do perfil inválidos.")
        if any(not isinstance(prefix, str) or not prefix.endswith("/")
               or prefix.startswith("/") or ".." in PurePosixPath(prefix).parts
               for prefix in prefixes):
            raise ValueError("Prefixos do perfil inválidos.")
        names.update(name for name in tracked
                     if any(name.startswith(prefix) for prefix in prefixes) and is_allowed_path(name))
    names = sorted(names)
    if not names or len(names) > config["maxFiles"]:
        raise ValueError("Corpus vazio ou acima do limite de arquivos.")
    return names


def inventory(root, config):
    """Falha fechada; devolve os mesmos bytes que serão analisados."""
    tracked = set(command(["git", "ls-files", "-z"], root).split("\0"))
    names = selected_names(tracked, config)
    files = {}
    for name in names:
        rel = PurePosixPath(name)
        if name not in tracked or not is_allowed_path(name):
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


def analyze(root, config, files):
    executable = shutil.which("graphify")
    if not executable:
        raise ValueError(f"Instale a ferramenta de desenvolvimento: uv tool install graphifyy=={config['version']}")
    version = command([executable, "--version"], root).strip()
    if version != f"graphify {config['version']}":
        raise ValueError(f"Versão incompatível: esperada graphify {config['version']}.")
    output_root = root / "graphify-out"
    output = output_root / config["name"]
    if output_root.is_symlink() or output.is_symlink():
        raise ValueError("Diretório de saída não pode ser link simbólico.")
    output.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=output))
    run.chmod(0o700)
    env = isolated_env(run)
    evidence = {
        "status": "iniciado", "commit": command(["git", "rev-parse", "HEAD"], root).strip(),
        "timestamp": datetime.now(timezone.utc).isoformat(), "version": version,
        "profile": config["name"],
        "source_worktree_dirty": bool(command(["git", "status", "--porcelain", "--", *files], root).strip()),
        "mode": "AST local; sem semântica LLM; sem banco de dados",
        "input_tokens": 0, "output_tokens": 0,
        "files": {name: hashlib.sha256(content).hexdigest() for name, content in files.items()},
    }
    manifest = run / "evidencia.json"
    manifest.write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    print(f"Execução isolada: {run}", flush=True)
    try:
        corpus = run / "corpus"
        for name, content in files.items():
            target = corpus / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(content)
        # Limita a descoberta de raiz/aliases do extrator à cópia, não ao worktree pai.
        command(["git", "init", "--quiet", str(corpus)], run, env)
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
        evidence["status"] = "validado_com_limitacoes"
        evidence["limitations"] = [
            "Corpus parcial; ausência de relação não comprova código morto.",
            "Verificar diagnostico.json: agrupamento pode colapsar relações paralelas.",
            "AST não comprova segurança, fluxo financeiro, implantação ou uso em produção.",
            "Filtro de credenciais é heurístico; artefatos privados, nunca publicar automaticamente.",
        ]
        report = graph_path.with_name("GRAPH_REPORT.md")
        warning = (
            f"> Perfil `{config['name']}` parcial, não auditoria de produção. A proveniência dos bytes está em ../evidencia.json.\n"
            f"> {evidence['raw']['unresolved_edges']} referências sem destino no corpus bruto; consultar ../diagnostico.json.\n"
            "> Não executar a sugestão genérica `graphify update .`: repetir o comando do perfil.\n\n"
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
    parser.add_argument("action", choices=["inventory", "pilot", "analyze"])
    parser.add_argument("--profile", default="pilot")
    parser.add_argument("--list", action="store_true", help="lista arquivos após aplicar a política")
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text())
    try:
        config = profile_config(config, args.profile)
        files = inventory(ROOT, config)
        print(f"Perfil {config['name']}: {len(files)} arquivos, {sum(map(len, files.values()))} bytes; somente código.", flush=True)
        if args.action == "inventory":
            if args.list:
                print("\n".join(files))
        else:
            analyze(ROOT, config, files)
    except (ValueError, OSError, subprocess.SubprocessError) as error:
        # Não imprimir stdout/stderr de dependência: podem conter conteúdo privado.
        message = str(error) if isinstance(error, (ValueError, FileNotFoundError)) else type(error).__name__
        parser.exit(1, f"Falha na análise Graphify: {message}\n")


if __name__ == "__main__":
    main()
