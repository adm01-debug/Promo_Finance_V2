

## Plano — `ImportLancamentosCSVDialog`: importação em lote de lançamentos contábeis

### Objetivo

Adicionar um diálogo no `LancamentosTab` que permita importar múltiplos lançamentos contábeis (com partidas) a partir de um arquivo CSV, com parsing robusto, validação completa (partidas dobradas balanceadas, contas existentes, datas válidas) e prévia antes de inserir.

### Formato do CSV

Cada linha representa **uma partida** (D ou C). Lançamentos são agrupados por `lancamento_ref` (identificador local da linha do diário). Isso permite N partidas por lançamento sem schema complexo.

```csv
lancamento_ref;data;historico;conta_codigo;tipo;valor;historico_complementar
1;2024-03-15;Pgto fornecedor NF 12345;2.1.01;D;1500,00;
1;2024-03-15;Pgto fornecedor NF 12345;1.1.01;C;1500,00;
2;2024-03-16;Recebimento cliente;1.1.01;D;800,00;
2;2024-03-16;Recebimento cliente;3.1.01;C;800,00;
```

- `lancamento_ref`: agrupador (string ou número) — todas as linhas com mesmo ref formam um lançamento
- `data`: ISO `YYYY-MM-DD` ou BR `DD/MM/YYYY`
- `historico`: histórico do lançamento (idêntico em todas as linhas do mesmo ref)
- `conta_codigo`: código da conta no plano (deve existir e ser **analítica**)
- `tipo`: `D` ou `C`
- `valor`: número (aceita `1.234,56` BR ou `1234.56` US)
- `historico_complementar`: opcional, por partida

### Arquivos

**➕ `src/lib/lancamentos-csv-importer.ts`** — parser dedicado
- Reusa helpers `decodeFile`, `detectSeparator`, `parseNumber`, `splitCsvLine`, `normalizeHeader` (extraídos de `csv-importer.ts` para um módulo compartilhado `csv-utils.ts`, OU duplicados localmente para evitar refator amplo — opto por duplicar por simplicidade e isolamento)
- Função `parseLancamentosCsv(file, planoContas)` → `{ lancamentos: ParsedLancamento[], errors, warnings, totalLines }`
- Validações por linha: campos obrigatórios, data válida, tipo ∈ {D,C}, valor > 0, `conta_codigo` existe no plano e é analítica
- Validações por grupo (após agrupar por `lancamento_ref`):
  - data e histórico iguais em todas as linhas do grupo
  - soma D = soma C (tolerância R$ 0,01)
  - mínimo 2 partidas
- Erros bloqueiam a linha; avisos (ex.: histórico divergente — usa o primeiro) não bloqueiam

**➕ `src/components/contabilidade/ImportLancamentosCSVDialog.tsx`** — diálogo
- `<Dialog>` `max-w-4xl` com 3 etapas internas (state, sem stepper visual pesado):
  1. **Upload**: dropzone + botão "Baixar template CSV" (gera arquivo de exemplo); aviso sobre formato
  2. **Pré-visualização**: cards com totais (X lançamentos, Y partidas, R$ total D/C, Z erros, W avisos) + `<Table>` mostrando os primeiros 50 lançamentos agrupados (ref, data, histórico, nº partidas, total, status ✓/✗) + `<Accordion>` ou `<Alert>` listando todos os erros com nº da linha
  3. **Resultado**: progress + summary final (sucessos, falhas)
- Botão "Importar" desabilitado se `errors.length > 0` ou nenhum lançamento válido
- Importação chama `useImportLancamentosLote()` em sequência (ou via Promise.all em chunks de 10) reusando `useCriarLancamento` internamente — mas para performance e atomicidade, ver hook abaixo

**➕ Hook `useImportLancamentosLote` em `src/hooks/useLancamentosContabeis.ts`**
- Recebe `{ empresa_id, lancamentos: ParsedLancamento[] }`
- Para cada lançamento: insere em `lancamentos_contabeis` + `partidas_contabeis` (mesmo padrão do `useCriarLancamento`, mas em loop com tracking de progresso via callback opcional `onProgress(done, total)`)
- Retorna `{ sucesso: number, falhas: Array<{ ref, error }> }`
- Não usa transação multi-tabela (Supabase JS não suporta) — em caso de falha de partidas após inserir o cabeçalho, faz `delete` do cabeçalho órfão (compensação)
- Invalida cache `lancamentos-contabeis` ao final

**✏️ `src/components/contabilidade/LancamentosTab.tsx`**
- Adicionar botão **"Importar CSV"** ao lado do "Novo lançamento" (variant `outline`, ícone `Upload`)
- `<ImportLancamentosCSVDialog empresaId={empresaId} planoContas={contasAnaliticas} />` ao lado do dialog atual

### Validações detalhadas (checklist visual no passo 2)

| Validação | Tipo | Comportamento |
|---|---|---|
| Header com colunas obrigatórias | erro | bloqueia tudo |
| `lancamento_ref` preenchido | erro | bloqueia linha |
| `data` válida | erro | bloqueia linha |
| `conta_codigo` existe no plano | erro | bloqueia linha |
| Conta é analítica (não sintética) | erro | bloqueia linha |
| `tipo` ∈ {D, C} | erro | bloqueia linha |
| `valor` > 0 | erro | bloqueia linha |
| Grupo balanceado (ΣD = ΣC) | erro | bloqueia grupo |
| Grupo tem ≥ 2 partidas | erro | bloqueia grupo |
| Datas iguais no grupo | aviso | usa a primeira |
| Históricos divergentes no grupo | aviso | usa o primeiro |
| Lançamento fora do ano-calendário corrente | aviso | importa mesmo assim |

### Critério de pronto

1. Em `/contabilidade` → "Lançamentos", botão "Importar CSV" abre diálogo.
2. Botão "Baixar template" gera arquivo de exemplo válido com 2 lançamentos.
3. Upload de CSV mostra prévia com agrupamento por `lancamento_ref`, totais e checklist de erros.
4. Botão "Importar" fica desabilitado enquanto houver erros bloqueantes.
5. Importação em lote insere lançamentos com `origem='importacao_csv'`, exibe progress e summary final.
6. Falhas parciais não corrompem o banco (delete compensatório no cabeçalho órfão).
7. Cache `lancamentos-contabeis` é invalidado e a tabela é atualizada automaticamente.
8. Sem regressão no diálogo "Novo lançamento" existente.

