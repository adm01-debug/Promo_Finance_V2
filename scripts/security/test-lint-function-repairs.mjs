#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = resolve(
  process.argv[2] ??
    "supabase/migrations/20260831153000_corrigir_12_erros_lint_funcoes.sql",
);
const sql = readFileSync(migrationPath, "utf8");
const falhas = [];
const functionBlocks =
  sql.match(/^CREATE OR REPLACE FUNCTION public\./gm)?.length ?? 0;

function exigir(condicao, mensagem) {
  if (!condicao) falhas.push(mensagem);
}

function contem(texto, trecho, mensagem) {
  exigir(texto.includes(trecho), mensagem);
}

function naoContem(texto, trecho, mensagem) {
  exigir(!texto.includes(trecho), mensagem);
}

function corpo(nome) {
  const inicio = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${nome}(`);
  exigir(inicio >= 0, `função ausente na migration: ${nome}`);
  if (inicio < 0) return "";

  const fim = sql.indexOf("\n$function$;", inicio);
  exigir(fim >= 0, `delimitador final ausente na função: ${nome}`);
  return fim < 0 ? sql.slice(inicio) : sql.slice(inicio, fim + 12);
}

function atualizacao(texto, tabela, marcadorFinal) {
  const inicio = texto.indexOf(`UPDATE public.${tabela}`);
  exigir(inicio >= 0, `UPDATE de ${tabela} ausente`);
  if (inicio < 0) return "";
  const fim = texto.indexOf(marcadorFinal, inicio);
  exigir(fim >= 0, `fim do UPDATE de ${tabela} não encontrado`);
  return fim < 0 ? texto.slice(inicio) : texto.slice(inicio, fim);
}

const nomes = [
  "sefaz_process_batch",
  "claim_frontend_error_alerts",
  "silenciar_alerta_erro_frontend",
  "capture_index_usage_snapshot",
  "increment_failed_attempts",
  "is_country_allowed_for_login",
  "is_ip_allowed_for_login",
  "get_catalogos_tributarios_health",
  "confirmar_conciliacao",
  "confirmar_conciliacao_manual",
  "desfazer_conciliacao_manual",
  "watch_cron_failures",
];

const funcoes = Object.fromEntries(nomes.map((nome) => [nome, corpo(nome)]));

exigir(/^BEGIN;$/m.test(sql), "migration deve iniciar uma transação explícita");
exigir(/^COMMIT;$/m.test(sql), "migration deve concluir a transação explicitamente");
contem(sql, "DO $preflight$", "preflight transacional ausente");
contem(sql, "DO $postflight$", "postflight transacional ausente");
contem(
  sql,
  "_pf_lint_function_contract_before",
  "snapshot de contratos/ACLs ausente",
);
exigir(
  !/^\s*DROP\s+(TABLE|FUNCTION|TYPE|SCHEMA)\b/im.test(sql),
  "migration não pode remover tabela, função, tipo ou schema",
);

for (const tag of ["$preflight$", "$indexes$", "$postflight$", "$claim_sql$"]) {
  exigir(sql.split(tag).length - 1 === 2, `delimitador ${tag} deve ocorrer exatamente 2 vezes`);
}
exigir(
  sql.split("$function$").length - 1 === functionBlocks * 2,
  "cada bloco CREATE OR REPLACE FUNCTION deve ter um único par de delimitadores $function$",
);
exigir(functionBlocks >= nomes.length, "migration deve conter todos os blocos de função esperados");

const aclStatements = sql.match(/^\s*(REVOKE|GRANT)\b/gm) ?? [];
exigir(
  aclStatements.length === 4,
  "migration deve limitar ACLs apenas aos dois overloads internos de conciliação",
);
contem(
  sql,
  "REVOKE EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric)",
  "ACL do overload interno confirmar_conciliacao_manual deve ser explicitamente revogada",
);
contem(
  sql,
  "GRANT EXECUTE ON FUNCTION public.confirmar_conciliacao_manual(uuid, uuid, uuid, uuid, numeric)",
  "ACL do overload interno confirmar_conciliacao_manual deve ser reatribuída apenas ao service_role",
);
contem(
  sql,
  "REVOKE EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid, uuid)",
  "ACL do overload interno desfazer_conciliacao_manual deve ser explicitamente revogada",
);
contem(
  sql,
  "GRANT EXECUTE ON FUNCTION public.desfazer_conciliacao_manual(uuid, uuid)",
  "ACL do overload interno desfazer_conciliacao_manual deve ser reatribuída apenas ao service_role",
);
contem(
  sql,
  "FROM PUBLIC, anon, authenticated;",
  "ACL dos overloads internos deve remover PUBLIC, anon e authenticated",
);
contem(
  sql,
  "TO service_role;",
  "ACL dos overloads internos deve conceder execução apenas ao service_role",
);

contem(
  sql,
  "TABLE(tabela text, registros bigint, status text)",
  "preflight deve aceitar o contrato compacto canônico",
);
contem(
  sql,
  "TABLE(invariante text, severidade text, afetados bigint, detalhe text)",
  "preflight deve aceitar o contrato detalhado do replay",
);
contem(
  sql,
  "pg_get_indexdef(i.indexrelid, 1, true) = 'assinatura'",
  "índice de assinatura deve validar exatamente sua primeira chave",
);
contem(
  sql,
  "pg_get_indexdef(i.indexrelid, 3, true) = 'index_name'",
  "índice de snapshots deve validar exatamente suas três chaves",
);
contem(sql, "i.indpred IS NULL", "índices de UPSERT não podem ser parciais");
contem(sql, "i.indexprs IS NULL", "índices de UPSERT não podem ser por expressão");

contem(
  funcoes.sefaz_process_batch,
  "::public.sefaz_ambiente",
  "SEFAZ deve usar public.sefaz_ambiente",
);
naoContem(
  funcoes.sefaz_process_batch,
  "::ambiente_sefaz",
  "SEFAZ não pode usar o enum inexistente ambiente_sefaz",
);

for (const nome of ["claim_frontend_error_alerts", "silenciar_alerta_erro_frontend"]) {
  contem(funcoes[nome], "signature, assinatura", `${nome} deve cobrir a coluna legada signature`);
  contem(funcoes[nome], "ON CONFLICT (assinatura)", `${nome} deve usar a chave única assinatura`);
  contem(
    funcoes[nome],
    "information_schema.columns",
    `${nome} deve ser compatível com replay sem signature`,
  );
}

contem(
  funcoes.capture_index_usage_snapshot,
  "ON CONFLICT (snapshot_date, schema_name, index_name)",
  "snapshot deve usar a chave natural completa",
);

naoContem(
  funcoes.increment_failed_attempts,
  "ON CONFLICT (email)",
  "login não pode depender de UNIQUE(email)",
);
contem(
  funcoes.increment_failed_attempts,
  "pg_advisory_xact_lock",
  "login deve serializar concorrência por email",
);
contem(
  funcoes.increment_failed_attempts,
  "lower(btrim(email)) = v_email",
  "login deve sincronizar duplicatas ignorando caixa/espaços",
);
naoContem(
  funcoes.increment_failed_attempts,
  "DELETE FROM public.login_attempts",
  "login não pode apagar histórico duplicado",
);

naoContem(funcoes.is_country_allowed_for_login, "is_active", "país não pode usar is_active");
contem(
  funcoes.is_country_allowed_for_login,
  "to_jsonb(ac)->>'enabled'",
  "país deve aceitar o fallback enabled sem quebrar replay",
);
naoContem(funcoes.is_ip_allowed_for_login, "is_active", "IP não pode usar is_active");
contem(funcoes.is_ip_allowed_for_login, "pg_input_is_valid", "IP textual deve ser validado");
contem(funcoes.is_ip_allowed_for_login, ">>= _ip", "IP deve respeitar redes CIDR");

contem(
  funcoes.get_catalogos_tributarios_health,
  "SELECT to_jsonb(c)",
  "saúde fiscal deve normalizar o contrato do validador",
);
contem(
  funcoes.get_catalogos_tributarios_health,
  "v_registro ? 'tabela'",
  "saúde fiscal deve reconhecer o contrato compacto",
);
naoContem(
  funcoes.get_catalogos_tributarios_health,
  "c.invariante",
  "saúde fiscal não pode referenciar coluna ausente diretamente",
);

const conciliacao = atualizacao(funcoes.confirmar_conciliacao, "conciliacoes", "WHERE id = p_conciliacao_id;");
naoContem(conciliacao, "confirmado_por", "conciliacoes não possui confirmado_por");
naoContem(conciliacao, "confirmado_em", "conciliacoes não possui confirmado_em");
naoContem(conciliacao, "updated_at", "conciliacoes não possui updated_at");

for (const nome of ["confirmar_conciliacao_manual", "desfazer_conciliacao_manual"]) {
  contem(funcoes[nome], "ue.ativo IS TRUE", `${nome} deve exigir vínculo ativo`);
  const updateTransacao = atualizacao(
    funcoes[nome],
    "transacoes_bancarias",
    "WHERE id = p_transacao_id;",
  );
  naoContem(updateTransacao, "updated_at", `${nome} não pode atualizar coluna inexistente`);
  contem(updateTransacao, "conciliada", `${nome} deve manter a flag conciliada coerente`);
}

naoContem(funcoes.watch_cron_failures, "WHERE status=", "watcher não pode usar status inexistente");
contem(funcoes.watch_cron_failures, "success IS FALSE", "watcher deve usar success=false");

for (const [nome, definicao] of Object.entries(funcoes)) {
  if (nome === "watch_cron_failures") {
    contem(definicao, "SECURITY INVOKER", "watcher deve permanecer SECURITY INVOKER");
  } else {
    contem(definicao, "SECURITY DEFINER", `${nome} deve permanecer SECURITY DEFINER`);
  }
}

if (falhas.length > 0) {
  console.error(`Falha: ${falhas.length} invariante(s) estática(s) não atendida(s):`);
  for (const falha of falhas) console.error(`- ${falha}`);
  process.exit(1);
}

console.log(
  `OK: migration ${migrationPath} cobre os 12 reparos sem drift destrutivo ou de ACL.`,
);
