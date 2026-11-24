# public.scim_operations_log

> Dicionário estrutural de public.scim_operations_log (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (duration_ms IS NULL OR duration_ms >= 0); CHECK (operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text])); PRIMARY KEY (id); CHECK (resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text])); CHECK (status_code >= 100 AND status_code <= 599). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.scim_operations_log. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `operation` | `text` | não |  |  | Dicionário estrutural da coluna operation em public.scim_operations_log. Papel funcional indicado pelo identificador: operation; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `resource_type` | `text` | sim |  |  | Dicionário estrutural da coluna resource_type em public.scim_operations_log. Papel funcional indicado pelo identificador: resource_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `resource_id` | `text` | sim |  |  | Dicionário estrutural da coluna resource_id em public.scim_operations_log. Papel funcional indicado pelo identificador: resource_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `payload` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload em public.scim_operations_log. Papel funcional indicado pelo identificador: payload; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `status_code` | `integer` | sim |  |  | Dicionário estrutural da coluna status_code em public.scim_operations_log. Papel funcional indicado pelo identificador: status_code; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status_code >= 100 AND status_code <= 599). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.scim_operations_log. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.scim_operations_log. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `token_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna token_id em public.scim_operations_log. Papel funcional indicado pelo identificador: token_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.scim_operations_log. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `external_id` | `text` | sim |  |  | Dicionário estrutural da coluna external_id em public.scim_operations_log. Papel funcional indicado pelo identificador: external_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.scim_operations_log. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `request_body` | `jsonb` | sim |  |  | Dicionário estrutural da coluna request_body em public.scim_operations_log. Papel funcional indicado pelo identificador: request_body; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 14 | `response_body` | `jsonb` | sim |  |  | Dicionário estrutural da coluna response_body em public.scim_operations_log. Papel funcional indicado pelo identificador: response_body; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 15 | `duration_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna duration_ms em public.scim_operations_log. Papel funcional indicado pelo identificador: duration_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (duration_ms IS NULL OR duration_ms >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| scim_operations_log_duration_ms_check | CHECK | `CHECK (duration_ms IS NULL OR duration_ms >= 0)` |  |  | sim |
| scim_operations_log_operation_check | CHECK | `CHECK (operation = ANY (ARRAY['create'::text, 'read'::text, 'list'::text, 'replace'::text, 'patch'::text, 'delete'::text, 'deactivate'::text, 'error'::text]))` |  |  | sim |
| scim_operations_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| scim_operations_log_resource_type_check | CHECK | `CHECK (resource_type = ANY (ARRAY['User'::text, 'Group'::text, 'Schema'::text, 'ResourceType'::text, 'ServiceProviderConfig'::text, 'Bulk'::text]))` |  |  | sim |
| scim_operations_log_status_code_check | CHECK | `CHECK (status_code >= 100 AND status_code <= 599)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_scim_operations_log_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_scim_operations_log_empresa_id ON public.scim_operations_log USING btree (empresa_id)` |
| scim_operations_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX scim_operations_log_pkey ON public.scim_operations_log USING btree (id)` |


## Policies (RLS)

### `Admins view scim logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `scim_operations_log_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
