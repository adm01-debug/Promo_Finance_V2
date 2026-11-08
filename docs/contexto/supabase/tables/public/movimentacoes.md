# public.movimentacoes

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
| usada por views | public.vw_fluxo_caixa |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `data_movimentacao` | `timestamp with time zone` | sim | `now()` |  |  |
| 4 | `valor` | `numeric` | não | `0` |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `tipo` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 10 | `transferencia_id` | `uuid` | sim |  |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |
| 12 | `origem` | `text` | sim | `'manual'::text` |  |  |
| 13 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 14 | `conta_receber_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| movimentacoes_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id)` | NO ACTION | NO ACTION | sim |
| movimentacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| movimentacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| movimentacoes_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['entrada'::text, 'saida'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| movimentacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX movimentacoes_pkey ON public.movimentacoes USING btree (id)` |


## Policies (RLS)

### `Access by empresa_id`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_anexos_sync_empresa | AFTER | UPDATE | ROW | enabled | private.sincroniza_empresa_dos_anexos |
| trg_movimentacao_origem_guard | BEFORE | INSERT OR UPDATE | ROW | enabled | public.fn_movimentacao_origem_guard |
| trg_saldo_movimentacao | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.fn_saldo_movimentacao |
| trg_sync_valor_pago | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.fn_sync_valor_pago_movimentacao |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
