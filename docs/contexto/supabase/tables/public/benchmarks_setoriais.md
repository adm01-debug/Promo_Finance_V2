# public.benchmarks_setoriais

> Dicionário estrutural de public.benchmarks_setoriais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct); UNIQUE (cnae_prefix, regime, vigencia_inicio); CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio); CHECK (carga_media_pct >= 0::numeric AND carga_media_pct <= 100::numeric); CHECK (carga_p25_pct IS NULL OR carga_p25_pct >= 0::numeric AND carga_p25_pct <= 100::numeric); CHECK (carga_p75_pct IS NULL OR carga_p75_pct >= 0::numeric AND carga_p75_pct <= 100::numeric); CHECK (cnae_prefix ~ '^[0-9]{2,7}$'::text); PRIMARY KEY (id); CHECK (regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text])); CHECK (char_length(setor) >= 2 AND char_length(setor) <= 160). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cnae` | `text` | sim |  |  | Dicionário estrutural da coluna cnae em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: cnae; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `porte_empresa` | `text` | sim |  |  | Dicionário estrutural da coluna porte_empresa em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: porte_empresa; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `regime_tributario` | `text` | sim |  |  | Dicionário estrutural da coluna regime_tributario em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: regime_tributario; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `indicador` | `text` | não |  |  | Dicionário estrutural da coluna indicador em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: indicador; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `valor` | `numeric` | sim |  |  | Dicionário estrutural da coluna valor em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 7 | `percentil_25` | `numeric` | sim |  |  | Dicionário estrutural da coluna percentil_25 em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: percentil_25; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `mediana` | `numeric` | sim |  |  | Dicionário estrutural da coluna mediana em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: mediana; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `percentil_75` | `numeric` | sim |  |  | Dicionário estrutural da coluna percentil_75 em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: percentil_75; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `ano` | `integer` | sim |  |  | Dicionário estrutural da coluna ano em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: ano; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `fonte` | `text` | sim |  |  | Dicionário estrutural da coluna fonte em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: fonte; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `setor` | `text` | não |  |  | Dicionário estrutural da coluna setor em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: setor; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (char_length(setor) >= 2 AND char_length(setor) <= 160). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `cnae_prefix` | `text` | não |  |  | Dicionário estrutural da coluna cnae_prefix em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: cnae_prefix; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (cnae_prefix, regime, vigencia_inicio); CHECK (cnae_prefix ~ '^[0-9]{2,7}$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `regime` | `text` | não |  |  | Dicionário estrutural da coluna regime em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: regime; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (cnae_prefix, regime, vigencia_inicio); CHECK (regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `carga_media_pct` | `numeric(6,3)` | não |  |  | Dicionário estrutural da coluna carga_media_pct em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: carga_media_pct; o catálogo não especifica significado adicional. Tipo: numeric(6,3). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (carga_media_pct >= 0::numeric AND carga_media_pct <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `carga_p25_pct` | `numeric(6,3)` | sim |  |  | Dicionário estrutural da coluna carga_p25_pct em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: carga_p25_pct; o catálogo não especifica significado adicional. Tipo: numeric(6,3). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct); CHECK (carga_p25_pct IS NULL OR carga_p25_pct >= 0::numeric AND carga_p25_pct <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `carga_p75_pct` | `numeric(6,3)` | sim |  |  | Dicionário estrutural da coluna carga_p75_pct em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: carga_p75_pct; o catálogo não especifica significado adicional. Tipo: numeric(6,3). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct); CHECK (carga_p75_pct IS NULL OR carga_p75_pct >= 0::numeric AND carga_p75_pct <= 100::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `vigencia_inicio` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna vigencia_inicio em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: vigencia_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (cnae_prefix, regime, vigencia_inicio); CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `vigencia_fim` | `date` | sim |  |  | Dicionário estrutural da coluna vigencia_fim em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: vigencia_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.benchmarks_setoriais. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| benchmark_percentis_coerentes | CHECK | `CHECK (carga_p25_pct IS NULL OR carga_p75_pct IS NULL OR carga_p75_pct >= carga_p25_pct)` |  |  | sim |
| benchmark_unico | UNIQUE | `UNIQUE (cnae_prefix, regime, vigencia_inicio)` |  |  | sim |
| benchmark_vigencia_valida | CHECK | `CHECK (vigencia_fim IS NULL OR vigencia_fim >= vigencia_inicio)` |  |  | sim |
| benchmarks_setoriais_carga_media_pct_check | CHECK | `CHECK (carga_media_pct >= 0::numeric AND carga_media_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_carga_p25_pct_check | CHECK | `CHECK (carga_p25_pct IS NULL OR carga_p25_pct >= 0::numeric AND carga_p25_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_carga_p75_pct_check | CHECK | `CHECK (carga_p75_pct IS NULL OR carga_p75_pct >= 0::numeric AND carga_p75_pct <= 100::numeric)` |  |  | sim |
| benchmarks_setoriais_cnae_prefix_check | CHECK | `CHECK (cnae_prefix ~ '^[0-9]{2,7}$'::text)` |  |  | sim |
| benchmarks_setoriais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| benchmarks_setoriais_regime_check | CHECK | `CHECK (regime = ANY (ARRAY['simples_nacional'::text, 'lucro_presumido'::text, 'lucro_real'::text, 'mei'::text, 'arbitrado'::text]))` |  |  | sim |
| benchmarks_setoriais_setor_check | CHECK | `CHECK (char_length(setor) >= 2 AND char_length(setor) <= 160)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| benchmark_unico | btree | cnae_prefix, regime, vigencia_inicio | sim | sim |  | `CREATE UNIQUE INDEX benchmark_unico ON public.benchmarks_setoriais USING btree (cnae_prefix, regime, vigencia_inicio)` |
| benchmarks_setoriais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX benchmarks_setoriais_pkey ON public.benchmarks_setoriais USING btree (id)` |


## Policies (RLS)

### `benchmarks_admin_write`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |

### `benchmarks_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_benchmarks_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
