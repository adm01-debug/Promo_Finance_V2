# public.bitrix_sync_logs

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `entidade_tipo` | `text` | sim |  |  |  |
| 4 | `entidade_id` | `text` | sim |  |  |  |
| 5 | `status` | `text` | sim |  |  |  |
| 6 | `detalhes` | `jsonb` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `tipo` | `text` | sim |  |  |  |
| 9 | `entidade` | `text` | sim |  |  |  |
| 10 | `registros_processados` | `integer` | sim | `0` |  |  |
| 11 | `registros_com_erro` | `integer` | sim | `0` |  |  |
| 12 | `mensagem_erro` | `text` | sim |  |  |  |
| 13 | `iniciado_em` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `finalizado_em` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix_sync_logs_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| bitrix_sync_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix_sync_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bitrix_sync_logs_pkey ON public.bitrix_sync_logs USING btree (id)` |


## Policies (RLS)

### `bitrix_sync_logs_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
