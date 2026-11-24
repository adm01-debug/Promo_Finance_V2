# public.sefaz_dfe_cursor

> Dicionário estrutural de public.sefaz_dfe_cursor (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: UNIQUE (cnpj, ambiente); PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| usada por views | public.v_sefaz_observability |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `cnpj` | `text` | não |  |  | Dicionário estrutural da coluna cnpj em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (cnpj, ambiente). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  | Dicionário estrutural da coluna ambiente em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: ambiente; o catálogo não especifica significado adicional. Tipo: sefaz_ambiente. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'homologacao'::sefaz_ambiente. Valores de enum: homologacao, producao. Restrições que envolvem a coluna: UNIQUE (cnpj, ambiente). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `ultimo_nsu` | `bigint` | não | `0` |  | Dicionário estrutural da coluna ultimo_nsu em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: ultimo_nsu; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 5 | `max_nsu` | `bigint` | não | `0` |  | Dicionário estrutural da coluna max_nsu em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: max_nsu; o catálogo não especifica significado adicional. Tipo: bigint. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 6 | `ultima_consulta` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna ultima_consulta em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: ultima_consulta; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `ultimo_status` | `text` | sim |  |  | Dicionário estrutural da coluna ultimo_status em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: ultimo_status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `ultimo_erro` | `text` | sim |  |  | Dicionário estrutural da coluna ultimo_erro em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: ultimo_erro; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 11 | `retry_count` | `integer` | não | `0` |  | Dicionário estrutural da coluna retry_count em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: retry_count; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 12 | `next_run_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna next_run_at em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: next_run_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `last_error_at` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna last_error_at em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: last_error_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `circuit_open` | `boolean` | não | `false` |  | Dicionário estrutural da coluna circuit_open em public.sefaz_dfe_cursor. Papel funcional indicado pelo identificador: circuit_open; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sefaz_dfe_cursor_cnpj_ambiente_key | UNIQUE | `UNIQUE (cnpj, ambiente)` |  |  | sim |
| sefaz_dfe_cursor_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| sefaz_dfe_cursor_cnpj_ambiente_key | btree | cnpj, ambiente | sim | sim |  | `CREATE UNIQUE INDEX sefaz_dfe_cursor_cnpj_ambiente_key ON public.sefaz_dfe_cursor USING btree (cnpj, ambiente)` |
| sefaz_dfe_cursor_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sefaz_dfe_cursor_pkey ON public.sefaz_dfe_cursor USING btree (id)` |


## Policies (RLS)

### `cursor_admin_read`

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
| trg_dfe_cursor_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
