# Checklist de Migração — Schema, RLS/Policies e Índices entre Projetos Supabase

Guia operacional passo a passo para replicar **schema + segurança + performance** (sem dados, sem Edge Functions, sem secrets) de um projeto Supabase de origem para um projeto Supabase de destino.

Última atualização: 2026-07-21

---

## Escopo

**Inclui:** extensions, schemas, enums, tabelas, views, funções, triggers, GRANTs, RLS + policies, índices (incluindo parciais e compostos), sequences, partições mensais (`audit_logs_*`, `frontend_error_logs_*`), publications do Realtime.

**Fora deste checklist:** dados das tabelas, `auth.users`, storage objects, secrets de Edge Functions, deploy de Edge Functions, cron jobs (`pg_cron`) — cada um tem seu próprio procedimento.

---

## Pré-requisitos

- [ ] Acesso ao **projeto de origem**: connection string do Postgres (host, port, user, senha do DB) OU CLI Supabase autenticado
- [ ] Acesso ao **projeto de destino**: mesma coisa + access token (`sbp_...`) da conta dona
- [ ] `supabase` CLI ≥ 1.180 instalado localmente (`supabase --version`)
- [ ] `psql` ≥ 15 instalado
- [ ] Repositório do projeto clonado com a pasta `supabase/migrations/` íntegra (356 migrations)
- [ ] Janela de manutenção acordada (schema-only é rápido: 5–15 min)

---

## Fase 1 — Preparação (origem)

1. [ ] Rodar `supabase db lint` na origem para garantir zero warnings críticos antes de exportar
2. [ ] Confirmar que `supabase/migrations/` está em paridade com o banco de origem:
   ```bash
   supabase db diff --linked --schema public
   ```
   Se retornar diff, aplicar/consertar antes de continuar
3. [ ] Snapshot do estado atual da origem para comparação posterior:
   ```bash
   supabase db dump --schema-only --file /tmp/origem-schema.sql
   ```
4. [ ] Listar extensions em uso na origem:
   ```sql
   SELECT extname, extversion FROM pg_extension ORDER BY 1;
   ```
   Anotar: `pgcrypto`, `pg_cron`, `pg_net`, `pg_stat_statements`, `vector`, `pg_trgm`, etc.
5. [ ] Listar publications do Realtime:
   ```sql
   SELECT pubname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

## Fase 2 — Preparação (destino)

6. [ ] Criar o projeto Supabase destino e anotar `project-ref`, `anon key`, `service_role key`, senha do banco
7. [ ] Vincular CLI ao destino:
   ```bash
   supabase link --project-ref <novo-ref>
   ```
8. [ ] Habilitar extensions no destino via SQL Editor (na mesma ordem/versão da origem):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS pg_net;
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
9. [ ] Confirmar que schemas `auth`, `storage`, `realtime` existem (nascem por default)
10. [ ] Backup preventivo do destino (mesmo vazio) — só por higiene de rollback

## Fase 3 — Migração de Schema

11. [ ] **Aplicar todas as 356 migrations em ordem cronológica**:
    ```bash
    supabase db push
    ```
    Se der conflito por objetos de sistema já criados, isolar apenas o schema `public`:
    ```bash
    supabase db push --include-schemas public
    ```
12. [ ] Verificar contagem de objetos criados:
    ```sql
    SELECT relkind, count(*) FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' GROUP BY 1;
    ```
    Comparar com o mesmo `SELECT` rodado na origem (Fase 1). Divergência = falha.

## Fase 4 — Validação de RLS/Policies

13. [ ] Toda tabela pública com RLS habilitada:
    ```sql
    SELECT relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND relkind = 'r' AND NOT relrowsecurity;
    ```
    Resultado esperado: **0 linhas**
14. [ ] Contagem de policies confere com a origem:
    ```sql
    SELECT tablename, count(*) FROM pg_policies
    WHERE schemaname = 'public' GROUP BY 1 ORDER BY 1;
    ```
15. [ ] GRANTs conferem para `anon`, `authenticated`, `service_role`:
    ```sql
    SELECT grantee, privilege_type, count(*)
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
    GROUP BY 1, 2 ORDER BY 1, 2;
    ```
16. [ ] Rodar o linter oficial e resolver qualquer alerta de RLS/security:
    ```bash
    supabase db lint
    ```
17. [ ] Rodar testes pgTAP em `supabase/tests/sql/`:
    ```bash
    supabase test db
    ```

## Fase 5 — Validação de Índices

18. [ ] Contagem por tabela confere:
    ```sql
    SELECT tablename, count(*) FROM pg_indexes
    WHERE schemaname = 'public' GROUP BY 1 ORDER BY 1;
    ```
19. [ ] Índices parciais e compostos preservados:
    ```sql
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public'
      AND (indexdef LIKE '%WHERE%' OR indexdef LIKE '%,%')
    ORDER BY 1;
    ```
20. [ ] `ANALYZE` global para popular estatísticas do planner:
    ```sql
    ANALYZE;
    ```

## Fase 6 — Partições e Realtime

21. [ ] Partições mensais existem para o mês corrente + próximos 3:
    ```sql
    SELECT relname FROM pg_class
    WHERE relname LIKE 'audit_logs_2026%'
       OR relname LIKE 'frontend_error_logs_2026%'
    ORDER BY 1;
    ```
    Se faltar, chamar `SELECT public.maintain_monthly_partitions();`
22. [ ] Publication do Realtime aplicada:
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_alerts;
    ```
    (Repetir para cada tabela listada na Fase 1, passo 5)

## Fase 7 — Diff de conferência

23. [ ] Gerar dump schema-only do destino:
    ```bash
    supabase db dump --schema-only --file /tmp/destino-schema.sql
    ```
24. [ ] Diff filtrado (ignora comentários, ordem de GRANT):
    ```bash
    diff <(grep -v '^--' /tmp/origem-schema.sql | sort -u) \
         <(grep -v '^--' /tmp/destino-schema.sql | sort -u) \
         > /tmp/schema-diff.txt
    ```
    Resultado esperado: apenas linhas de `owner` e `oid` divergentes — nunca `CREATE`, `POLICY`, `INDEX`, `GRANT`

## Fase 8 — Rollback (se falhar)

25. [ ] Se qualquer validação (Fase 4–7) reprovar:
    - Não reaproveitar o destino parcialmente populado — abrir novo projeto zerado
    - Registrar o passo que falhou e o log completo em `docs/MIGRATION_INCIDENT_YYYYMMDD.md`
    - Retomar da Fase 2

---

## Validação pós-corte (smoke test aplicacional)

Após todas as fases fecharem em verde, rodar antes de considerar o destino em produção:

- [ ] `supabase functions list` — confere que Edge Functions críticas estão prontas para redeploy (procedimento separado)
- [ ] Login de teste com usuário `admin` — RLS aplicada corretamente
- [ ] Query de fumaça em cada domínio principal:
  ```sql
  SELECT count(*) FROM public.contas_pagar;      -- financeiro
  SELECT count(*) FROM public.apuracoes_tributarias; -- tributário
  SELECT count(*) FROM public.audit_logs;        -- auditoria (partições)
  ```
- [ ] Página `/admin/system-health` responde 200 e reporta `db.ok = true`
- [ ] `select public.has_role(auth.uid(), 'admin'::app_role)` retorna `true` para admin logado
- [ ] Realtime subscription funcionando no sino de notificações
- [ ] `supabase db lint` roda limpo no destino

---

## Notas técnicas

- Checklist é **idempotente até a Fase 2**; a partir da Fase 3 rode em janela de manutenção
- Migrations do repositório são a fonte de verdade — nunca use `pg_dump --schema-only` como substituto, porque ele perde a ordem semântica das 356 migrations e o Supabase CLI não reconhece o histórico
- Cron jobs (`pg_cron`) **não migram por schema dump** — são armazenados em `cron.job` e precisam de re-scheduling manual via `INSERT` (procedimento separado, fora deste escopo)
- Edge Functions e seus secrets seguem procedimento próprio em `docs/RUNBOOK.md` §6
