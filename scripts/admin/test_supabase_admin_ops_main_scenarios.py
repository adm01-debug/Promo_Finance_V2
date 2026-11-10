#!/usr/bin/env python3
"""
Cenários do fluxo completo (main) de scripts/admin/supabase_admin_ops.py.

O arquivo irmão test_supabase_admin_ops_scenarios.py cobre helpers isolados;
aqui o main() roda de ponta a ponta com `req` trocado por um roteador falso que
registra cada chamada — nenhuma requisição sai da máquina. Foco: check nunca
escreve, apply só escreve o que o check apontou, exclusão de usuário restrita à
allowlist, exit code em falha, segredo/PII fora do log e erro de rede tratado.
"""
import contextlib
import io
import os
import subprocess
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import MagicMock, patch

SCRIPT_DIR = Path(__file__).resolve().parent
SCRIPT = SCRIPT_DIR / "supabase_admin_ops.py"
sys.path.insert(0, str(SCRIPT_DIR))

os.environ.setdefault("SUPABASE_ACCESS_TOKEN", "tok_test")
os.environ.setdefault("SUPABASE_PROJECT_REF", "testref")

import supabase_admin_ops as sao

MFA_OK = {"mfa_totp_enroll_enabled": True, "mfa_totp_verify_enabled": True, "mfa_max_enrolled_factors": 10}
QUER = {"fn-a": True, "fn-b": False, "fn-so-no-repo": True}
FUNCOES_OK = [{"slug": "fn-a", "verify_jwt": True}, {"slug": "fn-b", "verify_jwt": False}]
BUCKETS_OK = [{"name": "financeiro"}, {"name": "outro"}]


def usuario(email, confirmado=True, uid=None):
    return {"id": uid if uid is not None else f"id-{email}", "email": email,
            "email_confirmed_at": "2026-01-01T00:00:00Z" if confirmado else None}


class Roteador:
    """Substituto de sao.req: responde por (método, caminho) e guarda as chamadas."""

    def __init__(self, auth=None, funcoes=None, buckets=None, paginas=None, falhas=None):
        self.auth = MFA_OK if auth is None else auth
        self.funcoes = FUNCOES_OK if funcoes is None else funcoes
        self.buckets = BUCKETS_OK if buckets is None else buckets
        self.paginas = paginas if paginas is not None else [[usuario("gente@promobrindes.com.br")]]
        self.falhas = falhas or {}
        self.chamadas = []

    def __call__(self, method, path, body=None, gotrue=False):
        self.chamadas.append((method, path, body, gotrue))
        for (m, trecho), resposta in self.falhas.items():
            if m == method and trecho in path:
                return resposta
        if method != "GET":
            return 200, {}
        if path == "/config/auth":
            return 200, self.auth
        if path == "/functions":
            return 200, self.funcoes
        if path == "/storage/buckets":
            return 200, self.buckets
        if path.startswith("/admin/users?page="):
            n = int(path.split("page=")[1].split("&")[0])
            return 200, self.paginas[n - 1] if n <= len(self.paginas) else []
        return 404, {"_error": "rota não prevista no teste"}

    @property
    def escritas(self):
        return [c for c in self.chamadas if c[0] != "GET"]


class _Base(unittest.TestCase):
    def executar(self, rota, modo="check", service_key="sb_secret_teste", delete_users=None,
                 token="tok_test", ref="testref"):
        """Roda main() e devolve (exit_code, stdout). exit_code None = retornou normalmente."""
        sao.FALHAS.clear()
        env = dict(os.environ)
        env.pop("DELETE_TEST_USERS", None)
        if delete_users is not None:
            env["DELETE_TEST_USERS"] = delete_users
        saida, erro = io.StringIO(), io.StringIO()
        codigo = None
        with patch.object(sao, "req", rota), patch.object(sao, "MODE", modo), \
                patch.object(sao, "APPLY", modo == "apply"), patch.object(sao, "TOKEN", token), \
                patch.object(sao, "REF", ref), patch.object(sao, "SERVICE_KEY", service_key), \
                patch.object(sao, "want_verify_jwt", lambda: dict(QUER)), \
                patch.dict(os.environ, env, clear=True), \
                contextlib.redirect_stdout(saida), contextlib.redirect_stderr(erro):
            try:
                sao.main()
            except SystemExit as e:
                codigo = e.code
        self.stderr = erro.getvalue()
        return codigo, saida.getvalue()


class TestCheck(_Base):
    def test_tudo_em_ordem_sem_pendencias_e_sem_escrita(self):
        rota = Roteador()
        codigo, out = self.executar(rota)
        self.assertIsNone(codigo)
        self.assertIn("pendências: nenhuma", out)
        self.assertEqual(rota.escritas, [])
        self.assertIn("no repo mas NÃO deployadas (1): ['fn-so-no-repo']", out)

    def test_check_com_todas_as_pendencias_nao_escreve_nada(self):
        rota = Roteador(auth=dict(MFA_OK, mfa_totp_enroll_enabled=False),
                        funcoes=[{"slug": "fn-a", "verify_jwt": False}],
                        buckets=[{"name": "outro"}],
                        paginas=[[usuario("teste@lovable.com")]])
        codigo, out = self.executar(rota, delete_users="1")
        self.assertIsNone(codigo)
        for pendencia in ("mfa_totp", "verify_jwt", "bucket", "usuarios"):
            self.assertIn(pendencia, out)
        self.assertEqual(rota.escritas, [])

    def test_falha_de_leitura_sai_com_1(self):
        for trecho in ("/config/auth", "/functions", "/storage/buckets", "/admin/users"):
            rota = Roteador(falhas={("GET", trecho): (500, {"_error": "boom"})})
            codigo, out = self.executar(rota)
            self.assertEqual(codigo, 1, trecho)
            self.assertIn("FALHAS de leitura", out)
            self.assertEqual(rota.escritas, [])

    def test_resposta_de_auth_config_fora_do_formato_e_falha_e_nao_excecao(self):
        rota = Roteador(auth=["inesperado"])
        codigo, out = self.executar(rota)
        self.assertEqual(codigo, 1)
        self.assertIn("leitura de auth config", out)

    def test_segredos_do_auth_config_nao_sao_impressos(self):
        rota = Roteador(auth=dict(MFA_OK, smtp_pass="SENHA-SMTP-SEGREDO", hook_send_sms_secrets="v1,whsec_SEGREDO",
                                  security_captcha_secret="CAPTCHA-SEGREDO"))
        _, out = self.executar(rota, service_key="eyJ-service-SEGREDO", token="sbp_TOKEN-SEGREDO")
        for segredo in ("SENHA-SMTP-SEGREDO", "whsec_SEGREDO", "CAPTCHA-SEGREDO", "eyJ-service-SEGREDO",
                        "sbp_TOKEN-SEGREDO"):
            self.assertNotIn(segredo, out + self.stderr)

    def test_email_de_nao_confirmado_sai_mascarado(self):
        rota = Roteador(paginas=[[usuario("fulana.silva@cliente.com.br", confirmado=False)]])
        _, out = self.executar(rota)
        self.assertNotIn("fulana.silva@cliente.com.br", out)
        self.assertIn("f***@cliente.com.br", out)

    def test_sem_service_key_a_secao_de_usuarios_e_pulada(self):
        rota = Roteador()
        codigo, out = self.executar(rota, service_key="")
        self.assertIsNone(codigo)
        self.assertIn("seção de usuários pulada", out)
        self.assertFalse(any(c[3] for c in rota.chamadas))  # nenhuma chamada GoTrue

    def test_paginacao_percorre_todas_as_paginas(self):
        pagina_cheia = [usuario(f"u{i}@promobrindes.com.br") for i in range(100)]
        rota = Roteador(paginas=[pagina_cheia, [usuario("ultimo@promobrindes.com.br")]])
        _, out = self.executar(rota)
        self.assertIn("usuários: 101", out)
        self.assertEqual(len([c for c in rota.chamadas if c[1].startswith("/admin/users")]), 2)


class TestApply(_Base):
    def test_sem_pendencia_nao_escreve(self):
        rota = Roteador()
        codigo, _ = self.executar(rota, modo="apply")
        self.assertIsNone(codigo)
        self.assertEqual(rota.escritas, [])

    def test_mfa_desligado_liga_e_preserva_limite_ja_configurado(self):
        rota = Roteador(auth={"mfa_totp_enroll_enabled": False, "mfa_totp_verify_enabled": True,
                              "mfa_max_enrolled_factors": 5})
        codigo, _ = self.executar(rota, modo="apply")
        self.assertIsNone(codigo)
        # Regressão: o apply sobrescrevia o limite de produção (5) com 10.
        self.assertEqual(rota.escritas, [("PATCH", "/config/auth",
                                          {"mfa_totp_enroll_enabled": True, "mfa_totp_verify_enabled": True}, False)])

    def test_mfa_com_limite_zerado_define_o_default(self):
        rota = Roteador(auth=dict(MFA_OK, mfa_max_enrolled_factors=0))
        self.executar(rota, modo="apply")
        self.assertEqual(rota.escritas[0][2], {"mfa_totp_enroll_enabled": True, "mfa_totp_verify_enabled": True,
                                               "mfa_max_enrolled_factors": 10})

    def test_verify_jwt_divergente_e_alinhado_ao_config_toml(self):
        rota = Roteador(funcoes=[{"slug": "fn-a", "verify_jwt": False}, {"name": "fn-b", "verify_jwt_enabled": True},
                                 {"slug": "fora-do-repo", "verify_jwt": False}, {"verify_jwt": True}])
        codigo, _ = self.executar(rota, modo="apply")
        self.assertIsNone(codigo)
        self.assertEqual(sorted(rota.escritas), [("PATCH", "/functions/fn-a", {"verify_jwt": True}, False),
                                                 ("PATCH", "/functions/fn-b", {"verify_jwt": False}, False)])

    def test_bucket_ausente_so_reporta(self):
        rota = Roteador(buckets=[])
        codigo, out = self.executar(rota, modo="apply")
        self.assertIsNone(codigo)
        self.assertIn("prod-migrate", out)
        self.assertEqual(rota.escritas, [])

    def test_usuario_de_teste_so_e_apagado_com_delete_test_users_1(self):
        paginas = [[usuario("Teste@Lovable.com", uid="u1"), usuario("gente@promobrindes.com.br", uid="u2"),
                    usuario("pendente@promobrindes.com.br", confirmado=False, uid="u3"),
                    usuario("e2e-admin@promo-finance.test", uid="u4")]]
        for valor in (None, "0", "true"):
            rota = Roteador(paginas=paginas)
            codigo, out = self.executar(rota, modo="apply", delete_users=valor)
            self.assertIsNone(codigo)
            self.assertEqual(rota.escritas, [], valor)
            self.assertIn("DELETE_TEST_USERS=1 não definido", out)
        rota = Roteador(paginas=paginas)
        codigo, _ = self.executar(rota, modo="apply", delete_users="1")
        self.assertIsNone(codigo)
        # Só a allowlist; conta real e conta não confirmada nunca entram.
        self.assertEqual(rota.escritas, [("DELETE", "/admin/users/u1", None, True),
                                         ("DELETE", "/admin/users/u4", None, True)])

    def test_usuario_da_allowlist_sem_id_nao_gera_delete_em_users_none(self):
        rota = Roteador(paginas=[[{"email": "teste@lovable.com", "email_confirmed_at": None}]])
        codigo, _ = self.executar(rota, modo="apply", delete_users="1")
        self.assertIsNone(codigo)
        self.assertEqual(rota.escritas, [])

    def test_exclusao_pedida_sem_service_key_falha(self):
        rota = Roteador()
        codigo, out = self.executar(rota, modo="apply", service_key="", delete_users="1")
        self.assertEqual(codigo, 1)
        self.assertIn("sem SUPABASE_SERVICE_ROLE_KEY", out)

    def test_escrita_que_falha_sai_com_1_e_as_outras_sao_tentadas(self):
        rota = Roteador(auth=dict(MFA_OK, mfa_totp_verify_enabled=False),
                        funcoes=[{"slug": "fn-a", "verify_jwt": False}],
                        falhas={("PATCH", "/config/auth"): (500, {"_error": "indisponível"})})
        codigo, out = self.executar(rota, modo="apply")
        self.assertEqual(codigo, 1)
        self.assertIn("MFA TOTP", out)
        self.assertEqual([c[1] for c in rota.escritas], ["/config/auth", "/functions/fn-a"])

    def test_leitura_que_falha_no_apply_nao_aplica_as_cegas(self):
        rota = Roteador(falhas={("GET", "/config/auth"): (0, {"_error": "falha de rede"})})
        codigo, _ = self.executar(rota, modo="apply")
        self.assertEqual(codigo, 1)
        self.assertEqual(rota.escritas, [])


class TestEntrada(_Base):
    def test_modo_desconhecido_sai_com_2_sem_chamar_a_api(self):
        for modo in ("aply", "delete", "-v", ""):
            rota = Roteador()
            codigo, _ = self.executar(rota, modo=modo)
            self.assertEqual(codigo, 2, modo)
            self.assertIn("modo desconhecido", self.stderr)
            self.assertEqual(rota.chamadas, [])

    def test_ajuda_nao_chama_a_api(self):
        for modo in ("-h", "--help"):
            rota = Roteador()
            codigo, out = self.executar(rota, modo=modo)
            self.assertIsNone(codigo)
            self.assertIn("check", out)
            self.assertEqual(rota.chamadas, [])

    def test_token_ou_ref_ausente(self):
        for kwargs in ({"token": ""}, {"ref": ""}):
            rota = Roteador()
            codigo, _ = self.executar(rota, **kwargs)
            self.assertIn("obrigatórios", str(codigo))
            self.assertEqual(rota.chamadas, [])

    def test_ref_que_nao_e_project_ref_e_recusado(self):
        # O ref vira o host para onde a service key é enviada.
        for ref in ("evil.example.com/x", "abc@evil.com", "ref com espaço", "REF-MAIUSCULO", "a.b"):
            rota = Roteador()
            codigo, _ = self.executar(rota, ref=ref)
            self.assertIn("SUPABASE_PROJECT_REF inválido", str(codigo), ref)
            self.assertEqual(rota.chamadas, [])

    def test_linha_de_comando_como_o_workflow_chama(self):
        env = {k: v for k, v in os.environ.items() if not k.startswith("SUPABASE_")}
        env["PYTHONDONTWRITEBYTECODE"] = "1"
        r = subprocess.run([sys.executable, str(SCRIPT), "aply"], capture_output=True, text=True, env=env, timeout=30)
        self.assertEqual(r.returncode, 2)
        self.assertIn("modo desconhecido", r.stderr)
        for modo in ("check", "apply"):
            r = subprocess.run([sys.executable, str(SCRIPT), modo], capture_output=True, text=True, env=env, timeout=30)
            self.assertEqual(r.returncode, 1)
            self.assertIn("obrigatórios", r.stderr)
        r = subprocess.run([sys.executable, str(SCRIPT), "--help"], capture_output=True, text=True, env=env, timeout=30)
        self.assertEqual(r.returncode, 0)
        self.assertIn("apply", r.stdout)


class TestReq(unittest.TestCase):
    def chamar(self, efeito=None, corpo=b"{}", status=200, **kwargs):
        with patch.object(sao, "_OPENER") as opener, patch.object(sao, "REF", "testref"), \
                patch.object(sao, "TOKEN", "tok"), patch.object(sao, "SERVICE_KEY", kwargs.pop("service", "sb_secret_x")):
            if efeito is not None:
                opener.open.side_effect = efeito
            else:
                resp = MagicMock()
                resp.status = status
                resp.read.return_value = corpo
                opener.open.return_value.__enter__ = lambda s: resp
                opener.open.return_value.__exit__ = MagicMock(return_value=False)
            resultado = sao.req(kwargs.pop("method", "GET"), kwargs.pop("path", "/x"), **kwargs)
            pedido = opener.open.call_args[0][0]
            timeout = opener.open.call_args[1].get("timeout")
        return resultado, pedido, timeout

    def test_erro_de_rede_vira_codigo_0_em_vez_de_traceback(self):
        for erro in (urllib.error.URLError("Name or service not known"), TimeoutError("timed out"),
                     ConnectionResetError("reset")):
            (codigo, corpo), _, _ = self.chamar(efeito=erro)
            self.assertEqual(codigo, 0, erro)
            self.assertIn("falha de rede", corpo["_error"])

    def test_resposta_200_que_nao_e_json_nao_e_tratada_como_sucesso(self):
        (codigo, corpo), _, _ = self.chamar(corpo=b"<html>gateway</html>")
        self.assertEqual(codigo, 0)
        self.assertIn("_error", corpo)

    def test_http_error_devolve_codigo_e_corpo_truncado(self):
        erro = urllib.error.HTTPError("https://x", 403, "Forbidden", {}, io.BytesIO(b"x" * 1000))
        (codigo, corpo), _, _ = self.chamar(efeito=erro)
        self.assertEqual(codigo, 403)
        self.assertEqual(len(corpo["_error"]), 400)

    def test_corpo_vazio_em_2xx_e_sucesso(self):
        (codigo, corpo), _, _ = self.chamar(corpo=b"", status=204, method="DELETE")
        self.assertEqual((codigo, corpo), (204, {}))

    def test_management_api_usa_bearer_do_token_e_timeout(self):
        _, pedido, timeout = self.chamar(path="/functions")
        self.assertEqual(pedido.full_url, "https://api.supabase.com/v1/projects/testref/functions")
        self.assertEqual(pedido.headers["Authorization"], "Bearer tok")
        self.assertEqual(timeout, 30)

    def test_gotrue_chave_nova_so_em_apikey_chave_legada_tambem_em_bearer(self):
        _, pedido, _ = self.chamar(path="/admin/users?page=1", gotrue=True, service="sb_secret_nova")
        self.assertEqual(pedido.full_url, "https://testref.supabase.co/auth/v1/admin/users?page=1")
        self.assertEqual(pedido.headers["Apikey"], "sb_secret_nova")
        self.assertNotIn("Authorization", pedido.headers)
        _, pedido, _ = self.chamar(path="/admin/users?page=1", gotrue=True, service="eyJlegada")
        self.assertEqual(pedido.headers["Authorization"], "Bearer eyJlegada")

    def test_redirect_nunca_e_seguido(self):
        # Um 3xx seguido reenviaria o token para outro host.
        self.assertIsNone(sao._SemRedirect().redirect_request(None, None, 302, "Found", {}, "https://outro.host/"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
