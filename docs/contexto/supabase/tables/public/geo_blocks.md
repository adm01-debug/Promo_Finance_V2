# public.geo_blocks

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `country_code` | `text` | não |  |  |  |
| 3 | `country_name` | `text` | não |  |  |  |
| 4 | `is_blocked` | `boolean` | não | `true` |  |  |
| 5 | `block_type` | `text` | não | `'full'::text` |  |  |
| 6 | `reason` | `text` | sim |  |  |  |
| 7 | `blocked_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `expires_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_blocks_block_type_check | CHECK | `CHECK (block_type = ANY (ARRAY['full'::text, 'login_only'::text, 'registration_only'::text]))` |  |  | sim |
| geo_blocks_blocked_by_fkey | FOREIGN KEY | `FOREIGN KEY (blocked_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| geo_blocks_country_code_key | UNIQUE | `UNIQUE (country_code)` |  |  | sim |
| geo_blocks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_blocks_country_code_key | btree | country_code | sim | sim |  | `CREATE UNIQUE INDEX geo_blocks_country_code_key ON public.geo_blocks USING btree (country_code)` |
| geo_blocks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX geo_blocks_pkey ON public.geo_blocks USING btree (id)` |
| idx_geo_blocks_blocked_by_fk | btree | blocked_by | não | sim |  | `CREATE INDEX idx_geo_blocks_blocked_by_fk ON public.geo_blocks USING btree (blocked_by)` |


## Policies (RLS)

### `Admins can delete geo blocks`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert geo blocks`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `Admins can manage geo blocks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update geo blocks`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Managers can view geo blocks`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'manager'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_audit_geo_blocks | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |
| update_geo_blocks_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
