# public.split_payment_transacoes

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `operacao_id` | `text` | sim |  |  |  |
| 4 | `documento_tipo` | `text` | sim |  |  |  |
| 5 | `documento_numero` | `text` | sim |  |  |  |
| 6 | `documento_chave` | `text` | sim |  |  |  |
| 7 | `valor_operacao` | `numeric(15,2)` | não | `0` |  |  |
| 8 | `valor_liquido` | `numeric(15,2)` | não | `0` |  |  |
| 9 | `cbs_retido` | `numeric(15,2)` | não | `0` |  |  |
| 10 | `ibs_retido` | `numeric(15,2)` | não | `0` |  |  |
| 11 | `is_retido` | `numeric(15,2)` | não | `0` |  |  |
| 12 | `total_retido` | `numeric(15,2)` | não | `0` |  |  |
| 13 | `conta_fornecedor` | `text` | sim |  |  |  |
| 14 | `conta_cbs` | `text` | sim |  |  |  |
| 15 | `conta_ibs` | `text` | sim |  |  |  |
| 16 | `conta_is` | `text` | sim |  |  |  |
| 17 | `status` | `text` | não | `'pendente'::text` |  |  |
| 18 | `data_processamento` | `timestamp with time zone` | sim |  |  |  |
| 19 | `protocolo` | `text` | sim |  |  |  |
| 20 | `erro_mensagem` | `text` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| split_payment_transacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| split_payment_transacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_split_payment_transacoes_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_split_payment_transacoes_empresa_id ON public.split_payment_transacoes USING btree (empresa_id)` |
| split_payment_transacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX split_payment_transacoes_pkey ON public.split_payment_transacoes USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar split_payment_transacoes`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar split_payment_transacoes`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir split_payment_transacoes`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver split_payment_transacoes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `split_payment_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |

### `split_payment_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `split_payment_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_split_payment_transacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
