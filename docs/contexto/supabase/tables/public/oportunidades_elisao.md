# public.oportunidades_elisao

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `estrategia_id` | `uuid` | sim |  |  |  |
| 4 | `titulo` | `text` | não |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `economia_estimada` | `numeric` | não | `0` |  |  |
| 7 | `economia_percentual` | `numeric` | sim |  |  |  |
| 8 | `status` | `text` | não | `'identificada'::text` |  |  |
| 9 | `prazo_estimado` | `text` | sim |  |  |  |
| 10 | `prioridade` | `text` | sim | `'media'::text` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `estrategia` | `text` | sim |  |  |  |
| 14 | `categoria` | `text` | sim |  |  |  |
| 15 | `aplicavel` | `boolean` | não | `true` |  |  |
| 16 | `motivo_nao_aplicavel` | `text` | sim |  |  |  |
| 17 | `economia_10anos_estimada` | `numeric(15,2)` | sim |  |  |  |
| 18 | `custo_implementacao` | `numeric(15,2)` | sim |  |  |  |
| 19 | `roi_pct` | `numeric(9,2)` | sim |  |  |  |
| 20 | `payback_meses` | `numeric(7,2)` | sim |  |  |  |
| 21 | `base_legal` | `text` | sim |  |  |  |
| 22 | `risco` | `text` | sim |  |  |  |
| 23 | `observacoes` | `text` | sim |  |  |  |
| 24 | `inputs_utilizados` | `jsonb` | sim |  |  |  |
| 25 | `memoria_calculo` | `text` | sim |  |  |  |
| 26 | `status_alterado_em` | `timestamp with time zone` | sim |  |  |  |
| 27 | `status_alterado_por` | `uuid` | sim |  |  |  |
| 28 | `data_identificacao` | `date` | não | `CURRENT_DATE` |  |  |
| 29 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| oportunidades_elisao_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| oportunidades_elisao_estrategia_id_fkey | FOREIGN KEY | `FOREIGN KEY (estrategia_id) REFERENCES estrategias_elisao_catalogo(id)` | NO ACTION | NO ACTION | sim |
| oportunidades_elisao_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| oportunidades_elisao_status_check | CHECK | `CHECK (status = ANY (ARRAY['identificada'::text, 'em_analise'::text, 'aprovada'::text, 'em_execucao'::text, 'implementada'::text, 'descartada'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_oportunidades_elisao_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_oportunidades_elisao_empresa_id ON public.oportunidades_elisao USING btree (empresa_id)` |
| idx_oportunidades_elisao_estrategia_id_fk | btree | estrategia_id | não | sim |  | `CREATE INDEX idx_oportunidades_elisao_estrategia_id_fk ON public.oportunidades_elisao USING btree (estrategia_id)` |
| oportunidades_elisao_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX oportunidades_elisao_pkey ON public.oportunidades_elisao USING btree (id)` |


## Policies (RLS)

### `Admin/financeiro can delete oportunidades elisao`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Admin/financeiro can update oportunidades elisao`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Authorized roles can insert oportunidades elisao`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Authorized roles can view oportunidades elisao`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role, 'visualizador'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_oport_elisao_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
