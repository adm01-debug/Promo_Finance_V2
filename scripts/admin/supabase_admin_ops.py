#!/usr/bin/env python3
# scripts/admin/supabase_admin_ops.py
# Operações administrativas no projeto Supabase canônico via Management API.
#
# Uso:
#   python3 scripts/admin/supabase_admin_ops.py check   # somente leitura
#   python3 scripts/admin/supabase_admin_ops.py apply   # aplica correções
#
# Env obrigatórias:
#   SUPABASE_ACCESS_TOKEN   (PAT sbp_...)
#   SUPABASE_PROJECT_REF    (ex.: bwwbeyolnnzppeuhgkcd)
#
# O que cobre (check → apply):
#   1. Auth config: mfa_totp_enroll_enabled / mfa_totp_verify_enabled / max factors
#   2. Edge functions: verify_jwt divergente do supabase/config.toml
#   3. Storage: bucket `financeiro` ausente — criação é responsabilidade da
#      migration 20261002093000 (bucket + coluna storage_path + policies);
#      o apply só reporta, nunca cria o bucket isolado.
#   4. Auth users: deleta SÓ a allowlist explícita de contas de teste;
#      demais contas não confirmadas só são listadas (nunca confirmadas
#      nem deletadas automaticamente). Usa a GoTrue Admin API do projeto
#      (`/auth/v1/admin/users`) com SUPABASE_SERVICE_ROLE_KEY — a Management
#      API não tem endpoint de auth.users.
#
# Env opcionais:
#   SUPABASE_SERVICE_ROLE_KEY  (necessária só para a seção de usuários;
#                               sem ela a seção é pulada com aviso)

import json
import os
import re
import sys
import urllib.error
import urllib.request

API = "https://api.supabase.com/v1"
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
REF = os.environ.get("SUPABASE_PROJECT_REF", "")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MODE = sys.argv[1] if len(sys.argv) > 1 else "check"
APPLY = MODE == "apply"

FALHAS = []

# Contas de teste identificadas na auditoria (migration E17 do plano de
# correções). Somente esses e-mails podem ser deletados no apply.
TEST_USER_ALLOWLIST = {
    "e2e-admin@promo-finance.test",
    "teste@lovable.com",
}
BUCKET_REQUIRED = "financeiro"


class _SemRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req_, fp, code, msg, headers, newurl):
        return None


_OPENER = urllib.request.build_opener(_SemRedirect())


def req(method, path, body=None, gotrue=False):
    if gotrue:
        url = f"https://{REF}.supabase.co/auth/v1{path}"
        headers = {
            "apikey": SERVICE_KEY,
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Accept": "application/json",
        }
    else:
        url = f"{API}/projects/{REF}{path}"
        headers = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with _OPENER.open(r, timeout=30) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read()[:400].decode("utf-8", "replace")
        return e.code, {"_error": detail}


def mutate(desc, method, path, body=None, gotrue=False):
    """Operação de escrita: registra falha não-2xx para exit code != 0."""
    code, out = req(method, path, body, gotrue=gotrue)
    ok = 200 <= code < 300
    print(f"{method} {path} → {code}" + (f": {out}" if not ok else ""))
    if not ok:
        FALHAS.append(f"{desc} ({method} {path} → {code})")
    return ok


def want_verify_jwt():
    """verify_jwt esperado por função, lido do supabase/config.toml."""
    out = {}
    fn = None
    with open("supabase/config.toml", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            m = re.match(r"\[functions\.(.+)\]", line)
            if m:
                fn = m.group(1)
            elif line.startswith("["):
                fn = None
            elif fn and line.startswith("verify_jwt"):
                out[fn] = line.split("=", 1)[1].strip() == "true"
    return out


def section(title):
    print(f"\n=== {title} ===")


def main():
    if not TOKEN or not REF:
        sys.exit("SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF são obrigatórios")
    pendencias = []

    # --- 1. Auth config (MFA) ------------------------------------------------
    section("Auth config")
    code, cfg = req("GET", "/config/auth")
    if code == 200:
        mfa = {k: cfg.get(k) for k in sorted(cfg) if "mfa" in k or "captcha" in k}
        print(json.dumps(mfa, indent=2))
        if not cfg.get("mfa_totp_enroll_enabled") or not cfg.get(
            "mfa_totp_verify_enabled"
        ):
            pendencias.append("mfa_totp")
    else:
        print(f"GET /config/auth → {code}: {cfg}")
        FALHAS.append(f"leitura de auth config (→ {code})")

    # --- 2. Edge functions (verify_jwt) --------------------------------------
    section("Edge functions (verify_jwt)")
    want = want_verify_jwt()
    code, fns = req("GET", "/functions")
    divergentes = {}
    if code == 200 and isinstance(fns, list):
        slugs = set()
        for f in fns:
            slug = f.get("slug") or f.get("name")
            if not slug:
                continue
            slugs.add(slug)
            actual = f.get("verify_jwt")
            if actual is None:
                actual = f.get("verify_jwt_enabled")
            if slug in want and actual is not None and bool(actual) != want[slug]:
                divergentes[slug] = {"config.toml": want[slug], "deploy": actual}
        print(f"deployadas: {len(slugs)} | divergentes verify_jwt: {divergentes or 'nenhuma'}")
        faltando = sorted(set(want) - slugs)
        print(f"no repo mas NÃO deployadas ({len(faltando)}): {faltando}")
        if divergentes:
            pendencias.append("verify_jwt")
    else:
        print(f"GET /functions → {code}: {fns}")
        FALHAS.append(f"listagem de functions (→ {code})")

    # --- 3. Storage bucket ----------------------------------------------------
    section("Storage buckets")
    code, buckets = req("GET", "/storage/buckets")
    bucket_missing = True
    if code == 200 and isinstance(buckets, list):
        names = [b.get("name") or b.get("id") for b in buckets]
        print(f"buckets ({len(names)}): {names}")
        bucket_missing = BUCKET_REQUIRED not in names
        if bucket_missing:
            pendencias.append("bucket")
    else:
        print(f"GET /storage/buckets → {code}: {buckets}")
        FALHAS.append(f"listagem de buckets (→ {code})")

    # --- 4. Auth users (GoTrue Admin API, service key) ------------------------
    section("Auth users (teste/não confirmados)")
    deletaveis = []
    nao_confirmados = []
    total_usuarios = 0
    if not SERVICE_KEY:
        print("SUPABASE_SERVICE_ROLE_KEY ausente — seção de usuários pulada.")
    else:
        page = 1
        while page <= 20:
            code, users = req(
                "GET", f"/admin/users?page={page}&per_page=100", gotrue=True
            )
            if code != 200:
                print(f"GET /admin/users → {code}: {users}")
                FALHAS.append(f"listagem de usuários (→ {code})")
                break
            lista = users if isinstance(users, list) else users.get("users", [])
            if not lista:
                break
            total_usuarios += len(lista)
            for u in lista:
                email = (u.get("email") or "").lower()
                conf = bool(u.get("email_confirmed_at") or u.get("confirmed_at"))
                if email in TEST_USER_ALLOWLIST:
                    deletaveis.append({"id": u.get("id"), "email": email})
                elif not conf:
                    nao_confirmados.append({"id": u.get("id"), "email": email})
            if len(lista) < 100:
                break
            page += 1
        print(f"usuários: {total_usuarios}")
        print(f"contas de teste na allowlist (deletáveis): {deletaveis or 'nenhuma'}")
        print(f"não confirmados (só relatados): {nao_confirmados or 'nenhum'}")
        if deletaveis:
            pendencias.append("usuarios")

    # --- Apply ---------------------------------------------------------------
    if not APPLY:
        print(f"\nMODE=check — pendências: {pendencias or 'nenhuma'}")
        if FALHAS:
            print(f"FALHAS de leitura: {FALHAS}")
            sys.exit(1)
        return

    section("APPLY")
    if "mfa_totp" in pendencias:
        mutate(
            "MFA TOTP",
            "PATCH",
            "/config/auth",
            {
                "mfa_totp_enroll_enabled": True,
                "mfa_totp_verify_enabled": True,
            },
        )

    if "verify_jwt" in pendencias:
        for slug, d in divergentes.items():
            mutate(
                f"verify_jwt {slug}",
                "PATCH",
                f"/functions/{slug}",
                {"verify_jwt": d["config.toml"]},
            )

    if "bucket" in pendencias:
        # A migration 20261002093000_storage_financeiro_upload_via_edge.sql
        # cria bucket + coluna storage_path + policies num passo atômico.
        # Criar só o bucket deixaria upload-anexo falhando no insert —
        # aplicar a migration via workflow prod-migrate em vez disso.
        print(
            f"bucket '{BUCKET_REQUIRED}' ausente — aplique a migration "
            "20261002093000 via workflow prod-migrate (sem ação aqui)."
        )

    if "usuarios" in pendencias:
        if os.environ.get("DELETE_TEST_USERS") == "1":
            for u in deletaveis:
                mutate(
                    f"usuário {u['email']}",
                    "DELETE",
                    f"/admin/users/{u['id']}",
                    gotrue=True,
                )
        else:
            # O plano E17 exige mover o E2E para staging antes de apagar a
            # conta — E2E_USER_EMAIL pode ainda autenticar contra PROD e os
            # gates do ci.yml quebrariam. Só deleta com DELETE_TEST_USERS=1.
            print(
                "contas de teste presentes — DELETE_TEST_USERS=1 não definido; "
                "após migrar o E2E para staging, rode apply com "
                "excluir_contas_teste=true."
            )

    if FALHAS:
        print(f"\nFALHAS: {FALHAS}")
        sys.exit(1)


if __name__ == "__main__":
    main()
