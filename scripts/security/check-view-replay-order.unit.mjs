// Cenários de check-view-replay-order.mjs: cada caso monta uma pasta de
// migrations em diretório temporário e roda o gate como o CI (`node <script> <dir>`).
// Rodar: node --test scripts/security/check-view-replay-order.unit.mjs

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "check-view-replay-order.mjs");

const TABELA = "CREATE TABLE public.pagamentos (\n  id uuid PRIMARY KEY,\n  valor numeric\n);\n";
const COLUNA = "ALTER TABLE public.pagamentos ADD COLUMN tipo text;\n";
const VIEW = "CREATE VIEW v AS SELECT pc.tipo FROM public.pagamentos pc;\n";

function gate(arquivos, args) {
  const dir = mkdtempSync(join(tmpdir(), "view replay "));
  try {
    for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(dir, nome), conteudo);
    return spawnSync(process.execPath, [SCRIPT, ...(args ?? [dir])], { encoding: "utf8" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const viewAntes = (view, coluna = COLUNA) => ({ "001_t.sql": TABELA, "002_v.sql": view, "003_c.sql": coluna });

test("aprova quando a coluna nasce antes da view", () => {
  const r = gate({ "001_t.sql": TABELA, "002_c.sql": COLUNA, "003_v.sql": VIEW });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^OK:/);
});

test("reprova view que referencia coluna criada depois, em variações de escrita", () => {
  const casos = {
    "alias simples": VIEW,
    "alias com AS e minúsculas": "create or replace view v as select pc.tipo from pagamentos as pc;\n",
    "JOIN": "CREATE VIEW v AS SELECT x.id FROM outra x JOIN public.pagamentos pc ON pc.id = x.id WHERE pc.tipo IS NOT NULL;\n",
    "materialized view": "CREATE MATERIALIZED VIEW v AS SELECT pc.tipo FROM public.pagamentos pc;\n",
    "com security_invoker": "CREATE VIEW v WITH (security_invoker = true) AS SELECT pc.tipo FROM public.pagamentos pc;\n",
    "quebra de linha e CRLF": "CREATE VIEW v AS\r\nSELECT pc.tipo\r\nFROM public.pagamentos pc;\r\n",
    // Regressões: estas três formas escapavam do gate.
    "tabela sem alias": "CREATE VIEW v AS SELECT pagamentos.tipo FROM public.pagamentos WHERE pagamentos.valor > 0;\n",
    "tabela sem alias no fim": "CREATE VIEW v AS SELECT pagamentos.tipo FROM pagamentos;\n",
    "identificadores entre aspas": 'CREATE VIEW "v" AS SELECT pc."tipo" FROM "public"."pagamentos" pc;\n',
  };
  for (const [nome, view] of Object.entries(casos)) {
    const r = gate(viewAntes(view));
    assert.equal(r.status, 1, `${nome}: ${r.stdout}`);
    assert.match(r.stderr, /pagamentos\.tipo\s+→\s+criada em 003_c\.sql/, nome);
    assert.match(r.stderr, /002_v\.sql :: v/, nome);
  }
});

test("indexa a coluna nas formas válidas de ALTER TABLE e CREATE TABLE", () => {
  const casos = {
    "ADD COLUMN IF NOT EXISTS em minúsculas": "alter table pagamentos\n  add column if not exists tipo text;\n",
    // Regressão: `COLUMN` é opcional no Postgres e a forma curta não era indexada.
    "ADD sem COLUMN": "ALTER TABLE public.pagamentos ADD tipo text;\n",
    "duas colunas no mesmo ALTER": "ALTER TABLE public.pagamentos ADD COLUMN outra int, ADD COLUMN tipo text;\n",
    "tabela entre aspas": 'ALTER TABLE "public"."pagamentos" ADD COLUMN "tipo" text;\n',
  };
  for (const [nome, coluna] of Object.entries(casos)) {
    assert.equal(gate(viewAntes(VIEW, coluna)).status, 1, nome);
  }
  const tabelaDepois = gate({
    "001_v.sql": "CREATE VIEW v AS SELECT n.x FROM public.nova n;\n",
    "002_t.sql": "CREATE TABLE IF NOT EXISTS public.nova (\n  x int\n);\n",
  });
  assert.equal(tabelaDepois.status, 1);
});

test("ADD CONSTRAINT e afins não viram coluna", () => {
  const r = gate({
    "001_t.sql": TABELA,
    "002_v.sql": "CREATE VIEW v AS SELECT pc.constraint, pc.primary, pc.valor FROM public.pagamentos pc;\n",
    "003_c.sql": "ALTER TABLE public.pagamentos ADD CONSTRAINT c CHECK (valor > 0), ADD PRIMARY KEY (id);\n",
  });
  assert.equal(r.status, 0, r.stderr);
});

test("não reprova view guardada nem comentada", () => {
  const casos = {
    "guard DO $$": `DO $$ BEGIN IF EXISTS (SELECT 1) THEN EXECUTE $view$ ${VIEW.trim()} $view$; END IF; END $$;\n`,
    // Regressões: guard com tag nomeada e CREATE VIEW dentro de comentário eram falso vermelho.
    "guard DO $guard$": `DO $guard$ BEGIN IF EXISTS (SELECT 1) THEN EXECUTE $view$ ${VIEW.trim()} $view$; END IF; END $guard$;\n`,
    "comentário de linha": `-- ${VIEW}SELECT 1;\n`,
    "comentário de bloco": `/*\n${VIEW}*/\nSELECT 1;\n`,
  };
  for (const [nome, view] of Object.entries(casos)) {
    const r = gate(viewAntes(view));
    assert.equal(r.status, 0, `${nome}: ${r.stderr}`);
  }
});

test("coluna criada na mesma migration ou nunca indexada não é acusada", () => {
  assert.equal(gate({ "001_t.sql": TABELA, "002_v.sql": COLUNA + VIEW }).status, 0);
  assert.equal(gate({ "001_t.sql": TABELA, "002_v.sql": VIEW }).status, 0);
});

test("pasta vazia ou inexistente não vira OK", () => {
  const vazia = gate({ "LEIAME.md": "x" });
  assert.equal(vazia.status, 1);
  assert.match(vazia.stderr, /Nenhuma migration encontrada/);
  const inexistente = gate({}, ["/caminho/que/nao/existe"]);
  assert.notEqual(inexistente.status, 0);
  assert.doesNotMatch(inexistente.stdout, /OK:/);
});

test("migrations reais do repositório aprovam", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: "/" });
  assert.equal(r.status, 0, r.stderr);
});
