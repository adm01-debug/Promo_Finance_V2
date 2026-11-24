# public.sso_user_groups

> Dicionário estrutural de public.sso_user_groups (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (user_id, provider_id); PRIMARY KEY (id); FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE; UNIQUE (user_id, provider_id, group_name). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sso_user_groups. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.sso_user_groups. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (user_id, provider_id); UNIQUE (user_id, provider_id, group_name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `provider_id` | `uuid` | não |  |  | Dicionário estrutural da coluna provider_id em public.sso_user_groups. Papel funcional indicado pelo identificador: provider_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (user_id, provider_id); FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE; UNIQUE (user_id, provider_id, group_name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `group_name` | `text` | não |  |  | Dicionário estrutural da coluna group_name em public.sso_user_groups. Papel funcional indicado pelo identificador: group_name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (user_id, provider_id, group_name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `synced_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna synced_at em public.sso_user_groups. Papel funcional indicado pelo identificador: synced_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.sso_user_groups. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `groups` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna groups em public.sso_user_groups. Papel funcional indicado pelo identificador: groups; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `matched_group` | `text` | sim |  |  | Dicionário estrutural da coluna matched_group em public.sso_user_groups. Papel funcional indicado pelo identificador: matched_group; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `matched_role` | `app_role` | sim |  |  | Dicionário estrutural da coluna matched_role em public.sso_user_groups. Papel funcional indicado pelo identificador: matched_role; o catálogo não especifica significado adicional. Tipo: app_role. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: admin, manager, operator, viewer, financeiro, operacional, visualizador, contador. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `last_synced_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna last_synced_at em public.sso_user_groups. Papel funcional indicado pelo identificador: last_synced_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.sso_user_groups. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_user_group_unico | UNIQUE | `UNIQUE (user_id, provider_id)` |  |  | sim |
| sso_user_groups_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_user_groups_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sso_user_groups_user_id_provider_id_group_name_key | UNIQUE | `UNIQUE (user_id, provider_id, group_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sso_user_groups_provider_id_fk | btree | provider_id | não | sim |  | `CREATE INDEX idx_sso_user_groups_provider_id_fk ON public.sso_user_groups USING btree (provider_id)` |
| sso_user_group_unico | btree | user_id, provider_id | sim | sim |  | `CREATE UNIQUE INDEX sso_user_group_unico ON public.sso_user_groups USING btree (user_id, provider_id)` |
| sso_user_groups_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_user_groups_pkey ON public.sso_user_groups USING btree (id)` |
| sso_user_groups_user_id_provider_id_group_name_key | btree | user_id, provider_id, group_name | sim | sim |  | `CREATE UNIQUE INDEX sso_user_groups_user_id_provider_id_group_name_key ON public.sso_user_groups USING btree (user_id, provider_id, group_name)` |


## Policies (RLS)

### `sso_user_groups_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sso_user_groups_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
