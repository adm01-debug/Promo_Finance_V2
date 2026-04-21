

## Plano — Preferências de alerta para anomalias críticas (silenciar por usuário e por centro de custo)

Hoje, `useRealtimeAnomalias` já dispara toast no canto inferior para **toda** anomalia `critica`/`alta` que entra na tabela `anomalias_detectadas`, para **todos** os admins logados, sem nenhuma forma de calar. Falta também um **badge** persistente no sidebar mostrando quantas críticas estão `nova`/`investigando`. Este plano adiciona as duas pontas.

### O que muda

**1. Tabela `user_anomalia_preferences`** (nova migration)

Por usuário:
- `id uuid pk default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `toast_enabled bool default true` — liga/desliga toast global
- `toast_min_severidade text default 'critica'` — `critica` | `alta` | `media`
- `silenciar_ate timestamptz` — soneca temporária (snooze 1h/8h/24h)
- `centros_custo_silenciados uuid[] default '{}'` — IDs de `centros_custo` cujas anomalias NÃO disparam toast nem entram no badge
- `tipos_silenciados text[] default '{}'` — opcional, ex: `['conciliacao_atrasada']`
- `created_at`, `updated_at` (trigger `update_updated_at`)
- Unique(`user_id`)

RLS: cada usuário só lê/escreve seu próprio registro (`user_id = auth.uid()`).

**2. Resolver centro de custo da anomalia (server-side)**

Anomalia hoje só guarda `entidade_tipo` + `entidade_id`. Para filtrar por CC, precisamos do CC associado.

- Adicionar coluna `centro_custo_id uuid` em `anomalias_detectadas` (nullable, sem FK rígida — entidade pode ser de domínio sem CC, como `transacao_bancaria`).
- Na edge `detectar-anomalias-financeiras`, ao montar cada `AnomaliaInsert`:
  - Para `entidade_tipo='conta_pagar'`: já lemos `contas_pagar`; passar a selecionar também `centro_custo_id` e popular o campo.
  - Para `entidade_tipo='movimentacao'`: passar a selecionar `centro_custo_id` da `movimentacoes`.
  - Demais (`transacao_bancaria`, `regime_decision_cache`): `null` → não silenciável por CC.
- Backfill simples na migration: `UPDATE anomalias_detectadas a SET centro_custo_id = cp.centro_custo_id FROM contas_pagar cp WHERE a.entidade_tipo='conta_pagar' AND a.entidade_id::uuid = cp.id;` (idem para movimentações).

**3. Hook `useAnomaliaPreferences`** (novo, `src/hooks/useAnomaliaPreferences.ts`)

- `useQuery(['anomalia-preferences', user.id])` — busca/insere row default na primeira leitura (upsert).
- `update` mutation com optimistic update.
- Helper puro `shouldNotify(pref, anomalia): boolean` que consolida:
  - `toast_enabled` ligado
  - `silenciar_ate` no passado (ou null)
  - Severidade ≥ `toast_min_severidade` (rank crítica>alta>media>baixa)
  - `anomalia.centro_custo_id` ∉ `centros_custo_silenciados`
  - `anomalia.tipo_anomalia` ∉ `tipos_silenciados`

**4. `useRealtimeAnomalias` — aplicar preferências**

- Buscar `preferences` no início (via `useAnomaliaPreferences`).
- Antes de chamar `toast.error/warning`, rodar `shouldNotify(prefs, payload.new)`. Se `false` → só invalida queries (badge atualiza), pula o toast.
- Mantém todo o resto (drawer, deduplicação `seenIds`).

**5. Hook + Badge `useAnomaliasCriticasCount`** (novo)

- `useQuery(['anomalias-criticas-count'])`: `count(*)` em `anomalias_detectadas` com `severidade in ('critica','alta')` e `status in ('nova','investigando')`, **respeitando** `centros_custo_silenciados` e `tipos_silenciados` da preferência (filtro client-side sobre uma busca pequena, já limitada a 200 nesta área).
- Realtime já invalida via `useRealtimeAnomalias`.
- Badge vermelho ao lado do item "System Health" (ou "Insights IA") na sidebar — reusa o padrão de `useAlertasTributariosCount` que já mostra contagem.

**6. UI de preferências — `AnomaliaPreferencesDialog`**

Componente novo aberto a partir de:
- Botão "⚙ Preferências de alerta" no header de `AnomaliasDetectadasPanel.tsx` (ao lado de "Detectar agora").
- Item "Silenciar alertas…" no menu do toast (ação adicional via `cancel`/`action` extra — sonner suporta).

Conteúdo do diálogo:
- Switch "Receber toasts de novas anomalias" (`toast_enabled`).
- Select "Severidade mínima" (Crítica / Alta / Média).
- Botões rápidos "Silenciar por 1h / 8h / 24h" → grava `silenciar_ate = now() + Xh`. Status "Silenciado até HH:mm" + botão "Reativar agora".
- MultiSelect "Centros de custo silenciados" (carrega de `centros_custo` ativos) — chips removíveis.
- MultiSelect "Tipos de anomalia silenciados" (5 tipos do enum existente).
- Botão "Salvar" (mutation upsert).

Acessibilidade: `Dialog` shadcn já tem `Esc`, focus trap, `aria-labelledby`.

### Arquitetura de fluxo

```text
INSERT anomalias_detectadas (com centro_custo_id resolvido pela edge)
        │
        ▼ Realtime postgres_changes
useRealtimeAnomalias
   ├─ invalida ['anomalias-detectadas'] e ['anomalias-criticas-count']  ──▶ Badge sidebar
   │       (badge respeita silêncios via shouldNotify aplicado na contagem)
   └─ shouldNotify(prefs, anomalia)?
        ├─ false → fim (silencioso)
        └─ true  → toast.error/warning com Drill-down + "Silenciar alertas"
```

### Detalhes técnicos

- Severidades em rank: `{critica:0, alta:1, media:2, baixa:3}` — `toast_min_severidade='alta'` notifica `critica` e `alta`.
- `silenciar_ate` é simples e expira sozinho (sem cron) — comparação no client.
- Preferências são por usuário; outro admin com preferências diferentes recebe normalmente.
- Sem nova permissão necessária (RLS já restringe a tabela `anomalias_detectadas` a admins; preferências têm RLS própria).
- Backfill da coluna `centro_custo_id` em anomalias antigas é best-effort; novas já vêm preenchidas.
- Badge usa o mesmo padrão visual de `useAlertasTributariosCount` para consistência.

### Fora de escopo

- Preferências por **empresa** (RBAC multi-empresa) — só `centro_custo` e `tipo` nesta iteração.
- Push notification do SO obedecendo as preferências (a edge `send-push-notification` ainda dispara para todos os admins) — fica para próxima iteração.
- Página dedicada `/configuracoes/alertas` com agrupamento por canal (toast/push/email) — por ora um único diálogo cobre o caso.
- Auditar quem silenciou o quê (não há requisito).

