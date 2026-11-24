# public.aliquotas_iss_municipal

> Dicionário estrutural de public.aliquotas_iss_municipal (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (codigo_ibge >= 1000000 AND codigo_ibge <= 9999999); CHECK (aliquota >= 0::numeric AND aliquota <= 0.05); UNIQUE (codigo_ibge, item_lista_id, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de); FOREIGN KEY (item_lista_id) REFERENCES itens_lista_iss(id); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo_ibge` | `integer` | não |  |  | Dicionário estrutural da coluna codigo_ibge em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: codigo_ibge; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (codigo_ibge >= 1000000 AND codigo_ibge <= 9999999); UNIQUE (codigo_ibge, item_lista_id, vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 3 | `municipio` | `text` | não |  |  | Dicionário estrutural da coluna municipio em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: municipio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `uf` | `uf_brasil` | não |  |  | Dicionário estrutural da coluna uf em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: uf_brasil. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `item_lista_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna item_lista_id em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: item_lista_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (codigo_ibge, item_lista_id, vigente_de); FOREIGN KEY (item_lista_id) REFERENCES itens_lista_iss(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `aliquota` | `numeric(6,4)` | não |  |  | Dicionário estrutural da coluna aliquota em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric(6,4). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota >= 0::numeric AND aliquota <= 0.05). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `vigente_de` | `date` | não | `'2024-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2024-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (codigo_ibge, item_lista_id, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `base_legal` | `text` | sim |  |  | Dicionário estrutural da coluna base_legal em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: base_legal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.aliquotas_iss_municipal. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| aliq_iss_mun_ibge_chk | CHECK | `CHECK (codigo_ibge >= 1000000 AND codigo_ibge <= 9999999)` |  |  | sim |
| aliq_iss_mun_range_chk | CHECK | `CHECK (aliquota >= 0::numeric AND aliquota <= 0.05)` |  |  | sim |
| aliq_iss_mun_unq | UNIQUE | `UNIQUE (codigo_ibge, item_lista_id, vigente_de)` |  |  | sim |
| aliq_iss_mun_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |
| aliquotas_iss_municipal_item_lista_id_fkey | FOREIGN KEY | `FOREIGN KEY (item_lista_id) REFERENCES itens_lista_iss(id)` | NO ACTION | NO ACTION | sim |
| aliquotas_iss_municipal_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| aliq_iss_mun_geral_unq | btree | codigo_ibge, vigente_de | sim | sim | `(item_lista_id IS NULL)` | `CREATE UNIQUE INDEX aliq_iss_mun_geral_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, vigente_de) WHERE (item_lista_id IS NULL)` |
| aliq_iss_mun_unq | btree | codigo_ibge, item_lista_id, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX aliq_iss_mun_unq ON public.aliquotas_iss_municipal USING btree (codigo_ibge, item_lista_id, vigente_de)` |
| aliquotas_iss_municipal_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX aliquotas_iss_municipal_pkey ON public.aliquotas_iss_municipal USING btree (id)` |
| idx_aliq_iss_ibge | btree | codigo_ibge | não | sim |  | `CREATE INDEX idx_aliq_iss_ibge ON public.aliquotas_iss_municipal USING btree (codigo_ibge)` |
| idx_aliquotas_iss_municipal_item_lista_id_fk | btree | item_lista_id | não | sim |  | `CREATE INDEX idx_aliquotas_iss_municipal_item_lista_id_fk ON public.aliquotas_iss_municipal USING btree (item_lista_id)` |


## Policies (RLS)

### `aliq_iss_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `aliq_iss_write_admin`

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
| trg_aliq_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_aliquotas_iss_municipal_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
