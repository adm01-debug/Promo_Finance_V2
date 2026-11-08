# public.historico_conciliacao_ia

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
| 2 | `sessao_id` | `uuid` | sim |  |  |  |
| 3 | `transacao_id` | `uuid` | sim |  |  |  |
| 4 | `resultado` | `jsonb` | sim |  |  |  |
| 5 | `score` | `numeric` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 7 | `acao` | `text` | sim |  |  |  |
| 8 | `tipo_lancamento` | `text` | sim |  |  |  |
| 9 | `score_ia` | `numeric` | sim |  |  |  |
| 10 | `confianca` | `text` | sim |  |  |  |
| 11 | `analise_ia` | `text` | sim |  |  |  |
| 12 | `transacao_bancaria_id` | `uuid` | sim |  |  |  |
| 13 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 14 | `conta_receber_id` | `uuid` | sim |  |  |  |
| 15 | `aprovado_por` | `uuid` | sim |  |  |  |
| 16 | `created_by` | `uuid` | sim |  |  |  |
| 17 | `motivos` | `jsonb` | sim | `'[]'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| historico_conciliacao_ia_aprovado_por_fkey | FOREIGN KEY | `FOREIGN KEY (aprovado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_conta_receber_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_receber_id) REFERENCES contas_receber(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| historico_conciliacao_ia_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| historico_conciliacao_ia_sessao_id_fkey | FOREIGN KEY | `FOREIGN KEY (sessao_id) REFERENCES sessoes_conciliacao(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| historico_conciliacao_ia_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX historico_conciliacao_ia_pkey ON public.historico_conciliacao_ia USING btree (id)` |
| idx_historico_conciliacao_ia_aprovado_por_fk | btree | aprovado_por | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_aprovado_por_fk ON public.historico_conciliacao_ia USING btree (aprovado_por)` |
| idx_historico_conciliacao_ia_created_by_fk | btree | created_by | não | sim |  | `CREATE INDEX idx_historico_conciliacao_ia_created_by_fk ON public.historico_conciliacao_ia USING btree (created_by)` |


## Policies (RLS)

### `historico_conciliacao_ia_role_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR has_role(( SELECT auth.uid() AS uid), 'financeiro'::app_role))` |
| WITH CHECK |  |

### `historico_conciliacao_ia_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'financeiro'::app_role)) AND ((EXISTS ( SELECT 1    FROM contas_receber cr   WHERE ((cr.id = historico_conciliacao_ia.conta_receber_id) AND empresa_acessivel(cr.empresa_id)))) OR (EXISTS ( SELECT 1    FROM contas_pagar cp   WHERE ((cp.id = historico_conciliacao_ia.conta_pagar_id) AND empresa_acessivel(cp.empresa_id)))) OR (EXISTS ( SELECT 1    FROM sessoes_conciliacao s   WHERE ((s.id = historico_conciliacao_ia.sessao_id) AND ((s.user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR empresa_acessivel(s.empresa_id)))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
