# public.partidas_contabeis

> Dicionário estrutural de public.partidas_contabeis (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (conta_contabil_id) REFERENCES plano_contas(id) ON DELETE RESTRICT; FOREIGN KEY (lancamento_id) REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (tipo = ANY (ARRAY['debito'::text, 'credito'::text])); CHECK (valor > 0::numeric); TRIGGER DEFERRABLE INITIALLY DEFERRED. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.partidas_contabeis. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `lancamento_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna lancamento_id em public.partidas_contabeis. Papel funcional indicado pelo identificador: lancamento_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (lancamento_id) REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `conta_contabil_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_contabil_id em public.partidas_contabeis. Papel funcional indicado pelo identificador: conta_contabil_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (conta_contabil_id) REFERENCES plano_contas(id) ON DELETE RESTRICT. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.partidas_contabeis. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['debito'::text, 'credito'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `valor` | `numeric(15,2)` | não |  |  | Dicionário estrutural da coluna valor em public.partidas_contabeis. Papel funcional indicado pelo identificador: valor; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (valor > 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.partidas_contabeis. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.partidas_contabeis. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `conta_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna conta_id em public.partidas_contabeis. Papel funcional indicado pelo identificador: conta_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `historico_complementar` | `text` | sim |  |  | Dicionário estrutural da coluna historico_complementar em public.partidas_contabeis. Papel funcional indicado pelo identificador: historico_complementar; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `ordem` | `integer` | sim |  |  | Dicionário estrutural da coluna ordem em public.partidas_contabeis. Papel funcional indicado pelo identificador: ordem; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| partidas_contabeis_conta_contabil_id_fkey | FOREIGN KEY | `FOREIGN KEY (conta_contabil_id) REFERENCES plano_contas(id) ON DELETE RESTRICT` | RESTRICT | NO ACTION | sim |
| partidas_contabeis_lancamento_id_fkey | FOREIGN KEY | `FOREIGN KEY (lancamento_id) REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| partidas_contabeis_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| partidas_contabeis_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['debito'::text, 'credito'::text]))` |  |  | sim |
| partidas_contabeis_valor_positivo | CHECK | `CHECK (valor > 0::numeric)` |  |  | sim |
| trg_validar_partidas_dobradas | t | `TRIGGER DEFERRABLE INITIALLY DEFERRED` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_partidas_conta | btree | conta_id | não | sim |  | `CREATE INDEX idx_partidas_conta ON public.partidas_contabeis USING btree (conta_id)` |
| idx_partidas_contabeis_conta_contabil_id_fk | btree | conta_contabil_id | não | sim |  | `CREATE INDEX idx_partidas_contabeis_conta_contabil_id_fk ON public.partidas_contabeis USING btree (conta_contabil_id)` |
| idx_partidas_contabeis_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_partidas_contabeis_empresa_id ON public.partidas_contabeis USING btree (empresa_id)` |
| idx_partidas_contabeis_lancamento_id | btree | lancamento_id | não | sim |  | `CREATE INDEX idx_partidas_contabeis_lancamento_id ON public.partidas_contabeis USING btree (lancamento_id)` |
| partidas_contabeis_conta_lanc_idx | btree | conta_id, lancamento_id, tipo, valor | não | sim |  | `CREATE INDEX partidas_contabeis_conta_lanc_idx ON public.partidas_contabeis USING btree (conta_id, lancamento_id) INCLUDE (tipo, valor)` |
| partidas_contabeis_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX partidas_contabeis_pkey ON public.partidas_contabeis USING btree (id)` |


## Policies (RLS)

### `Partidas scoped by lancamento`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM lancamentos_contabeis lc   WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |
| WITH CHECK | `(EXISTS ( SELECT 1    FROM lancamentos_contabeis lc   WHERE ((lc.id = partidas_contabeis.lancamento_id) AND ((lc.user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (lc.empresa_id IN ( SELECT ue.empresa_id            FROM user_empresas ue           WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true))))))))` |

### `partidas_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `partidas_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |

### `partidas_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role, 'visualizador'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `partidas_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(auth.uid(), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_normalizar_tipo_partida | BEFORE | INSERT OR UPDATE | ROW | enabled | public.normalizar_tipo_partida |
| trg_sincronizar_conta_partida | BEFORE | INSERT OR UPDATE | ROW | enabled | public.sincronizar_conta_partida |
| trg_validar_partidas_dobradas | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.validar_partidas_dobradas |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
