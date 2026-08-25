# EXCEÇÃO FORMAL: Epic de Restyle Vela-dark

**Data:** 2026-08-24
**Epic:** Restyle do Promo_Finance_V2 para o design language Vela-dark (ReactBits Pro aesthetic + Vela template)
**Duração estimada:** 9–16 dias úteis
**Escopo:** Tokens, shell, motion e componentes visuais do app
**Baseado em:** Exceção original Metronic v9 (renomeada e re-escopada)

---

## Decisões que habilitam esta exceção

- **D8** ✅ — Vela-dark adotado como direção primária (substitui alvo Metronic-light)
- **D9** ✅ — Fontes Plus Jakarta Sans + JetBrains Mono (troca Inter)
- **D10** ✅ — Esta exceção formal (renomeada de EXECAO_RESTYLE_METRONIC_V9.md)

---

## Regra original que esta exceção suspende parcialmente

> **AI_RULES.md, linhas 16 e 71:**
> "UI components → shadcn/ui. Import from `@/components/ui/*`. **Do NOT edit files inside `src/components/ui/`**; create new components when you need custom behavior."
>
> "NUNCA editar arquivos em `src/components/ui/` (gerados pelo shadcn) — criar componente novo quando precisar."

---

## O que esta exceção permite

### EDIÇÃO PERMITIDA em `src/components/ui/` (apenas durante esta epic):

1. **Tokens de design Vela-dark** (`src/index.css`): portar 22 tokens do Vela (bg-0..3, line, t0..2, acc, ok/warn/bad/info, radius, shadow, keyframes)
2. **Variants de componentes** (`*.variants.tsx`): atualizar button.variants.ts, badge.variants.ts, e outros CVA para refletir o design language Vela-dark
3. **Recomposição visual** de componentes ui mantendo API:
   - `button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`, `tabs.tsx`, `breadcrumb.tsx`, `pagination.tsx`, `separator.tsx`, `scroll-area.tsx`, `avatar.tsx`, `badge.tsx`, `checkbox.tsx`, `radio.tsx`, `switch.tsx`, `slider.tsx`, `progress.tsx`, `skeleton.tsx`, `table.tsx`, `toggle.tsx`, `alert.tsx`, `alert-dialog.tsx`, `sonner.tsx`, `toast.tsx`, `calendar.tsx`, `command.tsx`, `collapsible.tsx`, `collapse.tsx`, `accordion.tsx`, `aspect-ratio.tsx`, `navigation-menu.tsx`, `menubar.tsx`, `hover-card.tsx`, `label.tsx`, `drawer.tsx` (se houver)
4. **Wrapper de gráficos** (`chart.tsx`): re-tematizar paleta Recharts com tokens --ch1..5 derivados e validados (script dataviz, band OKLCH L .48–.67)
5. **Componentes motion** (`src/components/motion/`): criar diretório novo para StatCard, AnimatedNumber, Sparkline — fora de ui/, sem tocar a exceção
6. **Componentes custom complexos** (`data-table.tsx`, `data-grid.tsx`, `advanced-filters.tsx`): recompor visual mantendo a API existente
7. **Fontes** (`index.html`): adicionar Plus Jakarta Sans + JetBrains Mono via Google Fonts

### EDIÇÃO PERMANENTEMENTE PROIBIDA (mesmo com esta exceção):

- ❌ `src/integrations/supabase/types.ts` — **continua imutável**, gerado apenas pelo Supabase
- ❌ Alteração de APIs públicas dos componentes (props, contratos)
- ❌ Edição de qualquer arquivo fora de `src/components/ui/`, `src/index.css`, `src/tailwind.config.ts`, `src/components/motion/`, `index.html` que não esteja explícito nesta lista

---

## Regras que PERMANECEM INTÁCITAS durante esta epic

Todas as demais regras de `AI_RULES.md`, `AGENTS.md`, `SECURITY_RULES.md`, `HERMES.md` e `CONTRIBUTING.md` continuam válidas:

### Regras de workflow
- ✅ Criar branch via worktree isolado (`HERMES_BRANCH_ID` → `fix/hermes-${ID}`), **nunca** `git checkout -b` direto
- ✅ Conventional commits obrigatórios (pt-BR)
- ✅ Comunicação em pt-BR em tudo (comentários, commits, PRs)

### Regras de qualidade
- ✅ Gates antes de finalizar: `npm run lint`, `npx tsc --noEmit`, `npm test -- <path>`
- ✅ Nenhum gate pode ter erros novos
- ✅ Testes Vitest + Playwright passando
- ✅ Preferir shadcn/Radix sobre componentes artesãos (acessibilidade)

### Regras de banco
- ✅ Migrations **sempre** backwards-compatible (DEFAULT/NULLABLE em colunas novas)
- ✅ `types.ts` **imutável** — gerado pelo Supabase, nunca editado à mão

### Regras de segurança
- ✅ Nunca commitar secrets/keys
- ✅ Client usa apenas `VITE_SUPABASE_PUBLISHABLE_KEY` (anon)
- ✅ `service_role` apenas no servidor
- ✅ Fetch direto em componentes proibido (sempre React Query)

---

## Delimitação temporal

Esta exceção é válida **apenas durante a epic de restyle Vela-dark**. Ao término da epic:

1. A regra original `"Do NOT edit files inside src/components/ui/"` é **restaurada automaticamente**
2. Este documento (`EXECAO_VELA_DARK.md`) é movido para `docs/` como registro histórico
3. Novas edições em `src/components/ui/` voltam a ser proibidas, exceto via nova exceção formal

---

## Responsabilidades durante a epic

### Claude/IA
- Editar `src/components/ui/*` apenas para recompor visual Vela-dark
- Mantém APIs públicas (props) estáveis
- Respeita `prefers-reduced-motion` em 100% dos efeitos (Z0–Z3: zero motion em documentos/relatórios)
- Passa todos os gates (lint, typecheck, test) antes de finalizar
- Respeita todas as outras regras (worktree, commits, pt-BR)

### Humano revisor
- Validar que edições são **puramente visuais**, não de API
- Validar que `types.ts` não foi tocado
- Validar que gates passam
- Validar que motion respeita reduced-motion (checklist G8)
- Aprovar cada PR da epic antes de merge

---

## Critérios de sucesso da epic

1. ✅ Tokens Vela aplicados em `src/index.css` com sintaxe TW3 (22 vars + keyframes)
2. ✅ Fontes Jakarta + JetBrains Mono carregadas via Google Fonts
3. ✅ Variants CVA atualizadas (button, badge, etc.)
4. ✅ Componentes ui recompostos visualmente mantendo API (stock + custom)
5. ✅ Shell (MainLayout, Header, Sidebar, PageHeader) no padrão Vela-dark
6. ✅ Motion layer implementada (velaRise, velaPop, velaReveal, AnimatedNumber, Sparkline)
7. ✅ Componentes motion criados em `src/components/motion/` (fora de ui/)
8. ✅ Todas as 50 páginas formulaicas funcionando sem quebra de layout
9. ✅ 18 páginas bespoke recompostas (tributário, BI, Conciliação, Asaas)
10. ✅ Gráficos Recharts re-tematizados com paleta --ch1..5 validada
11. ✅ Auroras animadas no login (4 blobs CSS, sem `ogl`)
12. ✅ Todos os gates passando (lint, typecheck, test)
13. ✅ Zero alterações em `types.ts` ou lógica de negócio
14. ✅ `prefers-reduced-motion` respeitado em 100% dos efeitos

---

## Assinaturas

**Proposta por:** Claude (assistente de desenvolvimento)
**Data:** 2026-08-24

**Aguardando aprovação do proprietário do projeto:**

> [x] Aprovo esta exceção para a epic de restyle Vela-dark, entendendo que:
> - É temporária (durante a epic apenas)
> - Permite edição visual apenas em `src/components/ui/*`, `index.css`, `tailwind.config.ts`, `index.html`, `src/components/motion/`
> - **Não** toca `types.ts`, APIs de componentes, ou lógica de negócio
> - Todas as outras regras (worktree, commits, gates, segurança, motion) continuam valendo
> - Ao término da epic, a regra original é restaurada

Assinatura: Joaquim Ataides Data: 24/08/2026
