# public.transacoes_bancarias

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 3 | `data` | `date` | não |  |  |  |
| 4 | `descricao` | `text` | não |  |  |  |
| 5 | `valor` | `numeric` | não |  |  |  |
| 6 | `tipo` | `text` | não |  |  |  |
| 7 | `status` | `text` | não | `'pendente'::text` |  |  |
| 8 | `categoria_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `compensacao_valor` | `numeric` | sim |  |  |  |
| 11 | `compensacao_aceita_por` | `uuid` | sim |  |  |  |
| 12 | `compensacao_aceita_em` | `timestamp with time zone` | sim |  |  |  |
| 13 | `compensacao_regra` | `text` | sim |  |  |  |
| 14 | `compensacao_motivo` | `text` | sim |  |  |  |
| 15 | `conciliada` | `boolean` | sim | `false` |  |  |
| 16 | `compensacao_classificacao` | `text` | sim |  |  |  |
| 17 | `compensacao_evidencia_url` | `text` | sim |  |  |  |
| 18 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `saldo` | `numeric` | sim | `0` |  |  |
| 20 | `regra_id` | `uuid` | sim |  |  |  |
| 21 | `data_confirmacao` | `timestamp with time zone` | sim |  |  |  |
| 22 | `confirmado_por` | `uuid` | sim |  |  |  |
| 23 | `conciliacao_parcial` | `boolean` | sim | `false` |  |  |
| 24 | `valor_conciliado` | `numeric` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transacoes_bancarias_confirmado_por_fkey | FOREIGN KEY | `FOREIGN KEY (confirmado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| transacoes_bancarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| transacoes_bancarias_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES regras_conciliacao(id)` | NO ACTION | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.bloqueios_duplicidade | bloqueios_duplicidade_transacao_id_fkey | transacao_id | SET NULL |
| public.divergencias_conciliacao | divergencias_conciliacao_transacao_id_fkey | transacao_id | NO ACTION |
| public.feedback_conciliacao_ia | feedback_conciliacao_ia_transacao_id_fkey | transacao_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_transacoes_bancarias_confirmado_por_fk | btree | confirmado_por | não | sim |  | `CREATE INDEX idx_transacoes_bancarias_confirmado_por_fk ON public.transacoes_bancarias USING btree (confirmado_por)` |
| transacoes_bancarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transacoes_bancarias_pkey ON public.transacoes_bancarias USING btree (id)` |


## Policies (RLS)

### `transacoes_bancarias_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(conta_bancaria_id IN ( SELECT contas_bancarias.id    FROM contas_bancarias   WHERE (contas_bancarias.empresa_id IN ( SELECT user_empresas.empresa_id            FROM user_empresas           WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
