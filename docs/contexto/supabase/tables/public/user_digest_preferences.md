# public.user_digest_preferences

> Dicionário estrutural de public.user_digest_preferences (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (dia_mes >= 1 AND dia_mes <= 28); CHECK (dia_semana >= 0 AND dia_semana <= 6); CHECK (email_alternativo IS NULL OR email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text); CHECK (frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text])); CHECK (hora_envio >= 0 AND hora_envio <= 23); CHECK (max_alertas >= 1 AND max_alertas <= 500); PRIMARY KEY (id); CHECK (severidade_minima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])); FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.user_digest_preferences. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.user_digest_preferences. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; UNIQUE (user_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.user_digest_preferences. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `frequencia` | `text` | não | `'diaria'::text` |  | Dicionário estrutural da coluna frequencia em public.user_digest_preferences. Papel funcional indicado pelo identificador: frequencia; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'diaria'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `dia_semana` | `integer` | não | `1` |  | Dicionário estrutural da coluna dia_semana em public.user_digest_preferences. Papel funcional indicado pelo identificador: dia_semana; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 1. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (dia_semana >= 0 AND dia_semana <= 6). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `dia_mes` | `integer` | não | `1` |  | Dicionário estrutural da coluna dia_mes em public.user_digest_preferences. Papel funcional indicado pelo identificador: dia_mes; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 1. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (dia_mes >= 1 AND dia_mes <= 28). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 7 | `hora_envio` | `integer` | não | `8` |  | Dicionário estrutural da coluna hora_envio em public.user_digest_preferences. Papel funcional indicado pelo identificador: hora_envio; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 8. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (hora_envio >= 0 AND hora_envio <= 23). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: Hora preferida para envio do resumo, representada por inteiro. O banco restringe o valor ao intervalo de 0 a 23; a interpretação acordada é hora local de America/Sao_Paulo. Valor padrão: 8. |
| 8 | `severidade_minima` | `text` | não | `'media'::text` |  | Dicionário estrutural da coluna severidade_minima em public.user_digest_preferences. Papel funcional indicado pelo identificador: severidade_minima; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'media'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severidade_minima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `tipos_ignorados` | `text[]` | não | `'{}'::text[]` |  | Dicionário estrutural da coluna tipos_ignorados em public.user_digest_preferences. Papel funcional indicado pelo identificador: tipos_ignorados; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 10 | `empresas_filtro` | `uuid[]` | não | `'{}'::uuid[]` |  | Dicionário estrutural da coluna empresas_filtro em public.user_digest_preferences. Papel funcional indicado pelo identificador: empresas_filtro; o catálogo não especifica significado adicional. Tipo: uuid[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::uuid[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 11 | `email_alternativo` | `text` | sim |  |  | Dicionário estrutural da coluna email_alternativo em public.user_digest_preferences. Papel funcional indicado pelo identificador: email_alternativo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (email_alternativo IS NULL OR email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `max_alertas` | `integer` | não | `50` |  | Dicionário estrutural da coluna max_alertas em public.user_digest_preferences. Papel funcional indicado pelo identificador: max_alertas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 50. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (max_alertas >= 1 AND max_alertas <= 500). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 13 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna ultimo_envio_em em public.user_digest_preferences. Papel funcional indicado pelo identificador: ultimo_envio_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `ultimo_hash` | `text` | sim |  |  | Dicionário estrutural da coluna ultimo_hash em public.user_digest_preferences. Papel funcional indicado pelo identificador: ultimo_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.user_digest_preferences. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.user_digest_preferences. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_digest_preferences_dia_mes_check | CHECK | `CHECK (dia_mes >= 1 AND dia_mes <= 28)` |  |  | sim |
| user_digest_preferences_dia_semana_check | CHECK | `CHECK (dia_semana >= 0 AND dia_semana <= 6)` |  |  | sim |
| user_digest_preferences_email_alternativo_check | CHECK | `CHECK (email_alternativo IS NULL OR email_alternativo ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)` |  |  | sim |
| user_digest_preferences_frequencia_check | CHECK | `CHECK (frequencia = ANY (ARRAY['diaria'::text, 'semanal'::text, 'mensal'::text]))` |  |  | sim |
| user_digest_preferences_hora_envio_check | CHECK | `CHECK (hora_envio >= 0 AND hora_envio <= 23)` |  |  | sim |
| user_digest_preferences_max_alertas_check | CHECK | `CHECK (max_alertas >= 1 AND max_alertas <= 500)` |  |  | sim |
| user_digest_preferences_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_digest_preferences_severidade_minima_check | CHECK | `CHECK (severidade_minima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| user_digest_preferences_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_digest_preferences_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_digest_preferences_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_digest_preferences_pkey ON public.user_digest_preferences USING btree (id)` |
| user_digest_preferences_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_digest_preferences_user_id_key ON public.user_digest_preferences USING btree (user_id)` |


## Policies (RLS)

### `Admins visualizam preferencias de digest`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `Usuarios gerenciam suas preferencias de digest`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |
| WITH CHECK | `(( SELECT ( SELECT auth.uid() AS uid) AS uid) = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_user_digest_preferences_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
