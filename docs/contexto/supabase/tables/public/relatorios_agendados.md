# public.relatorios_agendados

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `nome` | `text` | não |  |  |  |
| 3 | `tipo_relatorio` | `text` | não |  |  |  |
| 4 | `frequencia` | `text` | não |  |  |  |
| 5 | `dia_semana` | `integer` | sim |  |  |  |
| 6 | `dia_mes` | `integer` | sim |  |  |  |
| 7 | `hora_execucao` | `time without time zone` | não | `'08:00:00'::time without time zone` |  |  |
| 8 | `empresa_id` | `uuid` | sim |  |  |  |
| 9 | `centro_custo_id` | `uuid` | sim |  |  |  |
| 10 | `destinatarios` | `text[]` | não | `'{}'::text[]` |  |  |
| 11 | `filtros` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 12 | `ativo` | `boolean` | não | `true` |  |  |
| 13 | `ultimo_envio` | `timestamp with time zone` | sim |  |  |  |
| 14 | `proximo_envio` | `timestamp with time zone` | sim |  |  |  |
| 15 | `created_by` | `uuid` | não | `auth.uid()` |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| relatorios_agendados_dia_mes_check | CHECK | `CHECK (dia_mes IS NULL OR dia_mes >= 1 AND dia_mes <= 31)` |  |  | sim |
| relatorios_agendados_dia_semana_check | CHECK | `CHECK (dia_semana IS NULL OR dia_semana >= 0 AND dia_semana <= 6)` |  |  | sim |
| relatorios_agendados_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| relatorios_agendados_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['diario'::text, 'semanal'::text, 'quinzenal'::text, 'mensal'::text, 'trimestral'::text]))` |  |  | sim |
| relatorios_agendados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.historico_relatorios | historico_relatorios_relatorio_agendado_id_fkey | relatorio_agendado_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_relatorios_agendados_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_relatorios_agendados_empresa_id ON public.relatorios_agendados USING btree (empresa_id)` |
| relatorios_agendados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX relatorios_agendados_pkey ON public.relatorios_agendados USING btree (id)` |


## Policies (RLS)

### `relatorios_agendados_proprios`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| WITH CHECK | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_relat_agend_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
