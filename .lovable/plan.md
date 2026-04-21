

## Plano — Execução de detecção com fila/lock e progresso em tempo real

Hoje, o botão **"Detectar agora"** em `AnomaliasDetectadasPanel` apenas chama `supabase.functions.invoke('detectar-anomalias-financeiras')` e mostra um toast no fim. Problemas:

- **Sem lock**: dois admins clicando ao mesmo tempo (ou colisão com o cron */30min) disparam 2 execuções concorrentes, cada uma percorrendo até 7.500 registros e fazendo 5× `select... maybeSingle()` por candidata → desperdício de invocações + risco de inserir duplicatas que escapam do anti-dedupe de 24h.
- **Sem progresso**: a edge roda 5 detectores em série; o usuário fica olhando um spinner por 10–60s sem saber em que estágio está nem quantas anomalias já foram encontradas.
- **Sem histórico**: não há registro de quem disparou, quanto tempo levou, quantas foram inseridas — só o toast efêmero.

Este plano resolve as três pontas com uma tabela de execuções, lock advisório no Postgres e Realtime para empurrar progresso ao painel.

### Mudanças

**1. Nova tabela `anomalia_detection_runs`** (migration)

Colunas:
- `id uuid pk default gen_random_uuid()`
- `triggered_by uuid` (auth.uid() — null para cron)
- `trigger_source text` (`'manual' | 'cron'`, default `'manual'`)
- `status text` (`'queued' | 'running' | 'completed' | 'failed' | 'cancelled'`, default `'queued'`)
- `current_step text` (ex: `'detector_outlier'`, `'detector_duplicado'`, `'persistindo'`)
- `step_index int default 0`, `total_steps int default 5`
- `candidatas int default 0`, `inseridas int default 0`
- `started_at timestamptz`, `finished_at timestamptz`, `duration_ms int`
- `error_message text`
- `created_at timestamptz default now()`

RLS: admin-only para SELECT/INSERT/UPDATE (mesma policy do `anomalias_detectadas`). Realtime habilitado via `ALTER PUBLICATION supabase_realtime ADD TABLE`.

**2. Lock cooperativo na edge `detectar-anomalias-financeiras`**

No início da função, antes de qualquer detector:
- `SELECT pg_try_advisory_lock(hashtext('detectar-anomalias-financeiras'))`. Se retornar `false` → responder `409 { ok:false, reason:'already_running', current_run_id }` (busca o `runs` com `status in ('queued','running')` mais recente).
- Se a função já foi chamada com `body.run_id`, atualiza esse registro; senão, INSERT de um novo `runs` row com `status='running'`, `started_at=now()`, `trigger_source` derivado do header `x-trigger-source` (cron envia `'cron'`).
- Entre cada um dos 5 detectores, faz `UPDATE anomalia_detection_runs SET current_step=..., step_index=..., candidatas=running_total WHERE id=run_id`. Realtime propaga.
- No `finally`: `pg_advisory_unlock(...)` + `UPDATE` final com `status`, `inseridas`, `duration_ms`, `finished_at`.
- Em catch: `status='failed'`, `error_message=e.message`.

**3. Hook `useAnomaliaDetectionRun`** (`src/hooks/useAnomaliaDetectionRun.ts`)

- `useQuery(['anomalia-runs','active'])`: busca o run com status in (`queued`,`running`) — staleTime curto.
- `useEffect` com canal Realtime `anomalia_detection_runs` (filtro `status=in.(running,completed,failed)`) → invalida a query e, no `completed`, invalida `['anomalias-detectadas']` para refletir as novas anomalias.
- `disparar()` mutation: cria a row `queued` via insert e invoca a edge passando `run_id`. Se a edge responder `409 already_running`, exibe toast informativo apontando para o run em curso (sem erro).
- Retorna: `{ activeRun, disparar, isPending }`.

**4. Componente `DetectionRunProgress`** (`src/components/admin/DetectionRunProgress.tsx`)

- Mostra apenas quando `activeRun` existe.
- `<Progress value={(step_index/total_steps)*100} />` da shadcn.
- Linha de status: "Etapa X/5 — {label do current_step} · {candidatas} candidatas · {elapsed}s".
- Labels amigáveis para cada `current_step` (mapa pt-BR).
- Acessível: `aria-live="polite"`, `role="status"`.

**5. Atualização de `AnomaliasDetectadasPanel.tsx`**

- Substitui `detectar` (do hook antigo) por `useAnomaliaDetectionRun`.
- Botão "Detectar agora": `disabled={!!activeRun || isPending}`. Quando há `activeRun`, label vira "Detecção em andamento…" com spinner.
- Renderiza `<DetectionRunProgress />` logo abaixo do header da Card, antes da lista.
- Mantém o toast antigo de "X novas anomalias" — agora disparado pelo Realtime quando `status` transita para `completed`.

**6. Atualização do cron (apenas documentação)**

O cron job que invoca a edge a cada 30min passa a também respeitar o lock (a função em si recusa). Sem mudança de schedule. Adicionar header `x-trigger-source: cron` no `net.http_post` via SQL update do cron job (instrução manual no card de mudanças).

### Arquitetura

```text
[Admin clica "Detectar agora"]
        │
        ▼
useAnomaliaDetectionRun.disparar()
   ├─ INSERT runs (status='queued', triggered_by=auth.uid())
   └─ supabase.functions.invoke('detectar-anomalias-financeiras', { body:{run_id} })
        │
        ▼
edge: pg_try_advisory_lock
   ├─ false → 409 { current_run_id }  ──▶ toast "já em execução"
   └─ true  → UPDATE status='running'
              ├─ Detector 1 → UPDATE step_index=1, current_step, candidatas+=N
              │      │
              │      ▼ Realtime
              │   useAnomaliaDetectionRun ◀──┐
              │      │                       │
              │      ▼                       │
              │   <DetectionRunProgress />   │
              ├─ Detector 2..5  ─────────────┘
              └─ UPDATE status='completed', inseridas, duration_ms
                     │
                     ▼ Realtime → invalidate ['anomalias-detectadas']
```

### Detalhes técnicos

- **Lock**: `pg_try_advisory_lock(bigint)` é não-bloqueante e auto-libera ao fim da sessão Postgres da edge — duplo seguro além do `finally`.
- **Sem race no INSERT do run**: se dois clicks paralelos criam dois `queued`, o segundo vê `409` da edge e o registro `queued` órfão é varrido por `UPDATE ... WHERE status='queued' AND created_at < now()-interval '5min' SET status='cancelled'` no início de cada nova execução (limpeza barata).
- **RLS**: nova tabela usa `has_role(auth.uid(),'admin')` (padrão já existente no projeto).
- **Realtime**: a tabela é admin-only por RLS, então o canal só entrega eventos para sessões admin — sem vazamento.
- **`useAnomaliasDetectadas`**: mantém o método `detectar` legado por compatibilidade, mas o painel passa a usar o novo hook.
- **Não-quebrante**: cron continua funcionando; se a coluna `run_id` não vier no body, a edge cria seu próprio run com `trigger_source='cron'`.

### Fora de escopo

- Cancelar uma execução em andamento (UI de "abortar") — o lock impede dano, mas matar a edge no meio exigiria SIGTERM handler.
- Histórico paginado de runs antigas (`/admin/system-health` aba dedicada) — fica para próxima iteração; por ora apenas o run ativo é exibido.
- Backpressure por empresa (cada admin de empresa diferente disparando o seu) — hoje a edge é global, então o lock global é o comportamento certo.
- Push notification (web-push) ao concluir — o toast + Realtime já cobre quem está na tela.

