# [STEP 22] Reconciliacao de Migrations Nao Rastreadas

**Data de execucao:** 2026-10-31
**Branch:** `chore-migration-reconcile-261031-2010`
**Banco:** `bwwbeyolnnzppeuhgkcd` (Supabase Cloud)

---

## Resumo Geral

| Metrica | Valor |
|---------|-------|
| Total de arquivos em `supabase/migrations/` | 933 |
| Total rastreados em `supabase_migrations.schema_migrations` | 371 |
| Nao rastreados (total) | 562 |
| Foco desta analise (arquivos nomeados, agentes PLANO_50) | **44** |
| Classificados como REGISTRAR | 2 |
| Classificados como APLICAR | 4 |
| Classificados como INDETERMINADO | 38 |

### Sobre os 562 nao rastreados totais

Os 562 arquivos nao rastreados se dividem em 3 categorias:

1. **Arquivos UUID pre-bootstrap (~185 arquivos):** arquivos com nome UUID ou sem timestamp valido (ex: `001_`, `002_`, `20241231*`). Criados antes da implantacao do sistema de migrations. Seus efeitos estao no banco, mas os nomes impossibilitam INSERT valido na `schema_migrations`. Classificacao: **INDETERMINADO** - nao inserir.

2. **Arquivos UUID companion do Lovable (~333 arquivos):** cada migration Lovable gera 2 arquivos - `TIMESTAMP_ledger_reconciliado.sql` (rastreado) + `TIMESTAMP+Ns_UUID.sql` (shadow, nao rastreado). Os efeitos foram aplicados via ledger. Nao inserir para evitar duplo-rastreamento. Classificacao: **INDETERMINADO** - nao inserir.

3. **Arquivos nomeados de sessoes de agentes (44 arquivos):** criados durante execucao do PLANO_50 (20260822-20261027). Sao o foco desta analise. Detalhados abaixo.

---

## Detalhamento dos 44 Arquivos Nomeados Nao Rastreados

### REGISTRAR (2 arquivos) - efeito confirmado no banco, so falta registro

| # | Versao | Arquivo | Objeto Verificado | Resultado |
|---|--------|---------|-------------------|-----------|
| 1 | `20260824124500` | `descomissionar_modulo_lalamove.sql` | `pg_tables WHERE tablename='integracao_lalamove'` | **FALSE** - tabela foi dropada, migration aplicada |
| 2 | `20260904000600` | `add_contas_pagar_valor_pago.sql` | `columns WHERE table_name='contas_pagar' AND column_name='valor_pago'` | **TRUE** - coluna existe, migration aplicada |

**DDL aplicado nesta execucao:**
```sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260824124500'); -- OK
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260904000600'); -- OK
```

**Status:** OK - Ambas inseridas com sucesso no banco.

---

### APLICAR (4 arquivos) - gap real, DDL nunca executado - requer APROVADO

| # | Versao | Arquivo | Objeto Verificado | Resultado |
|---|--------|---------|-------------------|-----------|
| 1 | `20260903001300` | `add_is_user_locked_function.sql` | `pg_proc WHERE proname='is_user_locked'` | **FALSE** - funcao nao existe |
| 2 | `20260904000100` | `add_empresa_id_to_query_telemetry.sql` | `columns WHERE table_name='query_telemetry' AND column_name='empresa_id'` | **FALSE** - coluna nao existe |
| 3 | `20260905000200` | `add_totais_contas_pagar_receber.sql` | `pg_proc WHERE proname='totais_contas_pagar'` | **FALSE** - funcao nao existe |
| 4 | `20261027120000` | `transferencias_movimentacao_bilateral.sql` | `columns WHERE table_name='transferencias' AND column_name='movimentacao_id'` | **FALSE** - coluna nao existe |

**ATENCAO: Estas migrations NAO foram aplicadas no banco. Precisam de APROVADO para execucao.**

#### Detalhes:
- **20260903001300:** Cria `is_user_locked(p_user_id uuid)` - risco baixo, criacao de funcao nova
- **20260904000100:** `ALTER TABLE query_telemetry ADD COLUMN empresa_id UUID` - risco baixo, nao destrutivo
- **20260905000200:** Cria `totais_contas_pagar` e `totais_contas_receber` (fix bug de soma com >1000 lancamentos, achado B2/R2-2026-09-03) - risco baixo, CREATE OR REPLACE FUNCTION SECURITY INVOKER
- **20261027120000:** Normalizacao aditiva de `transferencias` e `movimentacoes`, recria triggers de movimentacao bilateral - risco **medio**, arquivo idempotente por design (ADD COLUMN IF NOT EXISTS, CREATE OR REPLACE)

---

### INDETERMINADO (38 arquivos) - modificacoes complexas, verificacao automatica impraticavel

Classificados como INDETERMINADO pois sao alteracoes de policies RLS, REVOKEs, substituicoes de funcoes existentes ou operacoes com efeitos dificeis de verificar sem ler e comparar cada arquivo contra o estado atual do banco.

**Grupo A - Estrutural/Reconciliacao (4 arquivos)**

| Versao | Arquivo | Motivo INDETERMINADO |
|--------|---------|---------------------|
| `20260824180000` | `restaurar_integridade_financeira_sem_logistica.sql` | Multiplas operacoes pos-drop Lalamove |
| `20260825250000` | `recreate_6_constraints.sql` | 6 constraints; verificar quais exige ler e comparar |
| `20260827100000` | `reconciliar_views_rpcs_indices_sem_drop.sql` | Multiplas views e RPCs; estado atual incerto |
| `20260827101000` | `hardening_views_pii_rpcs.sql` | Modifica views existentes; versao incerta |

**Grupo B - RLS Cross-Tenant Fixes 20260902 (15 arquivos)**

| Versao | Arquivo |
|--------|--------|
| `20260902130000` | `fix_rls_cross_tenant_leak_financeiro.sql` |
| `20260902140000` | `fix_rls_cross_tenant_leak_financeiro_parte2.sql` |
| `20260902150000` | `fix_rls_cross_tenant_leak_financeiro_parte3.sql` |
| `20260902160000` | `fix_bypass_views_matviews_legadas.sql` |
| `20260902170000` | `fix_rpcs_security_definer_sem_escopo.sql` |
| `20260902180000` | `fix_nfe_vinculo_rpcs_sem_escopo.sql` |
| `20260902190000` | `fix_rls_cross_tenant_leak_grupo_a.sql` |
| `20260902200000` | `fix_rls_cross_tenant_leak_grupo_c.sql` |
| `20260902210000` | `fix_rls_cross_tenant_leak_grupo_b1.sql` |
| `20260902220000` | `fix_rls_cross_tenant_leak_sensiveis.sql` |
| `20260902230000` | `fix_rls_tautologia_empresas_asaas_elisao.sql` |
| `20260902240000` | `fix_rls_gaps_pos_pr54.sql` |
| `20260902250000` | `fix_storage_view_audit_trail_gaps.sql` |
| `20260902260000` | `fix_historico_conciliacao_ia_or_bypass.sql` |
| `20260902270000` | `fix_orphan_policies_pos_pr55.sql` |

Motivo: Modificam policies RLS com DROP POLICY IF EXISTS + CREATE POLICY. Policies existem no banco, mas corpo atual pode ou nao ser a versao pos-fix.

**Grupo C - Security Fixes 20260903 (12 arquivos)**

| Versao | Arquivo |
|--------|--------|
| `20260903000100` | `fix_user_filter_presets_or_true.sql` |
| `20260903000200` | `fix_alertas_preditivos_missing_select_policy.sql` |
| `20260903000300` | `fix_asaas_config_rls_role_check.sql` |
| `20260903000400` | `fix_certificado_get_password_idor.sql` |
| `20260903000500` | `fix_desfazer_conciliacao_user_spoofing.sql` |
| `20260903000600` | `fix_empresa_acessivel_coalesce_ativo.sql` |
| `20260903000700` | `fix_auditar_cross_tenant_coalesce_ativo.sql` |
| `20260903000800` | `fix_gerar_alertas_vencimento_coalesce_ativo.sql` |
| `20260903000900` | `fix_export_asaas_audit_csv_idor.sql` |
| `20260903001000` | `fix_set_empresa_id_default_coalesce_ativo.sql` |
| `20260903001100` | `fix_get_lockout_details_grant.sql` |
| `20260903001200` | `revoke_anon_get_lockout_details.sql` |

**Grupo D - Auth/Telemetry Fixes 20260904 (5 arquivos)**

| Versao | Arquivo |
|--------|--------|
| `20260904000200` | `grant_anon_increment_failed_attempts.sql` |
| `20260904000300` | `fix_reset_failed_attempts.sql` |
| `20260904000400` | `fix_is_user_locked_normalization.sql` |
| `20260904000500` | `fix_reset_failed_attempts_authcheck.sql` |
| `20260904000700` | `revoke_get_lockout_details_public.sql` |

**Grupo E - Outros (2 arquivos)**

| Versao | Arquivo | Motivo |
|--------|---------|--------|
| `20260905000100` | `fix_darfs_orphan_policy_leak.sql` | Policy orphan em `darfs`; existencia nao verificada |
| `20260911110000` | `revoke_anon_increment_failed_attempts.sql` | REVOKE; estado de grant para anon nao verificavel facilmente |

---

## Acoes Realizadas Nesta Execucao

### INSERTs aplicados (REGISTRAR):
```sql
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260824124500'); -- OK
INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20260904000600'); -- OK
```

### Pendentes de APROVADO (APLICAR):
```
AGUARDANDO: 20260903001300 - add_is_user_locked_function.sql
AGUARDANDO: 20260904000100 - add_empresa_id_to_query_telemetry.sql
AGUARDANDO: 20260905000200 - add_totais_contas_pagar_receber.sql
AGUARDANDO: 20261027120000 - transferencias_movimentacao_bilateral.sql (risco medio)
```

### Pendentes de analise manual (INDETERMINADO):
38 arquivos dos Grupos A-E acima. Recomendacao: auditar o Grupo B (15 arquivos de RLS) como prioridade, pois envolvem seguranca de isolamento de tenant.

---

## Verificacoes Executadas

```sql
SELECT EXISTS(SELECT 1 FROM pg_tables WHERE tablename='integracao_lalamove')                                               -- FALSE -> REGISTRAR 20260824124500
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='contas_pagar' AND column_name='valor_pago')       -- TRUE  -> REGISTRAR 20260904000600
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='is_user_locked')                                                        -- FALSE -> APLICAR  20260903001300
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='query_telemetry' AND column_name='empresa_id')    -- FALSE -> APLICAR  20260904000100
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='totais_contas_pagar')                                                   -- FALSE -> APLICAR  20260905000200
SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='transferencias' AND column_name='movimentacao_id') -- FALSE -> APLICAR 20261027120000
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='empresa_acessivel')                                                     -- TRUE  (versao incerta -> INDETERMINADO)
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='get_lockout_details')                                                   -- TRUE  (versao incerta -> INDETERMINADO)
SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname='increment_failed_attempts')                                             -- TRUE  (grants incertos -> INDETERMINADO)
SELECT count(*) FROM pg_policies WHERE tablename='contas_pagar'                                                            -- 3 (versoes das policies incertas -> INDETERMINADO)
```
