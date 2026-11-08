# public.health_scores_operacionais

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `score` | `numeric` | sim | `100` |  |  |
| 4 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 5 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 6 | `snapshot_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `score_total` | `numeric` | sim | `100` |  |  |
| 8 | `score_tributario` | `numeric` | sim | `100` |  |  |
| 9 | `score_financeiro` | `numeric` | sim | `100` |  |  |
| 10 | `score_operacional` | `numeric` | sim | `100` |  |  |
| 11 | `recomendacoes` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 12 | `score_lgpd` | `numeric` | sim | `100` |  |  |
| 13 | `score_cadastros` | `numeric` | sim | `100` |  |  |
| 14 | `score_engajamento` | `numeric` | sim | `100` |  |  |
| 15 | `tendencia_pct` | `numeric` | sim | `0` |  |  |
| 16 | `insights_md` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| health_scores_operacionais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| health_scores_operacionais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| health_scores_operacionais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX health_scores_operacionais_pkey ON public.health_scores_operacionais USING btree (id)` |


## Policies (RLS)

### `health_scores_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
