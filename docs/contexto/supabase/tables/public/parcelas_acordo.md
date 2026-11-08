# public.parcelas_acordo

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
| 2 | `acordo_id` | `uuid` | sim |  |  |  |
| 3 | `numero_parcela` | `integer` | não |  |  |  |
| 4 | `valor` | `numeric(15,2)` | não |  |  |  |
| 5 | `data_vencimento` | `date` | não |  |  |  |
| 6 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| parcelas_acordo_acordo_id_fkey | FOREIGN KEY | `FOREIGN KEY (acordo_id) REFERENCES acordos_parcelamento(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| parcelas_acordo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| parcelas_acordo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX parcelas_acordo_pkey ON public.parcelas_acordo USING btree (id)` |


## Policies (RLS)

### `parcelas_acordo_admin_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |

### `parcelas_acordo_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(acordo_id IN ( SELECT a.id    FROM acordos_parcelamento a   WHERE (a.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |

### `parcelas_acordo_tenant_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1    FROM acordos_parcelamento a   WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))` |
| WITH CHECK | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND (EXISTS ( SELECT 1    FROM acordos_parcelamento a   WHERE ((a.id = parcelas_acordo.acordo_id) AND empresa_acessivel(a.empresa_id)))))` |


## Triggers

_nenhum_


## Grants

_nenhum_
