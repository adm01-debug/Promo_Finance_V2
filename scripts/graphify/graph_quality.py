"""Valida frescor, qualidade, navegação e resumo visual de um grafo privado."""

import argparse
from collections import Counter, deque
import hashlib
import html
import json
from pathlib import Path, PurePosixPath
import re
import tempfile

from run import ROOT, command


def edges_of(graph):
    return graph.get("edges", graph.get("links", []))


SHA256 = re.compile(r"^[0-9a-f]{64}$")


def validate_file_hashes(root, files):
    if not isinstance(files, dict) or not files:
        raise ValueError("Evidência não contém inventário de arquivos.")
    resolved_root = root.resolve()
    for relative, expected in files.items():
        rel = PurePosixPath(relative) if isinstance(relative, str) else PurePosixPath()
        if (not rel.parts or rel.is_absolute() or ".." in rel.parts or "\\" in relative
                or not isinstance(expected, str) or not SHA256.fullmatch(expected)):
            raise ValueError("Inventário de arquivos inválido.")
        path = root / relative
        if (not path.is_file() or not path.resolve().is_relative_to(resolved_root)
                or hashlib.sha256(path.read_bytes()).hexdigest() != expected):
            raise ValueError(f"Evidência desatualizada para: {relative}")
    return True


def validate_freshness(root, evidence):
    if evidence.get("status") != "validado_com_limitacoes":
        raise ValueError("Evidência não está validada.")
    if evidence.get("commit") != command(["git", "rev-parse", "HEAD"], root).strip():
        raise ValueError("Evidência pertence a outro commit.")
    return validate_file_hashes(root, evidence.get("files"))


def community_label(nodes):
    candidates = []
    for node in nodes:
        source = node.get("source_file")
        if not source:
            continue
        parts = Path(source).parts
        if len(parts) >= 3 and parts[0] in {"src", "supabase"}:
            candidates.append("/".join(parts[:3]))
        else:
            candidates.append("/".join(parts[:-1]) or parts[0])
    ranked = sorted(Counter(candidates).items(), key=lambda item: (-item[1], item[0]))
    return " + ".join(name for name, _ in ranked[:2]) or "sem-origem"


def quality_metrics(raw, final):
    nodes = final.get("nodes", [])
    edges = edges_of(final)
    ids = {node["id"] for node in nodes}
    raw_edges = edges_of(raw)
    resolved_raw = [edge for edge in raw_edges if edge.get("source") in ids and edge.get("target") in ids]
    pair_counts = Counter((edge.get("source"), edge.get("target"), edge.get("relation")) for edge in resolved_raw)
    communities = {}
    node_community = {node["id"]: str(node.get("community", "sem-comunidade")) for node in nodes}
    for community in sorted(set(node_community.values())):
        members = [node for node in nodes if node_community[node["id"]] == community]
        internal = sum(node_community.get(edge.get("source")) == community
                       and node_community.get(edge.get("target")) == community for edge in edges)
        boundary = sum((node_community.get(edge.get("source")) == community)
                       != (node_community.get(edge.get("target")) == community) for edge in edges)
        denominator = internal + boundary
        communities[community] = {
            "label": community_label(members),
            "nodes": len(members),
            "internal_edges": internal,
            "boundary_edges": boundary,
            "cohesion": round(internal / denominator, 4) if denominator else None,
        }
    sample = [{key: edge.get(key) for key in ("source", "target", "relation", "source_file", "source_location")}
              for edge in edges[:5]]
    return {
        "nodes": len(nodes),
        "edges": len(edges),
        "raw_edges": len(raw_edges),
        "raw_unresolved_edges": len(raw_edges) - len(resolved_raw),
        "resolved_edges_removed_or_collapsed": max(0, len(resolved_raw) - len(edges)),
        "parallel_relation_groups_raw": sum(count > 1 for count in pair_counts.values()),
        "communities": communities,
        "manual_review_sample": sample,
    }


def matching_ids(graph, term):
    needle = term.casefold()
    return [node["id"] for node in graph.get("nodes", [])
            if needle in str(node.get("label", "")).casefold() or needle in node["id"].casefold()]


def query_graph(graph, term, max_nodes=20):
    if max_nodes <= 0:
        raise ValueError("Orçamento de nós deve ser positivo.")
    starts = matching_ids(graph, term)
    if not starts:
        return {"matches": [], "nodes": [], "edges": [], "truncated": False}
    adjacency = {}
    for edge in edges_of(graph):
        adjacency.setdefault(edge.get("source"), []).append((edge.get("target"), edge))
        adjacency.setdefault(edge.get("target"), []).append((edge.get("source"), edge))
    queue, seen, selected_edges = deque(starts), set(), []
    while queue and len(seen) < max_nodes:
        current = queue.popleft()
        if current in seen:
            continue
        seen.add(current)
        for target, edge in adjacency.get(current, []):
            if target not in seen and target not in queue:
                queue.append(target)
            if edge not in selected_edges:
                selected_edges.append(edge)
    nodes = [node for node in graph.get("nodes", []) if node["id"] in seen]
    edges = [edge for edge in selected_edges if edge.get("source") in seen and edge.get("target") in seen]
    return {"matches": starts, "nodes": nodes, "edges": edges, "truncated": bool(queue)}


def shortest_path(graph, source_term, target_term):
    sources, targets = matching_ids(graph, source_term), set(matching_ids(graph, target_term))
    if not sources or not targets:
        return []
    adjacency = {}
    for edge in edges_of(graph):
        adjacency.setdefault(edge.get("source"), []).append(edge.get("target"))
        adjacency.setdefault(edge.get("target"), []).append(edge.get("source"))
    queue = deque((source, [source]) for source in sources)
    seen = set(sources)
    while queue:
        current, path = queue.popleft()
        if current in targets:
            return path
        for neighbor in adjacency.get(current, []):
            if neighbor not in seen:
                seen.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return []


def summary_svg(metrics):
    communities = list(metrics["communities"].values())
    width, row_height = 900, 34
    height = 80 + row_height * len(communities)
    rows = []
    for index, item in enumerate(communities):
        y = 64 + index * row_height
        label = html.escape(item["label"])
        cohesion = "n/d" if item["cohesion"] is None else f"{item['cohesion']:.4f}"
        rows.append(f'<text x="20" y="{y}" font-family="sans-serif" font-size="13">{label}</text>')
        rows.append(f'<text x="650" y="{y}" font-family="monospace" font-size="13">nós={item["nodes"]} coesão={cohesion}</text>')
    body = "\n".join(rows)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}">\n<rect width="100%" height="100%" fill="white"/>'
            f'\n<text x="20" y="30" font-family="sans-serif" font-size="18">Resumo privado por comunidade</text>\n'
            f'{body}\n</svg>\n')


def latest_profile_files(root, profile):
    executions = sorted((root / "graphify-out" / profile).glob("execucao-*"),
                        key=lambda path: path.stat().st_mtime, reverse=True)
    for run in executions:
        graph = run / "graphify-out" / "graph.json"
        raw = run / "extracao-bruta.json"
        evidence = run / "evidencia.json"
        if graph.is_file() and raw.is_file() and evidence.is_file():
            return graph, raw, evidence
    raise ValueError(f"Nenhuma execução completa para o perfil: {profile}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("graph", type=Path, nargs="?")
    parser.add_argument("--raw", type=Path)
    parser.add_argument("--evidence", type=Path)
    parser.add_argument("--profile")
    parser.add_argument("--output-root", type=Path, default=ROOT / "graphify-out" / "quality")
    args = parser.parse_args()
    if args.output_root.is_symlink():
        parser.exit(1, "Diretório de saída não pode ser link simbólico.\n")
    if args.profile:
        if args.graph or args.raw or args.evidence:
            parser.exit(2, "Use --profile ou caminhos explícitos, não ambos.\n")
        args.graph, args.raw, args.evidence = latest_profile_files(ROOT, args.profile)
    elif not all((args.graph, args.raw, args.evidence)):
        parser.exit(2, "Informe --profile ou graph, --raw e --evidence.\n")
    evidence = json.loads(args.evidence.read_text())
    validate_freshness(ROOT, evidence)
    metrics = quality_metrics(json.loads(args.raw.read_text()), json.loads(args.graph.read_text()))
    args.output_root.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=args.output_root))
    run.chmod(0o700)
    (run / "qualidade.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n")
    (run / "comunidades.svg").write_text(summary_svg(metrics))
    print(json.dumps({key: metrics[key] for key in (
        "nodes", "edges", "raw_unresolved_edges", "resolved_edges_removed_or_collapsed",
        "parallel_relation_groups_raw")}, ensure_ascii=False))
    print(f"Qualidade: {run / 'qualidade.json'}")


if __name__ == "__main__":
    main()
