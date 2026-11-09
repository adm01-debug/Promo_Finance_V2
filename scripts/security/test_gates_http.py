#!/usr/bin/env python3
"""Cenários ponta a ponta dos probes HTTP (test-anon-surface.ts e test-rpc-runtime.ts).

Os probes rodam com `bun run` contra um servidor HTTP local (127.0.0.1) que
imita PostgREST/Auth/Edge Function — nenhuma chamada sai da máquina. O servidor
parte de uma resposta SÃ para cada rota e cada teste troca UMA resposta pela
violação que o probe deveria reprovar.

Pulado quando `bun` não está no PATH.

Rodar: python3 scripts/security/test_gates_http.py
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

AQUI = Path(__file__).resolve().parent
BUN = shutil.which("bun")
ANON_KEY = "chave-anon-de-teste"
JWT = "jwt-authenticated-de-teste"
SENHA = "senha-e2e-de-teste"
SEGREDO_LOG = "segredo-gate-log-de-teste"

_FONTE_ANON = (AQUI / "test-anon-surface.ts").read_text(encoding="utf-8")
TABELAS_VAZIAS = re.findall(r'table: "(\w+)",\s*read: "empty"', _FONTE_ANON)
TABELAS_NEGADAS = re.findall(r'table: "(\w+)",\s*read: "denied"', _FONTE_ANON)
RPCS_ANON = re.findall(r'fn: "(\w+)",\s*allowed: false', _FONTE_ANON)


class _Servidor:
    """Respostas sãs por padrão; `trocar[(método, caminho, papel)]` sobrepõe uma rota."""

    def __init__(self) -> None:
        self.trocar: dict[tuple[str, str, str], tuple[int, object]] = {}
        self.login: tuple[int, object] = (200, {"access_token": JWT})
        self.registros: list[dict[str, object]] = []
        self.cabecalhos_registro: list[dict[str, str]] = []
        dono = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *_args: object) -> None:
                pass

            def _responder(self, status: int, corpo: object) -> None:
                bruto = corpo if isinstance(corpo, bytes) else json.dumps(corpo).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(bruto)))
                self.end_headers()
                self.wfile.write(bruto)

            def _tratar(self, metodo: str) -> None:
                caminho = self.path.split("?", 1)[0]
                tamanho = int(self.headers.get("Content-Length") or 0)
                corpo = self.rfile.read(tamanho) if tamanho else b""
                papel = "authenticated" if self.headers.get("Authorization") == f"Bearer {JWT}" else "anon"
                for chave in ((metodo, caminho, papel), (metodo, caminho, "*")):
                    if chave in dono.trocar:
                        self._responder(*dono.trocar[chave])
                        return
                if caminho == "/auth/v1/token":
                    self._responder(*dono.login)
                elif caminho == "/functions/v1/ci-security-gate-log":
                    dono.registros.append(json.loads(corpo))
                    dono.cabecalhos_registro.append({k.lower(): v for k, v in self.headers.items()})
                    self._responder(200, {"inserted": 1})
                elif caminho.startswith("/rest/v1/rpc/"):
                    fn = caminho.rsplit("/", 1)[1]
                    self._responder(403, {"code": "42501", "message": f"permission denied for function {fn}"})
                elif caminho.startswith("/rest/v1/"):
                    tabela = caminho.rsplit("/", 1)[1]
                    if metodo == "GET" and tabela in TABELAS_VAZIAS:
                        self._responder(200, [])
                    elif metodo == "POST" and tabela == "frontend_error_logs":
                        self._responder(201, b"")
                    else:
                        self._responder(401, {"code": "42501", "message": f"permission denied for table {tabela}"})
                else:
                    self._responder(404, {"message": "rota desconhecida"})

            def do_GET(self) -> None:  # noqa: N802
                self._tratar("GET")

            def do_POST(self) -> None:  # noqa: N802
                self._tratar("POST")

        self.http = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self.http.server_address[1]}"
        threading.Thread(target=self.http.serve_forever, daemon=True).start()

    def parar(self) -> None:
        self.http.shutdown()
        self.http.server_close()


@unittest.skipUnless(BUN, "bun não encontrado no PATH")
class _BaseProbe(unittest.TestCase):
    SCRIPT = ""

    def setUp(self) -> None:
        self.servidor = _Servidor()
        self.addCleanup(self.servidor.parar)

    def probe(self, script: Path | None = None, **env: str | None) -> subprocess.CompletedProcess[str]:
        ambiente = {k: v for k, v in os.environ.items()
                    if k not in {"CI_GATE_LOG_SECRET", "GITHUB_SHA", "GITHUB_REF", "GITHUB_SERVER_URL",
                                 "GITHUB_REPOSITORY", "GITHUB_RUN_ID", "MIGRATION_REVISION"}}
        ambiente.update({"SUPABASE_URL": self.servidor.url, "SUPABASE_ANON_KEY": ANON_KEY,
                         "E2E_USER_EMAIL": "e2e@teste.local", "E2E_USER_PASSWORD": SENHA,
                         "NO_PROXY": "127.0.0.1,localhost", "no_proxy": "127.0.0.1,localhost"})
        for chave, valor in env.items():
            if valor is None:
                ambiente.pop(chave, None)
            else:
                ambiente[chave] = valor
        proc = subprocess.run([BUN, "run", str(script or AQUI / self.SCRIPT)], cwd="/", env=ambiente,
                              capture_output=True, text=True, timeout=120, check=False)
        for segredo in (ANON_KEY, JWT, SENHA, SEGREDO_LOG):
            self.assertNotIn(segredo, proc.stdout + proc.stderr, "segredo vazou na saída do probe")
        return proc

    def assert_contrato_do_registro(self, matriz: str) -> None:
        """Mesmo contrato do schema Zod de supabase/functions/ci-security-gate-log."""
        self.assertEqual(len(self.servidor.registros), 1)
        registro = self.servidor.registros[0]
        self.assertEqual(self.servidor.cabecalhos_registro[0].get("x-ci-gate-secret"), SEGREDO_LOG)
        for campo in ("git_sha", "git_ref", "workflow_run_url", "migration_revision"):
            self.assertIsInstance(registro.get(campo, ""), str, f"{campo} não pode ser null")
        falhas = registro["failures"]
        self.assertGreaterEqual(len(falhas), 1)
        for falha in falhas:
            self.assertEqual(falha["matrix"], matriz)
            self.assertIn(falha["role_tested"], ("anon", "authenticated", "service_role"))
            self.assertIn(falha["expected_state"], ("allow", "deny"))
            self.assertIsInstance(falha.get("observed_status", 0), int)
            self.assertIsInstance(falha["function_name"], str)


class AnonSurface(_BaseProbe):
    SCRIPT = "test-anon-surface.ts"

    def test_fixture_enxerga_os_alvos_do_script(self) -> None:
        self.assertGreaterEqual(len(TABELAS_VAZIAS), 9)
        self.assertGreaterEqual(len(TABELAS_NEGADAS), 8)
        self.assertGreaterEqual(len(RPCS_ANON), 8)

    def test_superficie_sa_aprova(self) -> None:
        proc = self.probe()
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        total = 2 * (len(TABELAS_VAZIAS) + len(TABELAS_NEGADAS)) + len(RPCS_ANON)
        self.assertIn(f"Alvos verificados: {total} • Falhas: 0", proc.stdout)

    def test_reprova_cada_regressao(self) -> None:
        negada = {"code": "42501", "message": "permission denied"}
        casos = {
            "vazamento de linhas": (("GET", "/rest/v1/clientes", "*"), (200, [{"id": 1}]), "VAZAMENTO"),
            "policy que vira 401 (Gap #23)": (("GET", "/rest/v1/clientes", "*"), (401, negada), "esperado: 200 []"),
            "cofre legível": (("GET", "/rest/v1/api_keys", "*"), (200, []), "privilégio revogado"),
            "erro interno na leitura": (("GET", "/rest/v1/profiles", "*"), (500, {"code": "XX000"}), "erro interno"),
            "200 com corpo que não é array": (("GET", "/rest/v1/empresas", "*"), (200, {"ok": True}),
                                             "corpo não é array JSON"),
            "200 com corpo não JSON": (("GET", "/rest/v1/empresas", "*"), (200, b"<html>login</html>"),
                                       "corpo não é array JSON"),
            "escrita anônima aceita": (("POST", "/rest/v1/clientes", "*"), (201, b""), "ESCRITA ANÔNIMA ACEITA"),
            "erro interno na escrita": (("POST", "/rest/v1/clientes", "*"), (500, {"code": "P0001"}),
                                        "[write] clientes"),
            "telemetria bloqueada": (("POST", "/rest/v1/frontend_error_logs", "*"), (401, negada),
                                     "esperado: escrita permitida"),
            "rpc administrativa executa": (("POST", "/rest/v1/rpc/get_user_permissions", "*"), (200, []),
                                           "esperado: execução bloqueada"),
            "rpc administrativa com erro interno": (("POST", "/rest/v1/rpc/certificado_get_password", "*"),
                                                    (500, {"code": "XX000"}), "esperado: execução bloqueada"),
        }
        for nome, (rota, resposta, trecho) in casos.items():
            with self.subTest(nome):
                self.servidor.trocar = {rota: resposta}
                proc = self.probe()
                self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
                self.assertIn(trecho, proc.stderr)
                self.assertIn("Falhas: 1", proc.stdout)

    def test_bloqueios_equivalentes_sao_aceitos(self) -> None:
        self.servidor.trocar = {
            ("GET", "/rest/v1/api_keys", "*"): (403, {"code": "42501"}),
            ("GET", "/rest/v1/bling_tokens", "*"): (404, {"code": "PGRST202"}),
            ("POST", "/rest/v1/rpc/get_user_permissions", "*"): (404, {"code": "PGRST202"}),
            ("POST", "/rest/v1/rpc/export_asaas_audit_csv", "*"): (400, {"code": "PGRST102"}),
            ("POST", "/rest/v1/clientes", "*"): (400, {"code": "23502"}),
        }
        proc = self.probe()
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_registro_remoto_segue_o_contrato_da_edge_function(self) -> None:
        # Regressão: expected_state em texto livre e observed_status null eram
        # rejeitados (400) pelo schema Zod de ci-security-gate-log.
        self.servidor.trocar = {
            ("GET", "/rest/v1/clientes", "*"): (200, [{"id": 1}]),
            ("GET", "/rest/v1/api_keys", "*"): (200, []),
            ("POST", "/rest/v1/frontend_error_logs", "*"): (401, {"code": "42501"}),
        }
        proc = self.probe(CI_GATE_LOG_SECRET=SEGREDO_LOG)
        self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
        self.assert_contrato_do_registro("anon_http_surface")
        estados = {f["function_name"]: f["expected_state"] for f in self.servidor.registros[0]["failures"]}
        self.assertEqual(estados, {"clientes": "allow", "api_keys": "deny", "frontend_error_logs": "allow"})

    def test_sem_segredo_de_log_nao_registra(self) -> None:
        self.servidor.trocar = {("GET", "/rest/v1/clientes", "*"): (200, [{"id": 1}])}
        proc = self.probe()
        self.assertEqual(proc.returncode, 1)
        self.assertEqual(self.servidor.registros, [])

    def test_variavel_ausente_ou_servidor_fora_do_ar_nao_vira_ok(self) -> None:
        self.assertEqual(self.probe(SUPABASE_URL=None).returncode, 2)
        self.assertEqual(self.probe(SUPABASE_ANON_KEY="").returncode, 2)
        self.servidor.parar()
        proc = self.probe()
        self.assertEqual(proc.returncode, 2, proc.stdout)
        self.assertNotIn("✅", proc.stdout)


class RpcRuntime(_BaseProbe):
    SCRIPT = "test-rpc-runtime.ts"

    def test_matriz_sa_aprova(self) -> None:
        proc = self.probe()
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("Total: 20 • PASS: 20 • FAIL: 0", proc.stdout)

    def test_bloqueios_equivalentes_sao_aceitos(self) -> None:
        self.servidor.trocar = {
            ("POST", "/rest/v1/rpc/nfe_link_conta_pagar", "*"): (404, {"code": "PGRST202"}),
            ("POST", "/rest/v1/rpc/nfe_unlink_conta_pagar", "anon"): (401, {"code": "42501"}),
            ("POST", "/rest/v1/rpc/confirmar_conciliacao", "*"):
                (403, {"code": "42501", "message": 'permission denied for function "confirmar_conciliacao"'}),
        }
        proc = self.probe()
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)

    def test_reprova_cada_regressao(self) -> None:
        casos = {
            "authenticated executa": (("POST", "/rest/v1/rpc/desfazer_conciliacao", "authenticated"), (200, [])),
            "anon executa": (("POST", "/rest/v1/rpc/nfe_suggest_contas_pagar", "anon"), (200, [])),
            "erro de negócio já dentro do corpo": (("POST", "/rest/v1/rpc/nfe_link_conta_pagar", "authenticated"),
                                                  (400, {"code": "P0001", "message": "nfe inválida"})),
            "erro interno": (("POST", "/rest/v1/rpc/nfe_link_conta_pagar", "anon"), (500, {"code": "XX000"})),
            "401 para authenticated": (("POST", "/rest/v1/rpc/nfe_link_conta_pagar", "authenticated"),
                                       (401, {"code": "PGRST301", "message": "JWT expired"})),
            "403 de tabela": (("POST", "/rest/v1/rpc/nfe_link_conta_pagar", "authenticated"),
                              (403, {"code": "42501", "message": "permission denied for table contas_pagar"})),
            # Regressão: o nome era comparado por prefixo e este 403 — emitido já
            # dentro do corpo de desfazer_conciliacao — passava como ACL.
            "403 de função com o nome como prefixo": (
                ("POST", "/rest/v1/rpc/desfazer_conciliacao", "authenticated"),
                (403, {"code": "42501", "message": "permission denied for function desfazer_conciliacao_manual"})),
        }
        for nome, (rota, resposta) in casos.items():
            with self.subTest(nome):
                self.servidor.trocar = {rota: resposta}
                proc = self.probe()
                self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
                self.assertIn(f"{rota[1].rsplit('/', 1)[1]} [{rota[2]}] esperado=bloqueado", proc.stderr)
                self.assertIn("PASS: 19 • FAIL: 1", proc.stdout)

    def test_gate_executa_mesmo_em_caminho_com_espaco_ou_symlink(self) -> None:
        # Regressão: a detecção de "módulo principal" comparava o caminho
        # percent-encoded e, com espaço no caminho, o gate saía 0 sem rodar nada.
        self.servidor.trocar = {("POST", "/rest/v1/rpc/desfazer_conciliacao", "authenticated"): (200, [])}
        with tempfile.TemporaryDirectory(prefix="caminho com espaço ") as tmp:
            copia = Path(tmp) / "test-rpc-runtime.ts"
            shutil.copy(AQUI / self.SCRIPT, copia)
            atalho = Path(tmp) / "atalho.ts"
            atalho.symlink_to(copia)
            for script in (copia, atalho):
                with self.subTest(script=script.name):
                    proc = self.probe(script)
                    self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
                    self.assertIn("Runtime RPC deny matrix", proc.stdout)

    def test_registro_remoto_segue_o_contrato_da_edge_function(self) -> None:
        self.servidor.trocar = {("POST", "/rest/v1/rpc/nfe_suggest_contas_pagar", "anon"): (200, [])}
        proc = self.probe(CI_GATE_LOG_SECRET=SEGREDO_LOG)
        self.assertEqual(proc.returncode, 1, proc.stdout + proc.stderr)
        self.assert_contrato_do_registro("rpc_runtime_privileges")
        falha = self.servidor.registros[0]["failures"][0]
        self.assertEqual((falha["function_name"], falha["role_tested"], falha["expected_state"],
                          falha["observed_status"], falha["severity"]),
                         ("nfe_suggest_contas_pagar", "anon", "deny", 200, "critical"))

    def test_falha_de_login_ou_de_rede_sai_3(self) -> None:
        self.servidor.login = (400, {"error_description": "Invalid login credentials"})
        proc = self.probe()
        self.assertEqual(proc.returncode, 3, proc.stdout)
        self.assertIn("Falha ao obter token authenticated: 400", proc.stderr)
        self.servidor.login = (200, {"sem_token": True})
        self.assertEqual(self.probe().returncode, 3)
        self.servidor.parar()
        proc = self.probe()
        self.assertEqual(proc.returncode, 3, proc.stdout)
        self.assertNotIn("✅", proc.stdout)

    def test_variavel_obrigatoria_ausente_sai_2(self) -> None:
        for nome in ("SUPABASE_URL", "SUPABASE_ANON_KEY", "E2E_USER_EMAIL", "E2E_USER_PASSWORD"):
            with self.subTest(nome):
                proc = self.probe(**{nome: None})
                self.assertEqual(proc.returncode, 2, proc.stdout)
                self.assertIn(nome, proc.stderr)


if __name__ == "__main__":
    unittest.main()
