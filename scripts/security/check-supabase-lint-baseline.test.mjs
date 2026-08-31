import test from "node:test";
import assert from "node:assert/strict";
import {
  avaliarLint,
  extrairErros,
} from "./check-supabase-lint-baseline.mjs";

test("extrai errors do formato results[] do Supabase linter", () => {
  const erros = extrairErros({
    results: [
      {
        function: "public.watch_cron_failures",
        issues: [
          { level: "warning", message: "warning qualquer" },
          { level: "error", message: "column \"status\" does not exist" },
        ],
      },
    ],
  });

  assert.deepEqual(erros, [{
    function: "public.watch_cron_failures",
    message: "column \"status\" does not exist",
  }]);
});

test("aceita baseline conhecida do canônico", () => {
  const resultado = avaliarLint({
    results: [
      {
        function: "public.watch_cron_failures",
        issues: [{ level: "error", message: "column \"status\" does not exist" }],
      },
    ],
  }, 1);

  assert.equal(resultado.ok, true);
  assert.equal(resultado.exitCode, 0);
  assert.match(resultado.stdout.join("\n"), /baseline do canônico/i);
});

test("reprova erro fora da baseline", () => {
  const resultado = avaliarLint({
    results: [
      {
        function: "public.funcao_nova",
        issues: [{ level: "error", message: "falha inesperada" }],
      },
    ],
  }, 1);

  assert.equal(resultado.ok, false);
  assert.equal(resultado.exitCode, 1);
  assert.match(resultado.stderr.join("\n"), /fora da baseline/i);
});
