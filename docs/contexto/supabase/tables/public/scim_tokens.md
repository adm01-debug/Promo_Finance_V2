# public.scim_tokens

> Dicionário estrutural de public.scim_tokens (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE; UNIQUE (token_hash). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.scim_tokens. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `provider_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna provider_id em public.scim_tokens. Papel funcional indicado pelo identificador: provider_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.scim_tokens. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `token_hash` | `text` | não |  |  | Dicionário estrutural da coluna token_hash em public.scim_tokens. Papel funcional indicado pelo identificador: token_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (token_hash). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `token_prefix` | `text` | não |  |  | Dicionário estrutural da coluna token_prefix em public.scim_tokens. Papel funcional indicado pelo identificador: token_prefix; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.scim_tokens. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `expires_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna expires_at em public.scim_tokens. Papel funcional indicado pelo identificador: expires_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `last_used_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_used_at em public.scim_tokens. Papel funcional indicado pelo identificador: last_used_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.scim_tokens. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.scim_tokens. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.scim_tokens. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `default_role` | `app_role` | sim | `'visualizador'::app_role` |  | Dicionário estrutural da coluna default_role em public.scim_tokens. Papel funcional indicado pelo identificador: default_role; o catálogo não especifica significado adicional. Tipo: app_role. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'visualizador'::app_role. Valores de enum: admin, manager, operator, viewer, financeiro, operacional, visualizador, contador. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scim_tokens_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| scim_tokens_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| scim_tokens_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scim_tokens_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| scim_tokens_token_hash_key | UNIQUE | `UNIQUE (token_hash)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scim_tokens_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_scim_tokens_created_by_fk ON public.scim_tokens USING btree (created_by)` |
| idx_scim_tokens_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_scim_tokens_empresa_id ON public.scim_tokens USING btree (empresa_id)` |
| idx_scim_tokens_provider_id_fk | btree | provider_id | não | sim |  | `CREATE INDEX idx_scim_tokens_provider_id_fk ON public.scim_tokens USING btree (provider_id)` |
| scim_tokens_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scim_tokens_pkey ON public.scim_tokens USING btree (id)` |
| scim_tokens_token_hash_key | btree | token_hash | sim | sim |  | `CREATE UNIQUE INDEX scim_tokens_token_hash_key ON public.scim_tokens USING btree (token_hash)` |


## Policies (RLS)

### `Admins manage scim_tokens`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
