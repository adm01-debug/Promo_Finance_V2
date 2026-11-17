#!/usr/bin/env python3
"""Cenários dos gates estáticos de scripts/security/ (sem banco, sem rede).

Cada gate roda numa cópia mínima do repositório montada em diretório temporário
(os scripts descobrem a raiz pela própria localização), com a violação que ele
deveria pegar injetada em variações de caixa, espaço, quebra de linha, aspas,
CRLF e caminho com espaço. `psql` e `supabase` são binários falsos no PATH.

Cobre: zod-coverage.sh, test-migration-replay-safety.sh, test-supabase-config.py,
test-functions-deploy.sh e export-function-privileges.sh.

Rodar: python3 scripts/security/test_gates_shell.py
"""

from __future__ import annotations

import os
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]


def _rodar(cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None,
           ) -> subprocess.CompletedProcess[str]:
    ambiente = {k: v for k, v in os.environ.items()
                if k not in {"BASELINE_FILE", "OUT_DIR", "DATABASE_URL", "REQUIRED_SECRETS",
                             "FUNCTIONS_DIR", "STOP_ON_FAIL", "PGCONNECT_TIMEOUT"}}
    ambiente["PYTHONDONTWRITEBYTECODE"] = "1"
    ambiente.update(env or {})
    return subprocess.run(cmd, cwd=cwd, env=ambiente, capture_output=True, text=True, timeout=120, check=False)


class _MiniRepo(unittest.TestCase):
    """Monta <tmp>/scripts/security/<script> + as pastas que o gate lê."""

    SCRIPT = ""

    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory(prefix="gate com espaço ")
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name)
        (self.repo / "scripts" / "security").mkdir(parents=True)
        self.script = self.repo / "scripts" / "security" / self.SCRIPT
        shutil.copy(AQUI / self.SCRIPT, self.script)

    def escrever(self, relativo: str, conteudo: str) -> Path:
        destino = self.repo / relativo
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(conteudo.encode("utf-8"))
        return destino


# --------------------------------------------------------------------------- #
# zod-coverage.sh
# --------------------------------------------------------------------------- #

class ZodCoverage(_MiniRepo):
    SCRIPT = "zod-coverage.sh"

    def funcao(self, nome: str, conteudo: str) -> None:
        self.escrever(f"supabase/functions/{nome}/index.ts", conteudo)

    def gate(self, baseline: str | None = "0", **env: str) -> subprocess.CompletedProcess[str]:
        if baseline is not None:
            self.escrever("scripts/security/zod-coverage.baseline", baseline)
        return _rodar(["bash", str(self.script)], env=env)

    def faltantes(self, proc: subprocess.CompletedProcess[str]) -> list[str]:
        # Ordenado aqui: a ordem do glob do bash depende do locale do ambiente.
        return sorted(linha[4:] for linha in proc.stdout.splitlines() if linha.startswith("  - "))

    def test_funcao_validada_passa_e_sem_validacao_reprova(self) -> None:
        self.funcao("ok", 'const b = await req.json();\nconst r = validatePayload(S, b);\n')
        self.assertEqual(self.gate().returncode, 0)
        self.funcao("nova", "const b = await req.json();\n")
        proc = self.gate()
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertEqual(self.faltantes(proc), ["nova"])
        self.assertIn("Regressão", proc.stdout)

    def test_formas_aceitas_de_validacao(self) -> None:
        corpos = {
            "validate-payload": "validatePayload(S, await req.json());\n",
            "validate-contract": "const b = await req.json();\nvalidateContract(S, b);\n",
            "safe-parse": "const b = await req.json();\nconst p = Schema.safeParse(b);\n",
            "multilinha": "const b = await req.json();\nconst p = Schema\n  .safeParse(\n    b,\n  );\n",
            "crlf": "const b = await req.json();\r\nvalidatePayload(S, b);\r\n",
            "parse-json-body": "const j = await parseJsonBody(req, 'x');\nvalidatePayload(S, j.data);\n",
            "sem-corpo-json": "export default () => new Response('ok');\n",
            "vazio": "",
        }
        for nome, corpo in corpos.items():
            self.funcao(nome, corpo)
        proc = self.gate()
        self.assertEqual(proc.returncode, 0, proc.stdout)
        self.assertEqual(self.faltantes(proc), [])
        self.assertIn(f"Total edge functions: {len(corpos)}", proc.stdout)

    def test_validacao_que_nao_e_chamada_real_nao_conta(self) -> None:
        # Regressões: import sem chamada, menção em comentário e leituras do corpo
        # que escapavam do padrão `req.json()` literal.
        corpos = {
            "so-import": 'import { validatePayload } from "../_shared/validation.ts";\nconst b = await req.json();\n',
            "so-import-contrato": 'import "../_shared/contract-validator.ts";\nconst b = await req.json();\n',
            "comentario-linha": "const b = await req.json();\n  // validatePayload(S, b)\n",
            "comentario-jsdoc": "/**\n * TODO: validatePayload(S, b)\n */\nconst b = await req.json();\n",
            "comentario-bloco": "/* validatePayload(S, b) */\nconst b = await req.json();\n",
            "clone": "const b = await req.clone().json();\n",
            "clone-multilinha": "const b = await req\n  .clone()\n  .json()\n  .catch(() => null);\n",
            "request": "const b = await request.json();\n",
            "parse-json-body-sem-validar": "const j = await parseJsonBody(req, 'x');\nreturn new Response(JSON.stringify(j.data));\n",
            "com espaço": "const b = await req.json();\n",
            "nome_com-hifen_e_underscore": "const b = await req.json();\n",
        }
        for nome, corpo in corpos.items():
            self.funcao(nome, corpo)
        proc = self.gate()
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertEqual(self.faltantes(proc), sorted(corpos))

    def test_shared_e_pasta_sem_index_sao_ignorados(self) -> None:
        self.funcao("_shared", "const b = await req.json();\n")
        self.escrever("supabase/functions/sem-index/handler.ts", "const b = await req.json();\n")
        self.funcao("ok", "export default 1;\n")
        proc = self.gate()
        self.assertEqual(proc.returncode, 0, proc.stdout)
        self.assertIn("Total edge functions: 1", proc.stdout)

    def test_arquivo_grande_validado_nao_vira_falso_vermelho(self) -> None:
        # Regressão: `grep | grep -q` com pipefail morria de SIGPIPE acima de ~64 KB.
        enchimento = "".join(f"const linha_{i} = '{'x' * 60}';\n" for i in range(20000))
        self.funcao("grande", "const b = await req.json();\nvalidatePayload(S, b);\n" + enchimento)
        for _ in range(3):
            proc = self.gate()
            self.assertEqual(proc.returncode, 0, proc.stdout)
            self.assertEqual(self.faltantes(proc), [])

    def test_baseline_tolera_o_que_ja_existia_e_avisa_quando_melhora(self) -> None:
        self.funcao("a", "await req.json();\n")
        self.funcao("b", "await req.json();\n")
        for texto in ("2", "2\n", " 2 \r\n", "\t2\n\n", "002"):
            with self.subTest(baseline=repr(texto)):
                proc = self.gate(texto)
                self.assertEqual(proc.returncode, 0, proc.stdout)
                self.assertIn("Sem regressão (baseline", proc.stdout)
                self.assertNotIn("reduza o baseline", proc.stdout)
        proc = self.gate("5")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("reduza o baseline para 2", proc.stdout)
        self.assertEqual(self.gate("1").returncode, 1)

    def test_baseline_corrompido_sai_2(self) -> None:
        self.funcao("a", "await req.json();\n")
        for texto in ("", "\n", "abc", "-1", "+1", "1.5", "1 2", "0\n3\n", "99999999999999999999999"):
            with self.subTest(baseline=repr(texto)):
                proc = self.gate(texto)
                self.assertEqual(proc.returncode, 2, proc.stdout + proc.stderr)
                self.assertIn("Baseline corrompido", proc.stderr)
                self.assertNotIn("✅", proc.stdout)

    def test_baseline_versionado_ausente_nao_e_recriado(self) -> None:
        # Regressão: apagar o baseline fazia o gate recriá-lo com a contagem atual.
        self.funcao("a", "await req.json();\n")
        proc = self.gate(None)
        self.assertEqual(proc.returncode, 2, proc.stdout)
        self.assertIn("Baseline versionado ausente", proc.stderr)
        self.assertFalse((self.repo / "scripts/security/zod-coverage.baseline").exists())

    def test_baseline_file_explicito_ausente_e_criado(self) -> None:
        self.funcao("a", "await req.json();\n")
        destino = self.repo / "meu baseline"
        proc = self.gate(None, BASELINE_FILE=str(destino))
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(destino.read_text().strip(), "1")
        self.assertEqual(self.gate(None, BASELINE_FILE=str(destino)).returncode, 0)

    def test_sem_nenhuma_funcao_o_gate_nao_aprova_o_vazio(self) -> None:
        for preparo in ("sem pasta", "pasta vazia"):
            with self.subTest(preparo):
                if preparo == "pasta vazia":
                    (self.repo / "supabase" / "functions").mkdir(parents=True, exist_ok=True)
                proc = self.gate()
                self.assertEqual(proc.returncode, 2, proc.stdout)
                self.assertIn("gate não pode ser avaliado", proc.stderr)

    def test_help(self) -> None:
        for flag in ("-h", "--help"):
            proc = _rodar(["bash", str(self.script), flag])
            self.assertEqual(proc.returncode, 0)
            self.assertIn("Uso:", proc.stdout)
            self.assertIn("BASELINE_FILE", proc.stdout)

    def test_repositorio_real_dentro_do_baseline(self) -> None:
        proc = _rodar(["bash", str(AQUI / "zod-coverage.sh")], cwd=Path("/"))
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("✅ Sem regressão", proc.stdout)


# --------------------------------------------------------------------------- #
# test-migration-replay-safety.sh
# --------------------------------------------------------------------------- #

# Todo arquivo que o gate referencia precisa estar aqui: test_arquivo_critico_
# ausente_nao_vira_ok exige que a ausencia de qualquer um aborte com codigo 2, e
# um grep sobre arquivo inexistente derruba o script inteiro. Faltavam cinco, e
# por isso a classe toda reprovava antes desta correcao.
CRITICAS = {
    "inicial": "001_create_tables.sql",
    "exec_sql": "20260826010000_restaurar_exec_sql_wrapper_e03.sql",
    "ledger": "20260826030000_add_colunas_ausentes_e30.sql",
    "ledger2": "20260826040000_fechar_policies_abertas_e06_e08.sql",
    "ledger3": "20260826050000_revoke_execute_authenticated_e09.sql",
    "historica": "20251214170739_b7e0e8b0-39a4-42c5-844e-0a57a5e3916d.sql",
    "perf1": "20251231000001_performance_indexes.sql",
    "perf2": "20251231000100_add_performance_indexes.sql",
    "droppol1": "20260314213748_9f7b6de3-00ed-4be1-a331-21da0a4ce4d2.sql",
    "droppol2": "20260314213926_4aa99b17-ffa7-44c9-a6c4-3b1c6d00ffae.sql",
    "plano_contas": "20260317000749_a5a47522-0909-46d5-bc2e-1ee69a61a744.sql",
    "reconciliar_v3": "20260825110000_reconciliar_schema_v3_completo.sql",
    "recreate6": "20260825250000_recreate_6_constraints.sql",
    "rpcs_escopo": "20260902170000_fix_rpcs_security_definer_sem_escopo.sql",
}

# Conteudo que o gate exige PRESENTE (check_present), um fragmento por padrao.
# Fragmentado de proposito: test_reprova_cada_padrao_obrigatorio_ausente remove
# um fragmento por vez e exige que o gate reprove. Sem isso a guarda nao estaria
# provada -- e um check_present que nao reprova e exatamente o defeito que esta
# PR corrigiu no proprio script.
OBRIGATORIO_FRAGMENTOS = {
    CRITICAS["plano_contas"]: [
        "CREATE TABLE IF NOT EXISTS public.plano_contas (id uuid PRIMARY KEY);\n",
    ],
    CRITICAS["recreate6"]: [
        "DROP FUNCTION IF EXISTS"
        " public.faixa_simples_reparticao_valida(jsonb);\n",
        "ALTER TABLE public.protocolos_st_ncms\n"
        "  DROP CONSTRAINT IF EXISTS protocolos_st_ncms_mva_range_chk;\n",
        "ALTER TABLE public.elisao_regras_creditos\n"
        "  DROP CONSTRAINT IF EXISTS elisao_regras_creditos_aliquota_check;\n",
    ],
    CRITICAS["reconciliar_v3"]: [
        "ALTER TABLE public.cron_job_logs\n"
        "    ADD COLUMN IF NOT EXISTS success boolean;\n",
        "ALTER TABLE public.cron_job_logs\n"
        "    ADD COLUMN IF NOT EXISTS created_at timestamp with time zone"
        " NOT NULL DEFAULT now();\n",
        "ALTER TABLE public.elisao_regras_creditos\n"
        "    ADD COLUMN IF NOT EXISTS aliquota numeric;\n",
    ],
    CRITICAS["rpcs_escopo"]: [
        "DROP FUNCTION IF EXISTS"
        " public.confirmar_conciliacao(uuid, uuid, uuid, numeric);\n",
    ],
    CRITICAS["ledger3"]: [
        "DO $g$ BEGIN\n"
        "  IF to_regprocedure('public.watch_cron_failures()') IS NOT NULL THEN\n"
        "    NULL;\n"
        "  END IF;\n"
        "END $g$;\n",
    ],
}

OBRIGATORIO = {k: "".join(v) for k, v in OBRIGATORIO_FRAGMENTOS.items()}


class MigrationReplaySafety(_MiniRepo):
    SCRIPT = "test-migration-replay-safety.sh"

    def gate(self, arquivos: dict[str, str] | None = None, ausentes: tuple[str, ...] = (),
             crus: tuple[str, ...] = (),
             ) -> subprocess.CompletedProcess[str]:
        pasta = self.repo / "supabase" / "migrations"
        shutil.rmtree(pasta, ignore_errors=True)
        for nome in CRITICAS.values():
            if nome not in ausentes:
                self.escrever(
                    f"supabase/migrations/{nome}",
                    OBRIGATORIO.get(nome, "SELECT 1;\n"),
                )
        # O conteudo obrigatorio e preservado ao sobrescrever: assim um caso
        # negativo testa exatamente a violacao que ele injeta, e nao reprova de
        # carona por ter apagado um padrao obrigatorio do arquivo.
        for nome, conteudo in (arquivos or {}).items():
            base = "" if nome in crus else OBRIGATORIO.get(nome, "")
            self.escrever(f"supabase/migrations/{nome}", base + conteudo)
        return _rodar(["bash", str(self.script)], cwd=Path("/"))

    def test_migrations_limpas_aprovam(self) -> None:
        proc = self.gate()
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertTrue(proc.stdout.strip().splitlines()[-1].startswith("OK:"))

    def test_reprova_cada_ddl_proibido_em_variacoes(self) -> None:
        c = CRITICAS
        trg = "BEFORE UPDATE ON c FOR EACH ROW EXECUTE FUNCTION f();\n"
        casos = {
            "alter database": {c["inicial"]: 'ALTER DATABASE postgres SET "app.jwt_secret" TO \'x\';\n'},
            "alter database aspas": {c["inicial"]: 'ALTER DATABASE "postgres" SET "app.jwt_secret" = \'x\';\n'},
            "alter database minúsculo": {c["inicial"]: 'alter database postgres set "app.jwt_secret" to \'x\';\n'},
            "alter database sem aspas": {c["inicial"]: "ALTER DATABASE postgres SET app.jwt_secret TO 'x';\n"},
            "alter database tab/2 espaços": {c["inicial"]: 'ALTER\tDATABASE  postgres SET "app.jwt_secret" TO 1;\n'},
            "alter database quebrado em linhas": {c["inicial"]: 'ALTER DATABASE postgres\n  SET "app.jwt_secret" TO 1;\n'},
            "alter database indentado": {c["inicial"]: 'SELECT 1;\n    ALTER DATABASE postgres SET "app.jwt_secret" TO 1;\n'},
            "function auth": {c["ledger"]: "CREATE FUNCTION auth.foo() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "function auth minúsculo": {c["ledger"]: "create or replace function auth.foo() returns int language sql as $f$ select 1 $f$;\n"},
            "function auth entre aspas": {c["ledger"]: 'CREATE FUNCTION "auth".foo() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n'},
            "function auth quebrada em linhas": {c["ledger"]: "CREATE OR REPLACE FUNCTION\n  auth.foo() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "function auth crlf": {c["ledger"]: "CREATE FUNCTION auth.foo() RETURNS int\r\nLANGUAGE sql AS $f$ select 1 $f$;\r\n"},
            "procedure auth": {c["ledger"]: "CREATE PROCEDURE auth.foo() LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "function auth em migration nova": {"20270101000000_nova.sql": "CREATE FUNCTION auth.foo() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "function auth em arquivo com espaço": {"20270101000000 com espaço.sql": "CREATE FUNCTION auth.foo() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "delimitador AS $$": {c["exec_sql"]: "CREATE FUNCTION x() RETURNS int LANGUAGE sql AS $$ select 1 $$;\n"},
            "delimitador as $$ minúsculo": {c["exec_sql"]: "CREATE FUNCTION x() RETURNS int LANGUAGE sql as $$ select 1 $$;\n"},
            "delimitador AS  $$ com 2 espaços": {c["exec_sql"]: "CREATE FUNCTION x() RETURNS int LANGUAGE sql AS  $$ select 1 $$;\n"},
            "delimitador AS\\n$$": {c["exec_sql"]: "CREATE FUNCTION x() RETURNS int LANGUAGE sql AS\n$$ select 1 $$;\n"},
            "ledger insert": {c["ledger"]: "INSERT INTO supabase_migrations.schema_migrations(version) VALUES (1);\n"},
            "ledger insert minúsculo": {c["ledger2"]: "insert into supabase_migrations.schema_migrations(version) values (1);\n"},
            "ledger insert entre aspas": {c["ledger3"]: 'INSERT INTO "supabase_migrations"."schema_migrations"(version) VALUES (1);\n'},
            "ledger insert quebrado em linhas": {c["ledger"]: "INSERT INTO\n  supabase_migrations.schema_migrations(version) VALUES (1);\n"},
            "ledger update": {c["ledger"]: "UPDATE supabase_migrations.schema_migrations SET version = 1;\n"},
            "ledger delete": {c["ledger"]: "DELETE FROM supabase_migrations.schema_migrations;\n"},
            "trigger updated_at": {c["historica"]: f"CREATE TRIGGER update_clientes_updated_at {trg}"},
            "trigger updated_at minúsculo": {c["historica"]: f"create trigger update_contas_pagar_updated_at {trg}"},
            "trigger updated_at entre aspas": {c["historica"]: f'CREATE TRIGGER "update_fornecedores_updated_at" {trg}'},
            "trigger updated_at quebrado em linhas": {c["historica"]: f"CREATE TRIGGER\n  update_contas_receber_updated_at {trg}"},
            "trigger auth": {c["historica"]: "CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION f();\n"},
        }
        for nome, arquivos in casos.items():
            with self.subTest(nome):
                proc = self.gate(arquivos)
                self.assertEqual(proc.returncode, 1, f"{proc.stdout}\n{proc.stderr}")
                self.assertIn("replay safety violado", proc.stderr)
                self.assertNotIn("OK:", proc.stdout)

    def test_nao_reprova_o_que_e_permitido(self) -> None:
        c = CRITICAS
        casos = {
            "comentário --": {c["inicial"]: '-- ALTER DATABASE postgres SET "app.jwt_secret" TO 1;\n'},
            "alter database fora do arquivo vigiado": {c["ledger"]: 'ALTER DATABASE postgres SET "app.jwt_secret" TO 1;\n'},
            "função public.auth_x": {c["ledger"]: "CREATE FUNCTION public.auth_x() RETURNS int LANGUAGE sql AS $f$ select 1 $f$;\n"},
            "função comentada": {c["ledger"]: "-- CREATE FUNCTION auth.foo()\n"},
            "DO $$ no wrapper": {c["exec_sql"]: "DO $$ BEGIN NULL; END $$;\n"},
            "AS $function$": {c["exec_sql"]: "CREATE FUNCTION x() RETURNS int LANGUAGE sql AS $function$ select 1 $function$;\n"},
            "ALIAS $$ não é AS $$": {c["exec_sql"]: "SELECT 1 /* alias $$ */;\n"},
            "trigger idempotente": {c["historica"]: "CREATE OR REPLACE TRIGGER update_clientes_updated_at BEFORE UPDATE ON c FOR EACH ROW EXECUTE FUNCTION f();\n"},
            "trigger via EXECUTE guardado": {c["historica"]: "    EXECUTE 'CREATE TRIGGER on_auth_user_created '\n"},
            "outro trigger": {c["historica"]: "CREATE TRIGGER update_outros_updated_at BEFORE UPDATE ON c FOR EACH ROW EXECUTE FUNCTION f();\n"},
            "select no ledger": {c["ledger"]: "SELECT 1 FROM supabase_migrations.schema_migrations;\n"},
        }
        for nome, arquivos in casos.items():
            with self.subTest(nome):
                proc = self.gate(arquivos)
                self.assertEqual(proc.returncode, 0, f"{proc.stdout}\n{proc.stderr}")

    def test_reprova_cada_padrao_obrigatorio_ausente(self) -> None:
        # Arquivo PRESENTE mas sem um dos padroes exigidos tem de reprovar com
        # codigo 1 (violacao), nao 0 nem 2. Um subteste por padrao.
        for nome, frags in OBRIGATORIO_FRAGMENTOS.items():
            for i in range(len(frags)):
                restante = "".join(f for j, f in enumerate(frags) if j != i)
                with self.subTest(f"{nome}#{i}"):
                    proc = self.gate(
                        {nome: restante or "SELECT 1;\n"}, crus=(nome,)
                    )
                    self.assertEqual(
                        proc.returncode, 1, f"{proc.stdout}\n{proc.stderr}"
                    )
                    self.assertIn("Padrão obrigatório ausente", proc.stderr)
                    self.assertNotIn("OK:", proc.stdout)

    def test_arquivo_critico_ausente_nao_vira_ok(self) -> None:
        for nome in CRITICAS.values():
            with self.subTest(nome):
                proc = self.gate(ausentes=(nome,))
                self.assertNotIn(proc.returncode, (0, 1), proc.stdout)
                self.assertIn("não foi possível verificar", proc.stderr)
                self.assertNotIn("OK:", proc.stdout)

    def test_help(self) -> None:
        proc = _rodar(["bash", str(self.script), "--help"])
        self.assertEqual(proc.returncode, 0)
        self.assertIn("Uso:", proc.stdout)

    def test_repositorio_real_aprova(self) -> None:
        proc = _rodar(["bash", str(AQUI / "test-migration-replay-safety.sh")], cwd=Path("/"))
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertTrue(proc.stdout.strip().splitlines()[-1].startswith("OK:"))


# --------------------------------------------------------------------------- #
# test-supabase-config.py
# --------------------------------------------------------------------------- #

CONFIG_SAO = """project_id = "x"

[functions.ci-security-gate-log]
verify_jwt = false

[functions.n8n-callback]
verify_jwt = false

[functions.notify-performance-alert]
verify_jwt = false

[functions.protegida]
verify_jwt = true
"""


class SupabaseConfig(_MiniRepo):
    SCRIPT = "test-supabase-config.py"

    def gate(self, config: str | None) -> subprocess.CompletedProcess[str]:
        if config is not None:
            self.escrever("supabase/config.toml", config)
        return _rodar([sys.executable, str(self.script)], cwd=Path("/"))

    def test_config_sao_aprova(self) -> None:
        proc = self.gate(CONFIG_SAO)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("OK: config.toml válido", proc.stdout)
        self.assertEqual(proc.stderr, "")

    def test_toml_invalido_ou_ausente_reprova(self) -> None:
        casos = {
            "ausente": None,
            "malformado": "[functions.n8n-callback\nverify_jwt = false\n",
            "tabela duplicada": CONFIG_SAO + "\n[functions.protegida]\nverify_jwt = false\n",
            "chave duplicada": CONFIG_SAO.replace("verify_jwt = true", "verify_jwt = true\nverify_jwt = false"),
            "valor sem aspas": CONFIG_SAO.replace("verify_jwt = true", "verify_jwt = sim"),
            "booleano em maiúscula": CONFIG_SAO.replace("verify_jwt = true", "verify_jwt = True"),
            "vazio": "",
        }
        for nome, config in casos.items():
            with self.subTest(nome):
                proc = self.gate(config)
                self.assertEqual(proc.returncode, 1, proc.stdout)
                self.assertNotIn("OK:", proc.stdout)
                self.assertNotIn("Traceback", proc.stderr)

    def test_contrato_de_autenticacao_interna(self) -> None:
        casos = {
            "verify_jwt true": CONFIG_SAO.replace(
                "[functions.n8n-callback]\nverify_jwt = false", "[functions.n8n-callback]\nverify_jwt = true"),
            "bloco ausente": CONFIG_SAO.replace("[functions.n8n-callback]\nverify_jwt = false\n", ""),
            "verify_jwt ausente no bloco": CONFIG_SAO.replace(
                "[functions.n8n-callback]\nverify_jwt = false", "[functions.n8n-callback]\nimport_map = \"x\""),
            "string em vez de booleano": CONFIG_SAO.replace(
                "[functions.n8n-callback]\nverify_jwt = false", '[functions.n8n-callback]\nverify_jwt = "false"'),
            "zero em vez de booleano": CONFIG_SAO.replace(
                "[functions.n8n-callback]\nverify_jwt = false", "[functions.n8n-callback]\nverify_jwt = 0"),
        }
        for nome, config in casos.items():
            with self.subTest(nome):
                proc = self.gate(config)
                self.assertEqual(proc.returncode, 1, proc.stdout)
                self.assertIn("functions.n8n-callback.verify_jwt deve ser false", proc.stderr)

    def test_verify_jwt_nao_booleano_em_qualquer_funcao_reprova(self) -> None:
        casos = {
            "string": 'verify_jwt = "true"',
            "inteiro": "verify_jwt = 1",
            "ausente": 'import_map = "./deno.json"',
        }
        for nome, linha in casos.items():
            with self.subTest(nome):
                proc = self.gate(CONFIG_SAO.replace("[functions.protegida]\nverify_jwt = true",
                                                    f"[functions.protegida]\n{linha}"))
                self.assertEqual(proc.returncode, 1, proc.stdout)
                self.assertIn("functions.protegida.verify_jwt deve ser booleano", proc.stderr)

    def test_estrutura_inesperada_reprova_sem_traceback(self) -> None:
        casos = {
            "functions escalar": 'functions = "x"\n',
            "bloco escalar": "[functions]\nn8n-callback = 1\n",
        }
        for nome, config in casos.items():
            with self.subTest(nome):
                proc = self.gate(config)
                self.assertEqual(proc.returncode, 1, proc.stdout)
                self.assertNotIn("Traceback", proc.stderr)

    def test_funcao_em_disco_sem_bloco_avisa_sem_bloquear(self) -> None:
        self.escrever("supabase/functions/orfa/index.ts", "export default 1;\n")
        self.escrever("supabase/functions/protegida/index.ts", "export default 1;\n")
        self.escrever("supabase/functions/_shared/index.ts", "export default 1;\n")
        proc = self.gate(CONFIG_SAO)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertIn("Aviso: 1 função(ões) em disco sem bloco", proc.stderr)
        self.assertIn("orfa", proc.stderr)
        self.assertNotIn("_shared", proc.stderr)

    def test_repositorio_real_aprova(self) -> None:
        proc = _rodar([sys.executable, str(AQUI / "test-supabase-config.py")], cwd=Path("/"))
        self.assertEqual(proc.returncode, 0, proc.stderr)


# --------------------------------------------------------------------------- #
# test-functions-deploy.sh
# --------------------------------------------------------------------------- #

@unittest.skipUnless(shutil.which("jq"), "scripts/migrate-functions.sh exige jq")
class FunctionsDeploy(_MiniRepo):
    SCRIPT = "test-functions-deploy.sh"

    def setUp(self) -> None:
        super().setUp()
        shutil.copy(RAIZ / "scripts" / "migrate-functions.sh", self.repo / "scripts" / "migrate-functions.sh")
        self.config = (RAIZ / "supabase" / "config.toml").read_text(encoding="utf-8")
        self.escrever("supabase/config.toml", self.config)
        for funcao in ("detectar-anomalias-financeiras", "compare-schemas"):
            self.escrever(f"supabase/functions/{funcao}/index.ts", "export default 1;\n")

    def gate(self, **env: str) -> subprocess.CompletedProcess[str]:
        return _rodar(["bash", str(self.script)], cwd=Path("/"), env=env)

    def trocar_bloco(self, funcao: str, de: str, para: str) -> None:
        antes = f"[functions.{funcao}]\nverify_jwt = {de}"
        self.assertIn(antes, self.config)
        self.escrever("supabase/config.toml", self.config.replace(antes, f"[functions.{funcao}]\nverify_jwt = {para}"))

    def test_contrato_atual_aprova(self) -> None:
        proc = self.gate()
        self.assertEqual(proc.returncode, 0, proc.stderr[-600:])
        self.assertIn("OK: argumentos de deploy preservam o contrato JWT", proc.stdout)

    def test_ambiente_do_job_de_deploy_nao_vaza_para_o_teste(self) -> None:
        # Regressão: functions-deploy.yml exporta REQUIRED_SECRETS no job; herdado,
        # o teste chamava `supabase secrets list` no mock e abortava com exit 5.
        proc = self.gate(REQUIRED_SECRETS="RESEND_API_KEY,LOVABLE_API_KEY", FUNCTIONS_DIR="/nao/existe",
                         STOP_ON_FAIL="1")
        self.assertEqual(proc.returncode, 0, proc.stderr[-600:])

    def test_reprova_se_funcao_protegida_perde_o_jwt(self) -> None:
        self.trocar_bloco("detectar-anomalias-financeiras", "true", "false")
        proc = self.gate()
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn("função protegida recebeu argumentos inesperados", proc.stderr)

    def test_reprova_se_funcao_com_auth_em_codigo_passa_a_exigir_jwt(self) -> None:
        self.trocar_bloco("compare-schemas", "false", "true")
        proc = self.gate()
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn("função com autenticação em código recebeu argumentos inesperados", proc.stderr)

    def test_reprova_se_o_script_de_deploy_nao_chama_a_cli(self) -> None:
        self.escrever("scripts/migrate-functions.sh", "#!/usr/bin/env bash\nexit 0\n")
        proc = self.gate()
        self.assertEqual(proc.returncode, 1, proc.stdout)
        self.assertIn("terminou sem chamar a CLI supabase", proc.stderr)

    def test_reprova_se_o_script_de_deploy_falha(self) -> None:
        self.trocar_bloco("compare-schemas", "false", '"talvez"')
        proc = self.gate()
        self.assertNotEqual(proc.returncode, 0)
        self.assertNotIn("OK:", proc.stdout)

    def test_nao_deixa_diretorio_temporario(self) -> None:
        tmp = self.repo / "tmp"
        tmp.mkdir()
        self.assertEqual(self.gate(TMPDIR=str(tmp)).returncode, 0)
        self.assertEqual(list(tmp.iterdir()), [])


# --------------------------------------------------------------------------- #
# export-function-privileges.sh
# --------------------------------------------------------------------------- #

PSQL_FALSO = """#!/usr/bin/env bash
# psql falso: registra argv/ambiente e falha na N-ésima chamada (PSQL_FALHAR_NA).
n=$(( $(cat "$PSQL_LOG.n" 2>/dev/null || echo 0) + 1 ))
echo "$n" > "$PSQL_LOG.n"
{ printf 'chamada %s timeout=%s args=' "$n" "${PGCONNECT_TIMEOUT:-}"; printf '[%s]' "$@"; echo; } >> "$PSQL_LOG"
if [ "${PSQL_FALHAR_NA:-0}" = "$n" ]; then
  echo "parcial"
  echo "ERROR:  export FAILED" >&2
  exit 3
fi
echo "saida-$n"
"""


class ExportFunctionPrivileges(_MiniRepo):
    SCRIPT = "export-function-privileges.sh"

    def setUp(self) -> None:
        super().setUp()
        binarios = self.repo / "bin"
        binarios.mkdir()
        psql = binarios / "psql"
        psql.write_text(PSQL_FALSO, encoding="utf-8")
        psql.chmod(psql.stat().st_mode | stat.S_IXUSR)
        self.log = self.repo / "psql.log"
        self.saida = self.repo / "saída com espaço"

    def gate(self, *args: str, **env: str) -> subprocess.CompletedProcess[str]:
        ambiente = {"PATH": f"{self.repo / 'bin'}{os.pathsep}{os.environ['PATH']}",
                    "PSQL_LOG": str(self.log), "OUT_DIR": str(self.saida), **env}
        return _rodar(["bash", str(self.script), *args], cwd=self.repo, env=ambiente)

    def test_gera_csv_e_json_e_resumo(self) -> None:
        proc = self.gate(DATABASE_URL="postgresql://u@h/db")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual((self.saida / "function-privileges.csv").read_text().strip(), "saida-1")
        self.assertEqual((self.saida / "function-privileges.json").read_text().strip(), "saida-2")
        self.assertIn("saida-3", proc.stdout)
        self.assertEqual(sorted(p.name for p in self.saida.iterdir()),
                         ["function-privileges.csv", "function-privileges.json"])
        # O SQL passado em -c tem várias linhas; só a primeira de cada chamada interessa.
        chamadas = [linha for linha in self.log.read_text().splitlines() if linha.startswith("chamada ")]
        self.assertEqual(len(chamadas), 3)
        for linha in chamadas:
            self.assertIn("[-v][ON_ERROR_STOP=1][-X][-q][postgresql://u@h/db]", linha)
            self.assertIn("timeout=15", linha)

    def test_sem_database_url_usa_pg_do_ambiente(self) -> None:
        proc = self.gate(PGCONNECT_TIMEOUT="3")
        self.assertEqual(proc.returncode, 0, proc.stderr)
        primeira = self.log.read_text().splitlines()[0]
        self.assertIn("[-v][ON_ERROR_STOP=1][-X][-q][-c]", primeira)
        self.assertIn("timeout=3", primeira)

    def test_falha_do_psql_propaga_e_nao_publica_arquivo_parcial(self) -> None:
        # Regressão: o redirecionamento criava o CSV vazio/parcial antes de o psql
        # falhar, e o upload do CI (always()) publicava esse arquivo.
        esperado = {1: [], 2: ["function-privileges.csv"],
                    3: ["function-privileges.csv", "function-privileges.json"]}
        for chamada, arquivos in esperado.items():
            with self.subTest(falha_na_chamada=chamada):
                shutil.rmtree(self.saida, ignore_errors=True)
                self.log.unlink(missing_ok=True)
                Path(f"{self.log}.n").unlink(missing_ok=True)
                proc = self.gate(PSQL_FALHAR_NA=str(chamada))
                self.assertEqual(proc.returncode, 3, proc.stdout)
                self.assertNotIn("Arquivos gerados", proc.stdout)
                self.assertEqual(sorted(p.name for p in self.saida.iterdir()), arquivos)

    def test_psql_ausente_falha(self) -> None:
        vazio = self.repo / "vazio"
        vazio.mkdir()
        bash = shutil.which("bash")
        proc = _rodar([bash, str(self.script)], cwd=self.repo,
                      env={"PATH": f"{vazio}{os.pathsep}/usr/bin{os.pathsep}/bin", "OUT_DIR": str(self.saida)}
                      ) if not shutil.which("psql", path="/usr/bin:/bin") else None
        if proc is None:
            self.skipTest("psql real em /usr/bin impede simular a ausência")
        self.assertNotEqual(proc.returncode, 0)

    def test_help_nao_toca_em_nada(self) -> None:
        proc = self.gate("--help")
        self.assertEqual(proc.returncode, 0)
        self.assertIn("Uso:", proc.stdout)
        self.assertFalse(self.saida.exists())
        self.assertFalse(self.log.exists())


if __name__ == "__main__":
    unittest.main()
