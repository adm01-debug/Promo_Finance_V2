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

---

## Apêndice R2.1 — Execução das melhorias + validação multi-agente (mesma noite)

### Executado nesta rodada (verificado)

| Ação                              | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Branch protection em `main`**   | ✅ ATIVA (confirmada pela API): required checks `Quality Gate & Tests`, `E2E Critical Gate`, `Unit tests (offline, determinísticos)`, `Integration tests (edge functions live)` + strict + enforce_admins, sem force-push/delete. `Supabase DB Linter` ficou de fora **de propósito** (path-filter → PR de docs travaria em "expected" eterno) e `E2E Destructive Logout` idem (vermelho crônico até o fix abaixo estabilizar) — adicionar ambos quando token rotacionado + fix confirmado verde.                                                                                                                       |
| **Lockfiles consolidados**        | ✅ `bun.lockb` e `package-lock.json` removidos; `bun.lock` é o único (o que o CI usa). `vercel.json` installCommand `npm ci` → `bun install --frozen-lockfile` (npm ci quebraria sem package-lock).                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **CLAUDE.md corrigido**           | ✅ 51→105 functions, 551→571 migrations, meta 1012→2689 testes, `calcular-iva`→`calculo-iva`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **CHANGELOG**                     | ✅ Entradas da auditoria/branch protection/lockfiles registradas.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Fix do E2E Destructive Logout** | ✅ Causa raiz determinística: o PR #53 fundiu 3 testes e moveu o `logout()` para depois de `goto('/admin/system-health')` — rota que renderiza **fora** do `MainLayout` (único lugar que monta `<Header>`, único dono do `data-testid="user-menu"`). Falha 100% reproduzível, não flake. Patch mínimo aplicado no teste (volta a `/dashboard` antes do logout, restaurando a semântica verde pré-#53). Validação final é a run do CI neste PR. Fix de produto (rotas `/admin/system-health` e `/admin/edge-health` sem sidebar/header — com armadilha de layout aninhado via `SRECommandCenter`) fica para PR separado. |

### Achados NOVOS desta rodada

1. **O canal automático de migrations EXISTE e está QUEBRADO.** O GitHub App oficial "Supabase" (que "runs your migrations when pull requests are merged") está instalado e seu check **falha no main**: `ERROR: column "categoria" does not exist — CREATE INDEX idx_fornecedores_categoria` (`001_create_tables.sql:78`). Como a própria `001` **cria** a coluna na linha 61 e usa `CREATE TABLE IF NOT EXISTS`, o erro só se explica se o app parte de um schema pré-existente **onde `fornecedores.categoria` não existe** → **forte indício de drift schema-de-produção × migrations** (coerente com as migrations de "reconciliação" de 25-27/08). Isso é provavelmente a causa-raiz de migrations nunca chegarem sozinhas ao banco. O replay-do-zero do agente A1 (abaixo) serve de contraprova.
2. **A justificativa dos 7 `@ts-nocheck` é FALSA** — e eles escondem bugs de runtime. Todos os 7 headers dizem "tabelas ausentes em types.ts (regenerar resolve)"; verificação exaustiva: **100% das tabelas/RPCs já estão tipadas** no types.ts atual. O que os pragmas escondem é drift de código: `useIRPJCSLL.ts:165-172` e `:297-308` fazem INSERTs **sem colunas NOT NULL** (`periodo_inicio`/`periodo_fim`/`periodo`) — provável falha de runtime hoje; `useReguaCobranca.ts:23` declara `dias_gatilho?: number` onde o schema é `number[]`; acesso a propriedades de retorno `Json` sem type-guard. **Regenerar types.ts é no-op; o fix é corrigir os hooks** (Sprint 1 atualizado).
3. **Paginação: pior que o reportado.** A Conciliação carrega **a tabela de transações bancárias inteira, sem `.limit` nem filtro de período** (`src/lib/conciliacao-page-helpers.ts:109-113`, disparado a cada troca de banco) — a tabela que mais cresce no sistema. E os hooks de KPI de Pagar/Receber usam `.limit(1000)` fixo alimentando somatórios (`useContasReceberLogic.ts:202-214`): **acima de 1000 contas os totais exibidos ficam silenciosamente errados** — bug de integridade visual de dado financeiro. Lançamentos Contábeis baixa até 10k linhas com joins para renderizar 100 (`LancamentosTab.tsx:293`).
4. **Web Vitals: INP não é coletado** — `telemetry.ts:149` usa `onFID` (métrica aposentada pelo Google em 2024) e `onINP` nem é importado (a lib 3.5.2 já exporta). Além disso o flush em `beforeunload` sem `sendBeacon`/`keepalive` tende a perder exatamente o CLS, e métricas pré-login são descartadas (`telemetry.ts:58-62`).
5. **Os 2 bots de review estão inoperantes**: CodeRabbit avisou no PR #57 sobre **pagamento pendente >72h** (risco de interrupção) e Greptile esgotou os créditos trial. Com zero revisor humano, hoje não há NENHUM revisor ativo além do CI — reforça a dimensão 20.
6. `console-guard` confirmado (silencia log/info/debug em prod, preserva warn/error por design, primeiro import do bundle); `initTelemetry` confirmado em `main.tsx:12`.

### Validação multi-agente (5 agentes)

- **A4 (diagnóstico E2E)** e **A5 (claims front)**: concluídos — achados acima.
- **A1 (replay das 571 migrations em Postgres local + gate RLS + teste negativo do gate)**, **A2 (matriz de auth das ~102 edge functions)** e **A3 (timeline ACL do lockout, incluindo a hipótese de o REVOKE de `anon` ser inócuo se `PUBLIC` reteve EXECUTE)**: a primeira execução foi interrompida por limite de sessão da API; relançados nesta rodada — resultados serão anexados ao PR quando concluírem.

### Impacto nas notas (parcial, honesto)

CI/CD 4.0 → **4.5** (branch protection ativa; sobe mais quando main ficar verde) · Manutenibilidade 5.5 → **6.0** (lockfile único) · Documentação 6.5 → **7.0** (CLAUDE.md/CHANGELOG corretos) · Testes: fix do gate destructive pushado (aguardando CI) · Performance/Data Integrity: achado #3 (KPIs truncados) pesa contra — mantidas até correção. **Nota ponderada ~5.8 → ~5.9.** O salto real (→ ~7) continua atrás do token: aplicar as 11 migrations, `DATABASE_URL`, linter verde executando.

---

## Apêndice R2.2 — Matriz de auth das edge functions + veredito do lockout + fixes aplicados

### A2 — Matriz de autenticação (102 functions lidas, evidência arquivo:linha no transcript do PR)

46 com `verify_jwt=false` / 56 com `true`. **33 das 46 têm guard efetivo e completo.** Lista crítica: **11 funções distintas**:

- 🔴 **`sso-callback` — PKCE era efetivamente opcional**: `if (attempt.code_verifier_hash && verifier)` — omitir o `verifier` (controlado pelo cliente) pulava a checagem inteira e o fluxo seguia para a troca do code com service_role. **CORRIGIDO neste PR** (verifier obrigatório quando o initiate registrou PKCE).
- 🔴 `validate-ip-geo`: NENHUM guard + service_role + INSERT em `auth_logs` com `email` controlado pelo chamador anônimo (forja de trilha de auditoria + oráculo de política IP/país, sem rate-limit). Pendente (fluxo pré-login — precisa rate-limit, não guard de usuário).
- 🔴 `sso-initiate`: pré-auth por design, mas `select *` de `sso_providers` carrega `client_secret` na memória e INSERT anônimo ilimitado em `sso_login_attempts`. Pendente (rate-limit + colunas explícitas).
- 🟠 Guard fraco (`getClaims` sem exigir `sub` — **a anon key pública passava**): `gerar-pdf-tributario`, `enviar-bitrix24-tributario`, `cnpja-lookup` — **CORRIGIDOS neste PR** (`?.sub` obrigatório); `sso-logout` pendente (logout precisa tolerância a token expirado — tratar junto do redesenho do lockout).
- 🟠 **IDOR cross-tenant ativo**: `gerar-dre-tributaria` e `gerar-heatmap-tributario` — qualquer usuário logado lia `faturamento_mensal`/regime de **qualquer** empresa via service_role; `gerar-pdf-tributario` idem + gravava PDF no Storage da empresa alheia. **CORRIGIDOS neste PR** (vínculo `has_role`/`user_empresas`, padrão de `comparar-benchmark-setorial`).
- 🟡 Sem RBAC/escopo: `bling-proxy` (qualquer logado opera a API Bling, incl. `revogar_token`), `external-data` (devolve todas as `companies` do projeto externo a qualquer logado), `copilot-global` (tools do LLM leem `acoes_recomendadas`/`health_scores_operacionais` sem filtro de tenant). Pendentes documentados.
- ⚪ Sem impacto: `gerar-alertas-dispatcher` (proxy sem service_role), `get-vapid-key` (chave pública). `health` (verify_jwt=true) expõe status de infra a qualquer JWT válido — recomendado `exigirPapel(['admin'])`.

Isto **fecha a lacuna da R1** ("16 edge functions não auditadas individualmente"): as 102 agora têm classificação com evidência.

### A3 — Timeline ACL do lockout (veredito final)

Reconstrução completa das migrations que tocam `increment_failed_attempts`/`reset_failed_attempts`/`get_lockout_details`/`login_attempts`. **O lockout não funciona em NENHUM dos dois cenários de ACL possíveis**:

- **Cenário migrations-aplicadas** (`20260711182305` revogou EXECUTE de PUBLIC/anon/authenticated e concedeu só a service_role; nenhum DROP posterior — ACL preservada, com postflight de `20260831153000` provando): as 3 chamadas do front (`Auth.hooks.ts:164/218/229`) falham com `42501` **silencioso** (o `error` é descartado nas 3) → contador nunca sobe, gate nunca bloqueia.
- **Cenário banco-real-divergente** (os lints `0028/0029` citados em `AUDITORIA_BACKEND_SENIOR.md` só disparam quando anon/authenticated executam): o lockout "funciona", mas vira **arma** — `increment_failed_attempts(email)` com a anon key trava a conta de terceiros (DoS), `get_lockout_details` permite **enumeração de usuários**, e `reset_failed_attempts` deixa o atacante **zerar o próprio contador** (brute-force ilimitado). Agravante: até `20260831` o corpo usava `ON CONFLICT (email)` sem índice único → `42P10`.

Extras de drift/documentação: a coluna `login_attempts.email` **não é criada por nenhuma migration do repo** (1ª referência em `20260518175808`), e `docs/SECURITY_DEFINER_ATTESTATION.md` afirma uma validação `has_role('admin')` em `get_lockout_details` que **não existe no corpo**. Patch definitivo (Sprint 1): Auth Hook `password_verification_attempt` server-side + migration idempotente re-afirmando a ACL + `has_role` real no `get_lockout_details` + checar `error` nas chamadas.

### A1 — Replay das 571 migrations

Em execução (Postgres local + gate RLS + teste negativo); resultado será anexado ao PR quando concluir.

---

## Apêndice R2.3 — Replay local das 571 migrations (veredito final da validação)

Replay completo do zero em PostgreSQL local (ambiente Supabase emulado: roles, auth, extensions, baseline de default privileges), migration a migration, com evidência integral em `docs/evidencias/replay-2026-09-03/`.

### O repo de migrations NÃO é autocontido (prova em escala do drift)

571/571 aplicadas, mas **91 arquivos (16%) exigiram 173 intervenções** para o replay convergir. **13+ tabelas e dezenas de colunas que o schema final exige nunca são criadas por migration nenhuma** (`auth_logs`, `webhook_events`, `cron_job_logs`, `bitrix24_tokens`, `password_reset_tokens`, o domínio logístico inteiro…); `has_role` referencia `profiles.role` e `user_roles.is_active/expires_at` que não nascem em lugar algum; o reconciliador `20260825100000` **não aplica limpo em banco nenhum** (FK criada antes da tabela referenciada, sintaxe `MAINTAIN` de PG17); os `DROP POLICY` do reconciliador v3 usam nome concatenado errado e **nunca dropam**. Consequência direta: **confirmada a causa do check "Supabase Preview" quebrado** — o replay do zero passa limpo pela `001` (a coluna `categoria` existe), logo o erro do Preview só é possível partindo de um schema pré-existente divergente. É o mesmo drift, visto de dois ângulos.

### O gate RLS REPROVA o schema final — aplicar o PR #54 é necessário, mas NÃO fecha o leak

`rls_multi_empresa.sql` contra o schema pós-replay: **FALHA com ~120 policies sem escopo de empresa** (lista integral em `docs/evidencias/replay-2026-09-03/gate_real_schema.out`). Auditoria direta: **111 policies em 45 tabelas** (96 seguramente reais do repo, em 42 tabelas; 15 possivelmente ruído de stub) — padrões `has_role`-only, owner-only e `USING(true)` em tabelas multi-empresa (`fornecedores` 8, `clientes` 7, `contas_pagar`/`contas_receber` 4 cada, `asaas_*`, `integration_secrets`, `scim_tokens`…). Causa: os reconciliadores de 25/08 **reintroduziram policies do dump de origem por baixo dos fixes** do PR #54. **Nova onda de correção de policies é necessária** — e quando `DATABASE_URL` for configurado, o gate vai (corretamente) reprovar até essa onda ser feita.

Caso escancarado corrigido **neste PR** (migration `20260903000100`): `user_filter_presets.users_own_presets` com `USING ((user_id = auth.uid()) OR true)` — tautologia introduzida pela otimização initplan (`20260825230000:800`) que abria os presets de todos os usuários a qualquer authenticated.

### O que o replay CONFIRMOU de bom (contraprova positiva)

- **0** tabelas com `empresa_id` sem RLS · **0** funções SECURITY DEFINER sem `search_path` · **0** grants de anon em tabelas multi-empresa (o hardening `20260825090000` funcionou — verificado com o baseline de grants do Supabase emulado).
- ACL do lockout: `{postgres, service_role}` apenas, sem PUBLIC — **confirma o cenário "inoperante silencioso" do apêndice R2.2** (as chamadas do front como anon falham com 42501 engolido).
- 5 views sem `security_invoker` (4 legadas já mitigadas por REVOKE + `mcp_probe`).
- **O gate do PR #55 detecta o que promete**: teste negativo com 3 policies vulneráveis plantadas → acusou exatamente as 3 (`gate_negative.out`).
- PR #54: 8 das 9 migrations do intervalo aplicam 100% limpas do zero; `20260902210000` depende de `notas_fiscais_ocr.criado_por` (coluna prod-era — deve existir em produção).
- Totais do schema final: 298 tabelas, 832 policies, 242 funções, 298 triggers, 29 views.

### Consequência para o roadmap

A condição de recuperação da dimensão Autorização muda: **rotacionar token + aplicar as 11 migrations + configurar `DATABASE_URL` destrava a validação, mas o gate vai reprovar** — a onda seguinte é corrigir as ~96 policies reais listadas na evidência (com a mesma disciplina de verificação individual do PR #54). Só então o gate verde passa a significar "leak fechado".
