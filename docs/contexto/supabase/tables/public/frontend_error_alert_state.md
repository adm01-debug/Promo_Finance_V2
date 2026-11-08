# public.frontend_error_alert_state

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `signature` | `text` | não |  |  |  |
| 3 | `first_seen` | `timestamp with time zone` | sim |  |  |  |
| 4 | `last_seen` | `timestamp with time zone` | sim |  |  |  |
| 5 | `count` | `integer` | sim | `1` |  |  |
| 6 | `alerted` | `boolean` | sim | `false` |  |  |
| 7 | `silenced_until` | `timestamp with time zone` | sim |  |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `assinatura` | `text` | não |  |  |  |
| 10 | `severity` | `text` | não | `'error'::text` |  |  |
| 11 | `exemplo_mensagem` | `text` | sim |  |  |  |
| 12 | `primeiro_alerta_em` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `ultimo_alerta_em` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `ocorrencias_no_ultimo_alerta` | `integer` | não | `0` |  |  |
| 15 | `alertas_enviados` | `integer` | não | `0` |  |  |
| 16 | `silenciado_ate` | `timestamp with time zone` | sim |  |  |  |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fe_alert_state_bounds_chk | CHECK | `CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0)` |  |  | sim |
| fe_alert_state_severity_chk | CHECK | `CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| frontend_error_alert_state_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| frontend_error_alert_state_signature_key | UNIQUE | `UNIQUE (signature)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_alert_state_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_alert_state_pkey ON public.frontend_error_alert_state USING btree (id)` |
| frontend_error_alert_state_signature_key | btree | signature | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_alert_state_signature_key ON public.frontend_error_alert_state USING btree (signature)` |
| uq_frontend_error_alert_state_assinatura | btree | assinatura | sim | sim |  | `CREATE UNIQUE INDEX uq_frontend_error_alert_state_assinatura ON public.frontend_error_alert_state USING btree (assinatura)` |


## Policies (RLS)

### `fe_alert_state_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_fe_alert_state_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
