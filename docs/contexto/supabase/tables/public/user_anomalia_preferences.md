# public.user_anomalia_preferences

> Dicionário estrutural de public.user_anomalia_preferences (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `toast_enabled` | `boolean` | não | `true` |  | Dicionário estrutural da coluna toast_enabled em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: toast_enabled; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `toast_min_severidade` | `text` | não | `'critica'::text` |  | Dicionário estrutural da coluna toast_min_severidade em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: toast_min_severidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'critica'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `toast_severidades_ativas` | `text[]` | não | `'{critica,alta}'::text[]` |  | Dicionário estrutural da coluna toast_severidades_ativas em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: toast_severidades_ativas; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{critica,alta}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `toast_duracao_segundos` | `integer` | não | `12` |  | Dicionário estrutural da coluna toast_duracao_segundos em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: toast_duracao_segundos; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 12. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `toast_acoes` | `jsonb` | não | `'{"copiar_id": false, "drill_down": true, "marcar_lida": false, "abrir_pagina": true}'::jsonb` |  | Dicionário estrutural da coluna toast_acoes em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: toast_acoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{"copiar_id": false, "drill_down": true, "marcar_lida": false, "abrir_pagina": true}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `drawer_acoes` | `jsonb` | não | `'{"copiar_id": false, "marcar_lida": false, "abrir_entidade": true, "pagina_completa": true}'::jsonb` |  | Dicionário estrutural da coluna drawer_acoes em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: drawer_acoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{"copiar_id": false, "marcar_lida": false, "abrir_entidade": true, "pagina_completa": true}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `silenciar_ate` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna silenciar_ate em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: silenciar_ate; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `centros_custo_silenciados` | `uuid[]` | não | `'{}'::uuid[]` |  | Dicionário estrutural da coluna centros_custo_silenciados em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: centros_custo_silenciados; o catálogo não especifica significado adicional. Tipo: uuid[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::uuid[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 11 | `tipos_silenciados` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna tipos_silenciados em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: tipos_silenciados; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna updated_at em public.user_anomalia_preferences. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_anomalia_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_anomalia_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_anomalia_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_anomalia_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_anomalia_preferences_pkey ON public.user_anomalia_preferences USING btree (id)` |
| user_anomalia_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_anomalia_preferences_user_id_key ON public.user_anomalia_preferences USING btree (user_id)` |


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
| set_updated_at_7c3e342523c10fdce4a8 | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| tr_user_anomalia_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
