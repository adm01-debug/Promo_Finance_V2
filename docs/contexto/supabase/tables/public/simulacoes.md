# public.simulacoes

> Dicionário estrutural de public.simulacoes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (carga_tributaria_recomendada IS NULL OR carga_tributaria_recomendada >= 0::numeric AND carga_tributaria_recomendada <= 2::numeric); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; CHECK (periodo_fim >= periodo_inicio); PRIMARY KEY (id); CHECK (tempo_execucao_ms IS NULL OR tempo_execucao_ms >= 0). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.simulacoes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.simulacoes. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.simulacoes. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `parametros` | `jsonb` | não |  |  | Dicionário estrutural da coluna parametros em public.simulacoes. Papel funcional indicado pelo identificador: parametros; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 5 | `resultado` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado em public.simulacoes. Papel funcional indicado pelo identificador: resultado; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `status` | `text` | não | `'pendente'::text` |  | Dicionário estrutural da coluna status em public.simulacoes. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'pendente'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_by` | `uuid` | sim |  |  | Dicionário estrutural da coluna created_by em public.simulacoes. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.simulacoes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.simulacoes. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `periodo_inicio` | `date` | não |  |  | Dicionário estrutural da coluna periodo_inicio em public.simulacoes. Papel funcional indicado pelo identificador: periodo_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (periodo_fim >= periodo_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `periodo_fim` | `date` | não |  |  | Dicionário estrutural da coluna periodo_fim em public.simulacoes. Papel funcional indicado pelo identificador: periodo_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (periodo_fim >= periodo_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `inputs` | `jsonb` | não |  |  | Dicionário estrutural da coluna inputs em public.simulacoes. Papel funcional indicado pelo identificador: inputs; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 13 | `hash_inputs` | `text` | não |  |  | Dicionário estrutural da coluna hash_inputs em public.simulacoes. Papel funcional indicado pelo identificador: hash_inputs; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `resultado_simples` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado_simples em public.simulacoes. Papel funcional indicado pelo identificador: resultado_simples; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 15 | `resultado_presumido` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado_presumido em public.simulacoes. Papel funcional indicado pelo identificador: resultado_presumido; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `resultado_real` | `jsonb` | sim |  |  | Dicionário estrutural da coluna resultado_real em public.simulacoes. Papel funcional indicado pelo identificador: resultado_real; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 17 | `regime_recomendado` | `regime_tributario_enum` | sim |  |  | Dicionário estrutural da coluna regime_recomendado em public.simulacoes. Papel funcional indicado pelo identificador: regime_recomendado; o catálogo não especifica significado adicional. Tipo: regime_tributario_enum. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: MEI, SIMPLES, PRESUMIDO, REAL, ARBITRADO. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `economia_anual_estimada` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna economia_anual_estimada em public.simulacoes. Papel funcional indicado pelo identificador: economia_anual_estimada; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `carga_tributaria_recomendada` | `numeric(7,4)` | sim |  |  | Dicionário estrutural da coluna carga_tributaria_recomendada em public.simulacoes. Papel funcional indicado pelo identificador: carga_tributaria_recomendada; o catálogo não especifica significado adicional. Tipo: numeric(7,4). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (carga_tributaria_recomendada IS NULL OR carga_tributaria_recomendada >= 0::numeric AND carga_tributaria_recomendada <= 2::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `motivo_recomendacao` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_recomendacao em public.simulacoes. Papel funcional indicado pelo identificador: motivo_recomendacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `base_legal_decisao` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal_decisao em public.simulacoes. Papel funcional indicado pelo identificador: base_legal_decisao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `versao_motor` | `text` | não | `'3.9.0'::text` |  | Dicionário estrutural da coluna versao_motor em public.simulacoes. Papel funcional indicado pelo identificador: versao_motor; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '3.9.0'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 23 | `tempo_execucao_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna tempo_execucao_ms em public.simulacoes. Papel funcional indicado pelo identificador: tempo_execucao_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tempo_execucao_ms IS NULL OR tempo_execucao_ms >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 24 | `executada_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna executada_por em public.simulacoes. Papel funcional indicado pelo identificador: executada_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| simulacoes_carga_chk | CHECK | `CHECK (carga_tributaria_recomendada IS NULL OR carga_tributaria_recomendada >= 0::numeric AND carga_tributaria_recomendada <= 2::numeric)` |  |  | sim |
| simulacoes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| simulacoes_periodo_chk | CHECK | `CHECK (periodo_fim >= periodo_inicio)` |  |  | sim |
| simulacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| simulacoes_tempo_execucao_ms_check | CHECK | `CHECK (tempo_execucao_ms IS NULL OR tempo_execucao_ms >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sim_empresa_data | btree | empresa_id, created_at | não | sim |  | `CREATE INDEX idx_sim_empresa_data ON public.simulacoes USING btree (empresa_id, created_at DESC)` |
| simulacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX simulacoes_pkey ON public.simulacoes USING btree (id)` |


## Policies (RLS)

### `simulacoes_acesso`

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
| trg_simulacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
