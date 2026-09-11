"""Compara navegação estrutural e busca textual em casos versionados."""

import argparse
import json
from pathlib import Path
import statistics
import subprocess
import tempfile
from time import perf_counter

from graph_quality import latest_profile_files, matching_ids, validate_file_hashes, validate_freshness
from run import ROOT


CASES = Path(__file__).with_name("benchmark_cases.json")


def source_hits(graph, term):
    ids = set(matching_ids(graph, term))
    return sorted({node.get("source_file") for node in graph.get("nodes", [])
                   if node.get("id") in ids and node.get("source_file")})


def rg_hits(root, term, files):
    result = subprocess.run(["rg", "-l", "-F", "--", term, *files], cwd=root,
                            capture_output=True, text=True)
    if result.returncode not in (0, 1):
        raise subprocess.CalledProcessError(result.returncode, result.args)
    return sorted(line for line in result.stdout.splitlines() if line)


def median_time(callable_, repetitions):
    samples, result = [], None
    for _ in range(repetitions):
        start = perf_counter()
        result = callable_()
        samples.append((perf_counter() - start) * 1000)
    return round(statistics.median(samples), 4), result


def run_case(root, case, repetitions=5):
    graph_path, _, evidence_path = latest_profile_files(root, case["profile"])
    evidence = json.loads(evidence_path.read_text())
    validate_freshness(root, evidence)
    corpus = evidence_path.parent / "corpus"
    if not corpus.is_dir():
        raise ValueError("Corpus preservado da execução não foi encontrado.")
    validate_file_hashes(corpus, evidence["files"])
    graph = json.loads(graph_path.read_text())
    files = sorted(evidence["files"])
    graph_ms, graph_sources = median_time(lambda: source_hits(graph, case["term"]), repetitions)
    rg_ms, text_sources = median_time(lambda: rg_hits(corpus, case["term"], files), repetitions)
    expected = case["expectedSource"]
    return {
        **case,
        "graph": {"median_ms": graph_ms, "hits": len(graph_sources), "expected_found": expected in graph_sources},
        "rg": {"median_ms": rg_ms, "hits": len(text_sources), "expected_found": expected in text_sources},
        "interpretation": "medição_local_nao_generalizavel",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cases", type=Path, default=CASES)
    parser.add_argument("--repetitions", type=int, default=5)
    parser.add_argument("--output-root", type=Path, default=ROOT / "graphify-out" / "benchmark")
    args = parser.parse_args()
    if args.repetitions < 3:
        parser.exit(2, "Use ao menos três repetições.\n")
    cases = json.loads(args.cases.read_text())
    results = [run_case(ROOT, case, args.repetitions) for case in cases]
    summary = {
        "cases": len(results),
        "graph_expected_found": sum(item["graph"]["expected_found"] for item in results),
        "rg_expected_found": sum(item["rg"]["expected_found"] for item in results),
        "limitations": [
            "Latência local varia por cache, disco e tamanho do recorte; não extrapolar percentual de economia.",
            "Busca textual e grafo respondem perguntas diferentes; acerto do arquivo-âncora não mede completude funcional.",
        ],
    }
    args.output_root.mkdir(parents=True, exist_ok=True)
    run = Path(tempfile.mkdtemp(prefix="execucao-", dir=args.output_root))
    run.chmod(0o700)
    (run / "benchmark.json").write_text(json.dumps({"summary": summary, "results": results},
                                                    ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False))
    print(f"Benchmark: {run / 'benchmark.json'}")


if __name__ == "__main__":
    main()
