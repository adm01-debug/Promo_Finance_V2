# public.historico_analises_preditivas

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `tipo_analise` | `text` | sim |  |  |  |
| 5 | `resumo_executivo` | `text` | sim |  |  |  |
| 6 | `alertas_gerados` | `integer` | sim |  |  |  |
| 7 | `score_saude_financeira` | `numeric` | sim |  |  |  |
| 8 | `insights` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 9 | `recomendacoes` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 10 | `modelo_usado` | `text` | sim |  |  |  |
| 11 | `duracao_ms` | `integer` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_analises_preditivas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_analises_preditivas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_analises_preditivas_pkey ON public.historico_analises_preditivas USING btree (id)` |
| idx_historico_analises_preditivas_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_historico_analises_preditivas_empresa_id ON public.historico_analises_preditivas USING btree (empresa_id)` |


## Policies (RLS)

### `Usuários podem inserir próprias análises ou papel elevado`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(((user_id = auth.uid()) OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) AND empresa_acessivel(empresa_id))` |

### `hap_user_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `historico_analises_preditivas_empresa_select`

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
