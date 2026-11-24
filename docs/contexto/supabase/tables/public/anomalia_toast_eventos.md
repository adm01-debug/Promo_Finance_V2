# public.anomalia_toast_eventos

> Dicionário estrutural de public.anomalia_toast_eventos (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (anomalia_id) REFERENCES anomalias_detectadas(id) ON DELETE CASCADE; FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL; PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `uuid_generate_v4()` |  | Dicionário estrutural da coluna id em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: uuid_generate_v4(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `anomalia_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna anomalia_id em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: anomalia_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (anomalia_id) REFERENCES anomalias_detectadas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `dispatched_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna dispatched_at em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: dispatched_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 5 | `severidade` | `text` | sim |  |  | Dicionário estrutural da coluna severidade em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: severidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `tipo_anomalia` | `text` | sim |  |  | Dicionário estrutural da coluna tipo_anomalia em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: tipo_anomalia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `titulo` | `text` | sim |  |  | Dicionário estrutural da coluna titulo em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: titulo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `descricao` | `text` | sim |  |  | Dicionário estrutural da coluna descricao em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `centro_custo_nome` | `text` | sim |  |  | Dicionário estrutural da coluna centro_custo_nome em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: centro_custo_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `acoes_disponiveis` | `text[]` | sim | `'{}'::text[]` |  | Dicionário estrutural da coluna acoes_disponiveis em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: acoes_disponiveis; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 11 | `duracao_segundos` | `integer` | sim | `8` |  | Dicionário estrutural da coluna duracao_segundos em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: duracao_segundos; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 8. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `centro_custo_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna centro_custo_id em public.anomalia_toast_eventos. Papel funcional indicado pelo identificador: centro_custo_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| anomalia_toast_eventos_anomalia_id_fkey | FOREIGN KEY | `FOREIGN KEY (anomalia_id) REFERENCES anomalias_detectadas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| anomalia_toast_eventos_centro_custo_id_fkey | FOREIGN KEY | `FOREIGN KEY (centro_custo_id) REFERENCES centros_custo(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| anomalia_toast_eventos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| anomalia_toast_eventos_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| anomalia_toast_eventos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX anomalia_toast_eventos_pkey ON public.anomalia_toast_eventos USING btree (id)` |
| idx_anomalia_toast_eventos_anomalia_id_fk | btree | anomalia_id | não | sim |  | `CREATE INDEX idx_anomalia_toast_eventos_anomalia_id_fk ON public.anomalia_toast_eventos USING btree (anomalia_id)` |
| idx_anomalia_toast_eventos_centro_custo_id | btree | centro_custo_id | não | sim |  | `CREATE INDEX idx_anomalia_toast_eventos_centro_custo_id ON public.anomalia_toast_eventos USING btree (centro_custo_id)` |
| idx_anomalia_toast_eventos_user_id_fk | btree | user_id | não | sim |  | `CREATE INDEX idx_anomalia_toast_eventos_user_id_fk ON public.anomalia_toast_eventos USING btree (user_id)` |


## Policies (RLS)

### `Users can insert toast events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `Users can view their own toast events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
