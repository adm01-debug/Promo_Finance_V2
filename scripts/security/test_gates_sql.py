#!/usr/bin/env python3
"""Cenários dos gates SQL de scripts/security/ contra um Postgres descartável.

Cada gate é executado exatamente como no CI
(`psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <arquivo>`) contra:
  (a) um schema mínimo SÃO  -> precisa sair 0;
  (b) o mesmo schema com UMA violação injetada -> precisa sair != 0 com a
      mensagem do gate correspondente.

O schema são é derivado dos próprios arquivos (allowlist de
test-privilege-baseline.sql e alvos de test-observability-privileges.sql), então
acompanha as listas sem manutenção paralela.

Banco usado, nesta ordem:
  1. SECURITY_SQL_TEST_DSN — URL de um servidor DESCARTÁVEL com superusuário
     (ex.: postgresql://postgres@127.0.0.1:55436/postgres). Os papéis
     anon/authenticated/service_role são criados nele. Nunca aponte para
     produção.
  2. Cluster efêmero via initdb/pg_ctl (PATH ou /usr/lib/postgresql/*/bin),
     quando o processo não é root.
  3. Sem nenhum dos dois: a suíte inteira é pulada com o motivo.

Rodar: python3 scripts/security/test_gates_sql.py
"""

from __future__ import annotations

import glob
import itertools
import os
import re
import shutil
import socket
import subprocess
import tempfile
import unittest
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]

_contador = itertools.count(1)


def _achar_binario(nome: str) -> str | None:
    direto = shutil.which(nome)
    if direto:
        return direto
    candidatos = sorted(glob.glob(f"/usr/lib/postgresql/*/bin/{nome}"), reverse=True)
    return candidatos[0] if candidatos else None


class _Servidor:
    """Resolve o DSN administrativo; sobe e derruba um cluster efêmero se preciso."""

    def __init__(self) -> None:
        self.dsn: str | None = None
        self.motivo_skip: str | None = None
        self._tmp: tempfile.TemporaryDirectory[str] | None = None
        self._pg_ctl: str | None = None
        self._iniciar()

    def _iniciar(self) -> None:
        if not shutil.which("psql"):
            self.motivo_skip = "psql não encontrado no PATH"
            return
        dsn = os.environ.get("SECURITY_SQL_TEST_DSN", "").strip()
        if dsn:
            self.dsn = dsn
            return
        initdb, pg_ctl = _achar_binario("initdb"), _achar_binario("pg_ctl")
        if not initdb or not pg_ctl:
            self.motivo_skip = "sem SECURITY_SQL_TEST_DSN e sem initdb/pg_ctl para cluster efêmero"
            return
        if hasattr(os, "geteuid") and os.geteuid() == 0:
            self.motivo_skip = "processo é root (Postgres recusa); defina SECURITY_SQL_TEST_DSN"
            return
        self._tmp = tempfile.TemporaryDirectory(prefix="gates-sql-")
        dados = os.path.join(self._tmp.name, "data")
        with socket.socket() as s:
            s.bind(("127.0.0.1", 0))
            porta = s.getsockname()[1]
        try:
            subprocess.run(
                [initdb, "-D", dados, "-A", "trust", "-U", "postgres"],
                check=True, capture_output=True, text=True,
            )
            subprocess.run(
                [pg_ctl, "-D", dados, "-w", "-l", os.path.join(self._tmp.name, "log"),
                 "-o", f"-p {porta} -c listen_addresses=127.0.0.1 -c unix_socket_directories=''",
                 "start"],
                check=True, capture_output=True, text=True,
            )
        except (OSError, subprocess.CalledProcessError) as erro:
            self.motivo_skip = f"cluster efêmero não subiu: {erro}"
            self._tmp.cleanup()
            self._tmp = None
            return
        self._pg_ctl = pg_ctl
        self.dsn = f"postgresql://postgres@127.0.0.1:{porta}/postgres"

    def parar(self) -> None:
        if self._tmp is not None:
            subprocess.run(
                [self._pg_ctl, "-D", os.path.join(self._tmp.name, "data"), "-m", "immediate", "stop"],
                capture_output=True, text=True, check=False,
            )
            self._tmp.cleanup()
            self._tmp = None


SERVIDOR: _Servidor | None = None
TEMPLATE = f"gates_tpl_{os.getpid()}"


def _dsn_para(banco: str, usuario: str | None = None) -> str:
    assert SERVIDOR is not None and SERVIDOR.dsn is not None
    base = SERVIDOR.dsn.rsplit("/", 1)[0]
    if usuario:
        base = re.sub(r"//[^@/]*@", f"//{usuario}@", base)
    return f"{base}/{banco}"


def _psql(dsn: str, *, sql: str | None = None, arquivo: Path | None = None,
          pgoptions: str | None = None) -> subprocess.CompletedProcess[str]:
    cmd = ["psql", dsn, "-X", "-v", "ON_ERROR_STOP=1"] if sql is not None else ["psql", dsn, "-v", "ON_ERROR_STOP=1"]
    if sql is not None:
        cmd += ["-q", "-f", "-"]
    else:
        cmd += ["-f", str(arquivo)]
    env = {**os.environ, "PGCONNECT_TIMEOUT": "10"}
    if pgoptions:
        env["PGOPTIONS"] = pgoptions
    return subprocess.run(cmd, input=sql, capture_output=True, text=True, timeout=120, env=env, check=False)


def _sql_ok(dsn: str, sql: str) -> None:
    proc = _psql(dsn, sql=sql)
    if proc.returncode != 0:
        raise AssertionError(f"SQL de preparação falhou:\n{proc.stderr}\n--- SQL ---\n{sql[:2000]}")


# --------------------------------------------------------------------------- #
# Schema são
# --------------------------------------------------------------------------- #

def _assinaturas(arquivo: str, bloco_regex: str) -> list[tuple[str, str]]:
    """Extrai pares ('public.fn(args)', 'segundo campo') das listas dos .sql."""
    texto = (AQUI / arquivo).read_text(encoding="utf-8")
    return re.findall(bloco_regex, texto)


ALLOWLIST = _assinaturas(
    "test-privilege-baseline.sql",
    r"\(\s*'(public\.[a-z_0-9]+\([^']*\))',\s*'(anon|authenticated)',",
)
ALVOS_SERVICE_ROLE = [
    fn for fn, _ in _assinaturas(
        "test-observability-privileges.sql",
        r"\(\s*'(public\.[a-z_0-9]+\([^']*\))',\s*'(observability|nfe|conciliacao)'\)",
    )
]

# Funções com corpo próprio (predicados de RLS / pré-login); o resto da
# allowlist recebe um corpo genérico com guarda de papel admin.
_ESPECIAIS = {
    "public.has_role(_user_id uuid, _role app_role)",
    "public.empresa_acessivel(_empresa_id uuid)",
    "public.empresa_membro_ativo(_empresa_id uuid)",
    "public.resolve_sso_providers_for_domain(p_domain text)",
}

UID_MEMBRO = "11111111-1111-1111-1111-111111111111"
EMPRESA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"

SQL_PAPEIS = """
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'service_role', 'gate_sem_membership'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', r);
    END IF;
  END LOOP;
END $$;
ALTER ROLE service_role BYPASSRLS;
ALTER ROLE gate_sem_membership LOGIN;
"""


def _sql_schema_sao() -> str:
    partes = ["""
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $f$
  SELECT nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', '')::uuid
$f$;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, gate_sem_membership;

CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');
CREATE TYPE public.nfe_manifestacao_status AS ENUM ('pendente', 'confirmada');

CREATE TABLE public.empresas (id uuid PRIMARY KEY, nome text);
CREATE TABLE public.user_empresas (user_id uuid, empresa_id uuid REFERENCES public.empresas, ativo boolean DEFAULT true);
CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id uuid REFERENCES public.empresas, nome text);
CREATE TABLE public.contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid REFERENCES public.clientes, nome text);
CREATE TABLE public.audit_logs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid, acao text);
CREATE TABLE public.frontend_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now(),
  error_message text, severity text, url text);
CREATE TABLE public.frontend_error_alert_state (assinatura text PRIMARY KEY, silenciado_ate timestamptz);
CREATE TABLE public.cnpja_cache (cnpj text PRIMARY KEY, payload jsonb);
CREATE TABLE public.bling_tokens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), token text);
CREATE TABLE public.logs_baixa_automatica (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id uuid, detalhe text);

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
  SELECT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.role = _role)
$f$;
CREATE FUNCTION public.empresa_acessivel(_empresa_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
  SELECT EXISTS (SELECT 1 FROM public.user_empresas ue
                 WHERE ue.user_id = auth.uid() AND ue.empresa_id = _empresa_id AND ue.ativo)
$f$;
CREATE FUNCTION public.empresa_membro_ativo(_empresa_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
  SELECT public.empresa_acessivel(_empresa_id)
$f$;
CREATE FUNCTION public.resolve_sso_providers_for_domain(p_domain text) RETURNS TABLE(nome text, tipo text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $f$
  SELECT 'idp'::text, 'oidc'::text WHERE p_domain IS NOT NULL
$f$;
CREATE FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) RETURNS integer
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $f$ SELECT 1 $f$;
REVOKE ALL ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_frontend_error_alerts(integer, integer, integer, integer) TO service_role;

CREATE FUNCTION public.frontend_error_logs_sanitize() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  IF NEW.error_message LIKE '[ci-anon-surface-probe]%' THEN RETURN NULL; END IF;
  RETURN NEW;
END $f$;
REVOKE ALL ON FUNCTION public.frontend_error_logs_sanitize() FROM PUBLIC;
CREATE TRIGGER frontend_error_logs_sanitize BEFORE INSERT ON public.frontend_error_logs
  FOR EACH ROW EXECUTE FUNCTION public.frontend_error_logs_sanitize();
"""]

    for assinatura in dict.fromkeys(fn for fn, _ in ALLOWLIST):
        if assinatura in _ESPECIAIS:
            continue
        partes.append(f"""
CREATE FUNCTION {assinatura} RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN 1;
END $f$;""")
    for assinatura in dict.fromkeys(fn for fn, _ in ALLOWLIST):
        tipos = _so_tipos(assinatura)
        partes.append(f"REVOKE ALL ON FUNCTION {tipos} FROM PUBLIC;")
    for assinatura, papel in ALLOWLIST:
        partes.append(f"GRANT EXECUTE ON FUNCTION {_so_tipos(assinatura)} TO {papel};")

    for assinatura in ALVOS_SERVICE_ROLE:
        tipos = _so_tipos(assinatura)
        partes.append(f"""
CREATE FUNCTION {assinatura} RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN
  RETURN 1;
END $f$;
REVOKE ALL ON FUNCTION {tipos} FROM PUBLIC;
GRANT EXECUTE ON FUNCTION {tipos} TO service_role;""")

    partes.append(f"""
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

GRANT SELECT ON public.empresas, public.user_empresas, public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes, public.contatos TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs, public.logs_baixa_automatica TO authenticated;
GRANT INSERT (error_message, severity, url) ON public.frontend_error_logs TO anon, authenticated;

CREATE POLICY empresas_select ON public.empresas FOR SELECT TO authenticated
  USING (public.empresa_acessivel(id));
CREATE POLICY user_empresas_select ON public.user_empresas FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY clientes_tenant ON public.clientes FOR ALL TO authenticated
  USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE POLICY contatos_tenant ON public.contatos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clientes c
                 WHERE c.id = contatos.cliente_id AND public.empresa_acessivel(c.empresa_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clientes c
                      WHERE c.id = contatos.cliente_id AND public.empresa_acessivel(c.empresa_id)));
CREATE POLICY audit_logs_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY audit_logs_select ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY logs_baixa_select ON public.logs_baixa_automatica FOR SELECT TO authenticated
  USING (public.empresa_acessivel(empresa_id));
CREATE POLICY logs_baixa_insert ON public.logs_baixa_automatica FOR INSERT TO authenticated
  WITH CHECK (public.empresa_acessivel(empresa_id));
CREATE POLICY frontend_error_insert ON public.frontend_error_logs FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(error_message) <= 2000);

INSERT INTO public.empresas VALUES ('{EMPRESA}', 'Empresa A');
INSERT INTO public.user_empresas VALUES ('{UID_MEMBRO}', '{EMPRESA}', true);
INSERT INTO public.user_roles VALUES ('{UID_MEMBRO}', 'admin');
INSERT INTO public.clientes (id, empresa_id, nome)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '{EMPRESA}', 'Cliente A');
INSERT INTO public.contatos (cliente_id, nome) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Contato A');
INSERT INTO public.audit_logs (user_id, acao) VALUES ('{UID_MEMBRO}', 'login');
INSERT INTO public.cnpja_cache VALUES ('00000000000191', '{{}}');
INSERT INTO public.bling_tokens (token) VALUES ('t');
INSERT INTO public.logs_baixa_automatica (empresa_id, detalhe) VALUES ('{EMPRESA}', 'baixa');
""")
    return "\n".join(partes)


def _so_tipos(assinatura: str) -> str:
    """'public.f(p_a uuid, p_b timestamp with time zone)' -> 'public.f(uuid, timestamp with time zone)'."""
    nome, args = assinatura[:-1].split("(", 1)
    tipos = [a.strip().split(" ", 1)[1] for a in args.split(",") if a.strip()]
    return f"{nome}({', '.join(tipos)})"


def setUpModule() -> None:
    global SERVIDOR
    SERVIDOR = _Servidor()
    if SERVIDOR.dsn is None:
        return
    admin = _dsn_para("postgres")
    sonda = _psql(admin, sql="SELECT 1;")
    if sonda.returncode != 0:
        SERVIDOR.motivo_skip = f"Postgres inacessível: {sonda.stderr.strip()[:200]}"
        SERVIDOR.dsn = None
        return
    _sql_ok(admin, SQL_PAPEIS)
    _sql_ok(admin, f"DROP DATABASE IF EXISTS {TEMPLATE};")
    _sql_ok(admin, f"CREATE DATABASE {TEMPLATE};")
    _sql_ok(_dsn_para(TEMPLATE), _sql_schema_sao())


def tearDownModule() -> None:
    if SERVIDOR is None:
        return
    if SERVIDOR.dsn is not None:
        _psql(_dsn_para("postgres"), sql=f"DROP DATABASE IF EXISTS {TEMPLATE};")
    SERVIDOR.parar()


class _BaseGate(unittest.TestCase):
    ARQUIVO = ""

    def setUp(self) -> None:
        if SERVIDOR is None or SERVIDOR.dsn is None:
            self.skipTest(SERVIDOR.motivo_skip if SERVIDOR else "servidor não inicializado")

    def rodar(self, violacao: str | None = None, *, usuario: str | None = None,
              arquivo: str | None = None, pgoptions: str | None = None) -> subprocess.CompletedProcess[str]:
        banco = f"gates_c_{os.getpid()}_{next(_contador)}"
        admin = _dsn_para("postgres")
        _sql_ok(admin, f"CREATE DATABASE {banco} TEMPLATE {TEMPLATE};")
        try:
            if violacao:
                _sql_ok(_dsn_para(banco), violacao)
            return _psql(_dsn_para(banco, usuario), arquivo=AQUI / (arquivo or self.ARQUIVO),
                         pgoptions=pgoptions)
        finally:
            _psql(admin, sql=f"DROP DATABASE IF EXISTS {banco} WITH (FORCE);")

    def assert_aprova(self, proc: subprocess.CompletedProcess[str]) -> None:
        self.assertEqual(proc.returncode, 0, f"deveria aprovar:\n{proc.stderr[-1500:]}")

    def assert_reprova(self, proc: subprocess.CompletedProcess[str], trecho: str) -> None:
        self.assertNotEqual(proc.returncode, 0, f"deveria reprovar ({trecho}):\n{proc.stdout[-800:]}")
        self.assertIn(trecho, proc.stderr)


FN_ALVO = "public.monitor_table_bloat()"
FN_ALVO_ARGS = "public.nfe_unlink_conta_pagar(uuid)"


class ObservabilityPrivileges(_BaseGate):
    ARQUIVO = "test-observability-privileges.sql"

    def test_schema_sao_aprova(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        self.assertIn("Todos os privilégios estão conforme esperado", proc.stdout)

    def test_reprova_grant_direto_e_herdado(self) -> None:
        casos = {
            "anon": f"GRANT EXECUTE ON FUNCTION {FN_ALVO} TO anon;",
            "authenticated": f"GRANT EXECUTE ON FUNCTION {FN_ALVO_ARGS} TO authenticated;",
            "PUBLIC": f"GRANT EXECUTE ON FUNCTION {FN_ALVO} TO PUBLIC;",
            "service_role perdeu": f"REVOKE EXECUTE ON FUNCTION {FN_ALVO} FROM service_role;",
            "recriada (ACL default = PUBLIC)":
                f"DROP FUNCTION {FN_ALVO}; CREATE FUNCTION {FN_ALVO} RETURNS integer LANGUAGE sql "
                "SECURITY DEFINER AS $f$ SELECT 1 $f$;",
            "herdado via papel intermediário":
                "CREATE ROLE gate_tmp_grupo NOLOGIN; GRANT gate_tmp_grupo TO anon; "
                f"GRANT EXECUTE ON FUNCTION {FN_ALVO} TO gate_tmp_grupo;",
        }
        try:
            for nome, sql in casos.items():
                with self.subTest(nome):
                    self.assert_reprova(self.rodar(sql), "privilégio(s) divergente(s)")
        finally:
            _psql(_dsn_para("postgres"), sql="DROP ROLE IF EXISTS gate_tmp_grupo;")

    def test_reprova_funcao_alvo_ausente_ou_com_assinatura_alterada(self) -> None:
        casos = {
            "removida": f"DROP FUNCTION {FN_ALVO};",
            "argumento renomeado":
                f"DROP FUNCTION {FN_ALVO_ARGS}; CREATE FUNCTION public.nfe_unlink_conta_pagar(p_id uuid) "
                "RETURNS integer LANGUAGE sql AS $f$ SELECT 1 $f$;",
        }
        for nome, sql in casos.items():
            with self.subTest(nome):
                self.assert_reprova(self.rodar(sql), "função(ões) alvo ausente(s)")


class SecurityDefinerInvocation(_BaseGate):
    ARQUIVO = "test-security-definer-invocation.sql"

    def test_schema_sao_aprova(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        self.assertIn("Todas as invocações se comportaram como esperado", proc.stdout)

    def test_reprova_quando_anon_ou_authenticated_executam(self) -> None:
        for papel in ("anon", "authenticated", "PUBLIC"):
            with self.subTest(papel):
                proc = self.rodar(f"GRANT EXECUTE ON FUNCTION {FN_ALVO} TO {papel};")
                self.assert_reprova(proc, "expectativa(s) violada(s)")

    def test_reprova_quando_service_role_perde_execute(self) -> None:
        proc = self.rodar(f"REVOKE EXECUTE ON FUNCTION {FN_ALVO_ARGS} FROM service_role;")
        self.assert_reprova(proc, "expectativa(s) violada(s)")

    def test_reprova_funcao_que_nao_resolve_oid(self) -> None:
        self.assert_reprova(self.rodar(f"DROP FUNCTION {FN_ALVO};"), "não resolveram OID")

    def test_reprova_42501_emitido_pelo_corpo_com_execute_concedido(self) -> None:
        # Regressão: o corpo levantava 42501 (guarda de papel) e o gate lia isso
        # como "ACL negou", aprovando uma função que anon consegue executar.
        sql = f"""
CREATE OR REPLACE FUNCTION {FN_ALVO} RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$
BEGIN
  IF current_setting('role', true) IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'acesso negado' USING ERRCODE = '42501';
  END IF;
  RETURN 1;
END $f$;
GRANT EXECUTE ON FUNCTION {FN_ALVO} TO anon, authenticated;"""
        self.assert_reprova(self.rodar(sql), "expectativa(s) violada(s)")

    def test_executor_sem_membership_marca_skip_e_nao_falha(self) -> None:
        proc = self.rodar(usuario="gate_sem_membership")
        self.assert_aprova(proc)
        self.assertIn("SKIP", proc.stdout)


class TenantIsolation(_BaseGate):
    ARQUIVO = "test-tenant-isolation.sql"

    def test_schema_sao_aprova_e_executa_cenarios(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        self.assertIn("PASS: nenhuma linha nem erro de policy", proc.stderr)
        self.assertRegex(proc.stderr, r"Cenários executados: [1-9]\d*")

    def test_reprova_vazamento_de_linhas(self) -> None:
        casos = {
            "policy permissiva true":
                "CREATE POLICY vaza ON public.clientes FOR SELECT TO authenticated USING (true);",
            "policy TO public":
                "CREATE POLICY vaza ON public.clientes FOR SELECT TO public USING (empresa_id IS NOT NULL);",
        }
        for nome, sql in casos.items():
            with self.subTest(nome):
                self.assert_reprova(self.rodar(sql), "VAZAMENTO")

    def test_reprova_policy_que_falha_em_runtime(self) -> None:
        sql = "REVOKE EXECUTE ON FUNCTION public.empresa_acessivel(uuid) FROM authenticated;"
        self.assert_reprova(self.rodar(sql), "policy falhou (42501")

    def test_reprova_rpc_administrativa_que_executa_para_usuario_comum(self) -> None:
        sql = """
CREATE OR REPLACE FUNCTION public.get_cron_jobs() RETURNS integer
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $f$ SELECT 1 $f$;"""
        self.assert_reprova(self.rodar(sql), "get_cron_jobs: executou para usuário sem papel admin")

    def test_executor_sem_membership_registra_skip(self) -> None:
        proc = self.rodar(usuario="gate_sem_membership")
        self.assert_aprova(proc)
        self.assertIn("SKIP", proc.stderr)
        self.assertNotIn("PASS", proc.stderr)


class TenantPolicyScope(_BaseGate):
    ARQUIVO = "test-tenant-policy-scope.sql"

    def test_schema_sao_aprova(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        self.assertIn("Gate #25 aprovado", proc.stdout)

    def test_25a_reprova_policy_so_com_papel(self) -> None:
        casos = {
            "vínculo direto": "public.clientes",
            "vínculo por FK": "public.contatos",
        }
        for nome, tabela in casos.items():
            with self.subTest(nome):
                sql = (f"CREATE POLICY so_papel ON {tabela} FOR SELECT TO authenticated "
                       "USING (public.has_role(auth.uid(), 'admin'));")
                self.assert_reprova(self.rodar(sql), "Gate #25a falhou")

    def test_25a_enxerga_vinculo_por_fk_sem_public_no_search_path(self) -> None:
        # Regressão: `conrelid::regclass::text` vinha como "public.contatos" e o
        # vínculo por FK deixava de casar — a policy só-com-papel era aprovada.
        sql = ("CREATE POLICY so_papel ON public.contatos FOR SELECT TO authenticated "
               "USING (public.has_role(auth.uid(), 'admin'));")
        proc = self.rodar(sql, pgoptions="-c search_path=pg_catalog")
        self.assert_reprova(proc, "Gate #25a falhou")

    def test_25a_enxerga_vinculo_por_fk_em_tabela_com_nome_entre_aspas(self) -> None:
        sql = """
CREATE TABLE public."Itens Pedido" (id uuid PRIMARY KEY, cliente_id uuid REFERENCES public.clientes);
ALTER TABLE public."Itens Pedido" ENABLE ROW LEVEL SECURITY;
CREATE POLICY so_papel ON public."Itens Pedido" FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));"""
        self.assert_reprova(self.rodar(sql), "Gate #25a falhou")

    def test_25b_reprova_policy_irrestrita(self) -> None:
        casos = {
            "select true authenticated":
                "CREATE POLICY p ON public.clientes FOR SELECT TO authenticated USING (true);",
            "select true anon":
                "CREATE POLICY p ON public.clientes FOR SELECT TO anon USING (true);",
            "all true TO public":
                "CREATE POLICY p ON public.clientes FOR ALL TO public USING (true);",
            "insert check true":
                "CREATE POLICY p ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);",
            "delete true em tabela por FK":
                "CREATE POLICY p ON public.contatos FOR DELETE TO authenticated USING (true);",
            "true com parênteses e caixa alta":
                "CREATE POLICY p ON public.clientes FOR SELECT TO authenticated USING (((TRUE)));",
        }
        for nome, sql in casos.items():
            with self.subTest(nome):
                self.assert_reprova(self.rodar(sql), "Gate #25b falhou")

    def test_25b_nao_reprova_policy_de_service_role_nem_tabela_isenta(self) -> None:
        casos = {
            "service_role": "CREATE POLICY p ON public.clientes FOR ALL TO service_role USING (true);",
            "tabela isenta": "CREATE POLICY p ON public.user_roles FOR SELECT TO authenticated USING (true);",
        }
        for nome, sql in casos.items():
            with self.subTest(nome):
                self.assert_aprova(self.rodar(sql))

    def test_25c_reprova_quando_funcao_canonica_reporta(self) -> None:
        sql = """
CREATE FUNCTION public.gate_25_policies_sem_tenant()
  RETURNS TABLE(tabela text, policy_name text, cmd text, vinculo text)
  LANGUAGE sql AS $f$ SELECT 'clientes'::text, 'p'::text, 'ALL'::text, 'direto'::text $f$;"""
        self.assert_reprova(self.rodar(sql), "Gate #25c falhou")


class WriteIsolation(_BaseGate):
    ARQUIVO = "test-write-isolation.sql"

    def test_schema_sao_aprova_e_executa_cenarios(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        for parte in ("PASS (A)", "PASS (B)", "PASS (C)"):
            self.assertIn(parte, proc.stderr)
        self.assertRegex(proc.stderr, r"Cenários de escrita executados: [1-9]\d*")

    def test_a_reprova_with_check_que_aceita_orfa(self) -> None:
        sql = """
CREATE POLICY orfana ON public.clientes FOR UPDATE TO authenticated
  USING (empresa_id IS NOT NULL AND public.empresa_acessivel(empresa_id))
  WITH CHECK (empresa_id IS NULL OR public.empresa_acessivel(empresa_id));"""
        self.assert_reprova(self.rodar(sql), "FAIL (A)")

    def test_b_reprova_with_check_trivial(self) -> None:
        for cmd in ("INSERT", "UPDATE", "ALL"):
            with self.subTest(cmd):
                using = "" if cmd == "INSERT" else "USING (public.empresa_acessivel(empresa_id)) "
                sql = (f"CREATE POLICY trivial ON public.clientes FOR {cmd} TO authenticated "
                       f"{using}WITH CHECK (true);")
                self.assert_reprova(self.rodar(sql), "FAIL (B)")

    def test_c_reprova_update_e_delete_cross_tenant(self) -> None:
        casos = {
            # FOR ALL: o UPDATE lê a coluna, então a policy de SELECT também precisa liberar.
            "UPDATE": ("CREATE POLICY aberta ON public.contatos FOR ALL TO authenticated "
                       "USING (nome IS NOT NULL) WITH CHECK (nome IS NOT NULL);",
                       "contatos: UPDATE afetou 1 linha(s)"),
            "DELETE": ("CREATE POLICY aberta ON public.contatos FOR DELETE TO authenticated "
                       "USING (nome IS NOT NULL);",
                       "contatos: DELETE removeu 1 linha(s)"),
        }
        for nome, (sql, trecho) in casos.items():
            with self.subTest(nome):
                self.assert_reprova(self.rodar(sql), trecho)

    def test_c_reprova_delete_que_passou_pela_rls_e_so_a_fk_barrou(self) -> None:
        # Regressão: a FK de contatos -> clientes abortava o DELETE e o gate
        # tratava a violação de FK como "negado", aprovando uma policy aberta.
        sql = ("CREATE POLICY aberta ON public.clientes FOR DELETE TO authenticated "
               "USING (nome IS NOT NULL);")
        self.assert_reprova(self.rodar(sql), "clientes: DELETE passou pela RLS")

    def test_c_reprova_predicado_quebrado(self) -> None:
        # Policy referencia função por OID (rename não quebra): o 42883 vem de um
        # predicado que chama função inexistente em runtime.
        sql = """
CREATE FUNCTION public.pred_quebrado(uuid) RETURNS boolean LANGUAGE plpgsql AS $f$
BEGIN RETURN public.nao_existe($1); END $f$;
CREATE POLICY quebrada ON public.contatos FOR UPDATE TO authenticated
  USING (public.pred_quebrado(id)) WITH CHECK (public.pred_quebrado(id));"""
        self.assert_reprova(self.rodar(sql), "predicado de UPDATE quebrado (42883")

    def test_executor_sem_membership_registra_skip_no_probe(self) -> None:
        proc = self.rodar(usuario="gate_sem_membership")
        self.assert_aprova(proc)
        self.assertIn("SKIP", proc.stderr)
        self.assertNotIn("PASS (C)", proc.stderr)


class PrivilegeBaseline(_BaseGate):
    ARQUIVO = "test-privilege-baseline.sql"

    def test_fixture_cobre_a_allowlist_inteira(self) -> None:
        self.assertGreaterEqual(len(ALLOWLIST), 30)
        self.assertEqual(len(ALVOS_SERVICE_ROLE), 16)

    def test_schema_sao_aprova_todos_os_gates(self) -> None:
        proc = self.rodar()
        self.assert_aprova(proc)
        self.assertGreaterEqual(proc.stderr.count("PASS:"), 22, proc.stderr)

    def test_reprova_cada_violacao(self) -> None:
        definer = ("LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $f$ BEGIN "
                   "IF auth.uid() IS NULL THEN RAISE EXCEPTION 'x'; END IF; RETURN 1; END $f$")
        casos = {
            "1 definer exposta sem allowlist": (
                f"CREATE FUNCTION public.nova_rpc() RETURNS integer {definer};"
                "REVOKE ALL ON FUNCTION public.nova_rpc() FROM PUBLIC;"
                "GRANT EXECUTE ON FUNCTION public.nova_rpc() TO authenticated;",
                "expostas sem allowlist"),
            "1 definer criada com ACL default (PUBLIC)": (
                f"CREATE FUNCTION public.nova_rpc() RETURNS integer {definer};",
                "expostas sem allowlist"),
            "2 allowlist com entrada morta": (
                "DROP FUNCTION public.get_cron_jobs();", "allowlist com entradas obsoletas"),
            "2 allowlist com EXECUTE revogado": (
                "REVOKE EXECUTE ON FUNCTION public.get_cron_jobs() FROM authenticated;",
                "allowlist com entradas obsoletas"),
            "3 tabela sem RLS": (
                "CREATE TABLE public.sem_rls (id int);", "sem RLS habilitado"),
            "3 RLS desabilitado em tabela existente": (
                "ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;", "sem RLS habilitado"),
            "4 cofre com grant": (
                "GRANT SELECT ON public.bling_tokens TO authenticated;", "cofre(s) de credenciais"),
            "5 escrita incondicional para anon": (
                "CREATE TABLE public.aberta (id int); ALTER TABLE public.aberta ENABLE ROW LEVEL SECURITY;"
                "GRANT INSERT ON public.aberta TO anon;"
                "CREATE POLICY aberta ON public.aberta FOR INSERT TO anon WITH CHECK (true);",
                "escrita incondicional exposta a anônimos"),
            "5 escrita incondicional TO public": (
                "CREATE TABLE public.aberta (id int); ALTER TABLE public.aberta ENABLE ROW LEVEL SECURITY;"
                "GRANT INSERT, UPDATE ON public.aberta TO anon;"
                "CREATE POLICY aberta ON public.aberta FOR ALL TO public USING (true);",
                "escrita incondicional exposta a anônimos"),
            "6 view sem security_invoker": (
                "CREATE VIEW public.v_clientes AS SELECT * FROM public.clientes;"
                "GRANT SELECT ON public.v_clientes TO authenticated;",
                "sem security_invoker"),
            "6 view com security_invoker=false": (
                "CREATE VIEW public.v_clientes WITH (security_invoker = false) AS SELECT * FROM public.clientes;"
                "GRANT SELECT ON public.v_clientes TO authenticated;",
                "sem security_invoker"),
            "7 matview exposta": (
                "CREATE MATERIALIZED VIEW public.mv_clientes AS SELECT * FROM public.clientes;"
                "GRANT SELECT ON public.mv_clientes TO authenticated;",
                "materialized view(s) legíveis"),
            "8 audit_logs mutável": (
                "GRANT UPDATE ON public.audit_logs TO authenticated;", "append-only/anon-proof"),
            "8 audit_logs insert sem autoria": (
                "CREATE POLICY sem_autoria ON public.audit_logs FOR INSERT TO authenticated "
                "WITH CHECK (acao IS NOT NULL);",
                "sem amarração de autoria"),
            "10 cliente define created_at": (
                "GRANT INSERT (created_at) ON public.frontend_error_logs TO authenticated;",
                "sequestro de partição"),
            "10 telemetria cega": (
                "REVOKE INSERT (error_message) ON public.frontend_error_logs FROM anon;",
                "telemetria ficaria cega"),
            "11 claim executável por authenticated": (
                "GRANT EXECUTE ON FUNCTION public.claim_frontend_error_alerts(integer,integer,integer,integer) "
                "TO authenticated;",
                "claim_frontend_error_alerts"),
            "12 canário persistido": (
                "DROP TRIGGER frontend_error_logs_sanitize ON public.frontend_error_logs;",
                "canário do probe anônimo foi persistido"),
            "13 anon silencia alerta": (
                "GRANT EXECUTE ON FUNCTION public.silenciar_alerta_erro_frontend(text, integer, text) TO anon;",
                "FAIL"),
            "14 policy TO public": (
                "CREATE POLICY pub ON public.audit_logs FOR SELECT TO public USING (user_id = auth.uid());",
                "políticas com TO public"),
            "15 policy sem predicado de inquilino": (
                "CREATE POLICY solta ON public.clientes FOR SELECT TO authenticated USING (nome IS NOT NULL);",
                "sem predicado de inquilino"),
            "18 with check que orfana": (
                "CREATE POLICY orfana ON public.clientes FOR UPDATE TO authenticated "
                "USING (empresa_id IS NOT NULL AND public.empresa_acessivel(empresa_id)) "
                "WITH CHECK (empresa_id IS NULL OR public.empresa_acessivel(empresa_id));",
                "escapar do inquilino"),
            "19a grant em tabela server-only": (
                "GRANT SELECT ON public.cnpja_cache TO authenticated;", "FAIL"),
            "19b policy em tabela server-only": (
                "CREATE POLICY p ON public.cnpja_cache FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);",
                "policy expõe tabela server-only"),
            "20 definer exposta sem guarda": (
                "CREATE OR REPLACE FUNCTION public.get_cron_jobs() RETURNS integer LANGUAGE sql "
                "SECURITY DEFINER SET search_path = public AS $f$ SELECT 1 $f$;",
                "sem guarda de autorização"),
            "20b definer exposta sem search_path": (
                "ALTER FUNCTION public.get_cron_jobs() RESET search_path;", "sem search_path fixo"),
            "20c sso devolve allowed_domains": (
                "DROP FUNCTION public.resolve_sso_providers_for_domain(text);"
                "CREATE FUNCTION public.resolve_sso_providers_for_domain(p_domain text) "
                "RETURNS TABLE(nome text, allowed_domains text) LANGUAGE sql STABLE SECURITY DEFINER "
                "SET search_path = public AS $f$ SELECT 'a'::text, 'b'::text $f$;"
                "REVOKE ALL ON FUNCTION public.resolve_sso_providers_for_domain(text) FROM PUBLIC;"
                "GRANT EXECUTE ON FUNCTION public.resolve_sso_providers_for_domain(text) TO anon, authenticated;",
                "allowed_domains"),
            "21a anon com SELECT": (
                "GRANT SELECT ON public.empresas TO anon;", "privilégio de anon fora da allowlist"),
            "21a anon com grant por coluna": (
                "GRANT SELECT (nome) ON public.empresas TO anon;", "privilégio de anon fora da allowlist"),
            "21b default privileges reintroduzem anon": (
                "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES TO anon;",
                "DEFAULT PRIVILEGES reintroduzem anon"),
            "22 evidência mutável": (
                "GRANT UPDATE ON public.logs_baixa_automatica TO authenticated;"
                "CREATE POLICY muta ON public.logs_baixa_automatica FOR UPDATE TO authenticated "
                "USING (public.empresa_acessivel(empresa_id)) WITH CHECK (public.empresa_acessivel(empresa_id));",
                "trilha de evidência mutável"),
            "22 evidência apagável sem papel": (
                "GRANT DELETE ON public.logs_baixa_automatica TO authenticated;"
                "CREATE POLICY apaga ON public.logs_baixa_automatica FOR DELETE TO authenticated "
                "USING (public.empresa_acessivel(empresa_id));",
                "trilha de evidência mutável"),
        }
        for nome, (sql, trecho) in casos.items():
            with self.subTest(nome):
                self.assert_reprova(self.rodar(sql), trecho)


if __name__ == "__main__":
    unittest.main()
