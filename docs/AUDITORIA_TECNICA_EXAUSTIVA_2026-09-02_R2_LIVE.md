# Auditoria Técnica Exaustiva R2 (validação live) — Promo Finance V2

> Data: 2026-09-02 (noite) · Branch: `claude/auditoria-tecnica-sistema-9c0mnw`
> Base: `main@87fcc12` · Re-auditoria da `docs/AUDITORIA_TECNICA_EXAUSTIVA_2026-09-02.md` (PR #54, mesma data, 100% estática)
> Método: toda alegação da auditoria R1 foi **re-verificada com execução real** (pipeline local completo, GitHub API, worker MCP, invocação de Edge Functions em produção) ou marcada como não-auditável com o motivo exato.

---

## O que foi EXECUTADO de fato nesta sessão (não inferido)

| Verificação                              | Resultado real                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `npm ci` + `tsc --noEmit`                | **0 erros** (exit 0)                                                                                                  |
| `vitest run` (suite completa)            | **2689/2689 passando**, 204 arquivos, 116s                                                                            |
| `lint:strict` (`--max-warnings 0`)       | **FALHA — 18 warnings** (7× `@ts-nocheck`, 3× `max-lines`, unused vars)                                               |
| GitHub API: branch protection `main`     | **404 "Branch not protected"** + rulesets `[]`                                                                        |
| GitHub API: últimas runs em `main`       | `Supabase Linter` **failure** (2×), `CI Pipeline` **failure** (4×), `Deno Tests` success                              |
| Steps do quality-gate (run 33663455685)  | Gates psql **`skipped`** (DATABASE_URL ausente); RPC matrix **success**; vitest/build **success**                     |
| Worker MCP (`supabase-mcp-bwwbey`) — SQL | **Management API 401** em TODAS as tools de banco (idem MCP da sessão)                                                |
| Worker MCP — Auth admin (live)           | **2 usuários**, **0 fatores MFA** (nem o admin), 0 telefones, último login 25/08                                      |
| Worker MCP — Storage (live)              | bucket `comprovantes-financeiro` privado, 20MB, MIME allowlist ✔                                                      |
| Edge `health` invocada (live, prod)      | 200 em 234ms — DB/realtime **operational**; **Asaas e Bling `degraded`**                                              |
| Edge `compare-schemas` invocada (live)   | **500** — `SCHEMA_COMPARE_EXTERNAL_URL` aponta para projeto Supabase **morto** (`xyykivpcdbfukaongpbw`, DNS NXDOMAIN) |
| SQL direto no banco de produção          | **NÃO AUDITÁVEL** — token da Management API (`sbp_`) expirado; ver Achado Central                                     |

---

## ACHADO CENTRAL R2 — A malha de validação live do banco está morta em 3 camadas, e as correções do vazamento cross-tenant provavelmente NÃO estão em produção

A auditoria R1 (PR #54) encontrou e corrigiu no **repositório** um vazamento cross-tenant sistêmico (213+ policies `has_role` sem `empresa_id`, tautologias, RPCs `nfe_*` sem escopo). O que a R2 constatou ao vivo:

1. **`SUPABASE_ACCESS_TOKEN` expirado** (Personal Access Token `sbp_`). Evidência: run 33663455714 do `Supabase Linter` em `main` — `❌ Management API (migrations) falhou com HTTP 401` — e o mesmo 401 em todas as tools SQL do worker MCP. Desde ~13:35 de hoje, o linter oficial, o "Gate live do banco canônico" e o MCP estão **cegos**.
2. **`DATABASE_URL` nunca esteve nos secrets do repo.** Na run verde do quality-gate de hoje, os steps `Observability privileges guard (psql)`, `pgTAP catálogos`, `Gate #35` e `Export function privileges` concluíram como **`skipped`**, e o step "Registrar gates de banco como inconclusivos sem DATABASE_URL" rodou com success — a prova da ausência. Consequência grave: **`supabase/tests/sql/rls_multi_empresa.sql` (o gate anti-vazamento, endurecido no PR #55) NUNCA executou contra o banco real** — nem hoje, nem nos "16 commits verdes" do PR #54. O job verde mascarava steps pulados.
3. **Aplicação das 11 migrations do PR #54 em produção: sem nenhuma prova.** O canal de aplicação usado no projeto (MCP `db_query`, regra do CLAUDE.md) morreu junto com o token; nenhum workflow aplica migrations em prod (`staging-migrate.yml` é staging e manual); `test-canonical-db-gates.mjs` só exige as migrations `20260826*` — não as do #54; e a própria R1 listou o deploy como pendente ("bloqueado por infra", Top-10 #3). **Enquanto não confirmado o contrário, o banco de produção deve ser tratado como ainda vulnerável ao padrão cross-tenant descrito na R1.**

Correção (ordem exata, ~30 min de trabalho após gerar o token):

1. Gerar novo PAT em https://supabase.com/dashboard/account/tokens → atualizar secret `SUPABASE_ACCESS_TOKEN` do repo **e** o secret do worker `supabase-mcp-bwwbey`.
2. Aplicar as 11 migrations `20260902*` do PR #54 via MCP (`db_query` + INSERT no ledger) e conferir `supabase_migrations.schema_migrations`.
3. Criar secret `DATABASE_URL` (connection string do pooler) → os 4 gates psql passam a executar de verdade.
4. Disparar `workflow_dispatch` do `Supabase Linter` e conferir verde **com os steps executados**, não pulados.

---

## Inventário do Sistema (números re-verificados)

| Item               | Valor verificado nesta sessão                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Código             | 1.743 arquivos TS/TSX em `src/`, ~280k LOC                                                           |
| Migrations no repo | 571 arquivos (`001_create_tables.sql` → `20260902260000`)                                            |
| Edge Functions     | 105 diretórios, 102 com `index.ts` (CLAUDE.md diz "51" — desatualizado)                              |
| Testes             | 204 arquivos unit/integration (2689 testes), 26 specs E2E                                            |
| Banco oficial      | `bwwbeyolnnzppeuhgkcd` — SQL não-auditável nesta sessão (401); Auth/Storage/Functions auditados live |
| Usuários reais     | 2 (sistema single-admin na prática), 0 MFA                                                           |
| CI                 | 4 workflows; `main` **vermelho** agora (linter 401 + E2E destructive crônico)                        |
| Deploy             | Lovable Cloud (`app.promo-finance.com`; proxy desta sessão bloqueou verificação direta de headers)   |
| Grafo              | `graphify-out/` 10 commits atrás do HEAD; **Import Cycles: none detected**                           |

---

## As 20 Dimensões (nota · evidência · gap principal)

### 1. Arquitetura — 6/10

Confirmado da R1: `docs/ARCHITECTURE.md` cita `src/services` que **não existe** (verificado: `ls` falha); só 2 ADRs numerados + pasta `adr/`. Novo: grafo atual reporta **zero ciclos de import** (os 3 ciclos da R1 em `lib/tributario` não se reproduzem no grafo de `4a081b85`). Estrutura híbrida layer+feature consistente. **Gaps**: doc de arquitetura mentindo sobre `src/services`; ADRs retroativos das decisões centrais.

### 2. Autenticação — 5/10 (era 6)

PKCE + SSO OIDC/SAML + SCIM com tokens hasheados: sólidos (código). Rebaixada por 3 fatos novos:

- **Lockout de brute-force provavelmente INOPERANTE em produção**: `20260711145322` fez `REVOKE EXECUTE ON FUNCTION public.increment_failed_attempts(text) FROM anon`, **nenhuma migration re-concede**, e o único caller é `src/pages/Auth.hooks.ts:218` — executado como `anon` (antes do login). Ou seja: além de bypassável (quem chama `/auth/v1/token` direto nunca passou pelo lockout), o contador provavelmente nem incrementa pelo caminho normal. Verificar live pós-rotação do token e mover o incremento para Auth Hook server-side.
- **MFA: 0 fatores cadastrados** — nem o admin usa (dado live do GoTrue admin). MFA "disponível" sem adoção nem exigência (`aal2` não é checado em rota nenhuma).
- `checkRateLimit` (existe em `_shared/rate-limit.ts`, usado em 11 functions) segue ausente das functions de auth/SSO — confirmado por grep.

### 3. Autorização — 4/10 condicional (era 8 na R1)

A R1 deu 8/10 assumindo correções "validadas ao vivo via CI". A R2 constatou que **essa validação nunca existiu** (gates psql skipped — ver Achado Central) e que as 11 migrations de correção **provavelmente não estão aplicadas em produção**. O que vale para a nota é o estado de produção: até confirmação, o vazamento cross-tenant da R1 deve ser considerado **ativo**. A nota sobe para ~7.5 no dia em que: migrations aplicadas + `rls_multi_empresa.sql` executado verde contra o banco real. Pontos positivos reais: o gate foi corretamente endurecido no PR #55 (li o SQL — checks 1-5 bem construídos, USING/WITH CHECK com fallback correto), e a RPC runtime matrix (anon/authenticated) roda live e passou hoje. `user_roles` global (sem tenant) permanece decisão pendente.

### 4. Banco de Dados — 7/10

Estático (migrations/types): dinheiro em NUMERIC, TIMESTAMPTZ, partições em logs, migrations estritamente crescentes, replay-safety com gate próprio. ~605 `REFERENCES` nas migrations com `ON DELETE` presente em só 121 arquivos — o claim R1 de ~47% de FKs sem `ON DELETE` segue plausível. **Gaps**: paridade repo↔ledger de produção não-verificável (401); sem `seed.sql`; PITR/backup sem doc formal. Live: storage bem configurado; `health` reporta DB operational.

### 5. CI/CD — 4/10 (era 6)

O pipeline é sofisticado **no papel** e parcialmente teatro **na prática**, hoje:

- **Branch protection inexistente em `main`** (confirmado live; era o item #1 do Top-10 R1 — não executado). PRs #53 e #55 foram mesclados **hoje** com `CI Pipeline` vermelho.
- `main` está **vermelho agora**: linter 401 (token) + `E2E Destructive Logout` falhando cronicamente (`getByTestId('user-menu')` invisível — mesma falha nas 4 últimas runs; pré-existe a qualquer mudança recente).
- Gates de banco **silenciosamente pulados** há tempo indeterminado (DATABASE_URL ausente) — o desenho "skip + summary" mascarou o buraco; deveria falhar o job ou virar check separado vermelho.
- Funciona de verdade: bun install/lint/type-check/vitest/build, RPC matrix live, Deno tests, replay-safety, zod-coverage.

### 6. Data Integrity — 7/10

Confirmado: idempotência de webhooks com claim atômico + DLQ (`_shared/webhook-idempotency.ts`); dedupe por hash; Zod em 84/102 functions com gate de cobertura no CI. **Zero optimistic locking** (nenhuma coluna `version` em 571 migrations — verificado). Escritas multi-tabela fora de webhooks sem transação real (claim R1 mantido).

### 7. Documentação — 6.5/10

Volume alto e útil (RUNBOOK com SQL de diagnóstico real). Mas continua mentindo em pontos-chave (nada do Top-10 #6 da R1 foi feito): `CLAUDE.md` diz "51 funcoes" (real 105), meta "1012/1012 testes" (real 2689), cita `calcular-iva` (real `calculo-iva`); `CHANGELOG.md` tem **1 commit na história inteira**; `DEPLOYMENT.md` descreve infra errada. Novo: config documentada de `compare-schemas` aponta para projeto morto.

### 8. Infraestrutura/DevOps — 5.5/10 (era 6.5)

`.env.example` exemplar, secrets fora do código (confirmado), health check real. Rebaixada por evidência nova de **gestão de credenciais sem rotação nem monitoramento**: em um único dia encontrei 3 credenciais/configs mortas — PAT `sbp_` expirado (CI + worker MCP), `DATABASE_URL` jamais configurado, `SCHEMA_COMPARE_EXTERNAL_URL` apontando para projeto deletado. Nada alertou; tudo foi descoberto por auditoria manual. `_shared/resilience.ts` (retry+circuit breaker) segue em só 2 integrações — e o `health` live mostra Asaas E Bling `degraded` agora, sem alerta configurado.

### 9. Logging/Monitoring — 5/10

`_shared/logger.ts` estruturado bem desenhado, mas importado por só **5** functions (grep direto; R1 dizia 19 — divergência anotada, ambos ruins em 105). Sem uptime monitoring externo. Correlation-id real end-to-end (`x-request-id` injetado no client — código confirmado). Asaas/Bling degradados agora sem ninguém saber reforça a ausência de alerting.

### 10. Observabilidade — 4.5/10

Web Vitals real (confirmado na R1). **Sentry é stub morto**: `initSentry()` não é chamado em lugar nenhum (grep vazio) e `@sentry/*` não está no package.json. Tabelas de SLO existem sem alvo formal. Sem tracing cross-service além do request-id.

### 11. Lógica de Negócio — 6/10

Motor tributário com testes fuzz reais. **Duplicação front/back confirmada**: `src/lib/tributario/shared-logic.ts` (535 linhas) × `supabase/functions/_shared/tributario-logic.ts` (789 linhas) — duas fontes de verdade para cálculo tributário. Sem máquinas de estado explícitas para transição de status.

### 12. Manutenibilidade — 5.5/10

**3 lockfiles divergentes commitados** (`bun.lock`, `bun.lockb`, `package-lock.json`): `@supabase/supabase-js` resolve **2.87.1 no bun.lock** (o que o CI/produção usa) e **2.110.9 no package-lock.json** — builds não-determinísticos entre ambientes, verificado nesta sessão. 46 TODO/FIXME. Os pacotes "MISSING" da R1 estão presentes no bun.lock (claim R1 refutado; o problema real é o drift triplo).

### 13. Operacionalidade — 5.5/10

RUNBOOK utilizável; rollback de migrations inexistente; **feature flags: não existem** (0 ocorrências no schema — verificado); env morta em function admin (`compare-schemas`) rendendo 500 permanente. Deploy Lovable sem gate próprio.

### 14. Performance — 5/10

Confirmado por contagem direta: `React.lazy` 129 usos ✔; **`.range()` (paginação server-side) em só 4 lugares** para 130+ tabelas; cache TanStack maduro (R1); bundle não medido nesta sessão. Sem dados live de queries lentas (401).

### 15. Qualidade de Código — 6/10

`lint:strict` **falha com exatamente 18 warnings** (executado; lista igual à R1 — nada foi corrigido). `eslint.config.js` ignora `supabase/functions/**` no bloco global com re-inclusão de apenas 3 zonas — ~99 functions sem lint. `console.log` em `src/`: 2 ocorrências (sob controle). Husky + lint-staged ativos.

### 16. Segurança — 6/10 (era 7)

Sem contar o vazamento (pontuado na dimensão 3): webhooks com HMAC fail-closed/timing-safe (código lido — sólido); Asaas valida `asaas-access-token`; `mcp-query` com `x-mcp-secret` timing-safe; zero secrets no código; secret-scanning + push-protection (R1). **Abertos**: CORS wildcard em **15** functions (era 32 — houve progresso real via PR #53; 37 já usam `ALLOWED_ORIGINS`); CSP `Report-Only` com `unsafe-inline`+`unsafe-eval` — e como o deploy é Lovable, o `vercel.json` inteiro (CSP + HSTS + XFO) **possivelmente nem é aplicado em produção** (não confirmável desta sessão: proxy bloqueou o domínio; verificar com `curl -I` de fora); sessão em `localStorage`; sem `dependabot.yml`.

### 17. Testes — 7/10

**2689/2689 verdes executados nesta sessão** (116s). Cobertura de linhas real ~6.8% (piso configurado: 6% — verificado no `vitest.config.ts`). E2E: 26 specs, mas o gate destructive está **cronicamente vermelho no main** e o quality-gate segue verde — teste bloqueante que não bloqueia nada é dívida dupla. Deno tests das functions: verdes no CI.

### 18. Tipagem — 6/10

`tsconfig.json`: `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` (lido). 7 hooks com `@ts-nocheck` (types.ts desatualizado — sem `gen:types` no package.json/CI). `as any` 46× / `: any` 47× em 280k LOC (baixo). types.ts com 21.434 linhas presente.

### 19. Validação — 7.5/10

Melhor dimensão: Zod centralizado (`_shared/validation.ts` + `zod.ts`), **gate de cobertura Zod no CI** (`zod-coverage.sh` — falha build se function nova chegar sem `validatePayload`), 84/102 functions cobertas, validadores BR dedicados. Gap: sem validação de transição de estado; upload `.pfx` sem limite de tamanho no schema (R1, não re-verificado).

### 20. Operações (Processos) — 5/10

Conventional commits reais. **Zero revisão por terceiros + zero branch protection + merges com CI vermelho no mesmo dia** (PRs #53/#55, verificado nas runs) — o "único revisor" (CI) é ignorável e foi ignorado hoje. Sem dependabot/rotina de deps; sem processo de incidente escrito.

---

## Scorecard Consolidado R2

```
╔══════════════════════════════════╦═══════╦═══════════════════════════════════════════════════╗
║ DIMENSÃO                         ║ NOTA  ║ GAP PRINCIPAL PARA 10/10                          ║
╠══════════════════════════════════╬═══════╬═══════════════════════════════════════════════════╣
║ 1.  Arquitetura               ×2 ║ 6.0   ║ ARCHITECTURE.md cita camada inexistente; ADRs     ║
║ 2.  Autenticação              ×3 ║ 5.0   ║ Lockout inoperante (REVOKE anon); MFA 0 adoção    ║
║ 3.  Autorização               ×3 ║ 4.0*  ║ Fixes do leak cross-tenant não confirmados em prod ║
║ 4.  Banco de Dados            ×2 ║ 7.0   ║ Ledger de prod não-verificável; FKs sem ON DELETE ║
║ 5.  CI/CD                        ║ 4.0   ║ Sem branch protection; gates de banco skipped     ║
║ 6.  Data Integrity            ×3 ║ 7.0   ║ Sem optimistic locking; multi-tabela sem tx       ║
║ 7.  Documentação                 ║ 6.5   ║ CLAUDE.md/CHANGELOG mentem números básicos        ║
║ 8.  Infraestrutura / DevOps      ║ 5.5   ║ 3 credenciais mortas descobertas em 1 dia         ║
║ 9.  Logging / Monitoring         ║ 5.0   ║ Logger em 5/105 functions; sem uptime externo     ║
║ 10. Observabilidade              ║ 4.5   ║ Sentry stub nunca inicializado                    ║
║ 11. Lógica de Negócio            ║ 6.0   ║ Motor tributário duplicado front/back             ║
║ 12. Manutenibilidade             ║ 5.5   ║ 3 lockfiles divergentes (supabase-js 2.87≠2.110)  ║
║ 13. Operacionalidade             ║ 5.5   ║ Sem rollback de migration; sem feature flags      ║
║ 14. Performance                  ║ 5.0   ║ Paginação server-side em 4 lugares                ║
║ 15. Qualidade de Código          ║ 6.0   ║ lint:strict falha (18); functions sem lint        ║
║ 16. Segurança                 ×3 ║ 6.0   ║ CSP report-only possivelmente inerte; CORS 15 fns ║
║ 17. Testes                    ×2 ║ 7.0   ║ Cobertura ~7%; gate E2E vermelho que não bloqueia ║
║ 18. Tipagem                   ×2 ║ 6.0   ║ strict:false; 7 @ts-nocheck; sem gen:types        ║
║ 19. Validação                 ×2 ║ 7.5   ║ Sem máquina de estados de transição               ║
║ 20. Operações (Processos)        ║ 5.0   ║ Merges com CI vermelho no mesmo dia da auditoria  ║
╠══════════════════════════════════╬═══════╬═══════════════════════════════════════════════════╣
║ NOTA GERAL PONDERADA             ║ 5.8   ║ R1 reportou 6.6 assumindo validação live que      ║
║                                  ║       ║ nunca executou; 5.8 é o estado real hoje          ║
╚══════════════════════════════════╩═══════╩═══════════════════════════════════════════════════╝
```

\* Autorização volta a ~7.5 no dia em que as 11 migrations forem confirmadas aplicadas + `rls_multi_empresa.sql` rodar verde contra produção.
Pesos: ×3 Segurança/Autenticação/Autorização/Data Integrity · ×2 Banco/Tipagem/Validação/Testes/Arquitetura · ×1 demais.

---

## Divergências R2 × R1 (correções de registro)

| Claim da R1                                             | Constatação R2                                                                                                                    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| "Validado ao vivo via Quality Gate (16 commits verdes)" | Gates psql (`rls_multi_empresa` etc.) **skipped em todos** — `DATABASE_URL` nunca existiu como secret; só a RPC matrix rodou live |
| Autorização 8/10 pós-fix                                | Fixes provavelmente **não aplicados em produção** (canal de deploy morto antes do merge); 4/10 condicional                        |
| Lockout "100% client-side"                              | Pior: enforcement client-side **e** RPC de incremento com `EXECUTE` revogado de `anon` — mecanismo provavelmente inerte           |
| CORS wildcard em 32 functions                           | **15** (progresso real do PR #53; 37 já restritas via `ALLOWED_ORIGINS`)                                                          |
| Pacotes MISSING no lockfile                             | Presentes no `bun.lock`; o problema real é **3 lockfiles divergentes** entre si                                                   |
| supabase-js "25 versões atrás"                          | bun.lock (CI): 2.87.1; package-lock: 2.110.9 — o drift é o achado, não só o atraso                                                |
| Logger em 19/105 functions                              | 5/105 por import direto de `_shared/logger.ts`                                                                                    |
| 3 ciclos de import em lib/tributario                    | Grafo atual: **zero ciclos detectados**                                                                                           |

---

## Top 10 Ações por ROI

| #   | Ação                                                                                                            | Impacto                                     | Esforço                      | Tipo             |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- | ---------------- |
| 1   | **Rotacionar `SUPABASE_ACCESS_TOKEN`** (novo PAT) no secret do repo + no worker `supabase-mcp-bwwbey`           | Crítico — desbloqueia linter, gates e MCP   | Baixo (só o dono gera o PAT) | Config           |
| 2   | **Aplicar as 11 migrations `20260902*` do PR #54 em produção** e conferir o ledger                              | Crítico — fecha o leak cross-tenant DE FATO | Baixo (pós-#1, via MCP)      | Migration        |
| 3   | **Criar secret `DATABASE_URL`** no repo → gates psql passam a executar (hoje: skip silencioso)                  | Alto                                        | Baixo                        | Config           |
| 4   | **Branch protection em `main`**: exigir `Quality Gate & Tests` + `Supabase DB Linter`, PR obrigatório           | Alto                                        | Baixo                        | Config           |
| 5   | **Consertar lockout**: mover incremento de tentativas para Auth Hook server-side (resolve bypass + REVOKE)      | Alto                                        | Médio                        | Código+Migration |
| 6   | **Consertar E2E Destructive Logout** (`user-menu` invisível) — main vermelho crônico                            | Alto                                        | Médio                        | Código/Teste     |
| 7   | **Consolidar lockfiles**: manter só `bun.lock`, remover `bun.lockb` e `package-lock.json` (ou automatizar sync) | Médio                                       | Baixo                        | Config           |
| 8   | Corrigir `SCHEMA_COMPARE_EXTERNAL_URL` (projeto morto) ou aposentar `compare-schemas`                           | Médio                                       | Baixo                        | Config           |
| 9   | Atualizar `CLAUDE.md` (51→105 fns, 1012→2689 testes, `calculo-iva`) + CHANGELOG                                 | Médio                                       | Baixo                        | Docs             |
| 10  | Migrar as 15 functions restantes de `cors.ts` (wildcard) para `validation.ts` (`ALLOWED_ORIGINS`)               | Médio                                       | Médio                        | Código           |

## Roadmap em 3 Ondas

- 🔴 **Quick Wins (1-3 dias)**: #1 → #2 → #3 → #4 (nesta ordem — 1 destrava 2; 3 e 4 impedem regressão), #7, #8, #9. Ao final: re-rodar `Supabase Linter` + quality-gate e confirmar os steps de banco **executando**, não pulando.
- 🟠 **Sprint 1 (1-2 semanas)**: #5, #6, #10; exigir `aal2` (MFA) para roles admin/financeiro + cadastrar fator para os 2 usuários; `checkRateLimit` nas functions de auth/SSO; regenerar `types.ts` + remover os 7 `@ts-nocheck` + `gen:types` no CI; `dependabot.yml`.
- 🟡 **Sprint 2 (2-4 semanas)**: unificar motor tributário (front consome a Edge Function); `strictNullChecks: true` incremental; Sentry real (ou remover o stub); estender `resilience.ts` a Bitrix24/WhatsApp/Open Finance; paginação server-side nas listagens principais; subir cobertura crítica acima do piso de 6%; uptime monitoring externo com alerta (que teria pego Asaas/Bling `degraded` de hoje).

---

## Nota Final — 5.8/10

A R1 fez um trabalho real e valioso (o diagnóstico do vazamento cross-tenant e as 11 migrations de correção são de alta qualidade — o gate endurecido no PR #55 é tecnicamente correto), mas a nota 6.6 assumia uma camada de validação live que **nunca executou**: os gates de banco do CI pulam silenciosamente desde sempre por falta de `DATABASE_URL`, e hoje o restante da malha (linter oficial + MCP) morreu junto com um token expirado. O resultado prático é o pior cenário de auditoria: **correções de segurança críticas paradas no repositório, produção provavelmente ainda vulnerável, e nenhum sinal automático que denuncie isso** — main vermelho é ignorável porque não há branch protection, e o job verde do quality-gate parece saudável com os steps de banco pulados. As ações #1-#4 do Top 10 custam menos de uma hora de trabalho combinado após gerar o PAT e mudam o sistema de "parece validado" para "é validado". O resto da dívida (tipagem frouxa, cobertura de 7%, motor duplicado, observabilidade stub) é real, mas secundário perto de fechar o ciclo deploy→validação do banco.
