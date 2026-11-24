# public.lancamentos_contabeis

> Dicionário estrutural de public.lancamentos_contabeis (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | sim | `auth.uid()` |  | Dicionário estrutural da coluna user_id em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `numero_lancamento` | `bigint` | sim |  |  | Dicionário estrutural da coluna numero_lancamento em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: numero_lancamento; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `data_lancamento` | `date` | não | `CURRENT_DATE` |  | Dicionário estrutural da coluna data_lancamento em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: data_lancamento; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: CURRENT_DATE. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `historico` | `text` | sim |  |  | Dicionário estrutural da coluna historico em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: historico; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `origem` | `text` | sim |  |  | Dicionário estrutural da coluna origem em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `valor_total` | `numeric` | não | `0` |  | Dicionário estrutural da coluna valor_total em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: valor_total; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 9 | `status` | `text` | não | `'ativo'::text` |  | Dicionário estrutural da coluna status em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'ativo'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `created_by` | `uuid` | sim | `auth.uid()` |  | Dicionário estrutural da coluna created_by em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: created_by; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: auth.uid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `competencia` | `date` | sim |  |  | Dicionário estrutural da coluna competencia em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: competencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `origem_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna origem_id em public.lancamentos_contabeis. Papel funcional indicado pelo identificador: origem_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| lancamentos_contabeis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.partidas_contabeis | partidas_contabeis_lancamento_id_fkey | lancamento_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_lanc_emp_data | btree | empresa_id, data_lancamento | não | sim |  | `CREATE INDEX idx_lanc_emp_data ON public.lancamentos_contabeis USING btree (empresa_id, data_lancamento DESC)` |
| idx_lanc_origem | btree | origem, origem_id | não | sim |  | `CREATE INDEX idx_lanc_origem ON public.lancamentos_contabeis USING btree (origem, origem_id)` |
| idx_lancamentos_contabeis_empresa_user | btree | empresa_id, user_id | não | sim |  | `CREATE INDEX idx_lancamentos_contabeis_empresa_user ON public.lancamentos_contabeis USING btree (empresa_id, user_id)` |
| idx_lancamentos_contabeis_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_lancamentos_contabeis_user_id_fk ON public.lancamentos_contabeis USING btree (user_id)` |
| lancamentos_contabeis_empresa_comp_idx | btree | empresa_id, competencia | não | sim |  | `CREATE INDEX lancamentos_contabeis_empresa_comp_idx ON public.lancamentos_contabeis USING btree (empresa_id, competencia)` |
| lancamentos_contabeis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX lancamentos_contabeis_pkey ON public.lancamentos_contabeis USING btree (id)` |


## Policies (RLS)

### `Lancamentos scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(empresa_acessivel(empresa_id) AND ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND (ue.ativo = true))))))` |
| WITH CHECK | `(empresa_acessivel(empresa_id) AND ((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = auth.uid()) AND (ue.ativo = true))))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_lancamento_contabil_before_insert | BEFORE | INSERT | ROW | enabled | public.lancamento_contabil_before_insert |
| trg_lancamento_contabil_before_update | BEFORE | UPDATE | ROW | enabled | public.lancamento_contabil_before_update |
| trg_lancamento_estorno_marker | BEFORE | UPDATE | ROW | enabled | public.fn_lancamento_estorno_marker |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
