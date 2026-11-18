# Validação Exaustiva — Síntese Consolidada

> Consolidator: sessão de consolidação da validação exaustiva.
> Data: 2026-11-07 (deploy produção sha `c3efb8d9`).
> Fontes: 4 relatórios de validação (crons, DDL/migrations, Sentry, frontend) cruzados com `analise-prs/auditorias-anteriores.md`.
> Escopo: **somente síntese documental. Nenhum código de produção foi alterado.**

## Classificação de status (vocabulário)

| Status | Significado |
|--------|-------------|
| CONFIRMADO E PENDENTE | Achado real, ainda não corrigido |
| CORRIGIDO E VERIFICADO | Corrigido e comprovado (evidência) |
| PARCIALMENTE CORRIGIDO | Parte corrigida, parte pendente |
| REINTRODUZIDO | Corrigido antes, voltou a ocorrer |
| SUPERADO | Não se aplica mais (entregue por outra via / fechado sem merge) |
| DUPLICADO | Já reportado em outra auditoria |
| CONTRADITÓRIO | Documentação vs. realidade divergem |
| NÃO VERIFICADO | Sem evidência suficiente |

---

## 1. Crons (#234 / #240 / #131)

| Achado | Status | Evidência |
|--------|--------|-----------|
| #234 QoS `*/30` | CONFIRMADO E PENDENTE | 31 jobs ativos em produção |
| #240 migration `monitor_health_cron` | CONFIRMADO E PENDENTE | migration NÃO aplicada no banco |
| #240 segredo `monitor_health_cron` | CONFIRMADO E PENDENTE | AUSENTE em `integration_secrets` — bloqueia primeiro disparo (401) |
| #240 função `monitor-health` | CONFIRMADO E PENDENTE | não deployada (404) |
| #240 PR out-of-date | CONFIRMADO E PENDENTE | PR 6 commits atrás de `main` |
| #131 stubs cron `ON CONFLICT DO UPDATE` | DUPLICADO (parcial) | Preview-only; duplicado de auditoria anterior |
| #131 CI `bun audit` | SUPERADO (fora de escopo) | fora do escopo da validação de crons |

---

## 2. DDL / Migrations (#235 / #238 / #243)

> Nota: o arquivo `analise-prs/validacao-ddl-migrations.md` não foi localizado em nenhum worktree; o conteúdo abaixo usa o resumo do coordenador.

| Achado | Status | Evidência |
|--------|--------|-----------|
| #235 steps 12/13/14/19/21/23 | CORRIGIDO E VERIFICADO | aplicados e verificados |
| #235 steps 15/16 (FK indexes) | CONFIRMADO E PENDENTE | `pg_indexes` retorna 0 para `idx_contas_pagar_empresa_id`, `idx_contas_receber_empresa_id`, `idx_movimentacoes_empresa_id`, `idx_boletos_empresa_id`, `idx_clientes_empresa_id` |
| #235 migrations 20300/20400 | CONFIRMADO E PENDENTE | não rastreadas |
| #238 4 "APLICAR" | SUPERADO | objetos já existem no banco |
| #238 2 "REGISTRAR" | CORRIGIDO E VERIFICADO | rastreados |
| #238 Grupo B (15 RLS cross-tenant 20260902) | PARCIALMENTE CORRIGIDO | policies presentes, mas nenhuma migration rastreada |
| #243 batches 001-005 | CORRIGIDO E VERIFICADO | rastreados; amostra 14 índices = 0 existem |
| #243 arquivo versionado `20261101140000` | CONTRADITÓRIO | typos (`DROP INDEX IF EXISTpublic...`, `psblic.frontend_error_logs_2026_10_*`) tornam o arquivo inválido — corrigir o arquivo |

---

## 3. Sentry (#246 / #248)

> #246/#248 abertas, nenhum fix no `main`; #248 substitui #246. Verificado no head da #248 (SHA `aabe1ed`).

| Achado | Status | Evidência |
|--------|--------|-----------|
| 5 bugs do `sentry.ts` (host DSN preservado, `parseDsn` try/catch, `redigirTexto`, `captureException` não-bloqueante, `framesDo` exportada) | CORRIGIDO E VERIFICADO (no head #248) | SHA `aabe1ed`; **não está no `main`** |
| Sem segredos hardcoded | CORRIGIDO E VERIFICADO | verificado no head #248 |
| Config: `EDGE_SENTRY_DSN` ignorado | PARCIALMENTE CORRIGIDO | pendente |
| Config: `SENTRY_ENVIRONMENT required:true` indevido | PARCIALMENTE CORRIGIDO | pendente |
| Config: `fetch` sem checar status HTTP | PARCIALMENTE CORRIGIDO | pendente |
| Config: source maps sem `SENTRY_ORG`/`SENTRY_PROJECT` | PARCIALMENTE CORRIGIDO | pendente |
| Combined status head #248 | CORRIGIDO E VERIFICADO | success (Vercel OK) |

---

## 4. Frontend (#237 / #226 / #225)

| Achado | Status | Evidência |
|--------|--------|-----------|
| #237 banner `AcordoParcelamentoDialog.tsx:179-186` | CORRIGIDO E VERIFICADO | merged `c464deb2`; integrado em `Cobrancas.tsx` |
| #237 `throw` em `app-url.ts` | CORRIGIDO E VERIFICADO | merged `c464deb2` |
| #237 guard `asaas-proxy/index.ts:753` | CORRIGIDO E VERIFICADO | merged `c464deb2` |
| #226 | SUPERADO | fechado sem merge; entregue via #247 merged `309ee321` |
| #226 `SECURITY_RULES.md` documenta papel `admin_global` | CONTRADITÓRIO | papel real no banco é `admin`; `admin_global` não existe |
| #225 | SUPERADO | fechado sem merge; entregue via commit `dca65c5a` "Substitui #227" |
| #225 Prettier | SUPERADO | sem pendência |
| Deploy produção 07/11 | CORRIGIDO E VERIFICADO | success (sha `c3efb8d9`) |
| Deploy edge functions no Supabase | NÃO VERIFICADO | sem evidência |
| Risco: `admin_global` no guard `asaas-proxy` e `SECURITY_RULES.md` | CONTRADITÓRIO | permissão documentada inefetiva (papel não existe no banco) |

---

## 5. Cruzamento com auditorias anteriores

| Achado anterior | Status nesta validação | Observação |
|-----------------|------------------------|------------|
| A-* (crons QoS) | CONFIRMADO E PENDENTE | #234/#240 seguem pendentes |
| A-* (FK indexes) | CONFIRMADO E PENDENTE | #235 steps 15/16 não aplicados |
| A-* (Sentry bugs) | PARCIALMENTE CORRIGIDO | corrigido no head #248, não no `main` |
| A-* (frontend #237) | CORRIGIDO E VERIFICADO | merged |
| A-* (admin_global) | CONTRADITÓRIO | papel documentado não existe no banco |

---

## 6. Resumo executivo

- **CORRIGIDO E VERIFICADO:** #237 (frontend, merged), #243 (DDL batches), 5 bugs Sentry (no head #248, **não no main**), #238 "REGISTRAR".
- **PARCIALMENTE CORRIGIDO:** #235 (steps 15/16 pendentes), #238 Grupo B RLS, 4 configs Sentry.
- **CONFIRMADO E PENDENTE:** #234 QoS, #240 (migration + segredo + função + PR out-of-date), #235 migrations 20300/20400.
- **SUPERADO:** #226, #225, #238 "APLICAR", #131 CI bun audit.
- **CONTRADITÓRIO:** `admin_global` (SECURITY_RULES.md + guard asaas-proxy) vs. papel real `admin`; arquivo migration `20261101140000` com typos.
- **NÃO VERIFICADO:** deploy edge functions no Supabase.

### Pendências críticas (ação recomendada)
1. **#240** — aplicar migration `monitor_health_cron`, criar segredo `monitor_health_cron`, deployar função `monitor-health`, atualizar PR (6 commits atrás). Bloqueia o primeiro disparo do cron (401).
2. **#235 steps 15/16** — criar os 5 FK indexes ausentes.
3. **Sentry** — mergear #248 (substitui #246) para levar os 5 fixes ao `main`; resolver as 4 configs pendentes.
4. **admin_global** — alinhar `SECURITY_RULES.md` e guard `asaas-proxy` ao papel real `admin`.
5. **#243** — corrigir typos no arquivo versionado `20261101140000`.