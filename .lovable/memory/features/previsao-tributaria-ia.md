---
name: Previsão Tributária IA
description: Edge prever-carga-tributaria usa Lovable AI Gateway (gemini-2.5-flash) com tool calling para gerar previsões 3 meses + cenários + ações
type: feature
---
Hook `usePrevisaoTributaria` chama edge `prever-carga-tributaria`, que:
- Valida JWT + RBAC (admin/financeiro/visualizador)
- Lê 12 meses de `vw_tributario_dashboard`
- Chama Lovable AI Gateway com tool calling estruturado (gerar_previsao_tributaria)
- Retorna previsão_base[3], cenário conservador/agressivo, 3 ações recomendadas, resumo executivo
- Trata 429 (rate limit) e 402 (créditos)
- Logger P2 estruturado

UI: `PrevisaoTributariaIA.tsx` (chart real vs previsto + ações com badge de impacto + botão Regenerar). React Query staleTime 30min.
