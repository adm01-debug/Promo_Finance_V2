# public.darfs

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
| 2 | `alerta_id` | `uuid` | sim |  |  |  |
| 3 | `periodo_apuracao` | `date` | sim |  |  |  |
| 4 | `valor_principal` | `numeric(15,2)` | sim |  |  |  |
| 5 | `valor_total` | `numeric(15,2)` | sim |  |  |  |
| 6 | `codigo_receita` | `text` | sim |  |  |  |
| 7 | `data_vencimento` | `date` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `descricao_receita` | `text` | sim |  |  |  |
| 10 | `empresa_id` | `uuid` | sim |  |  |  |
| 11 | `competencia` | `text` | sim |  |  |  |
| 12 | `valor_multa` | `numeric` | não | `0` |  |  |
| 13 | `valor_juros` | `numeric` | não | `0` |  |  |
| 14 | `status` | `text` | não | `'gerado'::text` |  |  |
| 15 | `retencoes_ids` | `uuid[]` | não | `ARRAY[]::uuid[]` |  |  |
| 16 | `data_pagamento` | `date` | sim |  |  |  |
| 17 | `codigo_barras` | `text` | sim |  |  |  |
| 18 | `linha_digitavel` | `text` | sim |  |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| darfs_alerta_id_fkey | FOREIGN KEY | `FOREIGN KEY (alerta_id) REFERENCES alertas_tributarios(id)` | NO ACTION | NO ACTION | sim |
| darfs_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| darfs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| darfs_status_check | CHECK | `CHECK (status = ANY (ARRAY['gerado'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| darfs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX darfs_pkey ON public.darfs USING btree (id)` |


## Policies (RLS)

### `Admins can manage darfs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `DARFs scoped by linked empresa`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))) OR (alerta_id IN ( SELECT at.id    FROM alertas_tributarios at   WHERE (at.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))))` |
| WITH CHECK |  |

### `darfs_tenant_rw`

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
| set_updated_at_408bdc8fafbc18b00290 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
