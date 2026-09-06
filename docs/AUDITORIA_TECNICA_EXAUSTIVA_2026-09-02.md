# Auditoria Técnica Exaustiva — Promo Finance V2
> Data: 2026-09-02 · Branch: `claude/auditoria-tecnica-sistema-6909vm` · PR #54
> Commit-base: `cd5444c` (main) · HEAD desta auditoria: ver últimos commits do PR

## Fase 0 — Inventário do Sistema

| Item | Valor |
|---|---|
| Repositório | `adm01-debug/Promo_Finance_V2` |
| Stack | React 18 + Vite 6 + TS · Supabase Cloud (Postgres/RLS/Auth) · 105 Edge Functions Deno |
| Banco oficial | `bwwbeyolnnzppeuhgkcd` (Supabase Cloud) — **MCP com token expirado (401) nesta sessão**, auditoria de banco 100% estática via migrations |
| Migrations | 566 arquivos em `supabase/migrations/` (556 + 10 desta auditoria) |
| Tabelas | ~291 no schema `public` (134 com coluna `empresa_id`) |
| Edge Functions | 105 (CLAUDE.md do projeto afirma 51 — **desatualizado**) |
| Testes | 2689 testes Vitest (204 arquivos), **rodados de fato nesta sessão** — 2689/2689 passando |
| CI | `.github/workflows/`: `ci.yml`, `deno-tests.yml`, `staging-migrate.yml`, `supabase-linter.yml` |
| Deploy prod | Lovable Cloud, `app.promo-finance.com` |
| Último deploy conhecido | Não verificável nesta sessão (sem acesso a logs de produção) |

Metodologia: 7 agentes de auditoria cobrindo as 20 dimensões + 5 agentes de validação adversarial do fix de segurança principal + verificação direta (grep/leitura) de toda alegação antes de qualquer correção ser publicada. CI real (`Supabase DB Linter`, `Quality Gate & Tests`) executado contra cada commit publicado nesta sessão via PR #54.

---

## Achado central da auditoria: vazamento cross-tenant sistêmico em RLS (CORRIGIDO nesta sessão)

Antes de entrar nas 20 dimensões: o achado mais grave encontrado — e a maior parte do trabalho desta sessão — foi um padrão sistêmico de policies RLS `PERMISSIVE` que checavam `has_role(admin/financeiro/...)` **sem considerar `empresa_id`**, coexistindo via `OR` com policies corretamente escopadas na mesma tabela. Como policies `PERMISSIVE` se combinam por `OR`, a policy solta por si só concedia acesso cross-tenant total, neutralizando o isolamento multi-tenant da policy correta.

**Escopo real do bug** (varredura exaustiva de todas as 291 tabelas + segunda passada em `rls_state.json`, 1012 policies vigentes reconstruídas estaticamente):
- 213 policies RLS em ~90 tabelas com o padrão `has_role sem empresa_id`
- 14 policies com uma variante "tautológica" (`empresa_id IN (SELECT id FROM empresas)`, sempre verdadeira) em `asaas_*`/`elisao_*`
- 8 views/materialized views legadas sem `security_invoker` fazendo bypass total de RLS
- 7 RPCs `SECURITY DEFINER` sem checagem de tenant, 4 delas (`nfe_*`) **ativamente exploráveis hoje** via `nfe-vinculo-proxy` (não dependiam de GRANT, iam direto por `service_role`)
- 5 Edge Functions com IDOR (checavam só `user_roles` global, nunca vínculo por empresa)

**Todas corrigidas e publicadas** em 16 migrations SQL + 4 correções de Edge Function nesta sessão (commits `a124b3b`..`6701745` no PR #54), cada uma verificada individualmente (nome exato de policy, policy irmã que garante cobertura, ausência de regressão funcional) antes de publicar — não uma correção em lote sem checagem. Validado ao vivo via `Supabase DB Linter` (verde em todos os 16 commits) e via `Quality Gate & Tests` (inclui gate "Runtime RPC privilege matrix anon/authenticated" contra o banco real — verde).

**Não corrigido, registrado para decisão**:
- `user_roles` é global (não por empresa) por design — `has_role()` não filtra por tenant porque o modelo de papéis hoje não é por-empresa. Restringir isso é decisão de arquitetura/produto, não bug pontual.
- `supabase/tests/sql/rls_multi_empresa.sql` (gate de CI) tem um blind spot: só sinaliza `qual = 'true'` literal, não pega `has_role(...)` sem `empresa_id` — foi exatamente esse blind spot que deixou o bug central passar pelo CI por meses. **Não fechei esse gate nesta sessão** (ver Top 10, item 3).
- 16 Edge Functions que tocam as 6 tabelas centrais não foram auditadas individualmente linha a linha (só 2 confirmadas com o mesmo bug e corrigidas, mais `executar-relatorios` e `convidar-contador`); podem existir mais.
- `MCP_SECRET`/`mcp-query` (achado de auditoria anterior, 26-31/08) — GRANT de exec já revogado corretamente segundo verificação estática, mas nunca confirmado ao vivo.

---

## As 20 Dimensões

### 1. Arquitetura — 6/10
`src/` é híbrido layer+feature, consistente, com domínios de negócio separados (tributário/NFe/cobrança/financeiro). `docs/ARCHITECTURE.md` cita uma camada `src/services` que **não existe** (`ls src/services` falha). Apenas 3 ADRs para 566 migrations/130+ tabelas — decisões arquiteturais relevantes vivem em `mem://` (sistema de memória externo ao Git), não versionadas. 3 ciclos de import reais em `src/lib/tributario/` (`shared-logic.ts` ↔ `apuracao.ts`/`encargos-folha.ts`/`parametros.ts` — o módulo "shared" não isolou a dependência). **Gaps**: corrigir doc de `src/services`; ADRs retroativos para as ~10 decisões centrais hoje só em memória externa; resolver os 3 ciclos.

### 2. Autenticação — 6/10
Supabase Auth + PKCE, SSO OIDC/SAML real (state+PKCE com expiração), SCIM 2.0 com tokens hasheados, MFA TOTP nativo, logout multi-camada (BroadcastChannel entre abas). **Gap crítico**: lockout de força bruta é **100% client-side** (`src/pages/Auth.hooks.ts`) — quem chama `/auth/v1/token` direto nunca passa pelo lockout. Nenhuma das 6 Edge Functions de auth usa `checkRateLimit` (existe em `_shared/rate-limit.ts`, usado em 10 outras functions). MFA nunca é **exigida** (sem checagem de AAL2 em nenhuma rota). **Ações**: mover lockout para Auth Hook ou proxy server-side; `checkRateLimit` nas 6 functions de auth; exigir `aal2` em `ProtectedRoute` para roles admin/financeiro.

### 3. Autorização — 8/10 (era 3/10 antes desta sessão)
RLS habilitada em 100% das tabelas com dado sensível; o vazamento cross-tenant sistêmico (ver seção acima) — o achado mais grave de toda a auditoria — foi corrigido e validado via CI nesta sessão. **Gaps remanescentes**: `user_roles` global por design (não por empresa) — decisão de produto pendente; blind spot no gate de teste de RLS que deixou o bug passar despercebido por meses ainda não fechado; 16 Edge Functions não auditadas individualmente; nenhuma confirmação ao vivo contra o banco real (MCP indisponível). Nota não é 10 porque a correção nunca foi validada contra o Postgres de produção — é estaticamente correta, mas "estaticamente correta" não é o mesmo que "confirmada".

### 4. Banco de Dados — 7.5/10
Migrations estritamente crescentes sem colisão, zero uso de `CREATE INDEX CONCURRENTLY` (regra do CLAUDE.md respeitada), dinheiro sempre em `NUMERIC` com `CHECK`, partitioning correto em `audit_logs`/`frontend_error_logs`. **Gaps**: ~285 de 607 FKs sem `ON DELETE` explícito; `db:seed` no `package.json` sem `supabase/seed.sql` correspondente; backup/PITR não documentado formalmente no `RUNBOOK.md`.

### 5. CI/CD — 6/10
Pipeline real e sofisticado: gate de isolamento de secret externo, cobertura Zod, matriz de privilégio RPC anon/authenticated contra banco real, linter oficial do Supabase como gate de RLS/GRANT. **Confirmado nesta sessão**: `Quality Gate & Tests` e `Supabase DB Linter` verdes em todos os 16 commits publicados; `E2E Tests (chromium)` vermelho — mas **confirmado idêntico no `main` antes de qualquer mudança desta sessão** (mesmo "21 skipped, 62 passed" em `cd5444c` e `5093a72`), não é regressão, é ambiente de teste sem backend canônico acessível. **Gap crítico**: branch protection **inexistente** em `main` (confirmado via API — `protected: false`) — nada impede merge de PR com CI vermelho. `docs/DEPLOYMENT.md` descreve infraestrutura errada (Cloudflare Pages em vez de Lovable Cloud).

### 6. Data Integrity — 7.5/10
Idempotência de webhooks sólida (RPCs atômicas `webhook_claim`/`webhook_mark_success`, DLQ). Trigger de deduplicação de pagamentos por hash. Zod em quase todas as Edge Functions. Os fixes de IDOR desta sessão fecham caminhos de escrita cross-tenant que antes corrompiam dados de outras empresas. **Gaps**: sem optimistic locking (nenhuma coluna `version`); escritas multi-tabela fora de webhooks não são atômicas (ex. `aceitar-convite` faz 2 updates sequenciais sem transação real).

### 7. Documentação — 7/10
README/RUNBOOK/HEALTHCHECK reais e úteis, não boilerplate. **Gaps concretos e verificáveis**: `CLAUDE.md` do projeto diz "51 funcoes Deno" (real: 105) e cita `calcular-iva` (nome real: `calculo-iva`); `docs/EDGE_FUNCTIONS_CATALOG.md` afirma "87 funções" datado de 17/07; `CHANGELOG.md` tem 1 único commit em toda a história, congelado em "50 tabelas, 14 Edge Functions" (dados de jan/2025).

### 8. Infraestrutura/DevOps — 6.5/10
Secrets bem geridos (`.env.example` exemplar, nunca vazou `.env` real, secret scanning + push protection ativos no GitHub). Health check real (`supabase/functions/health`) testando DB/Asaas/Bling. **Gap**: `_shared/resilience.ts` (retry+circuit breaker) usado em só 2 de ~50 integrações externas (`bling-proxy`, `asaas-proxy`) — Bitrix24/WhatsApp/Open Finance sem proteção contra flapping.

### 9. Logging/Monitoring — 5/10
Logger estruturado (`_shared/logger.ts`) bem desenhado mas usado em só 19/105 Edge Functions — resto usa `console.log` de string solta. Zero monitoramento de uptime externo. `health/index.ts` tem check de "realtime" que é um placeholder (copia status do DB).

### 10. Observabilidade — 4/10
Achado notável: Web Vitals **real e funcional** (`src/lib/telemetry.ts`, captura CLS/FID/LCP via `web-vitals`, persiste em `frontend_performance_logs`) — contradiz a expectativa de "provavelmente não existe". Mas Sentry é um **stub morto**: `error-tracking.ts` está pronto mas `initSentry()` nunca é chamado em lugar nenhum, `@sentry/*` nem está no `package.json`. Sem SLO documentado (dados existem em `slo_metrics_diarias`, mas sem alvo formal).

### 11. Lógica de Negócio — 6/10
Motor tributário isolado em `src/lib/tributario/` com testes reais (fuzz test, 400 grupos pseudoaleatórios). **Achado crítico**: `src/lib/tributario/shared-logic.ts` (535 linhas) e `supabase/functions/_shared/tributario-logic.ts` (789 linhas) implementam **as mesmas funções tributárias de forma independente** — sem fonte única de verdade, a simulação que o usuário vê no frontend pode divergir do cálculo oficial persistido no backend.

### 12. Manutenibilidade — 6/10
`@supabase/supabase-js` **25 versões minor atrás** (2.87.1 vs 2.112.4) — SDK crítico do banco. Vários pacotes `MISSING` no lockfile vs `package.json` (`@dnd-kit/sortable`, `framer-motion`, `i18next`) — risco real de build não-reprodutível. 46 `TODO/FIXME/HACK`.

### 13. Operacionalidade — 6/10
`RUNBOOK.md` é genuinamente utilizável (cenários reais com SQL de diagnóstico). **Gap**: `CONTRIBUTING.md` descreve um fluxo (fork + npm) que ninguém no repo segue de fato (todo dev usa `bun` + branch direta, confirmado nos workflows); migrations não têm mecanismo de rollback documentado.

### 14. Performance — 5/10
Cache TanStack Query maduro (`staleTime`/`gcTime` por categoria de dado). Lazy loading extenso (126 usos de `React.lazy`, concentrados em nível de rota). **Gap**: paginação server-side (`.range()`) usada em só 4 lugares em todo `src/`, para um sistema com 130+ tabelas — risco real de carregar dataset completo em telas de listagem.

### 15. Qualidade de Código — 6/10
`console.log` sob controle real (silenciado em produção via `console-guard.ts`). **Confirmado nesta sessão**: `lint:strict` **falha** com 18 warnings reais (6× `@ts-nocheck`, 6× arquivos >400 linhas). `eslint.config.js` ignora `supabase/functions/**` inteiramente — 105 Edge Functions nunca passam por lint de projeto.

### 16. Segurança — 7/10 (era 5/10 antes desta sessão)
O achado mais grave (vazamento cross-tenant + IDOR ativo) foi corrigido nesta sessão — ver seção dedicada acima. `npm audit`: 0 vulnerabilidades. Nenhum secret hardcoded encontrado em `src/`/`supabase/functions/`. **Gaps que permanecem abertos** (não tocados nesta sessão, fora do escopo do vazamento de dados): CSP em `Report-Only` (não bloqueia XSS de verdade, e a sessão fica em `localStorage`); CORS `Access-Control-Allow-Origin: '*'` em 32 Edge Functions; `bun audit` no CI é não-bloqueante; sem `dependabot.yml`.

### 17. Testes — 7/10
**Confirmado nesta sessão, execução real**: 2689/2689 testes passando (204 arquivos, ~120s), `type-check` 0 erros. Cobertura de linhas real é **~7%** (admitido no próprio `vitest.config.ts` como "piso de não-regressão", não meta). CLAUDE.md do projeto cita meta "1012/1012" — desatualizado por quase 3x.

### 18. Tipagem — 6/10
`: any` praticamente zero em `src/` (disciplina real via zonas ESLint strict progressivas). **Gap concreto**: `tsconfig.json` tem `strict: false`, `strictNullChecks: false`. `src/integrations/supabase/types.ts` está comprovadamente desatualizado — 7 hooks financeiros/tributários rodam inteiros com `@ts-nocheck` por causa disso. Nenhum script `supabase gen types` no `package.json` nem no CI.

### 19. Validação — 7.5/10
Camada Zod centralizada e consistente (`_shared/validation.ts`, 20+ schemas). Validadores brasileiros dedicados (CPF/CNPJ/CEP/PIX). Defesa em profundidade real (Zod na aplicação + `CHECK` no banco). **Gaps**: nenhuma máquina de estados explícita para transição de status (fila de cobrança, pedidos); upload de certificado `.pfx` sem limite de tamanho no schema Zod.

### 20. Operações (processos) — 5.5/10
Conventional commits seguidos na prática. Cadência real de hardening de segurança visível no histórico de PRs. **Gap estrutural**: todos os PRs recentes são autorados E mesclados pela mesma conta, sem revisão por terceiros — o CI é o único revisor real, o que torna a ausência de branch protection (dimensão 5) ainda mais crítica.

---

## Scorecard Consolidado

```
╔══════════════════════════════════╦═══════╦═══════════════════════════════════════════╗
║ DIMENSÃO                         ║ NOTA  ║ GAP PRINCIPAL PARA 10/10                  ║
╠══════════════════════════════════╬═══════╬═══════════════════════════════════════════╣
║ 1.  Arquitetura                  ║ 6/10  ║ 3 ADRs para 566 migrations; ciclos em lib/tributario ║
║ 2.  Autenticação                 ║ 6/10  ║ Lockout/rate-limit só client-side; MFA não exigida  ║
║ 3.  Autorização              ×3  ║ 8/10  ║ user_roles global; gate de teste RLS com blind spot ║
║ 4.  Banco de Dados            ×2 ║ 7.5/10║ 285 FKs sem ON DELETE; sem seed.sql       ║
║ 5.  CI/CD                        ║ 6/10  ║ Branch protection inexistente em main    ║
║ 6.  Data Integrity            ×3 ║ 7.5/10║ Sem optimistic locking                   ║
║ 7.  Documentação                 ║ 7/10  ║ CLAUDE.md/catálogo de functions desatualizados ║
║ 8.  Infraestrutura / DevOps      ║ 6.5/10║ Retry/circuit-breaker só 2/50 integrações ║
║ 9.  Logging / Monitoring         ║ 5/10  ║ Logger estruturado em só 19/105 functions ║
║ 10. Observabilidade              ║ 4/10  ║ Sentry é stub morto, nunca inicializado  ║
║ 11. Lógica de Negócio            ║ 6/10  ║ Motor tributário duplicado front/backend ║
║ 12. Manutenibilidade             ║ 6/10  ║ supabase-js 25 versões atrás              ║
║ 13. Operacionalidade             ║ 6/10  ║ CONTRIBUTING.md descreve fluxo que ninguém segue ║
║ 14. Performance                  ║ 5/10  ║ Paginação server-side em só 4 lugares    ║
║ 15. Qualidade de Código          ║ 6/10  ║ lint:strict falha com 18 warnings reais  ║
║ 16. Segurança                 ×3 ║ 7/10  ║ CSP report-only; CORS wildcard em 32 functions ║
║ 17. Testes                    ×2 ║ 7/10  ║ Cobertura de linhas real ~7%              ║
║ 18. Tipagem                   ×2 ║ 6/10  ║ tsconfig strict:false; types.ts desatualizado ║
║ 19. Validação                 ×2 ║ 7.5/10║ Sem máquina de estados de transição       ║
║ 20. Operações (Processos)        ║ 5.5/10║ Nenhum revisor além do próprio CI         ║
╠══════════════════════════════════╬═══════╬═══════════════════════════════════════════╣
║ NOTA GERAL PONDERADA             ║ 6.6/10║ (era ~5.9/10 antes desta sessão)          ║
╚══════════════════════════════════╩═══════╩═══════════════════════════════════════════╝
```
Pesos: ×3 Segurança/Autenticação/Autorização/Data Integrity · ×2 Banco/Tipagem/Validação/Testes/Arquitetura · ×1 demais.

---

## Top 10 Ações de Maior Impacto (ROI)

| # | Ação | Impacto | Esforço | Dimensão |
|---|---|---|---|---|
| 1 | Ativar branch protection em `main` exigindo `Quality Gate & Tests` + `Supabase DB Linter` | Alto | Baixo | CI/CD, Operações |
| 2 | Reforçar `supabase/tests/sql/rls_multi_empresa.sql` para pegar `has_role(...)` sem `empresa_id` (não só `qual='true'`) | Alto | Baixo | Autorização |
| 3 | Deploy das 16 migrations desta sessão em produção + revalidar com MCP quando token voltar | Alto | Baixo (bloqueado por infra) | Autorização, Segurança |
| 4 | Auditar as 16 Edge Functions restantes pelo mesmo padrão (role global vs. vínculo por empresa) | Alto | Médio | Segurança |
| 5 | Trocar CSP `Report-Only` por enforced + remover `unsafe-eval` | Alto | Médio | Segurança |
| 6 | Corrigir `CLAUDE.md` (51→105 functions, `calcular-iva`→`calculo-iva`) e regenerar `EDGE_FUNCTIONS_CATALOG.md` | Médio | Baixo | Documentação |
| 7 | Restringir CORS wildcard nas 32 Edge Functions para origens conhecidas | Médio | Médio | Segurança |
| 8 | Regenerar `types.ts` + remover os 7 `@ts-nocheck` + adicionar `gen:types` ao CI | Alto | Médio | Tipagem |
| 9 | Atualizar `@supabase/supabase-js` (25 versões atrás) | Médio | Baixo | Manutenibilidade |
| 10 | Unificar motor tributário (frontend deixa de reimplementar, chama a Edge Function) | Alto | Alto | Lógica de Negócio |

## Roadmap em 3 Ondas

**🔴 Quick Wins (1-3 dias)**: #1, #2, #6, #9, mover lockout/rate-limit de auth para server-side (dimensão 2).

**🟠 Sprint 1 (1-2 semanas)**: #4, #5, #7, #8, revisar as 22 tabelas com `deleted_at` inconsistente, adicionar `dependabot.yml`.

**🟡 Sprint 2 (2-4 semanas)**: #10, `tsconfig strict: true` incremental (começar por `strictNullChecks`), subir cobertura de testes além do piso de 6%, instalar Sentry de verdade, estender `_shared/resilience.ts` às integrações sem proteção.

---

## Nota Final

O sistema saiu de uma maturidade de **~5.9/10** para **~6.6/10** nesta sessão, mas o número mascara o que importa: a auditoria encontrou e corrigiu um vazamento de dados financeiros **real, sistêmico e ativamente explorável** entre empresas clientes do SaaS — não uma falha teórica, mas 213+14 policies e 4 RPCs onde qualquer usuário autenticado de uma empresa conseguia ler e escrever dados financeiros de outra. Isso foi fechado com rigor (cada uma das ~290 correções verificada individualmente contra a definição original antes de publicar, validado ao vivo via CI), não com um `DROP` em massa sem checagem. O que resta não corrigido — CSP fraca, CORS aberto, cobertura de teste baixa, motor tributário duplicado, dependências atrasadas — é dívida técnica real, mas de categoria bem menos grave que o que foi fechado hoje. Prioridade #1 e #2 do roadmap (branch protection + fechar o blind spot do teste de RLS) são as duas ações que impedem esse mesmo padrão de bug renascer sem ninguém perceber.
