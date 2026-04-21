

## Plano — "Investigar" abre página de drill-down completa

A página de drill-down já existe e está completa: `src/pages/admin/AnomaliaDetalhe.tsx` (rota `/admin/insights-ia/anomalia/:id`, registrada em `App.tsx`). Ela renderiza, via `useAnomaliaDetalhe`, todos os blocos pedidos:

- `AnomaliaHeader` — severidade, tipo, descrição, status.
- `EntidadeRelacionadaCard` — registro de origem (movimentação / conta a pagar / transação).
- `HistoricoContextualCard` — série dos últimos 30 dias.
- `DetectoresContribuintesCard` — XAI: regra, observado vs. esperado, payload bruto.
- `AnomaliasRelacionadasCard` — outras anomalias da mesma entidade/empresa.
- `AcoesSugeridasCard` — playbook por tipo + textarea de parecer.

O que falta é apenas o gesto pedido: o botão **"Investigar"** em `AnomaliasDetectadasPanel` hoje só muda o status para `investigando` e mantém o usuário na lista. Vamos fazê-lo também navegar para a página completa.

### Mudança única

`src/components/admin/AnomaliasDetectadasPanel.tsx`:

- Importar `useNavigate` de `react-router-dom` (já importa `Link`).
- No handler do botão "Investigar" (anomalias com `status === 'nova'`), após chamar `atualizarStatus.mutate({ id, status: 'investigando' })`, fazer `navigate('/admin/insights-ia/anomalia/' + a.id)`.
- Sem mudança visual: rótulo, ícone (`Search`) e variante permanecem.

### Por que não criar nada novo

- A rota, a página, todos os cards XAI/histórico/ações e o hook de dados já existem e estão em produção (chamados pelo "Drill-down" do drawer e pela ação "Página completa").
- A intenção do usuário ao clicar "Investigar" é exatamente abrir a investigação completa — basta encaminhar para lá.

### Detalhes técnicos

- A mutation roda em paralelo à navegação; a página de destino lê pelo id e mostrará o status já como `investigando` após o realtime/refetch (o badge no `AnomaliaHeader` reflete isso).
- O drawer rápido (`AnomaliaDrillDownDrawer`) e o link "Drill-down" continuam como atalho leve para inspeção sem sair da lista.
- Nada no schema ou em edge functions muda.

### Fora de escopo

- Reescrever ou expandir os cards existentes (já cobrem histórico, XAI e ações).
- Adicionar deep-link com filtro de aba — a página é única por design.

