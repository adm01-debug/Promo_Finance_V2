# public.nfe_recebidas

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `chave_acesso` | `text` | não |  |  |  |
| 4 | `cnpj_destinatario` | `text` | não |  |  |  |
| 5 | `cnpj_emitente` | `text` | não |  |  |  |
| 6 | `razao_emitente` | `text` | sim |  |  |  |
| 7 | `ie_emitente` | `text` | sim |  |  |  |
| 8 | `uf_emitente` | `text` | sim |  |  |  |
| 9 | `numero` | `text` | sim |  |  |  |
| 10 | `serie` | `text` | sim |  |  |  |
| 11 | `modelo` | `text` | não | `'55'::text` |  |  |
| 12 | `data_emissao` | `timestamp with time zone` | sim |  |  |  |
| 13 | `valor_total` | `numeric(15,2)` | sim |  |  |  |
| 14 | `digest_value` | `text` | sim |  |  |  |
| 15 | `tipo_documento` | `text` | não | `'NFe'::text` |  |  |
| 16 | `schema_tipo` | `nfe_schema_tipo` | não |  |  |  |
| 17 | `nsu` | `bigint` | não |  |  |  |
| 18 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  |  |
| 19 | `xml_path` | `text` | sim |  |  |  |
| 20 | `xml_completo` | `boolean` | não | `false` |  |  |
| 21 | `manifestacao_status` | `nfe_manifestacao_status` | não | `'pendente'::nfe_manifestacao_status` |  |  |
| 22 | `manifestacao_data` | `timestamp with time zone` | sim |  |  |  |
| 23 | `manifestacao_justificativa` | `text` | sim |  |  |  |
| 24 | `situacao_nfe` | `text` | sim |  |  |  |
| 25 | `conta_pagar_id` | `uuid` | sim |  |  |  |
| 26 | `raw_metadata` | `jsonb` | sim |  |  |  |
| 27 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 28 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nfe_recebidas_chave_acesso_check | CHECK | `CHECK (length(chave_acesso) = 44)` |  |  | sim |
| nfe_recebidas_chave_acesso_key | UNIQUE | `UNIQUE (chave_acesso)` |  |  | sim |
| nfe_recebidas_conta_pagar_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_pagar_id) REFERENCES contas_pagar(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| nfe_recebidas_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| nfe_recebidas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_nfe_rec_dest | btree | cnpj_destinatario, data_emissao | não | sim |  | `CREATE INDEX idx_nfe_rec_dest ON public.nfe_recebidas USING btree (cnpj_destinatario, data_emissao DESC)` |
| idx_nfe_rec_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_nfe_rec_empresa ON public.nfe_recebidas USING btree (empresa_id)` |
| nfe_recebidas_chave_acesso_key | btree | chave_acesso | sim | sim |  | `CREATE UNIQUE INDEX nfe_recebidas_chave_acesso_key ON public.nfe_recebidas USING btree (chave_acesso)` |
| nfe_recebidas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nfe_recebidas_pkey ON public.nfe_recebidas USING btree (id)` |


## Policies (RLS)

### `nfe_rec_empresa_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id))))))` |
| WITH CHECK |  |

### `nfe_rec_empresa_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR ((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = nfe_recebidas.empresa_id))))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_nfe_rec_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |
| trg_nfe_recebidas_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
