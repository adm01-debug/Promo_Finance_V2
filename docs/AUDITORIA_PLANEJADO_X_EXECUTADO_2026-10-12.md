# Auditoria exaustiva — Planejado × Executado (Promo Finance V2)

> **O que é este documento:** o levantamento de tudo o que foi **planejado** para o Promo Finance V2 (em planos, docs, código, schema, CI e no próprio banco de produção) e que **não foi executado**, foi executado **pela metade**, ou foi **declarado como feito sem estar feito**.
>
> - **Data da coleta:** 11 e 12/10/2026
> - **Commit auditado:** `1897442` (`main`)
> - **Banco de produção consultado:** `bwwbeyolnnzppeuhgkcd`, somente com `SELECT` no catálogo, em `cron`, `net` e nas contagens de tabelas. Nada foi alterado.
> - **GitHub consultado:** branch protection, secrets (só nomes), runs de workflow e PRs abertas, tudo em modo leitura.
> - **Status:** nenhum item foi corrigido por esta auditoria. É um diagnóstico.

---

## 0. Como ler

### 0.1 Legenda de status

| Status | Significado |
| --- | --- |
| **QUEBRADO EM PRODUÇÃO** | O código existe, mas falha contra o banco ou a configuração que **existem hoje** em produção, mesmo que ninguém tenha clicado ainda |
| **NÃO APLICADO EM PROD** | Está pronto no git (migration ou função), mas nunca chegou ao ambiente real |
| **DECLARADO FEITO, MAS AUSENTE** | Um documento, o changelog ou a UI afirma que existe, e o código ou o banco mostram que não |
| **SIMULADO / STUB** | Existe tela ou função, mas o resultado é fictício: dado fixo, `Math.random`, "modo simulado" ou "versão determinística (stub)" |
| **PARCIAL** | Parte do ciclo funciona e parte não (ex.: cria, mas não baixa, não estorna, não audita) |
| **SÓ UI** | Tela ou botão sem efeito real no backend |
| **SÓ SCHEMA** | Tabela, coluna ou enum criados e nunca usados pela lógica |
| **SÓ BACKEND** | Lógica pronta, mas sem tela que a dispare |
| **ÓRFÃO** | Existe e ninguém chama (nem tela, nem cron, nem outra função) |
| **NUNCA ATIVADO** | Integração pronta no código, com zero uso em produção (sem token, sem certificado, sem registro) |
| **NÃO INICIADO** | Planejado em documento e sem nenhuma linha de implementação |
| **BLOQUEADO** | Depende de decisão sua, de acesso externo (painel, banco, fornecedor) ou de outro item |

### 0.2 Fontes cruzadas

- **Planos e relatórios:** `PLANO_100.md`, `PLANO_50.md`, `ESTADO_ATUAL.md`, `AUDITORIA.md`, `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`, `docs/PLANO_EXCELENCIA_10_10.md`, `docs/GAPS_ENTERPRISE.md`, `docs/FUNCIONALIDADES_SEM_UI.md`, `docs/FUNCIONALIDADES_SISTEMA.md`, `docs/INVENTARIO_FUNCIONALIDADES.md`, ADRs, runbooks, épico Vela-dark, `CHANGELOG.md`, `README.md`, `AGENTS.md`, `AI_RULES.md`, `SECURITY*.md`, `CONTRIBUTING.md` e o plano da PR aberta #115 (`docs/PLANO_WORKFLOWS_100_ETAPAS_2026-09-27.md`, ainda não mergeado).
- **Código:** `src/` (1.815 arquivos `.ts`/`.tsx`, 90 páginas), as 105 Edge Functions em `supabase/functions/`, as 605 migrations em `supabase/migrations/`, `scripts/`, `e2e/` e os 11 workflows em `.github/workflows/`.
- **Produção:** `pg_proc`, `pg_policies`, `pg_trigger`, `pg_constraint`, `information_schema`, `supabase_migrations.schema_migrations`, `cron.job`, `cron.job_run_details`, `net._http_response` e contagens de linhas (`pg_stat_user_tables`).

### 0.3 O que **não** foi possível verificar

- Variáveis de ambiente da Vercel: a API devolveu 403.
- Secrets configurados nas Edge Functions do Supabase: não há ferramenta de leitura.
- Alertas de Code Scanning, Dependabot e Secret Scanning: a API devolveu 403.
- Navegação real em `app.promo-finance.com`: o proxy bloqueou.

Itens que dependem disso estão marcados como **"a verificar"**.

---

## 1. Resumo executivo

### 1.1 Números que resumem o estado real

| Indicador | Valor medido |
| --- | --- |
| Migrations do repositório **sem registro** no banco de produção | **49**. Dessas, 42 são de 02/09 em diante e **32 têm o efeito confirmado como ausente** |
| Funções de banco (RPC) que o sistema chama e que **não existem em produção** | **10** (aprovação de pagamento, DARF de retenções, importação de XML de NF-e, totais do dashboard, bloqueio de login, fila de cobrança, CNPJ, baixa automática do Asaas) |
| Rotinas agendadas (cron) **falhando em loop** em produção | **3 a cada minuto ou a cada 15 min**, mais 1 semanal. Nas últimas 6 h: 360 respostas 404, 360 respostas 422, 24 respostas 500 e 30 respostas 401 |
| Rotinas planejadas que **nunca foram agendadas** | 2 (`update-overdue` e `refresh-benchmark-setorial-weekly`). Outras 4 aparecem na tela de Automações e **não existem** (`p13-*`) |
| Policies de segurança **sem filtro de empresa** em tabelas multi-empresa | **47 policies em 34 tabelas** (contas a pagar, contas a receber, certificados, Asaas, DARF, régua…) |
| Views financeiras **sem `security_invoker`** (leem sem RLS) | **14**: fluxo de caixa, DRE, saldos, aging, painel tributário… |
| Tabelas do schema público **vazias** em produção | **129**. Dessas, 23 **não têm nenhum código que escreva nelas** e 14 **não são usadas por nada** |
| Funções SQL que existem em produção e **ninguém chama** | **43** (lockout, whitelist de IP, bloqueio por país, dispositivo conhecido, reprocessamento da DLQ, livro razão, 8 *gates* de integridade…) |
| Colunas que o código das Edge Functions lê ou grava e que **não existem em produção** | **72 pares tabela.coluna** |
| Edge Functions | 105 no total; **75 sem nenhum teste**, **13 sem nenhum chamador**, **5 quebradas em produção**, **9 integrações nunca ativadas** e **5 simuladas ou stub**. 17 chamam o gateway de IA da Lovable (`LOVABLE_API_KEY`) |
| Deploy de Edge Functions pelo pipeline | Último em **12/09**. Desde então, 18 commits mudaram funções; o que roda em produção é desconhecido |
| Trilha de auditoria | `audit_logs` parada desde **25/08**. `edge_function_logs` tem **1 linha no total**. `frontend_error_logs` está vazia |
| Uso real | 1 empresa, 3 usuários, dados-semente de 28/07. Asaas, Bling, Bitrix24, Open Finance, certificado SEFAZ, push, API keys e LGPD: **zero registros** |
| Ambiente de homologação (staging) | **Não existe**. Faltam 6 secrets no GitHub; `prod-migrate` nunca rodou |
| Testes | 2.979 testes Vitest e 333 testes Deno, todos passando. Mas 48 dos 72 testes E2E em quarentena estão vermelhos, e os gates de banco (RLS multi-empresa e pgTAP) **nunca rodam** por falta de `DATABASE_URL` |

### 1.2 Os 15 achados que mais importam para o negócio

1. **Vazamento entre empresas continua aberto em produção.**
   - As correções de RLS (16 migrations de 02/09) **foram escritas e nunca aplicadas**.
   - Hoje, qualquer usuário com papel `admin` ou `financeiro` lê e grava contas a pagar e a receber, certificados digitais e cobranças **de todas as empresas**.
   - Além disso, 14 views de saldo, DRE e fluxo leem sem RLS.
   - Veja §3.1 e §5.1.
2. **Aprovar pagamento não funciona.** A RPC `aprovar_solicitacao_pagamento` não existe em produção. Mesmo que existisse, a liberação do pagamento exige a coluna `aprovado_em`, que também não existe. Veja §4.3.
3. **O dashboard executivo mostra R$ 0,00 sem aviso.** As RPCs `totais_contas_pagar` e `totais_contas_receber` não existem e o erro é engolido. Veja §4.13.
4. **Nenhuma operação movimenta o saldo bancário.** Pagar, receber, transferir e conciliar **não geram movimentação** e **não atualizam o saldo**. Os cards de saldo mostram sempre o saldo inicial. Veja §4.4.
5. **Não existe status "vencido" automático.** O cron `update-overdue` foi planejado e nunca agendado. Os KPIs "vencido" são sempre zero (6 contas a pagar e 8 contas a receber já estão vencidas e aparecem como pendentes). Veja §4.1 e §4.2.
6. **A conciliação bancária quebra na ação principal.** "Confirmar conciliação" chama uma versão da RPC com 6 argumentos que não existe em produção. Veja §4.5.
7. **Recebimento por boleto ou PIX (Asaas) não dá baixa no título.** O webhook só atualiza `asaas_payments`; o gatilho de liquidação não existe. A gravação local do boleto falha **depois** de a cobrança já ter sido criada no Asaas (cobrança órfã). Veja §4.6.
8. **A cobrança por WhatsApp não envia mensagem.** A "régua" e a "IA proativa" só montam um link `wa.me`. **Não há integração com a Evolution API** (instância `wpp2`), embora o `CLAUDE.md` afirme que há. A fila de cobrança está parada (RPC ausente). Veja §4.7.
9. **NF-e: a emissão está bloqueada; cancelamento, inutilização e contingência são simulados.**
   - A emissão mostra "Emissão indisponível" e não autoriza nota nenhuma.
   - Cancelar, inutilizar e entrar em contingência "dão certo" na tela com `Math.random`, protocolos fictícios e ambiente fixo "homologação", sem falar com a SEFAZ.
   - A tela de Notas Fiscais nunca lê o banco.
   - Veja §4.11.
10. **A captação de NF-e de entrada (DF-e) está parada.** O cron chama `sefaz-dfe-dispatcher`, que responde 500 a cada 15 minutos (secret `CRON_DISPATCH_SECRET` ausente) e não há certificado cadastrado. Veja §4.11.
11. **A contabilidade não grava.** O front envia partidas como `'D'`/`'C'`, enquanto o CHECK de produção exige `'debito'`/`'credito'`. Os relatórios contábeis comparam `'D'`/`'C'` e somam zero. A contabilização automática só roda em *dry-run*. Veja §4.9.
12. **DARF de retenções e importação de XML de NF-e com créditos de CBS/IBS quebram** por RPC ausente. Veja §4.10.
13. **O reprocessamento de webhooks (DLQ) não está rodando.** O cron chama `webhook-retry-worker` a cada minuto com um campo que a função rejeita: HTTP 422 em 100% das chamadas das últimas 6 h. Veja §5.4.
14. **A auditoria e a observabilidade estão desligadas na prática.**
    - Nenhuma tabela financeira tem gatilho de auditoria.
    - `auditoria_financeira` não tem nenhum escritor.
    - `audit_logs` não recebe nada desde 25/08.
    - As Edge Functions não registram logs.
    - Veja §5.5 e §7.
15. **O pipeline não protege o que mais importa.**
    - Não há revisão obrigatória de PR.
    - Os gates de RLS e pgTAP ficam verdes sem rodar.
    - Não existe staging; `prod-migrate` e `schema-drift` estão quebrados.
    - O Dependabot npm está quebrado.
    - O repositório é **público**, com 23 credenciais no histórico aguardando rotação.
    - Veja §6.

### 1.3 Causas-raiz (o porquê de quase tudo acima)

| # | Causa-raiz | O que ela gera |
| --- | --- | --- |
| RC-1 | **Migrations commitadas e nunca aplicadas em produção.** O processo real é DDL manual via MCP, e o `prod-migrate` está inoperante | RPCs ausentes, RLS sem tenant, views sem `security_invoker`, buckets inexistentes, triggers de push e WhatsApp ausentes |
| RC-2 | **`types.ts` e o front escritos contra um schema diferente do de produção** (schema drift). São 31 `TODO(2026-08-14)` de colunas removidas e 215 casts `as any` / `as unknown as` | Formulários que "salvam" campos que não persistem, status com grafias diferentes e INSERTs que falham |
| RC-3 | **Deploy de Edge Functions fora do pipeline desde 12/09**, sem gate de drift | Funções em produção atrás do git; observabilidade nova não chegou; `upload-anexo` não publicável |
| RC-4 | **Não existe staging nem gate de banco no CI** | Nada é validado fora de produção; os gates de RLS ficam verdes sem rodar |
| RC-5 | **Integrações construídas e nunca ligadas** (sem token, certificado ou secret) e **telas com dados fictícios** sem aviso | A percepção de "sistema 10/10" (`.lovable/roadmap-final.md`) é incompatível com o uso real |
| RC-6 | **Documentos que declaram "feito" o que não está feito** (`FUNCIONALIDADES_SISTEMA.md` "100% ✅", CHANGELOG, Metronic) | Decisões tomadas sobre premissa falsa |

## 2. Placar

Foram registrados **279 itens** com ID nas seções 4, 6 e 7. Desses, 1 está OK/ativo e 1 é risco operacional. As 105 Edge Functions estão na §8, e as 49 migrations, as 129 tabelas vazias e as 43 funções SQL órfãs estão nas §3 e §5, fora desta contagem.

| Módulo | Quebrado | Não aplicado em prod | Declarado feito e ausente | Simulado/stub | Só UI/schema/backend | Nunca ativado | Órfão | Não iniciado | Parcial | Bloqueado | Desativado | A verificar | Total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 4.1 Contas a Pagar | 6 | · | · | · | 1 | · | · | 8 | 8 | · | · | · | 23 |
| 4.2 Contas a Receber | 4 | · | · | · | 2 | · | · | 4 | 9 | · | · | · | 19 |
| 4.3 Aprovações | 2 | · | 1 | 1 | 1 | · | · | 4 | 1 | · | · | · | 10 |
| 4.4 Tesouraria e contas bancárias | 3 | · | · | 1 | 5 | · | · | 3 | 5 | · | · | · | 17 |
| 4.5 Conciliação e Open Finance | 1 | · | · | 4 | 4 | · | · | 2 | 4 | · | · | 1 | 16 |
| 4.6 Boletos, PIX e Asaas | 2 | 1 | · | · | · | 1 | · | 2 | 2 | · | · | · | 8 |
| 4.7 Cobrança e WhatsApp | 1 | 1 | · | 2 | 1 | · | · | 4 | 1 | · | · | 1 | 11 |
| 4.8 Compras | · | · | · | 1 | · | · | · | 3 | 1 | · | · | · | 5 |
| 4.9 Contabilidade | 4 | · | · | · | 1 | · | 1 | 6 | 1 | · | · | · | 13 |
| 4.10 Tributário | 2 | · | · | 3 | 3 | · | 1 | 2 | 5 | · | · | · | 16 |
| 4.11 NF-e e SEFAZ | 1 | 1 | · | 5 | 1 | 1 | · | 2 | 1 | 1 | · | · | 13 |
| 4.12 SPED | · | · | · | · | · | · | · | 3 | 2 | · | · | · | 5 |
| 4.13 Dashboard e relatórios | 1 | · | 2 | 1 | 1 | · | · | 3 | 2 | · | · | · | 10 |
| 4.14 Orçamento e centro de custo | 2 | · | · | · | · | · | · | 1 | 1 | · | · | · | 4 |
| 4.15 Configurações e Admin | 1 | · | · | 3 | 1 | · | · | 2 | · | · | · | · | 7 |
| 4.16 Segurança e multi-empresa | 1 | 7 | 1 | · | · | · | 1 | 4 | 4 | 2 | · | · | 20 |
| 4.17 IA | · | · | · | 1 | · | 2 | · | 1 | · | · | · | 1 | 5 |
| 4.18 Integrações | 4 | · | · | 1 | · | 2 | 2 | 1 | 3 | · | · | 1 | 14 |
| 4.19 LGPD, i18n, PWA e outros | · | · | 2 | 1 | 1 | · | · | 1 | 4 | · | · | · | 9 |
| 6.1 CI/CD e ambientes | 4 | · | · | · | · | · | · | 5 | 8 | · | 3 | · | 20 |
| 6.2 Testes | · | · | · | · | · | · | · | 5 | 4 | · | 3 | · | 12 |
| 6.3 Operação e DR | 2 | · | · | · | · | · | · | 8 | 1 | · | · | · | 12 |
| 7 Observabilidade | · | 4 | · | · | · | · | · | 1 | 3 | · | · | 1 | 10 |
| **Total** | **41** | **14** | **6** | **24** | **22** | **6** | **5** | **75** | **70** | **3** | **6** | **5** | **279** |

**Em resumo:** 41 itens **quebrados** (em produção ou no pipeline), 14 prontos e **não aplicados ou desligados em produção**, 24 **simulados ou stub**, 6 **declarados feitos e ausentes**, 75 **não iniciados** e 70 **parciais**.

---

## 3. Pendências transversais de produção (destravam vários módulos de uma vez)

### 3.1 Migrations do repositório que não estão no banco de produção

**Método.**

- Comparei o ledger de produção (`supabase_migrations.schema_migrations`: 362 linhas, de `20260518153051` a `20260924220000`) com os 605 arquivos do repositório.
- O casamento foi feito por versão exata ou por timestamp com tolerância de ±30 s, porque o Lovable renomeia os timestamps.
- Sobraram **49 arquivos de 18/05 em diante** sem registro no ledger.
- Para cada um, verifiquei **o efeito** (a função, a policy, a coluna ou a view existe?), já que o ledger de 22–31/08 tem só marcadores e não prova execução.
- Os 193 arquivos anteriores a 18/05 são histórico pré-ledger e ficaram fora do escopo.

**Resultado:** 32 migrations com efeito **ausente** (NÃO APLICADO EM PROD), 2 parciais e 15 com efeito já presente por outro caminho ou superadas.

| # | Migration | O que entrega | Efeito em produção |
| --- | --- | --- | --- |
| 1 | 20260521000001_harden_security_definer_search_path | Fixa `SET search_path` em ~30 funções SECURITY DEFINER | Efeito presente por outro caminho (0 secdef sem search_path em prod) — arquivo órfão, sem risco |
| 2 | 20260728140000_fix_has_any_role | Cria `has_any_role(uuid, app_role[])` faltante | Função existe em prod (aplicada fora do ledger) |
| 3 | 20260824124500_descomissionar_modulo_lalamove | Dropa objetos Lalamove (`check_integrity_invariants`, `get_active_uapi_token`, `trigger_bitrix24_sync`, FKs de alerts) | PARCIAL: `lalamove_orders`/`drivers` não existem, mas `trigger_bitrix24_sync()` ainda existe e o cron `evaluate-delivery-alerts-every-min` segue ativo |
| 4 | 20260824180000_restaurar_integridade_financeira_sem_logistica | Reescreve `check_integrity_invariants()` só com invariantes financeiros | Efeito equivalente presente: def. em prod já pula os blocos Lalamove ("SKIP") e usa lock; arquivo redundante. Mas o job horário chama `run_integrity_cycle()`, que em prod é stub (ver §5) |
| 5 | 20260825250000_recreate_6_constraints | Recria CHECKs de cnaes/faixas_simples/protocolos_st_ncms/elisao_regras_creditos | Aplicado (4 constraints conferidas em prod) |
| 6 | 20260827100000_reconciliar_views_rpcs_indices_sem_drop | Reconcilia views, RPCs (`calcular_potencial_elisao`, `gate_34_indices_nao_utilizados`, `get_acessos_suspeitos`) e índices de tenant | PARCIAL: `gate_34_indices_nao_utilizados` ausente em prod; demais RPCs existem |
| 7 | 20260827101000_hardening_views_pii_rpcs | `security_invoker` em 13 views, revoga anon de `gerar_numero_acordo`, mascara `chave_pix` em `vw_contas_receber_painel` | NÃO APLICADO: 13 views sem `security_invoker`; `anon` ainda executa `gerar_numero_acordo()`; `chave_pix` sem máscara |
| 8 | 20260902130000_fix_rls_cross_tenant_leak_financeiro | Remove policies ALL `has_role admin/financeiro` sem empresa em contas_pagar/receber/anomalias/centros_custo/parcelas_acordo | NÃO APLICADO (policies "Admins can manage …" ainda em prod) |
| 9 | 20260902140000_…_financeiro_parte2 | Mais 4 policies soltas (contas_pagar, centros_custo, de 2025-12) | NÃO APLICADO |
| 10 | 20260902150000_…_financeiro_parte3 | Mais 9 policies soltas | NÃO APLICADO |
| 11 | 20260902160000_fix_bypass_views_matviews_legadas | `security_invoker` em 4 views e revoga 4 matviews legadas que liam contas_pagar/receber sem filtro de empresa | NÃO APLICADO (views sem security_invoker) |
| 12 | 20260902170000_fix_rpcs_security_definer_sem_escopo | Revoga/escopa RPCs SECURITY DEFINER globais (ex.: `fn_verificar_vencidos`) | NÃO APLICADO (e `fn_verificar_vencidos` nem existe em prod) |
| 13 | 20260902180000_fix_nfe_vinculo_rpcs_sem_escopo | Adiciona checagem de posse (`empresa_acessivel`) nas 4+ RPCs `nfe_*` (IDOR) | NÃO APLICADO (RPCs `nfe_link/unlink/suggest/...` sem `empresa_acessivel`) |
| 14 | 20260902190000_fix_rls_cross_tenant_leak_grupo_a | Dropa 121 policies soltas em 59 tabelas (irmãs escopadas já existem) | NÃO APLICADO |
| 15 | 20260902200000_…_grupo_c | Amplia policy irmã p/ admin+financeiro e remove 10 soltas (régua/ASAAS/pix/negativações/protestos) | NÃO APLICADO |
| 16 | 20260902210000_…_grupo_b1 | Reescreve 49 policies em 26 tabelas sem irmã escopada | NÃO APLICADO |
| 17 | 20260902220000_…_sensiveis | Reescreve policies de profiles/user_empresas/sso_providers/sso_login_attempts/scim_operations_log/empresas | NÃO APLICADO |
| 18 | 20260902230000_fix_rls_tautologia_empresas_asaas_elisao | Corrige policies tautológicas (`empresa_id IN (SELECT id FROM empresas)`) | NÃO APLICADO |
| 19 | 20260902240000_fix_rls_gaps_pos_pr54 | 6 gaps de RLS que sobreviveram ao PR #54 | NÃO APLICADO |
| 20 | 20260902250000_fix_storage_view_audit_trail_gaps | Escopo por empresa no bucket `relatorios-tributarios`, view legada e audit trail | NÃO APLICADO |
| 21 | 20260902260000_fix_historico_conciliacao_ia_or_bypass | Corrige OR-bypass nas policies de historico_conciliacao_ia | NÃO APLICADO |
| 22 | 20260902270000_fix_orphan_policies_pos_pr55 | Dropa policies órfãs que sobreviveram a 3 rodadas | NÃO APLICADO |
| 23 | 20260903000100_fix_user_filter_presets_or_true | Remove `OR true` de `users_own_presets` | NÃO APLICADO (1 policy com `OR true` em prod) |
| 24 | 20260903000200_fix_alertas_preditivos_missing_select_policy | Recria SELECT de alertas_preditivos escopada | Policy `alertas_preditivos_empresa_select` existe em prod (outro nome) — efeito coberto |
| 25 | 20260903000300_fix_asaas_config_rls_role_check | Restringe asaas_config (chaves API) a admin/financeiro/contador | NÃO APLICADO (asaas_config ainda na lista de policies sem role) |
| 26 | 20260903000400_fix_certificado_get_password_idor | `certificado_get_password` valida `empresa_acessivel` | NÃO APLICADO (função sem a checagem) |
| 27 | 20260903000500_fix_desfazer_conciliacao_user_spoofing | `desfazer_conciliacao` usa `auth.uid()` + posse | NÃO APLICADO |
| 28 | 20260903000600_fix_empresa_acessivel_coalesce_ativo | `empresa_acessivel`: `ue.ativo = true` em vez de `COALESCE(ue.ativo,true)` | NÃO APLICADO (COALESCE presente) |
| 29 | 20260903000700_fix_auditar_cross_tenant_coalesce_ativo | Alinha `auditar_acessos_cross_tenant` | NÃO APLICADO |
| 30 | 20260903000800_fix_gerar_alertas_vencimento_coalesce_ativo | Alinha `gerar_alertas_vencimento` (cron diário 08:00) | NÃO APLICADO |
| 31 | 20260903000900_fix_export_asaas_audit_csv_idor | `export_asaas_audit_csv` valida `empresa_acessivel` | NÃO APLICADO |
| 32 | 20260903001000_fix_set_empresa_id_default_coalesce_ativo | Alinha trigger `set_empresa_id_default` | Sem COALESCE em prod (efeito coberto) |
| 33 | 20260903001100_fix_get_lockout_details_grant | GRANT de `get_lockout_details` a anon/authenticated | Superado por 1200/0700 (anon sem EXECUTE em prod) |
| 34 | 20260903001200_revoke_anon_get_lockout_details | Revoga anon de `get_lockout_details` | Efeito presente (anon=false) |
| 35 | 20260903001300_add_is_user_locked_function | Cria `is_user_locked(email)` (lockout pré-login) | NÃO APLICADO: função inexistente; front chama (rpc_calls.json) |
| 36 | 20260904000100_add_empresa_id_to_query_telemetry | Adiciona `query_telemetry.empresa_id` | NÃO APLICADO: coluna ausente; `external-data` insere com ela e recebe 400 (telemetria silenciada) |
| 37 | 20260904000200_grant_anon_increment_failed_attempts | GRANT anon em `increment_failed_attempts` | Revertido de propósito por 20260911110000; anon=false em prod |
| 38 | 20260904000300_fix_reset_failed_attempts | Normaliza e-mail e libera `reset_failed_attempts` p/ authenticated | Não verificável isoladamente (função existe) |
| 39 | 20260904000400_fix_is_user_locked_normalization | Normaliza `is_user_locked` | N/A (função não existe) |
| 40 | 20260904000500_fix_reset_failed_attempts_authcheck | `reset_failed_attempts` só reseta o próprio e-mail | Não verificável |
| 41 | 20260904000600_add_contas_pagar_valor_pago | Adiciona `contas_pagar.valor_pago` + recria `vw_fluxo_caixa` | Coluna existe em prod (aplicada por outro caminho) |
| 42 | 20260904000700_revoke_get_lockout_details_public | Revoga PUBLIC/anon de `get_lockout_details` | Efeito presente |
| 43 | 20260905000100_fix_darfs_orphan_policy_leak | Dropa policy `Users can manage their own darfs` (USING true) | NÃO APLICADO (policies "Admins can manage darfs"/legadas ainda presentes) |
| 44 | 20260905000200_add_totais_contas_pagar_receber | RPCs `totais_contas_pagar/receber` (KPIs por SUM no banco, sem limite 1000 linhas) | NÃO APLICADO: RPCs inexistentes; dashboards somam no client sobre `.limit(1000)` |
| 45 | 20260911110000_revoke_anon_increment_failed_attempts | Revoga anon de `increment_failed_attempts` | Efeito presente |
| 46 | 20260913120000_corrige_credenciais_automacoes_internas | Etapa 13: `segredo_cron()`, `chave_anon_vault()`, `invocar_digest_silenciamentos/conformidade()`, `notify_performance_alert_trigger` sem anon key, trigger `trg_notificar_alerta_critico_push`, `on_whatsapp_message_inserted` (IA WhatsApp) | NÃO APLICADO: nenhuma das 5 funções novas existe em prod; os 2 triggers não existem; jobs 38/39 seguem no esquema antigo (ver §6) |
| 47 | 20260913140000_rpcs_atomicas_fluxos_multi_passo | Etapa 21: RPCs atômicas (`aprovar_solicitacao_pagamento`, `gerar_darf_retencoes`, `pagar_darf_retencoes`, `registrar_nfe_com_creditos`) | NÃO APLICADO: 4 RPCs inexistentes (chamadas por src/) |
| 48 | 20261002093000_storage_financeiro_upload_via_edge | Policy restritiva: INSERT no bucket `financeiro` só via edge `upload-anexo` | NÃO APLICADO: bucket `financeiro` nem existe em prod |
| 49 | 20261004220000_vw_edge_health_eventos_conclusao | `vw_edge_health` conta só `request_end/request_error` | NÃO APLICADO: view antiga agrega todas as linhas de `edge_function_logs` |

**Antes do ledger também há efeito ausente.** Entre os arquivos anteriores a 18/05 (fora da tabela acima), confirmei efeito ausente em produção em:

- `20260317001356`: RPC `processar_fila_cobrancas`;
- `20260418121937`: RPC `cnpja_check_rate_limit`;
- `20260418153626`: bucket `relatorios-tributarios`;
- `20260418140233`: cron `refresh-benchmark-setorial-weekly`;
- `20260509132829`: trigger `handle_asaas_payment_settlement`;
- `003_seed_data.sql:295`: cron `update-overdue`, que marcaria os títulos vencidos.

O replay do zero dessas migrations também não está provado: o check Supabase Preview falha em 12 de 12 commits.

**Ledger.** Há 2 versões em produção sem arquivo no repositório (`20260518165124` e `20260728110757`). São linhas "fantasma" com `name` e `statements` nulos, inofensivas.

**Pendente desde:**

- `PLANO_100` E-004, E-005, E-029 e E-042;
- `PLANO_50` 07, 08, 11, 22 e 37;
- `PLANO_MELHORIAS_50` etapas 11, 13, 16–21 e 49.

**Por que travou:**

- A regra do `CLAUDE.md` exige DDL via `db_query`, com aprovação.
- O `prod-migrate.yml` nunca rodou (falta o secret `PROD_DB_URL` e o environment não tem aprovador).
- Não existe um gate que reprove o PR quando há migration commitada e não aplicada: o `schema-drift.yml` também depende de `PROD_DB_URL`.

### 3.2 RPCs que o sistema chama e que não existem em produção

| RPC | Criada em (repo) | Quem depende | Efeito para o usuário | Status |
| --- | --- | --- | --- | --- |
| `aprovar_solicitacao_pagamento` | `20260913140000` | `src/hooks/useAprovacoes.ts:310`, `AprovacoesPendentes.tsx:47`, `AprovacaoRapidaMobile.tsx:30`, `expert-actions/financial-actions.ts:97` | Nenhuma solicitação de pagamento pode ser aprovada (tela, mobile ou Expert) | QUEBRADO EM PRODUÇÃO |
| `gerar_darf_retencoes` / `pagar_darf_retencoes` | `20260913140000` | `src/hooks/useRetencoesFonte.ts:219,256` → `/tributario/retencoes` | Não se gera nem se baixa DARF de retenções; as 14 retenções em produção ficam pendentes para sempre | QUEBRADO EM PRODUÇÃO |
| `registrar_nfe_com_creditos` | `20260913140000` | `src/hooks/useImportacaoXMLNFe.ts:294` → `/tributario/importacao-xml` | Toda NF-e importada por XML cai em "erro"; nenhum crédito de CBS/IBS é registrado | QUEBRADO EM PRODUÇÃO |
| `totais_contas_pagar` / `totais_contas_receber` | `20260905000200` | `src/hooks/financial/useTotaisFinanceiros.ts:44,63` → `useDashboardMetrics.ts:64-70` → Dashboard Executivo (`/`) | KPIs A Pagar, A Receber, Vencidas e Receitas/Despesas do mês mostram **R$ 0,00 sem aviso**; as telas de CP/CR somam no cliente sobre `.limit(1000)` | QUEBRADO EM PRODUÇÃO |
| `is_user_locked` | `20260903001300` | `src/pages/Auth.hooks.ts:217-224` | O bloqueio por tentativas de login falha em modo aberto (*fail-open*): **nunca bloqueia**. Há 613 tentativas registradas | QUEBRADO EM PRODUÇÃO |
| `processar_fila_cobrancas` | `20260317001356` | `supabase/functions/processar-fila-cobrancas/index.ts:31-35` ← `useReguaCobranca.ts:153` | O botão "Processar fila" e o despacho da fila de cobrança falham | QUEBRADO EM PRODUÇÃO |
| `cnpja_check_rate_limit` | `20260418121937` | `supabase/functions/cnpja-lookup/index.ts:179-196` ← `useCnpjaLookup.ts:53` (onboarding tributário) | Todo CNPJ fora do cache recebe HTTP 503; o autopreenchimento por CNPJ não funciona | QUEBRADO EM PRODUÇÃO |
| `handle_asaas_payment_settlement` (trigger) | `20260509132829` | Liquidação automática de cobrança Asaas | Cobrança paga não baixa `contas_receber`, não cria movimentação nem atualiza saldo | NÃO APLICADO EM PROD |
| `confirmar_conciliacao_manual` (sobrecarga de 6 args) | `20260913140000` | `supabase/functions/conciliacao-proxy/index.ts:84-92` | "Confirmar conciliação" responde PGRST202 | QUEBRADO EM PRODUÇÃO |

### 3.3 Buckets de Storage usados pelo código e inexistentes em produção

Produção tem só `comprovantes-financeiro`, `nfe-xml` e `nfe-certificados`.

| Bucket | Quem usa | Criado por | Status |
| --- | --- | --- | --- |
| `financeiro` | `supabase/functions/upload-anexo/index.ts:17` ← `AnexoList.tsx:49` (anexos de contas a pagar e a receber) | `20261002093000` | NÃO APLICADO EM PROD: nenhum anexo financeiro pode ser gravado (`anexos_financeiros` = 0 linhas) |
| `relatorios-tributarios` | `useRelatoriosTributariosAgendados.ts`, `SpedEcfHistorico.tsx`, `enviar-relatorios-tributarios-agendados/index.ts:166` | `20260418153626` | NÃO APLICADO EM PROD: PDF e relatório tributário agendado não têm onde gravar |

### 3.4 Funções e triggers de automação que deveriam existir em produção

A migration `20260913120000_corrige_credenciais_automacoes_internas` (Etapa 13) entrega o seguinte, e **nada disso existe em produção**:

- as funções `segredo_cron()`, `chave_anon_vault()`, `invocar_digest_silenciamentos()` e `invocar_digest_conformidade()`;
- `notify_performance_alert_trigger`, sem a chave anon embutida;
- o trigger `trg_notificar_alerta_critico_push`, para push de alerta crítico;
- o trigger `on_whatsapp_message_inserted`, para análise por IA de mensagens de WhatsApp.

**Efeito:** alerta crítico não gera push, mensagem de WhatsApp não é analisada por IA e os crons de digest seguem no esquema antigo. Quatro migrations ainda trazem a chave JWT literal (`20260712194415`, `20260726180529`, `20260728183119` e `20260905130000`).

---
## 4. Módulos de negócio (ciclo completo: cadastro → processamento → integração → relatório → auditoria)

> **Contexto.** Produção tem só os dados-semente de 28/07: 1 empresa, 20 contas a pagar, 20 contas a receber, 30 movimentações, 6 boletos e 6 transferências.
>
> "QUEBRADO EM PRODUÇÃO" quer dizer que o caminho do código falha contra o schema e as RPCs que existem **hoje**, mesmo que ninguém tenha usado ainda.

### 4.1 Contas a Pagar (`/contas-pagar`, `/contas-pagar/bloqueios`, `/pagamentos-recorrentes`)

**O que existe:**

- listagem paginada (`vw_contas_pagar_painel`);
- formulário com OCR de NF e leitor de código de barras;
- pagamento total e parcial;
- solicitação de aprovação;
- ações em massa com lock otimista;
- exportação CSV/PDF;
- tela de bloqueio de duplicidade;
- recorrência via cron `gerar-contas-recorrentes-diario`.

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CP-01 | Criar conta a pagar | QUEBRADO EM PRODUÇÃO (provável; confirmar com um insert real) | `src/hooks/financial/useContasPagar.ts:119-126` envia `created_by`; a coluna não existe em `contas_pagar` em produção | Trocar por `user_id` ou criar a coluna. Sem isso, não há lançamento manual de despesa |
| CP-02 | Pagamento parcial | QUEBRADO EM PRODUÇÃO | `RegistrarPagamentoDialog.tsx:163` grava `'parcial'`. Produção tem **dois CHECK contraditórios**: `chk_contas_pagar_status` (inclui `parcial` e `vencido`) e `contas_pagar_status_check` (inclui `atrasado`, sem `parcial`). Só `pendente`, `pago` e `cancelado` passam nos dois | Unificar os CHECK e criar uma tabela de histórico de pagamentos parciais; hoje `data_pagamento` é sobrescrita a cada pagamento |
| CP-03 | Liberar pagamento aprovado | QUEBRADO EM PRODUÇÃO | `RegistrarPagamentoDialog.tsx:97-99` exige `aprovado_em`; a coluna não existe em produção | `estaAprovado` é sempre falso, então pagamentos acima da alçada **nunca são liberados** |
| CP-04 | Status "vencido" automático | NÃO INICIADO (cron planejado e nunca agendado) | `003_seed_data.sql:295` cria o cron `update-overdue`, ausente em `cron.job`. O KPI de `useContasPagarLogic.ts:179` conta só `status='vencido'`. Em produção há 6 títulos pendentes já vencidos e 0 com status `vencido` | Job diário ou coluna calculada na view. Hoje o KPI "Total vencido" é sempre R$ 0 |
| CP-05 | KPIs com base completa | PARCIAL | `useContasPagar.ts:22` usa `.limit(1000)`. `useContasPagarLogic.ts:199` usa `totalPagoMes * 0.95` como "mês anterior" (**valor inventado**) | Aplicar a RPC `totais_contas_pagar` e remover o valor fabricado |
| CP-06 | Baixa reflete no caixa | PARCIAL | `RegistrarPagamentoDialog.tsx:156-170` só atualiza `contas_pagar` | A baixa não gera `movimentacoes`, não debita a conta bancária e não contabiliza. Saldo, fluxo realizado e razão ficam errados |
| CP-07 | Estornar ou desfazer pagamento | NÃO INICIADO | grep "estorn" em CP: só aparece em Asaas, Bling e contabilidade | Ação de estorno que reabra o título e reverta a movimentação e o lançamento. Hoje o erro só se corrige por SQL |
| CP-08 | Exclusão segura | PARCIAL | `useContasPagar.ts:176` faz DELETE físico, embora a tabela tenha `deleted_at` | Soft-delete e bloqueio da exclusão de título pago, conciliado ou contabilizado. Hoje há perda de histórico financeiro |
| CP-09 | Cancelamento com motivo | PARCIAL | Só em massa (`useContasPagarLogic.ts:491-501`), sem motivo e sem estorno contábil | Cancelamento unitário com justificativa |
| CP-10 | Filtro e selo de "rejeitado" | QUEBRADO EM PRODUÇÃO | `useContasPagarLogic.ts:150,249,511` compara com `'rejeitada'`; o banco grava `'rejeitado'` (`useAprovacoes.ts:341-345`) | O filtro "Rejeitado" e o aviso na linha nunca aparecem |
| CP-11 | Baixa em lote respeita a alçada | NÃO INICIADO (bypass) | `useContasPagarLogic.ts:473-489` marca como pago sem checar aprovação | Burla a regra de alçada por valor |
| CP-12 | Parcelamento (N parcelas) | SÓ SCHEMA | As colunas `parcela_atual` e `total_parcelas` existem; o form (`ContaPagarForm.tsx`, `ContaPagarFormFields.tsx`) não tem campo de parcela | Compra parcelada vira 1 título só |
| CP-13 | Recorrência | PARCIAL | `pagamentos_recorrentes` tem 0 linhas. `gerar_contas_recorrentes` roda sem `auth.uid()`: grava `user_id` nulo e infla `total_gerado` | Dono do título gerado, contador correto, reajuste por índice e aviso de falha |
| CP-14 | Anexos (boleto e comprovante) | QUEBRADO EM PRODUÇÃO | `ContaPagarForm.tsx:479` → `AnexoList` → `upload-anexo` → o bucket `financeiro` não existe | Ver §3.3 |
| CP-15 | Remessa e pagamento em lote (CNAB 240/400) | NÃO INICIADO | grep "CNAB" e "remessa": só um texto em `Boletos.tsx:180` | Geração de remessa, aprovação de lote e retorno bancário. Hoje se paga um título por vez, manualmente |
| CP-16 | Importação de títulos por planilha | NÃO INICIADO | Não há importador de CSV/XLSX de CP | Migração de base e carga em lote |
| CP-17 | Adiantamento a fornecedor | NÃO INICIADO | grep "adiantamento" sem módulo | Título de adiantamento com compensação contra a NF |
| CP-18 | Multi-moeda | NÃO INICIADO | Sem colunas de moeda ou câmbio | A Promo importa brindes: fornecedor exterior e variação cambial ficam fora |
| CP-19 | Trilha de auditoria do título | PARCIAL | `registrar_evento_pagar` grava em `audit_logs`, mas não há trigger em `contas_pagar` e `audit_logs` está parada desde 25/08 | Trigger com valores antigo e novo, e uma timeline na UI |
| CP-20 | Isolamento por empresa | QUEBRADO EM PRODUÇÃO (segurança) | Policy "Admins can manage contas pagar" = `has_role(admin) OR has_role(financeiro)`, sem empresa; a migration `20260902130000` não foi aplicada | Aplicar a correção. Hoje admin ou financeiro de qualquer empresa vê e altera todas |
| CP-21 | Segregação de função (quem lança ≠ quem paga) | NÃO INICIADO | Nenhuma regra no hook nem na RLS | Fraude por autoaprovação |
| CP-22 | Sugestão de categoria e tags por IA | PARCIAL | `ContasPagarTableRow.tsx:217` aplica só a categoria; as tags são descartadas (a coluna não existe) | Sugestão aplicada pela metade |
| CP-23 | Exportação XLSX real | PARCIAL | `ExportMenu` gera CSV rotulado como "Excel" | — |

### 4.2 Contas a Receber (`/contas-receber`, `/dashboard-receber`)

**O que existe:**

- listagem e kanban;
- drawer de detalhe com anexos, cobranças e timeline;
- recebimento total e parcial;
- baixa por OFX;
- desconto;
- calculadora de juros e multa;
- envio de cobrança;
- acordo de parcelamento;
- webhook de recebimento configurável.

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CR-01 | Campos de boleto e recorrência no cadastro | PARCIAL (dado perdido em silêncio) | `ContaReceberForm.tsx:171-174,220`: `codigo_barras`, `link_boleto` e `frequencia_recorrencia` são exibidos e validados (`ContaReceberFormFields.tsx:544,670,683`), mas descartados no insert (TODO "coluna não existe") | O usuário digita a linha digitável ou a frequência e o dado se perde |
| CR-02 | Criar em N parcelas | SÓ UI | `ContaReceberForm.tsx:51-52,374-375` mostra "Criar N parcelas"; o insert (`:157`) grava 1 título | Loop de geração das parcelas. Hoje venda parcelada vira 1 título |
| CR-03 | Recorrência de receita | SÓ UI | `ContaReceberForm.tsx:178` grava só a flag `recorrente`; `gerar_contas_recorrentes` trata só CP | Gerador de CR recorrente; o faturamento recorrente hoje é manual |
| CR-04 | Status "vencido" automático | NÃO INICIADO | `useContasReceberLogic.ts:247`. Produção: 8 títulos pendentes vencidos e 0 com status `vencido` | Inadimplência e DSO subavaliados (mesma causa de CP-04) |
| CR-05 | Status coerente `pago` × `recebido` | PARCIAL | O CHECK aceita os dois. `useContasReceberLogic.ts:240,252` trata só `pago`; `useAcordosParcelamento.ts:233` grava `recebido` (há 4 títulos assim em produção) | Título recebido continua no "total a receber" |
| CR-06 | Baixa reflete no caixa | PARCIAL | `RegistrarRecebimentoDialog.tsx:116-145` grava em `transacoes_bancarias` como "evidência"; não grava `movimentacoes` nem atualiza o saldo | Saldo e fluxo realizado errados |
| CR-07 | Desconto e abatimento | PARCIAL | `AplicarDescontoDialog.tsx:48-55` grava só `valor_desconto` (`valor_final` foi removido), **sobrescreve `observacoes`** e não recalcula o saldo; os KPIs ignoram o desconto | O saldo a receber não cai; observações anteriores são apagadas; não há alçada para desconto |
| CR-08 | Acordo e renegociação | PARCIAL | `useAcordosParcelamento.ts:123-166` cria o acordo e as parcelas, **sem criar os títulos de CR**. `parcelas_acordo` não tem `valor_pago` nem `data_pagamento` (TODO `:193`). Ao quitar, marca os títulos originais como `recebido` sem `valor_recebido` (`:233`) | O acordo não gera fluxo de caixa, boleto nem cobrança (`acordos_parcelamento` = 0 linhas) |
| CR-09 | Baixa automática por extrato | PARCIAL | `BaixaAutomaticaDialog.tsx:76-100` casa só por valor (±0,05) e data (±5 dias), 1 para 1 | Casar por nosso número ou CNPJ, com revisão e desfazer |
| CR-10 | "Vincular manualmente" entrada não identificada | NÃO INICIADO | `BaixaAutomaticaDialog.tsx:395-402`: toast "em desenvolvimento" | Entradas sem par ficam sem baixa pela tela |
| CR-11 | Baixa automática por Asaas (boleto ou PIX pago) | QUEBRADO EM PRODUÇÃO | `asaas-webhook/index.ts:101-130` só atualiza `asaas_payments`; o trigger `handle_asaas_payment_settlement` não existe | Ver §4.6 |
| CR-12 | Enviar cobrança | PARCIAL | `EnviarCobrancaDialog.tsx:55-70` só abre `wa.me` ou `mailto:` no navegador do operador, sem registro em `historico_cobranca` e sem template; SMS = "em desenvolvimento" | Cobrança manual sem rastreio |
| CR-13 | Totais agregados | QUEBRADO EM PRODUÇÃO | RPC `totais_contas_receber` ausente; `useContasReceber.ts:16` usa `.limit(1000)` | KPIs truncados |
| CR-14 | Exclusão e cancelamento | PARCIAL | `useContasReceberLogic.ts:149` faz DELETE físico; o cancelamento é só em massa (`:374-381`) e não cancela o boleto nem a cobrança Asaas vinculados | O cliente continua sendo cobrado por título cancelado |
| CR-15 | Estorno ou devolução (nota de crédito) | NÃO INICIADO | Não há ação | Correção só por SQL |
| CR-16 | Anexos | QUEBRADO EM PRODUÇÃO | `DrawerAnexosTab.tsx`; o bucket `financeiro` não existe | Ver §3.3 |
| CR-17 | Limite de crédito por cliente | PARCIAL | `clientes.limite_credito` existe (`ClienteForm.tsx:43`); nenhuma checagem avisa ou bloqueia título acima do limite | A política de crédito não é aplicada |
| CR-18 | Multi-moeda e adiantamento de cliente (sinal) | NÃO INICIADO | Sem colunas | — |
| CR-19 | Isolamento por empresa | QUEBRADO EM PRODUÇÃO (segurança) | Policy "Admins can manage contas receber" sem empresa (migration `20260902130000` não aplicada) | Ver §5.1 |

### 4.3 Aprovações e workflow (`/aprovacoes`)

**O que existe:**

- alçada por valor (`configuracoes_aprovacao`);
- fila de pendentes;
- histórico;
- comentários;
- rejeição.

Tudo isso vale **só para contas a pagar**.

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| AP-01 | Aprovar | QUEBRADO EM PRODUÇÃO | RPC `aprovar_solicitacao_pagamento` ausente (§3.2) | Nenhuma aprovação conclui (10 solicitações em produção) |
| AP-02 | Liberar após aprovar | QUEBRADO EM PRODUÇÃO | Ver CP-03 (`aprovado_em` inexistente) | Pagamento grande fica bloqueado para sempre |
| AP-03 | Rejeitar | PARCIAL | Grava `'rejeitado'`; a lista de CP procura `'rejeitada'` (CP-10) | — |
| AP-04 | Fluxo multinível (gestor → diretoria) | SÓ UI / SÓ SCHEMA | `fluxos_aprovacao_niveis`: 0 linhas e nenhum escritor. `aprovadores_obrigatorios` é salvo e nunca aplicado. `ConfiguracaoAprovacaoCard.tsx:195,229,245`: "Adicionar etapa", lixeira e "Configurar primeiro nível" sem `onClick` | Só existe a alçada global por valor |
| AP-05 | Visualização do workflow | SIMULADO / STUB | `AprovacoesPendentes.tsx:295-306` desenha passos fixos ("Gestor Direto" atual, "Diretoria Financeira" pendente) | A tela de governança mostra um progresso falso |
| AP-06 | Observadores e cadeia sequencial ou paralela | DECLARADO FEITO, MAS AUSENTE | `FUNCIONALIDADES_SISTEMA.md` declara `aprovacao_observadores` ✅; grep "observador" = 0 | — |
| AP-07 | Segregação (solicitante ≠ aprovador) | NÃO INICIADO | `useAprovacoes.ts:300-330` não checa | Autoaprovação possível |
| AP-08 | SLA, lembrete e escalonamento | NÃO INICIADO | Não há job; `useAprovacoesPendentesCount` só conta | Pagamento atrasa sem alerta |
| AP-09 | Aprovar outras entidades (desconto de CR, transferência, lote, acesso) | NÃO INICIADO | `solicitacoes_aprovacao` tem `entidade_tipo`/`entidade_id`, mas o código só usa `conta_pagar_id` | Controle de caixa incompleto |
| AP-10 | Delegação ou substituto em férias | NÃO INICIADO | — | — |

### 4.4 Tesouraria, contas bancárias, movimentações e transferências (`/tesouraria`, `/contas-bancarias`, `/movimentacoes`)

**O que existe:**

- cadastro de conta bancária;
- 2 diálogos de transferência;
- 4 abas de tesouraria multi-CNPJ;
- lista de movimentações com totais via `obter_totais_movimentacoes`.

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| TS-01 | Saldo da conta bancária atualizado pelas operações | SÓ SCHEMA | `saldo_atual` só é gravado na criação (`NovaContaDialog.tsx:62-64`). Não há update no código nem trigger em produção (`pg_trigger`: só `updated_at`) | **Todos os cards de saldo, a tesouraria e o caixa projetado mostram o saldo inicial** |
| TS-02 | Movimentação vinculada a conta, título e categoria | QUEBRADO EM PRODUÇÃO | `movimentacoes` em produção tem só 8 colunas (sem `conta_bancaria_id`, `conta_pagar_id`, `categoria`, `conciliada`, `estornada`, `centro_custo_id`). `useFinancialOperations.ts:76,105-106` tem TODOs removendo esses campos | Extrato por conta é impossível; a movimentação não prova a que título se refere |
| TS-03 | Alimentação automática de movimentações | NÃO INICIADO | Nenhum fluxo (pagar, receber, transferir, conciliar, Asaas) grava `movimentacoes`. As 30 linhas de produção são da carga-semente | `vw_fluxo_caixa` e a tela de movimentações nunca refletem a operação |
| TS-04 | Lançar ou estornar movimentação manual | SÓ BACKEND | `useCreateMovimentacao` e `useDeleteMovimentacao` (`useFinancialOperations.ts:98,131`) sem consumidor; `Movimentacoes.tsx` só lê | Ajuste de caixa só por SQL |
| TS-05 | Transferência pela Tesouraria | QUEBRADO EM PRODUÇÃO | `financeiro/TransferenciaDialog.tsx:79` grava `status='concluido'`; o CHECK aceita `pendente`, `agendado`, `realizado`, `cancelado`, `estornado` e `erro` | A transferência falha |
| TS-06 | Transferência pela tela Contas Bancárias | PARCIAL | `useFinancialOperations.ts:199` grava `'realizado'`, mas não gera o par de movimentações nem mexe no saldo; `transferencias` não tem `movimentacao_id` nem `aprovado_por` | Toast de sucesso enganoso |
| TS-07 | Cancelar transferência | SÓ BACKEND | `useCancelTransferencia` (`:219`) sem consumidor; `cancelado_em` não existe (TODO `:226`) | — |
| TS-08 | Validar saldo na origem (servidor) | PARCIAL | Só no cliente e só em `contas-bancarias/TransferenciaDialog.tsx:60`; a versão da Tesouraria não valida saldo | Transferência acima do saldo é aceita |
| TS-09 | Transferência intercompany | PARCIAL | `FluxoInterEmpresas.tsx:17-21` só lista; não há mútuo, eliminação na consolidação nem partida dobrada | A consolidação infla caixa e receita do grupo |
| TS-10 | Editar ou sincronizar conta bancária | SÓ UI | `ContaBancariaCard.tsx:117-130`: "Sincronizar", "Editar" e "Regras de conciliação" sem `onClick` | Erro de cadastro não se corrige |
| TS-11 | Código do banco | PARCIAL | `NovaContaDialog.tsx:58` fixa `codigo_banco: '000'` | Quebra OFX, CNAB e Open Finance por banco |
| TS-12 | Mapeamento de extrato por conta | QUEBRADO EM PRODUÇÃO | `ContaBancariaCard.tsx:70-80` grava `contas_bancarias.mapeamento_extrato` (coluna inexistente; cast `as never`); o importador lê `configuracoes_conciliacao.mapeamento_extrato` (`ImportarExtratoDialog.tsx:175-186`) | O layout de CSV do banco nunca é salvo nem aplicado |
| TS-13 | Importar extrato a partir de `/contas-bancarias` | SÓ UI | `ContasBancarias.tsx:307-313`: toast "importadas com sucesso", sem persistir nada | O usuário acha que importou |
| TS-14 | Aplicações, empréstimos, cartão corporativo, câmbio | NÃO INICIADO | Não há tabela nem página | A tesouraria é só visão de saldo |
| TS-15 | Exportar movimentações | NÃO INICIADO | `Movimentacoes.tsx` não usa `ExportMenu` | — |
| TS-16 | Cabeçalho "3 CNPJs × 12+ contas" | SIMULADO / STUB (cosmético) | `Tesouraria.tsx:25` tem o texto fixo; produção tem 1 empresa e 8 contas | — |
| TS-17 | Inativar conta com vínculos | PARCIAL | `ContasBancarias.tsx:112` só faz `ativo=false`, sem checar títulos ou transações | — |

### 4.5 Conciliação bancária e Open Finance (`/conciliacao`)

**O que existe:**

- importação OFX/CSV/XLSX com deduplicação por hash e checagem de saldo final;
- sugestão por regra e por IA (`conciliacao-ia`);
- conciliação manual e split;
- divergências;
- sessões;
- auditoria;
- feedback da IA;
- exportação.

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CO-01 | Confirmar conciliação | QUEBRADO EM PRODUÇÃO | `conciliacao-proxy/index.ts:84-92` chama `confirmar_conciliacao_manual` com 6 args; produção só tem as versões de 4 e 5 args | A ação principal do módulo falha (PGRST202) |
| CO-02 | Desfazer conciliação | PARCIAL | `desfazer_conciliacao_manual` só reabre CR; CP continua `pago`; não limpa valores nem apaga `conciliacoes_parciais`. `desfazer_conciliacao` aceita `user_id` do cliente (*spoofing*; a correção `20260903000500` não foi aplicada) | Título pago sem lastro bancário |
| CO-03 | Efeito no título | PARCIAL | `confirmar_conciliacao_manual` força `pago`/`recebido` e **sobrescreve** `valor_pago` | Pagamentos parciais anteriores são perdidos |
| CO-04 | Conciliação parcial (split) | PARCIAL | `ConciliacaoSplitDialog.tsx:114-131` marca a transação como 100% conciliada e não toca o título (colunas `conciliacao_parcial` e `valor_conciliado` removidas) | Parcial indistinguível de total; o título segue aberto |
| CO-05 | "Conectar via Open Finance" na importação | SIMULADO / STUB (**grava dado falso**) | `ImportarExtratoDialog.tsx:65-135`: progresso simulado e extrato fixo (PIX +1.250, fornecedor −450, tarifa −12,50, saldo 15.420,50) persistido em `transacoes_bancarias` por `useConciliacaoPage.ts:102-235`, que ainda abre uma divergência e um alerta crítico | Risco de **poluir a conciliação real com lançamentos fictícios** |
| CO-06 | Open Finance (edge) | SIMULADO / STUB | `open-finance/index.ts:195,284,430`: instituições, consentimento e transações simulados; `import_transactions` (`:559-567`) grava os fictícios; a URL de autorização é `openbanking.example.com`; `OPEN_FINANCE_CLIENT_SECRET` e `OPEN_FINANCE_BASE_URL` nunca são lidos; `open-finance-callback` não existe | Integração real (ITP certificada, mTLS/FAPI) **NÃO INICIADA**; `open_finance_consents` = 0. O `CLAUDE.md` e o CHANGELOG anunciam como pronto |
| CO-07 | Saldos e extrato por consentimento | SÓ UI | `OpenFinanceConsentList.tsx:105-112`: botões sem `onClick` | — |
| CO-08 | Mapeamento de layout no preview | SÓ UI | `ExtratoPreviewStep.tsx:129-160`: inputs sem estado; "Salvar Layout Alpha" sem `onClick` | — |
| CO-09 | "Revisar pendentes" após importar | SÓ UI | `Conciliacao.tsx:711` com `onIrParaConciliacao={() => {}}` | Botão morto |
| CO-10 | Preview de regras | SIMULADO / STUB | `RegrasConciliacaoPanel.tsx:85-125,225` usa um `mockExtrato` fixo de 2024 | O preview não valida contra dados reais |
| CO-11 | Histórico de arquivos importados | PARCIAL | `useConciliacaoPage.ts:131-170`: o insert em `extratos_bancarios_importados` foi removido; o alerta é criado sem status nem metadata; a divergência já nasce "resolvida" pelo importador | Não há trilha de arquivo nem dono da divergência |
| CO-12 | Conciliação retroativa | SÓ UI | `useConciliacaoRetroativa.ts:17-31` cria um log "processando" e exibe o toast "Simulação de gatilho…"; nenhum worker lê `logs_conciliacao_retroativa` | Fica "processando" para sempre |
| CO-13 | Retorno CNAB, CAMT e MT940 | NÃO INICIADO | — | Banco sem OFX fica fora |
| CO-14 | Conciliação de cartão (adquirente) | NÃO INICIADO | grep Cielo, Getnet, adquirente = 0 | Recebíveis de cartão sem controle |
| CO-15 | Conciliação Asaas | SIMULADO / STUB | `asaas-proxy/index.ts:1306` chama `generate_reconciliation_suggestions`, cuja definição (`20260825110000_reconciliar_schema_v3_completo.sql:1920-1927`) é um stub que só devolve `jsonb_build_array()` e não grava em `asaas_reconciliation_suggestions`. O proxy responde `{ok:true}` | O botão conclui sem erro e **nunca gera sugestão** |
| CO-16 | Dependência da IA | A VERIFICAR | `conciliacao-ia` usa `ai.gateway.lovable.dev` (`LOVABLE_API_KEY`); o comentário em `comparar-benchmark-setorial/index.ts:2` diz que a chave está "ausente neste projeto" | Se a chave faltar, a sugestão por IA falha. Ver §4.17 |

### 4.6 Boletos, PIX e Asaas (`/boletos`, `/asaas`, `/pix-hub`, `/simulador-antecipacao`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| BP-01 | Gravar boleto emitido no Asaas | QUEBRADO EM PRODUÇÃO | `useBoletos.ts:207,216,256-266` grava `status='gerado'`, `asaas_id` e `external_provider`; em produção não existem essas colunas e o CHECK aceita só `pendente`, `enviado`, `pago`, `vencido` e `cancelado` | **A cobrança é criada no Asaas e o insert local falha: cobrança órfã.** PLANO_100 E-013 nunca foi iniciado |
| BP-02 | Liquidação automática (webhook → baixa do CR → movimentação → saldo) | NÃO APLICADO EM PROD | Trigger `handle_asaas_payment_settlement` ausente; `asaas-webhook/index.ts:101-130` atualiza só `asaas_payments` | Boleto ou PIX pago exige baixa manual |
| BP-03 | Contadores de boleto "gerado" | QUEBRADO EM PRODUÇÃO | `useBoletos.ts:457-459` | Sempre 0 |
| BP-04 | `empresa_id` obrigatório em `asaas_payments` e `asaas_customers` | NÃO INICIADO | Em produção a coluna é `is_nullable = YES` (PLANO_50 etapa 21) | Registro sem empresa quebra a guarda do `asaas-proxy` |
| BP-05 | `consultar_saldo` restrito por empresa | PARCIAL | `asaas-proxy/index.ts:782-784` só tem o gate de papel | O financeiro de qualquer empresa vê o saldo da conta Asaas |
| BP-06 | Antecipação automática de recebíveis | PARCIAL | Simulador e `solicitar_antecipacao` (`asaas-proxy:945`) só manuais | Política automática |
| BP-07 | Uso real | NUNCA ATIVADO | `asaas_payments` = 0 e `asaas_customers` = 0 em produção | A integração nunca foi exercida |
| BP-08 | Cartão de crédito como tipo de cobrança | NÃO INICIADO | O enum `tipo_cobranca` não tem `cartao` | — |

### 4.7 Cobrança, régua e WhatsApp (`/cobranca`, `/regua-cobranca`, `/whatsapp`, Configurações › Régua)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CB-01 | **Envio real de WhatsApp (Evolution API, instância `wpp2`)** | NÃO INICIADO | grep "evolution" em `supabase/functions` = 0. A ação "enviar" de `whatsapp-ia-proativo` só monta um link `https://wa.me/...` (`index.ts:495,675`). `executar-regua-cobranca/index.ts:183-191` delega a ela | **Nenhuma mensagem de cobrança sai pelo WhatsApp.** O `CLAUDE.md` §4 afirma "Cobrança IA proativa (via Evolution)" |
| CB-02 | Fila de cobrança | QUEBRADO EM PRODUÇÃO | `processar-fila-cobrancas` depende da RPC ausente (§3.2). `fila_cobrancas` = 0 linhas e sem escritor | O despacho em fila não funciona |
| CB-03 | Régua automática diária | SIMULADO / STUB + duplicidade | Cron 09:00: `processar_regua_cobranca(null,false)` é a versão SQL de "simulação" (`20260508184317`). Cron 12:00: `invocar_regua_cobranca(false)` → `executar-regua-cobranca`. Os dois rodam todo dia | Unificar em uma régua real e idempotente |
| CB-04 | E-mail de cobrança | A VERIFICAR | Depende de `RESEND_API_KEY` (13 funções). Sem a chave, `enviar-alerta-email` e `relatorio-diario-anomalias` respondem "simulado" | Confirmar o secret no painel do Supabase |
| CB-05 | Configurar régua e templates em Configurações | SIMULADO / STUB | `Configuracoes.tsx:55-89` e `Configuracoes.constants.ts:26-130`: estado local com toast "atualizada com sucesso"; os botões Nova etapa, Editar, Salvar, Copiar e Excluir (`ReguaCobrancaTab:54,121` e `TemplatesTab:138,178-184`) não têm handler | Há **duas telas conflitantes**; a real é `ReguaCobrancaConfig.tsx`. O admin acha que salvou |
| CB-06 | Análise por IA de mensagens recebidas | NÃO APLICADO EM PROD | O trigger `on_whatsapp_message_inserted` não existe (§3.4); `whatsapp_conversas` = 0 | — |
| CB-07 | Negativação (Serasa e Boa Vista) e protesto (cartório e CENPROT) | SÓ UI (registro interno) | `useProtestos.ts` e `useNegativacoes.ts` só gravam registros locais (com 5 `TODO(2026-08-14)` de colunas renomeadas ou removidas); não há integração externa | Negativação e protesto continuam manuais fora do sistema |
| CB-08 | SMS | NÃO INICIADO | `EnviarCobrancaDialog.tsx`: "funcionalidade em desenvolvimento" | — |
| CB-09 | Portal do cliente (segunda via, acordo) | PARCIAL | `portal_cliente_tokens` = 0 e `portal_cliente_acessos` sem escritor | Nunca usado |
| CB-10 | Testes E2E do fluxo régua → fila → envio → acordo | NÃO INICIADO | `e2e/regua-cobranca.e2e.ts:18-27` só renderiza a tela (PLANO_50 etapa 42) | — |
| CB-11 | Testes Deno de `processar-fila-cobrancas` e da idempotência da régua | NÃO INICIADO | Não há arquivo de teste (PLANO_MELHORIAS etapa 41) | — |

### 4.8 Compras (`/compras`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CM-01 | Aprovar, receber e cancelar pedido de compra | NÃO INICIADO | `Compras.tsx:55-60,206,288`: só lista e cria com status fixo `pendente_aprovacao`; não há update de status; a seta da linha e "Filtros avançados" não têm `onClick` | **Todo pedido fica "Pendente" para sempre** (6 em produção) |
| CM-02 | Centro de custo, autor e valor do item | PARCIAL (dado perdido) | `PedidoCompraForm.tsx:95,112`: `user_id`, `centro_custo_id` (exibido no form) e `valor_total` são descartados (TODO) | — |
| CM-03 | Gerar conta a pagar a partir do pedido ou da NF-e de entrada | NÃO INICIADO | Não há vínculo pedido → NF-e → CP | Ciclo *procure-to-pay* inexistente |
| CM-04 | Recebimento de mercadoria e estoque próprio | NÃO INICIADO | O estoque vem só do Bling (`BlingEstoquePanel.tsx`); não há custeio PEPS, UEPS ou médio (GAPS_ENTERPRISE §3) | — |
| CM-05 | "IA Compras" em Configurações | SIMULADO / STUB | `Configuracoes.tsx:168-232`: switches e slider sem estado; a "economia de 12,4%" é texto fixo | Número inventado |

### 4.9 Contabilidade (`/contabilidade`: razão, diário, balancete, DRE/balanço, plano de contas, contabilização automática, elisão)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CT-01 | Gravar lançamento contábil (manual e CSV) | QUEBRADO EM PRODUÇÃO | `NovoLancamentoDialog.tsx:51-52,184` e `useLancamentosContabeis.ts:71-73,213-220` enviam `'D'`/`'C'`. Em produção o trigger `normalizar_tipo_partida` aplica `UPPER` e o CHECK exige `'debito'`/`'credito'` | **Nenhum INSERT em `partidas_contabeis` passa** |
| CT-02 | Relatórios contábeis somam débito e crédito | QUEBRADO EM PRODUÇÃO | `demonstrativos-competencia.ts:159-160,334-344`, `useRazaoDiarioData.ts:53-54`, `useVerificacaoIntegracoes.ts:88-91` e `usePreValidacaoSped.ts:107-113` comparam com `'D'`/`'C'`; as 192 partidas de produção estão como `debito`/`credito` | DRE e balanço por competência, razão, diário e pré-validação do SPED mostram **zero e "balanceado"** |
| CT-03 | Validação de partidas dobradas | QUEBRADO EM PRODUÇÃO | `validar_partidas_dobradas` compara `'DEBITO'`/`'CREDITO'` e nunca valida; há **10 lançamentos desbalanceados** em produção | — |
| CT-04 | Contabilização automática de CP, CR, baixas e transferências | PARCIAL (só *dry-run*) | `useContabilizacaoMutations.ts:108-150` só chama `contabilizar-evento` com `dry_run` (GAPS_ENTERPRISE GE-2.1) | Razão, balancete e SPED ECD sem base automática |
| CT-05 | Fechamento ou travamento de período contábil | NÃO INICIADO | grep `periodo_fechado`, `periodos_contabeis`, `fechamento_contabil` = 0; só existe o fechamento **tributário** | Lançamento retroativo em período já entregue (SPED) |
| CT-06 | DFC pelo método indireto | NÃO INICIADO | `FluxoCaixaContabil.tsx:446,530` só tem o método direto | — |
| CT-07 | DMPL e DLPA | NÃO INICIADO | grep = 0 | — |
| CT-08 | Consolidação contábil com eliminação intercompany | NÃO INICIADO | Só existe a consolidação de tesouraria (`ConsolidacaoMultiCNPJ.tsx:42`) | Sem balancete ou DRE de grupo |
| CT-09 | Plano de contas unificado × por empresa | NÃO INICIADO | `plano_contas` é por `empresa_id` (12 contas em produção) | — |
| CT-10 | `fn_livro_razao` | ÓRFÃO | Existe em produção e ninguém chama | — |
| CT-11 | `lancamentos_contabeis.origem_id` | QUEBRADO EM PRODUÇÃO | Lido pelas edges; a coluna não existe em produção (§5.6) | Rastro lançamento → documento perdido |
| CT-12 | Elisão fiscal: simulações de regime | SÓ BACKEND / SÓ SCHEMA | `elisao_simulacoes_regime` sem escritor; `estrategias_elisao_catalogo` com RLS ligada e **0 policies** (invisível para o app; PLANO_50 etapa 19) | — |
| CT-13 | Multi-moeda e IFRS | NÃO INICIADO | GAPS_ENTERPRISE GE-1.2 e GE-10.2 | — |

### 4.10 Tributário, reforma (IBS/CBS) e retenções (`/tributario/*`, ~40 itens de menu)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| TR-01 | Gerar e pagar DARF de retenções na fonte | QUEBRADO EM PRODUÇÃO | RPCs ausentes (§3.2); `darfs` = 0 e sem escritor | As 14 retenções de produção nunca viram DARF |
| TR-02 | Importar XML de NF-e com créditos CBS/IBS | QUEBRADO EM PRODUÇÃO | RPC `registrar_nfe_com_creditos` ausente | 0 sucessos e N erros por lote |
| TR-03 | DRE tributária | SIMULADO / STUB | `gerar-dre-tributaria/index.ts:1` diz "versão determinística (stub)", com percentuais fixos; a decisão de produto está pendente (PLANO_MELHORIAS etapa 40) | — |
| TR-04 | Benchmark setorial | SIMULADO / STUB | `comparar-benchmark-setorial/index.ts:1-2` diz "stub", porque a IA foi removida "por falta de LOVABLE_API_KEY". `benchmarks_setoriais` não tem escritor; o cron `refresh-benchmark-setorial-weekly` nunca foi agendado | Comparativo estático |
| TR-05 | Heatmap tributário | SIMULADO / STUB | `gerar-heatmap-tributario/index.ts:1` diz "versão determinística (stub)" | — |
| TR-06 | Previsão de carga tributária | PARCIAL | `prever-carga-tributaria/index.ts:42,63` cai em `stub_deterministico` sem dados | — |
| TR-07 | Cálculo do IVA (`calculo-iva`) | ÓRFÃO | Nenhum chamador; o cronograma 2026–2033 está *inline*; sem teste (PLANO_MELHORIAS etapa 39) | — |
| TR-08 | Motor tributário duplicado (cliente × edge) | PARCIAL | `supabase/functions/_shared/tributario-logic.ts` (960 linhas) × `src/lib/tributario/shared-logic.ts` (809 linhas); a "cura" (gerar uma a partir da outra) não foi feita. As edges `simular-simples`, `simular-presumido`, `simular-real` e `projecao-reforma` existem, mas **ninguém as chama**: o front calcula tudo no cliente (`src/lib/tributario/*`) | Risco de divergência de cálculo; 4 funções órfãs |
| TR-09 | Paridade e casos de borda de `calculo-iva`, `decidir-regime` e `prever-carga-tributaria` | NÃO INICIADO | Não há testes (PLANO_MELHORIAS etapa 39) | — |
| TR-10 | Regimes especiais por empresa | SÓ SCHEMA | `regimes_especiais_empresa` sem escritor | — |
| TR-11 | Projeções da reforma, simulação detalhada, operações de ICMS | SÓ SCHEMA (não usadas) | `projecoes_reforma`, `simulacao_tributos_detalhados` e `operacoes_icms` sem nenhuma referência no código | — |
| TR-12 | Obrigações acessórias (DCTFWeb, EFD-Reinf, eSocial…) | SÓ UI (controle de status) | `ObrigacoesAcessorias.tsx:157-226` só marca `pendente`, `transmitida` ou `atrasada`; não há geração nem transmissão; `obrigacoes_acessorias` não existe em produção | Controle manual |
| TR-13 | Histórico de envio de relatórios tributários agendados | PARCIAL | `enviar-relatorios-tributarios-agendados/index.ts:181-188` só atualiza `ultimo_envio_em` e **avança `proximo_envio_em` mesmo quando o envio falha**; a rota `/relatorios/agendados` não existe; `relatorios_agendados` = 0 | Falha silenciosa |
| TR-14 | Fuso horário por usuário nos digests e relatórios | PARCIAL | `enviar-digest-conformidade/index.ts:35` usa fuso fixo | — |
| TR-15 | Menu fiscal (~40 itens) e rótulos "Quantum-Sentinel" | NÃO INICIADO (decisão de produto) | `sidebarFiscalNavGroup.ts`; RELATORIO_IMPLEMENTACAO §3.1 | Navegação carregada e rótulos confusos para o usuário financeiro |
| TR-16 | 7 funções tributárias com papel global e sem escopo de empresa | PARCIAL | `contract-coverage_test.ts:248-256` (`DESVIO_HAS_ROLE_CONHECIDO`): `calcular-health-score-operacional`, `comparar-benchmark-setorial`, `contabilizar-evento`, `gerar-dre-tributaria`, `gerar-heatmap-tributario`, `gerar-pdf-tributario` e `prever-carga-tributaria` | Depende da decisão do ADR-003 |

### 4.11 NF-e, SEFAZ e DF-e (`/notas-fiscais`, `/tributario/nfe-recebidas`, `/tributario/sefaz-observabilidade`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| NF-01 | **Emissão de NF-e e NFS-e** | NÃO INICIADO (integração) | `NovaNFeForm.tsx:78-82`: o submit só exibe "Emissão indisponível: integração SEFAZ precisa ser homologada"; não existe edge de autorização. `FUNCIONALIDADES_SISTEMA.md:189` e o CHANGELOG 1.0.0 dizem "Emissão NF-e ✅" | Decidir: emissor próprio (assinatura e autorização SEFAZ) ou provedor (Focus, NFE.io, Bling) |
| NF-02 | Cancelamento de NF-e | SIMULADO / STUB | `CancelamentoNFe.tsx:85-101` → `sefaz-simulator/handlers.ts:28-31,64-111`: atraso aleatório, 5% de rejeição sorteada, protocolo `Math.random` e ambiente fixo "homologação". O toast diz "NF-e cancelada com sucesso!" | **Risco fiscal:** o usuário acredita que cancelou |
| NF-03 | Inutilização de numeração | SIMULADO / STUB | `InutilizacaoNFe.tsx:112-141` com protocolo aleatório | Comprovante falso |
| NF-04 | Contingência e saúde da SEFAZ | SIMULADO / STUB | `sefaz-contingency/state.ts:107-111` usa `Math.random() > 0.1`; `ContingenciaNFe.tsx:204-209` "autoriza" por sorteio; o estado fica em `localStorage` | Pode entrar ou sair de contingência por sorteio |
| NF-05 | Lista e KPIs da tela Notas Fiscais | SIMULADO / STUB | `NotasFiscais.tsx:71-72,89-95`: `useState([])` nunca lê `notas_fiscais` (5 em produção); "Taxa de autorização" dá 0/0 = NaN% | A tela é sempre vazia |
| NF-06 | Baixar XML e DANFE | SÓ UI | `NotasFiscais.tsx:356-367`: toast "XML baixado!" e "DANFE gerado!" sem arquivo (`DANFEGenerator.tsx` não é usado) | — |
| NF-07 | Monitor, Analytics e Histórico SEFAZ da aba de NF-e | SIMULADO / STUB | `SefazMonitor.tsx`, `SefazAnalytics.tsx` e `EventosHistorico.tsx` leem o log em memória do simulador (`sefaz-event-logger.ts:41`), não `nfe_eventos` nem `v_sefaz_observability` | Dois "monitores SEFAZ" desconectados |
| NF-08 | **Captação automática de NF-e de entrada (DF-e)** | QUEBRADO EM PRODUÇÃO | O cron `sefaz-dfe-dispatcher-15min` recebe **HTTP 500 a cada 15 min**: `sefaz-dfe-dispatcher/index.ts:50-55` exige `CRON_DISPATCH_SECRET` (ausente), e o cron envia `SEFAZ_CRON_SECRET` do vault (nome diferente) | Configurar o secret e alinhar o nome. Notas de fornecedor não entram sozinhas |
| NF-09 | Certificado digital A1 | NUNCA ATIVADO | `empresas_certificados` = 0. `certificado_get_password` sem checagem de empresa (IDOR; `20260903000400` não aplicada) | Sem certificado não há DF-e nem manifestação |
| NF-10 | Manifestação do destinatário | BLOQUEADO | `sefaz-manifestar` pronta, mas sem certificado; `nfe_eventos` = 0 | — |
| NF-11 | RPCs `nfe_*` (vincular e sugerir) com checagem de posse | NÃO APLICADO EM PROD | `20260902180000` (IDOR) | — |
| NF-12 | NF-e recebida → contas a pagar automático | NÃO INICIADO | `nfe_recebidas` (31) não tem vínculo com CP nem com pedido de compra | Lançamento manual de cada nota de fornecedor |
| NF-13 | OCR de nota | PARCIAL | `notas_fiscais_ocr` sem as colunas `arquivo_tipo`, `criado_por` e `mensagem_erro` em produção | Erros de OCR não registrados |

### 4.12 SPED e obrigações (`/tributario/sped-export`, ECD/ECF wizards)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| SP-01 | DCTF e PER/DCOMP | NÃO INICIADO | `ExportacaoSPED.tsx:38-60,321-326`: `disponivel:false` com selo "Em breve"; `PerDcompPanel` é só controle manual; `FUNCIONALIDADES_SISTEMA.md` declara "edge dedicada" | — |
| SP-02 | SPED Fiscal (EFD ICMS/IPI) | NÃO INICIADO | grep = 0; `exportar-sped` (citada no doc) não existe | — |
| SP-03 | ECD, ECF e EFD-Contribuições com base contábil real | PARCIAL | Geradores prontos (testes *golden*), mas dependem da contabilização (CT-01 a CT-04), que não grava em produção | O arquivo sai vazio ou incoerente |
| SP-04 | Mudança de leiaute comunicada e validada no PVA | NÃO INICIADO | PLANO_MELHORIAS etapa 40(b): "precisa ser comunicada e confirmada antes de produção" | — |
| SP-05 | UF da empresa | PARCIAL | `ExportacaoSPED.tsx:112` cai em `'SP'` quando falta | Arquivo com UF errada |

### 4.13 Dashboard, relatórios e BI (`/`, `/relatorios`, `/bi`, `/inteligencia`, `/status`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| DB-01 | KPIs do Dashboard Executivo | QUEBRADO EM PRODUÇÃO | `useDashboardMetrics.ts:64-70,135-140` lê `totaisX?.campo ?? 0` e ignora o erro da RPC ausente | **R$ 0,00 sem aviso** |
| DB-02 | Fluxo de caixa diário | SIMULADO / STUB | Em produção `vw_fluxo_caixa_diario` devolve constantes (2500,00 / 1200,00 / 1300,00 por empresa); `useFluxoCaixaDiario` não tem consumidor | — |
| DB-03 | Dashboard arrastável ou customizável | DECLARADO FEITO, MAS AUSENTE | `DraggableDashboardGrid.tsx` e `SortableCard.tsx` não existem; `@dnd-kit/*` está instalado e não é usado | — |
| DB-04 | Cockpit CFO | DECLARADO FEITO, MAS AUSENTE | `INVENTARIO_FUNCIONALIDADES.md:203`; grep "cockpit" = 0 | — |
| DB-05 | Construtor visual de relatórios, OLAP e drill-down | NÃO INICIADO | GAPS_ENTERPRISE GE-8.1 e GE-8.2 | Só há relatórios fixos |
| DB-06 | Conector para Power BI e Looker; data warehouse | NÃO INICIADO | GE-8.4 e GE-8.5 | — |
| DB-07 | Previsão estatística (ARIMA, Prophet) | NÃO INICIADO | `analise-preditiva/index.ts:234` usa só um prompt de LLM (GE-8.6) | — |
| DB-08 | Status page independente (domínio próprio) | PARCIAL | `/status` roda dentro do próprio app (GE-12.4) | Se o app cai, a status page cai junto |
| DB-09 | KPIs de inteligência operacional | SÓ SCHEMA | `kpis_operacionais` sem escritor | — |
| DB-10 | Telas sem item de menu (só por URL) | PARCIAL | `/pix-hub`, `/tributario/auditoria-overlay`, `/tributario/pf-vinculada`, `/tributario/onboarding`, `/tributario/glossario`, `/admin/system-health`, `/admin/sre`, `/admin/bloat-monitor`, `/admin/sso`, `/admin/scim-audit`, `/admin/sso-events`, `/audit-sso-profile-sync`, `/admin/filtros-compartilhados` e `/theme-diagnostics` | Funcionalidade pronta e "escondida" |

### 4.14 Orçamento, metas e centro de custo (`/orcamentos`, `/metas`, `/centros-custo`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| OR-01 | Orçado × realizado | OK (parcial) | `useBudget.ts:59,94` calcula `actual_spent` a partir de `contas_pagar`; 8 orçamentos em produção | O realizado considera só CP, sem receitas nem movimentações |
| OR-02 | Rateio por centro de custo (1 despesa → N centros) | NÃO INICIADO | grep "rateio" fora do PIS/COFINS = 0 | Custos compartilhados não se distribuem |
| OR-03 | Centro de custo em movimentações e pedidos | QUEBRADO EM PRODUÇÃO / PARCIAL | `movimentacoes.centro_custo_id` não existe em produção; o pedido de compra descarta `centro_custo_id` (CM-02) | Relatório por centro de custo incompleto |
| OR-04 | Histórico do centro de custo | QUEBRADO EM PRODUÇÃO | `CentroCustoHistorico.tsx` lê `auditoria_financeira`, que **não tem nenhum escritor** | Tela sempre vazia |

### 4.15 Configurações, Admin e hub de integrações (`/configuracoes`, `/integracoes`, `/admin/*`)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| AD-01 | Preferências do sistema (tema, fuso, moeda, backup, notificações) | SIMULADO / STUB | `Configuracoes.tsx:77-82` e `SistemaTab.tsx:76,169-283`: "Salvar" só exibe toast; os switches "Motor Quantum-Sentinel" estão fixos em `checked={true}` | Nada persiste; o "backup automático" não existe |
| AD-02 | Roteamento de recebimentos multi-CNPJ | SIMULADO / STUB | `RegrasRoteamentoTab.tsx:34-100`: CNPJs fictícios ("Quantum Sentinel Ltda", "Alpha Logistics SA") e contas fictícias (Itaú, Bradesco, Nubank); a tabela real `regras_roteamento_financeiro` (6 linhas) não é editável | Edição aparente |
| AD-03 | Hub de Integrações | SIMULADO / STUB | `Integracoes.tsx:44-79,98,213`: KPIs fixos (4 ativas, 54 endpoints, 12,4 mil requisições em 24 h); status "ativo" literal para Bling, Asaas e WhatsApp, que **nunca foram conectados**; "Nova integração" e "Rotacionar chaves master" sem handler | Painel mostra uma saúde inexistente |
| AD-04 | "Gerar nova chave" e "Ver documentação da API" | SÓ UI | `DocumentacaoAPI.tsx:60` e `WebhookConfigPanel.tsx:219` | A gestão real está em `/admin/api` |
| AD-05 | Automações: "Executar agora" | QUEBRADO EM PRODUÇÃO | `AutomacoesTab.tsx:100-114` aponta para 4 jobs `p13-*` que não existem em `cron.job` | Botões sem efeito |
| AD-06 | Rota `/design-system-debug` | NÃO INICIADO (deprecar) | `App.tsx:120` e `ReportModal.tsx:198` (HANDOFF_VELA_DARK §10) | — |
| AD-07 | `App.tsx` compacto | NÃO INICIADO | 1.155 linhas (a meta era cerca de 336) | Manutenção |

### 4.16 Segurança, autenticação e multi-empresa

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| SG-01 | **Isolamento entre empresas (RLS)** | NÃO APLICADO EM PROD | 47 policies `has_role`/`has_any_role` **sem empresa** em 34 tabelas com `empresa_id`, mais 24 policies `true` e 1 `OR true`. As 16 migrations de correção (`20260902130000`…`20260903000100`, `20260903000300`, `20260905000100`) não foram aplicadas (§3.1) | **O maior risco aberto:** admin ou financeiro de uma empresa lê e escreve dados de todas |
| SG-02 | Views financeiras com `security_invoker` | NÃO APLICADO EM PROD | 14 views sem a opção, todas com dono `postgres` e `authenticated` com GRANT total: `vw_fluxo_caixa`, `vw_fluxo_caixa_diario`, `vw_dre_mensal`, `vw_saldos_contas`, `vw_dso_aging`, `vw_tributario_dashboard`, `vw_gastos_centro_custo`, `vw_metricas_cobranca`, `extratos_bancarios_importados`, `v_sefaz_observability`, `v_table_bloat`, `vw_rpc_hotspots`, `vw_rpc_slow_calls`, `vw_webhooks_recentes`. O `CLAUDE.md` §1.5 afirma que esse é o "padrão" | Leitura entre empresas de saldo, DRE, aging e tributário |
| SG-03 | IDOR em RPCs (`certificado_get_password`, `export_asaas_audit_csv`, `nfe_*`, `desfazer_conciliacao`) | NÃO APLICADO EM PROD | Migrations `20260903000400`, `000900`, `20260902180000` e `20260903000500` | Senha de certificado de outra empresa acessível por ID |
| SG-04 | `empresa_acessivel` considera vínculo inativo | NÃO APLICADO EM PROD | `COALESCE(ue.ativo,true)` continua em produção (`20260903000600`/`000700`/`000800`) | Usuário desligado mantém acesso |
| SG-05 | Lockout de login | QUEBRADO EM PRODUÇÃO | `is_user_locked` ausente e *fail-open*. As funções `check_login_lockout`, `check_login_lockout_v2`, `record_failed_login(_v2)` e `increment_failed_attempts` existem e **ninguém chama** | Força bruta sem bloqueio |
| SG-06 | Whitelist de IP, bloqueio por país e dispositivo conhecido no banco | ÓRFÃO | `is_ip_whitelisted`, `is_country_blocked` e `is_known_device` existem e ninguém chama (a edge `validate-ip-geo` é usada no login); `user_devices` sem escritor | Regra de dispositivo conhecido não aplicada |
| SG-07 | Admin global × admin por empresa | BLOQUEADO (decisão) | ADR-003 "proposto (aguarda decisão)"; 19 policies `_admin_all`; `user_roles` sem `empresa_id` | **Decisão sua:** um admin deve enxergar todas as empresas? |
| SG-08 | Segregação de funções (SoD) e segurança por campo | NÃO INICIADO | GAPS GE-9.1 e GE-9.2 | — |
| SG-09 | WebAuthn, biometria e passkey | DECLARADO FEITO, MAS AUSENTE | `useWebAuthn.ts:22` define `WEBAUTHN_SERVER_VERIFICATION_DISPONIVEL = false`; não há edge `webauthn-*`; `user_passkeys` e `webauthn_challenges` não são usadas | Login sem senha anunciado e inoperante |
| SG-10 | API pública por chave | PARCIAL | Existem `api-keys-manage` e `/admin/api`, mas **nenhuma edge valida `api_keys`** (0 chaves em produção); o `openapi.yaml` só cobre webhooks, SSO e SCIM | Chave emitida não dá acesso a nada |
| SG-11 | Webhooks de saída configuráveis | NÃO INICIADO | GE-11.2 | — |
| SG-12 | Audit log imutável (hash encadeado) e particionado | PARCIAL | Append-only e com FORCE RLS, mas sem `prev_hash`; `audit_logs` não é particionada em produção e está **parada desde 25/08** | — |
| SG-13 | Rate limit nas funções de IA ou API paga | PARCIAL | `checkRateLimit` em 14 de 105 funções (PLANO_50 etapa 36) | Custo aberto em caso de abuso |
| SG-14 | Bucket `relatorios-tributarios` com escopo por empresa | NÃO APLICADO EM PROD | `20260902250000`; o bucket nem existe (§3.3) | — |
| SG-15 | `asaas_config` (chaves de API) restrita a admin, financeiro e contador | NÃO APLICADO EM PROD | `20260903000300` | — |
| SG-16 | `fornecedores.empresa_id` com RLS por empresa | NÃO INICIADO | `types.ts:8678-8705` sem `empresa_id` (PLANO_100 E-035) | Fornecedor de um usuário invisível a outro da mesma empresa |
| SG-17 | `anon` ainda executa `gerar_numero_acordo()`; `chave_pix` sem máscara | NÃO APLICADO EM PROD | `20260827101000` | — |
| SG-18 | Repositório **público** com 23 credenciais no histórico | BLOQUEADO (ação sua nos painéis) | `.gitleaks-baseline.json` (19 JWT e 4 API keys); `ROTACAO_SECRETS.md:110` "Última rotação: —"; `AGENTS.md` e `BACKUP_DR.md` dizem "privado" | Rotacionar as chaves com papel `service_role` e as API keys; decidir se o repositório fica privado |
| SG-19 | CSP endurecida | NÃO INICIADO | `vercel.json:40` mantém `unsafe-eval`/`unsafe-inline` e `img-src https:`, sem `report-to` (`docs/CSP_REVISAO.md:34-46`) | — |
| SG-20 | Política de exceção do pacote de evidências | PARCIAL (inconsistente) | `SECURITY_RULES.md:32-38` diz "admin global, sem `exigirVinculoEmpresa`"; o código (`gerar-pacote-evidencias/index.ts:331-350`) exige o vínculo | Doc ou código errado |

### 4.17 Inteligência artificial (Copilot, Expert, análises preditivas, OCR, categorização)

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| IA-01 | **Dependência do gateway de IA da Lovable** | A VERIFICAR (risco alto) | 17 funções chamam `ai.gateway.lovable.dev` com `LOVABLE_API_KEY`: `analise-fluxo-ia`, `analise-preditiva`, `analyze-document`, `benchmarking-setorial`, `calcular-health-score-operacional`, `categorizar-despesa`, `conciliacao-ia`, `copilot-global`, `copilot-tributario`, `decidir-regime`, `executar-analise-preditiva`, `expert-agent`, `gerar-acoes-recomendadas`, `gerar-resumo-executivo-semanal`, `insights-relatorio`, `processar-nf-ocr` e `whatsapp-ia-proativo`. `convidar-contador` usa a mesma chave, mas no conector de e-mail. `comparar-benchmark-setorial` e `prever-carga-tributaria` viraram cálculos fixos porque a chave estaria "ausente neste projeto" (comentário em `index.ts:2`) | Confirmar o secret. Sem ele, param Copilot, Expert, categorização, sugestão de conciliação por IA, OCR de nota e análises preditivas. `decidir-regime` e `calcular-health-score-operacional` seguem entregando o resultado principal, sem o complemento de IA |
| IA-02 | Stubs no lugar da IA | SIMULADO / STUB | DRE tributária, benchmark e heatmap (TR-03 a TR-05) | — |
| IA-03 | Aprendizado da conciliação por feedback | NUNCA ATIVADO | O código grava: `SugestoesMatchIA` → `registrarFeedback` (`useHistoricoConciliacaoIA.ts:140-143`), e os 20 últimos feedbacks seguem para a análise. Mesmo assim, `feedback_conciliacao_ia` tem 0 linhas | Implementado e nunca usado |
| IA-04 | Ações recomendadas, alertas preditivos e resumos executivos | NUNCA ATIVADO | `acoes_recomendadas` = 0 (há escritor) | — |
| IA-05 | Previsão estatística (não LLM) | NÃO INICIADO | GE-8.6 | — |

### 4.18 Integrações externas

| ID | Integração | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| IN-01 | **Evolution API (WhatsApp)** | NÃO INICIADO | Ver CB-01 | Prometida no `CLAUDE.md` |
| IN-02 | Bling ERP (NF-e, estoque, vendas) | NUNCA ATIVADO | `bling_tokens` = 0; `bling_sync_logs` e `bling_webhook_events` sem escritor; `bling-proxy` sem teste | Conectar o OAuth e validar a sincronização |
| IN-03 | Bitrix24 (CRM e financeiro) | NUNCA ATIVADO | `bitrix_oauth_tokens` = 0; `bitrix_field_mappings`, `bitrix24_activities` e `bitrix_webhook_events` sem escritor; `bitrix24_tokens` e `bitrix24_stage_mappings` não usados; `sync-profile-to-bitrix` e `trigger_bitrix24_sync()` órfãos; `clientes.bitrix_id` não existe em produção | — |
| IN-04 | Asaas | NUNCA ATIVADO / QUEBRADO | Ver §4.6 | — |
| IN-05 | Open Finance | SIMULADO / STUB | Ver CO-05 e CO-06 | — |
| IN-06 | SEFAZ (DF-e, manifestação) | QUEBRADO / BLOQUEADO | Ver NF-08 a NF-10 | — |
| IN-07 | CNPJA | QUEBRADO EM PRODUÇÃO | RPC ausente (§3.2); `cnpja_cache` vazio | — |
| IN-08 | n8n | ÓRFÃO e fora do domínio | `n8n-dispatch` não é disparado por nenhum código; `n8n_workflow_configs` sem escritor; o modelo de eventos é de **logística** (`driver_approval`, "Revisar motorista": `docs/N8N_WORKFLOWS.md`, `n8n-callback` ações `update_driver_approval`); HMAC do corpo não implementado (PLANO_100 E-043) | Nenhum evento financeiro vai para o n8n. **Decisão:** redesenhar para eventos financeiros ou remover |
| IN-09 | Mapbox | ÓRFÃO | `get-mapbox-token` sem chamador; `mapbox-gl` instalado e sem import; o domínio está na CSP | Remover ou definir o uso |
| IN-10 | SSO OIDC | QUEBRADO EM PRODUÇÃO | `sso-initiate/index.ts:123-130` grava `state`, `code_verifier_hash`, `expires_at` e `app_redirect` em `sso_login_attempts` sem checar o erro, e essas colunas **não existem em produção**. No retorno, `sso-callback` busca `.eq('state', …)` (`:890`) e não acha a tentativa | Todo login OIDC por esse caminho termina em `state_invalid_or_expired` |
| IN-10b | SSO SAML e SCIM | PARCIAL (sem uso real) | 4 `sso_providers` em produção; nenhum tenant SCIM | — |
| IN-11 | Resend (e-mail) e Slack | A VERIFICAR | 13 funções dependem de `RESEND_API_KEY`; sem ela, entram em "modo simulado" | — |
| IN-12 | Push web (VAPID) | PARCIAL | Duas implementações paralelas (`sw.js` + `usePushNotifications` × `sw-push.js` + `useWebPushSubscription`); `PushNotificationsBanner` não é usado; `push_subscriptions` = 0; o trigger de push crítico não foi aplicado | — |
| IN-13 | Lalamove (logística) — descomissionada (ADR-001) | PARCIAL (resíduo) | O cron `evaluate-delivery-alerts-every-min` segue ativo e chama uma função inexistente: **HTTP 404 todo minuto** (~46 mil execuções em 35 dias) | `cron.unschedule(37)` |

### 4.19 LGPD, assinatura digital, campos customizados, i18n, PWA e acessibilidade

| ID | Item | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| OU-01 | LGPD: exclusão e anonimização | PARCIAL | `processar-solicitacao-lgpd/index.ts:168-183` anonimiza só `profiles` (não toca `auth.users`, `clientes`, contatos nem logs); a retificação é "revisão manual"; `solicitacoes_lgpd` não tem a coluna `atendida_por` em produção; 0 solicitações | Atendimento incompleto ao direito do titular |
| OU-02 | Assinatura digital de documentos (A1/A3, Clicksign, D4Sign) | SIMULADO / STUB | `AssinaturaDigital.tsx:51-52`: `// Simulação de envio` + `setTimeout(1500)` + toast de sucesso; não existe a edge `assinatura-digital` declarada em `FUNCIONALIDADES_SISTEMA.md` | O usuário acha que enviou para assinatura |
| OU-03 | Campos customizados por entidade | SÓ BACKEND (definição sem preenchimento) | `/admin/campos-customizados` define campos; `custom_field_values` não é lido nem gravado por nenhum formulário | A feature é um "fantasma" |
| OU-04 | Internacionalização PT/EN/ES | PARCIAL | `src/i18n.ts` com cerca de 14 chaves; `useTranslation` em 2 de 927 `.tsx` | — |
| OU-05 | Página offline e fila de escrita offline | NÃO INICIADO / PARCIAL | `public/offline.html` não é referenciado; existe só o cache fiscal (`offline/fiscal-cache.ts`) | — |
| OU-06 | Acessibilidade: tamanho de fonte, navegação por teclado, alto contraste com toggle | PARCIAL | Existem a navegação por teclado (`useKeyboardNavigation`, montado em `MainLayout.tsx:38`) e o `SkipLinks.tsx`. Faltam o controle de tamanho de fonte e o toggle de alto contraste (só `prefers-contrast`), declarados em `INVENTARIO_FUNCIONALIDADES.md:357-360` | — |
| OU-07 | Feature flags (`src/lib/feature-flags.ts`) | DECLARADO FEITO, MAS AUSENTE | grep = 0 | Sem *rollout* gradual |
| OU-08 | Storybook | DECLARADO FEITO, MAS AUSENTE | Os scripts estão em `package.json:39-40`; não há `.storybook/` nem `*.stories.*` | Os scripts falham |
| OU-09 | Contador externo (portal somente leitura) | PARCIAL | `ContadorReadonly.tsx` + `validar-token-contador` existem; `convidar-contador` depende da IA e do Resend | Não há uso registrado |

---

## 5. Banco de dados — o que foi planejado e não está ativo

### 5.1 RLS, policies e views

Resumo de §4.16. Em produção: 532 policies, sendo **47 sem empresa em 34 tabelas** (entre elas `alert_configurations`, `alerts`, `anomalias_detectadas`, `apuracoes_tributarias`, `asaas_*`, `bling_*`, `centros_custo`, `configuracoes_*`, `contas_pagar`, `contas_receber`, `darfs`, `empresas_certificados`, `fila_cobrancas`, `negativacoes`, `pix_templates`, `prejuizos_fiscais`, `profiles`, `protestos`, `regua_cobranca`, `relatorios_agendados`, `risk_rules`, `scim_operations_log`, `security_alerts`, `sso_*`, `templates_cobranca` e `user_empresas`). Há ainda 24 policies `true`, 1 `OR true` (`users_own_presets`) e 14 views sem `security_invoker`.

Itens abertos dos planos:

- 24 pares de índices duplicados (PLANO_100 E-033);
- 21 FKs sem índice (PLANO_50 etapas 15 e 16);
- 392 índices nunca usados (PLANO_50 etapa 17);
- `autovacuum` nas 6 tabelas financeiras (E-034);
- a policy morta `admin_only_integration_secrets` (E-032).

Todos estão **NÃO INICIADOS**.

### 5.2 Tabelas vazias, sem escritor ou não usadas

São 129 tabelas do schema público com **0 linhas** em produção (fora partições).

**23 tabelas que nenhum código escreve (SÓ SCHEMA):**

`alerts`, `asaas_reconciliation_suggestions`, `asaas_sync_queue`, `auditoria_financeira`, `benchmarks_setoriais`, `bitrix24_activities`, `bitrix_field_mappings`, `bitrix_webhook_events`, `bling_sync_logs`, `bling_webhook_events`, `catalogos_tributarios_health_history`, `darfs`, `elisao_simulacoes_regime`, `fila_cobrancas`, `fluxos_aprovacao_niveis`, `kpis_operacionais`, `n8n_workflow_configs`, `password_reset_tokens`, `portal_cliente_acessos`, `regimes_especiais_empresa`, `runtime_error_logs`, `simulacoes` e `user_devices`.

- Cada uma é uma funcionalidade iniciada no banco e não terminada no código.
- `darfs`, `fila_cobrancas` e `asaas_sync_queue` dependem das RPCs ausentes.
- `auditoria_financeira` era o destino da trilha de auditoria financeira.

**14 tabelas que nada usa (nem leitura):**

`alerts_sent`, `bitrix24_stage_mappings`, `bitrix24_tokens`, `custom_field_values`, `email_verifications`, `indices_uso_excecoes`, `mfa_sessions`, `operacoes_icms`, `projecoes_reforma`, `risk_rules`, `security_audit_logs`, `simulacao_tributos_detalhados`, `user_passkeys` e `webauthn_challenges`.

**92 tabelas vazias com escritor no código:** estão prontas, mas a funcionalidade nunca foi exercida em produção. Exemplos: `acordos_parcelamento`, `anexos_financeiros`, `asaas_payments`, `api_keys`, `relatorios_agendados`, `push_subscriptions`, `solicitacoes_lgpd`, `empresas_certificados`, `pagamentos_recorrentes`, `whatsapp_conversas`, `custom_field_definitions`, `nfe_eventos` e `open_finance_consents`.

Tabelas citadas no `ESTADO_ATUAL` e **ainda ausentes**: `account_lockouts` (citada em `src/lib/audit-priority.ts:42`) e `obrigacoes_acessorias`.

### 5.3 Funções SQL que existem em produção e ninguém chama (43)

`backfill_empresa_id`, `check_integrity_invariants`, `check_login_lockout`, `check_login_lockout_v2`, `check_nfe_xml_path_invariants`, `clear_login_attempts`, `close_stale_integrity_alerts`, `confirmar_conciliacao`, `definir_empresa_padrao`, `desfazer_conciliacao`, `drop_old_partitions`, `enqueue_webhook_retry`, `escalate_stale_integrity_alerts`, `export_asaas_audit_csv`, `faixa_simples_reparticao_valida`, `fn_livro_razao`, `gate_25_policies_sem_tenant`, `gate_27_secdef_sem_search_path`, `gate_29_rpc_sem_escopo_empresa`, `gate_30_views_inseguras`, `gate_31_tenant_sem_indice`, `gate_32_pii_sem_mascara`, `gate_33_indices_redundantes`, `gate_35_tabelas_sem_retencao`, `gerar_sigla_empresa`, `get_asaas_payment_stats`, `get_bloat_snapshots`, `has_permission`, `increment_failed_attempts`, `is_country_blocked`, `is_ip_whitelisted`, `is_known_device`, `is_token_valid`, `provisionar_usuario_atual`, `purge_old_rows`, `record_failed_login`, `record_failed_login_v2`, `registrar_evento_cobranca`, `reprocess_dlq`, `run_daily_cleanup_with_logging`, `run_observability_rpc`, `trigger_bitrix24_sync` e `use_reset_token`.

Os destaques estão na tabela.

| Grupo | Significado | Status |
| --- | --- | --- |
| `gate_25` … `gate_35` (8 *gates* de integridade) | Escritos para rodar periodicamente; não estão em nenhum cron nem no CI (o `gate_34` nem existe em produção) | ÓRFÃO |
| `reprocess_dlq`, `enqueue_webhook_retry` | Reprocessamento da fila de mensagens mortas (DLQ) de webhooks | ÓRFÃO |
| `check_login_lockout*`, `record_failed_login*`, `increment_failed_attempts` | Lockout de login | ÓRFÃO (ver SG-05) |
| `is_ip_whitelisted`, `is_country_blocked`, `is_known_device` | Controles de acesso | ÓRFÃO (ver SG-06) |
| `close_stale_integrity_alerts`, `escalate_stale_integrity_alerts` | Ciclo de vida dos alertas de integridade | ÓRFÃO |
| `fn_livro_razao` | Livro razão | ÓRFÃO |

**Funções stub em produção:**

- `run_integrity_cycle()`, chamada pelo cron horário `integrity-invariants-hourly`, devolve `status ok` sem verificar nada;
- `processar_regua_cobranca`, cron das 09:00, é a versão de simulação.

### 5.4 Rotinas agendadas (cron) — produção em 12/10

Há 31 jobs ativos.

| Job | Situação | Evidência | Status |
| --- | --- | --- | --- |
| `evaluate-delivery-alerts-every-min` (job 37, `* * * * *`) | Chama uma função de logística removida | `net._http_response`: 360 × 404 em 6 h | QUEBRADO (resíduo da Lalamove) |
| `webhook-retry-worker-1min` (job 33, `* * * * *`) | O cron envia `{trigger:'cron', limit:50}` e a função valida com `.strict()`, que aceita só `limit` (`webhook-retry-worker/index.ts:14`) | 360 × 422 "Unrecognized key 'trigger'" em 6 h | QUEBRADO: **nenhum webhook falho é reprocessado** |
| `sefaz-dfe-dispatcher-15min` (job 32) | `CRON_DISPATCH_SECRET` ausente na função; o cron envia `SEFAZ_CRON_SECRET` do vault | 24 × 500 "server-misconfigured" em 6 h | QUEBRADO |
| `enviar-digest-conformidade-horario` (job 39) e `monitorar-erros-frontend` (job 36) | Respostas 401 "Missing authorization header" compatíveis com `verify_jwt` ligado na função publicada (o `config.toml` do repositório marca `false` para `monitorar-erros-frontend`, sinal de deploy defasado) | 30 × 401 em 6 h | QUEBRADO (provável; confirmar no deploy) |
| `refresh-performance-alerts-weekly` (job 18) | `REFRESH ... CONCURRENTLY` sem índice único | Falhou em 11/10 e em 5 de 5 nos últimos 35 dias | QUEBRADO (PLANO_50 etapa 09) |
| `integrity-invariants-hourly` (job 12) | Chama `run_integrity_cycle()`, que é stub | — | SIMULADO / STUB |
| `processar-regua-cobranca-diario` (09:00) + `executar-regua-cobranca-diaria` (12:00) | Duas réguas por dia, a primeira simulada | — | PARCIAL |
| `update-overdue` | Planejado em `003_seed_data.sql:295` | Ausente | NÃO INICIADO (causa de CP-04 e CR-04) |
| `refresh-benchmark-setorial-weekly` | Planejado em `20260418140233:171` | Ausente | NÃO APLICADO EM PROD |
| `p13-*` (4 jobs) | Referenciados por `AutomacoesTab.tsx:100-114` | Ausentes | NÃO INICIADO |
| `calcular-slo-metrics-diario`, `gerar-alertas-dispatcher`, `relatorio-diario-anomalias` | O nome indica rotina periódica | Nenhum cron | ÓRFÃO |
| Frequência dos jobs de automonitoramento | PLANO_50 etapa 43 (revisar 1/min e 5/min) | Sem mudança | NÃO INICIADO |

### 5.5 Triggers de negócio e trilha de auditoria

- Em produção, as tabelas `contas_pagar`, `contas_receber`, `movimentacoes`, `transferencias` e `boletos` só têm **trigger de `updated_at`**. `lancamentos_contabeis` tem apenas numeração e lock.
- **Não existem** os triggers de:
  - auditoria (`fn_auditoria_financeira`);
  - saldo (`fn_atualizar_saldo_movimentacao`);
  - transferência → movimentação;
  - duplicidade;
  - liquidação do Asaas.
- `audit_trigger_generic` está ligado a 12 tabelas, todas de segurança ou configuração; **nenhuma financeira**.
- `auditoria_financeira`: 0 linhas e nenhum escritor.
- `audit_logs`: 431 linhas, **a última em 25/08/2026**, embora haja logins diários.

**Efeito:** não há como responder "quem alterou o valor ou o vencimento deste título e quando".

### 5.6 Colunas que o código usa e que não existem em produção (72 pares)

**Lidas ou gravadas por Edge Functions:**

`alertas_tributarios(acao_label, acao_url, resolvido_em)`, `anexos_financeiros(storage_path)`, `anomalia_detection_runs(current_step, finished_at, started_at, step_index)`, `asaas_audit_trail(new_status, payment_id, previous_status, user_id)`, `asaas_config(alert_email_address)`, `asaas_sync_queue(error_history, payment_id)`, `asaas_transfers(transaction_receipt_url, user_id)`, `audit_logs(metadata, resource_type)`, `bitrix_sync_logs(created_by)`, `clientes(bitrix_id)`, `convites(aceito_em, revogado_em)`, `edge_function_logs(context)`, `elisao_tarefas_acionaveis(bitrix_error_message)`, `empresas(ativa, inscricao_municipal)`, `evidencias_pacotes(gerado_por)`, `execucoes_cobranca(cliente_id, erro_mensagem, metadata, provider_message_id)`, `faturamento_mensal(total_tributos)`, `fila_cobrancas(erro, erro_mensagem)`, `health_scores_operacionais(calculado_em, detalhes)`, `historico_analises_preditivas(analise_completa, dados_analisados, projecoes)`, `historico_cobranca_whatsapp(ia_proxima_acao, ia_resumo, ia_sentimento)`, `historico_score_saude(indicadores, observacoes)`, `lancamentos_contabeis(origem_id)`, `movimentacoes(centro_custo_id)`, `notas_fiscais_ocr(arquivo_tipo, criado_por, mensagem_erro)`, `open_finance_consents(expires_at, revoked_at)`, `profiles(phone, telefone)`, `protocolos_st_ncms(base_legal, codigo, nome, segmento)`, `query_telemetry(empresa_id)`, `regime_decision_cache(carga_pct, regime_recomendado)`, `resumos_executivos_semanais(destinatarios, erro_envio)`, `solicitacoes_lgpd(atendida_por)`, `sso_login_attempts(app_redirect, code_verifier_hash, duration_ms, empresa_id, expires_at, state)`, `transacoes_bancarias(empresa_id)` e `verificacoes_conformidade(verificado_em)`.

**Usadas pelo front e ausentes:** `contas_pagar(created_by, aprovado_em, tags)`, `contas_bancarias(mapeamento_extrato)`, `boletos(asaas_id, external_provider)`, `movimentacoes(conta_bancaria_id, conta_pagar_id, categoria, conciliada, estornada)`, `transferencias(movimentacao_id, aprovado_por, cancelado_em)`, `contas_receber(codigo_barras, link_boleto, frequencia_recorrencia, valor_final)`, `parcelas_acordo(valor_pago, data_pagamento)`, `pedidos_compra(user_id, centro_custo_id)` e `transacoes_bancarias(conciliacao_parcial, valor_conciliado)`. A lista vem dos 31 `TODO(2026-08-14)` em 18 arquivos: PLANO_100 E-030, **PARCIAL (43 → 31)**.

**Efeito:** a maioria dos `.insert()` e `.update()` das edges não checa o erro, então **falham em silêncio**. O `schema-drift.yml` detectou a divergência do `types.ts` em 05/10 e não conseguiu abrir a PR (falta permissão do Actions).

### 5.7 CHECKs e enums incoerentes

| Objeto | Problema | Status |
| --- | --- | --- |
| `contas_pagar` | Dois CHECK de status contraditórios (§4.1 CP-02) | QUEBRADO |
| `partidas_contabeis` | CHECK `debito`/`credito` × front `D`/`C` × trigger `UPPER` × validador `DEBITO`/`CREDITO` | QUEBRADO |
| `boletos` | CHECK sem `gerado` | QUEBRADO |
| `transferencias` | CHECK sem `concluido` | QUEBRADO |
| `solicitacoes_aprovacao` | `rejeitado` × `rejeitada` | QUEBRADO |
| `contas_receber` | `pago` e `recebido` coexistem | PARCIAL |
| Enum `tipo_cobranca` | Sem `cartao` | NÃO INICIADO |
| Arquivos `001_create_tables.sql`, `002_rls_policies.sql` e `003_seed_data.sql` | Sem timestamp de 14 dígitos (PLANO_MELHORIAS etapa 49) | NÃO INICIADO |

---
## 6. CI/CD, testes, ambientes e segurança operacional

Fonte: workflows, configurações e API do GitHub, lidos em 11/10. `main` está **verde** e a branch protection exige 8 checks.

### 6.1 Pipeline e ambientes

| ID | Item planejado | Status | Evidência | O que falta e efeito |
| --- | --- | --- | --- | --- |
| CI-01 | Gates de banco no CI: RLS multi-empresa, SECURITY DEFINER, pgTAP de catálogos tributários e retenção (Gate #35) | DESATIVADO (verde sem rodar) | `ci.yml:216-291,320-337` pulam por falta do secret `DATABASE_URL` e gravam "inconclusivo" (PLANO_100 E-026) | O isolamento de tenant nunca é provado no merge |
| CI-02 | `prod-migrate` com aprovação humana | QUEBRADO | 0 execuções; falta `PROD_DB_URL`; o environment `Production` não tem *reviewers* nem restrição de branch | A via oficial de migration não funciona (causa RC-1) |
| CI-03 | `schema-drift`: PR semanal de `types.ts` e paridade do ledger | QUEBRADO | Detectou drift em 05/10 e falhou: "Actions is not permitted to create pull requests". A paridade do ledger exige `PROD_DB_URL` | — |
| CI-04 | Staging com promoção, integridade e healthcheck | NÃO INICIADO (o ambiente não existe) | Faltam `STAGING_DB_URL`, `STAGING_PROJECT_REF`, `STAGING_ANON_KEY`, `TEST_ADMIN_JWT`, `PROD_DB_URL` e a var `REQUIRED_SECRETS`; a única run (25/08) falhou | **Toda validação acontece direto em produção** |
| CI-05 | Supabase Preview (branch de banco por PR) | QUEBRADO | Falha em 12 de 12 commits de `main`: "Remote migration versions not found" | Replay do zero não provado: DR em risco |
| CI-06 | Revisão humana obrigatória de PR e CODEOWNERS aplicado | NÃO INICIADO | Não há `required_pull_request_reviews` (PLANO_MELHORIAS etapa 35; PR #115 etapa 13) | DDL ou workflow podem ir para `main` sem revisão |
| CI-07 | Deploy de Edge Functions pelo pipeline | PARCIAL | Último em 12/09; 18 commits de funções desde então; `upload-anexo` está fora do `config.toml` e da lista do workflow | O estado das funções em produção não é rastreável |
| CI-08 | CodeQL, Dependency Review e actionlint/zizmor como gates | PARCIAL (informativos) | Não são *required checks* | — |
| CI-09 | SonarCloud | PARCIAL | Vermelho em `main` desde 05/10 (Reliability D, Security C) e ignorado | — |
| CI-10 | Dependabot npm | QUEBRADO | O ecossistema está como `npm`, mas o repositório usa `bun`; 3 falhas seguidas; 6 PRs de *bump* abertas | Sem atualização automática de segurança do front |
| CI-11 | Auditor de env (`scripts/ci/audit-env.ts`) | NÃO INICIADO (integração) | Não é chamado por nenhum workflow | Teria detectado os 6 secrets ausentes |
| CI-12 | Gates de isolamento de tenant em `scripts/security/*` (Gates #25, #27 e #29, superfície anônima) | DESATIVADO | Nenhum workflow os chama | — |
| CI-13 | Gates de integridade #26 a #34 (`scripts/integrity/*`) | DESATIVADO | Exigem `STAGING_*`; os baselines estão vazios ou defasados desde 12/09 | — |
| CI-14 | Graphify semanal e "auto-sync n8n em 15 min" (`CLAUDE.md:90`) | PARCIAL | O workflow não tem `schedule`; `graph.json` não é versionado | — |
| CI-15 | Lint estrito (zero *warnings*) | PARCIAL | 71 *warnings*; o CI roda `lint` sem `--max-warnings` | — |
| CI-16 | `deno check` e `deno lint` em todas as funções | PARCIAL | `deno check` cobre 14 de 105 funções; `deno lint` cobre 30 arquivos | — |
| CI-17 | Vercel só publica depois do CI verde | NÃO INICIADO | O deploy é pela integração Git, independente do CI | Commit com CI vermelho vai ao ar |
| CI-18 | Supply chain do ambiente de agentes | PARCIAL | `.codex/config.toml` usa `npx …@latest` sem *pin* | — |
| CI-19 | `README.md` dos workflows | PARCIAL | Documenta 8 de 11 workflows e números errados | — |
| CI-20 | Plano de 100 etapas dos workflows (PR #115) | NÃO INICIADO (plano não mergeado) | Dos 12 achados A–L: A e C já resolvidos (`main` verde e 8 *required checks*); B, D, G, I, K e L **continuam** (sem `DATABASE_URL`, repositório público, sem replay de migrations, sem staging, Dependabot quebrado e 86 branches remotas); F continua (Vitest roda 2 vezes por run) | Decidir: mergear como roteiro ou fechar |

### 6.2 Testes

| ID | Item planejado | Status | Evidência |
| --- | --- | --- | --- |
| TE-01 | Cobertura ≥ 80% (`TESTING.md`) / ≥ 85% (PLANO_EXCELENCIA) | PARCIAL | 72,29% de linhas, mas o relatório considera só cerca de 374 de 1.555 arquivos (falta `coverage.include`). Pisos parados desde 13/09 |
| TE-02 | Testes das Edge Functions | PARCIAL | **75 de 105 funções sem nenhum teste.** Sem teste em caminhos de dinheiro ou fisco: `processar-fila-cobrancas`, `enviar-relatorios-tributarios-agendados`, `conciliacao-ia`, `categorizar-despesa`, `detectar-anomalias-financeiras`, `bling-proxy`, `open-finance`, `nfe-upload-certificado`, `calculo-iva`, `decidir-regime`, `prever-carga-tributaria`, `scim-server` e `bitrix24-sync` |
| TE-03 | Piso de `deno coverage` | NÃO INICIADO | PLANO_MELHORIAS etapa 44 |
| TE-04 | Quarentena E2E migrada para o modo offline | PARCIAL | 18 specs e 72 testes: **48 falham** (relatórios 16, contas a pagar 14, dashboard 7…), sem bloquear |
| TE-05 | RBAC negativo E2E (11 rotas `/admin`) | DESATIVADO | Excluído por `grepInvert`; faltam os secrets `E2E_NONADMIN_*` |
| TE-06 | Snapshots visuais autenticados | NÃO INICIADO | 12 testes nunca rodam; só há 2 baselines |
| TE-07 | Matriz de navegadores (Firefox, WebKit, mobile) | DESATIVADO | Só chromium roda; o PWA declara `portrait-primary` |
| TE-08 | pgTAP (`supabase/tests/sql/*`) | DESATIVADO | 6 arquivos e 0 executados no CI; o *harness* "PhD v2" lê um caminho de máquina local |
| TE-09 | 19 endpoints ainda devolvem 400 em vez de 422 | PARCIAL | `DIVIDA_400_CONHECIDA` em `contract-coverage_test.ts` |
| TE-10 | Teste-espelho e asserção vazia (ESTADO_ATUAL §8-🟢4) | NÃO INICIADO | — |
| TE-11 | Regressão das guardas por empresa (`asaas-proxy`, `bling-proxy`, `exigirEmpresaDoRecurso`) | NÃO INICIADO | PLANO_50 etapa 41 |
| TE-12 | E2E contra o Preview da Vercel | NÃO INICIADO | PR #115 etapa 68 |

### 6.3 Continuidade, backup e operação

| ID | Item planejado | Status | Evidência |
| --- | --- | --- | --- |
| OP-01 | Backup externo do Storage (certificados PFX, XML de NF-e, comprovantes) | NÃO INICIADO | `docs/runbooks/BACKUP_DR.md:12,19-21` reconhece a lacuna |
| OP-02 | Confirmar plano e PITR; RPO e RTO definidos | NÃO INICIADO | RPO "24 h" sem confirmação; RTO não definido |
| OP-03 | Ensaio semestral de DR | NÃO INICIADO | A tabela de ensaios está vazia; o procedimento cita variáveis e scripts que não funcionam (`VITE_SUPABASE_ANON_KEY`, `scripts/integrity` dependente de staging) |
| OP-04 | Monitor de uptime externo com alerta (Better Stack, UptimeRobot) | NÃO INICIADO | `UPTIME_OBSERVABILIDADE.md:20-24` é só "configuração sugerida" |
| OP-05 | Rotação de secrets a cada 90 dias | NÃO INICIADO | O registro de rotações está 100% vazio |
| OP-06 | Post-mortems em `docs/postmortems/` | NÃO INICIADO | O diretório não existe |
| OP-07 | Circuit breaker automático de integrações | PARCIAL | Existe um circuit breaker automático em memória (`_shared/resilience.ts`, estados fechado, aberto e semiaberto) usado por `asaas-proxy` e `bling-proxy`; o dispatcher de DF-e tem limiar próprio; e há o *kill-switch* manual `INTEGRACOES_DESATIVADAS`. Limitação: o estado vive por instância da Edge Function e não é compartilhado, e as demais integrações (Bitrix24, Open Finance, CNPJA, IA) não têm |
| OP-08 | Hotfix por `functions-deploy` + `prod-migrate` | QUEBRADO | Ver CI-02 e CI-07 |
| OP-09 | `db:migrate` = `supabase db push` | RISCO | Contraria o `CLAUDE.md` e o HOTFIX: com o ledger divergente, pode reaplicar o histórico |
| OP-10 | `db:seed` e `storybook` | QUEBRADO | Scripts sem arquivo de seed e sem Storybook |
| OP-11 | Limpeza de branches e *worktrees* | NÃO INICIADO | 86 branches remotas (PLANO_MELHORIAS etapa 46) |
| OP-12 | SLA contratual e on-call (PagerDuty) | NÃO INICIADO | GAPS GE-12.1 e GE-12.5 |

### 6.4 Dependências declaradas e não usadas (indicam features abandonadas)

- `mapbox-gl`: mapa, sem uso.
- `@dnd-kit/*`: dashboard arrastável.
- `react-resizable-panels`: o `resizable.tsx` é stub.
- `next-themes`: substituído por um `ThemeContext` próprio.
- `ogl`: o efeito Grainient foi removido.
- `@tanstack/react-query-devtools`.
- `nanoid`.
- `msw`: sem *handlers*.
- `eslint-plugin-jsx-a11y`, `eslint-plugin-import`, `eslint-plugin-react` e `prettier-plugin-tailwindcss`: instalados e **não configurados**, ou seja, o lint de acessibilidade não roda.
- Fora do lugar: `vitest-axe` e `lovable-tagger` estão em `dependencies`.

---

## 7. Observabilidade — planejado × ativo

| ID | Item | Status | Evidência em produção |
| --- | --- | --- | --- |
| OB-01 | Logs e métricas RED das Edge Functions (`withEdgeObservability` → `edge_function_logs`) | NÃO ATIVO | **1 linha no total** (25/08). O *wrapper* entrou em todas as funções depois do último deploy pelo pipeline (12/09). A coluna `edge_function_logs.context`, usada pelo código, não existe |
| OB-02 | Trilha de auditoria (`audit_logs`) | PARADA | Última linha em **25/08**; há logins até 11/10 |
| OB-03 | Erros de JavaScript do front (`frontend_error_logs`) | NÃO ATIVO | 0 linhas; o cron `monitorar-erros-frontend` lê uma tabela vazia |
| OB-04 | Web Vitals (`frontend_performance_logs`) | ATIVO | 41.099 linhas, última em 11/10 |
| OB-05 | Sentry no front com *release* e sourcemaps | PARCIAL | Inicia se houver `VITE_SENTRY_DSN` (presença na Vercel **a verificar**); não há `release` nem upload de `.map`; `sourcemap: 'hidden'`, possivelmente servido publicamente |
| OB-06 | Sentry nas Edge Functions | A VERIFICAR | O código existe; `EDGE_SENTRY_DSN` não está no `.env.example` |
| OB-07 | Alerta ativo de falha de cron e webhook | PARCIAL | O job `cron-failure-watch` existe, e mesmo assim 3 crons falham em loop há semanas sem efeito visível (PLANO_50 etapa 46) |
| OB-08 | Painel único de saúde do banco | PARCIAL | Os *gates* SQL existem e estão órfãos (§5.3) |
| OB-09 | Relatório de violação de CSP (`report-to`) | NÃO INICIADO | — |
| OB-10 | `vw_edge_health` contando só início e fim de requisição | NÃO APLICADO EM PROD | `20261004220000` |

---

## 8. Edge Functions — inventário completo (105)

> **Como ler.**
>
> - **Chamadores** é a contagem de referências fora de testes em: telas (`src`, só invocação explícita: o nome entre aspas ou `functions/v1/<nome>`) · SQL (migrations, inclusive cron e trigger) · outras funções · workflows · E2E. Webhooks de terceiros e crons criados direto em produção (como `sefaz-dfe-dispatcher`) não aparecem nas migrations.
> - **Status apurado:**
>   - "EM USO — sem defeito apurado" quer dizer que tem chamador e esta auditoria não achou defeito; não significa que foi testada ponta a ponta.
>   - "NUNCA ATIVADA" quer dizer pronta, mas a integração não tem token nem certificado em produção.
>   - "ÓRFÃ" quer dizer sem chamador.
> - Os secrets listados são os lidos diretamente pela função, além dos padrões do Supabase.

| # | Função | Status apurado | Chamadores (src·SQL·fn·CI·e2e) | Testes | Linhas (diretório) | Secrets próprios | Observação |
|---|---|---|---|---|---|---|---|
| 1 | `aceitar-convite` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 142 | — | — |
| 2 | `analise-fluxo-ia` | EM USO — sem defeito apurado | 1·0·0·2·0 | 1 | 337 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 3 | `analise-preditiva` | EM USO — sem defeito apurado | 1·0·1·0·0 | **0** | 346 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 4 | `analyze-document` | EM USO — sem defeito apurado | 2·0·0·1·0 | **0** | 214 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 5 | `api-keys-manage` | EM USO — sem defeito apurado | 1·0·0·0·0 | 1 | 162 | — | — |
| 6 | `asaas-proxy` | NUNCA ATIVADA | 4·3·1·0·0 | 2 | 1429 | ASAAS_API_KEY | asaas_payments=0 e asaas_customers=0 em prod; consultar_saldo sem escopo de empresa |
| 7 | `asaas-webhook` | PARCIAL | 1·0·6·1·0 | 1 | 237 | ASAAS_WEBHOOK_TOKEN | só atualiza asaas_payments (index.ts:101-130); não baixa contas_receber/boletos, não gera movimentação |
| 8 | `benchmarking-setorial` | EM USO — sem defeito apurado | 1·0·0·1·0 | **0** | 183 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 9 | `bitrix24-sync` | NUNCA ATIVADA | 3·0·0·0·0 | **0** | 887 | BITRIX24_ACCESS_TOKEN BITRIX24_CLIENT_ID BITRIX24_CLIENT_SECRET BITRIX24_DOMAIN | bitrix_oauth_tokens=0 |
| 10 | `bitrix24-webhook` | NUNCA ATIVADA | 1·0·1·0·0 | 1 | 204 | — | bitrix_webhook_events sem escritor |
| 11 | `bling-proxy` | NUNCA ATIVADA | 2·0·0·0·0 | **0** | 999 | BLING_CLIENT_ID BLING_CLIENT_SECRET | bling_tokens=0 em prod |
| 12 | `bling-webhook` | NUNCA ATIVADA | 0·0·4·0·0 | 1 | 370 | — | bling_tokens=0 |
| 13 | `calcular-health-score-operacional` | EM USO — sem defeito apurado | 2·0·1·0·0 | **0** | 326 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 14 | `calcular-slo-metrics-diario` | ÓRFÃ | 0·0·0·0·0 | **0** | 122 | — | nenhum cron/código chama; nome sugere job diário nunca agendado |
| 15 | `calculo-iva` | ÓRFÃ | 0·0·0·0·0 | **0** | 71 | — | nenhum chamador; CRONOGRAMA 2026-2033 inline; sem teste |
| 16 | `categorizar-despesa` | EM USO — sem defeito apurado | 1·0·1·1·0 | **0** | 202 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 17 | `ci-security-gate-log` | EM USO (CI) | 0·0·0·1·0 | 1 | 193 | DENO_TESTING | chamada pelo script de CI scripts/security/test-rpc-runtime.ts |
| 18 | `cnpja-lookup` | QUEBRADA EM PROD | 1·1·0·0·0 | **0** | 346 | CNPJA_API_KEY | RPC cnpja_check_rate_limit ausente → HTTP 503 em todo CNPJ fora do cache (index.ts:179-196) |
| 19 | `comparar-benchmark-setorial` | STUB | 1·0·2·0·0 | **0** | 151 | — | 'versão determinística (stub)' — removida a IA por falta de LOVABLE_API_KEY (index.ts:1-2) |
| 20 | `compare-schemas` | ÓRFÃ (ferramenta dev) | 0·0·0·0·0 | **0** | 123 | SCHEMA_COMPARE_EXTERNAL_SERVICE_ROLE_KEY SCHEMA_COMPARE_EXTERNAL_URL SUPABASE_DB_URL | sem chamador; arquivo tinha chave service_role no histórico (.gitleaks-baseline) |
| 21 | `conciliacao-ia` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 279 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 22 | `conciliacao-proxy` | QUEBRADA EM PROD | 1·2·0·2·0 | 1 | 135 | DENO_TESTING | chama confirmar_conciliacao_manual com 6 args; prod só tem 4/5 args (index.ts:84-92) → conciliar falha |
| 23 | `consulta-tributaria` | EM USO — sem defeito apurado | 2·0·0·0·0 | 1 | 536 | — | — |
| 24 | `contabilizar-evento` | PARCIAL | 2·0·0·0·0 | **0** | 262 | — | front só chama com dry_run (useContabilizacaoMutations.ts:108-150); INSERT de partidas falha por CHECK |
| 25 | `convidar-contador` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 246 | CONTADOR_INVITE_SECRET LOVABLE_API_KEY RESEND_API_KEY SUPABASE_JWT_SECRET | usa LOVABLE_API_KEY no conector de e-mail (com RESEND_API_KEY), não no gateway de IA |
| 26 | `convidar-usuario` | EM USO — sem defeito apurado | 1·0·0·3·0 | 1 | 240 | — | — |
| 27 | `copilot-global` | EM USO — sem defeito apurado | 1·0·1·0·0 | **0** | 305 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 28 | `copilot-tributario` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 177 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 29 | `decidir-regime` | EM USO — sem defeito apurado | 1·1·4·0·0 | **0** | 386 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 30 | `detectar-anomalias-financeiras` | EM USO — sem defeito apurado | 3·0·0·0·0 | **0** | 415 | — | — |
| 31 | `digest-silenciamentos-erro` | EM USO — sem defeito apurado | 0·12·0·0·0 | **0** | 263 | RESEND_API_KEY SLACK_WEBHOOK_URL | — |
| 32 | `enviar-alerta-email` | SIMULADA sem RESEND | 0·0·5·2·0 | 1 | 227 | RESEND_API_KEY | sem RESEND_API_KEY devolve 'Email simulado' (index.ts:55-64) |
| 33 | `enviar-bitrix24-tributario` | NUNCA ATIVADA | 1·0·0·0·0 | **0** | 199 | BITRIX24_ACCESS_TOKEN BITRIX24_DOMAIN | Bitrix não conectado |
| 34 | `enviar-convite-organizacao` | PARCIAL | 1·0·0·0·0 | **0** | 185 | RESEND_API_KEY RESEND_FROM | 'modo simulado' quando não há provedor de e-mail (index.ts:134) |
| 35 | `enviar-digest-conformidade` | PROVÁVEL 401 | 1·2·0·0·0 | **0** | 471 | RESEND_API_KEY RESEND_FROM | verify_jwt=true e o cron não manda Authorization → 'Missing authorization header' (inferido de net._http_response) |
| 36 | `enviar-relatorios-tributarios-agendados` | EM USO — sem defeito apurado | 0·1·0·0·0 | **0** | 225 | RESEND_API_KEY | — |
| 37 | `executar-analise-preditiva` | ÓRFÃ | 0·0·0·2·0 | 1 | 469 | LOVABLE_API_KEY | nenhum cron ou tela chama (só testes); nome indica execução agendada nunca agendada; depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 38 | `executar-fechamento-tributario` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 351 | RESEND_API_KEY | — |
| 39 | `executar-regua-cobranca` | PARCIAL | 0·2·0·1·0 | 1 | 238 | REGUA_CRON_SECRET | canal WhatsApp delega a whatsapp-ia-proativo (só link); roda junto com o stub SQL processar_regua_cobranca (09h e 12h) |
| 40 | `executar-relatorios` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 580 | — | — |
| 41 | `expert-agent` | EM USO — sem defeito apurado | 2·0·0·0·0 | **0** | 245 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 42 | `exportar-sped-contribuicoes` | EM USO — sem defeito apurado | 1·1·3·0·0 | 1 | 387 | — | — |
| 43 | `external-data` | PARCIAL | 2·1·0·2·0 | **0** | 458 | EXTERNAL_SUPABASE_SERVICE_KEY EXTERNAL_SUPABASE_URL | grava query_telemetry.empresa_id (coluna ausente em prod) → telemetria silenciada |
| 44 | `gerar-acoes-recomendadas` | EM USO — sem defeito apurado | 2·0·0·0·0 | **0** | 228 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 45 | `gerar-alertas` | EM USO — sem defeito apurado | 0·0·1·0·0 | **0** | 342 | — | — |
| 46 | `gerar-alertas-dispatcher` | ÓRFÃ | 0·0·0·0·0 | **0** | 91 | — | nenhum cron/código chama |
| 47 | `gerar-alertas-tributarios` | EM USO — sem defeito apurado | 0·0·1·2·0 | 1 | 375 | — | — |
| 48 | `gerar-dre-tributaria` | STUB | 1·0·0·0·0 | **0** | 146 | — | 'versão determinística (stub)' com percentuais fixos (index.ts:1) |
| 49 | `gerar-heatmap-tributario` | STUB | 1·0·0·0·0 | **0** | 168 | — | 'versão determinística (stub)' (index.ts:1) |
| 50 | `gerar-pacote-evidencias` | EM USO — sem defeito apurado | 2·0·0·0·0 | **0** | 407 | — | — |
| 51 | `gerar-pdf-tributario` | EM USO — sem defeito apurado | 1·1·0·0·0 | **0** | 350 | — | — |
| 52 | `gerar-relatorio-anual` | EM USO — sem defeito apurado | 1·0·1·0·0 | **0** | 204 | — | — |
| 53 | `gerar-resumo-executivo-semanal` | EM USO — sem defeito apurado | 2·0·0·0·0 | **0** | 317 | LOVABLE_API_KEY RESEND_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 54 | `gerar-resumo-financeiro-diario` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 111 | — | — |
| 55 | `gerar-snapshots-conformidade` | EM USO — sem defeito apurado | 1·1·0·0·0 | **0** | 286 | — | — |
| 56 | `gerar-sped-ecd` | EM USO — sem defeito apurado | 1·1·3·0·0 | 1 | 735 | — | — |
| 57 | `gerar-sped-ecf` | EM USO — sem defeito apurado | 2·0·3·0·0 | 1 | 718 | — | — |
| 58 | `get-mapbox-token` | ÓRFÃ | 0·0·0·0·0 | **0** | 27 | MAPBOX_ACCESS_TOKEN | mapbox-gl instalado e nunca importado no front |
| 59 | `get-vapid-key` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 51 | VAPID_PUBLIC_KEY | — |
| 60 | `health` | EM USO — sem defeito apurado | 1·10·3·0·0 | **0** | 138 | — | — |
| 61 | `insights-relatorio` | EM USO — sem defeito apurado | 1·0·0·1·0 | **0** | 179 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 62 | `log-sped-bitrix24` | NUNCA ATIVADA | 1·0·0·0·0 | **0** | 239 | BITRIX24_ACCESS_TOKEN BITRIX24_DOMAIN | Bitrix não conectado |
| 63 | `mcp-query` | EM USO — sem defeito apurado | 0·1·0·5·0 | 2 | 616 | — | — |
| 64 | `monitorar-erros-frontend` | A VERIFICAR | 1·3·0·0·0 | **0** | 262 | RESEND_API_KEY SLACK_WEBHOOK_URL | cron */15; respostas 401 em prod compatíveis com esta função; frontend_error_logs=0 |
| 65 | `n8n-callback` | WEBHOOK SEM USO | 0·0·0·0·0 | 1 | 205 | DENO_TESTING | inbound do n8n; ações create_task/update_driver_approval (domínio de logística) |
| 66 | `n8n-dispatch` | ÓRFÃ | 0·0·0·0·0 | **0** | 214 | N8N_DISPATCH_SECRET | nenhum código dispara eventos; n8n_workflow_configs vazia; modelo de evento 'driver_approval' (logística) |
| 67 | `nfe-upload-certificado` | NUNCA ATIVADA | 1·0·0·0·0 | **0** | 270 | NFE_CERT_MASTER_KEY | empresas_certificados=0 em prod |
| 68 | `nfe-vinculo-proxy` | EM USO — sem defeito apurado | 1·1·0·3·0 | 1 | 156 | DENO_TESTING | — |
| 69 | `notify-performance-alert` | EM USO — sem defeito apurado | 0·7·0·0·0 | 1 | 204 | DENO_TESTING | — |
| 70 | `notify-saved-filter` | EM USO — sem defeito apurado | 2·0·0·0·0 | **0** | 251 | RESEND_API_KEY | — |
| 71 | `open-finance` | SIMULADA | 3·0·0·0·0 | **0** | 638 | OPEN_FINANCE_CLIENT_ID OPEN_FINANCE_REDIRECT_URI | instituições, consentimento e transações fictícias; URL openbanking.example.com; OPEN_FINANCE_CLIENT_SECRET/BASE_URL nunca lidas; open-finance-callback não existe |
| 72 | `overlay-rejeicoes-auditoria` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 192 | — | — |
| 73 | `prever-carga-tributaria` | PARCIAL | 1·0·0·0·0 | **0** | 194 | — | cai em origem 'stub_deterministico' quando faltam dados (index.ts:42,63) |
| 74 | `processar-fila-cobrancas` | QUEBRADA EM PROD | 1·0·0·0·0 | **0** | 158 | — | depende da RPC processar_fila_cobrancas, ausente em prod (index.ts:31-35) → a fila inteira não roda |
| 75 | `processar-nf-ocr` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 197 | LOVABLE_API_KEY | depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 76 | `processar-solicitacao-lgpd` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 238 | — | — |
| 77 | `projecao-reforma` | ÓRFÃ | 0·0·0·0·0 | **0** | 207 | — | o front calcula no cliente (src/lib/tributario/projecao-reforma.ts); a edge não é chamada |
| 78 | `relatorio-diario-anomalias` | ÓRFÃ + SIMULADA | 0·0·0·0·0 | **0** | 297 | RESEND_API_KEY | sem cron/chamador; sem RESEND_API_KEY marca envio 'simulado' (index.ts:231-237) |
| 79 | `scim-server` | SEM USO | 2·0·0·0·0 | **0** | 1156 | — | sem tenant SCIM configurado; URL example.com em comentário/doc |
| 80 | `sefaz-dfe-dispatcher` | QUEBRADA EM PROD | 0·0·0·0·0 | 1 | 342 | CRON_DISPATCH_SECRET | secret CRON_DISPATCH_SECRET ausente → HTTP 500 server-misconfigured a cada 15 min (index.ts:50-55); cron envia SEFAZ_CRON_SECRET do vault (nome diferente) |
| 81 | `sefaz-dfe-puxar` | BLOQUEADA | 0·0·1·0·0 | 5 | 563 | SEFAZ_CRON_SECRET | sem certificado cadastrado e dispatcher quebrado |
| 82 | `sefaz-manifestar` | BLOQUEADA | 2·0·0·0·0 | 1 | 311 | — | sem certificado cadastrado |
| 83 | `send-device-alert` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 181 | RESEND_API_KEY | — |
| 84 | `send-push-notification` | PARCIAL | 4·4·3·0·0 | 1 | 366 | VAPID_PRIVATE_KEY VAPID_PUBLIC_KEY | push_subscriptions=0; trigger de push crítico não aplicado (migration 20260913120000) |
| 85 | `simular-presumido` | ÓRFÃ | 0·0·0·0·0 | **0** | 34 | — | o front calcula no cliente (src/lib/tributario/simular-presumido.ts); a edge não é chamada |
| 86 | `simular-real` | ÓRFÃ | 0·0·0·0·0 | **0** | 34 | — | o front calcula no cliente (src/lib/tributario/simular-real.ts); a edge não é chamada |
| 87 | `simular-simples` | ÓRFÃ | 0·0·0·0·0 | **0** | 49 | — | o front calcula no cliente (src/lib/tributario/simular-simples.ts); a edge não é chamada |
| 88 | `sincronizar-anomalia-bitrix24` | NUNCA ATIVADA | 1·0·0·0·0 | **0** | 236 | BITRIX24_ACCESS_TOKEN BITRIX24_DOMAIN | Bitrix não conectado |
| 89 | `sso-callback` | EM USO — sem defeito apurado | 2·0·3·0·0 | 2 | 1388 | — | — |
| 90 | `sso-generate-metadata` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 78 | — | — |
| 91 | `sso-initiate` | EM USO — sem defeito apurado | 2·0·3·0·0 | **0** | 167 | — | — |
| 92 | `sso-logout` | EM USO — sem defeito apurado | 4·0·0·0·0 | **0** | 106 | — | — |
| 93 | `sso-test-login` | EM USO — sem defeito apurado | 2·0·1·3·0 | 2 | 437 | — | — |
| 94 | `sso-validate-config` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 148 | — | — |
| 95 | `sync-profile-to-bitrix` | ÓRFÃ | 0·0·0·0·0 | **0** | 277 | BITRIX24_ACCESS_TOKEN BITRIX24_CLIENT_ID BITRIX24_CLIENT_SECRET BITRIX24_DOMAIN | nenhum chamador; Bitrix nunca conectado (bitrix_oauth_tokens=0) |
| 96 | `upload-anexo` | NÃO PUBLICÁVEL | 1·2·0·0·0 | **0** | 121 | — | fora do config.toml e da lista do functions-deploy; bucket 'financeiro' não existe em prod |
| 97 | `validar-token-contador` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 152 | CONTADOR_INVITE_SECRET SUPABASE_JWT_SECRET | — |
| 98 | `validate-ip-geo` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 218 | — | — |
| 99 | `verificar-conformidade-fiscal` | EM USO — sem defeito apurado | 1·0·0·0·0 | **0** | 323 | — | — |
| 100 | `webhook-replay` | EM USO — sem defeito apurado | 0·0·1·0·0 | **0** | 113 | — | — |
| 101 | `webhook-retry-worker` | QUEBRADA EM PROD | 0·1·1·0·0 | **0** | 110 | ASAAS_WEBHOOK_TOKEN | cron envia {trigger,limit}; schema .strict() aceita só limit (index.ts:14) → HTTP 422 a cada minuto; nenhum webhook é reprocessado |
| 102 | `webhook-simulator` | FERRAMENTA DE TESTE | 1·0·0·1·0 | 1 | 239 | ASAAS_WEBHOOK_TOKEN | simulador; ligado só por var ENABLE_PRODUCTION_SIMULATION_AUDIT=false |
| 103 | `whatsapp-ai-analyzer` | EM USO — sem defeito apurado | 0·4·0·0·0 | **0** | 93 | OPENAI_API_KEY | — |
| 104 | `whatsapp-ia-proativo` | PARCIAL | 2·0·3·2·0 | 1 | 918 | LOVABLE_API_KEY | 'enviar' só monta link wa.me (index.ts:495,675) — não há envio real via Evolution/API; IA via gateway Lovable; depende do gateway de IA Lovable (LOVABLE_API_KEY) |
| 105 | `whatsapp-webhook` | WEBHOOK SEM USO | 0·0·0·0·0 | 1 | 199 | — | inbound; whatsapp_conversas=0 em prod |

**Resumo das 105 funções:**

| Situação | Quantas |
| --- | --- |
| Em uso, sem defeito apurado (inclui 1 chamada só pelo CI) | 56 |
| Nunca ativadas (integração sem token ou certificado) | 9 |
| Parciais | 8 |
| Órfãs, sem chamador (inclui `relatorio-diario-anomalias`, que também é simulada, e as 4 versões de servidor dos simuladores tributários) | 13 |
| Quebradas em produção | 5 |
| Simuladas ou stub (3 stubs determinísticos, Open Finance, e-mail simulado) | 5 |
| Bloqueadas (sem certificado) | 2 |
| Webhooks de entrada sem uso | 2 |
| Prováveis 401 ou a verificar | 2 |
| Não publicável (`upload-anexo`) | 1 |
| SCIM sem tenant | 1 |
| Ferramenta de teste | 1 |

**Testes:** **75 funções sem teste.**

**Catálogo desatualizado:** `docs/EDGE_FUNCTIONS_CATALOG.md` ("87 funções", de 17/07) lista 2 arquivos soltos como se fossem funções e **omite 21 funções reais**:

`aceitar-convite`, `api-keys-manage`, `ci-security-gate-log`, `conciliacao-proxy`, `consulta-tributaria`, `convidar-usuario`, `digest-silenciamentos-erro`, `enviar-convite-organizacao`, `enviar-digest-conformidade`, `gerar-snapshots-conformidade`, `mcp-query`, `monitorar-erros-frontend`, `nfe-upload-certificado`, `nfe-vinculo-proxy`, `overlay-rejeicoes-auditoria`, `sefaz-dfe-dispatcher`, `sefaz-dfe-puxar`, `sefaz-manifestar`, `upload-anexo`, `webhook-replay` e `webhook-retry-worker`.

**Pendentes de padronização:**

- `@supabase/supabase-js@2.49.4` fixado em 19 funções, contra 2.87.1 no front (PLANO_100 E-039);
- arquivos grandes: `asaas-proxy` (1.383 linhas), `sso-callback` (1.222), `scim-server` (1.155) e `bling-proxy` (998) (PLANO_EXCELENCIA #4);
- `getAppBaseUrl()` retorna vazio em silêncio (PLANO_50 etapa 26).

---

## 9. Planos documentados × status, documento por documento

> A tabela traz o que **continua aberto** em cada plano, verificado no código e em produção. Os itens já detalhados acima só são referenciados.

### 9.1 `PLANO_100.md` + `AUDITORIA.md`

43 etapas e 44 achados, de 24/09. Resultado: **27 feitas, 16 abertas**.

| Etapa | Item | Status |
| --- | --- | --- |
| E-003 | Rotacionar a `service_role` vazada do projeto `xyykivpcdbfukaongpbw` | BLOQUEADO (ação externa; sem registro) |
| E-004 / E-042 | Aplicar `20260913120000`: credenciais das automações, push e WhatsApp IA | NÃO APLICADO EM PROD (§3.4) |
| E-005 | Aplicar `20260913140000`: RPCs atômicas | NÃO APLICADO EM PROD (§3.2) |
| E-006 | Gate que reprova migration commitada e não aplicada, mais a regra no `CONTRIBUTING` | PARCIAL (o `schema-drift` depende de um secret inexistente; o `CONTRIBUTING` não fala de migration) |
| E-013 | Colunas `asaas_id` e `external_provider` em `boletos` | NÃO INICIADO (BP-01) |
| E-026 | CI falha sem `DATABASE_URL` em vez de "inconclusivo" | NÃO INICIADO (CI-01) |
| E-027 | Sentry de verdade no front | PARCIAL (OB-05) |
| E-028 | Backup e PITR verificados, com restore testado | PARCIAL (OP-01 a OP-03) |
| E-029 | Reconciliar migrations × ledger | NÃO INICIADO (§3.1) |
| E-030 | Resolver os 43 `TODO(2026-08-14)` de schema drift | PARCIAL (sobram 31 em 18 arquivos) |
| E-032 | Remover a policy morta `admin_only_integration_secrets` | NÃO INICIADO |
| E-033 | Remover os 24 pares de índices duplicados | NÃO INICIADO |
| E-034 | `autovacuum` nas tabelas financeiras | NÃO INICIADO |
| E-035 | `fornecedores.empresa_id` com RLS | NÃO INICIADO (SG-16) |
| E-039 | Atualizar o `supabase-js` das edges | NÃO INICIADO |
| E-043 | HMAC do corpo em `n8n-callback` | NÃO INICIADO |

### 9.2 `PLANO_50.md`

De 24/09. Fora as duplicatas do PLANO_100, estes continuam abertos:

- 06: confirmar o deploy da Vercel depois de cada merge (não verificável);
- 09: cron 18 (§5.4);
- 15 e 16: 21 FKs sem índice;
- 17: 392 índices sem uso;
- 18: 14 views (SG-02);
- 19: policy de `estrategias_elisao_catalogo`;
- 20: decisão sobre admin global (SG-07);
- 21: `empresa_id` NOT NULL no Asaas;
- 23: replay do zero;
- 26: `getAppBaseUrl`;
- 28: 215 casts `as any`;
- 30: `consultar_saldo` por empresa;
- 35: varredura de histórico e *push protection*;
- 36: rate limit na IA;
- 41: testes de guarda por empresa;
- 42: E2E de cobrança;
- 43: frequência dos crons;
- 44: sourcemaps e *release*;
- 46: alerta de cron;
- 47: painel de saúde;
- 48: documento único de regras de segurança;
- 50: re-auditoria "antes × depois" (este documento cumpre parte dela).

### 9.3 `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`

Feitas: 3–10, 12, 14–15, 22–26, 28–30, 31 (primeira onda), 32–34, 36–38 e 44 (gate).

Abertas:

| Etapa | Item | Status |
| --- | --- | --- |
| 1, 2 | Rotacionar a `service_role` (compare-schemas) e as credenciais do `migrate-helper` | BLOQUEADO (sem registro de rotação) |
| 11 | ADR-003: papéis por empresa | BLOQUEADO (decisão) |
| 13 | Chaves anon no Vault | NÃO APLICADO EM PROD |
| 16–21 | Fluxos atômicos via RPC | NÃO APLICADO EM PROD |
| 27 | Modo consolidado com agregação real | PARCIAL (`EmpresaScopeContext.tsx:136-138` usa só `ids[0]`) |
| 31 | Próximas ondas da quarentena E2E | PARCIAL |
| 35 | Revisão obrigatória | NÃO INICIADO |
| 39 | Paridade dos motores (IVA, regime, previsão) e "cura" da duplicação | PARCIAL |
| 40 | Decisão sobre o stub da DRE e comunicação do leiaute SPED | PARCIAL |
| 41–43 | Testes de cobrança, conciliação, IA e integrações | NÃO INICIADO ou PARCIAL |
| 44 | Piso de `deno coverage` e 19 endpoints com 400 | PARCIAL |
| 45 | Gatilho do grafo e promessa do n8n no `CLAUDE.md` | PARCIAL |
| 46 | Limpeza de branches | NÃO INICIADO |
| 47 | 5 commits órfãos e `REMOTE_ONLY_MIGRATIONS_STRATEGY.md` | NÃO VERIFICÁVEL |
| 49 | Migrations fora do padrão e views | NÃO INICIADO |
| 50 | Deriva do `CLAUDE.md` (571+ migrations → 605; 2.689 testes → 2.979; "Vite 6" → Vite 8) | NÃO INICIADO |

### 9.4 `docs/PLANO_EXCELENCIA_10_10.md`

- **#4 — Modularizar arquivos com mais de 700 linhas: PARCIAL.**
  - Em `src/`: `App.tsx` (1.155 linhas), `tributario/shared-logic.ts` (809), `ContaReceberFormFields.tsx` (750), `ui/sidebar.tsx` (733) e `Conciliacao.tsx` (726).
  - Nas edges: `asaas-proxy`, `sso-callback`, `scim-server`, `_shared/sql-write-guard.ts`, `bling-proxy`, `_shared/tributario-logic.ts`, `whatsapp-ia-proativo` e `bitrix24-sync`.
  - Ao todo, 123 arquivos fora de teste passam de 400 linhas.
- **#5 — Cobertura ≥ 85%: PARCIAL** (TE-01).
- **#12 — CSP: PARCIAL** (SG-19).
- **#13 — Mapeamento de rotas acima de 200 KB: sem registro.**
- **#18 — Docs atualizados: PARCIAL** (§10).

### 9.5 `ESTADO_ATUAL.md`

Snapshot de 16/08; a maior parte dos riscos R1–R9 já foi resolvida. Continuam abertos:

- **R2 residual:** `account_lockouts` e `obrigacoes_acessorias` não existem.
- **R3 residual:** o cron de benchmark nunca foi agendado.
- **R4:** NF-e simulada (§4.11).
- **R5:** buckets (§3.3).
- **R6:** RPCs ausentes (§3.2).
- **§5.11:** cron da Lalamove.
- **§8-🟢2:** corrigir docs errados (§10).
- **§8-🟢4:** auditar testes-espelho.
- **Uso real:** as integrações nunca foram ativadas.

### 9.6 `docs/FUNCIONALIDADES_SEM_UI.md`

De 21/04. A maior parte foi entregue. Continuam abertos:

- **SU-1:** histórico de envios de relatórios tributários agendados (TR-13).
- **SU-2:** API pública genérica (SG-10).
- **SU-3:** 14 telas sem item de menu (DB-10).

### 9.7 `docs/FUNCIONALIDADES_SISTEMA.md`

Inventário "100% ✅" de abril. Itens declarados e ausentes:

- WebAuthn (SG-09);
- assinatura digital (OU-02);
- dashboard arrastável (DB-03);
- observadores e cadeia sequencial de aprovação (AP-06);
- `exportar-sped` e a edge de PER/DCOMP (SP-01 e SP-02);
- emissão de NF-e (NF-01).

Rótulos desatualizados: `transferencias_bancarias`, `dre_tributaria`, `orquestrador-elisao`, `importar-xml-nfe` e `previsao-tributaria-ia`. A contagem também está defasada: "54 páginas / 51 Edge Functions / 1.012 testes".

### 9.8 `docs/INVENTARIO_FUNCIONALIDADES.md`

São 34 caminhos citados que não existem. Os que representam funcionalidade ausente:

- dashboard *drag & drop* (DB-03);
- Cockpit CFO (DB-04);
- acessibilidade com controle de fonte, navegação por teclado e checagem de contraste (OU-06);
- feature flags (OU-07);
- armazenamento offline genérico (OU-05);
- utilitários de UI (*pull-to-refresh*, *infinite scroll*, lista e tabela virtualizadas, *feedback-banner*), hoje obsoletos.

### 9.9 `docs/migracao/PLANO-CORRECAO-60-ETAPAS.md` e `PLANO-CORRECOES-100-ETAPAS.md`

Migração Lovable Cloud `lszcmoymovkpckehlagr` → `bwwbeyolnnzppeuhgkcd`, de 24 e 25/08.

O painel do documento marca **0 de 60 concluídas** (só 1 *checkbox* `[x]`) e nunca foi atualizado, embora várias etapas tenham sido feitas por PRs posteriores. Por exemplo, o E15, `config.toml` com 104 funções, foi feito.

Etapas que esta auditoria confirma **ainda abertas**:

| Etapa | Item | Situação hoje |
| --- | --- | --- |
| E04 / E43 / E44 | Ledger reconciliado | §3.1 |
| E08 | Policies sobrepostas entre tenants | SG-01 |
| E13 | Rotação do token da suíte MCP | SG-18 |
| E17 | Secrets das edges no destino | `CRON_DISPATCH_SECRET` faltando; `LOVABLE_API_KEY` e `RESEND_API_KEY` a verificar |
| E19 / E20 | Webhooks externos apontados e testados | Asaas, Bling e Bitrix nunca ativados |
| E26 / E27 | Crons ausentes e divergentes | §5.4 |
| E28 | Substituir stubs por funções reais | `run_integrity_cycle` e `processar_regua_cobranca` continuam stub |
| E29 | Alerta de cron em canal externo | OB-07 |
| E30 | Colunas ausentes | §5.6 |
| E34 | Reparticionar `audit_logs` e `frontend_error_logs` | Não particionadas em produção |
| E37 | Enum `tipo_cobranca` | Sem `cartao` |
| E39 | View e policy de `estrategias_elisao_catalogo` | Sem policy |
| E41 | Triggers | §5.5 |
| E46 | Baseline squash com prova em banco limpo | CI-05 |
| E47 | CI de drift | CI-03 |
| E49 | Tipos regenerados | Drift detectado em 05/10 |
| E52 | Seeds | Produção só tem a carga-semente |
| E56 | Diff estrutural zero | Não atingido |
| E58 | E2E contra o destino | TE-04 |
| E60 | Descomissionar a origem | Não verificado; ainda há migrations com a chave anon do projeto de origem |

### 9.10 `docs/execucao-cline/INDICE.md`

Programa de remediação em 100 etapas; snapshot de 30/08: 2 ✅, 37 🟡, **41 ❌ e 20 ⛔**. Parte foi superada pelos planos de setembro. Continuam abertas, confirmadas nesta auditoria:

| Etapa | Item | Referência |
| --- | --- | --- |
| 009 | Varredura de segredos no histórico | SG-18 |
| 014 / 016 | Genealogia das migrations × ledger | §3.1 |
| 018 | Tipos por ambiente | §5.6 |
| 023–025 | Views, colunas e constraints | §5 |
| 027 | Policy de `estrategias_elisao_catalogo` | — |
| 032 | Resíduos da Lalamove | IN-13 |
| 045 | `webhook-financeiro` | NÃO INICIADO; grep = 0 |
| 048 | Classificar as funções sem JWT | — |
| 053 | Páginas órfãs | DB-10 |
| 058 | NF-e honesta | NF-01 a NF-07 |
| 059 | Boleto gerado no backend | BP-01 |
| 063–069 | Atomicidade, erros visíveis, TODOs de schema e objetos sem consumidor | §5.2 e §5.3 |
| 071–077 | Gates de qualidade reais | §6 |
| 081 | Orçamento de bundle | — |
| 086 | Docs regeneráveis | — |
| 087–090 | Matriz manter, integrar, arquivar ou remover | Decisão sua |
| 091–100 | Staging, replay, E2E real, carga, canário, aceite | CI-04 e CI-05 |

### 9.11 `docs/ACCESSIBILITY.md` e `docs/PERFORMANCE.md`

Os *checklists* (34 itens WCAG e 18 de performance) **nunca foram preenchidos**: 0 `[x]`.

- **Acessibilidade:** não há evidência de auditoria WCAG executada, e `eslint-plugin-jsx-a11y` está instalado e desligado. **NÃO INICIADO.**
- **Performance:** vários itens existem de fato (*code splitting* com 125 `lazy()`, Web Vitals, service worker) e o *checklist* só está desatualizado. "Background sync" e o orçamento de bundle por rota estão **NÃO INICIADOS**.

### 9.12 `docs/MIGRATION_CHECKLIST.md`, `STAGING_MIGRATION.md` e `docs/HEALTHCHECK.md`

- Os *checklists* de pós-migração continuam sem marcação: login de teste com RLS, `/admin/system-health`, realtime no sino de notificações e `db lint` limpo.
- O staging não existe (CI-04).
- O healthcheck pós-corte nunca rodou fora de produção.

### 9.13 ADRs

| ADR | Status | O que falta |
| --- | --- | --- |
| ADR-001 (Lalamove fora do escopo) | PARCIAL | Ainda há um cron, uma função `trigger_bitrix24_sync` e invariantes residuais |
| ADR-002 (funções essenciais) | Aceito | O escopo de RH e folha ficou fora, consistente |
| **ADR-003 (papéis por empresa)** | **Proposto, aguardando decisão** | Bloqueia SG-07 e TR-16 |
| `adr/0001` (fonte da verdade da migração) | — | Depende de E46/E60 |

### 9.14 Épico Vela-dark e Metronic v9

- **Vela-dark:** aceito em 25/08. Abertos:
  - mover o doc de exceção para `docs/` e restaurar a regra "não editar `src/components/ui/`";
  - varredura por página das 50 páginas formulaicas e 18 *bespoke* (aceite só por amostra de 5 telas);
  - 74 `hsl(` e 177 hex fixos no código;
  - decisões de produto pendentes: nomenclatura "Quantum-*", reorganização do menu fiscal, `TabsContent` × `h-full` e dependências mortas (`next-themes`, `ogl`).
- **`EXECAO_RESTYLE_METRONIC_V9.md`: DECLARADO FEITO, MAS AUSENTE.** Os critérios estão marcados ✅, a assinatura está em branco e grep "metronic" = 0. Foi abandonado em favor do Vela-dark.

### 9.15 PR aberta #115: plano de 100 etapas dos workflows

**Nada executado** (é só documento). O estado de cada achado está em CI-20.

### 9.16 PRs abertas que contêm trabalho planejado e não concluído

- **#148** (`fix/hermes-ux-nav`): navegação semântica, com voltar contextual, *dirty-guard* e breadcrumbs. Em andamento; 31 arquivos.
- **#131** (`claude/fix-supabase-preview-cron-260928-1235`): *shims* para o Supabase Preview. Parada desde 05/10; toca 409 arquivos de migration.
- **#126–#130 e #132:** *bumps* do Dependabot sem merge.

---

## 10. Documentos que afirmam o que não existe (corrigir para não induzir decisões erradas)

| Documento | Afirmação | Realidade |
| --- | --- | --- |
| `CLAUDE.md` §4 | "WhatsApp: cobrança IA proativa (via Evolution)" | Sem integração com a Evolution; só link `wa.me` |
| `CLAUDE.md` §1.5 | "Views com `security_invoker`: padrão desde P15+" | 14 views sem a opção em produção |
| `CLAUDE.md` | "571+ migrations", "2.689 testes", "Vite 6", "auto-sync N8N em 15 min" | 605 migrations, 2.979 testes, Vite 8, sem gatilho |
| `CHANGELOG.md` 1.0.0 | "Emissão de NF-e (SEFAZ)", "Integração Open Finance" | Simulados |
| `CHANGELOG.md` | "Docker multi-stage", "Service Worker Workbox", "Sentry completo", "PR automático de drift de types", "Paridade migrations × schema" | Sem Dockerfile; SW manual; Sentry sem *release*; drift falha ao abrir PR; paridade nunca medida |
| `docs/FUNCIONALIDADES_SISTEMA.md` | "100% ✅" (WebAuthn, assinatura digital, dashboard arrastável, observadores, NF-e) | Ausentes ou simulados |
| `.lovable/roadmap-final.md` | "Sistema 10/10 ✅" | Ver este documento |
| `EXECAO_RESTYLE_METRONIC_V9.md` | Critérios ✅ | Nunca executado |
| `AI_RULES.md` | "Storybook", "next-themes", "Vite 5" | Ausente ou substituído |
| `AGENTS.md`, `BACKUP_DR.md` | "Repositório privado" | O repositório é público |
| `docs/EDGE_FUNCTIONS_CATALOG.md` | 87 funções | 105; faltam 21 |
| `docs/TESTING.md` | Scripts `test:watch` e `test:integration`, pasta `tests/`, "testes antes do deploy" | Não existem; a Vercel publica sem esperar o CI |
| `.github/workflows/README.md` | 8 workflows, 7 checks obrigatórios, graphify semanal, `DATABASE_URL` cadastrado | 11 workflows, 8 checks, sem *schedule*, sem `DATABASE_URL` |
| `docs/SECURITY.md` | `security@promo-finance.com`, "PGP Key: [link]" | O canal real é o e-mail de TI citado em `SECURITY.md`; o PGP é um *placeholder* |
| `CONTRIBUTING.md` | Link para `CODE_OF_CONDUCT.md`; fluxo com fork e npm | O arquivo não existe; o fluxo real usa *worktree* e bun |
| `SECURITY_RULES.md` | Exceção de admin global em `gerar-pacote-evidencias` | O código exige vínculo com a empresa |

---

## 11. Roadmap enterprise (`docs/GAPS_ENTERPRISE.md`, 71 gaps × SAP/NetSuite/Totvs) — o que nunca começou

Já entregue desde a análise:

- SSO SAML/OIDC;
- SCIM 2.0;
- SPED ECD/ECF (geradores);
- razão, diário e balancete;
- DRE e balanço;
- DFC direto;
- OpenAPI parcial;
- status page;
- IP/geo;
- MFA.

Continuam **NÃO INICIADOS**, salvo marcação em contrário:

| Área | Gaps |
| --- | --- |
| Multi-empresa e contabilidade | Consolidação contábil com eliminação intercompany (PARCIAL; só tesouraria), multi-moeda e variação cambial, plano de contas unificado, fechamento contábil centralizado, contabilização automática real (PARCIAL), DFC indireto, DMPL e DLPA |
| Suprimentos | Estoque próprio e custeio (PEPS, UEPS, médio), inventário cíclico, RFQ, ordem de compra com workflow (PARCIAL; CM-01), recebimento NF-e → estoque |
| Pessoas | Folha completa, eSocial, DCTFWeb da folha, férias, 13º e rescisão, holerite, ponto. **Fora do escopo pelo ADR-002** |
| Comercial | Pipeline próprio, proposta → pedido, tabela de preço por cliente, comissionamento, CPQ (hoje dependem do Bitrix24) |
| Projetos | Contabilidade por projeto, *timesheet*, *milestones*, margem por projeto, WIP |
| Tesouraria | Aplicações (CDB, LCI, fundos), hedge cambial, *cash pooling*, conciliação de cartão, antecipação automática (PARCIAL), política de crédito automática (PARCIAL) |
| BI | Construtor visual de relatórios, OLAP com *drill-down* ilimitado, dashboards 100% customizáveis (PARCIAL), conector Power BI, Tableau e Looker, data warehouse, previsão ARIMA ou Prophet |
| Segurança e compliance | Segurança por campo, matriz SoD, SOC 2 e ISO 27001, *data residency*, audit log com hash encadeado (PARCIAL) |
| Globalização | i18n completo (PARCIAL), localização fiscal fora do Brasil, IFRS, fuso por usuário (PARCIAL) |
| Plataforma | API pública de dados (PARCIAL; SG-10), webhooks de saída, marketplace e plugins, *workflow builder* no-code, objetos customizados, *sandbox self-service*, campos customizados (PARCIAL; OU-03) |
| Operação | SLA contratual com créditos, DR com RTO documentado (PARCIAL), PITR *self-service*, isolamento físico de tenant, status page em domínio próprio (PARCIAL), on-call e PagerDuty |

---

## 12. Ordem recomendada de execução

### 12.1 Decisões que são suas (custo, risco ou negócio)

| # | Decisão | Por que importa | Minha recomendação |
| --- | --- | --- | --- |
| D1 | **Aplicar em produção as 32 migrations pendentes** (DDL em produção) | Fecha o vazamento entre empresas e destrava DARF, XML, dashboard, lockout e conciliação. **Para destravar a aprovação** é preciso uma migration a mais: nenhuma das 32 cria `contas_pagar.aprovado_em`, e a RPC `aprovar_solicitacao_pagamento` só preenche `aprovado_por` na conta (`20260913140000:148-149`). Sem a coluna, o pagamento aprovado continua bloqueado (CP-03) | **Aplicar em lotes**: segurança, depois RPCs, depois o resto. Cada lote em uma PR com `APROVADO` e checagem de efeito |
| D2 | Modelo de admin: global ou por empresa (ADR-003) | Define 19 policies e 7 funções tributárias | Admin **por empresa**, mais um papel "plataforma" explícito só para você |
| D3 | NF-e: emissor próprio ou provedor | Hoje a tela finge emitir, cancelar e inutilizar | **Provedor** (menos homologação e certificado no seu servidor); até lá, **retirar ou rotular como simulação** as telas de cancelamento, inutilização e contingência |
| D4 | WhatsApp de cobrança via Evolution (`wpp2`) | Hoje nenhuma cobrança sai pelo WhatsApp | Integrar `whatsapp-ia-proativo` à Evolution, que já roda na VPS |
| D5 | Open Finance real (ITP certificada) ou retirar o botão | Hoje grava extrato falso na conciliação | **Retirar ou bloquear o import simulado já**; integrar depois via agregador |
| D6 | Repositório público | Código financeiro e 23 credenciais históricas expostos | Tornar **privado** e rotacionar as `service_role` e API keys do *baseline* |
| D7 | Criar o ambiente de staging (custo de um projeto Supabase extra) | Hoje tudo é testado em produção | Criar: é o que destrava CI-01 a CI-05 |
| D8 | O que fazer com o n8n (eventos de "motorista"), o Mapbox e o Storybook | Código órfão de outro domínio | Remover ou redesenhar para eventos financeiros |
| D9 | Mergear ou fechar a PR #115 (plano de workflows) | Plano grande sem dono | Mergear como roteiro e executar só as fases 1, 2 e 4 |

### 12.2 Sequência técnica sugerida

1. **Destravar a produção (1–2 dias, sem mudança de produto):**
   - desagendar o cron 37 (Lalamove);
   - corrigir o payload do cron 33 (`webhook-retry-worker`);
   - configurar `CRON_DISPATCH_SECRET`, alinhado ao vault;
   - criar o índice único da MV do cron 18;
   - confirmar `LOVABLE_API_KEY` e `RESEND_API_KEY`;
   - fazer o redeploy das edges pelo pipeline, incluindo `upload-anexo` no `config.toml`.
2. **Segurança multi-empresa (D1, primeiro lote):** policies sem tenant, `security_invoker` nas 14 views, IDORs e `empresa_acessivel`.
3. **Fluxos de dinheiro:**
   - RPCs atômicas e totais;
   - unificar os CHECKs (CP, partidas, boletos, transferências) e as grafias de status;
   - cron de vencidos;
   - colunas `aprovado_em` e `created_by`;
   - boleto com `asaas_id`.
4. **Caixa de verdade:** movimentação e saldo gerados por pagamento, recebimento, transferência e conciliação, com estorno; liquidação automática do Asaas.
5. **Auditoria e observabilidade:** triggers de auditoria nas tabelas financeiras, `audit_logs` de volta, logs das edges e alertas de cron em canal externo.
6. **Honestidade de UI:** remover ou rotular as telas simuladas (NF-e, Open Finance, Integrações, Configurações › Régua, Roteamento, IA Compras, Assinatura digital, WebAuthn).
7. **Pipeline:** `DATABASE_URL` read-only, revisão obrigatória de PR, Dependabot com bun, `prod-migrate` com aprovador e drift de types.
8. **Produto:** parcelas em CP e CR, CNAB, rateio, fechamento contábil, compras ponta a ponta, NF-e de entrada → CP.

---

## 13. Método, limites e reprodutibilidade

- **Execução:** auditoria feita em 7 frentes (planos da raiz, `docs/`, frontend, Edge Functions, banco, CI/infra e módulos de negócio), com consolidação e verificação cruzada dos achados.
- **Varreduras de código:**
  - marcadores TODO, FIXME, mock, simulado, stub, "em breve", `Math.random`;
  - rotas × páginas × menu;
  - `functions.invoke`, `.rpc()` e `.from()` × diretórios de funções, migrations, `types.ts` e o catálogo de produção;
  - handlers vazios e dados *hardcoded*;
  - dependências sem *import*;
  - secrets lidos × `env.manifest.json` × `.env.example` × GitHub.
- **Banco de produção:** somente `SELECT`. As consultas cobriram `pg_proc`, `pg_policies`, `pg_class.reloptions`, `pg_trigger`, `pg_constraint`, `information_schema.columns`, `pg_stat_user_tables`, `supabase_migrations.schema_migrations`, `cron.job`, `cron.job_run_details`, `net._http_response` (retenção de cerca de 6 h), `storage.buckets` e as contagens de `auth.users`, `audit_logs`, `edge_function_logs` e `frontend_*_logs`.
- **GitHub:** branch protection, nomes de secrets e variables, environments, runs e logs de CI, PRs abertas.
- **Limites (veja §0.3):**
  - Vercel e secrets das edges não foram lidos.
  - O estado exato das funções publicadas não foi lido (há indícios de deploy defasado).
  - A navegação real não foi feita.
  - Itens marcados como "a verificar" ou "provável" dependem disso.
- **Contagens do placar:** a seção 2 conta as linhas de tabela com ID das seções 4, 6 e 7 (CP, CR, AP, TS, CO, BP, CB, CM, CT, TR, NF, SP, DB, OR, AD, SG, IA, IN, OU, CI, TE, OP e OB). A tabela das 105 Edge Functions e os itens de §3, §5 e §9 ficam fora do placar, para não contar duas vezes.
