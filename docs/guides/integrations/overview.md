# 🔗 Guia de Integrações

## Bitrix24

### Setup
```bash
1. Obter webhook URL no Bitrix24
2. Configurar em Settings > Integrações
3. Mapear campos customizados
4. Testar sincronização
```

### Funcionalidades
- Sync bidirecional de clientes
- Sincronização de deals
- Webhooks em tempo real
- Histórico de sincronizações

### Campos Mapeados
- Nome → TITLE
- CPF/CNPJ → UF_CRM_XXX
- Email → EMAIL
- Telefone → PHONE

---

## SEFAZ (NFe)

### Configuração
```bash
1. Certificado digital A1
2. Ambiente: Produção ou Homologação
3. Séries de notas
4. Contingência ativada
```

### Emissão
- Validação automática
- Retry em caso de falha
- Contingência SVCAN/SVCRS
- Cancelamento até 24h

### Monitoramento
- Status em tempo real
- Fila de processamento
- Taxa de rejeição
- Tempo médio de resposta

---

## Open Finance

### Conexão
```bash
1. Autorizar no app do banco
2. Consentimento válido por 12 meses
3. Renovação automática
```

### Dados Disponíveis
- Saldo em tempo real
- Extrato últimos 12 meses
- Pagamentos agendados
- Limites de crédito

---

## WhatsApp Business

### Setup
```bash
1. Meta Business verificado
2. Número verificado
3. Templates aprovados
4. Webhook configurado
```

### Uso
- Cobrança automatizada
- Status de leitura
- Respostas rápidas
- Agendamento de mensagens

---

**Suporte:** Abrir ticket em cada integração
