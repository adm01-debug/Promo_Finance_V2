---
name: Centro de Privacidade LGPD
description: Página /configuracoes/privacidade permite titulares solicitarem acesso, portabilidade, exclusão, retificação ou anonimização dos seus dados (LGPD)
type: feature
---
Tabela `solicitacoes_lgpd` (RLS: usuário vê próprias, admin vê todas).
Edge `processar-solicitacao-lgpd`:
- acesso → JSON dump (profile + alertas + audit_logs + solicitações)
- portabilidade → CSV em `relatorios-tributarios/lgpd/` (signed URL 24h)
- exclusao/anonimizacao → profile anonimizado (nome + email hash)
- gera entrada em `auditoria_tributaria` (P9)
UI: `CentroPrivacidadeLGPD.tsx` em `src/pages/`. Hook `useSolicitacoesLGPD`.
