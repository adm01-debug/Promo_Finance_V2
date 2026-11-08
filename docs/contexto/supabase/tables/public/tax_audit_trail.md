# public.tax_audit_trail

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `ano` | `integer` | sim |  |  |  |
| 5 | `mes` | `integer` | sim |  |  |  |
| 6 | `action` | `text` | não |  |  |  |
| 7 | `parameters` | `jsonb` | sim |  |  |  |
| 8 | `prompt` | `text` | sim |  |  |  |
| 9 | `response` | `text` | sim |  |  |  |
| 10 | `is_ai_justified` | `boolean` | não | `false` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tax_audit_trail_action_check | CHECK | `CHECK (action = ANY (ARRAY['simulated'::text, 'cache_hit'::text, 'decided'::text, 'exported'::text]))` |  |  | sim |
| tax_audit_trail_ano_check | CHECK | `CHECK (ano >= 2000 AND ano <= 2100)` |  |  | sim |
| tax_audit_trail_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| tax_audit_trail_mes_check | CHECK | `CHECK (mes >= 1 AND mes <= 12)` |  |  | sim |
| tax_audit_trail_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tax_audit_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_tax_audit_empresa ON public.tax_audit_trail USING btree (empresa_id, created_at DESC)` |
| tax_audit_trail_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tax_audit_trail_pkey ON public.tax_audit_trail USING btree (id)` |


## Policies (RLS)

### `tax_audit_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
