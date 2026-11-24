# public.anexos_financeiros

> Dicionário estrutural de public.anexos_financeiros (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.anexos_financeiros. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  | Dicionário estrutural da coluna user_id em public.anexos_financeiros. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `entidade_tipo` | `text` | não |  |  | Dicionário estrutural da coluna entidade_tipo em public.anexos_financeiros. Papel funcional indicado pelo identificador: entidade_tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `entidade_id` | `uuid` | não |  |  | Dicionário estrutural da coluna entidade_id em public.anexos_financeiros. Papel funcional indicado pelo identificador: entidade_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `nome_arquivo` | `text` | não |  |  | Dicionário estrutural da coluna nome_arquivo em public.anexos_financeiros. Papel funcional indicado pelo identificador: nome_arquivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `url` | `text` | não |  |  | Dicionário estrutural da coluna url em public.anexos_financeiros. Papel funcional indicado pelo identificador: url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `mime_type` | `text` | sim |  |  | Dicionário estrutural da coluna mime_type em public.anexos_financeiros. Papel funcional indicado pelo identificador: mime_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `tamanho_bytes` | `bigint` | sim |  |  | Dicionário estrutural da coluna tamanho_bytes em public.anexos_financeiros. Papel funcional indicado pelo identificador: tamanho_bytes; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.anexos_financeiros. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `url_publica` | `text` | sim |  |  | Dicionário estrutural da coluna url_publica em public.anexos_financeiros. Papel funcional indicado pelo identificador: url_publica; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `storage_path` | `text` | sim |  |  | Dicionário estrutural da coluna storage_path em public.anexos_financeiros. Papel funcional indicado pelo identificador: storage_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.anexos_financeiros. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anexos_financeiros_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anexos_financeiros_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anexos_financeiros_pkey ON public.anexos_financeiros USING btree (id)` |
| idx_anexos_financeiros_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_anexos_financeiros_empresa_id ON public.anexos_financeiros USING btree (empresa_id)` |


## Policies (RLS)

### `anexos_financeiros_atualizacao_empresa`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND ue.ativo AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])) AND (ue.empresa_id = anexos_financeiros.empresa_id))))` |
| WITH CHECK | `((empresa_id IS NOT NULL) AND (empresa_id = private.empresa_da_entidade_financeira(entidade_tipo, entidade_id)) AND ((storage_path IS NULL) OR starts_with(lower(storage_path), lower((((entidade_tipo \|\| '/'::text) \|\| (entidade_id)::text) \|\| '/'::text)))) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND ue.ativo AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])) AND (ue.empresa_id = anexos_financeiros.empresa_id)))))` |

### `anexos_financeiros_insercao_empresa`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((empresa_id IS NOT NULL) AND (empresa_id = private.empresa_da_entidade_financeira(entidade_tipo, entidade_id)) AND ((storage_path IS NULL) OR starts_with(lower(storage_path), lower((((entidade_tipo \|\| '/'::text) \|\| (entidade_id)::text) \|\| '/'::text)))) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND ue.ativo AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])) AND (ue.empresa_id = anexos_financeiros.empresa_id)))))` |

### `anexos_financeiros_leitura_empresa`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND ue.ativo AND (ue.empresa_id = anexos_financeiros.empresa_id))))` |
| WITH CHECK |  |

### `anexos_financeiros_remocao_empresa`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND ue.ativo AND (ue.role = ANY (ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])) AND (ue.empresa_id = anexos_financeiros.empresa_id))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_anexos_atribui_empresa | BEFORE | INSERT OR UPDATE | ROW | enabled | private.atribui_empresa_do_anexo |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
