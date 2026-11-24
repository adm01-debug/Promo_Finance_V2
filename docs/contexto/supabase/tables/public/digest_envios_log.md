# public.digest_envios_log

> Dicionário estrutural de public.digest_envios_log (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (multa_total >= 0::numeric); PRIMARY KEY (id); CHECK (severidade_maxima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])); CHECK (situacao = ANY (ARRAY['enviado'::text, 'ignorado'::text, 'falhou'::text, 'simulado'::text])); CHECK (total_alertas >= 0); CHECK (total_empresas >= 0). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.digest_envios_log. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `execucao_id` | `uuid` | não |  |  | Dicionário estrutural da coluna execucao_id em public.digest_envios_log. Papel funcional indicado pelo identificador: execucao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.digest_envios_log. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `email` | `text` | não |  |  | Dicionário estrutural da coluna email em public.digest_envios_log. Papel funcional indicado pelo identificador: email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `situacao` | `text` | não |  |  | Dicionário estrutural da coluna situacao em public.digest_envios_log. Papel funcional indicado pelo identificador: situacao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (situacao = ANY (ARRAY['enviado'::text, 'ignorado'::text, 'falhou'::text, 'simulado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `motivo` | `text` | sim |  |  | Dicionário estrutural da coluna motivo em public.digest_envios_log. Papel funcional indicado pelo identificador: motivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `erro` | `text` | sim |  |  | Dicionário estrutural da coluna erro em public.digest_envios_log. Papel funcional indicado pelo identificador: erro; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `total_alertas` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_alertas em public.digest_envios_log. Papel funcional indicado pelo identificador: total_alertas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (total_alertas >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `total_empresas` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_empresas em public.digest_envios_log. Papel funcional indicado pelo identificador: total_empresas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (total_empresas >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `severidade_maxima` | `text` | sim |  |  | Dicionário estrutural da coluna severidade_maxima em public.digest_envios_log. Papel funcional indicado pelo identificador: severidade_maxima; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severidade_maxima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `multa_total` | `numeric` | não | `0` |  | Dicionário estrutural da coluna multa_total em public.digest_envios_log. Papel funcional indicado pelo identificador: multa_total; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (multa_total >= 0::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Convenção previamente confirmada para valores monetários: reais (BRL), em unidades monetárias e não centavos; aplicar somente quando o campo representar valor monetário. Comentário anterior no catálogo: nenhum |
| 12 | `hash_conteudo` | `text` | sim |  |  | Dicionário estrutural da coluna hash_conteudo em public.digest_envios_log. Papel funcional indicado pelo identificador: hash_conteudo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `duplicado` | `boolean` | não | `false` |  | Dicionário estrutural da coluna duplicado em public.digest_envios_log. Papel funcional indicado pelo identificador: duplicado; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `simulado` | `boolean` | não | `false` |  | Dicionário estrutural da coluna simulado em public.digest_envios_log. Papel funcional indicado pelo identificador: simulado; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.digest_envios_log. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| digest_envios_log_multa_total_check | CHECK | `CHECK (multa_total >= 0::numeric)` |  |  | sim |
| digest_envios_log_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| digest_envios_log_severidade_maxima_check | CHECK | `CHECK (severidade_maxima = ANY (ARRAY['baixa'::text, 'media'::text, 'alta'::text, 'critica'::text]))` |  |  | sim |
| digest_envios_log_situacao_check | CHECK | `CHECK (situacao = ANY (ARRAY['enviado'::text, 'ignorado'::text, 'falhou'::text, 'simulado'::text]))` |  |  | sim |
| digest_envios_log_total_alertas_check | CHECK | `CHECK (total_alertas >= 0)` |  |  | sim |
| digest_envios_log_total_empresas_check | CHECK | `CHECK (total_empresas >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| digest_envios_log_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX digest_envios_log_pkey ON public.digest_envios_log USING btree (id)` |
| idx_digest_envios_log_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_digest_envios_log_created_at ON public.digest_envios_log USING btree (created_at DESC)` |


## Policies (RLS)

### `Admins podem consultar o log de envios do digest`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK |  |

### `digest_envios_log_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `is_user_admin()` |
| WITH CHECK | `is_user_admin()` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
