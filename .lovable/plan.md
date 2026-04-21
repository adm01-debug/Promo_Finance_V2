

## Plano — Sincronizar revisões de anomalia ao Bitrix24

Ações **Confirmar**, **Falso positivo** e **Salvar parecer** (+ **Reabrir**) vão criar/atualizar uma **Tarefa** no Bitrix24 representando aquela anomalia. Reaproveita o padrão de `enviar-bitrix24-tributario` e os secrets já configurados (`BITRIX24_DOMAIN`, `BITRIX24_ACCESS_TOKEN`).

### 1. Banco — coluna para o ID da tarefa Bitrix

Migration mínima:

```sql
ALTER TABLE public.anomalias_detectadas
  ADD COLUMN IF NOT EXISTS bitrix_task_id text;
```

Sem mudança de RLS — políticas atuais cobrem a coluna nova.

### 2. Edge function nova — `sincronizar-anomalia-bitrix24`

`supabase/functions/sincronizar-anomalia-bitrix24/index.ts`:

- CORS + valida JWT + lê `{ anomaliaId, evento: "confirmada" | "falso_positivo" | "parecer" | "reaberta" }`.
- Carrega a anomalia (`SELECT *`) para pegar `bitrix_task_id`, severidade, tipo, descrição, observações, entidade.
- Monta título `[Anomalia] {tipo_label} — {severidade}` e DESCRIPTION em BBCode com resumo, parecer atual, evento e link de drill-down `/admin/insights-ia/anomalia/{id}`.
- Mapeia: severidade → `PRIORITY` (0/1/2); status → `STATUS` Bitrix (`confirmada`/`falso_positivo` → 5 fechado; `reaberta`/`parecer` → 2 pendente).
- Se já existe `bitrix_task_id` → `tasks.task.update`. Senão → `tasks.task.add` e grava o `taskId` em `anomalias_detectadas`.
- Sempre adiciona `task.commentitem.add` com o evento + parecer (timeline auditável dentro do Bitrix).
- Reusa o helper `bitrixCall` (retry exponencial em 429/5xx).
- Sem secrets configurados → `200 { skipped: true, reason: "Bitrix24 não configurado" }` (não quebra a UX).
- Resposta de sucesso: `{ success: true, taskId, taskUrl, action: "created" | "updated" }`.

### 3. Hook cliente — `useSincronizarAnomaliaBitrix`

`src/hooks/useSincronizarAnomaliaBitrix.ts` — wrapper de `supabase.functions.invoke("sincronizar-anomalia-bitrix24", ...)`. Toast só em erro real ou na primeira vez por sessão quando vier `skipped` (flag em `sessionStorage`).

### 4. Pontos de UI que disparam a sync

Cada local chama o hook **depois** da operação local, sem bloquear; falha do Bitrix nunca derruba o salvamento principal:

- **`AnomaliaHeader.tsx`** — após Confirmar e após Falso positivo.
- **`AcoesSugeridasCard.tsx`** — após Salvar parecer (`evento: "parecer"`).
- **`AnomaliasReviewQueue.tsx`** — após cada `revisar.mutateAsync` (mesmos eventos).
- **`AnomaliasDetectadasPanel.tsx`** — botões inline de Confirmar e Falso +.
- **`ReabrirAnomaliaDialog.tsx`** — após `reabrir.mutateAsync` (`evento: "reaberta"`).

### 5. Indicador no card

`EntidadeRelacionadaCard` ganha um `Badge` "Bitrix24 #{taskId}" quando `anomalia.bitrix_task_id` existe. Link clicável só após a primeira sync da sessão (o `taskUrl` retornado vai para o cache do React Query); nas demais cargas de página exibimos só o badge textual, já que `BITRIX24_DOMAIN` é secret e não chega ao frontend.

### Fora de escopo

- Sync inversa (Bitrix → anomalia) via webhook — fica para iteração futura usando o `bitrix24-webhook` existente.
- `RESPONSIBLE_ID` configurável: por ora a tarefa fica com o dono do token Bitrix.
- Anexos/PDF.
- Feature flag por empresa para desligar a integração — quem não tem secrets já fica em modo `skipped`.

### Detalhes técnicos

- Helper `bitrixCall` é copiado (não extraído para `_shared/`) para manter o passo simples — mesmo padrão de `enviar-bitrix24-tributario`.
- `tasks.task.add` recebe `fields: { TITLE, DESCRIPTION, PRIORITY, TAGS: ["lovable-anomalia", tipo, severidade] }`.
- `task.commentitem.add` usa formato posicional `[task_id, { POST_MESSAGE: "..." }]` (peculiaridade da API Bitrix).
- Auditoria local: cada disparo grava `useLogAudit({ action: "UPDATE", details: "BITRIX24_SYNC: evento=..." })`.
- Sem conflito com `bitrix24-sync` existente, que só cuida de clientes/deals.

