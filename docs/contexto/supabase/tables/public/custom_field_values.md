# public.custom_field_values

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
| 2 | `definition_id` | `uuid` | sim |  |  |  |
| 3 | `entity_id` | `uuid` | não |  |  |  |
| 4 | `field_value` | `text` | sim |  |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| custom_field_values_definition_id_entity_id_key | UNIQUE | `UNIQUE (definition_id, entity_id)` |  |  | sim |
| custom_field_values_definition_id_fkey | FOREIGN KEY | `FOREIGN KEY (definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| custom_field_values_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| custom_field_values_definition_id_entity_id_key | btree | definition_id, entity_id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_definition_id_entity_id_key ON public.custom_field_values USING btree (definition_id, entity_id)` |
| custom_field_values_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX custom_field_values_pkey ON public.custom_field_values USING btree (id)` |


## Policies (RLS)

### `Custom field values scoped by definition empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM custom_field_definitions d   WHERE ((d.id = custom_field_values.definition_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM custom_field_definitions d   WHERE ((d.id = custom_field_values.definition_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (d.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_fb9bfe686d34f4bee9a0 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
