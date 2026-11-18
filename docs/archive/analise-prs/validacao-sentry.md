# Validação das correções de Sentry — PRs #246 e #248

**Repo:** adm01-debug/Promo_Finance_V2
**Data:** 2026-11-XX
**Modo:** somente-leitura (read-only). Nenhum código alterado.
**Método:** API GitHub (get_content por SHA/ref), diffs completos das PRs, review comments, combined status.

---

## 1. Resumo executivo

- As PRs **#246** e **#248** estão **ABERTAS e NÃO mergeadas** → **nenhum fix chegou ao `main`**.
- A **#248 substitui a #246** (título: "Substitui #246"). A #246 está `mergeable_state: behind`; a #248 `mergeable_state: blocked`.
- A #248 corrige os 5 bugs do `sentry.ts` e adiciona source maps (vite plugin) + `@sentry/vite-plugin`.
- **Nenhum segredo hardcoded** nos diffs — DSNs são lidos de variáveis de ambiente.
- Config do Sentry **parcialmente correta**: inconsistências de env (`EDGE_SENTRY_DSN` vs `SENTRY_DSN`) e `SENTRY_ENVIRONMENT` marcado `required:true`.
- Source maps: **configurados** no `vite.config.ts` da #248, mas **sem `SENTRY_ORG`/`SENTRY_PROJECT`** (upload inviável).

---

## 2. Estado das PRs

| PR | Título | Estado | Head | Base | mergeable_state |
|----|--------|--------|------|------|-----------------|
| #246 | Fecha #233 (fix sentry.ts bugs) | **ABERTA** | `Github_Copilotfix-sentry-bun-lock` | main | behind |
| #248 | Substitui #246 (fix sentry.ts + source maps) | **ABERTA** | `claude/fix-sentry-ts-261031-2138` (SHA `aabe1ed`) | main | blocked |

**Combined status do head da #248 (`aabe1ed`):** success (Vercel deploy completed; Devin Review "skipped: trial expired").

---

## 3. Classificação das correções (5 bugs do sentry.ts)

### 3.1 Bug 1 — Host do DSN hardcoded (`https://sentry.io/api/...`)
- **#246 (bugado):** endpoint fixo `https://sentry.io/api/<projectId>/store/`.
- **#248 (corrigido):** `endpointUrl: \`${u.protocol}//${u.host}/api/${projectId}/store/\`` na versão final do `sentry.ts` (SHA head `293e7ff2...`) — preserva o host real do DSN (ex.: `o123.ingest.de.sentry.io`).
- **Classificação: CORRIGIDO E VERIFICADO** (head #248). **NÃO no main.**

### 3.2 Bug 2 — `parseDsn()` sem try/catch (crash em DSN inválido)
- **#248 (corrigido):** `parseDsn()` com try/catch retornando `null` em DSN malformado.
- **Classificação: CORRIGIDO E VERIFICADO** (head #248, SHA `293e7ff2`). **NÃO no main.**

### 3.3 Bug 3 — Sem redação de dados sensíveis
- **#248 (corrigido):** `redigirTexto()` aplicado antes do envio ao Sentry (helper em `_shared/observability.ts`, já existente).
- **Classificação: CORRIGIDO E VERIFICADO** (head #248). **NÃO no main.**

### 3.4 Bug 4 — `captureException` async bloqueante (500 no n8n-callback)
- **#246 (bugado):** `await captureException(error, {...})` no `n8n-callback/index.ts`.
- **#248 (corrigido):** `captureException` retorna `void` e usa `segundoPlano(envio)` (`EdgeRuntime.waitUntil`); `n8n-callback` chama **sem await** (SHA head `14f7c665...`, ~linha 77).
- **Classificação: CORRIGIDO E VERIFICADO** (head #248). **NÃO no main** (main sem essa chamada).

### 3.5 Bug 5 — Stack sem frames (`framesDo` não exportada)
- **#246 (bugado):** `framesDo()` não exportada → `undefined` ao importar (CodeQL finding).
- **#248 (corrigido):** `export function framesDo(...)` em `edge-observability.ts` (SHA head `8f87e3e9...`, commit `aa0f506`).
- **Classificação: CORRIGIDO E VERIFICADO** (head #248). **NÃO no main** (main: `framesDo` é função local, não exportada).

---

## 4. Verificação de chegada ao `main`

| Arquivo | No main? | Evidência |
|---------|----------|-----------|
| `supabase/functions/_shared/sentry.ts` | **NÃO** | 404 Not Found |
| `vite.config.ts` (plugin Sentry) | **NÃO** | SHA `3b97f750...`, sem `@sentry/vite-plugin` |
| `package.json` (`@sentry/vite-plugin`) | **NÃO** | SHA `ac57d4cb...`, sem a devDep |
| `edge-observability.ts` (`framesDo` exportada) | **NÃO** | `framesDo` é função local |
| `n8n-callback/index.ts` (captureException sem await) | **NÃO** | SHA `1ad87b08...`, sem a chamada nova |
| `env.manifest.json` (`SENTRY_ENVIRONMENT`) | **NÃO** | SHA `96a372f4...`, sem `SENTRY_ENVIRONMENT` |
| `bun.lock` (`@sentry/vite-plugin`) | **NÃO** | SHA `c5d823b6...` |

**Conclusão: nenhum fix chegou ao `main`.**

---

## 5. Segredos hardcoded

- **Nenhum segredo hardcoded** nos diffs das PRs #246/#248.
- `sentry.ts` usa `Deno.env.get('SENTRY_DSN')`; `edge-observability.ts` usa `EDGE_SENTRY_DSN` (primary) → `SENTRY_DSN` (fallback).
- `SENTRY_AUTH_TOKEN` (vite plugin) lido de `process.env` — não hardcoded.
- **Classificação: OK (nenhum segredo).**

---

## 6. Config do Sentry — inconsistências

### 6.1 `EDGE_SENTRY_DSN` ignorado no `sentry.ts`
- `edge-observability.ts` prioriza `EDGE_SENTRY_DSN`; `sentry.ts` da #248 usa **apenas** `Deno.env.get('SENTRY_DSN')` → ignora `EDGE_SENTRY_DSN`.
- **Classificação: PARCIALMENTE CORRIGIDO** (inconsistência flagrada pelo codex P2).

### 6.2 `SENTRY_ENVIRONMENT` marcado `required:true`
- `env.manifest.json` do head: `SENTRY_ENVIRONMENT` `required:true`. Helper tem fallback `'production'` → deveria ser opcional.
- **Classificação: PARCIALMENTE CORRIGIDO** (var adicionada, flag errada — codex P2).

### 6.3 Fetch sem checar status HTTP
- `captureException` usa `.then(() => undefined)` **sem verificar `res.ok`**.
- **Classificação: PARCIALMENTE CORRIGIDO** (qodo P2).

### 6.4 Vite plugin sem `SENTRY_ORG`/`SENTRY_PROJECT`
- `vite.config.ts` do head: `sentryVitePlugin` condicional a `SENTRY_AUTH_TOKEN`, com `sourcemaps.filesToDeleteAfterUpload: ['./dist/**/*.map']` e `release`. **Sem `SENTRY_ORG`/`SENTRY_PROJECT`** → upload dos source maps inviável.
- **Classificação: PARCIALMENTE CORRIGIDO** (qodo P2).

### 6.5 Error objects do PostgREST → `[object Object]`
- Erros não normalizados antes do envio → `[object Object]` no Sentry.
- **Classificação: NÃO CORRIGIDO** (fora do escopo dos 5 bugs; codex P2).

---

## 7. Source maps

- **Configurados** no `vite.config.ts` da #248: `sentryVitePlugin` com `sourcemaps.filesToDeleteAfterUpload: ['./dist/**/*.map']` e `release: { name: process.env.VITE_APP_VERSION ?? process.env.COMMIT_SHA ?? 'dev' }`.
- `@sentry/vite-plugin ~2.22.0` em devDeps (`package.json` head SHA `4fb6b146...`).
- **Porém:** sem `SENTRY_ORG`/`SENTRY_PROJECT` o upload **não funciona**.
- **Classificação: PARCIALMENTE CORRIGIDO.**

---

## 8. Frontend (consistência)

- `src/lib/error-tracking.ts` (main, SHA `74e63b23...`): `initSentry(dsn, environment)` com `beforeSend` que redige URLs/tokens, `tracersSampleRate: 0.1`, `dataCollection.urlQueryParams: false`. Já existia no main — não faz parte das PRs.
- `VITE_SENTRY_DSN` (frontend) registrado no `env.manifest.json` (main e head) como `required:false`, consumido por `src/config/env.ts` e `src/lib/error-tracking.ts`.
- **Classificação: config frontend consistente e já presente no main.**

---

## 9. Tabela consolidada

| # | Item | Classificação | Evidência |
|---|------|---------------|-----------|
| 1 | Bug 1 — host DSN hardcoded | **CORRIGIDO E VERIFICADO** (head #248) | `sentry.ts` SHA `293e7ff2` |
| 2 | Bug 2 — parseDsn sem try/catch | **CORRIGIDO E VERIFICADO** (head #248) | `sentry.ts` SHA `293e7ff2` |
| 3 | Bug 3 — sem redação | **CORRIGIDO E VERIFICADO** (head #248) | `sentry.ts` SHA `293e7ff2` |
| 4 | Bug 4 — captureException bloqueante | **CORRIGIDO E VERIFICADO** (head #248) | `n8n-callback/index.ts` SHA `14f7c665` |
| 5 | Bug 5 — framesDo não exportada | **CORRIGIDO E VERIFICADO** (head #248) | `edge-observability.ts` SHA `8f87e3e9` |
| 6 | Chegada ao main | **NÃO CHEGOU** (PRs abertas) | sentry.ts 404 no main |
| 7 | Segredos hardcoded | **OK (nenhum)** | diffs revisados |
| 8 | `EDGE_SENTRY_DSN` ignorado | **PARCIALMENTE CORRIGIDO** | `sentry.ts` usa só `SENTRY_DSN` |
| 9 | `SENTRY_ENVIRONMENT` required:true | **PARCIALMENTE CORRIGIDO** | `env.manifest.json` head |
| 10 | Fetch sem checar status | **PARCIALMENTE CORRIGIDO** | `.then(() => undefined)` |
| 11 | Vite plugin sem org/project | **PARCIALMENTE CORRIGIDO** | `vite.config.ts` head |
| 12 | Error objects `[object Object]` | **NÃO CORRIGIDO** | não endereçado |
| 13 | Source maps | **PARCIALMENTE CORRIGIDO** | configurados, upload inviável sem org/project |

---

## 10. Conclusão e recomendação

- Os **5 bugs do `sentry.ts` estão corrigidos e verificados no head da #248** (`aabe1ed`).
- **Nenhum fix chegou ao `main`** — PRs abertas; a #248 substitui a #246.
- **Sem segredos hardcoded.**
- Config do Sentry **parcialmente correta** — 4 inconsistências (6.1–6.4).
- Source maps **configurados mas não funcionais** sem `SENTRY_ORG`/`SENTRY_PROJECT`.

**Recomendação:** mergear a #248 (substitui a #246) e, em PR separada, corrigir 6.1–6.4 para o Sentry funcionar de ponta a ponta.
