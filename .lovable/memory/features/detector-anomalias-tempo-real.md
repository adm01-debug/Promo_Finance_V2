---
name: Detector de Anomalias em Tempo Real
description: 5 detectores estatísticos (outlier, duplicado, p95, conciliação atrasada, variação regime) populando anomalias_detectadas para revisão admin
type: feature
---
Tabela `anomalias_detectadas` (admin-only, RLS hardened).
Edge `detectar-anomalias-financeiras` roda 5 detectores:
1. Movimentação > 3σ vs média 30d
2. Pagamento duplicado (fornecedor+valor+vencimento)
3. Conta a pagar > 1.5×p95 da empresa
4. Transação não conciliada > 30d
5. Variação carga regime > 30% MoM
Anti-duplicação: ignora se mesma entidade+tipo nas últimas 24h.
UI: `AnomaliasDetectadasPanel.tsx` (4ª tab em /admin/system-health). Hook `useAnomaliasDetectadas` com refetch 60s.
