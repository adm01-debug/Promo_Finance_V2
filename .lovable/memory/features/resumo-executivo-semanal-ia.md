---
name: Resumo Executivo Semanal IA
description: Edge gerar-resumo-executivo-semanal agrega KPIs 7d, gera markdown via Lovable AI (gpt-5-mini) e envia por Resend para destinatários cadastrados
type: feature
---
- Tabela `resumos_executivos_semanais` (`empresa_id, semana_inicio, semana_fim, resumo_md, kpis jsonb, destinatarios text[], enviado_em, erro_envio, modelo_ia`). UNIQUE por (empresa_id, semana_inicio).
- Edge `gerar-resumo-executivo-semanal`:
  - Agrega últimos 7 dias por empresa: receita_total, despesa_total, saldo, alertas_total/críticos, contas_pagar_vencidas, contas_receber_vencidas.
  - Chama `openai/gpt-5-mini` com prompt estruturado (5 seções: highlights, tributário, alertas, oportunidades, próximos passos).
  - Lê destinatários de `relatorios_tributarios_agendados` (ativos) e envia via Resend.
  - Persiste com upsert por (empresa_id, semana_inicio).
  - Aceita `{ empresa_id }` para gerar para uma única empresa (botão "Gerar agora").
- Hook `useResumosExecutivos` (lista + mutation gerarAgora).
- UI `ResumosExecutivosTab` em `/admin/system-health` (3ª aba).
- Tratamento 429/402 com erros explícitos.
