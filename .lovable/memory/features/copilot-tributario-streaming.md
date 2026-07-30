---
name: Copilot Tributário Streaming
description: Chat IA flutuante no DashboardTributario com streaming SSE, especialista em CBS/IBS/IS e Reforma Tributária
type: feature
---
Edge `copilot-tributario` (gemini-2.5-flash, SSE) + UI `CopilotTributarioFloat.tsx` (botão flutuante → Sheet lateral).
Histórico em sessionStorage, markdown sanitizado via escapeHtml + parser leve.
RBAC: admin/financeiro/visualizador. Trata 429/402.
