# public.faixas_simples_nacional

> Dicionário estrutural de public.faixas_simples_nacional (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (aliquota > 0::numeric AND aliquota <= 1::numeric AND parcela_deduzir >= 0::numeric); UNIQUE (anexo, faixa, vigente_de); CHECK (rbt12_ate > rbt12_de); CHECK (anexo = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text])); CHECK (faixa >= 1 AND faixa <= 6); PRIMARY KEY (id); CHECK (faixa_simples_reparticao_valida(reparticao)) NOT VALID; CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `anexo` | `text` | não |  |  | Dicionário estrutural da coluna anexo em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: anexo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (anexo, faixa, vigente_de); CHECK (anexo = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `faixa` | `smallint` | não |  |  | Dicionário estrutural da coluna faixa em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: faixa; o catálogo não especifica significado adicional. Tipo: smallint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (anexo, faixa, vigente_de); CHECK (faixa >= 1 AND faixa <= 6). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 4 | `rbt12_de` | `numeric` | não |  |  | Dicionário estrutural da coluna rbt12_de em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: rbt12_de; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (rbt12_ate > rbt12_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `rbt12_ate` | `numeric` | não |  |  | Dicionário estrutural da coluna rbt12_ate em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: rbt12_ate; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (rbt12_ate > rbt12_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `aliquota` | `numeric` | não |  |  | Dicionário estrutural da coluna aliquota em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: aliquota; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota > 0::numeric AND aliquota <= 1::numeric AND parcela_deduzir >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `parcela_deduzir` | `numeric` | não | `0` |  | Dicionário estrutural da coluna parcela_deduzir em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: parcela_deduzir; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (aliquota > 0::numeric AND aliquota <= 1::numeric AND parcela_deduzir >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `reparticao` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna reparticao em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: reparticao; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (faixa_simples_reparticao_valida(reparticao)) NOT VALID. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `vigente_de` | `date` | não | `'2018-01-01'::date` |  | Dicionário estrutural da coluna vigente_de em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: vigente_de; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '2018-01-01'::date. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (anexo, faixa, vigente_de); CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `vigente_ate` | `date` | sim |  |  | Dicionário estrutural da coluna vigente_ate em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: vigente_ate; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.faixas_simples_nacional. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| faixas_simples_aliquota_range_chk | CHECK | `CHECK (aliquota > 0::numeric AND aliquota <= 1::numeric AND parcela_deduzir >= 0::numeric)` |  |  | sim |
| faixas_simples_anexo_faixa_key | UNIQUE | `UNIQUE (anexo, faixa, vigente_de)` |  |  | sim |
| faixas_simples_intervalo_chk | CHECK | `CHECK (rbt12_ate > rbt12_de)` |  |  | sim |
| faixas_simples_nacional_anexo_check | CHECK | `CHECK (anexo = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))` |  |  | sim |
| faixas_simples_nacional_faixa_check | CHECK | `CHECK (faixa >= 1 AND faixa <= 6)` |  |  | sim |
| faixas_simples_nacional_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| faixas_simples_reparticao_soma_chk | CHECK | `CHECK (faixa_simples_reparticao_valida(reparticao)) NOT VALID` |  |  | não |
| faixas_simples_vigencia_chk | CHECK | `CHECK (vigente_ate IS NULL OR vigente_ate >= vigente_de)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| faixas_simples_anexo_faixa_key | btree | anexo, faixa, vigente_de | sim | sim |  | `CREATE UNIQUE INDEX faixas_simples_anexo_faixa_key ON public.faixas_simples_nacional USING btree (anexo, faixa, vigente_de)` |
| faixas_simples_nacional_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX faixas_simples_nacional_pkey ON public.faixas_simples_nacional USING btree (id)` |


## Policies (RLS)

### `faixas_simples_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `faixas_simples_write_admin`

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
| trg_faixas_simples_nacional_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| trg_faixas_simples_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
