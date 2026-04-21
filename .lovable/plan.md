

## Plano — Drill-down de Anomalia

Nova página `/admin/insights-ia/anomalia/:id` acessada por um botão "Investigar" em cada card de anomalia no painel atual.

### Estrutura da página

```text
/admin/insights-ia/anomalia/:id
├── Header: badge severidade + tipo + data + status + botões (Falso+, Confirmar, Investigar)
├── Card 1 · Resumo da anomalia (descrição + dados JSON formatado)
├── Card 2 · Entidade relacionada (drill na tabela origem)
│   └── Se entidade_tipo = movimentacao/conta_pagar/conta_receber/transacao_bancaria
│       → Busca o registro + mostra dados-chave + link "Abrir tela completa"
├── Card 3 · Histórico contextual (últimos 30 dias)
│   ├── Para movimentação: outras movs do mesmo fornecedor/conta
│   ├── Para conta_pagar/receber: histórico do fornecedor/cliente
│   └── Recharts LineChart de evolução de valor
├── Card 4 · Detectores que contribuíram (XAI)
│   ├── Lista os critérios estatísticos da função detectar-anomalias
│   ├── Para cada: nome do detector, regra (ex: "valor > 3σ"), valor observado vs esperado
│   └── Score de contribuição visual (barras)
├── Card 5 · Outras anomalias da mesma entidade (timeline)
└── Card 6 · Ações sugeridas
    ├── Contextuais por tipo (ex: pagamento_duplicado → "Ver pagamento original" + "Cancelar duplicata")
    ├── Adicionar observação/parecer
    └── Marcar como falso positivo / confirmar com observação
```

### Arquivos a criar

- `src/pages/admin/AnomaliaDetalhe.tsx` — orquestra os 6 cards
- `src/components/insights-ia/anomalia/AnomaliaHeader.tsx` — header com ações
- `src/components/insights-ia/anomalia/EntidadeRelacionadaCard.tsx` — fetch dinâmico por entidade_tipo
- `src/components/insights-ia/anomalia/HistoricoContextualCard.tsx` — série + tabela
- `src/components/insights-ia/anomalia/DetectoresContribuintesCard.tsx` — XAI dos 5 detectores
- `src/components/insights-ia/anomalia/AnomaliasRelacionadasCard.tsx` — timeline mesma entidade
- `src/components/insights-ia/anomalia/AcoesSugeridasCard.tsx` — playbook por tipo + observação
- `src/hooks/useAnomaliaDetalhe.ts` — busca anomalia + entidade + histórico + relacionadas em paralelo

### Mudanças em arquivos existentes

- `src/components/admin/AnomaliasDetectadasPanel.tsx`: adicionar botão **"Drill-down"** (ícone `Microscope`) em cada item, navegando para `/admin/insights-ia/anomalia/${a.id}`
- `src/App.tsx`: registrar nova rota lazy

### Detectores e ações sugeridas (mapa estático)

```text
movimentacao_outlier  → "Valor > 3σ vs média 30d"        → [Ver série, Adicionar à exclusão]
pagamento_duplicado   → "Mesmo fornec+valor+venc"        → [Ver originais, Cancelar duplicata]
conta_pagar_alta      → "Valor > 1.5×p95 da empresa"     → [Comparar histórico fornecedor]
conciliacao_atrasada  → "Não conciliada > 30d"           → [Abrir conciliação, Buscar match IA]
mudanca_regime_brusca → "Variação MoM > 30%"             → [Ver carga tributária, Recalcular]
```

### Detalhes técnicos

- Fetch único `useAnomaliaDetalhe` com `Promise.all` para anomalia + entidade origem + histórico + outras anomalias da mesma entidade
- Resolução dinâmica da entidade: switch sobre `entidade_tipo` → seleciona tabela (`movimentacoes`, `contas_pagar`, `contas_receber`, `transacoes_bancarias`)
- Atalho de volta para `/admin/insights-ia` via `BackButton`
- Loading skeleton por card; empty states quando entidade não encontrada
- Persistência de observação reutiliza a mutation `atualizarStatus` já existente em `useAnomaliasDetectadas`

### Fora de escopo

- Edição da anomalia além de status/observação
- Re-execução do detector específico (botão "Detectar agora" continua global no painel)
- Notificação por e-mail das ações tomadas

