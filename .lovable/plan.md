

## Plano — Padronizar layout/tipografia dos cards de drill-down

Os cards em `/admin/insights-ia/anomalia/:id` (`AnomaliaHeader`, `EntidadeRelacionadaCard`, `HistoricoContextualCard`, `DetectoresContribuintesCard`, `AnomaliasRelacionadasCard`, `AcoesSugeridasCard`) hoje seguem o shadcn padrão mas têm divergências entre si: tamanhos de título inconsistentes (`text-base` vs sem classe), paddings ad-hoc (`p-5` no header), botões em tamanhos misturados (`size="sm"` + `variant="ghost"|"outline"|default`), tipografia variando (`font-medium`, `font-semibold`, `font-mono` em campos sem motivo), cores hard-coded (`border-l-2 border-border`, `border-l-2 border-muted`).

O resto do projeto (ex.: `AnomaliasDetectadasPanel`, dashboards, listas tributárias) usa um padrão visual já consolidado pela memória `mem://design/premium-aesthetic-standards` e `mem://design/unified-design-system-standards`. Vou alinhar os 6 cards a esse padrão.

### Padrão a aplicar (vindo do design system existente)

```text
Card                → rounded-lg border bg-card shadow-sm
CardHeader          → pb-3
CardTitle           → text-sm font-semibold tracking-tight + ícone h-4 w-4 text-muted-foreground
CardContent         → space-y-4
Texto principal     → text-sm
Texto secundário    → text-xs text-muted-foreground
Valores monetários  → tabular-nums font-medium
Bordas/separadores  → border-border (token), nunca hex
Ações primárias     → Button size="sm" variant="default"
Ações secundárias   → Button size="sm" variant="outline"
Ações destrutivas   → Button size="sm" variant="ghost" + ícone destructive (Falso positivo)
Badges severidade   → mantém variant atual (destructive/secondary/outline) — já consistente
```

### Mudanças por arquivo

**1. `AnomaliaHeader.tsx`**
- Trocar `CardContent p-5` por `CardContent p-6`.
- Título "Anomalia" implícito → manter sem `CardHeader` (é hero), mas alinhar tipografia: `text-base font-semibold` na descrição (hoje `text-base font-medium`).
- Botões: padronizar ordem **Investigar (outline) → Falso positivo (ghost) → Confirmar (default)**, todos `size="sm"`. Já está perto, só ajustar variants.
- Timestamp: `text-xs text-muted-foreground tabular-nums`.

**2. `EntidadeRelacionadaCard.tsx`**
- `CardTitle` → `text-sm font-semibold` (hoje `text-base`).
- Grid de campos: substituir `font-mono text-xs` por `text-xs tabular-nums` para valores e `text-xs font-medium` para labels. Fonte mono só em IDs/UUIDs.
- Botão "Abrir tela completa" → `variant="outline" size="sm"` (mantém).

**3. `HistoricoContextualCard.tsx`**
- `CardTitle` → `text-sm font-semibold`.
- Altura do gráfico de `h-64` → `h-56` (alinha com altura padrão de mini-charts em outros painéis).
- `XAxis`/`YAxis` `fontSize={11}` → `fontSize={10}` (consistente com `mv_benchmark` charts).

**4. `DetectoresContribuintesCard.tsx`**
- `CardTitle` → `text-sm font-semibold`.
- Bloco interno: substituir `bg-muted/30 border` por `bg-muted/40 border border-border rounded-md p-3 space-y-2` (igual aos blocos de `AcoesSugeridasCard`).
- Subtítulo do detector: `text-sm font-semibold` (já está); contribuição → `text-xs font-medium tabular-nums`.
- Regra: `font-mono text-[11px]` (hoje `text-xs`) para destacar como código.

**5. `AnomaliasRelacionadasCard.tsx`**
- `CardTitle` → `text-sm font-semibold`.
- `border-l-2 border-border` → `border-l-2 border-primary/40` (o padrão do projeto para listas relacionadas).
- Descrição truncada → `text-sm leading-snug truncate`.
- Botão da seta → `variant="ghost" size="icon-sm"` (hoje `size="sm"` deixa botão grande demais).

**6. `AcoesSugeridasCard.tsx`**
- `CardTitle` → `text-sm font-semibold`.
- Bloco de ação: já usa `bg-muted/30` — alinhar para `bg-muted/40` (igual ao DetectoresContribuintesCard).
- "Parecer / observações" label → `text-xs font-medium uppercase tracking-wide text-muted-foreground` (padrão de form labels do projeto).
- Botão "Salvar parecer" → `size="sm" variant="default"` (já está).

**7. `AnomaliaDetalhe.tsx` (página)**
- `container max-w-7xl` → `container max-w-6xl` (alinha com `/admin/system-health` e `/admin/insights-ia`).
- Spacing externo `space-y-6` → `space-y-4` (mais denso, consistente com painéis admin).
- Título da página `text-xl font-bold font-display` → `text-2xl font-semibold tracking-tight font-display` (padrão `MainLayout` headers).

### Detalhes técnicos

- Sem mudança em hooks, edge functions ou banco — apenas tokens de Tailwind e variants do shadcn.
- `tabular-nums` resolve alinhamento vertical de valores R$ (uso já comum em `RelatoriosTributarios`).
- Todas as cores continuam vindo de tokens HSL (`--card`, `--border`, `--muted`, `--primary`, `--muted-foreground`) — zero hex.
- Tipografia herdada de `font-display`/`font-sans` do `tailwind.config.ts` — sem importar fonte nova.
- Acessibilidade preservada: contrastes seguem o padrão já auditado.

### Fora de escopo

- Reescrever conteúdo dos cards (regras XAI, lógica de ações sugeridas, dados do gráfico).
- Adicionar dark/light mode toggle aqui — já vem do tema global.
- Migrar para um novo componente `Card` — continua o shadcn `Card` padrão.
- Mexer nos cards do drawer (`AnomaliaDrillDownDrawer`) — eles reutilizam `AnomaliaHeader` e `EntidadeRelacionadaCard`, então herdam o ajuste automaticamente.

