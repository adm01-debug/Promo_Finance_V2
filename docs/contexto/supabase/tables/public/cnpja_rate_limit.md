# public.cnpja_rate_limit

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
| 1 | `user_id` | `uuid` | não |  |  |  |
| 2 | `window_start` | `timestamp with time zone` | não |  |  |  |
| 3 | `request_count` | `integer` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnpja_rate_limit_pkey | PRIMARY KEY | `PRIMARY KEY (user_id, window_start)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnpja_rate_limit_pkey | btree | user_id, window_start | sim | sim |  | `CREATE UNIQUE INDEX cnpja_rate_limit_pkey ON public.cnpja_rate_limit USING btree (user_id, window_start)` |
| idx_cnpja_rate_limit_window | btree | window_start | não | sim |  | `CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit USING btree (window_start)` |


## Policies (RLS)

### `Usuário vê próprio uso CNPJá`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
