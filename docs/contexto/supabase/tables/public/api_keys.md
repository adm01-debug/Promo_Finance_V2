# public.api_keys

> Dicionário estrutural de public.api_keys (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (chave); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; UNIQUE (key_hash); CHECK (key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'::text); CHECK (char_length(name) >= 2 AND char_length(name) <= 120); UNIQUE (empresa_id, name); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.api_keys. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.api_keys. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `chave` | `text` | não |  |  | Dicionário estrutural da coluna chave em public.api_keys. Papel funcional indicado pelo identificador: chave; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (chave). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.api_keys. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; UNIQUE (empresa_id, name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `scopes` | `text[]` | sim |  |  | Dicionário estrutural da coluna scopes em public.api_keys. Papel funcional indicado pelo identificador: scopes; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.api_keys. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `expira_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna expira_em em public.api_keys. Papel funcional indicado pelo identificador: expira_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `ultimo_uso` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna ultimo_uso em public.api_keys. Papel funcional indicado pelo identificador: ultimo_uso; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.api_keys. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `key_hash` | `text` | sim |  |  | Dicionário estrutural da coluna key_hash em public.api_keys. Papel funcional indicado pelo identificador: key_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (key_hash). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `key_prefix` | `text` | sim |  |  | Dicionário estrutural da coluna key_prefix em public.api_keys. Papel funcional indicado pelo identificador: key_prefix; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `expires_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna expires_at em public.api_keys. Papel funcional indicado pelo identificador: expires_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `last_used_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_used_at em public.api_keys. Papel funcional indicado pelo identificador: last_used_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `revoked_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna revoked_at em public.api_keys. Papel funcional indicado pelo identificador: revoked_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 15 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.api_keys. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.api_keys. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 17 | `name` | `text` | não |  |  | Dicionário estrutural da coluna name em public.api_keys. Papel funcional indicado pelo identificador: name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(name) >= 2 AND char_length(name) <= 120); UNIQUE (empresa_id, name). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| api_keys_chave_key | UNIQUE | `UNIQUE (chave)` |  |  | sim |
| api_keys_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| api_keys_hash_unico | UNIQUE | `UNIQUE (key_hash)` |  |  | sim |
| api_keys_key_prefix_check | CHECK | `CHECK (key_prefix ~ '^[A-Za-z0-9_-]{4,16}$'::text)` |  |  | sim |
| api_keys_name_check | CHECK | `CHECK (char_length(name) >= 2 AND char_length(name) <= 120)` |  |  | sim |
| api_keys_nome_unico_por_empresa | UNIQUE | `UNIQUE (empresa_id, name)` |  |  | sim |
| api_keys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| api_keys_chave_key | btree | chave | sim | sim |  | `CREATE UNIQUE INDEX api_keys_chave_key ON public.api_keys USING btree (chave)` |
| api_keys_hash_unico | btree | key_hash | sim | sim |  | `CREATE UNIQUE INDEX api_keys_hash_unico ON public.api_keys USING btree (key_hash)` |
| api_keys_nome_unico_por_empresa | btree | empresa_id, name | sim | sim |  | `CREATE UNIQUE INDEX api_keys_nome_unico_por_empresa ON public.api_keys USING btree (empresa_id, name)` |
| api_keys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX api_keys_pkey ON public.api_keys USING btree (id)` |
| idx_api_keys_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_api_keys_empresa ON public.api_keys USING btree (empresa_id, created_at DESC)` |


## Policies (RLS)

### `api_keys_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `api_keys_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_api_keys_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
