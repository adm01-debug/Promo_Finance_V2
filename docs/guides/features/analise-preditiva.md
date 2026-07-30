# 🔮 Análise Preditiva de Inadimplência

## Visão Geral

Sistema de machine learning que prevê a probabilidade de inadimplência de clientes baseado em histórico de pagamentos e características comportamentais.

## Como Funciona

### Modelo ML
- **Algoritmo:** Regressão Logística + Random Forest
- **Features:** 15 variáveis preditivas
- **Treinamento:** Atualizado mensalmente
- **Acurácia:** ~87%

### Variáveis Analisadas

**Histórico de Pagamentos:**
- Atrasos nos últimos 12 meses
- Maior atraso registrado
- Percentual de pagamentos pontuais
- Valores médios

**Comportamentais:**
- Frequência de compras
- Ticket médio
- Sazonalidade
- Canais de contato

**Cadastrais:**
- Tempo de relacionamento
- Score de crédito externo
- Setor de atuação

## Scores de Risco

```
🟢 BAIXO (0-30%):   Pagamento provável
🟡 MÉDIO (31-60%):  Atenção recomendada
🔴 ALTO (61-100%):  Risco elevado
```

## Ações Recomendadas

### Risco Baixo
- ✅ Crédito normal
- ✅ Prazos padrão
- ✅ Acompanhamento trimestral

### Risco Médio
- ⚠️ Limite reduzido
- ⚠️ Prazos menores
- ⚠️ Cobrança preventiva
- ⚠️ Monitoramento mensal

### Risco Alto
- 🚨 Venda à vista ou antecipada
- 🚨 Garantias adicionais
- 🚨 Cobrança proativa
- 🚨 Monitoramento semanal

## Dashboard

### Métricas
- Taxa de inadimplência prevista
- Exposição por nível de risco
- Precisão do modelo
- ROC curve

### Alertas
- Clientes com score crescente
- Transições de categoria
- Anomalias detectadas

## Configuração

```typescript
// Executar análise
const prediction = await inadimplenciaIA.predict({
  clienteId: 'cli_123',
  valorTransacao: 5000,
});

// Resultado
{
  score: 0.72,       // 72% probabilidade
  risco: 'ALTO',
  fatores: ['3 atrasos recentes', 'ticket acima da média'],
  acoes: ['Solicitar garantia', 'Reduzir prazo']
}
```

## Monitoramento

- **Precisão do modelo:** Avaliada mensalmente
- **Calibração:** Ajustada trimestralmente
- **Retreino:** Quando acurácia < 85%

## Limitações

- Requer mínimo 6 meses de histórico
- Não considera eventos macroeconômicos
- Performance varia por setor

---

**Última atualização modelo:** Janeiro/2025  
**Acurácia atual:** 87.3%
