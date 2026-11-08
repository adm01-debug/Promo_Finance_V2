# public.lancamentos_contabeis

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
| 2 | `user_id` | `uuid` | sim | `auth.uid()` |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `numero_lancamento` | `bigint` | sim |  |  |  |
| 5 | `data_lancamento` | `date` | não | `CURRENT_DATE` |  |  |
| 6 | `historico` | `text` | sim |  |  |  |
| 7 | `origem` | `text` | sim |  |  |  |
| 8 | `valor_total` | `numeric` | não | `0` |  |  |
| 9 | `status` | `text` | não | `'ativo'::text` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_by` | `uuid` | sim | `auth.uid()` |  |  |
| 12 | `competencia` | `date` | sim |  |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `origem_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lancamentos_contabeis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.partidas_contabeis | partidas_contabeis_lancamento_id_fkey | lancamento_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lancamentos_contabeis_empresa_user | btree | empresa_id, user_id | não | sim |  | `CREATE INDEX idx_lancamentos_contabeis_empresa_user ON public.lancamentos_contabeis USING btree (empresa_id, user_id)` |
| lancamentos_contabeis_empresa_data_idx | btree | empresa_id, data_lancamento | não | sim |  | `CREATE INDEX lancamentos_contabeis_empresa_data_idx ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento)` |
| lancamentos_contabeis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lancamentos_contabeis_pkey ON public.lancamentos_contabeis USING btree (id)` |


## Policies (RLS)

### `Lancamentos scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true)))))` |
| WITH CHECK | `((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (ue.ativo = true)))))` |

### `Owner manage lancamentos`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_lancamento_contabil_before_insert | BEFORE | INSERT | ROW | enabled | public.lancamento_contabil_before_insert |
| trg_lancamento_contabil_before_update | BEFORE | UPDATE | ROW | enabled | public.lancamento_contabil_before_update |
| trg_lancamento_estorno_marker | BEFORE | UPDATE | ROW | enabled | public.fn_lancamento_estorno_marker |


## Grants

_nenhum_
