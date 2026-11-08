# public.conformidade_snapshots

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `competencia` | `text` | não |  |  |  |
| 4 | `score` | `numeric` | não |  |  |  |
| 5 | `nivel` | `text` | não |  |  |  |
| 6 | `total_obrigacoes` | `integer` | não | `0` |  |  |
| 7 | `entregues` | `integer` | não | `0` |  |  |
| 8 | `vencidas_pendentes` | `integer` | não | `0` |  |  |
| 9 | `entregues_com_atraso` | `integer` | não | `0` |  |  |
| 10 | `pontualidade` | `numeric` | não | `0` |  |  |
| 11 | `multa_registrada` | `numeric` | não | `0` |  |  |
| 12 | `gerado_por` | `uuid` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conformidade_snapshots_competencia_fmt | CHECK | `CHECK (competencia ~ '^[0-9]{4}-(0[1-9]\|1[0-2])$'::text)` |  |  | sim |
| conformidade_snapshots_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conformidade_snapshots_nivel_check | CHECK | `CHECK (nivel = ANY (ARRAY['critico'::text, 'atencao'::text, 'bom'::text, 'excelente'::text]))` |  |  | sim |
| conformidade_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conformidade_snapshots_pontualidade_range | CHECK | `CHECK (pontualidade >= 0::numeric AND pontualidade <= 100::numeric)` |  |  | sim |
| conformidade_snapshots_score_range | CHECK | `CHECK (score >= 0::numeric AND score <= 100::numeric)` |  |  | sim |
| conformidade_snapshots_unica | UNIQUE | `UNIQUE (empresa_id, competencia)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conformidade_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conformidade_snapshots_pkey ON public.conformidade_snapshots USING btree (id)` |
| conformidade_snapshots_unica | btree | empresa_id, competencia | sim | sim |  | `CREATE UNIQUE INDEX conformidade_snapshots_unica ON public.conformidade_snapshots USING btree (empresa_id, competencia)` |


## Policies (RLS)

### `conformidade_snapshots_empresa_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `conformidade_snapshots_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK |  |

### `conformidade_snapshots_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |
| WITH CHECK | `(empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true))))` |

### `conformidade_snapshots_tenant_rw`

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
| trg_conformidade_snapshots_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

_nenhum_
