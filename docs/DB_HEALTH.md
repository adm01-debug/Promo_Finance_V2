# DB_HEALTH — Painel de Saúde do Banco

> Step 47 do PLANO_50 — Promo Finance V2  
> Queries versionadas para auditoria contínua do banco Supabase (`bwwbeyolnnzppeuhgkcd`).

---

## Como usar

1. Abra o [SQL Editor do projeto](https://supabase.com/dashboard/project/bwwbeyolnnzppeuhgkcd/sql) ou use o MCP `supabase_db_query`.
2. Execute cada query individualmente.
3. Compare o resultado com os valores esperados na tabela **Antes × Depois** abaixo.
4. Valores acima do esperado indicam regressão — abrir issue com label `db-health`.

---

## Queries de auditoria

### 1. FK sem índice de suporte

Foreign keys sem índice correspondente causam sequential scans em `DELETE`/`UPDATE` cascadeados.
Esperado após Bloco C (Steps 19-23): **0**.

```sql
SELECT count(*) AS fk_sem_indice
FROM (
  SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid
        AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = (tc.table_schema || '.' || tc.table_name)::regclass
        AND a.attname = kcu.column_name
    )
) x;
```

---

### 2. Índices sem uso (idx_scan = 0, excluindo PKs e unique constraints)

Índices que nunca foram varridos consomem espaço e atrasam writes.  
Esperado após Step 17 (revisão de índices): **< 10** (alguma margem para índices novos em tabelas pouco usadas).

```sql
SELECT count(*) AS indices_sem_uso
FROM pg_stat_user_indexes psi
JOIN pg_index pi ON pi.indexrelid = psi.indexrelid
WHERE psi.idx_scan = 0
  AND NOT pi.indisprimary
  AND NOT pi.indisunique
  AND psi.schemaname = 'public';
```

---

### 3. Views sem `security_invoker = true`

Views sem `security_invoker` executam com as permissões do dono da view, contornando RLS.  
Esperado após Step 18 (hardening P15+): **0**.

```sql
SELECT count(*) AS views_sem_security_invoker
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND (
    c.reloptions IS NULL
    OR NOT array_to_string(c.reloptions, ',') LIKE '%security_invoker=true%'
  );
```

---

### 4. Tabelas com RLS habilitado mas sem nenhuma policy

Tabela com `rowsecurity = true` e zero policies bloqueia todos os acessos silenciosamente.  
Esperado: **0**.

```sql
SELECT count(*) AS tabelas_rls_sem_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.tablename = c.relname
  AND p.schemaname = n.nspname
WHERE c.relrowsecurity = true
  AND n.nspname = 'public'
  AND c.relkind = 'r'
  AND p.tablename IS NULL;
```

---

### 5. Migrations registradas vs. arquivos em disco

Verifica divergência entre `supabase/migrations/*.sql` (source of truth) e `schema_migrations`  
(tabela interna do Supabase CLI que rastreia o que foi aplicado).  
Proxy: contar versões na tabela de controle.

```sql
-- Quantidade de migrations já aplicadas no banco:
SELECT count(*) AS migrations_aplicadas
FROM supabase_migrations.schema_migrations;

-- Conferir se a última migration está registrada
-- (substituir pelo timestamp mais recente do diretório supabase/migrations/):
SELECT version, statements IS NOT NULL AS tem_sql
FROM supabase_migrations.schema_migrations
WHERE version = '20261101200000';  -- ajustar para o timestamp mais recente
```

> **Nota:** a query de `EXCEPT` entre `fs_migrations` e `schema_migrations` requer
> acesso ao filesystem, o que não é possível via SQL puro. Mantenha o count acima como
> proxy e compare manualmente com `ls supabase/migrations/ | wc -l`.

---

### 6. Cron jobs com falha nas últimas 24 h

Qualquer linha aqui significa falha silenciosa em processamento automático.  
Esperado: **0 linhas**.

```sql
SELECT
  j.jobname,
  count(*)         AS total_falhas,
  max(d.end_time)  AS ultima_falha,
  max(d.return_message) AS ultimo_erro
FROM cron.job_run_details d
JOIN cron.job j ON j.jobid = d.jobid
WHERE d.status = 'failed'
  AND d.end_time > now() - INTERVAL '24 hours'
GROUP BY j.jobname
ORDER BY ultima_falha DESC;
```

---

### 7. Cobertura de guards nas Edge Functions

Edge Functions sem guard de autenticação expõem endpoints sem proteção.  
Esperado após Bloco D (Steps 33-48): **0** funções no terceiro balde.

```sql
-- Proxy via config.toml: lista funções sem entrada no config (verify_jwt não declarado).
-- Para auditoria real, comparar o diretório supabase/functions/ com supabase/config.toml.

-- Funções declaradas no config.toml com verify_jwt = false e sem guard interno documentado:
-- Consultar manualmente ou via script:
--   grep -L 'exigirUsuario\|exigirPapel\|exigirChamadaInterna\|verify_jwt.*true' \
--        supabase/functions/*/index.ts | wc -l

-- Proxy no banco: edge functions deployadas (requer pg_net ou log de deploy):
SELECT
  'Verificar manualmente supabase/functions/*/index.ts' AS instrucao,
  'grep -rL exigirUsuario\|exigirPapel\|exigirChamadaInterna supabase/functions/' AS comando_shell,
  '0 arquivos sem guard' AS valor_esperado;
```

---

## Valores de referência

Números medidos antes da execução do PLANO_50 (baseline ~2026-09-01).

| Métrica | Antes do plano | Fonte |
|---|---|---|
| FK sem índice | ~47 | AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md |
| Índices sem uso | ~38 | pg_stat_user_indexes (baseline) |
| Views sem security_invoker | ~12 | hardening P14 (pré-P15) |
| Tabelas RLS sem policy | ~5 | RLS_MATRIZ_NEGATIVA.md |
| Migrations aplicadas | ~500 | schema_migrations |
| Cron jobs com falha/24h | 1+ (Step 09) | cron.job_run_details |
| Edge Functions sem guard | ~15 | auditoria manual |

---

## Tabela Antes × Depois (impacto do PLANO_50)

| # | Métrica | Antes | Depois (meta) | Step que corrige | Query |
|---|---|---|---|---|---|
| 1 | FK sem índice | ~47 | **0** | Bloco C (19-23) | Query 1 |
| 2 | Índices sem uso | ~38 | **< 10** | Step 17 | Query 2 |
| 3 | Views sem security_invoker | ~12 | **0** | Step 18 | Query 3 |
| 4 | Tabelas RLS sem policy | ~5 | **0** | Steps 12-16 | Query 4 |
| 5 | Migrations aplicadas | ~500 | **573+** (plano completo) | Todas as migrations | Query 5 |
| 6 | Cron jobs com falha/24h | 1+ | **0** | Steps 09, 46 | Query 6 |
| 7 | Edge Functions sem guard | ~15 | **0** | Bloco D (33-48) | Query 7 |

---

## Interpretação dos resultados

| Resultado | Significado | Ação |
|---|---|---|
| = valor esperado | ✅ Saudável | Nenhuma |
| Ligeiramente acima | ⚠️ Atenção | Investigar causa; pode ser migração nova ainda não rastreada |
| Muito acima do esperado | 🔴 Regressão | Abrir issue com label `db-health` e referenciar esta query |
| Query falha com erro | ❌ Schema mudou | Atualizar a query e reavaliar baseline |

### Frequência recomendada de execução

- **Antes de cada release** para `main`
- **Semanalmente** em ambiente de produção (pode ser automatizado via cron + monitor-health)
- **Após qualquer migration DDL** que toque em indexes, views ou policies

---

*Gerado em 2026-11-01 — Step 47 do PLANO_50.*
