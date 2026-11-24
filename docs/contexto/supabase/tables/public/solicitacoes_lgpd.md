# public.solicitacoes_lgpd

> Dicionário estrutural de public.solicitacoes_lgpd (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (status = ANY (ARRAY['aberta'::text, 'em_analise'::text, 'atendida'::text, 'rejeitada'::text])); CHECK (tipo = ANY (ARRAY['acesso'::text, 'portabilidade'::text, 'exclusao'::text, 'retificacao'::text, 'anonimizacao'::text])); FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_email` | `text` | não |  |  | Dicionário estrutural da coluna user_email em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: user_email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['acesso'::text, 'portabilidade'::text, 'exclusao'::text, 'retificacao'::text, 'anonimizacao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `status` | `text` | não | `'aberta'::text` |  | Dicionário estrutural da coluna status em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'aberta'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['aberta'::text, 'em_analise'::text, 'atendida'::text, 'rejeitada'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `justificativa` | `text` | sim |  |  | Dicionário estrutural da coluna justificativa em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: justificativa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `payload_resposta` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload_resposta em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: payload_resposta; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `url_dump` | `text` | sim |  |  | Dicionário estrutural da coluna url_dump em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: url_dump; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `atendida_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna atendida_em em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: atendida_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `atendida_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna atendida_por em public.solicitacoes_lgpd. Papel funcional indicado pelo identificador: atendida_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| solicitacoes_lgpd_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| solicitacoes_lgpd_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| solicitacoes_lgpd_status_check | CHECK | `CHECK (status = ANY (ARRAY['aberta'::text, 'em_analise'::text, 'atendida'::text, 'rejeitada'::text]))` |  |  | sim |
| solicitacoes_lgpd_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['acesso'::text, 'portabilidade'::text, 'exclusao'::text, 'retificacao'::text, 'anonimizacao'::text]))` |  |  | sim |
| solicitacoes_lgpd_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_solicitacoes_lgpd_created | btree | created_at | não | sim |  | `CREATE INDEX idx_solicitacoes_lgpd_created ON public.solicitacoes_lgpd USING btree (created_at DESC)` |
| idx_solicitacoes_lgpd_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_solicitacoes_lgpd_empresa_id ON public.solicitacoes_lgpd USING btree (empresa_id)` |
| idx_solicitacoes_lgpd_user | btree | user_id | não | sim |  | `CREATE INDEX idx_solicitacoes_lgpd_user ON public.solicitacoes_lgpd USING btree (user_id)` |
| solicitacoes_lgpd_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX solicitacoes_lgpd_pkey ON public.solicitacoes_lgpd USING btree (id)` |


## Policies (RLS)

### `solicitacoes_lgpd_admin_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM profiles p   WHERE ((p.id = ( SELECT auth.uid() AS uid)) AND (p.role = ANY (ARRAY['admin'::text, 'super_admin'::text])))))` |
| WITH CHECK |  |

### `solicitacoes_lgpd_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |

### `solicitacoes_lgpd_user_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_solicitacoes_lgpd_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_from_profile |
| trg_solicitacoes_lgpd_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
