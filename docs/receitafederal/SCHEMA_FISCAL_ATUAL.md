# Schema fiscal atual (etapa 31)

Inventário via `information_schema` do projeto Supabase oficial (`bwwbeyolnnzppeuhgkcd`), levantado em 2026-11-22. Base para as etapas 32-40 (Fase 3 — modelo de dados IBS/CBS).

## `notas_fiscais`

| Coluna         | Tipo        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| empresa_id     | uuid        | YES      | —                 |
| numero         | text        | YES      | —                 |
| serie          | text        | YES      | —                 |
| chave_acesso   | text        | YES      | —                 |
| valor_total    | numeric     | YES      | 0                 |
| valor_icms     | numeric     | YES      | 0                 |
| status         | text        | YES      | 'emitida'         |
| xml_url        | text        | YES      | —                 |
| data_emissao   | timestamptz | YES      | now()             |
| created_at     | timestamptz | YES      | now()             |
| valor_produtos | numeric     | YES      | 0                 |
| cliente_cnpj   | text        | YES      | —                 |
| cliente_nome   | text        | YES      | —                 |
| valor_desconto | numeric     | NO       | 0                 |
| valor_frete    | numeric     | NO       | 0                 |

Sem grupo IBS/CBS/IS — nenhuma coluna `v_ibs*`, `v_cbs`, `v_is`, `cst_ibscbs`, `cclasstrib`. Confirma a necessidade das etapas 35 (totais na nota) e 32-34 (itens + grupos).

## `operacoes_tributaveis`

| Coluna                  | Tipo        | Nullable | Default           |
| ----------------------- | ----------- | -------- | ----------------- |
| id                      | uuid        | NO       | gen_random_uuid() |
| empresa_id              | uuid        | YES      | —                 |
| data_operacao           | date        | YES      | —                 |
| valor_total             | numeric     | YES      | —                 |
| cbs_aliquota            | numeric     | YES      | —                 |
| cbs_valor               | numeric     | YES      | —                 |
| ibs_aliquota            | numeric     | YES      | —                 |
| ibs_valor               | numeric     | YES      | —                 |
| tipo_operacao           | text        | YES      | —                 |
| status                  | text        | YES      | 'pendente'        |
| created_at              | timestamptz | YES      | now()             |
| is_valor                | numeric     | YES      | 0                 |
| cbs_credito             | numeric     | YES      | 0                 |
| ibs_credito             | numeric     | YES      | 0                 |
| icms_valor              | numeric     | YES      | 0                 |
| iss_valor               | numeric     | YES      | 0                 |
| pis_valor               | numeric     | YES      | 0                 |
| cofins_valor            | numeric     | YES      | 0                 |
| documento_tipo          | varchar     | YES      | —                 |
| documento_serie         | varchar     | YES      | —                 |
| cliente_id              | uuid        | YES      | —                 |
| fornecedor_id           | uuid        | YES      | —                 |
| municipio_origem        | varchar     | YES      | —                 |
| municipio_destino       | varchar     | YES      | —                 |
| uf_origem               | varchar     | YES      | —                 |
| uf_destino              | varchar     | YES      | —                 |
| cnpj_cpf_contraparte    | varchar     | YES      | —                 |
| cfop                    | varchar     | YES      | —                 |
| ncm                     | varchar     | YES      | —                 |
| nota_fiscal_id          | uuid        | YES      | —                 |
| valor_operacao          | numeric     | YES      | 0                 |
| valor_desconto          | numeric     | YES      | 0                 |
| valor_frete             | numeric     | YES      | 0                 |
| base_calculo            | numeric     | YES      | 0                 |
| is_categoria            | varchar     | YES      | —                 |
| is_aliquota             | numeric     | YES      | 0                 |
| icms_aliquota           | numeric     | YES      | 0                 |
| iss_aliquota            | numeric     | YES      | 0                 |
| pis_aliquota            | numeric     | YES      | 0                 |
| cofins_aliquota         | numeric     | YES      | 0                 |
| regime_especial         | varchar     | YES      | —                 |
| reducao_aliquota        | numeric     | YES      | 0                 |
| isento                  | boolean     | YES      | false             |
| motivo_isencao          | text        | YES      | —                 |
| split_payment           | boolean     | YES      | false             |
| split_payment_valor     | numeric     | YES      | 0                 |
| competencia             | date        | YES      | —                 |
| apuracao_id             | uuid        | YES      | —                 |
| updated_at              | timestamptz | YES      | now()             |
| documento_numero        | varchar     | YES      | —                 |
| nome_contraparte        | varchar     | YES      | —                 |
| documento_chave         | text        | YES      | —                 |
| erro_mensagem           | text        | YES      | —                 |
| is_aliquota_customizada | numeric     | NO       | 0                 |

(`is_aliquota_customizada` é a migration `20261121120000_adiciona_is_aliquota_customizada.sql`, já aplicada — por isso a tabela tem 54 colunas, não 53.)

Não tem granularidade de item (NCM/CFOP por linha vêm de `ncm`/`cfop` únicos na própria operação) — é por isso que a Fase 3 cria `notas_fiscais_itens` em vez de reaproveitar esta tabela para o detalhamento por item do XML.

## `creditos_tributarios`

| Coluna                 | Tipo        | Nullable | Default           |
| ---------------------- | ----------- | -------- | ----------------- |
| id                     | uuid        | NO       | gen_random_uuid() |
| empresa_id             | uuid        | YES      | —                 |
| tipo_tributo           | text        | NO       | —                 |
| saldo_disponivel       | numeric     | NO       | 0                 |
| data_origem            | date        | NO       | CURRENT_DATE      |
| competencia_origem     | text        | YES      | —                 |
| status                 | text        | YES      | 'disponivel'      |
| created_at             | timestamptz | YES      | now()             |
| nota_fiscal_id         | uuid        | YES      | —                 |
| valor_credito          | numeric     | YES      | —                 |
| valor_utilizado        | numeric     | YES      | 0                 |
| tipo_credito           | text        | YES      | —                 |
| documento_tipo         | text        | YES      | —                 |
| documento_numero       | text        | YES      | —                 |
| documento_chave        | text        | YES      | —                 |
| fornecedor_id          | uuid        | YES      | —                 |
| fornecedor_cnpj        | text        | YES      | —                 |
| fornecedor_nome        | text        | YES      | —                 |
| valor_base             | numeric     | YES      | —                 |
| aliquota               | numeric     | YES      | —                 |
| observacoes            | text        | YES      | —                 |
| apuracao_id            | uuid        | YES      | —                 |
| competencia_utilizacao | text        | YES      | —                 |

**Não tem** `origem` (enum `'xml_destacado'|'estimado'|'manual'`) nem `efeito_tributario boolean` nem `ano_fato_gerador int` — exatamente o que a etapa 36 adiciona. Todo crédito hoje é indistinguível entre destacado em XML e estimado.

## `apuracoes_tributarias`

| Coluna                   | Tipo        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| empresa_id               | uuid        | YES      | —                 |
| tipo_tributo             | text        | YES      | —                 |
| competencia              | text        | YES      | —                 |
| valor_total              | numeric     | YES      | —                 |
| status                   | text        | YES      | 'pendente'        |
| created_at               | timestamptz | YES      | now()             |
| ano                      | integer     | YES      | —                 |
| mes                      | integer     | YES      | —                 |
| cbs_debitos              | numeric     | YES      | 0                 |
| cbs_creditos             | numeric     | YES      | 0                 |
| cbs_a_pagar              | numeric     | YES      | 0                 |
| cbs_a_compensar          | numeric     | YES      | 0                 |
| ibs_debitos              | numeric     | YES      | 0                 |
| ibs_creditos             | numeric     | YES      | 0                 |
| ibs_a_pagar              | numeric     | YES      | 0                 |
| ibs_a_compensar          | numeric     | YES      | 0                 |
| cbs_saldo_anterior       | numeric     | YES      | 0                 |
| ibs_saldo_anterior       | numeric     | YES      | 0                 |
| is_debitos               | numeric     | YES      | 0                 |
| is_creditos              | numeric     | YES      | 0                 |
| is_a_pagar               | numeric     | YES      | 0                 |
| is_a_compensar           | numeric     | YES      | 0                 |
| icms_debitos             | numeric     | YES      | 0                 |
| icms_creditos            | numeric     | YES      | 0                 |
| icms_a_pagar             | numeric     | YES      | 0                 |
| iss_debitos              | numeric     | YES      | 0                 |
| iss_creditos             | numeric     | YES      | 0                 |
| iss_a_pagar              | numeric     | YES      | 0                 |
| icms_residual            | numeric     | YES      | 0                 |
| iss_residual             | numeric     | YES      | 0                 |
| pis_residual             | numeric     | YES      | 0                 |
| cofins_residual          | numeric     | YES      | 0                 |
| total_tributos_novos     | numeric     | YES      | 0                 |
| total_tributos_residuais | numeric     | YES      | 0                 |
| total_geral              | numeric     | YES      | 0                 |
| updated_at               | timestamptz | YES      | now()             |
| data_transmissao         | timestamptz | YES      | —                 |
| protocolo_transmissao    | text        | YES      | —                 |
| created_by               | uuid        | YES      | uid()             |

`cbs_*`/`ibs_*` têm o bloco completo (`debitos/creditos/a_pagar/a_compensar/saldo_anterior`). **`is_*` não tem `saldo_anterior`; `icms_*` e `iss_*` não têm `a_compensar` nem `saldo_anterior`** — assimetria real no schema atual, não um gap a preencher por esta etapa (a etapa 88 usa o que existir).

A apuração mensal da etapa 88 não precisa de nova coluna aqui, mas depende de dado que ainda não existe em outras tabelas: os totais por nota (`v_ibs`, `v_cbs`, `v_is` — etapa 35) e a elegibilidade dos créditos (`efeito_tributario`, `origem` — etapa 36) para separar débito/crédito real de estimado.

## RPC `registrar_nfe_com_creditos(p_empresa_id uuid, p_nota jsonb, p_creditos jsonb)`

`plpgsql`, `SECURITY INVOKER` (sem `SECURITY DEFINER` declarado), `search_path` fixo (`public, pg_catalog`). Fluxo:

1. Exige `auth.uid()` não nulo e `empresa_acessivel(p_empresa_id)` — nega com `42501` caso contrário.
2. Valida que `p_nota` é um objeto JSON; rejeita (`22023`) se não for.
3. Confere que toda chave de `p_nota` (exceto `id`/`empresa_id`) existe como coluna real de `notas_fiscais` via `information_schema.columns` — rejeita com `42703` listando as desconhecidas. **Também rejeita (`22023`, `nota_sem_campos`) se não restar nenhuma chave depois de excluir `id`/`empresa_id`** — nota vazia não gera INSERT silencioso. Esse é o padrão de validação (ambas as checagens, não só a de colunas desconhecidas) que a etapa 45 (RPC de itens) deve repetir contra `notas_fiscais_itens`.
4. Monta e executa um `INSERT ... RETURNING *` dinâmico a partir das colunas presentes em `p_nota`.
5. Se `p_creditos` (array) não for vazio, insere em `creditos_tributarios` via `jsonb_to_recordset` com colunas fixas (`tipo_tributo, valor_credito, saldo_disponivel, data_origem, competencia_origem, status`) — **não inclui `origem`/`efeito_tributario`/`ano_fato_gerador`**, então a etapa 36 precisa alterar também o `jsonb_to_recordset` desta função (ou criar uma nova versão) para esses créditos serem gravados com a origem certa desde a importação.
6. Confere `ROW_COUNT` dos créditos inseridos contra o array recebido; diverge → `42501`.

## Tabelas/colunas que a Fase 3 ainda precisa criar

Confirmado por consulta direta ao `information_schema` — nenhuma das seguintes existe hoje:

- `notas_fiscais_itens` (etapa 32)
- grupo IBS/CBS/IS por item (etapas 33-34, dependem da tabela acima)
- `catalogo_cclasstrib`, `catalogo_ncm`, `catalogo_nbs`, `catalogo_aliquota_referencia` (etapas 37-38)
- `rfb_calculos` — **não será criada**: etapa 39 foi dispensada pelo ADR-004 (servia só ao proxy da calculadora oficial, fora de escopo)

## Fonte

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = '<tabela>'
order by ordinal_position;

select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'registrar_nfe_com_creditos';
```

Executado via MCP `SUPABASE - PROMO FINANCE V2 - MCP` contra o projeto `bwwbeyolnnzppeuhgkcd`.
