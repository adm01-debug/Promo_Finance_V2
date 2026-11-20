#!/usr/bin/env python3
"""
Cenários dos scripts shell de scripts/ci — sem banco, sem rede, sem Deno e sem tsc reais.

  require-env.sh               roda direto, só com variáveis de ambiente
  check-baseline-drift.sh      cópia em árvore temporária + `psql` falso no PATH
  deno-check-functions.sh      cópia em árvore temporária + `deno` falso no PATH
  typecheck-strict-baseline.sh cópia em árvore temporária + `tsc` falso em node_modules

Os três últimos derivam caminhos do próprio local (`dirname "$0"`), então a cópia
é o que permite controlar baseline, lista de funções e saída do compilador.

Uso: python3 scripts/ci/test_scripts_shell.py
"""
import json
import os
import shutil
import stat
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CI = REPO_ROOT / "scripts" / "ci"
MARCA = "S3GR3D0-QUE-NAO-PODE-APARECER"


def executavel(caminho: Path, conteudo: str) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(conteudo, encoding="utf-8")
    caminho.chmod(caminho.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def rodar(args, env=None, cwd=None):
    # stdin fechado: script que tentar ler do terminal recebe EOF em vez de pendurar o teste.
    return subprocess.run(
        args, capture_output=True, text=True, env=env, cwd=cwd, timeout=60, check=False, stdin=subprocess.DEVNULL
    )


def ambiente(**extra):
    """Ambiente mínimo e determinístico: nada do shell de quem roda o teste vaza para dentro."""
    env = {"PATH": os.environ["PATH"], "HOME": os.environ.get("HOME", "/tmp"), "LC_ALL": "C.UTF-8"}
    env.update(extra)
    return env


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="ci-shell-"))
        self.addCleanup(shutil.rmtree, self.tmp, True)


# --------------------------------------------------------------------------- require-env.sh
class RequireEnv(Base):
    SCRIPT = str(CI / "require-env.sh")

    def run_script(self, *args, **env):
        return rodar(["bash", self.SCRIPT, *args], env=ambiente(**env))

    def test_sintaxe(self):
        self.assertEqual(rodar(["bash", "-n", self.SCRIPT]).returncode, 0)

    def test_uso_invalido_sai_2(self):
        casos = {
            "sem --label": ["FOO"],
            "--label sem valor": ["--label"],
            "--label vazio": ["--label", "", "FOO"],
            "--mode sem valor": ["--label", "L", "--mode"],
            "--mode invalido": ["--label", "L", "--mode", "warn", "FOO"],
            "--output sem valor": ["--label", "L", "--output"],
            "--output invalido": ["--label", "L", "--output", "a-b", "FOO"],
            "--output com quebra": ["--label", "L", "--output", "a\nb=1", "FOO"],
            "sem variavel": ["--label", "L"],
            "nome com espaco": ["--label", "L", "FOO BAR"],
            "nome comecando com digito": ["--label", "L", "1FOO"],
            "nome com igual": ["--label", "L", "FOO=x"],
            "nome com substituicao": ["--label", "L", "$(touch pwned)"],
            "flag desconhecida": ["--label", "L", "--nope", "FOO"],
            "flag depois de variavel": ["--label", "L", "FOO", "--mode", "summary"],
        }
        for nome, args in casos.items():
            with self.subTest(nome):
                r = self.run_script(*args, FOO="x")
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                self.assertIn("::error::", r.stdout)
        self.assertFalse((Path.cwd() / "pwned").exists())

    def test_help(self):
        for flag in ("-h", "--help"):
            r = self.run_script(flag)
            self.assertEqual(r.returncode, 0)
            self.assertIn("Uso: require-env.sh", r.stdout)

    def test_presente_sai_0(self):
        r = self.run_script("--label", "Gate X", "FOO", "BAR", FOO="1", BAR="2")
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("Gate X: todas as variáveis obrigatórias estão presentes", r.stdout)

    def test_ausente_vazia_ou_so_espaco_sai_1(self):
        for nome, valor in {"vazia": "", "espacos": "   ", "tab e quebra": "\t\n \r\n"}.items():
            with self.subTest(nome):
                r = self.run_script("--label", "L", "FOO", FOO=valor)
                self.assertEqual(r.returncode, 1, r.stdout)
                self.assertIn("::error::L: variável obrigatória ausente (FOO).", r.stdout)
        r = self.run_script("--label", "L", "NAO_DEFINIDA")
        self.assertEqual(r.returncode, 1)

    def test_valor_multilinha_conta_como_presente(self):
        r = self.run_script("--label", "L", "PEM", PEM="-----BEGIN-----\nabc\n-----END-----\n")
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_varios_nomes_lista_so_os_ausentes(self):
        r = self.run_script("--label", "L", "A", "B", "C", "D", A="1", C="3", D=" ")
        self.assertEqual(r.returncode, 1)
        self.assertIn("ausente (B).", r.stdout)
        self.assertIn("ausente (D).", r.stdout)
        self.assertNotIn("(A)", r.stdout)
        self.assertNotIn("(C)", r.stdout)

    def test_modo_summary_avisa_e_sai_0(self):
        r = self.run_script("--label", "L", "--mode", "summary", "FOO")
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("::warning::L: variável ausente (FOO).", r.stdout)
        self.assertNotIn("::error::", r.stdout)

    def test_github_output_e_append(self):
        saida = self.tmp / "out"
        saida.write_text("anterior=1\n")
        r = self.run_script("--label", "L", "--mode", "summary", "--output", "available", "FOO", GITHUB_OUTPUT=str(saida))
        self.assertEqual(r.returncode, 0)
        self.run_script("--label", "L", "--output", "available", "FOO", FOO="x", GITHUB_OUTPUT=str(saida))
        self.assertEqual(saida.read_text(), "anterior=1\navailable=false\navailable=true\n")

    def test_output_sem_github_output_nao_quebra(self):
        r = self.run_script("--label", "L", "--output", "available", "FOO", FOO="x")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_step_summary(self):
        resumo = self.tmp / "resumo.md"
        self.run_script("--label", "Gate Y", "A", "B", A="1", GITHUB_STEP_SUMMARY=str(resumo))
        texto = resumo.read_text()
        self.assertIn("### Gate Y", texto)
        self.assertIn("- Status: pendência de configuração", texto)
        self.assertIn("- Variáveis ausentes: `B`", texto)
        self.run_script("--label", "Gate Y", "A", A="1", GITHUB_STEP_SUMMARY=str(resumo))
        self.assertIn("- Status: pronto", resumo.read_text())

    def test_nunca_imprime_o_valor(self):
        saida, resumo = self.tmp / "out", self.tmp / "resumo.md"
        valores = [MARCA, f"{MARCA}\nlinha2", f"$(echo {MARCA})", f"`{MARCA}`", f"'{MARCA}\" ; echo x"]
        for valor in valores:
            for modo in ("fail", "summary"):
                with self.subTest(valor=valor, modo=modo):
                    r = self.run_script(
                        "--label", "L", "--mode", modo, "--output", "ok", "SEGREDO", "FALTA",
                        SEGREDO=valor, GITHUB_OUTPUT=str(saida), GITHUB_STEP_SUMMARY=str(resumo),
                    )
                    tudo = r.stdout + r.stderr + saida.read_text() + resumo.read_text()
                    self.assertNotIn(MARCA, tudo)

    def test_variavel_do_proprio_shell_nao_conta_como_ambiente(self):
        # Regressão: `${!key}` lia as variáveis internas do script. `label` valia o
        # rótulo, `mode` valia "fail", `key` valia "key" — tudo "presente" sem existir.
        for nome in ("label", "mode", "key", "value", "output_name", "missing"):
            with self.subTest(nome):
                r = self.run_script("--label", "L", nome)
                self.assertEqual(r.returncode, 1, f"{nome}: {r.stdout}")
                self.assertIn(f"ausente ({nome}).", r.stdout)

    def test_variavel_exportada_com_nome_interno_e_respeitada(self):
        r = self.run_script("--label", "L", "label", "mode", label="x", mode="y")
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_separador_traco_traco(self):
        r = self.run_script("--label", "L", "--", "FOO", FOO="1")
        self.assertEqual(r.returncode, 0, r.stdout)


# --------------------------------------------------------------------------- check-baseline-drift.sh
PSQL_FALSO = r'''#!/usr/bin/env python3
# psql falso: responde pela consulta que recebeu e registra como foi chamado.
import json, os, sys
args = sys.argv[1:]
texto = " ".join(args)
if "-f" in args:
    texto += open(args[args.index("-f") + 1], encoding="utf-8").read()
elif "-c" not in args:
    # como o psql de verdade: só lê a entrada padrão quando não recebeu -c nem -f
    texto += sys.stdin.read()
with open(os.environ["PSQL_REGISTRO"], "a", encoding="utf-8") as reg:
    reg.write(json.dumps(args) + "\n")
secoes = {
    "contagens": "'tables'",
    "policies": "jsonb_object_agg",
    "rls": "relrowsecurity",
    "views": "security_invoker",
    "anon": "allowed_select",
    "esperados_anon": "esperados AS",
}
for nome, marcador in secoes.items():
    if marcador in texto:
        if os.environ.get("PSQL_FALHA") == nome:
            sys.stderr.write("psql: error: connection to server failed\n")
            sys.exit(int(os.environ.get("PSQL_FALHA_RC", "2")))
        sys.stdout.write(os.environ.get("PSQL_" + nome.upper(), ""))
        sys.exit(0)
sys.stderr.write("psql falso: consulta desconhecida\n")
sys.exit(9)
'''

CONTAGENS_OK = "tables,10\nviews,2\nindexes,30\nfunctions,5\npolicies,7\n"
POLICIES_OK = '{"clientes": 3, "pedidos": 4}\n'
URL = "postgresql://leitor:senha%20com espaço'\"$(touch pwned)@db.exemplo.invalid:5432/postgres"


class BaselineDrift(Base):
    def setUp(self):
        super().setUp()
        self.raiz = self.tmp / "repo com espaço"
        self.script = self.raiz / "scripts" / "ci" / "check-baseline-drift.sh"
        self.script.parent.mkdir(parents=True)
        shutil.copy(CI / "check-baseline-drift.sh", self.script)
        self.baseline = self.raiz / "scripts" / "integrity" / "baseline"
        self.baseline.mkdir(parents=True)
        self.gravar_baseline()
        self.bin = self.tmp / "bin"
        executavel(self.bin / "psql", PSQL_FALSO)
        self.registro = self.tmp / "psql.log"
        self.tmpdir = self.tmp / "tmpdir"
        self.tmpdir.mkdir()

    def gravar_baseline(self, contagens=None, policies=None, permitidas=None, writes=None):
        contagens = contagens or {"tables": 10, "views": 2, "indexes": 30, "functions": 5, "policies": 7}
        (self.baseline / "schema-counts.json").write_text(json.dumps(contagens))
        (self.baseline / "expected-policies.json").write_text(json.dumps(policies or {"clientes": 3, "pedidos": 4}))
        (self.baseline / "allowed-public-tables.json").write_text(json.dumps(permitidas or ["planos"]))
        (self.baseline / "allowed-anon-writes.json").write_text(json.dumps(writes or []))

    def run_script(self, *args, url=URL, **env):
        base = {
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "PSQL_REGISTRO": str(self.registro),
            "TMPDIR": str(self.tmpdir),
            "PSQL_CONTAGENS": CONTAGENS_OK,
            "PSQL_POLICIES": POLICIES_OK,
            "PSQL_RLS": "\n",
            "PSQL_VIEWS": "\n",
            "PSQL_ANON": "\n",
            "PSQL_ESPERADOS_ANON": "\n",
        }
        if url is not None:
            base["PROD_DB_URL"] = url
        base.update(env)
        return rodar(["bash", str(self.script), *args], env=ambiente(**base), cwd=str(self.tmp))

    def test_sintaxe(self):
        self.assertEqual(rodar(["bash", "-n", str(self.script)]).returncode, 0)

    def test_help_sai_0_sem_tocar_banco(self):
        for flag in ("-h", "--help"):
            r = self.run_script(flag, url=None)
            self.assertEqual(r.returncode, 0)
            self.assertIn("PROD_DB_URL", r.stdout)
            self.assertIn("DRIFT_TOLERANCE", r.stdout)
        self.assertFalse(self.registro.exists())

    def test_sem_url_sai_2_com_aviso(self):
        # Contrato do cabeçalho ("2 pré-condição ausente") e do cenário C3 do validate-all.sh.
        for url in (None, ""):
            r = self.run_script(url=url)
            self.assertEqual(r.returncode, 2)
            self.assertIn("::warning::PROD_DB_URL ausente — Gate #26 pulado.", r.stdout)
        self.assertFalse(self.registro.exists())

    def test_sem_drift_sai_0_e_e_idempotente(self):
        primeira = self.run_script()
        self.assertEqual(primeira.returncode, 0, primeira.stdout + primeira.stderr)
        self.assertIn("✅ Gate #26 — sem drift de schema/policies.", primeira.stdout)
        self.assertIn("policies por tabela idênticas ao baseline", primeira.stdout)
        segunda = self.run_script()
        self.assertEqual((segunda.returncode, segunda.stdout), (0, primeira.stdout))

    def test_url_chega_inteira_ao_psql_e_nao_vaza_na_saida(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        chamadas = [json.loads(linha) for linha in self.registro.read_text().splitlines()]
        self.assertEqual(len(chamadas), 6)
        for args in chamadas:
            self.assertEqual(args[0], URL)
        self.assertNotIn("senha", r.stdout + r.stderr)
        self.assertFalse((self.tmp / "pwned").exists())

    def test_allowlist_vai_como_variavel_psql(self):
        self.gravar_baseline(permitidas=["planos", "o'brien"])
        self.run_script()
        chamadas = [json.loads(linha) for linha in self.registro.read_text().splitlines()]
        valor = next(a for c in chamadas for a in c if a.startswith("allowed_json="))
        self.assertEqual(json.loads(valor.split("=", 1)[1]), ["planos", "o'brien"])

    def test_drift_de_contagem_sai_1(self):
        r = self.run_script(PSQL_CONTAGENS=CONTAGENS_OK.replace("tables,10", "tables,11"))
        self.assertEqual(r.returncode, 1)
        self.assertIn("counts.tables drift: baseline=10 atual=11 (Δ=1)", r.stdout)
        self.assertIn("::error::Gate #26 — 1 divergência(s)", r.stdout)

    def test_policies_identicas_sao_reportadas_mesmo_com_drift_de_contagem(self):
        # Regressão: o "ok" de policies dependia do contador GLOBAL de falhas.
        r = self.run_script(PSQL_CONTAGENS=CONTAGENS_OK.replace("views,2", "views,3"))
        self.assertEqual(r.returncode, 1)
        self.assertIn("policies por tabela idênticas ao baseline", r.stdout)

    def test_tolerancia_so_vale_para_indices(self):
        mais2 = CONTAGENS_OK.replace("indexes,30", "indexes,32")
        self.assertEqual(self.run_script(PSQL_CONTAGENS=mais2).returncode, 1)
        self.assertEqual(self.run_script(PSQL_CONTAGENS=mais2, DRIFT_TOLERANCE="2").returncode, 0)
        self.assertEqual(self.run_script(PSQL_CONTAGENS=mais2, DRIFT_TOLERANCE="1").returncode, 1)
        r = self.run_script(PSQL_CONTAGENS=CONTAGENS_OK.replace("tables,10", "tables,9"), DRIFT_TOLERANCE="5")
        self.assertEqual(r.returncode, 1, "tolerância não pode cobrir tabela")

    def test_tolerancia_invalida_sai_2(self):
        # Regressão: "abc" fazia `[ -gt ]` errar e o ramo "ok" aprovar drift de índice.
        mais9 = CONTAGENS_OK.replace("indexes,30", "indexes,39")
        for valor in ("abc", "-1", "1.5", " 2", "2;id"):
            with self.subTest(valor):
                r = self.run_script(PSQL_CONTAGENS=mais9, DRIFT_TOLERANCE=valor)
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                self.assertIn("::error::DRIFT_TOLERANCE deve ser inteiro", r.stdout)
                self.assertNotIn("✅ counts.indexes", r.stdout)

    def test_contagem_que_nao_veio_do_banco_reprova(self):
        # Regressão: saída parcial do psql (ou vazia) passava como "sem drift".
        for nome, saida in {"vazia": "", "parcial": "tables,10\nviews,2\n"}.items():
            with self.subTest(nome):
                r = self.run_script(PSQL_CONTAGENS=saida)
                self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
                self.assertIn("counts.policies está no baseline mas não veio do banco", r.stdout)

    def test_contagem_nao_numerica_reprova_sem_executar_nada(self):
        r = self.run_script(PSQL_CONTAGENS=CONTAGENS_OK.replace("tables,10", "tables,x[$(touch pwned-db)]"))
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("counts.tables não numérico", r.stdout)
        self.gravar_baseline(contagens={"tables": "y[$(touch pwned-base)]", "views": 2, "indexes": 30, "functions": 5, "policies": 7})
        r = self.run_script()
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        achados = [p.name for p in self.tmp.rglob("pwned*")]
        self.assertEqual(achados, [], "valor não numérico foi avaliado como expressão")

    def test_chave_nova_no_banco_reprova(self):
        r = self.run_script(PSQL_CONTAGENS=CONTAGENS_OK + "sequences,4\n")
        self.assertEqual(r.returncode, 1)
        self.assertIn("counts.sequences ausente no baseline (atual=4)", r.stdout)

    def test_drift_de_policies(self):
        r = self.run_script(PSQL_POLICIES='{"clientes": 2, "novos": 1}\n')
        self.assertEqual(r.returncode, 1)
        self.assertIn("policies.added (1): novos", r.stdout)
        self.assertIn("policies.removed (1): pedidos", r.stdout)
        self.assertIn("policies.changed (1): clientes: 3 -> 2", r.stdout)
        self.assertNotIn("policies por tabela idênticas", r.stdout)

    def test_escrita_anon_fora_da_allowlist_reprova(self):
        # Grant INSERT de anon só é aceito com exceção explícita em allowed-anon-writes.json.
        self.gravar_baseline(writes=[])
        r = self.run_script(PSQL_ANON="clientes:INSERT\n")
        self.assertEqual(r.returncode, 1)
        self.assertIn("grants indevidos para anon: clientes:INSERT", r.stdout)

    def test_allowlist_escrita_vai_como_variavel_psql(self):
        self.gravar_baseline(writes=["a:INSERT", "o'brien:UPDATE"])
        self.run_script()
        ultima = json.loads(self.registro.read_text().splitlines()[-1])
        valor = next(a for a in ultima if a.startswith("allowed_writes_json="))
        self.assertEqual(json.loads(valor.split("=", 1)[1]), ["a:INSERT", "o'brien:UPDATE"])

    def test_grant_esperado_ausente_reprova(self):
        # Regressão: REVOKE acidental do grant de telemetria de anon deixava o
        # gate verde (a consulta de "indevidos" só acusa o que existe e não
        # deveria existir). O esperado também precisa estar presente.
        self.gravar_baseline(writes=["frontend_error_logs:INSERT"])
        r = self.run_script(PSQL_ESPERADOS_ANON="frontend_error_logs:INSERT\n")
        self.assertEqual(r.returncode, 1)
        self.assertIn("grants esperados de anon ausentes: frontend_error_logs:INSERT", r.stdout)

    def test_grant_esperado_presente_passa(self):
        self.gravar_baseline(writes=["frontend_error_logs:INSERT"])
        r = self.run_script(PSQL_ESPERADOS_ANON="\n")
        self.assertEqual(r.returncode, 0)
        self.assertIn("grants esperados de anon presentes", r.stdout)

    def test_invariantes_estruturais(self):
        casos = {
            "PSQL_RLS": ("legado,tmp_x\n", "tabelas sem RLS: legado,tmp_x"),
            "PSQL_VIEWS": ("vw_a\n", "views sem security_invoker: vw_a"),
            "PSQL_ANON": ("clientes:SELECT,planos:INSERT\n", "grants indevidos para anon: clientes:SELECT,planos:INSERT"),
        }
        for var, (saida, mensagem) in casos.items():
            with self.subTest(var):
                r = self.run_script(**{var: saida})
                self.assertEqual(r.returncode, 1)
                self.assertIn(mensagem, r.stdout)

    def test_falha_de_consulta_sai_2_em_qualquer_etapa(self):
        # Regressão: o exit do psql vazava (3 na 1ª consulta; 1 nas demais, que é o código de "drift").
        for etapa in ("contagens", "policies", "rls", "views", "anon"):
            for rc in ("1", "2", "3"):
                with self.subTest(etapa=etapa, rc=rc):
                    r = self.run_script(PSQL_FALHA=etapa, PSQL_FALHA_RC=rc)
                    self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                    self.assertIn("::error::Gate #26 — falha ao consultar o banco", r.stdout)
                    self.assertNotIn("sem drift", r.stdout)

    def test_policies_que_nao_sao_json_saem_2(self):
        for saida in ("", "ERRO\n", "[]\n", "null\n"):
            with self.subTest(saida):
                r = self.run_script(PSQL_POLICIES=saida)
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)

    def test_baseline_ausente_ou_invalido_sai_2(self):
        for arquivo in ("schema-counts.json", "expected-policies.json", "allowed-public-tables.json"):
            with self.subTest(arquivo):
                self.gravar_baseline()
                (self.baseline / arquivo).write_text("{ quebrado")
                r = self.run_script()
                self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
                self.assertIn(f"baseline ausente ou JSON inválido: {self.baseline / arquivo}", r.stdout)
                (self.baseline / arquivo).unlink()
                self.assertEqual(self.run_script().returncode, 2)

    def test_sem_psql_ou_jq_sai_2(self):
        vazio = self.tmp / "vazio"
        vazio.mkdir()
        for nome in ("bash", "dirname", "basename", "mktemp", "rm", "cat", "jq"):
            origem = shutil.which(nome)
            os.symlink(origem, vazio / nome)
        r = self.run_script(PATH=str(vazio))
        self.assertEqual(r.returncode, 2)
        self.assertIn("'psql' não encontrado", r.stdout)

    def test_nao_deixa_temporario_para_tras(self):
        # Regressão: o SQL de grants ia para `mktemp` fora do diretório limpo pelo trap.
        self.run_script()
        self.run_script(PSQL_FALHA="anon")
        self.run_script(PSQL_FALHA="contagens")
        self.assertEqual(list(self.tmpdir.iterdir()), [])


# --------------------------------------------------------------------------- deno-check-functions.sh
DENO_FALSO = r'''#!/usr/bin/env python3
import json, os, sys
with open(os.environ["DENO_REGISTRO"], "w", encoding="utf-8") as reg:
    json.dump(sys.argv[1:], reg)
sys.exit(int(os.environ.get("DENO_RC", "0")))
'''

FUNCOES_CRAVADAS = [
    "api-keys-manage", "convidar-usuario", "mcp-query", "analise-fluxo-ia", "analyze-document",
    "benchmarking-setorial", "categorizar-despesa", "conciliacao-proxy", "nfe-vinculo-proxy",
    "insights-relatorio", "enviar-alerta-email", "executar-analise-preditiva",
    "gerar-alertas-tributarios", "whatsapp-ia-proativo",
]


class DenoCheck(Base):
    def setUp(self):
        super().setUp()
        self.raiz = self.tmp / "repo com espaço"
        self.script = self.raiz / "scripts" / "ci" / "deno-check-functions.sh"
        self.script.parent.mkdir(parents=True)
        shutil.copy(CI / "deno-check-functions.sh", self.script)
        self.funcoes = self.raiz / "supabase" / "functions"
        for nome in ("cors.ts", "auth-guard.ts", "sefaz/pfx.ts", "nome com espaço.ts"):
            alvo = self.funcoes / "_shared" / nome
            alvo.parent.mkdir(parents=True, exist_ok=True)
            alvo.write_text("export {};\n")
        (self.funcoes / "_shared" / "leia.md").write_text("não é ts\n")
        for nome in FUNCOES_CRAVADAS:
            (self.funcoes / nome).mkdir(parents=True)
            (self.funcoes / nome / "index.ts").write_text("export {};\n")
        self.bin = self.tmp / "bin"
        executavel(self.bin / "deno", DENO_FALSO)
        self.registro = self.tmp / "deno.json"

    def run_script(self, com_deno=True, cwd=None, **env):
        caminho = f"{self.bin}:{os.environ['PATH']}" if com_deno else os.environ["PATH"]
        base = {"PATH": caminho, "DENO_REGISTRO": str(self.registro)}
        base.update(env)
        return rodar(["bash", str(self.script)], env=ambiente(**base), cwd=cwd or str(self.tmp))

    def test_lista_cravada_do_teste_bate_com_o_script(self):
        texto = (CI / "deno-check-functions.sh").read_text()
        no_script = [l.split("/")[2] for l in texto.splitlines() if l.startswith("supabase/functions/") and l.endswith("/index.ts")]
        self.assertEqual(no_script, FUNCOES_CRAVADAS)

    def test_sucesso_passa_shared_ordenado_mais_lista_cravada(self):
        r = self.run_script()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("✅ Gate Deno do escopo endurecido aprovado.", r.stdout)
        args = json.loads(self.registro.read_text())
        self.assertEqual(args[:3], ["check", "--no-config", "--no-lock"])
        shared = sorted(str(p.relative_to(self.raiz)) for p in (self.funcoes / "_shared").rglob("*.ts"))
        self.assertEqual(args[3:], shared + [f"supabase/functions/{n}/index.ts" for n in FUNCOES_CRAVADAS])
        self.assertIn("supabase/functions/_shared/nome com espaço.ts", args, "caminho com espaço é UM argumento")
        self.assertIn(f"Type-check de {len(args) - 3} arquivos", r.stdout)

    def test_import_map_so_entra_quando_existe(self):
        (self.funcoes / "import_map.json").write_text("{}")
        self.run_script()
        args = json.loads(self.registro.read_text())
        self.assertEqual(args[3], "--import-map=supabase/functions/import_map.json")

    def test_independe_do_diretorio_de_trabalho(self):
        r = self.run_script(cwd="/")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_sem_deno_falha_cedo_com_mensagem_acionavel(self):
        # Regressão: morria com "deno: command not found" depois de anunciar o type-check.
        self.assertIsNone(shutil.which("deno"), "este cenário pressupõe máquina sem deno no PATH")
        r = self.run_script(com_deno=False)
        self.assertEqual(r.returncode, 127)
        self.assertIn("::error::deno não encontrado no PATH", r.stdout)
        self.assertNotIn("Type-check de", r.stdout)
        self.assertNotIn("command not found", r.stderr)

    def test_arquivo_critico_ausente_sai_1(self):
        (self.funcoes / "mcp-query" / "index.ts").unlink()
        r = self.run_script()
        self.assertEqual(r.returncode, 1)
        self.assertIn("::error::Arquivo crítico ausente no gate Deno: supabase/functions/mcp-query/index.ts", r.stdout)
        self.assertFalse(self.registro.exists(), "deno não pode rodar com a lista incompleta")

    def test_shared_ausente_sai_1(self):
        # Regressão: sem _shared o `find` falhava calado e o gate passava só com a lista cravada.
        shutil.rmtree(self.funcoes / "_shared")
        r = self.run_script()
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("supabase/functions/_shared não encontrado", r.stdout)
        self.assertFalse(self.registro.exists())

    def test_falha_do_deno_propaga_e_nao_aprova(self):
        for rc in ("1", "2"):
            r = self.run_script(DENO_RC=rc)
            self.assertEqual(r.returncode, int(rc))
            self.assertNotIn("aprovado", r.stdout)


# --------------------------------------------------------------------------- typecheck-strict-baseline.sh
TSC_FALSO = r'''
const fs = require('node:fs');
fs.appendFileSync(process.env.TSC_REGISTRO, JSON.stringify(process.argv.slice(2)) + '\n');
if (process.env.TSC_SAIDA) process.stdout.write(fs.readFileSync(process.env.TSC_SAIDA, 'utf8'));
process.exit(Number(process.env.TSC_RC || 0));
'''

ERRO_A = "src/a.ts(10,5): error TS2531: Object is possibly 'null'."
ERRO_B = "src/b com espaço.tsx(3,1): error TS2322: Type 'null' is not assignable to type 'string'."
ERRO_C = "src/c.ts(7,7): error TS18048: 'x' is possibly 'undefined'."


class TypecheckStrict(Base):
    def setUp(self):
        super().setUp()
        self.raiz = self.tmp / "repo com espaço"
        self.script = self.raiz / "scripts" / "ci" / "typecheck-strict-baseline.sh"
        self.script.parent.mkdir(parents=True)
        shutil.copy(CI / "typecheck-strict-baseline.sh", self.script)
        self.baseline = self.raiz / "scripts" / "ci" / "baselines" / "strictnullchecks-baseline.txt"
        self.baseline.parent.mkdir()
        self.baseline.write_text("")
        tsc = self.raiz / "node_modules" / "typescript" / "bin" / "tsc"
        tsc.parent.mkdir(parents=True)
        tsc.write_text(TSC_FALSO)
        (self.raiz / "tsconfig.json").write_text("{}")
        self.registro = self.tmp / "tsc.log"
        self.saida = self.tmp / "tsc.out"
        self.tmpdir = self.tmp / "tmpdir"
        self.tmpdir.mkdir()

    def run_script(self, *args, saida="", rc=0, cwd=None):
        self.saida.write_text(saida)
        env = ambiente(TSC_REGISTRO=str(self.registro), TSC_SAIDA=str(self.saida), TSC_RC=str(rc), TMPDIR=str(self.tmpdir))
        return rodar(["bash", str(self.script), *args], env=env, cwd=cwd or str(self.tmp))

    def test_limpo_com_baseline_vazio_sai_0(self):
        r = self.run_script(cwd="/")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("strictNullChecks: 0 erros atuais vs 0 no baseline", r.stdout)
        self.assertIn("✅ Nenhum erro novo de strictNullChecks.", r.stdout)
        self.assertEqual(json.loads(self.registro.read_text()), ["--noEmit", "--strictNullChecks", "-p", "tsconfig.json"])
        self.assertEqual(list(self.tmpdir.iterdir()), [], "temporários limpos pelo trap")

    def test_erro_novo_reprova_e_lista(self):
        r = self.run_script(saida=f"{ERRO_A}\n{ERRO_B}\n", rc=2)
        self.assertEqual(r.returncode, 1)
        self.assertIn("::error::2 erro(s) novo(s) de strictNullChecks:", r.stdout)
        self.assertIn("src/a.ts(...): error TS2531", r.stdout)
        self.assertIn("src/b com espaço.tsx(...): error TS2322", r.stdout)

    def test_erro_do_baseline_em_outra_linha_nao_reprova(self):
        self.baseline.write_text("src/a.ts(...): error TS2531: Object is possibly 'null'.\n")
        r = self.run_script(saida=ERRO_A.replace("(10,5)", "(999,1)") + "\n" + ERRO_A + "\n", rc=2)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("1 erros atuais vs 1 no baseline", r.stdout)

    def test_baseline_encolheu_avisa_e_passa(self):
        self.baseline.write_text("src/a.ts(...): error TS2531: Object is possibly 'null'.\nsrc/z.ts(...): error TS1: x\n")
        r = self.run_script(saida=ERRO_A + "\n", rc=2)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("::notice::Baseline encolheu 1 erros", r.stdout)

    def test_baseline_fora_de_ordem_nao_gera_falso_erro(self):
        linhas = ["src/c.ts(...): error TS18048: 'x' is possibly 'undefined'.", "src/a.ts(...): error TS2531: Object is possibly 'null'."]
        self.baseline.write_text("\n".join(linhas) + "\n")
        r = self.run_script(saida=f"{ERRO_A}\n{ERRO_C}\n", rc=2)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_crash_do_tsc_reprova(self):
        r = self.run_script(saida="FATAL ERROR: JavaScript heap out of memory\n", rc=134)
        self.assertEqual(r.returncode, 1)
        self.assertIn("tsc falhou sem emitir 'error TS' (exit 134)", r.stderr)
        self.assertNotIn("Nenhum erro novo", r.stdout)

    def test_erro_de_configuracao_nao_e_divida_de_tipo(self):
        config = "error TS5083: Cannot read file 'tsconfig.json'.\n"
        r = self.run_script(saida=config, rc=1)
        self.assertEqual(r.returncode, 1)
        self.assertIn("tsc reportou erro de configuração", r.stderr)
        r = self.run_script("--update", saida=config, rc=1)
        self.assertEqual(r.returncode, 1)
        self.assertEqual(self.baseline.read_text(), "", "erro de configuração não vira assinatura de baseline")

    def test_update_grava_assinaturas_ordenadas_e_unicas(self):
        r = self.run_script("--update", saida=f"{ERRO_C}\n{ERRO_A}\n{ERRO_A.replace('(10,5)', '(11,9)')}\nFound 3 errors.\n", rc=2)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("Baseline regerado: 2 assinaturas", r.stdout)
        self.assertEqual(
            self.baseline.read_text().splitlines(),
            ["src/a.ts(...): error TS2531: Object is possibly 'null'.", "src/c.ts(...): error TS18048: 'x' is possibly 'undefined'."],
        )
        self.assertEqual(self.run_script(saida=f"{ERRO_A}\n{ERRO_C}\n", rc=2).returncode, 0, "o baseline recém-gerado aprova o mesmo estado")
        self.assertEqual(list(self.tmpdir.iterdir()), [])

    def test_update_limpo_grava_baseline_vazio(self):
        self.baseline.write_text("src/z.ts(...): error TS1: x\n")
        r = self.run_script("--update")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.baseline.read_text(), "")

    def test_update_com_crash_preserva_o_baseline(self):
        # Regressão: `atualizar > "$BASELINE"` truncava o arquivo versionado antes de abortar.
        original = "src/a.ts(...): error TS2531: Object is possibly 'null'.\n"
        self.baseline.write_text(original)
        r = self.run_script("--update", saida="Killed\n", rc=137)
        self.assertEqual(r.returncode, 1)
        self.assertEqual(self.baseline.read_text(), original)
        self.assertEqual(list(self.tmpdir.iterdir()), [])

    def test_sem_typescript_instalado_reprova(self):
        shutil.rmtree(self.raiz / "node_modules")
        r = self.run_script()
        self.assertEqual(r.returncode, 1)
        self.assertIn("tsc falhou sem emitir 'error TS'", r.stderr)

    def test_baseline_ausente_reprova(self):
        self.baseline.unlink()
        r = self.run_script()
        self.assertEqual(r.returncode, 1)
        self.assertIn("::error::Baseline ausente", r.stdout)

    def test_argumento_desconhecido_sai_2_sem_rodar_tsc(self):
        for arg in ("--updat", "update", "--check"):
            r = self.run_script(arg)
            self.assertEqual(r.returncode, 2, r.stdout + r.stderr)
            self.assertIn("argumento desconhecido", r.stderr)
        self.assertFalse(self.registro.exists())

    def test_help(self):
        for flag in ("-h", "--help"):
            r = self.run_script(flag)
            self.assertEqual(r.returncode, 0)
            self.assertIn("--update", r.stdout)
        self.assertFalse(self.registro.exists())


if __name__ == "__main__":
    unittest.main(verbosity=1)
