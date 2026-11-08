# public.simulacao_tributos_detalhados

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
| 2 | `empresa_id` | `uuid` | não |  |  |  |
| 3 | `periodo_referencia` | `date` | sim |  |  |  |
| 4 | `regime_tributario` | `text` | sim |  |  |  |
| 5 | `simples_nacional` | `numeric(14,2)` | sim |  |  |  |
| 6 | `lucro_presumido` | `numeric(14,2)` | sim |  |  |  |
| 7 | `lucro_real` | `numeric(14,2)` | sim |  |  |  |
| 8 | `mei` | `numeric(14,2)` | sim |  |  |  |
| 9 | `detalhes` | `jsonb` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `simulacao_id` | `uuid` | não |  |  |  |
| 12 | `regime` | `regime_tributario_enum` | não |  |  |  |
| 13 | `tributo` | `text` | não |  |  |  |
| 14 | `base_calculo` | `numeric(15,2)` | não |  |  |  |
| 15 | `aliquota` | `numeric(9,6)` | não |  |  |  |
| 16 | `valor_apurado` | `numeric(15,2)` | não |  |  |  |
| 17 | `memoria_calculo` | `jsonb` | sim |  |  |  |
| 18 | `base_legal` | `text` | não |  |  |  |
| 19 | `adicional` | `numeric(15,2)` | não | `0` |  |  |
| 20 | `fcp` | `numeric(15,2)` | não | `0` |  |  |
| 21 | `retencoes` | `numeric(15,2)` | não | `0` |  |  |
| 22 | `creditos` | `numeric(15,2)` | não | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| simulacao_tributos_detalhados_aliquota_check | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 1::numeric)` |  |  | sim |
| simulacao_tributos_detalhados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| simulacao_tributos_detalhados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX simulacao_tributos_detalhados_pkey ON public.simulacao_tributos_detalhados USING btree (id)` |


## Policies (RLS)

### `sim_trib_acesso`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM simulacoes s   WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM simulacoes s   WHERE ((s.id = simulacao_tributos_detalhados.simulacao_id) AND empresa_acessivel(s.empresa_id))))` |


## Triggers

_nenhum_


## Grants

_nenhum_
