# public.contas_pagar

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
| usada por views | public.vw_contas_pagar_painel, public.vw_gastos_centro_custo |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `descricao` | `character varying(255)` | não |  |  |  |
| 3 | `valor` | `numeric(15,2)` | não |  |  |  |
| 4 | `data_vencimento` | `date` | não |  |  |  |
| 5 | `data_pagamento` | `date` | sim |  |  |  |
| 6 | `status` | `character varying(20)` | sim | `'pendente'::character varying` |  |  |
| 7 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `empresa_id` | `uuid` | sim |  |  |  |
| 12 | `categoria_id` | `uuid` | sim |  |  |  |
| 13 | `centro_custo_id` | `uuid` | sim |  |  |  |
| 14 | `forma_pagamento` | `text` | sim |  |  |  |
| 15 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 16 | `numero_documento` | `text` | sim |  |  |  |
| 17 | `observacoes` | `text` | sim |  |  |  |
| 18 | `valor_pago` | `numeric` | sim |  |  |  |
| 19 | `juros` | `numeric` | sim | `0` |  |  |
| 20 | `multa` | `numeric` | sim | `0` |  |  |
| 21 | `desconto` | `numeric` | sim | `0` |  |  |
| 22 | `recorrente` | `boolean` | sim | `false` |  |  |
| 23 | `parcela_atual` | `integer` | sim |  |  |  |
| 24 | `total_parcelas` | `integer` | sim |  |  |  |
| 25 | `anexo_url` | `text` | sim |  |  |  |
| 26 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 27 | `categoria` | `text` | sim |  |  |  |
| 28 | `fornecedor_nome` | `text` | sim |  |  |  |
| 29 | `categoria_nome` | `text` | sim |  |  |  |
| 30 | `centro_resultado` | `text` | sim |  |  |  |
| 31 | `aprovado_por` | `uuid` | sim |  |  |  |
| 32 | `transacao_conciliada_id` | `uuid` | sim |  |  |  |
| 33 | `tipo_cobranca` | `text` | sim |  |  |  |
| 34 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_contas_pagar_status | CHECK | `CHECK (status::text = ANY (ARRAY['pendente'::character varying::text, 'pago'::character varying::text, 'vencido'::character varying::text, 'cancelado'::character varying::text, 'parcial'::character varying::text]))` |  |  | sim |
| contas_pagar_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| contas_pagar_categoria_id_fkey | FOREIGN KEY | `FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_centro_custo_id_fkey | FOREIGN KEY | `FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_pagar_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contas_pagar_status_check | CHECK | `CHECK (status::text = ANY (ARRAY['pendente'::character varying::text, 'pago'::character varying::text, 'atrasado'::character varying::text, 'cancelado'::character varying::text]))` |  |  | sim |
| contas_pagar_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_pagar_valor_check | CHECK | `CHECK (valor >= 0::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.asaas_reconciliation_suggestions | asaas_reconciliation_suggestions_contas_pagar_id_fkey | contas_pagar_id | NO ACTION |
| public.boletos | boletos_conta_pagar_id_fkey | conta_pagar_id | NO ACTION |
| public.nfe_recebidas | nfe_recebidas_conta_pagar_id_fkey | conta_pagar_id | SET NULL |
| public.solicitacoes_aprovacao | solicitacoes_aprovacao_conta_pagar_id_fkey | conta_pagar_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contas_pagar_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contas_pagar_pkey ON public.contas_pagar USING btree (id)` |
| idx_contas_pagar_aprovado_por_fk | btree | aprovado_por | não | sim |  | `CREATE INDEX idx_contas_pagar_aprovado_por_fk ON public.contas_pagar USING btree (aprovado_por)` |
| idx_contas_pagar_categoria_id_fk | btree | categoria_id | não | sim |  | `CREATE INDEX idx_contas_pagar_categoria_id_fk ON public.contas_pagar USING btree (categoria_id)` |
| idx_contas_pagar_data_pagamento | btree | data_pagamento | não | sim | `(data_pagamento IS NOT NULL)` | `CREATE INDEX idx_contas_pagar_data_pagamento ON public.contas_pagar USING btree (data_pagamento) WHERE (data_pagamento IS NOT NULL)` |
| idx_contas_pagar_empresa_status_venc | btree | empresa_id, status, data_vencimento | não | sim |  | `CREATE INDEX idx_contas_pagar_empresa_status_venc ON public.contas_pagar USING btree (empresa_id, status, data_vencimento)` |
| idx_contas_pagar_fornecedor_id_fk | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_contas_pagar_fornecedor_id_fk ON public.contas_pagar USING btree (fornecedor_id)` |
| idx_contas_pagar_pendentes_venc | btree | empresa_id, data_vencimento | não | sim | `((status)::text = 'pendente'::text)` | `CREATE INDEX idx_contas_pagar_pendentes_venc ON public.contas_pagar USING btree (empresa_id, data_vencimento) WHERE ((status)::text = 'pendente'::text)` |
| idx_contas_pagar_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_contas_pagar_user_created ON public.contas_pagar USING btree (user_id, created_at DESC)` |


## Policies (RLS)

### `Admins can manage contas pagar`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |

### `contas_pagar_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `contas_pagar_tenant_rw`

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
| set_updated_at_891eba3b06036ba9ea7e | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_anexos_sync_empresa | AFTER | UPDATE | ROW | enabled | private.sincroniza_empresa_dos_anexos |


## Grants

_nenhum_
