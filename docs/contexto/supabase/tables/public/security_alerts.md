# public.security_alerts

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `tipo` | `text` | não |  |  |  |
| 5 | `severidade` | `text` | não | `'MEDIA'::text` |  |  |
| 6 | `descricao` | `text` | sim |  |  |  |
| 7 | `detalhes` | `jsonb` | sim |  |  |  |
| 8 | `resolvido` | `boolean` | sim | `false` |  |  |
| 9 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `type` | `text` | não |  |  |  |
| 12 | `severity` | `text` | não | `'medium'::text` |  |  |
| 13 | `title` | `text` | não |  |  |  |
| 14 | `description` | `text` | sim |  |  |  |
| 15 | `ip_address` | `text` | sim |  |  |  |
| 16 | `user_email` | `text` | sim |  |  |  |
| 17 | `metadata` | `jsonb` | sim |  |  |  |
| 18 | `resolved` | `boolean` | não | `false` |  |  |
| 19 | `resolved_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| security_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| security_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_security_alerts_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_security_alerts_empresa_id ON public.security_alerts USING btree (empresa_id)` |
| security_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX security_alerts_pkey ON public.security_alerts USING btree (id)` |


## Policies (RLS)

### `security_alerts_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
