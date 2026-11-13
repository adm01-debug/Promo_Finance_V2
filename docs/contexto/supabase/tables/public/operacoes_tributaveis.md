# public.operacoes_tributaveis

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `data_operacao` | `date` | sim |  |  |  |
| 4 | `valor_total` | `numeric` | sim |  |  |  |
| 5 | `cbs_aliquota` | `numeric` | sim |  |  |  |
| 6 | `cbs_valor` | `numeric` | sim |  |  |  |
| 7 | `ibs_aliquota` | `numeric` | sim |  |  |  |
| 8 | `ibs_valor` | `numeric` | sim |  |  |  |
| 9 | `tipo_operacao` | `text` | sim |  |  |  |
| 10 | `status` | `text` | sim | `'pendente'::text` |  |  |
| 11 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `is_valor` | `numeric` | sim | `0` |  |  |
| 13 | `cbs_credito` | `numeric` | sim | `0` |  |  |
| 14 | `ibs_credito` | `numeric` | sim | `0` |  |  |
| 15 | `icms_valor` | `numeric` | sim | `0` |  |  |
| 16 | `iss_valor` | `numeric` | sim | `0` |  |  |
| 17 | `pis_valor` | `numeric` | sim | `0` |  |  |
| 18 | `cofins_valor` | `numeric` | sim | `0` |  |  |
| 19 | `documento_tipo` | `character varying(20)` | sim |  |  |  |
| 20 | `documento_serie` | `character varying(10)` | sim |  |  |  |
| 21 | `cliente_id` | `uuid` | sim |  |  |  |
| 22 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 23 | `municipio_origem` | `character varying(10)` | sim |  |  |  |
| 24 | `municipio_destino` | `character varying(10)` | sim |  |  |  |
| 25 | `uf_origem` | `character varying(2)` | sim |  |  |  |
| 26 | `uf_destino` | `character varying(2)` | sim |  |  |  |
| 27 | `cnpj_cpf_contraparte` | `character varying(20)` | sim |  |  |  |
| 28 | `cfop` | `character varying(10)` | sim |  |  |  |
| 29 | `ncm` | `character varying(20)` | sim |  |  |  |
| 30 | `nota_fiscal_id` | `uuid` | sim |  |  |  |
| 31 | `valor_operacao` | `numeric` | sim | `0` |  |  |
| 32 | `valor_desconto` | `numeric` | sim | `0` |  |  |
| 33 | `valor_frete` | `numeric` | sim | `0` |  |  |
| 34 | `base_calculo` | `numeric` | sim | `0` |  |  |
| 35 | `is_categoria` | `character varying(50)` | sim |  |  |  |
| 36 | `is_aliquota` | `numeric` | sim | `0` |  |  |
| 37 | `icms_aliquota` | `numeric` | sim | `0` |  |  |
| 38 | `iss_aliquota` | `numeric` | sim | `0` |  |  |
| 39 | `pis_aliquota` | `numeric` | sim | `0` |  |  |
| 40 | `cofins_aliquota` | `numeric` | sim | `0` |  |  |
| 41 | `regime_especial` | `character varying(50)` | sim |  |  |  |
| 42 | `reducao_aliquota` | `numeric` | sim | `0` |  |  |
| 43 | `isento` | `boolean` | sim | `false` |  |  |
| 44 | `motivo_isencao` | `text` | sim |  |  |  |
| 45 | `split_payment` | `boolean` | sim | `false` |  |  |
| 46 | `split_payment_valor` | `numeric` | sim | `0` |  |  |
| 47 | `competencia` | `date` | sim |  |  |  |
| 48 | `apuracao_id` | `uuid` | sim |  |  |  |
| 49 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 50 | `documento_numero` | `character varying(50)` | sim |  |  |  |
| 51 | `nome_contraparte` | `character varying(200)` | sim |  |  |  |
| 52 | `documento_chave` | `text` | sim |  |  |  |
| 53 | `erro_mensagem` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| operacoes_tributaveis_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| operacoes_tributaveis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_operacoes_tributaveis_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_operacoes_tributaveis_empresa_id ON public.operacoes_tributaveis USING btree (empresa_id)` |
| operacoes_tributaveis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX operacoes_tributaveis_pkey ON public.operacoes_tributaveis USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar operacoes_tributaveis`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar operacoes_tributaveis`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir operacoes_tributaveis`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver operacoes_tributaveis`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `operacoes_tributaveis_empresa_select`

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
