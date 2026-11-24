# public.categorias

> Dicionário estrutural de public.categorias (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id); PRIMARY KEY (id); FOREIGN KEY (plano_conta_id) REFERENCES plano_contas(id); CHECK (tipo = ANY (ARRAY['receita'::text, 'despesa'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.categorias. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `nome` | `text` | não |  |  | Dicionário estrutural da coluna nome em public.categorias. Papel funcional indicado pelo identificador: nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.categorias. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['receita'::text, 'despesa'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `cor` | `text` | sim |  |  | Dicionário estrutural da coluna cor em public.categorias. Papel funcional indicado pelo identificador: cor; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `icone` | `text` | sim |  |  | Dicionário estrutural da coluna icone em public.categorias. Papel funcional indicado pelo identificador: icone; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | sim | `true` |  | Dicionário estrutural da coluna ativo em public.categorias. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.categorias. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.categorias. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.categorias. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `plano_conta_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna plano_conta_id em public.categorias. Papel funcional indicado pelo identificador: plano_conta_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (plano_conta_id) REFERENCES plano_contas(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| categorias_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| categorias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| categorias_plano_conta_id_fkey | FOREIGN KEY | `FOREIGN KEY (plano_conta_id) REFERENCES plano_contas(id)` | NO ACTION | NO ACTION | sim |
| categorias_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.contas_pagar | contas_pagar_categoria_id_fkey | categoria_id | SET NULL |
| public.contas_receber | contas_receber_categoria_id_fkey | categoria_id | SET NULL |
| public.movimentacoes | movimentacoes_categoria_id_fkey | categoria_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| categorias_empresa_tipo_nome_uq | btree | empresa_id, tipo | sim | sim |  | `CREATE UNIQUE INDEX categorias_empresa_tipo_nome_uq ON public.categorias USING btree (empresa_id, tipo, lower(btrim(nome)))` |
| categorias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX categorias_pkey ON public.categorias USING btree (id)` |
| idx_categorias_empresa | btree | empresa_id | não | sim |  | `CREATE INDEX idx_categorias_empresa ON public.categorias USING btree (empresa_id)` |
| idx_categorias_plano_conta_id_fk | btree | plano_conta_id | não | sim |  | `CREATE INDEX idx_categorias_plano_conta_id_fk ON public.categorias USING btree (plano_conta_id)` |


## Policies (RLS)

### `Categorias scoped by empresa`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |
| WITH CHECK | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) OR (empresa_id IN ( SELECT ue.empresa_id    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.ativo = true)))))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_18e8b04fb0e329ecb61f | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
