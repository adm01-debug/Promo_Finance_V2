# public.historico_relatorios

> Dicionário estrutural de public.historico_relatorios (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (duracao_ms IS NULL OR duracao_ms >= 0); PRIMARY KEY (id); FOREIGN KEY (relatorio_agendado_id) REFERENCES relatorios_agendados(id) ON DELETE CASCADE; CHECK (status = ANY (ARRAY['sucesso'::text, 'erro'::text, 'parcial'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: Registros das execuções dos relatórios agendados, incluindo resultado, duração e eventual mensagem de erro.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.historico_relatorios. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador UUID da execução registrada. |
| 2 | `relatorio_agendado_id` | `uuid` | não |  |  | Dicionário estrutural da coluna relatorio_agendado_id em public.historico_relatorios. Papel funcional indicado pelo identificador: relatorio_agendado_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (relatorio_agendado_id) REFERENCES relatorios_agendados(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Identificador do agendamento executado; possui chave estrangeira para public.relatorios_agendados(id). |
| 3 | `status` | `text` | não | `'sucesso'::text` |  | Dicionário estrutural da coluna status em public.historico_relatorios. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'sucesso'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['sucesso'::text, 'erro'::text, 'parcial'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Resultado da execução. O banco permite: sucesso, erro ou parcial. |
| 4 | `dados_relatorio` | `jsonb` | sim |  |  | Dicionário estrutural da coluna dados_relatorio em public.historico_relatorios. Papel funcional indicado pelo identificador: dados_relatorio; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: Dados da execução em JSONB. A estrutura não é especificada pelo banco. |
| 5 | `erro_mensagem` | `text` | sim |  |  | Dicionário estrutural da coluna erro_mensagem em public.historico_relatorios. Papel funcional indicado pelo identificador: erro_mensagem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Mensagem de erro associada à execução, quando houver. |
| 6 | `duracao_ms` | `integer` | sim |  |  | Dicionário estrutural da coluna duracao_ms em public.historico_relatorios. Papel funcional indicado pelo identificador: duracao_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (duracao_ms IS NULL OR duracao_ms >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: Duração da execução em milissegundos. Se preenchida, deve ser maior ou igual a zero. |
| 7 | `executado_em` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna executado_em em public.historico_relatorios. Papel funcional indicado pelo identificador: executado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: Instante em que a execução foi registrada; valor padrão: now(). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_relatorios_duracao_ms_check | CHECK | `CHECK (duracao_ms IS NULL OR duracao_ms >= 0)` |  |  | sim |
| historico_relatorios_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| historico_relatorios_relatorio_agendado_id_fkey | FOREIGN KEY | `FOREIGN KEY (relatorio_agendado_id) REFERENCES relatorios_agendados(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| historico_relatorios_status_check | CHECK | `CHECK (status = ANY (ARRAY['sucesso'::text, 'erro'::text, 'parcial'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_relatorios_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_relatorios_pkey ON public.historico_relatorios USING btree (id)` |
| idx_historico_relatorios_relatorio_agendado_id_fk | btree | relatorio_agendado_id | não | sim |  | `CREATE INDEX idx_historico_relatorios_relatorio_agendado_id_fk ON public.historico_relatorios USING btree (relatorio_agendado_id)` |


## Policies (RLS)

### `historico_relatorios_leitura`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM relatorios_agendados r   WHERE ((r.id = historico_relatorios.relatorio_agendado_id) AND ((r.created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
