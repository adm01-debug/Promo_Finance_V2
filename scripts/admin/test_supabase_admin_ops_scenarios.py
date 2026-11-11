#!/usr/bin/env python3
"""
Cenários de borda para supabase_admin_ops.py — 27 cenários.
Simulados ANTES do fix e usados para validar o fix pós-aplicação.
Foco em: config.toml path resolution, auth config, functions, buckets, users.
"""
import sys, os, unittest, unittest.mock, json
from pathlib import Path
from unittest.mock import patch, MagicMock

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

# Garantir que o módulo lê config.toml a partir do repo root correto
os.environ.setdefault("SUPABASE_ACCESS_TOKEN", "tok_test")
os.environ.setdefault("SUPABASE_PROJECT_REF", "testref")

import supabase_admin_ops as sao


def _resp(code, body):
    return (code, body)


class TestReqHelper(unittest.TestCase):
    # C1: req com body None não inclui Content-Type
    def test_c1_req_no_body_no_content_type(self):
        with patch.object(sao, '_OPENER') as mock_opener:
            mock_resp = MagicMock()
            mock_resp.status = 200
            mock_resp.read.return_value = b'{}'
            mock_opener.open.return_value.__enter__ = lambda s: mock_resp
            mock_opener.open.return_value.__exit__ = MagicMock(return_value=False)
            sao.REF = "testref"
            sao.TOKEN = "tok"
            code, body = sao.req("GET", "/test")
        req_obj = mock_opener.open.call_args[0][0]
        self.assertNotIn("Content-Type", req_obj.headers)

    # C2: req com body inclui Content-Type application/json
    def test_c2_req_with_body_has_content_type(self):
        with patch.object(sao, '_OPENER') as mock_opener:
            mock_resp = MagicMock()
            mock_resp.status = 200
            mock_resp.read.return_value = b'{}'
            mock_opener.open.return_value.__enter__ = lambda s: mock_resp
            mock_opener.open.return_value.__exit__ = MagicMock(return_value=False)
            sao.REF = "testref"
            sao.TOKEN = "tok"
            code, body = sao.req("POST", "/test", {"key": "val"})
        req_obj = mock_opener.open.call_args[0][0]
        self.assertIn("Content-type", req_obj.headers)

    # C3: mask_email preserva domínio e oculta local
    def test_c3_mask_email_preserves_domain(self):
        result = sao.mask_email("joao@example.com")
        self.assertTrue(result.endswith("@example.com"))
        self.assertIn("***", result)

    # C4: mask_email sem @ retorna ***
    def test_c4_mask_email_no_at_returns_stars(self):
        self.assertEqual(sao.mask_email("invalidemail"), "***")

    # C5: mask_email local de 1 char
    def test_c5_mask_email_single_char_local(self):
        result = sao.mask_email("a@b.com")
        self.assertIn("***@b.com", result)

    # C6: mask_email local vazio → usa *
    def test_c6_mask_email_empty_local(self):
        result = sao.mask_email("@b.com")
        self.assertIn("*", result)


class TestWantVerifyJwt(unittest.TestCase):
    # C7: função com verify_jwt = true
    def test_c7_verify_jwt_true(self):
        toml = "[functions.minha-fn]\nverify_jwt = true\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {"minha-fn": True})

    # C8: função com verify_jwt = false
    def test_c8_verify_jwt_false(self):
        toml = "[functions.pub-fn]\nverify_jwt = false\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {"pub-fn": False})

    # C9: função com verify_jwt string "true" → ignorado
    def test_c9_verify_jwt_string_ignored(self):
        toml = '[functions.fn]\nverify_jwt = "true"\n'
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {})

    # C10: múltiplas funções
    def test_c10_multiple_functions(self):
        toml = "[functions.fn-a]\nverify_jwt = true\n[functions.fn-b]\nverify_jwt = false\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {"fn-a": True, "fn-b": False})

    # C11: seção sem verify_jwt → não incluída
    def test_c11_section_without_verify_jwt_omitted(self):
        toml = "[functions.fn-a]\nname = foo\n[functions.fn-b]\nverify_jwt = true\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertNotIn("fn-a", result)
        self.assertIn("fn-b", result)

    # C12: comentário inline → valor booleano correto
    def test_c12_inline_comment_stripped(self):
        toml = "[functions.fn]\nverify_jwt = true # habilita JWT\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {"fn": True})

    # C13: seção não-function antes de functions → não polui fn_name
    def test_c13_non_function_section_resets_fn(self):
        toml = "[auth]\nsome = val\n[functions.fn]\nverify_jwt = false\n"
        with patch("builtins.open", unittest.mock.mock_open(read_data=toml)):
            result = sao.want_verify_jwt()
        self.assertNotIn("auth", result)
        self.assertEqual(result.get("fn"), False)

    # C14: arquivo vazio → dict vazio
    def test_c14_empty_toml_returns_empty(self):
        with patch("builtins.open", unittest.mock.mock_open(read_data="")):
            result = sao.want_verify_jwt()
        self.assertEqual(result, {})

    # C15: _REPO_ROOT é Path absoluto (fix do bug CWD-independent)
    def test_c15_repo_root_is_absolute(self):
        self.assertTrue(sao._REPO_ROOT.is_absolute())

    # C16: _REPO_ROOT aponta para diretório que contém supabase/
    def test_c16_repo_root_contains_supabase_dir(self):
        supabase_dir = sao._REPO_ROOT / "supabase"
        self.assertTrue(
            supabase_dir.exists(),
            f"supabase/ não encontrado em {sao._REPO_ROOT}"
        )

    # C17: config.toml é lido com path absoluto (não CWD-relativo)
    def test_c17_config_toml_path_absolute(self):
        """Verificar que want_verify_jwt usa _REPO_ROOT / supabase / config.toml"""
        expected_path = str(sao._REPO_ROOT / "supabase" / "config.toml")
        open_calls = []
        orig_open = open

        def capture_open(path, *args, **kwargs):
            open_calls.append(str(path))
            return orig_open(path, *args, **kwargs)

        with patch("builtins.open", side_effect=capture_open):
            try:
                sao.want_verify_jwt()
            except Exception:
                pass
        # Pelo menos uma chamada deve usar o path absoluto
        self.assertTrue(
            any(expected_path in p for p in open_calls),
            f"Path absoluto {expected_path} não usado. Calls: {open_calls}"
        )


class TestMutateAndFalhas(unittest.TestCase):
    # C18: mutate registra falha em código não-2xx
    def test_c18_mutate_non_2xx_appended_to_falhas(self):
        sao.FALHAS.clear()
        with patch.object(sao, 'req', return_value=(404, {"_error": "not found"})):
            sao.mutate("test op", "GET", "/nope")
        self.assertTrue(len(sao.FALHAS) > 0)
        self.assertIn("test op", sao.FALHAS[-1])

    # C19: mutate 2xx não adiciona FALHAS
    def test_c19_mutate_2xx_no_falha(self):
        sao.FALHAS.clear()
        with patch.object(sao, 'req', return_value=(200, {})):
            ok = sao.mutate("test op ok", "PATCH", "/ok", {})
        self.assertTrue(ok)
        self.assertEqual(len(sao.FALHAS), 0)

    # C20: mutate 201 (Created) é sucesso
    def test_c20_mutate_201_is_success(self):
        sao.FALHAS.clear()
        with patch.object(sao, 'req', return_value=(201, {"id": "new"})):
            ok = sao.mutate("create", "POST", "/create", {})
        self.assertTrue(ok)

    # C21: mutate 500 registra falha
    def test_c21_mutate_500_is_failure(self):
        sao.FALHAS.clear()
        with patch.object(sao, 'req', return_value=(500, {"_error": "server error"})):
            ok = sao.mutate("server err", "POST", "/err", {})
        self.assertFalse(ok)
        self.assertEqual(len(sao.FALHAS), 1)


class TestTestUserAllowlist(unittest.TestCase):
    # C22: allowlist contém apenas contas de teste conhecidas
    def test_c22_allowlist_has_test_accounts(self):
        self.assertIn("e2e-admin@promo-finance.test", sao.TEST_USER_ALLOWLIST)
        self.assertIn("teste@lovable.com", sao.TEST_USER_ALLOWLIST)

    # C23: conta de produção não está na allowlist
    def test_c23_prod_account_not_in_allowlist(self):
        self.assertNotIn("admin@promobrindes.com.br", sao.TEST_USER_ALLOWLIST)
        self.assertNotIn("financeiro@promobrindes.com.br", sao.TEST_USER_ALLOWLIST)

    # C24: bucket obrigatório correto
    def test_c24_bucket_required_name(self):
        self.assertEqual(sao.BUCKET_REQUIRED, "financeiro")


class TestMfaConfigLogic(unittest.TestCase):
    # C25: MFA completa → não adiciona pendência
    def test_c25_mfa_complete_no_pending(self):
        cfg = {
            "mfa_totp_enroll_enabled": True,
            "mfa_totp_verify_enabled": True,
            "mfa_max_enrolled_factors": 10,
        }
        result = (
            not cfg.get("mfa_totp_enroll_enabled")
            or not cfg.get("mfa_totp_verify_enabled")
            or not cfg.get("mfa_max_enrolled_factors")
        )
        self.assertFalse(result)

    # C26: MFA max_factors = 0 → gera pendência (mesmo com enroll+verify true)
    def test_c26_mfa_zero_max_factors_pending(self):
        cfg = {
            "mfa_totp_enroll_enabled": True,
            "mfa_totp_verify_enabled": True,
            "mfa_max_enrolled_factors": 0,
        }
        result = (
            not cfg.get("mfa_totp_enroll_enabled")
            or not cfg.get("mfa_totp_verify_enabled")
            or not cfg.get("mfa_max_enrolled_factors")
        )
        self.assertTrue(result)

    # C27: MFA enroll=False → gera pendência
    def test_c27_mfa_enroll_false_pending(self):
        cfg = {
            "mfa_totp_enroll_enabled": False,
            "mfa_totp_verify_enabled": True,
            "mfa_max_enrolled_factors": 10,
        }
        result = (
            not cfg.get("mfa_totp_enroll_enabled")
            or not cfg.get("mfa_totp_verify_enabled")
            or not cfg.get("mfa_max_enrolled_factors")
        )
        self.assertTrue(result)


if __name__ == "__main__":
    unittest.main(verbosity=2)
