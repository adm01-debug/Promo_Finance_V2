# public.cnpja_rate_limit

> Dicionário estrutural de public.cnpja_rate_limit (tabela). Chave primária declarada: user_id, window_start. Restrições declaradas no catálogo: PRIMARY KEY (user_id, window_start). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `user_id` | `uuid` | não |  |  | Dicionário estrutural da coluna user_id em public.cnpja_rate_limit. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (user_id, window_start). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `window_start` | `timestamp with time zone` | não |  |  | Dicionário estrutural da coluna window_start em public.cnpja_rate_limit. Papel funcional indicado pelo identificador: window_start; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (user_id, window_start). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 3 | `request_count` | `integer` | não | `0` |  | Dicionário estrutural da coluna request_count em public.cnpja_rate_limit. Papel funcional indicado pelo identificador: request_count; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnpja_rate_limit_pkey | PRIMARY KEY | `PRIMARY KEY (user_id, window_start)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnpja_rate_limit_pkey | btree | user_id, window_start | sim | sim |  | `CREATE UNIQUE INDEX cnpja_rate_limit_pkey ON public.cnpja_rate_limit USING btree (user_id, window_start)` |
| idx_cnpja_rate_limit_window | btree | window_start | não | sim |  | `CREATE INDEX idx_cnpja_rate_limit_window ON public.cnpja_rate_limit USING btree (window_start)` |


## Policies (RLS)

### `Usuário vê próprio uso CNPJá`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
