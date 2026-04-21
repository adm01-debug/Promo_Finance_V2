

## Plano — Reestruturar `/contabilidade` com 6 abas

### Estado atual

A rota `/contabilidade` já existe (`src/pages/Contabilidade.tsx`, protegida para `admin`/`financeiro`) com **4 abas**: Plano, Lançamentos, SPED ECD, SPED ECF. Os hooks `usePlanoContas`, `useLancamentosContabeis` e `useSpedContabil` já consomem as tabelas reais (`plano_contas`, `lancamentos_contabeis`, `partidas_contabeis`). Faltam apenas as **2 abas novas**: Razão & Diário e DRE & Balanço.

### O que será implementado

**1. Nova aba `RazaoDiarioTab.tsx`** (`src/components/contabilidade/`)

Aba única com sub-toggle (segmented) entre **Diário** e **Razão**, compartilhando filtros.

- **Filtros no topo**: data início/fim (default = ano corrente), select de conta opcional (do `plano_contas` da empresa), busca textual em histórico.
- **Modo Diário**: tabela cronológica achatada — `Data | Nº | Histórico | Conta (código + nome) | Débito | Crédito`. Totais de débito/crédito no rodapé (devem bater).
- **Modo Razão**: agrupado por conta. Para cada conta com movimento:
  - cabeçalho (código · nome · saldo inicial)
  - linhas `Data | Histórico | Débito | Crédito | Saldo acumulado`
  - saldo final
  - Saldo inicial = soma de partidas anteriores ao `dataInicio` (calculado client-side a partir do mesmo dataset).
- Botão **Exportar** (dropdown CSV/PDF) com `exportToCSV/exportToPDF` de `@/lib/export-utils`, nome `diario-{período}` ou `razao-{período}`.
- Empty/loading com `Skeleton`.

**2. Nova aba `DreBalancoTab.tsx`** (`src/components/contabilidade/`)

Sub-toggle entre **DRE** e **Balanço Patrimonial**, calculados a partir de `usePlanoContas` + `useLancamentosContabeis`.

- **Filtros**: período (default ano corrente).
- **DRE** agrupada por natureza:
  - (+) Receitas (soma C − D em contas `natureza='receita'`)
  - (−) Despesas (soma D − C em `natureza='despesa'`)
  - (=) Resultado do período
  - Hierarquia respeitando `parent_id` (recuo `paddingLeft = nivel * 16`).
- **Balanço** em duas colunas:
  - Ativo (`natureza='ativo'`, D − C)
  - Passivo (`natureza='passivo'`, C − D) + Patrimônio (`natureza='patrimonio'`, C − D + resultado do exercício)
  - Indicador de equilíbrio (Ativo vs Passivo+PL); se diferir > R$ 0,01, alerta amarelo.
- Cálculo 100% client-side num `useMemo`.
- **Exportar PDF** via `jsPDF` + `autoTable` (já no projeto), com cabeçalho da empresa e período, seguindo o padrão de `advanced-corporate-reporting-engine`.

**3. Atualizar `src/pages/Contabilidade.tsx`**

- Trocar `TabsList` para 6 colunas (`grid-cols-3 md:grid-cols-6`), na ordem:
  Plano · Lançamentos · **Razão & Diário** · **DRE & Balanço** · SPED ECD · SPED ECF
- Importar e renderizar as duas novas abas; passar `empresaId` e `ano` do header.
- Header existente (Empresa/Ano) preservado — filtros internos de cada nova aba refinam o período.

### Arquivos

- ✏️ `src/pages/Contabilidade.tsx`
- ➕ `src/components/contabilidade/RazaoDiarioTab.tsx`
- ➕ `src/components/contabilidade/DreBalancoTab.tsx`

### O que NÃO muda

- Sem migration, sem nova edge function, sem novo hook.
- Rota e RBAC já configurados.
- Hooks existentes reutilizados sem alteração.

### Critério de pronto

1. `/contabilidade` mostra 6 abas funcionais com a empresa do header.
2. Diário lista todas as partidas do período em ordem cronológica e fecha débitos = créditos.
3. Razão agrupa por conta com saldo inicial → movimentos → saldo final corretos.
4. DRE soma receitas − despesas mostrando resultado, com hierarquia preservada.
5. Balanço sinaliza Ativo = Passivo + PL e alerta em caso de desequilíbrio.
6. Exportação CSV/PDF funciona em Razão/Diário e PDF em DRE/Balanço.

