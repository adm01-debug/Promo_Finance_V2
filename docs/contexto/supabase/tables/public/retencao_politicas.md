# public.retencao_politicas

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
| 2 | `tabela` | `text` | não |  |  |  |
| 3 | `coluna` | `text` | sim |  |  |  |
| 4 | `dias` | `integer` | sim |  |  |  |
| 5 | `filtro` | `text` | sim |  |  |  |
| 6 | `motivo` | `text` | não |  |  |  |
| 7 | `ativo` | `boolean` | não | `true` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| retencao_politicas_coerencia | CHECK | `CHECK (dias IS NULL AND coluna IS NULL OR dias >= 1 AND coluna IS NOT NULL)` |  |  | sim |
| retencao_politicas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| retencao_politicas_tabela_key | UNIQUE | `UNIQUE (tabela)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| retencao_politicas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX retencao_politicas_pkey ON public.retencao_politicas USING btree (id)` |
| retencao_politicas_tabela_key | btree | tabela | sim | sim |  | `CREATE UNIQUE INDEX retencao_politicas_tabela_key ON public.retencao_politicas USING btree (tabela)` |


## Policies (RLS)

### `retencao_politicas_admin_select`

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
| trg_retencao_politicas_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
