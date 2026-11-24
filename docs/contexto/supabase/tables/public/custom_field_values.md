# public.custom_field_values

> Dicionário estrutural de public.custom_field_values (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (definition_id, entity_id); FOREIGN KEY (definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.custom_field_values. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `definition_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna definition_id em public.custom_field_values. Papel funcional indicado pelo identificador: definition_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (definition_id, entity_id); FOREIGN KEY (definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `entity_id` | `uuid` | não |  |  | Dicionário estrutural da coluna entity_id em public.custom_field_values. Papel funcional indicado pelo identificador: entity_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (definition_id, entity_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `field_value` | `text` | sim |  |  | Dicionário estrutural da coluna field_value em public.custom_field_values. Papel funcional indicado pelo identificador: field_value; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.custom_field_values. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.custom_field_values. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


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
