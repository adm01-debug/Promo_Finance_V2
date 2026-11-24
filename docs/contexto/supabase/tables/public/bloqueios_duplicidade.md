# public.bloqueios_duplicidade

> Dicionário estrutural de public.bloqueios_duplicidade (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (empresa_id) REFERENCES empresas(id); PRIMARY KEY (id); FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id) ON DELETE SET NULL; FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE SET NULL. A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `transacao_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna transacao_id em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: transacao_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `valor_bloqueado` | `numeric(15,2)` | sim |  |  | Dicionário estrutural da coluna valor_bloqueado em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: valor_bloqueado; o catálogo não especifica significado adicional. Tipo: numeric(15,2). Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `motivo` | `text` | sim |  |  | Dicionário estrutural da coluna motivo em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: motivo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna created_at em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `usuario_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna usuario_id em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: usuario_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE SET NULL. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `dados_tentativa` | `jsonb` | sim |  |  | Dicionário estrutural da coluna dados_tentativa em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: dados_tentativa; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 9 | `fornecedor_nome` | `text` | sim |  |  | Dicionário estrutural da coluna fornecedor_nome em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: fornecedor_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `cnpj_fornecedor` | `text` | sim |  |  | Dicionário estrutural da coluna cnpj_fornecedor em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: cnpj_fornecedor; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `numero_documento` | `text` | sim |  |  | Dicionário estrutural da coluna numero_documento em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: numero_documento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `mes_vencimento` | `text` | sim |  |  | Dicionário estrutural da coluna mes_vencimento em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: mes_vencimento; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 13 | `nivel_criticidade` | `text` | sim |  |  | Dicionário estrutural da coluna nivel_criticidade em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: nivel_criticidade; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `status` | `text` | sim | `'ativo'::text` |  | Dicionário estrutural da coluna status em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'ativo'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 15 | `ip_origem` | `text` | sim |  |  | Dicionário estrutural da coluna ip_origem em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: ip_origem; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `agente` | `text` | sim |  |  | Dicionário estrutural da coluna agente em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: agente; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `tabela` | `text` | sim | `'contas_pagar'::text` |  | Dicionário estrutural da coluna tabela em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: tabela; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: 'contas_pagar'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 18 | `motivo_bloqueio` | `text` | sim |  |  | Dicionário estrutural da coluna motivo_bloqueio em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: motivo_bloqueio; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 19 | `match_type` | `text` | sim |  |  | Dicionário estrutural da coluna match_type em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: match_type; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 20 | `campos_conflitantes` | `jsonb` | sim |  |  | Dicionário estrutural da coluna campos_conflitantes em public.bloqueios_duplicidade. Papel funcional indicado pelo identificador: campos_conflitantes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bloqueios_duplicidade_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id)` | NO ACTION | NO ACTION | sim |
| bloqueios_duplicidade_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| bloqueios_duplicidade_transacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (transacao_id) REFERENCES transacoes_bancarias(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| bloqueios_duplicidade_usuario_id_fkey | FOREIGN KEY | `FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bloqueios_duplicidade_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bloqueios_duplicidade_pkey ON public.bloqueios_duplicidade USING btree (id)` |
| idx_bloqueios_duplicidade_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_bloqueios_duplicidade_empresa_id ON public.bloqueios_duplicidade USING btree (empresa_id)` |
| idx_bloqueios_duplicidade_transacao_id_fk | btree | transacao_id | não | sim |  | `CREATE INDEX idx_bloqueios_duplicidade_transacao_id_fk ON public.bloqueios_duplicidade USING btree (transacao_id)` |
| idx_bloqueios_duplicidade_usuario_id_fk | btree | usuario_id | não | sim |  | `CREATE INDEX idx_bloqueios_duplicidade_usuario_id_fk ON public.bloqueios_duplicidade USING btree (usuario_id)` |


## Policies (RLS)

### `Empresa-based access`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((empresa_id IN ( SELECT user_empresas.empresa_id    FROM user_empresas   WHERE ((user_empresas.user_id = ( SELECT auth.uid() AS uid)) AND (user_empresas.ativo = true)))) OR (EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = ( SELECT auth.uid() AS uid)) AND (user_roles.role = 'admin'::app_role)))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
