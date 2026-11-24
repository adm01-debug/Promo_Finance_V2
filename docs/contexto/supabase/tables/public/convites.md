# public.convites

> Dicionário estrutural de public.convites (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE; PRIMARY KEY (id); UNIQUE (token). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.convites. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `organizacao_id` | `uuid` | não |  |  | Dicionário estrutural da coluna organizacao_id em public.convites. Papel funcional indicado pelo identificador: organizacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `email_convidado` | `text` | não |  |  | Dicionário estrutural da coluna email_convidado em public.convites. Papel funcional indicado pelo identificador: email_convidado; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `papel_proposto` | `org_papel` | não | `'MEMBRO'::org_papel` |  | Dicionário estrutural da coluna papel_proposto em public.convites. Papel funcional indicado pelo identificador: papel_proposto; o catálogo não especifica significado adicional. Tipo: org_papel. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'MEMBRO'::org_papel. Valores de enum: RESPONSAVEL, ADMIN, MEMBRO, LEITOR. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `token` | `text` | não | `encode(gen_random_bytes(32), 'hex'::text)` |  | Dicionário estrutural da coluna token em public.convites. Papel funcional indicado pelo identificador: token; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: encode(gen_random_bytes(32), 'hex'::text). Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (token). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `expira_em` | `timestamp with time zone` | não | `(now() + '7 days'::interval)` |  | Dicionário estrutural da coluna expira_em em public.convites. Papel funcional indicado pelo identificador: expira_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: (now() + '7 days'::interval). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `utilizado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna utilizado_em em public.convites. Papel funcional indicado pelo identificador: utilizado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `convidado_por` | `uuid` | não |  |  | Dicionário estrutural da coluna convidado_por em public.convites. Papel funcional indicado pelo identificador: convidado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.convites. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| convites_organizacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| convites_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| convites_token_key | UNIQUE | `UNIQUE (token)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| convites_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX convites_pkey ON public.convites USING btree (id)` |
| convites_token_key | btree | token | sim | sim |  | `CREATE UNIQUE INDEX convites_token_key ON public.convites USING btree (token)` |
| idx_convites_organizacao_id | btree | organizacao_id | não | sim |  | `CREATE INDEX idx_convites_organizacao_id ON public.convites USING btree (organizacao_id)` |


## Policies (RLS)

### `convites_manage_responsavel`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((convidado_por = ( SELECT auth.uid() AS uid)) AND (is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)))` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
