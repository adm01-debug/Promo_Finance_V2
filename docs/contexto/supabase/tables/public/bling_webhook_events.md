# public.bling_webhook_events

> Dicionário estrutural de public.bling_webhook_events (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (retries >= 0 AND retries <= 50); CHECK (processed = false OR processed_at IS NOT NULL). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.bling_webhook_events. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.bling_webhook_events. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `event_type` | `text` | sim |  |  | Dicionário estrutural da coluna event_type em public.bling_webhook_events. Papel funcional indicado pelo identificador: event_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `payload` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload em public.bling_webhook_events. Papel funcional indicado pelo identificador: payload; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 5 | `processed` | `boolean` | não | `false` |  | Dicionário estrutural da coluna processed em public.bling_webhook_events. Papel funcional indicado pelo identificador: processed; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (processed = false OR processed_at IS NOT NULL). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `processed_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna processed_at em public.bling_webhook_events. Papel funcional indicado pelo identificador: processed_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (processed = false OR processed_at IS NOT NULL). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.bling_webhook_events. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.bling_webhook_events. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `module` | `text` | não |  |  | Dicionário estrutural da coluna module em public.bling_webhook_events. Papel funcional indicado pelo identificador: module; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `resource_id` | `text` | sim |  |  | Dicionário estrutural da coluna resource_id em public.bling_webhook_events. Papel funcional indicado pelo identificador: resource_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `retries` | `integer` | não | `0` |  | Dicionário estrutural da coluna retries em public.bling_webhook_events. Papel funcional indicado pelo identificador: retries; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (retries >= 0 AND retries <= 50). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bling_webhook_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bling_webhook_events_retries_check | CHECK | `CHECK (retries >= 0 AND retries <= 50)` |  |  | sim |
| bling_webhook_processed_coerente | CHECK | `CHECK (processed = false OR processed_at IS NOT NULL)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bling_webhook_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bling_webhook_events_pkey ON public.bling_webhook_events USING btree (id)` |
| idx_bling_webhook_events_created | btree | created_at | não | sim |  | `CREATE INDEX idx_bling_webhook_events_created ON public.bling_webhook_events USING btree (created_at DESC)` |
| idx_bling_webhook_events_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_bling_webhook_events_empresa_id ON public.bling_webhook_events USING btree (empresa_id)` |


## Policies (RLS)

### `bling_webhook_events_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
