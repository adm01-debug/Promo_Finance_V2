---
name: Auditoria Tributária
description: Trilha automática via triggers em 4 tabelas tributárias (apurações, regime cache, conformidade, agendados) com tab dedicada em /admin/system-health
type: feature
---
Tabela `auditoria_tributaria` + função `fn_audit_tributario` + 4 triggers AFTER INSERT/UPDATE/DELETE.
View `vw_auditoria_tributaria_recente` (top 1000 com nome usuário).
RLS: leitura admin-only. UI `AuditoriaTributariaTab` com filtros + export CSV (BOM UTF-8).
