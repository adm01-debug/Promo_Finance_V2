#!/usr/bin/env python3
"""
Cenários de scripts/healthcheck: run.sh (orquestrador), 01_webhooks.sh,
02_crons.sql e 04_events.sh.

Banco: Postgres local descartável (scripts/data/pg_efemero.py) com o schema
mínimo que os checks consultam. Rede: nenhuma — `curl`, `node` e `sleep` são
stubs no PATH. O pg_cron não existe no Postgres local: o schema `cron` e a
linha em pg_extension são dublês com o mesmo formato (o que se prova é a
lógica do 02_crons.sql e o caminho run.sh → JSONL → exit code).
O 03_realtime.mjs tem teste próprio em 03_realtime.unit.mjs.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DIR = REPO_ROOT / "scripts" / "healthcheck"
sys.path.insert(0, str(REPO_ROOT / "scripts" / "data"))
from pg_efemero import PgEfemero

RUN_ID = "3d1f0c9a-5b7e-4f21-9a66-1c2d3e4f5a6b"
TOKENS = {"ASAAS_WEBHOOK_TOKEN": "tok-asaas-SEGREDO", "BITRIX24_WEBHOOK_SECRET": "tok-bitrix-SEGREDO",
          "WHATSAPP_WEBHOOK_SECRET": "tok-whats-SEGREDO", "BLING_WEBHOOK_SECRET": "tok-bling-SEGREDO"}

STUB_CURL = r'''#!/usr/bin/env python3
import json, os, sys
argv = sys.argv[1:]
cfg = json.load(open(os.environ["STUB_CURL_CFG"]))
with open(cfg["log"], "a") as f:
    f.write(json.dumps(argv) + "\n")
juntos = " ".join(argv)
code = cfg.get("default", "200")
for regra in cfg.get("regras", []):
    if all(t in juntos for t in regra["contem"]):
        code = regra["code"]
        break
if "-o" in argv:
    destino = argv[argv.index("-o") + 1]
    if destino != "/dev/null":
        open(destino, "w").write(cfg.get("body", '{"stub":true}'))
if code == "000":
    sys.stdout.write("000")
    sys.exit(7)
sys.stdout.write(code)
'''

# Emite uma linha de realtime com o status pedido, como o 03_realtime.mjs faria.
STUB_NODE = r'''#!/usr/bin/env bash
st="${STUB_NODE_STATUS:-unverified}"
linha="{\"ts\":\"2026-01-01T00:00:00.000Z\",\"check\":\"realtime\",\"target\":\"stub\",\"status\":\"$st\",\"detail\":\"stub\",\"run_id\":\"$RUN_ID\",\"latency_ms\":null}"
echo "$linha" >> "$OUT"
if [ "${JSON_ONLY:-0}" = "1" ]; then echo "$linha"; else echo "$linha" >&2; fi
'''

SCHEMA = """
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
DROP SCHEMA IF EXISTS cron CASCADE;
DELETE FROM pg_extension WHERE extname = 'pg_cron';
CREATE TABLE public.webhook_events (id bigserial PRIMARY KEY, event_type text, raw_payload jsonb);
CREATE TABLE public.webhooks_log (id bigserial PRIMARY KEY, provider text, payload jsonb);
CREATE TABLE public.alerts (id bigserial PRIMARY KEY, type text, severity text, title text, message text, metadata jsonb);
CREATE TABLE public.n8n_dispatch_logs (id bigserial PRIMARY KEY, payload jsonb);
CREATE TABLE public.webhook_dlq (id bigserial PRIMARY KEY, source text, payload jsonb);
"""

# Consumidores do event bus: propagam o evento para alerts e n8n_dispatch_logs.
CONSUMIDORES = """
CREATE FUNCTION public.propaga() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  INSERT INTO public.alerts(type, metadata)
    VALUES ('SYSTEM', jsonb_build_object('healthcheck_run_id', NEW.raw_payload ->> 'healthcheck_run_id'));
  INSERT INTO public.n8n_dispatch_logs(payload) VALUES (NEW.raw_payload);
  RETURN NEW;
END $f$;
CREATE TRIGGER t_propaga AFTER INSERT ON public.webhook_events FOR EACH ROW EXECUTE FUNCTION public.propaga();
"""

# Dublê do pg_cron: mesma forma das tabelas que o 02_crons.sql consulta.
CRON_FALSO = """
INSERT INTO pg_extension (oid, extname, extowner, extnamespace, extrelocatable, extversion)
  SELECT 987654, 'pg_cron', extowner, extnamespace, false, '1.6' FROM pg_extension WHERE extname = 'plpgsql';
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigserial PRIMARY KEY, jobname text, schedule text, active boolean DEFAULT true);
CREATE TABLE cron.job_run_details (runid bigserial PRIMARY KEY, jobid bigint, status text,
  return_message text, start_time timestamptz, end_time timestamptz);
"""


class _Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pg = PgEfemero()
        try:
            cls.pg.criar_db("stg")
        except Exception:
            cls.pg.parar()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.pg.parar()

    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="healthcheck-cenarios-")
        self.addCleanup(shutil.rmtree, self.tmp, True)
        self.bin = Path(self.tmp) / "bin"
        self.bin.mkdir()
        self.pg.psql("stg", SCHEMA)
        self.stub_curl()
        (self.bin / "node").write_text(STUB_NODE)
        (self.bin / "node").chmod(0o755)
        # sleep instantâneo: os laços de espera (10 s / 30 s) não atrasam a suíte.
        (self.bin / "sleep").write_text("#!/usr/bin/env bash\nexit 0\n")
        (self.bin / "sleep").chmod(0o755)

    def sql(self, texto):
        return self.pg.psql("stg", texto)

    def stub_curl(self, regras=None, default="200", body='{"stub":true}'):
        stub = self.bin / "curl"
        stub.write_text(STUB_CURL)
        stub.chmod(0o755)
        self.curl_log = self.bin / "curl.log"
        self.curl_log.write_text("")
        (self.bin / "curl.json").write_text(json.dumps(
            {"log": str(self.curl_log), "regras": regras or [], "default": default, "body": body}))

    def env(self, **extra):
        env = os.environ.copy()
        for k in list(TOKENS) + ["PROD_PROJECT_REF", "TEST_ADMIN_JWT", "STAGING_SERVICE_ROLE_KEY", "RUN_ID", "OUT"]:
            env.pop(k, None)
        env.update({"PATH": f"{self.bin}:" + env["PATH"], "STUB_CURL_CFG": str(self.bin / "curl.json"),
                    "STAGING_DB_URL": self.pg.url("stg"), "STAGING_PROJECT_REF": "stgref",
                    "STAGING_ANON_KEY": "anon-key-de-teste", "TMPDIR": self.tmp})
        env.update(extra)
        return env

    @staticmethod
    def jsonl(texto):
        return [json.loads(l) for l in texto.splitlines() if l.strip()]


class TestRunSh(_Base):
    def rodar(self, *args, **extra):
        return subprocess.run(["bash", str(DIR / "run.sh"), *args], capture_output=True, text=True,
                              env=self.env(**extra), timeout=120)

    def test_sem_nenhum_fail_sai_com_0(self):
        # Regressão: `grep -c ... || echo 0` produzia "0\n0" e o exit final era 2.
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "crons", "--skip", "realtime", "--skip", "events")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(r.stdout, "")

    def test_fluxo_completo_sao_sai_com_0_e_jsonl_valido(self):
        self.sql(CONSUMIDORES + CRON_FALSO)
        self.sql("INSERT INTO cron.job(jobname, schedule) VALUES ('regua','* * * * *');"
                 "INSERT INTO cron.job_run_details(jobid,status,start_time,end_time) VALUES (1,'succeeded',now(),now())")
        self.stub_curl(regras=[{"contem": ["invalid-"], "code": "401"}])
        r = self.rodar("--json-only", STUB_NODE_STATUS="pass", **TOKENS)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        linhas = self.jsonl(r.stdout)
        self.assertEqual({l["check"] for l in linhas}, {"webhooks", "crons", "realtime", "events"})
        self.assertEqual({l["status"] for l in linhas}, {"pass"}, [l for l in linhas if l["status"] != "pass"])
        self.assertEqual(len({l["run_id"] for l in linhas}), 1)
        for segredo in list(TOKENS.values()) + ["anon-key-de-teste"]:
            self.assertNotIn(segredo, r.stdout + r.stderr)

    def test_exit_code_e_o_numero_de_fails(self):
        self.sql(CONSUMIDORES)
        self.sql("DROP TABLE public.webhook_events CASCADE")  # events.publish falha
        r = self.rodar("--json-only", STUB_NODE_STATUS="fail")
        linhas = self.jsonl(r.stdout)
        falhas = [l for l in linhas if l["status"] == "fail"]
        self.assertEqual({(l["check"], l["target"]) for l in falhas},
                         {("realtime", "stub"), ("events", "publish.webhook_events")})
        self.assertEqual(r.returncode, 2, r.stdout + r.stderr)

    def test_cron_com_falha_recente_reprova_o_healthcheck(self):
        # Regressão dupla: (a) com -f o psql prefixa "psql:<arq>:<n>: NOTICE:" e o
        # filtro antigo descartava tudo; (b) o jsonb sai com '"status": "fail"'
        # (com espaço) e a contagem procurava '"status":"fail"'.
        self.sql(CRON_FALSO)
        self.sql("INSERT INTO cron.job(jobname, schedule) VALUES ('quebrado','* * * * *'),('ok','* * * * *'),"
                 "('raro','0 3 1 * *'),('desligado','* * * * *');"
                 "UPDATE cron.job SET active = false WHERE jobname = 'desligado';"
                 "INSERT INTO cron.job_run_details(jobid,status,return_message,start_time,end_time) VALUES "
                 "(1,'failed',E'ERROR: \"aspas\" e\\nquebra de linha',now(),now()),"
                 "(1,'succeeded',null,now(),now()),(2,'succeeded',null,now(),now()),"
                 "(3,'failed','antigo',now() - interval '2 hours',now() - interval '2 hours')")
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "realtime", "--skip", "events")
        linhas = {l["target"]: l for l in self.jsonl(r.stdout)}
        self.assertEqual(linhas["registry"]["status"], "pass")
        self.assertIn("total=4 active=3", linhas["registry"]["detail"])
        self.assertEqual(linhas["quebrado"]["status"], "fail")
        self.assertIn('"aspas"', linhas["quebrado"]["detail"])
        self.assertEqual(linhas["ok"]["status"], "pass")
        self.assertEqual(linhas["raro"]["status"], "unverified")
        self.assertNotIn("desligado", linhas)
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertTrue(all(l["run_id"] and l["check"] == "crons" for l in linhas.values()))

    def test_cron_sem_job_ativo_e_sem_extensao(self):
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "realtime", "--skip", "events")
        linhas = self.jsonl(r.stdout)
        self.assertEqual([(l["target"], l["status"]) for l in linhas], [("pg_cron", "unverified")])
        self.assertEqual(r.returncode, 0)
        self.sql(CRON_FALSO)
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "realtime", "--skip", "events")
        linhas = self.jsonl(r.stdout)
        self.assertEqual([(l["target"], l["status"]) for l in linhas], [("registry", "fail")])
        self.assertEqual(r.returncode, 1)

    def test_crons_com_banco_inacessivel_vira_fail_e_nao_silencio(self):
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "realtime", "--skip", "events",
                       STAGING_DB_URL="postgresql://postgres:S3nhaSecreta@127.0.0.1:1/x")
        linhas = self.jsonl(r.stdout)
        self.assertEqual([(l["check"], l["target"], l["status"]) for l in linhas], [("crons", "runner", "fail")])
        self.assertEqual(r.returncode, 1)
        self.assertNotIn("S3nhaSecreta", r.stdout + r.stderr)

    def test_modo_humano_mostra_resumo(self):
        r = self.rodar("--skip", "webhooks", "--skip", "crons", "--skip", "events", STUB_NODE_STATUS="pass")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertRegex(r.stdout, r"pass:\s+1")
        self.assertRegex(r.stdout, r"fail:\s+0")
        self.assertRegex(r.stdout, r"unverified:\s+0")

    def test_dado_sintetico_e_removido_no_fim(self):
        self.sql(CONSUMIDORES)
        r = self.rodar("--json-only", "--skip", "webhooks", "--skip", "crons", "--skip", "realtime")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual(self.sql("SELECT (SELECT count(*) FROM webhook_events) + (SELECT count(*) FROM alerts)"
                                  " + (SELECT count(*) FROM n8n_dispatch_logs)"), "0")

    def test_arquivo_de_trabalho_tem_nome_imprevisivel_em_tmpdir(self):
        self.rodar("--json-only", "--skip", "webhooks", "--skip", "crons", "--skip", "events")
        arquivos = list(Path(self.tmp).glob("healthcheck-*.jsonl"))
        self.assertEqual(len(arquivos), 1)
        self.assertRegex(arquivos[0].name, r"^healthcheck-\d{8}T\d{6}Z-\w{6}\.jsonl$")

    def test_flags_invalidas_saem_com_2(self):
        for args, trecho in ((["--nao-existe"], "flag desconhecida"), (["--skip"], "exige um check"),
                             (["--skip", "webhook"], "--skip desconhecido"), (["--skip=cron"], "--skip desconhecido")):
            r = self.rodar(*args)
            self.assertEqual(r.returncode, 2, args)
            self.assertIn(trecho, r.stderr)

    def test_skip_com_igual_funciona(self):
        r = self.rodar("--json-only", "--skip=webhooks", "--skip=crons", "--skip=realtime", "--skip=events")
        self.assertEqual((r.returncode, r.stdout), (0, ""))

    def test_guard_rail_de_producao_e_env_obrigatoria(self):
        r = self.rodar("--json-only", PROD_PROJECT_REF="stgref")
        self.assertEqual(r.returncode, 2)
        self.assertIn("PROD_PROJECT_REF", r.stderr)
        self.assertEqual(self.curl_log.read_text(), "")
        for faltando in ("STAGING_DB_URL", "STAGING_PROJECT_REF", "STAGING_ANON_KEY"):
            r = self.rodar("--json-only", **{faltando: ""})
            self.assertNotEqual(r.returncode, 0, faltando)
            self.assertIn(faltando, r.stderr)

    def test_ajuda(self):
        for flag in ("--help", "-h"):
            r = self.rodar(flag)
            self.assertEqual(r.returncode, 0)
            self.assertIn("Uso:", r.stdout)
            self.assertIn("--skip", r.stdout)


class TestWebhooks(_Base):
    def rodar(self, script=None, **extra):
        out = Path(self.tmp) / "out.jsonl"
        out.unlink(missing_ok=True)
        env = self.env(RUN_ID=RUN_ID, OUT=str(out), FUNCTIONS_BASE="https://stgref.functions.supabase.co", **extra)
        r = subprocess.run(["bash", str(script or DIR / "01_webhooks.sh")], capture_output=True, text=True,
                           env=env, timeout=120)
        linhas = self.jsonl(r.stdout)
        self.assertEqual(linhas, self.jsonl(out.read_text()) if out.exists() else [])
        return r, {l["target"]: l for l in linhas}

    def suite_propria(self, baseline, fixtures=("f.json",)):
        pasta = Path(self.tmp) / "hc"
        (pasta / "baseline").mkdir(parents=True)
        (pasta / "fixtures").mkdir()
        shutil.copy(DIR / "01_webhooks.sh", pasta / "01_webhooks.sh")
        (pasta / "baseline" / "expected-webhooks.json").write_text(json.dumps(baseline))
        for f in fixtures:
            (pasta / "fixtures" / f).write_text('{"evento": "x", "texto": "tem \\"aspas\\" e $cifrao"}')
        return pasta / "01_webhooks.sh"

    def test_sem_secrets_fica_unverified_e_nao_chama_a_rede(self):
        r, a = self.rodar()
        self.assertEqual(r.returncode, 0, r.stderr)
        for nome, env in (("asaas-webhook", "ASAAS_WEBHOOK_TOKEN"), ("bling-webhook", "BLING_WEBHOOK_SECRET")):
            self.assertEqual(a[nome]["status"], "unverified")
            self.assertIn(env, a[nome]["detail"])
        self.assertEqual(self.curl_log.read_text(), "")

    def test_cenario_sao_valida_rejeita_invalido_e_dlq_limpa(self):
        self.stub_curl(regras=[{"contem": ["invalid-" + RUN_ID], "code": "403"}])
        r, a = self.rodar(**TOKENS)
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(len(a), 12)
        self.assertEqual({l["status"] for l in a.values()}, {"pass"}, a)
        self.assertIsInstance(a["asaas-webhook.valid"]["latency_ms"], int)
        for segredo in TOKENS.values():
            self.assertNotIn(segredo, r.stdout + r.stderr)
        chamadas = [json.loads(l) for l in self.curl_log.read_text().splitlines()]
        self.assertEqual(len(chamadas), 8)
        for argv in chamadas:
            self.assertIn("--max-time", argv)
            self.assertTrue(any(x.startswith("https://stgref.functions.supabase.co/") for x in argv))
        self.assertEqual(list(Path(self.tmp).glob("hc_body*")), [])  # corpo temporário removido

    def test_webhook_que_responde_erro_ou_aceita_token_invalido_falha(self):
        self.stub_curl(regras=[{"contem": ["asaas-webhook", "invalid-"], "code": "200"},
                               {"contem": ["bling-webhook", "invalid-"], "code": "401"},
                               {"contem": ["bling-webhook"], "code": "500"},
                               {"contem": ["invalid-"], "code": "401"}],
                       body='{"error":"segredo\\n ausente"}')
        _, a = self.rodar(**TOKENS)
        self.assertEqual(a["asaas-webhook.invalid"]["status"], "fail")
        self.assertEqual(a["bling-webhook.valid"]["status"], "fail")
        self.assertIn("http=500", a["bling-webhook.valid"]["detail"])
        self.assertIn("segredo", a["bling-webhook.valid"]["detail"])
        self.assertEqual(a["bling-webhook.invalid"]["status"], "pass")
        self.assertEqual(a["bitrix24-webhook.valid"]["status"], "pass")

    def test_rede_fora_reporta_http_000(self):
        self.stub_curl(default="000")
        _, a = self.rodar(**TOKENS)
        self.assertEqual(a["asaas-webhook.valid"]["status"], "fail")
        self.assertIn("http=000 ", a["asaas-webhook.valid"]["detail"] + " ")
        self.assertNotIn("000000", json.dumps(a))
        self.assertEqual(a["asaas-webhook.invalid"]["status"], "fail")

    def test_dlq_com_entrada_do_run_falha(self):
        self.sql(f"INSERT INTO webhook_dlq(source, payload) VALUES ('asaas', '{{\"healthcheck_run_id\":\"{RUN_ID}\"}}')")
        _, a = self.rodar()
        self.assertEqual(a["asaas-webhook.dlq_clean"]["status"], "fail")
        self.assertIn("dlq=1", a["asaas-webhook.dlq_clean"]["detail"])

    def test_consulta_de_dlq_que_falha_nao_vira_pass(self):
        self.sql("DROP TABLE public.webhook_dlq")
        _, a = self.rodar()
        self.assertEqual(a["asaas-webhook.dlq_clean"]["status"], "unverified")

    def test_latencia_acima_do_teto_fixture_ausente_e_auth_desconhecido(self):
        script = self.suite_propria([
            {"name": "lento", "auth": "none", "fixture": "f.json", "expect_status": 200, "invalid_status": 401,
             "max_latency_ms": -1},
            {"name": "sem-fixture", "auth": "none", "fixture": "nao-existe.json", "expect_status": 200,
             "invalid_status": 401, "max_latency_ms": 3000},
            {"name": "esquisito", "auth": "hmac", "fixture": "f.json", "expect_status": 200,
             "invalid_status": 401, "max_latency_ms": 3000},
        ])
        _, a = self.rodar(script=script)
        self.assertEqual(a["lento.valid"]["status"], "fail")
        self.assertIn("latency", a["lento.valid"]["detail"])
        self.assertNotIn("lento.invalid", a)  # auth none: sem chamada inválida
        self.assertEqual(a["sem-fixture"]["status"], "unverified")
        self.assertIn("fixture ausente", a["sem-fixture"]["detail"])
        self.assertEqual(a["esquisito"]["status"], "unverified")
        self.assertIn("auth mode desconhecido", a["esquisito"]["detail"])

    def test_persistencia_em_webhooks_log(self):
        script = self.suite_propria([{"name": "persistente", "auth": "none", "fixture": "f.json", "expect_status": 200,
                                      "invalid_status": 401, "max_latency_ms": 60000,
                                      "expect_webhooks_log_provider": "asaas"}])
        _, a = self.rodar(script=script)
        self.assertEqual(a["persistente.persisted"]["status"], "fail")
        self.sql(f"INSERT INTO webhooks_log(provider, payload) VALUES ('asaas', '{{\"healthcheck_run_id\":\"{RUN_ID}\"}}')")
        _, a = self.rodar(script=script)
        self.assertEqual(a["persistente.persisted"]["status"], "pass")
        self.assertEqual(a["persistente.dlq_clean"]["status"], "pass")

    def test_payload_do_fixture_chega_intacto(self):
        script = self.suite_propria([{"name": "eco", "auth": "none", "fixture": "f.json", "expect_status": 200,
                                      "invalid_status": 401, "max_latency_ms": 60000}])
        self.rodar(script=script)
        argv = json.loads(self.curl_log.read_text().splitlines()[0])
        corpo = json.loads(argv[argv.index("--data") + 1])
        self.assertEqual(corpo, {"evento": "x", "texto": 'tem "aspas" e $cifrao'})

    def test_env_obrigatoria(self):
        for faltando in ("RUN_ID", "OUT", "FUNCTIONS_BASE", "STAGING_DB_URL", "STAGING_ANON_KEY"):
            env = self.env(RUN_ID=RUN_ID, OUT=str(Path(self.tmp) / "o.jsonl"), FUNCTIONS_BASE="https://x")
            env[faltando] = ""
            r = subprocess.run(["bash", str(DIR / "01_webhooks.sh")], capture_output=True, text=True, env=env, timeout=30)
            self.assertNotEqual(r.returncode, 0, faltando)
            self.assertIn(faltando, r.stderr)


class TestEvents(_Base):
    def rodar(self, **extra):
        out = Path(self.tmp) / "out.jsonl"
        env = self.env(**dict({"RUN_ID": RUN_ID, "OUT": str(out)}, **extra))
        r = subprocess.run(["bash", str(DIR / "04_events.sh")], capture_output=True, text=True, env=env, timeout=120)
        return r, {l["target"]: l for l in self.jsonl(r.stdout)}

    def test_evento_publicado_e_propagado(self):
        self.sql(CONSUMIDORES)
        r, a = self.rodar()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual({t: l["status"] for t, l in a.items()},
                         {"publish.webhook_events": "pass", "propagate.n8n_dispatch_logs": "pass",
                          "propagate.alerts": "pass"})
        # id limpo: sem a tag "INSERT 0 1" que o psql sem -q acrescentava
        self.assertRegex(a["publish.webhook_events"]["detail"], r"^id=\d+$")
        self.assertEqual(self.sql("SELECT raw_payload ->> 'healthcheck_run_id' FROM webhook_events"), RUN_ID)

    def test_sem_consumidor_fica_unverified(self):
        r, a = self.rodar()
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertEqual(a["publish.webhook_events"]["status"], "pass")
        self.assertEqual(a["propagate.n8n_dispatch_logs"]["status"], "unverified")
        self.assertEqual(a["propagate.alerts"]["status"], "unverified")

    def test_insert_que_falha_emite_fail_e_para(self):
        self.sql("DROP TABLE public.webhook_events")
        r, a = self.rodar()
        self.assertEqual(r.returncode, 0)
        self.assertEqual(list(a), ["publish.webhook_events"])
        self.assertEqual(a["publish.webhook_events"]["status"], "fail")
        self.assertIn("webhook_events", a["publish.webhook_events"]["detail"])

    def test_env_obrigatoria(self):
        r, _ = self.rodar(RUN_ID="")
        self.assertNotEqual(r.returncode, 0)


class TestEstatico(unittest.TestCase):
    def test_bash_n_e_shellcheck_sem_erro(self):
        scripts = [str(DIR / n) for n in ("run.sh", "01_webhooks.sh", "04_events.sh")]
        for s in scripts:
            r = subprocess.run(["bash", "-n", s], capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr)
        if not shutil.which("shellcheck"):
            self.skipTest("shellcheck não instalado")
        r = subprocess.run(["shellcheck", "-S", "error", *scripts], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_baseline_e_fixtures_sao_json_validos_e_coerentes(self):
        baseline = json.loads((DIR / "baseline" / "expected-webhooks.json").read_text())
        self.assertGreater(len(baseline), 0)
        for item in baseline:
            for campo in ("name", "auth", "fixture", "expect_status", "invalid_status", "max_latency_ms"):
                self.assertIn(campo, item, item)
            self.assertIn(item["auth"], ("token", "none"))
            if item["auth"] == "token":
                self.assertTrue(item["token_env"] and item["token_header"], item)
            json.loads((DIR / "fixtures" / item["fixture"]).read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
