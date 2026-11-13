# public.anomalias_detectadas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `tipo` | `text` | não |  |  |  |
| 3 | `descricao` | `text` | sim |  |  |  |
| 4 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 5 | `prioridade` | `text` | sim | `'media'::text` |  |  |
| 6 | `user_id` | `uuid` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `entidade_tipo` | `text` | sim |  |  |  |
| 10 | `entidade_id` | `uuid` | sim |  |  |  |
| 11 | `tipo_anomalia` | `text` | sim |  |  |  |
| 12 | `severidade` | `text` | sim | `'media'::text` |  |  |
| 13 | `titulo` | `text` | sim |  |  |  |
| 14 | `centro_custo_id` | `uuid` | sim |  |  |  |
| 15 | `centro_custo_nome` | `text` | sim |  |  |  |
| 16 | `valor_envolvido` | `numeric` | sim |  |  |  |
| 17 | `score_confianca` | `numeric` | sim |  |  |  |
| 18 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 19 | `revisado_por` | `uuid` | sim |  |  |  |
| 20 | `revisado_em` | `timestamp with time zone` | sim |  |  |  |
| 21 | `resolucao` | `text` | sim |  |  |  |
| 22 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 23 | `dados` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 24 | `detectada_em` | `timestamp with time zone` | sim | `now()` |  |  |
| 25 | `resolvida_em` | `timestamp with time zone` | sim |  |  |  |
| 26 | `resolvida_por` | `uuid` | sim |  |  |  |
| 27 | `observacoes` | `text` | sim |  |  |  |
| 28 | `bitrix_task_id` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anomalias_detectadas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| anomalias_detectadas_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.anomalia_toast_eventos | anomalia_toast_eventos_anomalia_id_fkey | anomalia_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anomalias_detectadas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anomalias_detectadas_pkey ON public.anomalias_detectadas USING btree (id)` |
| idx_anomalias_detectadas_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_anomalias_detectadas_empresa_id ON public.anomalias_detectadas USING btree (empresa_id)` |
| idx_anomalias_detectadas_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_anomalias_detectadas_user_id_fk ON public.anomalias_detectadas USING btree (user_id)` |


## Policies (RLS)

### `anomalias_detectadas_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `anomalias_detectadas_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_f7bd4a317caf2651584f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
