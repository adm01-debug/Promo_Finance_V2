# public.empresas_certificados

> Dicionário estrutural de public.empresas_certificados (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: FOREIGN KEY (criado_por) REFERENCES auth.users(id); UNIQUE (empresa_id, cnpj, ambiente); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.empresas_certificados. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | não |  |  | Dicionário estrutural da coluna empresa_id em public.empresas_certificados. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, cnpj, ambiente); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `cnpj` | `text` | não |  |  | Dicionário estrutural da coluna cnpj em public.empresas_certificados. Papel funcional indicado pelo identificador: cnpj; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: UNIQUE (empresa_id, cnpj, ambiente). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `razao_social` | `text` | sim |  |  | Dicionário estrutural da coluna razao_social em public.empresas_certificados. Papel funcional indicado pelo identificador: razao_social; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `valido_de` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna valido_de em public.empresas_certificados. Papel funcional indicado pelo identificador: valido_de; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 6 | `valido_ate` | `timestamp with time zone` | não |  |  | Dicionário estrutural da coluna valido_ate em public.empresas_certificados. Papel funcional indicado pelo identificador: valido_ate; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 7 | `ambiente` | `sefaz_ambiente` | não | `'homologacao'::sefaz_ambiente` |  | Dicionário estrutural da coluna ambiente em public.empresas_certificados. Papel funcional indicado pelo identificador: ambiente; o catálogo não especifica significado adicional. Tipo: sefaz_ambiente. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'homologacao'::sefaz_ambiente. Valores de enum: homologacao, producao. Restrições que envolvem a coluna: UNIQUE (empresa_id, cnpj, ambiente). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `uf` | `text` | não |  |  | Dicionário estrutural da coluna uf em public.empresas_certificados. Papel funcional indicado pelo identificador: uf; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `ativo` | `boolean` | não | `true` |  | Dicionário estrutural da coluna ativo em public.empresas_certificados. Papel funcional indicado pelo identificador: ativo; o catálogo não especifica significado adicional. Tipo: boolean. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: true. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `criado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna criado_por em public.empresas_certificados. Papel funcional indicado pelo identificador: criado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (criado_por) REFERENCES auth.users(id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.empresas_certificados. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.empresas_certificados. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `pfx_storage_path` | `text` | não |  |  | Dicionário estrutural da coluna pfx_storage_path em public.empresas_certificados. Papel funcional indicado pelo identificador: pfx_storage_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 14 | `password_encrypted` | `bytea` | sim |  |  | Dicionário estrutural da coluna password_encrypted em public.empresas_certificados. Papel funcional indicado pelo identificador: password_encrypted; o catálogo não especifica significado adicional. Tipo: bytea. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| empresas_certificados_criado_por_fkey | FOREIGN KEY | `FOREIGN KEY (criado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| empresas_certificados_empresa_id_cnpj_ambiente_key | UNIQUE | `UNIQUE (empresa_id, cnpj, ambiente)` |  |  | sim |
| empresas_certificados_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| empresas_certificados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| empresas_certificados_empresa_id_cnpj_ambiente_key | btree | empresa_id, cnpj, ambiente | sim | sim |  | `CREATE UNIQUE INDEX empresas_certificados_empresa_id_cnpj_ambiente_key ON public.empresas_certificados USING btree (empresa_id, cnpj, ambiente)` |
| empresas_certificados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX empresas_certificados_pkey ON public.empresas_certificados USING btree (id)` |
| idx_empresas_certificados_criado_por | btree | criado_por | não | sim | `(criado_por IS NOT NULL)` | `CREATE INDEX idx_empresas_certificados_criado_por ON public.empresas_certificados USING btree (criado_por) WHERE (criado_por IS NOT NULL)` |
| idx_empresas_certificados_criado_por_fk | btree | criado_por | não | sim |  | `CREATE INDEX idx_empresas_certificados_criado_por_fk ON public.empresas_certificados USING btree (criado_por)` |


## Policies (RLS)

### `cert_empresa_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_empresas ue   WHERE ((ue.user_id = ( SELECT auth.uid() AS uid)) AND (ue.empresa_id = empresas_certificados.empresa_id))))` |
| WITH CHECK |  |

### `empresas_certificados_tenant_rw`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_role(( SELECT ( SELECT auth.uid() AS uid) AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_emp_cert_updated | BEFORE | UPDATE | ROW | enabled | public.tg_touch_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
