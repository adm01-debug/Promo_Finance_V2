# public.frontend_error_alert_state

> Dicionário estrutural de public.frontend_error_alert_state (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0); CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text])); PRIMARY KEY (id); UNIQUE (signature). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `signature` | `text` | não |  |  | Dicionário estrutural da coluna signature em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: signature; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (signature). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `first_seen` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna first_seen em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: first_seen; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 4 | `last_seen` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_seen em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: last_seen; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 5 | `count` | `integer` | sim | `1` |  | Dicionário estrutural da coluna count em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: count; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 1. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `alerted` | `boolean` | sim | `false` |  | Dicionário estrutural da coluna alerted em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: alerted; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `silenced_until` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna silenced_until em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: silenced_until; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `assinatura` | `text` | não |  |  | Dicionário estrutural da coluna assinatura em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: assinatura; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `severity` | `text` | não | `'error'::text` |  | Dicionário estrutural da coluna severity em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: severity; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'error'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `exemplo_mensagem` | `text` | sim |  |  | Dicionário estrutural da coluna exemplo_mensagem em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: exemplo_mensagem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `primeiro_alerta_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna primeiro_alerta_em em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: primeiro_alerta_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `ultimo_alerta_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna ultimo_alerta_em em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: ultimo_alerta_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `ocorrencias_no_ultimo_alerta` | `integer` | não | `0` |  | Dicionário estrutural da coluna ocorrencias_no_ultimo_alerta em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: ocorrencias_no_ultimo_alerta; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 15 | `alertas_enviados` | `integer` | não | `0` |  | Dicionário estrutural da coluna alertas_enviados em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: alertas_enviados; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 16 | `silenciado_ate` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna silenciado_ate em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: silenciado_ate; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 17 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.frontend_error_alert_state. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fe_alert_state_bounds_chk | CHECK | `CHECK (length(assinatura) <= 200 AND length(COALESCE(exemplo_mensagem, ''::text)) <= 2000 AND ocorrencias_no_ultimo_alerta >= 0 AND alertas_enviados >= 0)` |  |  | sim |
| fe_alert_state_severity_chk | CHECK | `CHECK (severity = ANY (ARRAY['error'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| frontend_error_alert_state_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| frontend_error_alert_state_signature_key | UNIQUE | `UNIQUE (signature)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| frontend_error_alert_state_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_alert_state_pkey ON public.frontend_error_alert_state USING btree (id)` |
| frontend_error_alert_state_signature_key | btree | signature | sim | sim |  | `CREATE UNIQUE INDEX frontend_error_alert_state_signature_key ON public.frontend_error_alert_state USING btree (signature)` |
| uq_frontend_error_alert_state_assinatura | btree | assinatura | sim | sim |  | `CREATE UNIQUE INDEX uq_frontend_error_alert_state_assinatura ON public.frontend_error_alert_state USING btree (assinatura)` |


## Policies (RLS)

### `fe_alert_state_admin_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_fe_alert_state_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
