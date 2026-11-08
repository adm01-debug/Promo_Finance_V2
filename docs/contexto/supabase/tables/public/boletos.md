# public.boletos

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `nosso_numero` | `text` | sim |  |  |  |
| 5 | `linha_digitavel` | `text` | sim |  |  |  |
| 6 | `codigo_barras` | `text` | sim |  |  |  |
| 7 | `valor` | `numeric` | não | `0` |  |  |
| 8 | `vencimento` | `date` | sim |  |  |  |
| 9 | `status` | `text` | sim | `'emitido'::text` |  |  |
| 10 | `url_pdf` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `numero` | `text` | sim |  |  |  |
| 13 | `sacado_nome` | `text` | sim |  |  |  |
| 14 | `sacado_cpf_cnpj` | `text` | sim |  |  |  |
| 15 | `cedente_nome` | `text` | sim |  |  |  |
| 16 | `banco_nome` | `text` | sim |  |  |  |
| 17 | `data_emissao` | `date` | sim | `CURRENT_DATE` |  |  |
| 18 | `data_pagamento` | `timestamp with time zone` | sim |  |  |  |
| 19 | `valor_pago` | `numeric` | sim |  |  |  |
| 20 | `juros_multa` | `numeric` | sim | `0` |  |  |
| 21 | `desconto` | `numeric` | sim | `0` |  |  |
| 22 | `rastreio_status` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 23 | `eventos_pagamento` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 24 | `cedente_cnpj` | `text` | sim |  |  |  |
| 25 | `banco` | `text` | sim |  |  |  |
| 26 | `agencia` | `text` | sim |  |  |  |
| 27 | `conta` | `text` | sim |  |  |  |
| 28 | `descricao` | `text` | sim |  |  |  |
| 29 | `observacoes` | `text` | sim |  |  |  |
| 30 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 31 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 32 | `created_by` | `uuid` | sim |  |  |  |
| 33 | `bitrix_id` | `text` | sim |  |  |  |
| 34 | `bitrix_status` | `text` | sim |  |  |  |
| 35 | `empresa_id` | `uuid` | sim |  |  |  |
| 36 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 37 | `asaas_id` | `text` | sim | `''::text` |  |  |
| 38 | `external_provider` | `text` | sim | `'none'::text` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| boletos_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| boletos_conta_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id)` | NO ACTION | NO ACTION | sim |
| boletos_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| boletos_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| boletos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| chk_boletos_status | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| boletos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX boletos_pkey ON public.boletos USING btree (id)` |
| idx_boletos_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_boletos_created_by_fk ON public.boletos USING btree (created_by)` |


## Policies (RLS)

### `Owner manage boletos`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `boletos_grupo_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_6ccc02b67895ed316b66 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
