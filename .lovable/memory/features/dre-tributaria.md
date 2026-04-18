---
name: DRE Tributária
description: Demonstrativo de Resultado com decomposição CBS/IBS/IS + comparativo regime ótimo
type: feature
---
Edge: gerar-dre-tributaria. Hook: useDRETributaria (staleTime 30min).
Agrega: receita bruta (contas_receber) → deduções (apuracoes_tributarias) → receita líquida → custos (contas_pagar) → lucro bruto → IRPJ/CSLL → lucro líquido.
Compara contra regime_decision_cache (P7) para mostrar economia potencial.
UI: DRETributariaPanel com waterfall + export CSV.
