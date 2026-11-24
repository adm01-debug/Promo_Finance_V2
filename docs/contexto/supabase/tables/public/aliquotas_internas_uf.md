# public.aliquotas_internas_uf

> Dicionário estrutural de public.aliquotas_internas_uf (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota >= 0::numeric AND aliquota <= 0.35 AND aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05); PRIMARY KEY (id); UNIQUE (uf, categoria_produto, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `uf` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna uf em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: UNIQUE (uf, categoria_produto, vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `categoria_produto` | `text` | não | `'GERAL'::text` |  | Dicionário estrutural da coluna categoria_produto em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: categoria_produto; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'GERAL'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (uf, categoria_produto, vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `aliquota` | `numeric(6,4)` | não |  |  | Dicionário estrutural da coluna aliquota em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(6,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota >= 0::numeric AND aliquota <= 0.35 AND aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `aliquota_fcp` | `numeric` | não | `0` |  | Dicionário estrutural da coluna aliquota_fcp em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: aliquota_fcp; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota >= 0::numeric AND aliquota <= 0.35 AND aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `base_legal` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2024-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (uf, categoria_produto, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.aliquotas_internas_uf. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_internas_range_chk | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 0.35 AND aliquota_fcp >= 0::numeric AND aliquota_fcp <= 0.05)` |  |  | sim |
| aliquotas_internas_uf_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aliquotas_internas_uf_unique | UNIQUE | `UNIQUE (uf, categoria_produto, vigente_de)` |  |  | sim |
| aliquotas_internas_uf_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliquotas_internas_uf_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_internas_uf_pkey ON public.aliquotas_internas_uf USING btree (id)` |
| aliquotas_internas_uf_unique | btree | uf, categoria_produto, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_internas_uf_unique ON public.aliquotas_internas_uf USING btree (uf, categoria_produto, vigente_de)` |


## Policies (RLS)

### `aliq_internas_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_internas_write_admin`

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
| trg_aliq_internas_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_internas_uf_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
