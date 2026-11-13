# public.overlay_rejeicoes_auditoria

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
| 3 | `nota_id` | `uuid` | sim |  |  |  |
| 4 | `chave_acesso` | `text` | sim |  |  |  |
| 5 | `codigo_rejeicao` | `text` | não |  |  |  |
| 6 | `descricao_rejeicao` | `text` | sim |  |  |  |
| 7 | `resolvido` | `boolean` | sim | `false` |  |  |
| 8 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `catalogo` | `text` | não |  |  |  |
| 11 | `identificador` | `text` | não |  |  |  |
| 12 | `descricao` | `text` | sim |  |  |  |
| 13 | `campo` | `text` | não |  |  |  |
| 14 | `motivo` | `text` | não |  |  |  |
| 15 | `valor_recebido` | `text` | sim |  |  |  |
| 16 | `severidade` | `text` | não | `'critico'::text` |  |  |
| 17 | `referencia` | `date` | não |  |  |  |
| 18 | `ocorrencias` | `integer` | não | `1` |  |  |
| 19 | `primeira_deteccao` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `ultima_deteccao` | `timestamp with time zone` | não | `now()` |  |  |
| 21 | `resolvido_em` | `timestamp with time zone` | sim |  |  |  |
| 22 | `resolvido_por` | `uuid` | sim |  |  |  |
| 23 | `observacao` | `text` | sim |  |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| overlay_rejeicoes_auditoria_catalogo_check | CHECK | `CHECK (catalogo = ANY (ARRAY['icms'::text, 'iss'::text, 'ncm'::text, 'monofasico'::text, 'mva_st'::text, 'interestaduais'::text, 'faixas_simples'::text]))` |  |  | sim |
| overlay_rejeicoes_auditoria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| overlay_rejeicoes_auditoria_severidade_check | CHECK | `CHECK (severidade = ANY (ARRAY['critico'::text, 'atencao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_overlay_rejeicoes_auditoria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_overlay_rejeicoes_auditoria_empresa_id ON public.overlay_rejeicoes_auditoria USING btree (empresa_id)` |
| overlay_rejeicoes_auditoria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX overlay_rejeicoes_auditoria_pkey ON public.overlay_rejeicoes_auditoria USING btree (id)` |


## Policies (RLS)

### `Gestores atualizam auditoria de overlay`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |

### `Gestores inserem auditoria de overlay`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |

### `Gestores leem auditoria de overlay`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK |  |

### `Gestores removem auditoria de overlay`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) OR has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'manager'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_overlay_rejeicoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
