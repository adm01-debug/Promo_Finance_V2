# public.nfe_eventos

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `chave_acesso` | `text` | não |  |  |  |
| 3 | `tipo_evento` | `text` | não |  |  |  |
| 4 | `codigo_evento` | `text` | sim |  |  |  |
| 5 | `sequencial` | `integer` | não | `1` |  |  |
| 6 | `data_evento` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `protocolo` | `text` | sim |  |  |  |
| 8 | `justificativa` | `text` | sim |  |  |  |
| 9 | `status_retorno` | `text` | sim |  |  |  |
| 10 | `motivo_retorno` | `text` | sim |  |  |  |
| 11 | `xml_path` | `text` | sim |  |  |  |
| 12 | `raw_payload` | `jsonb` | sim |  |  |  |
| 13 | `created_by` | `uuid` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nfe_eventos_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| nfe_eventos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| nfe_eventos_chave_tipo_seq_uk | btree | chave_acesso, tipo_evento, sequencial | sim | sim |  | `CREATE UNIQUE INDEX nfe_eventos_chave_tipo_seq_uk ON public.nfe_eventos USING btree (chave_acesso, tipo_evento, sequencial)` |
| nfe_eventos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nfe_eventos_pkey ON public.nfe_eventos USING btree (id)` |


## Policies (RLS)

### `nfe_ev_read_via_nfe`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (EXISTS ( SELECT 1    FROM (nfe_recebidas r      JOIN user_empresas ue ON ((ue.empresa_id = r.empresa_id)))   WHERE ((r.chave_acesso = nfe_eventos.chave_acesso) AND (ue.user_id = ( SELECT auth.uid() AS uid))))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

_nenhum_
