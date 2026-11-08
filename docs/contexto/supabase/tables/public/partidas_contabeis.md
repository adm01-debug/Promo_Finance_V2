# public.partidas_contabeis

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
| 2 | `lancamento_id` | `uuid` | sim |  |  |  |
| 3 | `conta_contabil_id` | `uuid` | sim |  |  |  |
| 4 | `tipo` | `text` | não |  |  |  |
| 5 | `valor` | `numeric(15,2)` | não |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `empresa_id` | `uuid` | sim |  |  |  |
| 8 | `conta_id` | `uuid` | sim |  |  |  |
| 9 | `historico_complementar` | `text` | sim |  |  |  |
| 10 | `ordem` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| partidas_contabeis_conta_contabil_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_contabil_id) REFERENCES plano_contas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| partidas_contabeis_lancamento_id_fkey | FOREIGN KEY | `FOREIGN KEY (lancamento_id) REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| partidas_contabeis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| partidas_contabeis_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['debito'::text, 'credito'::text]))` |  |  | sim |
| partidas_contabeis_valor_positivo | CHECK | `CHECK (valor > 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_partidas_contabeis_lancamento_id | btree | lancamento_id | não | sim |  | `CREATE INDEX idx_partidas_contabeis_lancamento_id ON public.partidas_contabeis USING btree (lancamento_id)` |
| partidas_contabeis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX partidas_contabeis_pkey ON public.partidas_contabeis USING btree (id)` |


## Policies (RLS)

### `Partidas scoped by lancamento`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM lancamentos_contabeis lc   WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM lancamentos_contabeis lc   WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_normalizar_tipo_partida | BEFORE | INSERT OR UPDATE | ROW | enabled | public.normalizar_tipo_partida |
| trg_validar_partidas_dobradas | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.validar_partidas_dobradas |


## Grants

_nenhum_
