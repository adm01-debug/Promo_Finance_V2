# public.asaas_credit_risk_analysis

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `cliente_id` | `uuid` | não |  |  |  |
| 3 | `score_risco` | `integer` | não |  |  |  |
| 4 | `faixa_risco` | `text` | não |  |  |  |
| 5 | `recomendacao` | `text` | sim |  |  |  |
| 6 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| asaas_credit_risk_analysis_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| asaas_credit_risk_analysis_faixa_risco_check | CHECK | `CHECK (faixa_risco = ANY (ARRAY['BAIXO'::text, 'MEDIO'::text, 'ALTO'::text]))` |  |  | sim |
| asaas_credit_risk_analysis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| asaas_credit_risk_analysis_score_risco_check | CHECK | `CHECK (score_risco >= 0 AND score_risco <= 1000)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| asaas_credit_risk_analysis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX asaas_credit_risk_analysis_pkey ON public.asaas_credit_risk_analysis USING btree (id)` |


## Policies (RLS)

### `Users can view credit risk analysis of their customers`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(cliente_id IN ( SELECT clientes.id    FROM clientes   WHERE empresa_acessivel(clientes.empresa_id)))` |
| WITH CHECK |  |

### `credit_risk_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM clientes c   WHERE ((c.id = asaas_credit_risk_analysis.cliente_id) AND empresa_acessivel(c.empresa_id))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
