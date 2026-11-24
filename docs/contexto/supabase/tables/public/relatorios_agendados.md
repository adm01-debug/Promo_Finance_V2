# public.relatorios_agendados

> Dicionário estrutural de public.relatorios_agendados (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (dia_mes IS NULL OR dia_mes >= 1 AND dia_mes <= 31); CHECK (dia_semana IS NULL OR dia_semana >= 0 AND dia_semana <= 6); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (frequencia = ANY (ARRAY['diario'::text, 'semanal'::text, 'quinzenal'::text, 'mensal'::text, 'trimestral'::text])); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: Configurações de relatórios recorrentes por empresa, incluindo frequência, horário, destinatários e filtros. Horários sem fuso são interpretados como hora local de America/Sao_Paulo.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.relatorios_agendados. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador UUID do agendamento. |
| 2 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.relatorios_agendados. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Nome descritivo do agendamento. |
| 3 | `tipo_relatorio` | `text` | não |  |  | Dicionário estrutural da coluna tipo_relatorio em public.relatorios_agendados. Papel funcional indicado pelo identificador: tipo_relatorio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador textual do tipo de relatório. O banco não restringe os valores permitidos. |
| 4 | `frequencia` | `text` | não |  |  | Dicionário estrutural da coluna frequencia em public.relatorios_agendados. Papel funcional indicado pelo identificador: frequencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (frequencia = ANY (ARRAY['diario'::text, 'semanal'::text, 'quinzenal'::text, 'mensal'::text, 'trimestral'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Frequência do agendamento. O banco permite: diario, semanal, quinzenal, mensal ou trimestral. |
| 5 | `dia_semana` | `integer` | sim |  |  | Dicionário estrutural da coluna dia_semana em public.relatorios_agendados. Papel funcional indicado pelo identificador: dia_semana; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (dia_semana IS NULL OR dia_semana >= 0 AND dia_semana <= 6). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: Dia da semana usado pelo agendamento semanal, se aplicável. O banco restringe o valor ao intervalo de 0 a 6; o mapeamento de cada número para um dia não é definido por essa restrição. |
| 6 | `dia_mes` | `integer` | sim |  |  | Dicionário estrutural da coluna dia_mes em public.relatorios_agendados. Papel funcional indicado pelo identificador: dia_mes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (dia_mes IS NULL OR dia_mes >= 1 AND dia_mes <= 31). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: Dia do mês usado pelo agendamento mensal, se aplicável. O banco restringe o valor ao intervalo de 1 a 31. |
| 7 | `hora_execucao` | `time without time zone` | não | `'08:00:00'::time without time zone` |  | Dicionário estrutural da coluna hora_execucao em public.relatorios_agendados. Papel funcional indicado pelo identificador: hora_execucao; o catálogo não especifica significado adicional. Tipo: time without time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '08:00:00'::time without time zone. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Horário local previsto para executar o relatório, sem informação de fuso na coluna. Regra funcional acordada: interpretar em America/Sao_Paulo. Valor padrão: 08:00:00. |
| 8 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.relatorios_agendados. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador UUID da empresa associada ao agendamento; possui referência declarada à tabela public.empresas. |
| 9 | `centro_custo_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna centro_custo_id em public.relatorios_agendados. Papel funcional indicado pelo identificador: centro_custo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador UUID opcional de centro de custo. O inventário não encontrou chave estrangeira declarada para esta coluna. |
| 10 | `destinatarios` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna destinatarios em public.relatorios_agendados. Papel funcional indicado pelo identificador: destinatarios; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: Lista textual de destinatários do relatório. O formato dos elementos não é validado pelo banco. |
| 11 | `filtros` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna filtros em public.relatorios_agendados. Papel funcional indicado pelo identificador: filtros; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: Filtros adicionais em JSONB. A estrutura e as chaves permitidas não são especificadas pelo banco. |
| 12 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.relatorios_agendados. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Indica se o agendamento está ativo. |
| 13 | `ultimo_envio` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna ultimo_envio em public.relatorios_agendados. Papel funcional indicado pelo identificador: ultimo_envio; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: Instante registrado do envio mais recente; armazenado como timestamp com fuso. |
| 14 | `proximo_envio` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna proximo_envio em public.relatorios_agendados. Papel funcional indicado pelo identificador: proximo_envio; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: Instante previsto para o próximo envio; armazenado como timestamp com fuso. |
| 15 | `created_by` | `uuid` | não | `auth.uid()` |  | Dicionário estrutural da coluna created_by em public.relatorios_agendados. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: UUID do usuário associado à criação; o valor padrão é auth.uid(). |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.relatorios_agendados. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: Data e hora de criação do registro; valor padrão: now(). |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.relatorios_agendados. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: Data e hora da última atualização; valor padrão: now(). |


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
