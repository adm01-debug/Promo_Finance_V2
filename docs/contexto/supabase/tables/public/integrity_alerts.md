# public.integrity_alerts

> Dicionário estrutural de public.integrity_alerts (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe'::text, 'nfe_sefaz'::text, 'tributario'::text])); UNIQUE (domain, invariant, alert_hour); PRIMARY KEY (id); CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.integrity_alerts. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `domain` | `text` | não |  |  | Dicionário estrutural da coluna domain em public.integrity_alerts. Papel funcional indicado pelo identificador: domain; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe'::text, 'nfe_sefaz'::text, 'tributario'::text])); UNIQUE (domain, invariant, alert_hour). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `invariant` | `text` | não |  |  | Dicionário estrutural da coluna invariant em public.integrity_alerts. Papel funcional indicado pelo identificador: invariant; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (domain, invariant, alert_hour). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `severity` | `text` | não |  |  | Dicionário estrutural da coluna severity em public.integrity_alerts. Papel funcional indicado pelo identificador: severity; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `alert_hour` | `timestamp with time zone` | não | `date_trunc('hour'::text, now())` |  | Dicionário estrutural da coluna alert_hour em public.integrity_alerts. Papel funcional indicado pelo identificador: alert_hour; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: date_trunc('hour'::text, now()). Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (domain, invariant, alert_hour). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `affected_count` | `bigint` | não | `0` |  | Dicionário estrutural da coluna affected_count em public.integrity_alerts. Papel funcional indicado pelo identificador: affected_count; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `reason` | `text` | não |  |  | Dicionário estrutural da coluna reason em public.integrity_alerts. Papel funcional indicado pelo identificador: reason; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `sample_ids` | `uuid[]` | sim | `'{}'::uuid[]` |  | Dicionário estrutural da coluna sample_ids em public.integrity_alerts. Papel funcional indicado pelo identificador: sample_ids; o catálogo não especifica significado adicional. Tipo: uuid[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::uuid[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  | Dicionário estrutural da coluna metadata em public.integrity_alerts. Papel funcional indicado pelo identificador: metadata; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna resolved_at em public.integrity_alerts. Papel funcional indicado pelo identificador: resolved_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `resolved_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna resolved_by em public.integrity_alerts. Papel funcional indicado pelo identificador: resolved_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.integrity_alerts. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.integrity_alerts. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `resolved_reason` | `text` | sim |  |  | Dicionário estrutural da coluna resolved_reason em public.integrity_alerts. Papel funcional indicado pelo identificador: resolved_reason; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| integrity_alerts_domain_check | CHECK | `CHECK (domain = ANY (ARRAY['entrega'::text, 'screening'::text, 'financeiro'::text, 'nfe'::text, 'nfe_sefaz'::text, 'tributario'::text]))` |  |  | sim |
| integrity_alerts_domain_invariant_alert_hour_key | UNIQUE | `UNIQUE (domain, invariant, alert_hour)` |  |  | sim |
| integrity_alerts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| integrity_alerts_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_integrity_alerts_domain | btree | domain, severity, created_at | não | sim |  | `CREATE INDEX idx_integrity_alerts_domain ON public.integrity_alerts USING btree (domain, severity, created_at DESC)` |
| idx_integrity_alerts_open | btree | created_at | não | sim | `(resolved_at IS NULL)` | `CREATE INDEX idx_integrity_alerts_open ON public.integrity_alerts USING btree (created_at DESC) WHERE (resolved_at IS NULL)` |
| integrity_alerts_domain_invariant_alert_hour_key | btree | domain, invariant, alert_hour | sim | sim |  | `CREATE UNIQUE INDEX integrity_alerts_domain_invariant_alert_hour_key ON public.integrity_alerts USING btree (domain, invariant, alert_hour)` |
| integrity_alerts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX integrity_alerts_pkey ON public.integrity_alerts USING btree (id)` |


## Policies (RLS)

### `integrity_alerts_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `integrity_alerts_service_all`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_integrity_alerts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
