# public.convites_contador

> Dicionário estrutural de public.convites_contador (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (expires_at > created_at); CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at); CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (token_hash ~ '^[a-f0-9]{64}$'::text); UNIQUE (token_hash); UNIQUE (token). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.convites_contador. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.convites_contador. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `email` | `text` | não |  |  | Dicionário estrutural da coluna email em public.convites_contador. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `token` | `text` | não | `(gen_random_uuid())::text` |  | Dicionário estrutural da coluna token em public.convites_contador. Papel funcional indicado pelo identificador: token; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: (gen_random_uuid())::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (token). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.convites_contador. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `expires_at` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  | Dicionário estrutural da coluna expires_at em public.convites_contador. Papel funcional indicado pelo identificador: expires_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: (now() + '7 days'::interval). Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (expires_at > created_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `accepted_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna accepted_at em public.convites_contador. Papel funcional indicado pelo identificador: accepted_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.convites_contador. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.convites_contador. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (expires_at > created_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `nome` | `text` | sim |  |  | Dicionário estrutural da coluna nome em public.convites_contador. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `token_hash` | `text` | não |  |  | Dicionário estrutural da coluna token_hash em public.convites_contador. Papel funcional indicado pelo identificador: token_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (token_hash ~ '^[a-f0-9]{64}$'::text); UNIQUE (token_hash). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `revoked_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna revoked_at em public.convites_contador. Papel funcional indicado pelo identificador: revoked_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.convites_contador. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| convite_expira_no_futuro | CHECK | `CHECK (expires_at > created_at)` |  |  | sim |
| convite_revogado_nao_aceito | CHECK | `CHECK (revoked_at IS NULL OR accepted_at IS NULL OR revoked_at >= accepted_at)` |  |  | sim |
| convites_contador_email_check | CHECK | `CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)` |  |  | sim |
| convites_contador_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| convites_contador_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| convites_contador_token_hash_check | CHECK | `CHECK (token_hash ~ '^[a-f0-9]{64}$'::text)` |  |  | sim |
| convites_contador_token_hash_key | UNIQUE | `UNIQUE (token_hash)` |  |  | sim |
| convites_contador_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| convites_contador_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_pkey ON public.convites_contador USING btree (id)` |
| convites_contador_token_hash_key | btree | token_hash | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_token_hash_key ON public.convites_contador USING btree (token_hash)` |
| convites_contador_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX convites_contador_token_key ON public.convites_contador USING btree (token)` |
| idx_convites_contador_empresa | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_convites_contador_empresa ON public.convites_contador USING btree (empresa_id, created_at DESC)` |
| uq_convite_contador_ativo | btree | empresa_id | sim | sim | `((revoked_at IS NULL) AND (accepted_at IS NULL))` | `CREATE UNIQUE INDEX uq_convite_contador_ativo ON public.convites_contador USING btree (empresa_id, lower(email)) WHERE ((revoked_at IS NULL) AND (accepted_at IS NULL))` |


## Policies (RLS)

### `convites_contador_revogar`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |

### `convites_contador_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND (has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role)))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_convites_contador_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
