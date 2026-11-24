# public.frontend_error_logs_2026_08

> Dicionário estrutural de public.frontend_error_logs_2026_08 (tabela). Chave primária declarada: id, created_at. Restrições declaradas no catálogo: PRIMARY KEY (id, created_at); CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384); CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id, created_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `error_message` | `text` | sim |  |  | Dicionário estrutural da coluna error_message em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: error_message; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `error_stack` | `text` | sim |  |  | Dicionário estrutural da coluna error_stack em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: error_stack; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `url` | `text` | sim |  |  | Dicionário estrutural da coluna url em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: url; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `user_agent` | `text` | sim |  |  | Dicionário estrutural da coluna user_agent em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: user_agent; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id, created_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `severity` | `text` | não | `'error'::text` |  | Dicionário estrutural da coluna severity em public.frontend_error_logs_2026_08. Papel funcional indicado pelo identificador: severity; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'error'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| frontend_error_logs_2026_08_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |
| frontend_error_logs_payload_bounds | CHECK | `CHECK (length(COALESCE(error_message, ''::text)) <= 2000 AND length(COALESCE(error_stack, ''::text)) <= 8000 AND length(COALESCE(url, ''::text)) <= 2000 AND length(COALESCE(user_agent, ''::text)) <= 500 AND pg_column_size(COALESCE(metadata, '{}'::jsonb)) <= 16384)` |  |  | sim |
| frontend_error_logs_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_logs_2026_08_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_logs_2026_08_pkey ON public.frontend_error_logs_2026_08 USING btree (id, created_at)` |


## Policies (RLS)

### `admin_only_frontend_error_logs_2026_08`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
