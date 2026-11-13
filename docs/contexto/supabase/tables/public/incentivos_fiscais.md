# public.incentivos_fiscais

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `nome` | `text` | não |  |  |  |
| 4 | `tipo_incentivo` | `text` | não |  |  |  |
| 5 | `ano_inicio` | `integer` | não |  |  |  |
| 6 | `ano_fim` | `integer` | não |  |  |  |
| 7 | `limite_percentual` | `numeric(5,2)` | não | `0` |  |  |
| 8 | `limite_valor` | `numeric(15,2)` | não | `0` |  |  |
| 9 | `valor_utilizado_ano` | `numeric(15,2)` | não | `0` |  |  |
| 10 | `numero_processo` | `text` | sim |  |  |  |
| 11 | `ato_concessorio` | `text` | sim |  |  |  |
| 12 | `ativo` | `boolean` | não | `true` |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_ano | CHECK | `CHECK (ano_fim >= ano_inicio)` |  |  | sim |
| chk_limite | CHECK | `CHECK (limite_valor >= 0::numeric)` |  |  | sim |
| chk_percentual | CHECK | `CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric)` |  |  | sim |
| chk_utilizado | CHECK | `CHECK (valor_utilizado_ano >= 0::numeric)` |  |  | sim |
| incentivo_periodo_valido | CHECK | `CHECK (ano_fim >= ano_inicio)` |  |  | sim |
| incentivos_fiscais_ano_fim_check | CHECK | `CHECK (ano_fim >= 1990 AND ano_fim <= 2100)` |  |  | sim |
| incentivos_fiscais_ano_inicio_check | CHECK | `CHECK (ano_inicio >= 1990 AND ano_inicio <= 2100)` |  |  | sim |
| incentivos_fiscais_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| incentivos_fiscais_limite_percentual_check | CHECK | `CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric)` |  |  | sim |
| incentivos_fiscais_limite_valor_check | CHECK | `CHECK (limite_valor >= 0::numeric)` |  |  | sim |
| incentivos_fiscais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| incentivos_fiscais_valor_utilizado_ano_check | CHECK | `CHECK (valor_utilizado_ano >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_incentivos_empresa | btree | empresa_id, ativo | não | sim |  | `CREATE INDEX idx_incentivos_empresa ON public.incentivos_fiscais USING btree (empresa_id, ativo)` |
| incentivos_fiscais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX incentivos_fiscais_pkey ON public.incentivos_fiscais USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar incentivos_fiscais`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar incentivos_fiscais`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir incentivos_fiscais`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver incentivos_fiscais`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `admins_all_incentivos_fiscais`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR ((auth.jwt() ->> 'role'::text) = 'anon'::text) OR (((auth.jwt() ->> 'role'::text) = 'authenticated'::text) AND ((( SELECT auth.uid() AS uid))::text = (empresa_id)::text)))` |
| WITH CHECK |  |

### `incentivos_fiscais_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK | `empresa_acessivel(empresa_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_incentivos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
