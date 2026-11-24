# public.ncms

> Dicionário estrutural de public.ncms (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (cest IS NULL OR cest ~ '^[0-9]{7}$'::text OR cest ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'::text); CHECK (codigo ~ '^[0-9]{8}$'::text); UNIQUE (codigo); CHECK (aliquota_ipi >= 0::numeric AND aliquota_ipi <= 1::numeric); CHECK (mva_padrao IS NULL OR mva_padrao >= 0::numeric AND mva_padrao <= 3::numeric); PRIMARY KEY (id); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.ncms. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo` | `text` | não |  |  | Dicionário estrutural da coluna codigo em public.ncms. Papel funcional indicado pelo identificador: codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (codigo ~ '^[0-9]{8}$'::text); UNIQUE (codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.ncms. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `aliquota_ipi` | `numeric` | não | `0` |  | Dicionário estrutural da coluna aliquota_ipi em public.ncms. Papel funcional indicado pelo identificador: aliquota_ipi; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_ipi >= 0::numeric AND aliquota_ipi <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `cest` | `text` | sim |  |  | Dicionário estrutural da coluna cest em public.ncms. Papel funcional indicado pelo identificador: cest; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (cest IS NULL OR cest ~ '^[0-9]{7}$'::text OR cest ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `monofasico_pis_cofins` | `boolean` | não | `false` |  | Dicionário estrutural da coluna monofasico_pis_cofins em public.ncms. Papel funcional indicado pelo identificador: monofasico_pis_cofins; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `sujeito_st` | `boolean` | não | `false` |  | Dicionário estrutural da coluna sujeito_st em public.ncms. Papel funcional indicado pelo identificador: sujeito_st; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `mva_padrao` | `numeric` | sim |  |  | Dicionário estrutural da coluna mva_padrao em public.ncms. Papel funcional indicado pelo identificador: mva_padrao; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (mva_padrao IS NULL OR mva_padrao >= 0::numeric AND mva_padrao <= 3::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `observacoes` | `text` | sim |  |  | Dicionário estrutural da coluna observacoes em public.ncms. Papel funcional indicado pelo identificador: observacoes; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.ncms. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.ncms. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `vigente_de` | `date` | não | `'2022-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.ncms. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2022-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.ncms. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ncms_cest_formato_chk | CHECK | `CHECK (cest IS NULL OR cest ~ '^[0-9]{7}$'::text OR cest ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{2}$'::text)` |  |  | sim |
| ncms_codigo_formato_chk | CHECK | `CHECK (codigo ~ '^[0-9]{8}$'::text)` |  |  | sim |
| ncms_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| ncms_ipi_range_chk | CHECK | `CHECK (aliquota_ipi >= 0::numeric AND aliquota_ipi <= 1::numeric)` |  |  | sim |
| ncms_mva_range_chk | CHECK | `CHECK (mva_padrao IS NULL OR mva_padrao >= 0::numeric AND mva_padrao <= 3::numeric)` |  |  | sim |
| ncms_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ncms_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.protocolos_st_ncms | protocolos_st_ncms_ncm_id_fkey | ncm_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ncms_vigencia | btree | vigente_de, vigente_ate | não | sim |  | `CREATE INDEX idx_ncms_vigencia ON public.ncms USING btree (vigente_de, vigente_ate)` |
| ncms_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX ncms_codigo_key ON public.ncms USING btree (codigo)` |
| ncms_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ncms_pkey ON public.ncms USING btree (id)` |


## Policies (RLS)

### `ncms_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `ncms_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_ncms_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
