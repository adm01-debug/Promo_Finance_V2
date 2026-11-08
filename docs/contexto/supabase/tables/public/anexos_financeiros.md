# public.anexos_financeiros

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `entidade_tipo` | `text` | não |  |  |  |
| 4 | `entidade_id` | `uuid` | não |  |  |  |
| 5 | `nome_arquivo` | `text` | não |  |  |  |
| 6 | `url` | `text` | não |  |  |  |
| 7 | `mime_type` | `text` | sim |  |  |  |
| 8 | `tamanho_bytes` | `bigint` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `url_publica` | `text` | sim |  |  |  |
| 11 | `storage_path` | `text` | sim |  |  |  |
| 12 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anexos_financeiros_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anexos_financeiros_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anexos_financeiros_pkey ON public.anexos_financeiros USING btree (id)` |


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
