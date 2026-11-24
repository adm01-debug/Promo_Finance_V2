# public.itens_lista_iss

> Dicionário estrutural de public.itens_lista_iss (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (codigo); CHECK (aliquota_minima >= 0::numeric AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima); PRIMARY KEY (id); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.itens_lista_iss. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo` | `text` | não |  |  | Dicionário estrutural da coluna codigo em public.itens_lista_iss. Papel funcional indicado pelo identificador: codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.itens_lista_iss. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `retem_no_tomador` | `boolean` | não | `false` |  | Dicionário estrutural da coluna retem_no_tomador em public.itens_lista_iss. Papel funcional indicado pelo identificador: retem_no_tomador; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `aliquota_minima` | `numeric` | não | `0.02` |  | Dicionário estrutural da coluna aliquota_minima em public.itens_lista_iss. Papel funcional indicado pelo identificador: aliquota_minima; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.02. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_minima >= 0::numeric AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `aliquota_maxima` | `numeric` | não | `0.05` |  | Dicionário estrutural da coluna aliquota_maxima em public.itens_lista_iss. Papel funcional indicado pelo identificador: aliquota_maxima; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.05. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota_minima >= 0::numeric AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.itens_lista_iss. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.itens_lista_iss. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `vigente_de` | `date` | não | `'2004-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.itens_lista_iss. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2004-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.itens_lista_iss. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| itens_lista_iss_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| itens_lista_iss_faixa_chk | CHECK | `CHECK (aliquota_minima >= 0::numeric AND aliquota_maxima <= 0.05 AND aliquota_minima <= aliquota_maxima)` |  |  | sim |
| itens_lista_iss_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| itens_lista_iss_vigencia_coerente | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.aliquotas_iss_municipal | aliquotas_iss_municipal_item_lista_id_fkey | item_lista_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_itens_lista_iss_vigencia | btree | vigente_de, vigente_ate | não | sim |  | `CREATE INDEX idx_itens_lista_iss_vigencia ON public.itens_lista_iss USING btree (vigente_de, vigente_ate)` |
| itens_lista_iss_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX itens_lista_iss_codigo_key ON public.itens_lista_iss USING btree (codigo)` |
| itens_lista_iss_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX itens_lista_iss_pkey ON public.itens_lista_iss USING btree (id)` |


## Policies (RLS)

### `itens_iss_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `itens_iss_write_admin`

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
| trg_itens_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_itens_lista_iss_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
