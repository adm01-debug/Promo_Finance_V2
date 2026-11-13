# public.elisao_creditos_auditoria

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
| 3 | `nota_fiscal_id` | `uuid` | sim |  |  |  |
| 4 | `regra_id` | `uuid` | sim |  |  |  |
| 5 | `ncm` | `text` | sim |  |  |  |
| 6 | `valor_credito` | `numeric` | não | `0` |  |  |
| 7 | `status_aprovacao` | `text` | não | `'pendente'::text` |  |  |
| 8 | `observacoes` | `text` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `nota_id` | `uuid` | sim |  |  |  |
| 12 | `cst_csosn` | `text` | sim |  |  |  |
| 13 | `valor_base` | `numeric(15,2)` | não | `0` |  |  |
| 14 | `valor_credito_calculado` | `numeric(15,2)` | não | `0` |  |  |
| 15 | `metodologia_aplicada` | `text` | sim |  |  |  |
| 16 | `score_confianca` | `integer` | sim |  |  |  |
| 17 | `divergencias_detectadas` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 18 | `historico_decisoes` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 19 | `motivo_rejeicao` | `text` | sim |  |  |  |
| 20 | `aprovador_id` | `uuid` | sim |  |  |  |
| 21 | `data_aprovacao` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| elisao_creditos_auditoria_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| elisao_creditos_auditoria_nota_fiscal_id_fkey | FOREIGN KEY | `FOREIGN KEY (nota_fiscal_id) REFERENCES notas_fiscais_ocr(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| elisao_creditos_auditoria_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| elisao_creditos_auditoria_regra_id_fkey | FOREIGN KEY | `FOREIGN KEY (regra_id) REFERENCES elisao_regras_creditos(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| elisao_creditos_auditoria_score_confianca_check | CHECK | `CHECK (score_confianca IS NULL OR score_confianca >= 0 AND score_confianca <= 100)` |  |  | sim |
| elisao_creditos_auditoria_status_aprovacao_check | CHECK | `CHECK (status_aprovacao = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text, 'em_revisao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| elisao_creditos_auditoria_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX elisao_creditos_auditoria_pkey ON public.elisao_creditos_auditoria USING btree (id)` |
| idx_elisao_creditos_auditoria_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_elisao_creditos_auditoria_empresa_id ON public.elisao_creditos_auditoria USING btree (empresa_id)` |


## Policies (RLS)

### `Users can manage company audit logs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `creditos_auditoria_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `creditos_auditoria_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `creditos_auditoria_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_cred_aud_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
