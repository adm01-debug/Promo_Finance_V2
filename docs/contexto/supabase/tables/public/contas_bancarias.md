# public.contas_bancarias

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
| usada por views | public.vw_contas_pagar_painel, public.vw_contas_receber_painel, public.vw_saldos_contas |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | sim |  |  |  |
| 3 | `banco` | `text` | sim |  |  |  |
| 4 | `agencia` | `text` | sim |  |  |  |
| 5 | `numero_conta` | `text` | sim |  |  |  |
| 6 | `saldo_inicial` | `numeric` | sim | `0` |  |  |
| 7 | `ativo` | `boolean` | sim | `true` |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `configuracoes_conciliacao` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 11 | `saldo_atual` | `numeric` | não | `0` |  |  |
| 12 | `conta` | `text` | sim |  |  |  |
| 13 | `tipo_conta` | `text` | sim | `'corrente'::text` |  |  |
| 14 | `codigo_banco` | `text` | sim | `'000'::text` |  |  |
| 15 | `saldo_disponivel` | `numeric` | sim |  |  |  |
| 16 | `cor` | `text` | sim |  |  |  |
| 17 | `configuracoes_roteamento` | `jsonb` | sim |  |  |  |
| 18 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contas_bancarias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_bancarias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.boletos | boletos_conta_bancaria_id_fkey | conta_bancaria_id | NO ACTION |
| public.conciliacoes | conciliacoes_conta_bancaria_id_fkey | conta_bancaria_id | NO ACTION |
| public.contas_pagar | contas_pagar_conta_bancaria_id_fkey | conta_bancaria_id | SET NULL |
| public.contas_receber | contas_receber_conta_bancaria_id_fkey | conta_bancaria_id | SET NULL |
| public.divergencias_conciliacao | divergencias_conciliacao_conta_bancaria_id_fkey | conta_bancaria_id | SET NULL |
| public.extrato_bancario | extrato_bancario_conta_bancaria_id_fkey | conta_bancaria_id | CASCADE |
| public.logs_conciliacao_retroativa | logs_conciliacao_retroativa_conta_bancaria_id_fkey | conta_bancaria_id | CASCADE |
| public.movimentacoes | movimentacoes_conta_bancaria_id_fkey | conta_bancaria_id | NO ACTION |
| public.regras_roteamento_financeiro | regras_roteamento_financeiro_conta_bancaria_id_fkey | conta_bancaria_id | NO ACTION |
| public.sessoes_conciliacao | sessoes_conciliacao_conta_bancaria_id_fkey | conta_bancaria_id | NO ACTION |
| public.transferencias | transferencias_conta_destino_id_fkey | conta_destino_id | NO ACTION |
| public.transferencias | transferencias_conta_origem_id_fkey | conta_origem_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contas_bancarias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contas_bancarias_pkey ON public.contas_bancarias USING btree (id)` |
| idx_contas_bancarias_empresa_id_fk | btree | empresa_id | não | sim |  | `CREATE INDEX idx_contas_bancarias_empresa_id_fk ON public.contas_bancarias USING btree (empresa_id)` |


## Policies (RLS)

### `Financeiro+ can manage contas`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `contas_bancarias_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_e4fd639d8315ad49b4d1 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
