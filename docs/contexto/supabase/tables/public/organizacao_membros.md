# public.organizacao_membros

> Dicionário estrutural de public.organizacao_membros (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE; PRIMARY KEY (id); UNIQUE (organizacao_id, usuario_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.organizacao_membros. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `organizacao_id` | `uuid` | não |  |  | Dicionário estrutural da coluna organizacao_id em public.organizacao_membros. Papel funcional indicado pelo identificador: organizacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE; UNIQUE (organizacao_id, usuario_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `usuario_id` | `uuid` | não |  |  | Dicionário estrutural da coluna usuario_id em public.organizacao_membros. Papel funcional indicado pelo identificador: usuario_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (organizacao_id, usuario_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `papel_na_org` | `org_papel` | não | `'MEMBRO'::org_papel` |  | Dicionário estrutural da coluna papel_na_org em public.organizacao_membros. Papel funcional indicado pelo identificador: papel_na_org; o catálogo não especifica significado adicional. Tipo: org_papel. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'MEMBRO'::org_papel. Valores de enum: RESPONSAVEL, ADMIN, MEMBRO, LEITOR. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.organizacao_membros. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `convidado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna convidado_por em public.organizacao_membros. Papel funcional indicado pelo identificador: convidado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `aceito_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna aceito_em em public.organizacao_membros. Papel funcional indicado pelo identificador: aceito_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.organizacao_membros. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.organizacao_membros. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| organizacao_membros_organizacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (organizacao_id) REFERENCES organizacoes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| organizacao_membros_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| uq_org_membro | UNIQUE | `UNIQUE (organizacao_id, usuario_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| organizacao_membros_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX organizacao_membros_pkey ON public.organizacao_membros USING btree (id)` |
| uq_org_membro | btree | organizacao_id, usuario_id | sim | sim |  | `CREATE UNIQUE INDEX uq_org_membro ON public.organizacao_membros USING btree (organizacao_id, usuario_id)` |


## Policies (RLS)

### `org_membros_manage_responsavel`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `(is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |

### `org_membros_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((usuario_id = ( SELECT auth.uid() AS uid)) OR is_org_membro(organizacao_id, ( SELECT auth.uid() AS uid)) OR is_org_responsavel(organizacao_id, ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_org_membros_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_organizacao_membros_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
