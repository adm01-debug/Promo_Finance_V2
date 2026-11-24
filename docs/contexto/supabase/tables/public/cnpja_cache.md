# public.cnpja_cache

> Dicionário estrutural de public.cnpja_cache (tabela). Chave primária declarada: cnpj. Restrições declaradas no catálogo: CHECK (cnpj ~ '^[0-9]{14}$'::text); PRIMARY KEY (cnpj); CHECK (expires_at > fetched_at). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `cnpj` | `text` | não |  |  | Dicionário estrutural da coluna cnpj em public.cnpja_cache. Papel funcional indicado pelo identificador: cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (cnpj ~ '^[0-9]{14}$'::text); PRIMARY KEY (cnpj). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `data` | `jsonb` | não |  |  | Dicionário estrutural da coluna data em public.cnpja_cache. Papel funcional indicado pelo identificador: data; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 3 | `cached_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna cached_at em public.cnpja_cache. Papel funcional indicado pelo identificador: cached_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 4 | `expires_at` | `timestamp with time zone` | não | `(now() + '30 days'::interval)` |  | Dicionário estrutural da coluna expires_at em public.cnpja_cache. Papel funcional indicado pelo identificador: expires_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: (now() + '30 days'::interval). Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (expires_at > fetched_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 5 | `situacao_cadastral` | `text` | sim |  |  | Dicionário estrutural da coluna situacao_cadastral em public.cnpja_cache. Papel funcional indicado pelo identificador: situacao_cadastral; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `fetched_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna fetched_at em public.cnpja_cache. Papel funcional indicado pelo identificador: fetched_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (expires_at > fetched_at). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.cnpja_cache. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 8 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.cnpja_cache. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnpja_cache_cnpj_check | CHECK | `CHECK (cnpj ~ '^[0-9]{14}$'::text)` |  |  | sim |
| cnpja_cache_pkey | PRIMARY KEY | `PRIMARY KEY (cnpj)` |  |  | sim |
| cnpja_cache_validade | CHECK | `CHECK (expires_at > fetched_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnpja_cache_pkey | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX cnpja_cache_pkey ON public.cnpja_cache USING btree (cnpj)` |


## Policies (RLS)

### `cnpja_cache_service_role_only`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_cnpja_cache_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
