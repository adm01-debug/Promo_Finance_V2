# public.user_demonstrativo_preferences

> Dicionário estrutural de public.user_demonstrativo_preferences (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (fonte_padrao = ANY (ARRAY['competencia'::text, 'caixa'::text])); CHECK (modo_padrao = ANY (ARRAY['dre'::text, 'balanco'::text])); PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `modo_padrao` | `text` | não | `'dre'::text` |  | Dicionário estrutural da coluna modo_padrao em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: modo_padrao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'dre'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (modo_padrao = ANY (ARRAY['dre'::text, 'balanco'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `fonte_padrao` | `text` | não | `'competencia'::text` |  | Dicionário estrutural da coluna fonte_padrao em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: fonte_padrao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'competencia'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (fonte_padrao = ANY (ARRAY['competencia'::text, 'caixa'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `filtros_por_empresa` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna filtros_por_empresa em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: filtros_por_empresa; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `drill_down_estado` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna drill_down_estado em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: drill_down_estado; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.user_demonstrativo_preferences. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_demonstrativo_preferences_fonte_padrao_check | CHECK | `CHECK (fonte_padrao = ANY (ARRAY['competencia'::text, 'caixa'::text]))` |  |  | sim |
| user_demonstrativo_preferences_modo_padrao_check | CHECK | `CHECK (modo_padrao = ANY (ARRAY['dre'::text, 'balanco'::text]))` |  |  | sim |
| user_demonstrativo_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_demonstrativo_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_demonstrativo_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_demonstrativo_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_demonstrativo_preferences_pkey ON public.user_demonstrativo_preferences USING btree (id)` |
| user_demonstrativo_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_demonstrativo_preferences_user_id_key ON public.user_demonstrativo_preferences USING btree (user_id)` |


## Policies (RLS)

### `Users can manage their own preferences`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_user_demonstrativo_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
