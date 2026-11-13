# public.per_dcomp

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `numero_processo` | `text` | sim |  |  |  |
| 5 | `numero_recibo` | `text` | sim |  |  |  |
| 6 | `data_transmissao` | `timestamp with time zone` | sim |  |  |  |
| 7 | `tipo_credito_origem` | `text` | não |  |  |  |
| 8 | `tributo_origem` | `text` | não |  |  |  |
| 9 | `competencia_origem` | `text` | não |  |  |  |
| 10 | `valor_original` | `numeric(18,2)` | não | `0` |  |  |
| 11 | `valor_atualizado` | `numeric(18,2)` | sim |  |  |  |
| 12 | `tributo_destino` | `text` | sim |  |  |  |
| 13 | `competencia_destino` | `text` | sim |  |  |  |
| 14 | `valor_compensado` | `numeric(18,2)` | sim |  |  |  |
| 15 | `creditos_ids` | `uuid[]` | não | `'{}'::uuid[]` |  |  |
| 16 | `status` | `text` | não | `'rascunho'::text` |  |  |
| 17 | `data_protocolo` | `date` | sim |  |  |  |
| 18 | `data_decisao` | `date` | sim |  |  |  |
| 19 | `prazo_recurso` | `date` | sim |  |  |  |
| 20 | `justificativa` | `text` | sim |  |  |  |
| 21 | `fundamentacao_legal` | `text` | sim |  |  |  |
| 22 | `observacoes` | `text` | sim |  |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `created_by` | `uuid` | sim |  |  |  |
| 25 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| per_dcomp_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| per_dcomp_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| per_dcomp_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| per_dcomp_status_check | CHECK | `CHECK (status = ANY (ARRAY['rascunho'::text, 'aguardando_transmissao'::text, 'transmitido'::text, 'em_analise'::text, 'deferido'::text, 'indeferido'::text, 'cancelado'::text]))` |  |  | sim |
| per_dcomp_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['per'::text, 'dcomp'::text]))` |  |  | sim |
| per_dcomp_tipo_credito_origem_check | CHECK | `CHECK (tipo_credito_origem = ANY (ARRAY['saldo_negativo'::text, 'pagamento_indevido'::text, 'retencao'::text, 'ressarcimento'::text, 'exportacao'::text]))` |  |  | sim |
| per_dcomp_valor_atualizado_check | CHECK | `CHECK (valor_atualizado IS NULL OR valor_atualizado >= 0::numeric)` |  |  | sim |
| per_dcomp_valor_compensado_check | CHECK | `CHECK (valor_compensado IS NULL OR valor_compensado >= 0::numeric)` |  |  | sim |
| per_dcomp_valor_original_check | CHECK | `CHECK (valor_original >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_per_dcomp_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_per_dcomp_empresa ON public.per_dcomp USING btree (empresa_id)` |
| per_dcomp_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX per_dcomp_pkey ON public.per_dcomp USING btree (id)` |


## Policies (RLS)

### `Admin pode deletar per_dcomp`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(auth.uid(), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `Financeiro+ podem atualizar per_dcomp`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem inserir per_dcomp`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `Financeiro+ podem ver per_dcomp`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `per_dcomp_acesso`

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
| trg_per_dcomp_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
