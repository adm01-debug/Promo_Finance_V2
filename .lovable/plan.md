

## Plano — Realtime para anomalias críticas + drill-down inline

Hoje quem está em `/admin/system-health` (aba **Anomalias**) ou `/admin/insights-ia` só descobre uma nova anomalia ao recarregar (refetch 60s). E o "drill-down" exige sair da tela navegando para `/admin/insights-ia/anomalia/{id}`. Este plano resolve as duas pontas: **push em tempo real** quando uma anomalia `critica`/`alta` é inserida, e **drawer lateral** com o drill-down sem perder o contexto da fila.

### Mudanças

**1. Habilitar realtime na tabela** (migração)
```sql
ALTER TABLE public.anomalias_detectadas REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.anomalias_detectadas;
```

**2. Novo hook `useRealtimeAnomalias.ts`** (`src/hooks/`)
- Subscribe em `postgres_changes` INSERT em `anomalias_detectadas`.
- Filtro client-side: apenas `severidade in ('critica','alta')` dispara toast.
- Para cada nova anomalia:
  - Invalida `["anomalias-detectadas"]` e `["anomalias-detectadas","pending-queue"]`.
  - Toast `error` (crítica) ou `warning` (alta), `duration: 12000`, com 2 ações:
    - **"Drill-down"** → `window.dispatchEvent(new CustomEvent('open-anomalia-drawer', { detail: { id } }))`.
    - **"Abrir página"** → navega para `/admin/insights-ia/anomalia/{id}`.
- Anti-spam: `Set` ref dedupando por id (Realtime ocasionalmente reentrega).
- Cleanup do canal no unmount; só faz subscribe se `isAdmin`.

**3. Wiring global em `SidebarNavGroups.tsx`**
- Adicionar `useRealtimeAnomalias()` ao lado de `useRealtimeAlertas()` para que toasts apareçam em qualquer rota admin.

**4. Novo componente `AnomaliaDrillDownDrawer.tsx`** (`src/components/admin/`)
- Usa `<Sheet>` (shadcn) lado direito, `sm:max-w-2xl`.
- Listener global `open-anomalia-drawer` no mount — qualquer parte da app pode abrir.
- Conteúdo: monta `useAnomaliaDetalhe(id)` (já existe) e renderiza versão compacta dos cards do `/admin/insights-ia/anomalia/[id]`:
  - `AnomaliaHeader`
  - `EntidadeRelacionadaCard` com botão **"Abrir transação completa"** que faz deep-link para a entidade real (mapeamento por `entidade_tipo`).
  - `AcoesSugeridasCard` (Confirmar / Falso positivo direto do drawer, reusando `useRevisarAnomalia`).
- Footer: **"Abrir página completa"** (`/admin/insights-ia/anomalia/{id}`) e **"Fechar"**.
- Skeleton durante load; mensagem caso anomalia removida.

**5. Integração inline em `AnomaliasDetectadasPanel.tsx`**
- Cada linha ganha botão `<Button variant="ghost" size="sm">Drill-down</Button>` que dispara o evento (sem `<Link>`, preserva filtro/scroll).
- Mantém o link `Microscope` original como atalho discreto "Abrir em nova aba".
- `<AnomaliaDrillDownDrawer />` montado uma vez no fim do painel.

### Detalhes técnicos

- **Permissões realtime**: `anomalias_detectadas` já tem RLS admin-only — payloads só chegam para admins. `REPLICA IDENTITY FULL` é necessário para o INSERT entregar a linha completa.
- **Deep link da transação** (util `lib/anomalia-routes.ts`):
  - `movimentacao` → `/movimentacoes?highlight={id}`
  - `conta_pagar` → `/contas-pagar?highlight={id}`
  - `transacao_bancaria` → `/conciliacao?txId={id}`
  - `regime_decision_cache` → `/admin/insights-ia/anomalia/{id}` (sem entidade direta)
- **Filtro server-side** por severidade no Realtime do Supabase não suporta enums confiavelmente; ficamos no client (volume baixo).
- **A11y**: toast já é `aria-live="assertive"`; Sheet fecha com `Esc`.
- **Sem conflito com `useRealtimeAlertas`**: canais distintos.

### Fora de escopo

- Push notification de SO (web-push) — pode ser plugado depois reutilizando `send-push-notification`.
- Marcar como "vista" automaticamente ao abrir drawer (mantém `status='nova'` para a fila de revisão).
- Filtro configurável de quais severidades disparam toast (hard-coded `critica`/`alta`).

