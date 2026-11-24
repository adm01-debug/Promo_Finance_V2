# public.sso_role_mappings

> Dicionário estrutural de public.sso_role_mappings (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (char_length(btrim(idp_group)) >= 1 AND char_length(btrim(idp_group)) <= 200); CHECK (ordem >= 0); PRIMARY KEY (id); FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE; UNIQUE (provider_id, provider_role, app_role). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sso_role_mappings. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `provider_id` | `uuid` | não |  |  | Dicionário estrutural da coluna provider_id em public.sso_role_mappings. Papel funcional indicado pelo identificador: provider_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE; UNIQUE (provider_id, provider_role, app_role). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `provider_role` | `text` | não |  |  | Dicionário estrutural da coluna provider_role em public.sso_role_mappings. Papel funcional indicado pelo identificador: provider_role; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (provider_id, provider_role, app_role). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `app_role` | `text` | não |  |  | Dicionário estrutural da coluna app_role em public.sso_role_mappings. Papel funcional indicado pelo identificador: app_role; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (provider_id, provider_role, app_role). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.sso_role_mappings. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.sso_role_mappings. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `idp_group` | `text` | não |  |  | Dicionário estrutural da coluna idp_group em public.sso_role_mappings. Papel funcional indicado pelo identificador: idp_group; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(btrim(idp_group)) >= 1 AND char_length(btrim(idp_group)) <= 200). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `ordem` | `integer` | não | `0` |  | Dicionário estrutural da coluna ordem em public.sso_role_mappings. Papel funcional indicado pelo identificador: ordem; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ordem >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.sso_role_mappings. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sso_role_mappings_idp_group_check | CHECK | `CHECK (char_length(btrim(idp_group)) >= 1 AND char_length(btrim(idp_group)) <= 200)` |  |  | sim |
| sso_role_mappings_ordem_check | CHECK | `CHECK (ordem >= 0)` |  |  | sim |
| sso_role_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sso_role_mappings_provider_id_fkey | FOREIGN KEY | `FOREIGN KEY (provider_id) REFERENCES sso_providers(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sso_role_mappings_provider_id_provider_role_app_role_key | UNIQUE | `UNIQUE (provider_id, provider_role, app_role)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sso_role_mappings_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_sso_role_mappings_empresa_id ON public.sso_role_mappings USING btree (empresa_id)` |
| sso_role_mappings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sso_role_mappings_pkey ON public.sso_role_mappings USING btree (id)` |
| sso_role_mappings_provider_id_provider_role_app_role_key | btree | provider_id, provider_role, app_role | sim | sim |  | `CREATE UNIQUE INDEX sso_role_mappings_provider_id_provider_role_app_role_key ON public.sso_role_mappings USING btree (provider_id, provider_role, app_role)` |


## Policies (RLS)

### `sso_role_mappings_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sso_role_mappings_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
