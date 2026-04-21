

## Plano — DRE & Balanço por Competência (com toggle Caixa)

### Contexto e problema

Hoje `DREStatement` e `BalancoPatrimonial` calculam tudo a partir de `contas_pagar`/`contas_receber` filtrando `status='pago'` por `data_vencimento`. Isso é regime de **caixa** misturado com vencimento (nem caixa puro nem competência), com:

- Receitas/despesas reconhecidas só quando pagas → distorce o resultado contábil.
- Custos classificados por substring no nome do `centro_custo` ("admin", "comercial") → frágil.
- Balanço com `imobilizado` e `capitalSocial` hardcoded e PL calculado por diferença.
- Ignora completamente `lancamentos_contabeis` + `partidas_contabeis`, que é a fonte oficial (e alimenta o SPED ECD).

A solução é usar **partidas contábeis (competência)** como fonte primária e oferecer um **toggle de fonte** (`competência` | `caixa`) para o usuário comparar.

### Arquitetura proposta

**1. Novo hook `useDemonstrativosContabeis`** (`src/hooks/useDemonstrativosContabeis.ts`)

Centraliza a leitura de partidas contábeis no período e devolve estruturas prontas para DRE e Balanço.

```ts
type Fonte = 'competencia' | 'caixa';

useDemonstrativosContabeis({ empresaId, ano, mes, fonte }) → {
  dre: DRELinhas[],            // já agregado por grupo (Receita, CMV, Desp Op, etc.)
  balanco: { ativo, passivo, pl, equilibrado },
  origem: 'competencia' | 'caixa',
  cobertura: { totalLancamentos, periodosVazios: boolean },
  isLoading, error
}
```

Lógica para `fonte='competencia'`:
- Query única: `partidas_contabeis` join `plano_contas` join `lancamentos_contabeis` filtrando `data_lancamento` no período e `empresa_id`.
- Para cada partida, sinal contábil:  
  `D-receita = -valor`, `C-receita = +valor`, `D-despesa = +valor`, `C-despesa = -valor`,  
  `D-ativo = +valor`, `C-ativo = -valor`, `D-passivo = -valor`, `C-passivo = +valor`.
- Agrupa por `plano_contas.tipo` (`receita`/`despesa`/`ativo`/`passivo`) e por `centro_resultado` quando preenchido (subgrupos: vendas, deduções, CMV, desp operacional, financeiro, IR/CSLL).
- Para o **Balanço**, o lucro do exercício = soma (receitas − despesas) acumulado **até o fim do período** (não só do mês). PL = capital social das contas tipo=passivo + lucros acumulados; balanço fecha por construção (débitos=créditos).

Lógica para `fonte='caixa'`:
- Reusa a lógica atual (contas_pagar/receber pagas), mas refatorada para devolver o mesmo shape.

**2. Componente `FonteDadosToggle`** (`src/components/demonstrativos/FonteDadosToggle.tsx`)

```
┌─────────────────────────────────────────┐
│ Fonte: [● Competência] [ Caixa ]   ⓘ   │
│ 142 lançamentos contábeis no período    │
└─────────────────────────────────────────┘
```

- `Tabs` com 2 valores; tooltip explica diferença ("Competência: reconhece quando ocorre o fato; Caixa: quando entra/sai dinheiro").
- Mostra contador de lançamentos disponíveis e badge "Sem dados contábeis" quando `cobertura.totalLancamentos === 0` — neste caso força `caixa` automaticamente e exibe banner "Importe lançamentos no módulo Contabilidade para usar Competência".

**3. Refator `DREStatement.tsx`**

- Recebe `fonte` por props (`competencia` default).
- Substitui o `useMemo` atual pela leitura do hook novo.
- Mantém o mesmo render de tabela (linhas/níveis/AV%).
- Header passa a mostrar badge "Regime: Competência" / "Regime: Caixa".

**4. Refator `BalancoPatrimonial.tsx`**

- Recebe `fonte` por props.
- Em `competencia`: ativo/passivo/PL vêm 100% das partidas; remove os valores hardcoded (`imobilizado=50000`, `capitalSocial=30000`).
- Em `caixa`: mantém lógica atual mas com aviso "Balanço estimado a partir de movimentações de caixa — não substitui escrituração contábil".
- Quando `equilibrado=false` em competência, mostra `AlertTriangle` com link para o módulo Contabilidade ("Há partidas desbalanceadas — revisar lançamentos").

**5. Wiring em `Demonstrativos.tsx`**

- Adiciona `const [fonte, setFonte] = useState<Fonte>('competencia')`.
- Renderiza `<FonteDadosToggle value={fonte} onChange={setFonte} cobertura={...} />` logo abaixo do header de filtros.
- Repasse `fonte` para `<DREStatement>` e `<BalancoPatrimonial>` (Fluxo de Caixa permanece como está — sempre caixa).

### Mapeamento de contas → linhas DRE

Usa `plano_contas.centro_resultado` (já existe na tabela) com fallback para o `codigo`:

| centro_resultado | Linha DRE |
|---|---|
| `receita_bruta` ou tipo=receita sem centro | Receita Bruta |
| `deducao_receita` | (-) Deduções |
| `cmv` ou `custo_mercadoria` | (-) CMV |
| `despesa_administrativa` | Desp. Administrativas |
| `despesa_comercial` | Desp. Comerciais |
| `despesa_financeira` / `receita_financeira` | Resultado Financeiro |
| `irpj` / `csll` | (-) IRPJ/CSLL |
| outras tipo=despesa | Outras Desp. Operacionais |

Quando `centro_resultado` for null, cai num bucket "Não classificadas" com aviso clicável (futuramente abre modal de classificação).

### Critério de pronto

1. Página `Demonstrativos` mostra toggle `Competência | Caixa` acima das tabs.
2. Default = `Competência`; se a empresa não tem `partidas_contabeis` no período, banner explica e força `caixa`.
3. DRE em modo competência soma valores a partir de `partidas_contabeis` agrupadas por `plano_contas.centro_resultado`.
4. Balanço em modo competência tem ativo, passivo e PL todos vindos de partidas; campo `equilibrado` reflete a soma real (sem hardcode de capital social/imobilizado).
5. Trocar o toggle re-renderiza ambos (DRE e Balanço) com o mesmo shape de tabelas, sem regressão visual.
6. Header de cada card mostra badge do regime ativo.
7. Hook novo isolado e testável; sem mexer em `FluxoCaixaContabil.tsx` (já é caixa por natureza).

### Arquivos

- ➕ `src/hooks/useDemonstrativosContabeis.ts`
- ➕ `src/components/demonstrativos/FonteDadosToggle.tsx`
- ✏️ `src/components/demonstrativos/DREStatement.tsx` — consome hook + prop `fonte`
- ✏️ `src/components/demonstrativos/BalancoPatrimonial.tsx` — consome hook + prop `fonte`
- ✏️ `src/pages/Demonstrativos.tsx` — state `fonte` + render do toggle

