# public.frontend_error_silence_digest_log

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
| 2 | `sent_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `silenciamentos_incluidos` | `integer` | sim | `0` |  |  |
| 4 | `detalhes` | `jsonb` | sim |  |  |  |
| 5 | `executado_em` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `janela_horas` | `integer` | não |  |  |  |
| 7 | `itens` | `integer` | não | `0` |  |  |
| 8 | `assinaturas` | `text[]` | não | `'{}'::text[]` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| frontend_error_silence_digest_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_silence_digest_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_silence_digest_log_pkey ON public.frontend_error_silence_digest_log USING btree (id)` |


## Policies (RLS)

### `fe_silence_digest_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
