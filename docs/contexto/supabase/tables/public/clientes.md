# public.clientes

> Dicionário estrutural de public.clientes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (cpf_cnpj); PRIMARY KEY (id); CHECK (tipo::text = ANY (ARRAY['PF'::character varying::text, 'PJ'::character varying::text])); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 11 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.vw_contas_receber_painel |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Dicionário estrutural da coluna id em public.clientes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: uuid_generate_v4(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `nome` | `character varying(255)` | sim |  |  | Dicionário estrutural da coluna nome em public.clientes. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: character varying(255). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `email` | `character varying(255)` | sim |  |  | Dicionário estrutural da coluna email em public.clientes. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: character varying(255). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `telefone` | `character varying(20)` | sim |  |  | Dicionário estrutural da coluna telefone em public.clientes. Papel funcional indicado pelo identificador: telefone; o catálogo não especifica significado adicional. Tipo: character varying(20). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `cpf_cnpj` | `character varying(20)` | sim |  |  | Dicionário estrutural da coluna cpf_cnpj em public.clientes. Papel funcional indicado pelo identificador: cpf_cnpj; o catálogo não especifica significado adicional. Tipo: character varying(20). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (cpf_cnpj). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `tipo` | `character varying(2)` | sim | `'PF'::character varying` |  | Dicionário estrutural da coluna tipo em public.clientes. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: character varying(2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'PF'::character varying. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo::text = ANY (ARRAY['PF'::character varying::text, 'PJ'::character varying::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.clientes. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.clientes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.clientes. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `razao_social` | `text` | sim |  |  | Dicionário estrutural da coluna razao_social em public.clientes. Papel funcional indicado pelo identificador: razao_social; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `nome_fantasia` | `text` | sim |  |  | Dicionário estrutural da coluna nome_fantasia em public.clientes. Papel funcional indicado pelo identificador: nome_fantasia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `cnpj_cpf` | `text` | sim |  |  | Dicionário estrutural da coluna cnpj_cpf em public.clientes. Papel funcional indicado pelo identificador: cnpj_cpf; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `endereco` | `text` | sim |  |  | Dicionário estrutural da coluna endereco em public.clientes. Papel funcional indicado pelo identificador: endereco; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `cidade` | `text` | sim |  |  | Dicionário estrutural da coluna cidade em public.clientes. Papel funcional indicado pelo identificador: cidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `estado` | `text` | sim |  |  | Dicionário estrutural da coluna estado em public.clientes. Papel funcional indicado pelo identificador: estado; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `contato` | `text` | sim |  |  | Dicionário estrutural da coluna contato em public.clientes. Papel funcional indicado pelo identificador: contato; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `limite_credito` | `numeric(14,2)` | sim | `0` |  | Dicionário estrutural da coluna limite_credito em public.clientes. Papel funcional indicado pelo identificador: limite_credito; o catálogo não especifica significado adicional. Tipo: numeric(14,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `ramo_atividade` | `text` | sim |  |  | Dicionário estrutural da coluna ramo_atividade em public.clientes. Papel funcional indicado pelo identificador: ramo_atividade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.clientes. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `score` | `numeric(5,2)` | sim |  |  | Dicionário estrutural da coluna score em public.clientes. Papel funcional indicado pelo identificador: score; o catálogo não especifica significado adicional. Tipo: numeric(5,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `ativo` | `boolean` | sim | `true` |  | Dicionário estrutural da coluna ativo em public.clientes. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.clientes. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `bitrix_contact_id` | `text` | sim |  |  | Dicionário estrutural da coluna bitrix_contact_id em public.clientes. Papel funcional indicado pelo identificador: bitrix_contact_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `bitrix_company_id` | `text` | sim |  |  | Dicionário estrutural da coluna bitrix_company_id em public.clientes. Papel funcional indicado pelo identificador: bitrix_company_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


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
| public.execucoes_cobranca | execucoes_cobranca_cliente_id_fkey | cliente_id | NO ACTION |
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
| idx_clientes_ativo | btree | ativo | não | sim |  | `CREATE INDEX idx_clientes_ativo ON public.clientes USING btree (ativo)` |
| idx_clientes_bitrix_company_id | btree | bitrix_company_id | não | sim | `(bitrix_company_id IS NOT NULL)` | `CREATE INDEX idx_clientes_bitrix_company_id ON public.clientes USING btree (bitrix_company_id) WHERE (bitrix_company_id IS NOT NULL)` |
| idx_clientes_bitrix_contact_id | btree | bitrix_contact_id | não | sim | `(bitrix_contact_id IS NOT NULL)` | `CREATE INDEX idx_clientes_bitrix_contact_id ON public.clientes USING btree (bitrix_contact_id) WHERE (bitrix_contact_id IS NOT NULL)` |
| idx_clientes_empresa_id_fk | btree | empresa_id | não | sim |  | `CREATE INDEX idx_clientes_empresa_id_fk ON public.clientes USING btree (empresa_id)` |
| idx_clientes_nome | btree | nome | não | sim |  | `CREATE INDEX idx_clientes_nome ON public.clientes USING btree (nome)` |
| idx_clientes_ramo_atividade | btree | ramo_atividade | não | sim |  | `CREATE INDEX idx_clientes_ramo_atividade ON public.clientes USING btree (ramo_atividade)` |
| idx_clientes_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_clientes_user_id ON public.clientes USING btree (user_id)` |


## Policies (RLS)

### `Operacional+ can manage clientes`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_membro_ativo(empresa_id))` |

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
