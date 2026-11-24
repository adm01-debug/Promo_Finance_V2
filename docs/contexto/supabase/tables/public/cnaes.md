# public.cnaes

> Dicionário estrutural de public.cnaes (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (anexo_simples = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text])); CHECK (codigo ~ '^[0-9]{4}-[0-9]/[0-9]{2}$'::text); UNIQUE (codigo); PRIMARY KEY (id); CHECK (presuncao_irpj > 0::numeric AND presuncao_irpj <= 1::numeric AND presuncao_csll > 0::numeric AND presuncao_csll <= 1::numeric); CHECK (rat_padrao = ANY (ARRAY[0.01, 0.02, 0.03])); CHECK (terceiros_padrao >= 0::numeric AND terceiros_padrao <= 0.1). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.cnaes. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `codigo` | `text` | não |  |  | Dicionário estrutural da coluna codigo em public.cnaes. Papel funcional indicado pelo identificador: codigo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (codigo ~ '^[0-9]{4}-[0-9]/[0-9]{2}$'::text); UNIQUE (codigo). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `descricao` | `text` | não |  |  | Dicionário estrutural da coluna descricao em public.cnaes. Papel funcional indicado pelo identificador: descricao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `anexo_simples` | `text` | sim |  |  | Dicionário estrutural da coluna anexo_simples em public.cnaes. Papel funcional indicado pelo identificador: anexo_simples; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (anexo_simples = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `sujeito_fator_r` | `boolean` | não | `false` |  | Dicionário estrutural da coluna sujeito_fator_r em public.cnaes. Papel funcional indicado pelo identificador: sujeito_fator_r; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `vedado_simples` | `boolean` | não | `false` |  | Dicionário estrutural da coluna vedado_simples em public.cnaes. Papel funcional indicado pelo identificador: vedado_simples; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: false. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `presuncao_irpj` | `numeric` | não | `0.08` |  | Dicionário estrutural da coluna presuncao_irpj em public.cnaes. Papel funcional indicado pelo identificador: presuncao_irpj; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.08. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (presuncao_irpj > 0::numeric AND presuncao_irpj <= 1::numeric AND presuncao_csll > 0::numeric AND presuncao_csll <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 8 | `presuncao_csll` | `numeric` | não | `0.12` |  | Dicionário estrutural da coluna presuncao_csll em public.cnaes. Papel funcional indicado pelo identificador: presuncao_csll; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.12. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (presuncao_irpj > 0::numeric AND presuncao_irpj <= 1::numeric AND presuncao_csll > 0::numeric AND presuncao_csll <= 1::numeric). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 9 | `rat_padrao` | `numeric` | não | `0.02` |  | Dicionário estrutural da coluna rat_padrao em public.cnaes. Papel funcional indicado pelo identificador: rat_padrao; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.02. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (rat_padrao = ANY (ARRAY[0.01, 0.02, 0.03])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 10 | `terceiros_padrao` | `numeric` | não | `0.058` |  | Dicionário estrutural da coluna terceiros_padrao em public.cnaes. Papel funcional indicado pelo identificador: terceiros_padrao; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0.058. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (terceiros_padrao >= 0::numeric AND terceiros_padrao <= 0.1). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 11 | `atividade` | `atividade_economica` | sim |  |  | Dicionário estrutural da coluna atividade em public.cnaes. Papel funcional indicado pelo identificador: atividade; o catálogo não especifica significado adicional. Tipo: atividade_economica. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: INDUSTRIA, COMERCIO, SERVICOS, MISTA. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.cnaes. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.cnaes. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cnaes_anexo_simples_check | CHECK | `CHECK (anexo_simples = ANY (ARRAY['I'::text, 'II'::text, 'III'::text, 'IV'::text, 'V'::text]))` |  |  | sim |
| cnaes_codigo_formato_chk | CHECK | `CHECK (codigo ~ '^[0-9]{4}-[0-9]/[0-9]{2}$'::text)` |  |  | sim |
| cnaes_codigo_key | UNIQUE | `UNIQUE (codigo)` |  |  | sim |
| cnaes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cnaes_presuncoes_range_chk | CHECK | `CHECK (presuncao_irpj > 0::numeric AND presuncao_irpj <= 1::numeric AND presuncao_csll > 0::numeric AND presuncao_csll <= 1::numeric)` |  |  | sim |
| cnaes_rat_valores_chk | CHECK | `CHECK (rat_padrao = ANY (ARRAY[0.01, 0.02, 0.03]))` |  |  | sim |
| cnaes_terceiros_range_chk | CHECK | `CHECK (terceiros_padrao >= 0::numeric AND terceiros_padrao <= 0.1)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cnaes_codigo_key | btree | codigo | sim | sim |  | `CREATE UNIQUE INDEX cnaes_codigo_key ON public.cnaes USING btree (codigo)` |
| cnaes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cnaes_pkey ON public.cnaes USING btree (id)` |


## Policies (RLS)

### `cnaes_select_authenticated`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `cnaes_write_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |
| WITH CHECK | `has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_cnaes_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
