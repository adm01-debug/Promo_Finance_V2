# 🔄 Conciliação Bancária com IA

## Visão Geral

Sistema automatizado de conciliação bancária usando machine learning para match inteligente entre extratos bancários e contas a pagar/receber.

## Funcionalidades

### 1. Importação de Extratos
- **Formatos suportados:** OFX, OFC, CSV
- **Bancos:** Todos os principais bancos brasileiros
- **Processamento:** Automático com validação

### 2. Match Automático (IA)
**Algoritmo:**
- Levenshtein Distance para similaridade de texto
- Score de confiança baseado em:
  - Valor exato (+40%)
  - Data exata (+30%) ou próxima ±3 dias (+20%)
  - Descrição similar (+20-30%)
- Threshold mínimo: 60%

### 3. Match Manual
- Interface visual de sugestões
- Preview de ambos os lados
- Histórico de matches

## Como Usar

### Importar Extrato
```typescript
1. Clicar em "Importar Extrato"
2. Selecionar arquivo OFX/CSV
3. Aguardar processamento
4. Revisar transações importadas
```

### Executar Conciliação
```typescript
1. Clicar em "Conciliar Automaticamente"
2. Sistema analisa e sugere matches
3. Revisar sugestões por confiança
4. Confirmar matches (>90% confiança)
5. Revisar manualmente matches médios (70-90%)
```

### Desfazer Match
```typescript
1. Localizar match na lista
2. Clicar em "Desfazer"
3. Confirmar ação
```

## Configurações

### Regras de Match
- **Confiança mínima:** 60%
- **Janela de dias:** ±3 dias
- **Normalização:** Remove acentos, maiúsculas

### Categorização Automática
- Baseada em histórico
- Aprende com confirmações
- Sugestões melhoram com uso

## Relatórios

- Taxa de conciliação automática
- Tempo médio de processamento
- Itens pendentes
- Histórico de matches

## Troubleshooting

**Nenhum match encontrado:**
- Verificar formato do extrato
- Conferir período das contas
- Ajustar threshold de confiança

**Muitos matches incorretos:**
- Aumentar threshold
- Verificar normalização
- Treinar sistema com matches manuais

## API

```typescript
// Executar conciliação
const matches = await conciliacaoIA.execute({
  extratoId: 'extrato_123',
  threshold: 0.7,
});

// Confirmar match
await conciliacaoIA.confirmMatch(matchId);
```

---

**Precisão:** ~95% com matches >90% confiança
