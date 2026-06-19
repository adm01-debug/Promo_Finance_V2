---
name: Arquitetura multi-empresa consolidada
description: Sistema usado por um grupo econômico com vários CNPJs e regimes tributários distintos; visão consolidada por padrão + foco por empresa; CNPJ escolhido por ação com sugestão IA
type: feature
---

# Arquitetura multi-empresa consolidada

## Princípio
O sistema serve UM grupo empresarial com várias empresas/CNPJs em regimes tributários distintos (Lucro Real, Simples Nacional, Lucro Presumido). A UI deve mostrar dados consolidados por padrão e permitir foco em 1 CNPJ quando necessário. A escolha do CNPJ na hora de faturar/comprar é feita pelo usuário com sugestão da IA tributária.

## Camadas
- **`src/contexts/EmpresaScopeContext.tsx`** — provider único de escopo (`mode`, `ids`, `currentEmpresaId` retrocompat). Persiste em `pf:empresa-scope-v1`. Mantém sincronizada a chave legada `pf:current-empresa-id` para hooks ainda não migrados.
- **`src/components/empresa/EmpresaBadge.tsx`** — pill com sigla + cor (`empresas.cor_hex` = `chart-1..8`) + tooltip. Usar em listagens consolidadas.
- **`src/components/empresa/EmpresaScopeBar.tsx`** — substitui `EmpresaSwitcher`. Toggle Consolidado/Focado, multi-select, atalho ⌘E / Ctrl+E.
- **`src/components/empresa/EmpresaActionPicker.tsx`** — picker reutilizável em formulários de criação. Mostra ranking da IA tributária, sempre exige confirmação manual, audita escolha em `audit_logs` (`action='empresa_action_pick'`).
- **`src/lib/tributario/recomendar-empresa.ts`** — motor puro de scoring (regime × operação, crédito ICMS, RBT12, histórico).

## RLS multi-empresa
Tabelas que JÁ usam `empresa_id IN (SELECT FROM user_empresas)`: `contas_receber`, `contas_pagar`, `clientes`, `boletos`.
- `fornecedores` ainda não tem coluna `empresa_id` — quando for adicionada, replicar o mesmo padrão de policy.

## Regras invioláveis
- Nunca remover o `EmpresaScopeProvider` injetado pelo `EmpresaGuard`.
- Nunca bloquear o app por "N vínculos sem escolha" — o `EmpresaGuard` só bloqueia em 0 vínculos.
- Nunca permitir escopo vazio (`toggleEmpresa` impede desmarcar a última).
- Toda nova listagem consolidada deve incluir `<EmpresaBadge empresaId={row.empresa_id} />` quando `isConsolidated`.
- Todo novo formulário de criação (NF/Boleto/Compra/Conta) deve usar `<EmpresaActionPicker />` em vez de Select cru.

## Atalho
`⌘E` (Mac) / `Ctrl+E` (Windows/Linux) abre o seletor de escopo (`EmpresaScopeBar`). Ignora inputs/textareas/contentEditable.
