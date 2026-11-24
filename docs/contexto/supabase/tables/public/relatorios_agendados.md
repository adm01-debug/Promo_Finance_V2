# public.relatorios_agendados

> Configurações de relatórios recorrentes por empresa, incluindo frequência, horário, destinatários e filtros. Horários sem fuso são interpretados como hora local de America/Sao_Paulo.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID do agendamento. |
| 2 | `nome` | `text` | não |  |  | Nome descritivo do agendamento. |
| 3 | `tipo_relatorio` | `text` | não |  |  | Identificador textual do tipo de relatório. O banco não restringe os valores permitidos. |
| 4 | `frequencia` | `text` | não |  |  | Frequência do agendamento. O banco permite: diario, semanal, quinzenal, mensal ou trimestral. |
| 5 | `dia_semana` | `integer` | sim |  |  | Dia da semana usado pelo agendamento semanal, se aplicável. O banco restringe o valor ao intervalo de 0 a 6; o mapeamento de cada número para um dia não é definido por essa restrição. |
| 6 | `dia_mes` | `integer` | sim |  |  | Dia do mês usado pelo agendamento mensal, se aplicável. O banco restringe o valor ao intervalo de 1 a 31. |
| 7 | `hora_execucao` | `time without time zone` | não | `'08:00:00'::time without time zone` |  | Horário local previsto para executar o relatório, sem informação de fuso na coluna. Regra funcional acordada: interpretar em America/Sao_Paulo. Valor padrão: 08:00:00. |
| 8 | `empresa_id` | `uuid` | sim |  |  | Identificador UUID da empresa associada ao agendamento; possui referência declarada à tabela public.empresas. |
| 9 | `centro_custo_id` | `uuid` | sim |  |  | Identificador UUID opcional de centro de custo. O inventário não encontrou chave estrangeira declarada para esta coluna. |
| 10 | `destinatarios` | `text[]` | não | `'{}'::text[]` |  | Lista textual de destinatários do relatório. O formato dos elementos não é validado pelo banco. |
| 11 | `filtros` | `jsonb` | não | `'{}'::jsonb` |  | Filtros adicionais em JSONB. A estrutura e as chaves permitidas não são especificadas pelo banco. |
| 12 | `ativo` | `boolean` | não | `true` |  | Indica se o agendamento está ativo. |
| 13 | `ultimo_envio` | `timestamp with time zone` | sim |  |  | Instante registrado do envio mais recente; armazenado como timestamp com fuso. |
| 14 | `proximo_envio` | `timestamp with time zone` | sim |  |  | Instante previsto para o próximo envio; armazenado como timestamp com fuso. |
| 15 | `created_by` | `uuid` | não | `auth.uid()` |  | UUID do usuário associado à criação; o valor padrão é auth.uid(). |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  | Data e hora de criação do registro; valor padrão: now(). |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Data e hora da última atualização; valor padrão: now(). |


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

### `Users can delete own scheduled reports or elevated`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((created_by = auth.uid()) OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Users can update own scheduled reports or elevated`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((created_by = auth.uid()) OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(((created_by = auth.uid()) OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) AND empresa_acessivel(empresa_id))` |

### `Users can view own scheduled reports or elevated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((created_by = auth.uid()) OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role])) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `relatorios_agendados_proprios`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_relat_agend_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
