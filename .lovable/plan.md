

## Padronização Visual do Wizard SPED ECD

Aplicar 100% o padrão de design system do app financeiro (HSL tokens, tipografia Outfit/Plus Jakarta Sans, animações framer-motion + classes utilitárias) nas 3 etapas do `SpedEcdWizard.tsx` e replicar para o `SpedEcfWizard.tsx`.

### Mudanças por etapa

**Header & Progress (todas as etapas)**
- Trocar título por hierarquia premium: `text-xl font-display font-semibold tracking-tight` + descrição com `text-sm text-muted-foreground`.
- Indicador de passos como pílulas numeradas com estado (concluído `bg-success/15 text-success`, atual `bg-primary/15 text-primary ring-1 ring-primary/30`, futuro `bg-muted text-muted-foreground`) com transição `transition-all duration-300`.
- `Progress` com `variant` semântico (success quando step 3 sem erros, warning com avisos, destructive quando bloqueado).
- Wrapper das etapas com `motion.div` usando `initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}` e `AnimatePresence mode="wait"` para troca suave entre steps.

**Step 1 — Período**
- Substituir `Card` neutro por card premium glassmorphism (`bg-card/60 backdrop-blur-sm border-border/60 shadow-sm`).
- Grid de metadados com labels uppercase tracking-wide `text-[11px]` e valores `text-sm font-medium`, ícone leve antes de cada label (Building2, Hash, Calendar, FileText) usando `text-primary/70`.
- Botão "Próximo" com `variant="default"` + `hover-scale` e ícone `ChevronRight` animado.

**Step 2 — Validações**
- Linha de status no topo como bento de 3 chips KPI (Erros / Avisos / CFC) usando tokens `bg-destructive/10 text-destructive`, `bg-warning/10 text-warning`, com counter animado (`AnimatedCounter` já existente).
- Listas de erros/avisos com itens em `motion.li` staggered (delay `i*0.03`), badges numéricas usando classes semânticas, ScrollArea com borda `border-border/60` e fundo sutil tokenizado.
- Painéis embarcados (`PreValidacaoSpedPanel`, `AuditoriaCFCPanel`) recebem wrapper card consistente.
- Checklist em container com divisores sutis e `animate-fade-in`.
- Alert de bloqueio com `variant="error"` + ícone pulsante (`animate-pulse` no ShieldAlert).
- Botão "Gerar arquivo" usa `variant="premium"` quando habilitado (gradient primary→accent, `hover:shadow-glow-primary`); quando bloqueado mantém `variant="outline"` com `Lock` e cursor-not-allowed.

**Step 3 — Download**
- Banner de sucesso reformulado: card com gradiente sutil `from-success/10 to-success/5`, ícone `CheckCircle2` em círculo `bg-success/20` com `animate-scale-in`, título `text-lg font-semibold`.
- Banner de bloqueio: equivalente em `from-destructive/10 to-destructive/5` com `Ban` animado.
- Card de metadados (Linhas/Lançamentos) como mini KPIs com `AnimatedCounter`, números em `font-display font-semibold text-2xl`.
- Bloco de Hash SHA-256: container `bg-muted/40 border border-border/60 rounded-lg p-3`, code em `font-mono text-xs`, botão copy com micro-animação (já existente) + tooltip mantido.
- Botões de download: principal `variant="premium"` com `Download`, secundário `variant="outline"` com `FileArchive`; ambos com `gap-2` e `hover-scale`.
- Aviso PVA com `variant="info"` e ícone `ShieldAlert` em `text-info`.

**Tokens & utilitários aplicados**
- Zero hex hardcoded — apenas `bg-success`, `bg-destructive`, `bg-warning`, `bg-primary`, `bg-accent`, `text-muted-foreground`, etc.
- Tipografia: títulos com `font-display` (Outfit), corpo herda Plus Jakarta Sans.
- Animações: `animate-fade-in`, `animate-scale-in`, `hover-scale`, `transition-all duration-200`, framer-motion para entrada de listas e transição entre steps.

**Replicação no SpedEcfWizard.tsx**
- Aplicar exatamente o mesmo tratamento visual (header, steps, banners, hash, botões) para manter consistência entre os dois wizards.

### Arquivos a editar
- `src/components/contabilidade/SpedEcdWizard.tsx` — refatoração visual completa das 3 etapas.
- `src/components/contabilidade/SpedEcfWizard.tsx` — espelhar padrão.

Nenhuma mudança de comportamento, apenas estilo, tipografia e animações alinhados ao design system Premium do restante do sistema.

