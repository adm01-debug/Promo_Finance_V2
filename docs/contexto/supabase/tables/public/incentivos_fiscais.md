# public.incentivos_fiscais

> Dicionário estrutural de public.incentivos_fiscais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (ano_fim >= ano_inicio); CHECK (limite_valor >= 0::numeric); CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric); CHECK (valor_utilizado_ano >= 0::numeric); CHECK (ano_fim >= ano_inicio); CHECK (ano_fim >= 1990 AND ano_fim <= 2100); CHECK (ano_inicio >= 1990 AND ano_inicio <= 2100); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric); CHECK (limite_valor >= 0::numeric); PRIMARY KEY (id); CHECK (valor_utilizado_ano >= 0::numeric). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.incentivos_fiscais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.incentivos_fiscais. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.incentivos_fiscais. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `tipo_incentivo` | `text` | não |  |  | Dicionário estrutural da coluna tipo_incentivo em public.incentivos_fiscais. Papel funcional indicado pelo identificador: tipo_incentivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `ano_inicio` | `integer` | não |  |  | Dicionário estrutural da coluna ano_inicio em public.incentivos_fiscais. Papel funcional indicado pelo identificador: ano_inicio; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ano_fim >= ano_inicio); CHECK (ano_fim >= ano_inicio); CHECK (ano_inicio >= 1990 AND ano_inicio <= 2100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `ano_fim` | `integer` | não |  |  | Dicionário estrutural da coluna ano_fim em public.incentivos_fiscais. Papel funcional indicado pelo identificador: ano_fim; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ano_fim >= ano_inicio); CHECK (ano_fim >= ano_inicio); CHECK (ano_fim >= 1990 AND ano_fim <= 2100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `limite_percentual` | `numeric(5,2)` | não | `0` |  | Dicionário estrutural da coluna limite_percentual em public.incentivos_fiscais. Papel funcional indicado pelo identificador: limite_percentual; o catálogo não especifica significado adicional. Tipo: numeric(5,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric); CHECK (limite_percentual >= 0::numeric AND limite_percentual <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `limite_valor` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna limite_valor em public.incentivos_fiscais. Papel funcional indicado pelo identificador: limite_valor; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (limite_valor >= 0::numeric); CHECK (limite_valor >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `valor_utilizado_ano` | `numeric(15,2)` | não | `0` |  | Dicionário estrutural da coluna valor_utilizado_ano em public.incentivos_fiscais. Papel funcional indicado pelo identificador: valor_utilizado_ano; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor_utilizado_ano >= 0::numeric); CHECK (valor_utilizado_ano >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `numero_processo` | `text` | sim |  |  | Dicionário estrutural da coluna numero_processo em public.incentivos_fiscais. Papel funcional indicado pelo identificador: numero_processo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `ato_concessorio` | `text` | sim |  |  | Dicionário estrutural da coluna ato_concessorio em public.incentivos_fiscais. Papel funcional indicado pelo identificador: ato_concessorio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.incentivos_fiscais. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.incentivos_fiscais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.incentivos_fiscais. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 15 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.incentivos_fiscais. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


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


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_incentivos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
