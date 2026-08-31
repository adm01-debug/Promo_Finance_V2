#!/usr/bin/env node

import { readFile } from "node:fs/promises";

export const BASELINE_ERRORS = new Set([
  "public.sefaz_process_batch::type \"ambiente_sefaz\" does not exist",
  "public.claim_frontend_error_alerts::there is no unique or exclusion constraint matching the ON CONFLICT specification",
  "public.is_country_allowed_for_login::column \"is_active\" does not exist",
  "public.get_catalogos_tributarios_health::column \"invariante\" does not exist",
  "public.increment_failed_attempts::there is no unique or exclusion constraint matching the ON CONFLICT specification",
  "public.silenciar_alerta_erro_frontend::there is no unique or exclusion constraint matching the ON CONFLICT specification",
  "public.capture_index_usage_snapshot::there is no unique or exclusion constraint matching the ON CONFLICT specification",
  "public.confirmar_conciliacao::column \"confirmado_por\" of relation \"conciliacoes\" does not exist",
  "public.confirmar_conciliacao_manual::column \"updated_at\" of relation \"transacoes_bancarias\" does not exist",
  "public.desfazer_conciliacao_manual::column \"updated_at\" of relation \"transacoes_bancarias\" does not exist",
  "public.is_ip_allowed_for_login::operator does not exist: text = inet",
  "public.watch_cron_failures::column \"status\" does not exist",
]);

export function normalizarErro(funcao, mensagem) {
  return `${String(funcao || "desconhecida")}::${String(mensagem || "erro sem detalhe")}`;
}

export function extrairErros(payload) {
  if (Array.isArray(payload)) {
    return payload
      .filter((item) => String(item?.level || "").toLowerCase() === "error")
      .map((item) => ({
        function: item.name || item.function || "desconhecida",
        message: item.description || item.message || "erro sem detalhe",
      }));
  }

  if (payload && typeof payload === "object" && Array.isArray(payload.results)) {
    return payload.results.flatMap((routine) =>
      (routine.issues || [])
        .filter((issue) => String(issue?.level || "").toLowerCase() === "error")
        .map((issue) => ({
          function: routine.function || "desconhecida",
          message: issue.message || "erro sem detalhe",
        }))
    );
  }

  throw new Error("JSON do Supabase linter fora do formato esperado.");
}

export function avaliarLint(payload, exitCode = 0) {
  const erros = extrairErros(payload);

  if (erros.length === 0) {
    if (exitCode !== 0) {
      return {
        ok: false,
        exitCode,
        stdout: [],
        stderr: ["::error::Supabase linter falhou sem reportar ERROR estruturado."],
      };
    }

    return {
      ok: true,
      exitCode: 0,
      stdout: ["✅ Supabase linter sem ERRORs."],
      stderr: [],
    };
  }

  const encontrados = new Set(
    erros.map((erro) => normalizarErro(erro.function, erro.message)),
  );
  const inesperados = erros.filter((erro) =>
    !BASELINE_ERRORS.has(normalizarErro(erro.function, erro.message))
  );

  if (inesperados.length > 0) {
    return {
      ok: false,
      exitCode: exitCode || 1,
      stdout: [],
      stderr: [
        "::error::Supabase linter detectou ERROR(s) fora da baseline conhecida do canônico.",
        ...inesperados.map((erro) => `- [${erro.function}] ${erro.message}`),
      ],
    };
  }

  const resolvidos = [...BASELINE_ERRORS].filter((item) => !encontrados.has(item));
  const stdout = [
    `⚠️ Supabase linter retornou ${erros.length} ERROR(s), todos já conhecidos na baseline do canônico.`,
    ...erros.map((erro) => `- [${erro.function}] ${erro.message}`),
  ];

  if (resolvidos.length > 0) {
    stdout.push(
      "✅ Itens da baseline que não apareceram nesta execução:",
      ...resolvidos.map((item) => `- ${item}`),
    );
  }

  return {
    ok: true,
    exitCode: 0,
    stdout,
    stderr: [],
  };
}

async function main() {
  const [arquivoLint, exitCodeBruto = "0"] = process.argv.slice(2);
  if (!arquivoLint) {
    console.error(
      "Uso: node scripts/security/check-supabase-lint-baseline.mjs <lint.json> [exit_code]",
    );
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(await readFile(arquivoLint, "utf8"));
  } catch (error) {
    console.error(`::error::Falha ao ler/parsing ${arquivoLint}: ${error.message}`);
    process.exit(1);
  }

  let resultado;
  try {
    resultado = avaliarLint(payload, Number.parseInt(exitCodeBruto, 10) || 0);
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exit(Number.parseInt(exitCodeBruto, 10) || 1);
  }

  for (const linha of resultado.stdout) console.log(linha);
  for (const linha of resultado.stderr) console.error(linha);
  process.exit(resultado.exitCode);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
