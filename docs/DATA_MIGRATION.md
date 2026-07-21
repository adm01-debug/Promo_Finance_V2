# Runbook — Migração de Dados PROD → STAGING

Cópia seletiva de dados, com blacklist automática de logs/telemetria, checkpoint por tabela e rollback por snapshot. Complementa `docs/STAGING_MIGRATION.md` e `docs/MIGRATION_CHECKLIST.md`.

---

## 1. Quando usar

Apenas para popular **staging** com dados realistas depois que o schema e as Edge Functions já estão migrados. Nunca em produção — o fluxo é unidirecional PROD (leitura) → STAGING (escrita).

Não substitui backup nem processo de restore. É uma cópia lógica, filtrada, com bookkeeping local.

---

## 2. Pré-requisitos

- `psql`, `jq`, `yq` (`pip install yq` ou `brew install python-yq`)
- Env:
  - `PROD_DB_URL` — connection string **readonly** de produção
  - `STAGING_DB_URL` — connection string do staging (service_role)
  - `PROD_PROJECT_REF` / `STAGING_PROJECT_REF` — guard-rail (opcional mas recomendado)
- Manifesto revisado: `scripts/data/tables.yaml`

---

## 3. Fluxo

```text
preflight → plan → init-run → snapshot+copy(loop) → verify → finalize
```

### Execução

```bash
# Preview: mostra o plano (copy × skip) e sai
bash scripts/data-migrate.sh --dry-run

# Execução real
bash scripts/data-migrate.sh --yes

# Só um grupo
bash scripts/data-migrate.sh --group catalogos --yes

# Só tabelas específicas (subset da allowlist)
bash scripts/data-migrate.sh --tables clientes,fornecedores --yes

# Retomar um run que falhou no meio
bash scripts/data-migrate.sh --resume <uuid>
```

---

## 4. Blacklist

Tudo que **não** está no `groups[].tables` do manifesto é ignorado. Além disso, o engine rejeita por padrão de nome (regex bash):

```
audit_logs*   *_log(s)?   *_telemetry
frontend_error_logs*   frontend_performance_logs
runtime_error_logs   rate_limit_logs   webhooks_log
login_attempts   sso_login_attempts   blocked_ips
cron_job_logs   query_telemetry*
```

E respeita a lista explícita `blacklist_extra:` do YAML (sessões, PII, snapshots de observabilidade).

Para adicionar uma tabela à cópia: incluir no grupo apropriado do YAML, no mesmo PR revisar impacto em PII/tamanho.

---

## 5. Checkpoint e snapshot

Bookkeeping criado só em staging, no schema `_migration`:

- `_migration.runs` — um registro por execução (`running|done|failed|rolled_back`)
- `_migration.checkpoints` — um registro por tabela por run (com `snapshot_table`)
- `_migration.snap_<table>_<runid_short>` — snapshot pré-cópia (CTAS)

Snapshot é criado apenas se `count(staging.<t>) ≤ snapshot_max_rows` (default 500k). Acima disso a tabela aborta com erro claro — evita explosão de storage no staging.

### Garbage collection

Snapshots vencem em 7 dias por default:

```sql
SELECT _migration.gc(7);   -- retorna quantos foram descartados
```

Configure um cron opcional se quiser automático.

---

## 6. Rollback

```bash
# Preview
bash scripts/data/rollback.sh --run-id <uuid> --dry-run

# Executa
bash scripts/data/rollback.sh --run-id <uuid>
```

Para cada tabela com snapshot: `TRUNCATE CASCADE` + `INSERT SELECT` do snapshot, em transação. Sem snapshot = pulada (log claro).

Nunca roda automaticamente. Sempre exige `--run-id` explícito.

---

## 7. Verify

`scripts/data/verify.sh --run-id <uuid>` emite JSONL com:

| Assertion | Significado |
|---|---|
| `count.<table>` | `pass` se `count(staging) == count(prod filtrada) == rows_copied` |
| `hash.<table>` | md5 dos primeiros 1000 ids ordenados bate entre prod/staging. `unverified` para grupos com `where` (amostra pode divergir legitimamente) |
| `fk.*` | verificação estrutural de constraints em staging |

Exit code = número de falhas. `unverified` nunca conta como aprovado, mas não trava.

---

## 8. Integração com `staging-migrate.sh`

Passo opcional via flag `--with-data`:

```
preflight → baseline → schema → secrets → functions → crons
   → [--with-data: data-migrate.sh --yes]
   → integrity → summary
```

Sem a flag o comportamento padrão continua (só schema + código). Dados são sempre opt-in.

---

## 9. Segurança

- `PROD_DB_URL` é **somente leitura**: usado apenas em `COPY (SELECT …) TO STDOUT`
- Guard-rails abortam se `PROD_DB_URL == STAGING_DB_URL` ou se `STAGING_PROJECT_REF == PROD_PROJECT_REF`
- Schema `_migration` só concede acesso a `service_role`; `PUBLIC` revogado
- Nomes de tabelas são validados contra `^[a-z_][a-z0-9_]*$` antes de qualquer SQL dinâmico
- PII sensível (`user_devices`, `user_passkeys`, `password_reset_tokens`, `mfa_sessions`, `webauthn_credentials`, `scim_tokens`) permanece na blacklist por padrão — inclusão exige justificativa no PR
- Logs JSONL registram nomes de tabelas e contagens; nunca valores de linhas

---

## 10. Interpretação de falhas

| Sintoma | Causa provável | Ação |
|---|---|---|
| `preflight fail: yq faltando` | dependência ausente | `pip install yq` |
| `preflight fail: PROD_DB_URL == STAGING_DB_URL` | env trocado | ajustar variáveis antes de rodar |
| `copy fail: staging rows > snapshot_max_rows` | tabela grande já povoada em staging | aumentar `snapshot_max_rows` no YAML ou rodar com `--no-snapshot` |
| `copy failed rc=…` | erro de tipo/constraint na cópia | ver `\d public.<t>` em ambos; possivelmente schema drift |
| `count.<t> fail` | trigger em staging alterou a inserção | inspecionar triggers; considerar `SET session_replication_role='replica'` |
| `hash.<t> unverified` para grupo com `where` | comportamento esperado (amostra filtrada) | ignorar |
| `verify` retorna >0 mas cópia parece ok | verify roda depois do run — inspecionar linha JSONL específica | investigar por tabela; rollback é opcional |

---

## 11. Perguntas frequentes

**Pode rodar em prod?** Não. Guard-rails abortam. Prod é somente leitura via `COPY … TO STDOUT`.

**Snapshots ficam para sempre?** Não. `_migration.gc(7)` remove após 7 dias. Personalize o intervalo se quiser.

**Como copiar dados que exigem chave de FK ainda não migrada?** Ajuste a ordem dos grupos no YAML. FKs entre tabelas de grupos posteriores são respeitadas naturalmente.

**Copiar 100% de tabelas transacionais?** Remover o `where: "created_at > …"` do grupo. Considere o custo de storage no staging antes.
