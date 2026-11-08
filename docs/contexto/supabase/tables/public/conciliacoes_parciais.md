# public.conciliacoes_parciais

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
| 2 | `transacao_bancaria_id` | `uuid` | não |  |  |  |
| 3 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 4 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 5 | `valor_parcial` | `numeric` | não |  |  |  |
| 6 | `created_by` | `uuid` | não | `auth.uid()` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conciliacoes_parciais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conciliacoes_parciais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conciliacoes_parciais_pkey ON public.conciliacoes_parciais USING btree (id)` |


## Policies (RLS)

### `concil_parciais_owner_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = created_by)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = created_by)` |


## Triggers

_nenhum_


## Grants

_nenhum_
