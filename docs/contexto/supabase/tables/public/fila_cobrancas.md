# public.fila_cobrancas

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `cliente_id` | `uuid` | sim |  |  |  |
| 3 | `cliente_nome` | `text` | sim |  |  |  |
| 4 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 5 | `etapa_id` | `uuid` | sim |  |  |  |
| 6 | `etapa` | `text` | sim |  |  |  |
| 7 | `canal` | `text` | sim |  |  |  |
| 8 | `destinatario` | `text` | sim |  |  |  |
| 9 | `status` | `text` | não | `'pendente'::text` |  |  |
| 10 | `tentativas` | `integer` | não | `0` |  |  |
| 11 | `max_tentativas` | `integer` | não | `3` |  |  |
| 12 | `last_error` | `text` | sim |  |  |  |
| 13 | `scheduled_for` | `timestamp with time zone` | não |  |  |  |
| 14 | `sent_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `empresa_id` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 18 | `provider` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_fila_cobrancas_status | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text, 'cancelado'::text]))` |  |  | sim |
| fila_cobrancas_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_etapa_id_fkey | FOREIGN KEY | `FOREIGN KEY (etapa_id) REFERENCES regua_cobranca_etapas(id)` | NO ACTION | NO ACTION | sim |
| fila_cobrancas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fila_cobrancas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fila_cobrancas_pkey ON public.fila_cobrancas USING btree (id)` |


## Policies (RLS)

### `Admins can manage queue`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `fila_cobrancas_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `fila_cobrancas_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_24d30bafb2eecf05024f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
