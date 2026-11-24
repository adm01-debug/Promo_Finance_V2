# public.contas_pagar

> Contas e obrigações financeiras a pagar. Valores monetários são expressos em reais (BRL), em unidades monetárias, não centavos.

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
| usada por views | public.vw_contas_pagar_painel, public.vw_fluxo_caixa, public.vw_gastos_centro_custo |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID da conta a pagar. |
| 2 | `descricao` | `character varying(255)` | não |  |  | Descrição da obrigação financeira. |
| 3 | `valor` | `numeric(15,2)` | não |  |  | Valor original da conta a pagar, em reais (BRL). O banco exige valor maior ou igual a zero. |
| 4 | `data_vencimento` | `date` | não |  |  | Data de vencimento da obrigação. |
| 5 | `data_pagamento` | `date` | sim |  |  | Data do pagamento, quando realizado. |
| 6 | `status` | `character varying(20)` | sim | `'pendente'::character varying` |  | Situação da conta. O banco permite: pendente, pago, vencido, cancelado ou parcial. Valor padrão: pendente. |
| 7 | `fornecedor_id` | `uuid` | sim |  |  | Identificador opcional do fornecedor; possui chave estrangeira para public.fornecedores(id). |
| 8 | `user_id` | `uuid` | sim |  |  | Identificador opcional do usuário associado; possui chave estrangeira para auth.users(id). |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; valor padrão: now(). |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização; valor padrão: now(). |
| 11 | `empresa_id` | `uuid` | sim |  |  | Identificador da empresa associada; possui chave estrangeira para public.empresas(id). |
| 12 | `categoria_id` | `uuid` | sim |  |  | Identificador opcional da categoria; possui chave estrangeira para public.categorias(id). |
| 13 | `centro_custo_id` | `uuid` | sim |  |  | Identificador opcional do centro de custo; possui chave estrangeira para public.centros_custo(id). |
| 14 | `forma_pagamento` | `text` | sim |  |  | Forma de pagamento registrada como texto. O banco não define uma lista de valores permitidos. |
| 15 | `conta_bancaria_id` | `uuid` | sim |  |  | Identificador opcional da conta bancária utilizada; possui chave estrangeira para public.contas_bancarias(id). |
| 16 | `numero_documento` | `text` | sim |  |  | Número ou referência textual do documento relacionado à obrigação. |
| 17 | `observacoes` | `text` | sim |  |  | Observações livres sobre a conta a pagar. |
| 18 | `valor_pago` | `numeric` | sim |  |  | Valor pago, em reais (BRL). O banco não declara uma restrição de faixa para este campo. |
| 19 | `juros` | `numeric` | sim | `0` |  | Valor de juros associado à conta, em reais (BRL). Valor padrão: 0. |
| 20 | `multa` | `numeric` | sim | `0` |  | Valor de multa associado à conta, em reais (BRL). Valor padrão: 0. |
| 21 | `desconto` | `numeric` | sim | `0` |  | Valor de desconto aplicado à conta, em reais (BRL). Valor padrão: 0. |
| 22 | `recorrente` | `boolean` | sim | `false` |  | Indica se a conta está marcada como recorrente. Valor padrão: false. |
| 23 | `parcela_atual` | `integer` | sim |  |  | Número da parcela atual, quando informado. O banco não define uma faixa permitida. |
| 24 | `total_parcelas` | `integer` | sim |  |  | Quantidade total de parcelas, quando informada. O banco não define uma faixa permitida. |
| 25 | `anexo_url` | `text` | sim |  |  | Endereço textual de um anexo relacionado à conta. |
| 26 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Metadados em JSONB. O banco não especifica um contrato de chaves ou estrutura. Valor padrão: objeto JSON vazio. |
| 27 | `categoria` | `text` | sim |  |  | Categoria registrada como texto. |
| 28 | `fornecedor_nome` | `text` | sim |  |  | Nome do fornecedor registrado como texto. |
| 29 | `categoria_nome` | `text` | sim |  |  | Nome da categoria registrado como texto. |
| 30 | `centro_resultado` | `text` | sim |  |  | Centro de resultado registrado como texto. O banco não define valores permitidos. |
| 31 | `aprovado_por` | `uuid` | sim |  |  | UUID do usuário associado à aprovação; possui chave estrangeira para auth.users(id). |
| 32 | `transacao_conciliada_id` | `uuid` | sim |  |  | Identificador UUID associado a uma transação conciliada. O inventário não mostra chave estrangeira declarada para esta coluna. |
| 33 | `tipo_cobranca` | `text` | sim |  |  | Tipo de cobrança registrado como texto. O banco não define uma lista de valores permitidos. |
| 34 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora associadas à exclusão lógica do registro, quando preenchida. |
| 35 | `tags` | `text[]` | sim | `'{}'::text[]` |  | Lista de etiquetas textuais. O banco não restringe os valores da lista. Valor padrão: array vazio. |
| 36 | `data_emissao` | `date` | sim |  |  | Data de emissão do documento, quando informada. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_contas_pagar_status | CHECK | `CHECK (status::text = ANY (ARRAY['pendente'::text, 'pago'::text, 'vencido'::text, 'cancelado'::text, 'parcial'::text]))` |  |  | sim |
| contas_pagar_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| contas_pagar_categoria_id_fkey | FOREIGN KEY | `FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_centro_custo_id_fkey | FOREIGN KEY | `FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_pagar_fornecedor_id_fkey | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_pagar_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
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
| idx_contas_pagar_categoria | btree | categoria | não | sim |  | `CREATE INDEX idx_contas_pagar_categoria ON public.contas_pagar USING btree (categoria)` |
| idx_contas_pagar_categoria_id_fk | btree | categoria_id | não | sim |  | `CREATE INDEX idx_contas_pagar_categoria_id_fk ON public.contas_pagar USING btree (categoria_id)` |
| idx_contas_pagar_centro_custo_id | btree | centro_custo_id | não | sim |  | `CREATE INDEX idx_contas_pagar_centro_custo_id ON public.contas_pagar USING btree (centro_custo_id)` |
| idx_contas_pagar_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_contas_pagar_conta_bancaria_id ON public.contas_pagar USING btree (conta_bancaria_id)` |
| idx_contas_pagar_data_pagamento | btree | data_pagamento | não | sim | `(data_pagamento IS NOT NULL)` | `CREATE INDEX idx_contas_pagar_data_pagamento ON public.contas_pagar USING btree (data_pagamento) WHERE (data_pagamento IS NOT NULL)` |
| idx_contas_pagar_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_contas_pagar_empresa_id ON public.contas_pagar USING btree (empresa_id)` |
| idx_contas_pagar_empresa_status_venc | btree | empresa_id, status, data_vencimento | não | sim |  | `CREATE INDEX idx_contas_pagar_empresa_status_venc ON public.contas_pagar USING btree (empresa_id, status, data_vencimento)` |
| idx_contas_pagar_fornecedor_id | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_contas_pagar_fornecedor_id ON public.contas_pagar USING btree (fornecedor_id)` |
| idx_contas_pagar_pendentes_venc | btree | empresa_id, data_vencimento | não | sim | `((status)::text = 'pendente'::text)` | `CREATE INDEX idx_contas_pagar_pendentes_venc ON public.contas_pagar USING btree (empresa_id, data_vencimento) WHERE ((status)::text = 'pendente'::text)` |
| idx_contas_pagar_prevent_duplicates | btree | empresa_id, fornecedor_id, valor, data_vencimento, numero_documento | sim | sim | `(((status)::text <> 'cancelado'::text) AND (fornecedor_id IS NOT NULL) AND (numero_documento IS NOT NULL))` | `CREATE UNIQUE INDEX idx_contas_pagar_prevent_duplicates ON public.contas_pagar USING btree (empresa_id, fornecedor_id, valor, data_vencimento, numero_documento) NULLS NOT DISTINCT WHERE (((status)::text <> 'cancelado'::text) AND (fornecedor_id IS NOT NULL) AND (numero_documento IS NOT NULL))` |
| idx_contas_pagar_status | btree | status | não | sim |  | `CREATE INDEX idx_contas_pagar_status ON public.contas_pagar USING btree (status)` |
| idx_contas_pagar_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_contas_pagar_user_created ON public.contas_pagar USING btree (user_id, created_at DESC)` |
| idx_contas_pagar_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_contas_pagar_user_id ON public.contas_pagar USING btree (user_id)` |
| idx_contas_pagar_vencimento | btree | data_vencimento | não | sim |  | `CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar USING btree (data_vencimento)` |
| idx_cp_descricao_gin | gin |  | não | sim |  | `CREATE INDEX idx_cp_descricao_gin ON public.contas_pagar USING gin (to_tsvector('portuguese'::regconfig, (descricao)::text))` |
| idx_cp_fornecedor_status | btree | fornecedor_id, status | não | sim |  | `CREATE INDEX idx_cp_fornecedor_status ON public.contas_pagar USING btree (fornecedor_id, status)` |
| idx_cp_pendentes | btree | data_vencimento | não | sim | `((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('vencida'::character varying)::text]))` | `CREATE INDEX idx_cp_pendentes ON public.contas_pagar USING btree (data_vencimento) WHERE ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('vencida'::character varying)::text]))` |
| idx_cp_status_vencimento | btree | status, data_vencimento | não | sim |  | `CREATE INDEX idx_cp_status_vencimento ON public.contas_pagar USING btree (status, data_vencimento)` |


## Policies (RLS)

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

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
