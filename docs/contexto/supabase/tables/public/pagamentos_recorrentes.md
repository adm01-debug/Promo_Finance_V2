# public.pagamentos_recorrentes

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
| 2 | `empresa_id` | `uuid` | sim |  |  |  |
| 3 | `descricao` | `text` | não |  |  |  |
| 4 | `plano` | `text` | sim |  |  |  |
| 5 | `valor` | `numeric(15,2)` | não |  |  |  |
| 6 | `frequencia` | `text` | não | `'mensal'::text` |  |  |
| 7 | `data_inicio` | `date` | não |  |  |  |
| 8 | `data_proximo` | `date` | sim |  |  |  |
| 9 | `data_vencimento` | `date` | sim |  |  |  |
| 10 | `status` | `text` | não | `'ativo'::text` |  |  |
| 11 | `ultima_transacao_id` | `text` | sim |  |  |  |
| 12 | `gateway` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 15 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 16 | `fornecedor_nome` | `text` | não |  |  |  |
| 17 | `dia_vencimento` | `integer` | não |  |  |  |
| 18 | `data_fim` | `date` | sim |  |  |  |
| 19 | `centro_custo_id` | `uuid` | sim |  |  |  |
| 20 | `conta_bancaria_id` | `uuid` | sim |  |  |  |
| 21 | `tipo_cobranca` | `tipo_cobranca` | não | `'transferencia'::tipo_cobranca` |  |  |
| 22 | `observacoes` | `text` | sim |  |  |  |
| 23 | `ativo` | `boolean` | não | `true` |  |  |
| 24 | `ultima_geracao` | `date` | sim |  |  |  |
| 25 | `proxima_geracao` | `date` | sim |  |  |  |
| 26 | `total_gerado` | `integer` | não | `0` |  |  |
| 27 | `created_by` | `uuid` | não | `auth.uid()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| pag_recorrente_periodo | CHECK | `CHECK (data_fim IS NULL OR data_fim >= data_inicio)` |  |  | sim |
| pagamentos_recorrentes_dia_vencimento_check | CHECK | `CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31)` |  |  | sim |
| pagamentos_recorrentes_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| pagamentos_recorrentes_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text, 'bimestral'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text]))` |  |  | sim |
| pagamentos_recorrentes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| pagamentos_recorrentes_total_gerado_check | CHECK | `CHECK (total_gerado >= 0)` |  |  | sim |
| pagamentos_recorrentes_valor_check | CHECK | `CHECK (valor >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_pag_recorr_proxima | btree | proxima_geracao | não | sim | `ativo` | `CREATE INDEX idx_pag_recorr_proxima ON public.pagamentos_recorrentes USING btree (proxima_geracao) WHERE ativo` |
| pagamentos_recorrentes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX pagamentos_recorrentes_pkey ON public.pagamentos_recorrentes USING btree (id)` |


## Policies (RLS)

### `pagamentos_recorrentes_acesso`

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
| trg_pag_recorr_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

_nenhum_
