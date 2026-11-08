# public.password_reset_requests

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
| 2 | `user_email` | `text` | não |  |  |  |
| 3 | `requested_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 4 | `status` | `text` | não | `'pending'::text` |  |  |
| 5 | `reviewed_by` | `uuid` | sim |  |  |  |
| 6 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `rejection_reason` | `text` | sim |  |  |  |
| 8 | `ip_address` | `inet` | sim |  |  |  |
| 9 | `user_agent` | `text` | sim |  |  |  |
| 10 | `expires_at` | `timestamp with time zone` | sim | `(now() + '24:00:00'::interval)` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `motivo_rejeicao` | `text` | sim |  |  |  |
| 13 | `solicitado_em` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `aprovado_por` | `uuid` | sim |  |  |  |
| 15 | `aprovado_em` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| password_reset_requests_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| password_reset_requests_reviewed_by_fkey | FOREIGN KEY | `FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| password_reset_requests_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_password_reset_requests_reviewed_by_fk | btree | reviewed_by | não | sim |  | `CREATE INDEX idx_password_reset_requests_reviewed_by_fk ON public.password_reset_requests USING btree (reviewed_by)` |
| password_reset_requests_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX password_reset_requests_pkey ON public.password_reset_requests USING btree (id)` |


## Policies (RLS)

### `Admins and managers can view reset requests`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Admins can update reset requests`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Users can request own password reset`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_email = (( SELECT users.email    FROM auth.users   WHERE (users.id = ( SELECT auth.uid() AS uid))))::text)` |


## Triggers

_nenhum_


## Grants

_nenhum_
