---
name: Heatmap Tributário Anual
description: Edge gerar-heatmap-tributario + componente HeatmapTributarioAnual com matriz 12 meses × 8 tributos, gradiente HSL, picos sazonais e export PNG
type: feature
---
- Edge `gerar-heatmap-tributario`: agrega `apuracoes_tributarias` + `apuracoes_irpj_csll` em matriz [12 meses][8 tributos]; calcula intensidade vs máximo, MoM e identifica `mes_pico`/`mes_vale`.
- UI `HeatmapTributarioAnual.tsx` (em DashboardTributario lg:col-span-3): gradiente por tributo via tokens HSL (`--cbs`, `--ibs`, `--imposto-seletivo`, etc.), tooltip com valor + MoM, toggle absoluto/relativo, seletor de ano e export PNG via html2canvas.
- Hook `useHeatmapTributario` (React Query 10min).
