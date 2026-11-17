# public.lancamentos_contabeis

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
| idx_lanc_emp_data | btree | empresa_id, data_lancamento | não | sim |  | `CREATE INDEX idx_lanc_emp_data ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento DESC)` |
| idx_lanc_origem | btree | origem, origem_id | não | sim |  | `CREATE INDEX idx_lanc_origem ON public.lancamentos_contabeis USING btree (origem, origem_id)` |
| idx_lancamentos_contabeis_empresa_user | btree | empresa_id, user_id | não | sim |  | `CREATE INDEX idx_lancamentos_contabeis_empresa_user ON public.lancamentos_contabeis USING btree (empresa_id, user_id)` |
| idx_lancamentos_contabeis_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_lancamentos_contabeis_user_id_fk ON public.lancamentos_contabeis USING btree (user_id)` |
| lancamentos_contabeis_empresa_comp_idx | btree | empresa_id, competencia | não | sim |  | `CREATE INDEX lancamentos_contabeis_empresa_comp_idx ON public.lancamentos_contabeis USING btree (empresa_id, competencia)` |
| lancamentos_contabeis_empresa_data_idx | btree | empresa_id, data_lancamento | não | sim |  | `CREATE INDEX lancamentos_contabeis_empresa_data_idx ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento)` |
| lancamentos_contabeis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lancamentos_contabeis_pkey ON public.lancamentos_contabeis USING btree (id)` |


## Policies (RLS)

### `Lancamentos scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND (ue.ativo = true))))))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND (ue.ativo = true))))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_lancamento_contabil_before_insert | BEFORE | INSERT | ROW | enabled | public.lancamento_contabil_before_insert |
| trg_lancamento_contabil_before_update | BEFORE | UPDATE | ROW | enabled | public.lancamento_contabil_before_update |
| trg_lancamento_estorno_marker | BEFORE | UPDATE | ROW | enabled | public.fn_lancamento_estorno_marker |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
