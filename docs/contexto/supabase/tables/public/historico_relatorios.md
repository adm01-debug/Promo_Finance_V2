# public.historico_relatorios

> Registros das execuções dos relatórios agendados, incluindo resultado, duração e eventual mensagem de erro.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID da execução registrada. |
| 2 | `relatorio_agendado_id` | `uuid` | não |  |  | Identificador do agendamento executado; possui chave estrangeira para public.relatorios_agendados(id). |
| 3 | `status` | `text` | não | `'sucesso'::text` |  | Resultado da execução. O banco permite: sucesso, erro ou parcial. |
| 4 | `dados_relatorio` | `jsonb` | sim |  |  | Dados da execução em JSONB. A estrutura não é especificada pelo banco. |
| 5 | `erro_mensagem` | `text` | sim |  |  | Mensagem de erro associada à execução, quando houver. |
| 6 | `duracao_ms` | `integer` | sim |  |  | Duração da execução em milissegundos. Se preenchida, deve ser maior ou igual a zero. |
| 7 | `executado_em` | `timestamp with time zone` | não | `now()` |  | Instante em que a execução foi registrada; valor padrão: now(). |


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
