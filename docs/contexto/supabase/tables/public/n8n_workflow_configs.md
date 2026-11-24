# public.n8n_workflow_configs

> Dicionário estrutural de public.n8n_workflow_configs (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL; CHECK (event_type = ANY (ARRAY['driver_approval'::text, 'driver_incident'::text, 'alert_triggered'::text, 'order_status_change'::text, 'route_deviation'::text, 'driver_stopped'::text, 'late_delivery'::text, 'risk_score_high'::text, 'custom'::text])); CHECK (max_risk_score >= 0 AND max_risk_score <= 100); CHECK (min_risk_score >= 0 AND min_risk_score <= 100); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `name` | `text` | não |  |  | Dicionário estrutural da coluna name em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `event_type` | `text` | não |  |  | Dicionário estrutural da coluna event_type em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: event_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (event_type = ANY (ARRAY['driver_approval'::text, 'driver_incident'::text, 'alert_triggered'::text, 'order_status_change'::text, 'route_deviation'::text, 'driver_stopped'::text, 'late_delivery'::text, 'risk_score_high'::text, 'custom'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `webhook_url` | `text` | não |  |  | Dicionário estrutural da coluna webhook_url em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: webhook_url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `enabled` | `boolean` | não | `true` |  | Dicionário estrutural da coluna enabled em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: enabled; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `min_risk_score` | `integer` | não | `0` |  | Dicionário estrutural da coluna min_risk_score em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: min_risk_score; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (min_risk_score >= 0 AND min_risk_score <= 100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `max_risk_score` | `integer` | não | `100` |  | Dicionário estrutural da coluna max_risk_score em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: max_risk_score; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 100. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (max_risk_score >= 0 AND max_risk_score <= 100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `filters` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna filters em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: filters; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `headers` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna headers em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: headers; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `retry_count` | `integer` | não | `3` |  | Dicionário estrutural da coluna retry_count em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: retry_count; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 3. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `timeout_ms` | `integer` | não | `15000` |  | Dicionário estrutural da coluna timeout_ms em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: timeout_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 15000. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.n8n_workflow_configs. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| n8n_workflow_configs_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| n8n_workflow_configs_event_type_check | CHECK | `CHECK (event_type = ANY (ARRAY['driver_approval'::text, 'driver_incident'::text, 'alert_triggered'::text, 'order_status_change'::text, 'route_deviation'::text, 'driver_stopped'::text, 'late_delivery'::text, 'risk_score_high'::text, 'custom'::text]))` |  |  | sim |
| n8n_workflow_configs_max_risk_score_check | CHECK | `CHECK (max_risk_score >= 0 AND max_risk_score <= 100)` |  |  | sim |
| n8n_workflow_configs_min_risk_score_check | CHECK | `CHECK (min_risk_score >= 0 AND min_risk_score <= 100)` |  |  | sim |
| n8n_workflow_configs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.n8n_dispatch_logs | n8n_dispatch_logs_config_id_fkey | config_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_n8n_workflow_configs_created_by | btree | created_by | não | sim | `(created_by IS NOT NULL)` | `CREATE INDEX idx_n8n_workflow_configs_created_by ON public.n8n_workflow_configs USING btree (created_by) WHERE (created_by IS NOT NULL)` |
| n8n_workflow_configs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX n8n_workflow_configs_pkey ON public.n8n_workflow_configs USING btree (id)` |


## Policies (RLS)

### `Admins e managers gerenciam configs n8n`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'manager'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_n8n_cfg_updated | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
