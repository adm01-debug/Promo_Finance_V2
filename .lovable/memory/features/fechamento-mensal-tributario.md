---
name: Fechamento Mensal Tributário
description: Wizard de fechamento mensal com 6 validações automáticas + bloqueio + força admin
type: feature
---
Fluxo: AssistenteFechamentoMensal → executar-fechamento-tributario.
6 checks: apuração, conformidade ≥70, DARFs, conciliação bancária, regime cacheado, SPED.
Críticos (apuração + conformidade) bloqueiam fechamento. Admin pode forçar com justificativa obrigatória.
Tabela: fechamentos_tributarios (UNIQUE empresa_id+ano+mes). Status: aberto|em_revisao|fechado|reaberto.
Auditoria automática via trigger fn_audit_tributario (P9). Notificação opcional via Resend ao concluir.
