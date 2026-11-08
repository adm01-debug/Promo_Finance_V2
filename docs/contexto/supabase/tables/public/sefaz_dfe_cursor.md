# public.sefaz_dfe_cursor

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `cnpj` | `text` | não |  |  |  |
| 3 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  |  |
| 4 | `ultimo_nsu` | `bigint` | não | `0` |  |  |
| 5 | `max_nsu` | `bigint` | não | `0` |  |  |
| 6 | `ultima_consulta` | `timestamp with time zone` | sim |  |  |  |
| 7 | `ultimo_status` | `text` | sim |  |  |  |
| 8 | `ultimo_erro` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `retry_count` | `integer` | não | `0` |  |  |
| 12 | `next_run_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `last_error_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `circuit_open` | `boolean` | não | `false` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sefaz_dfe_cursor_cnpj_ambiente_key | UNIQUE | `UNIQUE (cnpj, ambiente)` |  |  | sim |
| sefaz_dfe_cursor_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sefaz_dfe_cursor_cnpj_ambiente_key | btree | cnpj, ambiente | sim | sim |  | `CREATE UNIQUE INDEX sefaz_dfe_cursor_cnpj_ambiente_key ON public.sefaz_dfe_cursor USING btree (cnpj, ambiente)` |
| sefaz_dfe_cursor_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sefaz_dfe_cursor_pkey ON public.sefaz_dfe_cursor USING btree (id)` |


## Policies (RLS)

### `cursor_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_dfe_cursor_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |


## Grants

_nenhum_
