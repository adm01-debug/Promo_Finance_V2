# public.protocolos_st_ufs

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
| 2 | `protocolo_id` | `uuid` | não |  |  |  |
| 3 | `uf` | `uf_brasil` | não |  |  |  |
| 4 | `papel` | `text` | não | `'AMBOS'::text` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| protocolos_st_ufs_papel_check | CHECK | `CHECK (papel = ANY (ARRAY['ORIGEM'::text, 'DESTINO'::text, 'AMBOS'::text]))` |  |  | sim |
| protocolos_st_ufs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| protocolos_st_ufs_protocolo_id_fkey | FOREIGN KEY | `FOREIGN KEY (protocolo_id) REFERENCES protocolos_st(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| protocolos_st_ufs_unique | UNIQUE | `UNIQUE (protocolo_id, uf)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| protocolos_st_ufs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ufs_pkey ON public.protocolos_st_ufs USING btree (id)` |
| protocolos_st_ufs_unique | btree | protocolo_id, uf | sim | sim |  | `CREATE UNIQUE INDEX protocolos_st_ufs_unique ON public.protocolos_st_ufs USING btree (protocolo_id, uf)` |


## Policies (RLS)

### `protocolos_st_ufs_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `protocolos_st_ufs_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_protocolos_st_ufs_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

_nenhum_
