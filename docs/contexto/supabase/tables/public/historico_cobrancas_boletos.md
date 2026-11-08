# public.historico_cobrancas_boletos

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
| 2 | `boleto_id` | `uuid` | sim |  |  |  |
| 3 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 4 | `tipo_evento` | `text` | não |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `metadados` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `user_id` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_cobrancas_boletos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_cobrancas_boletos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_cobrancas_boletos_pkey ON public.historico_cobrancas_boletos USING btree (id)` |


## Policies (RLS)

### `historico_cobrancas_boletos_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(conta_receber_id IN ( SELECT contas_receber.id    FROM contas_receber   WHERE (contas_receber.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `historico_cobrancas_user_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

_nenhum_
