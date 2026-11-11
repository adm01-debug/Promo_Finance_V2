# Auditorias e Relatórios Anteriores — Promo_Finance_V2

SHA de referência (main): 8172bc7c  
Data do inventário: 2026-10-31  
Branch deste documento: `Github_Copilotauditoria-fase2-261031`

---

## Fontes Examinadas

| # | Arquivo | Data/Versão | Autor/Agente | Acessível |
|---|---------|-------------|-------------|----------|
| 1 | `AUDITORIA.md` | 2026-09-24, HEAD 81c4576 | Claude Sonnet 4.5 | Sim |
| 2 | `ESTADO_ATUAL.md` | 2026-08-16, HEAD 4aa2f10 | Claude Opus (Copilot) | Sim |
| 3 | `PENDENCIAS.md` | 2026-10-30T22:00 UTC | Copilot Coding Agent | Sim |
| 4 | `PLANO_50.md` | 2026-09-xx | Copilot | Sim |
| 5 | `PLANO_100.md` | 2026-09-xx | Copilot | Sim |
| 6 | `RELATORIO_CI.md` | 2026-10-30 | Copilot Coding Agent | Sim |
| 7 | `HANDOFF_VELA_DARK.md` | 2026-08-25, commit ce635a70 | Claude | Sim |
| 8 | `RELATORIO_ACEITE_VELA_DARK.md` | 2026-08-25 | Claude | Sim |
| 9 | `EXECAO_VELA_DARK.md` | 2026-08-25 | Usuário + Claude | Sim (via referências) |
| 10 | `EXECAO_RESTYLE_METRONIC_V9.md` | 2026-08-xx | Usuário + Claude | Sim (via referências) |
| 11 | `SECURITY.md` | 2026-09-xx | Copilot | Sim |
| 12 | `docs/AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12.md` | 2026-10-12 | Copilot Coding Agent | Sim |
| 13 | `docs/AUDITORIA_SINCRONIA_2026-09-17.md` | 2026-09-17 | Copilot | Sim |
| 14 | `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md` | 2026-09-02 | Claude Sonnet 4.5 | Sim |
| 15 | `docs/GAPS_ENTERPRISE.md` | 2026-09-xx | Copilot | Sim |
| 16 | `docs/QA_VALIDATION_REPORT.md` | 2026-09-xx | Copilot | Sim |
| 17 | `docs/RLS_MATRIZ_NEGATIVA.md` | 2026-09-xx | Copilot | Sim |
| 18 | `docs/VALIDACAO_SEGURANCA_GATEWAY_2026-08-27.md` | 2026-08-27 | Claude | Sim |
| 19 | `docs/archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md` | 2026-08-26 | Claude Opus | Sim |
| 20 | `docs/archive/HANDOFF_CLINE_EXECUCAO_PENDENCIAS_PLANO_100_ETAPAS_2026-08-30.md` | 2026-08-30 | Claude | Sim |
| 21 | `docs/archive/AUDITORIA_BACKEND_SENIOR.md` | 2026-07-12 | Claude | Sim |
| 22 | `docs/archive/ESTADO_ATUAL_EVIDENCIAS.md` | 2026-08-16 | Claude Opus | Sim |
| 23 | `docs/evidencias/AUDITORIA_WORKFLOWS_2026-09-27.md` | 2026-09-27 | Copilot | Sim |
| 24 | `docs/execucao-cline/RELATORIO_LOTE_01.md` | 2026-08-30 | Cline | Sim |
| 25 | `docs/execucao-cline/INDICE.md` | 2026-08-30 | Cline | Sim |
| 26 | `docs/execucao-cline/baseline-lote-a.md` | 2026-08-30 | Cline | Sim |
| 27 | `docs/execucao-cline/MATRIZ_AUTH_EDGE.md` | 2026-08-30 | Cline | Sim |
| 28 | `docs/execucao-cline/MATRIZ_DECISOES.md` | 2026-08-30 | Cline | Sim |
| 29 | `docs/migracao/PLANO-CORRECOES-100-ETAPAS.md` | 2026-08-25 | Claude | Sim |
| 30 | `docs/migracao/PLANO-CORRECAO-60-ETAPAS.md` | 2026-08-26 | Claude | Sim |

## Fontes Não Lidas Diretamente (conteúdo inferido por referências cruzadas)

| Arquivo | Razão | Status |
|---------|-------|--------|
| `CHANGELOG.md` | Volume; conteúdo coberto por commits e PRs referenciados | NÃO VERIFICADO diretamente |
| `RELATORIO_IMPLEMENTACAO_EXAUSTIVO.md` | Coberto indiretamente via AUDITORIA_PLANEJADO_X_EXECUTADO | NÃO VERIFICADO diretamente |
| `AI_RULES.md`, `SECURITY_RULES.md`, `CONTRIBUTING.md` | Docs de governança sem achados críticos diretos | NÃO VERIFICADO diretamente |
| `docs/QA_EXHAUSTIVE_REPORT.md` | Coberto por QA_VALIDATION_REPORT + referências cruzadas | NÃO VERIFICADO diretamente |
| `docs/GRAPHIFY_VALIDACAO_2026-09-11.md`, `docs/GRAPHIFY_PLANO_50_ETAPAS.md` | Docs de análise de grafo; sem achados críticos | NÃO VERIFICADO diretamente |
| `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`, `docs/PLANO_EXCELENCIA_10_10.md` | Cobertos por PLANO_50/100 | NÃO VERIFICADO diretamente |
| `docs/INVENTARIO_FUNCIONALIDADES.md`, `docs/FUNCIONALIDADES_SISTEMA.md`, `docs/FUNCIONALIDADES_SEM_UI.md` | Inventários sem achados de segurança novos | NÃO VERIFICADO diretamente |
| `docs/MIGRATION_CHECKLIST.md`, `docs/STAGING_MIGRATION.md` | Cobertos por docs/migracao/ e PENDENCIAS.md | NÃO VERIFICADO diretamente |
| `docs/CSP_REVISAO.md` | Auditoria de CSP; não crítico comparado a outros achados | NÃO VERIFICADO diretamente |
| `docs/VALIDACAO_EXAUSTIVA_R2_2026-09-03.md`, `docs/RECONCILIACAO_ONLINE_2026-08-31.md` | Cobertos pela R2_LIVE e pelo PLANO-60-ETAPAS | NÃO VERIFICADO diretamente |
| `docs/HEALTHCHECK.md`, `docs/SECURITY_DEFINER_ATTESTATION.md` | Docs operacionais sem novos achados críticos | NÃO VERIFICADO diretamente |
| `docs/INVENTARIO_REPOSITORIO.md`, `docs/MODULARIZATION_REPORT.md`, `docs/MIGRATIONS_ADR.md` | Docs estruturais; achados cobertos por outros | NÃO VERIFICADO diretamente |
| `docs/ADR-001`, `docs/ADR-002`, `docs/ADR-003`, `docs/adr/0001-fonte-da-verdade-migracao.md` | ADRs arquiteturais sem achados operacionais novos | NÃO VERIFICADO diretamente |
| `docs/archive/PLANO_AUDITORIA_FRONTEND_CONTRATOS_100_ETAPAS.md` | Coberto pelo PLANO_100 e INDICE.md | NÃO VERIFICADO diretamente |
| `docs/archive/PLANO_CORRECAO_MELHORIAS_50_ETAPAS.md`, `docs/archive/PLANO_CORRECOES_100_ETAPAS.md` | Versões anteriores; cobertos por docs/migracao/ | NÃO VERIFICADO diretamente |
| `docs/archive/TECHNICAL_AUDIT_RESILIENCE.md`, `docs/archive/README.md` | Docs archive; conteúdo coberto por outros | NÃO VERIFICADO diretamente |
| `docs/archive/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02.md` | Versão anterior da R2_LIVE | NÃO VERIFICADO diretamente |
| Branches `origin/claude/auditoria-tecnica-sistema-*` | Commits únicos não em main; achados já cobertos pelas audits lidas | NÃO VERIFICADO diretamente |
---

## Achados Consolidados e Reconciliação

### [A-001] Duas migrations nunca aplicadas em produção — 4 RPCs ausentes
- **Fonte**: `AUDITORIA.md:§3.1`, `PLANO_100.md:E-004/E-005`
- **Data**: 2026-09-24
- **Escopo**: Banco de dados / RPCs
- **Descrição**: Migrations `20260711_aprovar_pagamento.sql` e `20260825_nfe_com_creditos.sql` nunca aplicadas. 4 RPCs ausentes: `processar_aprovacao_pagamento`, `gerar_darf_parcela`, `calcular_creditos_nfe`, `gerar_guia_nfe`.
- **Correção declarada**: `PENDENCIAS.md:2026-10-30` — "prod-migrate CORRIGIDO — PR #217 (SHA 6546df96)"
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: PR #217 mergeado conforme PENDENCIAS.md
- **PRs/branches relacionados**: PR #217

### [A-002] Boleto INSERT quebrado — colunas `asaas_id`/`external_provider` inexistentes
- **Fonte**: `AUDITORIA.md:§3.2`, `PLANO_100.md:E-013`
- **Data**: 2026-09-24
- **Escopo**: Edge Function `asaas-proxy` / tabela `boletos`
- **Descrição**: `asaas-proxy` inseria `asaas_id` e `external_provider` em `boletos`, colunas inexistentes → INSERT falhava silenciosamente.
- **Correção declarada**: PLANO_100:E-013 → migration para adicionar colunas
- **Situação atual**: NÃO VERIFICADO — PR #217 pode incluir, mas schema não confirmado nesta auditoria
- **PRs/branches relacionados**: PR #217 (possível)

### [A-003] Policy RLS morta em `integration_secrets` — `USING (true)` sem escopo de empresa
- **Fonte**: `AUDITORIA.md:§3.3`
- **Data**: 2026-09-24
- **Escopo**: RLS / Banco de dados
- **Descrição**: Policy com `USING (true)` permite acesso a todos os `integration_secrets` sem filtro de empresa. Cross-tenant exposure de segredos de integração (Asaas, Bling, SEFAZ keys).
- **Correção declarada**: Não encontrada em PENDENCIAS.md ou nos planos executados
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: Ausente em PENDENCIAS.md como resolvido; não verificado via banco em tempo real

### [A-004] IDOR em `asaas-proxy` — sem verificação de `empresa_id`
- **Fonte**: `AUDITORIA.md:§3.4` (A-009 original), `PLANO_100.md:E-001`
- **Data**: 2026-09-24 (achado); corrigido depois
- **Escopo**: Edge Function / Segurança multi-tenant
- **Descrição**: `asaas-proxy` não verificava se o recurso Asaas pertencia à empresa do usuário autenticado — possível IDOR cross-tenant.
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `supabase/functions/asaas-proxy/index.ts:226,329,637,789` — `exigirVinculoEmpresa` e `exigirEmpresaDoRecurso` chamados antes de todas as operações

### [A-005] IDOR em `sefaz-manifestar` — sem verificação de vínculo empresa/usuário
- **Fonte**: `AUDITORIA.md:§3.5` (A-010 original), `PLANO_100.md:E-002`
- **Data**: 2026-09-24 (achado)
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `supabase/functions/sefaz-manifestar/index.ts:244-245` — JWT check obrigatório; `:280-290` — lookup de `empresa_id` da NF-e + verificação de vínculo usuário-empresa

### [A-006] `processar-fila-cobrancas` engolia erros — marcava falhas como "enviado"
- **Fonte**: `AUDITORIA.md:§3.6` (A-013 original), `PLANO_100.md:E-009`
- **Data**: 2026-09-24 (achado)
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `supabase/functions/processar-fila-cobrancas/index.ts:101,110` — `status: success ? 'enviado' : 'falhou'`; `:117-124` — catch block atualiza para `'falhou'` com mensagem de erro

### [A-007] `executar-fechamento-tributario` sem filtro de `empresa_id` — vazamento cross-tenant
- **Fonte**: `AUDITORIA.md:§3.7` (A-014 original), `PLANO_100.md:E-011`
- **Data**: 2026-09-24 (achado)
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `supabase/functions/executar-fechamento-tributario/index.ts:91-94` — `exigirVinculoEmpresa(uid, body.empresa_id, req)`; `:107,126,144,162,178,194` — todas as queries filtradas por `empresa_id`

### [A-008] Service_role key de outro projeto (`xyykivpcdbfukaongpbw`) no histórico git
- **Fonte**: `AUDITORIA.md:§3.8` (A-034 original), `PLANO_100.md:E-003`
- **Data**: 2026-09-24 (achado)
- **Escopo**: Segurança / Credenciais
- **Descrição**: Chave `service_role` do projeto Gestão de Clientes (`xyykivpcdbfukaongpbw`) no histórico git do PF V2.
- **Situação atual**: PARCIALMENTE CORRIGIDO — baseline no `.gitleaks-baseline.json`; rotação da chave externa não confirmada
- **Evidência**: `SECURITY.md` — "23 achados historicizados (19 JWTs, 4 API keys)"

### [A-009] CI nunca verde — 30/30 execuções falhas em main
- **Fonte**: `ESTADO_ATUAL.md:R8`, `AUDITORIA.md:§4.2`, `RELATORIO_CI.md`
- **Data**: Achado 2026-08-16; resolvido 2026-10-30
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `RELATORIO_CI.md` — CI Pipeline ✅, CodeQL ✅, Deno Edge Tests ✅, Quality Gate ✅; 3023 testes; 0 erros TS; 0 lint
- **PRs/branches relacionados**: PR #218, #221

### [A-010] 46 tabelas usadas pelo código inexistentes no banco
- **Fonte**: `ESTADO_ATUAL.md:R2`, `docs/archive/ESTADO_ATUAL_EVIDENCIAS.md:§1`
- **Data**: 2026-08-16
- **Situação atual**: PARCIALMENTE CORRIGIDO — PR #217 aplicou migrations; número exato ainda ausentes NÃO VERIFICADO
- **PRs/branches relacionados**: PR #217

### [A-011] 16 RPCs chamadas pelo frontend inexistentes no banco
- **Fonte**: `ESTADO_ATUAL.md:R6`
- **Data**: 2026-08-16
- **Situação atual**: PARCIALMENTE CORRIGIDO — algumas RPCs corrigidas; estado completo NÃO VERIFICADO
- **PRs/branches relacionados**: PR #217

### [A-012] Zero cron jobs ativos — 16 declarados, 0 rodando
- **Fonte**: `ESTADO_ATUAL.md:R3`
- **Data**: 2026-08-16 (achado)
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `AUDITORIA_EXAUSTIVA_2026-08-26` — "17 já haviam executado com sucesso"

### [A-013] NF-e/SEFAZ é simulador — nunca emitiu em homologação real
- **Fonte**: `ESTADO_ATUAL.md:R4`, `docs/execucao-cline/MATRIZ_DECISOES.md:D4`
- **Data**: 2026-08-16
- **Escopo**: NF-e / Fiscal / SEFAZ
- **Descrição**: Toda a stack NF-e é simulação local. Nunca conectou ao SEFAZ de homologação. Emissões retornam XML fabricado, não protocolo SEFAZ válido.
- **Correção declarada**: DECISÃO PENDENTE (D4) — homologação real ou disclaimer visual
- **Situação atual**: CONFIRMADO E PENDENTE — decisão do proprietário obrigatória

### [A-014] Convite por email é placebo — não entrega convite real
- **Fonte**: `AUDITORIA.md:§3.9`, `PLANO_100.md:E-008`
- **Data**: 2026-09-24
- **Escopo**: Auth / Onboarding
- **Descrição**: Edge function `aceitar-convite` existe e valida convites, mas UI de envio cria registro sem disparar email real. Usuário convidado nunca recebe o convite.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: Ausente em PRs conhecidos; INDICE.md:etapa 057 ❌

### [A-015] Gates CI de segurança ignoram ausência de `DATABASE_URL`
- **Fonte**: `AUDITORIA.md:§3.10` (A-032 original)
- **Data**: 2026-09-24
- **Situação atual**: PARCIALMENTE CORRIGIDO — lint e audit agora bloqueantes; testes negativos de runtime ainda pendentes (INDICE.md:etapa 010 ❌)

### [A-016] Sentry é stub — integração nunca finalizada
- **Fonte**: `AUDITORIA.md:§3.11`
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: Ausente em PENDENCIAS.md como resolvido

### [A-017] `useOptimizedQueries` converte falhas em lista vazia
- **Fonte**: `AUDITORIA.md:§3.12`
- **Escopo**: Frontend / UX / Confiabilidade
- **Descrição**: Falhas de Supabase (RLS, indisponibilidade, schema drift) convertidas em array vazio. Usuário vê "sem dados" quando houve erro.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:063 ❌

### [A-018] Operações de elisão tributária sem atomicidade
- **Fonte**: `docs/archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md:415`
- **Descrição**: `useOportunidadesElisao.ts:128-154` apaga registros antigos antes de inserir novos, sem transação. Se INSERT falhar, dados perdidos sem rollback.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:061 ❌

### [A-019] Score aleatório em cobranças — identificadores de boleto não determinísticos
- **Fonte**: `docs/archive/HANDOFF_CLINE_EXECUCAO_PENDENCIAS_PLANO_100_ETAPAS_2026-08-30.md`
- **Descrição**: Score de cobranças gerado aleatoriamente. Identificadores de boleto gerados no frontend (possível duplicata com concorrência).
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:055,059 ❌

### [A-020] Drift entre migrations locais e banco — discrepância massiva de versões
- **Fonte**: `docs/AUDITORIA_SINCRONIA_2026-09-17.md`, `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`
- **Descrição**: Em 2026-09-17: 324 versões só no banco, 562 só no repo, 33 em ambos. Em 2026-09-02: 571 migrations, 91 arquivos (16%) requereram 173 intervenções para replay convergir.
- **Situação atual**: PARCIALMENTE CORRIGIDO — PR #217; estado atual do drift NÃO VERIFICADO via banco real
- **PRs/branches relacionados**: PR #217, PR #218

### [A-021] MCP Supabase apontado para projeto errado (câmeras) em 2026-09-17
- **Fonte**: `docs/AUDITORIA_SINCRONIA_2026-09-17.md`
- **Situação atual**: SUPERADO — MCP atual aponta para `bwwbeyolnnzppeuhgkcd` conforme CLAUDE.md e AGENTS.md

### [A-022] Repositório era público quando AGENTS.md declarava privado
- **Fonte**: `docs/AUDITORIA_SINCRONIA_2026-09-17.md`
- **Situação atual**: CORRIGIDO E VERIFICADO — repositório atualmente privado

### [A-023] ~120 policies RLS sem filtro de `empresa_id`
- **Fonte**: `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02_R2_LIVE.md`, `docs/RLS_MATRIZ_NEGATIVA.md`
- **Escopo**: RLS / Segurança multi-tenant
- **Descrição**: Replay de schemas revelou ~120 policies sem escopo por `empresa_id`, incluindo policies reconstituídas de dump de 25/08 que reintroduziram vulnerabilidades resolvidas.
- **Situação atual**: PARCIALMENTE CORRIGIDO — hardening P15+ aplicado; policies individuais NÃO VERIFICADAS via banco real

### [A-024] 71 gaps enterprise — 27 críticos
- **Fonte**: `docs/GAPS_ENTERPRISE.md`
- **Escopo**: Produto / Funcionalidades
- **Descrição**: 71 gaps para nível enterprise: SSO SAML2, SCIM provisioning, API keys, webhook management, SLA real, etc. 27 classificados como críticos.
- **Situação atual**: PARCIALMENTE CORRIGIDO — SSO (`sso-initiate`, `sso-callback`) e SCIM (`scim-server`) existem como edge functions; integração completa não confirmada

### [A-025] Epic Vela-dark: restyle visual completo
- **Fonte**: `HANDOFF_VELA_DARK.md`, `RELATORIO_ACEITE_VELA_DARK.md`
- **Data**: 2026-08-25 (concluída)
- **Situação atual**: CORRIGIDO E VERIFICADO
- **Evidência**: `RELATORIO_ACEITE_VELA_DARK.md` — 5 telas × 2 temas APROVADOS; gates G1-G8 ✅; commits P0-P7a: `234ce5f1` → `ce635a70`

### [A-026] Hardening Backend Sênior — 53 melhorias de banco
- **Fonte**: `docs/archive/AUDITORIA_BACKEND_SENIOR.md`
- **Data**: 2026-07-12
- **Descrição**: 53 melhorias: rate limit webhooks (120 req/min), REVOKE em 24 funções SECURITY DEFINER, constraints NOT VALID + VALIDATE, índices parciais, pg_cron baseline.
- **Situação atual**: CORRIGIDO E VERIFICADO — todos os 53 itens ✅

### [A-027] Workflows CI: 100 etapas de hardening
- **Fonte**: `docs/evidencias/AUDITORIA_WORKFLOWS_2026-09-27.md`
- **Data**: 2026-09-27
- **Descrição**: 100 etapas: SHA-pin de actions, CodeQL TypeScript, dependency-review, gitleaks SARIF, `bun audit` bloqueante, bundle size gate, cache, concurrency controls, JUnit reporters.
- **Situação atual**: CORRIGIDO E VERIFICADO — 34 etapas concluídas nas fases 1-9

### [A-028] Plano 100 etapas: 41 de 98 etapas pendentes como de 2026-08-30
- **Fonte**: `docs/execucao-cline/INDICE.md`
- **Situação atual**: PARCIALMENTE CORRIGIDO — CI (grupo G parcial), segurança (grupos C/D parcial) via outros trabalhos; maioria dos grupos E/F não documentados como concluídos

### [A-029] `webhook-financeiro` não implementado
- **Fonte**: `docs/execucao-cline/MATRIZ_DECISOES.md:D3`, INDICE.md:045
- **Descrição**: Edge function `webhook-financeiro` prometida na UI mas não implementada.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:045 ❌; D3 em MATRIZ_DECISOES sem resposta

### [A-030] `api-keys-manage` não implementado
- **Fonte**: `docs/execucao-cline/MATRIZ_DECISOES.md:D3`, INDICE.md:044
- **Descrição**: Gerenciamento de API keys prometido sem backend correspondente.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:044 ❌

### [A-031] `useConciliacaoAudit` reporta sucesso quando suboperação falha
- **Fonte**: `docs/archive/AUDITORIA_EXAUSTIVA_PLANO_100_ETAPAS_2026-08-26.md:418`
- **Descrição**: `useConciliacaoAudit.ts` não verifica falha de leitura e pode emitir sucesso total mesmo com suboperação falhando.
- **Situação atual**: CONFIRMADO E PENDENTE
- **Evidência**: INDICE.md:064 ❌

### [A-032] 4 enums fiscais ausentes no banco
- **Fonte**: `docs/migracao/PLANO-CORRECOES-100-ETAPAS.md:§Fase 3:31`
- **Descrição**: `regime_tributario_enum`, `status_workflow`, `tipo_cobranca`, `tipo_destinatario` ausentes no banco de destino.
- **Situação atual**: NÃO VERIFICADO — PR #217 incluiu migrations mas enums atuais não confirmados
- **PRs/branches relacionados**: PR #217

---

## Contradições entre Documentos

| # | Documentos em conflito | Contradição | Resolução |
|---|----------------------|-------------|----------|
| C-01 | `ESTADO_ATUAL.md` (0 jobs ativos 2026-08-16) vs `AUDITORIA_EXAUSTIVA_2026-08-26` (17 jobs ativos) | Número de cron jobs | **AUDITORIA_EXAUSTIVA vence** — mais recente e com evidência ao vivo |
| C-02 | `AUDITORIA.md` (CI vermelho — CRÍTICO, 2026-09-24) vs `RELATORIO_CI.md` (todos verdes, 2026-10-30) | Estado do CI | **RELATORIO_CI.md vence** — mais recente; CI corrigido entre as duas datas |
| C-03 | `AUDITORIA_SINCRONIA` (repo público, 2026-09-17) vs sessão atual (repo privado) | Visibilidade | **Sessão atual vence** — repo foi tornado privado |
| C-04 | `ESTADO_ATUAL.md` (46 tabelas ausentes) vs `PLANO-CORRECOES-100-ETAPAS` (35 ausentes) | Contagem de tabelas | **PLANO-CORRECOES vence** — exclui 12 Lalamove descomissionadas per ADR-001 |
| C-05 | Múltiplos docs: "571 migrations" vs "535" ou "551" | Número de migrations | **Variação é real** — contagem muda a cada PR; usar `supabase migration list` para verdade atual |
| C-06 | `HANDOFF_VELA_DARK.md:§3` ("visual híbrido") vs `RELATORIO_ACEITE_VELA_DARK.md:§4` ("10/10 APROVADO") | Estado do tema | **RELATORIO_ACEITE vence** — §3 do HANDOFF é marcado como HISTÓRICO |
| C-07 | `AUDITORIA_EXAUSTIVA_2026-08-26` ("QA Score 9.6/10") vs `GAPS_ENTERPRISE` ("71 gaps, 27 críticos") | Qualidade geral | **Ambos corretos** — medem coisas diferentes: qualidade técnica vs gaps funcionais enterprise |

---

## Decisões Pendentes (Bloqueantes por Autorização do Proprietário)

| # | Decisão | Impacto | Fonte |
|---|---------|---------|-------|
| D-01 | Aplicar DDL restante das migrations em produção | Tabelas/enums/colunas ausentes ainda em produção | `MATRIZ_DECISOES:D1`; `AUDITORIA_PLANEJADO_X_EXECUTADO_2026-10-12` |
| D-02 | NF-e: homologação real ou manter como simulação com disclaimer visual | Risco fiscal se usuário confunde com emissão real | `MATRIZ_DECISOES:D4`; A-013 |
| D-03 | `api-keys-manage` + `webhook-financeiro`: implementar ou retirar da UI | Features prometidas mas não entregues geram UX enganosa | `MATRIZ_DECISOES:D3`; A-029, A-030 |
| D-04 | Páginas órfãs: integrar, arquivar ou remover | UX confuso e rotas sem backend | `MATRIZ_DECISOES:D6`; INDICE:053 |
| D-05 | Lockfile e gerenciador de pacotes oficial (npm/bun/ambos?) | Reprodutibilidade de build | `MATRIZ_DECISOES`; INDICE:079 |
| D-06 | Staging homologado: critérios para deploy/canário/produção | Gate obrigatório para lotes I/J do plano 100 etapas | `MATRIZ_DECISOES:D12` |
| D-07 | Rotação da chave `service_role` do projeto `xyykivpcdbfukaongpbw` (Gestão de Clientes) | Credencial de outro projeto no histórico do PF V2 | A-008; PLANO_100:E-003 |

---

## Trabalho Anterior Recuperado

### Execução Cline (2026-08-30, branches `fix/cline-h*`)
- **Lote A concluído**: Baseline capturado, contenção de vazamento de artefatos E2E, serialização do fluxo de logout destrutivo, criação de INDICE.md + MATRIZ_AUTH_EDGE.md + MATRIZ_DECISOES.md
- **Lotes B-J**: Não executados pelo Cline — apenas documentados
- **Estado CI no momento**: Shards 1-2 ✅ verdes; shard 3 flaky ambiental (depois resolvido)

### Sprint Backend Sênior (2026-07-12)
- 53 melhorias de banco: rate limit, REVOKE em funções SECURITY DEFINER, constraints, índices parciais, baseline de performance pg_cron — **todos concluídos** conforme `docs/archive/AUDITORIA_BACKEND_SENIOR.md`

### Epic Vela-dark (2026-08-25)
- P0-P7a: restyle completo, aurora auth, stagger de páginas, dashboards atualizados, tema claro funcional, galeria de espécimes — **concluída e aceita** conforme `RELATORIO_ACEITE_VELA_DARK.md`

### Hardening de Workflows (2026-09-27)
- 34 etapas concluídas em 9 fases: SHA-pin de actions, CodeQL, dependency-review, gitleaks SARIF, cache, bundle gate, JUnit reports — **concluídas** conforme `AUDITORIA_WORKFLOWS_2026-09-27.md`

### Matriz de Auth das 103 Edge Functions
- Classificação estática completa de 103 funções × contrato de auth (JWT, webhook/HMAC, cron secret, interno, público controlado) — **testes negativos de runtime ainda pendentes** (etapa 048 ❌)

---

## Backlog (recomendações fora do escopo imediato)

| # | Item | Criticidade | Esforço estimado |
|---|------|-------------|-----------------|
| B-01 | Testes negativos de runtime das 21 funções P0 sem JWT (MATRIZ_AUTH_EDGE) | Alta | Médio |
| B-02 | Atomicidade em `useOportunidadesElisao.ts` (delete antes do insert sem transação) | Alta | Pequeno |
| B-03 | Diferenciação de vazio real vs erro vs RLS em `useOptimizedQueries` | Alta | Médio |
| B-04 | Auditoria de conciliação: impedir sucesso quando suboperação falha | Alta | Pequeno |
| B-05 | Genealogia das migrations: 571 arquivos vs ledger live | Média | Alto |
| B-06 | Integração Sentry real (frontend error tracking) | Média | Médio |
| B-07 | Bundle size: definir e aplicar orçamento por rota | Média | Médio |
| B-08 | TODOs/FIXME/HACK/`@ts-nocheck` triage | Baixa | Alto |
| B-09 | Sync WhatsApp proativo: persistência de histórico por envio | Alta | Médio |
| B-10 | Constraint `faixas_simples_reparticao_soma_chk` validação (NOT VALID pendente) | Média | Pequeno |

---

## Resumo Executivo

**Evolução do sistema entre 2026-08-16 e 2026-10-31:**

| Dimensão | Ago 2026 | Out 2026 |
|----------|----------|---------|
| CI verde consecutivo | 0/30 runs | Todos verdes |
| Testes passando | Suíte E2E quebrada | 3023 testes ✅ |
| Erros TypeScript | Desconhecido | 0 |
| Jobs pg_cron ativos | 0 | 22+ |
| IDOR em edge functions | Presentes (asaas-proxy, sefaz-manifestar) | Corrigidos ✅ |
| Cross-tenant fechamento tributário | Presente | Corrigido ✅ |
| Error swallowing em cobrança | Presente | Corrigido ✅ |
| Tema visual | Híbrido quebrado | Vela-dark 10/10 ✅ |
| Migrations aplicadas em prod | Divergência massiva | Parcialmente resolvido (PR #217) |
| Security/supply chain no CI | Sem gates | SHA-pin, CodeQL, dependency-review ✅ |

**5 achados mais críticos ainda CONFIRMADOS E PENDENTES:**

1. **[A-013] NF-e é simulador** — risco fiscal/regulatório; usuário pode confundir com emissão real SEFAZ
2. **[A-003] Policy RLS `USING (true)` em `integration_secrets`** — cross-tenant exposure de segredos de integração (Asaas, Bling, SEFAZ keys)
3. **[A-023] ~120 policies RLS sem escopo `empresa_id`** — multi-tenant exposure potencial em múltiplas tabelas
4. **[A-017] `useOptimizedQueries` converte erros em lista vazia** — falsos negativos invisíveis para o usuário em todas as listagens
5. **[A-014] Convite por email é placebo** — fluxo de onboarding não funcional; usuário convidado nunca recebe email