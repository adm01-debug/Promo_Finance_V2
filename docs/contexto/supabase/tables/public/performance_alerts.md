# public.performance_alerts

> Dicionário estrutural de public.performance_alerts (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])); UNIQUE (source, alert_key, alert_hour); CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text, 'weekly_trend'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.mv_performance_alerts_weekly |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.performance_alerts. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `source` | `text` | não |  |  | Dicionário estrutural da coluna source em public.performance_alerts. Papel funcional indicado pelo identificador: source; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (source, alert_key, alert_hour); CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text, 'weekly_trend'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `alert_key` | `text` | não |  |  | Dicionário estrutural da coluna alert_key em public.performance_alerts. Papel funcional indicado pelo identificador: alert_key; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (source, alert_key, alert_hour). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `alert_hour` | `timestamp with time zone` | não | `date_trunc('hour'::text, now())` |  | Dicionário estrutural da coluna alert_hour em public.performance_alerts. Papel funcional indicado pelo identificador: alert_hour; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: date_trunc('hour'::text, now()). Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (source, alert_key, alert_hour). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 5 | `severity` | `text` | não |  |  | Dicionário estrutural da coluna severity em public.performance_alerts. Papel funcional indicado pelo identificador: severity; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `reason` | `text` | não |  |  | Dicionário estrutural da coluna reason em public.performance_alerts. Papel funcional indicado pelo identificador: reason; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `current_value` | `numeric` | não |  |  | Dicionário estrutural da coluna current_value em public.performance_alerts. Papel funcional indicado pelo identificador: current_value; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `baseline_value` | `numeric` | sim |  |  | Dicionário estrutural da coluna baseline_value em public.performance_alerts. Papel funcional indicado pelo identificador: baseline_value; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `ratio` | `numeric` | sim |  |  | Dicionário estrutural da coluna ratio em public.performance_alerts. Papel funcional indicado pelo identificador: ratio; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `sample_count` | `integer` | sim |  |  | Dicionário estrutural da coluna sample_count em public.performance_alerts. Papel funcional indicado pelo identificador: sample_count; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `query_snippet` | `text` | sim |  |  | Dicionário estrutural da coluna query_snippet em public.performance_alerts. Papel funcional indicado pelo identificador: query_snippet; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.performance_alerts. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.performance_alerts. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `resolved_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolved_at em public.performance_alerts. Papel funcional indicado pelo identificador: resolved_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 15 | `resolved_reason` | `text` | sim |  |  | Dicionário estrutural da coluna resolved_reason em public.performance_alerts. Papel funcional indicado pelo identificador: resolved_reason; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| performance_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| performance_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| performance_alerts_source_alert_key_alert_hour_key | UNIQUE | `UNIQUE (source, alert_key, alert_hour)` |  |  | sim |
| performance_alerts_source_check | CHECK | `CHECK (source = ANY (ARRAY['query_telemetry'::text, 'pg_stat_statements'::text, 'cron'::text, 'weekly_trend'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_perf_alerts_created_severity | btree | created_at, severity | não | sim |  | `CREATE INDEX idx_perf_alerts_created_severity ON public.performance_alerts USING btree (created_at DESC, severity)` |
| performance_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX performance_alerts_pkey ON public.performance_alerts USING btree (id)` |
| performance_alerts_source_alert_key_alert_hour_key | btree | source, alert_key, alert_hour | sim | sim |  | `CREATE UNIQUE INDEX performance_alerts_source_alert_key_alert_hour_key ON public.performance_alerts USING btree (source, alert_key, alert_hour)` |


## Policies (RLS)

### `Admins podem ler alertas de performance`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| performance_alerts_notify_trigger | AFTER | INSERT | ROW | enabled | public.notify_performance_alert_trigger |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
