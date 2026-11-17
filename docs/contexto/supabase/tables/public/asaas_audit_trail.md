# public.asaas_audit_trail

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `asaas_payment_id` | `uuid` | sim |  |  |  |
| 3 | `action` | `text` | sim |  |  |  |
| 4 | `actor` | `uuid` | sim |  |  |  |
| 5 | `details` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `new_status` | `text` | sim |  |  |  |
| 8 | `previous_status` | `text` | sim |  |  |  |
| 9 | `user_id` | `uuid` | sim | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_audit_trail_asaas_payment_id_fkey | FOREIGN KEY | `FOREIGN KEY (asaas_payment_id) REFERENCES asaas_payments(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_audit_trail_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| asaas_audit_trail_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_audit_trail_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_audit_trail_pkey ON public.asaas_audit_trail USING btree (id)` |
| idx_asaas_audit_trail_asaas_payment_id_fk | btree | asaas_payment_id | não | sim |  | `CREATE INDEX idx_asaas_audit_trail_asaas_payment_id_fk ON public.asaas_audit_trail USING btree (asaas_payment_id)` |


## Policies (RLS)

### `Users can view audit trail of their company`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((asaas_payment_id IN ( SELECT p.id    FROM asaas_payments p   WHERE empresa_acessivel(p.empresa_id))) OR ((asaas_payment_id IS NULL) AND (actor = auth.uid())))` |
| WITH CHECK |  |

### `asaas_audit_admin_all`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND ((asaas_payment_id IN ( SELECT p.id    FROM asaas_payments p   WHERE empresa_acessivel(p.empresa_id))) OR (asaas_payment_id IS NULL)))` |
| WITH CHECK |  |

### `asaas_audit_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND (EXISTS ( SELECT 1    FROM asaas_payments p   WHERE ((p.id = asaas_audit_trail.asaas_payment_id) AND empresa_acessivel(p.empresa_id)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
