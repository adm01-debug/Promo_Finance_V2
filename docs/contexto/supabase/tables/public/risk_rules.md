# public.risk_rules

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `name` | `text` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `condition` | `jsonb` | não |  |  |  |
| 5 | `score_impact` | `numeric(4,2)` | não |  |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `empresa_id` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| risk_rules_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| risk_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_risk_rules_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_risk_rules_empresa_id ON public.risk_rules USING btree (empresa_id)` |
| risk_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX risk_rules_pkey ON public.risk_rules USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS habilitado **sem policies**: nenhum acesso via API (anon/authenticated).



## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_audit_risk_rules | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_generic |
| trg_risk_rules_set_empresa | BEFORE | INSERT | ROW | enabled | public.set_empresa_id_default |
| update_risk_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
