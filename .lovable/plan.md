

## Plano — Abrir tela completa da entidade com destaque

A maior parte já existe: `useAnomaliaDetalhe` carrega automaticamente o registro da entidade relacionada (movimentação, conta a pagar, conta a receber, transação bancária) via `SELECT *` na tabela correta com `.maybeSingle()`, e `EntidadeRelacionadaCard` mostra os campos e expõe um botão "Abrir tela completa".

Falta apenas que esse botão leve para a tela com o **registro destacado**, em vez da listagem genérica.

### Mudança única

**`src/hooks/useAnomaliaDetalhe.ts`** — em `carregarEntidade`, substituir `rotaUI: cfg.rota` (que retorna `/contas-pagar`, `/movimentacoes`, etc., sem identificar o registro) por `rotaUI: getEntidadeUrl(tipo, id, "")` — função já existente em `src/lib/anomalia-routes.ts` que monta:

- `movimentacao` → `/movimentacoes?highlight=<id>`
- `conta_pagar` → `/contas-pagar?highlight=<id>`
- `conta_receber` → `/contas-receber?highlight=<id>`
- `transacao_bancaria` → `/conciliacao?txId=<id>`

Sem mudança na UI: o botão "Abrir tela completa" no `EntidadeRelacionadaCard` simplesmente passa a navegar para a URL com query string. Cada uma dessas telas já trata o parâmetro de destaque (já é usado pelos toasts realtime e pelo deep-link do drawer).

### Detalhes técnicos

- O hook continua retornando `EntidadeRelacionada { tipo, encontrada, registro, rotaUI }` — apenas o valor de `rotaUI` muda.
- `getEntidadeUrl` já tem fallback para `/admin/insights-ia/anomalia/<id>` quando o tipo é desconhecido — comportamento idêntico ao atual.
- `conta_receber` já está mapeado tanto em `tabelaPorTipo` quanto em `getEntidadeUrl` (verificado).

### Fora de escopo

- Mudar a UI dos campos exibidos (a grade já lista 10 atributos com truncamento — suficiente).
- Implementar destaque visual nas listas (já implementado em iterações anteriores via `?highlight=`).
- Página dedicada por tipo de entidade — o link já entrega o usuário no contexto certo.

