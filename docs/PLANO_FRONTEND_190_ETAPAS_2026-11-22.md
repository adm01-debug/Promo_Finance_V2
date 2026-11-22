# Plano Front-End — 190 etapas de correção e melhoria (2026-11-22)

> Auditoria exaustiva do front-end do Promo_Finance_V2 e dos contratos que ele consome (Edge Functions e
> webhooks). Base: `main` @ `8254da0` (2026-11-22). Documento de **plano** — nada aqui foi aplicado.
> Em conflito com este arquivo, vale `AGENTS.md`.

## 0. Como este plano foi produzido

| Item | Detalhe |
|---|---|
| Método | 5 auditorias paralelas (camada de dados/hooks · a11y/UX/responsivo/design system · performance/bundle · contratos Edge/webhooks · segurança/auth/CI/testes), depois **verificação adversarial** de 67 afirmações críticas/altas contra o código real (lente "tente refutar"). Resultado: **43 confirmadas, 24 parciais (linha/contagem corrigidas abaixo), 0 refutadas**. |
| Evidência | Toda etapa cita `arquivo:linha` lido nesta sessão. Contagens vêm de `rg`/`grep` sobre `src/` sem testes, salvo indicação. |
| Limitações | `node_modules` ausente no ambiente de auditoria: **não** rodaram `bun run build`, `lint:strict`, `type-check` nem Lighthouse. Tamanhos de bundle são estimativas por biblioteca (marcados "est."). Nada que exija build é afirmado como medido. |
| Stack real | `package.json`: **React 19.3, Vite 8 (rolldown), react-router-dom 7.18, TanStack Query 5.14, zod 4.6, ESLint 9, Vitest 4, TypeScript 5.3, Tailwind 3**. `AGENTS.md §1` diz "Vite 6, React 18" — está defasado (ver E-190). |
| Dimensão | `src/`: 1.118 `.tsx` + 966 `.ts`; 124 páginas em `src/pages`; 241 hooks; 89 primitivos em `src/components/ui`; 288 arquivos de teste; 106 Edge Functions (`supabase/functions/*/index.ts`); 28 specs E2E. |

### Legenda das etapas

`E-NNN · Prioridade · Camada · Título` seguido de **Problema** (com evidência), **Ação**, **Verificação** (como provar que ficou pronto), **Esforço** (P ≤ 1h · M ≤ 1 dia · G > 1 dia) e **Depende** (etapas pré-requisito).

- **P0** — risco de segurança, perda financeira ou dado errado em produção. Fazer agora.
- **P1** — bug funcional ou de dados que afeta usuários hoje.
- **P2** — qualidade, performance e acessibilidade com impacto perceptível.
- **P3** — higiene, consistência e manutenibilidade.

Camadas: `segurança` · `dados` · `auth` · `query` · `perf` · `a11y` · `ux` · `resp` · `ds` (design system) · `edge` · `testes` · `ci` · `docs`.

## 1. Problemas críticos (priorizados por impacto)

| # | Problema | Evidência | Etapa |
|---|---|---|---|
| 1 | **XSS armazenado na exportação PDF/impressão**: valores de fornecedor/cliente/auditoria/IdP interpolados sem escape em HTML gravado via `document.write` numa janela da mesma origem (alcança `localStorage` com o token). | `src/lib/export-utils.ts:100,122,132,140,154,161-162,202`; chamado por `ui/export-menu.tsx:60`, `pages/AuditLogs.tsx:245`, `pages/admin/SSOJitEvents.tsx:168` | E-001 |
| 2 | **Parcelas de acordo gravadas 1 dia antes** (fuso): `new Date('yyyy-MM-dd')` é UTC, `format` local devolve o dia anterior em BRT, propagado por `addMonths` a todas as parcelas. | `src/hooks/useAcordosParcelamento.ts:86,99`; origem `AcordoParcelamentoDialog.tsx:117` | E-017 |
| 3 | **Aprovação de pagamento por prefixo de id vindo da IA**, sem escopo de empresa e sem validar UUID (`action.id || ''`). | `src/hooks/expert-actions/financial-actions.ts:67`; `useExpertActions.ts:43` | E-002 |
| 4 | **Dinheiro em float no acordo**: desconto/juros sem arredondar, `Math.ceil(x*100)/100` por parcela, última parcela = resto em float; soma de recebidos em float. | `useAcordosParcelamento.ts:47-51,90-93,325` | E-018 |
| 5 | **Alertas sem isolamento por empresa**: lista `select('*')` sem `empresa_id` nem `limit`, "marcar todos como lidos" afeta todas as empresas, insert não grava `empresa_id`. Consumido no Header de toda página. | `src/hooks/useAlertas.ts:23-27,90,123-134`; `layout/Header.tsx:67` | E-003, E-045 |
| 6 | **CSP não mitiga XSS**: `script-src` com `'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net *.lovable.*` (jsdelivr sem uso em `src/`). | `vercel.json:40` | E-005 |
| 7 | **MFA decorativo**: nenhuma chamada a `getAuthenticatorAssuranceLevel`; login navega sem checar `aal`; back-end exige `aal2` em admin só com env ligada → ou não protege, ou bloqueia admins sem tela de desafio. | `src/pages/Auth.hooks.ts:110-113`; `useMFA.ts:143`; `supabase/functions/_shared/auth-guard.ts:159-164` | E-029 |
| 8 | **Páginas administrativas sem papel exigido**: `/usuarios`, `/audit-logs`, `/seguranca`, `/integracoes`, `/configuracoes` e 19 rotas financeiras só com `<ProtectedRoute>`; RLS segura a escrita, mas a UI expõe gestão de usuários/auditoria a "visualizador". | `src/routes/adminRoutes.tsx:38-81`; `financeiroRoutes.tsx` | E-030 |
| 9 | **Shell remonta a cada navegação**: 89 páginas renderizam `<MainLayout>`; nenhuma layout route/`<Outlet>`; canais realtime, tour e sidebar recriados por clique; único `<Suspense>` acima do layout (tela inteira vira loading). | `rg -l '<MainLayout' src/pages` = 89; `App.tsx:59`; `MainLayout.tsx:39`; `sidebar/SidebarNavGroups.tsx:199-200` | E-066 |
| 10 | **Até 20.000 linhas `select('*')` baixadas em série para calcular KPI no cliente**, por 12 chamadores sem empresa. | `src/hooks/financial/useContasPagar.ts:15-50`; `useContasReceber.ts:34` | E-067 |
| 11 | **`refetchOnMount:false` + `refetchOnWindowFocus:false` globais**: invalidar em outra tela não refaz a query inativa → lista velha até 10 min. | `src/lib/queryClient.ts:19,23` | E-042 |
| 12 | **Retry repete 4xx/RLS 3×**: predicado lê `error.status`, mas `PostgrestError` expõe `code` e `FunctionsHttpError` expõe `context.status`. | `queryClient.ts:12-13` | E-043 |
| 13 | **422 de validação sem CORS** em 24 Edge Functions que usam `validateContract` (browser vê erro de rede, não o 422); 8 formatos de erro distintos; 17 funções respondem 400 em falha de schema. | `_shared/contract-validator.ts:56`; `versioned-contract.ts:58`; `_shared/contract-coverage_test.ts:58-76` | E-153..E-158 |
| 14 | **Webhooks sem proteção temporal contra replay** e com `.strict()` na raiz de payloads de terceiros (chaves extras legítimas podem dar 422). | `_shared/webhook-auth.ts:57-58`; `validation.ts:152,190,224`; `bitrix24-webhook/index.ts:70` | E-168..E-171 |
| 15 | **Fundo transparente em alto contraste**: `high-contrast.css` usa `prefers-contrast: high` (valor inexistente) e hex em token consumido por `hsl()`. | `src/styles/high-contrast.css:1-6`; `tailwind.config.ts:30` | E-100 |

## 2. Riscos identificados

1. **Regressão silenciosa ao corrigir fuso/dinheiro** (F2): dados históricos gravados com o deslocamento continuam no banco; corrigir o código sem auditar o passado gera parcelas com datas inconsistentes no mesmo acordo. Mitigação em E-021.
2. **Endurecer CSP sem inventário de inline** (E-005): o popup de impressão injeta `<script>` (`export-utils.ts:197`); remover `unsafe-inline` antes de E-001 quebra a impressão. Ordem obrigatória: E-001 → E-005.
3. **Layout route** (E-066) toca 89 páginas: fazer por domínio de rota (um PR por `*Routes.tsx`) com E2E crítico verde entre cada um.
4. **Envelope 422 único** (E-153..E-158) muda respostas de ~60 funções: o front precisa ler `fields[]` antes (E-159) e os clientes externos (n8n, Bitrix) precisam de janela de compatibilidade (E-174..E-178).
5. **`@hookform/resolvers` 3.x com zod 4** (E-013): incompatibilidade é conhecimento externo não verificável sem `node_modules`; testar um formulário inválido antes de concluir.
6. **Dependências sem uso** (E-148): remover `mapbox-gl`/`ogl` etc. exige confirmar que não são carregados por `public/` ou por plugin; rodar build.
7. **Gates de banco "inconclusivos"** sem `PROD_DB_URL` (E-186) hoje passam em verde; endurecer pode travar PRs de fork.

---

## 3. As 190 etapas

### Fase 1 · Segurança do front (E-001 → E-016)

### E-001 · P0 · segurança · Escapar HTML em `exportToPDF` e sanitizar o popup de impressão
**Problema:** `src/lib/export-utils.ts` interpola `${value}` (l.122), `${col.header}` (l.132), `${title}` (l.140,154) e `${options.empresa.nome_fantasia}` (l.161-162) sem escape, abre `window.open('', '_blank')` (l.100, mesma origem) e grava com `printWindow.document.write(html)` (l.202) incluindo um `<script>` inline (l.197). Qualquer descrição/fornecedor/claim SSO com `<img onerror>` executa com acesso a `window.opener.localStorage` (token Supabase). `src/lib/pdf-generator/utils.ts:19` já usa `DOMPurify.sanitize` e não foi reaproveitado.
**Ação:** criar `src/lib/html-escape.ts` (`escapeHtml`), aplicar em todas as interpolações, trocar `document.write` por `DOMPurify.sanitize` + `printWindow.document.body.innerHTML`, substituir o `<script>` inline por `printWindow.addEventListener('load', () => printWindow.print())`, abrir com `window.open('', '_blank', 'noopener')` quando não precisar de referência.
**Verificação:** teste unitário com `value = '<img src=x onerror=alert(1)>'` afirmando saída escapada; smoke manual de exportação em `AuditLogs` e `SSOJitEvents`.
**Esforço:** M · **Depende:** —

### E-002 · P0 · segurança · Aprovação de pagamento pela IA exige UUID completo e escopo de empresa
**Problema:** `src/hooks/expert-actions/financial-actions.ts:67` usa `.or(\`id.ilike.${id}%,id.eq.${id}\`)` seguido só de `.eq('status','pendente').maybeSingle()`; `useExpertActions.ts:43` passa `action.id || ''`. Id vazio ou parcial casa com qualquer solicitação pendente; não há filtro de `empresa_id`.
**Ação:** validar `z.string().uuid()` antes da query; usar `.eq('id', id).in('empresa_id', ids)` com `ids` de `useEmpresaScope()`; remover `ilike`.
**Verificação:** teste unitário: id vazio → erro sem query; id de outra empresa → `null`.
**Esforço:** P · **Depende:** —

### E-003 · P0 · dados · Isolar `alertas` por empresa (lista, leitura e escrita)
**Problema:** `src/hooks/useAlertas.ts:23-27` `select('*')` sem `empresa_id` e sem `limit`; `:90` `markAllAsRead` faz `.update({lido:true}).eq('lido',false)` em todas as empresas; `:123-134` insert sem `empresa_id`.
**Ação:** `.in('empresa_id', ids)` nas três operações, chave `['alertas', ids]`, `limit(50)` na lista + contador separado (E-045).
**Verificação:** teste com dois tenants mockados: "marcar todos" só altera o tenant ativo.
**Esforço:** P · **Depende:** E-050 (escopo único)

### E-004 · P0 · segurança · Neutralizar injeção de fórmula no CSV
**Problema:** `src/lib/export-utils.ts:43` só escapa aspas (`replace(/"/g,'""')`); cabeçalho (l.22) sem escape. Células iniciadas por `= + - @ \t \r` executam no Excel.
**Ação:** prefixar `'` quando `/^[=+\-@\t\r]/.test(value)`; escapar cabeçalho com a mesma função.
**Verificação:** teste unitário com `=HYPERLINK(...)` → `'=HYPERLINK(...)`.
**Esforço:** P · **Depende:** —

### E-005 · P0 · segurança · Endurecer a CSP (sem `unsafe-eval`, sem jsdelivr/lovable, hash do script de tema)
**Problema:** `vercel.json:40` `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.lovable.app https://*.lovable.dev https://cdn.jsdelivr.net`. `rg jsdelivr src index.html` = 0. Inline legítimos: script de tema em `index.html` e o `<script>` do popup de impressão (removido em E-001).
**Ação:** `script-src 'self' 'sha256-<hash do script de tema>'`; remover `unsafe-eval`, jsdelivr e lovable (após E-033); adicionar `report-to` para um endpoint de telemetria; `X-XSS-Protection: 0`; `Cross-Origin-Opener-Policy: same-origin`.
**Verificação:** console sem violação de CSP nas 5 rotas críticas (E2E `critical`); header lido com `curl -I`.
**Esforço:** M · **Depende:** E-001, E-033 · **Regra 6.6 (CI/config de produção): PR fica aberta para o dono.**

### E-006 · P1 · segurança · Helper `openExternal(url)` com validação de esquema e `noopener`
**Problema:** 28 `window.open` em `src/`, 1 com `noopener`; URLs vindas do banco em `href`/`window.open` sem validar esquema (`AlertasTributarios.tsx:321`, `ConciliacaoAuditPanelConteudo.tsx:104`, `LinksListPanel.tsx:164`, `AuditoriaTab.tsx:203`, `WhatsAppProativoPanel.tsx:100`, `useOpenFinance.ts:110`). React 19 bloqueia `javascript:` só em `href`.
**Ação:** `src/lib/open-external.ts` aceitando apenas `https:`/`blob:`/`mailto:`; codemod dos 28 usos; regra ESLint `no-restricted-globals` para `window.open` cru.
**Verificação:** teste unitário rejeitando `javascript:`; lint sem ocorrências.
**Esforço:** M · **Depende:** —

### E-007 · P1 · segurança · Unificar `escapeHtml`/`renderMarkdown` e remover o editor morto
**Problema:** escape/markdown triplicados em `ui/rich-text-editor.tsx:397`, `copilot/CopilotGlobalFloat.tsx:245`, `tributario/dashboard/CopilotTributarioFloat.tsx:244`; `rich-text-editor.tsx:111` faz `innerHTML = value` sem sanitização e o arquivo tem 0 importadores.
**Ação:** extrair `src/lib/safe-markdown.ts` (ou usar `react-markdown`, já dependência); apagar `rich-text-editor.tsx`.
**Verificação:** 2 consumidores restantes usam o helper; teste com payload XSS.
**Esforço:** P · **Depende:** —

### E-008 · P1 · segurança · Desligar source maps publicados sem Sentry e o tagger em produção
**Problema:** `vite.config.ts:128` `sourcemap:'hidden'` incondicional; `.map` só são apagados pelo plugin Sentry (l.64-72) que exige 3 variáveis → sem elas `dist/assets/*.map` fica público. `dyadComponentTagger()` (l.~47) roda em todos os modos (o `componentTagger` da linha seguinte é só dev), injetando caminhos de arquivo no DOM de produção.
**Ação:** `sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false`; `mode === 'development' && dyadComponentTagger()`.
**Verificação:** build local sem variáveis → `ls dist/assets/*.map` vazio; HTML de produção sem `data-dyad-*`.
**Esforço:** P · **Depende:** —

### E-009 · P1 · segurança · Fechar rotas de debug em produção
**Problema:** `src/App.tsx:69,71` `/design-system-debug` e `/theme-diagnostics` sem `ProtectedRoute` e sem gate `import.meta.env.DEV` (só `/__especimes`, l.70, tem).
**Ação:** envolver ambas em `{import.meta.env.DEV && ...}` ou em `<ProtectedRoute requiredRoles={['admin']}>`.
**Verificação:** em build de produção, as rotas caem no `NotFound`.
**Esforço:** P · **Depende:** —

### E-010 · P1 · segurança · Validar a URL de logout SSO contra allowlist
**Problema:** `src/hooks/AuthProvider.tsx:253,341` faz `window.location.replace(ssoLogoutUrl)` com a URL devolvida por `sso-logout` sem checar origem.
**Ação:** aceitar só `https:` e host igual ao do IdP cadastrado para o domínio (retornado pela própria função); caso contrário, redirecionar para `/auth`.
**Verificação:** teste unitário com URL `javascript:`/host estranho → fallback.
**Esforço:** P · **Depende:** —

### E-011 · P1 · segurança · Corrigir o seletor ESLint que proíbe `import.meta.env.VITE_*` fora de `env.ts`
**Problema:** `eslint.config.js:61` usa `MemberExpression[object.object.name='meta']`, mas `import.meta` é `MetaProperty` (sem `.name`) → regra inerte. Evidência: `src/config/reforma-tributaria.ts:27,30` e `src/hooks/useWebPushSubscription.ts:10` leem `VITE_*` sem disable e o lint passa.
**Ação:** seletor `MemberExpression[object.object.type='MetaProperty'][object.property.name='env'][property.name=/^VITE_/]`; mover as 3 leituras para o schema Zod de `src/config/env.ts`.
**Verificação:** `bun run lint` falha num arquivo de teste com `import.meta.env.VITE_X` e passa após a correção.
**Esforço:** P · **Depende:** —

### E-012 · P1 · segurança · Capturar IP/geo da sessão no servidor, não no cliente
**Problema:** `src/hooks/useSessions.ts:105` busca o IP em `api.ipify.org` e grava em `user_sessions` (forjável); `useAuthValidation.ts:30-61` chama `ipapi.co` no mount embora o comentário (l.64) diga que a validação é server-side; terceiros sem base LGPD documentada.
**Ação:** remover as chamadas do cliente; Edge Function `validate-ip-geo` (já existe) passa a ler `x-forwarded-for` e gravar; retirar `ipapi.co`/`api.ipify.org` do `connect-src` (E-005).
**Verificação:** nenhuma requisição para esses hosts no Network durante login.
**Esforço:** M · **Depende:** —

### E-013 · P1 · segurança · Atualizar `@hookform/resolvers` para a linha compatível com zod 4
**Problema:** `package.json:63` `"@hookform/resolvers": "3.10.0"` com `"zod": "^4.6.7"` (l.138); 13 arquivos usam `zodResolver`; `bun.lock` resolve só zod 4 (sem zod 3 aninhado). A incompatibilidade 3.x/zod 4 é conhecimento externo (NÃO VERIFICADO sem build) e nenhum teste cobre `zodResolver`.
**Ação:** bump para `^5` (major — avisar na PR); rodar os 13 formulários com payload inválido.
**Verificação:** teste RTL de um formulário com campo inválido mostra `FormMessage` em vez de lançar.
**Esforço:** M · **Depende:** —

### E-014 · P2 · segurança · Audit log do cliente deixa de ser "best effort em `catch {}`"
**Problema:** `src/pages/AuditLogs.tsx:218` insere em `audit_logs` dentro de `catch {}`; `pages/tributario/CalculadoraTributaria.tsx:134` insert inline. Para CFC/LGPD, trilha de auditoria não pode depender do cliente.
**Ação:** mover para trigger no banco ou para a Edge Function do domínio; remover os inserts do front.
**Verificação:** ação auditada aparece em `audit_logs` com o insert do front removido.
**Esforço:** M · **Depende:** — · **Se exigir DDL: regra 6.6.**

### E-015 · P2 · segurança · Redação da telemetria igual à do Sentry
**Problema:** `src/lib/telemetry.ts:123-129` aplica só `redactPath` à mensagem; `error_stack` sai cru; `:271` `url: event.filename` não passa por `urlSanitizada`; `error-tracking.ts:59` envia `email` no `setUser`.
**Ação:** reutilizar `redactText` do Sentry nas três saídas; `setUser({ id })` sem e-mail.
**Verificação:** teste unitário com stack contendo e-mail → redigido.
**Esforço:** P · **Depende:** —

### E-016 · P3 · segurança · Documentar e checar a versão do `xlsx` vendorizado
**Problema:** `xlsx` vem de `file:vendor/xlsx-0.20.3.tgz`, fora do Dependabot e do `bun audit`.
**Ação:** registrar o SHA-256 do tarball em `vendor/README.md`; job semanal que compara com a versão atual do CDN da SheetJS e abre issue.
**Verificação:** job roda e passa.
**Esforço:** P · **Depende:** — · **Regra 6.6 (workflow): PR aberta para o dono.**

### Fase 2 · Dinheiro e datas (E-017 → E-028)

### E-017 · P0 · dados · Parcelas do acordo: parse local de data-only
**Problema:** `src/hooks/useAcordosParcelamento.ts:86` `new Date(data.data_primeiro_vencimento)` com string `yyyy-MM-dd` (origem `AcordoParcelamentoDialog.tsx:117`) → UTC 00:00 = 21h do dia anterior em BRT; `:99` `format(dataVencimento,'yyyy-MM-dd')` grava o dia anterior em todas as parcelas (propagado por `addMonths`).
**Ação:** `parseISO`/`toLocalDate` (já em `src/lib/formatters.ts`) + `addMonths`; ou manipular a string com `date-fns` em modo local.
**Verificação:** teste com `TZ=America/Sao_Paulo` e `'2026-12-10'` → 1ª parcela `2026-12-10`.
**Esforço:** P · **Depende:** —

### E-018 · P0 · dados · Acordo em centavos inteiros com distribuição do resto
**Problema:** `useAcordosParcelamento.ts:47-51` desconto/juros em float sem arredondar, `Math.ceil((total/n)*100)/100` por parcela; `:90-93` última = `total - parcela*(n-1)` (float); `:325` `(c.valor_recebido||0)+quota`. Ex.: 100/3 → 33,34+33,34+33,3199…
**Ação:** usar `valueToCents` (`src/lib/currency.ts:215`), dividir inteiros, distribuir o resto nas primeiras parcelas, converter de volta ao gravar.
**Verificação:** teste: 100,00 em 3 → 33,34/33,33/33,33 e soma exata.
**Esforço:** M · **Depende:** —

### E-019 · P1 · dados · Score de crédito não trata "vence hoje" como atrasado
**Problema:** `src/hooks/useScoringClientes.ts:206-224` `hoje = new Date()` vs `new Date(c.data_vencimento)` (date-only) → UTC; conta que vence hoje aparece atrasada e rebaixa o score.
**Ação:** comparar strings `yyyy-MM-dd` com `todayISOLocal()` (`formatters.ts:283`) ou `toLocalDate` + `startOfDay`.
**Verificação:** teste com vencimento = hoje → não atrasado.
**Esforço:** P · **Depende:** —

### E-020 · P1 · dados · Filtros e KPIs de contas a pagar com parse local
**Problema:** `src/hooks/useContasPagarLogic.calculos.ts:87` (`setHours(0)` na l.90 não corrige dia já deslocado), `:138,142` filtro avançado exclui o dia inicial (Calendar devolve meia-noite local, `advanced-filters.tsx:190-191`). (As l.195-208 são só ordenação — sem bug.) Mesmo padrão em `useContasReceberLogic.ts:232,235`, `useInadimplenciaSegmentada.ts:106,206`, `expert-actions/query-actions.ts:149,157`, `useExpertContext.ts:192,209`.
**Ação:** função única `parseDateOnly()` em `formatters.ts` e codemod nos pontos citados.
**Verificação:** teste do filtro "de 01/12 a 31/12" inclui conta de 01/12.
**Esforço:** M · **Depende:** —

### E-021 · P1 · dados · Auditoria retroativa das datas gravadas com deslocamento
**Problema:** parcelas e quitações gravadas antes de E-017/E-023 podem estar 1 dia atrás no banco; corrigir só o código deixa acordos mistos.
**Ação:** query de diagnóstico (parcelas cuja `data_vencimento` ≠ `data_primeiro_vencimento + n meses`); relatório ao dono antes de qualquer UPDATE.
**Verificação:** relatório com contagem e amostra.
**Esforço:** M · **Depende:** E-017 · **Correção de dados é regra 6.6.**

### E-022 · P1 · dados · Regra ESLint `local/no-date-only-constructor`
**Problema:** 39 `new Date('YYYY-MM-DD')`-like em hooks (ver E-020); sem lint o padrão volta.
**Ação:** regra em `eslint-rules/` que proíbe `new Date(<expr terminando em _vencimento|_emissao|data_>)` e sugere `parseDateOnly`; allowlist vazia.
**Verificação:** lint falha em caso novo.
**Esforço:** P · **Depende:** E-020

### E-023 · P1 · dados · "Hoje" sempre em fuso local
**Problema:** 21 `new Date().toISOString().slice(0,10)` em `src/` (38 contando `toISOString().slice(0,10)` sobre datas calculadas): `useAcordosParcelamento.ts:192` (data de quitação), `useOportunidadesElisao.ts:154`, `useIndicesContabeis.ts:79-80,151-152`, `useCalculadoraDadosReais.ts:29`, `lib/tributario/catalogos/repositorio.ts:12,25`. Após 21h em BRT já é "amanhã".
**Ação:** substituir por `todayISOLocal()`/`toISOLocal(date)` (`formatters.ts:283`).
**Verificação:** `rg 'toISOString\(\)\.slice\(0, ?10\)' src` = 0 fora de testes.
**Esforço:** P · **Depende:** —

### E-024 · P1 · dados · Parse de valor BR nos filtros
**Problema:** `src/pages/bloqueios-duplicidade/useBloqueiosData.ts:32` `parseFloat(filters.valor.replace(',','.'))` transforma "1.234,56" em 1.234 e compara igualdade exata em float; `useDebounce.ts:254` mesmo padrão.
**Ação:** `parseCurrency` (`lib/currency.ts:152`) e filtro por faixa (`gte/lte` ± 0,005).
**Verificação:** teste com "1.234,56" → 1234.56.
**Esforço:** P · **Depende:** —

### E-025 · P2 · dados · Um só `formatCurrency` e um só parser BR
**Problema:** `formatCurrency` em `lib/currency.ts:84` e `lib/formatters.ts:22`; 7 helpers locais (`brl` em `DarfConsolidado.helpers.ts:3`, `IcmsStDifal.helpers.ts:12`, `IpiIss.helpers.ts:1`; `currency` em `NfeRecebidas.helpers.ts:14`; `num` em `DarfConsolidado:10`, `IrpjCsllLucroReal:6`, `PisCofinsCreditos:11`).
**Ação:** `formatters.ts` reexporta de `currency.ts`; apagar helpers locais.
**Verificação:** testes existentes de `lib/currency` passam; `rg 'const brl ='` = 0.
**Esforço:** P · **Depende:** —

### E-026 · P2 · dados · Arredondamento monetário por `roundCurrency` no digest tributário
**Problema:** `src/lib/tributario/obrigacoes/observabilidade-digest.ts:132` `Number(multaTotal.toFixed(2))`.
**Ação:** `roundCurrency` de `lib/currency.ts`.
**Verificação:** teste com 0,005 → arredondamento bancário consistente.
**Esforço:** P · **Depende:** —

### E-027 · P2 · dados · Formatação de datas via `formatDate` (ptBR) em vez de `toLocaleDateString`
**Problema:** `toLocaleDateString` 13× vs `format(..., {locale: ptBR})` 5×; `formatDate` de `formatters.ts` usado em 10 lugares. Resultado depende do locale do navegador.
**Ação:** codemod para `formatDate`; regra ESLint `no-restricted-syntax` para `toLocaleDateString`.
**Verificação:** `rg toLocaleDateString src` = 0.
**Esforço:** P · **Depende:** —

### E-028 · P2 · dados · Casos de teste de fuso para o módulo financeiro
**Problema:** nenhum teste roda com `TZ` fixo; os bugs de F2 passaram pela suíte.
**Ação:** `vitest.config.ts` com `env.TZ='America/Sao_Paulo'` em um projeto dedicado + testes de borda (23h59, 1º do mês, virada de ano) para acordos, scoring e filtros.
**Verificação:** suíte falha com o código antigo e passa com E-017..E-023.
**Esforço:** M · **Depende:** E-017, E-019, E-020

### Fase 3 · Autenticação, papéis e sessão (E-029 → E-041)

### E-029 · P0 · auth · Desafio MFA (`aal2`) no login e no `ProtectedRoute`
**Problema:** `rg getAuthenticatorAssuranceLevel src` = 0; `mfa.challenge` só em `useMFA.ts:143` e `TwoFactorSetup.tsx:56` (árvore de `MFASettings`); `Auth.hooks.ts:110-113` navega em `onAuthStateChange` sem checar `aal`; `supabase/functions/_shared/auth-guard.ts:159-164` rejeita `aal1` em rotas admin só quando a env está ligada. Com a flag desligada, MFA não protege; com ela ligada, admins ficam sem tela de desafio.
**Ação:** após login, `getAuthenticatorAssuranceLevel()`; se `nextLevel==='aal2' && currentLevel==='aal1'` renderizar `MfaChallenge` (challenge + verify) antes de navegar; `ProtectedRoute` lê `aal` do contexto e bloqueia até `aal2` quando o usuário tem fator.
**Verificação:** E2E `critical`: usuário com TOTP não entra sem código; sem TOTP entra normal.
**Esforço:** G · **Depende:** —

### E-030 · P0 · auth · `requiredRoles` nas rotas administrativas e de tesouraria
**Problema:** `src/routes/adminRoutes.tsx:38-81` (`/configuracoes`, `/usuarios`, `/audit-logs`, `/seguranca`, `/integracoes`) sem `requiredRoles` (primeiro uso só em `:85`); `financeiroRoutes.tsx` 0 em 19 rotas (`/tesouraria`, `/asaas`, `/aprovacoes`, `/bling`); `pages/Usuarios.tsx:113-127` escreve em `user_roles` só com `user` (RLS `has_role(...,'admin')` segura a escrita, mas a tela inteira aparece a "visualizador").
**Ação:** `['admin']` em `/usuarios`, `/audit-logs`, `/integracoes`, `/seguranca`; `['admin','financeiro']` em tesouraria/asaas/aprovacoes/bling/pagamentos-recorrentes; tabela de rotas × papéis em `docs/MATRIZ_PAPEIS.md`.
**Verificação:** E2E `admin-rbac` com usuário `visualizador` recebe "Acesso restrito" nas 9 rotas.
**Esforço:** M · **Depende:** E-031 (senão o flash vira negação real)

### E-031 · P1 · auth · Eliminar a corrida "isLoading false antes do papel"
**Problema:** `src/hooks/AuthProvider.tsx:151-154` `safeTimeout(() => { fetchProfile(...); fetchRoleForEmpresa(...) })` e `:186-191` chamadas sem `await` seguidas de `setIsLoading(false)`; `ProtectedRoute.tsx:48` `hasRole()` dá `false` enquanto `role===null` → cartão "Acesso restrito" pisca em todo deep-link admin.
**Ação:** estado `isRoleLoading` até os dois fetches resolverem; `ProtectedRoute`/`PermissionGate` tratam como carregando; `fetchRoleForEmpresa` descarta resposta obsoleta (token de requisição).
**Verificação:** teste RTL do `ProtectedRoute` com role resolvendo depois do user → sem render de "Acesso restrito".
**Esforço:** M · **Depende:** —

### E-032 · P1 · auth · Papel efetivo sem herança de outra empresa
**Problema:** `AuthProvider.tsx:344` `effectiveRole = roleAtual ?? role`, onde `role` = `pickHighestRole` global (`:88-94`, `user_roles` sem empresa). Sem vínculo na empresa corrente, a UI herda "admin" de outra empresa (RLS protege o dado, não os botões).
**Ação:** em contexto de empresa, `roleAtual ?? null`; `role` global só para telas sem empresa (`/usuarios`, `/admin/*`).
**Verificação:** teste: admin na empresa A, sem vínculo em B → em B `hasRole(['admin'])` = false.
**Esforço:** P · **Depende:** E-031

### E-033 · P1 · auth · Substituir o Lovable Cloud Auth pelo OAuth nativo do Supabase
**Problema:** `src/integrations/lovable/index.ts:3-31` (auto-gerado) usado em `LoginForm.tsx:61` para Google; tokens vêm de broker de terceiro e entram via `supabase.auth.setSession(result.tokens)`; CSP libera `*.lovable.*`; `@lovable.dev/cloud-auth-js` e `lovable-tagger` em `dependencies`.
**Ação:** `supabase.auth.signInWithOAuth({ provider: 'google' })`; remover o pacote, a pasta e os domínios da CSP (E-005).
**Verificação:** login Google funciona em staging; `rg lovable src` = 0.
**Esforço:** M · **Depende:** — · **Toca provedor OAuth no Supabase: avisar o dono.**

### E-034 · P1 · auth · Fluxo de redefinição de senha correto
**Problema:** `src/pages/ResetPassword.tsx:37-41` aceita qualquer sessão como sessão de recuperação (usuário logado troca senha sem a atual); `:82` `error.message.includes('same_password')` nunca casa (vem em `error.code`); `:41` com PKCE `getSession` pode resolver antes da troca do code (pisca "Link inválido"); `:94` `setTimeout` não limpo; `:58` regex rejeita `_ - +` e diverge do `PasswordStrengthIndicator`.
**Ação:** aceitar só evento `PASSWORD_RECOVERY` (ou `reauthenticate()` para logados); `error.code === 'same_password'`; ler `error_description` da URL; limpar timer; reutilizar a validação do indicador.
**Verificação:** testes RTL dos 4 cenários; E2E de reset em quarentena promovido a crítico.
**Esforço:** M · **Depende:** —

### E-035 · P1 · auth · `EmpresaGuard` distingue erro de "sem empresa"
**Problema:** `src/components/auth/EmpresaGuard.tsx:24,38` `const { data: vinculos = [] }`; falha de `useUserEmpresas` cai em `EmpresaSelectionGate` como se o usuário não tivesse empresa.
**Ação:** tratar `isError` com `ErrorState` + "tentar de novo".
**Verificação:** teste com `useUserEmpresas` rejeitando → tela de erro.
**Esforço:** P · **Depende:** —

### E-036 · P2 · auth · Um único fetch de perfil/papel no boot
**Problema:** `AuthProvider.tsx:181` (`getSession().then`) e `:145` (`onAuthStateChange`, que também emite `INITIAL_SESSION`/`TOKEN_REFRESHED`) chamam `fetchProfile`/`fetchRoleForEmpresa` → 2× no boot e a cada refresh.
**Ação:** reagir só a `SIGNED_IN`/`USER_UPDATED`/`SIGNED_OUT`; perfil e papel via `useQuery(['role', userId, empresaId])`.
**Verificação:** Network no boot mostra 1 request de `profiles` e 1 de `user_empresas`.
**Esforço:** M · **Depende:** E-031

### E-037 · P2 · auth · Memoizar o valor do `AuthContext`
**Problema:** `AuthProvider.tsx:234` `signOut`, `:346` `hasRole`, `:351-370` `value` recriados a cada render; 107-125 consumidores de `useAuth()`.
**Ação:** `useCallback` nas funções, `useMemo` no objeto.
**Verificação:** React Profiler: troca de rota não re-renderiza consumidores de `useAuth` sem mudança de sessão.
**Esforço:** P · **Depende:** —

### E-038 · P2 · auth · `useIsGlobalAdmin()` único em vez de 7 `has_role` em `useEffect`
**Problema:** `AdminEdgeHealth.tsx:46`, `AdminSystemHealth.tsx:35`, `admin/SRECommandCenter.tsx:63`, `admin/ScimAudit.tsx:49` (+3) chamam `has_role` com `useEffect`+`.then`, divergindo do `isAdmin` por empresa do `AuthProvider`.
**Ação:** hook `useIsGlobalAdmin` com `useQuery(['is-global-admin', userId])`; substituir os 7.
**Verificação:** `rg "rpc\('has_role'" src/pages` = 0.
**Esforço:** P · **Depende:** —

### E-039 · P2 · auth · `localStorage` sempre em `try/catch`
**Problema:** 13 de 30 `localStorage.setItem` sem `try` (`pages/Demonstrativos.tsx:59-84` 6×, `useDashboardConfig.ts:170`, `useUserEmpresas.ts:123`, `useConciliacaoPageState.ts:38`, `useRecentItems.ts:63,80`, `lib/sound-feedback.ts:45`); `getCurrentEmpresaId()` (`useUserEmpresas.ts:117`) lê sem `try` no initializer do `AuthProvider` (l.60) — Safari privado quebra o boot.
**Ação:** wrapper `safeStorage` em `lib/persisted-ui-state.ts` (já existe) e codemod.
**Verificação:** teste com `localStorage` lançando → app monta.
**Esforço:** P · **Depende:** —

### E-040 · P2 · auth · Confirmar o alias `contador → financeiro`
**Problema:** `AuthProvider.tsx:30` dá ao contador o mesmo acesso de UI do financeiro; não há correspondência explícita com `has_role` no banco.
**Ação:** decisão do dono registrada em `docs/MATRIZ_PAPEIS.md`; se mantido, teste que fixa o comportamento.
**Verificação:** doc + teste.
**Esforço:** P · **Depende:** — · **Decisão de negócio.**

### E-041 · P3 · auth · Cookies HttpOnly para o refresh token (avaliação)
**Problema:** `src/integrations/supabase/client.ts:11` `storage: localStorage` (padrão supabase-js); combinado a E-001/E-005, um XSS exfiltra o refresh token.
**Ação:** ADR comparando `@supabase/ssr` (cookies) vs manter localStorage + CSP forte; decidir após E-005.
**Verificação:** ADR em `docs/adr/`.
**Esforço:** M · **Depende:** E-005 · **Arquitetura: decisão do dono.**

### Fase 4 · Camada de dados e escopo de empresa (E-042 → E-065)

### E-042 · P0 · query · Remover `refetchOnMount:false` global (ou torná-lo por query)
**Problema:** `src/lib/queryClient.ts:23` `refetchOnMount:false` + `:19` `refetchOnWindowFocus:false`; nenhum `invalidateQueries` usa `refetchType:'all'` → query inativa remonta sem refetch após invalidação em outra tela (ex.: `expert-actions/financial-actions.ts:147` invalida `['contas-pagar']`). Nenhum hook sobrescreve (o comentário em `usePreferenciasSistema.ts:168` não é opção; contorna com `setQueryData` l.171).
**Ação:** default `refetchOnMount: true` (respeita `staleTime`); manter `false` só em `useQuery` específicos de dados estáticos.
**Verificação:** teste: invalidar com observer inativo → ao remontar, `fetchStatus==='fetching'`.
**Esforço:** P · **Depende:** —

### E-043 · P0 · query · Predicado de retry que entende `PostgrestError` e `FunctionsHttpError`
**Problema:** `queryClient.ts:12-13` lê `error.status`; `PostgrestError` expõe `code` (`supabase-write.ts:292` lê `?.code`), `FunctionsHttpError` expõe `context.status` (`edge-function-error.ts:111-112`); hooks lançam o erro cru (`if (error) throw error` 449× em `src/hooks`). RLS (42501), `PGRST116` e 4xx de função são repetidos 3× com backoff.
**Ação:** `shouldRetry(error)` que lê `status`, `context?.status` e `code` (`/^PGRST|^42501|^22|^23/` → não repetir); testar com objetos reais.
**Verificação:** `queryClient.retry.test.ts` com `PostgrestError` e `FunctionsHttpError` fabricados.
**Esforço:** P · **Depende:** —

### E-044 · P1 · query · `placeholderData` só onde há paginação
**Problema:** `queryClient.ts:27` `placeholderData:(prev)=>prev` global; `isPlaceholderData` 0 usos; só `useConciliacaoPageState.ts:96` e `useAprovacoes.ts:98,135` fazem opt-out. Troca de filtro mostra dados do filtro anterior sem loading (troca de empresa é coberta por `resetQueries` em `useSelectiveEmpresaInvalidation.ts:91`).
**Ação:** remover do default; `placeholderData: keepPreviousData` nas listas paginadas, exibindo `isPlaceholderData` como estado "atualizando".
**Verificação:** troca de filtro mostra skeleton ou indicador.
**Esforço:** M · **Depende:** —

### E-045 · P1 · query · Alertas do Header: `limit` + contador leve
**Problema:** `useAlertas.ts:23-27` sem `.limit` (`rg limit` = 0 no arquivo) e consumido em `Header.tsx:67` em toda página; cresce sem teto.
**Ação:** lista `limit(20)`; contador via `count:'planned'`/view materializada; realtime filtrado por empresa.
**Verificação:** payload da requisição ≤ 20 linhas.
**Esforço:** P · **Depende:** E-003

### E-046 · P1 · query · Chaves de `empresas` por projeção
**Problema:** `['empresas']` em `useOptimizedQueries.ts:27,82` (select parcial, populado pelo `DataPrefetcher` no boot) e em `financial/useEmpresasConfig.ts:16` (`select('*')` tipado `Empresa[]`, reexportado por `useFinancialData` → ContasBancarias, BI, Relatorios, Demonstrativos, PixHub, ContaPagarForm). Telas recebem objetos sem campos por até 10 min.
**Ação:** `['empresas','min']` vs `['empresas','full']` via factory `queryKeys` (`useOptimizedQueries.ts:248`); ou uma única projeção.
**Verificação:** teste de cache: prefetch não contamina `useEmpresas()`.
**Esforço:** P · **Depende:** E-049

### E-047 · P1 · query · Centros de custo: invalidação alcança todos os consumidores
**Problema:** `useCentrosCusto.ts:58,88,115,141` invalida `['centros_custo']`; consumidores com hífen não são alcançados: `useEmpresasConfig.ts:32` `['centros-custo', empresaId||'all']` (54 importadores), `useOptimizedQueries.ts:55,116,265-266`, `AnomaliaPreferencesDialog.tsx:63` `['centros-custo-min']` (as próprias queries do hook, l.14/31, e `PedidoCompraForm.tsx:76` usam underscore e são alcançadas). CC criado não aparece nos selects.
**Ação:** raiz única `queryKeys.centrosCusto.*`; invalidar pela raiz.
**Verificação:** criar CC → select do `ContaPagarForm` atualiza sem reload.
**Esforço:** P · **Depende:** E-049

### E-048 · P1 · query · Remover o `useVendedores` duplicado
**Problema:** `useVendedores.ts:7` (todos) e `useInadimplenciaSegmentada.ts:320` (`.eq('ativo',true)`) compartilham `['vendedores']`; quem popular primeiro define o resultado do outro (`VendedorDashboard` vs `DashboardReceber.tsx:9`).
**Ação:** apagar a cópia; `useVendedoresAtivos` com key `['vendedores','ativos']`.
**Verificação:** `rg "queryKey: \['vendedores'\]" src` = 1.
**Esforço:** P · **Depende:** —

### E-049 · P1 · query · Adotar a factory `queryKeys` em todos os hooks
**Problema:** `queryKeys` existe em `useOptimizedQueries.ts:248` e é usada em 2 arquivos; prefetches sem efeito (`:41` `['contas-bancarias']`, `:55` `['centros-custo']`) porque os consumidores usam key com `empresaId`.
**Ação:** mover para `src/lib/query-keys.ts` com `(empresaIds) =>` em toda raiz multi-tenant; regra ESLint que proíbe `queryKey: [` literal fora do arquivo; corrigir os prefetches.
**Verificação:** lint sem literais; prefetch do boot acerta cache (DevTools TanStack).
**Esforço:** G · **Depende:** —

### E-050 · P0 · dados · Fonte única da empresa ativa: `useEmpresaScope().ids`
**Problema:** 38 arquivos usam `useAuth().currentEmpresaId` (legado via CustomEvent + localStorage) e 11 `useEmpresaScope()`; em modo consolidado `currentEmpresaId = ids[0]` (`EmpresaScopeContext.tsx:135`) → hooks legados mostram só a 1ª empresa enquanto a UI diz "consolidado".
**Ação:** migrar os 38 para `ids`; `currentEmpresaId` vira `@deprecated` com lint.
**Verificação:** modo consolidado com 2 empresas: KPIs somam ambas.
**Esforço:** G · **Depende:** —

### E-051 · P0 · dados · Escopo de empresa "fail-closed"
**Problema:** 24 arquivos com `if (empresaId) query = query.eq('empresa_id', …)` literal (39 com variantes), ex. `useNegativacoes.ts:12`, `useIncentivosFiscais.ts:53-55`; 60 de 126 `useQuery` com `empresaId` na key sem `enabled` (`useCobrancas.ts:53-54`, `useFluxoCaixa.ts:27-28`, `useRelatoriosData.ts:38-366`, `useAlertasTributarios.ts:80`). Durante o load do escopo a query traz tudo que a RLS permitir.
**Ação:** `enabled: ids.length > 0` e `.in('empresa_id', ids)` obrigatório; helper `scoped(query, ids)`.
**Verificação:** teste: `ids=[]` → nenhuma requisição.
**Esforço:** G · **Depende:** E-050

### E-052 · P1 · dados · Tabelas multi-tenant consultadas sem empresa
**Problema:** sem referência a empresa: `financial/useClientesFornecedores.ts:16,27`, `useScoringClientes.ts:71,80`, `useInadimplenciaSegmentada.ts:73` (keys estáticas), `useExpertContext.ts:20-92` (contexto da IA mistura empresas), `pages/OrcamentoEvento.tsx:38-46` (contas inteiras, ignora `error`), `pages/Clientes.tsx`, `pages/Fornecedores.tsx`, `useConciliacao.ts`, `lib/conciliacao-page-helpers.ts`.
**Ação:** aplicar `scoped()` de E-051 em cada um; keys com `ids`.
**Verificação:** modo "focused" em B não mostra clientes de A.
**Esforço:** M · **Depende:** E-051

### E-053 · P1 · dados · Escapar input em `.or()` do PostgREST
**Problema:** `useBloqueiosData.ts:25-27` `` .or(`dados_tentativa->>fornecedor_nome.ilike.%${filters.fornecedor}%,…`) ``; `useTrilhaAuditoria.ts:68,70,72-73`; `useNfeRecebidas.ts:63`; `useOverlayRejeicoesAuditoria.ts:62`. Vírgula/parêntese do usuário quebra ou altera o filtro.
**Ação:** `escapePostgrestOr()` (aspas duplas + escape) ou `.ilike()` encadeado; regra ESLint para template string dentro de `.or(`.
**Verificação:** teste com `a,b)` → filtro literal.
**Esforço:** P · **Depende:** —

### E-054 · P1 · query · `MutationCache.onError` global + `onError` nas mutações críticas
**Problema:** 341 `useMutation` em `src` (295 em `src/hooks`), 0 `onMutate` em uso (`createOptimisticUpdate` em `queryClient.ts:153` sem consumidor); sem `MutationCache`; `useOrganizacoes.ts` 5 mutações/0 `onError`, `useAlertasTributarios.ts` 3/0, `useSSO.ts` 7/3, `useAsaas.ts` 21/16, `useOpenFinance.ts` 6/3; 6 arquivos com mutação sem invalidar (`useConciliacaoAudit`, `useExportarSped`, `useAuditLog`, `useConciliacaoTributaria`, `useProcessarNFOCR`, `BenchmarkingSetorial.tsx`).
**Ação:** `new QueryClient({ mutationCache: new MutationCache({ onError: toastErroPadrao }) })`; adicionar `onSuccess → invalidate` nos 6.
**Verificação:** mutação rejeitada sem `onError` local exibe toast.
**Esforço:** M · **Depende:** —

### E-055 · P1 · dados · Nunca ignorar `error` do Supabase
**Problema:** 61 `const { data } = await supabase…` sem `error` (`useAlertas.ts:158`, `useAlertasTributarios.ts:216,243,261`, `useConciliacaoAudit.ts:14,43`, `useApuracoesTributarias.ts:241`, `useConformidadeFiscal.ts:48`, `pages/Usuarios.tsx:112`); `useScoringClientes.ts:143` grava sem checar e mostra `toast.success`; undo silencioso em `Fornecedores.tsx:169`.
**Ação:** estender `local/no-floating-supabase-write` para leituras (`no-unchecked-supabase-result`); corrigir os 61.
**Verificação:** lint = 0 ocorrências.
**Esforço:** M · **Depende:** —

### E-056 · P2 · dados · Catches silenciosos com impacto de UI
**Problema:** 184 `catch` só com comentário; relevantes: `useMFA.ts:44` ("Silently fail" → MFA aparece desativado para quem tem), `useSessions.ts:87,128,183`, `pages/Expert.tsx:232` (chunk SSE descartado), `Expert.tsx:176` (`response.json()` em erro não-JSON) e stream sem `AbortController`.
**Ação:** estado de erro explícito nos 4; `AbortController` no stream.
**Verificação:** testes unitários dos 4 caminhos de erro.
**Esforço:** M · **Depende:** —

### E-057 · P2 · dados · CRUD das páginas vai para hooks
**Problema:** Supabase chamado direto em 19 páginas (24 chamadas): `MeuPerfil.tsx:28` (useEffect, ignora error), `AdminTelemetria.tsx:114` delete inline, `AuditLogs.tsx:218`/`CalculadoraTributaria.tsx:134` insert inline, `ContadorReadonly.tsx:33`/`StatusPage.tsx:25`/`BenchmarkingSetorial.tsx:101` `functions.invoke`.
**Ação:** hooks `useMeuPerfil`, `useTelemetriaAdmin`, etc.; regra ESLint `no-restricted-imports` de `@/integrations/supabase/client` em `src/pages/**`.
**Verificação:** lint = 0 imports do client em páginas.
**Esforço:** G · **Depende:** —

### E-058 · P2 · query · Fetch manual com `useState/useEffect` → `useQuery`
**Problema:** sem cache/dedupe/retry: `useSecurityAlerts.ts:66-97`, `useRateLimitLogs.ts:39-129`, `useScimChecklist.ts:13-35`, `useSessions.ts`, `useMFA.ts`, `useSsoDomainResolver.ts`, `pages/MeuPerfil.tsx`.
**Ação:** converter os 7.
**Verificação:** `rg 'useEffect\(.*supabase' src/hooks` = 0.
**Esforço:** M · **Depende:** —

### E-059 · P2 · dados · Nenhuma URL do Supabase montada à mão
**Problema:** `financial/useEmpresasConfig.ts:68-69` `` `https://${projectId}.supabase.co/rest/v1/contas_bancarias?...` `` (e `:76` ignora erro de `regras_roteamento_financeiro`), `financial/externalData.ts:41-42`, `useExpertContext.ts:71`, `useGerarEvidenciasStream.ts:35`; `config/env.ts:33` `refine(v.includes('supabase.co'))` rejeita custom domain/local.
**Ação:** `supabase.from`/`functions.invoke` ou `edgeFunctionUrl()`; `env.ts` aceita qualquer URL http(s).
**Verificação:** `rg '\.supabase\.co/' src` = 0 fora de `env.ts`/testes.
**Esforço:** P · **Depende:** —

### E-060 · P2 · dados · Regenerar `types.ts` e eliminar `as never`/`supabaseDyn`
**Problema:** 53 `as never`, 108 `as unknown as` (prod), `'user_preferences' as any` em `usePreferenciasSistema.ts:56,57,156`, `supabaseDyn` em 18 arquivos — todos contornando `types.ts` defasado (PR #523 aberta corrige drift).
**Ação:** após #523, codemod removendo casts cuja tabela/coluna agora existe; CI com `supabase gen types --check` (E-187).
**Verificação:** `rg 'as never' src` cai para ≤ 10 com justificativa.
**Esforço:** G · **Depende:** PR #523 mergeada

### E-061 · P2 · dados · Casts de props escondendo modelos divergentes
**Problema:** `pages/ContasPagar.tsx:231,248`, `Clientes.tsx:376`, `Fornecedores.tsx:303,332`, `ContasReceberConteudo.tsx:174`, `ContasReceberConteudoConteudo.tsx:116,214` fazem `as unknown as` para encaixar componentes.
**Ação:** tipo de domínio único (`ContaReceberWithRelations`, `ClienteRow`) em `src/types/`.
**Verificação:** zero casts nesses arquivos; `type-check` verde.
**Esforço:** M · **Depende:** E-060

### E-062 · P2 · dados · Non-null assertions em mutações
**Problema:** `usePixTemplates.ts:62` `created_by: user!.id` (mutation pode rodar após logout); `useStartupDiagnostic.ts:135-136` `session!`; `SinoNotificacoesFiltros.parts.tsx:66-122` 6× `subscription!`.
**Ação:** guard explícito com erro amigável.
**Verificação:** teste com `user=null` → erro tratado.
**Esforço:** P · **Depende:** —

### E-063 · P2 · query · Contadores do shell sem polling redundante
**Problema:** `useAprovacoesPendentesCount.ts:58-70` polling 30 s com realtime ativo; evento realtime faz count manual + `invalidateQueries` (l.24-39) = 2 counts; canal escuta `event:'*'` sem filtro de empresa (l.17-23); `useWhatsAppUnreadCount.ts:19` 30 s; `useAlertasTributariosCount.ts:27-28` `refetchOnWindowFocus:true`; `useAlertasNaoLidos` (`useAlertas.ts:50-62`) sem empresa na key; 19 `count:'exact', head:true`.
**Ação:** polling só como fallback (`refetchInterval` quando canal não está `SUBSCRIBED`); `filter: empresa_id=in.(...)`; `count:'planned'` ou contador materializado.
**Verificação:** Network ocioso por 2 min sem requests de contagem.
**Esforço:** M · **Depende:** E-066

### E-064 · P2 · query · Diagnóstico de boot só sob demanda
**Problema:** `useStartupDiagnostic.ts:38-135` roda `getSession → profiles → 5 tabelas em série (l.83-95) → 3 RPCs (l.129-135)` a cada carga, competindo com o primeiro paint.
**Ação:** executar só em DEV ou quando `?diag=1`; em produção, só a checagem de sessão.
**Verificação:** Network do boot sem as 8 requisições.
**Esforço:** P · **Depende:** —

### E-065 · P3 · dados · Código morto da camada de dados
**Problema:** `hooks/useLocalStorage.ts` (133 linhas, 0 importadores), `usePrefetchRoutes.tsx` (`PrefetchOnVisible` 0 usos), `useAuthValidation.ts:30-61` (ver E-012), `lib/sefaz-simulator` com `Math.random()<0.05` (`handlers.ts:28`) importado só como tipo.
**Ação:** apagar; mover `SefazResponse` para `lib/nfe/types`.
**Verificação:** `type-check` verde; `knip`/`ts-prune` sem exports órfãos novos.
**Esforço:** P · **Depende:** —

### Fase 5 · Performance e bundle (E-066 → E-090)

### E-066 · P0 · perf · Layout route com `<Outlet>`: o shell deixa de remontar
**Problema:** 89 páginas renderizam `<MainLayout>` na raiz (`Index.tsx:6`, `ContasPagar.tsx:124`, `Movimentacoes.tsx:197`); 10 rotas envolvem por rota (`adminRoutes.tsx:42,68,102,112`, `analiseRoutes.tsx:46,64`, `contabilRoutes.tsx:52`, `financeiroRoutes.tsx:122`, `geralRoutes.tsx:42,52`); 0 `<Outlet>`. A cada navegação saem e voltam Sidebar, Header, `GuidedTour`, `OnboardingTour` (react-joyride), `CopilotGlobalFloat`, `PWAInstallBanner` e os canais realtime (`MainLayout.tsx:39` `useFinancialAlerts()`, `sidebar/SidebarNavGroups.tsx:199-200`, singleton de `useAprovacoesPendentesCount.ts:81-83` cai a 0 e é recriado). Único `<Suspense>` em `App.tsx:59`, acima do layout: rota fria mostra `PageLoading` em tela cheia.
**Ação:** `<Route element={<ProtectedRoute><MainLayout><Suspense fallback={<PageSkeleton/>}><Outlet/></Suspense></MainLayout></ProtectedRoute>}>` por domínio; remover `<MainLayout>` das 89 páginas (um PR por `*Routes.tsx`).
**Verificação:** React Profiler: Sidebar não remonta ao navegar; Network: nenhum `phoenix`/realtime join por clique; E2E crítico verde.
**Esforço:** G · **Depende:** —

### E-067 · P0 · perf · KPIs de contas a pagar/receber agregados no banco
**Problema:** `src/hooks/financial/useContasPagar.ts:15-17,21,32-50` pagina `vw_contas_pagar_painel` em lotes de 1.000 até 20.000 linhas `select('*')`; `useContasReceber.ts:34` idem; 12 chamadores sem argumento (`BI.tsx:38`, `Financeiro.tsx:69`, `useDashboardMetrics.ts:47`, `TesourariaCentralizada.tsx:30`, `DashboardEmpresa.tsx:57`, `useConciliacaoPage.ts:56`, `ConsolidacaoMultiCNPJ.tsx:45`…) com chave `['contas-pagar', undefined]`; `useContasPagarLogic.ts:87` usa `['contas-pagar', currentEmpresaId||'all']` → sem empresa selecionada, download duplo do conjunto completo.
**Ação:** RPC/view `vw_contas_pagar_totais(empresa_ids)` para KPIs; lista paginada no servidor; chave normalizada `['contas-pagar', ids]`.
**Verificação:** dashboard carrega com ≤ 3 requisições e payload < 50 kB.
**Esforço:** G · **Depende:** E-050 · **Se exigir DDL: regra 6.6.**

### E-068 · P1 · perf · Ferramentas visuais de debug fora do bundle de entrada
**Problema:** `App.tsx:17-18` importa estaticamente `VisualValidator` (`ui/ux-validator.tsx` → `html2canvas`, est. 45 kB gz) e `VisualCorrectionOverlay` (`:54`, renderizado sempre; gate `?visualDebug` dentro dele, `VisualCorrectionOverlay.tsx:5-9`).
**Ação:** `lazy()` em ambos e render condicional ao parâmetro.
**Verificação:** `ANALYZE=1 bun run build`: `html2canvas` fora do chunk de entrada.
**Esforço:** P · **Depende:** —

### E-069 · P1 · perf · `Row` do react-window definido fora do render em Contas a Pagar
**Problema:** `src/pages/ContasPagar/components/List.tsx:105-138` `const Row = ({index, style}) => …` dentro do componente → tipo novo a cada render, react-window (l.177-184) remonta linhas visíveis; `components/contas-pagar/ContasPagarTableRow.tsx:47` `memo` anulado por 5 arrows inline e `|| []` (l.108); cada `Row` cria `<Table>` próprio (l.112); `<motion.tr>` reanima no scroll.
**Ação:** `Row` em módulo, dados via `rowProps`, callbacks estáveis por id, uma `<table>` com `<tbody>` virtualizado, sem `motion` por linha.
**Verificação:** Profiler: scroll de 50 linhas sem commits de montagem.
**Esforço:** M · **Depende:** —

### E-070 · P1 · perf · Virtualizar Conciliação pendentes e Diário
**Problema:** `pages/ConciliacaoPendentesConteudo.tsx:58-70` até 500 `motion.div layout` em `AnimatePresence popLayout` (limite em `lib/conciliacao-page-helpers.ts:118`); `contabilidade/razao-diario/DiarioTable.tsx:58-63` até 1.000 `<motion.tr>`. `useVirtualRows` já existe e é usado em `AuditLogTable`/`TelemetriaTable`.
**Ação:** `useVirtualRows` em ambos; remover `layout` e `delay` escalonado.
**Verificação:** INP < 200 ms ao selecionar linhas com 500 itens (DevTools Performance).
**Esforço:** M · **Depende:** —

### E-071 · P1 · perf · Render imediato; health-check em paralelo
**Problema:** `src/main.tsx:55-57` aguarda `verifySupabaseHealth()` (timeout 3 s, `client.ts:79-98`) antes de `createRoot().render`; `:63` bloqueia em qualquer `status >= 400` (comentário l.60-62 diz 401/403/404 → inclui 5xx/429 transitórios); `telemetry.ts:10` já importa supabase estaticamente (o `import()` não economiza nada).
**Ação:** renderizar primeiro; health-check em efeito com overlay de erro só para 401/403/404.
**Verificação:** FCP não aguarda request de rede (Performance panel); 503 simulado não impede o app.
**Esforço:** P · **Depende:** —

### E-072 · P1 · perf · Bibliotecas de exportação carregadas sob demanda
**Problema:** `jspdf`/`jspdf-autotable` estáticos em ~23 arquivos (`shared/ViewExportButton.tsx:13-14`, `conciliacao/ConciliacaoExport.tsx`, `demonstrativos/ExportDemonstrativoPDF.tsx`, `lib/export-contabil/*`; 2 dinâmicos) — est. 130 kB gz; `xlsx` estático em `lib/ofx-parser/xlsx.ts` (est. 140 kB gz); `jszip` em `lib/sped-zip.ts` e `bloqueiosExport.ts`; `canvas-confetti` em `lib/toast-confetti.tsx:2` (usado em Registrar Pagamento/Recebimento, aprovações, conciliação).
**Ação:** `await import()` dentro dos handlers; `pdf-vendor`/`xlsx` deixam de entrar no grafo inicial.
**Verificação:** `ANALYZE=1 bun run build`: jspdf/xlsx/jszip/confetti ausentes do chunk de qualquer página sem exportação.
**Esforço:** M · **Depende:** —

### E-073 · P1 · perf · Ícones por mapa explícito (fim do `import * as Icons`)
**Problema:** `categorias/CategoriaForm.tsx:38,185` e `CategoriaTable.tsx:19,66` `import * as Icons from 'lucide-react'` + `Icons[pascalName]` → ~1.600 ícones no chunk de `/categorias` (est. 80-120 kB gz).
**Ação:** `ICONES_CATEGORIA` com os ~40 permitidos ou `DynamicIcon` de `lucide-react/dynamic`.
**Verificação:** chunk de categorias cai > 60 kB gz (build com analyze).
**Esforço:** P · **Depende:** —

### E-074 · P2 · perf · Sentry e tour carregados sob demanda
**Problema:** `lib/error-tracking.ts:5` `import * as Sentry` + `browserTracingIntegration` (l.214) chamado em `main.tsx:10` mesmo sem DSN (est. 30-40 kB gz); `react-joyride` (`onboarding/OnboardingTour.tsx`) montado no `MainLayout` de toda página.
**Ação:** `if (dsn) { const Sentry = await import('@sentry/react') … }`; `lazy(() => import('./OnboardingTour'))` só quando o tour estiver pendente.
**Verificação:** chunk de entrada sem `@sentry` nem `react-joyride`.
**Esforço:** P · **Depende:** —

### E-075 · P2 · perf · Dashboard com widgets lazy
**Problema:** `dashboard/DashboardExecutivo.tsx:9-27` importa ~20 widgets eager (inclui `BlingNFeTab`, `BlingFinanceiroPanel`, `BenchmarkingSetorial`, `InadimplenciaSegmentada`, todos recharts); só 5 `lazy()` em `components`+`pages`.
**Ação:** `lazy` nos widgets abaixo da dobra ou em abas; `Suspense` por widget com skeleton.
**Verificação:** LCP da home sem recharts no caminho crítico.
**Esforço:** M · **Depende:** E-066

### E-076 · P2 · perf · Prefetch por intenção, respeitando `saveData`
**Problema:** `hooks/usePrefetchRoutes.ts:33-46,145-148` baixa chunks das rotas "relacionadas" (inclusive `/bi`, `/expert`, `/relatorios`) 1,5 s após cada navegação, sem checar `navigator.connection.saveData`.
**Ação:** prefetch em `onMouseEnter`/`onFocus` dos links da sidebar; pular quando `saveData` ou `effectiveType` 2g.
**Verificação:** Network ocioso após navegar sem downloads de chunks não solicitados.
**Esforço:** P · **Depende:** —

### E-077 · P2 · perf · `manualChunks` revisado após medição
**Problema:** `vite.config.ts:107-134`: `ui-vendor` cobre 6 dos ~27 pacotes radix; `animation-vendor` puxado pelo entry via `MotionConfig` (`App.tsx:14`); `pdf-vendor` inútil enquanto jspdf é estático; `chunkSizeWarningLimit: 1200` e `reportCompressedSize:false` escondem regressão.
**Ação:** após E-072/E-074, medir com `ANALYZE=1`; casar `/node_modules/@radix-ui/` por prefixo; voltar limite para 500; orçamento gzip no CI (E-184).
**Verificação:** `dist/stats.html` anexado à PR; entry gz < 250 kB.
**Esforço:** M · **Depende:** E-072, E-074

### E-078 · P2 · perf · `LazyMotion` para framer-motion
**Problema:** framer-motion em 301 arquivos sem `LazyMotion`/`domAnimation` (est. 15-20 kB gz extras no entry).
**Ação:** `<LazyMotion features={domAnimation} strict>` em `App.tsx` e codemod `motion.` → `m.`.
**Verificação:** build sem o bundle completo de `motion`.
**Esforço:** M · **Depende:** E-077

### E-079 · P2 · perf · Fontes: cortar Outfit e pesos extras, self-host
**Problema:** `index.html:44` carrega JetBrains Mono (3 pesos), Outfit (6) e Plus Jakarta Sans (7) — 16 arquivos bloqueando o primeiro render; `--font-heading` é Plus Jakarta (`index.css:145,186`), logo Outfit é quase inútil; `ux-validator/AuditTab.tsx:37` afirma "Outfit em Headings" (falso).
**Ação:** remover Outfit e pesos 800/900; self-host woff2 em `public/fonts` com `preload` de 400/600; `font-display: swap`.
**Verificação:** Lighthouse: sem "render-blocking resources" de fontes.
**Esforço:** P · **Depende:** —

### E-080 · P2 · perf · Service worker: cache-first puro para assets com hash
**Problema:** `public/sw.js:71-72,91-101` revalida em todo hit de asset (anula `immutable` do `vercel.json`); `CACHE_NAME='promo-brindes-v3'` fixo acumula chunks de todos os deploys; `API_CACHE_MAX_AGE` (l.12) nunca usado; `API_CACHE_NAME` guarda todo GET; fallback offline usa `'/'` em vez de `offline.html`.
**Ação:** cache-first sem revalidação em `/assets/*`; `CACHE_NAME` com hash de build injetado; limpeza de caches antigos no `activate`; usar `offline.html`; ou migrar para Workbox via `vite-plugin-pwa`.
**Verificação:** segunda visita sem requisições a `/assets/*` (Network, "from ServiceWorker").
**Esforço:** M · **Depende:** —

### E-081 · P2 · perf · Recarregar em `vite:preloadError` (chunk antigo após deploy)
**Problema:** sem listener `vite:preloadError` em `src/`; `ui/lazy-load.utils.tsx:12` tem `createLazyComponent` com retry/backoff mas 0 usos (rotas usam `lazy()` puro); `ErrorBoundary.tsx:30-73` não detecta falha de import. Cada deploy gera tela de erro para abas abertas.
**Ação:** `window.addEventListener('vite:preloadError', () => location.reload())` + `createLazyComponent` nas rotas.
**Verificação:** simular 404 de chunk → página recarrega uma vez.
**Esforço:** P · **Depende:** —

### E-082 · P2 · perf · Contextos restantes memoizados
**Problema:** `EmpresaScopeContext.tsx:178` recria só o objeto `value` (membros já memoizados, l.130-173); `theme/ThemeProvider.tsx:57` `value={{…}}` inline; `navigation/UnsavedGuardProvider.tsx:300` `value={{ setDirty }}`.
**Ação:** `useMemo` nos três.
**Verificação:** Profiler sem re-render de consumidores em navegação.
**Esforço:** P · **Depende:** —

### E-083 · P2 · perf · Polling revisado por tela
**Problema:** 35 `refetchInterval` (15× 60 s, 8× 30 s, 3× 15 s em `PixDashboardRealtime.tsx:34,50` e `useAnomaliaDetectionRun.ts:43`); `useEntitySavedFilterAlerts.ts:128` `setInterval` 30 s.
**Ação:** tabela de SLA por dado; `refetchInterval` como função que para quando a aba está oculta ou o realtime está ativo.
**Verificação:** aba em background por 5 min: 0 requisições.
**Esforço:** P · **Depende:** E-063

### E-084 · P2 · perf · Listas com `limit`/`range` obrigatórios
**Problema:** 796 `.from(`, 582 `.select(` (230 `select('*')`), 7 `.range(`, 104 `.limit(` → ~300 selects de lista sem limite (ex.: `useTransacoesBancarias` em `useConciliacao.ts:282-292`; `AuditLogs.tsx:266-284` export com até 50 requisições seriais).
**Ação:** regra ESLint `local/require-pagination` para `.select()` sem `.limit/.range/.maybeSingle/.single`; projeção de colunas em vez de `*` nas 20 maiores tabelas.
**Verificação:** lint com baseline que só encolhe.
**Esforço:** G · **Depende:** E-049

### E-085 · P2 · perf · Canais realtime estáveis e filtrados por empresa
**Problema:** 16 arquivos com `.channel(` (todos com cleanup, OK), mas nomes com `Math.random` recriados a cada navegação; `useRealtimeAnomalias:41-45` e `useAprovacoesPendentesCount.ts:17-23` sem `filter: empresa_id`.
**Ação:** nome determinístico por `(tabela, ids)`; `filter: empresa_id=in.(…)`.
**Verificação:** painel Realtime do Supabase: 1 canal por tabela por sessão.
**Esforço:** P · **Depende:** E-066

### E-086 · P2 · perf · `React.memo` e `useMemo` nos pontos quentes
**Problema:** 7 `React.memo` em todo `src`; `useConciliacaoPage.ts:361-364` 3 `filter()` por render; `key={index}` em listas reais (`PreviewStep.tsx` 6, `BenchmarkResultTabs.tsx` 6).
**Ação:** memoizar KPIs derivados; `key` por id.
**Verificação:** Profiler na conciliação: seleção de 1 linha re-renderiza só a linha.
**Esforço:** P · **Depende:** E-070

### E-087 · P2 · perf · Imagens com `loading="lazy"` e `decoding="async"`
**Problema:** 24 `<img>` em `src`, nenhum com `loading="lazy"`.
**Ação:** codemod; componente `Img` padrão.
**Verificação:** `rg '<img' src | rg -v loading` = 0.
**Esforço:** P · **Depende:** —

### E-088 · P3 · perf · `web-vitals` v4+ e `console` removido no build
**Problema:** `web-vitals ^3.5` (`telemetry.ts:4` ainda cita FID, removido na v4); sem `drop`/`pure` de console no minificador (`console-guard` só em runtime).
**Ação:** bump para v4/v5 trocando FID→INP; `esbuild.drop`/`oxc` `pure: ['console.debug','console.log']`.
**Verificação:** build sem `console.log`; métricas INP chegando em `frontend_performance_logs`.
**Esforço:** P · **Depende:** —

### E-089 · P3 · perf · Uma só biblioteca de virtualização
**Problema:** `react-window` (`ContasPagar/components/List.tsx`, `Movimentacoes.tsx`) e `@tanstack/react-virtual` (`useVirtualRows.ts`).
**Ação:** padronizar em `@tanstack/react-virtual`; remover `react-window` e `@types/react-window`.
**Verificação:** `rg react-window src` = 0.
**Esforço:** M · **Depende:** E-069

### E-090 · P3 · perf · Medição contínua: Lighthouse CI nas 5 rotas críticas
**Problema:** sem Lighthouse CI; `sonar-project.properties` com 2 linhas sem workflow; orçamento de bundle do CI é 600 kB/chunk sem gzip.
**Ação:** `lhci autorun` contra `vite preview` em PR (performance ≥ 80, a11y ≥ 90); orçamento gzip total.
**Verificação:** job verde na PR.
**Esforço:** M · **Depende:** E-184 · **Regra 6.6 (workflow): PR aberta para o dono.**

### Fase 6 · Acessibilidade (E-091 → E-116)

### E-091 · P1 · a11y · Nome acessível nos botões do Header e do drawer mobile
**Problema:** `layout/Header.tsx:146-152` (idioma), `:171-177` (tema), `:203-212` (notificações) `size="icon"` sem `aria-label` (único do arquivo é l.255); `sidebar/MobileSidebarDrawer.tsx:52-54` botão X sem nome. Presentes em todas as telas.
**Ação:** `aria-label` + `title`; badge de contagem com `aria-live="polite"`.
**Verificação:** axe sem "button-name" no Header.
**Esforço:** P · **Depende:** —

### E-092 · P1 · a11y · Drawer mobile como diálogo acessível (Radix `Sheet`)
**Problema:** `MobileSidebarDrawer.tsx:28-36` `motion.aside` sem `role="dialog"`/`aria-modal`, sem focus trap, Escape não fecha, foco não volta ao gatilho; backdrop `div onClick` (l.18-25).
**Ação:** migrar para `Sheet` com `SheetTitle` sr-only e `side="left"`.
**Verificação:** teclado: Tab fica dentro, Esc fecha, foco retorna.
**Esforço:** P · **Depende:** —

### E-093 · P1 · a11y · 177 botões só com ícone ganham nome (regra ESLint)
**Problema:** 177 em 118 arquivos (91 também pequenos): `RegrasTable.tsx` 5, `ui/data-table.tsx` 4, `SugestoesMatchSections.tsx` 4, `NotasFiscaisAbas.tsx` 4; `EventosHistorico.tsx:219`, `WebAuthnManager.tsx:161`, `RegrasConciliacaoPanel.tsx:206`.
**Ação:** regra `local/icon-button-needs-label` (`size` começa com `icon` ⇒ `aria-label` ou filho `sr-only`); corrigir por módulo.
**Verificação:** lint = 0 ocorrências.
**Esforço:** G · **Depende:** E-091

### E-094 · P1 · a11y · Ações reveladas no hover também no foco
**Problema:** 50 `opacity-0 group-hover:opacity-100` sem `group-focus-within`/`focus-visible` (`empresas/EmpresaCardView.tsx:106`, `ui/sheet.tsx:253`).
**Ação:** classe utilitária `reveal-on-hover` = `opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100`; codemod.
**Verificação:** `rg 'group-hover:opacity-100' src | rg -v focus` = 0.
**Esforço:** P · **Depende:** —

### E-095 · P1 · a11y · KPIs e linhas clicáveis acessíveis por teclado
**Problema:** 43 `onClick` em `div`/`Card`/`tr`/`td` sem `role`/`tabIndex`/`onKeyDown`: `contas-receber/ContasReceberKPIs.tsx:139,311,353`, `reforma-tributaria/DashboardReformaVisaoGeral.tsx:116,139`, `relatorios/RelatorioDrillLevels.tsx:103,133`, `HeroKPIs.tsx`.
**Ação:** `<button>`/`asChild` ou `role="button" tabIndex={0}` + Enter/Space; regra `jsx-a11y/click-events-have-key-events` (plugin já instalado).
**Verificação:** navegação por Tab abre o drill-down.
**Esforço:** M · **Depende:** E-180

### E-096 · P1 · a11y · Rótulos associados aos campos
**Problema:** 765 de 1.108 controles sem `id`/`aria-label`/`FormControl` em 243 arquivos; `<Label>` sem `htmlFor` 492× vs 185 com; piores: `configuracoes/SistemaTab.tsx` 12, `ContingenciaRuleDialog.tsx`/`asaas/tabs/ConfigTab.tsx`/`PisCofinsCreditos.tsx` 11; `EventosHistorico.tsx:127` busca só com placeholder.
**Ação:** `Label` passa a exigir `htmlFor` (tipo) ou envolver o controle; `useId()`; `aria-label` nos campos de busca; regra `jsx-a11y/label-has-associated-control`.
**Verificação:** axe "label" = 0 nas 20 páginas principais.
**Esforço:** G · **Depende:** E-180

### E-097 · P2 · a11y · Foco visível onde `outline-none` foi removido
**Problema:** 75 `outline-none`, 33 sem `focus:ring`/`focus-visible`: `SimuladorAntecipacao.tsx:226,290`, `dashboard/PrevisaoIA.tsx:296-319` (TabsContent focável), `ui/tree-view.tsx:225`, `ui/tag-input.tsx:184`, `ui/phone-input.tsx:174`.
**Ação:** `focus-visible:ring-2 ring-ring` nos 33.
**Verificação:** Tab mostra anel em todos.
**Esforço:** P · **Depende:** —

### E-098 · P2 · a11y · Toggle de senha na ordem de tabulação
**Problema:** `auth/LoginForm.tsx:146` e `RegisterForm.tsx:120` `tabIndex={-1}` (têm `aria-label`, mas teclado não alcança).
**Ação:** remover `tabIndex`.
**Verificação:** Tab alcança o botão.
**Esforço:** P · **Depende:** —

### E-099 · P2 · a11y · Tabelas com `scope`, `aria-sort` e `caption`
**Problema:** `scope=` 0× (903 `TableHead` + 174 `th`), `aria-sort` 0×, `caption` 7×; `ui/sortable-header.tsx:26-34` sem estado.
**Ação:** `TableHead` com `scope="col"` padrão; `aria-sort` no header ordenável; `TableCaption` sr-only nas tabelas principais.
**Verificação:** axe "th-has-data-cells"/"scope-attr-valid" = 0.
**Esforço:** M · **Depende:** —

### E-100 · P1 · a11y · Alto contraste funcional
**Problema:** `src/styles/high-contrast.css:1-6` usa `@media (prefers-contrast: high)` (valor fora da spec; browsers usam `more`) e define `--background: #000` consumido como `hsl(var(--background))` (`tailwind.config.ts:30`) → se aplicasse, CSS inválido e fundo transparente. Hoje o arquivo não faz nada.
**Ação:** `prefers-contrast: more` com triplets HSL (ou tokens Vela) e cobertura dos dois sistemas de token.
**Verificação:** emulação "prefers-contrast: more" no DevTools mostra fundo preto, texto branco, bordas visíveis.
**Esforço:** P · **Depende:** —

### E-101 · P1 · a11y · Contraste dos botões de status (Vela dark)
**Problema:** `ui/button.variants.ts:8-16` `text-t0` (#f3f4f9) sobre `bg-ok` #33d493 (1,74:1), `bg-warn` #f7b84e (1,60:1), `bg-bad` 2,57:1, `bg-acc` #7c5cff 3,96:1 — abaixo de 4,5:1; no light só `acc` falha (3,38). Pares shadcn no dark: `success-foreground` 1,91, `info` 2,48, `destructive` 2,81.
**Ação:** foreground escuro (`#0c0e15`) em ok/warn/bad; `acc` mais escuro ou texto branco com peso 600 e 16px+.
**Verificação:** `scripts/a11y/contrast.mjs` calcula razão dos pares de token ≥ 4,5 (teste unitário).
**Esforço:** P · **Depende:** —

### E-102 · P2 · a11y · `muted-foreground` com opacidade mínima e bordas visíveis
**Problema:** `text-muted-foreground/NN` 248× (`/60` 114 → 3,37 dark / 2,48 light; `/40` 2,11); `--t2` 2,93-3,36; `--border` 1,2:1 e `--input` 1,45:1 no dark (< 3:1 para UI, 1.4.11).
**Ação:** proibir `/<70` via lint; `--input` com L ≥ 35%; `--t2` ajustado.
**Verificação:** teste de contraste de E-101 estendido.
**Esforço:** M · **Depende:** E-101

### E-103 · P2 · a11y · Regiões vivas para offline, rede e carregamento
**Problema:** `offline/OfflineBanner.tsx:62` montado condicionalmente sem `role="status"`; `ui/network-status-indicator.tsx` idem; `ui/skeleton.tsx` sem `aria-hidden`/`aria-busy` (2 usos no app); 244 arquivos com `animate-spin` sem texto sr-only.
**Ação:** `role="status"` nos dois; `Skeleton` com `aria-hidden`; `Spinner` padrão com `<span className="sr-only">Carregando…</span>`.
**Verificação:** NVDA anuncia "offline" ao cair a rede.
**Esforço:** P · **Depende:** —

### E-104 · P2 · a11y · Movimento reduzido completo
**Problema:** `MotionConfig reducedMotion="user"` só desliga transform/layout; `effects/BlurText.tsx:113-120` anima blur/opacidade por palavra (`Auth.tsx:114`) e fragmenta o texto em spans sem `aria-label`; `ui/skeleton.tsx:31-33` pulso infinito via framer.
**Ação:** `useReducedMotion()` com fallback estático; `aria-label={text}` no `<p>` e `aria-hidden` nos spans; skeleton com CSS `animate-pulse` (já respeita `prefers-reduced-motion` do `index.css:503-520`).
**Verificação:** emulação reduced-motion: login sem animação de texto.
**Esforço:** P · **Depende:** —

### E-105 · P2 · a11y · Gráficos com alternativa textual
**Problema:** 93 `<ResponsiveContainer>`, 0 `accessibilityLayer`, 5 `role="img"`; 26 indicadores de status só por cor (`h-2 w-2 rounded-full bg-*`, ex. `bi/FuturisticDashboard.tsx:69`).
**Ação:** `accessibilityLayer` (recharts ≥ 2.12) + `aria-label` descritivo + tabela de dados sr-only nos 10 gráficos de KPI; `StatusDot` com texto/ícone.
**Verificação:** axe "image-alt"/"aria-label" = 0 nos dashboards.
**Esforço:** M · **Depende:** —

### E-106 · P2 · a11y · Alvos de toque ≥ 24 px (2.5.8) e 44 px no mobile
**Problema:** `ui/dialog.tsx:65` botão fechar `sm:p-0` com ícone 16 px; 9 botões `h-5/h-6/h-7` (`PreviewAnomaliaToastDrawer.tsx:213`); 257 `h-8 w-8`.
**Ação:** fechar com `p-2`; `size="icon"` mínimo 32 px, `sm:h-11` no mobile via token.
**Verificação:** Lighthouse "tap targets" verde.
**Esforço:** P · **Depende:** —

### E-107 · P2 · a11y · `aria-describedby={undefined}` substituído por descrição real
**Problema:** 60 ocorrências suprimem o aviso do Radix em vez de descrever o diálogo.
**Ação:** `DialogDescription` (visível ou sr-only) em cada um.
**Verificação:** `rg 'aria-describedby={undefined}' src` = 0.
**Esforço:** M · **Depende:** —

### E-108 · P2 · a11y · Texto mínimo legível
**Problema:** 1.154 ocorrências de `text-[8px]`/`[9px]`/`[10px]` (1.341 `text-[Npx]` no total).
**Ação:** token `text-2xs` = 11 px; proibir `text-[<11px]` via lint.
**Verificação:** lint = 0.
**Esforço:** M · **Depende:** —

### E-109 · P2 · a11y · Testes axe em páginas reais (unitário e E2E)
**Problema:** só `src/test/a11y/critical-pages.test.tsx` (3 casos de primitivos, desliga `color-contrast`/`region`) e `indices-tab.test.tsx` (2); sem `@axe-core/playwright`; `axe-core`/`vitest-axe` em `dependencies`.
**Ação:** `@axe-core/playwright` nas 5 rotas do E2E crítico (sem desligar regras); mover libs para `devDependencies`.
**Verificação:** job E2E falha em violação "serious"/"critical".
**Esforço:** M · **Depende:** E-091, E-092

### E-110 · P2 · a11y · Foco e título por rota preservados após E-066
**Problema:** `NavigationTracker.tsx:54,77-96` atualiza `document.title` e move o foco para `#main-content`; com layout persistente o container deixa de remontar e o comportamento precisa ser revalidado.
**Ação:** manter o `NavigationTracker` dentro do layout; anunciar nova página via `aria-live`.
**Verificação:** leitor de tela anuncia o título ao navegar.
**Esforço:** P · **Depende:** E-066

### E-111 · P3 · a11y · `h1` em todas as páginas
**Problema:** 32 arquivos em `src/pages/*.tsx` sem heading no próprio arquivo (`CentroCustos.tsx`, `ContasReceber.tsx`, `AuditLogs.tsx`, `BI.tsx`, `Index.tsx`) — confirmar nos subcomponentes.
**Ação:** `PageHeader` obrigatório com `as="h1"`; teste axe "page-has-heading-one".
**Verificação:** axe = 0 nas 124 páginas (smoke render).
**Esforço:** M · **Depende:** —

### E-112 · P3 · a11y · `autoFocus` e `tabIndex={-1}` revisados
**Problema:** `autoFocus` 7× (`CorporateOnboarding.tsx:218` fora de dialog); `PreviewAnomaliaToastDrawer.tsx:214,235,287` botões `pointer-events-none tabIndex=-1` (melhor `aria-hidden`).
**Ação:** remover `autoFocus` fora de modais; `aria-hidden` nos previews.
**Verificação:** revisão manual.
**Esforço:** P · **Depende:** —

### E-113 · P3 · a11y · Idioma declarado por conteúdo
**Problema:** `index.html` `lang="pt-BR"` OK; seletor pt/en/es no Header (`Header.tsx:157-163`) muda o menu sem mudar `document.documentElement.lang`.
**Ação:** sincronizar `lang` com `i18n.language`; ou remover o seletor (E-129).
**Verificação:** `document.documentElement.lang` acompanha o idioma.
**Esforço:** P · **Depende:** E-129

### E-114 · P3 · a11y · Manifest sem travar orientação
**Problema:** `public/manifest.json` `"orientation": "portrait-primary"` (1.3.4), `background_color #ffffff` em app dark-first (flash), ícones só SVG/ICO (sem PNG 192/512 → instalabilidade).
**Ação:** `orientation: "any"`, `background_color` = `--bg-0`, PNG 192/512 maskable.
**Verificação:** Lighthouse PWA instalável; sem flash branco.
**Esforço:** P · **Depende:** —

### E-115 · P3 · a11y · Atalho de tema funcional
**Problema:** `hooks/useKeyboardShortcuts.ts:165` procura `[data-theme-toggle]`, que não existe.
**Ação:** adicionar o atributo ao botão de tema (E-091) ou chamar `setTheme` diretamente.
**Verificação:** atalho alterna o tema.
**Esforço:** P · **Depende:** E-091

### E-116 · P3 · a11y · Documentar o padrão de acessibilidade do design system
**Problema:** `docs/ACCESSIBILITY.md` não reflete regras de lint, tokens de contraste nem componentes obrigatórios.
**Ação:** atualizar com as regras de E-093/E-096/E-101 e checklist por PR.
**Verificação:** doc revisado.
**Esforço:** P · **Depende:** E-093, E-101

### Fase 7 · UX, formulários e estados (E-117 → E-130)

### E-117 · P1 · ux · Confirmação antes de excluir
**Problema:** 16 arquivos com delete sem `AlertDialog`/`ConfirmDialog`: `pix-hub/PixTemplates.tsx:224` (`deleteMutation.mutate` direto), `auth/WebAuthnManager.tsx:164` (remove credencial de login), `financeiro/AnexoList.tsx:263`, `conciliacao/RegrasConciliacaoPanel.tsx:206`, `security/GeoRestrictionPanel.tsx:261`, `categorias/CategoriaTable.tsx:100`, `admin/GerenciadorPermissoes.tsx`, `configuracoes/SecuritySettings.tsx`, `pages/CentroCustos.tsx`, `CentroCustosArvore.tsx`, `ContasReceber.tsx`, `AdminTelemetria.tsx`, `Expert.tsx`, `nfe/AutoContingenciaConfig.tsx`, `conciliacao/ConciliacaoSplitDialog.tsx`. `ui/confirm-dialog.tsx` já tem 18 usos em 16 arquivos.
**Ação:** `useConfirm()` + `ConfirmDialog` nos 16; para itens recuperáveis, toast com "Desfazer".
**Verificação:** teste RTL: clique em excluir abre confirmação; mutação só após confirmar.
**Esforço:** M · **Depende:** —

### E-118 · P1 · ux · Erro de consulta nunca vira "lista vazia"
**Problema:** 132 de 252 arquivos com `isLoading` sem `isError`; 44 de 94 `data: x = []` sem erro (`pages/Alertas.tsx:54`); `ErrorState` (`ui/empty-state.tsx:330`) usado 1×; sem estado de erro: `Financeiro`, `Empresas`, `Cobrancas`, `FluxoCaixa`, `Boletos`, `OrcamentoEvento`, `admin/SSOAdmin`, `admin/AuditoriaIA`.
**Ação:** componente `QueryBoundary` (`isLoading → skeleton`, `isError → ErrorState onRetry`) e adoção nas 8 páginas; lint `local/query-handles-error` para `useQuery` desestruturado sem `isError`/`error`.
**Verificação:** mock de erro → tela mostra `ErrorState` com "tentar de novo".
**Esforço:** G · **Depende:** —

### E-119 · P2 · ux · Validação inline nos formulários Asaas
**Problema:** 14 `toast.error('Preencha…')` sem erro inline nem `aria-invalid`: `asaas/NovaCobrancaDialog.tsx:122,152,186`, `asaas/LinkPagamentoDialog.tsx:46`, `asaas/TransferenciaPixDialog.tsx:62`.
**Ação:** react-hook-form + zod + `FormMessage` (padrão já usado em 13 formulários).
**Verificação:** campo vazio exibe mensagem sob o campo e `aria-invalid`.
**Esforço:** M · **Depende:** E-013

### E-120 · P2 · ux · Switches inertes em Configurações
**Problema:** `configuracoes/SistemaTab.tsx:97` `checked={false}` e `:104,113,132,141,232,241` `checked={true}` sem `onCheckedChange` (só l.77 e l.197 têm handler): parecem configuráveis e não fazem nada.
**Ação:** ligar a `usePreferenciasSistema` ou marcar `disabled` com badge "em breve".
**Verificação:** cada switch persiste ou está desabilitado.
**Esforço:** P · **Depende:** —

### E-121 · P2 · ux · Submit protegido contra duplo envio
**Problema:** `compras/PedidoCompraForm.tsx:328` único `type="submit"` (de 22) sem `disabled={isPending}`.
**Ação:** `disabled` + spinner; regra lint `local/submit-needs-pending`.
**Verificação:** duplo clique gera 1 pedido.
**Esforço:** P · **Depende:** —

### E-122 · P2 · ux · Um só padrão de carregamento
**Problema:** skeleton em 143 arquivos, `animate-spin` em 244, texto "Carregando..." em `pages/Boletos.tsx:214`; `loading-skeleton` vs `skeleton`.
**Ação:** diretriz: skeleton para conteúdo, spinner só em botões; consolidar `PageLoading`/`Skeleton`.
**Verificação:** `rg 'Carregando\.\.\.' src/pages` = 0.
**Esforço:** M · **Depende:** —

### E-123 · P2 · ux · Um só `EmptyState` e um só toast
**Problema:** 3 `EmptyState` (`ui/empty-state.tsx:125` 17 usos, `ui/micro-interactions.tsx:220` 7, `admin/anomalias-review-queue/QueueStates.tsx:13`) + `EmptyStateTributario`; `sonner` em 315 arquivos vs `use-toast` adapter em 22; `@radix-ui/react-toast` sem uso; `ui/sonner.tsx` sem importador.
**Ação:** codemod para `ui/empty-state` e `sonner`; apagar os demais e a dependência.
**Verificação:** `rg "from '@/hooks/use-toast'" src` = 0.
**Esforço:** M · **Depende:** —

### E-124 · P2 · ux · Flash de layout desktop no mobile
**Problema:** `hooks/use-mobile.tsx:6,14,18` inicia `undefined` → `false` no 1º render; `MainLayout.tsx:64,72` monta Sidebar/Header desktop e `:89-90` anima `marginLeft`.
**Ação:** inicializar com `window.matchMedia(query).matches` (guard SSR).
**Verificação:** primeiro frame no mobile já é layout mobile (Performance panel).
**Esforço:** P · **Depende:** —

### E-125 · P2 · ux · Banner offline em todas as páginas
**Problema:** `OfflineBanner` só em `MainLayout.tsx:61`; páginas fora do layout (`/usuarios`, `/audit-logs`, `/integracoes`, `/admin/erros-frontend`) ficam sem.
**Ação:** mover para `App.tsx` (após E-066 todas estarão no layout, mas auth/reset não).
**Verificação:** `/auth` offline mostra banner.
**Esforço:** P · **Depende:** E-066

### E-126 · P2 · ux · ErrorBoundary por rota com reset na navegação
**Problema:** único `ErrorBoundary` em `App.tsx:100` fora do `BrowserRouter`; erro em uma página derruba o app; `ErrorBoundary.tsx:193` `mailto:suporte@empresa.com` placeholder; `:38` `console.error` incondicional.
**Ação:** boundary dentro do layout com `resetKeys={[pathname]}` e fallback por página; e-mail real via env; log via `logger`.
**Verificação:** erro forçado em `/bi` mantém sidebar e permite navegar.
**Esforço:** M · **Depende:** E-066

### E-127 · P3 · ux · 404 sem ruído no Sentry
**Problema:** `pages/NotFound.tsx:12` `logger.error` em todo 404.
**Ação:** `logger.warn` + sem captura Sentry.
**Verificação:** 404 não cria issue.
**Esforço:** P · **Depende:** —

### E-128 · P3 · ux · Logger com nível por ambiente
**Problema:** `src/lib/logger.ts:5` `level='info'` fixo (sem `setLevel` em uso) → `info`/`warn`/`error` com objetos do Supabase (podem conter e-mail/filtros) no console de produção.
**Ação:** `level = import.meta.env.PROD ? 'warn' : 'debug'`.
**Verificação:** console de produção sem `info`.
**Esforço:** P · **Depende:** —

### E-129 · P3 · ux · i18n: fixar pt-BR até haver cobertura real
**Problema:** `src/i18n.ts` importado em `main.tsx:5`; só `Header.tsx` e `SidebarNavGroups.tsx` usam `useTranslation` (14 chaves); seletor pt/en/es + `LanguageDetector` → menu em inglês e o resto em pt-BR; 628 strings literais em toasts; marca "Quantum" em `i18n.ts:17`.
**Ação:** `lng:'pt'`, remover seletor e detector, corrigir a marca; registrar decisão de extrair strings depois.
**Verificação:** navegador em `en-US` mostra tudo em pt-BR.
**Esforço:** P · **Depende:** — · **Decisão de negócio (idiomas).**

### E-130 · P3 · ux · Metadados sociais e tema
**Problema:** `index.html` `og:image`/`twitter:image` apontam para placeholder em `lovable.dev`; `theme-color #7c3aed` ≠ `--acc #7c5cff`.
**Ação:** imagem própria em `public/og.png`; `theme-color` = `--acc` (e variante light via `media`).
**Verificação:** preview de link e cor da barra no Android.
**Esforço:** P · **Depende:** —

### Fase 8 · Responsividade (E-131 → E-138)

### E-131 · P1 · resp · Dialog com altura máxima no desktop
**Problema:** `ui/dialog.tsx:44` `max-h-[90vh] overflow-y-auto` só no mobile (sem `sm:max-h`); 19 de 133 `DialogContent` adicionam `max-h`; 31 usam `max-w-3xl`..`7xl` — formulários longos passam da viewport.
**Ação:** `sm:max-h-[90vh] sm:overflow-y-auto` no primitivo; header/footer sticky.
**Verificação:** `NovaNFeForm` em 768 px de altura rola dentro do dialog.
**Esforço:** P · **Depende:** —

### E-132 · P2 · resp · `min-w-[800px]` deixa de ser global
**Problema:** `ui/table.tsx:11` `min-w-[800px]` em toda tabela (tabelas de 2-3 colunas rolam no mobile); `ContasPagar/components/List.tsx:142` `min-w-[1200px]`, `Movimentacoes.tsx:116` 900 px; 276 `w-/min-w-/max-w-[Npx]`.
**Ação:** `minWidth` como prop opcional; layout em cards (`md:hidden`) nas 6 tabelas principais.
**Verificação:** tabela de categorias em 360 px sem scroll horizontal.
**Esforço:** M · **Depende:** —

### E-133 · P2 · resp · `<table>` cru com overflow
**Problema:** `nfe/NFePreview.tsx`, `admin/AuditoriaTributariaTab.tsx`, `admin/sso/sandbox/RulesAppliedCard.tsx` usam `<table>` sem container `overflow-x-auto`.
**Ação:** migrar para `ui/table`.
**Verificação:** sem overflow da página em 360 px.
**Esforço:** P · **Depende:** —

### E-134 · P2 · resp · Grids com breakpoint
**Problema:** 60 `grid-cols-3+` sem `sm:`/`md:` (`nfe/InutilizacaoNFe.tsx:240`, `CancelamentoNFe.tsx:166`, `SefazStatusPanel.tsx:63` cols-5; `NovaNFeForm.tsx:174` cols-4; `admin/GerenciadorPermissoes.tsx:259` `TabsList grid-cols-4`).
**Ação:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-N`; lint para `grid-cols-[3-9]` sem prefixo.
**Verificação:** formulários NF-e legíveis em 360 px.
**Esforço:** M · **Depende:** —

### E-135 · P2 · resp · Virtualização e tabelas após `min-w`
**Problema:** virtualização de E-069/E-070 com larguras fixas quebra em telas estreitas.
**Ação:** largura de coluna por `%`/`minmax` e `overflow-x` no container virtual.
**Verificação:** Contas a Pagar em 768 px sem células cortadas.
**Esforço:** P · **Depende:** E-069, E-132

### E-136 · P3 · resp · Bottom nav e drawer: áreas seguras
**Problema:** `viewport-fit=cover` em `index.html` sem `env(safe-area-inset-*)` no `MobileBottomNav`/drawer.
**Ação:** `pb-[env(safe-area-inset-bottom)]`.
**Verificação:** iPhone com notch: nav não encosta na barra.
**Esforço:** P · **Depende:** —

### E-137 · P3 · resp · E2E em viewport mobile
**Problema:** nenhum projeto Playwright com `devices['Pixel 7']`.
**Ação:** projeto `mobile` no `playwright.critical.config.ts` para login, dashboard e contas a pagar.
**Verificação:** job verde.
**Esforço:** P · **Depende:** E-124

### E-138 · P3 · resp · Remover `ui/sidebar.tsx` (shadcn) não usado
**Problema:** `ui/sidebar.tsx` (733 linhas, `SheetContent` sem título l.186) não é importado; o app usa `ResponsiveSidebar`/`MobileSidebarDrawer`.
**Ação:** apagar.
**Verificação:** `type-check` verde.
**Esforço:** P · **Depende:** E-092

### Fase 9 · Design system e limpeza de `ui/` (E-139 → E-152)

### E-139 · P1 · ds · Tokens Vela com `<alpha-value>`
**Problema:** `tailwind.config.ts:83-103` define `acc: "var(--acc)"` etc. sem `<alpha-value>`; 37 usos com modificador (`bg-bad/90`, `border-acc/20` em `button.variants.ts`) não geram CSS no Tailwind 3 (NÃO VERIFICADO por build — comportamento documentado).
**Ação:** variáveis `--acc-rgb: 124 92 255` e `acc: "rgb(var(--acc-rgb) / <alpha-value>)"`.
**Verificação:** build + inspeção: `.border-acc\/20` existe no CSS.
**Esforço:** P · **Depende:** —

### E-140 · P1 · ds · Classes sem definição
**Problema:** `font-display` 103 usos em 60 arquivos sem entrada em `fontFamily` (só `sans`, `heading`, `mono`); `shadow-glow-primary`/`shadow-glow-coins` 5 usos sem definição.
**Ação:** definir `display` (= heading) e `boxShadow.glow-*`, ou codemod para classes existentes.
**Verificação:** `tailwindcss --content` sem classes desconhecidas (plugin `eslint-plugin-tailwindcss`).
**Esforço:** P · **Depende:** —

### E-141 · P1 · ds · Tema light sem `white/NN` cru
**Problema:** 489 `bg-/border-/text-white/NN` sem `dark:` (só 48 `dark:` no total); primitivos afetados: `ui/table.tsx:6` `border-white/5`, `ui/data-table.tsx:154`, `layout/MobileHeader.tsx:14`, `ContasReceberKPIs.tsx:135`; piores: `PlanoContasTab.tsx` 16, `DreBalancoToolbar.tsx` 11, `VerificacaoIntegracoesPanel.tsx` 11, `LancamentosTabConteudo.tsx` 11; 28 `text-white`/`text-black`.
**Ação:** codemod para `border-border`/`bg-card`/`text-foreground`; lint proibindo `white/`.
**Verificação:** screenshot E2E `visual-theme` no light sem bordas invisíveis.
**Esforço:** G · **Depende:** E-139

### E-142 · P2 · ds · Uma fonte de verdade de tokens (Vela ↔ shadcn)
**Problema:** `index.css` tem Vela em hex (l.6-134, bloco dark duplicado em `:root` 6-47 e `.dark` 95-134) e shadcn em HSL (142-225); `button.variants.ts` usa Vela, 449 imports de `badge` etc. usam shadcn; seletor morto `:root[data-theme='light']` (l.50; o `ThemeProvider` usa `.light`).
**Ação:** shadcn passa a derivar dos Vela (`--primary: var(--acc-hsl)`), remover duplicatas e o seletor morto; documentar em `docs/COMPONENTS.md`.
**Verificação:** `index.css` com um bloco por tema; `visual-theme` E2E verde.
**Esforço:** M · **Depende:** E-139

### E-143 · P2 · ds · Cores fora dos tokens
**Problema:** paleta crua (`text-red-500`…) 438× (`SecondaryKPICards.tsx` 23, `SimulacaoDialog.tsx` 20, `Orcamentos.tsx` 15, `MetasFinanceirasPanel.tsx` 15); hex em TS 51 (`ui/tag-input.tsx` 10, `SugestoesMatchIA.tsx` 6, `LoginForm.tsx` 4); `rounded-[Nrem]` 149; `glow` com `rgba(124,92,255,…)` em `button.variants.ts`.
**Ação:** mapa semântico (`text-ok`, `text-bad`, `text-warn`, `text-info`) e codemod; lint `tailwindcss/no-arbitrary-value` para cores e raios.
**Verificação:** lint com baseline que só encolhe.
**Esforço:** G · **Depende:** E-142

### E-144 · P2 · ds · Primitivos duplicados consolidados
**Problema:** pares em `ui/`: `confirm-dialog`(18 usos)/`confirmation-dialog`(7), `modal`/`dialog`, `dropdown`/`dropdown-menu`, `radio`/`radio-group`, `collapse`/`collapsible`, `resizable`/`resizable-panels`, `data-table`/`data-grid`/`table`, `status-badge`+`rank-badge`/`badge`, `loading-skeleton`/`skeleton`, `sonner`/`toaster`.
**Ação:** manter o shadcn/mais usado; codemod; apagar o outro.
**Verificação:** 1 arquivo por conceito em `ui/`.
**Esforço:** M · **Depende:** —

### E-145 · P2 · ds · Remover ~30 primitivos sem importador
**Problema:** sem uso: `modal`, `radio`, `collapse`, `resizable`, `resizable-panels`, `data-table`, `data-grid`, `status-badge`, `sonner`, `wizard`, `tree-view`, `split-button`, `tag-input`, `rich-text-editor`, `phone-input`, `currency-input`, `file-upload`, `search-input`, `date-range-picker`, `sidebar`, `carousel`, `menubar`, `navigation-menu`, `input-otp`, `drawer`, `hover-card`, `aspect-ratio`, `context-menu`, `chart`, `pagination`. Nota: `currency-input` não é usado num app financeiro (avaliar adoção em E-146 antes de apagar).
**Ação:** apagar (exceto os escolhidos em E-146); `knip` no CI para impedir volta.
**Verificação:** `knip` = 0 arquivos não usados em `ui/`.
**Esforço:** M · **Depende:** E-144

### E-146 · P2 · ds · `CurrencyInput` e `DateRangePicker` adotados nos formulários financeiros
**Problema:** inputs de valor usam `Input type="number"`/texto com parse manual (ver E-024); `ui/currency-input.tsx` e `ui/date-range-picker.tsx` existem e não são usados.
**Ação:** revisar/ajustar os dois primitivos e adotar em `ContaPagarForm`, `ContaReceberForm`, `AcordoParcelamentoDialog`, filtros de bloqueios.
**Verificação:** digitação "1.234,56" grava 1234.56.
**Esforço:** M · **Depende:** E-024

### E-147 · P2 · ds · Dependências de produção sem uso
**Problema:** 0 imports: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-progress`, `@radix-ui/react-toast`, `mapbox-gl`, `next-themes`, `ogl` (`AuroraBackground.tsx:5` "dispensa o ogl"), `axe-core`, `@types/canvas-confetti`, `@types/react-window`; `vitest-axe`, `lovable-tagger`, `@lovable.dev/cloud-auth-js` em `dependencies`.
**Ação:** remover/mover para `devDependencies`; `bun install` e build.
**Verificação:** build verde; `bun.lock` menor.
**Esforço:** P · **Depende:** E-033

### E-148 · P2 · ds · Dependências defasadas e plugins ESLint ociosos
**Problema:** `@types/node ^20` vs `engines node>=22.12`; `jsdom ^23`; `recharts ^2`; `tailwindcss ^3`; `web-vitals ^3`; `sonner ^1`; `lint-staged ^15`; `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`, `eslint-config-prettier` instalados e não configurados; `@eslint/js` e `globals` importados sem declarar.
**Ação:** bumps minor seguros agora; majors (Tailwind 4, recharts 3) em ADR; declarar `@eslint/js`/`globals`; ativar os plugins (E-180).
**Verificação:** `bun outdated` sem minors pendentes.
**Esforço:** M · **Depende:** — · **Majors: avisar na PR.**

### E-149 · P3 · ds · Componentes `*Conteudo2/3` recompostos
**Problema:** `pages/ContasReceberConteudo.tsx` (240) → `ContasReceberConteudoConteudo.tsx` (244, 27 props) → `…Conteudo2.tsx` (123, 19 props, tipo de `centrosCusto` redeclarado inline) → `…Conteudo3.tsx` (44); `EmpresasConteudo2.tsx`; `bling/BlingFinanceiroPanelConteudo2.tsx`. Prop drilling de estado da página.
**Ação:** compor por seção (`Filtros`/`KPIs`/`Lista`) lendo de `useContasReceberLogic` ou de um contexto local; apagar os `ConteudoN`.
**Verificação:** nenhum componente com > 12 props em `src/pages`.
**Esforço:** G · **Depende:** E-061

### E-150 · P3 · ds · Raios e sombras consistentes
**Problema:** `button.variants.ts` mistura `rounded-vela-md` com `rounded-[2.5rem]` em dialog/table.
**Ação:** escala `vela-sm/md/lg/xl` única; lint para `rounded-[`.
**Verificação:** lint = 0.
**Esforço:** P · **Depende:** E-143

### E-151 · P3 · ds · Storybook alinhado aos primitivos restantes
**Problema:** `storybook` configurado (`package.json`), sem stories para `confirm-dialog`, `empty-state`, `currency-input`.
**Ação:** story por primitivo mantido em E-144/E-145.
**Verificação:** `build-storybook` verde.
**Esforço:** M · **Depende:** E-145

### E-152 · P3 · ds · `docs/COMPONENTS.md` como contrato do design system
**Problema:** doc não lista tokens, variantes nem regras de lint do DS.
**Ação:** atualizar após E-139..E-145.
**Verificação:** doc revisado.
**Esforço:** P · **Depende:** E-145

### Fase 10 · Contratos das Edge Functions e webhooks (E-153 → E-178)

> Cobre o pedido de **testes de contrato com validação de schema para todos os webhooks e Edge Functions**,
> **formato único de erro 422** (código, mensagem, lista de campos), **matriz de payloads inválidos** e
> **versionamento v1/v2 com retrocompatibilidade**. Inventário completo (106 funções: lê corpo? valida com
> Zod? tem teste? `verify_jwt`? webhook? assinatura? handler exportado?) está em `docs/agentes/` após E-178.

### E-153 · P0 · edge · 422 de validação sempre com CORS
**Problema:** `supabase/functions/_shared/contract-validator.ts:56` `response: createValidationErrorResponse(error)` sem headers (`contract-response.ts:67` só `Content-Type`); `versioned-contract.ts:58` idem para `UNSUPPORTED_CONTRACT_VERSION`; exceção não-Zod → 500 `{error,timestamp}` sem CORS. 24 funções usam `validateContract`: o browser recebe erro de CORS em vez do 422.
**Ação:** `validateContract(req, …)` recebe `req` e aplica `corsHeadersPara(req)` em todas as saídas.
**Verificação:** teste em `_shared/contract-validator_test.ts` afirmando `Access-Control-Allow-Origin` no 422.
**Esforço:** P · **Depende:** —

### E-154 · P0 · edge · Módulo único de erro HTTP (`_shared/http-errors.ts`)
**Problema:** ~8 formatos: envelope canônico `{code,message,fields}` (à mão em 9 funções: `conciliacao-proxy:55`, `nfe-vinculo-proxy:56`, `sefaz-manifestar:268`, `overlay-rejeicoes-auditoria:96`, `sync-profile-to-bitrix:158`, `n8n-callback:78`…); `{error,details,timestamp}` via `createErrorResponse` (49×/37 arquivos); `JSON.stringify({ error` cru (202×/68 arquivos); `{error, detalhes}` 400 (`aceitar-convite:56-59`); `{error, details: ZodError}` 400 (`processar-nf-ocr:91-94`); `{error:{message}}` (`mcp-query:308,322,421,543`); `{success:false}` (25-40×/14-16); `{ok:false}` (26×/13).
**Ação:** `problem(req, status, code, message, fields?, extra?)` → `{ code, message, fields?: [{path,message,code}], request_id }` sempre com CORS; códigos: `VALIDATION_ERROR`(422), `INVALID_JSON`(422), `UNAUTHORIZED`(401), `FORBIDDEN`(403), `NOT_FOUND`(404), `RATE_LIMITED`(429), `UPSTREAM_ERROR`(502), `SECRET_MISSING`(503), `INTERNAL`(500).
**Verificação:** `http-errors_test.ts` cobre cada código; snapshot do corpo.
**Esforço:** M · **Depende:** E-153

### E-155 · P0 · edge · `validatePayload` devolve a resposta pronta; fim do 400 fantasma
**Problema:** `_shared/validation.ts:36` `validatePayload` devolve `{success:false, error:'Invalid payload schema (Contract Violation)', details}`; `createErrorResponse` (`:84-85`) intercepta `'Contract Violation'` e responde 422 ignorando o `status` → ~25 chamadas `createErrorResponse(v.error, 400, …)` têm `400` sem efeito e enganam leitura/auditoria.
**Ação:** `validatePayload(schema, body, req)` retorna `{ ok:true, data } | { ok:false, response }` usando `problem()`; codemod nas ~60 chamadas; remover o `includes('Contract Violation')`.
**Verificação:** `rg "createErrorResponse\(.*, 400" supabase/functions` = 0.
**Esforço:** M · **Depende:** E-154

### E-156 · P0 · edge · 17 funções que respondem 400 em falha de schema passam a 422 canônico
**Problema:** `_shared/contract-coverage_test.ts:58-76` `DIVIDA_400_CONHECIDA`: aceitar-convite, api-keys-manage, comparar-benchmark-setorial, consulta-tributaria, convidar-usuario, enviar-convite-organizacao, enviar-digest-conformidade, executar-regua-cobranca, gerar-dre-tributaria, gerar-heatmap-tributario, gerar-snapshots-conformidade, mcp-query, prever-carga-tributaria, processar-nf-ocr, sso-generate-metadata, sso-initiate, sso-validate-config.
**Ação:** migrar as 17 para E-155; esvaziar `DIVIDA_400_CONHECIDA`; o ratchet passa a falhar com qualquer entrada.
**Verificação:** `deno test _shared/contract-coverage_test.ts` verde com lista vazia.
**Esforço:** M · **Depende:** E-155

### E-157 · P1 · edge · Erros ad-hoc `{error}` eliminados fora de `_shared`
**Problema:** 202 `JSON.stringify({ error` em 68 arquivos; `{success:false}`/`{ok:false}` em 27 arquivos; `send-push-notification:196` 422 de negócio sem envelope; 400 pós-schema por schema frouxo em `sincronizar-anomalia-bitrix24:127`, `gerar-sped-ecd:93-97`, `gerar-sped-ecf:90`, `categorizar-despesa:67`.
**Ação:** codemod para `problem()`; endurecer os 4 schemas (`.min(1)`, `.nonempty()`); ratchet estático em `contract-coverage_test.ts` proibindo `JSON.stringify({ error` fora de `_shared`.
**Verificação:** `rg "JSON.stringify\(\{\s*error" supabase/functions --glob '!_shared/**'` = 0.
**Esforço:** G · **Depende:** E-154

### E-158 · P1 · edge · Semântica de status documentada e testada
**Problema:** sem regra escrita: JSON malformado, schema, negócio, auth e segredo ausente misturam 400/401/422/500/503.
**Ação:** `docs/api/ERROS.md`: 422 (schema/JSON/negócio com `code` específico), 401/403 (auth), 503 (`SECRET_MISSING`), 429, 502; teste de `_shared` que varre `index.ts` por `status: 400` literal.
**Verificação:** `rg 'status: 400' supabase/functions` = 0.
**Esforço:** P · **Depende:** E-154

### E-159 · P1 · edge · Front lê `fields[]` e mostra erro por campo
**Problema:** `src/lib/edge-function-error.ts:19-25` `EdgeErrorBody` sem `fields`; `friendlyMessage` (l.81-83) usa `body.error||body.message` (hoje "Payload inválido"); o detalhe por campo se perde; 80 `functions.invoke(` em `src`, `invokeEdge` com 2 usos.
**Ação:** `EdgeErrorBody.fields`; `applyEdgeFieldErrors(form, err)` chamando `setError` do react-hook-form; adotar `invokeEdge` (tipado) nos 80 pontos.
**Verificação:** teste RTL: 422 com `fields:[{path:'email'}]` marca o campo.
**Esforço:** M · **Depende:** E-154

### E-160 · P1 · edge · Toda função exporta `createHandler(deps)` e protege o `Deno.serve`
**Problema:** 106 funções; 29 exportam `handler`/`createHandler` (9 factory); 77 só têm `Deno.serve` inline (não testáveis em memória); 22 usam `import.meta.main`; 6 exportam sem guard (api-keys-manage, ci-security-gate-log, convidar-usuario, n8n-callback, nfe-vinculo-proxy, notify-performance-alert).
**Ação:** padrão `export function createHandler(deps: Deps) {…}` + `if (import.meta.main) Deno.serve(withEdgeObservability(name, createHandler(realDeps)))`; migrar por lotes de ~15 (7 PRs).
**Verificação:** `rg -L 'createHandler|export (const|async function) handler' supabase/functions/*/index.ts` = 0; gate em E-165.
**Esforço:** G · **Depende:** —

### E-161 · P1 · edge · Harness de teste de contrato (`_shared/testing/contract-harness.ts`)
**Problema:** 65 arquivos de teste reimplementam mocks de `Deno.env`/`fetch`; sem helper de invocação, `fakeSupabase` ou assinatura HMAC; sem `assertSnapshot` (0).
**Ação:** `invoke(handler, {method, headers, body|rawBody, origin})`, `fakeSupabase()` (tabelas em memória + registro de chamadas), `fakeEnv()`, `signHmac(secret, raw, provider)`, `expectProblem(res, {status, code, fieldPaths})`.
**Verificação:** 3 testes existentes (asaas-webhook, convidar-usuario, conciliacao-proxy) reescritos com o harness e verdes.
**Esforço:** M · **Depende:** E-160 (para as funções-alvo)

### E-162 · P1 · edge · Schema exportado por função (`<fn>/schema.ts`)
**Problema:** 41 `index.ts` definem `z.object` inline; `fuzz_test.ts` só cobre os `*Schema` exportados de `_shared/validation.ts`; 16 arquivos com `.passthrough()`, 6 `z.record(z.any())` em `validation.ts`, 13 `as unknown as`.
**Ação:** mover cada schema para `schema.ts` exportando `RequestSchema` (e `ResponseSchema` quando houver); substituir `z.record(z.any())` por `z.discriminatedUnion('event', …)` nos webhooks.
**Verificação:** `rg 'z\.object' supabase/functions/*/index.ts` = 0; fuzz cobre 106 schemas.
**Esforço:** G · **Depende:** E-160

### E-163 · P1 · edge · Registro de contratos (`_shared/testing/contracts.registry.ts`)
**Problema:** não há lista única "função → schema → factory → deps → fixtures"; o gate shell (`scripts/security/zod-coverage.sh:46`) só vê `req.json()`/`parseJsonBody` (ignora `req.text()` dos 4 webhooks e `n8n-callback`, e `formData()` de `upload-anexo`/`sso-callback`).
**Ação:** registry tipado com as 106 entradas (`{name, schema, createHandler, deps, kind: 'json'|'text'|'form'|'none', auth: 'jwt'|'secret'|'hmac'|'public'}`); teste que falha se uma pasta de função não estiver no registry.
**Verificação:** `deno test contracts.registry_test.ts` verde; adicionar função nova sem registrar → vermelho.
**Esforço:** M · **Depende:** E-162

### E-164 · P1 · edge · Fixtures válidas por função (`<fn>/__contracts__/valid/*.json`)
**Problema:** sem fixture real de nenhum provedor (Asaas, Bling v3, Bitrix form-encoded, Meta/WhatsApp, n8n).
**Ação:** ≥ 1 fixture válida por função (capturada da documentação oficial ou de `webhook_claim` real anonimizado); para webhooks, 1 por `event` suportado.
**Verificação:** matriz (E-165) processa todas com 200/202.
**Esforço:** G · **Depende:** E-163

### E-165 · P0 · edge · Matriz de contrato automática: campo ausente, tipo errado, vazio, extra, JSON inválido
**Problema:** 11 testes afirmam 422 hoje; nenhum gera sistematicamente payloads inválidos; nenhum afirma CORS, `code`, `fields[].path` ou snapshot.
**Ação:** `contract_matrix_test.ts` percorre o registry e, a partir do `RequestSchema`, gera mutações: remover cada campo obrigatório; trocar tipo (string↔number↔boolean↔null); `""` e `"   "` em strings `.min(1)`; array vazio em `.nonempty()`; chave extra quando `.strict()`; JSON truncado; corpo vazio; `Content-Type` errado. Afirma `422`, CORS, `code==='VALIDATION_ERROR'`, `fields[].path` contendo o campo mutado, `assertSnapshot` do corpo.
**Verificação:** `deno task test:contracts` verde para 106 funções; cobertura ≥ 1 caso por campo obrigatório.
**Esforço:** G · **Depende:** E-161, E-163

### E-166 · P1 · edge · Matriz de segurança dos webhooks e funções com segredo
**Problema:** 11 funções com segredo/HMAC (4 webhooks, n8n-callback, ci-security-gate-log, mcp-query, webhook-retry-worker, validar-token-contador, external-data, scim-server); testes cobrem só caminho feliz + 422.
**Ação:** casos: assinatura inválida → 401 `UNAUTHORIZED`; segredo ausente → 503 `SECRET_MISSING`; replay do mesmo `externalId` → 200 idempotente sem efeito duplicado; timestamp fora da janela → 401 (após E-168); rate limit → 429; método errado → 405.
**Verificação:** 6 casos × 11 funções verdes.
**Esforço:** M · **Depende:** E-161, E-168

### E-167 · P1 · edge · Zod nas 4 funções fora do gate
**Problema:** `scim-server`, `sso-callback`, `sso-logout` sem Zod (gate baseline 3); `upload-anexo` lê `formData` sem validação (fora do gate).
**Ação:** schemas SCIM (`/Users`, `/Groups`, PATCH ops), SAML/OIDC callback (`SAMLResponse`/`code`/`state`), logout (`domain`), `upload-anexo` (`z.instanceof(File)`, tamanho, MIME); baseline → 0.
**Verificação:** `bash scripts/security/zod-coverage.sh` → "Sem validação Zod: 0".
**Esforço:** M · **Depende:** E-162

### E-168 · P0 · edge · Anti-replay temporal nos webhooks
**Problema:** `_shared/webhook-auth.ts`: 0 ocorrências de timestamp/nonce/janela; HMAC capturado é reutilizável sempre que o `externalId` for novo/sintético (asaas usa `payment:{id}:{event}`, `sha256(rawBody)`); `n8n-callback/index.ts:153-160` mantém fallback `x-n8n-secret` estático; `webhook-auth.ts:57-58` `equals()` retorna cedo se tamanhos diferem.
**Ação:** exigir header de timestamp (provedor ou `x-webhook-timestamp` para n8n) assinado junto ao corpo, janela de 5 min, nonce em `webhook_claim`; desligar o fallback estático após janela de migração; `equals()` com `timingSafeEqual` sobre hash dos dois lados.
**Verificação:** E-166 casos "timestamp fora da janela" e "replay".
**Esforço:** M · **Depende:** — · **Toca segredo/integração externa: avisar o dono.**

### E-169 · P1 · edge · Schemas de webhook tolerantes a chaves extras
**Problema:** `_shared/validation.ts:152,190,224` `.strict()` na raiz de `AsaasWebhookSchema`, `Bitrix24WebhookSchema`, `WhatsappWebhookSchema`; payloads reais trazem chaves extras (Asaas `dateCreated`/`account`; Bitrix `event_handler_id`) → 422 em evento legítimo (a confirmar com fixtures de E-164).
**Ação:** `.strip()` na raiz com `.strict()` só em `data` do `discriminatedUnion('event')`; logar chaves desconhecidas em `webhook_claim.meta` para observabilidade.
**Verificação:** fixtures reais passam; chave desconhecida gera log, não 422.
**Esforço:** P · **Depende:** E-164

### E-170 · P1 · edge · Bitrix24: aceitar `application/x-www-form-urlencoded`
**Problema:** `bitrix24-webhook/index.ts:70,99` `JSON.parse(rawBody)`; eventos nativos do Bitrix chegam form-encoded (`event`, `data[FIELDS][ID]`, `auth[application_token]`).
**Ação:** parser por `Content-Type` (form → objeto aninhado → schema); manter JSON.
**Verificação:** fixture form-encoded → 200 e `webhook_claim` gravado.
**Esforço:** P · **Depende:** E-164

### E-171 · P1 · edge · Ordem auth → rate limit → parse → validar em todos os webhooks
**Problema:** `asaas-webhook/index.ts` faz token → parse → validate e rate limit só na l.~71 (após parse); `whatsapp-webhook` rate limit após parse (~l.92); `n8n-callback` sem rate limit; teste estático de idempotência não inclui asaas.
**Ação:** middleware `webhookPipeline(auth, rateLimit, parse, validate, idempotency)` em `_shared`; incluir asaas e n8n no teste estático.
**Verificação:** `contract-coverage_test.ts` com os 5 webhooks na checagem de ordem.
**Esforço:** M · **Depende:** E-168

### E-172 · P1 · edge · `x-contract-version` liberado no CORS e no cliente
**Problema:** `_shared/cors.ts:49-54` `Allow-Headers` sem `x-contract-version` (browser não consegue enviar v2); `cors.ts:72` aceita `'*'` se `ALLOWED_ORIGINS='*'`.
**Ação:** adicionar o header; rejeitar `'*'` em produção (falhar no boot da função).
**Verificação:** preflight OPTIONS devolve o header; teste de `cors_test.ts`.
**Esforço:** P · **Depende:** —

### E-173 · P1 · edge · Versionamento generalizado (`validateVersionedContract` para N versões + upgrade)
**Problema:** `_shared/versioned-contract.ts` só nos 4 webhooks; v1 padrão, v2 = `{contract_version, data}`; `contractPayload` (l.31-35) não remove `contract_version` do corpo v1 antes do `.strict()` → v1 explícito é rejeitado; sem `Sunset`, sem métrica de uso de v1; nada em funções chamadas pelo front.
**Ação:** `defineContract({ versions: { v1: Schema1, v2: Schema2 }, upgrade: { v1: upgradeV1toV2 }, current: 'v2', sunset: { v1: '2026-03-31' } })`; handler só vê a versão corrente; resposta com `X-Contract-Version`, `Deprecation: @epoch`, `Sunset`; métrica `contract_version_usage{fn,version}` em `edge_observability`; aplicar nas 4 webhooks e nas 10 funções mais chamadas pelo front.
**Verificação:** `versioned-contract_test.ts` cobre v1 explícito, v2, desconhecida (422 com CORS), pós-sunset (410 `CONTRACT_VERSION_SUNSET`, clock injetado).
**Esforço:** G · **Depende:** E-154, E-162

### E-174 · P1 · edge · Testes de retrocompatibilidade v1 → v2
**Problema:** sem garantia de que um payload v1 congelado continue aceito e produza o mesmo efeito do v2 equivalente.
**Ação:** fixtures `__contracts__/v1/*.json` congeladas; teste: v1 → 200 e as chamadas registradas no `fakeSupabase` são iguais (snapshot) às do v2 correspondente após `upgradeV1toV2`.
**Verificação:** `deno task test:contracts` inclui `compat_test.ts` por função versionada.
**Esforço:** M · **Depende:** E-173, E-161

### E-175 · P1 · edge · Golden JSON Schema impede restringir v1 por acidente
**Problema:** alterar um schema v1 (campo novo obrigatório) quebra clientes antigos sem nenhum teste falhar.
**Ação:** gerar JSON Schema de cada versão (`z.toJSONSchema`, zod 4) e comparar com snapshot commitado; mudança em versão não-corrente exige atualizar o snapshot com justificativa na PR.
**Verificação:** mudar um `optional()` → `required` em v1 falha o teste.
**Esforço:** P · **Depende:** E-173

### E-176 · P1 · edge · Descontinuação controlada da v1 (observabilidade e corte)
**Problema:** não há dado de quem ainda envia v1 nem mecanismo de corte.
**Ação:** painel em `AdminEdgeHealth` com `contract_version_usage` por função/origem; após 30 dias sem v1, `sunset` passa a 410; runbook em `docs/runbooks/CONTRATOS.md`.
**Verificação:** painel mostra contagens; teste de 410 após sunset.
**Esforço:** M · **Depende:** E-173

### E-177 · P2 · edge · Tarefas Deno e CI de contratos
**Problema:** `deno.json` só `{"nodeModulesDir":"auto"}` (comando de teste vive só em `.github/workflows/deno-tests.yml`); gate shell não cobre `text`/`form`.
**Ação:** tasks `test`, `test:contracts`, `lint`, `check`; `deno-tests.yml` chama `deno task test:contracts`; substituir `zod-coverage.sh` por "toda função está no registry e tem ≥ 1 fixture válida".
**Verificação:** job verde; remover função do registry → vermelho.
**Esforço:** P · **Depende:** E-163, E-165 · **Regra 6.6 (workflow): PR aberta para o dono.**

### E-178 · P2 · docs · Catálogo e inventário de contratos atualizados
**Problema:** `docs/EDGE_FUNCTIONS_CATALOG.md` lista 86 de 106 funções (faltam aceitar-convite, api-keys-manage, ci-security-gate-log, conciliacao-proxy, consulta-tributaria, convidar-usuario, mcp-query, monitor-health, nfe-upload-certificado, nfe-vinculo-proxy, sefaz-dfe-*, sefaz-manifestar, upload-anexo, webhook-replay, webhook-retry-worker…).
**Ação:** gerar o catálogo a partir do registry (E-163) com colunas: corpo, schema, versão corrente, auth, `verify_jwt`, testes; `docs/agentes/sistema.md` aponta para ele.
**Verificação:** 106 entradas; teste que compara catálogo × pastas.
**Esforço:** P · **Depende:** E-163

### Fase 11 · Testes, CI e qualidade (E-179 → E-190)

### E-179 · P1 · testes · Cobertura real (`coverage.include`)
**Problema:** `vitest.config.ts:33-70` sem `include`; no Vitest 4 só arquivos importados por testes entram → thresholds 66/58/59/65 medem um subconjunto; `components` 50 testes/792 tsx (6%), `pages` 11/210 (5%).
**Ação:** `coverage.include: ['src/**/*.{ts,tsx}']`; recalibrar thresholds à medida real e ratchet "só sobe".
**Verificação:** relatório lista arquivos sem teste; CI verde com novo piso.
**Esforço:** P · **Depende:** —

### E-180 · P1 · ci · `lint:strict` no CI e plugins ativados
**Problema:** `ci.yml:296` `bun run lint` (warnings não bloqueiam); `eslint.config.js:85,87,97,106` rebaixam `no-explicit-any`, `exhaustive-deps`, `no-unused-vars`, `ban-ts-comment` para `warn`; zona estrita (l.~148-185) inclui `supabase/functions/**` que está em `ignores` (l.~17) — config morta; `eslint-plugin-react`, `jsx-a11y`, `import`, `eslint-config-prettier` instalados e não configurados.
**Ação:** `lint:strict` com baseline por regra (ratchet) → `error` progressivo; ativar `jsx-a11y` (recommended) e `import/no-cycle`; remover a zona morta.
**Verificação:** CI falha em warning novo.
**Esforço:** M · **Depende:** — · **Regra 6.6 (workflow): PR aberta para o dono.**

### E-181 · P1 · testes · Testes das páginas críticas e dos guardas
**Problema:** 0 testes importam `ContasPagar`, `ContasReceber`, `Conciliacao`, `FluxoCaixa`, `Boletos`, `PixHub`, `Tesouraria`, `Usuarios`, `Seguranca`, `AuditLogs`, `Auth`, `ResetPassword`, `Index`, `Aprovacoes`; sem teste de `ProtectedRoute`, `AuthProvider`, `export-utils`.
**Ação:** smoke render + estados (loading/erro/vazio) para as 14 páginas; testes de `ProtectedRoute` (E-031), `AuthProvider` (E-036), `export-utils` (E-001/E-004).
**Verificação:** 17 arquivos de teste novos verdes.
**Esforço:** G · **Depende:** E-118

### E-182 · P1 · testes · E2E contra build de produção
**Problema:** `playwright.critical.config.ts:45` `command: 'npm run dev'` (não testa bundle, CSP nem headers); `retries: 2` em CI (l.23); 4 `waitForTimeout(500)` (`contas-pagar.e2e.ts:97,242`, `fixtures.ts:71`, `visual-theme.e2e.ts:152`); 8 skips condicionais por credenciais (`e2e/auth/login.e2e.ts:60`, `admin-rbac.e2e.ts:110`, `dashboard.e2e.ts:18,65`, `logout-real:22`, `calculadora-tributaria:11`, `visual-theme:133`, `auth.setup.ts:25`) → gate verde sem testar.
**Ação:** `vite build && vite preview` nos 3 gates; `retries: 1`; `waitFor` por estado; skip por credencial vira **falha** no CI (`process.env.CI && !creds → throw`).
**Verificação:** job falha sem credenciais; CSP violações aparecem no console do E2E.
**Esforço:** M · **Depende:** — · **Regra 6.6 (workflow/segredos): PR aberta para o dono.**

### E-183 · P2 · ci · Suíte roda uma vez; gates de banco não ficam "inconclusivos" em silêncio
**Problema:** `ci.yml:456` `test:run` e `:468` `test:coverage` executam a suíte duas vezes; gates de banco viram "inconclusivo" sem `PROD_DB_URL` (~l.519-526) e passam.
**Ação:** só `test:coverage --reporter=junit`; gates de banco obrigatórios em PR de branch interna (`github.event.pull_request.head.repo.full_name == github.repository`).
**Verificação:** tempo do job cai; PR interna sem `PROD_DB_URL` fica vermelha.
**Esforço:** P · **Depende:** — · **Regra 6.6: PR aberta para o dono.**

### E-184 · P2 · ci · Orçamento de bundle em gzip com limite total
**Problema:** orçamento atual 600 kB por chunk sem gzip; `chunkSizeWarningLimit: 1200`; `reportCompressedSize: false`.
**Ação:** `size-limit` (ou script) com entry ≤ 250 kB gz, total inicial ≤ 600 kB gz, por rota ≤ 300 kB gz; relatório na PR.
**Verificação:** PR com regressão de 10% falha.
**Esforço:** P · **Depende:** E-077 · **Regra 6.6: PR aberta para o dono.**

### E-185 · P2 · testes · Vitest por projetos (unit / a11y / fuso)
**Problema:** uma configuração para 288 arquivos; a11y e fuso (E-028, E-109) precisam de `env`/`setup` próprios.
**Ação:** `test.projects` em `vitest.config.ts`: `unit`, `a11y` (vitest-axe, sem desligar regras), `tz` (`TZ=America/Sao_Paulo`).
**Verificação:** `bun run test:run` executa os 3.
**Esforço:** P · **Depende:** E-028

### E-186 · P2 · ci · `tsconfig` sem configuração órfã e ratchet útil
**Problema:** `tsconfig.app.json` `strict:false`/`noImplicitAny:false` referenciado só por `scripts/maintenance/config.json:4,15` (não por `tsconfig.json`, Vite, `package.json` nem CI); `tsconfig.json:14` `noUncheckedIndexedAccess:false`; `scripts/ci/baselines/strictnullchecks-baseline.txt` tem 0 linhas (gate redundante com `type-check`).
**Ação:** apagar `tsconfig.app.json` (ajustar `scripts/maintenance/config.json`); reaproveitar o ratchet para `noUncheckedIndexedAccess`.
**Verificação:** `type-check` verde; ratchet com baseline inicial e "só encolhe".
**Esforço:** M · **Depende:** —

### E-187 · P2 · ci · Drift de `types.ts` bloqueado no CI
**Problema:** `types.ts` defasado gera 53 `as never` (E-060); PR #523 corrige o drift atual, mas nada impede o próximo.
**Ação:** job que roda `supabase gen types --project-id … --schema public` e compara com `src/integrations/supabase/types.ts` (falha com diff).
**Verificação:** alterar uma coluna no banco sem regenerar → CI vermelho.
**Esforço:** P · **Depende:** PR #523 · **Regra 6.6 (workflow/segredo): PR aberta para o dono.**

### E-188 · P3 · testes · Testes de cache do TanStack (chaves e invalidação)
**Problema:** colisões de E-046..E-048 passaram pela suíte.
**Ação:** teste utilitário que renderiza os hooks de uma mesma raiz e afirma que `invalidateQueries(raiz)` atualiza todos; teste que falha se duas `queryFn` diferentes compartilharem a mesma key exata.
**Verificação:** suíte falha com o código atual e passa após E-046..E-049.
**Esforço:** M · **Depende:** E-049

### E-189 · P3 · ci · `knip` para código morto e dependências
**Problema:** ~30 primitivos, 3 hooks e 14 dependências sem uso só foram vistos por auditoria manual.
**Ação:** `knip` no `quality-gate` com baseline que só encolhe.
**Verificação:** job verde; adicionar export órfão → vermelho.
**Esforço:** P · **Depende:** E-145, E-147 · **Regra 6.6 (workflow): PR aberta para o dono.**

### E-190 · P3 · docs · Documentação técnica alinhada ao código
**Problema:** `AGENTS.md §1` cita "Vite 6, React 18" (real: Vite 8, React 19.3); `docs/PERFORMANCE.md`, `docs/ACCESSIBILITY.md`, `docs/TESTING.md` não refletem E-066+, E-091+, E-179+; `docs/agentes/sistema.md` cita 105 Edge Functions (há 106).
**Ação:** atualizar após cada fase; este plano ganha coluna "estado" por etapa.
**Verificação:** docs revisados; `check-claude-md-integrity` verde.
**Esforço:** P · **Depende:** —

---

## 4. Ordem de execução sugerida (ondas)

| Onda | Etapas | Critério |
|---|---|---|
| 1 · agora (P0) | E-001, E-002, E-003, E-004, E-017, E-018, E-042, E-043, E-050, E-051, E-153, E-154, E-155, E-156, E-165, E-168, E-029, E-030, E-066, E-067 | segurança, dinheiro, dado errado |
| 2 · P1 que destrava o resto | E-005, E-011, E-013, E-031, E-032, E-044..E-049, E-052..E-055, E-068..E-073, E-091..E-096, E-100, E-101, E-117, E-118, E-131, E-139..E-141, E-157..E-164, E-166, E-167, E-169..E-176, E-179..E-182 | bug visível ao usuário ou pré-requisito |
| 3 · P2 | restantes P2 | qualidade/perf/a11y |
| 4 · P3 | restantes P3 | higiene |

Regra prática: **uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR**, exceto etapas marcadas como codemod em lote (E-093, E-096, E-141, E-157, E-160) que podem ser divididas por módulo.
Etapas com **Regra 6.6** ficam com a PR aberta aguardando o dono (CI/workflows, segredos, DDL, integrações externas, custo).

## 5. Apêndice · exemplos de correção

### 5.1 Escape de HTML na exportação (E-001)
```ts
// src/lib/html-escape.ts
const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c]);

// export-utils.ts (trecho)
const cell = `<td>${escapeHtml(value)}</td>`;
const win = window.open('', '_blank', 'noopener');
win!.document.body.innerHTML = DOMPurify.sanitize(html);
win!.addEventListener('load', () => win!.print());
```

### 5.2 CSV sem injeção de fórmula (E-004)
```ts
const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
```

### 5.3 Data-only em fuso local (E-017, E-020)
```ts
// src/lib/formatters.ts
export const parseDateOnly = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d); // meia-noite LOCAL
};
// useAcordosParcelamento.ts
let venc = parseDateOnly(data.data_primeiro_vencimento);
```

### 5.4 Centavos inteiros com distribuição do resto (E-018)
```ts
const totalCents = valueToCents(valorTotalAcordo);
const base = Math.floor(totalCents / n);
const resto = totalCents - base * n;
const parcelasCents = Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));
```

### 5.5 Layout route persistente (E-066)
```tsx
// financeiroRoutes.tsx
<Route element={
  <ProtectedRoute>
    <MainLayout>
      <Suspense fallback={<PageSkeleton />}><Outlet /></Suspense>
    </MainLayout>
  </ProtectedRoute>
}>
  <Route path="/contas-pagar" element={<ContasPagar />} />
  …
</Route>
```

### 5.6 Predicado de retry (E-043)
```ts
const NAO_REPETIR = /^(PGRST|42501|22|23)/;
export const shouldRetry = (count: number, err: unknown) => {
  const e = err as { status?: number; code?: string; context?: { status?: number } };
  const status = e?.status ?? e?.context?.status;
  if (status && status >= 400 && status < 500) return false;
  if (e?.code && NAO_REPETIR.test(e.code)) return false;
  return count < 3;
};
```

### 5.7 Seletor ESLint correto (E-011)
```js
"MemberExpression[object.object.type='MetaProperty'][object.property.name='env'][property.name=/^VITE_/]"
```

### 5.8 Envelope único de erro (E-154)
```ts
// _shared/http-errors.ts
export type Field = { path: string; message: string; code: string };
export function problem(req: Request, status: number, code: string, message: string, fields?: Field[]) {
  return new Response(JSON.stringify({ code, message, fields, request_id: requestId(req) }), {
    status, headers: { ...corsHeadersPara(req), 'Content-Type': 'application/json' },
  });
}
export const validationProblem = (req: Request, err: z.ZodError) =>
  problem(req, 422, 'VALIDATION_ERROR', 'Payload inválido', err.issues.map(i => ({
    path: i.path.join('.') || '$', message: i.message, code: i.code,
  })));
```

### 5.9 Harness e matriz de contrato (E-161, E-165)
```ts
// _shared/testing/contract-harness.ts
export const invoke = (h: Handler, o: { method?: string; headers?: Record<string,string>; body?: unknown; rawBody?: string }) =>
  h(new Request('http://local/fn', { method: o.method ?? 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://app.test', ...o.headers },
    body: o.rawBody ?? (o.body === undefined ? undefined : JSON.stringify(o.body)) }));

export async function expectProblem(res: Response, want: { status: number; code: string; fieldPaths?: string[] }) {
  assertEquals(res.status, want.status);
  assert(res.headers.get('access-control-allow-origin'));
  const body = await res.json();
  assertEquals(body.code, want.code);
  for (const p of want.fieldPaths ?? []) assert(body.fields.some((f: Field) => f.path === p));
}

// contract_matrix_test.ts (trecho)
for (const c of registry) {
  for (const m of mutate(c.schema, c.fixtures.valid[0])) {   // ausente · tipo errado · vazio · extra · JSON inválido
    Deno.test(`${c.name} · ${m.label}`, async () => {
      const res = await invoke(c.createHandler(fakeDeps()), { rawBody: m.raw });
      await expectProblem(res, { status: 422, code: 'VALIDATION_ERROR', fieldPaths: m.paths });
      await assertSnapshot(t, await res.clone().json());
    });
  }
}
```

### 5.10 Contrato versionado com upgrade (E-173)
```ts
const contrato = defineContract({
  versions: { v1: AsaasV1, v2: AsaasV2 },
  current: 'v2',
  upgrade: { v1: (p: AsaasV1T): AsaasV2T => ({ contract_version: 'v2', data: { ...p, id: p.payment.id } }) },
  sunset: { v1: '2026-03-31' },
});
const r = contrato.parse(req, body, { now }); // { ok, version, data(v2), response? }
// resposta: X-Contract-Version: v1 · Deprecation: @1767225600 · Sunset: Tue, 31 Mar 2026 00:00:00 GMT
```

### 5.11 Botão com ícone acessível (E-091)
```tsx
<Button variant="ghost" size="icon" aria-label="Notificações" title="Notificações">
  <Bell className="h-4 w-4" aria-hidden />
  {naoLidas > 0 && <span className="sr-only">{naoLidas} não lidas</span>}
</Button>
```

---

*Fim do plano. 190 etapas: 16 segurança · 12 dinheiro/datas · 13 auth · 24 dados/query · 25 perf · 26 a11y · 14 UX · 8 responsividade · 14 design system · 26 contratos Edge/webhooks · 12 testes/CI.*
