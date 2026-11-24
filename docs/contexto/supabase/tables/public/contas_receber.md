# public.contas_receber

> Contas e títulos financeiros a receber. Valores monetários são expressos em reais (BRL), em unidades monetárias, não centavos.

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
| usada por views | public.vw_contas_receber_painel, public.vw_dso_aging, public.vw_fluxo_caixa, public.vw_metricas_cobranca |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Identificador UUID da conta a receber. |
| 2 | `descricao` | `character varying(255)` | não |  |  | Descrição do valor ou título a receber. |
| 3 | `valor` | `numeric(15,2)` | não |  |  | Valor original da conta a receber, em reais (BRL). O banco exige valor maior ou igual a zero. |
| 4 | `data_vencimento` | `date` | não |  |  | Data de vencimento do recebível. |
| 5 | `data_recebimento` | `date` | sim |  |  | Data do recebimento, quando realizado. |
| 6 | `status` | `character varying(20)` | sim | `'pendente'::character varying` |  | Situação da conta. O banco permite: pendente, recebido, pago, vencido, cancelado, parcial, atrasado ou em_acordo. Valor padrão: pendente. O status em_acordo identifica conta vinculada a acordo de parcelamento ativo e excluída da régua de cobrança automática enquanto durar o acordo. |
| 7 | `cliente_id` | `uuid` | sim |  |  | Identificador opcional do cliente; possui chave estrangeira para public.clientes(id). |
| 8 | `user_id` | `uuid` | sim |  |  | Identificador opcional do usuário associado; possui chave estrangeira para auth.users(id). |
| 9 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro; valor padrão: now(). |
| 10 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização; valor padrão: now(). |
| 11 | `empresa_id` | `uuid` | sim |  |  | Identificador da empresa associada; possui chave estrangeira para public.empresas(id). |
| 12 | `categoria_id` | `uuid` | sim |  |  | Identificador opcional da categoria; possui chave estrangeira para public.categorias(id). |
| 13 | `centro_custo_id` | `uuid` | sim |  |  | Identificador opcional do centro de custo; possui chave estrangeira para public.centros_custo(id). |
| 14 | `forma_recebimento` | `text` | sim |  |  | Forma de recebimento registrada como texto. O banco não define uma lista de valores permitidos. |
| 15 | `conta_bancaria_id` | `uuid` | sim |  |  | Identificador opcional da conta bancária associada; possui chave estrangeira para public.contas_bancarias(id). |
| 16 | `numero_documento` | `text` | sim |  |  | Número ou referência textual do documento relacionado ao recebível. |
| 17 | `observacoes` | `text` | sim |  |  | Observações livres sobre a conta a receber. |
| 18 | `valor_recebido` | `numeric` | sim |  |  | Valor recebido, em reais (BRL). O banco não declara uma restrição de faixa para este campo. |
| 19 | `juros` | `numeric` | sim | `0` |  | Valor de juros associado ao recebível, em reais (BRL). Valor padrão: 0. |
| 20 | `multa` | `numeric` | sim | `0` |  | Valor de multa associado ao recebível, em reais (BRL). Valor padrão: 0. |
| 21 | `desconto` | `numeric` | sim | `0` |  | Valor de desconto associado ao recebível, em reais (BRL). Valor padrão: 0. |
| 22 | `recorrente` | `boolean` | sim | `false` |  | Indica se o recebível está marcado como recorrente. Valor padrão: false. |
| 23 | `parcela_atual` | `integer` | sim |  |  | Número da parcela atual, quando informado. O banco não define uma faixa permitida. |
| 24 | `total_parcelas` | `integer` | sim |  |  | Quantidade total de parcelas, quando informada. O banco não define uma faixa permitida. |
| 25 | `anexo_url` | `text` | sim |  |  | Endereço textual de um anexo relacionado ao recebível. |
| 26 | `score` | `numeric` | sim |  |  | Pontuação associada ao recebível. A escala e o significado do score não são especificados pelo banco. |
| 27 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Metadados em JSONB. O banco não especifica um contrato de chaves ou estrutura. Valor padrão: objeto JSON vazio. |
| 28 | `cliente_nome` | `text` | sim |  |  | Nome do cliente registrado como texto. |
| 29 | `etapa_cobranca` | `text` | sim |  |  | Etapa de cobrança registrada como texto. O banco não define valores permitidos. |
| 30 | `tipo_cobranca` | `text` | sim |  |  | Tipo de cobrança registrado como texto. O banco não define valores permitidos. |
| 31 | `numero_parcela_atual` | `integer` | sim |  |  | Número da parcela atual, quando informado. O banco não define uma faixa permitida. |
| 32 | `valor_desconto` | `numeric(15,2)` | sim | `0` |  | Valor do desconto registrado, em reais (BRL). Valor padrão: 0. |
| 33 | `chave_pix` | `text` | sim |  |  | Chave Pix registrada como texto. O banco não valida o formato ou os tipos permitidos. |
| 34 | `data_emissao` | `date` | sim | `CURRENT_DATE` |  | Data de emissão do recebível; valor padrão: CURRENT_DATE. |
| 35 | `categoria_nome` | `text` | sim |  |  | Nome da categoria registrado como texto. |
| 36 | `transacao_conciliada_id` | `uuid` | sim |  |  | Identificador UUID associado a uma transação conciliada. O inventário não mostra chave estrangeira declarada para esta coluna. |
| 37 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora associadas à exclusão lógica do registro, quando preenchida. |
| 38 | `vendedor_id` | `uuid` | sim |  |  | Identificador UUID associado a um vendedor. O inventário não mostra chave estrangeira declarada para esta coluna. |
| 39 | `bitrix_deal_id` | `text` | sim |  |  | Identificador textual de negócio associado ao Bitrix. |
| 40 | `valor_final` | `numeric(15,2)` | sim |  |  | Valor final do recebível, em reais (BRL). A composição deste valor não é definida por uma restrição do banco. |
| 41 | `codigo_barras` | `text` | sim |  |  | Código de barras relacionado ao título, quando informado. |
| 42 | `link_boleto` | `text` | sim |  |  | Endereço textual do boleto relacionado ao recebível, quando informado. |
| 43 | `frequencia_recorrencia` | `text` | sim |  |  | Frequência da recorrência. Se preenchido, o banco permite: semanal, quinzenal, mensal, bimestral, trimestral, semestral ou anual. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contas_receber_categoria_id_fkey | FOREIGN KEY | `FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_receber_centro_custo_id_fkey | FOREIGN KEY | `FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_receber_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_receber_conta_bancaria_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_bancaria_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contas_receber_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_receber_frequencia_recorrencia_check | CHECK | `CHECK (frequencia_recorrencia IS NULL OR (frequencia_recorrencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])))` |  |  | sim |
| contas_receber_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contas_receber_status_check | CHECK | `CHECK (status::text = ANY (ARRAY['pendente'::character varying, 'recebido'::character varying, 'pago'::character varying, 'vencido'::character varying, 'cancelado'::character varying, 'parcial'::character varying, 'atrasado'::character varying, 'em_acordo'::character varying]::text[]))` |  |  | sim |
| contas_receber_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| contas_receber_valor_check | CHECK | `CHECK (valor >= 0::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.asaas_reconciliation_suggestions | asaas_reconciliation_suggestions_contas_receber_id_fkey | contas_receber_id | NO ACTION |
| public.execucoes_regua_cobranca | execucoes_regua_cobranca_conta_receber_id_fkey | conta_receber_id | CASCADE |
| public.fila_cobrancas | fila_cobrancas_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.historico_cobranca | historico_cobranca_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.historico_conciliacao_ia | historico_conciliacao_ia_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.negativacoes | negativacoes_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.protestos | protestos_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.regua_cobranca_status | regua_cobranca_status_conta_receber_id_fkey | conta_receber_id | NO ACTION |
| public.regua_cobranca_status | regua_cobranca_status_titulo_id_fkey | titulo_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contas_receber_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contas_receber_pkey ON public.contas_receber USING btree (id)` |
| idx_contas_receber_categoria_id | btree | categoria_id | não | sim |  | `CREATE INDEX idx_contas_receber_categoria_id ON public.contas_receber USING btree (categoria_id)` |
| idx_contas_receber_centro_custo_id | btree | centro_custo_id | não | sim |  | `CREATE INDEX idx_contas_receber_centro_custo_id ON public.contas_receber USING btree (centro_custo_id)` |
| idx_contas_receber_cliente_id | btree | cliente_id | não | sim |  | `CREATE INDEX idx_contas_receber_cliente_id ON public.contas_receber USING btree (cliente_id)` |
| idx_contas_receber_conta_bancaria_id | btree | conta_bancaria_id | não | sim |  | `CREATE INDEX idx_contas_receber_conta_bancaria_id ON public.contas_receber USING btree (conta_bancaria_id)` |
| idx_contas_receber_data_recebimento | btree | data_recebimento | não | sim | `(data_recebimento IS NOT NULL)` | `CREATE INDEX idx_contas_receber_data_recebimento ON public.contas_receber USING btree (data_recebimento) WHERE (data_recebimento IS NOT NULL)` |
| idx_contas_receber_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_contas_receber_empresa_id ON public.contas_receber USING btree (empresa_id)` |
| idx_contas_receber_empresa_status_venc | btree | empresa_id, status, data_vencimento | não | sim |  | `CREATE INDEX idx_contas_receber_empresa_status_venc ON public.contas_receber USING btree (empresa_id, status, data_vencimento)` |
| idx_contas_receber_pendentes_venc | btree | empresa_id, data_vencimento | não | sim | `((status)::text = 'pendente'::text)` | `CREATE INDEX idx_contas_receber_pendentes_venc ON public.contas_receber USING btree (empresa_id, data_vencimento) WHERE ((status)::text = 'pendente'::text)` |
| idx_contas_receber_prevent_duplicates | btree | empresa_id, cliente_id, valor, data_vencimento, numero_documento | sim | sim | `(((status)::text <> 'cancelado'::text) AND (cliente_id IS NOT NULL) AND (numero_documento IS NOT NULL))` | `CREATE UNIQUE INDEX idx_contas_receber_prevent_duplicates ON public.contas_receber USING btree (empresa_id, cliente_id, valor, data_vencimento, numero_documento) NULLS NOT DISTINCT WHERE (((status)::text <> 'cancelado'::text) AND (cliente_id IS NOT NULL) AND (numero_documento IS NOT NULL))` |
| idx_contas_receber_status | btree | status | não | sim |  | `CREATE INDEX idx_contas_receber_status ON public.contas_receber USING btree (status)` |
| idx_contas_receber_transacao_conciliada_id_fk | btree | transacao_conciliada_id | não | sim |  | `CREATE INDEX idx_contas_receber_transacao_conciliada_id_fk ON public.contas_receber USING btree (transacao_conciliada_id)` |
| idx_contas_receber_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_contas_receber_user_created ON public.contas_receber USING btree (user_id, created_at DESC)` |
| idx_contas_receber_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_contas_receber_user_id ON public.contas_receber USING btree (user_id)` |
| idx_contas_receber_vencimento | btree | data_vencimento | não | sim |  | `CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber USING btree (data_vencimento)` |
| idx_contas_receber_vendedor_id | btree | vendedor_id | não | sim |  | `CREATE INDEX idx_contas_receber_vendedor_id ON public.contas_receber USING btree (vendedor_id)` |
| idx_cr_cliente_status | btree | cliente_id, status | não | sim |  | `CREATE INDEX idx_cr_cliente_status ON public.contas_receber USING btree (cliente_id, status)` |
| idx_cr_descricao_gin | gin |  | não | sim |  | `CREATE INDEX idx_cr_descricao_gin ON public.contas_receber USING gin (to_tsvector('portuguese'::regconfig, (descricao)::text))` |
| idx_cr_pendentes | btree | data_vencimento | não | sim | `((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('vencida'::character varying)::text]))` | `CREATE INDEX idx_cr_pendentes ON public.contas_receber USING btree (data_vencimento) WHERE ((status)::text = ANY (ARRAY[('pendente'::character varying)::text, ('vencida'::character varying)::text]))` |
| idx_cr_status_vencimento | btree | status, data_vencimento | não | sim |  | `CREATE INDEX idx_cr_status_vencimento ON public.contas_receber USING btree (status, data_vencimento)` |


## Policies (RLS)

### `contas_receber_empresa_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true))))` |
| WITH CHECK |  |

### `contas_receber_tenant_rw`

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
| set_updated_at_f4f31d38308fe5dff30a | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_anexos_sync_empresa | AFTER | UPDATE | ROW | enabled | private.sincroniza_empresa_dos_anexos |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
