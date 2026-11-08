# public.custom_field_definitions

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `name` | `text` | não |  |  |  |
| 5 | `label` | `text` | não |  |  |  |
| 6 | `field_type` | `text` | não | `'text'::text` |  |  |
| 7 | `placeholder` | `text` | sim |  |  |  |
| 8 | `options` | `jsonb` | sim |  |  |  |
| 9 | `required` | `boolean` | sim | `false` |  |  |
| 10 | `active` | `boolean` | sim | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_field_definitions_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| custom_field_definitions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.custom_field_values | custom_field_values_definition_id_fkey | definition_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_field_definitions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_definitions_pkey ON public.custom_field_definitions USING btree (id)` |


## Policies (RLS)

### `Custom field definitions scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_0c7ce82e1f5cca97d953 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
