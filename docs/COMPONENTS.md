# Documentação dos Componentes UI Aprimorados

Este documento descreve todos os 47 componentes UI aprimorados disponíveis no projeto.

---

## 📦 Cards

### Card Base
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
```

### InteractiveCard
Card com efeitos de hover interativos.

```tsx
<InteractiveCard hoverEffect="lift | glow | border | scale | tilt">
  Conteúdo
</InteractiveCard>
```

### GradientCard
Card com gradientes coloridos.

```tsx
<GradientCard gradient="primary | success | warning | danger | rainbow" animated>
  Conteúdo
</GradientCard>
```

### SpotlightCard
Card com efeito de luz seguindo o cursor.

```tsx
<SpotlightCard spotlightColor="hsl(var(--primary))">
  Conteúdo
</SpotlightCard>
```

### StatsCard
Card para exibição de estatísticas.

```tsx
<StatsCard
  title="Receita"
  value="R$ 45.231"
  trend={{ value: 12, isPositive: true }}
  icon={<TrendingUp />}
/>
```

### FlipCard
Card com frente e verso.

```tsx
<FlipCard
  front={<div>Frente</div>}
  back={<div>Verso</div>}
  flipOnHover
/>
```

---

## 📝 Inputs

### Input Base
```tsx
<Input variant="default | filled | underline" inputSize="sm | md | lg" />
```

### FloatingLabelInput
Input com label flutuante animada.

```tsx
<FloatingLabelInput id="email" label="Email" />
```

### PasswordInput
Input de senha com toggle de visibilidade e indicador de força.

```tsx
<PasswordInput showStrength />
```

### SearchInput
Input de busca com ícone e botão de limpar.

```tsx
<SearchInput
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  onClear={() => setSearch("")}
  loading={isSearching}
/>
```

### ValidatedInput
Input com estados de validação visuais.

```tsx
<ValidatedInput
  validationState="idle | validating | valid | invalid"
  validationMessage="Email válido!"
/>
```

---

## 🏷️ Badges

### Badge Variants
```tsx
<Badge variant="default | secondary | success | warning | info | destructive">
  Label
</Badge>
```

### NotificationBadge
Badge para notificações.

```tsx
<NotificationBadge count={5} pulse variant="destructive">
  <Bell />
</NotificationBadge>
```

### StatusBadge
Badge de status com indicador.

```tsx
<StatusBadge status="online | offline | away | busy" />
```

### CountBadge
Badge com contador.

```tsx
<CountBadge count={150} max={99} /> {/* Mostra 99+ */}
```

---

## 🔔 Toasts

### Toast Helpers
```tsx
import { toast } from "@/hooks/use-toast";

toast.success("Título", "Descrição");
toast.error("Título", "Descrição");
toast.warning("Título", "Descrição");
toast.info("Título", "Descrição");
toast.loading("Carregando...");

// Promise toast
await toast.promise(fetchData(), {
  loading: "Carregando...",
  success: "Dados carregados!",
  error: "Erro ao carregar",
});
```

---

## ⏳ Loading States

### Spinners
```tsx
<SpinnerLoader size="sm | md | lg | xl" variant="default | gradient" />
<PulseLoader size="sm | md | lg" />
```

### Bar Loader
```tsx
<BarLoader variant="default | glow | striped" />
```

### Progress Loader
```tsx
<ProgressLoader
  progress={65}
  message="Carregando..."
  showPercentage
  variant="gradient"
/>
```

### Full Page Loader
```tsx
<FullPageLoader message="Carregando..." logo={<Logo />} />
```

### Overlay Loader
```tsx
<OverlayLoader isLoading={loading} message="Salvando..." status="loading">
  <Content />
</OverlayLoader>
```

---

## 💀 Skeletons

```tsx
<Skeleton className="h-4 w-full" animated />
<SkeletonCard />
<SkeletonProfile />
<SkeletonGroup count={3}>
  <Skeleton className="h-4" />
</SkeletonGroup>
```

---

## 📊 Data Display

### AnimatedCounter
```tsx
<AnimatedCounter
  value={1234}
  duration={2}
  variant="default | flip | slide | glow"
/>
```

### AnimatedStat
```tsx
<AnimatedStat label="Receita" value={45231} prefix="R$" suffix="+" />
```

### TrendIndicator
```tsx
<TrendIndicator value={12.5} label="vs mês anterior" />
```

---

## 📭 Empty States

```tsx
<EmptyState
  illustration="search | empty | error | folder | inbox"
  title="Nenhum resultado"
  description="Descrição"
  action={{ label: "Ação", onClick: () => {} }}
  variant="default | compact | card | inline"
/>

<NoResults query="termo" onClear={() => {}} />
<ErrorState error={error} onRetry={() => {}} />
```

---

## 🎯 Tooltips

### RichTooltip
```tsx
<RichTooltip title="Título" description="Descrição" icon="info | help | warning">
  <Trigger />
</RichTooltip>
```

### ShortcutTooltip
```tsx
<ShortcutTooltip label="Salvar" keys={["⌘", "S"]}>
  <Button />
</ShortcutTooltip>
```

### InfoTooltip
```tsx
<InfoTooltip content="Informação útil" />
```

---

## 🗂️ Tabs

### Variants
```tsx
<TabsList variant="default | pills | underline | bordered">
  <TabsTrigger variant="..." icon={<Icon />} badge={5}>
    Tab
  </TabsTrigger>
</TabsList>

<TabsContent animation="fade | slide | scale | none">
  Conteúdo
</TabsContent>
```

### AnimatedTabs
```tsx
<AnimatedTabs
  tabs={[
    { value: "tab1", label: "Tab 1", icon: <Icon />, content: <Content /> },
  ]}
  variant="default | pills | underline"
/>
```

### VerticalTabs
```tsx
<VerticalTabs tabs={[...]} />
```

---

## 🪗 Accordion

### Variants
```tsx
<AccordionItem variant="default | bordered | ghost | card">
  <AccordionTrigger icon="chevron | plus | arrow" iconPosition="left | right">
    Título
  </AccordionTrigger>
  <AccordionContent>Conteúdo</AccordionContent>
</AccordionItem>
```

### FAQAccordion
```tsx
<FAQAccordion
  items={[{ question: "?", answer: "..." }]}
  variant="bordered"
/>
```

### NestedAccordion
```tsx
<NestedAccordion
  items={[{ id: "1", title: "Item", children: [...] }]}
/>
```

---

## 🔍 Command Palette

### Spotlight
```tsx
<Spotlight
  open={open}
  onOpenChange={setOpen}
  actions={[
    { id: "1", label: "Ação", icon: <Icon />, shortcut: ["⌘", "K"], onSelect: () => {} },
  ]}
  placeholder="Buscar..."
/>
```

### useCommandMenu Hook
```tsx
const { open, setOpen } = useCommandMenu(); // Atalho ⌘K automático
```

---

## 🛡️ Error Handling

### ErrorBoundary
```tsx
<ErrorBoundary fallback={<Fallback />} onError={(error) => log(error)} showDetails>
  <Component />
</ErrorBoundary>
```

### ErrorFallback
```tsx
<ErrorFallback
  error={error}
  onReset={() => retry()}
  variant="full | inline | minimal"
  showDetails
/>
```

### AsyncBoundary
```tsx
<AsyncBoundary loading={<Loader />} error={<Error />}>
  <AsyncComponent />
</AsyncBoundary>
```

---

## ⏸️ Suspense Wrappers

### SuspenseWrapper
```tsx
<SuspenseWrapper fallback={<Loader />} minHeight={200}>
  <LazyComponent />
</SuspenseWrapper>
```

### SkeletonTransition
```tsx
<SkeletonTransition isLoading={loading} skeleton={<Skeleton />}>
  <Content />
</SkeletonTransition>
```

### RetryWrapper
```tsx
<RetryWrapper maxRetries={3} retryDelay={1000} onMaxRetriesReached={() => {}}>
  <UnstableComponent />
</RetryWrapper>
```

---

## 📁 File Upload

```tsx
<FileUpload
  accept={{ "image/*": [".png", ".jpg"] }}
  maxSize={5 * 1024 * 1024}
  multiple
  onUpload={(files) => handleUpload(files)}
  preview
/>

<Dropzone variant="default | compact | minimal">
  Arraste arquivos aqui
</Dropzone>
```

---

## 🎨 Animações Disponíveis

- `animate-fade-in` / `animate-fade-out`
- `animate-scale-in` / `animate-scale-out`
- `animate-slide-in-right` / `animate-slide-out-right`
- `animate-accordion-down` / `animate-accordion-up`
- `hover-scale`
- `story-link` (underline animado)

---

## 💡 Dicas de Uso

1. **Use tokens semânticos**: Sempre use cores do design system (`text-foreground`, `bg-primary`, etc.)
2. **Importe apenas o necessário**: Todos os componentes são tree-shakable
3. **Combine componentes**: Ex: `InteractiveCard` + `StatsCard` para dashboards
4. **Dark mode**: Todos os componentes suportam dark mode automaticamente
5. **Animações**: Use `framer-motion` para animações personalizadas

---

## 📚 Exemplos Completos

Acesse `/showcase` para ver todos os componentes em ação!
