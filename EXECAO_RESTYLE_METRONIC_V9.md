# EXCEÇÃO FORMAL: Epic de Restyle Metronic v9

**Data:** 2026-08-24  
**Epic:** Restyle do Promo_Finance_V2 para o padrão de design Metronic v9 demo1  
**Duração estimada:** 9,5–16 dias úteis  
**Escopo:** Tokens, shell e componentes visuais do app

---

## Regra original que esta exceção suspende parcialmente

> **AI_RULES.md, linhas 16 e 71:**
> "UI components → shadcn/ui. Import from `@/components/ui/*`. **Do NOT edit files inside `src/components/ui/`**; create new components when you need custom behavior."
>
> "NUNCA editar arquivos em `src/components/ui/` (gerados pelo shadcn) — criar componente novo quando precisar."

---

## O que esta exceção permite

### EDIÇÃO PERMITIDA em `src/components/ui/` (apenas durante esta epic):

1. **Tokens de design** (`src/index.css`): portar paleta zinc do Metronic v9 (17 cores light + 17 dark + chart-1..5 + radius + sistema de sidebar)
2. **Variants de componentes** (`*.variants.tsx`): atualizar button.variants.ts, badge.variants.ts, e outros CVA para refletir o design language Metronic
3. **Recomposição visual** de componentes ui mantendo API:
   - `button.tsx`, `card.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `tooltip.tsx`, `tabs.tsx`, `breadcrumb.tsx`, `pagination.tsx`, `separator.tsx`, `scroll-area.tsx`, `avatar.tsx`, `badge.tsx`, `checkbox.tsx`, `radio.tsx`, `switch.tsx`, `slider.tsx`, `progress.tsx`, `skeleton.tsx`, `table.tsx`, `toggle.tsx`, `alert.tsx`, `alert-dialog.tsx`, `sonner.tsx`, `toast.tsx`, `calendar.tsx`, `command.tsx`, `collapsible.tsx`, `collapse.tsx`, `accordion.tsx`, `aspect-ratio.tsx`, `navigation-menu.tsx`, `menubar.tsx`, `hover-card.tsx`, `label.tsx`, `drawer.tsx` (se houver)
4. **Wrapper de gráficos** (`chart.tsx`): re-tematizar paleta Recharts com tokens chart-1..5 do Metronic
5. **Componentes custom complexos** (`data-table.tsx`, `data-grid.tsx`, `advanced-filters.tsx`): recompor visual mantendo a API existente

### EDIÇÃO PERMANENTEMENTE PROIBIDA (mesmo com esta exceção):

- ❌ `src/integrations/supabase/types.ts` — **continua imutável**, gerado apenas pelo Supabase
- ❌ Alteração de APIs públicas dos componentes (props, contratos)
- ❌ Edição de qualquer arquivo fora de `src/components/ui/`, `src/index.css`, `src/tailwind.config.ts` que não esteja explícito nesta lista

---

## Regras que PERMANECEM INTocÁVEIS durante esta epic

Todas as demais regras de `AI_RULES.md`, `AGENTS.md`, `SECURITY_RULES.md`, `HERMES.md` e `CONTRIBUTING.md` continuam válidas:

### Regras de workflow
- ✅ Criar branch via worktree isolado (`HERMES_BRANCH_ID` → `fix/hermes-${ID}`), **nunca** `git checkout -b` direto
- ✅ Conventional commits obrigatórios
- ✅ Comunicação em pt-BR em tudo (comentários, commits, PRs)

### Regras de qualidade
- ✅ Gates antes de finalizar: `npm run lint`, `npx tsc --noEmit`, `npm test -- <path>`
- ✅ Nenhum gate pode ter erros novos
- ✅ Testes Vitest + Playwright passando

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

Esta exceção é válida **apenas durante a epic de restyle Metronic v9**. Ao término da epic:

1. A regra original `"Do NOT edit files inside src/components/ui/"` é **restaurada automaticamente**
2. Este documento (`EXECAO_RESTYLE_METRONIC_V9.md`) é movido para `docs/` como registro histórico
3. Novas edições em `src/components/ui/` voltam a ser proibidas, exceto via nova exceção formal

---

## Responsabilidades durante a epic

### Claude/IA
- Editar `src/components/ui/*` apenas para recompor visual Metronic
- Mantém APIs públicas (props) estáveis
- Passa todos os gates (lint, typecheck, test) antes de finalizar
- Respeita todas as outras regras (worktree, commits, pt-BR)

### Humano revisor
- Validar que edições são **puramente visuais**, não de API
- Validar que `types.ts` não foi tocado
- Validar que gates passam
- Aprovar cada PR da epic antes de merge

---

## Critérios de sucesso da epic

1. ✅ Tokens Metronic aplicados em `src/index.css` com sintaxe TW3 (paleta zinc, chart-1..5, radius, sidebar)
2. ✅ Variants CVA atualizadas (button, badge, etc.)
3. ✅ Componentes ui recompostos visualmente mantendo API (stock + custom)
4. ✅ Shell (MainLayout, Header, Sidebar, PageHeader) no padrão layout-1 do Metronic
5. ✅ Todas as 50 páginas formulaicas funcionando sem quebra de layout
6. ✅ 18 páginas bespoke recompostas (tributário, BI, Conciliacao, Asaas)
7. ✅ 636 cores hardcoded substituídas por tokens (hex + hsl)
8. ✅ Gráficos Recharts re-tematizados com paleta chart-1..5
9. ✅ Todos os gates passando (lint, typecheck, test)
10. ✅ Zero alterações em `types.ts` ou lógica de negócio

---

## Assinaturas

**Proposta por:** Claude (assistente de desenvolvimento)  
**Data:** 2026-08-24  
**Aguardando aprovação do proprietário do projeto:**

> [ ] Aprovo esta exceção para a epic de restyle Metronic v9, entendendo que:
> - É temporária (durante a epic apenas)
> - Permite edição visual apenas em `src/components/ui/*`, `index.css`, `tailwind.config.ts`
> - **Não** toca `types.ts`, APIs de componentes, ou lógica de negócio
> - Todas as outras regras (worktree, commits, gates, segurança) continuam valendo
> - Ao término da epic, a regra original é restaurada

Assinatura: ___________________ Data: _______/______/_______
