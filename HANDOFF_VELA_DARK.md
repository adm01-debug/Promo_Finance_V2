# HANDOFF — Epic Vela-dark Promo_Finance_V2

> **Para:** próximo Claude/session que continua a epic
> **Escrito em:** 2026-08-25 (após commit `7f5c3998`)
> **Como usar:** ler este documento INTEIRO antes de tocar no código. Depois ler `AI_RULES.md`, `EXECAO_VELA_DARK.md` e a memória `promo-finance-restyle-metronic.md`.

---

## 1. Contexto em 60 segundos

- **Projeto:** `~/projetos/Promo_Finance_V2` — fintech 278k LOC, React 18 + Vite 5 + Tailwind **v3** + shadcn/ui (Radix) + Supabase + React Query v5. GitHub: `https://github.com/adm01-debug/Promo_Finance_V2.git` (branch `main`).
- **Objetivo da epic:** restyle completo para o visual **Vela-dark** (dark, moderno, futurista, animado — ref. ReactBits Pro). Template comprado em `~/projetos/themeforest-1G8Rifab-vela-react-admin-dashboard-template/vela-dashboard` (licença TF regular do usuário; **não commitar código do template no repo**).
- **Decisões APROVADAS pelo usuário:** D8 (Vela-dark direção primária) · D9 (Plus Jakarta Sans + JetBrains Mono) · D10 (exceção formal → `EXECAO_VELA_DARK.md`, assinada). D6 (ReactBits Aurora) resolvida **sem** `ogl` — aurora em CSS puro. D7 (ReactBits Pro pago) = NÃO comprar.
- **Estratégia acordada:** Vela dá o VISUAL; a arquitetura PFV2 fica (Radix/shadcn, Recharts, React Query, regras AI_RULES). TW4→TW3 via vars CSS + `theme.extend.colors`. **Zero dependências novas.**

### Maquetes de referência (o alvo visual está AQUI, não no template)
- `~/.claude/artifacts/vela-dark-pfv2.html` — maquete aprovada: dashboard CR/CP/conciliação/fiscal, login split-screen com **aurora animada** (4 blobs radial-gradient roxo/índigo, `mix-blend:screen` sobre `#05060d`, keyframes só de `transform`), motion, mapa de integração. Servida em `http://localhost:8765/vela-dark-pfv2.html` (subir com `python3 -m http.server 8765` de `~/.claude/artifacts` se cair). Cópia em `/mnt/c/Users/Public/vela-dark-pfv2.html`.
- `~/.claude/artifacts/restyle-metronic-plano.html` — plano histórico Metronic (114 etapas · 11 fases · portões G1–G8). **Plano B/agora referência de processo** (gates, fases, verticalidade R1–R6, anti-scroll). O alvo visual mudou para Vela-dark; a disciplina de execução não.

### Paleta de séries VALIDADA (script dataviz — NÃO reordenar)
`--ch1..5 = #8263ff, #be8200, #00a96b, #3c8fe4, #d85164` — ordem FIXA. Verde↔vermelho JAMAIS adjacentes (deutan ΔE 2–6). 6ª série vira "Outros" (cinza). Status vivos do Vela (`#33d493`, `#f76d7d`…) só com ícone+rótulo, nunca cor sozinha.

---

## 2. Estado ATUAL exato (o que já está no `main`)

**Commit `7f5c3998` — "feat: implement design system Vela-dark (D8/D9/D10)"** (pushed, `origin/main` em sync):

| Item | Arquivo | Estado |
|---|---|---|
| 22 tokens Vela (bg-0..3, line, t0..2, acc, ok/warn/bad/info + softs, shadow, radius-vela-*) | `src/index.css` | ✅ em `:root` (dark-first), `:root[data-theme="light"]/.light` e `.dark` |
| Tokens legados shadcn (background, primary, secondary…) | `src/index.css` (bloco "Promo Finance Legado") | ✅ MANTIDOS "para compatibilidade" — ver §3, é o ponto crítico |
| 10 keyframes Vela + `.vela-page-enter` (stagger) + `.vela-reveal` | `src/index.css` | ✅ portados verbatim |
| `@media (prefers-reduced-motion: reduce)` global | `src/index.css` | ✅ mata animações + `.vela-*` + `pulse-subtle` |
| `theme.extend.colors` TW3 (bg-*, t-*, acc, ok/warn/bad/info, line) + `borderRadius` vela | `tailwind.config.ts` | ✅ |
| Google Fonts Plus Jakarta Sans (400–800) + JetBrains Mono (500–700) | `index.html` | ✅ |
| Variants re-tematizados | `button.variants.ts`, `badge.variants.ts`, `navigation-menu.variants.ts`, `toggle.variants.ts` | ✅ API intacta; classes agora `bg-acc`, `bg-bad`, `bg-bg-3/50`, `rounded-vela-*` |
| Motion components | `src/components/motion/` (StatCard, AnimatedNumber pt-BR com `prefers-reduced-motion` check, index.ts) | ✅ criados — **ainda NÃO usados em nenhuma tela** |
| Charts | `src/components/charts/` (Sparkline 19 linhas SVG, ChartContainer CVD-safe, RechartsExample, index.ts) | ✅ criados — **ainda NÃO usados em nenhuma tela** |
| Testes | `src/components/ui/__tests__/{button,badge}.test.tsx` | ✅ atualizados para classes Vela |
| Exceção formal | `EXECAO_VELA_DARK.md` (assinada) + `EXECAO_RESTYLE_METRONIC_V9.md` (histórica) | ✅ commitadas |

**Gates no momento do handoff:**
- `npm test --run` → **2680/2680 passando** (201 arquivos)
- `npm run lint` → **0 erros**, 13 warnings (pré-existentes, ex. `runEntregas` unused em `src/test/scenarios/runner.ts:298`)
- `npx tsc --noEmit` → **0 erros**
- Banco de dados: **ZERO impacto** — nenhuma migration, `types.ts` intocado ✅

---

## 3. ⚠️ A VERDADE INCOMODA — estado visual HÍBRIDO (ler antes de qualquer coisa)

O commit `7f5c3998` aplicou Vela nos **variants**, mas o resto do app ainda consome tokens **legados claros**:

1. **624 arquivos** em `src/pages` + `src/components` ainda usam `bg-primary`, `text-primary`, `bg-secondary`, `text-foreground`, `bg-background`, `border-border` etc.
2. O bloco legado em `index.css` continua definindo `--background: 210 40% 98%` (claro) e `body { @apply bg-background text-foreground }`. Resultado: **páginas em fundo claro legado com botões/badges violeta Vela escuro** — visual quebrado/misto em produção visual.
3. **NÃO houve validação visual no navegador do PFV2.** Cuidado: `localhost:5175` é o dev server do **template Vela**, não do PFV2 (mensagem anterior do assistente sobre "app rodando em 5175" estava errada). O PFV2 sobe com `npm run dev` na porta padrão (5173) — **fazer isso e validar antes de qualquer nova mudança**.
4. `--font-body: Inter` / `--font-heading: Outfit` continuam em `index.css` (bloco legado) — as fontes D9 estão carregadas no `index.html` mas **não aplicadas** via CSS.

### 👉 P0 real (primeira tarefa do próximo chat): remap legacy→Vela
**Não migrar 624 arquivos.** Redefinir os VALORES dos tokens legados para os equivalentes Vela, mantendo os nomes. Uma edição de ~30 linhas em `index.css` põe o app INTEIRO em Vela-dark instantaneamente:

```
--background  → var(--bg-0)  ·  --foreground → var(--t0)
--card/--popover → var(--bg-1)  ·  --card-foreground/--popover-foreground → var(--t0)
--primary → var(--acc) [#7c5cff]  ·  --primary-foreground → var(--t0)
--secondary/--muted/--accent → var(--bg-2)/bg-3  ·  --secondary-foreground/--accent-foreground → var(--t0)
--muted-foreground → var(--t1)
--destructive → var(--bad)  ·  --success → var(--ok)  ·  --warning → var(--warn)  ·  --info → var(--info)
--border/--input → var(--line)  ·  --ring → var(--acc)
--sidebar-* → equivalentes (background=bg-1, foreground=t0, primary=acc, accent=bg-3, border=line, ring=acc)
--font-body → "Plus Jakarta Sans", system-ui…  ·  --font-heading → idem  ·  (novo) números financeiros → "JetBrains Mono" com font-variant-numeric: tabular-nums
```
Fazer isso em `.dark` e `:root` (dark-first: `:root` já tem `color-scheme: dark`). O tema claro legado (`.light`) pode ficar mapeado para os valores claros do Vela (`:root[data-theme="light"]` já existe em cima) — decisões: tema claro Vela é fase FINAL, opcional.
**Critério de aceite:** abrir PFV2 em `npm run dev`, logar, passear por Dashboard/CR/CP/Conciliação — tudo escuro coeso, zero elemento claro órfão, gates verdes.

---

## 4. Pendências e dívidas conhecidas

| # | Item | Detalhe | Ação sugerida |
|---|---|---|---|
| 4.1 | **Husky pre-commit não executável** | `'.'husky/pre-commit' hook was ignored because it's not set as executable` no commit | `git config core.hooksPath .husky` + `chmod +x .husky/pre-commit` (ou `git config advice.ignoredHook false` para silenciar) — verificar por que está assim antes |
| 4.2 | **2 vulnerabilidades high (Dependabot)** | avisadas no push: `github.com/adm01-debug/Promo_Finance_V2/security/dependabot` | revisar; se for dev-deps de build, atualizar com gate |
| 4.3 | **`graphify-out/` commitado sem querer** | entrou no 7f5c3998 (cache de knowledge graph) | `git rm -r --cached graphify-out/` + add ao `.gitignore` num commit `chore:` |
| 4.4 | **13 warnings de lint** | pré-existentes | limpar quando conveniente; gates exigem 0 erros, warnings tolerados |
| 4.5 | **Desvio de processo cometido:** commit direto em `main` | a regra do projeto é worktree hermes (`fix/hermes-${ID}`), nunca direto | nas próximas mudanças usar worktree (ver §6); PR quando o fluxo exigir |
| 4.6 | **Drift repo↔banco: 46 tabelas ausentes** | QA visual não pode confiar no banco real | validar com mocks/galeria (Fase 0 do plano original) |
| 4.7 | **`useConciliacaoPage.test.tsx` instável** | falhou 1x no run do workflow ("DB down"), passou depois | watch: se falhar de novo, investigar ordem/mock — não ignorar |

---

## 5. BACKLOG — tudo que NÃO foi implementado ainda (priorizado)

> Ordem = dependência + impacto. Cada item: [arquivos] → passos → aceite. Rodar gates ao fim de CADA item. Commits convencionais pt-BR (ex. `feat(auth): port do login com aurora CSS`).

### P0 — Remap legacy→Vela (§3 acima) + validação visual no navegador
1. Editar bloco legado de `src/index.css` remapeando valores.
2. `npm run dev` → validar 10 telas críticas (lista da auditoria): `DashboardEmpresa, ContasReceber, ContasPagar, Conciliação, Financeiro, Boletos, Cobranças, FluxoCaixa, BenchmarkingSetorial, Clientes`.
3. Screenshot antes/depois de 3 telas para o usuário (de `/mnt/c/Users/Public/` + abrir browser).
4. Gates + commit.

### P1 — Auth com aurora (port da maquete aprovada)
- [arquivos] `src/pages/Auth.tsx` (e derivados de login; auditoria apontou `Auth.tsx` com hex hardcoded).
- Portar o layout split-screen aprovado da maquete (seção 03): painel esquerdo brand + headline "O financeiro que o time realmente usa." + depoimento glass; direito formulário; **aurora** = 4 divs radial-gradient roxo/índigo (`rgba(96,62,190,.55)`, `rgba(70,48,155,.62)`, `rgba(58,90,190,.26)`, `rgba(150,92,255,.17)`), `mix-blend-mode:screen`, base `#05060d`, keyframes `aur1..4` 19–26s `ease-in-out infinite alternate` animando SÓ `transform`, vinheta radial, painéis translúcidos + `backdrop-filter`. Copiar CSS literal da maquete (`vela-dark-pfv2.html` linhas ~240-256) para `src/index.css` (seção AUTH) — nomes `.authframe/.aurora/.aur/.a1..a4` → prefixar `.pf-auth-*` se colidir.
- **Zero `ogl`/WebGL.** `prefers-reduced-motion` já cobre via media global (adicionar `.pf-auth .aur` ao seletor por garantia).
- Zona Z3 (motion máximo permitido em Auth).

### P2 — AppShell: MainLayout + page-stagger
- [arquivos] `src/components/layout/` (MainLayout/Header/Sidebar — localizar nomes reais), `src/App.tsx` se necessário.
- Envolver o conteúdo de rota: `<div className="vela-page-enter" key={pathname}>` — o stagger dos filhos já está no CSS. Sidebar: visual acordeão (colapsa p/ ícones, hover re-expande) e topbar com `backdrop-filter: blur` — **comportamento existente fica, recompor só o visual**.
- PageHeader padrão Vela: eyebrow 11px uppercase + título 22px/800 + ações à direita.

### P3 — Adotar motion/charts nas telas reais (primeiro: Dashboard CR)
- Substituir KPI cards por `StatCard` + `AnimatedNumber` (import `@/components/motion`); sparklines com `@/components/charts/Sparkline`; gráficos Recharts envolvidos em `ChartContainer` (paleta `--ch1..5`, crosshair, tooltip mono).
- Números financeiros: classe util `font-mono tabular-nums` (configurar `fontFamily.mono = ["JetBrains Mono", ...]` no `tailwind.config.ts` se ainda não).
- **Zonas de motion:** Z0 documentos/relatórios/fiscal-impresso = ZERO motion; Z1 operação (tabelas) = só hover; Z2 dashboards = reveal+count; Z3 auth/momentos = aurora. **Nunca animar tabela >50 linhas.**

### P4 — Limpeza de hex hardcoded (143 ocorrências; foco: 18 páginas bespoke)
- Alvos da auditoria: `Auth.tsx`, `Asaas.parts.tsx`, `Orcamentos.tsx`, `tributario/OnboardingTributario.tsx` + bespoke (tributário 16 telas, BI, Conciliação 9 abas, Asaas 8 abas).
- Substituir `#xxxxxx` por `var(--*)`/classes token. Fazer página a página, com screenshot e gate por página. Depois do P0, hex claro em fundo escuro = bug visível (bom detector).

### P5 — Command palette ⌘K
- shadcn `Command` já instalado — re-tematizar (tokens Vela) + registrar rotas/ações PFV2. Animação `velaPop` na abertura.

### P6 — Tema claro Vela (opcional, fase final)
- `:root[data-theme="light"]` já tem valores claros; validar toggle do `next-themes` e ajustar contraste. Só depois do dark 100% aprovado.

### P7 — Gates do plano G2–G8 (processo)
- G2 espécimes (Storybook), G3 galeria componentes, G4 shell vivo, G5 invoice-view, G6 amostra 5 telas, G7 aceite base, G8 QA motion (checklist: reduced-motion em 100%, zero animação em Z0 e tabelas >50 linhas).

---

## 6. Regras INVIOLÁVEIS (não negociar, verificar sempre)

1. **`src/integrations/supabase/types.ts` é imutável** — nunca editar à mão.
2. **APIs públicas de componentes não mudam** — restyle é visual (props/contratos ficam).
3. **Edição em `src/components/ui/`** só o que `EXECAO_VELA_DARK.md` permite (visual/variants), durante a epic. Novos componentes de behavior → fora de `ui/`.
4. **Worktree hermes** para trabalho novo (`fix/hermes-${HERMES_BRANCH_ID}`), nunca `git checkout -b`/commit direto em `main` (o 7f5c3998 foi exceção — não repetir).
5. **Conventional commits em pt-BR**; gates `npm run lint` + `npx tsc --noEmit` + `npm test -- <path>` antes de finalizar CADA mudança; nenhum erro novo.
6. **Migrations sempre backwards-compatible** (não há nenhuma nesta epic — e não deve haver).
7. **Sem deps novas** (a epic inteira é CSS/ports; framer-motion já existe se precisar).
8. **Sem fetch direto em componentes** (React Query), anon key only no client, nunca commitar secrets.
9. **Sem código do template Vela commitado** no repo PFV2 (licença cobre uso, o template fica onde está).
10. **pt-BR em tudo** (comentários, commits, PRs, comunicação).

---

## 7. Mapa rápido de arquivos

| Caminho | Papel |
|---|---|
| `src/index.css` | tokens Vela + legado (remap P0 aqui) + keyframes + reduced-motion |
| `tailwind.config.ts` | extend.colors Vela (bg-*/t-*/acc/ok/warn/bad/info/line) + radius-vela-* |
| `index.html` | Google Fonts Jakarta + JetBrains Mono |
| `src/components/ui/*.variants.ts` | já Vela: button, badge, navigation-menu, toggle |
| `src/components/motion/` | StatCard, AnimatedNumber (pt-BR), index.ts — prontos p/ uso |
| `src/components/charts/` | Sparkline, ChartContainer (--ch1..5), RechartsExample, index.ts |
| `src/components/ui/__tests__/{button,badge}.test.tsx` | atualizados p/ classes Vela |
| `EXECAO_VELA_DARK.md` | exceção assinada (escopo da epic) |
| `~/projetos/themeforest-.../vela-dashboard/src/index.css` | fonte de verdade do template (22 vars, keyframes, stagger) |
| `~/.claude/artifacts/vela-dark-pfv2.html` | **alvo visual aprovado** (dashboard, auth+aurora, motion) |
| `~/.claude/artifacts/restyle-metronic-plano.html` | plano de processo (fases, gates G1–G8, R1–R6) |

## 8. Comandos

```bash
cd ~/projetos/Promo_Finance_V2
npm run dev                                  # PFV2 (5173) — validar visual AQUI
npm test -- --run                            # 2680 testes
npm test -- src/components/ui/__tests__/     # só ui
npm run lint && npx tsc --noEmit             # gates
# maquete: cd ~/.claude/artifacts && python3 -m http.server 8765 → :8765/vela-dark-pfv2.html
# template Vela (comparação): cd ~/projetos/themeforest-.../vela-dashboard && npm run dev -- --port 5175
```

## 9. Próxima sessão — checklist de abertura

1. Ler este arquivo + `AI_RULES.md` + `EXECAO_VELA_DARK.md` + memória `promo-finance-restyle-metronic.md`.
2. `git status` / `git log -3` — confirmar main limpo em `7f5c3998`.
3. **Executar P0 (remap legacy→Vela)** e validar no navegador (§3/P0) — é a maior alavancada: uma edição escura o app inteiro.
4. Seguir P1→P7 na ordem, gates + commit a cada item, via **worktree hermes** (regra 4).
5. Reportar ao usuário com screenshots antes/depois (copiar p/ `/mnt/c/Users/Public/` e abrir browser).
