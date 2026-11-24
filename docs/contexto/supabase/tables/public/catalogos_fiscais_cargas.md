# public.catalogos_fiscais_cargas

> Dicionário estrutural de public.catalogos_fiscais_cargas (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text])); PRIMARY KEY (id); CHECK (status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `origem` | `text` | não | `'cron'::text` |  | Dicionário estrutural da coluna origem em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'cron'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `status` | `text` | não | `'ok'::text` |  | Dicionário estrutural da coluna status em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'ok'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `checksum` | `text` | sim |  |  | Dicionário estrutural da coluna checksum em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: checksum; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `contagens` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna contagens em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: contagens; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 6 | `houve_alteracao` | `boolean` | não | `false` |  | Dicionário estrutural da coluna houve_alteracao em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: houve_alteracao; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `vinculos_normalizados` | `integer` | não | `0` |  | Dicionário estrutural da coluna vinculos_normalizados em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: vinculos_normalizados; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `criticos` | `integer` | não | `0` |  | Dicionário estrutural da coluna criticos em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: criticos; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `duracao_ms` | `integer` | não | `0` |  | Dicionário estrutural da coluna duracao_ms em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: duracao_ms; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `mensagem` | `text` | sim |  |  | Dicionário estrutural da coluna mensagem em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: mensagem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `last_updated` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna last_updated em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: last_updated; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.catalogos_fiscais_cargas. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| catalogos_fiscais_cargas_origem_check | CHECK | `CHECK (origem = ANY (ARRAY['cron'::text, 'manual'::text, 'ci'::text, 'migration'::text]))` |  |  | sim |
| catalogos_fiscais_cargas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| catalogos_fiscais_cargas_status_check | CHECK | `CHECK (status = ANY (ARRAY['ok'::text, 'erro'::text, 'sem_alteracao'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| catalogos_fiscais_cargas_checksum_key | btree | checksum | sim | sim |  | `CREATE UNIQUE INDEX catalogos_fiscais_cargas_checksum_key ON public.catalogos_fiscais_cargas USING btree (checksum)` |
| catalogos_fiscais_cargas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX catalogos_fiscais_cargas_pkey ON public.catalogos_fiscais_cargas USING btree (id)` |


## Policies (RLS)

### `Admins leem cargas de catalogos fiscais`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| set_updated_at_catalogos_fiscais_cargas | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
