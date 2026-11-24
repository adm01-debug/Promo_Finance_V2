# public.aliquotas_interestaduais

> Dicionário estrutural de public.aliquotas_interestaduais (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota_importado >= 0::numeric AND aliquota_importado <= 0.12); CHECK (uf_origem <> uf_destino); CHECK (aliquota = ANY (ARRAY[0.04, 0.07, 0.12])); PRIMARY KEY (id); UNIQUE (uf_origem, uf_destino, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `uf_origem` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna uf_origem em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: uf_origem; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: CHECK (uf_origem <> uf_destino); UNIQUE (uf_origem, uf_destino, vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `uf_destino` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna uf_destino em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: uf_destino; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: CHECK (uf_origem <> uf_destino); UNIQUE (uf_origem, uf_destino, vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `aliquota` | `numeric(6,4)` | não |  |  | Dicionário estrutural da coluna aliquota em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(6,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota = ANY (ARRAY[0.04, 0.07, 0.12])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `aliquota_importado` | `numeric` | não | `0.04` |  | Dicionário estrutural da coluna aliquota_importado em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: aliquota_importado; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.04. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_importado >= 0::numeric AND aliquota_importado <= 0.12). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `vigente_de` | `date` | não | `'2016-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2016-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (uf_origem, uf_destino, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.aliquotas_interestaduais. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_inter_importado_range_chk | CHECK | `CHECK (aliquota_importado >= 0::numeric AND aliquota_importado <= 0.12)` |  |  | sim |
| aliq_inter_ufs_distintas_chk | CHECK | `CHECK (uf_origem <> uf_destino)` |  |  | sim |
| aliq_inter_valores_chk | CHECK | `CHECK (aliquota = ANY (ARRAY[0.04, 0.07, 0.12]))` |  |  | sim |
| aliquotas_interestaduais_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| aliquotas_interestaduais_unique | UNIQUE | `UNIQUE (uf_origem, uf_destino, vigente_de)` |  |  | sim |
| aliquotas_interestaduais_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliquotas_interestaduais_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_interestaduais_pkey ON public.aliquotas_interestaduais USING btree (id)` |
| aliquotas_interestaduais_unique | btree | uf_origem, uf_destino, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_interestaduais_unique ON public.aliquotas_interestaduais USING btree (uf_origem, uf_destino, vigente_de)` |


## Policies (RLS)

### `aliq_inter_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_inter_write_admin`

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
| trg_aliq_inter_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_interestaduais_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
