# public.acessos_suspeitos

> Dicionário estrutural de public.acessos_suspeitos (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: PRIMARY KEY (id); CHECK (severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])); CHECK (tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text])). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.acessos_suspeitos. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `user_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna user_id em public.acessos_suspeitos. Papel funcional indicado pelo identificador: user_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.acessos_suspeitos. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `ip_address` | `inet` | sim |  |  | Dicionário estrutural da coluna ip_address em public.acessos_suspeitos. Papel funcional indicado pelo identificador: ip_address; o catálogo não especifica significado adicional. Tipo: inet. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `user_agent` | `text` | sim |  |  | Dicionário estrutural da coluna user_agent em public.acessos_suspeitos. Papel funcional indicado pelo identificador: user_agent; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `event_type` | `text` | sim |  |  | Dicionário estrutural da coluna event_type em public.acessos_suspeitos. Papel funcional indicado pelo identificador: event_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `details` | `jsonb` | sim |  |  | Dicionário estrutural da coluna details em public.acessos_suspeitos. Papel funcional indicado pelo identificador: details; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.acessos_suspeitos. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 9 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.acessos_suspeitos. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `severidade` | `text` | não |  |  | Dicionário estrutural da coluna severidade em public.acessos_suspeitos. Papel funcional indicado pelo identificador: severidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `janela_inicio` | `timestamp with time zone` | não |  |  | Dicionário estrutural da coluna janela_inicio em public.acessos_suspeitos. Papel funcional indicado pelo identificador: janela_inicio; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `janela_fim` | `timestamp with time zone` | não |  |  | Dicionário estrutural da coluna janela_fim em public.acessos_suspeitos. Papel funcional indicado pelo identificador: janela_fim; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `user_email` | `text` | sim |  |  | Dicionário estrutural da coluna user_email em public.acessos_suspeitos. Papel funcional indicado pelo identificador: user_email; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `table_name` | `text` | sim |  |  | Dicionário estrutural da coluna table_name em public.acessos_suspeitos. Papel funcional indicado pelo identificador: table_name; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `ocorrencias` | `integer` | não | `0` |  | Dicionário estrutural da coluna ocorrencias em public.acessos_suspeitos. Papel funcional indicado pelo identificador: ocorrencias; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 16 | `baseline` | `numeric` | sim |  |  | Dicionário estrutural da coluna baseline em public.acessos_suspeitos. Papel funcional indicado pelo identificador: baseline; o catálogo não especifica significado adicional. Tipo: numeric. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 17 | `detalhes` | `jsonb` | não | `'{}'::jsonb` |  | Dicionário estrutural da coluna detalhes em public.acessos_suspeitos. Papel funcional indicado pelo identificador: detalhes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 18 | `revisado_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna revisado_em em public.acessos_suspeitos. Papel funcional indicado pelo identificador: revisado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 19 | `revisado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna revisado_por em public.acessos_suspeitos. Papel funcional indicado pelo identificador: revisado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| acessos_suspeitos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| acessos_suspeitos_severidade_check | CHECK | `CHECK (severidade = ANY (ARRAY['info'::text, 'warning'::text, 'critical'::text]))` |  |  | sim |
| acessos_suspeitos_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['cross_tenant'::text, 'admin_pico'::text, 'admin_fora_horario'::text, 'delecao_massa'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| acessos_suspeitos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX acessos_suspeitos_pkey ON public.acessos_suspeitos USING btree (id)` |
| uq_acessos_suspeitos_janela | btree | tipo, janela_inicio | sim | sim |  | `CREATE UNIQUE INDEX uq_acessos_suspeitos_janela ON public.acessos_suspeitos USING btree (tipo, janela_inicio, COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(table_name, ''::text))` |


## Policies (RLS)

### `acessos_suspeitos_tenant_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND ((empresa_id IS NULL) OR empresa_acessivel(empresa_id)))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
