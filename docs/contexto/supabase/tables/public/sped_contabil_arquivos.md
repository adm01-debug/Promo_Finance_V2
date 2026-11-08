# public.sped_contabil_arquivos

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `tipo` | `text` | não |  |  |  |
| 4 | `competencia` | `date` | não |  |  |  |
| 5 | `arquivo_nome` | `text` | sim |  |  |  |
| 6 | `arquivo_path` | `text` | sim |  |  |  |
| 7 | `arquivo_hash` | `text` | sim |  |  |  |
| 8 | `periodo_inicio` | `date` | sim |  |  |  |
| 9 | `periodo_fim` | `date` | sim |  |  |  |
| 10 | `status` | `text` | não | `'gerado'::text` |  |  |
| 11 | `protocolo` | `text` | sim |  |  |  |
| 12 | `gerado_em` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `transmitido_em` | `timestamp with time zone` | sim |  |  |  |
| 14 | `ano_calendario` | `integer` | não |  |  |  |
| 15 | `storage_path` | `text` | não |  |  |  |
| 16 | `hash_sha256` | `text` | sim |  |  |  |
| 17 | `total_linhas` | `integer` | não | `0` |  |  |
| 18 | `total_lancamentos` | `integer` | não | `0` |  |  |
| 19 | `validacoes` | `jsonb` | não | `'{"erros": [], "avisos": []}'::jsonb` |  |  |
| 20 | `recibo_transmissao` | `text` | sim |  |  |  |
| 21 | `gerado_por` | `uuid` | sim |  |  |  |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sped_contabil_arquivos_ano_calendario_check | CHECK | `CHECK (ano_calendario >= 2000 AND ano_calendario <= 2100)` |  |  | sim |
| sped_contabil_arquivos_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sped_contabil_arquivos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sped_contabil_arquivos_status_check | CHECK | `CHECK (status = ANY (ARRAY['gerado'::text, 'rejeitado'::text, 'transmitido'::text, 'cancelado'::text]))` |  |  | sim |
| sped_contabil_arquivos_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['ECD'::text, 'ECF'::text]))` |  |  | sim |
| sped_contabil_arquivos_total_lancamentos_check | CHECK | `CHECK (total_lancamentos >= 0)` |  |  | sim |
| sped_contabil_arquivos_total_linhas_check | CHECK | `CHECK (total_linhas >= 0)` |  |  | sim |
| sped_periodo_valido | CHECK | `CHECK (periodo_fim >= periodo_inicio)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sped_contabil_arquivos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sped_contabil_arquivos_pkey ON public.sped_contabil_arquivos USING btree (id)` |


## Policies (RLS)

### `sped_arquivos_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `sped_arquivos_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `sped_arquivos_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `sped_arquivos_update_admin`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sped_arquivos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
