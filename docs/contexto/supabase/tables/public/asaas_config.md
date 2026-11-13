# public.asaas_config

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 8 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `api_key_encrypted` | `text` | sim |  |  |  |
| 4 | `ambiente` | `text` | sim | `'sandbox'::text` |  |  |
| 5 | `webhook_secret` | `text` | sim |  |  |  |
| 6 | `ativo` | `boolean` | sim | `true` |  |  |
| 7 | `configuracoes` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_config_empresa_id_key | UNIQUE | `UNIQUE (empresa_id)` |  |  | sim |
| asaas_config_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_config_empresa_id_key | btree | empresa_id | sim | sim |  | `CREATE UNIQUE INDEX asaas_config_empresa_id_key ON public.asaas_config USING btree (empresa_id)` |
| asaas_config_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_config_pkey ON public.asaas_config USING btree (id)` |


## Policies (RLS)

### `Users can insert their own company asaas config`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `Users can update their own company asaas config`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `Users can view their own company asaas config`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `asaas_config_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = asaas_config.empresa_id) AND (ue.ativo = true) AND (ue.role = 'admin'::app_role)))))` |
| WITH CHECK |  |

### `asaas_config_insert_admin`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = asaas_config.empresa_id) AND (ue.ativo = true) AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role]))))))` |

### `asaas_config_select_financeiro`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = asaas_config.empresa_id) AND (ue.ativo = true) AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role, 'contador'::app_role]))))))` |
| WITH CHECK |  |

### `asaas_config_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |

### `asaas_config_update_admin`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = asaas_config.empresa_id) AND (ue.ativo = true) AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role]))))))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = asaas_config.empresa_id) AND (ue.ativo = true) AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role]))))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_c9b96759e48801387f71 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
