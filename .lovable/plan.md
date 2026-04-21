

## Plano — Destacar desequilíbrio do Balanço com diferença em R$

### Estado atual

A aba `DreBalancoTab` (criada recentemente) já calcula totais de Ativo e Passivo + PL e exibe um indicador visual quando há divergência maior que R$ 0,01. Falta, porém:

- Destaque visual mais forte (não só um badge discreto).
- Mostrar a **diferença exata em R$** (com sinal indicando o lado que está maior).
- Rodapé fixo da aba consolidando o status do balanço.
- Pista de qual lado está faltando (Ativo > Passivo+PL ou vice-versa).

O componente legado `src/components/demonstrativos/BalancoPatrimonial.tsx` (rota `/demonstrativos`) tem lógica parecida e também só mostra um badge "Equilibrado / Divergência" sem o valor da diferença — vale aplicar o mesmo padrão lá para consistência.

### O que será implementado

**1. `src/components/contabilidade/DreBalancoTab.tsx` (editado)**

Adicionar, no modo Balanço, um **rodapé sticky** dentro do card com:

- **Estado equilibrado** (|Ativo − (Passivo+PL)| ≤ 0,01):
  - Faixa verde discreta (`bg-emerald-500/10 border-emerald-500/30`).
  - Ícone `CheckCircle2` + texto "Balanço equilibrado · Ativo = Passivo + PL = R$ X,XX".

- **Estado desequilibrado**:
  - Faixa de alerta (`bg-destructive/10 border-destructive/40 text-destructive`).
  - Ícone `AlertTriangle` pulsante (animação leve).
  - Linha 1: "Balanço desequilibrado".
  - Linha 2 em grid de 3 colunas: **Ativo** · **Passivo + PL** · **Diferença** (cada um com label + valor formatado em `formatCurrency`).
  - A "Diferença" em destaque (texto maior, negrito, com sinal):
    - Se Ativo > Passivo+PL → `+R$ X,XX (Ativo maior)`.
    - Se Passivo+PL > Ativo → `-R$ X,XX (Passivo+PL maior)`.
  - Texto auxiliar pequeno: "Verifique lançamentos em aberto, contas sem mapeamento de natureza ou diferenças de arredondamento."

Reforço adicional nas linhas de total da tabela (TOTAL ATIVO / TOTAL PASSIVO+PL) quando desequilibrado: borda vermelha à esquerda (`border-l-4 border-destructive`) e cor do valor em `text-destructive`.

A diferença entra também no PDF exportado: nova linha ao final "Diferença: R$ X,XX" colorida quando ≠ 0.

**2. `src/components/demonstrativos/BalancoPatrimonial.tsx` (editado)**

Substituir o card central "✓ Equilibrado / ✗ Divergência" por um bloco que, no caso de divergência, exibe o valor exato da diferença (mesmo padrão visual do item 1, em escala compacta). Manter os outros dois cards (Ativo Total / Passivo+PL).

### Detalhe técnico

```ts
const diferenca = totalAtivo - totalPassivoPL;
const equilibrado = Math.abs(diferenca) <= 0.01;
const ladoMaior = diferenca > 0 ? 'Ativo' : 'Passivo + PL';
```

Tolerância fixa de R$ 0,01 (centavo) para absorver arredondamentos de soma em ponto flutuante. Cores via tokens semânticos (`destructive`, `emerald` apenas inline pois não há token de sucesso global) — mantendo o padrão atual do projeto.

### Arquivos

- ✏️ `src/components/contabilidade/DreBalancoTab.tsx`
- ✏️ `src/components/demonstrativos/BalancoPatrimonial.tsx`

### O que NÃO muda

- Sem migration, sem novo hook, sem nova edge function.
- Lógica de cálculo do balanço permanece igual; só muda a apresentação.
- Rotas e RBAC inalterados.

### Critério de pronto

1. Em `/contabilidade` → aba "DRE & Balanço" → modo "Balanço": com balanço equilibrado, rodapé verde discreto confirma o status.
2. Quando há divergência, rodapé vermelho exibe Ativo, Passivo+PL e a **diferença em R$** com sinal e indicação do lado maior.
3. Linhas de total ganham destaque vermelho quando desequilibrado.
4. PDF exportado inclui linha "Diferença".
5. `/demonstrativos` → Balanço aplica o mesmo padrão no card central.

