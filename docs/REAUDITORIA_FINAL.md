# Re-Auditoria Final — Plano 50 Etapas

> **Data:** 2026-10-31  
> **SHA baseline (origem do plano):** `79435e90`  
> **SHA atual (HEAD main):** `8172bc7c7fc809122023530ce5a13304dfa06eb3`  
> **Plano de referência:** `docs/PLANO_MELHORIAS_50_ETAPAS_2026-09-13.md`  
> **Propósito:** template de re-auditoria pós-implementação — preencher APLICADO → verificado quando cada etapa for confirmada em produção.

---

## Status por etapa

| # | Título curto | PR | Status | Observação |
|---|-------------|----|--------|------------|
| 1 | Rotacionar service\_role key exposta | — | 🔴 BLOQUEADO | Requer rotação manual no Supabase Dashboard + redeploy de todas as edge functions; sem ação automatizável |
| 2 | Confirmar rotação credenciais migrate-helper | — | 🔴 BLOQUEADO | Requer ação manual: invalidar token no GitHub Actions + confirmar nova secret |
| 3 | Corrigir analise-preditiva cross-tenant | — | 🔴 PENDENTE | P0 crítico — `analise-preditiva` retorna dados de outras empresas |
| 4 | Corrigir nfe-upload-certificado IDOR | — | 🔴 PENDENTE | P0 crítico — IDOR sem verificação de empresa no upload de certificado |
| 5 | Corrigir executar-fechamento-tributario | — | 🔴 PENDENTE | P0 crítico — falta validação de empresa no fechamento |
| 6 | Corrigir executar-relatorios guard condicional | — | 🔴 PENDENTE | P0 — guard `if (empresaId)` contornável |
| 7 | Corrigir enviar-digest-conformidade | — | ✅ APLICADO | Helper exigirVinculoEmpresa() adicionado |
| 8 | Corrigir executar-analise-preditiva | — | ✅ APLICADO | Escopo de empresa corrigido no cron |
| 9 | Helper canônico exigirVinculoEmpresa() | — | ✅ APLICADO | Em `_shared/auth-guard.ts` |
| 10 | Teste de contrato anti-IDOR | — | ✅ APLICADO | Suíte em `test-canonical-db-gates.mjs` |
| 11 | Modelo de papéis por empresa (ADR) | — | ✅ APLICADO | ADR documentado |
| 12 | Gitleaks no CI e pre-commit | — | 🟡 PENDENTE | Gitleaks referenciado em PR #221 mas step formal não concluído |
| 13 | Migrar anon keys para Vault | — | 🟡 PENDENTE | Anon keys ainda em variáveis de ambiente |
| 14 | mustSucceed() / autovacuum wrapper | — | ✅ APLICADO | Wrapper criado e integrado |
| 15 | ESLint no-floating-supabase-write | — | 🟡 PENDENTE | Regra ESLint não criada |
| 16 | Corrigir aprovação de pagamento | — | 🟡 PENDENTE | RPC atômica ausente no fluxo de aprovação |
| 17 | Corrigir conciliação bancária | — | 🟡 PENDENTE | Escritas não-atômicas na conciliação |
| 18 | Corrigir retenções na fonte / DARF | — | ✅ APLICADO | security\_invoker aplicado; DARF corrigido |
| 19 | Corrigir créditos tributários CBS/IBS | — | 🟡 PENDENTE | Reforma tributária: créditos sem validação de empresa |
| 20 | Corrigir acordos, lançamentos, anexos | — | ✅ APLICADO | SECURITY\_RULES.md criado; guards corrigidos |
| 21 | RPC atômica multi-passo (DEFAULT boletos) | — | ✅ APLICADO | DEFAULT corrigido; RPC transacional implantada |
| 22 | Corrigir 2 views sem filtro tenant | — | 🟡 PENDENTE | Views identificadas; correção pendente |
| 23 | empresaId obrigatório nas queryKeys | — | 🟡 PENDENTE | Inconsistência em 51 queries catalogada |
| 24 | Invalidação estrutural de cache | — | ✅ APLICADO | TanStack Query: invalidação com empresaId |
| 25 | 51 queries sem empresa na queryKey | — | ✅ APLICADO | empresaId adicionado nas queryKeys afetadas |
| 26 | Leituras não-reativas de tenant | — | ✅ APLICADO | Hooks corrigidos para reatividade de empresa |
| 27 | Modo consolidado multi-empresa | — | 🟡 PENDENTE | Requisito de negócio não implementado |
| 28 | Teste arquitetura de escopo de chave | — | 🟡 PENDENTE | Teste de arquitetura não criado |
| 29 | Glob E2E desativando 20 specs | — | 🟡 PENDENTE | `**/*.spec.ts` glob corrigido pendente |
| 30 | Referência morta na exclusão de CI | — | ✅ APLICADO | Arquivo referenciado no CI removido/corrigido |
| 31 | Specs financeiras no gate bloqueante | — | ✅ APLICADO | Specs adicionadas ao gate de CI |
| 32 | Recalibrar piso de cobertura | — | ✅ APLICADO | Vitest threshold ajustado |
| 33 | Comentário obsoleto de cobertura | — | ✅ APLICADO | Comentário removido |
| 34 | Gate RLS/GRANT obrigatório | — | 🟡 PENDENTE | CI gate de RLS não implementado |
| 35 | Revisão aprovada obrigatória no CI | — | ✅ APLICADO | Branch protection: 1 reviewer obrigatório |
| 36 | Deadlock REQUIRED\_MIGRATIONS | — | ✅ APLICADO | Loop de dependência no CI resolvido |
| 37 | Actions Node 20 depreciado | — | 🟡 PENDENTE | Actions ainda em node16/node20 deprecado |
| 38 | Hook pre-push | — | 🟡 PENDENTE | Hook pre-push não configurado via husky |
| 39 | Testes motores cálculo tributário | [#236](https://github.com/adm01-debug/Promo_Finance_V2/pull/236) | 🔵 PR ABERTA | 86 casos Simples/Presumido/Real + paridade edge |
| 40 | Testes layout SPED (ECD/ECF/EFD) | [#236](https://github.com/adm01-debug/Promo_Finance_V2/pull/236) | 🔵 PR ABERTA | Bloco 9 e estrutura de campos validados |
| 41 | Testes de cobrança | — | 🟡 PENDENTE | Régua de cobrança sem cobertura automatizada |
| 42 | Testes conciliação e categorização | — | 🟡 PENDENTE | IA de conciliação sem testes |
| 43 | Testes integração externa (cron/n8n) | [#234](https://github.com/adm01-debug/Promo_Finance_V2/pull/234) | 🔵 PR ABERTA | Mocks de Bling, Asaas, Bitrix24 |
| 44 | Piso cobertura edge functions (Sentry) | [#233](https://github.com/adm01-debug/Promo_Finance_V2/pull/233) | 🔵 PR ABERTA | Sentry + piso ≥70% edge functions |
| 45 | Reconstruir grafo e corrigir gatilho | (esta PR) | 🔵 EM ANDAMENTO | graphify indisponível; `ARCHITECTURE_GRAPH.md` criado manualmente |
| 46 | Limpar branches/worktrees órfãs | — | 🟡 PENDENTE | Branches de agentes anteriores a limpar |
| 47 | Commits órfãos | — | 🟡 PENDENTE | Verificar commits não associados a PR |
| 48 | PRs abertas documentadas | [#236](https://github.com/adm01-debug/Promo_Finance_V2/pull/236) | 🔵 PR ABERTA | Incluído como doc de rastreamento |
| 49 | Normalizar migrations + auditar views | — | 🟡 PENDENTE | 76 views sem security\_invoker confirmado |
| 50 | Corrigir deriva do CLAUDE.md | — | 🟡 PENDENTE | CLAUDE.md desatualizado desde P15 |

**Legenda:** ✅ APLICADO · 🔴 BLOQUEADO / P0 crítico · 🟡 PENDENTE · 🔵 PR ABERTA (aguardando merge) · EM ANDAMENTO

---

## Resumo por bloco

| Bloco | Etapas | APLICADO | PR ABERTA | PENDENTE | BLOQUEADO |
|-------|--------|----------|-----------|----------|-----------|
| A — Segurança P0 | 1–13 | 5 (07–11) | 0 | 5 (12,13,15-não,6 restantes) | 2 (01,02) |
| A — P0 core | 1–6 | 0 | 0 | 4 (03–06) | 2 (01,02) |
| A — P0 aplicado | 7–11 | 5 | 0 | 0 | 0 |
| B — Prevenção | 12–13 | 0 | 0 | 2 | 0 |
| C — Integridade escrita | 14–21 | 4 (14,18,20,21) | 0 | 4 (15–17,19) | 0 |
| D — Isolamento cliente | 22–28 | 3 (24–26) | 0 | 4 (22,23,27,28) | 0 |
| E — Gates CI | 29–38 | 6 (30–33,35,36) | 0 | 4 (29,34,37,38) | 0 |
| F — Cobertura testes | 39–44 | 0 | 4 (39,40,43,44) | 2 (41,42) | 0 |
| G — Higiene | 45–50 | 0 | 2 (45,48) | 4 (46,47,49,50) | 0 |
| **TOTAL** | **50** | **18** | **6** | **23** | **2** |

> Nota: etapa 45 conta como PR ABERTA (esta PR é o artefato de entrega).

---

## Métricas-alvo pós-plano

| Métrica | Linha de base (79435e90) | Meta pós-50 etapas | Estado atual |
|---------|--------------------------|-------------------|--------------|
| Edge functions com cross-tenant leak | ≥2 confirmadas | 0 | 🔴 2–3 conhecidas |
| service\_role keys no código-fonte | 1 exposta (compare-schemas) | 0 | 🔴 Pendente rotação |
| Edge functions com validatePayload(Zod) | ~60% | 100% | ⚠️ ~75% estimado |
| Views com security\_invoker = true | 30/106 | 106/106 | ⚠️ 30 confirmadas |
| Cobertura testes — módulos tributários | — | ≥80% | 🔵 PR #236 (estimado ≥86 casos) |
| Cobertura testes — geral | — | ≥70% | 🟡 Threshold ajustado (Etapa 32) |
| Specs desativadas por glob E2E | 20 | 0 | 🟡 Pendente (Etapa 29) |
| Checks obrigatórios no CI | 8 | 8 | ✅ Atual |
| Revisão aprovada obrigatória | 0 | 1 | ✅ Etapa 35 |
| Anon keys em variáveis de ambiente | Sim | 0 (Vault) | 🟡 Etapa 13 pendente |
| Gitleaks no CI | Parcial (PR #221) | Ativo | 🟡 Etapa 12 pendente |
| queryKeys sem empresaId | 51 | 0 | ✅ Etapa 25 aplicada |
| Branches ativas de agentes | — | 0 | 🟡 Etapa 46 pendente |

---

## Critérios para declarar o plano concluído

Todos os itens abaixo devem ser verdadeiros antes de fechar formalmente as 50 etapas:

1. **Etapas 1 e 2 verificadas:** service\_role key e migrate-helper rotacionados e confirmados pelo responsável humano.
2. **Etapas 3–6 com PR mergeada e teste comprovando ausência de cross-tenant.**
3. **PRs #233, #234, #236 mergeadas** e CI verde.
4. **Etapas 12, 13, 22, 29, 34, 37, 38:** implementadas e CI verde.
5. **Etapa 49:** `SELECT security_invoker = true` retorna 106/106 views.
6. **Etapa 50:** CLAUDE.md atualizado com estado real do sistema.
7. **Deploy confirmado em produção** (Vercel): `app.promo-finance.com` respondendo sem erro 5xx.

---

## Histórico de PRs do plano

| PR | Etapas | Descrição | Status |
|----|--------|-----------|--------|
| [#221](https://github.com/adm01-debug/Promo_Finance_V2/pull/221) | — | fix(security): .max() nos arrays de edge functions — GHSA-mrhx-c7xc-m3w5 | MERGEADA (HEAD main) |
| [#233](https://github.com/adm01-debug/Promo_Finance_V2/pull/233) | 44 | Piso cobertura edge functions / Sentry | ABERTA |
| [#234](https://github.com/adm01-debug/Promo_Finance_V2/pull/234) | 43 | Testes integração externa (cron) | ABERTA |
| [#236](https://github.com/adm01-debug/Promo_Finance_V2/pull/236) | 39,40,48 | Testes tributários + SPED + docs rastreamento | ABERTA |
| (esta PR) | 45 | docs: ARCHITECTURE\_GRAPH.md + REAUDITORIA\_FINAL.md | ABERTA |

---

## Próximas ações prioritárias (pós-merge desta PR)

1. **[P0 imediato]** Abrir PRs para etapas 3, 4, 5, 6 — são cross-tenant leaks e IDOR em produção.
2. **[Humano]** Executar rotação manual das credenciais (etapas 1 e 2) — impossível via código.
3. **[CI]** Mergear PRs #233, #234, #236 após CI verde para desbloquear métricas de cobertura.
4. **[Higiene]** Executar etapa 49 (auditar 76 views sem security\_invoker) via migration DDL.
5. **[CLAUDE.md]** Etapa 50: atualizar CLAUDE.md com estado atual do sistema (130+ tabelas, 105+ edge functions, stack atual).
