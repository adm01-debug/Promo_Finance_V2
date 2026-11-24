# public.aprovacao_assinaturas

> Dicionário estrutural de public.aprovacao_assinaturas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_aprovacao(id) ON DELETE CASCADE; UNIQUE (solicitacao_id, user_id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.aprovacao_assinaturas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `solicitacao_id` | `uuid` | não |  |  | Dicionário estrutural da coluna solicitacao_id em public.aprovacao_assinaturas. Papel funcional indicado pelo identificador: solicitacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_aprovacao(id) ON DELETE CASCADE; UNIQUE (solicitacao_id, user_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.aprovacao_assinaturas. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (solicitacao_id, user_id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `assinado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna assinado_em em public.aprovacao_assinaturas. Papel funcional indicado pelo identificador: assinado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aprovacao_assinaturas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aprovacao_assinaturas_solicitacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (solicitacao_id) REFERENCES solicitacoes_aprovacao(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| aprovacao_assinaturas_unica | UNIQUE | `UNIQUE (solicitacao_id, user_id)` |  |  | sim |
| aprovacao_assinaturas_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aprovacao_assinaturas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aprovacao_assinaturas_pkey ON public.aprovacao_assinaturas USING btree (id)` |
| aprovacao_assinaturas_unica | btree | solicitacao_id, user_id | sim | sim |  | `CREATE UNIQUE INDEX aprovacao_assinaturas_unica ON public.aprovacao_assinaturas USING btree (solicitacao_id, user_id)` |
| idx_aprovacao_assinaturas_solicitacao | btree | solicitacao_id | não | sim |  | `CREATE INDEX idx_aprovacao_assinaturas_solicitacao ON public.aprovacao_assinaturas USING btree (solicitacao_id)` |
| idx_aprovacao_assinaturas_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_aprovacao_assinaturas_user_id ON public.aprovacao_assinaturas USING btree (user_id)` |


## Policies (RLS)

### `Aprovacoes visiveis para envolvidos e admins`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) OR (auth.uid() = ( SELECT solicitacoes_aprovacao.user_id    FROM solicitacoes_aprovacao   WHERE (solicitacoes_aprovacao.id = aprovacao_assinaturas.solicitacao_id))) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Assinante registra propria assinatura`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
