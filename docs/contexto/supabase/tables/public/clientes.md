# public.clientes

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 10 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_contas_receber_painel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  |  |
| 2 | `nome` | `character varying(255)` | sim |  |  |  |
| 3 | `email` | `character varying(255)` | sim |  |  |  |
| 4 | `telefone` | `character varying(20)` | sim |  |  |  |
| 5 | `cpf_cnpj` | `character varying(20)` | sim |  |  |  |
| 6 | `tipo` | `character varying(2)` | sim | `'PF'::character varying` |  |  |
| 7 | `user_id` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 10 | `razao_social` | `text` | sim |  |  |  |
| 11 | `nome_fantasia` | `text` | sim |  |  |  |
| 12 | `cnpj_cpf` | `text` | sim |  |  |  |
| 13 | `endereco` | `text` | sim |  |  |  |
| 14 | `cidade` | `text` | sim |  |  |  |
| 15 | `estado` | `text` | sim |  |  |  |
| 16 | `contato` | `text` | sim |  |  |  |
| 17 | `limite_credito` | `numeric(14,2)` | sim | `0` |  |  |
| 18 | `ramo_atividade` | `text` | sim |  |  |  |
| 19 | `observacoes` | `text` | sim |  |  |  |
| 20 | `score` | `numeric(5,2)` | sim |  |  |  |
| 21 | `ativo` | `boolean` | sim | `true` |  |  |
| 22 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| clientes_cpf_cnpj_key | UNIQUE | `UNIQUE (cpf_cnpj)` |  |  | sim |
| clientes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| clientes_tipo_check | CHECK | `CHECK (tipo::text = ANY (ARRAY['PF'::character varying::text, 'PJ'::character varying::text]))` |  |  | sim |
| clientes_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.acordos_parcelamento | acordos_parcelamento_cliente_id_fkey | cliente_id | NO ACTION |
| public.asaas_credit_risk_analysis | asaas_credit_risk_analysis_cliente_id_fkey | cliente_id | CASCADE |
| public.contas_receber | contas_receber_cliente_id_fkey | cliente_id | SET NULL |
| public.contratos | contratos_cliente_id_fkey | cliente_id | SET NULL |
| public.fila_cobrancas | fila_cobrancas_cliente_id_fkey | cliente_id | NO ACTION |
| public.historico_cobranca | historico_cobranca_cliente_id_fkey | cliente_id | NO ACTION |
| public.historico_cobranca_whatsapp | historico_cobranca_whatsapp_cliente_id_fkey | cliente_id | NO ACTION |
| public.negativacoes | negativacoes_cliente_id_fkey | cliente_id | NO ACTION |
| public.protestos | protestos_cliente_id_fkey | cliente_id | NO ACTION |
| public.regua_cobranca_status | regua_cobranca_status_cliente_id_fkey | cliente_id | NO ACTION |
| public.whatsapp_conversas | whatsapp_conversas_cliente_id_fkey | cliente_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| clientes_cpf_cnpj_key | btree | cpf_cnpj | sim | sim |  | `CREATE UNIQUE INDEX clientes_cpf_cnpj_key ON public.clientes USING btree (cpf_cnpj)` |
| clientes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX clientes_pkey ON public.clientes USING btree (id)` |
| idx_clientes_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_clientes_user_id_fk ON public.clientes USING btree (user_id)` |


## Policies (RLS)

### `clientes_grupo_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IS NOT NULL) AND (empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))))` |
| WITH CHECK |  |

### `clientes_grupo_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_membro_ativo(empresa_id)` |
| WITH CHECK | `empresa_membro_ativo(empresa_id)` |

### `clientes_owner_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `clientes_owner_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id)))` |

### `clientes_owner_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `clientes_owner_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK | `((( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id) AND ((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id)))` |

### `clientes_tenant_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))` |
| WITH CHECK |  |

### `clientes_tenant_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))` |

### `clientes_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))` |
| WITH CHECK |  |

### `clientes_tenant_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))` |
| WITH CHECK | `((empresa_id IS NULL) OR empresa_membro_ativo(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_0670acdde4e1e38b5669 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
