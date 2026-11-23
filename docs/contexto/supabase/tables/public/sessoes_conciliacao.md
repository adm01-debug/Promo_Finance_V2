# public.sessoes_conciliacao

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
| 2 | `user_id` | `uuid` | não | `auth.uid()` |  |  |
| 3 | `empresa_id` | `uuid` | sim |  |  |  |
| 4 | `status` | `text` | não | `'aberta'::text` |  |  |
| 5 | `periodo_inicio` | `date` | sim |  |  |  |
| 6 | `periodo_fim` | `date` | sim |  |  |  |
| 7 | `total_conciliados` | `integer` | não | `0` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `conta_bancaria_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sessoes_conciliacao_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| sessoes_conciliacao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.historico_conciliacao_ia | historico_conciliacao_ia_sessao_id_fkey | sessao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sessoes_conciliacao_conta_bancaria_id_fk | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_sessoes_conciliacao_conta_bancaria_id_fk ON public.sessoes_conciliacao USING btree (conta_bancaria_id)` |
| idx_sessoes_conciliacao_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_sessoes_conciliacao_empresa_id ON public.sessoes_conciliacao USING btree (empresa_id)` |
| sessoes_conciliacao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sessoes_conciliacao_pkey ON public.sessoes_conciliacao USING btree (id)` |


## Policies (RLS)

### `Owner manage sessoes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
