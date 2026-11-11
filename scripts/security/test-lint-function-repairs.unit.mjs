// Testes de mutação de test-lint-function-repairs.mjs: a migration real é a
// fixture sã; cada caso aplica UMA regressão numa cópia e exige a reprovação
// com a mensagem da invariante correspondente.
// Rodar: node --test scripts/security/test-lint-function-repairs.unit.mjs

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(AQUI, "test-lint-function-repairs.mjs");
const MIGRATION = join(AQUI, "../../supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql");
const SQL = readFileSync(MIGRATION, "utf8");

function gate(sql, opcoes = {}) {
  const dir = mkdtempSync(join(tmpdir(), "lint repairs "));
  try {
    const arquivo = join(dir, "migration com espaço.sql");
    writeFileSync(arquivo, sql);
    return spawnSync(process.execPath, [SCRIPT, arquivo], { encoding: "utf8", ...opcoes });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function trocar(de, para, todas = false) {
  assert.ok(SQL.includes(de), `fixture não contém o trecho a mutar: ${de}`);
  return todas ? SQL.replaceAll(de, para) : SQL.replace(de, para);
}

test("migration real aprova a partir de qualquer diretório", () => {
  for (const cwd of [join(AQUI, "../.."), AQUI, "/"]) {
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd });
    assert.equal(r.status, 0, `${cwd}: ${r.stderr}`);
    assert.match(r.stdout, /^OK: migration .*cobre os 12 reparos/);
  }
});

test("cópia íntegra em caminho com espaço aprova", () => {
  const r = gate(SQL);
  assert.equal(r.status, 0, r.stderr);
});

test("cada regressão é reprovada com a invariante certa", () => {
  const casos = [
    ["transação aberta removida", trocar("\nBEGIN;\n", "\n"), /iniciar uma transação explícita/],
    ["commit removido", trocar("\nCOMMIT;", "\n"), /concluir a transação explicitamente/],
    ["DROP FUNCTION introduzido", `${SQL}\nDROP FUNCTION public.sefaz_process_batch();\n`, /não pode remover tabela, função, tipo ou schema/],
    ["drop table em minúsculas e indentado", `${SQL}\n   drop table public.conciliacoes;\n`, /não pode remover tabela, função, tipo ou schema/],
    ["preflight removido", trocar("DO $preflight$", "DO $outro$"), /preflight transacional ausente/],
    ["enum inexistente", trocar("::public.sefaz_ambiente", "::ambiente_sefaz", true), /SEFAZ deve usar public\.sefaz_ambiente/],
    ["função some da migration", trocar("CREATE OR REPLACE FUNCTION public.watch_cron_failures(", "CREATE OR REPLACE FUNCTION public.outra("), /função ausente na migration: watch_cron_failures/],
    ["watcher vira SECURITY DEFINER", trocar("SECURITY INVOKER", "SECURITY DEFINER", true), /watcher deve permanecer SECURITY INVOKER/],
    ["ACL do overload interno sem revogação", trocar("REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid, uuid)", "-- removido"), /desfazer_conciliacao_manual deve ser explicitamente revogada/],
    ["ACL deixa de remover PUBLIC/anon", trocar("FROM PUBLIC, anon, authenticated;", "FROM authenticated;", true), /deve remover PUBLIC, anon e authenticated/],
    ["login volta a depender de UNIQUE(email)", trocar("pg_advisory_xact_lock", "pg_advisory_xact_lock /* ON CONFLICT (email) */"), /login não pode depender de UNIQUE\(email\)/],
    ["watcher volta a usar status", trocar("success IS FALSE", "WHERE status='failed'", true), /watcher deve usar success=false/],
    ["delimitador de função desbalanceado", `${SQL}\n$function$\n`, /único par de delimitadores \$function\$/],
  ];
  for (const [nome, sql, mensagem] of casos) {
    const r = gate(sql);
    assert.equal(r.status, 1, `${nome}: deveria reprovar\n${r.stdout}`);
    assert.match(r.stderr, /^Falha: \d+ invariante\(s\)/, nome);
    assert.match(r.stderr, mensagem, nome);
    assert.equal(r.stdout, "", nome);
  }
});

test("migration vazia ou ilegível reprova sem stack trace", () => {
  const vazia = gate("");
  assert.equal(vazia.status, 1);
  assert.match(vazia.stderr, /^Falha: \d+ invariante/);

  const ausente = spawnSync(process.execPath, [SCRIPT, "/caminho/que/nao/existe.sql"], { encoding: "utf8" });
  assert.equal(ausente.status, 1);
  assert.match(ausente.stderr, /^Falha: não foi possível ler a migration/);
  assert.doesNotMatch(ausente.stderr, /\n\s+at /);
});
