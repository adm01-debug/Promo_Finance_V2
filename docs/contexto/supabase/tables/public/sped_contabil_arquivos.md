# public.sped_contabil_arquivos

> Dicionário estrutural de public.sped_contabil_arquivos (tabela). Chave primária declarada: id. Restrições declaradas no catálogo: CHECK (ano_calendario >= 2000 AND ano_calendario <= 2100); FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE; PRIMARY KEY (id); CHECK (status = ANY (ARRAY['gerado'::text, 'rejeitado'::text, 'transmitido'::text, 'cancelado'::text])); CHECK (tipo = ANY (ARRAY['ECD'::text, 'ECF'::text])); CHECK (total_lancamentos >= 0); CHECK (total_linhas >= 0); CHECK (periodo_fim >= periodo_inicio). A finalidade de negócio não está formalizada além do nome da relação e de suas colunas; não inferir regras adicionais. Comentário anterior no catálogo: nenhum

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Dicionário estrutural da coluna id em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: gen_random_uuid(). Valores de enum: não aplicável. Restrições que envolvem a coluna: PRIMARY KEY (id). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 2 | `empresa_id` | `uuid` | sim |  |  | Dicionário estrutural da coluna empresa_id em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: empresa_id; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 3 | `tipo` | `text` | não |  |  | Dicionário estrutural da coluna tipo em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: tipo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (tipo = ANY (ARRAY['ECD'::text, 'ECF'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 4 | `competencia` | `date` | não |  |  | Dicionário estrutural da coluna competencia em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: competencia; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 5 | `arquivo_nome` | `text` | sim |  |  | Dicionário estrutural da coluna arquivo_nome em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: arquivo_nome; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 6 | `arquivo_path` | `text` | sim |  |  | Dicionário estrutural da coluna arquivo_path em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: arquivo_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 7 | `arquivo_hash` | `text` | sim |  |  | Dicionário estrutural da coluna arquivo_hash em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: arquivo_hash; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 8 | `periodo_inicio` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_inicio em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: periodo_inicio; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (periodo_fim >= periodo_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 9 | `periodo_fim` | `date` | sim |  |  | Dicionário estrutural da coluna periodo_fim em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: periodo_fim; o catálogo não especifica significado adicional. Tipo: date. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (periodo_fim >= periodo_inicio). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 10 | `status` | `text` | não | `'gerado'::text` |  | Dicionário estrutural da coluna status em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: status; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 'gerado'::text. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (status = ANY (ARRAY['gerado'::text, 'rejeitado'::text, 'transmitido'::text, 'cancelado'::text])). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 11 | `protocolo` | `text` | sim |  |  | Dicionário estrutural da coluna protocolo em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: protocolo; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 12 | `gerado_em` | `timestamp with time zone` | sim | `now()` |  | Dicionário estrutural da coluna gerado_em em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: gerado_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 13 | `transmitido_em` | `timestamp with time zone` | sim |  |  | Dicionário estrutural da coluna transmitido_em em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: transmitido_em; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 14 | `ano_calendario` | `integer` | não |  |  | Dicionário estrutural da coluna ano_calendario em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: ano_calendario; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (ano_calendario >= 2000 AND ano_calendario <= 2100). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 15 | `storage_path` | `text` | não |  |  | Dicionário estrutural da coluna storage_path em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: storage_path; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 16 | `hash_sha256` | `text` | sim |  |  | Dicionário estrutural da coluna hash_sha256 em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: hash_sha256; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 17 | `total_linhas` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_linhas em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: total_linhas; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (total_linhas >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 18 | `total_lancamentos` | `integer` | não | `0` |  | Dicionário estrutural da coluna total_lancamentos em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: total_lancamentos; o catálogo não especifica significado adicional. Tipo: integer. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: 0. Valores de enum: não aplicável. Restrições que envolvem a coluna: CHECK (total_lancamentos >= 0). Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Unidade, escala ou interpretação de negócio não determinadas pelo tipo PostgreSQL; usar apenas limites explicitamente registrados nas restrições. Comentário anterior no catálogo: nenhum |
| 19 | `validacoes` | `jsonb` | não | `'{"erros": [], "avisos": []}'::jsonb` |  | Dicionário estrutural da coluna validacoes em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: validacoes; o catálogo não especifica significado adicional. Tipo: jsonb. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: '{"erros": [], "avisos": []}'::jsonb. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. JSONB; as chaves e o contrato do documento não são definidos pelo tipo, salvo restrições listadas. Comentário anterior no catálogo: nenhum |
| 20 | `recibo_transmissao` | `text` | sim |  |  | Dicionário estrutural da coluna recibo_transmissao em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: recibo_transmissao; o catálogo não especifica significado adicional. Tipo: text. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 21 | `gerado_por` | `uuid` | sim |  |  | Dicionário estrutural da coluna gerado_por em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: gerado_por; o catálogo não especifica significado adicional. Tipo: uuid. Nulabilidade: NULL permitido. Geração: não declarada como gerada. Default: nenhum. Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Comentário anterior no catálogo: nenhum |
| 22 | `created_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna created_at em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: created_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |
| 23 | `updated_at` | `timestamp with time zone` | não | `now()` |  | Dicionário estrutural da coluna updated_at em public.sped_contabil_arquivos. Papel funcional indicado pelo identificador: updated_at; o catálogo não especifica significado adicional. Tipo: timestamp with time zone. Nulabilidade: NOT NULL. Geração: não declarada como gerada. Default: now(). Valores de enum: não aplicável. Restrições que envolvem a coluna: nenhuma. Não há domínio enumerado imposto pelo banco quando nenhuma restrição ou enum é listada. Instante temporal com fuso; PostgreSQL não preserva o nome original do fuso. Comentário anterior no catálogo: nenhum |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| sped_contabil_arquivos_ano_calendario_check | CHECK | `CHECK (ano_calendario >= 2000 AND ano_calendario <= 2100)` |  |  | sim |
| sped_contabil_arquivos_empresa_id_fkey | FOREIGN KEY | `FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| sped_contabil_arquivos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| sped_contabil_arquivos_status_check | CHECK | `CHECK (status = ANY (ARRAY['gerado'::text, 'rejeitado'::text, 'transmitido'::text, 'cancelado'::text]))` |  |  | sim |
| sped_contabil_arquivos_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['ECD'::text, 'ECF'::text]))` |  |  | sim |
| sped_contabil_arquivos_total_lancamentos_check | CHECK | `CHECK (total_lancamentos >= 0)` |  |  | sim |
| sped_contabil_arquivos_total_linhas_check | CHECK | `CHECK (total_linhas >= 0)` |  |  | sim |
| sped_periodo_valido | CHECK | `CHECK (periodo_fim >= periodo_inicio)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_sped_contabil_arquivos_empresa_id | btree | empresa_id | não | sim |  | `CREATE INDEX idx_sped_contabil_arquivos_empresa_id ON public.sped_contabil_arquivos USING btree (empresa_id)` |
| sped_contabil_arquivos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX sped_contabil_arquivos_pkey ON public.sped_contabil_arquivos USING btree (id)` |


## Policies (RLS)

### `sped_arquivos_delete_admin`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AND empresa_acessivel(empresa_id))` |
| WITH CHECK |  |

### `sped_arquivos_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `empresa_acessivel(empresa_id)` |

### `sped_arquivos_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `empresa_acessivel(empresa_id)` |
| WITH CHECK |  |

### `sped_arquivos_update_admin`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |
| WITH CHECK | `(has_any_role(( SELECT auth.uid() AS uid), ARRAY['admin'::app_role, 'financeiro'::app_role]) AND empresa_acessivel(empresa_id))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_sped_arquivos_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
