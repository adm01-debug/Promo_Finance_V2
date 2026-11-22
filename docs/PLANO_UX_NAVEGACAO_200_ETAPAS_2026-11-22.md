# Plano UX de Navegação — 200 etapas (2026-11-22)

> Avaliação da experiência de transição entre telas e funções do Promo Finance, com foco em
> navegabilidade: botão "Voltar", histórico, trilha de navegação, transições, consistência,
> acessibilidade, fluxos multi-etapas, métricas e integração com busca, modais e multi-aba.
> Documento de **plano**: nada aqui foi aplicado. Em conflito com este arquivo, vale `AGENTS.md`.

## 0. Diagnóstico do estado atual

Levantado por leitura do código em `main` @ `856fef0` (2026-11-22): 83 fatos verificados com
`arquivo:linha` e contagens por `rg`. O produto **não** parte do zero — há `useSmartBack` com pilha
in-app, `ModalHistoryManager` que faz o Voltar fechar modal, trilha derivada de `ROUTE_META`,
restauração de scroll própria, guarda de não-salvos, swipe-back no mobile e 13 atalhos de teclado.
O problema é cobertura desigual: o que existe vale para parte das telas.

Números que resumem o estado:

| Métrica | Valor |
|---|---|
| Rotas declaradas | 130 (127 com `lazy`) |
| Rotas aninhadas (`<Outlet>`) | 0 |
| Páginas que montam `<MainLayout>` por dentro | 89 |
| Rotas que montam o shell por fora, na própria rota | 10 |
| Rotas sem shell algum (sem sidebar, trilha ou Voltar) | 19 |
| `navigate(-1)` real no app | 1 (dentro de `useSmartBack`) |
| `window.history.back()` cru | 14 |
| Rótulos "Voltar" com destino próprio | 13 · `ArrowLeft` em 23 arquivos (53 usos) |
| `BackButton` compartilhado | 3 pontos de uso |
| Arquivos com overlay (`DialogContent`/`SheetContent`/`Drawer`) | 164 |
| Modais com URL própria | 0 |
| Entradas em `ROUTE_META` | 119 (0 metadados órfãos; 11 rotas públicas/dev sem meta) |
| Arquivos com `<Tabs>` | 90 · com aba na URL (`useUrlTab`) | 4 |
| Formulários que declaram a guarda de não-salvos | 2 |
| `useBlocker`/`unstable_usePrompt` | 0 |
| Eventos de navegação na telemetria | 0 (só erro e Web Vitals) |
| Specs E2E que tocam navegação | 2 de 28 (uma desatualizada) · `test.skip` em E2E | 7 |

| Área | Estado atual | Evidência |
| --- | --- | --- |
| Layout/shell | Sem rotas aninhadas: 130 rotas irmãs, 127 lazy, Suspense único. O shell é aplicado em dois lugares (89 páginas por dentro + 10 rotas por fora) e 19 rotas rodam sem shell algum. MainLayout remonta em cada troca de rota, então colapso da sidebar e drawer não persistem. | `<Outlet` = 0; `path=` = 130 (src/App.tsx + src/routes/*Routes.tsx); `lazy(` = 127; src/App.tsx:59; `<MainLayout` em 89 páginas + src/routes/{geral:42,52; contabil:52; admin:42,68,102,112; analise:46,64; financeiro:122}; src/routes/tributarioRoutes.tsx sem MainLayout; src/components/layout/MainLayout.tsx:31-32; ResponsiveSidebar.tsx:18 |
| Voltar | Um único `navigate(-1)` real, dentro de um Voltar semântico com pilha in-app e fallback para rota-pai; 4 consumidores (botão, teclado, swipe, guard). Mas o BackButton só existe em 3 lugares, e há 13 rótulos "Voltar" e 53 ArrowLeft com destino próprio, incluindo `history.back()` cru no 404. | src/hooks/useSmartBack.ts:49-66; src/lib/navigation.ts:292,345-390; `window.history.back()` = 14; BackButton em ContextualBreadcrumbs.tsx:150, MobileHeader.tsx:15, ScimAudit.tsx:150; NotFound.tsx:57; AnomaliaDetalhe.tsx:24,63,83,114,148; ArrowLeft = 53 em 23 arquivos |
| Histórico/modais | Voltar fecha modal via marcador de histórico por dialog, cobrindo aninhados, forward real e marcador órfão pós-reload, sem mudar os 164 arquivos de overlay. Nenhum modal tem URL. O drawer mobile fica fora desse mecanismo (aside próprio, sem role=dialog/foco preso/Escape). | src/components/navigation/ModalHistoryManager.tsx:24-39,78-88,100-104; src/lib/unsaved-guard.ts:12; 149 DialogContent + 10 SheetContent + 5 Drawer = 164 arquivos; src/components/layout/sidebar/MobileSidebarDrawer.tsx:28-36 |
| Breadcrumbs | Trilha derivada de ROUTE_META com 119 entradas e zero deriva frente às rotas privadas; esconde em raiz e em trilha de 1 nível; labels dos pais invisíveis no mobile; ausente nas 19 rotas sem shell. | src/components/navigation/ContextualBreadcrumbs.tsx:79-128,131-137,173; ROUTE_META = 119 entradas (src/lib/navigation.ts:25+); diff rotas↔meta: 11 rotas sem meta (públicas/dev/param), 0 metadados órfãos; MainLayout.tsx:104 |
| Títulos e foco por rota | `document.title` por rota com fallback genérico em rota sensível, e foco movido para #main-content a cada troca de pathname (com MutationObserver para rota lazy). Sem região aria-live. | src/components/providers/NavigationTracker.tsx:54,58,77-97; MainLayout.tsx:87; MobileHeader.tsx:16-20 |
| Transições | AnimatePresence keyed por pathname, default blur-rise 350ms, 4 rotas com efeito próprio por `startsWith`, reduced-motion respeitado em dois níveis. Só dentro do MainLayout. | transitions/PageTransition.tsx:18-21; TransitionProvider.tsx:12; routeTransitions.ts:7-12; useTransition.ts:20; src/App.tsx:108; MainLayout.tsx:92,116 |
| Loading | Fallback de rota é um spinner genérico, igual para as 127 rotas; sem skeleton por rota. Prefetch de rota por idle callback cobre 17 rotas; 36 pollings rodam em paralelo. | src/components/ui/loading-skeleton.tsx:253; src/hooks/usePrefetchRoutes.ts:12-46; DataPrefetcher.tsx:13; `refetchInterval` = 36 (ex. useAnomaliaDetectionRun.ts:43); PrefetchOnVisible sem consumidor |
| Scroll | Sem ScrollRestoration do router: implementação própria por location.key restaura em POP e sobe ao topo em rota nova; 3 scrollIntoView pontuais, com ressalva em lista virtualizada. | `ScrollRestoration` = 0; NavigationTracker.tsx:17,28-36,68-73; useHighlightFromUrl.ts:68; InteligenciaOperacional.tsx:21; Movimentacoes.tsx:152 |
| URL como estado | Aba na URL existe e é bem feita (useUrlTab) mas só em 4 de 90 arquivos com Tabs; filtros e paginação ficam fora da URL (estado local ou localStorage); deep-link de linha funciona em 5 páginas. | src/hooks/useUrlTab.ts:10-40 usado em Seguranca.tsx:19, Integracoes.tsx:50, Configuracoes.tsx:81, Asaas.tsx:56; `<Tabs` em 90 arquivos; Demonstrativos.tsx:54; useConciliacaoPageState.ts:10,37-39; useHighlightFromUrl.ts:23-44 em 5 páginas; ui/pagination.tsx:125; `useSearchParams` em 10 arquivos |
| Guarda de não-salvos | Infra completa (clique em link, Voltar/swipe por sentinela, beforeunload, coalescência de pops), porém declarada por apenas 2 formulários; nenhum useBlocker. | src/components/navigation/UnsavedGuardProvider.tsx:68,124,175,206; ContaPagarForm.tsx:69; ContaReceberForm.tsx:122; `useBlocker`/`unstable_usePrompt` = 0; src/lib/telemetry.ts:305 |
| Mobile/drawer/bottom nav | App-bar com Voltar + título, bottom nav de 4 destinos fixos com aria-current e badge, swipe-back de borda. O drawer reusa os 91 itens do desktop, sem busca; o shell desktop pisca antes de o breakpoint resolver. | MobileHeader.tsx:14-20; MobileBottomNav.tsx:22-46,102; useSwipeBack.ts:16-18; SidebarNavGroups.tsx (50 hrefs) + sidebarFiscalNavGroup.ts (41 hrefs); use-mobile.tsx:6,19 |
| Atalhos | 13 atalhos Alt+letra, Alt+←/→/Home com casos de borda tratados, e ações rápidas por atributo no DOM. Ctrl+K tem dois listeners globais concorrentes, e o campo de busca do Header é decorativo. | useKeyboardShortcuts.ts:34-207,145,117,127,137; useKeyboardNavigation.ts:34-58; CommandPalette.tsx:32; Header.tsx:115-120 |
| Paleta de comandos | Global, 51 comandos (31 navegação + 20 gestão) com busca por keywords e navegação sob a guarda de não-salvos; lista escrita à mão, não derivada das 130 rotas. | src/App.tsx:51; CommandPalette.tsx:51-88; commandPaletteNavigation.ts (31 `title:`) + commandPaletteManagement.ts (20 `title:`) |
| Fluxos multi-etapas | 4 wizards, cada um com estado de etapa local e nenhum na URL; só o SPED-ECF persiste rascunho. O componente `ui/wizard` (401 linhas, com Stepper) é código morto; onboarding tem dois tours montados juntos. | SSOWizardDialog.tsx:22,137-138; SpedEcdWizard.tsx:55; sped-ecf-wizard/useSpedEcfWizardState.ts:26,47-82; OnboardingTributario.tsx:322; src/components/ui/wizard.tsx sem importador; GuidedTour.tsx:62-63 + OnboardingTour.tsx:54-66 em MainLayout.tsx:55-58 |
| PWA/manifest | Standalone, start_url e scope '/', portrait-primary, 3 atalhos de app; ícones só SVG + favicon.ico 48px. Deep-link anônimo perde o destino pois o redirect não é escrito no gate de rota. | public/manifest.json; src/components/auth/ProtectedRoute.tsx:45 vs src/pages/Auth.hooks.ts:37-41; `?redirect=` escrito só em AceitarConvite.tsx:28 e edge-function-error.ts:209 |
| Telemetria | Só erro e Web Vitals; nenhum evento de page view ou de navegação. O único sinal de navegação é o breadcrumb 'nav_back', que sobe apenas anexado a um erro; paths sensíveis são redigidos. | src/lib/telemetry.ts:262-300,21,251,27; `page_view`/`analytics` = 0 em src/lib; useSmartBack.ts:53; navigation.ts:395-404 |
| Testes | Camada pura de navegação tem teste unitário (5 arquivos); ModalHistoryManager, UnsavedGuardProvider e NavigationTracker não têm. Dos 28 specs E2E, 2 tocam navegação por texto de botão e um deles está desatualizado; 7 skips. | src/lib/__tests__/navigation.test.ts, src/lib/navigation-intent.test.ts, BackButton.test.tsx, useKeyboardNavigation.test.tsx, sidebarNavState.test.ts; 28 `*.e2e.ts`; login.e2e.ts:151,155; error-states.e2e.ts:16,25 vs NotFound.tsx:65; `test.skip` = 7 em e2e, 0 em src |
## 1. Princípios e referências

1. **O Voltar nunca sai do app nem fecha a aba.** Quando não há passo anterior in-app, sobe para a
   rota-pai. Base: Material Design 3 — Navigation (https://m3.material.io/foundations/layout/understanding-layout/overview)
   e Apple HIG — Navigation and search (https://developer.apple.com/design/human-interface-guidelines/navigation-and-search).
2. **Um Voltar só, em um componente só.** Rótulo, ícone, posição e comportamento idênticos em
   desktop e mobile. Base: NN/g — "Back" button behavior (https://www.nngroup.com/articles/back-button/).
3. **A URL é o estado.** Aba, filtro, página e item selecionado pertencem à URL, não ao estado
   local: é o que torna o Voltar, o recarregar e o link compartilhado previsíveis. Base:
   react-router 7 data APIs (https://reactrouter.com/start/data/route-object).
4. **Mudança de rota é anunciada.** Título, foco e região viva. Base: WCAG 2.2 — 2.4.2 Page Titled,
   2.4.3 Focus Order, 3.2.3 Consistent Navigation, 3.2.5 Change on Request
   (https://www.w3.org/WAI/WCAG22/quickref/).
5. **Nada de movimento imposto.** Transições respeitam `prefers-reduced-motion`; a View Transitions
   API só entra onde degrada bem (https://developer.chrome.com/docs/web-platform/view-transitions).
6. **Ação irreversível pede confirmação; trabalho em andamento pede guarda.** Sair de um fluxo
   nunca descarta dado em silêncio.
7. **Navegação se mede.** Sem evento de page view e de uso do Voltar, qualquer melhoria aqui é
   opinião. Base: web.dev — Measure navigation (https://web.dev/articles/navigation-and-resource-timing).

## 2. As 200 etapas

Formato de cada etapa: prioridade, descrição com evidência, exemplo prático ancorado no repo,
benefícios e impacto × esforço (esforço: P ≤ 1h · M ≤ 1 dia · G > 1 dia).

- **P0** — quebrado hoje ou bloqueia uso real: 16 etapas.
- **P1** — atrito que o usuário sente todo dia: 64 etapas.
- **P2** — melhoria perceptível: 96 etapas.
- **P3** — refinamento: 24 etapas.

### 2.1 Navegação e controle de fluxo (N-001 → N-050)

### N-001 · P0 · Voltar do 404 pode jogar o usuário fora do app
**Descrição:** `src/pages/NotFound.tsx:57` chama `window.history.back()` cru — é o único Voltar do app que não passa pelo `useSmartBack`. Quem chega ao 404 por link de e-mail, QR de boleto ou atalho do PWA tem só uma entrada no histórico: o Voltar devolve o usuário ao Gmail/WhatsApp em vez de ao sistema. Todos os outros 13 pontos de Voltar respeitam a pilha in-app (`src/hooks/useSmartBack.ts:49-66`). Padrão de referência: NN/g, "The Back Button" (https://www.nngroup.com/articles/back-button/).
**Exemplo prático:** em `NotFound.tsx`, trocar o `onClick={() => window.history.back()}` por `const { goBack, backLabel } = useSmartBack('button')` e usar `onClick={goBack}` com rótulo `Voltar para {backLabel}`. O hook já resolve a rota-pai com `replace` quando `previousNavEntry()` é `undefined`.
**Benefícios:** link quebrado deixa de ser saída do produto; o usuário volta para uma tela financeira real em um clique.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-002 · P0 · Deep link anônimo perde o destino no login
**Descrição:** `src/components/auth/ProtectedRoute.tsx:45` faz `<Navigate to="/auth" replace />` sem `?redirect=`, embora `redirectPosLogin()` em `Auth.hooks.ts` já leia e valide o param (rejeita `//` e `\` contra open redirect). Hoje só `AceitarConvite.tsx:28` e `edge-function-error.ts:209` escrevem o param. Resultado: o contador que recebe o link de um lançamento específico e não está logado cai no dashboard genérico e tem de refazer a navegação em 130 rotas.
**Exemplo prático:** em `ProtectedRoute`, montar `const to = \`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}\`` e navegar para ele; a validação do destino já existe no `redirectPosLogin()` e não precisa mudar.
**Benefícios:** todo link compartilhado (aprovação, conciliação, anomalia) chega ao destino certo depois do login; menos ida e volta para papel contador/visualizador.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-003 · P0 · 19 rotas renderizam sem sidebar, breadcrumb ou Voltar
**Descrição:** 29 páginas de rota não chamam `<MainLayout>` e só 10 recebem o layout no roteador, logo 19 rotas ficam sem shell. `src/routes/tributarioRoutes.tsx` tem zero ocorrência de `MainLayout` e `src/pages/tributario/CalculadoraTributaria.tsx` não o importa. Nessas telas não há sidebar, não há `ContextualBreadcrumbs`, não há `MobileHeader` com Voltar e não há `MobileBottomNav` — o usuário fica preso, dependendo do Voltar do navegador.
**Exemplo prático:** envolver o bloco de rotas em `tributarioRoutes.tsx` com o shell, como já é feito em `src/routes/geralRoutes.tsx:42`: `element={<ProtectedRoute><MainLayout><CalculadoraTributaria /></MainLayout></ProtectedRoute>}`. Fazer uma PR por arquivo de rotas para não misturar domínios.
**Benefícios:** as 38 rotas tributárias passam a ter saída visível; fim do beco sem saída na calculadora e nos relatórios fiscais.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-004 · P0 · Três rotas de diagnóstico abertas em produção
**Descrição:** `src/App.tsx:68-71` declara `/status`, `/design-system-debug` e `/theme-diagnostics` fora de `ProtectedRoute` e sem gate de ambiente — só `/__especimes` está atrás de `import.meta.env.DEV`. São rotas de debug navegáveis por qualquer visitante anônimo de um sistema financeiro multi-empresa.
**Exemplo prático:** aplicar o mesmo gate das especimes: `{import.meta.env.DEV && <Route path="/design-system-debug" ... />}` para as duas de design/tema; `/status` fica, mas dentro de `ProtectedRoute` com papel admin, como as rotas de `adminRoutes.tsx`.
**Benefícios:** reduz a superfície pública do app e tira telas internas do alcance de quem recebe um link do sistema.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-005 · P0 · Teste E2E de 404 aponta para rótulo e rota que não existem
**Descrição:** `e2e/error-states.e2e.ts:25` clica em `'Voltar para o Início'`, mas a página rotula `'Ir para Início'` (`NotFound.tsx:65`); e `:16` navega para `/dashboard/contas-receber`, enquanto a rota real é `/contas-receber`. O teste de erro mais básico do produto está verde por acidente ou vermelho por motivo errado — não protege nada.
**Exemplo prático:** corrigir o seletor para `getByRole('link', { name: 'Ir para Início' })` e a URL para `/contas-receber`, aproveitando a mesma PR para validar que o Voltar do 404 permanece in-app depois de N-001.
**Benefícios:** o único teste automatizado de rota inválida volta a ser evidência real antes de cada deploy.
**Impacto × esforço:** Médio × P · **Depende:** N-001

### N-006 · P1 · Shell como rota de layout, com Outlet
**Descrição:** não há uma única rota aninhada: zero ocorrências de `<Outlet` em `src` e as 130 rotas são irmãs em `<Routes>` (`src/App.tsx:63-90`). O shell está aplicado em dois lugares diferentes — 89 páginas chamam `<MainLayout>` dentro de si (ex. `src/pages/ContasPagar.tsx:124`) e 10 rotas o aplicam no roteador. Isso é a causa raiz de N-003, N-007 e N-030. Padrão: rotas aninhadas do React Router (https://reactrouter.com/start/library/routing).
**Exemplo prático:** criar `src/routes/AppShellLayout.tsx` com `<MainLayout><Outlet /></MainLayout>` e, nesta PR, convertê-lo apenas para o domínio `geral` (`geralRoutes.tsx`): um `<Route element={<AppShellLayout />}>` envolvendo as 19 rotas, removendo o `<MainLayout>` de dentro das páginas correspondentes.
**Benefícios:** o shell deixa de remontar a cada rota; a sidebar, a trilha e o estado de menu sobrevivem à troca de tela.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-007 · P1 · Sidebar colapsada volta a abrir a cada troca de tela
**Descrição:** como o `MainLayout` monta dentro de cada página, `sidebarCollapsed` e `mobileMenuOpen` são `useState` locais (`src/components/layout/MainLayout.tsx:30-31`) e o `collapsed` do `ResponsiveSidebar.tsx:18` também — nada persiste. Quem trabalha em monitor pequeno colapsa a sidebar para ver a tabela de contas a pagar e, ao abrir um lançamento, ela volta aos 280px. Existe `usePersistedState` tolerante a storage indisponível (`src/lib/persisted-ui-state.ts:7-29`) com só 2 consumidores.
**Exemplo prático:** trocar o `useState(false)` de `sidebarCollapsed` por `usePersistedState('ui:sidebar_collapsed', false)` e passar o valor inicial para `ResponsiveSidebar`, que hoje mantém cópia própria.
**Benefícios:** largura útil de tabela financeira preservada entre telas; menos clique repetido no uso diário.
**Impacto × esforço:** Médio × P · **Depende:** N-006

### N-008 · P1 · Carregamento de rota é um spinner único para 127 chunks
**Descrição:** os 127 chunks lazy de rota (118 em `src/routes/*Pages.ts` + 9 em `App.tsx`) ficam atrás de um Suspense único (`src/App.tsx:59`) cujo fallback é o spinner genérico `PageLoading` com texto 'Carregando...' (`src/components/ui/loading-skeleton.tsx:253`). A tela inteira desaparece: sidebar, trilha e título somem e voltam. Só `SRECommandCenter.tsx:134-146` e `ui/lazy-load` têm Suspense interno. Padrão: web.dev, "Optimize Cumulative Layout Shift" (https://web.dev/articles/optimize-cls).
**Exemplo prático:** com o shell em rota de layout (N-006), mover o `<Suspense>` para dentro do `AppShellLayout`, ao redor do `<Outlet />`, e usar o `TableShimmerSkeleton` já existente em `loading-skeleton.tsx` como fallback para o grupo financeiro.
**Benefícios:** a estrutura da tela não pisca entre rotas; o usuário percebe que está no mesmo app e já vê a forma da tabela que vai chegar.
**Impacto × esforço:** Alto × M · **Depende:** N-006

### N-009 · P1 · Shell desktop monta antes de virar mobile
**Descrição:** `useIsMobile` retorna `false` no primeiro render (breakpoint 768, `src/hooks/use-mobile.tsx:6,19`), então no celular o `MainLayout` monta `ResponsiveSidebar` + `Header` desktop e só depois troca por `MobileHeader` + `MobileBottomNav` (`MainLayout.tsx:39-48`). Em PWA instalado isso é a primeira coisa que o usuário vê a cada abertura.
**Exemplo prático:** inicializar o estado do hook com `window.matchMedia('(max-width: 767px)').matches` em vez de `undefined`/`false`, mantendo o listener; o `motion.main` já lê `isMobile` para `marginLeft` e passa a acertar de primeira.
**Benefícios:** fim do salto de layout na abertura do PWA; primeira pintura já com a navegação correta.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-010 · P1 · Menu mobile não é um modal: Voltar não fecha, Escape não fecha
**Descrição:** `MobileSidebarDrawer` é um `motion.aside` próprio sem `role="dialog"`, sem `aria-modal`, sem foco preso e sem Escape (`src/components/layout/sidebar/MobileSidebarDrawer.tsx:28-36`). O marcador de histórico cobre só `[role="dialog"][data-state="open"]` (`src/lib/unsaved-guard.ts:12`), então o drawer fica fora do Voltar-fecha-modal e fecha só por backdrop/X — ou pela remontagem do `MainLayout`. Com os 91 itens de navegação dentro dele, é a maior superfície mobile do app. WCAG 2.2, 2.1.2 No Keyboard Trap (https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html).
**Exemplo prático:** reimplementar o drawer com o `Sheet` do shadcn já presente (`SheetContent` é usado em 10 arquivos) ou, no mínimo, adicionar `role="dialog" aria-modal="true" data-state={isOpen ? 'open' : 'closed'}` ao `motion.aside` para que o `ModalHistoryManager` passe a empilhar o marcador.
**Benefícios:** o gesto que todo usuário Android espera (Voltar fecha o menu) passa a funcionar; teclado e leitor de tela deixam de vazar para a página atrás.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-011 · P1 · Desktop fica sem Voltar quando a trilha tem um nível
**Descrição:** o `BackButton` do desktop vive dentro do `ContextualBreadcrumbs.tsx:150`, mas o breadcrumb retorna `null` em `/`, `/dashboard` e quando a trilha tem 1 nível (`ContextualBreadcrumbs.tsx:131-137`). Nessas rotas de primeiro nível o desktop não tem nenhum Voltar do app — só o do navegador. É exatamente o caso de telas de entrada como `/relatorios` ou `/boletos`, alcançadas pela paleta de comandos ou por link, onde o Voltar semântico seria mais útil.
**Exemplo prático:** no `MainLayout`, renderizar `<BackButton size="sm" />` no slot de cabeçalho independente do breadcrumb e remover a instância de dentro do `ContextualBreadcrumbs`; o próprio `BackButton.tsx:36` já se oculta em `/` e `/dashboard`.
**Benefícios:** afordância de Voltar consistente em todas as telas do desktop, igual ao que `MobileHeader.tsx:15` já garante no celular.
**Impacto × esforço:** Médio × P · **Depende:** N-006

### N-012 · P1 · Detalhe de anomalia tem quatro Voltar e monta a URL à mão
**Descrição:** `src/pages/admin/AnomaliaDetalhe.tsx` tem `buildVoltarUrl()` (:24) lendo `sessionStorage` para reconstruir a querystring do painel e quatro botões de voltar próprios (:63, :83, :114, :148) — um por estado da tela (carregando, erro, vazio, carregado). É manutenção quádrupla de uma regra que o `useSmartBack` já resolve com a pilha in-app.
**Exemplo prático:** substituir os quatro botões por um único `<BackButton showLabel fallbackPath={buildVoltarUrl()} />`; o `BackButton.tsx:41-44` já roteia `fallbackPath` por `navigateWithUnsavedGuard`, então a guarda continua valendo.
**Benefícios:** o admin volta para o painel de anomalias com os filtros que tinha, qualquer que seja o estado da tela; uma regra em vez de quatro.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-013 · P1 · Treze botões 'Voltar' fora do BackButton, cada um com regra própria
**Descrição:** há 13 rótulos 'Voltar' fora do `BackButton`, cada um com destino próprio: `StatusPage.tsx:226`, `ProtectedRoute.tsx:106`, `ResetPassword.tsx:128`, `ForgotPasswordForm.tsx:53` e `:111`, `TwoFactorSetup.tsx:185`, `CorporateOnboarding.tsx:310`, `OnboardingTributario.tsx:307` e `:343`, entre outros, somando 53 ocorrências de `ArrowLeft` em 23 arquivos. Nenhum anuncia o destino nem expõe o atalho, ao contrário do `BackButton`, que diz 'Voltar para X' e mostra `Alt+←` no tooltip (`BackButton.tsx:49,93`).
**Exemplo prático:** manter como botão próprio apenas os de fluxo de autenticação que mudam etapa interna (`ForgotPasswordForm`, `TwoFactorSetup`) e trocar os de navegação real (`StatusPage`, `ProtectedRoute`, `CorporateOnboarding`) por `<BackButton showLabel fallbackPath="..." />`.
**Benefícios:** um único comportamento de Voltar aprendido uma vez e válido em todo o produto.
**Impacto × esforço:** Médio × M · **Depende:** N-011

### N-014 · P2 · Três 'Voltar' são link fixo para /configuracoes
**Descrição:** `SharedFiltersAdmin.tsx:113`, `MinhasPreferencias.tsx:165` e `FiltrosSalvos.tsx:92` usam `<Link to="/configuracoes">` rotulado 'Voltar'. Quem chega a essas telas pela paleta de comandos ou por link direto é mandado para Configurações sem nunca ter passado por lá — o rótulo mente sobre o destino.
**Exemplo prático:** trocar por `<BackButton showLabel fallbackPath="/configuracoes" />`: o hook usa a entrada in-app anterior quando ela existe e cai em `/configuracoes` só na entrada direta.
**Benefícios:** o rótulo passa a descrever o destino real; fim do desvio em quem abriu a tela por atalho.
**Impacto × esforço:** Baixo × P · **Depende:** N-013

### N-015 · P1 · Troca de rota não é anunciada para leitor de tela
**Descrição:** não há região `aria-live` anunciando mudança de rota — o anúncio depende apenas do foco em `#main-content` (`NavigationTracker.tsx:77-97`). Em rota lazy, o foco só chega depois que o `MutationObserver` vê o conteúdo montar, com timeout de 5s: nesse intervalo o leitor de tela não diz nada e o usuário não sabe se o clique funcionou. WCAG 2.2, 4.1.3 Status Messages (https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).
**Exemplo prático:** adicionar ao `NavigationTracker` um `<div role="status" aria-live="polite" className="sr-only">` cujo texto é `getRouteLabel(pathname)` — o mesmo rótulo que já alimenta `document.title` (:54) e o `MobileHeader`.
**Benefícios:** o papel visualizador que usa leitor de tela sabe em qual tela financeira está sem esperar o chunk carregar.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-016 · P2 · Trilha mobile mostra só ícones dos pais
**Descrição:** no mobile o label do pai é `hidden sm:inline` (`ContextualBreadcrumbs.tsx:173`), então a trilha vira uma fileira de ícones; 27 rotas têm ícone próprio (:39-66) e todas as outras caem em `ChevronRight`, ou seja, vários pais ficam visualmente idênticos. Ícone sem rótulo não identifica destino. NN/g, "Icon Usability" (https://www.nngroup.com/articles/icon-usability/).
**Exemplo prático:** no mobile, renderizar o rótulo do pai imediato (penúltimo item) e colapsar os anteriores em um único item com reticências, mantendo o `hidden sm:inline` apenas para os níveis intermediários.
**Benefícios:** no celular o usuário sabe para onde o toque leva antes de tocar.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-017 · P2 · Rotas com parâmetro ficam sem trilha
**Descrição:** `ROUTE_META` tem 119 entradas e cobre exatamente as 119 rotas privadas estáticas; as 11 sem meta são públicas, de dev ou com parâmetro — entre elas `/reforma-tributaria/:tab` e `/admin/insights-ia/anomalia/:id`. Nessas, `ContextualBreadcrumbs` cai no caminho de `resolveParentRoute` por segmento (:88-92) e o último item usa o segmento humanizado: a trilha de uma anomalia mostra o UUID em vez do nome. É por isso que existe um `AnomaliaBreadcrumb.tsx` separado.
**Exemplo prático:** aceitar padrão com parâmetro em `ROUTE_META` (ex. chave `/admin/insights-ia/anomalia/:id` com `label` resolvido por função) e fazer `getRouteMeta` casar por padrão antes de cair no fallback por segmento; a `tabLabels` em `src/lib/navigation.ts:18-22` já faz isso para `/reforma-tributaria/:tab`.
**Benefícios:** uma trilha só para todo o app; o `AnomaliaBreadcrumb` dedicado deixa de ser necessário.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-018 · P2 · Trilha não diz de qual empresa é a tela
**Descrição:** o produto é financeiro multi-empresa com isolamento por `empresa_id`, mas a trilha derivada de `ROUTE_META` (`ContextualBreadcrumbs.tsx:79-128`) e o `document.title` (`NavigationTracker.tsx:54`) não mencionam a empresa ativa. Um usuário com várias empresas lê 'Dashboard › Contas a Pagar' em duas abas e não distingue qual é de qual.
**Exemplo prático:** prefixar o primeiro item da trilha com o nome curto da empresa ativa (lido do mesmo contexto que `useAllEmpresas` alimenta) e incluí-lo em `document.title` como `Contas a Pagar · <empresa> — Promo Finance`.
**Benefícios:** reduz o risco de lançar um pagamento na empresa errada com duas abas abertas.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-019 · P1 · Posição de scroll se perde no reload e cresce sem limite
**Descrição:** não há `ScrollRestoration` do react-router (0 ocorrências); a restauração é própria, com `Map` por `location.key` em memória e listener passivo (`NavigationTracker.tsx:17,28-36,68-73`). Como a `Map` vive no módulo, qualquer recarga — comum no PWA retomado depois de horas — zera tudo e o Voltar volta ao topo da lista de contas a pagar. O `Map` também nunca é podado. web.dev, "Scroll restoration" (https://web.dev/articles/bfcache).
**Exemplo prático:** espelhar as entradas em `sessionStorage` sob uma chave única e limitar a `Map` às últimas ~30 keys (LRU simples), restaurando a partir do storage quando a key não está em memória — a lógica de POP em `:68-73` não muda.
**Benefícios:** o Voltar devolve o usuário à linha exata da lista mesmo depois de recarregar; memória da aba limitada em sessões longas.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-020 · P1 · Restauração de scroll não funciona em lista virtualizada
**Descrição:** o listener salva `window.scrollY` (`NavigationTracker.tsx:30`), mas as listas financeiras longas rolam em container virtualizado — `Movimentacoes.tsx:152` já precisa de tratamento extra para o highlight de deep-link justamente por isso. Em `/movimentacoes` e `/conciliacao` o Voltar restaura `scrollY` 0 e o usuário reencontra a lista no começo.
**Exemplo prático:** salvar também o índice do primeiro item visível do virtualizador por `location.key` (mesma `Map` do N-019) e, no POP, chamar o `scrollToIndex` do virtualizador em vez de `window.scrollTo`.
**Benefícios:** conciliação de extrato com centenas de linhas deixa de reiniciar a cada ida e volta ao detalhe.
**Impacto × esforço:** Alto × M · **Depende:** N-019

### N-021 · P1 · Paginação não vai para a URL
**Descrição:** nenhuma rota lê `?page=`; o `aria-current="page"` de `src/components/ui/pagination.tsx:125` é puramente visual. Em consequência, Voltar de um lançamento aberto na página 7 de contas a pagar devolve a página 1, e o link que o financeiro manda ao contador nunca aponta para a página certa.
**Exemplo prático:** criar `src/hooks/useUrlPage.ts` no mesmo molde de `useUrlTab` (leitura validada do param, `delete` quando é o valor default) e ligá-lo primeiro em `ContasPagar.tsx` e `ContasReceber.tsx`, que já consomem `useHighlightFromUrl`.
**Benefícios:** página compartilhável e Voltar que recupera o ponto da lista — o fluxo diário de conferência deixa de reiniciar.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-022 · P1 · Filtros de conciliação ficam em localStorage, não na URL
**Descrição:** `useFiltrosConciliacaoPersistidos` grava todo o estado de filtro em `localStorage` sob `'conciliacao_filters'` (`src/hooks/useConciliacaoPageState.ts:10,37-39`): período, faixa de valor, tipo, confiança da IA e centro de custo. Não é compartilhável e não retorna pelo Voltar — e, por ser global, o filtro de uma empresa vaza para a próxima empresa aberta na mesma máquina.
**Exemplo prático:** passar os sete campos de `ConciliacaoFilterState` para `searchParams` (serialização curta, `delete` no valor default, como em `useUrlTab.ts:28-33`), mantendo o `localStorage` apenas como semente quando a URL vem vazia e escopando a chave por `empresa_id`.
**Benefícios:** o analista manda ao contador o link exato da divergência; trocar de empresa não herda filtro alheio.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-023 · P1 · Abas financeiras não entram no histórico
**Descrição:** 90 arquivos usam `<Tabs`, mas só 4 passam por `useUrlTab` (`Seguranca.tsx:19`, `Integracoes.tsx:50`, `Configuracoes.tsx:81`, `Asaas.tsx:56`) e 3 leem `searchParams` direto; o resto guarda a aba em estado local. O hook já existe, já valida o valor e já deduplica o duplo `onValueChange` do Radix (`src/hooks/useUrlTab.ts:15-20`). Sem ele, o Voltar sai da tela inteira em vez de retornar à aba anterior.
**Exemplo prático:** migrar nesta PR as abas das telas financeiras de maior uso (`Relatorios`, `FluxoCaixa`, `BI`) para `useUrlTab(defaultTab, TABS)`, uma lista `TABS` por tela.
**Benefícios:** aba compartilhável por link e Voltar que se comporta como o usuário espera dentro de um relatório de várias visões.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-024 · P2 · Demonstrativos guarda a aba em localStorage
**Descrição:** `Demonstrativos.tsx:54` persiste a aba ativa em `localStorage` sob `'demonstrativos_active_tab'`. A tela sempre reabre na última aba usada, mesmo quando o usuário chegou por um link que pretendia outra visão, e o estado é global entre empresas. São 119 chaves distintas de `localStorage` no total, 9 delas literalmente estado de UI de tela.
**Exemplo prático:** trocar a leitura/gravação do `localStorage` por `useUrlTab('dre', ['dre','balanco','dfc'])` e remover a chave; se a preferência de aba for desejada, usar `usePersistedState` como valor inicial do param, não como fonte da verdade.
**Benefícios:** DRE, balanço e DFC passam a ser links próprios — o que o contador pede com frequência.
**Impacto × esforço:** Médio × P · **Depende:** N-023

### N-025 · P2 · Empresa ativa não está na URL
**Descrição:** o isolamento é por `empresa_id`, mas nenhuma rota carrega a empresa no path ou no search — `useSearchParams` aparece em só 10 arquivos (20 ocorrências). Um link de `/contas-pagar?page=3` compartilhado entre dois usuários abre em empresas diferentes conforme o contexto de cada um, o que em tela financeira é interpretação errada de número.
**Exemplo prático:** aceitar `?empresa=<id>` nas telas financeiras principais, validando contra as empresas acessíveis do usuário (mesma checagem que `hasRole` faz em `NavigationTracker.tsx:112`) e caindo na empresa ativa quando o param é inválido ou inacessível.
**Benefícios:** link compartilhado mostra os mesmos números para quem envia e quem recebe.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-026 · P2 · Deep-link de linha cobre 5 telas, não as tributárias
**Descrição:** `useHighlightFromUrl` valida UUID, avisa em link inválido e limpa o param (`src/hooks/useHighlightFromUrl.ts:23-44`), mas é usado em apenas 5 páginas: `ContasPagar.tsx:62`, `ContasReceber.tsx:106`, `Movimentacoes.tsx:138`, `Conciliacao.tsx:160` e uma quinta. As telas tributárias e de aprovações, que também recebem alerta por e-mail apontando um registro específico, não têm o recurso.
**Exemplo prático:** ligar o hook em `Aprovacoes` e nas telas tributárias de maior volume (`NfeRecebidasPage`, `PerDcompPage`), passando o nome do param de cada uma; o tratamento de lista virtualizada já tem precedente em `Movimentacoes.tsx:152`.
**Benefícios:** o alerta por e-mail leva direto à linha, sem o usuário caçar o registro em uma lista longa.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-027 · P2 · Nenhum dos 164 overlays tem URL própria
**Descrição:** 164 arquivos usam overlay (149 com `DialogContent`, 10 com `SheetContent`, 5 com `Drawer`) e nenhum tem rota ou URL própria — todo modal é estado local coberto pelo marcador de histórico. Funciona para fechar, mas o detalhe de um lançamento não é compartilhável nem recarregável: F5 com o modal aberto devolve a lista.
**Exemplo prático:** promover a URL apenas os overlays de detalhe que as pessoas compartilham, começando pelo detalhe de conta a pagar: rota filha `/-contas-pagar/:id` sob a rota de layout (N-006), com o modal lendo `useParams`. O `ModalHistoryManager` continua cobrindo os demais sem mudança.
**Benefícios:** o financeiro manda o link de um lançamento específico para aprovação, em vez de descrever onde achar.
**Impacto × esforço:** Alto × G · **Depende:** N-006

### N-028 · P2 · Só dois formulários avisam de trabalho não salvo
**Descrição:** a guarda cobre quatro saídas — clique em link na fase de captura (`UnsavedGuardProvider.tsx:124`), Voltar/swipe via sentinela (:68,:175), navegação programática e `beforeunload` (:206) — mas apenas `ContaPagarForm.tsx:69` e `ContaReceberForm.tsx:122` declaram estado sujo com `useUnsavedChangesGuard`. Nenhum dos 4 fluxos multi-etapas e nenhuma outra tela de edição declara: fechar o wizard SPED no meio perde tudo sem aviso.
**Exemplo prático:** chamar `useUnsavedChangesGuard(isDirty)` nos wizards (`SpedEcdWizard.tsx`, `SSOWizardDialog.tsx`, `OnboardingTributario.tsx`) e nas telas de edição de cadastro (`Clientes`, `Fornecedores`), derivando `isDirty` do `formState.isDirty` que os forms já têm.
**Benefícios:** fim da perda silenciosa de preenchimento longo em telas fiscais; a infraestrutura de guarda já está pronta e ociosa.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-029 · P3 · Avaliar useBlocker em lugar da sentinela própria
**Descrição:** há 0 uso de `useBlocker`/`unstable_usePrompt`; o bloqueio é feito com sentinela de histórico própria no `UnsavedGuardProvider` (175 linhas de coordenação com o `ModalHistoryManager`, que por sua vez tem 386). O projeto está em react-router-dom 7, onde `useBlocker` é API estável para navegação in-app — NÃO VERIFICADO se ele cobre o `beforeunload` nativo e o Voltar do navegador com a mesma precisão que a sentinela atual, que é o motivo provável da implementação própria.
**Exemplo prático:** fazer uma prova de conceito em uma rota só (`ContaPagarForm`) com `useBlocker` e comparar os 4 pontos de saída cobertos hoje, antes de qualquer remoção; se não cobrir tudo, documentar o resultado no próprio `UnsavedGuardProvider` e fechar a questão.
**Benefícios:** ou reduz centenas de linhas de coordenação de histórico, ou encerra por escrito a dúvida recorrente.
**Impacto × esforço:** Baixo × M · **Depende:** N-028

### N-030 · P1 · Transição de página só existe dentro do shell
**Descrição:** `PageTransition` é renderizado dentro do `MainLayout` (`MainLayout.tsx:116`), então as 19 rotas sem shell trocam de tela sem animação nenhuma — corte seco. Como `AnimatePresence mode="wait"` é keyed por `pathname` (`PageTransition.tsx:18-21`), uma transição por rota que remonta o layout também não encadeia direito.
**Exemplo prático:** mover `<PageTransition>` para o `AppShellLayout` (N-006), envolvendo o `<Outlet />`; o `TransitionProvider.tsx:12` já define o preset default blur-rise de 350ms e o `MotionConfig reducedMotion="user"` de `App.tsx:108` continua valendo.
**Benefícios:** troca de tela com a mesma sensação em todo o produto, inclusive nas 38 rotas tributárias.
**Impacto × esforço:** Médio × P · **Depende:** N-006

### N-031 · P2 · Colapso da sidebar anima marginLeft por 500ms
**Descrição:** o `motion.main` anima `marginLeft` entre 80 e 280px em 500ms e ainda define `width: calc(100% - ...)` inline (`MainLayout.tsx:88-99`). Animar `marginLeft` e `width` força reflow e relayout da tabela financeira a cada frame — custo que cai justamente em cima das listas longas. web.dev, "Animations guide" (https://web.dev/articles/animations-guide).
**Exemplo prático:** trocar o `animate={{ marginLeft }}` por uma CSS custom property (`--shell-offset`) aplicada no container com `transition: padding-left`, ou animar `transform: translateX` no wrapper; manter a duração e o easing atuais.
**Benefícios:** colapsar a sidebar deixa de travar a rolagem de tabela em máquina modesta.
**Impacto × esforço:** Médio × P · **Depende:** N-007

### N-032 · P2 · / e /dashboard são a mesma tela com transições diferentes
**Descrição:** `resolveRouteEffect` casa por `startsWith` (`src/components/layout/transitions/routeTransitions.ts:14-15`) e lista `/dashboard` com efeito `fade`, mas `/` não está na lista e cai no default blur-rise. Como as duas rotas apontam para a mesma página (`Index`, conforme `usePrefetchRoutes.ts:13-14`), a mesma tela entra de dois jeitos dependendo do caminho usado. O `startsWith` com `/admin` também aplica `zoom-in` a todas as 27 rotas admin, incluindo as de leitura longa.
**Exemplo prático:** alinhar `/` e `/dashboard` com o mesmo efeito em `ROUTE_TRANSITIONS` e avaliar casar por prefixo de segmento (`/admin/`) em vez de `startsWith` cru, para que efeitos chamativos fiquem só na entrada do domínio.
**Benefícios:** a mesma tela sempre entra igual; menos movimento gratuito em telas densas de auditoria.
**Impacto × esforço:** Baixo × P · **Depende:** —

### N-033 · P2 · Prefetch por intenção existe mas não tem consumidor
**Descrição:** `PrefetchOnVisible` (`src/hooks/usePrefetchRoutes.tsx`) tem uma única ocorrência no repo: a própria definição. O prefetch ativo é só por `requestIdleCallback` com mapa de 17 rotas e 12 listas de relacionadas (`usePrefetchRoutes.ts:12-46`), ligado globalmente em `DataPrefetcher.tsx:13`. Ou seja, ninguém aquece o chunk no momento em que o usuário mira o item. Padrão: web.dev, "Prefetch resources" (https://web.dev/articles/link-prefetch).
**Exemplo prático:** ligar o prefetch em `onMouseEnter`/`onFocus` dos itens de `SidebarNavGroups.tsx` e dos comandos da `CommandPalette`, reaproveitando o `routeModules` já exportado; manter o idle como rede de segurança.
**Benefícios:** a tela abre praticamente sem fallback de Suspense quando o usuário clica no item que estava mirando.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-034 · P2 · Mapa de prefetch cobre 17 de 130 rotas
**Descrição:** `routeModules` tem 17 entradas e `relatedRoutes` 12 listas (`usePrefetchRoutes.ts:12-46`), todas do núcleo financeiro. Os 38 caminhos tributários e os 27 admin — que são os chunks mais pesados e os de uso em rajada durante fechamento mensal — não têm nenhum prefetch.
**Exemplo prático:** gerar o mapa a partir dos barris `src/routes/*Pages.ts`, que já contêm os 118 imports lazy, em vez de manter a lista à mão; e acrescentar `relatedRoutes` para a sequência de fechamento (`/tributario/fechamento-mensal` → `/tributario/sped-export` → `/tributario/darf-consolidado`).
**Benefícios:** fechamento mensal, que percorre várias telas fiscais em sequência, deixa de esperar chunk em cada passo.
**Impacto × esforço:** Médio × M · **Depende:** N-033

### N-035 · P2 · Polling segue rodando em rota que o usuário deixou
**Descrição:** há 36 `refetchInterval` ativos, de 15s a 60s (ex. `src/hooks/useAnomaliaDetectionRun.ts:43` com 15s). Como as queries ficam montadas conforme a rota, mas nada observa visibilidade da aba, o PWA em segundo plano continua consumindo dados móveis e cota de Edge Function. Padrão: TanStack Query `refetchIntervalInBackground` (https://tanstack.com/query/latest/docs/framework/react/reference/useQuery).
**Exemplo prático:** definir `refetchIntervalInBackground: false` no `defaultOptions` do `queryClient` em `src/App.tsx` e revisar os poucos hooks que de fato precisam do oposto, declarando a exceção localmente com comentário.
**Benefícios:** menos consumo de dados no celular do vendedor em campo e menos invocações pagas de função.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-036 · P2 · Dois donos para Ctrl+K, ambos com preventDefault
**Descrição:** `CommandPalette.tsx:32` abre a paleta em Ctrl+K e `useKeyboardShortcuts.ts:145` foca um input 'Buscar' no mesmo atalho — os dois listeners são globais e os dois chamam `preventDefault`. O comportamento efetivo depende da ordem de registro, que depende da ordem de montagem no `App.tsx`: é ambíguo por construção.
**Exemplo prático:** remover o ramo Ctrl+K de `useKeyboardShortcuts` e deixar a paleta como único dono; se focar a busca local ainda for desejado, dar a ele outro atalho e registrá-lo em `getShortcutsList`.
**Benefícios:** o atalho mais usado do app passa a ter resultado previsível.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-037 · P2 · Busca do header é decorativa e dispara evento sintético
**Descrição:** `src/components/layout/Header.tsx:115-120` tem um campo de busca que, no `onFocus`, dá `blur` em si mesmo e despacha um `Ctrl+K` sintético. O usuário clica em um campo que parece aceitar texto, o cursor pula e um modal abre — e isso depende do conflito descrito em N-036 resolver a favor da paleta.
**Exemplo prático:** trocar o `<Input>` por um `<button>` com aparência de campo (`role="search"`, rótulo 'Buscar... Ctrl+K') que chama a abertura da paleta diretamente pelo mesmo caminho do `CommandPalette`, sem evento sintético.
**Benefícios:** a afordância passa a corresponder à ação; teclado e leitor de tela anunciam botão, não campo de texto.
**Impacto × esforço:** Médio × P · **Depende:** N-036

### N-038 · P2 · Paleta cobre 51 de 130 rotas e é mantida à mão
**Descrição:** a paleta global tem 51 comandos (31 de navegação + 20 de gestão) com busca por título, subtítulo e keywords (`CommandPalette.tsx:51-88`), mas não é gerada de `ROUTE_META` — que tem 119 entradas com label e `requiredRoles`. Resultado: 79 rotas não são alcançáveis pela paleta e toda rota nova precisa ser cadastrada duas vezes.
**Exemplo prático:** derivar os comandos de navegação de `ROUTE_META`, filtrando por `hasRole(meta.requiredRoles)` como `NavigationTracker.tsx:112` já faz, e manter escrita à mão apenas a lista de 20 comandos de gestão (ações, não rotas).
**Benefícios:** qualquer tela fica a um Ctrl+K de distância e respeitando o papel do usuário; cadastro único por rota.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-039 · P2 · Atalhos de ação dependem de atributos espalhados pelo DOM
**Descrição:** Ctrl+Shift+N/S/E procuram `data-add-new`, `data-save` e `data-export` no DOM (`useKeyboardShortcuts.ts:117,127,137`) em vez de um registro central. Quem monta uma tela nova não tem como saber que precisa marcar o botão, então o atalho silenciosamente não faz nada — e não há aviso ao usuário de que a tecla foi ignorada.
**Exemplo prático:** criar um contexto leve (`useRegisterPageAction('save', fn)`) que as páginas chamam, e fazer o handler global consultar o registro; manter a busca por `data-*` como fallback durante a migração.
**Benefícios:** atalho de salvar e exportar funciona nas telas financeiras de verdade, não só nas que lembraram do atributo.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-040 · P2 · Lista de ajuda de atalhos é espelhada à mão
**Descrição:** `getShortcutsList` (`useKeyboardShortcuts.ts:247`) repete manualmente os 13 atalhos Alt+letra e as 5 ações rápidas definidos em `:34-207`, inclusive os rótulos ('Contas a Receber', 'Expert (IA)'). Duas fontes para o mesmo dado: a tela de ajuda pode anunciar um atalho que não existe mais e não lista Alt+←/→/Home, que vivem em outro hook (`useKeyboardNavigation.ts:34-58`).
**Exemplo prático:** declarar um array único de `{ keys, description, handler }` e derivar tanto o `handleKeyDown` quanto o `getShortcutsList` dele, incluindo os três atalhos de `useKeyboardNavigation`.
**Benefícios:** a tela de ajuda passa a ser verdade sobre o que o app faz, incluindo os atalhos de Voltar e Avançar.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-041 · P2 · Alt+→ é engolido sem feedback quando há formulário sujo
**Descrição:** `useKeyboardNavigation.ts:50-52` ignora Alt+→ quando `hasUnsavedChanges()` é verdadeiro, com o motivo documentado (a sentinela já apagou o histórico à frente). A decisão é correta, mas o usuário aperta a tecla e nada acontece — sem toast, sem foco no formulário, sem explicação. Alt+← no mesmo cenário abre a confirmação; os dois casos se comportam de modo diferente sem o usuário entender por quê.
**Exemplo prático:** no ramo de `hasUnsavedChanges()`, disparar o `toast.info` do sonner já usado no app ('Salve ou descarte as alterações para avançar') e focar o formulário sujo via o elemento registrado pelo `UnsavedGuardProvider`.
**Benefícios:** a tecla que não funciona explica o motivo em vez de parecer um bug.
**Impacto × esforço:** Baixo × P · **Depende:** —

### N-042 · P3 · Atalho de navegação por domínio
**Descrição:** há 13 atalhos Alt+letra de navegação, todos do núcleo financeiro (`getShortcutsList` lista Dashboard, Receber, Pagar, Fluxo, Conciliação, Expert, BI, Alertas, Relatórios, Aprovações...). As letras estão praticamente esgotadas e os 38 caminhos tributários e 27 admin não têm nenhum atalho — para eles só resta a paleta.
**Exemplo prático:** adicionar sequência de duas teclas no estilo Gmail (`g` seguido de `t` para tributário, `a` para admin) abrindo a paleta pré-filtrada pelo domínio, reaproveitando o mesmo guard de input focado que `CommandPalette.tsx:35-45` já usa para a tecla `n`.
**Benefícios:** quem passa o dia no fechamento fiscal ganha acesso rápido sem decorar 38 atalhos.
**Impacto × esforço:** Baixo × M · **Depende:** N-038

### N-043 · P2 · 404 não sugere nada nem é medido
**Descrição:** `NotFound.tsx` mostra o pathname e dois botões, sem sugerir rota próxima — mesmo havendo 119 labels em `ROUTE_META` para comparar. E a telemetria coleta apenas erro e Web Vitals, com 0 ocorrências de `page_view` em `src/lib` (`src/lib/telemetry.ts:262-300`), então ninguém sabe quais links quebrados os usuários encontram.
**Exemplo prático:** no `NotFound`, comparar o path com as chaves de `ROUTE_META` (distância de edição simples sobre os segmentos) e oferecer até 3 destinos filtrados por `hasRole`; registrar um `addBreadcrumb('route_404', { path })` com a mesma redação de chaves de URL que `telemetry.ts:27` já aplica.
**Benefícios:** link antigo de e-mail passa a levar ao lugar certo em um clique, e o dono descobre quais links estão circulando quebrados.
**Impacto × esforço:** Médio × M · **Depende:** N-001

### N-044 · P2 · Acesso negado e rota inexistente parecem o mesmo problema
**Descrição:** `ProtectedRoute.tsx:48-60` mostra um card de acesso negado com `mailto` de solicitação, enquanto rota inexistente cai no `NotFound`. São telas diferentes para causas diferentes, mas o usuário que recebe um link de uma área restrita não distingue 'não existe' de 'não é para o meu perfil' — e o Voltar do card (`:106`) é um dos 13 fora do `BackButton`.
**Exemplo prático:** unificar o layout das duas telas em um componente de estado de rota, variando apenas título, explicação e ação (sugestões de rota no 404; `mailto` de solicitação no acesso negado), e usar `BackButton` em ambos.
**Benefícios:** o visualizador entende que o problema é de permissão e sabe pedir acesso, em vez de concluir que o sistema está quebrado.
**Impacto × esforço:** Médio × P · **Depende:** N-013, N-043

### N-045 · P2 · Trinta e três saídas por window.open sem sinalização
**Descrição:** há 33 ocorrências de `window.open` em `src`, 25 com `_blank` — boleto, nota fiscal, DARF, portais externos. Nenhuma entra no histórico interno, então o Voltar semântico não as conhece, e nada no clique avisa o usuário de que vai sair do app ou abrir aba nova. WCAG 2.2, 3.2.5 Change on Request (https://www.w3.org/WAI/WCAG22/Understanding/change-on-request.html).
**Exemplo prático:** centralizar as aberturas em um helper `abrirExterno(url, { motivo })` que acrescenta `noopener,noreferrer`, registra breadcrumb de telemetria e renderiza o ícone de link externo com `aria-label` indicando nova aba; aplicar primeiro nos pontos de boleto e nota fiscal.
**Benefícios:** o usuário sabe antes de clicar que vai para o banco ou para a SEFAZ; sai de contexto por escolha, não por surpresa.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-046 · P2 · PWA: atalhos de três rotas e nenhum ícone PNG
**Descrição:** o `public/manifest.json` declara `display: standalone`, `start_url` e `scope` em `/`, `orientation: portrait-primary`, três `shortcuts` (`/dashboard`, `/contas-pagar`, `/contas-receber`) e ícones só em SVG mais `favicon.ico` 48px — sem PNG 192 e 512. Android não garante o ícone maskable a partir de SVG, e `orientation: portrait-primary` trava o tablet em retrato, o pior formato para tabela financeira. Referência: web.dev, "Add a web app manifest" (https://web.dev/articles/add-manifest).
**Exemplo prático:** gerar `icon-192.png` e `icon-512.png` (purpose `any` e `maskable`) e acrescentá-los ao array; remover `orientation` ou trocar por `any`; incluir `/aprovacoes` nos shortcuts, que é a ação recorrente com badge no `MobileBottomNav.tsx:46`.
**Benefícios:** ícone correto na tela inicial, tablet usável em paisagem e atalho direto para o que o aprovador faz todo dia.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-047 · P3 · Nenhuma medição de navegação
**Descrição:** a telemetria registra `window.error`, `unhandledrejection` e Web Vitals (CLS, INP, LCP, FCP, TTFB), com 0 ocorrências de `page_view`/analytics em `src/lib` (`telemetry.ts:262-300`). O único breadcrumb de navegação é `nav_back` com from/to/method/inApp (`useSmartBack.ts:53`), e a fila guarda no máximo 20 breadcrumbs, só subindo anexada a um erro (`telemetry.ts:21,251`). Não há como saber quais das 130 rotas são usadas.
**Exemplo prático:** emitir um evento de rota no `NavigationTracker`, reusando a redação de chaves sensíveis de `telemetry.ts:27` e a exclusão de `/contador/` e `/convite/` de `navigation.ts:395-404`, com envio agregado no `beforeunload` que já existe em `telemetry.ts:305`.
**Benefícios:** o dono passa a decidir onde investir em UX por uso real, e as rotas mortas ficam visíveis para remoção.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-048 · P2 · E2E não cobre nenhum comportamento de navegação
**Descrição:** há 28 specs E2E (`playwright.config.ts:16`, testDir `./e2e`) e só 2 tocam navegação, por texto de botão: `login.e2e.ts:151,155` e `error-states.e2e.ts:25`. Nada cobre Voltar semântico, breadcrumb, `aria-current`, bottom nav ou drawer — exatamente a camada que N-001 a N-011 alteram.
**Exemplo prático:** criar `e2e/navegacao.e2e.ts` com quatro casos: entrada direta em uma rota filha e Voltar subindo para a pai (`useSmartBack.ts:49-66`); Voltar fechando dialog aberto; `aria-current="page"` no item ativo da sidebar (`sidebarNavState.ts:16-30`); e bottom nav com badge de aprovações no viewport mobile.
**Benefícios:** as correções de navegação deixam de poder regredir em silêncio no merge seguinte.
**Impacto × esforço:** Alto × M · **Depende:** N-003, N-010

### N-049 · P2 · Os três módulos mais complexos de navegação não têm teste
**Descrição:** há testes unitários da camada pura — `src/lib/__tests__/navigation.test.ts`, `src/lib/navigation-intent.test.ts`, `BackButton.test.tsx`, `useKeyboardNavigation.test.tsx` e `sidebarNavState.test.ts` — mas nada cobre `ModalHistoryManager` (386 linhas, com marcadores aninhados, fantasmas deferidos e reempilhamento em 150ms), `UnsavedGuardProvider` nem `NavigationTracker`. São justamente os que manipulam `history` diretamente: 14 chamadas reais de `window.history.back()` no app, 7 no primeiro e 5 no segundo.
**Exemplo prático:** testes de integração com `jsdom` e `MemoryRouter` cobrindo: marcador consumido no popstate com dois dialogs aninhados; recusa de empilhar com `hasForwardEntries()` verdadeiro (`ModalHistoryManager.tsx:100-104`); e restauração de scroll em POP pela `Map` do `NavigationTracker` (:68-73).
**Benefícios:** protege a lógica mais sutil e mais cara de depurar do produto, hoje sem rede nenhuma.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-050 · P3 · Código morto de navegação sem nenhum importador
**Descrição:** `src/components/ui/wizard.tsx` (401 linhas, com Stepper e `prevLabel` 'Voltar' em :323), `src/components/ui/drawer.tsx` (vaul) e `src/components/ui/sidebar.tsx` (shadcn) não têm nenhum importador. São três implementações alternativas de navegação coexistindo com as reais — leem como opção válida para quem for construir o próximo wizard e contradizem os 4 fluxos multi-etapas que já existem com estado próprio.
**Exemplo prático:** confirmar zero importadores com `rg "from '@/components/ui/(wizard|drawer|sidebar)'" src` e remover os três arquivos em uma PR só; o `vaul` continua necessário se os 5 usos de `Drawer` vierem dele — NÃO VERIFICADO de onde esses 5 importam.
**Benefícios:** menos caminho falso para o próximo agente ou dev, e bundle e tempo de type-check menores.
**Impacto × esforço:** Baixo × P · **Depende:** —

### 2.2 Consistência e padrões de UI/UX (N-051 → N-085)

### N-051 · P0 · Classe `active-nav-item` não existe
**Descrição:** O item ativo da sidebar aplica `'active-nav-item'` (src/components/layout/sidebar/SidebarNavGroups.tsx:261) e essa classe não está definida em lugar nenhum: `grep -rn "active-nav"` retorna um único hit, o próprio uso; não está em src/index.css nem em src/styles/high-contrast.css, e o único plugin do Tailwind é `tailwindcss-animate` (tailwind.config.ts:135). Resultado: no item ativo caem também as classes de texto (`text-muted-foreground`) e de fundo do ramo inativo, sobrando apenas `text-primary scale-110` no ícone. Quem navega entre 91 itens de menu em 5 grupos perde o indicador de "onde estou" no rótulo, exatamente o que WCAG 2.2 SC 1.4.1 proíbe depender só de cor (https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html).
**Exemplo prático:** definir `.active-nav-item` em src/index.css na mesma `@layer components` das utilidades de tipografia (perto de src/index.css:528) usando tokens já existentes: `@apply bg-primary/10 text-foreground font-semibold;` mais uma barra à esquerda `border-l-2 border-primary` (ou `box-shadow: inset 2px 0 0 hsl(var(--primary))`). Adicionar assertiva em src/components/layout/sidebar/sidebarNavState.test.ts ou um teste novo que renderize `SidebarNavGroups` e exija `bg-primary/10` no item da rota ativa.
**Benefícios:** o usuário financeiro que alterna Contas a Pagar → Conciliação → Movimentações volta a ver o item atual destacado; elimina o sintoma de "menu sem seleção" relatado como inconsistência visual.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-052 · P0 · high-contrast.css invalida os tokens em `prefers-contrast: high`
**Descrição:** src/styles/high-contrast.css (importado em src/main.tsx:7) redefine `--background: #000`, `--foreground: #fff` e `--border: #fff`, mas todos os consumidores usam `hsl(var(--border))` (tailwind.config.ts:28-30) e os valores reais em src/index.css:147,169 são triplets HSL (`230 25% 5%`, `225 12% 13%`). Em hex o resultado é `hsl(#000)`, declaração inválida: sob contraste alto do sistema o app perde fundo, texto e bordas — inclusive as bordas da sidebar, do cabeçalho e da bottom nav. Falha direta de WCAG 2.2 SC 1.4.11 Non-text Contrast (https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
**Exemplo prático:** reescrever o bloco de src/styles/high-contrast.css em triplets (`--background: 0 0% 0%; --foreground: 0 0% 100%; --border: 0 0% 100%;`) e acrescentar os tokens dos controles de navegação (`--sidebar-background`, `--sidebar-border`, `--muted-foreground`, `--ring`). Validar com um teste de tema junto de src/test/a11y/critical-pages.test.tsx forçando a media query.
**Benefícios:** contador e visualizador que usam contraste alto do Windows/macOS deixam de ver o shell sem bordas; remove risco de reprovação em auditoria de acessibilidade do cliente corporativo.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-053 · P0 · Toast no mobile cobre o cabeçalho e o Voltar
**Descrição:** O `<Toaster richColors closeButton position="top-right" />` (src/App.tsx:52) vale para desktop e PWA. No mobile o MobileHeader é fixo no topo com `h-[calc(3.5rem+env(safe-area-inset-top))]` e z-40 (src/components/layout/MobileHeader.tsx:13) e o toast do sonner monta acima dele, tapando justamente o BackButton (MobileHeader.tsx:15) nos 1198 toasts do app (575 `toast.error` + 524 `toast.success` + 48 warning + 46 info). Em tela de 360px um erro de baixa de pagamento bloqueia o único Voltar visível. Material Design 3 recomenda snackbar na borda inferior, acima da barra de navegação (https://m3.material.io/components/snackbar/guidelines).
**Exemplo prático:** em src/App.tsx:52 passar posição condicional via `useIsMobile()` (src/hooks/use-mobile.tsx) — `position={isMobile ? 'bottom-center' : 'top-right'}` — e `offset` que respeite a bottom nav de 80px + safe-area (`offset="calc(5.5rem + env(safe-area-inset-bottom))"`), já que MobileBottomNav é fixa com z-50 (src/components/layout/sidebar/MobileBottomNav.tsx:32).
**Benefícios:** confirmação de ação deixa de esconder o controle de saída da tela; menos toques errados em telas de pagamento no celular.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-054 · P1 · Contrato único de props do BackButton
**Descrição:** O BackButton aceita `label`, `showLabel`, `size`, `variant`, `className` e `fallbackPath` (src/components/navigation/BackButton.tsx:11-24) e os 3 call-sites usam combinações diferentes: `size="sm" variant="ghost" className="shrink-0 -ml-1"` (MobileHeader.tsx:15), `size="sm" variant="ghost" className="shrink-0"` (ContextualBreadcrumbs.tsx:150) e nenhum prop em ScimAudit.tsx:150 (cai em `size="default"`, 36px). Além disso o tooltip com o atalho `Alt+←` só existe quando `showLabel` é falso (BackButton.tsx:86-95), então a variante com rótulo perde a dica de teclado.
**Exemplo prático:** reduzir a API a `placement: 'header' | 'breadcrumb' | 'page'` em src/components/navigation/BackButton.tsx, resolvendo size/variant/classe por placement dentro do componente, e manter o TooltipContent sempre renderizado (só trocando o texto quando há rótulo). Atualizar os 3 call-sites e os casos de src/components/navigation/__tests__/BackButton.test.tsx.
**Benefícios:** o Voltar passa a ter o mesmo tamanho e peso visual em qualquer tela; o atalho Alt+← fica descobrível em todas as variantes.
**Impacto × esforço:** Médio × P · **Depende:** N-051

### N-055 · P1 · Os 13 "Voltar" manuais passam a usar BackButton
**Descrição:** Há 13 rótulos "Voltar" fora do componente, cada um com ícone, variante e destino próprios: NotFound.tsx:59, StatusPage.tsx:226, ProtectedRoute.tsx:106, ResetPassword.tsx:128, ForgotPasswordForm.tsx:53 e :111, TwoFactorSetup.tsx:185, CorporateOnboarding.tsx:310, OnboardingTributario.tsx:307 e :343. Nenhum deles passa por `navigateWithUnsavedGuard` nem pela pilha in-app, que o BackButton já respeita (BackButton.tsx:41-45). São justamente as telas de borda (sem shell) em que o usuário precisa de saída previsível.
**Exemplo prático:** trocar cada bloco por `<BackButton placement="page" fallbackPath="/auth" showLabel />` (o destino de cada tela já está explícito no `Link`/`navigate` atual), apagando os `ArrowLeft` locais. Uma PR por área: auth (ResetPassword, ForgotPasswordForm, TwoFactorSetup, CorporateOnboarding), status/erro (NotFound, StatusPage, ProtectedRoute), tributário (OnboardingTributario).
**Benefícios:** mesmo ícone, mesmo rótulo e mesma guarda de não-salvos em toda saída; menos chance de perder dados de formulário de onboarding.
**Impacto × esforço:** Médio × M · **Depende:** N-054

### N-056 · P1 · NotFound sai do app no Voltar
**Descrição:** src/pages/NotFound.tsx:57 chama `window.history.back()` cru — único Voltar do app que não passa por useSmartBack (src/hooks/useSmartBack.ts:60, o único `navigate(-1)` real). Em entrada direta por link (e-mail de cobrança com URL errada, atalho do PWA) o histórico anterior é externo, então o usuário é jogado fora do Promo Finance em vez de voltar ao Dashboard. O rótulo também está fora de padrão: a página diz "Ir para Início" (NotFound.tsx:65) enquanto todo o resto do app diz "Voltar para X".
**Exemplo prático:** em src/pages/NotFound.tsx substituir o handler por `<BackButton placement="page" fallbackPath="/" showLabel />` e manter um segundo botão primário "Ir para o Dashboard" com `<Link to="/">`, alinhando com a nomenclatura de ROUTE_META['/'] ('Dashboard', src/lib/navigation.ts:26).
**Benefícios:** link quebrado deixa de expulsar o usuário do sistema; rótulo igual ao do resto da navegação.
**Impacto × esforço:** Médio × P · **Depende:** N-054

### N-057 · P2 · AnomaliaDetalhe: 4 Voltar próprios e URL montada à mão
**Descrição:** src/pages/admin/AnomaliaDetalhe.tsx monta o destino com `buildVoltarUrl` (:24) e tem quatro botões de voltar distintos (:63, :83, :114, :148), um por estado da tela (carregando, erro, vazio, conteúdo). É a única rota com parâmetro em /admin (`/admin/insights-ia/anomalia/:id`) e não tem metadado em ROUTE_META, logo nem breadcrumb nem rótulo de destino automático.
**Exemplo prático:** manter `buildVoltarUrl` como função de destino e renderizar um só `<BackButton placement="page" fallbackPath={buildVoltarUrl(...)} showLabel />` acima do switch de estados, apagando os quatro botões; registrar `'/admin/insights-ia/anomalia/:id'` no ROUTE_META (src/lib/navigation.ts) com `parent: '/admin/insights-ia'`.
**Benefícios:** o analista que investiga anomalia volta ao filtro de origem por um controle único, no mesmo lugar em todos os estados da tela.
**Impacto × esforço:** Médio × P · **Depende:** N-054

### N-058 · P2 · Três "Voltar" que são link fixo para /configuracoes
**Descrição:** SharedFiltersAdmin.tsx:113, MinhasPreferencias.tsx:165 e FiltrosSalvos.tsx:92 implementam o Voltar como `<Link to="/configuracoes">` com `ArrowLeft` próprio. Como são telas alcançáveis também pela paleta de comandos (51 comandos, src/components/command-palette/CommandPalette.tsx:51-88) e por atalho Alt+letra (src/hooks/useKeyboardShortcuts.ts:34-207), o destino fixo ignora de onde o usuário veio — o oposto do comportamento semântico já implementado em useSmartBack.ts:49-66.
**Exemplo prático:** trocar os três por `<BackButton placement="page" fallbackPath="/configuracoes" showLabel />`: o fallback só entra quando não há entrada in-app anterior, preservando o retorno real.
**Benefícios:** retorno para a tela de origem (ex.: vindo de Conciliação) em vez de sempre cair em Configurações.
**Impacto × esforço:** Baixo × P · **Depende:** N-054

### N-059 · P2 · Gate de lint contra Voltar artesanal
**Descrição:** São 53 ocorrências de `ArrowLeft` em 23 arquivos; depois das etapas N-055 a N-058 nada impede a reintrodução de um botão artesanal. O projeto já usa `eslint.config.js` e tem gates em CI no padrão de scripts/security/test-canonical-db-gates.mjs.
**Exemplo prático:** regra `no-restricted-syntax` em eslint.config.js barrando JSX com texto `/^Voltar/` fora de src/components/navigation/BackButton.tsx, mais um script scripts/ui/check-back-button.mjs que falha se `rg -n "ArrowLeft" src --glob '!**/BackButton.tsx'` casar com um elemento clicável. Allowlist curta para usos decorativos (ex. carrossel).
**Benefícios:** a padronização do Voltar não regride a cada feature nova; revisão deixa de depender de memória do dono.
**Impacto × esforço:** Médio × P · **Depende:** N-055, N-057, N-058

### N-060 · P1 · Slot canônico de Voltar no PageHeader
**Descrição:** Hoje o Voltar só existe dentro do shell (ContextualBreadcrumbs.tsx:150 e MobileHeader.tsx:15); as 19 rotas que renderizam sem MainLayout não têm nenhum, e a única compensação é o `<BackButton />` solto de src/pages/admin/ScimAudit.tsx:150. O PageHeader é o componente de cabeçalho de página com 42 importadores e já tem área de ações (src/components/layout/PageHeader.tsx:85-96), mas nenhuma posição reservada para navegação.
**Exemplo prático:** adicionar `showBack?: boolean` ao PageHeader renderizando `<BackButton placement="page" />` antes do ícone no bloco do título (PageHeader.tsx:51-58) e ligar o prop nas páginas sem shell, começando por src/pages/tributario/CalculadoraTributaria.tsx (src/routes/tributarioRoutes.tsx não tem nenhuma ocorrência de MainLayout) e por ScimAudit.tsx, que perde o botão solto.
**Benefícios:** posição previsível do Voltar — canto superior esquerdo do conteúdo, como em Material Design 3 top app bar (https://m3.material.io/components/top-app-bar/guidelines) — inclusive nas telas tributárias sem shell.
**Impacto × esforço:** Alto × M · **Depende:** N-054

### N-061 · P2 · Tokens de micro-interação para controles de navegação
**Descrição:** Cada controle de navegação tem sua própria curva: BackButton faz `hover:-translate-x-0.5` com `duration-200` e entra com `x: -8` em 0.2s (BackButton.tsx:66-84); o item da sidebar usa `transition-all duration-200` no link e `duration-300` no ícone (SidebarNavGroups.tsx:259-266); a bottom nav usa `whileTap={{ scale: 0.85, y: -4 }}` com `duration-500` e spring `bounce 0.2` (MobileBottomNav.tsx:54-75); o breadcrumb entra com `y: -10` sem duração declarada (ContextualBreadcrumbs.tsx:140-142). Já existe arquivo de constantes de transição (src/components/layout/page-transition.constants.ts) não usado por esses componentes.
**Exemplo prático:** declarar em src/components/layout/page-transition.constants.ts um `NAV_MOTION = { hover: 0.15, press: { scale: 0.96 }, enter: { duration: 0.2, y: -6 } }` e consumir nos quatro componentes, descartando os números soltos. `scale: 0.85` da bottom nav cai para 0.96, dentro da faixa de feedback de toque sem deformar o alvo.
**Benefícios:** navegação com a mesma "física" em sidebar, breadcrumb, Voltar e bottom nav; fim da sensação de componentes de origens diferentes.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-062 · P2 · Feedback tátil no swipe-back e na bottom nav do PWA
**Descrição:** O swipe-back da borda esquerda dispara com 80px de arrasto em zona de 30px (src/hooks/useSwipeBack.ts:16-18) e hoje não dá nenhum retorno até a rota trocar; a bottom nav só responde com `whileTap` visual (MobileBottomNav.tsx:54). Em PWA instalado (manifest `display: standalone`) o usuário não tem a borracha do navegador como referência. Apple HIG trata feedback tátil como parte do gesto (https://developer.apple.com/design/human-interface-guidelines/playing-haptics).
**Exemplo prático:** criar src/hooks/useHaptics.ts com `vibrate(10)` protegido por `'vibrate' in navigator` e por `window.matchMedia('(prefers-reduced-motion: reduce)')` (o app já respeita reduced-motion em src/App.tsx:108 e transitions/useTransition.ts:20); chamar no cruzamento do threshold em useSwipeBack.ts e no `onClick` dos 4 destinos da MobileBottomNav.
**Benefícios:** confirmação imediata do gesto de voltar no celular, reduzindo o duplo swipe que hoje pula duas telas.
**Impacto × esforço:** Médio × P · **Depende:** N-061

### N-063 · P2 · Alvo de toque do Voltar no mobile
**Descrição:** O MobileHeader usa `size="sm"`, que mapeia para `h-7 w-7` = 28px (BackButton.tsx:51), dentro de um cabeçalho de 56px. É o controle mais usado no celular e fica abaixo dos 44pt do Apple HIG (https://developer.apple.com/design/human-interface-guidelines/buttons) e do mínimo de WCAG 2.2 SC 2.5.8 Target Size quando encostado no título truncado ao lado (MobileHeader.tsx:19).
**Exemplo prático:** no `placement="header"` do BackButton (N-054) usar área de toque de 44px com ícone de 20px: `className="h-11 w-11"` com `[&_svg]:h-5` — o ícone não cresce, só a área clicável; conferir que o `-ml-1` atual não encosta na borda da safe-area.
**Benefícios:** menos toques perdidos no Voltar em celular, principal via de saída das telas financeiras no mobile.
**Impacto × esforço:** Médio × P · **Depende:** N-054

### N-064 · P1 · Um único `aria-current="page"` por tela
**Descrição:** src/components/layout/sidebar/sidebarNavState.ts:16-30 tem a semântica correta e documentada ('page' só no match exato, 'location' para pai e âncora), com teste em sidebarNavState.test.ts:72 exigindo um único 'page' na sidebar. Mas o breadcrumb também marca a folha com `aria-current="page"` via BreadcrumbPage (src/components/ui/breadcrumb.tsx:60) e a paginação marca a página numérica com o mesmo valor (src/components/ui/pagination.tsx:125). Numa lista financeira paginada o leitor de tela encontra até três "página atual" diferentes.
**Exemplo prático:** manter `aria-current="page"` só na sidebar (fonte de verdade da localização na navegação), trocar BreadcrumbPage para `aria-current="location"` em src/components/ui/breadcrumb.tsx:60 e a paginação para `aria-current="true"` em src/components/ui/pagination.tsx:125. Estender sidebarNavState.test.ts para um teste de integração que renderize MainLayout e conte `[aria-current="page"]` = 1.
**Benefícios:** navegação por leitor de tela deixa de ser ambígua para o visualizador/contador que usa NVDA; alinha com o padrão ARIA de aria-current (https://www.w3.org/TR/wai-aria-1.2/#aria-current).
**Impacto × esforço:** Médio × P · **Depende:** —

### N-065 · P2 · Bottom nav perde o ativo em rota filha
**Descrição:** MobileBottomNav decide o ativo por igualdade de pathname mais o alias do dashboard (`location.pathname === item.href || (item.href === '/' && location.pathname === '/dashboard')`, src/components/layout/sidebar/MobileBottomNav.tsx:38-40). Em `/contas-pagar/bloqueios` — rota real com metadado e pai declarado (src/lib/navigation.ts:32) — o destino "Pagar" apaga, enquanto a sidebar desktop mantém o pai marcado como 'location' por prefixo (sidebarNavState.ts:26-28). O mesmo vale para qualquer detalhe filho de Receber.
**Exemplo prático:** importar `sidebarNavItemAriaCurrent` em MobileBottomNav.tsx e derivar `const current = sidebarNavItemAriaCurrent(item.href, location)`, usando `isActive = current !== undefined` e `aria-current={current}` na linha 46 — uma função, dois consumidores.
**Benefícios:** no celular o usuário continua vendo em que área financeira está ao abrir um detalhe; regra de ativo única entre sidebar e bottom nav.
**Impacto × esforço:** Médio × P · **Depende:** N-064

### N-066 · P2 · Botão Menu da bottom nav sem rótulo acessível e badge mudo
**Descrição:** O quinto item da bottom nav é um `<button onClick={onMenuClick}>` sem `aria-label`, sem `aria-expanded` e sem `aria-controls` (src/components/layout/sidebar/MobileBottomNav.tsx:91-94), e o badge de aprovações pendentes é só um `<span>` com o número (:102), sem texto. Quem usa leitor de tela ouve "Menu" (o `<span>` visual) e um número solto, sem saber que abre o drawer nem o que o número conta — e o drawer é a única via para 91 itens de navegação no mobile.
**Exemplo prático:** no botão de MobileBottomNav.tsx:91 adicionar `aria-label="Abrir menu de navegação"`, `aria-expanded={isMenuOpen}` (o estado já vive em MainLayout.tsx:32, basta passar como prop) e `aria-controls="mobile-sidebar-drawer"`, dando esse id ao `motion.aside` de src/components/layout/sidebar/MobileSidebarDrawer.tsx:28; no badge, `<span className="sr-only">{aprovacoesPendentes} aprovações pendentes</span>` com `aria-hidden` no número visual.
**Benefícios:** aprovação pendente passa a ser anunciada para o aprovador que usa leitor de tela; o menu deixa de ser um botão sem nome.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-067 · P2 · Contraste dos itens inativos da bottom nav
**Descrição:** Item inativo usa `text-muted-foreground/60` no bloco e o rótulo ainda recebe `opacity-60` (src/components/layout/sidebar/MobileBottomNav.tsx:52,79-82): são duas reduções compostas sobre `--muted-foreground: 223 13% 65%` no tema escuro (src/index.css:158) em cima de `bg-background/40`. O resultado fica bem abaixo dos 4.5:1 de WCAG 2.2 SC 1.4.3 (https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) para texto de 10px. Mesmo padrão aparece no placeholder do Header (`placeholder:text-muted-foreground/50`, src/components/layout/Header.tsx:117).
**Exemplo prático:** trocar por `text-muted-foreground` sem fração e remover o `opacity-60` do rótulo em MobileBottomNav.tsx:52,81; medir os pares com a página src/pages/design-system-debug.tsx e registrar o resultado lá.
**Benefícios:** destinos financeiros legíveis no celular em uso externo (tela sob sol), sem perder a distinção com o item ativo, que tem fundo `bg-primary/10`.
**Impacto × esforço:** Médio × P · **Depende:** N-052

### N-068 · P3 · Tipografia do rótulo da bottom nav
**Descrição:** Os rótulos usam `text-[10px] uppercase tracking-widest` com `font-black` no ativo e `font-bold opacity-60` no inativo (src/components/layout/sidebar/MobileBottomNav.tsx:79-82). Caixa alta com tracking largo em 10px prejudica leitura e faz "Receber"/"Pagar" ficarem visualmente parecidos; Material Design 3 usa 12sp medium no label da navigation bar (https://m3.material.io/components/navigation-bar/specs).
**Exemplo prático:** `text-[11px] font-semibold tracking-normal normal-case` nos cinco itens, mantendo o peso maior apenas no ativo; conferir que "Expert" e "Receber" não quebram em 360px.
**Benefícios:** leitura mais rápida dos destinos no celular; diferença entre pagar e receber fica no texto, não só na cor do ícone.
**Impacto × esforço:** Baixo × P · **Depende:** N-067

### N-069 · P1 · Hierarquia: breadcrumb em card compete com o título
**Descrição:** A trilha é renderizada como um card completo — `px-4 py-2 rounded-lg bg-card border border-border shadow-sm` (src/components/navigation/ContextualBreadcrumbs.tsx:144) — logo acima de um PageHeader com `h1` em `text-display`, badge pílula, ícone em caixa de 48px e subtítulo de 20px itálico (src/components/layout/PageHeader.tsx:46-84). Dois blocos elevados em sequência disputam o primeiro olhar; pela convenção de breadcrumbs da NN/g a trilha é navegação secundária e deve ser visualmente discreta (https://www.nngroup.com/articles/breadcrumbs/).
**Exemplo prático:** em ContextualBreadcrumbs.tsx:144 remover `bg-card border shadow-sm`, deixando trilha inline (`flex items-center gap-3 px-0 py-0 text-sm text-muted-foreground`), e manter o BackButton como único elemento com peso visual na linha.
**Benefícios:** o nome da tela financeira volta a ser o primeiro elemento lido; a trilha informa sem roubar atenção.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-070 · P1 · Espaçamento duplicado acima do conteúdo
**Descrição:** O MainLayout envolve a trilha em `<div className="mb-8">` (src/components/layout/MainLayout.tsx:102-105) e a própria trilha já traz `mb-6` (ContextualBreadcrumbs.tsx:144); somados dão 56px. Pior: a trilha se auto-oculta em `/`, `/dashboard` e quando tem um nível só (ContextualBreadcrumbs.tsx:131-137), então no Dashboard fica uma `div` vazia de 32px antes do conteúdo. Depois vem o PageHeader com `pt-4 mb-12` (PageHeader.tsx:40), totalizando mais de 100px de espaço vertical antes da primeira tabela.
**Exemplo prático:** retirar o wrapper `mb-8` de MainLayout.tsx:102 e deixar o espaçamento só no componente (`mb-4`), e reduzir o `mb-12` do PageHeader para `mb-8`. Uma PR, três linhas, com conferência visual em Contas a Pagar e Conciliação.
**Benefícios:** mais linhas de lançamento visíveis sem rolagem em notebook 1366x768, que é o equipamento típico do time financeiro.
**Impacto × esforço:** Alto × P · **Depende:** N-069

### N-071 · P3 · Altura do app bar mobile versus padding do conteúdo
**Descrição:** O MobileHeader tem `h-[calc(3.5rem+env(safe-area-inset-top))]` (src/components/layout/MobileHeader.tsx:13) e o `motion.main` reserva `pt-[calc(4rem+env(safe-area-inset-top))]` (src/components/layout/MainLayout.tsx:99): 8px de folga involuntária, que some se alguém mexer em um dos dois. O mesmo vale para o par desktop (Header `h-16` em Header.tsx:105 contra `pt-20` no main) e para a bottom nav (`h-20` com `pb-24` no main).
**Exemplo prático:** declarar `--app-bar-h: 3.5rem`, `--app-bar-h-desktop: 4rem` e `--bottom-nav-h: 5rem` em src/index.css (junto dos `--radius-vela-*`, :44-47) e consumir nos três arquivos via `h-[var(--app-bar-h)]` / `pt-[calc(var(--app-bar-h)+env(safe-area-inset-top))]`.
**Benefícios:** cabeçalho e conteúdo param de desalinhar a cada ajuste de altura; base para o offset do toast da etapa N-053.
**Impacto × esforço:** Baixo × P · **Depende:** N-070

### N-072 · P1 · Skeleton do shell no fallback de rota
**Descrição:** Os 127 chunks lazy de rota ficam atrás de um Suspense único cujo fallback é `<PageLoading />` (src/App.tsx:59), um spinner centralizado em `min-h-[400px]` com o texto "Carregando..." (src/components/ui/loading-skeleton.tsx:253-262). Como o MainLayout monta dentro de cada página (89 páginas o chamam internamente), durante o carregamento somem sidebar, breadcrumb e bottom nav: a tela pisca de shell completo para spinner nu e volta. É exatamente o salto de layout que web.dev trata em CLS (https://web.dev/articles/cls).
**Exemplo prático:** criar src/components/layout/RouteFallback.tsx com o esqueleto do shell (barra lateral de 280px, cabeçalho de 64px e bloco de conteúdo com `LoadingSkeleton`) e usar `<Suspense fallback={<RouteFallback />}>` em src/App.tsx:59, reaproveitando os componentes já existentes em loading-skeleton.tsx.
**Benefícios:** troca de rota deixa de desmontar visualmente o app; sensação de velocidade sem mudar nada no carregamento real.
**Impacto × esforço:** Alto × M · **Depende:** N-070

### N-073 · P1 · Regra escrita de skeleton versus spinner
**Descrição:** Hoje convivem 327 usos de `animate-spin` e 144 arquivos com Skeleton, sem critério: a mesma tela pode mostrar spinner no card e skeleton na tabela. A regra da NN/g é objetiva — spinner para espera curta e indeterminada, placeholder/skeleton quando o formato do conteúdo é conhecido (https://www.nngroup.com/articles/progress-indicators/).
**Exemplo prático:** documentar em docs/COMPONENTS.md a regra de três linhas (botão em ação: spinner no próprio botão; lista/tabela/card de dados: skeleton com a forma final; rota: RouteFallback da N-072) e aplicar em uma primeira fatia: Contas a Pagar (src/pages/ContasPagar.tsx) e Conciliação (src/pages/Conciliacao.tsx).
**Benefícios:** o usuário aprende a ler o estado de carregamento uma vez e vale para todas as telas financeiras.
**Impacto × esforço:** Médio × M · **Depende:** N-072

### N-074 · P2 · Skeleton de tabela igual à tabela real nas 5 listas
**Descrição:** Existe `TableShimmerSkeleton` (src/components/ui/loading-skeleton.tsx:273) com contagem de colunas parametrizável, mas as listas que mais pesam no dia a dia — ContasPagar.tsx, ContasReceber.tsx, Movimentacoes.tsx, Conciliacao.tsx (as mesmas 4 que aceitam deep-link de linha via src/hooks/useHighlightFromUrl.ts) e Boletos — não garantem skeleton com o mesmo número de colunas da tabela final, o que gera reflow ao chegar o dado.
**Exemplo prático:** em cada página passar `columns` igual ao array de colunas da tabela e `rows={10}` (tamanho de página atual), e manter a mesma altura de linha; onde há virtualização (Movimentacoes.tsx:152) alinhar a altura do item.
**Benefícios:** fim do pulo da tabela ao carregar; o operador consegue mirar a coluna de vencimento antes do dado chegar.
**Impacto × esforço:** Médio × M · **Depende:** N-073

### N-075 · P2 · Carregamento anunciado para leitor de tela
**Descrição:** `PageLoading` é uma div com spinner e um `<p>` (src/components/ui/loading-skeleton.tsx:253-262), sem `role="status"` nem `aria-live`; e não há região aria-live anunciando troca de rota — o anúncio depende só do foco movido para `#main-content` (src/components/providers/NavigationTracker.tsx:77-97). Para quem usa leitor de tela, a janela entre clicar no menu e o chunk lazy montar é silenciosa.
**Exemplo prático:** em loading-skeleton.tsx:253 envolver o conteúdo em `<div role="status" aria-live="polite" aria-busy="true">` com o texto "Carregando..." visível (já existe) e replicar no RouteFallback da N-072; marcar o `motion.main` com `aria-busy` enquanto o Suspense está pendente.
**Benefícios:** o contador com leitor de tela sabe que a página está carregando em vez de achar que o clique não funcionou.
**Impacto × esforço:** Médio × P · **Depende:** N-072

### N-076 · P1 · Camada única de notificação com durações por severidade
**Descrição:** São 1198 chamadas diretas ao sonner (575 `toast.error`, 524 `toast.success`, 48 `toast.warning`, 46 `toast.info`, 3 `toast.promise`, 2 `toast.loading`), cada uma com texto e duração implícitos; src/hooks/use-toast.ts é um adapter que mapeia a API antiga do shadcn para o sonner, e nada padroniza quanto tempo um erro de baixa de pagamento fica na tela. Não existe src/lib/notify.ts.
**Exemplo prático:** criar src/lib/notify.ts exportando `notify.ok/err/warn/info` com duração por severidade (sucesso 4s, aviso 6s, erro persistente com `duration: Infinity` e o `closeButton` já ligado em src/App.tsx:52) e migrar por módulo, começando pelos hooks de escrita financeira (src/hooks/useAprovacoes.ts, useBoletos.ts, useBulkActions.ts).
**Benefícios:** erro de lançamento não desaparece antes de ser lido; confirmação de sucesso não fica atravancando a tela.
**Impacto × esforço:** Alto × M · **Depende:** N-053

### N-077 · P1 · Toast de ação com link para o registro afetado
**Descrição:** Nenhum toast do app tem botão de ação: `grep` por `toast(` com `action` em src/**/*.tsx dá 0. Depois de registrar um pagamento (src/components/contas-pagar/RegistrarPagamentoDialog.tsx) ou aprovar em lote, o usuário recebe só texto e precisa achar o registro na lista de novo — em telas multi-empresa, muitas vezes com filtro diferente.
**Exemplo prático:** no `notify.ok` da N-076 aceitar `action: { label, to }` e disparar a navegação por `navigateWithUnsavedGuard` (src/lib/unsaved-guard.ts), reusando o deep-link de linha já suportado (`?highlight=<uuid>`, src/hooks/useHighlightFromUrl.ts:23-44): "Pagamento registrado · Ver conta" leva a `/contas-pagar?highlight=<id>`.
**Benefícios:** confirmação deixa de ser aviso e passa a ser atalho; menos tempo para conferir o que acabou de ser lançado.
**Impacto × esforço:** Alto × M · **Depende:** N-076

### N-078 · P2 · Desfazer nas ações reversíveis em lote
**Descrição:** `src/hooks/useBulkActions.ts` executa ações em massa com toast de texto apenas; em telas financeiras a seleção errada de linhas é o erro clássico e hoje a única saída é refazer manualmente. Quando a operação é reversível, Material Design 3 orienta oferecer "Undo" no próprio snackbar (https://m3.material.io/components/snackbar/guidelines).
**Exemplo prático:** nas mutações de useBulkActions.ts que têm inverso (marcar/desmarcar, alterar categoria, alterar centro de custo), chamar `notify.ok(..., { action: { label: 'Desfazer', onClick: reverter } })` com janela de 8s; deixar fora o que é irreversível (baixa com movimentação bancária), que continua pedindo AlertDialog.
**Benefícios:** reduz retrabalho e chamado ao suporte depois de ação em lote errada.
**Impacto × esforço:** Médio × M · **Depende:** N-077

### N-079 · P2 · Operações longas com toast de progresso
**Descrição:** Há apenas 3 `toast.promise` e 2 `toast.loading` no app, enquanto as operações realmente demoradas — geração de relatório (src/components/relatorios/VisualizarRelatorioDialog.tsx), wizard SPED-ECF (src/components/.../sped-ecf-wizard) e exportações — hoje avisam só no fim. O usuário não sabe se pode sair da tela.
**Exemplo prático:** padronizar `notify.promise(promise, { loading: 'Gerando relatório...', success: ..., error: ... })` em src/lib/notify.ts e aplicar nos três fluxos, mantendo o toast vivo durante a troca de rota (o Toaster vive fora do Suspense, src/App.tsx:52).
**Benefícios:** o usuário continua trabalhando enquanto a exportação roda, em vez de ficar parado na tela.
**Impacto × esforço:** Médio × P · **Depende:** N-076

### N-080 · P2 · Deduplicar toasts repetidos pelo polling
**Descrição:** São 36 `refetchInterval` ativos, de 15s a 60s (ex. src/hooks/useAnomaliaDetectionRun.ts:43), e o polling segue rodando independente da rota visível. Quando uma query falha de forma persistente (token expirado, Edge Function fora), o mesmo `toast.error` empilha a cada ciclo e cobre a tela — com `position="top-right"` no desktop, o canto fica inutilizável.
**Exemplo prático:** em src/lib/notify.ts derivar um `id` estável do par (chave da query + código do erro) e repassar como `{ id }` ao sonner, que substitui em vez de empilhar; aplicar no `onError` dos hooks com `refetchInterval`.
**Benefícios:** falha de integração gera um aviso, não uma pilha; o usuário continua vendo a tela.
**Impacto × esforço:** Médio × P · **Depende:** N-076

### N-081 · P1 · Um `h1` por página, via PageHeader
**Descrição:** 77 dos 89 arquivos de src/pages têm `<h1`, mas só 42 importam o PageHeader — ou seja, ~35 páginas montam o próprio título com classes próprias, e 12 não têm `h1` nenhum. O MobileHeader já evita um segundo heading de propósito, usando `span` e documentando o motivo (src/components/layout/MobileHeader.tsx:16-20), decisão que se perde quando a página não tem h1 ou tem dois. Hierarquia de headings é SC 1.3.1 / 2.4.6 de WCAG 2.2 (https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html).
**Exemplo prático:** migrar as páginas sem PageHeader para `<PageHeader title=... subtitle=... />` (src/components/layout/PageHeader.tsx:56 já emite o único `h1`) e adicionar ao src/test/a11y/critical-pages.test.tsx uma assertiva de exatamente um `h1` por página renderizada. Fatiar por módulo: tributário, admin, geral.
**Benefícios:** título igual em todas as telas e navegação por headings previsível para leitor de tela.
**Impacto × esforço:** Alto × G · **Depende:** N-060

### N-082 · P1 · Nome único por rota: ROUTE_META como fonte de verdade
**Descrição:** A mesma tela tem três nomes: `/` é "Dashboard" em ROUTE_META (src/lib/navigation.ts:26), "Dashboard Executivo" na sidebar (SidebarNavGroups.tsx:66) e "Home" na bottom nav (MobileBottomNav.tsx:23); `/bi` é "BI Analytics" contra "BI Gestão Estratégica" (:68); `/inteligencia` é "Inteligência" contra "Inteligência Operacional 360°" (:70); `/financeiro` é "Financeiro" contra "Visão Geral Financeira" (:93); `/expert` é "Expert IA" contra "EXPERT IA Financeira" (:82). Como o `document.title`, o breadcrumb e os recentes saem de ROUTE_META (NavigationTracker.tsx:54; ContextualBreadcrumbs.tsx:79-128) e o menu usa o texto do array, o usuário clica em um nome e chega num título diferente — e a chave de i18n é derivada do rótulo (`t(item.label.toLowerCase().replace(/\s+/g,'_'), item.label)`, SidebarNavGroups.tsx:275), então cada divergência também vira chave de tradução distinta.
**Exemplo prático:** em src/components/layout/sidebar/sidebarNav.types.ts tornar `label` opcional e resolver por `getRouteLabel(item.href)` (src/lib/navigation.ts) quando ausente; manter rótulo explícito só onde ele é intencionalmente mais curto, e nesse caso gravar o nome longo em `ROUTE_META[...].label`. Acrescentar teste que compare rótulo da sidebar/bottom nav com ROUTE_META nas 119 rotas com metadado.
**Benefícios:** o nome que o usuário clica é o nome do título, do breadcrumb, da aba do navegador e dos recentes; menos suporte do tipo "não acho a tela de BI".
**Impacto × esforço:** Alto × M · **Depende:** N-081

### N-083 · P2 · Empresa ativa no título da aba
**Descrição:** O `document.title` é `'<label> — Promo Finance'` (src/components/providers/NavigationTracker.tsx:54) e não diz a empresa do escopo, embora o cabeçalho mostre `nome_fantasia` da empresa corrente (src/components/layout/Header.tsx:101,125-130) e todo o isolamento seja por `empresa_id`. Quem trabalha com duas abas abertas (uma por empresa) não distingue as abas, nem no app instalado.
**Exemplo prático:** em NavigationTracker.tsx:54 compor `'<label> · <empresa> — Promo Finance'` lendo a empresa do `useAuth()`/`useUserEmpresas()` (mesma fonte do Header), preservando o fallback genérico já implementado para rotas sensíveis `/contador/` e `/convite/` (:58; src/lib/navigation.ts:395-404).
**Benefícios:** fim do lançamento na empresa errada por confundir abas — risco direto de retrabalho contábil.
**Impacto × esforço:** Alto × P · **Depende:** N-082

### N-084 · P2 · Tipografia do PageHeader: gradiente e subtítulo
**Descrição:** O PageHeader aplica gradiente só na última palavra do título (src/components/layout/PageHeader.tsx:56-78) com `gradientVia="via-blue-500"` e `gradientTo="to-purple-600"` fixos em classes do Tailwind, fora dos tokens `--acc`/`--acc-2` definidos em src/index.css:26-27; e o subtítulo é `text-xl text-muted-foreground/70 italic` (:81). "Contas a Pagar" sai com "Pagar" em degradê azul-roxo enquanto o tema claro usa `--acc: #6a4cff`, e o subtítulo de 20px itálico com 70% de opacidade é o segundo elemento mais pesado da tela com o pior contraste.
**Exemplo prático:** trocar o degradê por token (`bg-[linear-gradient(90deg,hsl(var(--primary)),var(--acc-2))]`) ou removê-lo do caso padrão, deixando-o opt-in; e padronizar o subtítulo em `text-base text-muted-foreground` sem itálico nem fração de opacidade, atualizando os 42 importadores de uma vez já que os valores são default do componente.
**Benefícios:** título legível e coerente com o tema claro/escuro; subtítulo deixa de competir com o h1.
**Impacto × esforço:** Médio × P · **Depende:** N-081

### N-085 · P3 · Catálogo de navegação no /design-system-debug
**Descrição:** A rota pública `/design-system-debug` (src/App.tsx:69, src/pages/design-system-debug.tsx) existe no bundle de produção e não documenta nenhum componente de navegação — nem o BackButton, nem os estados do item de menu, nem a bottom nav. Sem essa página as decisões das etapas N-051 a N-084 ficam só no código e regridem na feature seguinte; é o papel de "component status/spec page" de um design system.
**Exemplo prático:** acrescentar em src/pages/design-system-debug.tsx uma seção "Navegação" com os três placements do BackButton, o item de menu nos quatro estados (padrão, hover, `aria-current="page"`, `aria-current="location"`), a trilha de breadcrumb, a bottom nav e as amostras de contraste medidas na N-067; e referenciar a seção em docs/COMPONENTS.md.
**Benefícios:** o dono confere a padronização numa tela só, sem abrir 20 rotas; novas telas copiam o padrão certo.
**Impacto × esforço:** Baixo × P · **Depende:** N-084

### 2.3 Acessibilidade e inclusão (N-086 → N-120)

### N-086 · P0 · `#main-content` ausente em 19 rotas
**Descrição:** o `<main id="main-content">` só existe dentro do shell (`src/components/layout/MainLayout.tsx:85-86`). Como 29 páginas de rota não chamam `MainLayout` e apenas 10 recebem o layout no roteador, 19 rotas renderizam sem ele — entre elas as 38 de `src/routes/tributarioRoutes.tsx`, que tem 0 ocorrências de `MainLayout`. Nessas telas o foco por rota do `NavigationTracker.tsx:77-97` nunca encontra o alvo, o `MutationObserver` fica 5s girando e desiste, e o skip link "Pular para conteúdo principal" aponta para uma âncora inexistente. Para o contador que usa leitor de tela, abrir a Calculadora Tributária significa continuar com o foco no link clicado, sem nenhum sinal de que a página mudou. Falha de 2.4.1 Bypass Blocks e 2.4.3 Focus Order (https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html).
**Exemplo prático:** aplicar `MainLayout` no roteador para todas as rotas privadas (um `element={<MainLayout><Pagina /></MainLayout>}` por rota em `src/routes/tributarioRoutes.tsx`, `fiscalRoutes.tsx` e nas demais sem shell) ou, como passo mínimo desta PR, extrair um `<RouteMain>` que garanta `<main id="main-content" tabIndex={-1}>` em volta do `children` e usá-lo nas 19 rotas órfãs.
**Benefícios:** anúncio de troca de página volta a funcionar em 19 telas, incluindo todo o módulo tributário; skip link deixa de ser link morto; o foco para de ficar preso no elemento da página anterior.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-087 · P1 · Breadcrumb mobile sem nome acessível
**Descrição:** nos níveis-pai da trilha o rótulo é `hidden sm:inline` (`src/components/navigation/ContextualBreadcrumbs.tsx:173`), então abaixo de 640px o `<Link>` contém só o ícone lucide — que não tem `aria-hidden` nem `<title>`. O resultado é um link sem nome acessível: o leitor de tela anuncia "link" e o usuário não sabe se volta para Financeiro ou para Administração. Falha de 2.4.4 Link Purpose e 4.1.2 Name, Role, Value (https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).
**Exemplo prático:** em `ContextualBreadcrumbs.tsx:173`, trocar `<span className="hidden sm:inline">{item.label}</span>` por `<span className="sr-only sm:not-sr-only sm:inline">{item.label}</span>` e marcar o `<Icon aria-hidden />`. O visual mobile (só ícones) não muda.
**Benefícios:** a trilha fica navegável por voz e leitor de tela no celular, onde hoje é um conjunto de links anônimos; nenhum custo de layout.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-088 · P1 · `high-contrast.css` escreve hex em token HSL
**Descrição:** `src/styles/high-contrast.css` redefine `--background: #000`, `--foreground: #fff` e `--border: #fff`, mas o Tailwind consome esses tokens como `hsl(var(--background))` (`tailwind.config.ts:27-31`) e `index.css:171` os declara como triplas HSL (`--ring: 252 100% 68%`). Com `prefers-contrast: high` o navegador resolve `hsl(#000)`, valor inválido, e a declaração cai — o modo alto contraste entrega fundo/borda indefinidos em vez de preto e branco. É o único arquivo de contraste do app (importado em `src/main.tsx:7`) e hoje piora o que deveria corrigir, para o usuário que mais precisa dele.
**Exemplo prático:** trocar por triplas sem função: `--background: 0 0% 0%; --foreground: 0 0% 100%; --border: 0 0% 100%;` e acrescentar `--card`, `--muted-foreground`, `--primary` e `--ring` no mesmo bloco, já que telas financeiras usam `text-muted-foreground` em valores de saldo.
**Benefícios:** modo alto contraste do SO passa a funcionar de fato nas listas de Contas a Pagar/Receber e na conciliação, onde a leitura de valor e sinal é crítica.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-089 · P1 · Drawer mobile sem semântica de diálogo
**Descrição:** `MobileSidebarDrawer` é um `motion.aside` cru: sem `role="dialog"`, `aria-modal`, foco preso, `Escape` ou devolução de foco (`src/components/layout/sidebar/MobileSidebarDrawer.tsx:28-56`). Ele carrega os 91 itens de navegação e é a única porta para a maior parte do app no celular. Com leitor de tela, abrir o drawer não move o foco para dentro dele e o conteúdo da página atrás continua tabulável; com teclado externo não há como fechar. Falha de 2.1.2 No Keyboard Trap e 4.1.2 (https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html); o padrão de navigation drawer modal do Material 3 exige foco contido e dispensa por Escape (https://m3.material.io/components/navigation-drawer/guidelines).
**Exemplo prático:** envolver o conteúdo do drawer em `Sheet`/`SheetContent` do shadcn já presente no repo (10 arquivos usam `SheetContent`), ou, mantendo o `motion.aside`, adicionar `role="dialog" aria-modal="true" aria-label="Menu de navegação"`, listener de `Escape` e um `useFocusTrap` novo em `src/hooks/`. Usar `SheetContent` tem o efeito colateral desejado de colocar o drawer sob o `[role="dialog"][data-state="open"]` de `src/lib/unsaved-guard.ts:12`, fazendo o Voltar/swipe fechá-lo.
**Benefícios:** o menu principal do mobile passa a ser fechável por teclado, gesto e Voltar, e para de deixar o foco vagando pela página de trás.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-090 · P1 · Busca do Header devolve o foco e trava o teclado
**Descrição:** o `Input` do header não tem `<Label>` nem `aria-label` (só `placeholder="Comando (Ctrl+K)..."`) e no `onFocus` faz `e.target.blur()` e dispara um `KeyboardEvent` sintético de Ctrl+K (`src/components/layout/Header.tsx:115-122`). Quem chega nele por Tab é expulso do campo e jogado numa paleta que abre sem aviso; quem usa leitor de tela ouve "editar texto" num campo que não aceita texto. Falha de 3.2.1 On Focus e 2.5.3 Label in Name (https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html).
**Exemplo prático:** substituir o `Input` por um `<button type="button" aria-label="Abrir busca de comandos (Ctrl+K)">` estilizado igual, chamando o mesmo `CustomEvent`/`setOpen` usado por `src/components/command-palette/CommandPalette.tsx:32`, em vez de simular tecla.
**Benefícios:** fim do salto de foco inesperado no elemento mais à esquerda do header, presente em todas as 110 telas desktop com shell.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-091 · P1 · Região `aria-live` para mudança de rota
**Descrição:** não há nenhuma região live anunciando navegação: o anúncio depende só do foco em `#main-content` (`src/components/providers/NavigationTracker.tsx:77-97`) e `MobileHeader` usa `span`, não `h1`, de propósito (`src/components/layout/MobileHeader.tsx:16-20`). Em SPA o movimento de foco sozinho costuma ler apenas o primeiro nó focado, não o nome da tela; com 130 rotas irmãs e transições de 350ms, o usuário de leitor de tela não tem confirmação de que saiu de Contas a Pagar e entrou em Conciliação. Recomendação de rota-anunciada em SPA: https://www.nngroup.com/articles/screen-reader-users/ e https://web.dev/articles/route-announcer.
**Exemplo prático:** criar `src/components/accessibility/RouteAnnouncer.tsx` com `<div role="status" aria-live="polite" className="sr-only">` e montá-lo ao lado de `NavigationTracker` em `src/App.tsx`, publicando `getRouteLabel(pathname)` — reusando a mesma fonte que já alimenta `document.title` (`NavigationTracker.tsx:54`) e respeitando `isSensitiveRoute` para não anunciar `/contador/:token`.
**Benefícios:** confirmação audível de cada troca de tela, independente de o shell existir ou não; aproveita o metadado das 119 entradas de `ROUTE_META`.
**Impacto × esforço:** Alto × P · **Depende:** N-086

### N-092 · P1 · Skip links fora do shell
**Descrição:** `SkipLinks` é montado dentro do `MainLayout` (`MainLayout.tsx:49`), logo as 19 rotas sem shell não têm skip link nenhum — e são justamente as que não têm sidebar nem bottom nav para pular. Além disso o alvo de navegação alterna por `isMobile` (`#mobile-bottom-nav` ou `#main-nav`), e `useIsMobile` retorna `false` no primeiro render (`src/hooks/use-mobile.tsx:6,19`), então no celular o primeiro Tab da sessão aponta para `#main-nav`, que não existe ali.
**Exemplo prático:** mover `<SkipLinks />` para `src/App.tsx`, acima de `<Routes>` (junto de `ModalHistoryManager`, fora do Suspense), e dentro do componente resolver o alvo por `matchMedia('(max-width: 767px)')` no próprio render, sem depender do estado tardio do `useIsMobile`.
**Benefícios:** o atalho de pular blocos passa a existir nas 130 rotas e deixa de apontar para âncora errada no primeiro Tab do celular.
**Impacto × esforço:** Médio × P · **Depende:** N-086

### N-093 · P1 · Paleta de comandos sem nome acessível
**Descrição:** `CommandDialog` renderiza `DialogContent` sem nenhum `DialogTitle`; a paleta só declara `DialogDescription className="sr-only"` (`src/components/command-palette/CommandPalette.tsx:95-96`) e `src/components/ui/command.tsx` é o único arquivo com `DialogContent` sem `DialogTitle` no repo. O Radix exige título para o diálogo ter nome acessível; sem ele o leitor de tela anuncia "diálogo" e os 51 comandos ficam num contêiner anônimo — e a paleta é o caminho de teclado para 51 das 130 rotas. Falha de 4.1.2.
**Exemplo prático:** em `CommandPalette.tsx`, adicionar `<DialogTitle className="sr-only">Paleta de comandos</DialogTitle>` como primeiro filho do `CommandDialog`; opcionalmente aceitar um prop `title` em `CommandDialog` (`src/components/ui/command.tsx`) para os outros consumidores.
**Benefícios:** remove o warning do Radix e dá nome ao principal atalho de navegação por teclado do produto.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-094 · P1 · Landmarks completos no shell e fora dele
**Descrição:** o app tem `<main>` (`MainLayout.tsx:85`), dois `<nav>` nomeados — `#main-nav` "Navegação principal" (`src/components/layout/sidebar/SidebarNavGroups.tsx:308-310`) e `#mobile-bottom-nav` "Navegação inferior" (`MobileBottomNav.tsx:30-32`) — e dois `<header>` (`Header.tsx:104`, `MobileHeader.tsx:14`), mas nenhum deles declara `role="banner"`/`aria-label`, e os dois podem coexistir no instante em que `useIsMobile` troca. Fora do shell não há landmark algum. Navegação por landmarks é um dos modos de leitura mais usados (https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html).
**Exemplo prático:** nomear os dois headers (`aria-label="Barra superior"` e `aria-label="Barra superior (mobile)"`), envolver o rodapé de suporte da sidebar em `<footer>` e, no `RouteMain` de N-086, incluir `<main>` com `aria-labelledby` apontando para o `h1` da página.
**Benefícios:** quem usa leitor de tela salta direto para a navegação ou para o conteúdo em qualquer tela, sem tabular pelos 91 itens do menu.
**Impacto × esforço:** Médio × P · **Depende:** N-086

### N-095 · P1 · Foco visível global por token
**Descrição:** `src/index.css` não tem nenhuma regra de `:focus-visible` nem de `outline` — só os tokens `--ring` (`index.css:171,212`). O foco visível depende de cada componente trazer sua classe: `focus-visible` aparece em apenas 30 arquivos do `src`, e nenhum deles é do shell (os `h-9 w-9` de `Header.tsx:148,173,205`, o botão de colapso da sidebar e os `Link` de `MobileBottomNav.tsx:43` não têm). Em uma tela de aprovação de pagamento, não ver onde está o foco é risco operacional. Falha de 2.4.7 Focus Visible e 2.4.13 Focus Appearance (https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html).
**Exemplo prático:** em `src/index.css`, dentro de `@layer base`, adicionar `:focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; }` e `:focus:not(:focus-visible) { outline: none; }` — uma regra, nenhum componente tocado.
**Benefícios:** foco perceptível em todos os controles do app, inclusive nos 164 arquivos de overlay, com uma única PR de 3 linhas.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-096 · P1 · `eslint-plugin-jsx-a11y` instalado e desligado
**Descrição:** o plugin está em `package.json:163` mas não aparece em `eslint.config.js` (0 ocorrências de `jsx-a11y` no arquivo), ou seja, a dependência existe e nenhuma regra roda. É o que explica achados como o drawer sem `role` (N-089) e o ícone sem `aria-hidden` (N-087) entrarem no `main` sem alerta. Mesma situação do `axe-core`/`vitest-axe`, cujos únicos testes são `src/test/a11y/critical-pages.test.tsx` com `SkipLinks` e um formulário sintético.
**Exemplo prático:** registrar o plugin em `eslint.config.js:33-38` com o preset `recommended` em modo `warn` e subir para `error` as regras de maior retorno aqui (`anchor-has-content`, `aria-props`, `role-has-required-aria-props`, `no-autofocus`), rodando `lint:strict` para medir a dívida antes de escolher o nível.
**Benefícios:** impede regressão de acessibilidade por PR sem custo de revisão manual; aproveita dependência já paga.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-097 · P1 · Ordem de tabulação do shell
**Descrição:** na árvore do `MainLayout` o `PWAInstallBanner`, o `GuidedTour`, o `OnboardingTour` e o `OfflineBanner` vêm antes da sidebar e do header (`MainLayout.tsx:51-73`), e o bloco fixo com `InstallPWA` + `NetworkStatusIndicator` (`:76-83`) entra entre header e `<main>`. Com dois tours montados ao mesmo tempo, a ordem de Tab do primeiro acesso passa por banners e tour antes de qualquer item de navegação, sem que a ordem visual (sidebar à esquerda, header no topo) corresponda. Falha de 2.4.3 Focus Order (https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html).
**Exemplo prático:** reordenar o JSX de `MainLayout.tsx` para `SkipLinks → header → nav → main → overlays`, movendo banners, tours e indicadores para depois do `motion.main`; posição é `fixed`, então nada muda visualmente.
**Benefícios:** o primeiro Tab após o skip link cai na navegação, não num banner de instalação de PWA.
**Impacto × esforço:** Médio × P · **Depende:** N-092

### N-098 · P2 · `aria-expanded` nos grupos da sidebar
**Descrição:** os 5 grupos do menu abrem e fecham por `toggleGroup` (`SidebarNavGroups.tsx:214-220`) em `<button>` que não declaram `aria-expanded` nem `aria-controls` — há 0 ocorrências de `aria-expanded` em `src/components/layout/`. Com 91 itens em 5 grupos e nenhuma busca interna, quem usa leitor de tela não sabe se "Fiscal" está aberto ou se simplesmente não tem itens. O `aria-current` já está correto no repo (`sidebarNavState.ts:16-30`), o que torna essa lacuna mais visível.
**Exemplo prático:** no botão de cabeçalho de grupo (`SidebarNavGroups.tsx:325`), adicionar `aria-expanded={isOpen}` e `aria-controls={`nav-group-${group.id}`}`, e pôr esse `id` no contêiner de itens.
**Benefícios:** o menu principal passa a ser previsível por leitor de tela, sem mudar nenhum pixel.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-099 · P2 · Botão de colapso da sidebar sem nome nem tamanho
**Descrição:** o controle que colapsa a sidebar é um `<button>` de `h-6 w-6` (24px) com apenas um `ChevronLeft`/`ChevronRight` dentro, sem `aria-label` nem `aria-expanded` (`src/components/layout/ResponsiveSidebar.tsx:90-99`). É o controle que decide entre 280px e 80px de menu em todas as telas desktop e é anunciado como "botão" vazio. Falha de 4.1.2 e, em tablet com toque, de 2.5.8 Target Size (mínimo 24×24 atendido no limite, abaixo dos 44px do Apple HIG: https://developer.apple.com/design/human-interface-guidelines/accessibility).
**Exemplo prático:** `aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}`, `aria-expanded={!collapsed}` e `aria-controls="main-nav"`; aumentar a área de toque com `before:absolute before:-inset-2` sem mudar o círculo visível.
**Benefícios:** controle utilizável por teclado, leitor de tela e toque em tablet, onde o shell desktop é o que monta.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-100 · P2 · Alvos de toque de 44px no mobile
**Descrição:** o X que fecha o drawer é `h-8 w-8` = 32px (`MobileSidebarDrawer.tsx:52`) e o `BackButton` do `MobileHeader` usa `size="sm"` = `h-7 w-7` = 28px (`MobileHeader.tsx:15`; `BackButton.tsx:52`) — os dois controles de saída de tela no celular, ambos abaixo do mínimo recomendado. A bottom nav está confortável (`h-20` com `px-5 py-3`), o que torna a inconsistência mais evidente. Referência: 48×48dp do Material 3 (https://m3.material.io/foundations/designing/structure#dab862b1-e329-4e9a-b5a1-5a1dbcadf0b0) e 2.5.8 Target Size (Minimum) (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
**Exemplo prático:** no drawer, trocar `className="h-8 w-8"` por `h-11 w-11`; no `MobileHeader`, usar `size="default"` (`h-9 w-9`) com `className="min-h-11 min-w-11"`. Nenhum dos dois altera o layout, que já tem folga de 56px de altura.
**Benefícios:** menos toques perdidos no fechar-menu e no Voltar, os dois gestos mais repetidos do uso em campo.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-101 · P2 · Reflow e zoom de 200%
**Descrição:** o shell desktop é todo fixo: sidebar de 280px/80px em `h-screen` (`ResponsiveSidebar.tsx:108-115`), header `h-16` ancorado em `left-[280px]` (`Header.tsx:104-110`) e `motion.main` com `marginLeft` numérico e `width: calc(100% - 280px)` (`MainLayout.tsx:85-97`). Como `useIsMobile` só olha `max-width: 768px`, dar 200% de zoom num monitor de 1280px produz viewport CSS de 640px ainda em modo desktop: sidebar come 44% da largura e o conteúdo financeiro sobra em ~360px. Falha de 1.4.10 Reflow e 1.4.4 Resize Text (https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
**Exemplo prático:** passar o shell para o breakpoint em `em` (`(max-width: 48em)`) dentro de `src/hooks/use-mobile.tsx`, de modo que o zoom do navegador caia no layout mobile como cai no celular; alternativamente colapsar a sidebar automaticamente abaixo de 1024px.
**Benefícios:** usuários com baixa visão passam a conseguir ler listas de contas com zoom alto, sem rolagem horizontal da página.
**Impacto × esforço:** Alto × M · **Depende:** N-104

### N-102 · P2 · Orientação travada no manifest
**Descrição:** `public/manifest.json` declara `"orientation": "portrait-primary"` com `display: standalone`, então o PWA instalado recusa paisagem. As telas de maior valor no celular são tabelas de conciliação e de contas, que cabem muito melhor deitadas, e quem usa suporte fixo de cadeira de rodas ou teclado acoplado não tem como girar o dispositivo. Falha de 1.3.4 Orientation (https://www.w3.org/WAI/WCAG22/Understanding/orientation.html).
**Exemplo prático:** remover a chave `orientation` (ou usar `"any"`) em `public/manifest.json` e conferir no modo mobile que o `pb-24` do `motion.main` e o `pb-[env(safe-area-inset-bottom)]` da bottom nav continuam corretos em paisagem.
**Benefícios:** destrava o uso do PWA deitado nas telas de tabela, com uma linha de diff.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-103 · P2 · Paridade de tablet
**Descrição:** o produto tem só dois estados de shell, decididos pelo único breakpoint 768 de `use-mobile.tsx:3`, e as classes de corte são `md:hidden`/`hidden sm:inline`. Entre 768px e 1024px — iPad em retrato, o formato típico de quem aprova pagamento fora da mesa — monta o shell desktop inteiro: sidebar de 280px, header com busca, nenhuma bottom nav, nenhum swipe-back (`MainLayout.tsx:37` liga o gesto só com `isMobile`) e alvos de toque de 24 a 36px. É um terceiro contexto sem desenho próprio.
**Exemplo prático:** introduzir `useBreakpoint()` em `src/hooks/use-mobile.tsx` com `mobile | tablet | desktop` e, para `tablet`, iniciar a sidebar colapsada (80px, com os rótulos no tooltip que `SidebarNavGroups` já tem) e habilitar `useSwipeBack` junto com o `MobileHeader`.
**Benefícios:** tablet deixa de ser um desktop apertado; mesmo caminho de Voltar em todos os aparelhos de toque.
**Impacto × esforço:** Alto × M · **Depende:** N-104

### N-104 · P2 · `useIsMobile` erra o primeiro render
**Descrição:** `useIsMobile` inicia `undefined` e retorna `!!isMobile`, resolvendo só no `useEffect` (`src/hooks/use-mobile.tsx:6,19`). No celular, o primeiro render monta `ResponsiveSidebar` + `Header` desktop e depois troca para `MobileHeader` + `MobileBottomNav` — e como `MainLayout` remonta a cada rota (os `useState` de `sidebarCollapsed`/`mobileMenuOpen` são locais, `MainLayout.tsx:31-32`), isso se repete em toda navegação. Para quem usa leitor de tela, a árvore de landmarks é substituída um frame depois do foco ir para `#main-content`; para quem usa teclado, o primeiro Tab muda de alvo.
**Exemplo prático:** inicializar o estado de forma síncrona — `useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches)` — mantendo o listener para rotação e zoom.
**Benefícios:** shell correto desde o primeiro frame, sem troca de landmarks sob o foco nem piscada de sidebar no celular.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-105 · P2 · Swipe-back com retorno e equivalente anunciado
**Descrição:** o swipe só reage no `touchend` (`src/hooks/useSwipeBack.ts:38-68`): não há feedback durante o arrasto, nem cancelamento visível, nem anúncio do destino — e o gesto exige começar nos 30px da borda e passar 80px. O botão existe como affordance (`MobileHeader.tsx:15`) e o Alt+← cobre teclado (`useKeyboardNavigation.ts:34-58`), então o que falta é o retorno perceptivo do próprio gesto. Gestos sem feedback contínuo são o ponto fraco clássico do padrão (https://www.nngroup.com/articles/gestures/); 2.5.1 Pointer Gestures pede alternativa de ponteiro único, que o botão já dá.
**Exemplo prático:** no `useSwipeBack`, adicionar `handleTouchMove` para publicar o progresso (0→1) e consumi-lo num indicador de borda no `MobileHeader`, anunciando o destino com `backLabel` do `useSmartBack` na região live de N-091 ao concluir.
**Benefícios:** o gesto deixa de ser tudo-ou-nada e o usuário sabe para onde está voltando antes de soltar o dedo.
**Impacto × esforço:** Médio × M · **Depende:** N-091

### N-106 · P2 · `marginLeft` do `main` escapa do reduced-motion
**Descrição:** `prefers-reduced-motion` é respeitado em três camadas (`MotionConfig reducedMotion="user"` em `App.tsx:108`, `REDUCED_MOTION_PRESET` em `transitions/presets.ts:127` e o bloco global de `index.css:503-517`), mas o `motion.main` anima `marginLeft` por 500ms a cada colapso da sidebar (`MainLayout.tsx:87-91`) e o `reducedMotion="user"` do framer suprime transform e layout, não propriedades de caixa — NÃO VERIFICADO em runtime, inferido da regra do framer e do fato de `marginLeft` não ser transform. A classe `transition-all duration-500` do mesmo elemento é coberta pelo CSS global, o `animate` do framer não.
**Exemplo prático:** em `MainLayout.tsx`, ler o preset com o `useTransition`/`REDUCED_MOTION_PRESET` já existente e passar `transition={{ duration: prefersReduced ? 0 : 0.5 }}` ao `motion.main`.
**Benefícios:** fecha a última animação ampla que ignora a preferência do sistema — relevante para usuários com sensibilidade vestibular que usam o app o dia inteiro.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-107 · P2 · Preferência de movimento lida uma vez por módulo
**Descrição:** `AnimatedNumber` avalia `matchMedia('(prefers-reduced-motion: reduce)')` no escopo do módulo (`src/components/motion/AnimatedNumber.tsx:24-25`), então o valor é congelado no primeiro import do chunk: mudar a preferência no SO não para a contagem dos KPIs até recarregar, e num PWA standalone o app fica aberto por dias. Os números animados são justamente os valores de saldo e totais do dashboard.
**Exemplo prático:** trocar a constante por `useReducedMotion()` do framer-motion (já dependência do projeto) dentro do componente, que reassina o `matchMedia`.
**Benefícios:** a preferência passa a valer na hora, sem reload, nas telas de maior leitura numérica.
**Impacto × esforço:** Baixo × P · **Depende:** —

### N-108 · P2 · Controles de acessibilidade em Minhas Preferências
**Descrição:** hoje contraste e movimento vêm só do SO (`src/styles/high-contrast.css`, `index.css:503`) e `src/pages/MinhasPreferencias.tsx` não tem nenhuma opção de acessibilidade (0 ocorrências de `fontSize`, `zoom` ou `contrast` no arquivo). O `html` já nasce com `class="dark"` fixo (`index.html:2`) e existe `ThemeProvider` no app, então falta expor o que o produto já sabe fazer: reduzir movimento, aumentar contraste e ampliar texto por conta do usuário, sem depender da configuração do aparelho — útil para o visualizador que usa máquina compartilhada do escritório.
**Exemplo prático:** adicionar um cartão "Acessibilidade" em `MinhasPreferencias.tsx` com três `Switch`/`Select` gravados via `usePersistedState` (`src/lib/persisted-ui-state.ts:7-29`), aplicando `data-reduced-motion`, `data-contrast` e `data-text-scale` no `documentElement` e atendendo-os no `index.css` junto das media queries existentes.
**Benefícios:** acessibilidade deixa de depender do SO; dá ao dono um lugar para responder pedidos de cliente sem nova PR de CSS.
**Impacto × esforço:** Médio × M · **Depende:** N-088, N-109

### N-109 · P2 · Escala de texto e tipos de 10px no shell
**Descrição:** o shell usa tamanhos fixos muito pequenos: `text-[10px]` em 3 pontos da bottom nav (rótulos Home/Receber/Pagar/Expert), 3 em `SidebarNavGroups`, 11 em `Header` e 6 em `RecentAndFavorites`; os itens de menu são `text-[13px]` (`SidebarNavGroups.tsx:257-261`) e o título do `MobileHeader` é `text-sm` com `truncate`. Valores em pixel não acompanham o tamanho de fonte do navegador/SO, então ampliar texto não ajuda em quase nada da navegação. Base do Material 3 e 1.4.4 Resize Text (https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
**Exemplo prático:** definir utilitários `text-nav` e `text-nav-label` em `tailwind.config.ts` com `rem` (0.8125rem / 0.6875rem) e substituir os literais de `src/components/layout/`; em seguida acrescentar `data-text-scale` ajustando `font-size` do `:root`.
**Benefícios:** a navegação acompanha a preferência de tamanho de fonte do usuário, em vez de ficar presa em 10px.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-110 · P2 · Nome e estado da trilha
**Descrição:** o `Breadcrumb` base traz `aria-label="breadcrumb"` em inglês (`src/components/ui/breadcrumb.tsx:12`) num produto declarado `lang="pt-BR"` (`index.html:2`) — o leitor de tela pronuncia a palavra inglesa com fonética portuguesa. O `aria-current="page"` do último item está correto (`breadcrumb.tsx:60`), e os separadores já são `aria-hidden` (`:73,:86`), então é só o rótulo do landmark que está fora do idioma declarado. Relacionado a 3.1.1 Language of Page (https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html).
**Exemplo prático:** em `src/components/ui/breadcrumb.tsx:12`, trocar por `aria-label="Trilha de navegação"`, mantendo o componente shadcn no restante; conferir se `AnomaliaBreadcrumb.tsx` não passa `aria-label` próprio.
**Benefícios:** a trilha é anunciada em português nas 119 rotas com metadado, alinhada ao idioma do app.
**Impacto × esforço:** Baixo × P · **Depende:** —

### N-111 · P2 · Badges de contagem sem nome no menu
**Descrição:** `getBadgeCount` injeta números em itens de navegação (aprovações, alertas, tributário, WhatsApp — `SidebarNavGroups.tsx:222-239`) e a bottom nav mostra `9+` no botão Menu (`MobileBottomNav.tsx:102-106`), sempre como texto solto dentro do link. O leitor de tela lê "Aprovações 7" sem dizer o que é 7, e o `9+` do Menu não diz que são aprovações pendentes — informação de decisão para o papel financeiro/admin.
**Exemplo prático:** envolver o número em `<span className="sr-only">` descritivo ou usar `aria-label` no link: `aria-label={`${item.label}, ${badge} pendentes`}`; no botão Menu, `aria-label={`Menu, ${aprovacoesPendentes} aprovações pendentes`}`.
**Benefícios:** a contagem que motiva o clique passa a ser compreensível por áudio, nos dois shells.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-112 · P3 · `h1` por página
**Descrição:** `src/pages` tem 216 arquivos `.tsx` e apenas 77 com `<h1>`, e o `MobileHeader` usa `span` deliberadamente porque "cada página já renderiza seu próprio título de nível 1" (`MobileHeader.tsx:16-20`) — premissa que não se sustenta nas páginas sem `h1`. Nessas telas o leitor de tela não tem nenhum heading de nível 1 para ancorar a leitura depois do foco em `#main-content`. Falha de 1.3.1 e 2.4.6 Headings and Labels (https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html).
**Exemplo prático:** auditar com `rg --files-without-match '<h1' src/pages --glob '*.tsx'`, priorizar as páginas de rota (não os `*.parts.tsx`) e usar o `label` de `ROUTE_META` como fonte: um `<PageTitle>` em `src/components/layout/` que renderize `h1` com `getRouteLabel(pathname)` quando a página não define o seu.
**Benefícios:** estrutura de headings previsível nas 130 rotas; melhora também a varredura visual de quem não usa leitor de tela.
**Impacto × esforço:** Médio × G · **Depende:** N-086, N-091

### N-113 · P3 · Anúncio do carregamento de rota lazy
**Descrição:** os 127 chunks de rota estão atrás de um único `Suspense` (`src/App.tsx:59`) cujo fallback é um spinner "Carregando..." genérico (`src/components/ui/loading-skeleton.tsx:253`), sem `role="status"` nem `aria-live`. Em conexão lenta no celular, o usuário de leitor de tela fica em silêncio entre o clique e a montagem — e é justamente nessa janela que o `NavigationTracker` ainda não achou o `#main-content` e usa `MutationObserver` com timeout de 5s (`NavigationTracker.tsx:88-96`).
**Exemplo prático:** em `loading-skeleton.tsx:253`, pôr `role="status" aria-live="polite" aria-busy="true"` no contêiner do fallback com texto "Carregando página"; o anúncio final de rota fica a cargo da região de N-091.
**Benefícios:** fim do silêncio na troca de rota lenta, sem mudar o visual do spinner.
**Impacto × esforço:** Médio × P · **Depende:** N-091

### N-114 · P3 · Suporte a `forced-colors`
**Descrição:** há 0 ocorrências de `forced-colors` no `src` (só `prefers-contrast` em `src/styles/high-contrast.css:1`). O shell depende fortemente de vidro e sombra — `glass-effect`, `backdrop-blur-3xl` e `bg-background/40` na bottom nav (`MobileBottomNav.tsx:33`), `bg-background/60` nos headers — e o indicador de item ativo da bottom nav é um fundo `bg-primary/10` com um ponto de 6px (`:68-77`). No modo de cores forçadas do Windows, backgrounds translúcidos e sombras são descartados e esse estado ativo desaparece, deixando a navegação sem "onde estou".
**Exemplo prático:** adicionar um bloco `@media (forced-colors: active)` em `src/index.css` dando `border` sólida aos contêineres de `glass-effect` e marcando o item ativo com `outline: 2px solid; outline-offset: -2px` em `[aria-current]` — o `aria-current` já existe e está semanticamente correto em 5 lugares (`sidebarNavState.ts:16-30`).
**Benefícios:** navegação ainda legível para usuários de alto contraste do Windows, público comum em ambiente corporativo e contábil.
**Impacto × esforço:** Médio × M · **Depende:** N-088

### N-115 · P3 · Pular para filtros e tabela nas telas de lista
**Descrição:** os dois skip links atuais levam a conteúdo e navegação (`SkipLinks.tsx:9-21`), mas as telas de maior uso — Contas a Pagar, Contas a Receber, Movimentações e Conciliação, as mesmas 4 que aceitam deep-link de linha (`useHighlightFromUrl.ts:23-44`) — têm barra de filtros longa antes da tabela. Quem usa teclado tabula pelos filtros toda vez que volta para a lista, inclusive depois de um Voltar semântico. Padrão de blocos repetidos de 2.4.1 Bypass Blocks.
**Exemplo prático:** aceitar `extraTargets` em `SkipLinks` e, nessas 4 páginas, marcar `id="tabela-principal"` no contêiner da tabela e `id="filtros"` na barra, oferecendo "Pular para a tabela".
**Benefícios:** reduz dezenas de Tabs por sessão nas telas onde o time financeiro passa o dia.
**Impacto × esforço:** Médio × M · **Depende:** N-092

### N-116 · P3 · Saída acessível dos `AlertDialog`
**Descrição:** o marcador de histórico cobre só `[role="dialog"][data-state="open"]` (`src/lib/unsaved-guard.ts:12`) e o `AlertDialog` ficou fora por decisão documentada, então Voltar e swipe não o fecham — e o `closeTopDialog` do `ModalHistoryManager` só despacha `Escape` (`ModalHistoryManager.tsx:74-76`), que o `AlertDialog` do Radix também não aceita por padrão. São os diálogos de confirmação destrutiva do produto (excluir conta, estornar). Quem navega por gesto no celular fica sem a saída que todos os outros 164 arquivos de overlay têm.
**Exemplo prático:** auditar os usos de `AlertDialog` e garantir em todos um `AlertDialogCancel` visível com foco inicial, mais `aria-describedby` apontando para a consequência da ação; registrar no comentário de `unsaved-guard.ts:12` que a saída por gesto é intencionalmente ausente nesses casos.
**Benefícios:** confirmações destrutivas ganham saída previsível por teclado e toque, sem reabrir a decisão de não empilhar marcador.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-117 · P3 · Atalhos que colidem com leitores de tela
**Descrição:** há 13 atalhos `Alt+letra` de navegação, 5 ações rápidas e `Esc`/`Ctrl+K`/`?` (`src/hooks/useKeyboardShortcuts.ts:34-207`), e dois listeners globais disputam `Ctrl+K` com `preventDefault` nos dois (`CommandPalette.tsx:32` abre a paleta, `useKeyboardShortcuts.ts:145` foca um input "Buscar"). `Alt+letra` é a faixa usada por comandos de NVDA/JAWS e por menus do navegador, e a tecla `n` solta abre o quick-create (`CommandPalette.tsx:35-45`). 2.1.4 Character Key Shortcuts pede poder desligar ou remapear (https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html).
**Exemplo prático:** centralizar o registro num `shortcutRegistry` em `src/hooks/useKeyboardShortcuts.ts`, resolver o conflito de `Ctrl+K` em favor da paleta, e ler um `atalhos_habilitados` de `usePersistedState` exposto no cartão de Acessibilidade de N-108; a lista de ajuda de `getShortcutsList` (`:247`) passa a derivar do registro em vez de ser espelhada à mão.
**Benefícios:** fim da colisão com software assistivo e da lista de ajuda que pode divergir dos atalhos reais.
**Impacto × esforço:** Médio × M · **Depende:** N-108

### N-118 · P3 · Testes axe por rota crítica
**Descrição:** `axe-core` e `vitest-axe` estão instalados (`package.json:98,135`) e os testes de a11y cobrem `SkipLinks`, um formulário sintético e um botão com `aria-label` (`src/test/a11y/critical-pages.test.tsx:21-45`) — nada do shell nem de rota real; e nos 28 specs E2E só 2 tocam navegação, por texto de botão (`login.e2e.ts:151,155`, `error-states.e2e.ts:25`). Sem rota renderizada no teste, achados como N-087 e N-089 não têm como aparecer.
**Exemplo prático:** acrescentar em `src/test/a11y/` um caso por shell — `MainLayout` com uma página simples, `MobileSidebarDrawer` aberto, `ContextualBreadcrumbs` em viewport mobile e a paleta aberta — usando o mesmo `axeConfig` do arquivo existente.
**Benefícios:** travar as correções de N-086 a N-093 contra regressão, no runner que já roda em CI.
**Impacto × esforço:** Médio × M · **Depende:** N-087, N-089, N-093

### N-119 · P3 · E2E de percurso por teclado
**Descrição:** nenhum dos 28 specs cobre Voltar semântico, breadcrumb, `aria-current`, bottom nav ou drawer, e o spec de 404 está desatualizado: clica em "Voltar para o Início" (`error-states.e2e.ts:25`) quando a página rotula "Ir para Início" (`NotFound.tsx:65`) e navega para `/dashboard/contas-receber` (`:16`) quando a rota real é `/contas-receber`. Sem esse percurso automatizado, cada PR de navegação é verificada à mão.
**Exemplo prático:** um spec novo em `e2e/` que, em desktop e em emulação mobile, faça Tab → skip link → `#main-content`, confira `document.title` e o `aria-current="page"` após navegar por `MobileBottomNav`, e feche o drawer por `Escape`; corrigir os dois seletores defasados de `error-states.e2e.ts` na mesma PR.
**Benefícios:** regressão de foco, rótulo e estado ativo passa a falhar no CI em vez de chegar à produção.
**Impacto × esforço:** Médio × M · **Depende:** N-086, N-089

### N-120 · P3 · Contrato de acessibilidade em `docs/`
**Descrição:** o repo tem decisões de acessibilidade boas e explicadas em comentário — `span` em vez de `h1` no `MobileHeader` (`MobileHeader.tsx:16-20`), `aria-current` `page` vs `location` (`sidebarNavState.ts:16-30`), skip link com alvo condicional (`MainLayout.tsx:46-49`), espera do `#main-content` sob Suspense (`NavigationTracker.tsx:77-86`) — mas espalhadas pelos arquivos, sem nenhum documento que diga o alvo (WCAG 2.2 AA), quem decide e o que um componente novo precisa entregar. Isso explica a divergência entre partes do código já cuidadosas e lacunas como N-089 e N-090.
**Exemplo prático:** escrever `docs/acessibilidade.md` com a regra de nome acessível, foco, landmarks, alvo de toque e contraste; apontá-lo em `AGENTS.md` como leitura obrigatória ao mexer em navegação, e ligar o gate: `eslint-plugin-jsx-a11y` (N-096) mais os testes axe (N-118) no workflow existente.
**Benefícios:** o padrão para de depender de quem escreveu o componente; revisão de PR passa a ter critério objetivo.
**Impacto × esforço:** Médio × P · **Depende:** N-096, N-118

### 2.4 Otimização de fluxos complexos (N-121 → N-150)

### N-121 · P0 · Retomar o onboarding tributário cai em tela vazia
**Descrição:** `src/pages/tributario/OnboardingTributario.tsx:36-60` salva o rascunho `{step, cnpjInput, empresaSelecionadaId}` em `localStorage` e restaura o passo no primeiro render, mas o resultado da consulta CNPJá (`cnpjData`) não é persistido. O passo 2 só renderiza com `step === 2 && cnpjData` (:241) — quem salvou no passo 2, fechou a aba e voltou vê o stepper no passo 2 e nada abaixo dele, sem botão para refazer a busca. O mesmo vale para `step` 3 e 4, que dependem de `empresaSelecionadaId` ter sobrevivido. É o primeiro fluxo que um cliente novo atravessa, então a falha acontece exatamente no pior momento.
**Exemplo prático:** em `OnboardingTributario.tsx`, ao hidratar um rascunho com `step >= 2` e `cnpjData === null`, voltar para `step 1` com o CNPJ já preenchido e disparar `handleBuscar()` automaticamente (ou mostrar um card "Retomamos sua última sessão — confirme o CNPJ"); alternativamente persistir `cnpjData` no mesmo `DRAFT_KEY`, já que o lookup é cacheado (`useCnpjaLookup`). Fallback obrigatório: todo `step` sem dado de apoio renderiza o passo 1, nunca `null`.
**Benefícios:** nenhum cliente novo trava em tela vazia na primeira semana de uso; a retomada vira o que o usuário espera (NN/g, "Wizards: definition and design recommendations", https://www.nngroup.com/articles/wizards/).
**Impacto × esforço:** Alto × P · **Depende:** —

### N-122 · P0 · Tour de onboarding reinicia do passo 1 a cada troca de tela
**Descrição:** `OnboardingTour` é montado dentro do shell (`src/components/layout/MainLayout.tsx:57`) e o shell é montado por cada página (89 páginas chamam `<MainLayout>`), então toda navegação remonta o tour. O componente não controla `stepIndex` do Joyride e faz `setRun(true)` sempre que `progress.is_completed` é falso (`src/components/onboarding/OnboardingTour.tsx:58-66`), de modo que o usuário volta ao passo 1 a cada clique no menu. O banco já guarda a posição (`last_step`, `steps_completed` — `src/hooks/useOnboardingProgress.ts:82-86`) e ela nunca é lida de volta.
**Exemplo prático:** passar `stepIndex` controlado a partir de `progress.last_step` (índice do passo em `tourSteps`) e avançar no `callback` com `EVENTS.STEP_AFTER`, gravando cada passo por `completarEtapa`. Enquanto o shell não virar rota de layout (N-006), mover `<GuidedTour />` e `<OnboardingTour />` de `MainLayout.tsx:54,57` para dentro de `AppRoutes` (`src/App.tsx:48-54`), onde já vivem `CommandPalette` e `ModalHistoryManager` e nada remonta por rota.
**Benefícios:** o tour deixa de ser um loop e passa a cobrir o que promete; a taxa de conclusão do onboarding fica medível pelo `last_step`.
**Impacto × esforço:** Alto × M · **Depende:** N-006

### N-123 · P0 · Trocar de empresa no meio de um formulário descarta o trabalho sem aviso
**Descrição:** `switchTo` em `src/components/layout/EmpresaSwitcher.tsx:68-75` grava a nova empresa, mostra um toast de sucesso e pronto; `focusEmpresa` no `EmpresaScopeBar.tsx:189` faz o mesmo pelo contexto. A troca dispara `resetQueries` em todo o cache fora da allowlist (`src/hooks/useSelectiveEmpresaInvalidation.ts:49-74`, ligado em `src/App.tsx:45`), mas nenhum dos dois consulta `hasUnsavedChanges()` (`src/lib/unsaved-guard.ts:41`) — o seletor fica fora das 4 saídas que a guarda cobre (link, Voltar, navegação programática, `beforeunload`). Resultado: um lançamento meio preenchido continua na tela com os dados de outra empresa por baixo, e o risco não é só perder digitação — é gravar valor na empresa errada.
**Exemplo prático:** envolver o corpo de `switchTo` e de `focusEmpresa` em `navigateWithUnsavedGuard(() => { ... })`, com texto específico no `AlertDialog` ("Você tem um lançamento não salvo em ACME LTDA. Trocar de empresa descarta as alterações."). O provider já expõe o fluxo pronto (`src/components/navigation/UnsavedGuardProvider.tsx:74-80`).
**Benefícios:** elimina a classe de erro mais caro do sistema multi-empresa (dado salvo no CNPJ errado) e dá ao usuário a chance de salvar antes.
**Impacto × esforço:** Alto × P · **Depende:** N-124

### N-124 · P1 · Wizards e dialogs de lote não declaram trabalho não salvo
**Descrição:** `useUnsavedChangesGuard` tem só 2 consumidores (`ContaPagarForm.tsx:69`, `ContaReceberForm.tsx:122`), enquanto o repo tem 12 fluxos vivos com estado de passo (`rg -l 'const \[step, setStep\]'`, excluindo testes: `OnboardingTributario`, `QuickCreateModal`, `GuidedTour`, `SpedEcdWizard`, `useSpedEcfWizardState`, `ImportLancamentosCSVDialog`, `BaixaAutomaticaDialog`, `ImportarExtratoDialog`, `TwoFactorSetup`, `CancelamentoNFe`, `InutilizacaoNFe`, `SSOWizardDialog`). Nenhum deles marca a tela como suja, então Voltar, swipe, atalho e `beforeunload` passam direto por cima de um acordo preenchido ou de um extrato já classificado.
**Exemplo prático:** em cada wizard, chamar `useUnsavedChangesGuard(open && step !== primeiroPasso)` — nos de formulário usar o `isDirty` do `react-hook-form` (`AcordoParcelamentoDialog.tsx:62`) ou de `useZodForm` (`src/hooks/useZodForm.ts:235`). Fazer uma PR por família (SPED, importações, NF-e, SSO/2FA) para o diff ficar legível.
**Benefícios:** uma única regra de "não perco meu trabalho" valendo nos fluxos longos; habilita N-123, N-129 e N-130 sem código novo de guarda.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-125 · P1 · Voltar dentro do wizard fecha o fluxo inteiro em vez de recuar um passo
**Descrição:** o `ModalHistoryManager` empilha um marcador de histórico por dialog aberto e consome o do topo no popstate (`src/components/navigation/ModalHistoryManager.tsx:24-39`), então Voltar/swipe fecha o dialog do wizard — descartando os 2 ou 3 passos já vencidos — em vez de recuar para o passo anterior, que é o que todo botão "Voltar" interno do próprio wizard faz (ex. `OnboardingTributario.tsx:307` `onClick={() => setStep(1)}`). Em celular, onde a navegação é o swipe da borda (`src/hooks/useSwipeBack.ts:16-18`), essa é a saída mais provável no meio do SPED ou da importação.
**Exemplo prático:** expor no `ModalHistoryManager` um registro opt-in (`registerStepBackHandler(() => boolean)`, no mesmo estilo de `registerOwnedEscapeHandler` já usado por `src/components/ui/confirm-dialog.tsx:5`): se o dialog do topo registrar um handler e ele devolver `true` (recuou um passo), o marcador é reempilhado e o dialog não fecha. Consumir primeiro em `SpedEcdWizard`, `useSpedEcfWizardState` e `ImportLancamentosCSVDialog`.
**Benefícios:** Voltar passa a significar "um passo atrás" dentro de fluxo, como em app nativo (Apple HIG, Navigation, https://developer.apple.com/design/human-interface-guidelines/navigation-and-search), sem perder o Voltar-fecha-modal das 164 telas com overlay.
**Impacto × esforço:** Alto × M · **Depende:** N-124

### N-126 · P1 · Rascunho do SPED-ECF nunca é apagado nem expira
**Descrição:** `useSpedEcfWizardState` grava `{step, recibo, ts}` por empresa + ano (`src/components/contabilidade/sped-ecf-wizard/useSpedEcfWizardState.ts:71-82`) e restaura ao abrir (:47-66), mas não existe nenhum `removeItem` para essa chave (`rg 'removeItem' src/components/contabilidade/sped-ecf-wizard/` = 0) e o `ts` gravado nunca é lido. Depois de transmitir a ECF de 2025, reabrir o wizard restaura o passo 2 com o recibo antigo, como se a obrigação estivesse pendente — informação errada numa tela de obrigação fiscal, e o contador é o papel que mais reabre essa tela.
**Exemplo prático:** apagar a chave no fim de `handleRegistrar` (`useSpedEcfWizardState.ts:127-135`, que hoje só limpa `recibo`) e descartar o rascunho mais velho que 7 dias ao hidratar, reusando a convenção já existente em `src/lib/import-checkpoint.ts:16` (`DEFAULT_TTL_MS`). Mostrar no passo 2 "rascunho de dd/MM às HH:mm" com botão "Começar do zero", como o painel de importação já faz (`import-lancamentos-csv/PreviewStep.tsx:121-147`).
**Benefícios:** o wizard volta a refletir o estado real da obrigação; o contador deixa de recomeçar por desconfiança do que está na tela.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-127 · P1 · Autosave de rascunho nos formulários de conta a pagar e receber
**Descrição:** os dois únicos formulários com guarda de não-salvos (`ContaPagarForm.tsx:69`, `ContaReceberForm.tsx:122`) oferecem só a escolha binária "descartar ou continuar": nada é persistido, então queda de conexão, 401 (`src/lib/edge-function-error.ts:205-211` troca a página inteira) ou fechar a aba zera 15 campos digitados. Lançamento de títulos é a tarefa mais repetida do produto, e o usuário financeiro costuma fazê-lo em lote com a nota fiscal ao lado.
**Exemplo prático:** usar `usePersistedState` (`src/lib/persisted-ui-state.ts:7-29`, tolerante a storage indisponível e hoje com só 2 consumidores) para gravar `form.watch()` com debounce de 800 ms na chave `rascunho:conta-pagar:<empresaId>:<userId>`; ao abrir o dialog sem `id` de edição e com rascunho presente, mostrar "Recuperar rascunho de dd/MM HH:mm" / "Descartar"; limpar no `onSuccess` da mutation. Vale WCAG 2.2 3.3.7 Redundant Entry (https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html).
**Benefícios:** digitação longa deixa de ser perdida por rede ou sessão; menos retrabalho na rotina diária de contas.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-128 · P1 · "Passo 2 de 4" não existe como texto nem como semântica
**Descrição:** o stepper do onboarding tributário (`src/pages/tributario/OnboardingTributario.parts.tsx:14-45`) é uma fila de `div`s: sem `role`, sem `aria-current`, e o rótulo de cada passo é `hidden sm:inline` (:36) — no celular sobram só os números `1 2 3 4` sem nome e sem total falado. Os outros fluxos repetem o padrão com marcações próprias (`StepPills` em `src/components/contabilidade/SpedEcdWizardBits.tsx`, `STEPS` em `src/components/admin/sso/SSOWizardDialog.helpers.ts`), cada um com sua forma de dizer onde o usuário está.
**Exemplo prático:** em `OnboardingTributario.parts.tsx`, envolver em `<ol role="list" aria-label="Etapas do onboarding">`, marcar o atual com `aria-current="step"`, acrescentar um `<p className="sr-only md:not-sr-only">Passo {current} de 4 — {label}</p>` e um `<Progress value={(current/4)*100}>` (o primitivo já é usado em 79 arquivos). Replicar no `StepPills` do SPED.
**Benefícios:** posição e esforço restante ficam claros no celular e no leitor de tela, reduzindo abandono no meio (NN/g, "Progress Indicators Make a Slow System Less Insufferable", https://www.nngroup.com/articles/progress-indicators/; MD3 Progress indicators, https://m3.material.io/components/progress-indicators/guidelines).
**Impacto × esforço:** Médio × P · **Depende:** —

### N-129 · P1 · Clicar fora do dialog do wizard descarta os passos vencidos
**Descrição:** `ImportLancamentosCSVDialog.handleClose` (`src/components/contabilidade/ImportLancamentosCSVDialog.tsx:68-72`) só impede o fechamento enquanto a importação está em voo (`importar.isPending`); fora disso, clique no overlay ou Escape fecha e agenda `reset()` em 200 ms, jogando fora arquivo, parse e preview. `ImportarExtratoDialog.handleClose` (`src/components/conciliacao/ImportarExtratoDialog.tsx:36-45`) faz o mesmo com as transações já selecionadas no preview. É o descarte acidental clássico: um clique fora da caixa apaga 5 minutos de classificação.
**Exemplo prático:** nos dois dialogs, `onInteractOutside`/`onEscapeKeyDown` com `preventDefault()` quando `step !== 'upload'` e pedir confirmação por `ConfirmDialog` (`src/components/ui/confirm-dialog.tsx`, variant `warning`): "Descartar a importação em andamento?". Com N-124 aplicado, a confirmação vem de graça pelo `UnsavedGuardProvider`.
**Benefícios:** fim do descarte por clique acidental nas duas telas de importação mais usadas pelo financeiro e pela contabilidade.
**Impacto × esforço:** Médio × P · **Depende:** N-124

### N-130 · P1 · Fechar a aba durante uma importação em lote não avisa nada
**Descrição:** o único `beforeunload` que protege trabalho é o do provider, e ele só dispara com `dirtyRef` ligado (`src/components/navigation/UnsavedGuardProvider.tsx:202-208`) — nenhuma importação marca sujo. O outro `beforeunload` do app é flush de telemetria (`src/lib/telemetry.ts:305`). Então fechar a aba no meio de `useImportLancamentosLote` interrompe a gravação em lote sem uma palavra; o checkpoint salva as refs já confirmadas (`src/lib/import-checkpoint.ts:40-66`), mas o usuário não sabe disso e não sabe quantos lançamentos entraram.
**Exemplo prático:** marcar `useUnsavedChangesGuard(importar.isPending)` em `ImportLancamentosCSVDialog` e, na mesma PR, mostrar no passo de resultado quantos itens foram confirmados antes da interrupção (`peekImportCheckpoint(key)` já devolve `refs` e `updatedAt`). Texto do aviso nativo é do browser; o que precisa existir é o gatilho.
**Benefícios:** operação longa deixa de ser perdida por um Ctrl+W; o usuário sabe exatamente onde parou e que pode retomar.
**Impacto × esforço:** Médio × P · **Depende:** N-124

### N-131 · P1 · Retomada de importação existe só na contábil; extrato e XML começam do zero
**Descrição:** `src/lib/import-checkpoint.ts` tem 1 consumidor de verdade (`ImportLancamentosCSVDialog.tsx:18,86`, com descarte em `PreviewStep.tsx:139` e limpeza no sucesso em `useLancamentosContabeis.ts:331`). As outras importações do produto — extrato bancário (`ImportarExtratoDialog.tsx`), baixa automática de recebíveis (`BaixaAutomaticaDialog.tsx:43`), XML de NF-e (`src/components/reforma-tributaria/ImportacaoXMLPanel.tsx`), CSV tributário (`src/components/tributario/CsvImportDialog.tsx`) — não têm checkpoint: falha no meio obriga a reprocessar o arquivo inteiro, com risco de duplicar o que já entrou.
**Exemplo prático:** reusar `createImportCheckpoint(key, total)` com `key = ${empresaId}:${arquivo.name}:${arquivo.size}:${quickHash(conteudo)}` (fórmula já documentada em `import-checkpoint.ts:8-10`) em `ImportarExtratoDialog` e `BaixaAutomaticaDialog`, confirmando por `ref` estável da transação; mostrar o mesmo alerta "Importação anterior detectada" de `PreviewStep.tsx:121-147`. Uma PR por dialog.
**Benefícios:** importação interrompida vira retomada em vez de reprocessamento, e cai o risco de lançamento duplicado na conciliação.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-132 · P1 · Inutilização de NF-e é irreversível e confirma com um clique
**Descrição:** `src/components/nfe/InutilizacaoNFe.tsx:330` avisa em texto que "a inutilização é irreversível", mas a ação é um botão comum no último passo do próprio fluxo — não há `AlertDialog` nem confirmação por digitação. Mesmo padrão em `CancelamentoNFe.tsx`. Hoje as duas param num guard de homologação (`InutilizacaoNFe.tsx:88`, `CancelamentoNFe.tsx:80`), ou seja: a hora de colocar a barreira é antes de a integração SEFAZ virar real, não depois.
**Exemplo prático:** envolver a ação final em `ConfirmDialog variant="danger"` (`src/components/ui/confirm-dialog.tsx:20`) exigindo digitar a faixa numérica ("digite 1054-1060 para confirmar") e repetir no texto empresa, série e faixa. Atende WCAG 2.2 3.3.4 Error Prevention (Legal, Financial, Data) — https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html.
**Benefícios:** evita inutilizar faixa de numeração fiscal por engano — erro sem desfazer, com efeito contábil e fiscal.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-133 · P1 · Aprovar pagamento é um clique só, sem confirmação e sem desfazer
**Descrição:** em `src/components/aprovacoes/AprovacoesPendentes.tsx:247-256` o botão "Aprovar" chama `handleAprovar` (:66), que executa `aprovarMutation.mutate` direto e solta confete no sucesso. Rejeitar tem dialog com motivo obrigatório (:75-90); aprovar — o lado que libera dinheiro — não tem nada, e o cartão fica lado a lado com "Detalhes" num grid, onde o clique errado é fácil no celular.
**Exemplo prático:** passar `handleAprovar` por `ConfirmDialog variant="warning"` com valor, fornecedor e empresa no corpo ("Aprovar R$ 12.480,00 para ACME LTDA — Empresa X?"), e guardar `solicitacaoId` por 5 s para um toast com "Desfazer" quando a mutation de reversão existir. Mesmo critério WCAG 2.2 3.3.4 da etapa anterior.
**Benefícios:** uma aprovação indevida deixa de ser um clique de distância; o aprovador vê o valor no momento da decisão.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-134 · P1 · "Tentar novamente" depois de erro volta ao passo 1 e perde o arquivo
**Descrição:** no passo de erro da importação de extrato, o botão "Tentar novamente" chama `resetState()` (`src/components/conciliacao/ImportarExtratoDialog.tsx:288`), que devolve o fluxo ao `upload` e limpa `progress`, `resultado` e `selectedTransacoes` (:36-41). Ou seja: o erro pode ter sido uma falha de rede no último passo, e a recuperação exige escolher o arquivo de novo e reclassificar tudo. `BaixaAutomaticaDialog` cai no mesmo `step: 'error'` (:136,144) sem caminho de retomada.
**Exemplo prático:** separar "Tentar novamente" (repete a última operação com o `file`/`parseResult` que já estão em estado) de "Começar do zero" (`resetState`); guardar a função que falhou num `lastActionRef` e reexecutá-la. Padrão de recuperação de erro da heurística 9 de Nielsen (https://www.nngroup.com/articles/ten-usability-heuristics/).
**Benefícios:** falha transitória volta a custar um clique em vez de refazer o trabalho; menos abandono da conciliação no fim do mês.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-135 · P2 · Passo atual na URL nos fluxos que são rota
**Descrição:** `/tributario/onboarding` guarda o passo só em estado local + rascunho (`OnboardingTributario.tsx:55`) e `/auth/corporate` é uma sequência de cards de estado (`src/pages/auth/CorporateOnboarding.tsx`). Nenhum passo aparece na URL — o único caso de passo em rota no app é `/reforma-tributaria/:tab` (`src/lib/navigation.ts:18-22`). Consequência prática: suporte não consegue pedir "me manda o link de onde você travou", e recarregar depende inteiramente do rascunho (N-121).
**Exemplo prático:** usar `useUrlTab` (`src/hooks/useUrlTab.ts:15-20`, que já deduplica o duplo `onValueChange` do Radix) ou `useSearchParams` para espelhar `?passo=2` em `OnboardingTributario`, com validação do valor (1 a 4) e `replace: true` para não poluir o histórico; o rascunho continua guardando os dados, a URL guarda só a posição.
**Benefícios:** link compartilhável para suporte e recarga previsível; o Voltar do browser passa a andar entre passos sem código extra.
**Impacto × esforço:** Médio × P · **Depende:** N-121

### N-136 · P2 · Wizard reseta em silêncio quando a empresa muda por baixo
**Descrição:** `SpedEcdWizard` recebe `empresaId`/`anoCalendario` por prop e, no efeito `[open, empresaId, anoCalendario]`, faz `setStep(1)` e `setResultado(null)` (`src/components/contabilidade/SpedEcdWizard.tsx:61-67`); `useSpedEcfWizardState` reage igual (:47-66). Como a troca de empresa não pede confirmação (N-123) e o seletor fica no header, acima do dialog, o usuário pode ver o wizard voltar ao passo 1 sem entender o motivo — e, pior, o `resultado` da geração anterior desaparece junto com o hash exibido.
**Exemplo prático:** quando `empresaId` mudar com o dialog aberto e `step > 1`, não resetar: mostrar um `Alert variant="warning"` no topo do `DialogContent` ("A empresa ativa mudou para X. Este wizard está gerando a ECD de Y — feche e reabra para a nova empresa.") e desabilitar o botão de gerar. Combinado com N-123, o caso passa a ser raro, mas deixa de ser silencioso.
**Benefícios:** nenhuma geração de obrigação fiscal roda contra uma empresa que o usuário não escolheu naquela tela.
**Impacto × esforço:** Médio × P · **Depende:** N-123

### N-137 · P2 · Chaves de rascunho sem usuário e sem empresa
**Descrição:** `DRAFT_KEY = 'tributario:onboarding:draft'` é global (`OnboardingTributario.tsx:36`) — não tem usuário nem empresa no nome, e `localStorage` é por navegador. Em máquina compartilhada do escritório contábil, o rascunho de um CNPJ aparece na sessão do colega. O wizard SPED-ECF já faz certo (`WIZARD_DRAFT_KEY(empresaId, ano)` em `sped-ecf-wizard/types.ts:11`), e há 119 chaves distintas de `localStorage` no app sem convenção comum.
**Exemplo prático:** trocar por `tributario:onboarding:${user.id}` (ou `:${empresaSelecionadaId}` quando já houver empresa) e centralizar a montagem num helper em `src/lib/persisted-ui-state.ts`, para as próximas telas herdarem a regra; migrar/limpar a chave antiga na primeira leitura.
**Benefícios:** rascunho de uma empresa não vaza para a sessão de outro usuário no mesmo computador.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-138 · P2 · Fluxo condicional por papel avisa no fim, não no começo
**Descrição:** `ROUTE_META` guarda `requiredRoles` por rota (`src/lib/navigation.ts:11-16`) e `ProtectedRoute` mostra o card "Acesso restrito" com o papel exigido e um mailto de solicitação (`src/components/auth/ProtectedRoute.tsx:48-114`), mas isso só acontece na porta da rota. Dentro de um fluxo, o passo que exige outro papel só falha ao executar: no onboarding tributário, "Criar empresa" (`OnboardingTributario.tsx:293`) e o convite de contador (`StepConvidarContador`) são ações de administrador, e um usuário `financeiro` ou `visualizador` atravessa os passos 1 e 2 para descobrir no 3 que não pode concluir.
**Exemplo prático:** no `StepIndicator`, marcar os passos indisponíveis para o papel atual (`useAuth().hasRole`) com badge "requer administrador" e desabilitar o Avançar com `Tooltip` explicando quem destravar; reusar os rótulos de `ROLE_LABELS` já usados em `ProtectedRoute.tsx:49-50` para o texto ser o mesmo nos dois lugares.
**Benefícios:** o usuário sabe antes de investir tempo se consegue terminar, e já sabe de quem pedir acesso.
**Impacto × esforço:** Médio × M · **Depende:** N-128

### N-139 · P2 · 401 no meio do fluxo troca a página inteira e leva o rascunho
**Descrição:** qualquer chamada de Edge Function que devolva 401 dispara `signOut()` e `window.location.replace('/auth?redirect=...')` depois de 350 ms (`src/lib/edge-function-error.ts:201-211`). É um reload de verdade: estado local de wizard, preview de importação e seleção de transações morrem, e o `?redirect=` só devolve a rota — não o passo nem os dados. Em fluxo longo (SPED, importação, acordo), a sessão expirando no pior momento equivale a recomeçar.
**Exemplo prático:** antes do `replace`, gravar um "retorno de fluxo" (`sessionStorage`, chave `pf:retomar-fluxo` com rota + passo + id do rascunho) e, após o login, oferecer "Retomar de onde parou" na rota restaurada. Com N-127 e N-126 no lugar, o rascunho já existe — falta só o ponteiro. Referência: WCAG 2.2 2.2.6 Timeouts (https://www.w3.org/WAI/WCAG22/Understanding/timeouts.html).
**Benefícios:** expiração de sessão deixa de custar o trabalho da última meia hora.
**Impacto × esforço:** Médio × M · **Depende:** N-127

### N-140 · P2 · Importação longa prende o usuário no modal, sem cancelar
**Descrição:** enquanto `importar.isPending`, `handleClose` recusa fechar o dialog (`ImportLancamentosCSVDialog.tsx:69`) e não há botão de cancelar: o hook não tem `AbortController` nem `signal` (`rg 'AbortController|signal' src/hooks/useLancamentosContabeis.ts` = 0). Numa importação de milhares de lançamentos, a única saída é fechar a aba — que é exatamente o caminho sem aviso da N-130. O progresso já é bem instrumentado (taxa e tempo restante em `import-lancamentos-csv/format-helpers.ts:6-24`), o que falta é poder sair.
**Exemplo prático:** passar um `AbortSignal` do dialog para `useImportLancamentosLote`, verificar `signal.aborted` entre os lotes (o loop que chama `checkpoint.confirm`) e adicionar "Interromper" no passo de progresso, com resumo "X de Y importados — retomável". O checkpoint garante que o que entrou não se repete.
**Benefícios:** operação longa deixa de ser uma armadilha; o usuário pausa e retoma no mesmo arquivo.
**Impacto × esforço:** Médio × M · **Depende:** N-131

### N-141 · P2 · Checklist de onboarding só existe no dashboard
**Descrição:** `OnboardingChecklist` só renderiza quando `location.pathname === '/'` (`src/components/layout/MainLayout.tsx:42,108`). Como `last_step` e `steps_completed` já ficam no banco (`useOnboardingProgress.ts:9-11`), o progresso existe mas desaparece assim que o usuário navega — e o que falta terminar (cadastrar conta bancária, importar extrato, convidar contador) não tem nenhum lembrete nas telas onde essas ações acontecem.
**Exemplo prático:** manter o checklist no dashboard e adicionar um indicador discreto no `Header` (contador "3 de 7") que abre um `Sheet` com a lista, cada item navegando pela rota correspondente via `navigateWithUnsavedGuard`; aproveitar `RecentAndFavorites.tsx:21`, que já filtra itens por papel exigido, para não sugerir passo que o papel não pode executar.
**Benefícios:** onboarding conduz o usuário além da primeira tela, com progresso sempre visível.
**Impacto × esforço:** Médio × M · **Depende:** N-122

### N-142 · P2 · Fluxos de rota sem guarda de saída
**Descrição:** as rotas de fluxo — `/tributario/onboarding`, `/auth/corporate`, `/convite/:token`, `/contador/:token` — não declaram estado sujo em lugar nenhum (`useUnsavedChangesGuard` tem 2 consumidores, ambos em dialogs de conta). O onboarding tributário é o caso crítico: o botão "Voltar" interno (`OnboardingTributario.tsx:307`) recua passo, mas o Voltar do browser, o swipe e qualquer item do menu saem da rota — e o rascunho só cobre `step`, `cnpjInput` e `empresaSelecionadaId` (:38-42), não `cnpjData`.
**Exemplo prático:** `useUnsavedChangesGuard(step > 1 && !concluido)` em `OnboardingTributario`, com o texto do `AlertDialog` do provider ajustado para "Sair do onboarding? Você pode retomar depois — seu progresso fica salvo". Nas rotas de token, nada a guardar: o que falta é dizer isso no texto (etapa N-149).
**Benefícios:** saída acidental do onboarding passa a ser consciente e honesta sobre o que é preservado.
**Impacto × esforço:** Médio × P · **Depende:** N-121, N-124

### N-143 · P2 · Voltar do "Acesso restrito" pode cair na mesma rota negada
**Descrição:** o card de acesso restrito usa `goBack` de `useSmartBack('button')` (`src/components/auth/ProtectedRoute.tsx:31,104`). Em entrada direta por link, `useSmartBack` sobe para a rota-pai com `replace` (`src/hooks/useSmartBack.ts:49-66`) — e em área administrativa o pai costuma exigir o mesmo papel (`/admin/...` → `/admin`), então o usuário recebe o mesmo card de novo e o Voltar seguinte repete a subida. Para `visualizador` ou `contador` que recebeu um link interno, é um beco.
**Exemplo prático:** em `ProtectedRoute`, trocar o `goBack` solto por `<BackButton fallbackPath="/dashboard" />` quando a rota-pai também exigir papel não concedido (comparar `ROUTE_META[parent]?.requiredRoles` com `hasRole`); o `BackButton` já anuncia o destino e já passa pela guarda de não-salvos (`src/components/navigation/BackButton.tsx:43,49`).
**Benefícios:** quem não tem acesso sempre tem uma saída que funciona, em vez de girar entre telas negadas.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-144 · P2 · Um stepper só, e morte do wizard morto
**Descrição:** há três implementações de passo visual (`OnboardingTributario.parts.tsx:14`, `StepPills` em `SpedEcdWizardBits.tsx`, `STEPS` em `admin/sso/SSOWizardDialog.helpers.ts`) e um quarto componente completo sem nenhum importador: `src/components/ui/wizard.tsx`, 401 linhas com `Stepper` e `prevLabel: 'Voltar'` (:323). Cada fluxo acerta e erra em coisas diferentes (acessibilidade, rótulo no mobile, cor do passo concluído), o que torna qualquer correção de UX uma correção em três lugares.
**Exemplo prático:** extrair `src/components/navigation/FlowStepper.tsx` com a semântica da N-128 (ol/`aria-current="step"`, "Passo X de Y", `Progress`), migrar os três consumidores um por PR e apagar `src/components/ui/wizard.tsx` junto com os outros dois primitivos sem importador (`ui/drawer.tsx`, `ui/sidebar.tsx`) na PR de limpeza da N-050.
**Benefícios:** uma correção de fluxo passa a valer para todos os wizards; menos código morto confundindo quem for mexer.
**Impacto × esforço:** Médio × M · **Depende:** N-128

### N-145 · P2 · Acordo de parcelamento confirma sem tela de resumo
**Descrição:** `AcordoParcelamentoDialog` monta valor original, desconto por slider, número de parcelas e simulação (`src/components/cobranca/AcordoParcelamentoDialog.tsx:52-70`, `simularParcelamento` em `useAcordosParcelamento.helpers`) e grava o acordo direto do formulário, com confete e som no sucesso (`useConfetti`, `sounds`). Não existe passo de revisão antes de criar: o usuário confirma um compromisso financeiro de várias parcelas olhando os mesmos campos que acabou de editar, e o acordo altera recebíveis existentes.
**Exemplo prático:** acrescentar um passo final de leitura no mesmo dialog (sem virar rota): cliente, valor original, desconto em R$ e %, total do acordo, data da primeira parcela e a tabela das parcelas, com `ConfirmDialog variant="warning"` no botão "Criar acordo". Reusar `formatCurrency` e a saída de `simularParcelamento` já calculada.
**Benefícios:** menos acordo criado com desconto ou data errada — erro que o cliente final vê e que dá retrabalho de cobrança.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-146 · P2 · Preview de extrato perde a classificação ao fechar
**Descrição:** `selectedTransacoes` é um `Set` em estado local (`ImportarExtratoDialog.tsx:33`) e `resetState` o zera em todo fechamento (:36-41). Quem passa 10 minutos marcando quais transações do OFX entram, e precisa sair para conferir um fornecedor noutra tela, volta para a estaca zero — e o dialog não tem URL própria, como nenhum dos 164 arquivos com overlay.
**Exemplo prático:** persistir `{ arquivoKey, selecionadas, step }` com `usePersistedState` (`src/lib/persisted-ui-state.ts:7-29`) sob `conciliacao:extrato-preview:<empresaId>` e, ao reabrir o dialog com o mesmo arquivo (mesma `key` da N-131), restaurar a seleção com aviso "Retomamos sua classificação de dd/MM HH:mm".
**Benefícios:** conciliação volta a ser interrompível, que é como o fechamento de mês realmente acontece.
**Impacto × esforço:** Médio × P · **Depende:** N-131

### N-147 · P3 · Nenhum funil medido nos fluxos multi-etapas
**Descrição:** a telemetria coleta só erro e Web Vitals (`src/lib/telemetry.ts:262-300`) e o único breadcrumb de navegação é `nav_back` (`src/hooks/useSmartBack.ts:53`), que sobe apenas anexado a um erro (`telemetry.ts:21,251`). Não existe nenhum evento de "passo iniciado / concluído / abandonado", então não há como saber se o onboarding morre no passo 2, se a importação morre no preview ou se o SPED é abandonado antes de gerar — justamente as decisões de produto que o dono precisa tomar.
**Exemplo prático:** expor `trackFlowStep(fluxo, passo, resultado)` em `src/lib/telemetry.ts` e chamá-lo nos 12 fluxos com estado de passo, usando o mesmo cuidado de privacidade já aplicado às rotas sensíveis (redação de chaves em `telemetry.ts:27`; `/contador/` e `/convite/` fora de título e recentes — `src/lib/navigation.ts:395-404`). Sem CNPJ, nome ou valor no payload.
**Benefícios:** o dono passa a ver onde o dinheiro de atenção se perde e prioriza correção por evidência, não por impressão.
**Impacto × esforço:** Médio × M · **Depende:** N-128

### N-148 · P3 · E2E não cobre nenhum fluxo multi-etapas
**Descrição:** são 28 specs E2E (`playwright.config.ts:16`) e apenas duas tocam navegação, por texto de botão (`login.e2e.ts:151,155`, `error-states.e2e.ts:25`). Nenhuma percorre onboarding tributário, importação com checkpoint, wizard SPED ou acordo — e os testes unitários de navegação param na camada pura (`src/lib/__tests__/navigation.test.ts`, `BackButton.test.tsx`, `sidebarNavState.test.ts`), sem cobrir `UnsavedGuardProvider` nem `ModalHistoryManager`. As correções desta seção mexem em histórico e rascunho, onde regressão é silenciosa.
**Exemplo prático:** dois specs novos em `e2e/`: (1) onboarding tributário — preencher passo 1, recarregar, conferir que retoma com o CNPJ (N-121) e que sair pede confirmação (N-142); (2) importação CSV contábil — importar com falha simulada, reabrir o mesmo arquivo e conferir o alerta "Importação anterior detectada" com o número de itens pulados (N-131).
**Benefícios:** as garantias de retomada passam a ser verificadas a cada PR, em vez de depender de teste manual.
**Impacto × esforço:** Médio × M · **Depende:** N-121, N-131

### N-149 · P3 · Texto de confirmação sem consequência em dinheiro e empresa
**Descrição:** as confirmações existentes anunciam a ação, não o efeito: `confirmText="Sim, Cancelar"` (`src/pages/Asaas.tsx:371`), `"Estornar"` (`src/components/bling/BlingFinanceiroPanel.tsx:356`), `"Remover"` (`contabilizacao-automatica/RegrasTable.tsx:349`) — 15 arquivos usam `AlertDialogAction` e nenhum diz valor, quantidade ou empresa afetada. Num produto multi-empresa, "Confirmar?" sem o nome do CNPJ é a pergunta que o usuário não consegue responder.
**Exemplo prático:** padronizar o corpo de `ConfirmDialog`/`AlertDialog` em três linhas — o que acontece, sobre o que (valor/quantidade), em qual empresa — e deixar o rótulo do botão como verbo do efeito ("Estornar R$ 1.240,00"). NN/g, "Confirmation Dialogs Can Prevent User Errors" (https://www.nngroup.com/articles/confirmation-dialog/).
**Benefícios:** menos confirmação no automático e menos ação destrutiva na empresa errada.
**Impacto × esforço:** Médio × M · **Depende:** N-132, N-133

### N-150 · P3 · Catálogo dos fluxos multi-etapas na documentação do time
**Descrição:** os 12 fluxos com estado de passo não estão listados em nenhum lugar: quem for mexer descobre por `rg 'const \[step, setStep\]'`, e cada um tem convenção própria de rascunho (chave global em `OnboardingTributario.tsx:36`, por empresa+ano em `sped-ecf-wizard/types.ts:11`, checkpoint por hash em `src/lib/import-checkpoint.ts:8-10`, nada nos outros nove). Sem catálogo, as regras desta seção se perdem no próximo wizard que alguém criar.
**Exemplo prático:** uma página em `docs/` (referenciada por `docs/agentes/mapa-repo.md`) com uma linha por fluxo: arquivo, passos, onde o rascunho mora, se declara não-salvo, se tem retomada e qual é a ação irreversível. Fechar com o checklist de fluxo novo (stepper da N-144, guarda da N-124, rascunho com TTL e escopo da N-126/N-137, confirmação da N-149).
**Benefícios:** o próximo fluxo nasce com retomada e guarda em vez de repetir o diagnóstico desta seção.
**Impacto × esforço:** Baixo × P · **Depende:** N-144

### 2.5 Testes e validação (N-151 → N-175)

### N-151 · P1 · Evento nav_page_view na telemetria própria
**Descrição:** hoje a telemetria coleta só erro e Web Vitals (`src/lib/telemetry.ts:262-300`): não existe nenhum evento de navegação — 0 ocorrências de page_view/analytics em `src/lib`. Sem isso nenhum KPI desta seção é calculável: não se sabe quais das 130 rotas o pessoal do financeiro realmente abre, nem quantas vezes o contador cai em `/tributario` por semana. O evento é a base de taxa de uso do Voltar, abandono, profundidade e INP por rota.
**Exemplo prático:** nova tabela `frontend_navigation_events` (migration em `supabase/migrations/`, DDL por `supabase_db_query`) com `user_id`, `empresa_id`, `event`, `route_label`, `path_redacted`, `nav_type`, `session_id`, `created_at`, RLS por `empresa_acessivel(empresa_id)`. Em `src/lib/telemetry.ts` exportar `reportNavEvent(event, data)` com fila e `scheduleFlush()` iguais às existentes; emitir em `src/components/providers/NavigationTracker.tsx` no mesmo `useEffect` que já roda por `location` (:40), reusando `getRouteLabel(pathname)` e o guard `untracked` de `excludedRoutes`/`isSensitiveRoute` (:44) — assim `/contador/:token` e `/convite/:token` nunca entram, como já acontece com `document.title` (:58). Amostragem de 100% para eventos de navegação, mas fila própria com `MAX_QUEUE` e desconto no orçamento `KEEPALIVE_ORCAMENTO_BYTES` (telemetry.ts:155), que hoje é de 60.000 bytes para erro + performance e seria estourado por um terceiro fluxo.
**Benefícios:** decisão de navegação deixa de ser opinião; dá para priorizar o shell e o menu pelas rotas que o papel financeiro usa de fato, e medir antes/depois de cada etapa deste plano.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-152 · P1 · nav_back como evento, não breadcrumb de erro
**Descrição:** o único rastro de navegação instrumentado é `addBreadcrumb('nav_back', { from, to, method, inApp })` em `src/hooks/useSmartBack.ts:53`, e breadcrumb só sobe anexado a um erro (`telemetry.ts:251`, fila de no máximo 20 — `MAX_BREADCRUMBS` em :21). Resultado: o Voltar semântico que esta equipe construiu não tem nenhuma medição em sessão sem erro. A taxa de uso do Voltar por rota é o sinal mais direto de que a tela não oferece a saída certa.
**Exemplo prático:** no `goBack` de `src/hooks/useSmartBack.ts` chamar `reportNavEvent('nav_back', { from, to, method, inApp })` junto do `addBreadcrumb` atual (mantém o breadcrumb para o contexto de erro); `method` já distingue botão, atalho Alt+← e swipe, vindo dos 4 consumidores (`BackButton.tsx:32`, `useKeyboardNavigation.ts:19`, `useSwipeBack.ts:21`, `ProtectedRoute.tsx:31`). Medir `taxa_voltar = nav_back / nav_page_view` por `route_label`.
**Benefícios:** identifica as telas financeiras onde o usuário entra e sai sem concluir nada (ex. detalhe de conta a pagar aberto por engano) e separa quem volta por botão de quem volta por swipe no celular.
**Impacto × esforço:** Alto × P · **Depende:** N-151

### N-153 · P2 · KPI de voltas consecutivas e profundidade da sessão
**Descrição:** a pilha in-app própria já sabe tudo que é preciso: trata POP, PUSH, REPLACE, forward nativo e saltos de histórico (`src/lib/navigation.ts:345-390`) e `previousNavEntry()` é lido no clique do Voltar (`useSmartBack.ts:51`). Duas ou três voltas consecutivas sem nenhuma ação no meio é o padrão clássico de "não encontrei onde fica" — e profundidade média alta indica caminho longo até conciliação ou aprovação. Nada disso é exportado hoje.
**Exemplo prático:** em `src/lib/navigation.ts` expor `navStackDepth()` e um contador `voltasConsecutivas` zerado em qualquer PUSH; anexar os dois campos ao payload de `nav_back` (N-152) e `profundidade` ao `nav_page_view`. Teste unitário novo em `src/lib/__tests__/navigation.test.ts`, que já cobre a camada pura.
**Benefícios:** mostra em números quais fluxos multi-empresa viraram labirinto, e dá meta objetiva para as etapas de rota aninhada e breadcrumb (profundidade cai, voltas consecutivas caem).
**Impacto × esforço:** Médio × P · **Depende:** N-151, N-152

### N-154 · P2 · INP e LCP por rota, não por URL crua
**Descrição:** `frontend_performance_logs` guarda `metric_name`, `value`, `rating`, `navigation_type` e `url` (`src/integrations/supabase/types.ts:8278-8300`), mas não guarda a rota normalizada — então `/admin/insights-ia/anomalia/<uuid>` gera uma linha por UUID e nenhuma média utilizável, e `PerformanceMetrics.tsx:12-30` agrega tudo junto, misturando o dashboard com a calculadora tributária. Com 127 chunks lazy atrás de um Suspense único (`src/App.tsx:59`), INP e LCP variam muito mais por rota do que por métrica. Referência: https://web.dev/articles/inp e https://web.dev/articles/vitals-spa-faq
**Exemplo prático:** migration adicionando `route_label text` a `frontend_performance_logs`; em `src/lib/telemetry.ts` preencher no `buildPerfRows` com `getRouteLabel(window.location.pathname)` (mesma função do NavigationTracker, que já respeita rota sensível); em `src/components/admin/telemetry/PerformanceMetrics.tsx` trocar o `select('metric_name, value')` por `select('metric_name, value, route_label')` e agrupar por rota, com p75 em vez de média — o `getMetricRating` do arquivo (:50-60) já usa os cortes do web.dev.
**Benefícios:** aponta as telas lentas com nome ("Conciliação está em 480ms de INP"), em vez de um número médio que nunca move decisão.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-155 · P2 · Erro de rota instrumentado (404 e falha de chunk)
**Descrição:** `src/pages/NotFound.tsx` é a única porta para rota inexistente e hoje não reporta nada; com 130 rotas irmãs, 51 comandos na paleta e 91 itens de menu, um link interno errado só aparece se o usuário reclamar. A falha de carregamento de chunk lazy (127 chunks) também cai como erro genérico, sem dizer qual rota não carregou.
**Exemplo prático:** em `src/pages/NotFound.tsx` emitir `reportNavEvent('nav_route_miss', { path_redacted, referrer_in_app: previousNavEntry() !== undefined })`; no `ErrorBoundary` (`src/components/error/ErrorBoundary.tsx:46`, que já persiste em `frontend_error_logs`) marcar `context.route_label` e `context.chunk_load = /Loading chunk|dynamically imported module/.test(message)`.
**Benefícios:** link quebrado e deploy com chunk velho (usuário com aba aberta durante o deploy) viram alerta em horas, não em ticket; a equipe conserta antes de o contador topar com a tela branca.
**Impacto × esforço:** Médio × P · **Depende:** N-151

### N-156 · P2 · Detecção de rage click nas telas financeiras
**Descrição:** o app tem casos previsíveis de clique morto: o campo de busca do Header é decorativo — no `onFocus` dá blur e despacha um Ctrl+K sintético (`src/components/layout/Header.tsx:115-120`) — e os atalhos Ctrl+Shift+N/S/E dependem de atributos espalhados no DOM (`data-add-new`, `data-save`, `data-export` em `useKeyboardShortcuts.ts:117,127,137`), que faltam em muitas telas. Rage click é a métrica que expõe isso sem precisar de gravação de tela. Referência: https://www.nngroup.com/articles/rage-clicks/ (NÃO VERIFICADO: não acessei a URL nesta sessão)
**Exemplo prático:** hook novo `src/hooks/useRageClickTelemetry.ts` com listener de `click` em `document` na fase de captura, contando 3+ cliques em ~1s dentro de um raio de 30px; emite `reportNavEvent('rage_click', { route_label, selector: tagName + data-testid, repeticoes })` sem texto do elemento (evita valor financeiro no payload). Montar uma vez em `MainLayout`, junto dos demais providers de shell.
**Benefícios:** encontra os controles que parecem clicáveis e não são antes de virarem "o sistema travou" no WhatsApp do dono.
**Impacto × esforço:** Médio × P · **Depende:** N-151

### N-157 · P1 · Funil de tempo-até-concluir das 4 tarefas-núcleo
**Descrição:** o produto existe para quatro tarefas repetidas: lançar conta a pagar, lançar conta a receber, conciliar extrato e aprovar. Hoje não há marco de início nem de fim — nem na telemetria (`telemetry.ts:262-300`) nem nos testes. Sem isso não se prova que qualquer etapa deste plano deixou o trabalho mais rápido; só os 164 arquivos com overlay sabem quando um formulário abriu, e nenhum tem rota própria.
**Exemplo prático:** helper `src/lib/task-funnel.ts` com `iniciarTarefa('conta_pagar_nova')` / `concluirTarefa` / `abandonarTarefa`, guardando `performance.now()` e `session_id`; instrumentar `src/components/contas-pagar/ContaPagarForm.tsx` (já declara estado sujo em :69) e `src/components/contas-receber/ContaReceberForm.tsx:122` no submit e no unmount sem submit, mais `Conciliacao.tsx` e a tela de aprovações apontada pelo badge do `MobileBottomNav.tsx:46`. KPI: p50/p75 do tempo e taxa de conclusão, por papel e por empresa. Referência de método (task success + time on task): https://www.nngroup.com/articles/success-rate-the-simplest-usability-metric/
**Benefícios:** troca "a navegação ficou melhor" por "lançar conta a pagar caiu de 95s para 60s"; é o número que justifica o resto do plano para o dono.
**Impacto × esforço:** Alto × M · **Depende:** N-151

### N-158 · P2 · Abandono por etapa nos 4 fluxos multi-etapas
**Descrição:** há 4 wizards, cada um com estado próprio e nenhuma etapa na URL: `SSOWizardDialog.tsx:22` (0-3, com Stepper), `SpedEcdWizard.tsx:55`, `sped-ecf-wizard/useSpedEcfWizardState.ts:26` e `OnboardingTributario.tsx:322`. Só o SPED-ECF persiste rascunho, por empresa+ano em localStorage (`useSpedEcfWizardState.ts:47-82`). Como a etapa não está na URL nem na telemetria, ninguém sabe em qual passo o contador desiste do SPED — o KPI mais caro do módulo fiscal.
**Exemplo prático:** emitir `reportNavEvent('wizard_step', { wizard, step, direction })` em cada `setStep` dos 4 arquivos (um PR por wizard se o diff crescer), e `wizard_abandon` no unmount sem conclusão. Painel: taxa de saída por etapa.
**Benefícios:** mostra a etapa exata que precisa de rascunho, breadcrumb de passos ou texto melhor, em vez de reescrever o wizard inteiro no escuro.
**Impacto × esforço:** Alto × M · **Depende:** N-151

### N-159 · P2 · View agregada de KPIs de navegação por dia e empresa
**Descrição:** `PerformanceMetrics.tsx:12-16` lê 24h de linhas cruas de `frontend_performance_logs` e agrega no cliente, com `refetchInterval: 60000` (:32) — padrão que não escala para eventos de navegação, que serão uma ordem de grandeza mais volumosos. O painel precisa de agregado pronto no banco, isolado por empresa.
**Exemplo prático:** view `vw_navegacao_kpis_diarios` com `security_invoker = true`, agrupando `frontend_navigation_events` por `dia`, `empresa_id`, `route_label`: `page_views`, `taxa_voltar`, `voltas_consecutivas_p75`, `profundidade_media`, `rage_clicks`, `route_miss`; e `vw_navegacao_vitals_diarios` com p75 de INP/LCP por rota. Migration em `supabase/migrations/` com timestamp estritamente crescente, RLS/policy por `empresa_acessivel(empresa_id)` na tabela base.
**Benefícios:** painel abre rápido mesmo com meses de histórico, e cada empresa do grupo vê só os próprios números — requisito do isolamento multi-empresa.
**Impacto × esforço:** Médio × M · **Depende:** N-151, N-154

### N-160 · P2 · Aba "Navegação" no SRE Command Center
**Descrição:** já existe o lugar certo: `src/pages/admin/SRECommandCenter.tsx` consolida SLO, Sistema, Edge e Telemetria DB em abas sincronizadas com `?tab=` (`:56-58`, `TAB_META` em :20-36) e é a única tela com Suspense interno e skeleton próprio (:38-49). Os KPIs de navegação ficariam órfãos se virassem planilha; dentro do Command Center o dono abre um link e vê.
**Exemplo prático:** nova aba `navegacao` em `TAB_META` com ícone `Compass`, apontando para `src/pages/admin/AdminNavegacao.tsx` (lazy, como as outras três), consumindo as views da N-159 por TanStack Query: cartões de taxa de uso do Voltar, voltas consecutivas, profundidade, tempo-até-concluir das 4 tarefas, INP/LCP p75 por rota e tabela de rotas com mais `route_miss` e `rage_click`. Acesso restrito ao papel admin, como o resto da página (`:55` checa `isAdmin`).
**Benefícios:** um endereço único para decidir a próxima rodada de navegação, no mesmo lugar onde a equipe já olha saúde do sistema.
**Impacto × esforço:** Alto × M · **Depende:** N-159

### N-161 · P0 · Consertar o E2E de 404, que testa o que não existe
**Descrição:** `e2e/error-states.e2e.ts:25` clica em `text=Voltar para o Início` e espera URL `/`, mas a página rotula "Ir para Início" (`src/pages/NotFound.tsx:65`); e `:16` navega para `/dashboard/contas-receber`, rota que não existe — a real é `/contas-receber`. Ou seja: hoje o único E2E que toca o 404 está quebrado ou passando por acidente, e o Voltar do 404 (`window.history.back()` cru em `NotFound.tsx:57`, o único que não passa pelo `useSmartBack`) não tem cobertura nenhuma.
**Exemplo prático:** em `e2e/error-states.e2e.ts` corrigir o path para `/contas-receber`, trocar o seletor por `getByRole('button', { name: 'Ir para Início' })` e acrescentar um caso de entrada direta no 404 (`page.goto('/rota-inexistente')` em aba nova) verificando que o botão Voltar não sai do app.
**Benefícios:** devolve sinal verdadeiro ao CI na tela que todo link quebrado alcança, e tranca o comportamento do Voltar no 404 antes de qualquer refatoração.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-162 · P1 · E2E do Voltar semântico (in-app vs. entrada direta)
**Descrição:** a regra mais sutil da navegação não tem teste de ponta a ponta: `useSmartBack` só usa `navigate(-1)` quando há entrada in-app anterior e, na entrada direta por link, sobe para a rota-pai com `replace` para não oscilar filho↔pai (`src/hooks/useSmartBack.ts:49-66`). Dos 28 specs em `e2e/` (`playwright.config.ts:16`), só 2 tocam navegação, por texto de botão (`e2e/auth/login.e2e.ts:151,155` e `error-states.e2e.ts:25`). Uma mudança de rota ou de `resolveParentRoute` quebra isso sem nenhum alarme.
**Exemplo prático:** `e2e/navegacao-voltar.e2e.ts`: (a) `/contas-pagar` → clicar numa linha → Voltar volta para a lista com filtro preservado; (b) `page.goto('/contas-pagar')` direto e Voltar leva ao pai com `page.goBack()` indisponível (histórico não cresce, por causa do `replace`); (c) Alt+← faz o mesmo caminho. Usar o `storageState` de `e2e/auth/auth.setup.ts` e `test.skip` sem credenciais, padrão já adotado no repo (:21-27).
**Benefícios:** protege em produção a decisão de UX que evita o loop filho↔pai — o bug de navegação mais irritante e mais difícil de relatar.
**Impacto × esforço:** Alto × M · **Depende:** N-161

### N-163 · P1 · Testes unitários do ModalHistoryManager
**Descrição:** 386 linhas sem um único teste: o `ModalHistoryManager` empilha um marcador de histórico por dialog aberto e consome o do topo no popstate (`src/components/navigation/ModalHistoryManager.tsx:24-39`), recusa empilhar quando há Avançar real pendente (:100-104, via `hasForwardEntries` em `src/lib/navigation.ts:412`) e reempilha em 150ms se o dialog recusar o Escape (:78-88). Esse componente é o que faz o Voltar fechar modal nos 164 arquivos com overlay, nenhum com rota própria. Os testes existentes cobrem só a camada pura (`src/lib/__tests__/navigation.test.ts`, `src/components/navigation/__tests__/BackButton.test.tsx`, `src/components/layout/sidebar/sidebarNavState.test.ts`).
**Exemplo prático:** `src/components/navigation/__tests__/ModalHistoryManager.test.tsx` com jsdom (`vitest.config.ts` já usa `environment: 'jsdom'`): abrir `[role="dialog"][data-state="open"]`, disparar `popstate` e checar que o dialog fechou e a rota não mudou; dialogs aninhados fecham de dentro para fora; com `hasForwardEntries()` mockado como true, nenhum marcador é empilhado; dialog que ignora o Escape recebe marcador de volta após 150ms (timers falsos).
**Benefícios:** o gesto de Voltar continua fechando o modal de lançamento em vez de descartar o formulário e sair da tela — risco direto de perda de dado financeiro digitado.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-164 · P1 · Testes unitários do UnsavedGuardProvider
**Descrição:** a guarda de não-salvos cobre 4 saídas — clique em link na fase de captura (`src/components/navigation/UnsavedGuardProvider.tsx:124`), Voltar/swipe por sentinela de histórico (:68,:175), navegação programática e `beforeunload` nativo (:206) — e não tem teste nenhum, com 0 uso de `useBlocker`/`unstable_usePrompt` no app. Só 2 formulários declaram estado sujo (`ContaPagarForm.tsx:69`, `src/components/contas-receber/ContaReceberForm.tsx:122`), então qualquer regressão aqui passa despercebida até alguém perder um lançamento.
**Exemplo prático:** `src/components/navigation/__tests__/UnsavedGuardProvider.test.tsx`: com estado sujo registrado, clique em `<a>` é interceptado e a rota não muda até confirmar; `popstate` restaura a sentinela; `navigateWithUnsavedGuard` chama o callback só após confirmação; `beforeunload` recebe `preventDefault`. Assegurar também que, limpo o estado, nada é interceptado (falso positivo bloqueia o uso normal).
**Benefícios:** garante que o aviso aparece quando deve e, principalmente, que não aparece quando não deve — alerta indevido ensina o usuário a ignorar o diálogo.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-165 · P2 · Testes do NavigationTracker (título, foco e scroll)
**Descrição:** o `NavigationTracker` concentra três comportamentos de acessibilidade e de percepção de velocidade e não tem teste: `document.title` por rota com título genérico em rota excluída ou sensível (:54,:58), foco em `#main-content` a cada troca de pathname com `tabindex=-1` on demand, `MutationObserver` para rota lazy e timeout de 5s (:77-97), e restauração de scroll própria por `location.key`, restaurando em POP e subindo ao topo em rota nova (:17,:28-36,:68-73). É também o ponto onde entram os eventos da N-151, então precisa de rede de proteção antes.
**Exemplo prático:** `src/components/providers/__tests__/NavigationTracker.test.tsx` com `MemoryRouter`: título muda ao navegar e volta a "Promo Finance" em `/contador/:token`; `#main-content` montado depois do Suspense recebe foco via MutationObserver; POP com posição salva chama `window.scrollTo` com o valor guardado; rota nova vai a 0,0. Referência: WCAG 2.2, 2.4.3 Ordem de foco — https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
**Benefícios:** quem usa leitor de tela continua sabendo que a página mudou, e quem volta para uma lista longa de movimentações não perde a posição.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-166 · P2 · E2E de breadcrumb e aria-current
**Descrição:** `ContextualBreadcrumbs` deriva a trilha de `ROUTE_META`/`resolveParentRoute` (`:79-128`), esconde-se em `/` e `/dashboard` e quando a trilha tem 1 nível (:131-137), e no mobile mostra só os ícones dos pais (`label` é `hidden sm:inline`, :173); `aria-current` aparece em 5 lugares com semântica correta — `page` só no match exato, `location` para pai por prefixo e âncora (`src/components/layout/sidebar/sidebarNavState.ts:16-30`). Há teste unitário do estado (`sidebarNavState.test.ts`), mas nenhum E2E provando que a trilha e o item ativo aparecem juntos na tela certa.
**Exemplo prático:** `e2e/navegacao-orientacao.e2e.ts`: em `/contas-pagar` conferir trilha de 2 níveis, `aria-current="page"` no item do menu e `aria-current="location"` no grupo pai; em `/dashboard` conferir ausência de trilha; nos 3 itens-âncora (`/inteligencia#action-matrix`, `/inteligencia#alertas-preditivos`, `/cobrancas#whatsapp`, `SidebarNavGroups.tsx:78,112,128`) conferir que o ativo não duplica. Referência: WCAG 2.2, 3.2.3 Navegação consistente — https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html
**Benefícios:** trava "onde estou" para os papéis que alternam entre 5 grupos e 91 itens de menu, e impede que uma rota nova apareça sem trilha.
**Impacto × esforço:** Médio × M · **Depende:** —

### N-167 · P2 · E2E mobile: bottom nav, swipe-back e drawer
**Descrição:** o PWA tem três mecanismos de navegação exclusivos do mobile e zero cobertura: `MobileBottomNav` com 4 destinos fixos + Menu, `aria-current="page"`, badge de aprovações e safe-area (`:22-46,102`); swipe-back da borda esquerda com threshold de 80px e zona de 30px (`src/hooks/useSwipeBack.ts:16-18`), ligado só no mobile (`MainLayout.tsx:37`); e `MobileSidebarDrawer`, um `motion.aside` sem `role="dialog"`, `aria-modal`, foco preso ou Escape (`:28-36`), que fecha só por backdrop/X. Some-se a isso `useIsMobile` retornando false no primeiro render (breakpoint 768, `src/hooks/use-mobile.tsx:6,19`), o que faz o shell desktop montar antes de virar mobile — exatamente o tipo de condição que só um teste em viewport pequena pega.
**Exemplo prático:** `e2e/navegacao-mobile.e2e.ts` com `test.use({ ...devices['Pixel 7'] })`: bottom nav navega e marca `aria-current`; `page.touchscreen` arrastando de x=10 até x=120 volta uma rota; abrir o drawer, apertar Escape e registrar o comportamento atual como teste de regressão (hoje não fecha) para a etapa que der `role="dialog"` ao drawer.
**Benefícios:** o uso em celular — aprovar e consultar fora do escritório — deixa de ser a parte não testada do produto.
**Impacto × esforço:** Alto × M · **Depende:** N-161

### N-168 · P1 · Gate de contrato rotas ↔ ROUTE_META ↔ paleta
**Descrição:** o sistema depende de três listas escritas à mão que hoje só coincidem por disciplina: 130 rotas declaradas (`src/App.tsx` + `src/routes/*Routes.tsx`), `ROUTE_META` com 119 entradas cobrindo exatamente as 119 rotas privadas estáticas (0 metadados órfãos, 11 rotas sem meta — todas públicas/dev/param) e a paleta com 51 comandos, que não é gerada de `ROUTE_META` e cobre 51 de 130 rotas (`src/components/command-palette/CommandPalette.tsx:51-88`). Rota nova sem meta nasce sem breadcrumb, sem título, sem recentes e sem paleta — e nada avisa.
**Exemplo prático:** `src/lib/__tests__/route-contract.test.ts` que leia os arquivos de rota (regex sobre `path=`), compare com `ROUTE_META` e falhe se houver meta órfão ou rota privada sem meta, com allowlist explícita das 11 exceções conhecidas (`/auth`, `/reset-password`, `/contador/:token`, `/convite/:token`, `/design-system-debug`, `/__especimes`, `/theme-diagnostics`, `/reforma-tributaria/:tab`, `/admin/insights-ia/anomalia/:id`, `/auth/corporate`, `*`); segundo assert avisando (sem falhar) quando a cobertura da paleta cair abaixo do patamar atual.
**Benefícios:** a próxima tela fiscal entra no menu, na busca e na trilha no mesmo PR — o usuário nunca mais encontra uma tela que o sistema não sabe nomear.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-169 · P2 · Gate "toda rota privada renderiza com shell"
**Descrição:** o shell é aplicado em dois lugares: 89 páginas chamam `<MainLayout>` dentro de si (ex. `src/pages/ContasPagar.tsx:124`) e 10 rotas o aplicam no roteador (`geralRoutes.tsx:42,52`, `contabilRoutes.tsx:52`, `adminRoutes.tsx:42,68,102,112`, `analiseRoutes.tsx:46,64`, `financeiroRoutes.tsx:122`). Resultado: 29 páginas de rota sem `<MainLayout>`, 10 recebendo pela rota e 19 rotas renderizando sem sidebar, breadcrumb nem bottom nav — `src/routes/tributarioRoutes.tsx` tem 0 ocorrências de MainLayout e `src/pages/tributario/CalculadoraTributaria.tsx` não o importa; `src/pages/admin/ScimAudit.tsx:150` compensa com um `<BackButton />` solto, o único fora do shell. Sem gate, a conta de rotas órfãs volta a crescer.
**Exemplo prático:** `src/routes/__tests__/shell-coverage.test.tsx` que monte cada rota privada em `MemoryRouter` com os providers de `App.tsx` mockados e exija a presença de `#main-content` e do landmark de navegação; allowlist com as 19 rotas atuais, para o número só poder cair. Alternativa mais barata e estática: assert sobre a fonte, contando `MainLayout` por arquivo de rota/página.
**Benefícios:** impede que a correção das 19 rotas sem shell regrida, e torna a eventual migração para rota aninhada verificável etapa por etapa.
**Impacto × esforço:** Alto × M · **Depende:** N-168

### N-170 · P2 · A11y automatizado do shell de navegação com vitest-axe
**Descrição:** já existe infraestrutura de axe em jsdom (`src/test/a11y/critical-pages.test.tsx` e `indices-tab.test.tsx`, com `vitest-axe` e `axe-core` nas dependências), mas ela cobre botão, formulário e `SkipLinks` — nenhum componente de navegação. E há defeito conhecido esperando teste: `MobileSidebarDrawer` sem `role="dialog"`, `aria-modal` nem foco preso (`:28-36`), e ausência de região `aria-live` anunciando mudança de rota (o anúncio depende só do foco, `NavigationTracker.tsx:77-97`).
**Exemplo prático:** `src/test/a11y/navegacao.test.tsx` seguindo o padrão do arquivo existente (`axeConfig` desliga `color-contrast` e `region` porque jsdom não calcula contraste, :12-18): rodar axe em `ContextualBreadcrumbs`, `MobileBottomNav`, `SidebarNavGroups` e `MobileSidebarDrawer`, mais asserts explícitos de `role`/`aria-modal` no drawer. Referência: WCAG 2.2, 2.4.8 Localização — https://www.w3.org/WAI/WCAG22/Understanding/location.html
**Benefícios:** quem usa teclado e leitor de tela consegue operar o menu no celular, e a correção do drawer fica trancada contra regressão.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-171 · P2 · Axe no Playwright para contraste e foco reais por rota
**Descrição:** os testes de a11y em jsdom desligam `color-contrast` por limitação do ambiente, com o próprio comentário dizendo "validado em e2e/Lighthouse" (`src/test/a11y/critical-pages.test.tsx:14`) — validação que não existe: nenhum dos 28 specs E2E roda axe. Como o app tem tema claro/escuro e transições (`PageTransition` com blur-rise de 350ms, `:18-21`), contraste e foco visível só se verificam em navegador real.
**Exemplo prático:** `e2e/a11y-navegacao.e2e.ts` com `@axe-core/playwright` (NÃO VERIFICADO: `axe-core@^4.14.0` está em `package.json:98`, mas o pacote `@axe-core/playwright` não está — precisa entrar como devDependency, declarada na PR), rodando em `/dashboard`, `/contas-pagar`, `/conciliacao` e `/tributario` nos dois temas, com regras de contraste e nome acessível ligadas; falhar só em violações sérias/críticas no primeiro PR. Referência: https://playwright.dev/docs/accessibility-testing
**Benefícios:** fecha o buraco declarado nos próprios testes e garante que o item ativo do menu e o foco continuam visíveis no tema escuro usado à noite.
**Impacto × esforço:** Médio × M · **Depende:** N-170

### N-172 · P2 · Teste moderado com usuários, um roteiro por papel
**Descrição:** todo diagnóstico desta seção é de código e telemetria; falta a observação direta, que é o que explica *por que* a taxa de uso do Voltar está alta numa tela. O produto tem papéis com rotinas muito diferentes (admin, financeiro, contador, visualizador) e o contador é quem mais sofre: as rotas de `/tributario` são justamente as que não têm shell (`tributarioRoutes.tsx` com 0 MainLayout), logo navega sem sidebar nem trilha. Referência de amostra pequena por iteração: https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
**Exemplo prático:** roteiro de 5 tarefas espelhando os funis da N-157 (lançar conta a pagar; achar uma movimentação por deep-link de linha, que hoje 5 páginas aceitam com validação de UUID via `useHighlightFromUrl.ts:23-44`; conciliar; aprovar no celular; abrir a calculadora tributária e voltar), com 4 a 5 participantes por papel, medindo conclusão, tempo e número de voltas; sessão em ambiente de staging com dados de empresa fictícia. Registrar achados como etapas deste plano, não como documento solto.
**Benefícios:** evita gastar PR em hipótese errada; cada rodada custa dois dias e corrige a prioridade das etapas seguintes.
**Impacto × esforço:** Alto × M · **Depende:** N-157

### N-173 · P3 · Gravação de sessão e mapa de cliques com recorte LGPD
**Descrição:** gravação resolve o que o KPI não mostra, mas aqui o conteúdo de tela é dado financeiro e pessoal (CNPJ, valores, nomes de fornecedor) e o app já trata privacidade de rota com cuidado: chaves de URL em breadcrumb são redigidas (`telemetry.ts:27`) e `/contador/` e `/convite/` não entram em `document.title` nem em recentes (`navigation.ts:395-404`, `NavigationTracker.tsx:110`). Existe inclusive spec dedicado de privacidade (`e2e/lgpd-privacidade.e2e.ts`), que vira o guardião desta etapa.
**Exemplo prático:** gravação só nas telas de navegação pura (dashboard, menu, drawer, 404), com mascaramento por padrão de todo texto e input — marcar o oposto do habitual: `data-nav-safe` nos poucos elementos liberados (rótulo de menu, trilha) e máscara em tudo o mais; nunca gravar `/contador/:token` nem `/convite/:token`; consentimento explícito por usuário e retenção curta. Acrescentar caso em `e2e/lgpd-privacidade.e2e.ts` provando que valor monetário e documento não saem no payload. Decisão do dono por envolver custo de ferramenta e dado pessoal.
**Benefícios:** entende o beco sem saída que o número não explica, sem criar passivo de LGPD com dado de cliente.
**Impacto × esforço:** Médio × G · **Depende:** N-151

### N-174 · P3 · A/B de navegação por flag, com critério de parada
**Descrição:** as decisões com mais risco deste plano são reversíveis e comparáveis — por exemplo, bottom nav de 4 destinos fixos (`MobileBottomNav.tsx:22-46`) contra destinos derivados dos recentes (o tracker já mantém no máximo 5 recentes com filtro por papel, `useRecentItems.ts:21`; `NavigationTracker.tsx:109-113`), ou breadcrumb com rótulo no mobile contra só ícones (`ContextualBreadcrumbs.tsx:173`). Sem experimento, isso virará discussão de gosto. A base de usuários é pequena, então o experimento precisa de desenho honesto: tarefa única, KPI único, período fixo.
**Exemplo prático:** `src/lib/ab-navegacao.ts` com atribuição estável por hash de `user_id` (sem servidor novo), lendo a lista de experimentos ativos de uma tabela simples com RLS; enviar `variant` no payload da N-151 e da N-157. Regra: um experimento por vez, KPI primário = tempo-até-concluir da tarefa alvo, mínimo de 2 semanas, e encerramento mesmo sem resultado — empate decide pela opção mais simples de manter.
**Benefícios:** troca debate por evidência nas duas ou três escolhas realmente duvidosas, sem parar o resto do plano.
**Impacto × esforço:** Médio × M · **Depende:** N-157, N-160

### N-175 · P2 · Ciclo de iteração quinzenal com trava de regressão no CI
**Descrição:** sem cadência, instrumentação morre em painel que ninguém abre — e este repo já tem o antídoto para a parte automatizável: `vitest.config.ts` traz travas de não-regressão calibradas sobre cobertura medida (`thresholds: lines 66, functions 58, branches 59, statements 65`) justamente porque pisos antigos "não protegiam contra nada" (comentário em :53-66). Os KPIs de navegação merecem o mesmo tratamento, com uma revisão humana curta por cima.
**Exemplo prático:** revisão de 30 minutos a cada duas semanas sobre a aba Navegação (N-160), produzindo no máximo três etapas priorizadas deste plano; e um job no `.github/workflows/ci.yml` que falhe quando os números objetivos piorarem: contagem de rotas sem shell acima da allowlist (N-169), rota privada sem `ROUTE_META` (N-168), violação séria de axe (N-171) e p75 de INP por rota acima do limite nas rotas-chave, lido das views da N-159 (job agendado, não bloqueante no PR, para não travar merge por dado de produção).
**Benefícios:** a navegação para de regredir sozinha entre entregas, e o dono recebe sempre um menu de três ações, não um relatório.
**Impacto × esforço:** Alto × P · **Depende:** N-160, N-168, N-169, N-171

### 2.6 Integração com outras funcionalidades (N-176 → N-200)

### N-176 · P0 · Campo de busca do Header que abre a paleta
**Descrição:** O único campo de busca visível do app é decorativo e, pior, não chega à paleta: `src/components/layout/Header.tsx:115-120` dá `blur()` no próprio input e despacha um `KeyboardEvent('keydown', {key:'k', metaKey:true})` em `window`, mas a paleta escuta em `document` (`src/components/command-palette/CommandPalette.tsx:49`). Evento despachado em `window` não passa por listeners de `document` (o caminho de propagação não inclui `document`), então o clique no campo "Comando (Ctrl+K)..." não abre a paleta; quem recebe é `useKeyboardShortcuts.ts:240`, que foca `input[placeholder*="Buscar"]` (:145-152) — um campo qualquer da tela atual. Resultado: o usuário de /contas-pagar clica na busca global e o cursor pula para o filtro da tabela. NN/g, "a busca precisa responder ao primeiro clique": https://www.nngroup.com/articles/search-not-found/
**Exemplo prático:** Em `Header.tsx`, trocar o hack de evento sintético por abertura direta: exportar o estado da paleta num contexto (`CommandPaletteProvider` ao lado de `CommandPalette` em `src/App.tsx:51`) e fazer o campo ser um `<button>` com aparência de input chamando `openPalette()`; manter o `kbd` "Ctrl+K" como dica. Nenhum `dispatchEvent` permanece.
**Benefícios:** A busca global passa a funcionar por mouse, não só por teclado — ganho direto para financeiro e contador que não decoram atalhos; elimina o pulo de foco que hoje parece bug aleatório.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-177 · P0 · Ctrl+K com dono único
**Descrição:** Dois listeners globais disputam Ctrl+K, ambos com `preventDefault()`: `CommandPalette.tsx:32` alterna a paleta e `useKeyboardShortcuts.ts:145` foca um `input[placeholder*="Buscar"]`. Como um escuta em `document` e o outro em `window`, os dois rodam no mesmo pressionamento: a paleta abre e, em seguida, o foco é roubado para o campo de busca da tela por baixo do overlay. Em telas financeiras com filtro de texto (ContasPagar, Movimentacoes, Conciliacao) isso significa digitar a consulta no lugar errado. WCAG 2.2, 3.2.1 On Focus e 2.4.3 Focus Order: https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html
**Exemplo prático:** Remover o atalho 'k' de `getShortcutsList`/do array de `useKeyboardShortcuts.ts` (:144-156) e deixar Ctrl+K só na paleta; o foco em filtro local vira `/` (padrão de mercado) registrado no mesmo arquivo. Atualizar o espelho manual de ajuda em `getShortcutsList` (:247) para refletir "Ctrl+K — Paleta de comandos" e "/ — Filtrar nesta tela".
**Benefícios:** Um atalho, um efeito previsível; o diálogo de atalhos passa a dizer a verdade, reduzindo chamada de suporte "o Ctrl+K pula o cursor".
**Impacto × esforço:** Alto × P · **Depende:** N-176

### N-178 · P1 · Paleta gerada do ROUTE_META, filtrada por papel
**Descrição:** A paleta tem 51 comandos escritos à mão (31 de navegação + 20 de gestão, `commandPaletteNavigation.ts` com 241 linhas + `commandPaletteManagement.ts`), cobrindo 51 das 130 rotas, enquanto `ROUTE_META` já descreve 119 rotas privadas com label, pai e papel exigido (consumido por `ContextualBreadcrumbs.tsx:79-128` e por `NavigationTracker.tsx:109-113` para filtrar recentes). Hoje um admin não encontra /admin/scim-audit ou a Calculadora Tributária pela paleta, e um visualizador vê comandos que levam a telas que o `ProtectedRoute` vai negar.
**Exemplo prático:** Em `commandPaletteNavigation.ts`, derivar os itens de `ROUTE_META` (`src/lib/navigation.ts`), agrupando pelo primeiro segmento do path, reaproveitando o ícone já declarado em `ContextualBreadcrumbs.tsx:39-66` e descartando rota sem permissão do usuário atual (mesmo predicado de papel usado em `useRecentItems`/`NavigationTracker.tsx:109-113`); manter só os 20 comandos de gestão escritos à mão.
**Benefícios:** Cobertura de busca sobe de 51 para 119 telas sem manutenção manual; cada papel (admin, financeiro, contador, visualizador) vê apenas o que pode abrir, evitando o beco de "acesso negado".
**Impacto × esforço:** Alto × M · **Depende:** N-177

### N-179 · P2 · Buscas recentes na paleta
**Descrição:** `search` na paleta é `useState('')` local (`CommandPalette.tsx:26`) e a consulta se perde a cada fechamento; não há histórico de busca em nenhum lugar do app. Em rotina financeira o usuário repete as mesmas buscas ("conciliação", "SPED", "fornecedor X") dezenas de vezes por dia. NN/g sobre histórico de consultas como atalho de recall: https://www.nngroup.com/articles/search-suggestions/
**Exemplo prático:** Guardar as últimas 5 consultas com `usePersistedState` (`src/lib/persisted-ui-state.ts:7-29`, já tolerante a storage indisponível) sob a chave `promo-palette-history`, e renderizar um `CommandGroup heading="Buscas recentes"` quando `search === ''`, acima dos grupos de navegação, com ação de limpar igual à de `clearRecent` em `useRecentItems.ts`.
**Benefícios:** Menos digitação por tarefa repetida; a paleta passa a lembrar o fluxo de fechamento mensal de quem a usa todo dia.
**Impacto × esforço:** Médio × P · **Depende:** N-178

### N-180 · P2 · Voltar depois de buscar preserva a consulta
**Descrição:** A paleta navega via `guardedNavigate` e fecha (`runCommand`, `CommandPalette.tsx:53-56`); ao usar Voltar (Alt+← / swipe / `useSmartBack.ts:60`) o usuário retorna à tela anterior com a paleta vazia e precisa redigitar para escolher o segundo resultado. Como `CommandDialog` é um `[role="dialog"][data-state="open"]`, o `ModalHistoryManager` empilha marcador para ele (`ModalHistoryManager.tsx:24-39`), mas o marcador não guarda a consulta.
**Exemplo prático:** Manter a última consulta em `sessionStorage` (chave `promo-palette-last-query`) no `runCommand` e reabrir a paleta já com `search` preenchido e selecionado quando o retorno vier de `nav_back` (breadcrumb já emitido em `useSmartBack.ts:53`); limpar a chave em qualquer navegação que não seja POP.
**Benefícios:** Comparar duas telas a partir da mesma busca (ex. "contas a receber" e "cobranças") deixa de custar duas digitações.
**Impacto × esforço:** Médio × P · **Depende:** N-179

### N-181 · P2 · Paleta busca registros, não só telas
**Descrição:** A paleta só casa título/subtítulo/keywords de comandos estáticos (`CommandPalette.tsx:78-88`); nenhum registro do negócio é encontrável. O app já tem deep-link de linha validado por UUID em 5 telas (`useHighlightFromUrl.ts:23-44`; ContasPagar.tsx:62, ContasReceber.tsx:106, Movimentacoes.tsx:138, Conciliacao.tsx:160), então o destino de um resultado de registro já existe.
**Exemplo prático:** Adicionar em `CommandPalette.tsx` um grupo assíncrono "Registros" alimentado por um `useQuery` com `debounce` de 250ms sobre uma RPC `buscar_registros(termo, empresa_id)` (escopo por `empresa_acessivel`), navegando para `/contas-pagar?highlight=<uuid>` — reaproveitando o hook de destaque existente em vez de criar tela nova.
**Benefícios:** Achar um título a pagar pelo número do documento deixa de exigir abrir a tela e filtrar; reduz cliques no fluxo mais frequente do financeiro.
**Impacto × esforço:** Alto × G · **Depende:** N-178

### N-182 · P1 · Drawer mobile dentro do contrato de dialog
**Descrição:** `MobileSidebarDrawer` é um `motion.aside` sem `role="dialog"`, `aria-modal`, foco preso ou Escape (`src/components/layout/sidebar/MobileSidebarDrawer.tsx:28-36`). Como o marcador de histórico cobre apenas `[role="dialog"][data-state="open"]` (`src/lib/unsaved-guard.ts:12`), o menu mobile fica fora do Voltar-fecha-modal: no celular, abrir o menu e dar Voltar (ou swipe da borda, `useSwipeBack.ts:16-18`) sai da tela em vez de fechar o menu — e o menu só fecha por backdrop/X ou pela remontagem do `MainLayout`. Material 3 navigation drawer como modal: https://m3.material.io/components/navigation-drawer/guidelines
**Exemplo prático:** Reescrever `MobileSidebarDrawer` como `SheetContent` (`src/components/ui/sheet.tsx`, já usado em 10 arquivos) ou acrescentar `role="dialog" aria-modal="true" data-state={open ? 'open' : 'closed'}` + `onKeyDown` de Escape e trap de foco; com isso o `ModalHistoryManager` passa a empilhar marcador automaticamente, sem tocar no gerenciador.
**Benefícios:** No PWA instalado, onde não há barra do navegador, Voltar deixa de jogar o usuário fora da tela ao fechar o menu; leitor de tela anuncia o menu como modal.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-183 · P2 · Drawer de detalhe com URL própria
**Descrição:** 164 arquivos usam overlay (149 `DialogContent`, 10 `SheetContent`, 5 `Drawer`) e nenhum tem rota ou parâmetro de URL — todo detalhe é estado local coberto apenas pelo marcador de histórico. Logo, `ContaReceberDetailDrawer` (`src/components/contas-receber/ContaReceberDetailDrawer.tsx`) não pode ser enviado por link para o contador: só a lista é compartilhável.
**Exemplo prático:** Nos drawers de detalhe de conta a pagar/receber, sincronizar o id aberto com `?detalhe=<uuid>` usando `useSearchParams` e a validação de UUID de `useHighlightFromUrl.ts:23-44`; abrir com `push` e fechar com `replace`, para que o marcador do `ModalHistoryManager` não concorra com a entrada de URL.
**Benefícios:** Um título específico passa a ser linkável em e-mail/WhatsApp de cobrança e recarregar a página não perde o registro aberto.
**Impacto × esforço:** Médio × M · **Depende:** N-182

### N-184 · P2 · Voltar sobre confirmação destrutiva
**Descrição:** Por decisão documentada, `AlertDialog` fica fora do marcador de histórico (`src/lib/unsaved-guard.ts:12` cobre só `[role="dialog"]`), então, com uma confirmação de exclusão aberta, Voltar/Alt+← navega a tela de trás com o alerta ainda em pé, e `useKeyboardNavigation.ts:34-58` consome marcador de modal mesmo na raiz. Em telas que apagam lançamento ou baixa de conta, isso deixa a ação pendente num contexto que já mudou.
**Exemplo prático:** Em `ModalHistoryManager.tsx`, ao detectar `[role="alertdialog"][data-state="open"]` no `popstate`, cancelar a navegação (reempilhar como já se faz em :78-88 quando o dialog recusa Escape) e manter o alerta — sem empilhar marcador na abertura, preservando a decisão de não deixar Voltar "confirmar" nada.
**Benefícios:** Nenhuma confirmação de exclusão fica órfã sobre outra tela; o gesto de Voltar nunca tem efeito destrutivo ambíguo.
**Impacto × esforço:** Médio × P · **Depende:** N-182

### N-185 · P0 · Deep-link anônimo preserva o destino
**Descrição:** `ProtectedRoute` manda o anônimo para `/auth` sem `?redirect=` (`src/components/auth/ProtectedRoute.tsx:45`), embora `Auth.hooks.ts:37-41` já leia e valide o parâmetro — hoje só `AceitarConvite.tsx:28` e `edge-function-error.ts:209` o escrevem. Consequência: todo link profundo recebido com a sessão expirada (link de cobrança, notificação push que abre `/alertas`, link de conciliação enviado pelo contador) cai no dashboard genérico e o usuário tem de reencontrar a tela à mão.
**Exemplo prático:** Em `ProtectedRoute.tsx:45`, trocar o `Navigate to="/auth"` por `to={'/auth?redirect=' + encodeURIComponent(location.pathname + location.search)}` com `replace`, e cobrir com teste em `src/components/navigation/__tests__/` (hoje nada testa `ProtectedRoute`); a validação do destino já existe no lado do `/auth`.
**Benefícios:** Link compartilhado e notificação levam ao registro certo mesmo depois do login — a diferença entre "o link não funciona" e um fluxo de cobrança que fecha em um clique.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-186 · P1 · Clique em notificação não recarrega o app nem descarta formulário
**Descrição:** `public/sw.js:236` chama `client.navigate(urlToOpen)` na aba já aberta: isso é navegação de documento, descarta a árvore React, o escopo de empresa em memória e qualquer formulário em edição — e o `beforeunload` de `UnsavedGuardProvider.tsx:206` só avisa se o navegador exibir o diálogo nativo, que em navegação disparada por SW nem sempre aparece (NÃO VERIFICADO em runtime). Com 2 formulários declarando estado sujo (`ContaPagarForm.tsx:69`, `ContaReceberForm.tsx:122`), o risco concreto é perder um lançamento sendo digitado.
**Exemplo prático:** No `notificationclick`, substituir `client.navigate(url)` por `client.focus()` + `client.postMessage({ type: 'nav', url })`; no app, um listener em `NavigationTracker.tsx` chama `navigateWithUnsavedGuard(() => navigate(url))` — mesmo caminho que a paleta já usa (`CommandPalette.tsx:62`). Manter `clients.openWindow(url)` apenas quando não houver aba.
**Benefícios:** Notificação passa a ser navegação instantânea dentro do app, respeitando a guarda de não-salvos; fim do recarregamento completo de 127 chunks a cada alerta clicado.
**Impacto × esforço:** Alto × M · **Depende:** N-185

### N-187 · P2 · URLs de notificação validadas contra as rotas reais
**Descrição:** O service worker decide destino com strings fixas: `urlToOpen = data.url || '/alertas'` e `/seguranca?resolve=<alertId>` (`public/sw.js:219-225`). As rotas existem (`geralRoutes.tsx:49` e `adminRoutes.tsx:65`), mas nada impede que um payload futuro aponte para caminho inexistente — e o usuário cai em `NotFound`, cuja única saída é `window.history.back()` cru (`src/pages/NotFound.tsx:57`), que pode sair do app em entrada direta. Além disso `/seguranca` é tela de admin: para papel financeiro o destino é acesso negado.
**Exemplo prático:** Publicar um JSON leve com os paths de `ROUTE_META` no build e, no `sw.js`, validar o destino antes de navegar, caindo em `/alertas` quando não casar; na edge function que monta o push, incluir o papel mínimo da rota para não notificar quem não pode abrir.
**Benefícios:** Nenhuma notificação termina em 404 ou "sem permissão"; menos ruído de alerta irrelevante por papel.
**Impacto × esforço:** Médio × M · **Depende:** N-186

### N-188 · P1 · Escopo de empresa isolado por aba
**Descrição:** O escopo fica em `localStorage` compartilhado: `EmpresaScopeContext.tsx:32,50,58` lê/grava `SCOPE_KEY` e espelha o `LEGACY_KEY` lido por `getCurrentEmpresaId()`. Com duas abas abertas — rotina real de quem compara duas empresas do grupo — trocar de empresa em uma grava a chave global; a outra aba continua renderizando os números da empresa anterior até qualquer refetch, e `useGlobalFinancialFilter.ts:30` já reage a `storage` em outra dimensão de filtro. É a classe de bug que o próprio comentário do contexto descreve ("exibir ids como se os números somassem N empresas").
**Exemplo prático:** Guardar o escopo ativo em `sessionStorage` (por aba) com fallback de primeira carga no `localStorage` existente, dentro de `EmpresaScopeContext.tsx`; manter a gravação no `LEGACY_KEY` apenas na aba que fez a troca, preservando a compatibilidade citada no comentário :10.
**Benefícios:** Comparar Matriz e Filial em duas abas deixa de misturar dados — a correção mais crítica de confiança em relatório financeiro multi-empresa.
**Impacto × esforço:** Alto × M · **Depende:** —

### N-189 · P2 · Aviso quando outra aba troca de empresa
**Descrição:** Mesmo isolando por aba (N-188), a aba antiga pode estar exibindo dados de um escopo que o usuário acabou de abandonar em outra janela. O app já tem o transporte pronto para isso: `src/lib/sso-sync.ts:27-30` usa `BroadcastChannel` com fallback para `storage` e mostra exatamente um toast entre abas.
**Exemplo prático:** Reaproveitar `sso-sync.ts` como base de um `empresa-scope-sync.ts`, emitindo `{ empresaId, nome }` no `focusEmpresa` de `EmpresaScopeContext.tsx`; na aba que recebe, mostrar toast de ação ("Outra aba está na Filial X — alternar?") via `sonner` (`Toaster` em `src/App.tsx:52`) sem trocar nada sozinho.
**Benefícios:** O usuário percebe divergência de escopo antes de tomar decisão sobre o número errado, sem perder o controle da aba em que está.
**Impacto × esforço:** Médio × P · **Depende:** N-188

### N-190 · P2 · Abrir em nova aba carregando o escopo
**Descrição:** Os 25 `window.open(..., '_blank')` e qualquer Ctrl+clique na sidebar abrem uma aba que resolve o escopo pelo `localStorage`, não pelo contexto da aba de origem — com o escopo por aba (N-188) a nova aba nasceria na empresa padrão. Já existe precedente de empresa na URL: `src/pages/Contabilidade.tsx:66` lê `searchParams.get('empresa')`.
**Exemplo prático:** Padronizar um helper `withEmpresa(path)` em `src/lib/navigation.ts` que anexa `?empresa=<id>` e usá-lo nos itens de `SidebarNavGroups.tsx` e nos comandos de navegação da paleta; no boot, `EmpresaScopeContext` passa a preferir o `?empresa=` válido (dentro de `availableEmpresas`) sobre o storage.
**Benefícios:** Ctrl+clique e link colado em outra janela mantêm a empresa certa; o link vira um endereço completo "empresa + tela", compartilhável com o contador.
**Impacto × esforço:** Médio × M · **Depende:** N-188

### N-191 · P1 · Manifesto instalável de verdade
**Descrição:** `public/manifest.json` declara ícones só em SVG (`/favicon.svg` para `any` e `maskable`) mais `favicon.ico` 48px — sem PNG 192 e 512. Chrome no Android exige PNG nesses tamanhos para instalação e para o ícone na tela inicial; o SVG maskable sem área de segurança também recorta. web.dev, requisitos de ícone e maskable: https://web.dev/articles/add-manifest e https://web.dev/articles/maskable-icon
**Exemplo prático:** Gerar `icon-192.png`, `icon-512.png` e `icon-512-maskable.png` (com 20% de padding) em `public/`, declarar os três em `manifest.json` com `purpose` correto e manter o SVG como `any`; conferir no Lighthouse "Installable" após o deploy.
**Benefícios:** O financeiro consegue instalar o app no celular e no desktop com ícone legível — pré-requisito para o uso diário fora do navegador e para os atalhos do manifesto.
**Impacto × esforço:** Alto × P · **Depende:** —

### N-192 · P2 · Standalone sem botão do sistema
**Descrição:** Em `display: standalone` (manifest.json) não há barra de endereço nem botão Voltar do navegador no desktop, e no Android só o gesto do sistema. Hoje o `BackButton` aparece em 3 lugares (`ContextualBreadcrumbs.tsx:150`, `MobileHeader.tsx:15`, `ScimAudit.tsx:150`) e as 19 rotas que renderizam sem `MainLayout` — incluindo todas as de `src/routes/tributarioRoutes.tsx`, sem nenhuma ocorrência de `MainLayout` — ficam sem shell, sem breadcrumb e sem nenhum Voltar. Instalado, o usuário que abre a Calculadora Tributária (`src/pages/tributario/CalculadoraTributaria.tsx`) não tem saída visível. Apple HIG sobre navegação sempre disponível: https://developer.apple.com/design/human-interface-guidelines/navigation-bars
**Exemplo prático:** Detectar standalone com `window.matchMedia('(display-mode: standalone)')` — já usado em `src/hooks/useInstallPrompt.ts:43` — e, nesse modo, renderizar uma faixa fina com `BackButton` + título via `MainLayout`; nas rotas sem shell, aplicar o layout no roteador (padrão já presente em `geralRoutes.tsx:42`) em vez de repetir o `BackButton` solto do `ScimAudit.tsx:150`.
**Benefícios:** O app instalado deixa de ter telas sem saída; a navegação fica igual no navegador e no PWA, sem depender do gesto do sistema.
**Impacto × esforço:** Alto × M · **Depende:** N-191

### N-193 · P3 · Atalhos do manifesto por papel
**Descrição:** Os 3 atalhos do manifesto são fixos (`/dashboard`, `/contas-pagar`, `/contas-receber`) e `start_url` é `/`. Para contador e para quem vive no módulo tributário (38 rotas em `tributarioRoutes.tsx`) nenhum atalho serve; o app já sabe a rota mais usada de cada um pelos recentes (`useRecentItems.ts:21`, máximo 5, filtrados por papel em `NavigationTracker.tsx:109-113`). web.dev sobre app shortcuts: https://web.dev/articles/app-shortcuts
**Exemplo prático:** Como `manifest.json` é estático, acrescentar dois atalhos de módulo (`/contabilidade`, `/tributario`) e, dentro do app, expor um card "Atalhos" em `MinhasPreferencias.tsx` que define `start_url` lógico (rota preferida salva em `usePersistedState`) para a qual `/` redireciona no boot quando em standalone.
**Benefícios:** Contador abre o app já na contabilidade; cada papel economiza dois toques por sessão.
**Impacto × esforço:** Baixo × P · **Depende:** N-192

### N-194 · P2 · Página offline que realmente é servida
**Descrição:** Existe `public/offline.html`, mas nenhum arquivo o referencia: o service worker, ao falhar a rede numa navegação, faz `caches.match('/')` (`public/sw.js:130-133`) e devolve o shell. O shell carrega, o Supabase falha (as chamadas a `*.supabase.co` dão bypass no SW, :60-66) e o usuário vê telas financeiras vazias ou com erro, sem mensagem de "você está offline". `NetworkStatusIndicator` existe e está montado (`MainLayout.tsx:83`), mas só nas páginas com shell. web.dev, offline fallback: https://web.dev/articles/offline-fallback-page
**Exemplo prático:** Adicionar `/offline.html` ao `STATIC_ASSETS` do `sw.js:3-8` e usá-lo como fallback de navegação em `networkFirstStrategy` (:130); no app, exibir um banner global de offline a partir de `useNetworkStatus.ts:71-72` montado em `App.tsx` junto do `Toaster`, para cobrir também as 19 rotas sem shell.
**Benefícios:** Offline o usuário entende o que aconteceu em vez de desconfiar dos números; evita decisão financeira sobre dado em cache sem aviso.
**Impacto × esforço:** Médio × P · **Depende:** —

### N-195 · P2 · Polling pausado fora de foco e retomado na volta
**Descrição:** São 36 `refetchInterval` ativos, de 15s a 60s (ex. `useAnomaliaDetectionRun.ts:43` com 15s), e `refetchOnWindowFocus` está desligado no padrão (`src/lib/queryClient.ts:19`). A combinação é a pior possível para quem deixa o app aberto numa aba de fundo ou no PWA instalado: o polling continua gastando rede e bateria em tela que ninguém vê e, ao voltar, não há refetch imediato — o usuário olha dado velho. Há precedente de refetch por visibilidade em `useRefetchAnomaliasOnFocus.ts:30`.
**Exemplo prático:** Criar `src/hooks/useVisibleRefetchInterval.ts` que devolve `false` quando `document.hidden` e o intervalo quando visível, usá-lo nos hooks de maior frequência (anomalias, alertas, SLO) e ligar `refetchOnWindowFocus: true` apenas nessas queries, mantendo o default global conservador.
**Benefícios:** Aba de fundo para de consumir rede e quota do Supabase; ao retomar, os números do dia aparecem atualizados sem F5.
**Impacto × esforço:** Médio × M · **Depende:** N-194

### N-196 · P2 · Recentes e favoritos por empresa e sempre alcançáveis
**Descrição:** `useRecentItems.ts:19-21` usa chaves globais `promo-recent-items`/`promo-favorite-items` com teto de 5, sem recorte por empresa — num grupo multi-empresa os recentes da Filial se misturam aos da Matriz. Pior: `RecentAndFavorites.tsx:28` faz `if (collapsed) return null`, então com a sidebar recolhida (estado que, por cima, nem persiste — `ResponsiveSidebar.tsx:18`) recentes e favoritos simplesmente desaparecem, e no mobile eles só existem dentro do drawer.
**Exemplo prático:** Compor as chaves com o `currentEmpresaId` de `useEmpresaScope` (`src/contexts/useEmpresaScope.ts`) em `useRecentItems.ts` e, em `RecentAndFavorites.tsx`, no estado recolhido renderizar os ícones em coluna com tooltip em vez de `null`; expor os mesmos itens como grupo "Recentes" na paleta (N-179).
**Benefícios:** Voltar à última tela usada naquela empresa fica a um clique em qualquer largura; nada se perde ao recolher a sidebar.
**Impacto × esforço:** Médio × M · **Depende:** N-179, N-188

### N-197 · P3 · Favorito que guarda a visão, não só a rota
**Descrição:** `FavoriteItem` tem apenas `{ path, label }` (`useRecentItems.ts:14-17`), então favoritar /conciliacao perde o que importa: os filtros, que vivem em `localStorage` sob `conciliacao_filters` (`useConciliacaoPageState.ts:10,37-39`) e não na URL, e a aba, que em 90 arquivos com `<Tabs` só vai para a URL em 4 via `useUrlTab` (`Seguranca.tsx:19`, `Integracoes.tsx:50`, `Configuracoes.tsx:81`, `Asaas.tsx:56`). Já existe tela de filtros salvos (`FiltrosSalvos.tsx`), desconectada dos favoritos.
**Exemplo prático:** Estender `FavoriteItem` com `search` (a query string atual) e salvar `location.pathname + location.search` no `toggleFavorite`; em paralelo, migrar os filtros de conciliação para `useSearchParams` como já se faz em `useUrlTab.ts:15-30`, para que o favorito capture a visão completa.
**Benefícios:** "Conciliação de novembro, só divergências" vira um favorito de um clique e um link enviável — hoje é reconstruído à mão a cada sessão.
**Impacto × esforço:** Médio × M · **Depende:** N-196

### N-198 · P1 · Central de downloads e jobs longos
**Descrição:** Exportação e geração de arquivo terminam em `window.open(url, '_blank')` espalhado por 29 pontos (`useExportarSped.ts:24`, `useSpedContabil.ts:210`, `useEvidenciasPack.ts:55,70`, `SpedEcdDownloadStep.tsx:256`, `sped-ecf-wizard/Step3Download.tsx:205`, entre outros) — nenhum entra no histórico interno e o progresso vive dentro da tela que o iniciou. Sair da página durante um SPED ou um pacote de evidências perde o acompanhamento; só `useGerarEvidenciasStream.ts:100-119` persiste snapshot e já sincroniza entre abas por `storage`.
**Exemplo prático:** Generalizar o snapshot de `useGerarEvidenciasStream` num `JobsProvider` montado em `App.tsx` ao lado do `Toaster`, com um botão de bandeja no `Header.tsx` listando jobs em andamento e concluídos (link assinado, hora, empresa); os hooks de exportação passam a registrar o job em vez de chamar `window.open` direto.
**Benefícios:** O contador inicia o SPED, continua trabalhando em outra tela e pega o arquivo quando ficar pronto — sem ficar preso à página nem perder o link assinado.
**Impacto × esforço:** Alto × G · **Depende:** N-194

### N-199 · P2 · Copilot que sobrevive à navegação
**Descrição:** `CopilotGlobalFloat` é um `Sheet` com mensagens em `useState` (`src/components/copilot/CopilotGlobalFloat.tsx:1-12`) montado dentro do `MainLayout` (`MainLayout.tsx:126`): a cada troca de rota o shell remonta (o layout vive dentro de cada página) e a conversa se perde; nas 19 rotas sem shell o copilot nem existe. O contexto é inferido só do pathname (`detectarContexto`, :38-41), então ele não sabe a empresa em foco nem o registro aberto.
**Exemplo prático:** Subir `CopilotGlobalFloat` para `AppRoutes` em `src/App.tsx` (ao lado de `CommandPalette`, :51), guardar as mensagens num contexto próprio e passar `currentEmpresaId` de `useEmpresaScope` junto do pathname no payload enviado à edge function.
**Benefícios:** O assistente acompanha o usuário entre telas com a conversa inteira e sabendo de qual empresa se fala — sem o "ele esqueceu tudo" a cada clique.
**Impacto × esforço:** Médio × M · **Depende:** N-188

### N-200 · P1 · Breadcrumb com empresa no caminho
**Descrição:** A trilha é derivada apenas de `ROUTE_META`/`resolveParentRoute` (`ContextualBreadcrumbs.tsx:79-128`) e não menciona empresa: o escopo aparece em barra separada (`EmpresaScopeBar` em `Header.tsx:138` e `PageHeader.tsx:94`), e no mobile o label dos pais é `hidden sm:inline` (:173), ou seja, só ícones. Em sistema multi-empresa, "Financeiro > Contas a Pagar" sem o CNPJ é ambíguo exatamente quando mais importa: ao aprovar pagamento. WCAG 2.2, 2.4.8 Location: https://www.w3.org/WAI/WCAG22/Understanding/location.html
**Exemplo prático:** Em `ContextualBreadcrumbs.tsx`, inserir um primeiro item com o nome fantasia de `useEmpresaScope().currentEmpresaId` (o mesmo cálculo de `Header.tsx:98-101`), com menu para trocar empresa reaproveitando `focusEmpresa`, e manter o label da empresa visível no mobile (sem `hidden sm:inline`) por ser o nível que desambigua; refletir a empresa também em `document.title` (`NavigationTracker.tsx:54`), exceto em rota sensível (:58).
**Benefícios:** Em qualquer tela e em qualquer largura o usuário lê de qual empresa é o número que vê; reduz risco de aprovar lançamento no CNPJ errado e o retrabalho que isso gera.
**Impacto × esforço:** Alto × M · **Depende:** N-188

## 3. Priorização (matriz impacto × esforço)

Contagem global das 200 etapas: `Médio × P` 65 · `Alto × M` 44 · `Médio × M` 43 · `Alto × P` 28 ·
`Baixo × P` 12 · `Alto × G` 4 · `Médio × G` 2 · `Baixo × M` 2.

### Fazer agora — alto impacto, esforço baixo (28 etapas)
Entram aqui todas as 16 P0 e as correções de uma linha com efeito em todas as telas. As que o dono
sente no mesmo dia:

| Etapa | O que resolve |
|---|---|
| N-001 | Voltar na tela de erro 404 pode jogar o usuário fora do app (`history.back()` cru) |
| N-002 / N-185 | Link profundo aberto sem sessão perde o destino depois do login |
| N-003 | 19 rotas abrem sem sidebar, trilha ou Voltar — beco sem saída, 38 rotas tributárias incluídas |
| N-004 | Três rotas de diagnóstico acessíveis em produção |
| N-051 | Classe de item ativo do menu que não existe: o usuário não vê onde está |
| N-052 | Alto contraste quebra os tokens de cor em vez de reforçar |
| N-053 | Aviso no mobile cobre o cabeçalho e o próprio Voltar |
| N-086 | Âncora de conteúdo principal ausente nas 19 rotas sem shell: o pular-para-conteúdo não funciona |
| N-121 / N-122 | Onboarding tributário retomado cai em tela vazia e o tour reinicia do passo 1 a cada tela |
| N-123 | Trocar de empresa no meio de um formulário descarta o trabalho sem aviso |
| N-176 / N-177 | Campo de busca do cabeçalho é decorativo e o atalho Ctrl+K tem dois donos concorrentes |
| N-161 | Teste automatizado de 404 verifica rótulo e rota que não existem mais |

### Planejar — alto impacto, esforço médio ou grande (48 etapas)
Rota de layout com `<Outlet>` (N-006, raiz de N-003, N-007, N-008 e N-030), Voltar único em
componente compartilhado, estado na URL (aba, filtro, página), modal com URL própria, guarda de
não-salvos nos formulários restantes, telemetria de navegação (N-151+) e persistência do estado do
shell. São as etapas que mudam a base: fazer por domínio de rota, uma PR cada.

### Quando sobrar — impacto médio ou baixo, esforço baixo (77 etapas)
Refinamentos de rótulo, foco, animação, densidade, trilha no mobile, atalhos e textos de estado
vazio. Cabem em lotes por módulo.

### Evitar por ora (4 etapas, `Alto × G`)
Reescritas amplas: derivar a paleta de comandos das 130 rotas, migrar os 164 overlays para modal
roteado, View Transitions em todas as rotas e a refatoração dos quatro wizards para uma máquina de
estados única. Só depois da base (N-006) e com métrica antes e depois.

## 4. KPIs de navegação

Hoje a telemetria coleta apenas erro e Web Vitals (`src/lib/telemetry.ts:262-300`); não há nenhum
evento de page view. Os KPIs abaixo pressupõem N-151 a N-156.

| KPI | Definição | Como medir neste repo |
|---|---|---|
| Uso do Voltar | Cliques no Voltar ÷ navegações | Evento em `useSmartBack.ts:53` (já emite o breadcrumb `nav_back`, hoje só anexado a erro) |
| Voltas consecutivas | Sessões com 3+ Voltar seguidos em menos de 10 s | Sequência de eventos de navegação; indica usuário perdido |
| Voltar que sai do app | Saídas de página cuja última ação foi Voltar | Comparar evento de Voltar com `pagehide`; alvo zero depois de N-001 |
| Beco sem saída | Rotas cuja saída mais comum é o Voltar do navegador | Agrupar por rota; valida N-003 |
| Profundidade média | Telas por sessão antes da primeira tarefa concluída | Contagem de eventos de navegação por sessão |
| Tempo até concluir tarefa | Da entrada no fluxo ao evento de sucesso | Marcar início e fim nos 4 wizards (N-152) |
| Abandono por etapa | Saídas em cada passo dos fluxos multi-etapas | Evento por etapa; alvo das melhorias N-121 a N-150 |
| Erro de rota | Acessos ao 404 por origem | Evento em `NotFound.tsx` com referenciador |
| Rage click em navegação | 3+ cliques no mesmo controle em 2 s | Listener nos controles do shell (N-158) |
| INP e LCP por rota | Web Vitals segmentados por `ROUTE_META` | `telemetry.ts` já coleta; falta a dimensão de rota (N-154) |
| Retomada de rascunho | Rascunhos retomados ÷ criados | Tabela de rascunho dos wizards (N-131) |
| Uso da paleta de comandos | Aberturas e comandos executados | Evento em `CommandPalette.tsx` (N-179) |

## 5. Roteiro em ondas

| Onda | Conteúdo | Critério de saída |
|---|---|---|
| 1 · agora | As 16 P0 e a instrumentação mínima (N-151 a N-154) | Nenhum beco sem saída; Voltar nunca sai do app; já existe número de referência antes das mudanças grandes |
| 2 · base | Rota de layout com `<Outlet>` (N-006) por domínio, Voltar único, estado na URL, guarda de não-salvos nos formulários, foco e título anunciados | Shell deixa de remontar; Voltar e recarregar previsíveis em todas as telas |
| 3 · fluxos e acessibilidade | Wizards com etapa na URL, rascunho e progresso; acessibilidade de navegação completa; modal roteado nos fluxos principais | Fluxos longos retomáveis; navegação por teclado e leitor de tela sem bloqueio |
| 4 · refinamento | Transições, micro-interações, densidade, multi-aba, PWA, paleta derivada das rotas | KPIs da seção 4 estáveis ou melhores que a onda 1 |

Regra prática: **uma etapa = uma branch `claude/<tipo>-<slug>-<AAMMDD-HHMM>` = uma PR**. Etapas que
tocam CI, segredo, migração em produção ou custo ficam com a PR aberta para o dono (`AGENTS.md` 6.6).

---

*Fim do plano. 200 etapas: 50 navegação e controle de fluxo · 35 consistência · 35 acessibilidade ·
30 fluxos complexos · 25 testes e validação · 25 integração.*
