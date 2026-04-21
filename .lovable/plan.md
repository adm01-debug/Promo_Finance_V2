

## Já está implementado — nada a fazer

O painel `/admin/insights-ia` (componente `AnomaliasDetectadasPanel`) já tem o conjunto completo de filtros e ordenação que você descreveu. Conferi linha por linha em `src/components/admin/AnomaliasDetectadasPanel.tsx`:

### Filtros já disponíveis na barra de cabeçalho

- **Status** (Select): Novas / Investigando / Confirmadas / Falsos positivos / Todas — linhas 262-281, aplicado direto no `useAnomaliasDetectadas(status)`.
- **Severidade** (multi-select dropdown com checkboxes): crítica, alta, média, baixa — linhas 283-319, com badge de contagem.
- **Tipo de anomalia** (multi-select dropdown): movimentação atípica, pagamento duplicado, conta a pagar alta, conciliação atrasada, variação brusca de regime — linhas 321-354.
- **Período** (data início e fim) — linhas 356-376.
- **Ordenação** (dropdown): por data de detecção, severidade ou tipo, com toggle ascendente/descendente — linhas 378-417.
- **Visibilidade de colunas** (`ColumnVisibilityMenu`) — linha 419-423.
- **Presets salvos** (`SavedFiltersBar`) com bootstrap automático do preset padrão do usuário — linhas 136-149, 254-260.
- **Contador de filtros ativos** — linhas 425-431.

A filtragem e a ordenação acontecem no `useMemo` das linhas 156-184, e cada item da lista mostra o botão "Drill-down" (drawer lateral) e o link para abrir a tela completa em `/admin/insights-ia/anomalia/:id` — linhas 469-481.

### O que está faltando, se quiser

Apenas três coisas não existem hoje (e que pareciam implícitas no pedido):

1. **Campo de busca textual livre** (por descrição/observações) — hoje só há filtros estruturados. O ícone `Search` está importado mas não é usado. Posso adicionar um `Input` com debounce que filtra `descricao` e `observacoes`.
2. **Sincronização dos filtros com a URL** (`?status=...&severidade=...`) para compartilhar/voltar — hoje o estado é só local.
3. **Filtro por entidade relacionada** (ex.: só anomalias de `conta_pagar`) — hoje filtra por `tipo_anomalia`, não por `entidade_tipo`.

### Recomendação

Como o pedido literal ("ordenar e buscar por severidade, tipo e status") já está 100% atendido, sugiro fechar este como "já existe". Se quiser que eu adicione **busca textual livre** e/ou **sincronização com URL**, me confirme qual dos três itens acima implementar e eu faço numa pequena edição cirúrgica em `AnomaliasDetectadasPanel.tsx`.

