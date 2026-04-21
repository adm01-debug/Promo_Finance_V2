

## Plano — Rota `/contabilidade` (verificação + ajuste menor)

### Diagnóstico

A rota `/contabilidade` **já está registrada e funcional** em `src/App.tsx`:

```tsx
// linha 81 — lazy import
const Contabilidade = lazy(() => import('./pages/Contabilidade'));

// linha 128 — rota protegida com RBAC
<Route 
  path="/contabilidade" 
  element={
    <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
      <Contabilidade />
    </ProtectedRoute>
  } 
/>
```

A página `src/pages/Contabilidade.tsx` existe e renderiza corretamente (tabs Plano / Lançamentos / Razão & Diário / DRE & Balanço / SPED ECD / SPED ECF).

Em produção a rota também funciona porque a Lovable hospeda como SPA com fallback automático para `index.html` em deep links — **não é preciso `_redirects`, `vercel.json` nem nada de hosting**.

### Único ajuste pendente

`src/components/providers/NavigationTracker.tsx` mapeia labels de rotas para o sistema de "itens recentes" mas **não tem entrada para `/contabilidade`**. Sem ela, a página existe e carrega, mas não aparece em "Recentes" / Command Palette.

### Mudança proposta

**`src/components/providers/NavigationTracker.tsx`** — adicionar uma linha no `routeLabels`:

```ts
'/contabilidade': 'Contabilidade & SPED',
```

(coloca junto com `/demonstrativos` para agrupar logicamente)

### Critério de pronto

1. `/contabilidade` continua acessível via deep link no preview e em produção (já está).
2. Acessar `/contabilidade` registra "Contabilidade & SPED" em itens recentes / Command Palette.
3. Sem regressão em nenhuma outra rota.

### Observação

Se você está vendo algum problema específico ao acessar `/contabilidade` (404 em produção, tela em branco, erro de carregamento do chunk lazy), me diga o sintoma exato — o código atual está correto, então qualquer falha seria em outro lugar (build, role do usuário não bate com `admin`/`financeiro`, ou cache de service worker servindo bundle antigo).

