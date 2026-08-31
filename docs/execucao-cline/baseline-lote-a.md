# Lote A — Baseline Pré-Etapas (Plano 100 Etapas)

> **Data de captura:** 2026-08-30
> **Executor:** Cline (handoff: `docs/migracao/HANDOFF_CLINE_EXECUCAO_PENDENCIAS_PLANO_100_ETAPAS_2026-08-30.md`)
> **Ref base:** `5093a727` (== `origin/main` no momento da captura)
> **Branch de trabalho:** `fix/cline-h096562-lote-a-baseline` (worktree `chat-h096562`)

Este documento congela o estado do repositório **antes** da execução dos PRs do
Plano 100 Etapas. Ele serve como ponto de comparação ("antes/depois") para cada PR.

---

## 1. Inventário do repositório

| Métrica | Valor | Comando / fonte |
| --- | --- | --- |
| Arquivos rastreados (git) | **2799** | `git ls-files \| wc -l` |
| Diretórios em `supabase/functions/` | **104** (103 funções + `_shared`) | `ls -d supabase/functions/*/` |
| Stanzas `[functions.*]` em `supabase/config.toml` | **103** | `grep -c '^\[functions\.' supabase/config.toml` |
| Função **Lalamove** | **ausente** (fora de escopo — ADR-001) | busca no repo |
| Função **api-keys-manage** | **ausente da main** — existe apenas como referência histórica em `graphify-out/GRAPH_REPORT.md` | listagem local + API GitHub (404) |
| Workflows no repo | **4 arquivos** (`ci.yml`, `deno-tests.yml`, `staging-migrate.yml`, `supabase-linter.yml`) | `ls .github/workflows/` |
| Workflows ativos na API GitHub | 6 (4 do repo + Copilot + Dependabot, gerados por apps) | `GET /repos/.../actions/workflows` |

> ⚠️ **Nota de segurança:** o inventário inclui `migrate-helper`, cuja remoção é o
> alvo do PR #1. Após o merge do PR #1, os números esperados passam a ser
> **102 funções + `_shared`** e **102 stanzas**.

## 2. Baseline de testes (todas as execuções concluídas)

| Suíte | Comando | Resultado | Exit |
| --- | --- | --- | --- |
| Vitest (completo) | `npx vitest run` | **204 arquivos / 2689 testes — 100% pass** (≈16,6s) | 0 |
| Deno — receita de CI | `deno test --allow-env --allow-net --allow-read --no-check <12 arquivos do deno-tests.yml>` | **86 passed (3 steps) / 0 failed** | 0 |
| Deno — irrestrito | `deno test -A supabase/functions/` | **falha na coleta** (ambiental): `Could not find "@supabase/supabase-js" in a node_modules folder` em `conciliacao-proxy/index.ts` — não é regressão de teste | 1 |
| Dependências | `npm ci` | OK (apenas warnings de `allow-scripts`) | 0 |

Logs brutos preservados (máquina local): `/tmp/vitest_baseline.log`,
`/tmp/deno_ci_recipe.log`, `/tmp/deno_test_baseline.log`, `/tmp/npm_ci_baseline.log`,
`/tmp/baseline_lote_a.txt`.

**Conclusão do Lote A:** o estado da main é **verde** nas suítes oficiais de CI
(Vitest + receita Deno do workflow). A falha do `deno test -A` irrestrito é um
problema conhecido de resolução de `node_modules` no ambiente local e não
bloqueia os PRs — o gate oficial é a receita do `deno-tests.yml`.

## 3. Findings de segurança (entrada para os PRs)

| # | Severidade | Achado | Ação |
| --- | --- | --- | --- |
| F1 | 🔴 crítica | `supabase/functions/migrate-helper/index.ts` expõe `action=credentials` que devolve `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL` protegidos apenas por `ACCESS_KEY` hardcoded (`const ACCESS_KEY = "94c9..."`, linha 5). Stanza `[functions.migrate-helper] verify_jwt = false` em `config.toml` (linhas 313–314). | **PR #1** — remover função + stanza. ⚠️ A chave está no histórico git ⇒ **rotacionar** `SUPABASE_SERVICE_ROLE_KEY`/senha do DB (nomes apenas — decisão registrada na MATRIZ_DECISOES). |
| F2 | 🟠 alta | `scripts/mcp-phd-suite.mjs:13` — token MCP embutido como fallback: `DEFAULT_TOKEN = process.env.MCP_TOKEN \|\| 'eTBf...'`. | **PR #1** — remover literal, exigir `MCP_TOKEN` via env (fail-fast). ⚠️ Rotacionar o token do worker MCP. |
| F3 | 🟡 média | 3 migrations aplicadas com **anon keys** JWT hardcoded em chamadas `pg_net`/`pg_cron`: `20260712194415_...sql:18`, `20260726180529_...sql:11`, `20260728183119_...sql:17`. | **Não reescrever** migrations aplicadas (quebraria checksum do ledger `supabase_migrations`). Documentar; avaliar rotação da anon key e adotar padrão Vault/`integration_secrets` nas próximas (a migration `20260726180529` já usa esse padrão para o cron-secret). |

Varredura executada com `git grep` (o `search_codebase` da IDE estava com índice
parcial — 2743 de 2799 arquivos — e foi substituído por grep confiável):

- `eyJhbGciOi` (JWTs): apenas as 3 migrations do F3.
- Literais `*_KEY/TOKEN/SECRET/PASSWORD = '<16+ chars>'` em `scripts/`, `src/`,
  `supabase/functions/`: **apenas** o `ACCESS_KEY` do F1.
- `.env*` rastreados: apenas `.env.example` (sem valores reais).

## 4. Gates de CI relevantes para os PRs

- **`ci.yml` (quality-gate):** bun install, `bun audit` (warning), guard de
  isolamento de secret externo, **zod-coverage gate** (`scripts/security/zod-coverage.sh`
  — enumera diretórios dinamicamente; remoção de função não regride o baseline),
  `bun run lint`, steps SQL condicionados a `secrets.DATABASE_URL`.
- **`ci.yml` (e2e):** Playwright chromium em 3 shards (roda em PRs para main).
- **`deno-tests.yml`:** duas invocações de `deno test` (12 arquivos explícitos).
- **`supabase-linter.yml`:** dispara em mudanças em `supabase/**`; pula com warning
  se `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF` estiverem ausentes.
- **`staging-migrate.yml`:** fluxo de staging (não acionado pelos PRs desta leva).

## 5. Sequência de execução (conforme handoff)

- [x] **Lote A** — baseline capturado (este documento).
- [ ] **PR #1** — `chore(security): remover migrate-helper + eliminar credenciais embedded` (F1 + F2).
- [ ] PRs seguintes conforme MATRIZ_DECISOES / plano (Lote B: testes de
      `webhook-retry-worker`, mapeamento ADR-002, auditoria de requisitos, etc.).
- [ ] **Fora do repo (ação do dono):** rotação das credenciais expostas (F1/F2) e
      avaliação da anon key (F3) — apenas nomes das variáveis, nunca valores.

---

<details>
<summary>Listagem completa dos 104 diretórios de <code>supabase/functions/</code> no baseline</summary>

```
_shared aceitar-convite analise-fluxo-ia analise-preditiva analyze-document
asaas-proxy asaas-webhook benchmarking-setorial bitrix24-sync bitrix24-webhook
bling-proxy bling-webhook calcular-health-score-operacional
calcular-slo-metrics-diario calculo-iva categorizar-despesa
ci-security-gate-log cnpja-lookup comparar-benchmark-setorial compare-schemas
conciliacao-ia conciliacao-proxy consulta-tributaria contabilizar-evento
convidar-contador copilot-global copilot-tributario decidir-regime
detectar-anomalias-financeiras digest-silenciamentos-erro enviar-alerta-email
enviar-bitrix24-tributario enviar-convite-organizacao
enviar-digest-conformidade enviar-relatorios-tributarios-agendados
executar-analise-preditiva executar-fechamento-tributario
executar-regua-cobranca executar-relatorios expert-agent
exportar-sped-contribuicoes external-data gerar-acoes-recomendadas
gerar-alertas gerar-alertas-dispatcher gerar-alertas-tributarios
gerar-dre-tributaria gerar-heatmap-tributario gerar-pacote-evidencias
gerar-pdf-tributario gerar-relatorio-anual gerar-resumo-executivo-semanal
gerar-resumo-financeiro-diario gerar-snapshots-conformidade gerar-sped-ecd
gerar-sped-ecf get-mapbox-token get-vapid-key health insights-relatorio
log-sped-bitrix24 mcp-query migrate-helper monitorar-erros-frontend
n8n-callback n8n-dispatch nfe-upload-certificado nfe-vinculo-proxy
notify-performance-alert notify-saved-filter open-finance
overlay-rejeicoes-auditoria prever-carga-tributaria processar-fila-cobrancas
processar-nf-ocr processar-solicitacao-lgpd projecao-reforma
relatorio-diario-anomalias scim-server sefaz-dfe-dispatcher sefaz-dfe-puxar
sefaz-manifestar send-device-alert send-push-notification simular-presumido
simular-real simular-simples sincronizar-anomalia-bitrix24 sso-callback
sso-generate-metadata sso-initiate sso-logout sso-test-login
sso-validate-config sync-profile-to-bitrix validar-token-contador
validate-ip-geo verificar-conformidade-fiscal webhook-replay
webhook-retry-worker webhook-simulator whatsapp-ai-analyzer
whatsapp-ia-proativo whatsapp-webhook
```
</details>
