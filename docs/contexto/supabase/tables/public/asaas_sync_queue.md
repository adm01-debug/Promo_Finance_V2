# public.asaas_sync_queue

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `asaas_payment_id` | `uuid` | sim |  |  |  |
| 3 | `attempts` | `integer` | sim | `0` |  |  |
| 4 | `status` | `text` | sim | `'pending'::text` |  |  |
| 5 | `last_error` | `text` | sim |  |  |  |
| 6 | `next_retry_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `payload` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_sync_queue_asaas_payment_id_fkey | FOREIGN KEY | `FOREIGN KEY (asaas_payment_id) REFERENCES asaas_payments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_sync_queue_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_sync_queue_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_sync_queue_pkey ON public.asaas_sync_queue USING btree (id)` |
| idx_asaas_sync_queue_asaas_payment_id_fk | btree | asaas_payment_id | não | sim |  | `CREATE INDEX idx_asaas_sync_queue_asaas_payment_id_fk ON public.asaas_sync_queue USING btree (asaas_payment_id)` |


## Policies (RLS)

### `asaas_sync_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `asaas_sync_tenant_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM asaas_payments p   WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND empresa_acessivel(p.empresa_id)))))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM asaas_payments p   WHERE ((p.id = asaas_sync_queue.asaas_payment_id) AND empresa_acessivel(p.empresa_id)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_358c32867d1f3b611c3b | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
