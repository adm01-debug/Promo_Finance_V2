# Integração n8n — Triagem, Tarefas e Roteamento por Score

## Endpoints

- **Dispatch (backend → n8n)**: `POST /functions/v1/n8n-dispatch`
  ```json
  { "event_type": "driver_approval", "risk_score": 82, "entity_id": "uuid", "payload": { "driver_id": "..." } }
  ```
  Busca todas as configs habilitadas em `n8n_workflow_configs` cujo `event_type` bata e `min/max_risk_score` cubram o score, aplica `filters`, envia POST ao `webhook_url` com retry/timeout e loga em `n8n_dispatch_logs`.

- **Callback (n8n → backend)**: `POST /functions/v1/n8n-callback`
  Header opcional: `x-n8n-secret: <N8N_CALLBACK_SECRET>`
  Ações: `create_task`, `update_driver_approval`, `create_alert`, `log`.

## Cadastro de workflow

```sql
INSERT INTO n8n_workflow_configs (name, event_type, webhook_url, min_risk_score, max_risk_score, filters)
VALUES ('Triagem risco alto', 'driver_approval', 'https://n8n.exemplo/webhook/xyz', 70, 100, '{}');
```

## Templates de workflow (importar no n8n)

### 1. Triagem de eventos
`Webhook` → `Switch` (por `event_type`) → ramifica para Slack/Email/Task.

### 2. Criação de tarefas (risco médio)
`Webhook (min=40,max=69)` → `HTTP Request` → callback `create_task`:
```json
{ "action": "create_task", "payload": { "title": "Revisar motorista", "description": "Score {{ $json.risk_score }}", "driver_id": "{{ $json.entity_id }}" } }
```

### 3. Disparo condicional (risco alto ≥ 70)
`Webhook` → `IF risk_score >= 70` → paralelo: Slack urgente + Bitrix24 task + callback `create_alert`.

## Chamada a partir do código

```ts
await supabase.functions.invoke("n8n-dispatch", {
  body: { event_type: "driver_approval", risk_score: driver.risk_score, entity_id: driver.id, payload: driver }
});
```
