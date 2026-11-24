# public.bling_sync_logs

> Dicionário estrutural de public.bling_sync_logs (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (char_length(modulo) >= 2 AND char_length(modulo) <= 80); PRIMARY KEY (id); CHECK (registros_com_erro >= 0); CHECK (registros_processados >= 0); CHECK (status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text])); CHECK (tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text])); CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.bling_sync_logs. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.bling_sync_logs. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `entity_type` | `text` | sim |  |  | Dicionário estrutural da coluna entity_type em public.bling_sync_logs. Papel funcional indicado pelo identificador: entity_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `entity_id` | `text` | sim |  |  | Dicionário estrutural da coluna entity_id em public.bling_sync_logs. Papel funcional indicado pelo identificador: entity_id; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `operation` | `text` | sim |  |  | Dicionário estrutural da coluna operation em public.bling_sync_logs. Papel funcional indicado pelo identificador: operation; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não | `'pending'::text` |  | Dicionário estrutural da coluna status em public.bling_sync_logs. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pending'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.bling_sync_logs. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `payload` | `jsonb` | sim |  |  | Dicionário estrutural da coluna payload em public.bling_sync_logs. Papel funcional indicado pelo identificador: payload; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `response` | `jsonb` | sim |  |  | Dicionário estrutural da coluna response em public.bling_sync_logs. Papel funcional indicado pelo identificador: response; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.bling_sync_logs. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.bling_sync_logs. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `modulo` | `text` | não |  |  | Dicionário estrutural da coluna modulo em public.bling_sync_logs. Papel funcional indicado pelo identificador: modulo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(modulo) >= 2 AND char_length(modulo) <= 80). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `registros_processados` | `integer` | não | `0` |  | Dicionário estrutural da coluna registros_processados em public.bling_sync_logs. Papel funcional indicado pelo identificador: registros_processados; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (registros_processados >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 14 | `registros_com_erro` | `integer` | não | `0` |  | Dicionário estrutural da coluna registros_com_erro em public.bling_sync_logs. Papel funcional indicado pelo identificador: registros_com_erro; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (registros_com_erro >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 15 | `detalhes` | `jsonb` | sim |  |  | Dicionário estrutural da coluna detalhes em public.bling_sync_logs. Papel funcional indicado pelo identificador: detalhes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `mensagem_erro` | `text` | sim |  |  | Dicionário estrutural da coluna mensagem_erro em public.bling_sync_logs. Papel funcional indicado pelo identificador: mensagem_erro; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `iniciado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna iniciado_em em public.bling_sync_logs. Papel funcional indicado pelo identificador: iniciado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 18 | `finalizado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna finalizado_em em public.bling_sync_logs. Papel funcional indicado pelo identificador: finalizado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 19 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.bling_sync_logs. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bling_sync_logs_modulo_check | CHECK | `CHECK (char_length(modulo) >= 2 AND char_length(modulo) <= 80)` |  |  | sim |
| bling_sync_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bling_sync_logs_registros_com_erro_check | CHECK | `CHECK (registros_com_erro >= 0)` |  |  | sim |
| bling_sync_logs_registros_processados_check | CHECK | `CHECK (registros_processados >= 0)` |  |  | sim |
| bling_sync_logs_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'executando'::text, 'sucesso'::text, 'erro'::text, 'parcial'::text]))` |  |  | sim |
| bling_sync_logs_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['manual'::text, 'automatica'::text, 'webhook'::text, 'retry'::text]))` |  |  | sim |
| bling_sync_periodo_valido | CHECK | `CHECK (finalizado_em IS NULL OR finalizado_em >= iniciado_em)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bling_sync_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bling_sync_logs_pkey ON public.bling_sync_logs USING btree (id)` |
| idx_bling_sync_logs_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_bling_sync_logs_empresa_id ON public.bling_sync_logs USING btree (empresa_id)` |


## Policies (RLS)

### `bling_sync_logs_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |

### `bling_sync_logs_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'operacional'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
