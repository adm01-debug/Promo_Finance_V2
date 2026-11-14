# public.empresas_certificados

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `cnpj` | `text` | não |  |  |  |
| 4 | `razao_social` | `text` | sim |  |  |  |
| 5 | `valido_de` | `timestamp with time zone` | sim |  |  |  |
| 6 | `valido_ate` | `timestamp with time zone` | não |  |  |  |
| 7 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  |  |
| 8 | `uf` | `text` | não |  |  |  |
| 9 | `ativo` | `boolean` | não | `true` |  |  |
| 10 | `criado_por` | `uuid` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `pfx_storage_path` | `text` | não |  |  |  |
| 14 | `password_encrypted` | `bytea` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| empresas_certificados_criado_por_fkey | FOREIGN KEY | `FOREIGN KEY (criado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| empresas_certificados_empresa_id_cnpj_ambiente_key | UNIQUE | `UNIQUE (empresa_id, cnpj, ambiente)` |  |  | sim |
| empresas_certificados_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| empresas_certificados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| empresas_certificados_empresa_id_cnpj_ambiente_key | btree | empresa_id, cnpj, ambiente | sim | sim |  | `CREATE UNIQUE INDEX empresas_certificados_empresa_id_cnpj_ambiente_key ON public.empresas_certificados USING btree (empresa_id, cnpj, ambiente)` |
| empresas_certificados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX empresas_certificados_pkey ON public.empresas_certificados USING btree (id)` |
| idx_empresas_certificados_criado_por | btree | criado_por | não | sim | `(criado_por IS NOT NULL)` | `CREATE INDEX idx_empresas_certificados_criado_por ON public.empresas_certificados USING btree (criado_por) WHERE (criado_por IS NOT NULL)` |
| idx_empresas_certificados_criado_por_fk | btree | criado_por | não | sim |  | `CREATE INDEX idx_empresas_certificados_criado_por_fk ON public.empresas_certificados USING btree (criado_por)` |


## Policies (RLS)

### `cert_empresa_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = empresas_certificados.empresa_id))))` |
| WITH CHECK |  |

### `empresas_certificados_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_emp_cert_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
