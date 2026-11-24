# public.alert_configurations

> Dicionário estrutural de public.alert_configurations (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (alert_type, channel); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.alert_configurations. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `alert_type` | `alert_type` | não |  |  | Dicionário estrutural da coluna alert_type em public.alert_configurations. Papel funcional indicado pelo identificador: alert_type; o catálogo não especifica significado adicional. Tipo: alert_type. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: DRIVER_BLOCKED, ROUTE_DEVIATION, DRIVER_STOPPED, LATE_DELIVERY, APPROVAL_REQUIRED, ORDER_CANCELLED. Restrições que envolvem a coluna: UNIQUE (alert_type, channel). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `channel` | `text` | não |  |  | Dicionário estrutural da coluna channel em public.alert_configurations. Papel funcional indicado pelo identificador: channel; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (alert_type, channel). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `is_enabled` | `boolean` | sim | `true` |  | Dicionário estrutural da coluna is_enabled em public.alert_configurations. Papel funcional indicado pelo identificador: is_enabled; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `recipients` | `text[]` | sim | `'{}'::text[]` |  | Dicionário estrutural da coluna recipients em public.alert_configurations. Papel funcional indicado pelo identificador: recipients; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `config` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna config em public.alert_configurations. Papel funcional indicado pelo identificador: config; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.alert_configurations. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.alert_configurations. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `name` | `text` | sim |  |  | Dicionário estrutural da coluna name em public.alert_configurations. Papel funcional indicado pelo identificador: name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `message_template` | `text` | sim |  |  | Dicionário estrutural da coluna message_template em public.alert_configurations. Papel funcional indicado pelo identificador: message_template; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `min_interval_seconds` | `integer` | sim | `300` |  | Dicionário estrutural da coluna min_interval_seconds em public.alert_configurations. Papel funcional indicado pelo identificador: min_interval_seconds; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 300. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `notify_whatsapp` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_whatsapp em public.alert_configurations. Papel funcional indicado pelo identificador: notify_whatsapp; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `whatsapp_numbers` | `text[]` | sim |  |  | Dicionário estrutural da coluna whatsapp_numbers em public.alert_configurations. Papel funcional indicado pelo identificador: whatsapp_numbers; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 14 | `notify_email` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_email em public.alert_configurations. Papel funcional indicado pelo identificador: notify_email; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `email_addresses` | `text[]` | sim |  |  | Dicionário estrutural da coluna email_addresses em public.alert_configurations. Papel funcional indicado pelo identificador: email_addresses; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `notify_slack` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_slack em public.alert_configurations. Papel funcional indicado pelo identificador: notify_slack; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `slack_channels` | `text[]` | sim |  |  | Dicionário estrutural da coluna slack_channels em public.alert_configurations. Papel funcional indicado pelo identificador: slack_channels; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 18 | `notify_sms` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_sms em public.alert_configurations. Papel funcional indicado pelo identificador: notify_sms; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `sms_numbers` | `text[]` | sim |  |  | Dicionário estrutural da coluna sms_numbers em public.alert_configurations. Papel funcional indicado pelo identificador: sms_numbers; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 20 | `notify_bitrix24_task` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_bitrix24_task em public.alert_configurations. Papel funcional indicado pelo identificador: notify_bitrix24_task; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `bitrix24_user_ids` | `integer[]` | sim |  |  | Dicionário estrutural da coluna bitrix24_user_ids em public.alert_configurations. Papel funcional indicado pelo identificador: bitrix24_user_ids; o catálogo não especifica significado adicional. Tipo: integer[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 22 | `notify_n8n_webhook` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna notify_n8n_webhook em public.alert_configurations. Papel funcional indicado pelo identificador: notify_n8n_webhook; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `n8n_webhook_url` | `text` | sim |  |  | Dicionário estrutural da coluna n8n_webhook_url em public.alert_configurations. Papel funcional indicado pelo identificador: n8n_webhook_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 24 | `conditions` | `jsonb` | sim |  |  | Dicionário estrutural da coluna conditions em public.alert_configurations. Papel funcional indicado pelo identificador: conditions; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 25 | `created_by` | `text` | sim |  |  | Dicionário estrutural da coluna created_by em public.alert_configurations. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 26 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.alert_configurations. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alert_configurations_alert_type_channel_key | UNIQUE | `UNIQUE (alert_type, channel)` |  |  | sim |
| alert_configurations_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| alert_configurations_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alert_configurations_alert_type_channel_key | btree | alert_type, channel | sim | sim |  | `CREATE UNIQUE INDEX alert_configurations_alert_type_channel_key ON public.alert_configurations USING btree (alert_type, channel)` |
| alert_configurations_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alert_configurations_pkey ON public.alert_configurations USING btree (id)` |
| idx_alert_configurations_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_alert_configurations_empresa_id ON public.alert_configurations USING btree (empresa_id)` |


## Policies (RLS)

### `alert_configurations_tenant_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_membro_ativo(empresa_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)))` |
| WITH CHECK |  |

### `alert_configurations_tenant_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(empresa_membro_ativo(empresa_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)))` |

### `alert_configurations_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_membro_ativo(empresa_id)` |
| WITH CHECK |  |

### `alert_configurations_tenant_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_membro_ativo(empresa_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'operator'::app_role)))` |
| WITH CHECK | `empresa_membro_ativo(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_alert_configurations_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_default |
| trg_audit_alert_configurations | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |
| update_alert_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
