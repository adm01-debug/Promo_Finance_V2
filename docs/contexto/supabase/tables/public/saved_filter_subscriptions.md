# public.saved_filter_subscriptions

> Dicionário estrutural de public.saved_filter_subscriptions (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text])); UNIQUE (filter_id, user_id, canal); PRIMARY KEY (id); UNIQUE (user_id, saved_filter_id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: Preferências de notificação associadas a filtros salvos. Horários sem fuso são interpretados como hora local de America/Sao_Paulo.

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `filter_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna filter_id em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: filter_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (filter_id, user_id, canal). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (filter_id, user_id, canal); UNIQUE (user_id, saved_filter_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `canal` | `text` | sim |  |  | Dicionário estrutural da coluna canal em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: canal; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text])); UNIQUE (filter_id, user_id, canal). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `frequencia` | `subscription_frequencia` | não | `'imediata'::subscription_frequencia` |  | Dicionário estrutural da coluna frequencia em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: frequencia; o catálogo não especifica significado adicional. Tipo: subscription_frequencia. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'imediata'::subscription_frequencia. Valores de enum: imediata, horaria, diaria. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `saved_filter_id` | `uuid` | não |  |  | Dicionário estrutural da coluna saved_filter_id em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: saved_filter_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (user_id, saved_filter_id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `ultimo_envio_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna ultimo_envio_em em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: ultimo_envio_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `notify_inapp` | `boolean` | não | `true` |  | Dicionário estrutural da coluna notify_inapp em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: notify_inapp; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `notify_push` | `boolean` | não | `false` |  | Dicionário estrutural da coluna notify_push em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: notify_push; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `notify_email` | `boolean` | não | `false` |  | Dicionário estrutural da coluna notify_email em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: notify_email; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `horario_preferido` | `time without time zone` | não | `'09:00:00'::time without time zone` |  | Dicionário estrutural da coluna horario_preferido em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: horario_preferido; o catálogo não especifica significado adicional. Tipo: time without time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '09:00:00'::time without time zone. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: Horário local preferido para envio, sem informação de fuso na coluna. Regra funcional acordada: interpretar em America/Sao_Paulo. Valor padrão: 09:00:00. |
| 15 | `severidades_criticas` | `text[]` | não | `ARRAY['critica'::text]` |  | Dicionário estrutural da coluna severidades_criticas em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: severidades_criticas; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: ARRAY['critica'::text]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 16 | `tipos_eventos_ativos` | `text[]` | não | `ARRAY[]::text[]` |  | Dicionário estrutural da coluna tipos_eventos_ativos em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: tipos_eventos_ativos; o catálogo não especifica significado adicional. Tipo: text[]. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: ARRAY[]::text[]. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Array; o tipo não define domínio permitido para os elementos, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 17 | `rate_limit_max` | `integer` | não | `5` |  | Dicionário estrutural da coluna rate_limit_max em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: rate_limit_max; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 5. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 18 | `rate_limit_window_min` | `integer` | não | `10` |  | Dicionário estrutural da coluna rate_limit_window_min em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: rate_limit_window_min; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 10. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 19 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna last_seen_at em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: last_seen_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 20 | `next_dispatch_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna next_dispatch_at em public.saved_filter_subscriptions. Papel funcional indicado pelo identificador: next_dispatch_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| saved_filter_subscriptions_canal_check | CHECK | `CHECK (canal = ANY (ARRAY['email'::text, 'push'::text, 'whatsapp'::text]))` |  |  | sim |
| saved_filter_subscriptions_filter_id_user_id_canal_key | UNIQUE | `UNIQUE (filter_id, user_id, canal)` |  |  | sim |
| saved_filter_subscriptions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| saved_filter_subscriptions_user_id_saved_filter_id_key | UNIQUE | `UNIQUE (user_id, saved_filter_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sfs_filter | btree | saved_filter_id | não | sim |  | `CREATE INDEX idx_sfs_filter ON public.saved_filter_subscriptions USING btree (saved_filter_id)` |
| idx_sfs_user | btree | user_id | não | sim |  | `CREATE INDEX idx_sfs_user ON public.saved_filter_subscriptions USING btree (user_id)` |
| saved_filter_subscriptions_filter_id_user_id_canal_key | btree | filter_id, user_id, canal | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_filter_id_user_id_canal_key ON public.saved_filter_subscriptions USING btree (filter_id, user_id, canal)` |
| saved_filter_subscriptions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_pkey ON public.saved_filter_subscriptions USING btree (id)` |
| saved_filter_subscriptions_user_id_saved_filter_id_key | btree | user_id, saved_filter_id | sim | sim |  | `CREATE UNIQUE INDEX saved_filter_subscriptions_user_id_saved_filter_id_key ON public.saved_filter_subscriptions USING btree (user_id, saved_filter_id)` |


## Policies (RLS)

### `saved_filter_subscriptions_owner`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(user_id = ( SELECT auth.uid() AS uid))` |
| WITH CHECK | `(user_id = ( SELECT auth.uid() AS uid))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_saved_filter_subs_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
